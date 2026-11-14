/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_MODERATED_PLAYERS,
  PRIMARY_ADMIN_EMAIL,
  applyModerationAction,
} from './adminModeration';
import { MAX_CASTLE_TROOP_CAPACITY, MAX_RALLY_CAPACITY } from './math';
import {
  authorizeStaffPermission,
  bindSiegeCommandToSession,
  extractSessionTokenFromHeaders,
  issueSessionTokenForOperator,
  issueSessionTokenForPlayer,
  redactCommanderForPublicStatus,
  resolveAuthenticatedSession,
  resolveServerRuntimeSecurityConfig,
  sanitizeAndValidateSyncPayload,
  verifyOperatorPasskey,
  verifySessionToken,
} from './serverAuth';

const TEST_SECRET = '0123456789abcdef0123456789abcdef';
const TEST_PASSKEY = 'super-secret-operator-key-2026';

test('resolveServerRuntimeSecurityConfig uses ephemeral CSPRNG secret if unset in production while keeping admin login fail-closed', () => {
  const prodFallback = resolveServerRuntimeSecurityConfig({
    NODE_ENV: 'production',
    VOXEL_SESSION_SECRET: 'too-short',
  });
  assert.equal(prodFallback.isProduction, true);
  assert.equal(prodFallback.failClosedMisconfigured, false);
  assert.equal(prodFallback.ephemeralSessionSecretGenerated, true);
  assert.ok(prodFallback.sessionSecret.length >= 64);
  assert.equal(prodFallback.adminPasskey, null);

  const prodGood = resolveServerRuntimeSecurityConfig({
    NODE_ENV: 'production',
    VOXEL_SESSION_SECRET: TEST_SECRET,
    VOXEL_ADMIN_PASSKEY: TEST_PASSKEY,
  });
  assert.equal(prodGood.failClosedMisconfigured, false);
  assert.equal(prodGood.ephemeralSessionSecretGenerated, false);
  assert.equal(prodGood.adminPasskey, TEST_PASSKEY);

  const devEphemeral = resolveServerRuntimeSecurityConfig({ NODE_ENV: 'development' });
  assert.equal(devEphemeral.failClosedMisconfigured, false);
  assert.equal(devEphemeral.ephemeralDevPasskeyGenerated, true);
  assert.ok(devEphemeral.sessionSecret.length >= 32);
  assert.ok(devEphemeral.adminPasskey && devEphemeral.adminPasskey.length >= 16);
});

test('HMAC-SHA256 session tokens verify cleanly and reject tampering or expiry', () => {
  const now = 1_800_000_000_000;
  const issued = issueSessionTokenForPlayer({
    commanderId: 'player-commander-99',
    displayName: 'Rogue Vanguard',
    email: PRIMARY_ADMIN_EMAIL, // Even claiming root email cannot escalate player_session!
    secret: TEST_SECRET,
    nowMs: now,
    ttlMs: 60_000,
  });

  // Token must remain strictly player-scoped (Lv.1, no staff access)
  assert.equal(issued.session.role, 'player');
  assert.equal(issued.session.clearanceLevel, 1);
  assert.equal(issued.session.isRootOwner, false);
  assert.equal(issued.session.permissions.canModeratePlayers, false);

  const validCheck = verifySessionToken(issued.token, TEST_SECRET, now + 10_000);
  assert.equal(validCheck.valid, true);

  // Tamper payload character -> rejected by timingSafeEqual HMAC check
  const parts = issued.token.split('.');
  const tamperedToken = `${parts[0].slice(0, -2)}AA.${parts[1]}`;
  const tamperCheck = verifySessionToken(tamperedToken, TEST_SECRET, now + 10_000);
  assert.equal(tamperCheck.valid, false);

  // Wrong secret -> rejected
  const wrongSecretCheck = verifySessionToken(issued.token, 'wrong-secret-0123456789abcdef', now);
  assert.equal(wrongSecretCheck.valid, false);

  // Expired -> rejected
  const expiredCheck = verifySessionToken(issued.token, TEST_SECRET, now + 65_000);
  assert.equal(expiredCheck.valid, false);

  // Resolving player token against roster NEVER escalates email creatergame31@gmail.com to owner_admin
  const resolvedPlayer = resolveAuthenticatedSession({
    token: issued.token,
    secret: TEST_SECRET,
    roster: INITIAL_MODERATED_PLAYERS,
    nowMs: now + 5_000,
  });
  assert.equal(resolvedPlayer.authenticated, true);
  if (resolvedPlayer.authenticated) {
    assert.equal(resolvedPlayer.session.role, 'player');
    assert.equal(resolvedPlayer.session.permissions.canAccessGmConsole, false);
  }
});

test('operator login requires timing-safe passkey and roster staff role', () => {
  assert.equal(verifyOperatorPasskey(TEST_PASSKEY, TEST_PASSKEY), true);
  assert.equal(verifyOperatorPasskey('wrong-key', TEST_PASSKEY), false);
  assert.equal(verifyOperatorPasskey('', TEST_PASSKEY), false);
  assert.equal(verifyOperatorPasskey(TEST_PASSKEY, null), false);

  // Wrong passkey -> 401
  const badPass = issueSessionTokenForOperator({
    email: PRIMARY_ADMIN_EMAIL,
    passkey: 'incorrect',
    configuredPasskey: TEST_PASSKEY,
    roster: INITIAL_MODERATED_PLAYERS,
    secret: TEST_SECRET,
  });
  assert.equal(badPass.ok, false);
  if (!badPass.ok) assert.equal(badPass.statusCode, 401);

  // Unconfigured passkey -> 503 fail-closed
  const noPassConfig = issueSessionTokenForOperator({
    email: PRIMARY_ADMIN_EMAIL,
    passkey: TEST_PASSKEY,
    configuredPasskey: null,
    roster: INITIAL_MODERATED_PLAYERS,
    secret: TEST_SECRET,
  });
  assert.equal(noPassConfig.ok, false);
  if (!noPassConfig.ok) assert.equal(noPassConfig.statusCode, 503);

  // Non-staff player even with passkey -> 403
  const nonStaff = issueSessionTokenForOperator({
    email: 'chronos.titan@voxelrealms.example',
    passkey: TEST_PASSKEY,
    configuredPasskey: TEST_PASSKEY,
    roster: INITIAL_MODERATED_PLAYERS,
    secret: TEST_SECRET,
  });
  assert.equal(nonStaff.ok, false);
  if (!nonStaff.ok) assert.equal(nonStaff.statusCode, 403);

  // Root Admin with valid passkey -> 200 signed operator session
  const rootOp = issueSessionTokenForOperator({
    email: PRIMARY_ADMIN_EMAIL,
    passkey: TEST_PASSKEY,
    configuredPasskey: TEST_PASSKEY,
    roster: INITIAL_MODERATED_PLAYERS,
    secret: TEST_SECRET,
  });
  assert.equal(rootOp.ok, true);
  if (rootOp.ok) {
    assert.equal(rootOp.session.role, 'owner_admin');
    assert.equal(rootOp.session.clearanceLevel, 999);
    assert.equal(rootOp.session.isRootOwner, true);
  }
});

test('authorizeStaffPermission fails closed on anonymous, player, and revoked staff sessions', () => {
  const anonRes = authorizeStaffPermission(null, 'canModeratePlayers');
  assert.equal(anonRes.authorized, false);
  if (!anonRes.authorized) assert.equal(anonRes.statusCode, 401);

  const playerIssued = issueSessionTokenForPlayer({
    commanderId: 'plr-1',
    displayName: 'Mortal',
    email: 'mortal@voxelrealms.example',
    secret: TEST_SECRET,
  });
  const playerAuthz = authorizeStaffPermission(playerIssued.session, 'canModeratePlayers');
  assert.equal(playerAuthz.authorized, false);
  if (!playerAuthz.authorized) assert.equal(playerAuthz.statusCode, 403);

  // Moderator Seraphina logs in, can moderate chat/players, CANNOT manage roles
  const modIssued = issueSessionTokenForOperator({
    email: 'seraphina.nova@voxelrealms.example',
    passkey: TEST_PASSKEY,
    configuredPasskey: TEST_PASSKEY,
    roster: INITIAL_MODERATED_PLAYERS,
    secret: TEST_SECRET,
  });
  assert.equal(modIssued.ok, true);
  if (modIssued.ok) {
    assert.equal(
      authorizeStaffPermission(modIssued.session, 'canModeratePlayers').authorized,
      true
    );
    const rolePerm = authorizeStaffPermission(modIssued.session, 'canManageRoles');
    assert.equal(rolePerm.authorized, false);
    if (!rolePerm.authorized) assert.equal(rolePerm.statusCode, 403);

    // If Root Admin revokes Seraphina's moderator role on server roster, existing token loses staff clearance immediately
    const modResult = applyModerationAction({
      roster: INITIAL_MODERATED_PLAYERS,
      targetPlayerId: 'usr_seraphina',
      action: 'revoke_staff',
      reason: 'Rotation audit',
      actorEmail: PRIMARY_ADMIN_EMAIL,
    });
    assert.equal(modResult.success, true);

    const reevaluated = resolveAuthenticatedSession({
      token: modIssued.token,
      secret: TEST_SECRET,
      roster: modResult.updatedRoster,
    });
    assert.equal(reevaluated.authenticated, true);
    if (reevaluated.authenticated) {
      assert.equal(reevaluated.session.role, 'player');
      assert.equal(
        authorizeStaffPermission(reevaluated.session, 'canModeratePlayers').authorized,
        false
      );
    }
  }
});

test('sanitizeAndValidateSyncPayload blocks stat spoofing by non-staff and binds session identity', () => {
  const playerIssued = issueSessionTokenForPlayer({
    commanderId: 'player-legit-07',
    displayName: 'Legit Cultivator',
    email: 'legit@voxelrealms.example',
    secret: TEST_SECRET,
  });

  const existingSnapshot = {
    commanderId: 'player-legit-07',
    commanderName: 'Legit Cultivator',
    email: 'legit@voxelrealms.example',
    allianceTag: 'SOL',
    castleLevel: 12,
    cultivationRealmIndex: 3,
    vipTier: 1,
    karma: 50,
    garrisonTroopsWire: '250000',
    discoveredCodexCount: 4,
    preferredRegion: 'us-east-solara-1' as const,
    updatedAtIso: '2026-11-14T00:00:00.000Z',
  };

  // Player tries to spoof commanderId, email, castleLevel=100, vipTier=3, and 999999999999999999 troops
  const playerAttempt = sanitizeAndValidateSyncPayload({
    existing: existingSnapshot,
    incomingBody: {
      commanderId: 'player-commander-01',
      email: PRIMARY_ADMIN_EMAIL,
      castleLevel: 100,
      cultivationRealmIndex: 22,
      vipTier: 3,
      garrisonTroopsWire: '99999999999999999999',
      preferredRegion: 'eu-central-valhalla-1',
    },
    session: playerIssued.session,
    defaultClusterId: 'us-east-solara-1',
  });

  assert.equal(playerAttempt.snapshot.commanderId, 'player-legit-07');
  assert.equal(playerAttempt.snapshot.email, 'legit@voxelrealms.example');
  assert.equal(playerAttempt.snapshot.castleLevel, 12);
  assert.equal(playerAttempt.snapshot.vipTier, 1);
  assert.equal(playerAttempt.snapshot.garrisonTroopsWire, '250000');
  assert.equal(playerAttempt.snapshot.preferredRegion, 'eu-central-valhalla-1');
  assert.ok(playerAttempt.sanitizedFields.includes('castleLevel'));
  assert.ok(playerAttempt.sanitizedFields.includes('email'));

  // Staff with GM permission gets clamped at domain ceilings (e.g. castleLevel <= 100, garrison <= 1000T)
  const rootOp = issueSessionTokenForOperator({
    email: PRIMARY_ADMIN_EMAIL,
    passkey: TEST_PASSKEY,
    configuredPasskey: TEST_PASSKEY,
    roster: INITIAL_MODERATED_PLAYERS,
    secret: TEST_SECRET,
  });
  assert.equal(rootOp.ok, true);
  if (rootOp.ok) {
    const clampedGm = sanitizeAndValidateSyncPayload({
      existing: existingSnapshot,
      incomingBody: {
        castleLevel: 999,
        vipTier: 99,
        garrisonTroopsWire: '999999999999999999999',
      },
      session: rootOp.session,
      defaultClusterId: 'us-east-solara-1',
    });
    assert.equal(clampedGm.snapshot.castleLevel, 100);
    assert.equal(clampedGm.snapshot.vipTier, 3);
    assert.equal(clampedGm.snapshot.garrisonTroopsWire, MAX_CASTLE_TROOP_CAPACITY.toString());
  }
});

test('bindSiegeCommandToSession, extractSessionTokenFromHeaders & redactCommanderForPublicStatus enforce identity isolation', () => {
  const playerIssued = issueSessionTokenForPlayer({
    commanderId: 'real-session-cmdr',
    displayName: 'Verified Commander',
    email: 'private.secret@example.com',
    secret: TEST_SECRET,
  });

  const bound = bindSiegeCommandToSession({
    session: playerIssued.session,
    troopCmd: {
      commanderId: 'spoofed-id',
      cohortId: 120,
      clientSeq: 5,
      targetXQuantized: 100,
      targetZQuantized: 200,
      facingAngleQuantized: 0,
      formation: 'SHIELD_WALL',
      primaryBranch: 'shieldbearer',
    },
    rallyCmd: {
      commanderId: 'spoofed-id',
      commanderName: 'Fake Admin',
      commanderRealmIndex: 99,
      allianceTag: 'SOL',
      action: 'JOIN_RALLY',
      sector: 'B2',
      shieldbearersWire: '99999999999999999999',
      shootersWire: '-50',
      bombersWire: '100',
      troopTier: 99,
    },
  });

  assert.equal(bound.troopCmd?.commanderId, 'real-session-cmdr');
  assert.equal(bound.troopCmd?.cohortId, 99);
  assert.equal(bound.rallyCmd?.commanderId, 'real-session-cmdr');
  assert.equal(bound.rallyCmd?.commanderName, 'Verified Commander');
  assert.equal(bound.rallyCmd?.shieldbearersWire, MAX_RALLY_CAPACITY.toString());
  assert.equal(bound.rallyCmd?.shootersWire, '0');
  assert.equal(bound.rallyCmd?.troopTier, 20);

  assert.equal(
    extractSessionTokenFromHeaders({
      authorizationHeader: 'Bearer abc.def',
      cookieHeader: 'vr_session=cookie.tok',
    }),
    'abc.def'
  );
  assert.equal(
    extractSessionTokenFromHeaders({ cookieHeader: 'foo=1; vr_session=cookie.tok' }),
    'cookie.tok'
  );

  const redacted = redactCommanderForPublicStatus({
    commanderId: 'c1',
    commanderName: 'Alpha',
    email: 'private.secret@example.com',
    allianceTag: 'SOL',
    castleLevel: 50,
    cultivationRealmIndex: 5,
    vipTier: 2,
    karma: 10,
    garrisonTroopsWire: '1000',
    discoveredCodexCount: 3,
    preferredRegion: 'us-east-solara-1',
    updatedAtIso: '2026-11-14T00:00:00.000Z',
  });
  assert.equal('email' in redacted, false);
  assert.equal(redacted.emailRedacted, true);
});
