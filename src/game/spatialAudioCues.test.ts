/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { MonsterTarget, ResourceNode } from '../types/game';
import {
  buildResourceNodeCapacityMap,
  buildWorldBossStateMap,
  computeSpatialAudioParams,
  detectNearbyResourceNodeFullTransitions,
  detectWorldBossSpawnTransitions,
  isWorldBossEntity,
} from './spatialAudioCues';

function makeMonster(overrides: Partial<MonsterTarget> = {}): MonsterTarget {
  return {
    id: 'm_test',
    name: 'Test Monster',
    level: 10,
    tier: 'minion',
    hp: 1000n,
    maxHp: 1000n,
    attack: 100n,
    defense: 50n,
    x: 0,
    z: 0,
    expReward: 500n,
    dropResources: {},
    ...overrides,
  };
}

function makeNode(overrides: Partial<ResourceNode> = {}): ResourceNode {
  return {
    id: 'rn_test',
    type: 'diamond',
    level: 8,
    x: 10,
    z: 18,
    totalCapacity: 40_000n,
    remainingCapacity: 38_000n,
    gatherRatePerSec: 200n,
    assignedTroops: 0n,
    ...overrides,
  };
}

test('computeSpatialAudioParams calculates directional pan, yaw rotation, and distance attenuation', () => {
  // Listener at origin facing -Z (yaw = 0)
  const rightSource = computeSpatialAudioParams({
    sourcePos: { x: 20, y: 0, z: 0 },
    listenerPos: { x: 0, y: 0, z: 0 },
    listenerYawRad: 0,
    refDistance: 5,
    maxDistance: 40,
  });
  assert.ok(rightSource.pan > 0.99, `expected right pan near +1, got ${rightSource.pan}`);
  assert.equal(rightSource.distance, 20);
  assert.ok(rightSource.attenuation > 0 && rightSource.attenuation < 1);

  const leftSource = computeSpatialAudioParams({
    sourcePos: { x: -20, y: 0, z: 0 },
    listenerPos: { x: 0, y: 0, z: 0 },
    listenerYawRad: 0,
    refDistance: 5,
    maxDistance: 40,
  });
  assert.ok(leftSource.pan < -0.99, `expected left pan near -1, got ${leftSource.pan}`);

  // Rotate camera yaw +90 deg (looking toward -X, so -Z is to the right)
  const rotatedRight = computeSpatialAudioParams({
    sourcePos: { x: 0, y: 0, z: -15 },
    listenerPos: { x: 0, y: 0, z: 0 },
    listenerYawRad: Math.PI / 2,
    refDistance: 5,
    maxDistance: 40,
  });
  assert.ok(
    rotatedRight.pan > 0.99,
    `expected -Z to pan right (+1) when facing -X, got ${rotatedRight.pan}`
  );

  // Far beyond maxDistance attenuates to minGain
  const farNode = computeSpatialAudioParams({
    sourcePos: { x: 100, y: 0, z: 0 },
    listenerPos: { x: 0, y: 0, z: 0 },
    maxDistance: 36,
    minGain: 0,
  });
  assert.equal(farNode.attenuation, 0);

  const farBoss = computeSpatialAudioParams({
    sourcePos: { x: 250, y: 0, z: 0 },
    listenerPos: { x: 0, y: 0, z: 0 },
    maxDistance: 160,
    minGain: 0.25,
  });
  assert.equal(farBoss.attenuation, 0.25);
});

test('detectWorldBossSpawnTransitions fires only for newly spawned or respawned world bosses', () => {
  const minion = makeMonster({ id: 'm_goblin', tier: 'minion', isWorldBoss: false });
  const existingBoss = makeMonster({
    id: 'm_titan_1',
    name: 'Celestial Ender Titan',
    level: 1000,
    tier: 'world_titan',
    isWorldBoss: true,
    x: 0,
    z: -34,
    hp: 250_000_000n,
  });

  assert.equal(isWorldBossEntity(minion), false);
  assert.equal(isWorldBossEntity(existingBoss), true);

  const initialMap = buildWorldBossStateMap([minion, existingBoss]);

  // Same boss still alive + a new regular minion should NOT trigger
  const newMinion = makeMonster({ id: 'm_orc_2', tier: 'elite', x: 15, z: 10 });
  const pass1 = detectWorldBossSpawnTransitions({
    prevBossStates: initialMap,
    nextMonsters: [minion, existingBoss, newMinion],
    listenerPos: { x: 0, z: 18 },
  });
  assert.equal(pass1.spawnedBosses.length, 0);

  // Spawning a new World Titan to the east triggers a right-panned spatial cue
  const newTitan = makeMonster({
    id: 'm_titan_2',
    name: 'Void Leviathan Overlord',
    level: 950,
    tier: 'world_titan',
    isWorldBoss: true,
    x: 40,
    z: 18,
    hp: 180_000_000n,
  });
  const pass2 = detectWorldBossSpawnTransitions({
    prevBossStates: pass1.nextBossStates,
    nextMonsters: [minion, existingBoss, newMinion, newTitan],
    listenerPos: { x: 0, z: 18 },
  });
  assert.equal(pass2.spawnedBosses.length, 1);
  assert.equal(pass2.spawnedBosses[0].monster.id, 'm_titan_2');
  assert.ok(pass2.spawnedBosses[0].spatial.pan > 0.99);

  // Defeating existingBoss (hp -> 0n) then respawning it (hp -> 250M) triggers respawn cue
  const defeatedBoss = { ...existingBoss, hp: 0n };
  const pass3 = detectWorldBossSpawnTransitions({
    prevBossStates: pass2.nextBossStates,
    nextMonsters: [minion, defeatedBoss, newTitan],
    listenerPos: { x: 0, z: 18 },
  });
  assert.equal(pass3.spawnedBosses.length, 0);

  const respawnedBoss = { ...existingBoss, hp: 250_000_000n };
  const pass4 = detectWorldBossSpawnTransitions({
    prevBossStates: pass3.nextBossStates,
    nextMonsters: [minion, respawnedBoss, newTitan],
    listenerPos: { x: 0, z: 18 },
  });
  assert.equal(pass4.spawnedBosses.length, 1);
  assert.equal(pass4.spawnedBosses[0].monster.id, 'm_titan_1');
});

test('detectNearbyResourceNodeFullTransitions fires only for nearby nodes reaching full capacity with cooldown', () => {
  const nearbyFilling = makeNode({
    id: 'rn_near_diamond',
    type: 'diamond',
    x: 16,
    z: 18, // distance 16m <= 32m, to the right (+X)
    totalCapacity: 40_000n,
    remainingCapacity: 39_500n,
  });
  const farFilling = makeNode({
    id: 'rn_far_oil',
    type: 'oil',
    x: 60,
    z: -30, // distance > 75m > 32m
    totalCapacity: 100_000n,
    remainingCapacity: 99_000n,
  });
  const alreadyFull = makeNode({
    id: 'rn_already_full',
    type: 'wood',
    x: -8,
    z: 18,
    totalCapacity: 50_000n,
    remainingCapacity: 50_000n,
  });

  const initialMap = buildResourceNodeCapacityMap([nearbyFilling, farFilling, alreadyFull]);
  const lastCueAtByNodeId = new Map<string, number>();

  // Both filling nodes reach 100%, but only nearbyFilling should trigger
  const step1 = detectNearbyResourceNodeFullTransitions({
    prevNodeStates: initialMap,
    nextNodes: [
      { ...nearbyFilling, remainingCapacity: 40_000n },
      { ...farFilling, remainingCapacity: 100_000n },
      alreadyFull,
    ],
    listenerPos: { x: 0, z: 18 },
    nearbyRadius: 32,
    nowMs: 10_000,
    lastCueAtByNodeId,
    cooldownMs: 8_000,
  });

  assert.equal(step1.triggeredNodes.length, 1);
  assert.equal(step1.triggeredNodes[0].node.id, 'rn_near_diamond');
  assert.ok(step1.triggeredNodes[0].spatial.pan > 0.99);
  lastCueAtByNodeId.set('rn_near_diamond', 10_000);

  // Drain 100 and refill within cooldown (12_000 < 10_000 + 8_000) -> suppressed
  const step2a = detectNearbyResourceNodeFullTransitions({
    prevNodeStates: step1.nextNodeStates,
    nextNodes: [{ ...nearbyFilling, remainingCapacity: 39_900n }, farFilling, alreadyFull],
    listenerPos: { x: 0, z: 18 },
    nearbyRadius: 32,
    nowMs: 11_000,
    lastCueAtByNodeId,
    cooldownMs: 8_000,
  });
  const step2b = detectNearbyResourceNodeFullTransitions({
    prevNodeStates: step2a.nextNodeStates,
    nextNodes: [{ ...nearbyFilling, remainingCapacity: 40_000n }, farFilling, alreadyFull],
    listenerPos: { x: 0, z: 18 },
    nearbyRadius: 32,
    nowMs: 12_000,
    lastCueAtByNodeId,
    cooldownMs: 8_000,
  });
  assert.equal(step2b.triggeredNodes.length, 0);

  // Refill again after cooldown expires (20_000 >= 10_000 + 8_000) -> triggers again
  const step3a = detectNearbyResourceNodeFullTransitions({
    prevNodeStates: step2b.nextNodeStates,
    nextNodes: [{ ...nearbyFilling, remainingCapacity: 39_000n }, farFilling, alreadyFull],
    listenerPos: { x: 0, z: 18 },
    nearbyRadius: 32,
    nowMs: 19_000,
    lastCueAtByNodeId,
    cooldownMs: 8_000,
  });
  const step3b = detectNearbyResourceNodeFullTransitions({
    prevNodeStates: step3a.nextNodeStates,
    nextNodes: [{ ...nearbyFilling, remainingCapacity: 40_000n }, farFilling, alreadyFull],
    listenerPos: { x: 0, z: 18 },
    nearbyRadius: 32,
    nowMs: 20_000,
    lastCueAtByNodeId,
    cooldownMs: 8_000,
  });
  assert.equal(step3b.triggeredNodes.length, 1);
  assert.equal(step3b.triggeredNodes[0].node.id, 'rn_near_diamond');
});
