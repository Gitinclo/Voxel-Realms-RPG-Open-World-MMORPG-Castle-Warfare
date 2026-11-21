/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Express } from 'express';
import { OPERATIONAL_LIMITS } from '../../game/serverHardening';
import type { ServerContext } from '../types';

export function registerHealthRoutes(app: Express, ctx: ServerContext): void {
  app.get(['/healthz', '/api/health'], (_req, res) => {
    if (ctx.isShuttingDown()) {
      res.status(503).json({ ok: false, status: 'shutting_down' });
      return;
    }
    res.status(200).json({
      ok: true,
      status: 'healthy',
      uptimeSec: Math.round(process.uptime()),
    });
  });

  app.get('/readyz', (_req, res) => {
    const persistHealth = ctx.persistence.getHealthMetrics();
    const tickStats = ctx.tickLatencyTracker.getSummary();
    const shuttingDown = ctx.isShuttingDown();
    const ready =
      !shuttingDown &&
      persistHealth.writable &&
      tickStats.overrunCount < 50 &&
      ctx.peers.size < OPERATIONAL_LIMITS.MAX_WS_PEERS;

    res.status(ready ? 200 : 503).json({
      ok: ready,
      status: ready ? 'ready' : shuttingDown ? 'draining' : 'degraded',
      checks: {
        notShuttingDown: !shuttingDown,
        storageWritable: persistHealth.writable,
        recoveredFromBackup: persistHealth.recoveredFromBackup,
        tickBudgetHealthy: tickStats.overrunCount < 50,
        wsCapacityAvailable: ctx.peers.size < OPERATIONAL_LIMITS.MAX_WS_PEERS,
      },
      uptimeSec: Math.round(process.uptime()),
    });
  });

  app.get('/metrics', (_req, res) => {
    const persistHealth = ctx.persistence.getHealthMetrics();
    const tickStats = ctx.tickLatencyTracker.getSummary();
    const mem = process.memoryUsage();
    const isUp = !ctx.isShuttingDown() && persistHealth.writable ? 1 : 0;

    const lines = [
      '# HELP voxel_up Whether the authoritative Voxel Realms server is healthy and writable (1=up, 0=degraded).',
      '# TYPE voxel_up gauge',
      `voxel_up ${isUp}`,
      '# HELP voxel_uptime_seconds Server process uptime in seconds.',
      '# TYPE voxel_uptime_seconds gauge',
      `voxel_uptime_seconds ${Math.round(process.uptime())}`,
      '# HELP voxel_ws_active_peers Number of active WebSocket siege peers.',
      '# TYPE voxel_ws_active_peers gauge',
      `voxel_ws_active_peers ${ctx.peers.size}`,
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
      `voxel_http_requests_total ${ctx.opsCounters.httpRequestsTotal}`,
      '# HELP voxel_persistence_writes_total Total atomic state persistence flushes completed.',
      '# TYPE voxel_persistence_writes_total counter',
      `voxel_persistence_writes_total ${persistHealth.totalWrites}`,
      '# HELP voxel_persistence_failed_writes_total Total failed persistence flushes.',
      '# TYPE voxel_persistence_failed_writes_total counter',
      `voxel_persistence_failed_writes_total ${persistHealth.failedWrites}`,
      '# HELP voxel_security_rate_limit_blocks_total Total HTTP requests blocked by rate limiting.',
      '# TYPE voxel_security_rate_limit_blocks_total counter',
      `voxel_security_rate_limit_blocks_total ${ctx.opsCounters.rateLimitBlocks}`,
      '# HELP voxel_security_bruteforce_lockouts_total Total admin passkey brute-force lockouts triggered.',
      '# TYPE voxel_security_bruteforce_lockouts_total counter',
      `voxel_security_bruteforce_lockouts_total ${ctx.loginLockoutGuard.getTotalLockoutsTriggered()}`,
      '# HELP voxel_security_csrf_blocks_total Total cross-origin CSRF attempts blocked.',
      '# TYPE voxel_security_csrf_blocks_total counter',
      `voxel_security_csrf_blocks_total ${ctx.opsCounters.csrfBlocks}`,
      '# HELP voxel_security_proto_pollution_blocks_total Total prototype-pollution payloads rejected.',
      '# TYPE voxel_security_proto_pollution_blocks_total counter',
      `voxel_security_proto_pollution_blocks_total ${ctx.opsCounters.prototypePollutionBlocks}`,
      '# HELP voxel_anticheat_rejections_total Total authoritative anti-cheat command rejections.',
      '# TYPE voxel_anticheat_rejections_total counter',
      `voxel_anticheat_rejections_total ${ctx.opsCounters.antiCheatRejections}`,
      '',
    ];

    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(lines.join('\n'));
  });

  app.get('/api/ops/readiness', (req, res) => {
    const session = ctx.resolveRequestSession(req);
    const isPrivileged = Boolean(session?.permissions.canAccessGmConsole);
    const persistHealth = ctx.persistence.getHealthMetrics();
    const mem = process.memoryUsage();
    const tickStats = ctx.tickLatencyTracker.getSummary();

    res.json({
      ok: true,
      status: ctx.isShuttingDown()
        ? 'draining'
        : persistHealth.writable
          ? 'operational'
          : 'degraded',
      startedAtIso: ctx.opsCounters.startedAtIso,
      uptimeSec: Math.round(process.uptime()),
      capacityLimits: {
        maxConcurrentWsPeers: OPERATIONAL_LIMITS.MAX_WS_PEERS,
        activeWsPeers: ctx.peers.size,
        maxWsPeersPerIp: OPERATIONAL_LIMITS.MAX_WS_PEERS_PER_IP,
        maxWsFrameBytes: OPERATIONAL_LIMITS.MAX_WS_FRAME_BYTES,
        maxWsMessagesPerSec: OPERATIONAL_LIMITS.WS_MESSAGES_PER_WINDOW,
        maxApiWritesPerMinPerIp: OPERATIONAL_LIMITS.API_WRITES_PER_MINUTE,
        maxPersistedCommanders: OPERATIONAL_LIMITS.MAX_PERSISTED_COMMANDERS,
        activePersistedCommanders: Object.keys(ctx.store.commanders).length,
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
        httpRequestsTotal: ctx.opsCounters.httpRequestsTotal,
        rateLimitBlocks: ctx.opsCounters.rateLimitBlocks,
        bruteForceLockouts: ctx.loginLockoutGuard.getTotalLockoutsTriggered(),
        csrfBlocks: ctx.opsCounters.csrfBlocks,
        prototypePollutionBlocks: ctx.opsCounters.prototypePollutionBlocks,
        wsFramesRejected: ctx.opsCounters.wsFramesRejected,
        wsRateLimitDisconnects: ctx.opsCounters.wsRateLimitDisconnects,
        wsSlowConsumerDisconnects: ctx.opsCounters.wsSlowConsumerDisconnects,
        antiCheatRejections: ctx.opsCounters.antiCheatRejections,
        antiCheatSanitizedWrites: ctx.opsCounters.antiCheatSanitizedWrites,
        antiCheatStrikeLockouts: ctx.opsCounters.antiCheatStrikeLockouts,
      },
      deploymentTopologyBoundary:
        'Single-instance Node.js authoritative server with atomic SHA-256 disk persistence (.bak failover). Horizontal multi-pod scaling requires an external database (Cloud SQL/Spanner) and Redis pub/sub adapter.',
    });
  });
}
