/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Voxel Realms RPG — Thin Process Entrypoint
 * Wires environment config, PostgreSQL pool (when VOXEL_ECONOMY_BACKEND=postgres),
 * modular Express 5 + WebSocket runtime (`src/server/createApp.ts`), Vite/static SPA serving,
 * and graceful SIGTERM/SIGINT shutdown.
 */

import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { resolveSafeDataDir } from './src/game/serverPersistence';
import { createPool, isPostgresConfigured } from './src/db/index.ts';
import {
  createVoxelServerRuntime,
  resolveRuntimeSecurityOrFailClosed,
} from './src/server/createApp';

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

async function startServer() {
  let securityConfig;
  try {
    securityConfig = resolveRuntimeSecurityOrFailClosed(process.env);
  } catch (err) {
    console.error(
      `[SECURITY FATAL] Refusing to start server (fail-closed): ${err instanceof Error ? err.message : String(err)}`
    );
    process.exit(1);
  }

  if (securityConfig.ephemeralSessionSecretGenerated || !securityConfig.adminPasskey) {
    console.warn(
      '[Voxel Realms Dev] Running in development mode with ephemeral in-memory session signing; operator passkey login remains disabled until VOXEL_ADMIN_PASSKEY is configured.'
    );
  }

  const usePostgresEconomy =
    process.env.VOXEL_ECONOMY_BACKEND === 'postgres' && isPostgresConfigured(process.env);

  const { app, httpServer, shutdown } = createVoxelServerRuntime({
    port: PORT,
    dataDir: DATA_DIR,
    securityConfig,
    env: process.env,
    pgPool: usePostgresEconomy ? createPool() : null,
  });

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

  const handleSignal = (signal: string) => {
    console.info(
      `[Voxel Realms Server] Received ${signal}; draining peers & flushing atomic save...`
    );
    void shutdown().then(() => {
      console.info('[Voxel Realms Server] Shutdown complete.');
      process.exit(0);
    });
  };

  process.once('SIGTERM', () => handleSignal('SIGTERM'));
  process.once('SIGINT', () => handleSignal('SIGINT'));

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
