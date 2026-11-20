/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MonsterTarget, ResourceNode, ResourceType } from '../types/game';

export const DEFAULT_NEARBY_RESOURCE_RADIUS = 32;
export const WORLD_BOSS_AUDIO_MAX_DISTANCE = 160;
export const RESOURCE_NODE_AUDIO_MAX_DISTANCE = 36;
export const DEFAULT_RESOURCE_FULL_CUE_COOLDOWN_MS = 8_000;

export interface SpatialVector3 {
  x: number;
  y?: number;
  z: number;
}

export interface SpatialAudioParams {
  distance: number;
  pan: number; // -1 (full left) to +1 (full right)
  attenuation: number; // 0 to 1 distance gain multiplier
  relativeX: number; // + right, - left in listener frame
  relativeY: number; // + up, - down
  relativeZ: number; // + behind, - in front in listener frame
  sourceX: number;
  sourceY: number;
  sourceZ: number;
  listenerX: number;
  listenerY: number;
  listenerZ: number;
  listenerYawRad: number;
  forwardX: number;
  forwardZ: number;
  rightX: number;
  rightZ: number;
}

export interface WorldBossSnapshot {
  hp: bigint;
  alive: boolean;
}

export interface ResourceNodeCapacitySnapshot {
  remainingCapacity: bigint;
  totalCapacity: bigint;
}

export type SpatialAudioCueEvent =
  | {
      kind: 'world_boss_spawn';
      monsterId: string;
      monsterName: string;
      level: number;
      tier: MonsterTarget['tier'];
      spatial: SpatialAudioParams;
      triggeredAtMs: number;
    }
  | {
      kind: 'resource_node_full';
      nodeId: string;
      resourceType: ResourceType;
      level: number;
      totalCapacity: bigint;
      spatial: SpatialAudioParams;
      triggeredAtMs: number;
    };

export function isWorldBossEntity(monster: Pick<MonsterTarget, 'isWorldBoss' | 'tier'>): boolean {
  return Boolean(monster.isWorldBoss || monster.tier === 'world_titan');
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Computes 3D listener-relative coordinates, stereo pan (-1..+1), and
 * inverse-distance attenuation matching GameCanvas camera orbit convention:
 * camera offset = (sin(yaw), h, cos(yaw)), looking along forward = (-sin(yaw), 0, -cos(yaw)).
 */
export function computeSpatialAudioParams(params: {
  sourcePos: SpatialVector3;
  listenerPos: SpatialVector3;
  listenerYawRad?: number;
  refDistance?: number;
  maxDistance?: number;
  rolloffFactor?: number;
  minGain?: number;
}): SpatialAudioParams {
  const {
    sourcePos,
    listenerPos,
    listenerYawRad = 0,
    refDistance = 5,
    maxDistance = 60,
    rolloffFactor = 1.15,
    minGain = 0,
  } = params;

  const sourceX = sourcePos.x;
  const sourceY = sourcePos.y ?? 0;
  const sourceZ = sourcePos.z;
  const listenerX = listenerPos.x;
  const listenerY = listenerPos.y ?? 0;
  const listenerZ = listenerPos.z;

  const dx = sourceX - listenerX;
  const dy = sourceY - listenerY;
  const dz = sourceZ - listenerZ;
  const distance = Math.hypot(dx, dy, dz);
  const horizDist = Math.hypot(dx, dz);

  const forwardX = -Math.sin(listenerYawRad);
  const forwardZ = -Math.cos(listenerYawRad);
  const rightX = Math.cos(listenerYawRad);
  const rightZ = -Math.sin(listenerYawRad);

  const dotRight = dx * rightX + dz * rightZ;
  const dotForward = dx * forwardX + dz * forwardZ;

  // In Web Audio listener coordinates, +X is right, +Y is up, -Z is forward
  const relativeX = dotRight;
  const relativeY = dy;
  const relativeZ = -dotForward;

  const pan = horizDist < 1e-4 ? 0 : clamp(dotRight / horizDist, -1, 1);

  let attenuation = 1;
  if (distance > maxDistance) {
    attenuation = clamp(minGain, 0, 1);
  } else if (distance > refDistance) {
    const safeRef = Math.max(0.5, refDistance);
    const inverseGain = safeRef / (safeRef + rolloffFactor * (distance - safeRef));
    const edgeFade =
      maxDistance > safeRef
        ? clamp(1 - Math.pow((distance - safeRef) / (maxDistance - safeRef), 2), 0, 1)
        : 1;
    attenuation = clamp(Math.max(minGain, inverseGain * edgeFade), 0, 1);
  }

  return {
    distance,
    pan,
    attenuation,
    relativeX,
    relativeY,
    relativeZ,
    sourceX,
    sourceY,
    sourceZ,
    listenerX,
    listenerY,
    listenerZ,
    listenerYawRad,
    forwardX,
    forwardZ,
    rightX,
    rightZ,
  };
}

export function buildWorldBossStateMap(
  monsters: readonly MonsterTarget[]
): Map<string, WorldBossSnapshot> {
  const map = new Map<string, WorldBossSnapshot>();
  for (const m of monsters) {
    if (isWorldBossEntity(m)) {
      map.set(m.id, { hp: m.hp, alive: m.hp > 0n });
    }
  }
  return map;
}

export function detectWorldBossSpawnTransitions(params: {
  prevBossStates: ReadonlyMap<string, WorldBossSnapshot>;
  nextMonsters: readonly MonsterTarget[];
  listenerPos: SpatialVector3;
  listenerYawRad?: number;
}): {
  nextBossStates: Map<string, WorldBossSnapshot>;
  spawnedBosses: Array<{ monster: MonsterTarget; spatial: SpatialAudioParams }>;
} {
  const { prevBossStates, nextMonsters, listenerPos, listenerYawRad = 0 } = params;
  const nextBossStates = buildWorldBossStateMap(nextMonsters);
  const spawnedBosses: Array<{ monster: MonsterTarget; spatial: SpatialAudioParams }> = [];

  for (const monster of nextMonsters) {
    if (!isWorldBossEntity(monster) || monster.hp <= 0n) continue;
    const prev = prevBossStates.get(monster.id);
    const isNewlySpawned = !prev || !prev.alive;
    if (!isNewlySpawned) continue;

    const spatial = computeSpatialAudioParams({
      sourcePos: { x: monster.x, y: 2, z: monster.z },
      listenerPos,
      listenerYawRad,
      refDistance: 10,
      maxDistance: WORLD_BOSS_AUDIO_MAX_DISTANCE,
      rolloffFactor: 0.75,
      minGain: 0.25, // World boss spawn resonance remains audible anywhere on the map
    });
    spawnedBosses.push({ monster, spatial });
  }

  return { nextBossStates, spawnedBosses };
}

export function buildResourceNodeCapacityMap(
  nodes: readonly ResourceNode[]
): Map<string, ResourceNodeCapacitySnapshot> {
  const map = new Map<string, ResourceNodeCapacitySnapshot>();
  for (const node of nodes) {
    map.set(node.id, {
      remainingCapacity: node.remainingCapacity,
      totalCapacity: node.totalCapacity,
    });
  }
  return map;
}

export function detectNearbyResourceNodeFullTransitions(params: {
  prevNodeStates: ReadonlyMap<string, ResourceNodeCapacitySnapshot>;
  nextNodes: readonly ResourceNode[];
  listenerPos: SpatialVector3;
  listenerYawRad?: number;
  nearbyRadius?: number;
  nowMs?: number;
  lastCueAtByNodeId?: ReadonlyMap<string, number>;
  cooldownMs?: number;
}): {
  nextNodeStates: Map<string, ResourceNodeCapacitySnapshot>;
  triggeredNodes: Array<{ node: ResourceNode; spatial: SpatialAudioParams }>;
} {
  const {
    prevNodeStates,
    nextNodes,
    listenerPos,
    listenerYawRad = 0,
    nearbyRadius = DEFAULT_NEARBY_RESOURCE_RADIUS,
    nowMs = Date.now(),
    lastCueAtByNodeId,
    cooldownMs = DEFAULT_RESOURCE_FULL_CUE_COOLDOWN_MS,
  } = params;

  const nextNodeStates = buildResourceNodeCapacityMap(nextNodes);
  const triggeredNodes: Array<{ node: ResourceNode; spatial: SpatialAudioParams }> = [];

  for (const node of nextNodes) {
    if (node.totalCapacity <= 0n || node.remainingCapacity < node.totalCapacity) continue;

    const prev = prevNodeStates.get(node.id);
    const wasBelowFull = prev ? prev.remainingCapacity < prev.totalCapacity : false;
    if (!wasBelowFull) continue;

    const lastCueAt = lastCueAtByNodeId?.get(node.id) ?? -Infinity;
    if (nowMs - lastCueAt < cooldownMs) continue;

    const spatial = computeSpatialAudioParams({
      sourcePos: { x: node.x, y: 1, z: node.z },
      listenerPos,
      listenerYawRad,
      refDistance: 4,
      maxDistance: Math.max(nearbyRadius, RESOURCE_NODE_AUDIO_MAX_DISTANCE),
      rolloffFactor: 1.25,
      minGain: 0,
    });

    if (spatial.distance <= nearbyRadius) {
      triggeredNodes.push({ node, spatial });
    }
  }

  return { nextNodeStates, triggeredNodes };
}
