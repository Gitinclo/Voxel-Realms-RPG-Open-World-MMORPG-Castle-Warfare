/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { type Express, type Request, type Response } from 'express';
import http from 'node:http';
import crypto from 'node:crypto';
import type {
  AdminPermissions,
  SecurityAuditEntry,
  ServerSessionInfo,
} from '../game/adminModeration';
import { SiegeNetEnvelope, SiegeNetOpcode, TerritorySectorCode } from '../game/siegeNetProtocol';
import {
  SESSION_COOKIE_NAME,
  ServerRuntimeSecurityConfig,
  authorizeStaffPermission,
  createAuditEntry,
  extractSessionTokenFromHeaders,
  parseCookieHeader,
  resolveAuthenticatedSession,
  resolveServerRuntimeSecurityConfig,
} from '../game/serverAuth';
import { CommanderEconomyAccount, createInitialEconomyAccount } from '../game/economyLedger';
import {
  BruteForceLockoutGuard,
  OPERATIONAL_LIMITS,
  SlidingWindowRateLimiter,
  TickLatencyTracker,
  containsUnsafePrototypeKey,
  pruneCommanderMap,
  verifySameOriginRequest,
} from '../game/serverHardening';
import { AtomicRealmPersistence } from '../game/serverPersistence';
import { AntiCheatGuard } from '../game/antiCheat';
import type { PgTransactionalPool } from '../db/economyRepository';
import {
  buildContentSecurityPolicy,
  isHttpsRequest,
  resolveTrustProxySetting,
} from './securityHeaders';
import { createDefaultStore, isValidPersistedStore } from './storeFactory';
import { encodeWsCloseFrame, encodeWsTextFrame } from './wsFrames';
import { createCoordinationStore, type ServerCoordinationStore } from './coordinationStore';
import { createAuthoritativeEconomyService } from './economyService';
import type {
  ConnectedSiegePeer,
  OpsCounters,
  PersistedMultiRegionStore,
  ServerContext,
} from './types';
import { registerHealthRoutes } from './routes/healthRoutes';
import { registerAuthRoutes } from './routes/authRoutes';
import { registerAdminRoutes } from './routes/adminRoutes';
import { registerDbRoutes } from './routes/dbRoutes';
import { registerOnlineRoutes } from './routes/onlineRoutes';
import { registerEconomyRoutes } from './routes/economyRoutes';
import { registerPrivacyRoutes } from './routes/privacyRoutes';
import { attachSiegeWebSocketGateway, startSiegeTickLoop } from './wsGateway';

export interface CreateVoxelServerOptions {
  port: number;
  dataDir: string;
  securityConfig: ServerRuntimeSecurityConfig;
  env?: NodeJS.ProcessEnv;
  pgPool?: PgTransactionalPool | null;
  coordinationStore?: ServerCoordinationStore;
  enableTickLoop?: boolean;
}

export interface VoxelServerRuntime {
  app: Express;
  httpServer: http.Server;
  ctx: ServerContext;
  shutdown: () => Promise<void>;
}

/**
 * Dependency-injected factory building the full Express 5 + RFC 6455 WebSocket server runtime.
 * Used both by the production entrypoint (`server.ts`) and in-process integration test suites.
 */
export function createVoxelServerRuntime(options: CreateVoxelServerOptions): VoxelServerRuntime {
  const env = options.env ?? process.env;
  const maxAuditEntries = OPERATIONAL_LIMITS.MAX_AUDIT_LOG_ENTRIES;

  const persistence = new AtomicRealmPersistence<PersistedMultiRegionStore>({
    dataDir: options.dataDir,
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
      Number.parseInt(env.VOXEL_API_WRITE_LIMIT_PER_MIN || '', 10) ||
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
  const coordinationStore = options.coordinationStore ?? createCoordinationStore(env);
  const economyService = createAuthoritativeEconomyService({
    store,
    persistStoreToDisk,
    pgPool: options.pgPool ?? null,
  });

  const opsCounters: OpsCounters = {
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
  let shuttingDown = false;
  const peers = new Map<string, ConnectedSiegePeer>();
  const trustProxy = resolveTrustProxySetting(env.VOXEL_TRUST_PROXY);
  const cspHeaderValue = buildContentSecurityPolicy({
    isProduction: options.securityConfig.isProduction,
    allowPreviewIframe: env.ALLOW_PREVIEW_IFRAME === 'true',
  });

  const appendAuditEntry = (entry: SecurityAuditEntry): void => {
    store.securityAuditLog.unshift(entry);
    if (store.securityAuditLog.length > maxAuditEntries) {
      store.securityAuditLog.length = maxAuditEntries;
    }
  };

  const resolveRequestSession = (req: Request): ServerSessionInfo | null => {
    const token = extractSessionTokenFromHeaders({
      cookieHeader: req.headers.cookie,
      authorizationHeader: req.headers.authorization,
    });
    const resolved = resolveAuthenticatedSession({
      token,
      secret: options.securityConfig.sessionSecret,
      roster: store.moderatedPlayers,
      allowGodMode: options.securityConfig.allowProductionGodMode,
    });
    if (!resolved.authenticated) {
      return null;
    }
    if (coordinationStore.isSessionRevoked(resolved.session.sessionId)) {
      return null;
    }
    return resolved.session;
  };

  const requireAuthenticatedSession = (req: Request, res: Response): ServerSessionInfo | null => {
    const session = resolveRequestSession(req);
    if (!session) {
      appendAuditEntry(
        createAuditEntry({
          eventType: 'AUTHZ_DENIED',
          actorEmail: 'anonymous',
          actorRole: 'anonymous',
          outcome: 'denied',
          detail: `Unauthenticated or revoked session blocked on ${req.method} ${req.path}`,
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

  const getOrCreateEconomyAccount = (commanderId: string): CommanderEconomyAccount => {
    if (!store.economyAccounts) {
      store.economyAccounts = {};
    }
    if (!store.economyAccounts[commanderId]) {
      store.economyAccounts[commanderId] = createInitialEconomyAccount(commanderId);
    }
    return store.economyAccounts[commanderId];
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

  const ctx: ServerContext = {
    port: options.port,
    trustProxy,
    securityConfig: options.securityConfig,
    store,
    persistence,
    peers,
    apiWriteLimiter,
    loginLockoutGuard,
    tickLatencyTracker,
    antiCheatGuard,
    coordinationStore,
    economyService,
    opsCounters,
    isShuttingDown: () => shuttingDown,
    persistStoreToDisk,
    appendAuditEntry,
    resolveRequestSession,
    requireAuthenticatedSession,
    requireStaffPermission,
    getOrCreateEconomyAccount,
    broadcastToSector,
    broadcastSectorPresence,
  };

  const app = express();
  try {
    app.set('trust proxy', trustProxy);
  } catch {
    console.warn(
      '[Voxel Realms Security] Express rejected trust proxy configuration; falling back to "loopback".'
    );
    app.set('trust proxy', 'loopback');
  }
  app.disable('x-powered-by');
  app.use(express.json({ limit: '512kb' }));

  app.use((req, res, next) => {
    opsCounters.httpRequestsTotal += 1;
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Content-Security-Policy', cspHeaderValue);
    if (options.securityConfig.isProduction && env.ALLOW_PREVIEW_IFRAME !== 'true') {
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }
    if (options.securityConfig.isProduction || isHttpsRequest(req)) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store');
    }

    if (req.path.startsWith('/api/') && req.method !== 'GET' && req.method !== 'HEAD') {
      if (shuttingDown) {
        res.setHeader('Connection', 'close');
        res.status(503).json({ ok: false, error: 'Server is gracefully shutting down.' });
        return;
      }

      if (containsUnsafePrototypeKey(req.body)) {
        opsCounters.prototypePollutionBlocks += 1;
        appendAuditEntry(
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
        appUrl: env.APP_URL,
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

  registerHealthRoutes(app, ctx);
  registerAuthRoutes(app, ctx);
  registerAdminRoutes(app, ctx);
  registerDbRoutes(app, ctx);
  registerOnlineRoutes(app, ctx);
  registerEconomyRoutes(app, ctx);
  registerPrivacyRoutes(app, ctx);

  const siegeTickInterval = options.enableTickLoop === false ? null : startSiegeTickLoop(ctx);
  const sweepInterval = setInterval(() => {
    apiWriteLimiter.sweepExpired();
    coordinationStore.sweepExpired();
    pruneCommanderMap(store.commanders, OPERATIONAL_LIMITS.MAX_PERSISTED_COMMANDERS);
  }, 15_000);
  sweepInterval.unref();

  const httpServer = http.createServer(app);
  attachSiegeWebSocketGateway(httpServer, ctx);

  const shutdown = async (): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    if (siegeTickInterval) clearInterval(siegeTickInterval);
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

    await new Promise<void>((resolve) => {
      if (!httpServer.listening) {
        resolve();
        return;
      }
      const forceTimer = setTimeout(() => {
        httpServer.closeAllConnections?.();
        resolve();
      }, OPERATIONAL_LIMITS.GRACEFUL_SHUTDOWN_DEADLINE_MS);
      forceTimer.unref();
      httpServer.close(() => {
        clearTimeout(forceTimer);
        resolve();
      });
      httpServer.closeIdleConnections?.();
    });
  };

  return { app, httpServer, ctx, shutdown };
}

export function resolveRuntimeSecurityOrFailClosed(
  env: NodeJS.ProcessEnv
): ServerRuntimeSecurityConfig {
  const raw = resolveServerRuntimeSecurityConfig(env);
  if (
    raw.isProduction &&
    (raw.failClosedMisconfigured || !raw.sessionSecret || !raw.adminPasskey)
  ) {
    throw new Error(
      raw.misconfigurationReason ||
        'Critical secrets VOXEL_SESSION_SECRET and VOXEL_ADMIN_PASSKEY must be configured.'
    );
  }
  return raw.failClosedMisconfigured
    ? {
        ...raw,
        sessionSecret: raw.sessionSecret || crypto.randomBytes(32).toString('hex'),
        ephemeralSessionSecretGenerated: !raw.sessionSecret,
        adminPasskey: raw.adminPasskey,
        failClosedMisconfigured: false,
      }
    : raw;
}
