/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BruteForceLockoutGuard,
  SlidingWindowRateLimiter,
  TickLatencyTracker,
  containsUnsafePrototypeKey,
  decodeWsFramesHardened,
  pruneCommanderMap,
  verifySameOriginRequest,
} from './serverHardening';

function buildMaskedWsFrame(text: string): Buffer {
  const payload = Buffer.from(text, 'utf8');
  const mask = Buffer.from([0x12, 0x34, 0x56, 0x78]);
  const maskedPayload = Buffer.from(payload);
  for (let i = 0; i < maskedPayload.length; i++) {
    maskedPayload[i] ^= mask[i & 3];
  }
  if (payload.length < 126) {
    return Buffer.concat([Buffer.from([0x81, 0x80 | payload.length]), mask, maskedPayload]);
  }
  const header = Buffer.alloc(4);
  header[0] = 0x81;
  header[1] = 0x80 | 126;
  header.writeUInt16BE(payload.length, 2);
  return Buffer.concat([header, mask, maskedPayload]);
}

test('SlidingWindowRateLimiter enforces burst limits, slides cleanly, and bounds key memory', () => {
  const limiter = new SlidingWindowRateLimiter({ maxRequests: 3, windowMs: 1_000, maxKeys: 100 });
  const t0 = 10_000;

  assert.equal(limiter.check('ip1', t0).allowed, true);
  assert.equal(limiter.check('ip1', t0 + 10).allowed, true);
  assert.equal(limiter.check('ip1', t0 + 20).allowed, true);

  const blocked = limiter.check('ip1', t0 + 30);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSec >= 1);

  // After 1001ms, window clears
  assert.equal(limiter.check('ip1', t0 + 1_010).allowed, true);

  // Bounds key count cleanly
  for (let i = 0; i < 150; i++) {
    limiter.check(`flood-${i}`, t0 + 2_000);
  }
  assert.ok(limiter.size() <= 100);
});

test('BruteForceLockoutGuard locks repeated failures and clears on valid login', () => {
  const guard = new BruteForceLockoutGuard({ maxAttempts: 3, lockoutMs: 30_000 });
  const t0 = 50_000;

  assert.equal(guard.recordFailure('ip1:admin', t0).lockedNow, false);
  assert.equal(guard.recordFailure('ip1:admin', t0 + 100).lockedNow, false);
  const third = guard.recordFailure('ip1:admin', t0 + 200);
  assert.equal(third.lockedNow, true);
  assert.equal(guard.isLocked('ip1:admin', t0 + 5_000).locked, true);
  assert.equal(guard.getTotalLockoutsTriggered(), 1);

  // Lock expires after 30s
  assert.equal(guard.isLocked('ip1:admin', t0 + 35_000).locked, false);

  // Successful login resets attempts
  guard.recordFailure('ip2:admin', t0);
  guard.recordSuccess('ip2:admin');
  assert.equal(guard.recordFailure('ip2:admin', t0 + 100).failures, 1);
});

test('verifySameOriginRequest defends cookie writes against cross-origin CSRF while permitting Bearer and matching origin', () => {
  assert.equal(
    verifySameOriginRequest({
      method: 'POST',
      originHeader: 'https://evil-attacker.example',
      hostHeader: 'voxel.run.app',
      hasSessionCookie: true,
      hasBearerAuth: false,
    }).allowed,
    false
  );

  assert.equal(
    verifySameOriginRequest({
      method: 'POST',
      originHeader: 'https://voxel.run.app',
      hostHeader: 'voxel.run.app',
      hasSessionCookie: true,
      hasBearerAuth: false,
    }).allowed,
    true
  );

  assert.equal(
    verifySameOriginRequest({
      method: 'POST',
      originHeader: 'https://external-client.example',
      hostHeader: 'voxel.run.app',
      hasSessionCookie: false,
      hasBearerAuth: true,
    }).allowed,
    true
  );
});

test('containsUnsafePrototypeKey detects __proto__, constructor, and prototype poisoning', () => {
  const poisoned = JSON.parse('{"nested":{"__proto__":{"isAdmin":true}}}');
  assert.equal(containsUnsafePrototypeKey(poisoned), true);
  assert.equal(containsUnsafePrototypeKey({ constructor: { prototype: {} } }), true);
  assert.equal(containsUnsafePrototypeKey({ ok: true, sector: 'B2', troops: '100' }), false);
});

test('decodeWsFramesHardened handles fragmented frames and rejects oversized frames or RX floods', () => {
  const frameA = buildMaskedWsFrame('{"opcode":1,"msg":"alpha"}');
  const frameB = buildMaskedWsFrame('{"opcode":2,"msg":"beta"}');
  const combined = Buffer.concat([frameA, frameB]);

  // Split mid-frame across TCP chunks
  const splitPoint = frameA.length + 5;
  const part1 = decodeWsFramesHardened(combined.subarray(0, splitPoint));
  assert.equal(part1.messages.length, 1);
  assert.equal(part1.remainingBuffer.length, 5);

  const part2 = decodeWsFramesHardened(
    Buffer.concat([part1.remainingBuffer, combined.subarray(splitPoint)])
  );
  assert.equal(part2.messages.length, 1);
  assert.equal(JSON.parse(part2.messages[0]).msg, 'beta');
  assert.equal(part2.remainingBuffer.length, 0);

  // Oversized 64-bit length frame rejected immediately
  const giantHeader = Buffer.alloc(10);
  giantHeader[0] = 0x81;
  giantHeader[1] = 0x80 | 127;
  giantHeader.writeBigUInt64BE(5_000_000n, 2);
  const giantRes = decodeWsFramesHardened(giantHeader, 32 * 1024, 64 * 1024);
  assert.equal(giantRes.closeRequested, true);
  assert.ok(giantRes.protocolError?.includes('exceeds'));
});

test('TickLatencyTracker and pruneCommanderMap enforce tick telemetry and bounded commander memory', () => {
  const tracker = new TickLatencyTracker({ capacity: 50, budgetMs: 50 });
  for (let i = 1; i <= 20; i++) {
    tracker.record(i * 2);
  }
  tracker.record(65); // 1 overrun
  const summary = tracker.getSummary();
  assert.equal(summary.totalTicks, 21);
  assert.equal(summary.overrunCount, 1);
  assert.equal(summary.maxMs, 65);
  assert.ok(summary.p95Ms >= 38);

  const commanders: Record<string, { updatedAtIso: string }> = {
    'player-commander-01': { updatedAtIso: '2026-01-01T00:00:00.000Z' },
    old1: { updatedAtIso: '2026-01-02T00:00:00.000Z' },
    old2: { updatedAtIso: '2026-01-03T00:00:00.000Z' },
    new1: { updatedAtIso: '2026-11-14T00:00:00.000Z' },
  };
  const evicted = pruneCommanderMap(commanders, 3, 'player-commander-01');
  assert.equal(evicted, 1);
  assert.ok('player-commander-01' in commanders);
  assert.equal('old1' in commanders, false);
  assert.ok('new1' in commanders);
});
