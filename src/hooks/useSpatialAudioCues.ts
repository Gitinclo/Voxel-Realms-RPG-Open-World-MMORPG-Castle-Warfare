/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { MonsterTarget, ResourceNode } from '../types/game';
import { sound } from '../game/audio';
import {
  buildResourceNodeCapacityMap,
  buildWorldBossStateMap,
  computeSpatialAudioParams,
  DEFAULT_NEARBY_RESOURCE_RADIUS,
  DEFAULT_RESOURCE_FULL_CUE_COOLDOWN_MS,
  detectNearbyResourceNodeFullTransitions,
  detectWorldBossSpawnTransitions,
  RESOURCE_NODE_AUDIO_MAX_DISTANCE,
  ResourceNodeCapacitySnapshot,
  SpatialAudioCueEvent,
  SpatialVector3,
  WORLD_BOSS_AUDIO_MAX_DISTANCE,
  WorldBossSnapshot,
} from '../game/spatialAudioCues';

export interface UseSpatialAudioCuesOptions {
  monsters: readonly MonsterTarget[];
  resourceNodes: readonly ResourceNode[];
  getListenerPosition: () => SpatialVector3;
  getListenerYawRad?: () => number;
  nearbyResourceRadius?: number;
  cooldownMs?: number;
  enabled?: boolean;
  onCueTriggered?: (event: SpatialAudioCueEvent) => void;
}

export interface UseSpatialAudioCuesResult {
  lastCue: SpatialAudioCueEvent | null;
  triggerWorldBossSpawnCue: (monster: MonsterTarget) => SpatialAudioCueEvent | null;
  triggerResourceNodeFullCue: (node: ResourceNode) => SpatialAudioCueEvent | null;
}

/**
 * React hook that monitors world boss spawns and nearby resource nodes reaching
 * full capacity, triggering 3D spatialized Web Audio API cues relative to the
 * player's live world position and camera heading.
 */
export function useSpatialAudioCues({
  monsters,
  resourceNodes,
  getListenerPosition,
  getListenerYawRad,
  nearbyResourceRadius = DEFAULT_NEARBY_RESOURCE_RADIUS,
  cooldownMs = DEFAULT_RESOURCE_FULL_CUE_COOLDOWN_MS,
  enabled = true,
  onCueTriggered,
}: UseSpatialAudioCuesOptions): UseSpatialAudioCuesResult {
  const [lastCue, setLastCue] = useState<SpatialAudioCueEvent | null>(null);

  const prevBossStatesRef = useRef<Map<string, WorldBossSnapshot> | null>(null);
  const prevNodeStatesRef = useRef<Map<string, ResourceNodeCapacitySnapshot> | null>(null);
  const lastCueAtByNodeIdRef = useRef<Map<string, number>>(new Map());

  const getListenerPosRef = useRef(getListenerPosition);
  const getListenerYawRef = useRef(getListenerYawRad);
  const onCueTriggeredRef = useRef(onCueTriggered);

  useEffect(() => {
    getListenerPosRef.current = getListenerPosition;
    getListenerYawRef.current = getListenerYawRad;
    onCueTriggeredRef.current = onCueTriggered;
  }, [getListenerPosition, getListenerYawRad, onCueTriggered]);

  const triggerWorldBossSpawnCue = useCallback(
    (monster: MonsterTarget): SpatialAudioCueEvent | null => {
      if (!enabled) return null;
      const spatial = computeSpatialAudioParams({
        sourcePos: { x: monster.x, y: 2, z: monster.z },
        listenerPos: getListenerPosRef.current(),
        listenerYawRad: getListenerYawRef.current ? getListenerYawRef.current() : 0,
        refDistance: 10,
        maxDistance: WORLD_BOSS_AUDIO_MAX_DISTANCE,
        rolloffFactor: 0.75,
        minGain: 0.25,
      });

      sound.playWorldBossSpawnSpatialCue(spatial);
      const event: SpatialAudioCueEvent = {
        kind: 'world_boss_spawn',
        monsterId: monster.id,
        monsterName: monster.name,
        level: monster.level,
        tier: monster.tier,
        spatial,
        triggeredAtMs: Date.now(),
      };
      setLastCue(event);
      onCueTriggeredRef.current?.(event);
      return event;
    },
    [enabled]
  );

  const triggerResourceNodeFullCue = useCallback(
    (node: ResourceNode): SpatialAudioCueEvent | null => {
      if (!enabled) return null;
      const spatial = computeSpatialAudioParams({
        sourcePos: { x: node.x, y: 1, z: node.z },
        listenerPos: getListenerPosRef.current(),
        listenerYawRad: getListenerYawRef.current ? getListenerYawRef.current() : 0,
        refDistance: 4,
        maxDistance: Math.max(nearbyResourceRadius, RESOURCE_NODE_AUDIO_MAX_DISTANCE),
        rolloffFactor: 1.25,
        minGain: 0,
      });

      if (spatial.distance > nearbyResourceRadius) {
        return null;
      }

      const nowMs = Date.now();
      lastCueAtByNodeIdRef.current.set(node.id, nowMs);
      sound.playResourceNodeFullSpatialCue(spatial, node.type);
      const event: SpatialAudioCueEvent = {
        kind: 'resource_node_full',
        nodeId: node.id,
        resourceType: node.type,
        level: node.level,
        totalCapacity: node.totalCapacity,
        spatial,
        triggeredAtMs: nowMs,
      };
      setLastCue(event);
      onCueTriggeredRef.current?.(event);
      return event;
    },
    [enabled, nearbyResourceRadius]
  );

  // 1. Detect World Boss spawns / respawns
  useEffect(() => {
    if (prevBossStatesRef.current === null) {
      prevBossStatesRef.current = buildWorldBossStateMap(monsters);
      return;
    }

    const { nextBossStates, spawnedBosses } = detectWorldBossSpawnTransitions({
      prevBossStates: prevBossStatesRef.current,
      nextMonsters: monsters,
      listenerPos: getListenerPosRef.current(),
      listenerYawRad: getListenerYawRef.current ? getListenerYawRef.current() : 0,
    });
    prevBossStatesRef.current = nextBossStates;

    if (!enabled || spawnedBosses.length === 0) return;

    const nowMs = Date.now();
    for (const { monster, spatial } of spawnedBosses) {
      sound.playWorldBossSpawnSpatialCue(spatial);
      const event: SpatialAudioCueEvent = {
        kind: 'world_boss_spawn',
        monsterId: monster.id,
        monsterName: monster.name,
        level: monster.level,
        tier: monster.tier,
        spatial,
        triggeredAtMs: nowMs,
      };
      setLastCue(event);
      onCueTriggeredRef.current?.(event);
    }
  }, [monsters, enabled]);

  // 2. Detect nearby resource nodes reaching full capacity
  useEffect(() => {
    if (prevNodeStatesRef.current === null) {
      prevNodeStatesRef.current = buildResourceNodeCapacityMap(resourceNodes);
      return;
    }

    const nowMs = Date.now();
    const { nextNodeStates, triggeredNodes } = detectNearbyResourceNodeFullTransitions({
      prevNodeStates: prevNodeStatesRef.current,
      nextNodes: resourceNodes,
      listenerPos: getListenerPosRef.current(),
      listenerYawRad: getListenerYawRef.current ? getListenerYawRef.current() : 0,
      nearbyRadius: nearbyResourceRadius,
      nowMs,
      lastCueAtByNodeId: lastCueAtByNodeIdRef.current,
      cooldownMs,
    });
    prevNodeStatesRef.current = nextNodeStates;

    if (!enabled || triggeredNodes.length === 0) return;

    for (const { node, spatial } of triggeredNodes) {
      lastCueAtByNodeIdRef.current.set(node.id, nowMs);
      sound.playResourceNodeFullSpatialCue(spatial, node.type);
      const event: SpatialAudioCueEvent = {
        kind: 'resource_node_full',
        nodeId: node.id,
        resourceType: node.type,
        level: node.level,
        totalCapacity: node.totalCapacity,
        spatial,
        triggeredAtMs: nowMs,
      };
      setLastCue(event);
      onCueTriggeredRef.current?.(event);
    }
  }, [resourceNodes, nearbyResourceRadius, cooldownMs, enabled]);

  return {
    lastCue,
    triggerWorldBossSpawnCue,
    triggerResourceNodeFullCue,
  };
}
