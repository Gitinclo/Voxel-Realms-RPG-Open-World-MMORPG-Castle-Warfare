/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MAX_CASTLE_TROOP_CAPACITY, MAX_RALLY_CAPACITY } from './math';
import { calculateRealmSuppression } from './cultivationMath';

export type TroopBranch = 'shieldbearer' | 'shooter' | 'bomber';

/**
 * Authoritative 20Hz (50ms tick) WebSocket Castle Siege Protocol, Delta-Compression,
 * 128-Frame Client-Side Prediction (CSP) Ring Buffer & Multi-Region Replication Engine.
 */

export enum SiegeNetOpcode {
  /** Client -> Server: Player issues troop march/formation waypoint command */
  C2S_TROOP_POSITION_CMD = 0x01,
  /** Client -> Server: Player initiates, joins, or cancels a 1T War Rally */
  C2S_RALLY_ACTION_CMD = 0x02,
  /** Server -> Client: Full keyframe snapshot (sent on join or every 100 ticks / 5.0s) */
  S2C_FULL_SIEGE_SNAPSHOT = 0x10,
  /** Server -> Client: 20Hz (50ms) delta-compressed state update */
  S2C_DELTA_SIEGE_UPDATE = 0x11,
  /** Server -> Client: Authoritative 1T Rally assembly & march synchronization */
  S2C_RALLY_STATUS_SYNC = 0x12,
  /** Server -> Client: Multi-region persistence & replication telemetry sync */
  S2C_MULTI_REGION_SYNC = 0x13,
}

export type TerritorySectorCode = 'A1' | 'A2' | 'A3' | 'B1' | 'B2' | 'B3' | 'C1' | 'C2' | 'C3';

export const ALL_TERRITORY_SECTORS: readonly TerritorySectorCode[] = [
  'A1',
  'A2',
  'A3',
  'B1',
  'B2',
  'B3',
  'C1',
  'C2',
  'C3',
] as const;

export interface SiegeNetEnvelope<TPayload> {
  opcode: SiegeNetOpcode;
  /** Monotonically increasing 20Hz server tick counter (1 tick = 50ms) */
  serverTick: number;
  /** Client command sequence number acknowledged by the authoritative server */
  ackClientSeq: number;
  /** Territory grid sector where the 50v50 siege instance is hosted */
  sector: TerritorySectorCode;
  /** FNV-1a 32-bit deterministic state hash for desync detection */
  stateHash: number;
  payload: TPayload;
}

// ============================================================================
// 1. TROOP POSITIONING & FORMATION COMMAND PACKETS
// ============================================================================

export type SiegeFormationType =
  'SHIELD_WALL' | 'WEDGE_CHARGE' | 'LOOSE_SKIRMISH' | 'PHALANX_ADVANCE';

export type CohortCombatPosture = 'MARCHING' | 'ENGAGED' | 'BESIEGING_GATE' | 'ROUTED';

export interface TroopPositionCommandPacket {
  /** Commander's unique player identifier */
  commanderId: string;
  /** Cohort slot index within the 50v50 battlefield (0..99) */
  cohortId: number;
  /** Monotonic client input sequence ID for Client-Side Prediction (CSP) */
  clientSeq: number;
  /** Quantized target world coordinates (int16: [-32768, 32767] -> [-327.68m, +327.67m]) */
  targetXQuantized: number;
  targetZQuantized: number;
  /** Quantized facing angle (uint16: [0, 65535] -> [0, 2π rad)) */
  facingAngleQuantized: number;
  /** Tactical formation modifier */
  formation: SiegeFormationType;
  /** Active troop branch leading the cohort */
  primaryBranch: TroopBranch;
}

export interface AuthoritativeCohortState {
  cohortId: number;
  commanderId: string;
  commanderName: string;
  allianceTag: string;
  faction: 'ATTACKER' | 'DEFENDER';
  posXQuantized: number;
  posZQuantized: number;
  targetXQuantized: number;
  targetZQuantized: number;
  velXQuantized: number;
  velZQuantized: number;
  facingAngleQuantized: number;
  formation: SiegeFormationType;
  posture: CohortCombatPosture;
  primaryBranch: TroopBranch;
  /** Tier 1..20 troop quality */
  troopTier: number;
  /** Commander's Cultivation Realm index (0..22) for 10^ΔRealm suppression checks */
  commanderRealmIndex: number;
  /** Wire-safe BigInt string representation ("0" .. "1000000000000000") */
  activeTroopCountWire: string;
  woundedTroopCountWire: string;
  moralePct: number;
  lastAckClientSeq: number;
}

// ============================================================================
// 2. 1-TRILLION WAR RALLY SYNCHRONIZATION PACKETS
// ============================================================================

export type SiegeRallyPhase =
  'MUSTER_OPEN' | 'LOCKED_MARCHING' | 'SIEGE_CLASH' | 'VICTORY_OCCUPIED' | 'REPELLED';

export type SiegeWeaponAttachment =
  'BATTERING_RAM' | 'TREBUCHET_BATTERY' | 'ARCANE_BALLISTA' | 'SOULFIRE_CANNON';

export interface RallyContributorSlot {
  commanderId: string;
  commanderName: string;
  commanderRealmIndex: number;
  shieldbearersWire: string;
  shootersWire: string;
  bombersWire: string;
  troopTier: number;
  joinedAtTick: number;
}

export interface RallyStatusSyncPacket {
  rallyId: string;
  initiatorCommanderId: string;
  initiatorAllianceTag: string;
  targetSector: TerritorySectorCode;
  phase: SiegeRallyPhase;
  /** Server tick when muster expires and march locks */
  musterDeadlineTick: number;
  /** Server tick when the rally impacts the defending citadel gate */
  impactTick: number;
  /** Hard cap: "1000000000000" (MAX_RALLY_CAPACITY = 1,000,000,000,000 / 1T) */
  maxCapacityWire: string;
  /** Current summed troops across all up to 50 attacking commanders */
  totalCommittedTroopsWire: string;
  siegeWeapon: SiegeWeaponAttachment;
  contributors: RallyContributorSlot[];
}

export interface RallyActionCommandPacket {
  commanderId: string;
  commanderName: string;
  commanderRealmIndex: number;
  allianceTag: string;
  action: 'INITIATE_RALLY' | 'JOIN_RALLY' | 'LAUNCH_NOW' | 'CHANGE_WEAPON';
  sector: TerritorySectorCode;
  shieldbearersWire: string;
  shootersWire: string;
  bombersWire: string;
  troopTier: number;
  siegeWeapon?: SiegeWeaponAttachment;
}

// ============================================================================
// 3. BITMASKED DELTA-COMPRESSION & FORTIFICATION TELEMETRY
// ============================================================================

export enum CohortDirtyBit {
  POSITION = 1 << 0,
  VELOCITY = 1 << 1,
  FACING = 1 << 2,
  FORMATION_OR_POSTURE = 1 << 3,
  TROOP_COUNTS = 1 << 4,
  MORALE = 1 << 5,
  REALM_SUPPRESSION = 1 << 6,
}

export interface CohortDeltaRecord {
  cohortId: number;
  /** Bitmask of CohortDirtyBit flags indicating which fields are present */
  dirtyMask: number;
  posXQuantized?: number;
  posZQuantized?: number;
  velXQuantized?: number;
  velZQuantized?: number;
  facingAngleQuantized?: number;
  formation?: SiegeFormationType;
  posture?: CohortCombatPosture;
  activeTroopCountWire?: string;
  woundedTroopCountWire?: string;
  moralePct?: number;
}

export type FortificationType = 'OUTER_GATE' | 'WALL_SEGMENT' | 'ARCHER_TOWER' | 'CITADEL_CORE';

export interface FortificationState {
  structureId: string;
  name: string;
  structureType: FortificationType;
  posXQuantized: number;
  posZQuantized: number;
  integrityHpWire: string;
  maxIntegrityHpWire: string;
  breached: boolean;
}

export interface FortificationDeltaRecord {
  structureId: string;
  structureType: FortificationType;
  integrityHpWire: string;
  maxIntegrityHpWire: string;
  breached: boolean;
}

export interface SiegeDeltaUpdatePacket {
  baseKeyframeTick: number;
  activeAttackerCmdCount: number;
  activeDefenderCmdCount: number;
  changedCohorts: CohortDeltaRecord[];
  changedFortifications: FortificationDeltaRecord[];
  /** Uncompressed byte estimate vs delta-compressed byte estimate */
  uncompressedBytesEstimate: number;
  compressedBytesEstimate: number;
}

export interface AuthoritativeSiegeSectorState {
  sector: TerritorySectorCode;
  serverTick: number;
  lastKeyframeTick: number;
  controllingAllianceTag: string;
  cohorts: AuthoritativeCohortState[];
  fortifications: FortificationState[];
  activeRally: RallyStatusSyncPacket;
  stateHash: number;
  combatLogTail: string[];
}

export interface FullSiegeSnapshotPacket {
  sectorState: AuthoritativeSiegeSectorState;
}

// ============================================================================
// 4. DETERMINISTIC WIRE SERIALIZATION, QUANTIZATION & FNV-1A HASHING
// ============================================================================

export const MIN_QUANTIZED_INT16 = -32768;
export const MAX_QUANTIZED_INT16 = 32767;
export const COORD_QUANTIZATION_SCALE = 100; // 0.01m precision

/**
 * Quantizes world-space coordinates in meters `[-327.68, +327.67]` to signed 16-bit integer `[-32768, 32767]`.
 */
export function quantizeCoordInt16(coordMeters: number): number {
  if (!Number.isFinite(coordMeters)) return 0;
  const scaled = Math.round(coordMeters * COORD_QUANTIZATION_SCALE);
  return Math.max(MIN_QUANTIZED_INT16, Math.min(MAX_QUANTIZED_INT16, scaled));
}

/**
 * Dequantizes signed 16-bit integer `[-32768, 32767]` back to world-space meters `[-327.68, +327.67]`.
 */
export function dequantizeCoordInt16(quantized: number): number {
  const clamped = Math.max(
    MIN_QUANTIZED_INT16,
    Math.min(MAX_QUANTIZED_INT16, Math.trunc(quantized))
  );
  return clamped / COORD_QUANTIZATION_SCALE;
}

/**
 * Quantizes angle in radians `[0, 2π)` to `uint16` `[0, 65535]`.
 */
export function quantizeAngleUint16(angleRad: number): number {
  if (!Number.isFinite(angleRad)) return 0;
  const twoPi = Math.PI * 2;
  const normalized = ((angleRad % twoPi) + twoPi) % twoPi;
  return Math.max(0, Math.min(65535, Math.round((normalized / twoPi) * 65535)));
}

/**
 * Dequantizes `uint16` `[0, 65535]` back to angle in radians `[0, 2π)`.
 */
export function dequantizeAngleUint16(quantized: number): number {
  const clamped = Math.max(0, Math.min(65535, Math.trunc(quantized)));
  return (clamped / 65535) * Math.PI * 2;
}

/**
 * Serializes a non-negative BigInt troop/HP count to a canonical base-10 wire string,
 * clamping at `MAX_CASTLE_TROOP_CAPACITY` (`1,000,000,000,000,000n` / `1,000T`).
 */
export function serializeBigIntWire(
  value: bigint,
  maxCap: bigint = MAX_CASTLE_TROOP_CAPACITY
): string {
  const clamped = value < 0n ? 0n : value > maxCap ? maxCap : value;
  return clamped.toString(10);
}

/**
 * Deserializes a wire string into a verified non-negative BigInt, rejecting negative or malformed values.
 */
export function deserializeBigIntWire(
  wire: string,
  maxCap: bigint = MAX_CASTLE_TROOP_CAPACITY
): bigint {
  if (typeof wire !== 'string' || !/^\d+$/.test(wire.trim())) {
    return 0n;
  }
  const parsed = BigInt(wire.trim());
  if (parsed < 0n) return 0n;
  return parsed > maxCap ? maxCap : parsed;
}

/**
 * Deterministic 32-bit FNV-1a checksum for verifying client/server state parity.
 */
export function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Computes an authoritative FNV-1a 32-bit hash over a sector's cohorts, fortifications, and rally state.
 */
export function computeSectorStateHash(
  state: Pick<
    AuthoritativeSiegeSectorState,
    'sector' | 'serverTick' | 'cohorts' | 'fortifications' | 'activeRally'
  >
): number {
  const parts: string[] = [`${state.sector}@${state.serverTick}`];
  for (const c of state.cohorts) {
    parts.push(
      `C${c.cohortId}:${c.posXQuantized},${c.posZQuantized}:${c.formation}:${c.posture}:${c.activeTroopCountWire}:${c.woundedTroopCountWire}:${c.moralePct}`
    );
  }
  for (const f of state.fortifications) {
    parts.push(`F${f.structureId}:${f.integrityHpWire}:${f.breached ? 1 : 0}`);
  }
  parts.push(
    `R${state.activeRally.rallyId}:${state.activeRally.phase}:${state.activeRally.totalCommittedTroopsWire}:${state.activeRally.siegeWeapon}`
  );
  return fnv1a32(parts.join('|'));
}

// ============================================================================
// 5. AUTHORITATIVE 50v50 SIEGE STATE INITIALIZATION & 20HZ TICK ENGINE
// ============================================================================

const FORMATION_SPEED_MODIFIER: Record<SiegeFormationType, number> = {
  SHIELD_WALL: 0.72,
  PHALANX_ADVANCE: 0.85,
  LOOSE_SKIRMISH: 1.15,
  WEDGE_CHARGE: 1.35,
};

const FORMATION_DEFENSE_MODIFIER: Record<SiegeFormationType, number> = {
  SHIELD_WALL: 1.45,
  PHALANX_ADVANCE: 1.25,
  LOOSE_SKIRMISH: 1.05,
  WEDGE_CHARGE: 0.9,
};

const FORMATION_ATTACK_MODIFIER: Record<SiegeFormationType, number> = {
  SHIELD_WALL: 0.9,
  PHALANX_ADVANCE: 1.15,
  LOOSE_SKIRMISH: 1.05,
  WEDGE_CHARGE: 1.4,
};

/**
 * Evaluates the Tri-Branch Counter multiplier (`Shieldbearer > Shooter > Bomber > Shieldbearer`).
 */
export function getBranchCounterMultiplier(
  attackerBranch: TroopBranch,
  defenderBranch: TroopBranch
): number {
  if (attackerBranch === defenderBranch) return 1.0;
  if (
    (attackerBranch === 'shieldbearer' && defenderBranch === 'shooter') ||
    (attackerBranch === 'shooter' && defenderBranch === 'bomber') ||
    (attackerBranch === 'bomber' && defenderBranch === 'shieldbearer')
  ) {
    return 1.5;
  }
  return 0.75;
}

/**
 * Seeds a deterministic 50v50 Castle Siege instance for a territory sector.
 * We populate 12 representative vanguard cohorts (6 Attacker cohorts [0..5] representing the 50-commander
 * Assault Coalition + 6 Defender cohorts [50..55] representing the 50-commander Citadel Garrison)
 * so the 20Hz simulation and UI inspector stay fast and crystal-clear while supporting all cohort IDs 0..99.
 */
export function createInitialAuthoritativeSiegeSectorState(
  sector: TerritorySectorCode = 'B2'
): AuthoritativeSiegeSectorState {
  const sectorSeed = sector.charCodeAt(0) * 31 + sector.charCodeAt(1);
  const branches: TroopBranch[] = ['shieldbearer', 'shooter', 'bomber'];
  const formations: SiegeFormationType[] = [
    'SHIELD_WALL',
    'PHALANX_ADVANCE',
    'WEDGE_CHARGE',
    'LOOSE_SKIRMISH',
  ];

  const cohorts: AuthoritativeCohortState[] = [];

  // 6 Attacking Vanguard Cohorts (Slots 0..5)
  for (let i = 0; i < 6; i++) {
    const laneOffsetZ = (i - 2.5) * 18;
    const startX = -75 - (i % 2) * 14;
    const branch = branches[i % 3];
    const formation = formations[i % 4];
    cohorts.push({
      cohortId: i,
      commanderId: i === 0 ? 'player-commander-01' : `atk-cmd-${sector}-${i}`,
      commanderName: i === 0 ? 'Sovereign Vanguard (You)' : `Archon ${sector}-${i + 1}`,
      allianceTag: 'SOL',
      faction: 'ATTACKER',
      posXQuantized: quantizeCoordInt16(startX),
      posZQuantized: quantizeCoordInt16(laneOffsetZ),
      targetXQuantized: quantizeCoordInt16(12), // Advancing toward Outer Gate at X=12m
      targetZQuantized: quantizeCoordInt16(laneOffsetZ * 0.65),
      velXQuantized: 18,
      velZQuantized: 0,
      facingAngleQuantized: quantizeAngleUint16(0),
      formation,
      posture: 'MARCHING',
      primaryBranch: branch,
      troopTier: 14 + (i % 5),
      commanderRealmIndex: 5 + (i % 3),
      activeTroopCountWire: serializeBigIntWire(45_000_000_000n + BigInt(i) * 8_500_000_000n),
      woundedTroopCountWire: '0',
      moralePct: 100,
      lastAckClientSeq: 0,
    });
  }

  // 6 Defending Garrison Cohorts (Slots 50..55)
  for (let i = 0; i < 6; i++) {
    const cohortId = 50 + i;
    const laneOffsetZ = (i - 2.5) * 16;
    const startX = 24 + (i % 2) * 12;
    const branch = branches[(i + 1) % 3];
    const formation = formations[(i + 1) % 4];
    cohorts.push({
      cohortId,
      commanderId: `def-cmd-${sector}-${i}`,
      commanderName: `Citadel Warden ${sector}-${i + 1}`,
      allianceTag: sector === 'B2' ? 'SOL' : 'VAL',
      faction: 'DEFENDER',
      posXQuantized: quantizeCoordInt16(startX),
      posZQuantized: quantizeCoordInt16(laneOffsetZ),
      targetXQuantized: quantizeCoordInt16(16),
      targetZQuantized: quantizeCoordInt16(laneOffsetZ * 0.7),
      velXQuantized: -8,
      velZQuantized: 0,
      facingAngleQuantized: quantizeAngleUint16(Math.PI),
      formation,
      posture: 'ENGAGED',
      primaryBranch: branch,
      troopTier: 14 + ((i + sectorSeed) % 4),
      commanderRealmIndex: 5 + (i % 2),
      activeTroopCountWire: serializeBigIntWire(42_000_000_000n + BigInt(i) * 7_000_000_000n),
      woundedTroopCountWire: '0',
      moralePct: 100,
      lastAckClientSeq: 0,
    });
  }

  const fortifications: FortificationState[] = [
    {
      structureId: `${sector}-GATE-01`,
      name: `${sector} Obsidian Outer Gate`,
      structureType: 'OUTER_GATE',
      posXQuantized: quantizeCoordInt16(14),
      posZQuantized: quantizeCoordInt16(0),
      integrityHpWire: serializeBigIntWire(250_000_000_000n),
      maxIntegrityHpWire: serializeBigIntWire(250_000_000_000n),
      breached: false,
    },
    {
      structureId: `${sector}-WALL-NORTH`,
      name: `${sector} North Starforged Curtain Wall`,
      structureType: 'WALL_SEGMENT',
      posXQuantized: quantizeCoordInt16(18),
      posZQuantized: quantizeCoordInt16(-28),
      integrityHpWire: serializeBigIntWire(180_000_000_000n),
      maxIntegrityHpWire: serializeBigIntWire(180_000_000_000n),
      breached: false,
    },
    {
      structureId: `${sector}-TOWER-SOUTH`,
      name: `${sector} South Astral Ballista Bastion`,
      structureType: 'ARCHER_TOWER',
      posXQuantized: quantizeCoordInt16(20),
      posZQuantized: quantizeCoordInt16(28),
      integrityHpWire: serializeBigIntWire(140_000_000_000n),
      maxIntegrityHpWire: serializeBigIntWire(140_000_000_000n),
      breached: false,
    },
    {
      structureId: `${sector}-CITADEL-CORE`,
      name: `${sector} Sovereign Dragon-Vein Sanctum`,
      structureType: 'CITADEL_CORE',
      posXQuantized: quantizeCoordInt16(48),
      posZQuantized: quantizeCoordInt16(0),
      integrityHpWire: serializeBigIntWire(600_000_000_000n),
      maxIntegrityHpWire: serializeBigIntWire(600_000_000_000n),
      breached: false,
    },
  ];

  const activeRally: RallyStatusSyncPacket = {
    rallyId: `RALLY-${sector}-001`,
    initiatorCommanderId: 'player-commander-01',
    initiatorAllianceTag: 'SOL',
    targetSector: sector,
    phase: 'MUSTER_OPEN',
    musterDeadlineTick: 600,
    impactTick: 900,
    maxCapacityWire: serializeBigIntWire(MAX_RALLY_CAPACITY, MAX_RALLY_CAPACITY),
    totalCommittedTroopsWire: serializeBigIntWire(325_000_000_000n, MAX_RALLY_CAPACITY),
    siegeWeapon: 'TREBUCHET_BATTERY',
    contributors: [
      {
        commanderId: 'player-commander-01',
        commanderName: 'Sovereign Vanguard (You)',
        commanderRealmIndex: 7,
        shieldbearersWire: serializeBigIntWire(65_000_000_000n, MAX_RALLY_CAPACITY),
        shootersWire: serializeBigIntWire(55_000_000_000n, MAX_RALLY_CAPACITY),
        bombersWire: serializeBigIntWire(45_000_000_000n, MAX_RALLY_CAPACITY),
        troopTier: 18,
        joinedAtTick: 1,
      },
      {
        commanderId: `ally-archon-${sector}-2`,
        commanderName: 'ElderSeraphina',
        commanderRealmIndex: 6,
        shieldbearersWire: serializeBigIntWire(60_000_000_000n, MAX_RALLY_CAPACITY),
        shootersWire: serializeBigIntWire(55_000_000_000n, MAX_RALLY_CAPACITY),
        bombersWire: serializeBigIntWire(45_000_000_000n, MAX_RALLY_CAPACITY),
        troopTier: 16,
        joinedAtTick: 2,
      },
    ],
  };

  const initial: AuthoritativeSiegeSectorState = {
    sector,
    serverTick: 1,
    lastKeyframeTick: 1,
    controllingAllianceTag: sector === 'B2' ? 'SOL' : 'VAL',
    cohorts,
    fortifications,
    activeRally,
    stateHash: 0,
    combatLogTail: [
      `[Tick #1] 50v50 Authoritative Siege instance initialized on Sector ${sector} (20Hz / 50ms tick).`,
    ],
  };

  initial.stateHash = computeSectorStateHash(initial);
  return initial;
}

/**
 * Applies a player's `C2S_TROOP_POSITION_CMD` packet to the authoritative sector state.
 */
export function applyTroopPositionCommand(
  state: AuthoritativeSiegeSectorState,
  cmd: TroopPositionCommandPacket
): AuthoritativeSiegeSectorState {
  const nextCohorts = state.cohorts.map((cohort) => {
    if (cohort.cohortId !== cmd.cohortId) return cohort;
    const clampedTargetX = Math.max(
      MIN_QUANTIZED_INT16,
      Math.min(MAX_QUANTIZED_INT16, Math.trunc(cmd.targetXQuantized))
    );
    const clampedTargetZ = Math.max(
      MIN_QUANTIZED_INT16,
      Math.min(MAX_QUANTIZED_INT16, Math.trunc(cmd.targetZQuantized))
    );
    const dx = clampedTargetX - cohort.posXQuantized;
    const dz = clampedTargetZ - cohort.posZQuantized;
    const angleRad = Math.atan2(dz, dx);
    return {
      ...cohort,
      targetXQuantized: clampedTargetX,
      targetZQuantized: clampedTargetZ,
      facingAngleQuantized:
        cmd.facingAngleQuantized >= 0
          ? Math.min(65535, Math.trunc(cmd.facingAngleQuantized))
          : quantizeAngleUint16(angleRad),
      formation: cmd.formation,
      primaryBranch: cmd.primaryBranch,
      posture: cohort.posture === 'ROUTED' ? 'ROUTED' : ('MARCHING' as CohortCombatPosture),
      lastAckClientSeq: Math.max(cohort.lastAckClientSeq, cmd.clientSeq),
    };
  });

  const logEntry = `[Tick #${state.serverTick}] Cohort #${cmd.cohortId} ordered to (${dequantizeCoordInt16(cmd.targetXQuantized).toFixed(1)}m, ${dequantizeCoordInt16(cmd.targetZQuantized).toFixed(1)}m) in ${cmd.formation}.`;
  const nextState: AuthoritativeSiegeSectorState = {
    ...state,
    cohorts: nextCohorts,
    combatLogTail: [...state.combatLogTail.slice(-11), logEntry],
  };
  nextState.stateHash = computeSectorStateHash(nextState);
  return nextState;
}

/**
 * Applies a player's `C2S_RALLY_ACTION_CMD` packet to the sector's 1-Trillion War Rally state,
 * strictly enforcing `MAX_RALLY_CAPACITY` (`1,000,000,000,000n` / `1T`) and max 50 contributors.
 */
export function applyRallyActionCommand(
  state: AuthoritativeSiegeSectorState,
  cmd: RallyActionCommandPacket
): AuthoritativeSiegeSectorState {
  const rally = state.activeRally;
  const currentTotal = deserializeBigIntWire(rally.totalCommittedTroopsWire, MAX_RALLY_CAPACITY);
  const remainingCap = MAX_RALLY_CAPACITY > currentTotal ? MAX_RALLY_CAPACITY - currentTotal : 0n;

  const rawShield = deserializeBigIntWire(cmd.shieldbearersWire, MAX_RALLY_CAPACITY);
  const rawShooter = deserializeBigIntWire(cmd.shootersWire, MAX_RALLY_CAPACITY);
  const rawBomber = deserializeBigIntWire(cmd.bombersWire, MAX_RALLY_CAPACITY);
  const requestedSum = rawShield + rawShooter + rawBomber;

  let nextRally: RallyStatusSyncPacket = {
    ...rally,
    contributors: [...rally.contributors],
  };
  let logMsg = '';

  if (cmd.action === 'CHANGE_WEAPON' && cmd.siegeWeapon) {
    nextRally.siegeWeapon = cmd.siegeWeapon;
    logMsg = `[Tick #${state.serverTick}] ${cmd.commanderName} equipped ${cmd.siegeWeapon} on Rally ${rally.rallyId}.`;
  } else if (cmd.action === 'LAUNCH_NOW') {
    nextRally.phase = 'LOCKED_MARCHING';
    nextRally.impactTick = state.serverTick + 40;
    logMsg = `[Tick #${state.serverTick}] Rally ${rally.rallyId} locked & marching (${nextRally.totalCommittedTroopsWire} troops)!`;
  } else if (cmd.action === 'INITIATE_RALLY') {
    const cappedTotal = requestedSum > MAX_RALLY_CAPACITY ? MAX_RALLY_CAPACITY : requestedSum;
    const ratio = requestedSum > 0n ? Number(cappedTotal) / Number(requestedSum) : 1;
    const s = BigInt(Math.floor(Number(rawShield) * ratio));
    const sh = BigInt(Math.floor(Number(rawShooter) * ratio));
    const b = cappedTotal - s - sh;
    nextRally = {
      rallyId: `RALLY-${state.sector}-${state.serverTick}`,
      initiatorCommanderId: cmd.commanderId,
      initiatorAllianceTag: cmd.allianceTag || 'SOL',
      targetSector: state.sector,
      phase: 'MUSTER_OPEN',
      musterDeadlineTick: state.serverTick + 400,
      impactTick: state.serverTick + 600,
      maxCapacityWire: serializeBigIntWire(MAX_RALLY_CAPACITY, MAX_RALLY_CAPACITY),
      totalCommittedTroopsWire: serializeBigIntWire(cappedTotal, MAX_RALLY_CAPACITY),
      siegeWeapon: cmd.siegeWeapon ?? rally.siegeWeapon,
      contributors: [
        {
          commanderId: cmd.commanderId,
          commanderName: cmd.commanderName,
          commanderRealmIndex: cmd.commanderRealmIndex,
          shieldbearersWire: serializeBigIntWire(s, MAX_RALLY_CAPACITY),
          shootersWire: serializeBigIntWire(sh, MAX_RALLY_CAPACITY),
          bombersWire: serializeBigIntWire(b, MAX_RALLY_CAPACITY),
          troopTier: cmd.troopTier,
          joinedAtTick: state.serverTick,
        },
      ],
    };
    logMsg = `[Tick #${state.serverTick}] ${cmd.commanderName} opened 1T War Rally ${nextRally.rallyId} on Sector ${state.sector}.`;
  } else if (cmd.action === 'JOIN_RALLY' && nextRally.contributors.length < 50) {
    const acceptedTotal = requestedSum > remainingCap ? remainingCap : requestedSum;
    if (acceptedTotal > 0n) {
      const ratio = requestedSum > 0n ? Number(acceptedTotal) / Number(requestedSum) : 1;
      const s = BigInt(Math.floor(Number(rawShield) * ratio));
      const sh = BigInt(Math.floor(Number(rawShooter) * ratio));
      const b = acceptedTotal - s - sh;
      const existingIdx = nextRally.contributors.findIndex(
        (c) => c.commanderId === cmd.commanderId
      );
      if (existingIdx >= 0) {
        const prev = nextRally.contributors[existingIdx];
        nextRally.contributors[existingIdx] = {
          ...prev,
          shieldbearersWire: serializeBigIntWire(
            deserializeBigIntWire(prev.shieldbearersWire) + s,
            MAX_RALLY_CAPACITY
          ),
          shootersWire: serializeBigIntWire(
            deserializeBigIntWire(prev.shootersWire) + sh,
            MAX_RALLY_CAPACITY
          ),
          bombersWire: serializeBigIntWire(
            deserializeBigIntWire(prev.bombersWire) + b,
            MAX_RALLY_CAPACITY
          ),
        };
      } else {
        nextRally.contributors.push({
          commanderId: cmd.commanderId,
          commanderName: cmd.commanderName,
          commanderRealmIndex: cmd.commanderRealmIndex,
          shieldbearersWire: serializeBigIntWire(s, MAX_RALLY_CAPACITY),
          shootersWire: serializeBigIntWire(sh, MAX_RALLY_CAPACITY),
          bombersWire: serializeBigIntWire(b, MAX_RALLY_CAPACITY),
          troopTier: cmd.troopTier,
          joinedAtTick: state.serverTick,
        });
      }
      nextRally.totalCommittedTroopsWire = serializeBigIntWire(
        currentTotal + acceptedTotal,
        MAX_RALLY_CAPACITY
      );
      logMsg = `[Tick #${state.serverTick}] ${cmd.commanderName} reinforced Rally ${rally.rallyId} (+${acceptedTotal.toString()} troops).`;
    }
  }

  const nextState: AuthoritativeSiegeSectorState = {
    ...state,
    activeRally: nextRally,
    combatLogTail: logMsg ? [...state.combatLogTail.slice(-11), logMsg] : state.combatLogTail,
  };
  nextState.stateHash = computeSectorStateHash(nextState);
  return nextState;
}

/**
 * Advances the authoritative 50v50 Castle Siege simulation by 1 server tick (50ms / 20Hz),
 * computing movement, Tri-Branch combat casualties, `10^ΔRealm` cultivation suppression,
 * fortification breaches, and generating a bitmasked `SiegeDeltaUpdatePacket`.
 */
export function stepAuthoritativeSiegeTick(state: AuthoritativeSiegeSectorState): {
  nextState: AuthoritativeSiegeSectorState;
  deltaPacket: SiegeNetEnvelope<SiegeDeltaUpdatePacket>;
} {
  const nextTick = state.serverTick + 1;
  const changedCohorts: CohortDeltaRecord[] = [];
  const changedFortifications: FortificationDeltaRecord[] = [];
  const combatLogs = [...state.combatLogTail];

  const nextCohorts: AuthoritativeCohortState[] = state.cohorts.map((c) => ({ ...c }));
  const nextFortifications: FortificationState[] = state.fortifications.map((f) => ({ ...f }));
  const nextRally: RallyStatusSyncPacket = {
    ...state.activeRally,
    contributors: [...state.activeRally.contributors],
  };

  // 1. Advance cohorts toward their target waypoints
  for (let i = 0; i < nextCohorts.length; i++) {
    const prev = state.cohorts[i];
    const curr = nextCohorts[i];
    const activeTroops = deserializeBigIntWire(curr.activeTroopCountWire);

    if (activeTroops <= 0n || curr.posture === 'ROUTED') {
      curr.posture = 'ROUTED';
      curr.velXQuantized = 0;
      curr.velZQuantized = 0;
      continue;
    }

    const dx = curr.targetXQuantized - curr.posXQuantized;
    const dz = curr.targetZQuantized - curr.posZQuantized;
    const distQuantized = Math.hypot(dx, dz);

    // Base speed: ~22 quantized units (0.22m) per 50ms tick = 4.4 m/s
    const stepSpeed = Math.max(4, Math.round(22 * FORMATION_SPEED_MODIFIER[curr.formation]));

    if (distQuantized > 25) {
      const stepX = Math.round((dx / distQuantized) * Math.min(distQuantized, stepSpeed));
      const stepZ = Math.round((dz / distQuantized) * Math.min(distQuantized, stepSpeed));
      curr.posXQuantized = Math.max(
        MIN_QUANTIZED_INT16,
        Math.min(MAX_QUANTIZED_INT16, curr.posXQuantized + stepX)
      );
      curr.posZQuantized = Math.max(
        MIN_QUANTIZED_INT16,
        Math.min(MAX_QUANTIZED_INT16, curr.posZQuantized + stepZ)
      );
      curr.velXQuantized = stepX;
      curr.velZQuantized = stepZ;
      curr.facingAngleQuantized = quantizeAngleUint16(Math.atan2(dz, dx));
    } else {
      curr.velXQuantized = 0;
      curr.velZQuantized = 0;
    }

    // Check engagement with opposing cohorts within 18m (1800 quantized units)
    const opponents = nextCohorts.filter(
      (other) =>
        other.faction !== curr.faction && deserializeBigIntWire(other.activeTroopCountWire) > 0n
    );

    let nearestEnemy: AuthoritativeCohortState | null = null;
    let nearestDist = Infinity;
    for (const enemy of opponents) {
      const d = Math.hypot(
        enemy.posXQuantized - curr.posXQuantized,
        enemy.posZQuantized - curr.posZQuantized
      );
      if (d < nearestDist) {
        nearestDist = d;
        nearestEnemy = enemy;
      }
    }

    if (nearestEnemy && nearestDist <= 1800) {
      curr.posture = 'ENGAGED';
      const counterMult = getBranchCounterMultiplier(
        curr.primaryBranch,
        nearestEnemy.primaryBranch
      );
      const realmSupp = calculateRealmSuppression(
        curr.commanderRealmIndex,
        nearestEnemy.commanderRealmIndex
      );
      const atkMod =
        FORMATION_ATTACK_MODIFIER[curr.formation] /
        FORMATION_DEFENSE_MODIFIER[nearestEnemy.formation];
      const clampedSupp = Math.min(10, Math.max(0.1, realmSupp.damageMultiplier));

      // Inflict deterministic attrition per 50ms clash tick
      const baseLoss = activeTroops / 450n + 12_000n;
      const scaledLoss = BigInt(
        Math.max(
          1000,
          Math.floor(Number(baseLoss) / Math.max(0.25, counterMult * atkMod * clampedSupp))
        )
      );
      const nextActive = activeTroops > scaledLoss ? activeTroops - scaledLoss : 0n;
      const woundedDelta = (scaledLoss * 65n) / 100n;
      const prevWounded = deserializeBigIntWire(curr.woundedTroopCountWire);

      curr.activeTroopCountWire = serializeBigIntWire(nextActive);
      curr.woundedTroopCountWire = serializeBigIntWire(prevWounded + woundedDelta);
      if (nextActive === 0n) {
        curr.posture = 'ROUTED';
        curr.moralePct = 0;
      } else if (nextTick % 10 === 0 && curr.moralePct > 18) {
        curr.moralePct = Math.max(15, curr.moralePct - 1);
      }
    } else if (curr.faction === 'ATTACKER') {
      // Check if attacker cohort is within siege range of an unbreached fortification
      const targetFort =
        nextFortifications.find((f) => !f.breached && f.structureType === 'OUTER_GATE') ??
        nextFortifications.find((f) => !f.breached);
      if (targetFort) {
        const fortDist = Math.hypot(
          targetFort.posXQuantized - curr.posXQuantized,
          targetFort.posZQuantized - curr.posZQuantized
        );
        if (fortDist <= 2200) {
          curr.posture = 'BESIEGING_GATE';
          const fortHp = deserializeBigIntWire(targetFort.integrityHpWire);
          const bomberBonus = curr.primaryBranch === 'bomber' ? 22n : 8n;
          const siegeDmg = (activeTroops / 15_000n) * bomberBonus + 25_000_000n;
          const nextHp = fortHp > siegeDmg ? fortHp - siegeDmg : 0n;
          targetFort.integrityHpWire = serializeBigIntWire(nextHp);
          if (nextHp === 0n && !targetFort.breached) {
            targetFort.breached = true;
            combatLogs.push(
              `[Tick #${nextTick}] BREACH! ${targetFort.name} shattered under ${curr.commanderName}'s assault!`
            );
          }
        }
      }
    }

    // Build bitmasked CohortDeltaRecord if any field mutated
    let dirtyMask = 0;
    const delta: CohortDeltaRecord = { cohortId: curr.cohortId, dirtyMask: 0 };

    if (curr.posXQuantized !== prev.posXQuantized || curr.posZQuantized !== prev.posZQuantized) {
      dirtyMask |= CohortDirtyBit.POSITION;
      delta.posXQuantized = curr.posXQuantized;
      delta.posZQuantized = curr.posZQuantized;
    }
    if (curr.velXQuantized !== prev.velXQuantized || curr.velZQuantized !== prev.velZQuantized) {
      dirtyMask |= CohortDirtyBit.VELOCITY;
      delta.velXQuantized = curr.velXQuantized;
      delta.velZQuantized = curr.velZQuantized;
    }
    if (curr.facingAngleQuantized !== prev.facingAngleQuantized) {
      dirtyMask |= CohortDirtyBit.FACING;
      delta.facingAngleQuantized = curr.facingAngleQuantized;
    }
    if (curr.formation !== prev.formation || curr.posture !== prev.posture) {
      dirtyMask |= CohortDirtyBit.FORMATION_OR_POSTURE;
      delta.formation = curr.formation;
      delta.posture = curr.posture;
    }
    if (
      curr.activeTroopCountWire !== prev.activeTroopCountWire ||
      curr.woundedTroopCountWire !== prev.woundedTroopCountWire
    ) {
      dirtyMask |= CohortDirtyBit.TROOP_COUNTS;
      delta.activeTroopCountWire = curr.activeTroopCountWire;
      delta.woundedTroopCountWire = curr.woundedTroopCountWire;
    }
    if (curr.moralePct !== prev.moralePct) {
      dirtyMask |= CohortDirtyBit.MORALE;
      delta.moralePct = curr.moralePct;
    }

    if (dirtyMask !== 0) {
      delta.dirtyMask = dirtyMask;
      changedCohorts.push(delta);
    }
  }

  // 2. Progress 1T War Rally phase transitions
  if (nextRally.phase === 'MUSTER_OPEN' && nextTick >= nextRally.musterDeadlineTick) {
    nextRally.phase = 'LOCKED_MARCHING';
    combatLogs.push(
      `[Tick #${nextTick}] 1T War Rally ${nextRally.rallyId} muster complete — marching with ${nextRally.totalCommittedTroopsWire} troops!`
    );
  } else if (nextRally.phase === 'LOCKED_MARCHING' && nextTick >= nextRally.impactTick) {
    nextRally.phase = 'SIEGE_CLASH';
    const targetFort =
      nextFortifications.find((f) => !f.breached) ??
      nextFortifications[nextFortifications.length - 1];
    if (targetFort) {
      const fortHp = deserializeBigIntWire(targetFort.integrityHpWire);
      const rallyTroops = deserializeBigIntWire(
        nextRally.totalCommittedTroopsWire,
        MAX_RALLY_CAPACITY
      );
      const weaponMult =
        nextRally.siegeWeapon === 'SOULFIRE_CANNON'
          ? 4n
          : nextRally.siegeWeapon === 'TREBUCHET_BATTERY'
            ? 3n
            : 2n;
      const impactDmg = (rallyTroops * weaponMult) / 10n;
      const nextHp = fortHp > impactDmg ? fortHp - impactDmg : 0n;
      targetFort.integrityHpWire = serializeBigIntWire(nextHp);
      if (nextHp === 0n) {
        targetFort.breached = true;
      }
      combatLogs.push(
        `[Tick #${nextTick}] RALLY IMPACT! ${nextRally.siegeWeapon} struck ${targetFort.name} for ${impactDmg.toString()} siege damage!`
      );
    }
  }

  // 3. Collect changed fortifications
  for (let i = 0; i < nextFortifications.length; i++) {
    const prevF = state.fortifications[i];
    const currF = nextFortifications[i];
    if (currF.integrityHpWire !== prevF.integrityHpWire || currF.breached !== prevF.breached) {
      changedFortifications.push({
        structureId: currF.structureId,
        structureType: currF.structureType,
        integrityHpWire: currF.integrityHpWire,
        maxIntegrityHpWire: currF.maxIntegrityHpWire,
        breached: currF.breached,
      });
    }
  }

  // Check if Citadel Core is breached -> flip controlling alliance
  const citadelCore = nextFortifications.find((f) => f.structureType === 'CITADEL_CORE');
  let controllingAllianceTag = state.controllingAllianceTag;
  if (citadelCore?.breached && controllingAllianceTag !== nextRally.initiatorAllianceTag) {
    controllingAllianceTag = nextRally.initiatorAllianceTag;
    nextRally.phase = 'VICTORY_OCCUPIED';
    combatLogs.push(
      `[Tick #${nextTick}] SECTOR CONQUERED! Alliance [${controllingAllianceTag}] seized Sector ${state.sector}!`
    );
  }

  const lastKeyframeTick = nextTick % 100 === 0 ? nextTick : state.lastKeyframeTick;

  const nextState: AuthoritativeSiegeSectorState = {
    sector: state.sector,
    serverTick: nextTick,
    lastKeyframeTick,
    controllingAllianceTag,
    cohorts: nextCohorts,
    fortifications: nextFortifications,
    activeRally: nextRally,
    stateHash: 0,
    combatLogTail: combatLogs.slice(-12),
  };
  nextState.stateHash = computeSectorStateHash(nextState);

  const uncompressedBytesEstimate = nextCohorts.length * 96 + nextFortifications.length * 48;
  const compressedBytesEstimate =
    24 + changedCohorts.length * 22 + changedFortifications.length * 28;

  const activeAttackerCmdCount = nextCohorts.filter(
    (c) => c.faction === 'ATTACKER' && c.posture !== 'ROUTED'
  ).length;
  const activeDefenderCmdCount = nextCohorts.filter(
    (c) => c.faction === 'DEFENDER' && c.posture !== 'ROUTED'
  ).length;

  const deltaPacket: SiegeNetEnvelope<SiegeDeltaUpdatePacket> = {
    opcode: SiegeNetOpcode.S2C_DELTA_SIEGE_UPDATE,
    serverTick: nextTick,
    ackClientSeq: nextCohorts[0]?.lastAckClientSeq ?? 0,
    sector: state.sector,
    stateHash: nextState.stateHash,
    payload: {
      baseKeyframeTick: lastKeyframeTick,
      activeAttackerCmdCount,
      activeDefenderCmdCount,
      changedCohorts,
      changedFortifications,
      uncompressedBytesEstimate,
      compressedBytesEstimate,
    },
  };

  return { nextState, deltaPacket };
}

/**
 * Reconstructs client-side state by applying an authoritative `S2C_DELTA_SIEGE_UPDATE` packet
 * on top of the local `AuthoritativeSiegeSectorState`.
 */
export function applySiegeDeltaUpdate(
  baseState: AuthoritativeSiegeSectorState,
  envelope: SiegeNetEnvelope<SiegeDeltaUpdatePacket>
): AuthoritativeSiegeSectorState {
  const deltaMap = new Map<number, CohortDeltaRecord>();
  for (const d of envelope.payload.changedCohorts) {
    deltaMap.set(d.cohortId, d);
  }

  const nextCohorts = baseState.cohorts.map((cohort) => {
    const d = deltaMap.get(cohort.cohortId);
    if (!d) return cohort;
    const updated = { ...cohort };
    if (d.dirtyMask & CohortDirtyBit.POSITION) {
      if (d.posXQuantized !== undefined) updated.posXQuantized = d.posXQuantized;
      if (d.posZQuantized !== undefined) updated.posZQuantized = d.posZQuantized;
    }
    if (d.dirtyMask & CohortDirtyBit.VELOCITY) {
      if (d.velXQuantized !== undefined) updated.velXQuantized = d.velXQuantized;
      if (d.velZQuantized !== undefined) updated.velZQuantized = d.velZQuantized;
    }
    if (d.dirtyMask & CohortDirtyBit.FACING) {
      if (d.facingAngleQuantized !== undefined) {
        updated.facingAngleQuantized = d.facingAngleQuantized;
      }
    }
    if (d.dirtyMask & CohortDirtyBit.FORMATION_OR_POSTURE) {
      if (d.formation !== undefined) updated.formation = d.formation;
      if (d.posture !== undefined) updated.posture = d.posture;
    }
    if (d.dirtyMask & CohortDirtyBit.TROOP_COUNTS) {
      if (d.activeTroopCountWire !== undefined) {
        updated.activeTroopCountWire = d.activeTroopCountWire;
      }
      if (d.woundedTroopCountWire !== undefined) {
        updated.woundedTroopCountWire = d.woundedTroopCountWire;
      }
    }
    if (d.dirtyMask & CohortDirtyBit.MORALE) {
      if (d.moralePct !== undefined) updated.moralePct = d.moralePct;
    }
    return updated;
  });

  const fortDeltaMap = new Map<string, FortificationDeltaRecord>();
  for (const fd of envelope.payload.changedFortifications) {
    fortDeltaMap.set(fd.structureId, fd);
  }

  const nextFortifications = baseState.fortifications.map((fort) => {
    const fd = fortDeltaMap.get(fort.structureId);
    if (!fd) return fort;
    return {
      ...fort,
      integrityHpWire: fd.integrityHpWire,
      maxIntegrityHpWire: fd.maxIntegrityHpWire,
      breached: fd.breached,
    };
  });

  const reconstructed: AuthoritativeSiegeSectorState = {
    ...baseState,
    serverTick: envelope.serverTick,
    lastKeyframeTick: envelope.payload.baseKeyframeTick,
    cohorts: nextCohorts,
    fortifications: nextFortifications,
    stateHash: 0,
  };
  reconstructed.stateHash = computeSectorStateHash(reconstructed);
  return reconstructed;
}

// ============================================================================
// 6. 128-FRAME CLIENT-SIDE PREDICTION (CSP) RING BUFFER & RECONCILIATION
// ============================================================================

export const CSP_RING_BUFFER_CAPACITY = 128;
export const CSP_SMOOTH_THRESHOLD_QUANTIZED = 15; // 0.15m in 0.01m quantized units

export interface PredictedCommandFrame {
  clientSeq: number;
  cohortId: number;
  predictedPosXQuantized: number;
  predictedPosZQuantized: number;
  targetXQuantized: number;
  targetZQuantized: number;
  formation: SiegeFormationType;
}

export interface ClientReconciliationResult {
  mode: 'EXACT_MATCH' | 'HERMITE_SMOOTH' | 'HARD_ROLLBACK_REPLAY';
  positionErrorQuantized: number;
  reconciledPosXQuantized: number;
  reconciledPosZQuantized: number;
  replayedFramesCount: number;
}

export class ClientPredictionRingBuffer {
  private readonly buffer: (PredictedCommandFrame | null)[] = new Array(
    CSP_RING_BUFFER_CAPACITY
  ).fill(null);
  private latestSeq = 0;

  public recordFrame(frame: PredictedCommandFrame): void {
    const slot =
      ((frame.clientSeq % CSP_RING_BUFFER_CAPACITY) + CSP_RING_BUFFER_CAPACITY) %
      CSP_RING_BUFFER_CAPACITY;
    this.buffer[slot] = { ...frame };
    if (frame.clientSeq > this.latestSeq) {
      this.latestSeq = frame.clientSeq;
    }
  }

  public getFrame(clientSeq: number): PredictedCommandFrame | null {
    const slot =
      ((clientSeq % CSP_RING_BUFFER_CAPACITY) + CSP_RING_BUFFER_CAPACITY) %
      CSP_RING_BUFFER_CAPACITY;
    const candidate = this.buffer[slot];
    return candidate && candidate.clientSeq === clientSeq ? candidate : null;
  }

  public getUnacknowledgedFramesAfter(
    ackClientSeq: number,
    cohortId: number
  ): PredictedCommandFrame[] {
    const frames: PredictedCommandFrame[] = [];
    const startSeq = Math.max(1, ackClientSeq + 1);
    for (let seq = startSeq; seq <= this.latestSeq; seq++) {
      const f = this.getFrame(seq);
      if (f && f.cohortId === cohortId) {
        frames.push(f);
      }
    }
    return frames;
  }
}

/**
 * Reconciles the local client's predicted cohort coordinates at `ackClientSeq` against the
 * server's authoritative cohort state:
 * - Drift `=== 0`: `'EXACT_MATCH'`
 * - Drift `<= 15` quantized units (`0.15m`): `'HERMITE_SMOOTH'` (Cubic Hermite interpolation blend)
 * - Drift `> 15` quantized units (`> 0.15m`): `'HARD_ROLLBACK_REPLAY'` (snaps to server state and replays all unacknowledged frames `(ackClientSeq, latestSeq]`)
 */
export function reconcileClientPrediction(
  ringBuffer: ClientPredictionRingBuffer,
  ackClientSeq: number,
  authoritativeCohort: AuthoritativeCohortState,
  currentRenderXQuantized: number,
  currentRenderZQuantized: number
): ClientReconciliationResult {
  const ackedFrame = ringBuffer.getFrame(ackClientSeq);
  const refX = ackedFrame ? ackedFrame.predictedPosXQuantized : currentRenderXQuantized;
  const refZ = ackedFrame ? ackedFrame.predictedPosZQuantized : currentRenderZQuantized;

  const errX = authoritativeCohort.posXQuantized - refX;
  const errZ = authoritativeCohort.posZQuantized - refZ;
  const positionErrorQuantized = Math.hypot(errX, errZ);

  if (positionErrorQuantized === 0) {
    return {
      mode: 'EXACT_MATCH',
      positionErrorQuantized: 0,
      reconciledPosXQuantized: currentRenderXQuantized,
      reconciledPosZQuantized: currentRenderZQuantized,
      replayedFramesCount: 0,
    };
  }

  if (positionErrorQuantized <= CSP_SMOOTH_THRESHOLD_QUANTIZED) {
    // Cubic Hermite smooth factor h(t) = 3t^2 - 2t^3 at t = 0.35 (~0.27475) over 150ms
    const t = 0.35;
    const hermiteBlend = 3 * t * t - 2 * t * t * t;
    return {
      mode: 'HERMITE_SMOOTH',
      positionErrorQuantized,
      reconciledPosXQuantized: Math.round(
        currentRenderXQuantized +
          (authoritativeCohort.posXQuantized - currentRenderXQuantized) * hermiteBlend
      ),
      reconciledPosZQuantized: Math.round(
        currentRenderZQuantized +
          (authoritativeCohort.posZQuantized - currentRenderZQuantized) * hermiteBlend
      ),
      replayedFramesCount: 0,
    };
  }

  // Hard Rollback & Replay unacknowledged command frames (ackClientSeq, latestSeq]
  let replayX = authoritativeCohort.posXQuantized;
  let replayZ = authoritativeCohort.posZQuantized;
  const pendingFrames = ringBuffer.getUnacknowledgedFramesAfter(
    ackClientSeq,
    authoritativeCohort.cohortId
  );

  for (const frame of pendingFrames) {
    const dx = frame.targetXQuantized - replayX;
    const dz = frame.targetZQuantized - replayZ;
    const dist = Math.hypot(dx, dz);
    const speed = Math.max(4, Math.round(22 * FORMATION_SPEED_MODIFIER[frame.formation]));
    if (dist > 0) {
      replayX = Math.max(
        MIN_QUANTIZED_INT16,
        Math.min(MAX_QUANTIZED_INT16, replayX + Math.round((dx / dist) * Math.min(dist, speed)))
      );
      replayZ = Math.max(
        MIN_QUANTIZED_INT16,
        Math.min(MAX_QUANTIZED_INT16, replayZ + Math.round((dz / dist) * Math.min(dist, speed)))
      );
    }
  }

  return {
    mode: 'HARD_ROLLBACK_REPLAY',
    positionErrorQuantized,
    reconciledPosXQuantized: replayX,
    reconciledPosZQuantized: replayZ,
    replayedFramesCount: pendingFrames.length,
  };
}

// ============================================================================
// 7. MULTI-REGION REALM PERSISTENCE & CONSENSUS REPLICATION ENGINE
// ============================================================================

export type MultiRegionClusterId =
  'us-east-solara-1' | 'eu-central-valhalla-1' | 'ap-southeast-celestia-1';

export interface MultiRegionClusterNode {
  clusterId: MultiRegionClusterId;
  regionName: string;
  role: 'PRIMARY_AUTHORITATIVE' | 'HOT_STANDBY_REPLICA';
  status: 'ONLINE_HEALTHY' | 'REPLICATING';
  rttMs: number;
  lastSyncedTick: number;
  stateHash: number;
  persistedCommanderProfilesCount: number;
  replicationLagMs: number;
}

export interface PersistedRealmPlayerSnapshot {
  commanderId: string;
  commanderName: string;
  email: string;
  allianceTag: string;
  castleLevel: number;
  cultivationRealmIndex: number;
  vipTier: number;
  karma: number;
  garrisonTroopsWire: string;
  discoveredCodexCount: number;
  preferredRegion: MultiRegionClusterId;
  updatedAtIso: string;
}

export interface MultiRegionReplicationSnapshot {
  primaryClusterId: MultiRegionClusterId;
  activeSector: TerritorySectorCode;
  globalServerTick: number;
  consensusStateHash: number;
  allRegionsInQuorum: boolean;
  clusters: MultiRegionClusterNode[];
  persistedCommandersCount: number;
  lastDiskFlushIso: string;
}

export function buildMultiRegionReplicationStatus(
  primaryClusterId: MultiRegionClusterId,
  sectorState: AuthoritativeSiegeSectorState,
  persistedCommandersCount: number,
  lastDiskFlushIso: string
): MultiRegionReplicationSnapshot {
  const catalog: { id: MultiRegionClusterId; name: string; baseRtt: number }[] = [
    { id: 'us-east-solara-1', name: 'US-East (Solara Sovereign Core)', baseRtt: 18 },
    { id: 'eu-central-valhalla-1', name: 'EU-Central (Valhalla Bastion)', baseRtt: 64 },
    { id: 'ap-southeast-celestia-1', name: 'AP-Southeast (Celestia Jade Node)', baseRtt: 112 },
  ];

  const clusters: MultiRegionClusterNode[] = catalog.map((entry) => {
    const isPrimary = entry.id === primaryClusterId;
    return {
      clusterId: entry.id,
      regionName: entry.name,
      role: isPrimary ? 'PRIMARY_AUTHORITATIVE' : 'HOT_STANDBY_REPLICA',
      status: 'ONLINE_HEALTHY',
      rttMs: isPrimary ? entry.baseRtt : entry.baseRtt + 14,
      lastSyncedTick: sectorState.serverTick,
      stateHash: sectorState.stateHash,
      persistedCommanderProfilesCount: persistedCommandersCount,
      replicationLagMs: isPrimary ? 0 : 12,
    };
  });

  return {
    primaryClusterId,
    activeSector: sectorState.sector,
    globalServerTick: sectorState.serverTick,
    consensusStateHash: sectorState.stateHash,
    allRegionsInQuorum: clusters.every((c) => c.stateHash === sectorState.stateHash),
    clusters,
    persistedCommandersCount,
    lastDiskFlushIso,
  };
}
