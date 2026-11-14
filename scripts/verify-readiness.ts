/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import { ChildProcess, spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const TEST_PORT = 3199;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const TEST_SESSION_SECRET = 'verify-readiness-production-hmac-secret-2026-0123456789';
const TEST_ADMIN_PASSKEY = 'verify-readiness-operator-passkey-2026';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildMaskedWsFrame(opcode: number, payload: Buffer): Buffer {
  const mask = crypto.randomBytes(4);
  const masked = Buffer.from(payload);
  for (let i = 0; i < masked.length; i++) {
    masked[i] ^= mask[i & 3];
  }

  if (payload.length < 126) {
    return Buffer.concat([Buffer.from([0x80 | opcode, 0x80 | payload.length]), mask, masked]);
  }
  if (payload.length < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | 126;
    header.writeUInt16BE(payload.length, 2);
    return Buffer.concat([header, mask, masked]);
  }
  const header = Buffer.alloc(10);
  header[0] = 0x80 | opcode;
  header[1] = 0x80 | 127;
  header.writeBigUInt64BE(BigInt(payload.length), 2);
  return Buffer.concat([header, mask, masked]);
}

function countIncomingWsFrames(chunk: Buffer): { texts: string[]; closed: boolean } {
  const texts: string[] = [];
  let closed = false;
  let offset = 0;
  while (offset + 2 <= chunk.length) {
    const opcode = chunk[offset] & 0x0f;
    let len = chunk[offset + 1] & 0x7f;
    let headerLen = 2;
    if (len === 126) {
      if (offset + 4 > chunk.length) break;
      len = chunk.readUInt16BE(offset + 2);
      headerLen = 4;
    } else if (len === 127) {
      if (offset + 10 > chunk.length) break;
      len = Number(chunk.readBigUInt64BE(offset + 2));
      headerLen = 10;
    }
    if (offset + headerLen + len > chunk.length) break;
    const payload = chunk.subarray(offset + headerLen, offset + headerLen + len);
    if (opcode === 0x08) closed = true;
    else if (opcode === 0x01) texts.push(payload.toString('utf8'));
    offset += headerLen + len;
  }
  return { texts, closed };
}

function connectRawWebSocket(params: { port: number; sector?: string; cookie?: string }): Promise<{
  socket: net.Socket;
  receivedTexts: string[];
  isClosed: () => boolean;
}> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: '127.0.0.1', port: params.port });
    const key = crypto.randomBytes(16).toString('base64');
    const receivedTexts: string[] = [];
    let closed = false;
    let upgraded = false;
    let buffer = Buffer.alloc(0);

    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('WebSocket handshake timed out'));
    }, 5000);

    socket.on('connect', () => {
      const headers = [
        `GET /ws/siege?sector=${params.sector || 'B2'} HTTP/1.1`,
        `Host: 127.0.0.1:${params.port}`,
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Key: ${key}`,
        'Sec-WebSocket-Version: 13',
      ];
      if (params.cookie) {
        headers.push(`Cookie: ${params.cookie}`);
      }
      headers.push('', '');
      socket.write(headers.join('\r\n'));
    });

    socket.on('data', (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (!upgraded) {
        const headerEnd = buffer.indexOf('\r\n\r\n');
        if (headerEnd === -1) return;
        const headerStr = buffer.subarray(0, headerEnd).toString('utf8');
        if (!headerStr.startsWith('HTTP/1.1 101')) {
          clearTimeout(timer);
          reject(new Error(`WS upgrade failed: ${headerStr.split('\r\n')[0]}`));
          socket.destroy();
          return;
        }
        upgraded = true;
        clearTimeout(timer);
        const remainder = buffer.subarray(headerEnd + 4);
        buffer = Buffer.alloc(0);
        if (remainder.length > 0) {
          const parsed = countIncomingWsFrames(remainder);
          receivedTexts.push(...parsed.texts);
          if (parsed.closed) closed = true;
        }
        resolve({ socket, receivedTexts, isClosed: () => closed });
        return;
      }

      const parsed = countIncomingWsFrames(buffer);
      buffer = Buffer.alloc(0);
      receivedTexts.push(...parsed.texts);
      if (parsed.closed) closed = true;
    });

    socket.on('close', () => {
      closed = true;
    });
    socket.on('error', (err) => {
      if (!upgraded) {
        clearTimeout(timer);
        reject(err);
      }
    });
  });
}

async function startLiveServer(
  dataDir: string,
  extraEnv: Record<string, string> = {}
): Promise<{
  proc: ChildProcess;
  logs: () => string;
}> {
  let output = '';
  const tsxBin = path.resolve('node_modules/.bin/tsx');
  const proc = spawn(tsxBin, ['server.ts'], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(TEST_PORT),
      VOXEL_DATA_DIR: dataDir,
      VOXEL_SESSION_SECRET: TEST_SESSION_SECRET,
      VOXEL_ADMIN_PASSKEY: TEST_ADMIN_PASSKEY,
      VOXEL_API_WRITE_LIMIT_PER_MIN: '50',
      ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  proc.stdout?.on('data', (d) => {
    output += d.toString();
  });
  proc.stderr?.on('data', (d) => {
    output += d.toString();
  });

  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`${BASE_URL}/readyz`);
      if (res.ok) {
        return { proc, logs: () => output };
      }
    } catch {
      // Wait for boot
    }
    await sleep(150);
  }

  proc.kill('SIGKILL');
  throw new Error(`Live server failed to become ready. Logs:\n${output}`);
}

async function stopLiveServer(proc: ChildProcess): Promise<number | null> {
  return new Promise((resolve) => {
    if (proc.exitCode !== null) {
      resolve(proc.exitCode);
      return;
    }
    const deadline = setTimeout(() => {
      proc.kill('SIGKILL');
    }, 6000);
    proc.once('exit', (code) => {
      clearTimeout(deadline);
      resolve(code);
    });
    proc.kill('SIGTERM');
  });
}

async function runVerification() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vr-ops-verify-'));
  console.log(`[VerifyOps] Starting isolated live production verification (dataDir=${tmpDir})...`);

  let activeProc: ChildProcess | null = null;

  try {
    // =========================================================================
    // PHASE 1: BOOT, HEALTH/READINESS & EXPLOIT RESISTANCE VERIFICATION
    // =========================================================================
    const srv1 = await startLiveServer(tmpDir);
    activeProc = srv1.proc;

    const readyRes = await fetch(`${BASE_URL}/readyz`);
    assert.equal(readyRes.status, 200);
    const readyBody = (await readyRes.json()) as { ok: boolean; status: string };
    assert.equal(readyBody.ok, true);
    assert.equal(readyBody.status, 'ready');

    // 1a. Unauthenticated /api/admin/state fails closed (401)
    const anonAdminRes = await fetch(`${BASE_URL}/api/admin/state`);
    assert.equal(anonAdminRes.status, 401);

    // 1b. Player session spoofing root email stays Lv.1 player and gets 403 on /api/admin/state
    const playerSessRes = await fetch(`${BASE_URL}/api/auth/player-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commanderId: 'cmdr-load-tester',
        displayName: 'Load Vanguard',
        email: 'creatergame31@gmail.com',
      }),
    });
    assert.equal(playerSessRes.status, 200);
    const playerCookie = playerSessRes.headers.get('set-cookie')?.split(';')[0] || '';
    assert.ok(playerCookie.includes('vr_session='));

    const escalatedAdminRes = await fetch(`${BASE_URL}/api/admin/state`, {
      headers: { Cookie: playerCookie },
    });
    assert.equal(escalatedAdminRes.status, 403);

    // 1c. Anti-tamper stat clamping on /api/online/sync
    const spoofSyncRes = await fetch(`${BASE_URL}/api/online/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: playerCookie },
      body: JSON.stringify({
        commanderName: 'ValidName',
        castleLevel: 100,
        vipTier: 3,
        garrisonTroopsWire: '99999999999999999999',
      }),
    });
    assert.equal(spoofSyncRes.status, 200);
    const spoofSyncData = (await spoofSyncRes.json()) as {
      sanitizedFields: string[];
      syncedProfile: { castleLevel: number; vipTier: number; garrisonTroopsWire: string };
    };
    assert.equal(spoofSyncData.syncedProfile.castleLevel, 1);
    assert.equal(spoofSyncData.syncedProfile.vipTier, 0);
    assert.equal(spoofSyncData.syncedProfile.garrisonTroopsWire, '0');
    assert.ok(spoofSyncData.sanitizedFields.includes('castleLevel'));

    // 1d. Cross-Origin CSRF attempt with session cookie blocked (403)
    const csrfRes = await fetch(`${BASE_URL}/api/online/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: playerCookie,
        Origin: 'https://malicious-site.example',
      },
      body: JSON.stringify({ commanderName: 'CSRFAttack' }),
    });
    assert.equal(csrfRes.status, 403);

    // 1e. Prototype pollution payload rejected (400)
    const protoRes = await fetch(`${BASE_URL}/api/online/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: playerCookie },
      body: '{"commanderName":"Test","__proto__":{"polluted":true}}',
    });
    assert.equal(protoRes.status, 400);

    // 1f. Valid operator login & persistent decree write before testing lockout
    const opLoginRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'creatergame31@gmail.com',
        passkey: TEST_ADMIN_PASSKEY,
      }),
    });
    assert.equal(opLoginRes.status, 200);
    const opCookie = opLoginRes.headers.get('set-cookie')?.split(';')[0] || '';

    const decreeMarker = `OPS_DURABILITY_DECREE_${Date.now()}`;
    const decreeRes = await fetch(`${BASE_URL}/api/admin/decree`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: opCookie },
      body: JSON.stringify({ message: decreeMarker }),
    });
    assert.equal(decreeRes.status, 200);

    // 1g. Brute-force admin passkey lockout (5 bad tries -> 429 + Retry-After)
    for (let attempt = 0; attempt < 5; attempt++) {
      const failRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'creatergame31@gmail.com', passkey: 'wrong-guess' }),
      });
      assert.equal(failRes.status, 401);
    }
    const lockedRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'creatergame31@gmail.com', passkey: TEST_ADMIN_PASSKEY }),
    });
    assert.equal(lockedRes.status, 429);
    assert.ok(Number(lockedRes.headers.get('retry-after')) > 0);
    console.log(
      '[VerifyOps] ✅ HTTP Exploit Resistance (401/403, Clamp, CSRF, __proto__, Brute-Force 429) PASSED'
    );

    // =========================================================================
    // PHASE 2: WEBSOCKET EXPLOIT & FLOOD RESISTANCE + MULTI-PEER LOAD BENCHMARK
    // =========================================================================
    // 2a. Unauthenticated WS mutation rejected with S2C_AUTH_ERROR
    const anonWs = await connectRawWebSocket({ port: TEST_PORT, sector: 'B2' });
    anonWs.socket.write(
      buildMaskedWsFrame(
        0x01,
        Buffer.from(
          JSON.stringify({
            opcode: 0x01,
            sector: 'B2',
            payload: { cohortId: 0, clientSeq: 1, targetXQuantized: 100, targetZQuantized: 100 },
          })
        )
      )
    );
    await sleep(100);
    assert.ok(
      anonWs.receivedTexts.some((t) => t.includes('S2C_AUTH_ERROR')),
      'Expected unauthenticated WS command to return S2C_AUTH_ERROR'
    );
    anonWs.socket.destroy();

    // 2b. Oversized WS frame (> 32 KiB) forcibly closed
    const giantWs = await connectRawWebSocket({ port: TEST_PORT, cookie: playerCookie });
    const oversizedPayload = Buffer.alloc(40 * 1024, 0x41);
    giantWs.socket.write(buildMaskedWsFrame(0x01, oversizedPayload));
    await sleep(150);
    assert.equal(giantWs.isClosed(), true, 'Oversized WS frame should be closed by server');
    giantWs.socket.destroy();

    // 2c. Sustained WS message flood throttled & disconnected
    const floodWs = await connectRawWebSocket({ port: TEST_PORT, cookie: playerCookie });
    for (let i = 1; i <= 40; i++) {
      if (floodWs.isClosed()) break;
      floodWs.socket.write(
        buildMaskedWsFrame(
          0x01,
          Buffer.from(JSON.stringify({ opcode: 0x01, sector: 'B2', payload: { clientSeq: i } }))
        )
      );
    }
    await sleep(150);
    assert.ok(
      floodWs.receivedTexts.some((t) => t.includes('S2C_RATE_LIMIT')) && floodWs.isClosed(),
      'Sustained WS flood should receive S2C_RATE_LIMIT and disconnect'
    );
    floodWs.socket.destroy();

    // 2d. Load capacity test: 12 concurrent WS peers + 200 concurrent HTTP requests
    const peers = await Promise.all(
      Array.from({ length: 12 }, (_, idx) =>
        connectRawWebSocket({
          port: TEST_PORT,
          sector: 'B2',
          cookie: playerCookie,
        }).then((p) => ({ idx, ...p }))
      )
    );

    const latenciesMs: number[] = [];
    const loadStartNs = process.hrtime.bigint();
    let httpErrors = 0;

    // 200 concurrent HTTP reads across /api/online/status, /readyz, /api/ops/readiness
    const batches = 4;
    const concurrency = 50;
    for (let b = 0; b < batches; b++) {
      await Promise.all(
        Array.from({ length: concurrency }, async (_, j) => {
          const endpoint =
            j % 5 === 0 ? '/readyz' : j % 5 === 1 ? '/api/ops/readiness' : '/api/online/status';
          const t0 = process.hrtime.bigint();
          const res = await fetch(`${BASE_URL}${endpoint}`);
          const dt = Number(process.hrtime.bigint() - t0) / 1_000_000;
          latenciesMs.push(dt);
          if (!res.ok) httpErrors += 1;
          await res.arrayBuffer();
        })
      );
    }
    const totalLoadMs = Number(process.hrtime.bigint() - loadStartNs) / 1_000_000;
    await sleep(250); // Let 20Hz loop broadcast multiple ticks to all 12 peers

    const sortedLat = [...latenciesMs].sort((a, b) => a - b);
    const p50 = sortedLat[Math.floor(sortedLat.length * 0.5)];
    const p95 = sortedLat[Math.floor(sortedLat.length * 0.95)];
    const p99 = sortedLat[Math.floor(sortedLat.length * 0.99)];
    const rps = Math.round((latenciesMs.length / (totalLoadMs / 1000)) * 10) / 10;

    assert.equal(httpErrors, 0, 'Expected 0 HTTP errors under 200-request concurrent load');
    for (const peer of peers) {
      assert.ok(peer.receivedTexts.length >= 3, 'Each WS peer should receive live 20Hz ticks');
      peer.socket.destroy();
    }

    const opsRes = await fetch(`${BASE_URL}/api/ops/readiness`, {
      headers: { Cookie: opCookie },
    });
    const opsData = (await opsRes.json()) as {
      tickLoop20Hz: { overrunCount: number; p95Ms: number; maxMs: number };
      exploitDefenseCounters: {
        bruteForceLockouts: number;
        csrfBlocks: number;
        prototypePollutionBlocks: number;
        wsFramesRejected: number;
        wsRateLimitDisconnects: number;
      };
      persistence: { writable: boolean; totalWrites: number; failedWrites: number };
    };
    assert.equal(opsData.persistence.writable, true);
    assert.equal(opsData.persistence.failedWrites, 0);
    assert.equal(opsData.tickLoop20Hz.overrunCount, 0);
    assert.ok(opsData.exploitDefenseCounters.bruteForceLockouts >= 1);
    assert.ok(opsData.exploitDefenseCounters.csrfBlocks >= 1);
    assert.ok(opsData.exploitDefenseCounters.prototypePollutionBlocks >= 1);
    assert.ok(opsData.exploitDefenseCounters.wsFramesRejected >= 1);
    assert.ok(opsData.exploitDefenseCounters.wsRateLimitDisconnects >= 1);

    console.log(
      `[VerifyOps] ✅ Load & Concurrency PASSED (${latenciesMs.length} reqs @ ${concurrency}-way concurrency, ${rps} req/s, p50=${p50.toFixed(1)}ms, p95=${p95.toFixed(1)}ms, p99=${p99.toFixed(1)}ms, 12 WS peers @ 20Hz with 0 tick overruns)`
    );

    // =========================================================================
    // PHASE 3: GRACEFUL SIGTERM SHUTDOWN + PRIMARY SAVE CORRUPTION RECOVERY
    // =========================================================================
    const exitCode1 = await stopLiveServer(srv1.proc);
    activeProc = null;
    assert.equal(exitCode1, 0, 'Expected graceful SIGTERM shutdown exit code 0');

    const primarySavePath = path.join(tmpDir, 'online_realm_state.json');
    const backupSavePath = path.join(tmpDir, 'online_realm_state.json.bak');
    assert.equal(fs.existsSync(primarySavePath), true);
    assert.equal(fs.existsSync(backupSavePath), true);

    // Simulate catastrophic mid-write crash truncating primary save
    fs.writeFileSync(primarySavePath, '{"schemaVersion":2,"corrupted_mid_write":', 'utf8');

    const srv2 = await startLiveServer(tmpDir);
    activeProc = srv2.proc;

    const ready2 = (await (await fetch(`${BASE_URL}/readyz`)).json()) as {
      ok: boolean;
      checks: { recoveredFromBackup: boolean };
    };
    assert.equal(ready2.ok, true);
    assert.equal(ready2.checks.recoveredFromBackup, true);

    // Re-login as operator after reboot and confirm prior decree survived primary corruption via .bak
    const opLogin2 = await fetch(`${BASE_URL}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'creatergame31@gmail.com', passkey: TEST_ADMIN_PASSKEY }),
    });
    assert.equal(opLogin2.status, 200);
    const opCookie2 = opLogin2.headers.get('set-cookie')?.split(';')[0] || '';
    const adminState2 = (await (
      await fetch(`${BASE_URL}/api/admin/state`, { headers: { Cookie: opCookie2 } })
    ).json()) as {
      activeDecrees: Array<{ message: string }>;
    };
    assert.ok(
      adminState2.activeDecrees.some((d) => d.message === decreeMarker),
      'Expected persisted decree to survive truncated primary JSON via automatic .bak recovery'
    );

    const exitCode2 = await stopLiveServer(srv2.proc);
    activeProc = null;
    assert.equal(exitCode2, 0, 'Expected second graceful SIGTERM shutdown exit code 0');

    console.log(
      '[VerifyOps] ✅ Reliable Saves & Crash Recovery PASSED (truncated primary automatically recovered from SHA-256 verified .bak + clean SIGTERM flush)'
    );
  } finally {
    if (activeProc && activeProc.exitCode === null) {
      activeProc.kill('SIGKILL');
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

runVerification().catch((err) => {
  console.error('[VerifyOps] ❌ FAILED:', err);
  process.exit(1);
});
