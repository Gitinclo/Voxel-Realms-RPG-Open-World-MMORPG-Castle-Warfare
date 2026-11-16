/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ServerSessionInfo } from './adminModeration';
import { MAX_CASTLE_TROOP_CAPACITY, MAX_RALLY_CAPACITY } from './math';
import {
  ALL_TERRITORY_SECTORS,
  AuthoritativeSiegeSectorState,
  MAX_QUANTIZED_INT16,
  MIN_QUANTIZED_INT16,
  PersistedRealmPlayerSnapshot,
  RallyActionCommandPacket,
  SiegeFormationType,
  SiegeWeaponAttachment,
  TerritorySectorCode,
  TroopBranch,
  TroopPositionCommandPacket,
  deserializeBigIntWire,
  serializeBigIntWire,
} from './siegeNetProtocol';

export const ALLOWED_FORMATIONS: readonly SiegeFormationType[] = [
  'SHIELD_WALL',
  'WEDGE_CHARGE',
  'LOOSE_SKIRMISH',
  'PHALANX_ADVANCE',
] as const;

export const ALLOWED_TROOP_BRANCHES: readonly TroopBranch[] = [
  'shieldbearer',
  'shooter',
  'bomber',
] as const;

export const ALLOWED_RALLY_ACTIONS: readonly RallyActionCommandPacket['action'][] = [
  'INITIATE_RALLY',
  'JOIN_RALLY',
  'LAUNCH_NOW',
  'CHANGE_WEAPON',
] as const;

export const ALLOWED_SIEGE_WEAPONS: readonly SiegeWeaponAttachment[] = [
  'BATTERING_RAM',
  'TREBUCHET_BATTERY',
  'ARCANE_BALLISTA',
  'SOULFIRE_CANNON',
] as const;

/** Quantitative battlefield perimeter (`[-120.0m, +120.0m]` at 0.01m resolution). */
export const BATTLEFIELD_MIN_QUANTIZED = -12_000;
export const BATTLEFIELD_MAX_QUANTIZED = 12_000;

/** Max single-commander contribution allowed without an elevated server-verified profile. */
export const DEFAULT_MAX_PLAYER_RALLY_TROOPS = 250_000_000_000n;
export const DEFAULT_MAX_PLAYER_REALM_INDEX = 8;
export const DEFAULT_MAX_PLAYER_TROOP_TIER = 18;

export type AntiCheatViolationCode =
  | 'COHORT_OWNERSHIP_HIJACK'
  | 'RALLY_AUTHORITY_HIJACK'
  | 'RALLY_PHASE_LOCKED'
  | 'INVALID_ENUM_INJECTION'
  | 'OUT_OF_BOUNDS_TELEPORT'
  | 'REPLAY_OR_STALE_SEQ'
  | 'STAT_PROGRESSION_TAMPER'
  | 'STRIKE_THRESHOLD_LOCKOUT';

export interface CommandValidationSuccess<T> {
  allowed: true;
  command: T;
  sanitizedWarnings: string[];
}

export interface CommandValidationFailure {
  allowed: false;
  statusCode: 400 | 403 | 429;
  violation: AntiCheatViolationCode;
  reason: string;
}

export type CommandValidationResult<T> = CommandValidationSuccess<T> | CommandValidationFailure;

function isFiniteInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Authoritatively validates a `TroopPositionCommandPacket` against:
 * - Allowed tactical formations & troop branches (prevents NaN physics injection)
 * - Quantitative battlefield bounds (prevents out-of-bounds teleportation)
 * - Cohort ownership (non-staff players cannot command Defender cohorts or rival players' cohorts)
 * - Monotonic client sequence numbers (prevents packet replay)
 */
export function validateTroopCommandAuthority(params: {
  sectorState: AuthoritativeSiegeSectorState;
  session: ServerSessionInfo;
  rawCmd: unknown;
  lastClientSeq?: number;
}): CommandValidationResult<TroopPositionCommandPacket> {
  const { sectorState, session, rawCmd, lastClientSeq = -1 } = params;

  if (!rawCmd || typeof rawCmd !== 'object') {
    return {
      allowed: false,
      statusCode: 400,
      violation: 'INVALID_ENUM_INJECTION',
      reason: 'Malformed troop command payload.',
    };
  }

  const candidate = rawCmd as Partial<TroopPositionCommandPacket>;

  if (
    !ALLOWED_FORMATIONS.includes(candidate.formation as SiegeFormationType) ||
    !ALLOWED_TROOP_BRANCHES.includes(candidate.primaryBranch as TroopBranch)
  ) {
    return {
      allowed: false,
      statusCode: 400,
      violation: 'INVALID_ENUM_INJECTION',
      reason: 'Rejected invalid formation or troop branch identifier.',
    };
  }

  if (!isFiniteInteger(candidate.cohortId)) {
    return {
      allowed: false,
      statusCode: 400,
      violation: 'INVALID_ENUM_INJECTION',
      reason: 'Invalid cohort identifier.',
    };
  }

  const cohortId = Math.trunc(candidate.cohortId);
  const targetCohort = sectorState.cohorts.find((c) => c.cohortId === cohortId);
  if (!targetCohort) {
    return {
      allowed: false,
      statusCode: 400,
      violation: 'COHORT_OWNERSHIP_HIJACK',
      reason: `Cohort #${cohortId} does not exist in sector ${sectorState.sector}.`,
    };
  }

  const isStaff = session.permissions.canAccessGmConsole;
  const ownsCohort =
    targetCohort.commanderId === session.commanderId ||
    (targetCohort.cohortId === 0 && targetCohort.commanderId === 'player-commander-01');

  if (!isStaff && (targetCohort.faction === 'DEFENDER' || !ownsCohort)) {
    return {
      allowed: false,
      statusCode: 403,
      violation: 'COHORT_OWNERSHIP_HIJACK',
      reason: `Commander ${session.commanderId} is not authorized to command ${targetCohort.faction} Cohort #${cohortId}.`,
    };
  }

  const clientSeq = isFiniteInteger(candidate.clientSeq)
    ? Math.max(0, Math.trunc(candidate.clientSeq))
    : 0;
  if (clientSeq > 0 && clientSeq <= lastClientSeq) {
    return {
      allowed: false,
      statusCode: 400,
      violation: 'REPLAY_OR_STALE_SEQ',
      reason: `Stale or replayed command sequence (#${clientSeq} <= #${lastClientSeq}).`,
    };
  }

  if (
    !isFiniteInteger(candidate.targetXQuantized) ||
    !isFiniteInteger(candidate.targetZQuantized)
  ) {
    return {
      allowed: false,
      statusCode: 400,
      violation: 'OUT_OF_BOUNDS_TELEPORT',
      reason: 'Non-finite waypoint coordinate rejected.',
    };
  }

  const sanitizedWarnings: string[] = [];
  const rawX = Math.trunc(candidate.targetXQuantized);
  const rawZ = Math.trunc(candidate.targetZQuantized);

  if (
    rawX < MIN_QUANTIZED_INT16 ||
    rawX > MAX_QUANTIZED_INT16 ||
    rawZ < MIN_QUANTIZED_INT16 ||
    rawZ > MAX_QUANTIZED_INT16
  ) {
    return {
      allowed: false,
      statusCode: 400,
      violation: 'OUT_OF_BOUNDS_TELEPORT',
      reason: 'Waypoint coordinate outside int16 wire bounds.',
    };
  }

  const clampedX = Math.max(BATTLEFIELD_MIN_QUANTIZED, Math.min(BATTLEFIELD_MAX_QUANTIZED, rawX));
  const clampedZ = Math.max(BATTLEFIELD_MIN_QUANTIZED, Math.min(BATTLEFIELD_MAX_QUANTIZED, rawZ));
  if (clampedX !== rawX || clampedZ !== rawZ) {
    sanitizedWarnings.push('waypoint_clamped_to_battlefield');
  }

  const facingAngleQuantized = isFiniteInteger(candidate.facingAngleQuantized)
    ? Math.max(0, Math.min(65535, Math.trunc(candidate.facingAngleQuantized)))
    : 0;

  return {
    allowed: true,
    sanitizedWarnings,
    command: {
      commanderId: session.commanderId,
      cohortId,
      clientSeq,
      targetXQuantized: clampedX,
      targetZQuantized: clampedZ,
      facingAngleQuantized,
      formation: candidate.formation as SiegeFormationType,
      primaryBranch: candidate.primaryBranch as TroopBranch,
    },
  };
}

/**
 * Authoritatively validates and binds a `RallyActionCommandPacket` to verified server identity
 * and commander stats (preventing weapon/launch hijacking, closed-phase reinforcement, and realm/tier spoofing).
 */
export function validateRallyCommandAuthority(params: {
  sectorState: AuthoritativeSiegeSectorState;
  session: ServerSessionInfo;
  serverCommander?: PersistedRealmPlayerSnapshot;
  rawCmd: unknown;
}): CommandValidationResult<RallyActionCommandPacket> {
  const { sectorState, session, serverCommander, rawCmd } = params;

  if (!rawCmd || typeof rawCmd !== 'object') {
    return {
      allowed: false,
      statusCode: 400,
      violation: 'INVALID_ENUM_INJECTION',
      reason: 'Malformed rally command payload.',
    };
  }

  const candidate = rawCmd as Partial<RallyActionCommandPacket>;
  if (!ALLOWED_RALLY_ACTIONS.includes(candidate.action as RallyActionCommandPacket['action'])) {
    return {
      allowed: false,
      statusCode: 400,
      violation: 'INVALID_ENUM_INJECTION',
      reason: 'Rejected invalid rally action.',
    };
  }

  if (
    candidate.siegeWeapon !== undefined &&
    !ALLOWED_SIEGE_WEAPONS.includes(candidate.siegeWeapon as SiegeWeaponAttachment)
  ) {
    return {
      allowed: false,
      statusCode: 400,
      violation: 'INVALID_ENUM_INJECTION',
      reason: 'Rejected invalid siege weapon attachment.',
    };
  }

  const action = candidate.action as RallyActionCommandPacket['action'];
  const rally = sectorState.activeRally;
  const isStaff = session.permissions.canAccessGmConsole;
  const isInitiatorOrDefaultVanguard =
    rally.initiatorCommanderId === session.commanderId ||
    rally.initiatorCommanderId === 'player-commander-01';

  if (
    (action === 'LAUNCH_NOW' || action === 'CHANGE_WEAPON') &&
    !isStaff &&
    !isInitiatorOrDefaultVanguard
  ) {
    return {
      allowed: false,
      statusCode: 403,
      violation: 'RALLY_AUTHORITY_HIJACK',
      reason: `Only the rally initiator (${rally.initiatorCommanderId}) or verified staff may execute ${action}.`,
    };
  }

  if (action === 'JOIN_RALLY' && rally.phase !== 'MUSTER_OPEN') {
    return {
      allowed: false,
      statusCode: 400,
      violation: 'RALLY_PHASE_LOCKED',
      reason: `Cannot reinforce rally while phase is ${rally.phase}.`,
    };
  }

  if (
    action === 'INITIATE_RALLY' &&
    (rally.phase === 'LOCKED_MARCHING' || rally.phase === 'SIEGE_CLASH') &&
    !isStaff
  ) {
    return {
      allowed: false,
      statusCode: 400,
      violation: 'RALLY_PHASE_LOCKED',
      reason: `Cannot overwrite active ${rally.phase} rally prior to resolution.`,
    };
  }

  const sanitizedWarnings: string[] = [];

  // Derive authoritative realm & troop cap from server commander profile unless privileged staff
  const isPrivileged = session.permissions.canUseGodmodeAndCheats;
  const maxAllowedRealm = isPrivileged
    ? 22
    : serverCommander
      ? Math.max(DEFAULT_MAX_PLAYER_REALM_INDEX, serverCommander.cultivationRealmIndex)
      : DEFAULT_MAX_PLAYER_REALM_INDEX;
  const requestedRealm = isFiniteInteger(candidate.commanderRealmIndex)
    ? Math.max(0, Math.min(22, Math.trunc(candidate.commanderRealmIndex)))
    : 0;
  const authoritativeRealm = Math.min(requestedRealm, maxAllowedRealm);
  if (authoritativeRealm !== requestedRealm) {
    sanitizedWarnings.push('commanderRealmIndex_clamped');
  }

  const maxAllowedTier = isPrivileged ? 20 : DEFAULT_MAX_PLAYER_TROOP_TIER;
  const requestedTier = isFiniteInteger(candidate.troopTier)
    ? Math.max(1, Math.min(20, Math.trunc(candidate.troopTier)))
    : 1;
  const authoritativeTier = Math.min(requestedTier, maxAllowedTier);
  if (authoritativeTier !== requestedTier) {
    sanitizedWarnings.push('troopTier_clamped');
  }

  const perBranchCap = isPrivileged ? MAX_RALLY_CAPACITY : DEFAULT_MAX_PLAYER_RALLY_TROOPS;
  const shield = deserializeBigIntWire(String(candidate.shieldbearersWire ?? '0'), perBranchCap);
  const shooter = deserializeBigIntWire(String(candidate.shootersWire ?? '0'), perBranchCap);
  const bomber = deserializeBigIntWire(String(candidate.bombersWire ?? '0'), perBranchCap);

  const sector: TerritorySectorCode =
    candidate.sector && ALL_TERRITORY_SECTORS.includes(candidate.sector)
      ? candidate.sector
      : sectorState.sector;

  const cleanAllianceTag =
    typeof candidate.allianceTag === 'string' && candidate.allianceTag.trim()
      ? candidate.allianceTag
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9_-]/g, '')
          .slice(0, 8) ||
        serverCommander?.allianceTag ||
        'SOL'
      : serverCommander?.allianceTag || 'SOL';

  return {
    allowed: true,
    sanitizedWarnings,
    command: {
      commanderId: session.commanderId,
      commanderName: session.displayName,
      commanderRealmIndex: authoritativeRealm,
      allianceTag: cleanAllianceTag,
      action,
      sector,
      shieldbearersWire: serializeBigIntWire(shield, perBranchCap),
      shootersWire: serializeBigIntWire(shooter, perBranchCap),
      bombersWire: serializeBigIntWire(bomber, perBranchCap),
      troopTier: authoritativeTier,
      siegeWeapon: candidate.siegeWeapon as SiegeWeaponAttachment | undefined,
    },
  };
}

/**
 * Validates and bounds PostgreSQL cloud profile / save patches to defend against client memory tampering.
 */
export function sanitizeCloudProfilePatch(params: {
  existingProfile?: {
    castleLevel: number;
    cultivationRealmIndex: number;
    vipTier: number;
    karma: number;
    garrisonTroopsWire: string;
    discoveredCodexCount: number;
    allianceTag: string;
  } | null;
  incoming: Record<string, unknown>;
  isPrivilegedStaff: boolean;
}): {
  patch: {
    commanderName?: string;
    allianceTag?: string;
    castleLevel?: number;
    cultivationRealmIndex?: number;
    vipTier?: number;
    karma?: number;
    garrisonTroopsWire?: string;
    discoveredCodexCount?: number;
    preferredRegion?: string;
    activeSector?: string;
  };
  flaggedViolations: string[];
} {
  const { existingProfile, incoming, isPrivilegedStaff } = params;
  const flaggedViolations: string[] = [];

  const cleanName =
    typeof incoming.commanderName === 'string' && incoming.commanderName.trim()
      ? incoming.commanderName.trim().slice(0, 48)
      : undefined;

  const cleanTag =
    typeof incoming.allianceTag === 'string' && incoming.allianceTag.trim()
      ? incoming.allianceTag
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9_-]/g, '')
          .slice(0, 8)
      : undefined;

  const baseCastle = existingProfile?.castleLevel ?? 12;
  const maxCastleAllowed = isPrivilegedStaff ? 100 : Math.min(100, Math.max(baseCastle + 5, 25));
  let castleLevel = existingProfile?.castleLevel;
  if (isFiniteInteger(incoming.castleLevel)) {
    const requested = Math.max(0, Math.min(100, Math.trunc(incoming.castleLevel)));
    if (requested > maxCastleAllowed) {
      flaggedViolations.push(`castleLevel_jump(${requested}>${maxCastleAllowed})`);
      castleLevel = maxCastleAllowed;
    } else {
      castleLevel = requested;
    }
  }

  const baseRealm = existingProfile?.cultivationRealmIndex ?? 4;
  const maxRealmAllowed = isPrivilegedStaff ? 22 : Math.min(22, Math.max(baseRealm + 2, 10));
  let cultivationRealmIndex = existingProfile?.cultivationRealmIndex;
  if (isFiniteInteger(incoming.cultivationRealmIndex)) {
    const requested = Math.max(0, Math.min(22, Math.trunc(incoming.cultivationRealmIndex)));
    if (requested > maxRealmAllowed) {
      flaggedViolations.push(`cultivationRealmIndex_jump(${requested}>${maxRealmAllowed})`);
      cultivationRealmIndex = maxRealmAllowed;
    } else {
      cultivationRealmIndex = requested;
    }
  }

  // Non-staff players cannot self-escalate vipTier above existing server grant via raw API PUT
  let vipTier = existingProfile?.vipTier ?? 0;
  if (isFiniteInteger(incoming.vipTier)) {
    const requested = Math.max(0, Math.min(3, Math.trunc(incoming.vipTier)));
    if (isPrivilegedStaff) {
      vipTier = requested;
    } else if (requested > vipTier) {
      flaggedViolations.push(`vipTier_tamper(${requested}>${vipTier})`);
    } else {
      vipTier = requested;
    }
  }

  let karma = existingProfile?.karma;
  if (isFiniteInteger(incoming.karma)) {
    karma = Math.max(-100_000, Math.min(100_000, Math.trunc(incoming.karma)));
  }

  let garrisonTroopsWire = existingProfile?.garrisonTroopsWire;
  if (typeof incoming.garrisonTroopsWire === 'string') {
    const parsed = deserializeBigIntWire(incoming.garrisonTroopsWire, MAX_CASTLE_TROOP_CAPACITY);
    const existingTroops = deserializeBigIntWire(
      existingProfile?.garrisonTroopsWire ?? '0',
      MAX_CASTLE_TROOP_CAPACITY
    );
    const nonStaffMax =
      existingTroops > 1_000_000_000_000n ? existingTroops * 2n : 5_000_000_000_000n;
    const cap = isPrivilegedStaff ? MAX_CASTLE_TROOP_CAPACITY : nonStaffMax;
    if (parsed > cap) {
      flaggedViolations.push('garrisonTroopsWire_exceeds_progression_cap');
      garrisonTroopsWire = serializeBigIntWire(cap, MAX_CASTLE_TROOP_CAPACITY);
    } else {
      garrisonTroopsWire = parsed.toString(10);
    }
  }

  let discoveredCodexCount = existingProfile?.discoveredCodexCount;
  if (isFiniteInteger(incoming.discoveredCodexCount)) {
    discoveredCodexCount = Math.max(0, Math.min(500, Math.trunc(incoming.discoveredCodexCount)));
  }

  return {
    patch: {
      commanderName: cleanName,
      allianceTag: cleanTag,
      castleLevel,
      cultivationRealmIndex,
      vipTier,
      karma,
      garrisonTroopsWire,
      discoveredCodexCount,
      preferredRegion:
        typeof incoming.preferredRegion === 'string'
          ? incoming.preferredRegion.slice(0, 48)
          : undefined,
      activeSector:
        typeof incoming.activeSector === 'string' &&
        ALL_TERRITORY_SECTORS.includes(incoming.activeSector as TerritorySectorCode)
          ? incoming.activeSector
          : undefined,
    },
    flaggedViolations,
  };
}

interface StrikeBucket {
  strikes: Array<{ ts: number; code: AntiCheatViolationCode }>;
  lockedUntilMs: number;
}

/**
 * Sliding-window anti-cheat strike & automatic quarantine guard for multiplayer sessions.
 */
export class AntiCheatGuard {
  private readonly buckets = new Map<string, StrikeBucket>();
  private readonly windowMs: number;
  private readonly strikeLimit: number;
  private readonly quarantineMs: number;

  constructor(params?: { windowMs?: number; strikeLimit?: number; quarantineMs?: number }) {
    this.windowMs = params?.windowMs ?? 60_000;
    this.strikeLimit = params?.strikeLimit ?? 6;
    this.quarantineMs = params?.quarantineMs ?? 60_000;
  }

  public isQuarantined(
    subjectKey: string,
    nowMs: number = Date.now(),
    isRootImmune: boolean = false
  ): { quarantined: boolean; retryAfterSec: number; strikeCount: number } {
    if (isRootImmune) {
      return { quarantined: false, retryAfterSec: 0, strikeCount: 0 };
    }
    const bucket = this.buckets.get(subjectKey);
    if (!bucket) return { quarantined: false, retryAfterSec: 0, strikeCount: 0 };

    bucket.strikes = bucket.strikes.filter((s) => nowMs - s.ts <= this.windowMs);
    if (bucket.lockedUntilMs > nowMs) {
      return {
        quarantined: true,
        retryAfterSec: Math.max(1, Math.ceil((bucket.lockedUntilMs - nowMs) / 1000)),
        strikeCount: bucket.strikes.length,
      };
    }

    if (bucket.strikes.length === 0) {
      this.buckets.delete(subjectKey);
    }
    return { quarantined: false, retryAfterSec: 0, strikeCount: bucket.strikes.length };
  }

  public recordStrike(
    subjectKey: string,
    code: AntiCheatViolationCode,
    nowMs: number = Date.now(),
    isRootImmune: boolean = false
  ): {
    strikeCount: number;
    quarantinedNow: boolean;
    retryAfterSec: number;
  } {
    if (isRootImmune) {
      return { strikeCount: 0, quarantinedNow: false, retryAfterSec: 0 };
    }
    let bucket = this.buckets.get(subjectKey);
    if (!bucket) {
      bucket = { strikes: [], lockedUntilMs: 0 };
      this.buckets.set(subjectKey, bucket);
    }

    bucket.strikes = bucket.strikes.filter((s) => nowMs - s.ts <= this.windowMs);
    bucket.strikes.push({ ts: nowMs, code });

    let quarantinedNow = false;
    if (bucket.strikes.length >= this.strikeLimit && bucket.lockedUntilMs <= nowMs) {
      bucket.lockedUntilMs = nowMs + this.quarantineMs;
      quarantinedNow = true;
    }

    const retryAfterSec =
      bucket.lockedUntilMs > nowMs
        ? Math.max(1, Math.ceil((bucket.lockedUntilMs - nowMs) / 1000))
        : 0;

    return {
      strikeCount: bucket.strikes.length,
      quarantinedNow,
      retryAfterSec,
    };
  }
}
