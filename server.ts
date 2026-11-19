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
  SESSION_COOKIE_NAME,
  authorizeStaffPermission,
  buildClearSessionCookieHeader,
  buildSessionSetCookieHeader,
  createAuditEntry,
  extractSessionTokenFromHeaders,
  issueSessionTokenForOperator,
  issueSessionTokenForPlayer,
  issueSessionTokenFromVerifiedFirebaseUser,
  parseCookieHeader,
  redactCommanderForPublicStatus,
  resolveAuthenticatedSession,
  resolveServerRuntimeSecurityConfig,
  sanitizeAndValidateSyncPayload,
} from './src/game/serverAuth';
import {
  BruteForceLockoutGuard,
  OPERATIONAL_LIMITS,
  SlidingWindowRateLimiter,
  TickLatencyTracker,
  containsUnsafePrototypeKey,
  decodeWsFramesHardened,
  pruneCommanderMap,
  resolveClientIpFromHeaders,
  verifySameOriginRequest,
  verifyWebSocketOrigin,
} from './src/game/serverHardening';
import { AtomicRealmPersistence } from './src/game/serverPersistence';
import {
  AntiCheatGuard,
  sanitizeCloudProfilePatch,
  validateRallyCommandAuthority,
  validateTroopCommandAuthority,
} from './src/game/antiCheat';
import { AuthRequest, requireAuth, verifyFirebaseBearerToken } from './src/middleware/auth.ts';
import {
  createSupportTicketForUid,
  getCommanderProfileForUid,
  getOrCreateUser,
  getRealmSaveForUid,
  listSupportTicketsForUid,
  upsertCommanderProfileForUid,
  upsertRealmSaveForUid,
} from './src/db/users.ts';

const parsedPort = Number.parseInt(process.env.PORT || '', 10);
const PORT = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3000;
const ROOT_DIR = import.meta.dirname ?? process.cwd();
const DATA_DIR = path.resolve(process.env.VOXEL_DATA_DIR || path.join(ROOT_DIR, 'data'));
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_AUDIT_LOG_ENTRIES = OPERATIONAL_LIMITS.MAX_AUDIT_LOG_ENTRIES;

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

function isValidPersistedStore(raw: unknown): raw is PersistedMultiRegionStore {
  if (!raw || typeof raw !== 'object') return false;
  const parsed = raw as Partial<PersistedMultiRegionStore>;
  return Boolean(
    parsed.sectors &&
    typeof parsed.sectors === 'object' &&
    parsed.sectors.B2 &&
    typeof parsed.activeSector === 'string' &&
    Array.isArray(parsed.moderatedPlayers)
  );
}

function createDefaultStore(): PersistedMultiRegionStore {
  const sectors = {} as Record<TerritorySectorCode, AuthoritativeSiegeSectorState>;
  for (const sector of ALL_TERRITORY_SECTORS) {
    sectors[sector] = createInitialAuthoritativeSiegeSectorState(sector);
  }

  const nowIso = new Date().toISOString();
  return {
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
}

// ============================================================================
// RFC 6455 WEBSOCKET FRAMING HELPERS (ZERO EXTERNAL WS DEPENDENCY REQUIRED)
// ============================================================================

interface ConnectedSiegePeer {
  id: string;
  ip: string;
  socket: Duplex;
  subscribedSector: TerritorySectorCode;
  connectedAtIso: string;
  session: ServerSessionInfo | null;
  rxBuffer: Buffer;
  msgLimiter: SlidingWindowRateLimiter;
  rateViolations: number;
  lastClientSeq: number;
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

function encodeWsCloseFrame(code: number, reason: string = ''): Buffer {
  const reasonBuf = Buffer.from(reason.slice(0, 64), 'utf8');
  const payload = Buffer.alloc(2 + reasonBuf.length);
  payload.writeUInt16BE(code, 0);
  reasonBuf.copy(payload, 2);
  return Buffer.concat([Buffer.from([0x88, payload.length]), payload]);
}

async function startServer() {
  const securityConfig = resolveServerRuntimeSecurityConfig(process.env);
  if (
    securityConfig.failClosedMisconfigured ||
    !securityConfig.sessionSecret ||
    !securityConfig.adminPasskey
  ) {
    const fatalReason =
      securityConfig.misconfigurationReason ||
      'Critical secrets VOXEL_SESSION_SECRET and VOXEL_ADMIN_PASSKEY must be configured.';
    console.error(`[SECURITY FATAL] Refusing to start server (fail-closed): ${fatalReason}`);
    process.exit(1);
  }

  const persistence = new AtomicRealmPersistence<PersistedMultiRegionStore>({
    dataDir: DATA_DIR,
    fileName: 'online_realm_state.json',
    validateState: isValidPersistedStore,
  });

  const store = persistence.loadWithBackupRecovery(createDefaultStore);
  const persistStoreToDisk = (targetStore: PersistedMultiRegionStore) => {
    targetStore.lastDiskFlushIso = new Date().toISOString();
    pruneCommanderMap(targetStore.commanders, OPERATIONAL_LIMITS.MAX_PERSISTED_COMMANDERS);
    if (targetStore.supportTickets.length > OPERATIONAL_LIMITS.MAX_SUPPORT_TICKETS) {
      targetStore.supportTickets.length = OPERATIONAL_LIMITS.MAX_SUPPORT_TICKETS;
    }
    persistence.saveAtomic(targetStore, targetStore.lastDiskFlushIso);
  };

  if (persistence.getHealthMetrics().recoveredFromBackup) {
    console.warn(
      `[Voxel Realms Persistence] Automatically recovered realm state from verified .bak snapshot (${persistence.getHealthMetrics().recoveryReason}).`
    );
  }

  const apiWriteLimiter = new SlidingWindowRateLimiter({
    maxRequests:
      Number.parseInt(process.env.VOXEL_API_WRITE_LIMIT_PER_MIN || '', 10) ||
      OPERATIONAL_LIMITS.API_WRITES_PER_MINUTE,
    windowMs: 60_000,
    maxKeys: 10_000,
  });
  const loginLockoutGuard = new BruteForceLockoutGuard({
    maxAttempts: OPERATIONAL_LIMITS.AUTH_FAIL_MAX_ATTEMPTS,
    lockoutMs: OPERATIONAL_LIMITS.AUTH_LOCKOUT_MS,
  });
  const tickLatencyTracker = new TickLatencyTracker({ capacity: 200, budgetMs: 50 });
  const antiCheatGuard = new AntiCheatGuard({
    windowMs: 60_000,
    strikeLimit: 6,
    quarantineMs: 60_000,
  });

  const opsCounters = {
    startedAtIso: new Date().toISOString(),
    httpRequestsTotal: 0,
    rateLimitBlocks: 0,
    csrfBlocks: 0,
    prototypePollutionBlocks: 0,
    wsConnectionsAccepted: 0,
    wsConnectionsRejected: 0,
    wsFramesRejected: 0,
    wsRateLimitDisconnects: 0,
    wsSlowConsumerDisconnects: 0,
    antiCheatRejections: 0,
    antiCheatSanitizedWrites: 0,
    antiCheatStrikeLockouts: 0,
  };
  let isShuttingDown = false;

  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '512kb' }));

  // Baseline Security Headers + Request Counter + Prototype Pollution & CSRF & Rate Limit Middleware
  app.use((req, res, next) => {
    opsCounters.httpRequestsTotal += 1;
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' ws: wss: https:",
        "worker-src 'self' blob:",
        "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
        "frame-ancestors 'self' https://*.google.com https://*.googleusercontent.com https://aistudio.google.com",
        "object-src 'none'",
        "base-uri 'self'",
      ].join('; ')
    );
    if (securityConfig.isProduction && process.env.ALLOW_PREVIEW_IFRAME !== 'true') {
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }
    if (securityConfig.isProduction || isHttpsRequest(req)) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store');
    }

    if (req.path.startsWith('/api/') && req.method !== 'GET' && req.method !== 'HEAD') {
      if (isShuttingDown) {
        res.setHeader('Connection', 'close');
        res.status(503).json({ ok: false, error: 'Server is gracefully shutting down.' });
        return;
      }

      if (containsUnsafePrototypeKey(req.body)) {
        opsCounters.prototypePollutionBlocks += 1;
        appendAuditEntry(
          store,
          createAuditEntry({
            eventType: 'AUTHZ_DENIED',
            actorEmail: 'anonymous',
            actorRole: 'anonymous',
            outcome: 'denied',
            detail: `Blocked prototype pollution key on ${req.method} ${req.path}`,
          })
        );
        res.status(400).json({ ok: false, error: 'Invalid object key in request payload.' });
        return;
      }

      const cookies = parseCookieHeader(req.headers.cookie);
      const hasSessionCookie = Boolean(cookies[SESSION_COOKIE_NAME]);
      const hasBearerAuth = Boolean(req.headers.authorization?.startsWith('Bearer '));
      const csrfCheck = verifySameOriginRequest({
        method: req.method,
        originHeader: typeof req.headers.origin === 'string' ? req.headers.origin : undefined,
        refererHeader: typeof req.headers.referer === 'string' ? req.headers.referer : undefined,
        hostHeader: typeof req.headers.host === 'string' ? req.headers.host : undefined,
        hasSessionCookie,
        hasBearerAuth,
        appUrl: process.env.APP_URL,
      });
      if (!csrfCheck.allowed) {
        opsCounters.csrfBlocks += 1;
        res.status(403).json({ ok: false, error: csrfCheck.reason });
        return;
      }

      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const rateCheck = apiWriteLimiter.check(`write:${clientIp}:${req.path}`);
      if (!rateCheck.allowed) {
        opsCounters.rateLimitBlocks += 1;
        res.setHeader('Retry-After', String(rateCheck.retryAfterSec));
        res.status(429).json({
          ok: false,
          error: `Rate limit exceeded on ${req.path}. Retry after ${rateCheck.retryAfterSec}s.`,
        });
        return;
      }
    }

    next();
  });

  app.get(['/healthz', '/api/health'], (_req, res) => {
    if (isShuttingDown) {
      res.status(503).json({ ok: false, status: 'shutting_down' });
      return;
    }
    res.status(200).json({
      ok: true,
      status: 'healthy',
      uptimeSec: Math.round(process.uptime()),
    });
  });

  const peers = new Map<string, ConnectedSiegePeer>();

  app.get('/readyz', (_req, res) => {
    const persistHealth = persistence.getHealthMetrics();
    const tickStats = tickLatencyTracker.getSummary();
    const ready =
      !isShuttingDown &&
      persistHealth.writable &&
      tickStats.overrunCount < 50 &&
      peers.size < OPERATIONAL_LIMITS.MAX_WS_PEERS;

    res.status(ready ? 200 : 503).json({
      ok: ready,
      status: ready ? 'ready' : isShuttingDown ? 'draining' : 'degraded',
      checks: {
        notShuttingDown: !isShuttingDown,
        storageWritable: persistHealth.writable,
        recoveredFromBackup: persistHealth.recoveredFromBackup,
        tickBudgetHealthy: tickStats.overrunCount < 50,
        wsCapacityAvailable: peers.size < OPERATIONAL_LIMITS.MAX_WS_PEERS,
      },
      uptimeSec: Math.round(process.uptime()),
    });
  });

  app.get('/metrics', (_req, res) => {
    const persistHealth = persistence.getHealthMetrics();
    const tickStats = tickLatencyTracker.getSummary();
    const mem = process.memoryUsage();
    const isUp = !isShuttingDown && persistHealth.writable ? 1 : 0;

    const lines = [
      '# HELP voxel_up Whether the authoritative Voxel Realms server is healthy and writable (1=up, 0=degraded).',
      '# TYPE voxel_up gauge',
      `voxel_up ${isUp}`,
      '# HELP voxel_uptime_seconds Server process uptime in seconds.',
      '# TYPE voxel_uptime_seconds gauge',
      `voxel_uptime_seconds ${Math.round(process.uptime())}`,
      '# HELP voxel_ws_active_peers Number of active WebSocket siege peers.',
      '# TYPE voxel_ws_active_peers gauge',
      `voxel_ws_active_peers ${peers.size}`,
      '# HELP voxel_ws_max_peers Configured maximum concurrent WebSocket peers.',
      '# TYPE voxel_ws_max_peers gauge',
      `voxel_ws_max_peers ${OPERATIONAL_LIMITS.MAX_WS_PEERS}`,
      '# HELP voxel_tick_duration_p95_ms 95th percentile 20Hz authoritative siege tick duration in milliseconds.',
      '# TYPE voxel_tick_duration_p95_ms gauge',
      `voxel_tick_duration_p95_ms ${tickStats.p95Ms}`,
      '# HELP voxel_tick_duration_max_ms Max observed 20Hz authoritative siege tick duration in milliseconds.',
      '# TYPE voxel_tick_duration_max_ms gauge',
      `voxel_tick_duration_max_ms ${tickStats.maxMs}`,
      '# HELP voxel_tick_overruns_total Total number of 20Hz ticks exceeding the 50ms frame budget.',
      '# TYPE voxel_tick_overruns_total counter',
      `voxel_tick_overruns_total ${tickStats.overrunCount}`,
      '# HELP voxel_memory_rss_bytes Resident set size in bytes.',
      '# TYPE voxel_memory_rss_bytes gauge',
      `voxel_memory_rss_bytes ${mem.rss}`,
      '# HELP voxel_memory_heap_used_bytes V8 heap used in bytes.',
      '# TYPE voxel_memory_heap_used_bytes gauge',
      `voxel_memory_heap_used_bytes ${mem.heapUsed}`,
      '# HELP voxel_http_requests_total Total HTTP requests handled.',
      '# TYPE voxel_http_requests_total counter',
      `voxel_http_requests_total ${opsCounters.httpRequestsTotal}`,
      '# HELP voxel_persistence_writes_total Total atomic state persistence flushes completed.',
      '# TYPE voxel_persistence_writes_total counter',
      `voxel_persistence_writes_total ${persistHealth.totalWrites}`,
      '# HELP voxel_persistence_failed_writes_total Total failed persistence flushes.',
      '# TYPE voxel_persistence_failed_writes_total counter',
      `voxel_persistence_failed_writes_total ${persistHealth.failedWrites}`,
      '# HELP voxel_security_rate_limit_blocks_total Total HTTP requests blocked by rate limiting.',
      '# TYPE voxel_security_rate_limit_blocks_total counter',
      `voxel_security_rate_limit_blocks_total ${opsCounters.rateLimitBlocks}`,
      '# HELP voxel_security_bruteforce_lockouts_total Total admin passkey brute-force lockouts triggered.',
      '# TYPE voxel_security_bruteforce_lockouts_total counter',
      `voxel_security_bruteforce_lockouts_total ${loginLockoutGuard.getTotalLockoutsTriggered()}`,
      '# HELP voxel_security_csrf_blocks_total Total cross-origin CSRF attempts blocked.',
      '# TYPE voxel_security_csrf_blocks_total counter',
      `voxel_security_csrf_blocks_total ${opsCounters.csrfBlocks}`,
      '# HELP voxel_security_proto_pollution_blocks_total Total prototype-pollution payloads rejected.',
      '# TYPE voxel_security_proto_pollution_blocks_total counter',
      `voxel_security_proto_pollution_blocks_total ${opsCounters.prototypePollutionBlocks}`,
      '# HELP voxel_anticheat_rejections_total Total authoritative anti-cheat command rejections.',
      '# TYPE voxel_anticheat_rejections_total counter',
      `voxel_anticheat_rejections_total ${opsCounters.antiCheatRejections}`,
      '',
    ];

    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(lines.join('\n'));
  });

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

  app.get('/api/ops/readiness', (req, res) => {
    const session = resolveRequestSession(req);
    const isPrivileged = Boolean(session?.permissions.canAccessGmConsole);
    const persistHealth = persistence.getHealthMetrics();
    const mem = process.memoryUsage();
    const tickStats = tickLatencyTracker.getSummary();

    res.json({
      ok: true,
      status: isShuttingDown ? 'draining' : persistHealth.writable ? 'operational' : 'degraded',
      startedAtIso: opsCounters.startedAtIso,
      uptimeSec: Math.round(process.uptime()),
      capacityLimits: {
        maxConcurrentWsPeers: OPERATIONAL_LIMITS.MAX_WS_PEERS,
        activeWsPeers: peers.size,
        maxWsPeersPerIp: OPERATIONAL_LIMITS.MAX_WS_PEERS_PER_IP,
        maxWsFrameBytes: OPERATIONAL_LIMITS.MAX_WS_FRAME_BYTES,
        maxWsMessagesPerSec: OPERATIONAL_LIMITS.WS_MESSAGES_PER_WINDOW,
        maxApiWritesPerMinPerIp: OPERATIONAL_LIMITS.API_WRITES_PER_MINUTE,
        maxPersistedCommanders: OPERATIONAL_LIMITS.MAX_PERSISTED_COMMANDERS,
        activePersistedCommanders: Object.keys(store.commanders).length,
      },
      tickLoop20Hz: tickStats,
      memoryMb: {
        rss: Math.round((mem.rss / 1_048_576) * 10) / 10,
        heapUsed: Math.round((mem.heapUsed / 1_048_576) * 10) / 10,
      },
      persistence: {
        writable: persistHealth.writable,
        totalWrites: persistHealth.totalWrites,
        failedWrites: persistHealth.failedWrites,
        recoveredFromBackup: persistHealth.recoveredFromBackup,
        lastWriteDurationMs: persistHealth.lastWriteDurationMs,
        lastFlushAtIso: persistHealth.lastFlushAtIso,
        ...(isPrivileged
          ? {
              primaryPath: persistHealth.primaryPath,
              backupPath: persistHealth.backupPath,
              recoveryReason: persistHealth.recoveryReason,
              lastError: persistHealth.lastError,
            }
          : {}),
      },
      exploitDefenseCounters: {
        httpRequestsTotal: opsCounters.httpRequestsTotal,
        rateLimitBlocks: opsCounters.rateLimitBlocks,
        bruteForceLockouts: loginLockoutGuard.getTotalLockoutsTriggered(),
        csrfBlocks: opsCounters.csrfBlocks,
        prototypePollutionBlocks: opsCounters.prototypePollutionBlocks,
        wsFramesRejected: opsCounters.wsFramesRejected,
        wsRateLimitDisconnects: opsCounters.wsRateLimitDisconnects,
        wsSlowConsumerDisconnects: opsCounters.wsSlowConsumerDisconnects,
        antiCheatRejections: opsCounters.antiCheatRejections,
        antiCheatSanitizedWrites: opsCounters.antiCheatSanitizedWrites,
        antiCheatStrikeLockouts: opsCounters.antiCheatStrikeLockouts,
      },
      deploymentTopologyBoundary:
        'Single-instance Node.js authoritative server with atomic SHA-256 disk persistence (.bak failover). Horizontal multi-pod scaling requires an external database (Cloud SQL/Spanner) and Redis pub/sub adapter.',
    });
  });

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
        if (peer.socket.writableLength > OPERATIONAL_LIMITS.WS_SLOW_CONSUMER_HIGH_WATER_BYTES) {
          opsCounters.wsSlowConsumerDisconnects += 1;
          peers.delete(peerId);
          try {
            peer.socket.end(encodeWsCloseFrame(1008, 'Slow consumer backpressure exceeded'));
          } catch {
            peer.socket.destroy();
          }
          continue;
        }
        try {
          peer.socket.write(frame);
        } catch {
          peers.delete(peerId);
        }
      }
    }
  };

  const broadcastSectorPresence = (sector: TerritorySectorCode) => {
    let connectedPeersInSector = 0;
    let authenticatedPeers = 0;
    for (const p of peers.values()) {
      if (p.subscribedSector === sector && !p.socket.destroyed) {
        connectedPeersInSector += 1;
        if (p.session) authenticatedPeers += 1;
      }
    }
    const sectorState = store.sectors[sector];
    broadcastToSector(sector, {
      opcode: SiegeNetOpcode.S2C_SECTOR_PRESENCE,
      serverTick: sectorState.serverTick,
      ackClientSeq: sectorState.cohorts[0]?.lastAckClientSeq ?? 0,
      sector,
      stateHash: sectorState.stateHash,
      payload: {
        sector,
        connectedPeersInSector,
        authenticatedPeers,
      },
    });
  };

  // ==========================================================================
  // AUTHORITATIVE 20HZ (50ms) SIEGE SERVER LOOP & PERIODIC DISK PERSISTENCE
  // ==========================================================================
  let tickCounter = 0;
  const siegeTickInterval = setInterval(() => {
    if (isShuttingDown) return;
    const tickStartNs = process.hrtime.bigint();
    tickCounter++;
    const sectorsToTick = new Set<TerritorySectorCode>([store.activeSector]);
    for (const peer of peers.values()) {
      sectorsToTick.add(peer.subscribedSector);
    }

    for (const sectorCode of sectorsToTick) {
      const currentSectorState = store.sectors[sectorCode];
      if (!currentSectorState) continue;
      const { nextState, deltaPacket } = stepAuthoritativeSiegeTick(currentSectorState);
      store.sectors[sectorCode] = nextState;

      if (peers.size > 0) {
        broadcastToSector(sectorCode, deltaPacket);

        if (nextState.serverTick % 100 === 0) {
          broadcastToSector(sectorCode, {
            opcode: SiegeNetOpcode.S2C_FULL_SIEGE_SNAPSHOT,
            serverTick: nextState.serverTick,
            ackClientSeq: nextState.cohorts[0]?.lastAckClientSeq ?? 0,
            sector: sectorCode,
            stateHash: nextState.stateHash,
            payload: { sectorState: nextState },
          });
        }
      }
    }

    if (tickCounter % 200 === 0) {
      persistStoreToDisk(store);
    }

    const elapsedMs = Number(process.hrtime.bigint() - tickStartNs) / 1_000_000;
    tickLatencyTracker.record(elapsedMs);
  }, 50);

  const sweepInterval = setInterval(() => {
    apiWriteLimiter.sweepExpired();
    pruneCommanderMap(store.commanders, OPERATIONAL_LIMITS.MAX_PERSISTED_COMMANDERS);
  }, 15_000);
  sweepInterval.unref();

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

  app.post('/api/auth/firebase-exchange', async (req, res) => {
    const verified = await verifyFirebaseBearerToken(req.headers.authorization);
    if (!verified.ok) {
      appendAuditEntry(
        store,
        createAuditEntry({
          eventType: 'ADMIN_LOGIN_FAILED',
          actorEmail: 'anonymous',
          actorRole: 'anonymous',
          outcome: 'denied',
          detail: `Firebase ID token exchange rejected: ${verified.error}`,
        })
      );
      res.status(401).json({ ok: false, error: verified.error });
      return;
    }

    const decoded = verified.decoded;
    const result = issueSessionTokenFromVerifiedFirebaseUser({
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: Boolean(decoded.email_verified),
      displayName: typeof decoded.name === 'string' ? decoded.name : undefined,
      roster: store.moderatedPlayers,
      secret: securityConfig.sessionSecret,
    });

    if (!result.ok) {
      appendAuditEntry(
        store,
        createAuditEntry({
          eventType: 'ADMIN_LOGIN_FAILED',
          actorEmail: (decoded.email || 'anonymous').toLowerCase(),
          actorRole: 'anonymous',
          outcome: 'denied',
          detail: result.error,
        })
      );
      persistStoreToDisk(store);
      res.status(result.statusCode).json({ ok: false, error: result.error });
      return;
    }

    // Best-effort sync to PostgreSQL user table when Cloud SQL runtime variables are active
    if (process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_DB_NAME) {
      getOrCreateUser(decoded.uid, result.session.email, result.session.displayName).catch(
        (err) => {
          console.warn('Non-fatal PostgreSQL user sync warning during auth exchange:', err);
        }
      );
    }

    res.setHeader('Set-Cookie', buildSessionSetCookieHeader(result.token, isHttpsRequest(req)));

    appendAuditEntry(
      store,
      createAuditEntry({
        eventType: result.session.permissions.canAccessGmConsole
          ? 'ADMIN_LOGIN_SUCCESS'
          : 'PLAYER_SESSION_ISSUED',
        actorEmail: result.session.email,
        actorRole: result.session.role,
        outcome: 'allowed',
        detail: `Verified Firebase Google session exchanged for ${result.session.email} (Clearance Lv.${result.session.clearanceLevel})`,
      })
    );
    persistStoreToDisk(store);

    res.json({
      ok: true,
      authenticated: true,
      authSource: 'firebase_id_token',
      session: result.session,
    });
  });

  app.post('/api/auth/player-session', (req, res) => {
    const body = (req.body || {}) as {
      commanderId?: string;
      displayName?: string;
    };

    const issued = issueSessionTokenForPlayer({
      commanderId: body.commanderId || `guest-${crypto.randomUUID().slice(0, 8)}`,
      displayName: body.displayName || 'Guest Vanguard',
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
        detail: `Issued scoped guest session (Clearance Lv.1) for ${issued.session.commanderId}`,
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
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const lockoutKey = `${clientIp}:admin-login`;
    const lockStatus = loginLockoutGuard.isLocked(lockoutKey);
    if (lockStatus.locked) {
      res.setHeader('Retry-After', String(lockStatus.retryAfterSec));
      res.status(429).json({
        ok: false,
        error: `Too many failed operator login attempts. Account locked for ${lockStatus.retryAfterSec}s.`,
      });
      return;
    }

    const body = (req.body || {}) as { email?: string; passkey?: string };
    const result = issueSessionTokenForOperator({
      email: body.email || '',
      passkey: body.passkey || '',
      configuredPasskey: securityConfig.adminPasskey,
      roster: store.moderatedPlayers,
      secret: securityConfig.sessionSecret,
    });

    if (!result.ok) {
      if (result.statusCode === 401 || result.statusCode === 403) {
        const failInfo = loginLockoutGuard.recordFailure(lockoutKey);
        if (failInfo.lockedNow) {
          res.setHeader('Retry-After', String(failInfo.retryAfterSec));
        }
      }
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

    loginLockoutGuard.recordSuccess(lockoutKey);
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
  // FIREBASE-AUTHENTICATED CLOUD ACCOUNT & REALM PERSISTENCE ROUTES (/api/db/*)
  // ==========================================================================

  function isSqlConnectionUnavailable(error: unknown): boolean {
    if (!process.env.SQL_HOST) return true;
    const msg = error instanceof Error ? error.message : String(error);
    return /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EAI_AGAIN|Connection terminated/i.test(msg);
  }

  app.get('/api/db/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@voxelrealms.local`;
      const displayName =
        typeof req.user!.name === 'string' && req.user!.name.trim()
          ? req.user!.name.trim()
          : 'Sovereign Vanguard';

      const user = await getOrCreateUser(uid, email, displayName);
      const profileRecord = await getCommanderProfileForUid(uid);
      const realmSave = await getRealmSaveForUid(uid);

      res.json({
        ok: true,
        user: {
          id: user.id,
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
        profile: profileRecord?.profile ?? null,
        hasRealmSave: Boolean(realmSave),
        realmSaveUpdatedAt: realmSave?.updatedAt ?? null,
      });
    } catch (error) {
      if (isSqlConnectionUnavailable(error)) {
        res.status(503).json({
          ok: false,
          error: 'Persistent storage service temporarily unavailable.',
        });
        return;
      }
      console.error('Failed to fetch authenticated commander profile:', error);
      res.status(500).json({
        ok: false,
        error: 'Unable to load commander profile.',
      });
    }
  });

  app.put('/api/db/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@voxelrealms.local`;
      const displayName =
        typeof req.user!.name === 'string' && req.user!.name.trim()
          ? req.user!.name.trim()
          : undefined;
      const body = (req.body || {}) as Record<string, unknown>;
      const isPrivilegedStaff = email.trim().toLowerCase() === 'creatergame31@gmail.com';
      const existingRecord = await getCommanderProfileForUid(uid);

      const sanitized = sanitizeCloudProfilePatch({
        existingProfile: existingRecord?.profile ?? null,
        incoming: body,
        isPrivilegedStaff,
      });

      if (sanitized.flaggedViolations.length > 0) {
        opsCounters.antiCheatSanitizedWrites += 1;
        appendAuditEntry(
          store,
          createAuditEntry({
            eventType: 'ANTI_CHEAT_TRIGGERED',
            actorEmail: email,
            actorRole: isPrivilegedStaff ? 'owner_admin' : 'player',
            outcome: 'clamped',
            detail: `Sanitized cloud profile tamper attempt on PUT /api/db/profile: [${sanitized.flaggedViolations.join(', ')}]`,
          })
        );
        persistStoreToDisk(store);
      }

      const saved = await upsertCommanderProfileForUid(uid, email, displayName, sanitized.patch);

      res.json({
        ok: true,
        sanitizedFields: sanitized.flaggedViolations,
        user: saved.user,
        profile: saved.profile,
      });
    } catch (error) {
      if (isSqlConnectionUnavailable(error)) {
        res.status(503).json({
          ok: false,
          error: 'Persistent storage service temporarily unavailable.',
        });
        return;
      }
      console.error('Failed to save authenticated commander profile:', error);
      res.status(500).json({
        ok: false,
        error: 'Unable to save commander profile.',
      });
    }
  });

  app.get('/api/db/save', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const save = await getRealmSaveForUid(uid);
      if (!save) {
        res.json({ ok: true, exists: false, snapshot: null, version: 0, updatedAt: null });
        return;
      }
      res.json({
        ok: true,
        exists: true,
        snapshot: JSON.parse(save.snapshotJson),
        version: save.version,
        updatedAt: save.updatedAt,
      });
    } catch (error) {
      if (isSqlConnectionUnavailable(error)) {
        res.status(503).json({
          ok: false,
          error: 'Persistent storage service temporarily unavailable.',
        });
        return;
      }
      console.error('Failed to load realm save:', error);
      res.status(500).json({
        ok: false,
        error: 'Unable to load realm save.',
      });
    }
  });

  app.put('/api/db/save', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@voxelrealms.local`;
      const displayName =
        typeof req.user!.name === 'string' && req.user!.name.trim()
          ? req.user!.name.trim()
          : undefined;
      const body = (req.body || {}) as { snapshot?: unknown; version?: number };
      if (!body.snapshot || typeof body.snapshot !== 'object') {
        res.status(400).json({ ok: false, error: 'Invalid realm snapshot payload.' });
        return;
      }

      const isPrivilegedStaff = email.trim().toLowerCase() === 'creatergame31@gmail.com';
      const existingRecord = await getCommanderProfileForUid(uid);
      const snapshotObj = body.snapshot as Record<string, unknown>;
      const sanitized = sanitizeCloudProfilePatch({
        existingProfile: existingRecord?.profile ?? null,
        incoming: snapshotObj,
        isPrivilegedStaff,
      });

      let safeSnapshot: Record<string, unknown> = snapshotObj;
      if (sanitized.flaggedViolations.length > 0) {
        opsCounters.antiCheatSanitizedWrites += 1;
        appendAuditEntry(
          store,
          createAuditEntry({
            eventType: 'ANTI_CHEAT_TRIGGERED',
            actorEmail: email,
            actorRole: isPrivilegedStaff ? 'owner_admin' : 'player',
            outcome: 'clamped',
            detail: `Sanitized cloud save tamper attempt on PUT /api/db/save: [${sanitized.flaggedViolations.join(', ')}]`,
          })
        );
        persistStoreToDisk(store);
        safeSnapshot = {
          ...snapshotObj,
          ...(sanitized.patch.castleLevel !== undefined
            ? { castleLevel: sanitized.patch.castleLevel }
            : {}),
          ...(sanitized.patch.cultivationRealmIndex !== undefined
            ? { cultivationRealmIndex: sanitized.patch.cultivationRealmIndex }
            : {}),
          ...(sanitized.patch.vipTier !== undefined ? { vipTier: sanitized.patch.vipTier } : {}),
          ...(sanitized.patch.garrisonTroopsWire !== undefined
            ? { garrisonTroopsWire: sanitized.patch.garrisonTroopsWire }
            : {}),
        };
      }

      const serialized = JSON.stringify(safeSnapshot);
      if (serialized.length > 262_144) {
        res.status(413).json({ ok: false, error: 'Realm snapshot exceeds 256 KB limit.' });
        return;
      }

      const save = await upsertRealmSaveForUid(
        uid,
        email,
        displayName,
        serialized,
        typeof body.version === 'number' ? body.version : 1
      );

      res.json({
        ok: true,
        sanitizedFields: sanitized.flaggedViolations,
        version: save.version,
        updatedAt: save.updatedAt,
      });
    } catch (error) {
      if (isSqlConnectionUnavailable(error)) {
        res.status(503).json({
          ok: false,
          error: 'Persistent storage service temporarily unavailable.',
        });
        return;
      }
      console.error('Failed to persist realm save:', error);
      res.status(500).json({
        ok: false,
        error: 'Unable to save realm progress.',
      });
    }
  });

  app.get('/api/db/tickets', requireAuth, async (req: AuthRequest, res) => {
    try {
      const tickets = await listSupportTicketsForUid(req.user!.uid);
      res.json({ ok: true, tickets });
    } catch (error) {
      if (isSqlConnectionUnavailable(error)) {
        res.status(503).json({
          ok: false,
          error: 'Persistent storage service temporarily unavailable.',
        });
        return;
      }
      console.error('Failed to list support tickets:', error);
      res.status(500).json({
        ok: false,
        error: 'Unable to load support tickets.',
      });
    }
  });

  app.post('/api/db/tickets', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@voxelrealms.local`;
      const displayName =
        typeof req.user!.name === 'string' && req.user!.name.trim()
          ? req.user!.name.trim()
          : undefined;
      const body = (req.body || {}) as { category?: string; subject?: string; message?: string };
      if (!body.subject?.trim() || !body.message?.trim()) {
        res.status(400).json({ ok: false, error: 'Subject and message are required.' });
        return;
      }

      const ticket = await createSupportTicketForUid(uid, email, displayName, {
        category: body.category || 'general',
        subject: body.subject,
        message: body.message,
      });
      res.status(201).json({ ok: true, ticket });
    } catch (error) {
      if (isSqlConnectionUnavailable(error)) {
        res.status(503).json({
          ok: false,
          error: 'Persistent storage service temporarily unavailable.',
        });
        return;
      }
      console.error('Failed to create support ticket:', error);
      res.status(500).json({
        ok: false,
        error: 'Unable to submit support ticket.',
      });
    }
  });

  // ==========================================================================
  // MULTI-REGION PERSISTENCE & SIEGE REST API ROUTES (/api/online/*)
  // ==========================================================================

  app.get('/api/online/status', (req, res) => {
    const requestedSector = (req.query.sector as TerritorySectorCode) || store.activeSector;
    const validSector: TerritorySectorCode = ALL_TERRITORY_SECTORS.includes(requestedSector)
      ? requestedSector
      : store.activeSector;
    // Strictly read-only: anonymous GET requests must never mutate global store.activeSector

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
      globalActiveSector: store.activeSector,
      sectorState,
      replication,
      commanders: commandersPublic,
    });
  });

  app.post('/api/online/sync', (req, res) => {
    const session = requireAuthenticatedSession(req, res);
    if (!session) return;

    const body = (req.body || {}) as Record<string, unknown>;
    const canMutateGlobalRealmConfig = session.permissions.canAccessGmConsole;
    const rejectedGlobalFields: string[] = [];

    if (
      typeof body.primaryClusterId === 'string' &&
      ALLOWED_CLUSTER_IDS.includes(body.primaryClusterId as MultiRegionClusterId)
    ) {
      if (canMutateGlobalRealmConfig) {
        store.primaryClusterId = body.primaryClusterId as MultiRegionClusterId;
      } else if (body.primaryClusterId !== store.primaryClusterId) {
        rejectedGlobalFields.push('primaryClusterId');
      }
    }

    const requestedSector: TerritorySectorCode =
      typeof body.sector === 'string' &&
      ALL_TERRITORY_SECTORS.includes(body.sector as TerritorySectorCode)
        ? (body.sector as TerritorySectorCode)
        : store.activeSector;

    if (canMutateGlobalRealmConfig && typeof body.sector === 'string') {
      store.activeSector = requestedSector;
    }

    const existing = store.commanders[session.commanderId];
    const { snapshot: updatedProfile, sanitizedFields: profileSanitizedFields } =
      sanitizeAndValidateSyncPayload({
        existing,
        incomingBody: body,
        session,
        defaultClusterId: store.primaryClusterId,
      });
    const sanitizedFields = [...profileSanitizedFields, ...rejectedGlobalFields];

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

    const sectorState = store.sectors[requestedSector];
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

    const quarantine = antiCheatGuard.isQuarantined(
      session.commanderId,
      Date.now(),
      session.isRootOwner
    );
    if (quarantine.quarantined) {
      res.setHeader('Retry-After', String(quarantine.retryAfterSec));
      res.status(429).json({
        ok: false,
        violation: 'STRIKE_THRESHOLD_LOCKOUT',
        error: `Command privileges temporarily suspended due to anti-cheat violations (${quarantine.retryAfterSec}s remaining).`,
      });
      return;
    }

    const { sector, troopCmd, rallyCmd } = (req.body || {}) as {
      sector?: TerritorySectorCode;
      troopCmd?: TroopPositionCommandPacket;
      rallyCmd?: RallyActionCommandPacket;
    };

    if (!troopCmd && !rallyCmd) {
      res.status(400).json({
        ok: false,
        violation: 'INVALID_ENUM_INJECTION',
        error: 'Missing troopCmd or rallyCmd payload.',
      });
      return;
    }

    const targetSector: TerritorySectorCode =
      sector && ALL_TERRITORY_SECTORS.includes(sector) ? sector : store.activeSector;

    let current = store.sectors[targetSector];
    const warnings: string[] = [];

    if (troopCmd) {
      const troopCheck = validateTroopCommandAuthority({
        sectorState: current,
        session,
        rawCmd: troopCmd,
      });
      if (!troopCheck.allowed) {
        opsCounters.antiCheatRejections += 1;
        const strike = antiCheatGuard.recordStrike(
          session.commanderId,
          troopCheck.violation,
          Date.now(),
          session.isRootOwner
        );
        if (strike.quarantinedNow) {
          opsCounters.antiCheatStrikeLockouts += 1;
          res.setHeader('Retry-After', String(strike.retryAfterSec));
        }
        appendAuditEntry(
          store,
          createAuditEntry({
            eventType: 'ANTI_CHEAT_TRIGGERED',
            actorEmail: session.email,
            actorRole: session.role,
            outcome: 'denied',
            detail: `HTTP troopCmd rejected (${troopCheck.violation}, strike ${strike.strikeCount}): ${troopCheck.reason}`,
          })
        );
        persistStoreToDisk(store);
        res.status(strike.quarantinedNow ? 429 : troopCheck.statusCode).json({
          ok: false,
          violation: troopCheck.violation,
          strikeCount: strike.strikeCount,
          error: troopCheck.reason,
        });
        return;
      }
      warnings.push(...troopCheck.sanitizedWarnings);
      current = applyTroopPositionCommand(current, troopCheck.command);
    }

    if (rallyCmd) {
      const rallyCheck = validateRallyCommandAuthority({
        sectorState: current,
        session,
        serverCommander: store.commanders[session.commanderId],
        rawCmd: rallyCmd,
      });
      if (!rallyCheck.allowed) {
        opsCounters.antiCheatRejections += 1;
        const strike = antiCheatGuard.recordStrike(
          session.commanderId,
          rallyCheck.violation,
          Date.now(),
          session.isRootOwner
        );
        if (strike.quarantinedNow) {
          opsCounters.antiCheatStrikeLockouts += 1;
          res.setHeader('Retry-After', String(strike.retryAfterSec));
        }
        appendAuditEntry(
          store,
          createAuditEntry({
            eventType: 'ANTI_CHEAT_TRIGGERED',
            actorEmail: session.email,
            actorRole: session.role,
            outcome: 'denied',
            detail: `HTTP rallyCmd rejected (${rallyCheck.violation}, strike ${strike.strikeCount}): ${rallyCheck.reason}`,
          })
        );
        persistStoreToDisk(store);
        res.status(strike.quarantinedNow ? 429 : rallyCheck.statusCode).json({
          ok: false,
          violation: rallyCheck.violation,
          strikeCount: strike.strikeCount,
          error: rallyCheck.reason,
        });
        return;
      }
      warnings.push(...rallyCheck.sanitizedWarnings);
      current = applyRallyActionCommand(current, rallyCheck.command);
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
      sanitizedWarnings: warnings,
      sectorState: current,
    });
  });

  const httpServer = http.createServer(app);

  // ==========================================================================
  // RFC 6455 WEBSOCKET UPGRADE HANDLER ON /ws/siege (HARDENED & SESSION-BOUND)
  // ==========================================================================
  httpServer.on('upgrade', (req, socket, head) => {
    const url = req.url || '';
    if (!url.startsWith('/ws/siege')) {
      return;
    }

    if (isShuttingDown || peers.size >= OPERATIONAL_LIMITS.MAX_WS_PEERS) {
      opsCounters.wsConnectionsRejected += 1;
      socket.write('HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }

    // Validate Origin header to defend against Cross-Site WebSocket Hijacking (CSWSH)
    const originCheck = verifyWebSocketOrigin({
      originHeader: req.headers.origin,
      hostHeader: req.headers.host,
      appUrl: process.env.APP_URL,
    });
    if (!originCheck.allowed) {
      opsCounters.wsConnectionsRejected += 1;
      opsCounters.csrfBlocks += 1;
      socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url, `http://${req.headers.host || `localhost:${PORT}`}`);
    } catch {
      opsCounters.wsConnectionsRejected += 1;
      socket.write('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }

    // Never accept session tokens in WebSocket query strings (prevents leakage in logs/history)
    if (parsedUrl.searchParams.has('token')) {
      opsCounters.wsConnectionsRejected += 1;
      socket.write('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }

    const peerIp = resolveClientIpFromHeaders({
      forwardedForHeader: req.headers['x-forwarded-for'],
      remoteAddress: req.socket.remoteAddress,
      trustProxy: true,
    });
    let ipPeerCount = 0;
    for (const p of peers.values()) {
      if (p.ip === peerIp) ipPeerCount += 1;
    }
    if (ipPeerCount >= OPERATIONAL_LIMITS.MAX_WS_PEERS_PER_IP) {
      opsCounters.wsConnectionsRejected += 1;
      socket.write('HTTP/1.1 429 Too Many Requests\r\nConnection: close\r\n\r\n');
      socket.destroy();
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

    const sectorParam = (parsedUrl.searchParams.get('sector') ||
      store.activeSector) as TerritorySectorCode;
    const validSector: TerritorySectorCode = ALL_TERRITORY_SECTORS.includes(sectorParam)
      ? sectorParam
      : store.activeSector;

    const wsToken = extractSessionTokenFromHeaders({
      cookieHeader: req.headers.cookie,
      authorizationHeader: req.headers.authorization,
    });
    const resolvedWsSession = resolveAuthenticatedSession({
      token: wsToken,
      secret: securityConfig.sessionSecret,
      roster: store.moderatedPlayers,
    });

    const peerId = `peer-${crypto.randomUUID().slice(0, 8)}`;
    const peer: ConnectedSiegePeer = {
      id: peerId,
      ip: peerIp,
      socket,
      subscribedSector: validSector,
      connectedAtIso: new Date().toISOString(),
      session: resolvedWsSession.authenticated ? resolvedWsSession.session : null,
      rxBuffer: Buffer.alloc(0),
      msgLimiter: new SlidingWindowRateLimiter({
        maxRequests: OPERATIONAL_LIMITS.WS_MESSAGES_PER_WINDOW,
        windowMs: OPERATIONAL_LIMITS.WS_RATE_WINDOW_MS,
        maxKeys: 8,
      }),
      rateViolations: 0,
      lastClientSeq: -1,
    };
    peers.set(peerId, peer);
    opsCounters.wsConnectionsAccepted += 1;

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
    broadcastSectorPresence(validSector);

    socket.on('data', (chunk: Buffer) => {
      const combined = peer.rxBuffer.length > 0 ? Buffer.concat([peer.rxBuffer, chunk]) : chunk;
      const decoded = decodeWsFramesHardened(combined);
      peer.rxBuffer = decoded.remainingBuffer;

      if (decoded.protocolError) {
        opsCounters.wsFramesRejected += 1;
        peers.delete(peerId);
        broadcastSectorPresence(peer.subscribedSector);
        try {
          socket.end(encodeWsCloseFrame(1009, decoded.protocolError));
        } catch {
          socket.destroy();
        }
        return;
      }

      if (decoded.closeRequested) {
        peers.delete(peerId);
        broadcastSectorPresence(peer.subscribedSector);
        socket.end();
        return;
      }

      if (decoded.pingPayload) {
        const pong = Buffer.concat([
          Buffer.from([0x8a, decoded.pingPayload.length & 0x7f]),
          decoded.pingPayload.subarray(0, 125),
        ]);
        socket.write(pong);
      }

      for (const rawMsg of decoded.messages) {
        const msgRate = peer.msgLimiter.check('ws-msg');
        if (!msgRate.allowed) {
          peer.rateViolations += 1;
          socket.write(
            encodeWsTextFrame(
              JSON.stringify({
                opcode: 'S2C_RATE_LIMIT',
                code: 429,
                error: 'WebSocket message rate limit exceeded.',
              })
            )
          );
          if (peer.rateViolations >= 3) {
            opsCounters.wsRateLimitDisconnects += 1;
            peers.delete(peerId);
            broadcastSectorPresence(peer.subscribedSector);
            socket.end(encodeWsCloseFrame(1008, 'Sustained WebSocket message flood'));
            return;
          }
          continue;
        }

        try {
          const parsed = JSON.parse(rawMsg) as {
            opcode?: SiegeNetOpcode;
            sector?: TerritorySectorCode;
            payload?: unknown;
          };

          if (containsUnsafePrototypeKey(parsed)) {
            opsCounters.wsFramesRejected += 1;
            continue;
          }

          const previousSector = peer.subscribedSector;
          if (parsed.sector && ALL_TERRITORY_SECTORS.includes(parsed.sector)) {
            peer.subscribedSector = parsed.sector;
            if (parsed.sector !== previousSector) {
              broadcastSectorPresence(previousSector);
              broadcastSectorPresence(parsed.sector);
            }
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

          if (isMutatingCommand && peer.session) {
            const quarantine = antiCheatGuard.isQuarantined(
              peer.session.commanderId,
              Date.now(),
              peer.session.isRootOwner
            );
            if (quarantine.quarantined) {
              socket.write(
                encodeWsTextFrame(
                  JSON.stringify({
                    opcode: SiegeNetOpcode.S2C_COMMAND_REJECTED,
                    serverTick: sectorState.serverTick,
                    ackClientSeq: Math.max(0, peer.lastClientSeq),
                    sector: targetSector,
                    stateHash: sectorState.stateHash,
                    payload: {
                      violation: 'STRIKE_THRESHOLD_LOCKOUT',
                      code: 429,
                      error: `Command quarantine active (${quarantine.retryAfterSec}s remaining).`,
                    },
                  })
                )
              );
              peers.delete(peerId);
              broadcastSectorPresence(targetSector);
              socket.end(encodeWsCloseFrame(1008, 'Anti-cheat quarantine active'));
              return;
            }
          }

          if (peer.session && parsed.opcode === SiegeNetOpcode.C2S_TROOP_POSITION_CMD) {
            const troopCheck = validateTroopCommandAuthority({
              sectorState,
              session: peer.session,
              rawCmd: parsed.payload,
              lastClientSeq: peer.lastClientSeq,
            });
            if (!troopCheck.allowed) {
              opsCounters.antiCheatRejections += 1;
              const strike = antiCheatGuard.recordStrike(
                peer.session.commanderId,
                troopCheck.violation,
                Date.now(),
                peer.session.isRootOwner
              );
              if (strike.quarantinedNow) {
                opsCounters.antiCheatStrikeLockouts += 1;
              }
              appendAuditEntry(
                store,
                createAuditEntry({
                  eventType: 'ANTI_CHEAT_TRIGGERED',
                  actorEmail: peer.session.email,
                  actorRole: peer.session.role,
                  outcome: 'denied',
                  detail: `WS troopCmd blocked (${troopCheck.violation}, strike ${strike.strikeCount}): ${troopCheck.reason}`,
                })
              );
              socket.write(
                encodeWsTextFrame(
                  JSON.stringify({
                    opcode: SiegeNetOpcode.S2C_COMMAND_REJECTED,
                    serverTick: sectorState.serverTick,
                    ackClientSeq: Math.max(0, peer.lastClientSeq),
                    sector: targetSector,
                    stateHash: sectorState.stateHash,
                    payload: {
                      violation: troopCheck.violation,
                      code: strike.quarantinedNow ? 429 : troopCheck.statusCode,
                      strikeCount: strike.strikeCount,
                      error: troopCheck.reason,
                    },
                  })
                )
              );
              if (strike.quarantinedNow) {
                persistStoreToDisk(store);
                peers.delete(peerId);
                broadcastSectorPresence(targetSector);
                socket.end(encodeWsCloseFrame(1008, 'Anti-cheat strike threshold exceeded'));
                return;
              }
              continue;
            }

            peer.lastClientSeq = troopCheck.command.clientSeq;
            sectorState = applyTroopPositionCommand(sectorState, troopCheck.command);
            store.sectors[targetSector] = sectorState;
          } else if (peer.session && parsed.opcode === SiegeNetOpcode.C2S_RALLY_ACTION_CMD) {
            const rallyCheck = validateRallyCommandAuthority({
              sectorState,
              session: peer.session,
              serverCommander: store.commanders[peer.session.commanderId],
              rawCmd: parsed.payload,
            });
            if (!rallyCheck.allowed) {
              opsCounters.antiCheatRejections += 1;
              const strike = antiCheatGuard.recordStrike(
                peer.session.commanderId,
                rallyCheck.violation,
                Date.now(),
                peer.session.isRootOwner
              );
              if (strike.quarantinedNow) {
                opsCounters.antiCheatStrikeLockouts += 1;
              }
              appendAuditEntry(
                store,
                createAuditEntry({
                  eventType: 'ANTI_CHEAT_TRIGGERED',
                  actorEmail: peer.session.email,
                  actorRole: peer.session.role,
                  outcome: 'denied',
                  detail: `WS rallyCmd blocked (${rallyCheck.violation}, strike ${strike.strikeCount}): ${rallyCheck.reason}`,
                })
              );
              socket.write(
                encodeWsTextFrame(
                  JSON.stringify({
                    opcode: SiegeNetOpcode.S2C_COMMAND_REJECTED,
                    serverTick: sectorState.serverTick,
                    ackClientSeq: Math.max(0, peer.lastClientSeq),
                    sector: targetSector,
                    stateHash: sectorState.stateHash,
                    payload: {
                      violation: rallyCheck.violation,
                      code: strike.quarantinedNow ? 429 : rallyCheck.statusCode,
                      strikeCount: strike.strikeCount,
                      error: rallyCheck.reason,
                    },
                  })
                )
              );
              if (strike.quarantinedNow) {
                persistStoreToDisk(store);
                peers.delete(peerId);
                broadcastSectorPresence(targetSector);
                socket.end(encodeWsCloseFrame(1008, 'Anti-cheat strike threshold exceeded'));
                return;
              }
              continue;
            }

            sectorState = applyRallyActionCommand(sectorState, rallyCheck.command);
            store.sectors[targetSector] = sectorState;
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
          opsCounters.wsFramesRejected += 1;
        }
      }
    });

    socket.on('close', () => {
      const leftSector = peer.subscribedSector;
      peers.delete(peerId);
      broadcastSectorPresence(leftSector);
    });
    socket.on('error', () => {
      const leftSector = peer.subscribedSector;
      peers.delete(peerId);
      broadcastSectorPresence(leftSector);
    });
  });

  // ==========================================================================
  // VITE MIDDLEWARE (DEV) OR STATIC ASSET SERVING (PRODUCTION)
  // ==========================================================================
  const distPath = path.join(ROOT_DIR, 'dist');
  const distIndexPath = path.join(distPath, 'index.html');
  let viteMiddlewares: express.RequestHandler | null = null;
  let viteReadyPromise: Promise<void> | null = null;

  if (!securityConfig.isProduction) {
    process.env.DISABLE_HMR = process.env.DISABLE_HMR || 'true';
    viteReadyPromise = (async () => {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
          watch: null,
        },
        appType: 'spa',
      });
      viteMiddlewares = vite.middlewares;
    })();

    app.use(async (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      if (!viteMiddlewares && viteReadyPromise) {
        try {
          await viteReadyPromise;
        } catch (err) {
          next(err);
          return;
        }
      }
      if (viteMiddlewares) {
        viteMiddlewares(req, res, next);
        return;
      }
      next();
    });
  } else {
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

  // ==========================================================================
  // GRACEFUL SIGTERM / SIGINT SHUTDOWN (DRAINS WS/HTTP & ATOMICALLY FLUSHES)
  // ==========================================================================
  const performGracefulShutdown = (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.info(
      `[Voxel Realms Server] Received ${signal}; draining peers & flushing atomic save...`
    );

    clearInterval(siegeTickInterval);
    clearInterval(sweepInterval);

    const closeFrame = encodeWsCloseFrame(1001, 'Server shutting down cleanly');
    for (const [peerId, peer] of peers.entries()) {
      try {
        if (!peer.socket.destroyed) {
          peer.socket.end(closeFrame);
        }
      } catch {
        peer.socket.destroy();
      }
      peers.delete(peerId);
    }

    persistStoreToDisk(store);

    const forceTimer = setTimeout(() => {
      console.warn('[Voxel Realms Server] Graceful shutdown deadline reached; exiting.');
      process.exit(0);
    }, OPERATIONAL_LIMITS.GRACEFUL_SHUTDOWN_DEADLINE_MS);
    forceTimer.unref();

    httpServer.close(() => {
      clearTimeout(forceTimer);
      console.info('[Voxel Realms Server] Shutdown complete.');
      process.exit(0);
    });
  };

  process.once('SIGTERM', () => performGracefulShutdown('SIGTERM'));
  process.once('SIGINT', () => performGracefulShutdown('SIGINT'));

  // Bind port 3000 immediately so health/readiness probes succeed without waiting for Vite cold scan
  await new Promise<void>((resolve) => {
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(
        `[Voxel Realms Server] Authoritative 20Hz 50v50 Siege, RBAC Auth & Atomic Persistence listening on http://0.0.0.0:${PORT}`
      );
      resolve();
    });
  });

  if (viteReadyPromise) {
    await viteReadyPromise;
  }
}

startServer();
