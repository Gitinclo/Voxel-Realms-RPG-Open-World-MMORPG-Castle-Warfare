/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Voxel Realms RPG — Modular Authoritative Server Entrypoint
 * Composes middleware, route modules (`src/server/routes/*`), 20Hz WebSocket gateway
 * (`src/server/wsGateway.ts`), atomic persistence, and graceful SIGTERM/SIGINT shutdown.
 */

import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  AdminPermissions,
  SecurityAuditEntry,
  ServerSessionInfo,
} from './src/game/adminModeration';
import { SiegeNetEnvelope, SiegeNetOpcode, TerritorySectorCode } from './src/game/siegeNetProtocol';
import {
  SESSION_COOKIE_NAME,
  authorizeStaffPermission,
  createAuditEntry,
  extractSessionTokenFromHeaders,
  parseCookieHeader,
  resolveAuthenticatedSession,
  resolveServerRuntimeSecurityConfig,
} from './src/game/serverAuth';
import { CommanderEconomyAccount, createInitialEconomyAccount } from './src/game/economyLedger';
import {
  BruteForceLockoutGuard,
  OPERATIONAL_LIMITS,
  SlidingWindowRateLimiter,
  TickLatencyTracker,
  containsUnsafePrototypeKey,
  pruneCommanderMap,
  verifySameOriginRequest,
} from './src/game/serverHardening';
import { AtomicRealmPersistence, resolveSafeDataDir } from './src/game/serverPersistence';
import { AntiCheatGuard } from './src/game/antiCheat';
import {
  buildContentSecurityPolicy,
  isHttpsRequest,
  resolveTrustProxySetting,
} from './src/server/securityHeaders';
import { createDefaultStore, isValidPersistedStore } from './src/server/storeFactory';
import { encodeWsCloseFrame, encodeWsTextFrame } from './src/server/wsFrames';
import type {
  ConnectedSiegePeer,
  OpsCounters,
  PersistedMultiRegionStore,
  ServerContext,
} from './src/server/types';
import { registerHealthRoutes } from './src/server/routes/healthRoutes';
import { registerAuthRoutes } from './src/server/routes/authRoutes';
import { registerAdminRoutes } from './src/server/routes/adminRoutes';
import { registerDbRoutes } from './src/server/routes/dbRoutes';
import { registerOnlineRoutes } from './src/server/routes/onlineRoutes';
import { registerEconomyRoutes } from './src/server/routes/economyRoutes';
import { registerPrivacyRoutes } from './src/server/routes/privacyRoutes';
import { attachSiegeWebSocketGateway, startSiegeTickLoop } from './src/server/wsGateway';

function parseCliFlag(flagName: string): string | undefined {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === `--${flagName}` && i + 1 < args.length) {
      return args[i + 1];
    }
    if (arg.startsWith(`--${flagName}=`)) {
      return arg.slice(flagName.length + 3);
    }
  }
  return undefined;
}

const isProductionEnv = process.env.NODE_ENV === 'production';
const parsedCliPort = Number.parseInt(parseCliFlag('port') || '', 10);
const parsedProdPort = Number.parseInt(process.env.PORT || '', 10);
const parsedDevPort = Number.parseInt(
  process.env.VOXEL_DEV_PORT || process.env.DEFAULT_APP_PORT || '',
  10
);
const PORT =
  Number.isFinite(parsedCliPort) && parsedCliPort > 0
    ? parsedCliPort
    : isProductionEnv
      ? Number.isFinite(parsedProdPort) && parsedProdPort > 0
        ? parsedProdPort
        : 3000
      : Number.isFinite(parsedDevPort) && parsedDevPort > 0
        ? parsedDevPort
        : 3000;
const HOST = parseCliFlag('host') || '0.0.0.0';
const ROOT_DIR = import.meta.dirname ?? process.cwd();
const resolvedDataDir = resolveSafeDataDir(process.env.VOXEL_DATA_DIR, ROOT_DIR);
if (resolvedDataDir.fallbackReason) {
  console.warn(`[SECURITY WARN] ${resolvedDataDir.fallbackReason}`);
}
const DATA_DIR = resolvedDataDir.dataDir;
const MAX_AUDIT_LOG_ENTRIES = OPERATIONAL_LIMITS.MAX_AUDIT_LOG_ENTRIES;

async function startServer() {
  const rawSecurityConfig = resolveServerRuntimeSecurityConfig(process.env);
  if (
    rawSecurityConfig.isProduction &&
    (rawSecurityConfig.failClosedMisconfigured ||
      !rawSecurityConfig.sessionSecret ||
      !rawSecurityConfig.adminPasskey)
  ) {
    const fatalReason =
      rawSecurityConfig.misconfigurationReason ||
      'Critical secrets VOXEL_SESSION_SECRET and VOXEL_ADMIN_PASSKEY must be configured.';
    console.error(`[SECURITY FATAL] Refusing to start server (fail-closed): ${fatalReason}`);
    process.exit(1);
  }

  const securityConfig = rawSecurityConfig.failClosedMisconfigured
    ? {
        ...rawSecurityConfig,
        sessionSecret: rawSecurityConfig.sessionSecret || crypto.randomBytes(32).toString('hex'),
        ephemeralSessionSecretGenerated: !rawSecurityConfig.sessionSecret,
        adminPasskey: rawSecurityConfig.adminPasskey,
        failClosedMisconfigured: false,
      }
    : rawSecurityConfig;

  if (securityConfig.ephemeralSessionSecretGenerated || !securityConfig.adminPasskey) {
    console.warn(
      '[Voxel Realms Dev] Running in development mode with ephemeral in-memory session signing; operator passkey login remains disabled until VOXEL_ADMIN_PASSKEY is configured.'
    );
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
  const trustProxy = resolveTrustProxySetting(process.env.VOXEL_TRUST_PROXY);
  const cspHeaderValue = buildContentSecurityPolicy({
    isProduction: securityConfig.isProduction,
    allowPreviewIframe: process.env.ALLOW_PREVIEW_IFRAME === 'true',
  });

  const appendAuditEntry = (entry: SecurityAuditEntry): void => {
    store.securityAuditLog.unshift(entry);
    if (store.securityAuditLog.length > MAX_AUDIT_LOG_ENTRIES) {
      store.securityAuditLog.length = MAX_AUDIT_LOG_ENTRIES;
    }
  };

  const resolveRequestSession = (req: Request): ServerSessionInfo | null => {
    const token = extractSessionTokenFromHeaders({
      cookieHeader: req.headers.cookie,
      authorizationHeader: req.headers.authorization,
    });
    const resolved = resolveAuthenticatedSession({
      token,
      secret: securityConfig.sessionSecret,
      roster: store.moderatedPlayers,
      allowGodMode: securityConfig.allowProductionGodMode,
    });
    return resolved.authenticated ? resolved.session : null;
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
    port: PORT,
    trustProxy,
    securityConfig,
    store,
    persistence,
    peers,
    apiWriteLimiter,
    loginLockoutGuard,
    tickLatencyTracker,
    antiCheatGuard,
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
  app.set('trust proxy', trustProxy);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '512kb' }));

  // Baseline Security Headers + Prototype Pollution, CSRF & Rate-Limit Defense Middleware
  app.use((req, res, next) => {
    opsCounters.httpRequestsTotal += 1;
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Content-Security-Policy', cspHeaderValue);
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

  // Mount Modular Domain Route Handlers
  registerHealthRoutes(app, ctx);
  registerAuthRoutes(app, ctx);
  registerAdminRoutes(app, ctx);
  registerDbRoutes(app, ctx);
  registerOnlineRoutes(app, ctx);
  registerEconomyRoutes(app, ctx);
  registerPrivacyRoutes(app, ctx);

  // Start Authoritative 20Hz Multi-Sector Tick Loop & Periodic Sweeper
  const siegeTickInterval = startSiegeTickLoop(ctx);
  const sweepInterval = setInterval(() => {
    apiWriteLimiter.sweepExpired();
    pruneCommanderMap(store.commanders, OPERATIONAL_LIMITS.MAX_PERSISTED_COMMANDERS);
  }, 15_000);
  sweepInterval.unref();

  const httpServer = http.createServer(app);
  attachSiegeWebSocketGateway(httpServer, ctx);

  // Vite Middleware (Dev) or Static Asset Serving (Production)
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
          ws: false,
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
    app.get('/{*splat}', (req, res) => {
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

  // Graceful SIGTERM / SIGINT Shutdown
  const performGracefulShutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
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

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(PORT, HOST, () => {
      httpServer.off('error', reject);
      console.log(
        `[Voxel Realms Server] Authoritative 20Hz 50v50 Siege, RBAC Auth & Atomic Persistence listening on http://${HOST}:${PORT}`
      );
      resolve();
    });
  });

  if (viteReadyPromise) {
    await viteReadyPromise;
  }
}

startServer();
