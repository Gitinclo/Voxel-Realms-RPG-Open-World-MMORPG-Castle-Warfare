/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Duplex } from 'node:stream';
import {
  AdminPermissions,
  ContactCategory,
  INITIAL_MODERATED_PLAYERS,
  INITIAL_SUPPORT_TICKETS,
  ModerationActionType,
  ModeratedPlayerRecord,
  SecurityAuditEntry,
  ServerSessionInfo,
  SupportTicket,
  applyModerationAction,
  createContactTicket,
  resolveContactTicket,
} from './src/game/adminModeration';
import {
  ALL_TERRITORY_SECTORS,
  AuthoritativeSiegeSectorState,
  MultiRegionClusterId,
  PersistedRealmPlayerSnapshot,
  RallyActionCommandPacket,
  SiegeNetEnvelope,
  SiegeNetOpcode,
  TerritorySectorCode,
  TroopPositionCommandPacket,
  applyRallyActionCommand,
  applyTroopPositionCommand,
  buildMultiRegionReplicationStatus,
  createInitialAuthoritativeSiegeSectorState,
  stepAuthoritativeSiegeTick,
} from './src/game/siegeNetProtocol';
import {
  ALLOWED_CLUSTER_IDS,
  authorizeStaffPermission,
  bindSiegeCommandToSession,
  buildClearSessionCookieHeader,
  buildSessionSetCookieHeader,
  createAuditEntry,
  extractSessionTokenFromHeaders,
  issueSessionTokenForOperator,
  issueSessionTokenForPlayer,
  redactCommanderForPublicStatus,
  resolveAuthenticatedSession,
  resolveServerRuntimeSecurityConfig,
  sanitizeAndValidateSyncPayload,
} from './src/game/serverAuth';

const parsedPort = Number.parseInt(process.env.PORT || '', 10);
const PORT = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3000;
const ROOT_DIR = import.meta.dirname ?? process.cwd();
const DATA_DIR = path.resolve(ROOT_DIR, 'data');
const STATE_FILE_PATH = path.join(DATA_DIR, 'online_realm_state.json');
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_AUDIT_LOG_ENTRIES = 200;

function isHttpsRequest(req: Request): boolean {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protoStr = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  return Boolean(req.secure || protoStr?.split(',')[0]?.trim().toLowerCase() === 'https');
}

interface ServerDecreeRecord {
  id: string;
  authorEmail: string;
  authorRole: string;
  message: string;
  createdAtIso: string;
}

interface PersistedMultiRegionStore {
  primaryClusterId: MultiRegionClusterId;
  activeSector: TerritorySectorCode;
  lastDiskFlushIso: string;
  sectors: Record<TerritorySectorCode, AuthoritativeSiegeSectorState>;
  commanders: Record<string, PersistedRealmPlayerSnapshot>;
  moderatedPlayers: ModeratedPlayerRecord[];
  supportTickets: SupportTicket[];
  securityAuditLog: SecurityAuditEntry[];
  activeDecrees: ServerDecreeRecord[];
  speciesSwitchGlobalApproved: boolean;
}

function appendAuditEntry(store: PersistedMultiRegionStore, entry: SecurityAuditEntry): void {
  store.securityAuditLog.unshift(entry);
  if (store.securityAuditLog.length > MAX_AUDIT_LOG_ENTRIES) {
    store.securityAuditLog.length = MAX_AUDIT_LOG_ENTRIES;
  }
}

function loadOrInitializeStore(): PersistedMultiRegionStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STATE_FILE_PATH)) {
      const raw = fs.readFileSync(STATE_FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<PersistedMultiRegionStore>;
      if (parsed && parsed.sectors && parsed.sectors.B2) {
        // Hydrate security collections smoothly when upgrading older disk snapshots
        return {
          primaryClusterId: parsed.primaryClusterId || 'us-east-solara-1',
          activeSector: parsed.activeSector || 'B2',
          lastDiskFlushIso: parsed.lastDiskFlushIso || new Date().toISOString(),
          sectors: parsed.sectors as Record<TerritorySectorCode, AuthoritativeSiegeSectorState>,
          commanders: parsed.commanders || {},
          moderatedPlayers:
            Array.isArray(parsed.moderatedPlayers) && parsed.moderatedPlayers.length > 0
              ? parsed.moderatedPlayers
              : [...INITIAL_MODERATED_PLAYERS],
          supportTickets:
            Array.isArray(parsed.supportTickets) && parsed.supportTickets.length > 0
              ? parsed.supportTickets
              : [...INITIAL_SUPPORT_TICKETS],
          securityAuditLog: Array.isArray(parsed.securityAuditLog) ? parsed.securityAuditLog : [],
          activeDecrees: Array.isArray(parsed.activeDecrees) ? parsed.activeDecrees : [],
          speciesSwitchGlobalApproved: Boolean(parsed.speciesSwitchGlobalApproved),
        };
      }
    }
  } catch {
    // Fallback to clean initialization if disk state is absent or corrupted
  }

  const sectors = {} as Record<TerritorySectorCode, AuthoritativeSiegeSectorState>;
  for (const sector of ALL_TERRITORY_SECTORS) {
    sectors[sector] = createInitialAuthoritativeSiegeSectorState(sector);
  }

  const nowIso = new Date().toISOString();
  const initialStore: PersistedMultiRegionStore = {
    primaryClusterId: 'us-east-solara-1',
    activeSector: 'B2',
    lastDiskFlushIso: nowIso,
    sectors,
    commanders: {
      'player-commander-01': {
        commanderId: 'player-commander-01',
        commanderName: 'Sovereign Vanguard',
        email: 'player01@voxelrealms.example',
        allianceTag: 'SOL',
        castleLevel: 12,
        cultivationRealmIndex: 2,
        vipTier: 0,
        karma: 50,
        garrisonTroopsWire: '250000',
        discoveredCodexCount: 4,
        preferredRegion: 'us-east-solara-1',
        updatedAtIso: nowIso,
      },
    },
    moderatedPlayers: [...INITIAL_MODERATED_PLAYERS],
    supportTickets: [...INITIAL_SUPPORT_TICKETS],
    securityAuditLog: [],
    activeDecrees: [],
    speciesSwitchGlobalApproved: false,
  };

  persistStoreToDisk(initialStore);
  return initialStore;
}

function persistStoreToDisk(store: PersistedMultiRegionStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    store.lastDiskFlushIso = new Date().toISOString();
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(store, null, 2), 'utf8');
  } catch {
    // Non-fatal in read-only or ephemeral environments
  }
}

// ============================================================================
// RFC 6455 WEBSOCKET FRAMING HELPERS (ZERO EXTERNAL WS DEPENDENCY REQUIRED)
// ============================================================================

interface ConnectedSiegePeer {
  id: string;
  socket: Duplex;
  subscribedSector: TerritorySectorCode;
  connectedAtIso: string;
  session: ServerSessionInfo | null;
}

function encodeWsTextFrame(jsonText: string): Buffer {
  const payload = Buffer.from(jsonText, 'utf8');
  const len = payload.byteLength;
  if (len < 126) {
    const header = Buffer.from([0x81, len]);
    return Buffer.concat([header, payload]);
  }
  if (len < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
    return Buffer.concat([header, payload]);
  }
  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(len), 2);
  return Buffer.concat([header, payload]);
}

function decodeWsFrames(buffer: Buffer): {
  messages: string[];
  closeRequested: boolean;
  pingPayload: Buffer | null;
} {
  const messages: string[] = [];
  let closeRequested = false;
  let pingPayload: Buffer | null = null;
  let offset = 0;

  while (offset + 2 <= buffer.length) {
    const byte0 = buffer[offset];
    const byte1 = buffer[offset + 1];
    const opcode = byte0 & 0x0f;
    const isMasked = (byte1 & 0x80) !== 0;
    let payloadLen = byte1 & 0x7f;
    let headerLen = 2;

    if (payloadLen === 126) {
      if (offset + 4 > buffer.length) break;
      payloadLen = buffer.readUInt16BE(offset + 2);
      headerLen = 4;
    } else if (payloadLen === 127) {
      if (offset + 10 > buffer.length) break;
      payloadLen = Number(buffer.readBigUInt64BE(offset + 2));
      headerLen = 10;
    }

    const maskLen = isMasked ? 4 : 0;
    if (offset + headerLen + maskLen + payloadLen > buffer.length) break;

    const payloadStart = offset + headerLen + maskLen;
    const rawPayload = Buffer.from(buffer.subarray(payloadStart, payloadStart + payloadLen));

    if (isMasked) {
      const maskKey = buffer.subarray(offset + headerLen, offset + headerLen + 4);
      for (let i = 0; i < rawPayload.length; i++) {
        rawPayload[i] ^= maskKey[i & 3];
      }
    }

    if (opcode === 0x08) {
      closeRequested = true;
    } else if (opcode === 0x09) {
      pingPayload = rawPayload;
    } else if (opcode === 0x01) {
      messages.push(rawPayload.toString('utf8'));
    }

    offset = payloadStart + payloadLen;
  }

  return { messages, closeRequested, pingPayload };
}

async function startServer() {
  const securityConfig = resolveServerRuntimeSecurityConfig(process.env);
  if (securityConfig.failClosedMisconfigured) {
    console.error(`[SECURITY FATAL] ${securityConfig.misconfigurationReason}`);
    process.exit(1);
  }

  if (securityConfig.ephemeralDevPasskeyGenerated && securityConfig.adminPasskey) {
    console.info(
      `[Voxel Realms Security] Development mode: generated ephemeral operator passkey for this boot: ${securityConfig.adminPasskey} (set VOXEL_ADMIN_PASSKEY in .env to override).`
    );
  } else if (securityConfig.misconfigurationReason) {
    console.warn(`[Voxel Realms Security] ${securityConfig.misconfigurationReason}`);
  }

  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '512kb' }));

  // Baseline Security Response Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store');
    }
    next();
  });

  app.get(['/healthz', '/api/health'], (_req, res) => {
    res.status(200).json({
      ok: true,
      status: 'healthy',
      uptimeSec: Math.round(process.uptime()),
    });
  });

  const store = loadOrInitializeStore();
  const peers = new Map<string, ConnectedSiegePeer>();

  const resolveRequestSession = (req: Request): ServerSessionInfo | null => {
    const token = extractSessionTokenFromHeaders({
      cookieHeader: req.headers.cookie,
      authorizationHeader: req.headers.authorization,
    });
    const resolved = resolveAuthenticatedSession({
      token,
      secret: securityConfig.sessionSecret,
      roster: store.moderatedPlayers,
    });
    return resolved.authenticated ? resolved.session : null;
  };

  const requireAuthenticatedSession = (req: Request, res: Response): ServerSessionInfo | null => {
    const session = resolveRequestSession(req);
    if (!session) {
      appendAuditEntry(
        store,
        createAuditEntry({
          eventType: 'AUTHZ_DENIED',
          actorEmail: 'anonymous',
          actorRole: 'anonymous',
          outcome: 'denied',
          detail: `Unauthenticated request blocked on ${req.method} ${req.path}`,
        })
      );
      res.status(401).json({
        ok: false,
        error: 'Unauthorized: valid HMAC-signed server session required.',
      });
      return null;
    }
    return session;
  };

  const requireStaffPermission = (
    req: Request,
    res: Response,
    permission: keyof AdminPermissions
  ): ServerSessionInfo | null => {
    const session = resolveRequestSession(req);
    const authz = authorizeStaffPermission(session, permission);
    if (!authz.authorized) {
      appendAuditEntry(
        store,
        createAuditEntry({
          eventType: 'AUTHZ_DENIED',
          actorEmail: session?.email ?? 'anonymous',
          actorRole: session?.role ?? 'anonymous',
          outcome: 'denied',
          detail: `${req.method} ${req.path} rejected (${authz.statusCode}): ${authz.error}`,
        })
      );
      persistStoreToDisk(store);
      res.status(authz.statusCode).json({
        ok: false,
        error: authz.error,
      });
      return null;
    }
    return authz.session;
  };

  const broadcastToSector = <TPayload>(
    sector: TerritorySectorCode,
    envelope: SiegeNetEnvelope<TPayload>
  ) => {
    const frame = encodeWsTextFrame(JSON.stringify(envelope));
    for (const [peerId, peer] of peers.entries()) {
      if (peer.subscribedSector === sector && !peer.socket.destroyed) {
        try {
          peer.socket.write(frame);
        } catch {
          peers.delete(peerId);
        }
      }
    }
  };

  // ==========================================================================
  // AUTHORITATIVE 20HZ (50ms) SIEGE SERVER LOOP & PERIODIC DISK PERSISTENCE
  // ==========================================================================
  let tickCounter = 0;
  setInterval(() => {
    tickCounter++;
    const activeSector = store.activeSector;
    const currentSectorState = store.sectors[activeSector];
    const { nextState, deltaPacket } = stepAuthoritativeSiegeTick(currentSectorState);
    store.sectors[activeSector] = nextState;

    if (peers.size > 0) {
      broadcastToSector(activeSector, deltaPacket);

      if (nextState.serverTick % 100 === 0) {
        broadcastToSector(activeSector, {
          opcode: SiegeNetOpcode.S2C_FULL_SIEGE_SNAPSHOT,
          serverTick: nextState.serverTick,
          ackClientSeq: nextState.cohorts[0]?.lastAckClientSeq ?? 0,
          sector: activeSector,
          stateHash: nextState.stateHash,
          payload: { sectorState: nextState },
        });
      }
    }

    if (tickCounter % 200 === 0) {
      persistStoreToDisk(store);
    }
  }, 50);

  // ==========================================================================
  // SERVER-SIDE AUTHENTICATION & SESSION MANAGEMENT ROUTES (/api/auth/*)
  // ==========================================================================

  app.get('/api/auth/session', (req, res) => {
    const session = resolveRequestSession(req);
    res.json({
      ok: true,
      authenticated: Boolean(session),
      session,
      securityMode: {
        isProduction: securityConfig.isProduction,
        operatorLoginConfigured: Boolean(securityConfig.adminPasskey),
        ephemeralDevPasskeyActive: securityConfig.ephemeralDevPasskeyGenerated,
      },
    });
  });

  app.post('/api/auth/player-session', (req, res) => {
    const body = (req.body || {}) as {
      commanderId?: string;
      displayName?: string;
      email?: string;
    };

    const issued = issueSessionTokenForPlayer({
      commanderId: body.commanderId || `player-${crypto.randomUUID().slice(0, 8)}`,
      displayName: body.displayName || 'Sovereign Vanguard',
      email: body.email || 'player@voxelrealms.example',
      secret: securityConfig.sessionSecret,
    });

    res.setHeader('Set-Cookie', buildSessionSetCookieHeader(issued.token, isHttpsRequest(req)));

    appendAuditEntry(
      store,
      createAuditEntry({
        eventType: 'PLAYER_SESSION_ISSUED',
        actorEmail: issued.session.email,
        actorRole: 'player',
        outcome: 'allowed',
        detail: `Issued scoped player session (Clearance Lv.1) for commander ${issued.session.commanderId}`,
      })
    );
    persistStoreToDisk(store);

    res.json({
      ok: true,
      authenticated: true,
      session: issued.session,
    });
  });

  app.post('/api/auth/admin-login', (req, res) => {
    const body = (req.body || {}) as { email?: string; passkey?: string };
    const result = issueSessionTokenForOperator({
      email: body.email || '',
      passkey: body.passkey || '',
      configuredPasskey: securityConfig.adminPasskey,
      roster: store.moderatedPlayers,
      secret: securityConfig.sessionSecret,
    });

    if (!result.ok) {
      appendAuditEntry(
        store,
        createAuditEntry({
          eventType: 'ADMIN_LOGIN_FAILED',
          actorEmail: (body.email || 'anonymous').trim().toLowerCase() || 'anonymous',
          actorRole: 'anonymous',
          outcome: 'denied',
          detail: result.error,
        })
      );
      persistStoreToDisk(store);
      res.status(result.statusCode).json({
        ok: false,
        error: result.error,
      });
      return;
    }

    res.setHeader('Set-Cookie', buildSessionSetCookieHeader(result.token, isHttpsRequest(req)));

    appendAuditEntry(
      store,
      createAuditEntry({
        eventType: 'ADMIN_LOGIN_SUCCESS',
        actorEmail: result.session.email,
        actorRole: result.session.role,
        outcome: 'allowed',
        detail: `Operator session minted for ${result.session.email} (Clearance Lv.${result.session.clearanceLevel})`,
      })
    );
    persistStoreToDisk(store);

    res.json({
      ok: true,
      authenticated: true,
      session: result.session,
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const session = resolveRequestSession(req);
    res.setHeader('Set-Cookie', buildClearSessionCookieHeader(isHttpsRequest(req)));
    if (session) {
      appendAuditEntry(
        store,
        createAuditEntry({
          eventType: 'SESSION_LOGOUT',
          actorEmail: session.email,
          actorRole: session.role,
          outcome: 'allowed',
          detail: `Signed out verified session ${session.sessionId}`,
        })
      );
      persistStoreToDisk(store);
    }
    res.json({ ok: true, authenticated: false, session: null });
  });

  // ==========================================================================
  // PROTECTED SERVER-SIDE ADMIN, RBAC & MODERATION ROUTES (/api/admin/*)
  // ==========================================================================

  app.get('/api/admin/state', (req, res) => {
    const session = requireStaffPermission(req, res, 'canAccessGmConsole');
    if (!session) return;

    res.json({
      ok: true,
      session,
      roster: store.moderatedPlayers,
      tickets: store.supportTickets,
      auditLog: store.securityAuditLog,
      activeDecrees: store.activeDecrees,
      speciesSwitchGlobalApproved: store.speciesSwitchGlobalApproved,
    });
  });

  app.post('/api/admin/moderation', (req, res) => {
    const body = (req.body || {}) as {
      targetPlayerId?: string;
      action?: ModerationActionType;
      reason?: string;
    };

    const action = body.action;
    const isRoleAction =
      action === 'grant_moderator' ||
      action === 'grant_admin' ||
      action === 'grant_gm' ||
      action === 'revoke_staff';

    const requiredPermission: keyof AdminPermissions = isRoleAction
      ? 'canManageRoles'
      : 'canModeratePlayers';

    const session = requireStaffPermission(req, res, requiredPermission);
    if (!session) return;

    if (!body.targetPlayerId || !action) {
      res.status(400).json({ ok: false, error: 'Missing targetPlayerId or action.' });
      return;
    }

    // Strictly bind actorEmail from verified HMAC session, never from request body!
    const result = applyModerationAction({
      roster: store.moderatedPlayers,
      targetPlayerId: body.targetPlayerId,
      action,
      reason: body.reason || '',
      actorEmail: session.email,
    });

    appendAuditEntry(
      store,
      createAuditEntry({
        eventType: 'MODERATION_EXECUTED',
        actorEmail: session.email,
        actorRole: session.role,
        outcome: result.success ? 'allowed' : 'denied',
        detail: result.logMessage,
      })
    );

    if (!result.success) {
      persistStoreToDisk(store);
      res.status(403).json({
        ok: false,
        error: result.logMessage,
        roster: store.moderatedPlayers,
        auditLog: store.securityAuditLog,
      });
      return;
    }

    store.moderatedPlayers = result.updatedRoster;
    persistStoreToDisk(store);

    res.json({
      ok: true,
      logMessage: result.logMessage,
      roster: store.moderatedPlayers,
      auditLog: store.securityAuditLog,
    });
  });

  app.post('/api/admin/tickets', (req, res) => {
    const session = requireAuthenticatedSession(req, res);
    if (!session) return;

    const body = (req.body || {}) as {
      category?: ContactCategory;
      subject?: string;
      message?: string;
      priority?: 'low' | 'normal' | 'high' | 'critical';
    };

    const result = createContactTicket({
      tickets: store.supportTickets,
      category: body.category || 'administration',
      senderName: session.displayName,
      senderEmail: session.email,
      subject: body.subject || '',
      message: body.message || '',
      priority: body.priority || 'normal',
    });

    if (!result.success || !result.ticket) {
      res.status(400).json({ ok: false, error: result.error || 'Invalid ticket payload.' });
      return;
    }

    store.supportTickets = result.updatedTickets;
    appendAuditEntry(
      store,
      createAuditEntry({
        eventType: 'TICKET_CREATED',
        actorEmail: session.email,
        actorRole: session.role,
        outcome: 'allowed',
        detail: `Created ticket ${result.ticket.id} ("${result.ticket.subject}")`,
      })
    );
    persistStoreToDisk(store);

    res.json({
      ok: true,
      ticket: result.ticket,
      tickets: store.supportTickets,
    });
  });

  app.post('/api/admin/tickets/resolve', (req, res) => {
    const session = requireStaffPermission(req, res, 'canHandleSupportTickets');
    if (!session) return;

    const body = (req.body || {}) as {
      ticketId?: string;
      status?: 'investigating' | 'resolved';
      resolutionNote?: string;
    };

    if (!body.ticketId || (body.status !== 'investigating' && body.status !== 'resolved')) {
      res.status(400).json({ ok: false, error: 'Invalid ticketId or status.' });
      return;
    }

    const result = resolveContactTicket({
      tickets: store.supportTickets,
      ticketId: body.ticketId,
      status: body.status,
      resolutionNote: body.resolutionNote || '',
      actorEmail: session.email,
      roster: store.moderatedPlayers,
    });

    appendAuditEntry(
      store,
      createAuditEntry({
        eventType: 'TICKET_UPDATED',
        actorEmail: session.email,
        actorRole: session.role,
        outcome: result.success ? 'allowed' : 'denied',
        detail: result.logMessage,
      })
    );

    if (!result.success) {
      persistStoreToDisk(store);
      res.status(400).json({ ok: false, error: result.logMessage });
      return;
    }

    store.supportTickets = result.updatedTickets;
    persistStoreToDisk(store);

    res.json({
      ok: true,
      logMessage: result.logMessage,
      tickets: store.supportTickets,
      auditLog: store.securityAuditLog,
    });
  });

  app.post('/api/admin/decree', (req, res) => {
    const session = requireStaffPermission(req, res, 'canModerateChat');
    if (!session) return;

    const body = (req.body || {}) as { message?: string };
    const cleanMsg = (body.message || '').trim().slice(0, 280);
    if (!cleanMsg) {
      res.status(400).json({ ok: false, error: 'Decree message cannot be empty.' });
      return;
    }

    const decree: ServerDecreeRecord = {
      id: `dec_${crypto.randomUUID().slice(0, 8)}`,
      authorEmail: session.email,
      authorRole: session.role,
      message: cleanMsg,
      createdAtIso: new Date().toISOString(),
    };
    store.activeDecrees.unshift(decree);
    if (store.activeDecrees.length > 50) store.activeDecrees.length = 50;

    appendAuditEntry(
      store,
      createAuditEntry({
        eventType: 'MODERATION_EXECUTED',
        actorEmail: session.email,
        actorRole: session.role,
        outcome: 'allowed',
        detail: `Published official decree: "${cleanMsg}"`,
      })
    );
    persistStoreToDisk(store);

    res.json({
      ok: true,
      decree,
      activeDecrees: store.activeDecrees,
      auditLog: store.securityAuditLog,
    });
  });

  app.post('/api/admin/species-rebirth', (req, res) => {
    const session = requireStaffPermission(req, res, 'canManageRoles');
    if (!session) return;

    const body = (req.body || {}) as { approved?: boolean };
    store.speciesSwitchGlobalApproved = Boolean(body.approved);

    appendAuditEntry(
      store,
      createAuditEntry({
        eventType: 'MODERATION_EXECUTED',
        actorEmail: session.email,
        actorRole: session.role,
        outcome: 'allowed',
        detail: `Set server speciesSwitchGlobalApproved = ${store.speciesSwitchGlobalApproved}`,
      })
    );
    persistStoreToDisk(store);

    res.json({
      ok: true,
      speciesSwitchGlobalApproved: store.speciesSwitchGlobalApproved,
      auditLog: store.securityAuditLog,
    });
  });

  // ==========================================================================
  // MULTI-REGION PERSISTENCE & SIEGE REST API ROUTES (/api/online/*)
  // ==========================================================================

  app.get('/api/online/status', (req, res) => {
    const requestedSector = (req.query.sector as TerritorySectorCode) || store.activeSector;
    const validSector: TerritorySectorCode = ALL_TERRITORY_SECTORS.includes(requestedSector)
      ? requestedSector
      : store.activeSector;
    store.activeSector = validSector;

    const sectorState = store.sectors[validSector];
    const replication = buildMultiRegionReplicationStatus(
      store.primaryClusterId,
      sectorState,
      Object.keys(store.commanders).length,
      store.lastDiskFlushIso
    );

    const session = resolveRequestSession(req);
    const commandersPublic = Object.values(store.commanders).map((c) =>
      session?.permissions.canAccessGmConsole ? c : redactCommanderForPublicStatus(c)
    );

    res.json({
      ok: true,
      engine: 'Voxel Realms Authoritative 20Hz Siege & Multi-Region Persistence Server',
      connectedWebSocketPeers: peers.size,
      activeSector: validSector,
      sectorState,
      replication,
      commanders: commandersPublic,
    });
  });

  app.post('/api/online/sync', (req, res) => {
    const session = requireAuthenticatedSession(req, res);
    if (!session) return;

    const body = (req.body || {}) as Record<string, unknown>;

    if (
      typeof body.primaryClusterId === 'string' &&
      ALLOWED_CLUSTER_IDS.includes(body.primaryClusterId as MultiRegionClusterId)
    ) {
      store.primaryClusterId = body.primaryClusterId as MultiRegionClusterId;
    }

    if (
      typeof body.sector === 'string' &&
      ALL_TERRITORY_SECTORS.includes(body.sector as TerritorySectorCode)
    ) {
      store.activeSector = body.sector as TerritorySectorCode;
    }

    const existing = store.commanders[session.commanderId];
    const { snapshot: updatedProfile, sanitizedFields } = sanitizeAndValidateSyncPayload({
      existing,
      incomingBody: body,
      session,
      defaultClusterId: store.primaryClusterId,
    });

    if (sanitizedFields.length > 0) {
      appendAuditEntry(
        store,
        createAuditEntry({
          eventType: 'SYNC_SANITIZED',
          actorEmail: session.email,
          actorRole: session.role,
          outcome: 'clamped',
          detail: `Server rejected/clamped untrusted fields [${sanitizedFields.join(', ')}] on /api/online/sync`,
        })
      );
    }

    store.commanders[session.commanderId] = updatedProfile;
    persistStoreToDisk(store);

    const sectorState = store.sectors[store.activeSector];
    const replication = buildMultiRegionReplicationStatus(
      store.primaryClusterId,
      sectorState,
      Object.keys(store.commanders).length,
      store.lastDiskFlushIso
    );

    res.json({
      ok: true,
      sanitizedFields,
      syncedProfile: updatedProfile,
      replication,
      sectorState,
    });
  });

  app.post('/api/online/siege/cmd', (req, res) => {
    const session = requireAuthenticatedSession(req, res);
    if (!session) return;

    const { sector, troopCmd, rallyCmd } = (req.body || {}) as {
      sector?: TerritorySectorCode;
      troopCmd?: TroopPositionCommandPacket;
      rallyCmd?: RallyActionCommandPacket;
    };

    const bound = bindSiegeCommandToSession({ session, troopCmd, rallyCmd });

    const targetSector: TerritorySectorCode =
      sector && ALL_TERRITORY_SECTORS.includes(sector) ? sector : store.activeSector;
    store.activeSector = targetSector;

    let current = store.sectors[targetSector];
    if (bound.troopCmd) {
      current = applyTroopPositionCommand(current, bound.troopCmd);
    }
    if (bound.rallyCmd) {
      current = applyRallyActionCommand(current, bound.rallyCmd);
    }
    store.sectors[targetSector] = current;
    persistStoreToDisk(store);

    broadcastToSector(targetSector, {
      opcode: SiegeNetOpcode.S2C_FULL_SIEGE_SNAPSHOT,
      serverTick: current.serverTick,
      ackClientSeq: current.cohorts[0]?.lastAckClientSeq ?? 0,
      sector: targetSector,
      stateHash: current.stateHash,
      payload: { sectorState: current },
    });

    res.json({
      ok: true,
      sectorState: current,
    });
  });

  const httpServer = http.createServer(app);

  // ==========================================================================
  // RFC 6455 WEBSOCKET UPGRADE HANDLER ON /ws/siege (SESSION-VERIFIED WRITES)
  // ==========================================================================
  httpServer.on('upgrade', (req, socket, head) => {
    const url = req.url || '';
    if (!url.startsWith('/ws/siege')) {
      return;
    }

    const wsKey = req.headers['sec-websocket-key'];
    if (!wsKey || typeof wsKey !== 'string') {
      socket.destroy();
      return;
    }

    const acceptKey = crypto
      .createHash('sha1')
      .update(wsKey + WS_GUID)
      .digest('base64');

    const responseHeaders = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '\r\n',
    ];
    socket.write(responseHeaders.join('\r\n'));
    if (head && head.length > 0) {
      socket.unshift(head);
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url, `http://${req.headers.host || `localhost:${PORT}`}`);
    } catch {
      socket.destroy();
      return;
    }
    const sectorParam = (parsedUrl.searchParams.get('sector') ||
      store.activeSector) as TerritorySectorCode;
    const validSector: TerritorySectorCode = ALL_TERRITORY_SECTORS.includes(sectorParam)
      ? sectorParam
      : store.activeSector;
    store.activeSector = validSector;

    const wsToken = extractSessionTokenFromHeaders({
      cookieHeader: req.headers.cookie,
      authorizationHeader: req.headers.authorization,
      queryToken: parsedUrl.searchParams.get('token'),
    });
    const resolvedWsSession = resolveAuthenticatedSession({
      token: wsToken,
      secret: securityConfig.sessionSecret,
      roster: store.moderatedPlayers,
    });

    const peerId = `peer-${crypto.randomUUID().slice(0, 8)}`;
    const peer: ConnectedSiegePeer = {
      id: peerId,
      socket,
      subscribedSector: validSector,
      connectedAtIso: new Date().toISOString(),
      session: resolvedWsSession.authenticated ? resolvedWsSession.session : null,
    };
    peers.set(peerId, peer);

    const initialState = store.sectors[validSector];
    const snapshotEnvelope: SiegeNetEnvelope<{ sectorState: AuthoritativeSiegeSectorState }> = {
      opcode: SiegeNetOpcode.S2C_FULL_SIEGE_SNAPSHOT,
      serverTick: initialState.serverTick,
      ackClientSeq: initialState.cohorts[0]?.lastAckClientSeq ?? 0,
      sector: validSector,
      stateHash: initialState.stateHash,
      payload: { sectorState: initialState },
    };
    socket.write(encodeWsTextFrame(JSON.stringify(snapshotEnvelope)));

    socket.on('data', (chunk: Buffer) => {
      const { messages, closeRequested, pingPayload } = decodeWsFrames(chunk);
      if (closeRequested) {
        peers.delete(peerId);
        socket.end();
        return;
      }
      if (pingPayload) {
        const pong = Buffer.concat([
          Buffer.from([0x8a, pingPayload.length & 0x7f]),
          pingPayload.subarray(0, 125),
        ]);
        socket.write(pong);
      }

      for (const rawMsg of messages) {
        try {
          const parsed = JSON.parse(rawMsg) as {
            opcode?: SiegeNetOpcode;
            sector?: TerritorySectorCode;
            payload?: unknown;
          };

          if (parsed.sector && ALL_TERRITORY_SECTORS.includes(parsed.sector)) {
            peer.subscribedSector = parsed.sector;
            store.activeSector = parsed.sector;
          }

          const isMutatingCommand =
            parsed.opcode === SiegeNetOpcode.C2S_TROOP_POSITION_CMD ||
            parsed.opcode === SiegeNetOpcode.C2S_RALLY_ACTION_CMD;

          if (isMutatingCommand && !peer.session) {
            appendAuditEntry(
              store,
              createAuditEntry({
                eventType: 'WS_COMMAND_REJECTED',
                actorEmail: 'anonymous',
                actorRole: 'anonymous',
                outcome: 'denied',
                detail: `Rejected unauthenticated WebSocket command (${parsed.opcode}) from ${peerId}`,
              })
            );
            socket.write(
              encodeWsTextFrame(
                JSON.stringify({
                  opcode: 'S2C_AUTH_ERROR',
                  code: 401,
                  error: 'WebSocket state mutations require an authenticated server session.',
                })
              )
            );
            continue;
          }

          const targetSector = peer.subscribedSector;
          let sectorState = store.sectors[targetSector];

          if (
            peer.session &&
            parsed.opcode === SiegeNetOpcode.C2S_TROOP_POSITION_CMD &&
            parsed.payload
          ) {
            const bound = bindSiegeCommandToSession({
              session: peer.session,
              troopCmd: parsed.payload as TroopPositionCommandPacket,
            });
            if (bound.troopCmd) {
              sectorState = applyTroopPositionCommand(sectorState, bound.troopCmd);
              store.sectors[targetSector] = sectorState;
            }
          } else if (
            peer.session &&
            parsed.opcode === SiegeNetOpcode.C2S_RALLY_ACTION_CMD &&
            parsed.payload
          ) {
            const bound = bindSiegeCommandToSession({
              session: peer.session,
              rallyCmd: parsed.payload as RallyActionCommandPacket,
            });
            if (bound.rallyCmd) {
              sectorState = applyRallyActionCommand(sectorState, bound.rallyCmd);
              store.sectors[targetSector] = sectorState;
            }
          }

          broadcastToSector(targetSector, {
            opcode: SiegeNetOpcode.S2C_FULL_SIEGE_SNAPSHOT,
            serverTick: sectorState.serverTick,
            ackClientSeq: sectorState.cohorts[0]?.lastAckClientSeq ?? 0,
            sector: targetSector,
            stateHash: sectorState.stateHash,
            payload: { sectorState },
          });
        } catch {
          // Ignore malformed client frames
        }
      }
    });

    socket.on('close', () => {
      peers.delete(peerId);
    });
    socket.on('error', () => {
      peers.delete(peerId);
    });
  });

  // ==========================================================================
  // VITE MIDDLEWARE (DEV) OR STATIC ASSET SERVING (PRODUCTION)
  // ==========================================================================
  if (!securityConfig.isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(ROOT_DIR, 'dist');
    const distIndexPath = path.join(distPath, 'index.html');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ ok: false, error: `Unknown API route: ${req.method} ${req.path}` });
        return;
      }
      if (fs.existsSync(distIndexPath)) {
        res.sendFile(distIndexPath);
        return;
      }
      res
        .status(503)
        .type('text/plain')
        .send(
          'Production bundle not found in dist/. Run "npm run build" before starting the server.'
        );
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[Voxel Realms Server] Authoritative 20Hz 50v50 Siege, RBAC Auth & Multi-Region Persistence listening on http://0.0.0.0:${PORT}`
    );
  });
}

startServer();
