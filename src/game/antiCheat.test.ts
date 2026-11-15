/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { ServerSessionInfo } from './adminModeration';
import {
  AntiCheatGuard,
  BATTLEFIELD_MAX_QUANTIZED,
  DEFAULT_MAX_PLAYER_RALLY_TROOPS,
  DEFAULT_MAX_PLAYER_REALM_INDEX,
  DEFAULT_MAX_PLAYER_TROOP_TIER,
  sanitizeCloudProfilePatch,
  validateRallyCommandAuthority,
  validateTroopCommandAuthority,
} from './antiCheat';
import {
  SiegeNetOpcode,
  applyRallyActionCommand,
  createInitialAuthoritativeSiegeSectorState,
  stepAuthoritativeSiegeTick,
} from './siegeNetProtocol';

function makePlayerSession(commanderId: string, clearance = 1): ServerSessionInfo {
  const isStaff = clearance >= 4;
  return {
    sessionId: `sess_${commanderId}`,
    commanderId,
    displayName: `Commander ${commanderId}`,
    email: isStaff ? 'creatergame31@gmail.com' : `${commanderId}@voxelrealms.example`,
    role: isStaff ? 'owner_admin' : 'player',
    clearanceLevel: clearance,
    isRootOwner: isStaff,
    permissions: {
      canAccessGmConsole: isStaff,
      canUseGodmodeAndCheats: isStaff,
      canSpawnTroopsAndResources: isStaff,
      canControlWorldTimeAndWeather: isStaff,
      canModeratePlayers: isStaff,
      canModerateChat: isStaff,
      canManageRoles: isStaff,
      canHandleSupportTickets: isStaff,
      isOfficialContact: isStaff,
    },
    issuedAtIso: new Date().toISOString(),
    expiresAtIso: new Date(Date.now() + 3_600_000).toISOString(),
  };
}

test('validateTroopCommandAuthority blocks Defender & rival cohort hijacking for normal players', () => {
  const sector = createInitialAuthoritativeSiegeSectorState('B2');
  const attackerSession = makePlayerSession('player-commander-01', 1);

  // Defender cohort #50 hijack -> 403
  const hijackDefender = validateTroopCommandAuthority({
    sectorState: sector,
    session: attackerSession,
    rawCmd: {
      cohortId: 50,
      clientSeq: 1,
      targetXQuantized: -8000,
      targetZQuantized: 0,
      facingAngleQuantized: 0,
      formation: 'LOOSE_SKIRMISH',
      primaryBranch: 'shieldbearer',
    },
  });
  assert.equal(hijackDefender.allowed, false);
  if (!hijackDefender.allowed) {
    assert.equal(hijackDefender.statusCode, 403);
    assert.equal(hijackDefender.violation, 'COHORT_OWNERSHIP_HIJACK');
  }

  // Rival attacker cohort #2 hijack by guest -> 403
  const rivalGuest = makePlayerSession('guest-attacker-99', 1);
  const hijackRival = validateTroopCommandAuthority({
    sectorState: sector,
    session: rivalGuest,
    rawCmd: {
      cohortId: 2,
      clientSeq: 1,
      targetXQuantized: 1200,
      targetZQuantized: 300,
      facingAngleQuantized: 0,
      formation: 'SHIELD_WALL',
      primaryBranch: 'shooter',
    },
  });
  assert.equal(hijackRival.allowed, false);
  if (!hijackRival.allowed) {
    assert.equal(hijackRival.statusCode, 403);
    assert.equal(hijackRival.violation, 'COHORT_OWNERSHIP_HIJACK');
  }

  // Staff/GM override allowed on Defender cohort
  const staffSession = makePlayerSession('owner-staff', 5);
  const staffResult = validateTroopCommandAuthority({
    sectorState: sector,
    session: staffSession,
    rawCmd: {
      cohortId: 50,
      clientSeq: 1,
      targetXQuantized: 100,
      targetZQuantized: 100,
      facingAngleQuantized: 0,
      formation: 'PHALANX_ADVANCE',
      primaryBranch: 'shieldbearer',
    },
  });
  assert.equal(staffResult.allowed, true);
});

test('validateTroopCommandAuthority blocks invalid enums, NaN coordinates, and replay sequences, while clamping overshoot', () => {
  const sector = createInitialAuthoritativeSiegeSectorState('B2');
  const session = makePlayerSession('player-commander-01', 1);

  const badEnum = validateTroopCommandAuthority({
    sectorState: sector,
    session,
    rawCmd: {
      cohortId: 0,
      clientSeq: 1,
      targetXQuantized: 500,
      targetZQuantized: 500,
      formation: 'GOD_HACK_MODE',
      primaryBranch: 'shieldbearer',
    },
  });
  assert.equal(badEnum.allowed, false);
  if (!badEnum.allowed) {
    assert.equal(badEnum.statusCode, 400);
    assert.equal(badEnum.violation, 'INVALID_ENUM_INJECTION');
  }

  const nanCoord = validateTroopCommandAuthority({
    sectorState: sector,
    session,
    rawCmd: {
      cohortId: 0,
      clientSeq: 2,
      targetXQuantized: Number.NaN,
      targetZQuantized: 500,
      formation: 'SHIELD_WALL',
      primaryBranch: 'shieldbearer',
    },
  });
  assert.equal(nanCoord.allowed, false);
  if (!nanCoord.allowed) {
    assert.equal(nanCoord.violation, 'OUT_OF_BOUNDS_TELEPORT');
  }

  const replayedSeq = validateTroopCommandAuthority({
    sectorState: sector,
    session,
    lastClientSeq: 10,
    rawCmd: {
      cohortId: 0,
      clientSeq: 9,
      targetXQuantized: 500,
      targetZQuantized: 500,
      formation: 'SHIELD_WALL',
      primaryBranch: 'shieldbearer',
    },
  });
  assert.equal(replayedSeq.allowed, false);
  if (!replayedSeq.allowed) {
    assert.equal(replayedSeq.violation, 'REPLAY_OR_STALE_SEQ');
  }

  const overshoot = validateTroopCommandAuthority({
    sectorState: sector,
    session,
    lastClientSeq: 10,
    rawCmd: {
      cohortId: 0,
      clientSeq: 11,
      targetXQuantized: 20_000,
      targetZQuantized: -25_000,
      formation: 'WEDGE_CHARGE',
      primaryBranch: 'bomber',
    },
  });
  assert.equal(overshoot.allowed, true);
  if (overshoot.allowed) {
    assert.equal(overshoot.command.targetXQuantized, BATTLEFIELD_MAX_QUANTIZED);
    assert.equal(overshoot.command.targetZQuantized, -BATTLEFIELD_MAX_QUANTIZED);
    assert.ok(overshoot.sanitizedWarnings.includes('waypoint_clamped_to_battlefield'));
  }
});

test('validateRallyCommandAuthority blocks rival rally launch/weapon hijacking & clamps non-staff caps', () => {
  let sector = createInitialAuthoritativeSiegeSectorState('B2');
  // Assign initiative ownership to specific player
  sector = {
    ...sector,
    activeRally: {
      ...sector.activeRally,
      initiatorCommanderId: 'vanguard-alpha',
    },
  };

  const rivalSession = makePlayerSession('rival-beta', 1);
  const hijackLaunch = validateRallyCommandAuthority({
    sectorState: sector,
    session: rivalSession,
    rawCmd: {
      action: 'LAUNCH_NOW',
      sector: 'B2',
      shieldbearersWire: '100',
      shootersWire: '100',
      bombersWire: '100',
      troopTier: 10,
      commanderRealmIndex: 5,
    },
  });
  assert.equal(hijackLaunch.allowed, false);
  if (!hijackLaunch.allowed) {
    assert.equal(hijackLaunch.statusCode, 403);
    assert.equal(hijackLaunch.violation, 'RALLY_AUTHORITY_HIJACK');
  }

  const validJoin = validateRallyCommandAuthority({
    sectorState: sector,
    session: rivalSession,
    rawCmd: {
      action: 'JOIN_RALLY',
      sector: 'B2',
      shieldbearersWire: '999999999999999',
      shootersWire: '50000000000',
      bombersWire: '1000',
      troopTier: 20,
      commanderRealmIndex: 22,
    },
  });
  assert.equal(validJoin.allowed, true);
  if (validJoin.allowed) {
    assert.equal(validJoin.command.commanderId, 'rival-beta');
    assert.equal(validJoin.command.commanderRealmIndex, DEFAULT_MAX_PLAYER_REALM_INDEX);
    assert.equal(validJoin.command.troopTier, DEFAULT_MAX_PLAYER_TROOP_TIER);
    assert.equal(validJoin.command.shieldbearersWire, DEFAULT_MAX_PLAYER_RALLY_TROOPS.toString(10));
  }

  // Attempting to JOIN_RALLY while LOCKED_MARCHING must be rejected
  const marchingSector = {
    ...sector,
    activeRally: {
      ...sector.activeRally,
      phase: 'LOCKED_MARCHING' as const,
    },
  };
  const joinLocked = validateRallyCommandAuthority({
    sectorState: marchingSector,
    session: rivalSession,
    rawCmd: {
      action: 'JOIN_RALLY',
      sector: 'B2',
      shieldbearersWire: '100',
      shootersWire: '0',
      bombersWire: '0',
      troopTier: 5,
      commanderRealmIndex: 2,
    },
  });
  assert.equal(joinLocked.allowed, false);
  if (!joinLocked.allowed) {
    assert.equal(joinLocked.violation, 'RALLY_PHASE_LOCKED');
  }
});

test('applyRallyActionCommand preserves exact BigInt sum when capping at 1T without float rounding drift', () => {
  const sector = createInitialAuthoritativeSiegeSectorState('B2');
  const next = applyRallyActionCommand(sector, {
    commanderId: 'test-vanguard',
    commanderName: 'Test Vanguard',
    commanderRealmIndex: 8,
    allianceTag: 'SOL',
    action: 'JOIN_RALLY',
    sector: 'B2',
    shieldbearersWire: '333333333333',
    shootersWire: '333333333333',
    bombersWire: '333333333333',
    troopTier: 18,
  });

  const contributor = next.activeRally.contributors.find((c) => c.commanderId === 'test-vanguard');
  assert.ok(contributor);
  const initialTotal = BigInt(sector.activeRally.totalCommittedTroopsWire);
  const sum =
    BigInt(contributor.shieldbearersWire) +
    BigInt(contributor.shootersWire) +
    BigInt(contributor.bombersWire);
  assert.equal(BigInt(next.activeRally.totalCommittedTroopsWire), 1_000_000_000_000n);
  // initialTotal + contributor sum === exactly 1_000_000_000_000n
  assert.equal(initialTotal + sum, 1_000_000_000_000n);
});

test('stepAuthoritativeSiegeTick resists poisoned invalid formation without producing NaN coordinates', () => {
  const sector = createInitialAuthoritativeSiegeSectorState('B2');
  const poisoned = {
    ...sector,
    cohorts: sector.cohorts.map((c, idx) =>
      idx === 0
        ? {
            ...c,
            formation: 'UNKNOWN_POISON' as unknown as typeof c.formation,
            targetXQuantized: c.posXQuantized + 500,
          }
        : c
    ),
  };

  const { nextState, deltaPacket } = stepAuthoritativeSiegeTick(poisoned);
  assert.equal(deltaPacket.opcode, SiegeNetOpcode.S2C_DELTA_SIEGE_UPDATE);
  assert.ok(Number.isFinite(nextState.cohorts[0].posXQuantized));
  assert.ok(Number.isFinite(nextState.cohorts[0].posZQuantized));
});

test('sanitizeCloudProfilePatch blocks non-staff castleLevel, realm & vipTier tampering', () => {
  const existingProfile = {
    castleLevel: 12,
    cultivationRealmIndex: 3,
    vipTier: 1,
    karma: 50,
    garrisonTroopsWire: '250000',
    discoveredCodexCount: 4,
    allianceTag: 'SOL',
  };

  const tamperRes = sanitizeCloudProfilePatch({
    existingProfile,
    incoming: {
      castleLevel: 100,
      cultivationRealmIndex: 22,
      vipTier: 3,
      garrisonTroopsWire: '9999999999999999',
    },
    isPrivilegedStaff: false,
  });

  assert.equal(tamperRes.patch.castleLevel, 25);
  assert.equal(tamperRes.patch.cultivationRealmIndex, 10);
  assert.equal(tamperRes.patch.vipTier, 1);
  assert.equal(tamperRes.patch.garrisonTroopsWire, '5000000000000');
  assert.ok(tamperRes.flaggedViolations.length >= 4);

  const staffRes = sanitizeCloudProfilePatch({
    existingProfile,
    incoming: { castleLevel: 100, vipTier: 3, cultivationRealmIndex: 22 },
    isPrivilegedStaff: true,
  });
  assert.equal(staffRes.flaggedViolations.length, 0);
  assert.equal(staffRes.patch.castleLevel, 100);
  assert.equal(staffRes.patch.vipTier, 3);
});

test('AntiCheatGuard quarantines repeat offenders after reaching strikeLimit within window', () => {
  const guard = new AntiCheatGuard({ windowMs: 60_000, strikeLimit: 6, quarantineMs: 60_000 });
  const now = 1_000_000;

  for (let i = 1; i <= 5; i++) {
    const res = guard.recordStrike('cheater-01', 'COHORT_OWNERSHIP_HIJACK', now + i * 100);
    assert.equal(res.quarantinedNow, false);
    assert.equal(res.strikeCount, i);
  }

  const sixth = guard.recordStrike('cheater-01', 'INVALID_ENUM_INJECTION', now + 600);
  assert.equal(sixth.quarantinedNow, true);
  assert.equal(sixth.strikeCount, 6);
  assert.equal(sixth.retryAfterSec, 60);

  const status = guard.isQuarantined('cheater-01', now + 10_000);
  assert.equal(status.quarantined, true);
  assert.ok(status.retryAfterSec >= 49);

  // After quarantine expiry and window rollover, player recovers cleanly
  const afterExpiry = guard.isQuarantined('cheater-01', now + 70_000);
  assert.equal(afterExpiry.quarantined, false);
});
