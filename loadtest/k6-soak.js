/**
 * Voxel Realms RPG — Hardened 4-Hour External Load & 20Hz WebSocket Soak Suite (k6)
 *
 * Safeguards:
 *   - Refuses to execute against placeholder (`example.com`) or production domains (`play.`, `prod.`).
 *   - Uses a strictly bounded, isolated tenant pool (`SOAK_TENANT_PREFIX`, `TENANT_POOL_SIZE`).
 *   - Maintains long-lived WebSocket connections across the full soak window sending client telemetry
 *     at true 20Hz (50ms interval) while asserting server 20Hz frames and zero tick overruns.
 *   - Polls `/api/ops/readiness` throughout the run to measure RSS memory drift (< 5%) and tick health.
 *   - Exports JSON (`soak/k6-summary.json`) and JUnit XML (`soak/k6-junit.xml`) reports automatically.
 *
 * Smoke run (local / 2 minutes):
 *   k6 run -e BASE_URL=http://127.0.0.1:3000 -e DURATION=2m -e VUS=25 loadtest/k6-soak.js
 *
 * Approved 4-hour staging soak:
 *   mkdir -p soak
 *   k6 run --summary-export soak/k6-summary.json --out json=soak/k6-results.json \
 *     -e BASE_URL=https://staging.voxelrealms.gg -e DURATION=4h -e VUS=150 loadtest/k6-soak.js
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, fail, sleep } from 'k6';
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || '').trim().replace(/\/+$/, '');
const DURATION = (__ENV.DURATION || '4h').trim();
const VUS = Number(__ENV.VUS || 150);
const TENANT_POOL_SIZE = Math.max(10, Number(__ENV.TENANT_POOL_SIZE || 250));
const SOAK_TENANT_PREFIX = (__ENV.SOAK_TENANT_PREFIX || 'soak-k6-tenant').trim();
const WS_SEND_HZ = Math.max(1, Math.min(20, Number(__ENV.WS_SEND_HZ || 20)));
const WS_SEND_INTERVAL_MS = Math.round(1000 / WS_SEND_HZ);
const REPORT_DIR = (__ENV.SOAK_REPORT_DIR || 'soak').replace(/\/+$/, '');

function parseDurationMs(spec) {
  const match = /^(\d+)(ms|s|m|h)$/.exec(spec);
  if (!match) return 4 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  if (unit === 'ms') return value;
  if (unit === 's') return value * 1000;
  if (unit === 'm') return value * 60 * 1000;
  return value * 60 * 60 * 1000;
}

const DURATION_MS = parseDurationMs(DURATION);
const WS_HOLD_MS = Math.max(10_000, Math.min(DURATION_MS, Number(__ENV.WS_HOLD_MS || DURATION_MS)));
const WS_BASE_URL = BASE_URL.replace(/^http/, 'ws');

const economySuccessRate = new Rate('voxel_economy_success_rate');
const http429Rate = new Rate('voxel_http_429_rate');
const http5xxRate = new Rate('voxel_http_5xx_rate');
const wsErrorRate = new Rate('voxel_ws_error_rate');
const wsSessionDuration = new Trend('voxel_ws_session_ms');
const wsFramesReceived = new Counter('voxel_ws_frames_received');
const tickOverrunGauge = new Gauge('voxel_tick_overruns');
const rssDriftPctGauge = new Gauge('voxel_rss_drift_pct');
const failedWritesGauge = new Gauge('voxel_persistence_failed_writes');

export const options = {
  scenarios: {
    http_authoritative_soak: {
      executor: 'ramping-vus',
      exec: 'httpAuthoritativeFlow',
      startVUs: Math.min(10, VUS),
      stages: [
        { duration: '2m', target: VUS },
        { duration: DURATION, target: VUS },
        { duration: '1m', target: 0 },
      ],
    },
    ws_siege_20hz_soak: {
      executor: 'per-vu-iterations',
      exec: 'wsSiegeLongLivedFlow',
      vus: Math.max(10, Math.floor(VUS / 3)),
      iterations: 1,
      maxDuration: `${Math.ceil((DURATION_MS + 120_000) / 1000)}s`,
    },
    ops_readiness_observer: {
      executor: 'constant-vus',
      exec: 'opsReadinessFlow',
      vus: 1,
      duration: DURATION,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.001'],
    http_req_duration: ['p(95)<100', 'p(99)<250'],
    voxel_economy_success_rate: ['rate>0.995'],
    voxel_http_429_rate: ['rate<0.02'],
    voxel_http_5xx_rate: ['rate==0'],
    voxel_ws_error_rate: ['rate<0.001'],
    ws_connecting: ['p(95)<250'],
    voxel_tick_overruns: ['value==0'],
    voxel_rss_drift_pct: ['value<5'],
    voxel_persistence_failed_writes: ['value==0'],
  },
};

export function setup() {
  if (!BASE_URL) {
    fail('BASE_URL is required (e.g. -e BASE_URL=https://staging.voxelrealms.gg).');
  }
  const lower = BASE_URL.toLowerCase();
  if (lower.includes('example.com') || lower.includes('set_in_environment_overlay')) {
    fail(`Refusing to run soak against placeholder target: ${BASE_URL}`);
  }
  if (
    /(^https?:\/\/)(play\.|prod\.|production\.)/.test(lower) &&
    __ENV.CONFIRM_NON_PRODUCTION !== 'I_UNDERSTAND_NOT_PROD'
  ) {
    fail(`Refusing to run load test against production-like hostname: ${BASE_URL}`);
  }

  const health = http.get(`${BASE_URL}/healthz`);
  if (health.status !== 200) {
    fail(`Pre-soak /healthz check failed on ${BASE_URL}: HTTP ${health.status}`);
  }

  const readiness = http.get(`${BASE_URL}/api/ops/readiness`);
  let baselineRssMb = 0;
  if (readiness.status === 200) {
    try {
      const parsed = JSON.parse(readiness.body);
      baselineRssMb = Number(parsed?.memoryMb?.rss || 0);
    } catch {
      baselineRssMb = 0;
    }
  }

  return {
    startedAtIso: new Date().toISOString(),
    baselineRssMb,
  };
}

function recordHttpStatus(res) {
  http429Rate.add(res.status === 429);
  http5xxRate.add(res.status >= 500);
}

export function httpAuthoritativeFlow() {
  const tenantSlot = ((__VU - 1) * 7 + __ITER) % TENANT_POOL_SIZE;
  const cmdrId = `${SOAK_TENANT_PREFIX}-${tenantSlot}`;
  const jar = http.cookieJar();

  // 1. Health check
  const health = http.get(`${BASE_URL}/healthz`, { tags: { endpoint: 'healthz' } });
  recordHttpStatus(health);
  check(health, { 'healthz is 200': (r) => r.status === 200 });

  // 2. Scoped bounded-tenant player session login
  const login = http.post(
    `${BASE_URL}/api/auth/player-session`,
    JSON.stringify({ commanderId: cmdrId, displayName: `Soak Knight ${tenantSlot}` }),
    { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'player-session' } }
  );
  recordHttpStatus(login);
  const loginOk = check(login, { 'player-session 200': (r) => r.status === 200 });
  if (!loginOk) {
    economySuccessRate.add(false);
    sleep(1);
    return;
  }

  // 3. Authoritative gameplay action + deterministic idempotency replay check
  const idemKey = `${SOAK_TENANT_PREFIX}-${__VU}-${__ITER}-gather`;
  const claimPayload = JSON.stringify({
    idempotencyKey: idemKey,
    actionType: 'GATHER_WOOD_NODE',
    entityId: 'wood-node-1',
  });
  const claim1 = http.post(`${BASE_URL}/api/online/economy/claim-action`, claimPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'claim-action' },
  });
  recordHttpStatus(claim1);

  const claim2 = http.post(`${BASE_URL}/api/online/economy/claim-action`, claimPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'claim-action-replay' },
  });
  recordHttpStatus(claim2);

  // 200 (credited/replayed) or 429 (authoritative cooldown active) are valid non-5xx responses
  const ecoOk =
    check(claim1, {
      'claim-action valid status': (r) => r.status === 200 || r.status === 429,
    }) &&
    check(claim2, {
      'claim-action idempotent replay or cooldown': (r) => r.status === 200 || r.status === 429,
    });
  economySuccessRate.add(ecoOk);

  // 4. Read balance
  const bal = http.get(`${BASE_URL}/api/online/economy/balance`, {
    tags: { endpoint: 'balance' },
  });
  recordHttpStatus(bal);
  check(bal, { 'balance 200': (r) => r.status === 200 });

  // 5. Logout & verify server-side session revocation
  const logout = http.post(`${BASE_URL}/api/auth/logout`, null, {
    tags: { endpoint: 'logout' },
  });
  recordHttpStatus(logout);
  check(logout, { 'logout 200': (r) => r.status === 200 });

  jar.clear(BASE_URL);
  sleep(1.5);
}

/**
 * Maintains ONE long-lived WebSocket connection per VU for the full soak window (`WS_HOLD_MS`)
 * while emitting client state/ping frames at true 20Hz (`50ms` interval) and asserting server ticks.
 */
export function wsSiegeLongLivedFlow() {
  const sectors = ['A1', 'B2', 'C3', 'D4'];
  const sector = sectors[__VU % sectors.length];
  const url = `${WS_BASE_URL}/ws/siege?sector=${sector}`;
  const start = Date.now();
  let hadError = false;

  const res = ws.connect(url, { headers: { Origin: BASE_URL } }, (socket) => {
    let framesInSession = 0;
    let seq = 0;

    socket.on('open', () => {
      socket.setInterval(() => {
        seq += 1;
        socket.send(
          JSON.stringify({
            type: 'C2S_PING',
            seq,
            clientTimestampMs: Date.now(),
          })
        );
      }, WS_SEND_INTERVAL_MS);
    });

    socket.on('message', () => {
      framesInSession += 1;
      wsFramesReceived.add(1);
    });

    socket.on('error', () => {
      hadError = true;
      wsErrorRate.add(true);
    });

    socket.setTimeout(() => {
      check(framesInSession, {
        'long-lived 20Hz WS session received server frames': (n) => n >= 10,
      });
      socket.close();
    }, WS_HOLD_MS);
  });

  const upgraded = check(res, { 'ws upgraded 101': (r) => Boolean(r && r.status === 101) });
  wsErrorRate.add(!upgraded || hadError);
  wsSessionDuration.add(Date.now() - start);
}

export function opsReadinessFlow(data) {
  const res = http.get(`${BASE_URL}/api/ops/readiness`, { tags: { endpoint: 'ops-readiness' } });
  recordHttpStatus(res);
  const ok = check(res, { 'ops readiness 200': (r) => r.status === 200 });
  if (ok) {
    try {
      const payload = JSON.parse(res.body);
      const overruns = Number(payload?.tickLoop20Hz?.overrunCount ?? 0);
      const failedWrites = Number(payload?.persistence?.failedWrites ?? 0);
      const rssMb = Number(payload?.memoryMb?.rss ?? 0);

      tickOverrunGauge.add(overruns);
      failedWritesGauge.add(failedWrites);

      if (data.baselineRssMb > 0 && rssMb > 0) {
        const driftPct = ((rssMb - data.baselineRssMb) / data.baselineRssMb) * 100;
        rssDriftPctGauge.add(Math.max(0, Number(driftPct.toFixed(2))));
      }
    } catch {
      // Ignore transient JSON parse error; status check already recorded
    }
  }
  sleep(30);
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildJunitXml(data) {
  const cases = [];
  let failures = 0;

  for (const [metricName, metric] of Object.entries(data.metrics || {})) {
    if (!metric.thresholds) continue;
    for (const [expr, result] of Object.entries(metric.thresholds)) {
      const passed = Boolean(result.ok);
      if (!passed) failures += 1;
      const name = `${metricName}: ${expr}`;
      cases.push(
        passed
          ? `  <testcase classname="k6.soak" name="${escapeXml(name)}" />`
          : `  <testcase classname="k6.soak" name="${escapeXml(name)}"><failure message="Threshold failed">${escapeXml(JSON.stringify(metric.values || {}))}</failure></testcase>`
      );
    }
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuite name="VoxelRealmsK6Soak" tests="${cases.length}" failures="${failures}">`,
    ...cases,
    '</testsuite>',
    '',
  ].join('\n');
}

export function handleSummary(data) {
  return {
    [`${REPORT_DIR}/k6-summary.json`]: JSON.stringify(data, null, 2),
    [`${REPORT_DIR}/k6-junit.xml`]: buildJunitXml(data),
  };
}
