/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTION_CLASSES,
  EMPTY_STATUS_EFFECTS,
  StatusEffectFlag,
  addDomainExperience,
  applyPlayerDamageWithRevive,
  applyStatusEffect,
  computeCombatHit,
  computeNonDestructiveWaveTopUp,
  createInitialActionCombatState,
  detectWorldZone,
  getDomainSpec,
  getKillStreakTier,
  listActiveStatusLabels,
  purchaseFieldProvision,
  recordMonsterDefeat,
  stepEnemyActionFsm,
  stepStaminaAndTimers,
  switchActionClass,
  tickStatusEffects,
  triggerDash,
} from './actionCombat';

test('4 combat classes switch cleanly and preserve relative HP ratio', () => {
  const start = createInitialActionCombatState('knight');
  assert.equal(start.maxHp, ACTION_CLASSES.knight.maxHp);
  const halfHp = { ...start, hp: Math.round(start.maxHp * 0.5) };
  const switched = switchActionClass(halfHp, 'mage');
  assert.equal(switched.classId, 'mage');
  assert.equal(switched.maxHp, ACTION_CLASSES.mage.maxHp);
  assert.ok(Math.abs(switched.hp - Math.round(ACTION_CLASSES.mage.maxHp * 0.5)) <= 1);
});

test('status effect bitmask applies Burn/Freeze/Poison/Stun and decays cleanly', () => {
  let maskState = applyStatusEffect(EMPTY_STATUS_EFFECTS, StatusEffectFlag.BURN, 2.0);
  maskState = applyStatusEffect(maskState, StatusEffectFlag.FREEZE, 3.0);
  assert.deepEqual(listActiveStatusLabels(maskState), ['BURN', 'FREEZE']);

  const tick1 = tickStatusEffects(maskState, 1.0);
  assert.equal(tick1.dotDamage, 10);
  assert.equal(tick1.speedMultiplier, 0.35);
  assert.equal(tick1.isStunned, false);

  const stunned = applyStatusEffect(tick1.next, StatusEffectFlag.STUN, 1.5);
  const tick2 = tickStatusEffects(stunned, 1.0);
  assert.equal(tick2.isStunned, true);
  assert.equal(tick2.speedMultiplier, 0);

  const expired = tickStatusEffects(tick2.next, 5.0);
  assert.equal(expired.next.mask, StatusEffectFlag.NONE);
  assert.deepEqual(listActiveStatusLabels(expired.next), []);
});

test('stamina drains during sprint, regenerates at rest, and Dash costs 20 stamina + grants i-frames', () => {
  const s0 = createInitialActionCombatState('rogue');
  const sprinting = stepStaminaAndTimers(s0, 1.0, true, false);
  assert.equal(sprinting.stamina, 78);

  const dashRes = triggerDash(sprinting);
  assert.equal(dashRes.triggered, true);
  assert.equal(dashRes.nextState.stamina, 58);
  assert.ok(dashRes.nextState.dashInvulnSec > 0);

  // Damage while dashing is fully dodged
  const dodgeCheck = applyPlayerDamageWithRevive(dashRes.nextState, 999);
  assert.equal(dodgeCheck.damageTaken, 0);
  assert.equal(dodgeCheck.revived, false);
});

test('Revive Token auto-saves commander at 50% HP on lethal damage', () => {
  const s0 = createInitialActionCombatState('mage');
  assert.equal(s0.reviveTokens, 1);
  const lethal = applyPlayerDamageWithRevive(s0, 9999);
  assert.equal(lethal.revived, true);
  assert.equal(lethal.defeated, false);
  assert.equal(lethal.nextState.reviveTokens, 0);
  assert.equal(lethal.nextState.hp, Math.round(s0.maxHp * 0.5));
  assert.equal(lethal.nextState.dashInvulnSec, 2.0);
});

test('combo window, 4x crits, and kill-streak tiers scale combat rewards', () => {
  const s0 = createInitialActionCombatState('rogue');
  const critHit = computeCombatHit(s0, 1.0, 0.01);
  const normHit = computeCombatHit(s0, 1.0, 0.99);
  assert.equal(critHit.isCrit, true);
  assert.equal(normHit.isCrit, false);
  assert.equal(critHit.damage, normHit.damage * 4);
  assert.equal(critHit.nextState.comboCount, 1);

  assert.equal(getKillStreakTier(2).label, 'DOUBLE KILL!');
  assert.equal(getKillStreakTier(5).label, 'PENTA KILL!');
  assert.equal(getKillStreakTier(10).label, 'GODLIKE!');

  let cur = s0;
  for (let i = 0; i < 5; i++) {
    cur = recordMonsterDefeat(cur, 100, 60).nextState;
  }
  assert.equal(cur.killStreak, 5);
  assert.equal(cur.lastStreakCallout, 'PENTA KILL!');
  assert.ok(cur.gold > s0.gold + 500);
});

test('Ascendant Domain scales radius to 80m cap, cooldown floor to 15s, and unlocks milestones up to Lv.999', () => {
  const lv1 = getDomainSpec(1);
  assert.equal(lv1.radiusMeters, 12);
  assert.equal(lv1.cooldownSeconds, 35);
  assert.equal(lv1.appliesFreeze, false);
  assert.equal(lv1.executesLowHp, false);

  const lv50 = getDomainSpec(50);
  assert.equal(lv50.appliesFreeze, true);
  assert.equal(lv50.executesLowHp, true);
  assert.ok(lv50.unlockedMilestones.some((m) => m.name === 'Defense Breaker'));

  const lv999 = getDomainSpec(999);
  assert.equal(lv999.radiusMeters, 80);
  assert.equal(lv999.cooldownSeconds, 15);
  assert.equal(lv999.unlockedMilestones.length, 7);

  const gained = addDomainExperience(1, 0, 500);
  assert.ok(gained.level > 1);
  assert.equal(gained.leveledUp, true);
});

test('radial biome zones classify distances cleanly and 5-state Enemy FSM supports Shade kiting & flee', () => {
  assert.equal(detectWorldZone(0, 0).id, 'solara_citadel');
  assert.equal(detectWorldZone(50, 0).id, 'whisper_forest');
  assert.equal(detectWorldZone(100, 0).id, 'obsidian_desert');
  assert.equal(detectWorldZone(170, 0).id, 'frost_mountains');
  assert.equal(detectWorldZone(250, 0).id, 'shadow_wastes');

  // Shade kites away when player is close (<6.5m)
  const shadeKite = stepEnemyActionFsm({
    archetype: 'shade',
    x: 4,
    z: 0,
    homeX: 10,
    homeZ: 0,
    hpRatio: 0.9,
    playerX: 0,
    playerZ: 0,
    statusMask: StatusEffectFlag.NONE,
    dtSec: 0.2,
  });
  assert.equal(shadeKite.state, 'attack');
  assert.equal(shadeKite.attackedPlayer, true);
  assert.ok(shadeKite.nextX > 4);

  // Shade flees at <=30% HP; Boss never flees
  const shadeFlee = stepEnemyActionFsm({
    archetype: 'shade',
    x: 10,
    z: 0,
    homeX: 10,
    homeZ: 0,
    hpRatio: 0.25,
    playerX: 0,
    playerZ: 0,
    statusMask: StatusEffectFlag.NONE,
    dtSec: 0.2,
  });
  assert.equal(shadeFlee.state, 'flee');

  const bossLowHp = stepEnemyActionFsm({
    archetype: 'boss',
    x: 10,
    z: 0,
    homeX: 10,
    homeZ: 0,
    hpRatio: 0.05,
    playerX: 0,
    playerZ: 0,
    statusMask: StatusEffectFlag.NONE,
    dtSec: 0.2,
  });
  assert.equal(bossLowHp.state, 'chase');
});

test('non-destructive wave top-up preserves living monsters and Gold provisions shop deducts currency cleanly', () => {
  const existing = computeNonDestructiveWaveTopUp({
    existingMonsters: [],
    minWaveCount: 3,
    playerX: 40,
    playerZ: 0,
    playerLevel: 5,
    waveSeed: 1,
  });
  assert.equal(existing.length, 3);
  assert.ok(existing.some((m) => m.name.includes('Shade')));

  const toppedUp = computeNonDestructiveWaveTopUp({
    existingMonsters: existing.slice(0, 1),
    minWaveCount: 3,
    playerX: 40,
    playerZ: 0,
    playerLevel: 5,
    waveSeed: 2,
  });
  assert.equal(toppedUp.length, 3);
  assert.equal(toppedUp[0].id, existing[0].id);

  const s0 = createInitialActionCombatState('knight');
  const buy = purchaseFieldProvision(s0, 'revive_token');
  assert.equal(buy.ok, true);
  assert.equal(buy.nextState.reviveTokens, 2);
  assert.equal(buy.nextState.gold, s0.gold - 450);

  const broke = purchaseFieldProvision({ ...s0, gold: 10 }, 'revive_token');
  assert.equal(broke.ok, false);
});
