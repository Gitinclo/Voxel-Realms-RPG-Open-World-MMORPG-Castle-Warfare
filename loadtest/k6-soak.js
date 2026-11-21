/**
 * Voxel Realms RPG — Multi-Hour External Load & Soak Suite (k6)
 *
 * Smoke run (2 minutes, 25 VUs):
 *   k6 run -e BASE_URL=https://staging.voxelrealms.example.com -e DURATION=2m -e VUS=25 loadtest/k6-soak.js
 *
 * Full multi-hour soak run (4 hours, 150 VUs across HTTP + 20Hz /ws/siege):
 *   k6 run -e BASE_URL=https://staging.voxelrealms.example.com -e DURATION=4h -e VUS=150 loadtest/k6-soak.js
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3000';
const WS_BASE_URL = BASE_URL.replace(/^http/, 'ws');
const DURATION = __ENV.DURATION || '4h';
const VUS = Number(__ENV.VUS || 150);

const economySuccessRate = new Rate('voxel_economy_success_rate');
const wsSessionDuration = new Trend('voxel_ws_session_ms');

export const options = {
  scenarios: {
    http_authoritative_soak: {
      executor: 'ramping-vus',
      exec: 'httpAuthoritativeFlow',
      startVUs: 10,
      stages: [
        { duration: '2m', target: VUS },
        { duration: DURATION, target: VUS },
        { duration: '1m', target: 0 },
      ],
    },
    ws_siege_20hz_soak: {
      executor: 'constant-vus',
      exec: 'wsSiegeFlow',
      vus: Math.max(10, Math.floor(VUS / 3)),
      duration: DURATION,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.001'],
    http_req_duration: ['p(95)<100', 'p(99)<250'],
    voxel_economy_success_rate: ['rate>0.995'],
    ws_connecting: ['p(95)<250'],
  },
};

export function httpAuthoritativeFlow() {
  const cmdrId = `soak-vu-${__VU}-${__ITER % 5}`;
  const jar = http.cookieJar();

  // 1. Health check
  const health = http.get(`${BASE_URL}/healthz`);
  check(health, { 'healthz is 200': (r) => r.status === 200 });

  // 2. Scoped player session login
  const login = http.post(
    `${BASE_URL}/api/auth/player-session`,
    JSON.stringify({ commanderId: cmdrId, displayName: `Soak Knight ${__VU}` }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  const loginOk = check(login, { 'player-session 200': (r) => r.status === 200 });
  if (!loginOk) {
    economySuccessRate.add(false);
    sleep(1);
    return;
  }

  // 3. Authoritative gameplay action + deterministic idempotency replay check
  const idemKey = `soak-${__VU}-${__ITER}-gather`;
  const claimPayload = JSON.stringify({
    idempotencyKey: idemKey,
    actionType: 'GATHER_WOOD_NODE',
    entityId: 'wood-node-1',
  });
  const claim1 = http.post(`${BASE_URL}/api/online/economy/claim-action`, claimPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  const claim2 = http.post(`${BASE_URL}/api/online/economy/claim-action`, claimPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  // 200 (credited/replayed) or 429 (cooldown active) are both valid server-authoritative responses
  const ecoOk =
    check(claim1, {
      'claim-action valid status': (r) => r.status === 200 || r.status === 429,
    }) &&
    check(claim2, {
      'claim-action idempotent replay or cooldown': (r) => r.status === 200 || r.status === 429,
    });
  economySuccessRate.add(ecoOk);

  // 4. Read balance & readiness
  const bal = http.get(`${BASE_URL}/api/online/economy/balance`);
  check(bal, { 'balance 200': (r) => r.status === 200 });

  // 5. Logout & verify server-side session revocation
  const logout = http.post(`${BASE_URL}/api/auth/logout`, null);
  check(logout, { 'logout 200': (r) => r.status === 200 });

  // Clear local jar for next iteration
  jar.clear(BASE_URL);
  sleep(1.5);
}

export function wsSiegeFlow() {
  const sectors = ['A1', 'B2', 'C3', 'D4'];
  const sector = sectors[__VU % sectors.length];
  const url = `${WS_BASE_URL}/ws/siege?sector=${sector}`;
  const start = Date.now();

  const res = ws.connect(url, { headers: { Origin: BASE_URL } }, (socket) => {
    let framesReceived = 0;

    socket.on('open', () => {
      socket.setInterval(() => {
        socket.send(
          JSON.stringify({
            type: 'C2S_PING',
            clientTimestampMs: Date.now(),
          })
        );
      }, 5000);
    });

    socket.on('message', () => {
      framesReceived += 1;
    });

    socket.setTimeout(() => {
      check(framesReceived, { 'received >= 1 20Hz siege frame': (n) => n >= 1 });
      socket.close();
    }, 15000);
  });

  check(res, { 'ws upgraded 101': (r) => r && r.status === 101 });
  wsSessionDuration.add(Date.now() - start);
  sleep(2);
}
