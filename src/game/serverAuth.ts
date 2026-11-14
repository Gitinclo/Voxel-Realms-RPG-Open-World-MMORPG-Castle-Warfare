/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';
import {
  AdminPermissions,
  ModeratedPlayerRecord,
  PRIMARY_ADMIN_EMAIL,
  SecurityAuditEntry,
  ServerSessionInfo,
  StaffRole,
  isPrimaryAdminAccount,
  normalizeAccountEmail,
  verifyAccountPrivileges,
} from './adminModeration';
import { MAX_CASTLE_TROOP_CAPACITY, MAX_RALLY_CAPACITY } from './math';
import {
  MultiRegionClusterId,
  PersistedRealmPlayerSnapshot,
  RallyActionCommandPacket,
  TroopPositionCommandPacket,
} from './siegeNetProtocol';

export const SESSION_COOKIE_NAME = 'vr_session';
export const DEFAULT_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export const ALLOWED_CLUSTER_IDS: readonly MultiRegionClusterId[] = [
  'us-east-solara-1',
  'eu-central-valhalla-1',
  'ap-southeast-celestia-1',
] as const;

export interface SignedSessionTokenPayload {
  jti: string;
  sub: string;
  email: string;
  displayName: string;
  role: StaffRole;
  authMethod: 'player_session' | 'operator_passkey';
  iat: number;
  exp: number;
}

export interface ServerRuntimeSecurityConfig {
  isProduction: boolean;
  sessionSecret: string;
  ephemeralSessionSecretGenerated: boolean;
  adminPasskey: string | null;
  ephemeralDevPasskeyGenerated: boolean;
  failClosedMisconfigured: boolean;
  misconfigurationReason: string | null;
}

function toBase64Url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64url');
}

function fromBase64Url(encoded: string): Buffer {
  return Buffer.from(encoded, 'base64url');
}

export function resolveServerRuntimeSecurityConfig(
  env: Record<string, string | undefined> = process.env
): ServerRuntimeSecurityConfig {
  const isProduction = env.NODE_ENV === 'production';
  const configuredSecret = (env.VOXEL_SESSION_SECRET || '').trim();
  const configuredPasskey = (env.VOXEL_ADMIN_PASSKEY || '').trim();

  if (isProduction) {
    const hasValidSecret = configuredSecret.length >= 32;
    const sessionSecret = hasValidSecret
      ? configuredSecret
      : crypto.randomBytes(32).toString('hex');
    const hasValidPasskey = configuredPasskey.length >= 12;
    const reasons: string[] = [];

    if (!hasValidSecret) {
      reasons.push(
        'VOXEL_SESSION_SECRET not set (>=32 chars); using ephemeral per-instance 256-bit CSPRNG signing key (sessions reset on container restart).'
      );
    }
    if (!hasValidPasskey) {
      reasons.push(
        'VOXEL_ADMIN_PASSKEY unset or <12 chars in production; operator /api/auth/admin-login disabled (fail-closed).'
      );
    }

    return {
      isProduction: true,
      sessionSecret,
      ephemeralSessionSecretGenerated: !hasValidSecret,
      adminPasskey: hasValidPasskey ? configuredPasskey : null,
      ephemeralDevPasskeyGenerated: false,
      failClosedMisconfigured: false,
      misconfigurationReason: reasons.length > 0 ? reasons.join(' ') : null,
    };
  }

  const hasDevSecret = configuredSecret.length >= 16;
  const devSessionSecret = hasDevSecret ? configuredSecret : crypto.randomBytes(32).toString('hex');
  const ephemeralDevPasskeyGenerated = configuredPasskey.length === 0;
  const adminPasskey = ephemeralDevPasskeyGenerated
    ? crypto.randomBytes(16).toString('hex')
    : configuredPasskey;

  return {
    isProduction: false,
    sessionSecret: devSessionSecret,
    ephemeralSessionSecretGenerated: !hasDevSecret,
    adminPasskey,
    ephemeralDevPasskeyGenerated,
    failClosedMisconfigured: false,
    misconfigurationReason: null,
  };
}

export function verifyOperatorPasskey(
  submittedPasskey: string | undefined,
  configuredPasskey: string | null
): boolean {
  if (!configuredPasskey || !submittedPasskey) {
    return false;
  }
  const trimmedSubmitted = submittedPasskey.trim();
  const trimmedConfigured = configuredPasskey.trim();
  if (!trimmedSubmitted || !trimmedConfigured) {
    return false;
  }

  const submittedDigest = crypto.createHash('sha256').update(trimmedSubmitted, 'utf8').digest();
  const configuredDigest = crypto.createHash('sha256').update(trimmedConfigured, 'utf8').digest();
  return crypto.timingSafeEqual(submittedDigest, configuredDigest);
}

export function signSessionToken(payload: SignedSessionTokenPayload, secret: string): string {
  if (!secret || secret.length < 16) {
    throw new Error('Cannot sign session token without a >= 16 character server secret.');
  }
  const encodedBody = toBase64Url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(encodedBody).digest();
  return `${encodedBody}.${toBase64Url(sig)}`;
}

export function verifySessionToken(
  token: string | undefined | null,
  secret: string,
  nowMs: number = Date.now()
): { valid: true; payload: SignedSessionTokenPayload } | { valid: false; reason: string } {
  if (!token || !secret || secret.length < 16) {
    return { valid: false, reason: 'Missing token or server secret.' };
  }

  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0 || dotIdx === token.length - 1 || token.indexOf('.', dotIdx + 1) !== -1) {
    return { valid: false, reason: 'Malformed session token format.' };
  }

  const encodedBody = token.slice(0, dotIdx);
  const encodedSig = token.slice(dotIdx + 1);

  let providedSigBuf: Buffer;
  try {
    providedSigBuf = fromBase64Url(encodedSig);
  } catch {
    return { valid: false, reason: 'Invalid base64url signature.' };
  }

  const expectedSigBuf = crypto.createHmac('sha256', secret).update(encodedBody).digest();
  if (
    providedSigBuf.length !== expectedSigBuf.length ||
    !crypto.timingSafeEqual(providedSigBuf, expectedSigBuf)
  ) {
    return { valid: false, reason: 'Invalid HMAC-SHA256 session signature.' };
  }

  let parsed: SignedSessionTokenPayload;
  try {
    parsed = JSON.parse(fromBase64Url(encodedBody).toString('utf8')) as SignedSessionTokenPayload;
  } catch {
    return { valid: false, reason: 'Invalid session payload JSON.' };
  }

  if (
    !parsed ||
    typeof parsed.sub !== 'string' ||
    typeof parsed.email !== 'string' ||
    typeof parsed.role !== 'string' ||
    typeof parsed.iat !== 'number' ||
    typeof parsed.exp !== 'number'
  ) {
    return { valid: false, reason: 'Incomplete session token claims.' };
  }

  if (parsed.exp <= nowMs) {
    return { valid: false, reason: 'Session token expired.' };
  }

  if (parsed.iat > nowMs + 60_000) {
    return { valid: false, reason: 'Session token issued in the future.' };
  }

  return { valid: true, payload: parsed };
}

export function issueSessionTokenForPlayer(params: {
  commanderId: string;
  displayName: string;
  email: string;
  secret: string;
  nowMs?: number;
  ttlMs?: number;
}): { token: string; payload: SignedSessionTokenPayload; session: ServerSessionInfo } {
  const nowMs = params.nowMs ?? Date.now();
  const ttlMs = params.ttlMs ?? DEFAULT_SESSION_TTL_MS;
  // Standard player sessions NEVER grant staff roles regardless of claimed email
  const safeEmail = normalizeAccountEmail(params.email) || 'guest@voxelrealms.example';
  const safeName = (params.displayName || 'Realm Sovereign').trim().slice(0, 48);
  const safeCommanderId =
    (params.commanderId || 'player-commander-01').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) ||
    'player-commander-01';

  const payload: SignedSessionTokenPayload = {
    jti: crypto.randomUUID(),
    sub: safeCommanderId,
    email: safeEmail,
    displayName: safeName,
    role: 'player',
    authMethod: 'player_session',
    iat: nowMs,
    exp: nowMs + ttlMs,
  };

  const token = signSessionToken(payload, params.secret);
  const playerPrivs = verifyAccountPrivileges(
    'guest@voxelrealms.example',
    [],
    'VERIFIED_SERVER_SESSION'
  );

  const session: ServerSessionInfo = {
    sessionId: payload.jti,
    commanderId: payload.sub,
    displayName: safeName,
    email: safeEmail,
    role: 'player',
    clearanceLevel: 1,
    isRootOwner: false,
    permissions: playerPrivs.permissions,
    issuedAtIso: new Date(payload.iat).toISOString(),
    expiresAtIso: new Date(payload.exp).toISOString(),
  };

  return { token, payload, session };
}

export function issueSessionTokenForOperator(params: {
  email: string;
  passkey: string;
  configuredPasskey: string | null;
  roster: ModeratedPlayerRecord[];
  secret: string;
  nowMs?: number;
  ttlMs?: number;
}):
  | {
      ok: true;
      token: string;
      payload: SignedSessionTokenPayload;
      session: ServerSessionInfo;
    }
  | { ok: false; statusCode: 401 | 403 | 503; error: string } {
  if (!params.configuredPasskey) {
    return {
      ok: false,
      statusCode: 503,
      error: 'Server operator passkey is not configured (fail-closed).',
    };
  }

  if (!verifyOperatorPasskey(params.passkey, params.configuredPasskey)) {
    return {
      ok: false,
      statusCode: 401,
      error: 'Invalid operator passkey.',
    };
  }

  const normalized = normalizeAccountEmail(params.email);
  const profile = verifyAccountPrivileges(normalized, params.roster, 'VERIFIED_SERVER_SESSION');

  if (!profile.permissions.canAccessGmConsole) {
    return {
      ok: false,
      statusCode: 403,
      error: `Account ${normalized || '(empty)'} does not hold staff/admin clearance on the server roster.`,
    };
  }

  const matchedRecord = params.roster.find((r) => normalizeAccountEmail(r.email) === normalized);
  if (
    matchedRecord &&
    !profile.isRootOwner &&
    (matchedRecord.status === 'temp_banned' || matchedRecord.status === 'perm_banned')
  ) {
    return {
      ok: false,
      statusCode: 403,
      error: `Staff account ${normalized} is currently suspended (${matchedRecord.status}).`,
    };
  }

  const nowMs = params.nowMs ?? Date.now();
  const ttlMs = params.ttlMs ?? DEFAULT_SESSION_TTL_MS;
  const payload: SignedSessionTokenPayload = {
    jti: crypto.randomUUID(),
    sub: matchedRecord?.id || 'usr_root_creator',
    email: profile.normalizedEmail,
    displayName: profile.displayName,
    role: profile.primaryRole,
    authMethod: 'operator_passkey',
    iat: nowMs,
    exp: nowMs + ttlMs,
  };

  const token = signSessionToken(payload, params.secret);
  const session: ServerSessionInfo = {
    sessionId: payload.jti,
    commanderId: payload.sub,
    displayName: profile.displayName,
    email: profile.normalizedEmail,
    role: profile.primaryRole,
    clearanceLevel: profile.clearanceLevel,
    isRootOwner: profile.isRootOwner,
    permissions: profile.permissions,
    issuedAtIso: new Date(payload.iat).toISOString(),
    expiresAtIso: new Date(payload.exp).toISOString(),
  };

  return { ok: true, token, payload, session };
}

export function resolveAuthenticatedSession(params: {
  token: string | undefined | null;
  secret: string;
  roster: ModeratedPlayerRecord[];
  nowMs?: number;
}): { authenticated: true; session: ServerSessionInfo } | { authenticated: false; reason: string } {
  const verified = verifySessionToken(params.token, params.secret, params.nowMs);
  if (!verified.valid) {
    return { authenticated: false, reason: verified.reason };
  }

  const { payload } = verified;

  // Player-scoped tokens NEVER auto-escalate to staff privileges even if email matches a staff email
  if (payload.authMethod === 'player_session') {
    const basePlayerPrivs = verifyAccountPrivileges(
      'guest@voxelrealms.example',
      [],
      'VERIFIED_SERVER_SESSION'
    );
    return {
      authenticated: true,
      session: {
        sessionId: payload.jti,
        commanderId: payload.sub,
        displayName: payload.displayName,
        email: payload.email,
        role: 'player',
        clearanceLevel: 1,
        isRootOwner: false,
        permissions: basePlayerPrivs.permissions,
        issuedAtIso: new Date(payload.iat).toISOString(),
        expiresAtIso: new Date(payload.exp).toISOString(),
      },
    };
  }

  // Re-evaluate live server roster so role revocations or bans take effect immediately
  const liveProfile = verifyAccountPrivileges(
    payload.email,
    params.roster,
    'VERIFIED_SERVER_SESSION'
  );
  const rosterRecord = params.roster.find(
    (r) => normalizeAccountEmail(r.email) === liveProfile.normalizedEmail
  );

  if (
    rosterRecord &&
    !liveProfile.isRootOwner &&
    (rosterRecord.status === 'temp_banned' || rosterRecord.status === 'perm_banned')
  ) {
    return { authenticated: false, reason: 'Account suspended on authoritative server roster.' };
  }

  return {
    authenticated: true,
    session: {
      sessionId: payload.jti,
      commanderId: payload.sub,
      displayName: liveProfile.displayName,
      email: liveProfile.normalizedEmail,
      role: liveProfile.primaryRole,
      clearanceLevel: liveProfile.clearanceLevel,
      isRootOwner: liveProfile.isRootOwner,
      permissions: liveProfile.permissions,
      issuedAtIso: new Date(payload.iat).toISOString(),
      expiresAtIso: new Date(payload.exp).toISOString(),
    },
  };
}

export function authorizeStaffPermission(
  session: ServerSessionInfo | null | undefined,
  requiredPermission: keyof AdminPermissions
):
  | { authorized: true; session: ServerSessionInfo }
  | { authorized: false; statusCode: 401 | 403; error: string } {
  if (!session) {
    return {
      authorized: false,
      statusCode: 401,
      error: 'Authentication required: missing or invalid signed server session token.',
    };
  }

  if (!session.permissions[requiredPermission]) {
    return {
      authorized: false,
      statusCode: 403,
      error: `Forbidden: account ${session.email} (role: ${session.role}, clearance Lv.${session.clearanceLevel}) lacks server permission '${requiredPermission}'.`,
    };
  }

  return { authorized: true, session };
}

export function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(';')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = part.slice(0, eqIdx).trim();
    const rawVal = part.slice(eqIdx + 1).trim();
    if (key) {
      try {
        cookies[key] = decodeURIComponent(rawVal);
      } catch {
        cookies[key] = rawVal;
      }
    }
  }
  return cookies;
}

export function extractSessionTokenFromHeaders(params: {
  cookieHeader?: string;
  authorizationHeader?: string;
  queryToken?: string | null;
}): string | null {
  if (params.authorizationHeader && params.authorizationHeader.startsWith('Bearer ')) {
    const bearer = params.authorizationHeader.slice(7).trim();
    if (bearer) return bearer;
  }

  const cookies = parseCookieHeader(params.cookieHeader);
  if (cookies[SESSION_COOKIE_NAME]) {
    return cookies[SESSION_COOKIE_NAME];
  }

  if (params.queryToken && params.queryToken.trim()) {
    return params.queryToken.trim();
  }

  return null;
}

export function buildSessionSetCookieHeader(
  token: string,
  isProduction: boolean,
  maxAgeSec: number = Math.floor(DEFAULT_SESSION_TTL_MS / 1000)
): string {
  const attrs = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
  ];
  if (isProduction) {
    attrs.push('Secure');
  }
  return attrs.join('; ');
}

export function buildClearSessionCookieHeader(isProduction: boolean): string {
  const attrs = [`${SESSION_COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isProduction) {
    attrs.push('Secure');
  }
  return attrs.join('; ');
}

function clampInteger(
  val: unknown,
  fallback: number,
  min: number,
  max: number
): {
  value: number;
  clamped: boolean;
} {
  if (typeof val !== 'number' || !Number.isFinite(val)) {
    return { value: fallback, clamped: false };
  }
  const rounded = Math.trunc(val);
  const clampedVal = Math.max(min, Math.min(max, rounded));
  return { value: clampedVal, clamped: clampedVal !== rounded };
}

function clampBigIntWire(
  wire: unknown,
  fallback: string,
  maxAllowed: bigint
): { value: string; clamped: boolean } {
  if (typeof wire !== 'string' || !/^\d+$/.test(wire.trim())) {
    return { value: fallback, clamped: wire !== undefined };
  }
  try {
    const parsed = BigInt(wire.trim());
    if (parsed < 0n) return { value: '0', clamped: true };
    if (parsed > maxAllowed) return { value: maxAllowed.toString(), clamped: true };
    return { value: parsed.toString(), clamped: false };
  } catch {
    return { value: fallback, clamped: true };
  }
}

export function sanitizeAndValidateSyncPayload(params: {
  existing?: PersistedRealmPlayerSnapshot;
  incomingBody: Record<string, unknown>;
  session: ServerSessionInfo;
  defaultClusterId: MultiRegionClusterId;
  nowIso?: string;
}): {
  snapshot: PersistedRealmPlayerSnapshot;
  sanitizedFields: string[];
} {
  const { existing, incomingBody, session, defaultClusterId } = params;
  const nowIso = params.nowIso ?? new Date().toISOString();
  const sanitizedFields: string[] = [];
  const isPrivilegedStaff = session.permissions.canUseGodmodeAndCheats;

  // Never trust client-supplied commanderId or email
  if (
    typeof incomingBody.commanderId === 'string' &&
    incomingBody.commanderId !== session.commanderId
  ) {
    sanitizedFields.push('commanderId');
  }
  if (
    typeof incomingBody.email === 'string' &&
    normalizeAccountEmail(incomingBody.email) !== normalizeAccountEmail(session.email)
  ) {
    sanitizedFields.push('email');
  }

  const commanderName =
    typeof incomingBody.commanderName === 'string' && incomingBody.commanderName.trim()
      ? incomingBody.commanderName.trim().slice(0, 48)
      : (existing?.commanderName ?? session.displayName);

  const allianceTag =
    typeof incomingBody.allianceTag === 'string' && incomingBody.allianceTag.trim()
      ? incomingBody.allianceTag
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9_-]/g, '')
          .slice(0, 8) || 'SOL'
      : (existing?.allianceTag ?? 'SOL');

  const preferredRegion = ALLOWED_CLUSTER_IDS.includes(
    incomingBody.preferredRegion as MultiRegionClusterId
  )
    ? (incomingBody.preferredRegion as MultiRegionClusterId)
    : defaultClusterId;

  const codexCheck = clampInteger(
    incomingBody.discoveredCodexCount,
    existing?.discoveredCodexCount ?? 0,
    0,
    500
  );
  if (codexCheck.clamped) sanitizedFields.push('discoveredCodexCount');

  // Non-staff players cannot use /api/online/sync to arbitrarily escalate castleLevel, vipTier, realm, or 1000T garrison
  let castleLevel = existing?.castleLevel ?? 1;
  let cultivationRealmIndex = existing?.cultivationRealmIndex ?? 0;
  let vipTier = existing?.vipTier ?? 0;
  let karma = existing?.karma ?? 0;
  let garrisonTroopsWire = existing?.garrisonTroopsWire ?? '0';

  if (isPrivilegedStaff) {
    const castleCheck = clampInteger(incomingBody.castleLevel, castleLevel, 0, 100);
    castleLevel = castleCheck.value;
    if (castleCheck.clamped) sanitizedFields.push('castleLevel');

    const realmCheck = clampInteger(
      incomingBody.cultivationRealmIndex,
      cultivationRealmIndex,
      0,
      22
    );
    cultivationRealmIndex = realmCheck.value;
    if (realmCheck.clamped) sanitizedFields.push('cultivationRealmIndex');

    const vipCheck = clampInteger(incomingBody.vipTier, vipTier, 0, 3);
    vipTier = vipCheck.value;
    if (vipCheck.clamped) sanitizedFields.push('vipTier');

    const karmaCheck = clampInteger(incomingBody.karma, karma, -100_000, 100_000);
    karma = karmaCheck.value;
    if (karmaCheck.clamped) sanitizedFields.push('karma');

    const troopsCheck = clampBigIntWire(
      incomingBody.garrisonTroopsWire,
      garrisonTroopsWire,
      MAX_CASTLE_TROOP_CAPACITY
    );
    garrisonTroopsWire = troopsCheck.value;
    if (troopsCheck.clamped) sanitizedFields.push('garrisonTroopsWire');
  } else {
    for (const restrictedField of [
      'castleLevel',
      'cultivationRealmIndex',
      'vipTier',
      'karma',
      'garrisonTroopsWire',
    ]) {
      if (incomingBody[restrictedField] !== undefined) {
        sanitizedFields.push(restrictedField);
      }
    }
  }

  return {
    snapshot: {
      commanderId: session.commanderId,
      commanderName,
      email: isPrimaryAdminAccount(session.email) ? PRIMARY_ADMIN_EMAIL : session.email,
      allianceTag,
      castleLevel,
      cultivationRealmIndex,
      vipTier,
      karma,
      garrisonTroopsWire,
      discoveredCodexCount: codexCheck.value,
      preferredRegion,
      updatedAtIso: nowIso,
    },
    sanitizedFields,
  };
}

export function bindSiegeCommandToSession(params: {
  session: ServerSessionInfo;
  troopCmd?: TroopPositionCommandPacket;
  rallyCmd?: RallyActionCommandPacket;
}): {
  troopCmd?: TroopPositionCommandPacket;
  rallyCmd?: RallyActionCommandPacket;
} {
  const { session, troopCmd, rallyCmd } = params;

  const boundTroopCmd: TroopPositionCommandPacket | undefined = troopCmd
    ? {
        ...troopCmd,
        commanderId: session.commanderId,
        cohortId: Math.max(0, Math.min(99, Math.trunc(troopCmd.cohortId || 0))),
      }
    : undefined;

  let boundRallyCmd: RallyActionCommandPacket | undefined;
  if (rallyCmd) {
    const clampBranch = (wire: string): string =>
      clampBigIntWire(wire, '0', MAX_RALLY_CAPACITY).value;

    boundRallyCmd = {
      ...rallyCmd,
      commanderId: session.commanderId,
      commanderName: session.displayName,
      commanderRealmIndex: Math.max(0, Math.min(22, Math.trunc(rallyCmd.commanderRealmIndex || 0))),
      shieldbearersWire: clampBranch(rallyCmd.shieldbearersWire),
      shootersWire: clampBranch(rallyCmd.shootersWire),
      bombersWire: clampBranch(rallyCmd.bombersWire),
      troopTier: Math.max(1, Math.min(20, Math.trunc(rallyCmd.troopTier || 1))),
    };
  }

  return { troopCmd: boundTroopCmd, rallyCmd: boundRallyCmd };
}

export function redactCommanderForPublicStatus(
  snapshot: PersistedRealmPlayerSnapshot
): Omit<PersistedRealmPlayerSnapshot, 'email'> & { emailRedacted: boolean } {
  const { email: _omitted, ...publicFields } = snapshot;
  return {
    ...publicFields,
    emailRedacted: true,
  };
}

export function createAuditEntry(params: {
  eventType: SecurityAuditEntry['eventType'];
  actorEmail: string;
  actorRole: SecurityAuditEntry['actorRole'];
  outcome: SecurityAuditEntry['outcome'];
  detail: string;
  nowIso?: string;
}): SecurityAuditEntry {
  return {
    id: `aud_${crypto.randomUUID().slice(0, 12)}`,
    timestampIso: params.nowIso ?? new Date().toISOString(),
    eventType: params.eventType,
    actorEmail: params.actorEmail,
    actorRole: params.actorRole,
    outcome: params.outcome,
    detail: params.detail,
  };
}
