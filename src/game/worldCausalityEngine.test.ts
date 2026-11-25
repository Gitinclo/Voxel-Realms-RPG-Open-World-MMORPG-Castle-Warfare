/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_WORLD_CAUSALITY_RULES,
  buildCausalityRuleSnapshots,
  createInitialCausalityState,
  evaluateCausalityTick,
  evaluateCombinator,
  type CausalityContext,
} from './worldCausalityEngine';

const BASE_SAFE_CTX: CausalityContext = {
  hpRatio: 1,
  playerLevel: 1,
  totalKills: 0,
  killStreak: 0,
  domainLevel: 1,
  domainCooldownSeconds: 0,
  nearestBossDistance: 120,
  nearestBossHpRatio: 1,
  aliveEnemies: 4,
  isNight: false,
  inSafeZone: true,
};

test('evaluateCombinator handles SINGLE, AND, OR, and NOT accurately', () => {
  assert.equal(evaluateCombinator('SINGLE', [(c) => c.hpRatio === 1], BASE_SAFE_CTX), true);
  assert.equal(
    evaluateCombinator('AND', [(c) => c.hpRatio === 1, (c) => c.isNight], BASE_SAFE_CTX),
    false
  );
  assert.equal(
    evaluateCombinator('OR', [(c) => c.isNight, (c) => c.inSafeZone], BASE_SAFE_CTX),
    true
  );
  assert.equal(evaluateCombinator('NOT', [(c) => c.isNight], BASE_SAFE_CTX), true);
});

test('priority ordering fires highest-priority rules first and respects cooldowns', () => {
  const initial = createInitialCausalityState();
  const crisisCtx: CausalityContext = {
    ...BASE_SAFE_CTX,
    hpRatio: 0.12,
    nearestBossDistance: 10,
    killStreak: 6,
    inSafeZone: false,
  };

  const r1 = evaluateCausalityTick({
    state: initial,
    context: crisisCtx,
    dtSeconds: 1,
    nowMs: 1000,
    maxTriggeredPerTick: 2,
  });

  assert.equal(r1.triggered.length, 2);
  assert.equal(r1.triggered[0].ruleId, 'rule_low_hp_danger');
  assert.equal(r1.triggered[1].ruleId, 'rule_boss_proximity');

  // Immediate re-tick should NOT refire cooled-down rules
  const r2 = evaluateCausalityTick({
    state: r1.nextState,
    context: crisisCtx,
    dtSeconds: 1,
    nowMs: 2000,
    maxTriggeredPerTick: 2,
  });
  assert.ok(r2.triggered.every((e) => e.ruleId !== 'rule_low_hp_danger'));

  // After 5+ seconds, low-HP rule becomes eligible again
  const r3 = evaluateCausalityTick({
    state: r2.nextState,
    context: crisisCtx,
    dtSeconds: 5,
    nowMs: 7000,
    maxTriggeredPerTick: 1,
  });
  assert.equal(r3.triggered[0]?.ruleId, 'rule_low_hp_danger');
});

test('maxFires=1 milestone rules (Relic Airdrop, Awakening, Domain Evolution) fire once only', () => {
  let state = createInitialCausalityState();
  const milestoneCtx: CausalityContext = {
    ...BASE_SAFE_CTX,
    playerLevel: 12,
    totalKills: 55,
    domainLevel: 60,
    inSafeZone: true,
  };

  const first = evaluateCausalityTick({
    state,
    context: milestoneCtx,
    dtSeconds: 1,
    nowMs: 1000,
    maxTriggeredPerTick: 5,
  });

  const ids = first.triggered.map((e) => e.ruleId);
  assert.ok(ids.includes('rule_super_skill_unlock'));
  assert.ok(ids.includes('rule_domain_evolution'));
  assert.ok(ids.includes('rule_relic_milestone_airdrop'));

  state = first.nextState;
  const second = evaluateCausalityTick({
    state,
    context: milestoneCtx,
    dtSeconds: 60,
    nowMs: 61000,
    maxTriggeredPerTick: 5,
  });
  assert.equal(second.triggered.length, 0);

  const snapshots = buildCausalityRuleSnapshots(second.nextState);
  assert.equal(snapshots.length, DEFAULT_WORLD_CAUSALITY_RULES.length);
  const relicSnap = snapshots.find((s) => s.id === 'rule_relic_milestone_airdrop');
  assert.equal(relicSnap?.exhausted, true);
  assert.equal(relicSnap?.ready, false);
});

test('NOT rule_domain_ready_reminder fires outside safe zone when domain is ready and enemies live', () => {
  const state = createInitialCausalityState();
  const hostileCtx: CausalityContext = {
    ...BASE_SAFE_CTX,
    inSafeZone: false,
    aliveEnemies: 3,
    domainCooldownSeconds: 0,
  };
  const res = evaluateCausalityTick({
    state,
    context: hostileCtx,
    dtSeconds: 0.5,
    nowMs: 500,
  });
  assert.ok(res.triggered.some((e) => e.ruleId === 'rule_domain_ready_reminder'));
});
