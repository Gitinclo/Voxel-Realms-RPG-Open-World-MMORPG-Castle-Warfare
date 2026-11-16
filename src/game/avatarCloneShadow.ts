/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Voxel Realms RPG — Open-World MMORPG Avatar, Clone & Shadow Engine
 *
 * Implements the three distinct player representation & duplication mechanics:
 *   1. Avatar (Primary Digital Body & Permanent Progression Vessel)
 *   2. Clone (Tactical Illusions, AI Combat Summons, and Cosmetic Clone Avatars)
 *   3. Shadow (Action Mimics / Teleport Markers, Deterministic Time Echoes, and Dark Doppelgänger Bosses)
 *
 * Also enforces Open-World MMORPG engineering guardrails:
 *   - Server Performance & Lag Control: Hard cap of 3 Clones + 2 Shadows per Avatar, plus
 *     relative int16 delta-packet compression (8 bytes per duplicate vs. 36 bytes full transform)
 *     so a 50-player city/raid summoning 3 clones each (200 total entities) stays well inside
 *     the 20Hz (50ms) WebSocket tick budget.
 *   - Visual Clutter Prevention: Distinct shader silhouettes (Full PBR Opacity 1.0 for Avatars,
 *     Translucent Cyan #38bdf8 Opacity 0.58 for Clones, Smoky Violet #7c3aed Opacity 0.45 for Shadows).
 *   - PvP & Raid Balance: Separate PvE and PvP damage/HP multipliers so temporary duplicates
 *     cannot overwhelm solo PvP opponents or trivialize raid boss mechanics.
 */

export type RepresentationArchetypeId = 'clone' | 'shadow' | 'avatar';

export interface RepresentationComparisonRow {
  feature: 'Core Purpose' | 'Control' | 'Physicality' | 'Lifespan';
  clone: string;
  shadow: string;
  avatar: string;
}

export const AVATAR_CLONE_SHADOW_COMPARISON_MATRIX: readonly RepresentationComparisonRow[] = [
  {
    feature: 'Core Purpose',
    clone: 'Duplicate a character to fight or deceive.',
    shadow: 'Mimic actions or act as a dark/stealth entity.',
    avatar: "Serve as the player's primary digital body.",
  },
  {
    feature: 'Control',
    clone: 'Usually AI-controlled or follows simple commands.',
    shadow: 'Mirrors player inputs, delays actions, or uses stealth.',
    avatar: 'Directly controlled by the player.',
  },
  {
    feature: 'Physicality',
    clone: 'Can be solid (deals damage) or an illusion (decoy).',
    shadow: "Often intangible, dark, or linked to the player's past moves.",
    avatar: 'Fully physical and interacts with the entire world.',
  },
  {
    feature: 'Lifespan',
    clone: 'Temporary; vanishes after a timer or taking hits.',
    shadow: 'Temporary (abilities) or permanent (boss/AI echoes).',
    avatar: 'Permanent throughout the game session.',
  },
] as const;

export type CloneSubtypeId = 'tactical_illusion' | 'combat_summon' | 'cosmetic_clone_avatar';

export interface CloneSubtypeSpec {
  id: CloneSubtypeId;
  name: string;
  classification:
    'Tactical Clone (Illusion)' | 'Combat Clone (Summon)' | 'Cosmetic Clone (Clone Avatar)';
  controlMode: 'Simple Decoy AI' | 'Autonomous Combat AI' | 'Equipped Transmog Slot';
  physicality: 'Illusion (0% Damage Decoy)' | 'Solid (Reduced HP & Damage)' | 'Equipment Layer';
  pveDamageRatio: number; // Relative to Avatar base attack (0.0 - 1.0)
  pvpDamageRatio: number; // Reduced in PvP zones to prevent overwhelming solo opponents
  maxHpRatio: number; // Fraction of Avatar Max HP
  durationSec: number; // 0 = permanent while equipped
  maxHitsBeforeShatter: number | null;
  aggroThreatMultiplier: number;
  statBonuses?: {
    cultivationSpeedBonusPct: number;
    troopAttackBonusPct: number;
    allAttributesBonus: number;
  };
  silhouetteHex: string;
  silhouetteOpacity: number;
  description: string;
}

export const CLONE_SUBTYPE_CATALOG: readonly CloneSubtypeSpec[] = [
  {
    id: 'tactical_illusion',
    name: 'Mirage Decoy Clone',
    classification: 'Tactical Clone (Illusion)',
    controlMode: 'Simple Decoy AI',
    physicality: 'Illusion (0% Damage Decoy)',
    pveDamageRatio: 0,
    pvpDamageRatio: 0,
    maxHpRatio: 0.15,
    durationSec: 12,
    maxHitsBeforeShatter: 2,
    aggroThreatMultiplier: 3.5,
    silhouetteHex: '#38bdf8',
    silhouetteOpacity: 0.52,
    description:
      'Projects a holo-cyan voxel decoy that sprints forward, draws monster/world-boss aggro, and confuses opponents in PvP zones without dealing real damage.',
  },
  {
    id: 'combat_summon',
    name: 'Primordial Spirit Combat Clone',
    classification: 'Combat Clone (Summon)',
    controlMode: 'Autonomous Combat AI',
    physicality: 'Solid (Reduced HP & Damage)',
    pveDamageRatio: 0.35,
    pvpDamageRatio: 0.2,
    maxHpRatio: 0.4,
    durationSec: 25,
    maxHitsBeforeShatter: null,
    aggroThreatMultiplier: 1.25,
    silhouetteHex: '#0ea5e9',
    silhouetteOpacity: 0.62,
    description:
      'Manifests a solid AI-controlled ally via the Myriad Primordial Spirit Splitting Art that fights alongside your Avatar at 35% PvE / 20% PvP damage and 40% HP.',
  },
  {
    id: 'cosmetic_clone_avatar',
    name: 'Sovereign Clone Avatar Regalia',
    classification: 'Cosmetic Clone (Clone Avatar)',
    controlMode: 'Equipped Transmog Slot',
    physicality: 'Equipment Layer',
    pveDamageRatio: 0,
    pvpDamageRatio: 0,
    maxHpRatio: 0,
    durationSec: 0,
    maxHitsBeforeShatter: null,
    aggroThreatMultiplier: 1.0,
    statBonuses: {
      cultivationSpeedBonusPct: 12,
      troopAttackBonusPct: 8,
      allAttributesBonus: 15,
    },
    silhouetteHex: '#fbbf24',
    silhouetteOpacity: 1.0,
    description:
      'MMORPG Clone Avatar gear piece that grants +12% Cultivation Speed, +8% Troop Attack, and +15 All Attributes while copying the visual appearance of any unlocked Hero Skin.',
  },
] as const;

export type ShadowSubtypeId =
  'shadow_action_mimic' | 'shadow_time_echo' | 'shadow_doppelganger_boss';

export interface ShadowSubtypeSpec {
  id: ShadowSubtypeId;
  name: string;
  classification:
    'Action Mimic & Teleport Marker' | 'Time Echo / Ghost' | 'Stealth & Dark Variant (Boss)';
  controlMode:
    'Simultaneous Input Mirror' | 'Delayed Ring-Buffer Replay (3.0s)' | 'Dark Doppelgänger Boss AI';
  physicality: 'Intangible Umbral Projection' | 'Temporal Ghost' | 'Dark Physical Boss Vessel';
  pveDamageRatio: number;
  pvpDamageRatio: number;
  durationSec: number; // -1 for trial boss until defeated
  supportsTeleportSwap: boolean;
  echoDelaySeconds: number;
  silhouetteHex: string;
  silhouetteOpacity: number;
  description: string;
}

export const SHADOW_SUBTYPE_CATALOG: readonly ShadowSubtypeSpec[] = [
  {
    id: 'shadow_action_mimic',
    name: 'Umbral Action Mimic',
    classification: 'Action Mimic & Teleport Marker',
    controlMode: 'Simultaneous Input Mirror',
    physicality: 'Intangible Umbral Projection',
    pveDamageRatio: 0.5,
    pvpDamageRatio: 0.3,
    durationSec: 15,
    supportsTeleportSwap: true,
    echoDelaySeconds: 0,
    silhouetteHex: '#7c3aed',
    silhouetteOpacity: 0.48,
    description:
      'Spawns a smoky violet shadow at a target voxel coordinate that mirrors your exact attack inputs simultaneously and serves as an anchor for instant Shadow Swap teleportation.',
  },
  {
    id: 'shadow_time_echo',
    name: 'Chrono-Ruin Shadow Echo',
    classification: 'Time Echo / Ghost',
    controlMode: 'Delayed Ring-Buffer Replay (3.0s)',
    physicality: 'Temporal Ghost',
    pveDamageRatio: 0.25,
    pvpDamageRatio: 0.15,
    durationSec: 18,
    supportsTeleportSwap: true,
    echoDelaySeconds: 3.0,
    silhouetteHex: '#6366f1',
    silhouetteOpacity: 0.42,
    description:
      'Replays your Avatar’s exact past movements and strikes from 3.0 seconds earlier (60 deterministic ticks) to dual-activate open-world ruin pressure plates and combo maneuvers.',
  },
  {
    id: 'shadow_doppelganger_boss',
    name: 'Heart-Demon Shadow Doppelgänger',
    classification: 'Stealth & Dark Variant (Boss)',
    controlMode: 'Dark Doppelgänger Boss AI',
    physicality: 'Dark Physical Boss Vessel',
    pveDamageRatio: 1.0,
    pvpDamageRatio: 0,
    durationSec: -1,
    supportsTeleportSwap: false,
    echoDelaySeconds: 0,
    silhouetteHex: '#dc2626',
    silhouetteOpacity: 0.85,
    description:
      'An AI-controlled Dark Shadow Boss spawned during Tribulation & Solo Ruin Trials that mirrors 100% of your Avatar’s species, Four-Path stats, and combat moveset.',
  },
] as const;

export const MMORPG_DUPLICATION_LIMITS = {
  MAX_ACTIVE_CLONES_PER_AVATAR: 3,
  MAX_ACTIVE_SHADOWS_PER_AVATAR: 2,
  RAID_MAX_PLAYERS: 50,
  SERVER_TICK_HZ: 20,
  SERVER_TICK_BUDGET_MS: 50,
  FULL_AVATAR_PACKET_BYTES: 36,
  COMPACT_DUPLICATE_DELTA_BYTES: 8, // Relative int16 dx, dy, dz + 2-byte state/anim bitmask
  ECHO_RING_BUFFER_TICKS: 60, // 3.0 seconds at 20Hz
} as const;

export interface Vector3Coord {
  x: number;
  y: number;
  z: number;
}

export interface SpawnedCloneEntity {
  instanceId: string;
  ownerAvatarId: string;
  subtypeId: Exclude<CloneSubtypeId, 'cosmetic_clone_avatar'>;
  position: Vector3Coord;
  currentHp: number;
  maxHp: number;
  remainingSec: number;
  hitsRemaining: number | null;
  pveDamagePerHit: number;
  pvpDamagePerHit: number;
  silhouetteHex: string;
  silhouetteOpacity: number;
}

export interface SpawnedShadowEntity {
  instanceId: string;
  ownerAvatarId: string;
  subtypeId: ShadowSubtypeId;
  position: Vector3Coord;
  remainingSec: number;
  supportsTeleportSwap: boolean;
  pveDamagePerHit: number;
  pvpDamagePerHit: number;
  silhouetteHex: string;
  silhouetteOpacity: number;
}

export interface AvatarIdentityVessel {
  avatarId: string;
  commanderName: string;
  speciesName: string;
  guildTag: string;
  level: number;
  baseMaxHp: number;
  baseAttack: number;
  position: Vector3Coord;
  baseSkinId: string;
  cosmeticCloneTargetSkinId: string | null;
}

export interface RaidDuplicationTelemetry {
  playerCount: number;
  clonesPerPlayer: number;
  shadowsPerPlayer: number;
  totalAvatars: number;
  totalClones: number;
  totalShadows: number;
  totalTrackedEntities: number;
  uncompressedBytesPerTick: number;
  compressedBytesPerTick: number;
  bandwidthReductionPct: number;
  estimatedServerTickCpuMs: number;
  withinTickBudget: boolean;
}

export function getCloneSubtypeSpec(id: CloneSubtypeId): CloneSubtypeSpec {
  const found = CLONE_SUBTYPE_CATALOG.find((c) => c.id === id);
  if (!found) {
    throw new Error(`Unknown CloneSubtypeId: ${id}`);
  }
  return found;
}

export function getShadowSubtypeSpec(id: ShadowSubtypeId): ShadowSubtypeSpec {
  const found = SHADOW_SUBTYPE_CATALOG.find((s) => s.id === id);
  if (!found) {
    throw new Error(`Unknown ShadowSubtypeId: ${id}`);
  }
  return found;
}

/**
 * Spawns a temporary Tactical or Combat Clone while enforcing the per-Avatar MMORPG limit (<= 3)
 * and computing balanced PvE / PvP damage and HP fractions.
 */
export function spawnAvatarClone(
  avatar: AvatarIdentityVessel,
  existingClones: readonly SpawnedCloneEntity[],
  subtypeId: Exclude<CloneSubtypeId, 'cosmetic_clone_avatar'>,
  offset: Vector3Coord = { x: 2.5, y: 0, z: 1.5 }
): {
  nextClones: SpawnedCloneEntity[];
  spawned: SpawnedCloneEntity;
  evictedOldest: boolean;
} {
  const spec = getCloneSubtypeSpec(subtypeId);
  const maxHp = Math.max(1, Math.round(avatar.baseMaxHp * spec.maxHpRatio));
  const pveDamagePerHit = Math.round(avatar.baseAttack * spec.pveDamageRatio);
  const pvpDamagePerHit = Math.round(avatar.baseAttack * spec.pvpDamageRatio);

  const spawned: SpawnedCloneEntity = {
    instanceId: `clone_${subtypeId}_${existingClones.length + 1}_${Math.round(avatar.position.x * 10)}`,
    ownerAvatarId: avatar.avatarId,
    subtypeId,
    position: {
      x: Number((avatar.position.x + offset.x).toFixed(2)),
      y: Number((avatar.position.y + offset.y).toFixed(2)),
      z: Number((avatar.position.z + offset.z).toFixed(2)),
    },
    currentHp: maxHp,
    maxHp,
    remainingSec: spec.durationSec,
    hitsRemaining: spec.maxHitsBeforeShatter,
    pveDamagePerHit,
    pvpDamagePerHit,
    silhouetteHex: spec.silhouetteHex,
    silhouetteOpacity: spec.silhouetteOpacity,
  };

  const cap = MMORPG_DUPLICATION_LIMITS.MAX_ACTIVE_CLONES_PER_AVATAR;
  const evictedOldest = existingClones.length >= cap;
  const kept = evictedOldest
    ? existingClones.slice(existingClones.length - (cap - 1))
    : existingClones;

  return {
    nextClones: [...kept, spawned],
    spawned,
    evictedOldest,
  };
}

/**
 * Spawns a Shadow entity (Action Mimic, Time Echo, or Dark Doppelgänger Boss) while enforcing
 * the per-Avatar MMORPG shadow limit (<= 2).
 */
export function spawnAvatarShadow(
  avatar: AvatarIdentityVessel,
  existingShadows: readonly SpawnedShadowEntity[],
  subtypeId: ShadowSubtypeId,
  offset: Vector3Coord = { x: -3.0, y: 0, z: -2.0 }
): {
  nextShadows: SpawnedShadowEntity[];
  spawned: SpawnedShadowEntity;
  evictedOldest: boolean;
} {
  const spec = getShadowSubtypeSpec(subtypeId);
  const pveDamagePerHit = Math.round(avatar.baseAttack * spec.pveDamageRatio);
  const pvpDamagePerHit = Math.round(avatar.baseAttack * spec.pvpDamageRatio);

  const spawned: SpawnedShadowEntity = {
    instanceId: `shadow_${subtypeId}_${existingShadows.length + 1}_${Math.round(avatar.position.z * 10)}`,
    ownerAvatarId: avatar.avatarId,
    subtypeId,
    position: {
      x: Number((avatar.position.x + offset.x).toFixed(2)),
      y: Number((avatar.position.y + offset.y).toFixed(2)),
      z: Number((avatar.position.z + offset.z).toFixed(2)),
    },
    remainingSec: spec.durationSec,
    supportsTeleportSwap: spec.supportsTeleportSwap,
    pveDamagePerHit,
    pvpDamagePerHit,
    silhouetteHex: spec.silhouetteHex,
    silhouetteOpacity: spec.silhouetteOpacity,
  };

  const cap = MMORPG_DUPLICATION_LIMITS.MAX_ACTIVE_SHADOWS_PER_AVATAR;
  const evictedOldest = existingShadows.length >= cap;
  const kept = evictedOldest
    ? existingShadows.slice(existingShadows.length - (cap - 1))
    : existingShadows;

  return {
    nextShadows: [...kept, spawned],
    spawned,
    evictedOldest,
  };
}

/**
 * Executes a Rogue/Cultivator Shadow Swap: exchanges the Primary Avatar's world position with an
 * active teleport-capable Shadow marker (Action Mimic or Time Echo).
 */
export function executeShadowSwapTeleport(
  avatar: AvatarIdentityVessel,
  shadows: readonly SpawnedShadowEntity[],
  targetShadowInstanceId: string
): {
  swapped: boolean;
  nextAvatar: AvatarIdentityVessel;
  nextShadows: SpawnedShadowEntity[];
} {
  const idx = shadows.findIndex((s) => s.instanceId === targetShadowInstanceId);
  if (idx === -1 || !shadows[idx].supportsTeleportSwap) {
    return {
      swapped: false,
      nextAvatar: avatar,
      nextShadows: [...shadows],
    };
  }

  const targetShadow = shadows[idx];
  const oldAvatarPos = { ...avatar.position };
  const nextAvatar: AvatarIdentityVessel = {
    ...avatar,
    position: { ...targetShadow.position },
  };
  const nextShadows = shadows.map((s, i) => (i === idx ? { ...s, position: oldAvatarPos } : s));

  return {
    swapped: true,
    nextAvatar,
    nextShadows,
  };
}

/**
 * Resolves the Cosmetic Clone Avatar ("Clone Avatar" gear item): preserves the stats bonus of the
 * Sovereign Clone Avatar Regalia while adopting the visual appearance of the target Hero Skin.
 */
export function resolveCosmeticCloneAvatarProfile(
  avatar: AvatarIdentityVessel,
  equippedCloneAvatar: boolean,
  visualTargetSkinId: string | null
): {
  effectiveVisualSkinId: string;
  effectiveAttack: number;
  cultivationSpeedBonusPct: number;
  troopAttackBonusPct: number;
  isCosmeticCloneActive: boolean;
} {
  const spec = getCloneSubtypeSpec('cosmetic_clone_avatar');
  if (!equippedCloneAvatar || !visualTargetSkinId) {
    return {
      effectiveVisualSkinId: avatar.baseSkinId,
      effectiveAttack: avatar.baseAttack,
      cultivationSpeedBonusPct: 0,
      troopAttackBonusPct: 0,
      isCosmeticCloneActive: false,
    };
  }

  const bonusAttrs = spec.statBonuses?.allAttributesBonus ?? 0;
  const troopBonus = spec.statBonuses?.troopAttackBonusPct ?? 0;
  const cultBonus = spec.statBonuses?.cultivationSpeedBonusPct ?? 0;

  return {
    effectiveVisualSkinId: visualTargetSkinId,
    effectiveAttack: Math.round((avatar.baseAttack + bonusAttrs) * (1 + troopBonus / 100)),
    cultivationSpeedBonusPct: cultBonus,
    troopAttackBonusPct: troopBonus,
    isCosmeticCloneActive: true,
  };
}

/**
 * Evaluates MMORPG 20Hz WebSocket network & CPU telemetry when N players in a raid/city summon
 * Clones and Shadows simultaneously (e.g. 50 players * 3 clones = 150 clones + 50 avatars = 200 entities).
 */
export function evaluateRaidDuplicationServerLoad(
  playerCount: number,
  clonesPerPlayer: number,
  shadowsPerPlayer: number = 0
): RaidDuplicationTelemetry {
  const safePlayers = Math.max(1, Math.min(100, Math.floor(playerCount)));
  const safeClones = Math.max(
    0,
    Math.min(MMORPG_DUPLICATION_LIMITS.MAX_ACTIVE_CLONES_PER_AVATAR, Math.floor(clonesPerPlayer))
  );
  const safeShadows = Math.max(
    0,
    Math.min(MMORPG_DUPLICATION_LIMITS.MAX_ACTIVE_SHADOWS_PER_AVATAR, Math.floor(shadowsPerPlayer))
  );

  const totalAvatars = safePlayers;
  const totalClones = safePlayers * safeClones;
  const totalShadows = safePlayers * safeShadows;
  const totalTrackedEntities = totalAvatars + totalClones + totalShadows;

  const uncompressedBytesPerTick =
    totalTrackedEntities * MMORPG_DUPLICATION_LIMITS.FULL_AVATAR_PACKET_BYTES;
  const compressedBytesPerTick =
    totalAvatars * MMORPG_DUPLICATION_LIMITS.FULL_AVATAR_PACKET_BYTES +
    (totalClones + totalShadows) * MMORPG_DUPLICATION_LIMITS.COMPACT_DUPLICATE_DELTA_BYTES;

  const bandwidthReductionPct =
    uncompressedBytesPerTick > 0
      ? Number(
          (
            ((uncompressedBytesPerTick - compressedBytesPerTick) / uncompressedBytesPerTick) *
            100
          ).toFixed(1)
        )
      : 0;

  // Authoritative 20Hz server tick cost: 0.085ms per full Avatar + 0.022ms per delta-compressed Clone/Shadow
  const estimatedServerTickCpuMs = Number(
    (totalAvatars * 0.085 + (totalClones + totalShadows) * 0.022).toFixed(2)
  );

  return {
    playerCount: safePlayers,
    clonesPerPlayer: safeClones,
    shadowsPerPlayer: safeShadows,
    totalAvatars,
    totalClones,
    totalShadows,
    totalTrackedEntities,
    uncompressedBytesPerTick,
    compressedBytesPerTick,
    bandwidthReductionPct,
    estimatedServerTickCpuMs,
    withinTickBudget: estimatedServerTickCpuMs <= MMORPG_DUPLICATION_LIMITS.SERVER_TICK_BUDGET_MS,
  };
}
