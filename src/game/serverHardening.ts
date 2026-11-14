/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const OPERATIONAL_LIMITS = {
  MAX_WS_PEERS: 250,
  MAX_WS_PEERS_PER_IP: 20,
  MAX_WS_FRAME_BYTES: 32 * 1024, // 32 KiB per incoming WebSocket frame
  MAX_WS_RX_BUFFER_BYTES: 64 * 1024, // 64 KiB per-socket incomplete frame buffer
  WS_SLOW_CONSUMER_HIGH_WATER_BYTES: 256 * 1024, // 256 KiB outbound backpressure cutoff
  WS_MESSAGES_PER_WINDOW: 30,
  WS_RATE_WINDOW_MS: 1_000,
  API_WRITES_PER_MINUTE: 120,
  AUTH_FAIL_MAX_ATTEMPTS: 5,
  AUTH_LOCKOUT_MS: 60_000,
  MAX_PERSISTED_COMMANDERS: 5_000,
  MAX_SUPPORT_TICKETS: 500,
  MAX_AUDIT_LOG_ENTRIES: 200,
  GRACEFUL_SHUTDOWN_DEADLINE_MS: 5_000,
} as const;

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Memory-bounded sliding-window rate limiter for HTTP routes and WebSocket floods.
 */
export class SlidingWindowRateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly maxKeys: number;
  private readonly buckets = new Map<string, number[]>();

  constructor(params: { maxRequests: number; windowMs: number; maxKeys?: number }) {
    this.maxRequests = Math.max(1, params.maxRequests);
    this.windowMs = Math.max(100, params.windowMs);
    this.maxKeys = Math.max(100, params.maxKeys ?? 10_000);
  }

  public check(key: string, nowMs: number = Date.now()): RateLimitCheckResult {
    const cutoff = nowMs - this.windowMs;
    const existing = this.buckets.get(key) || [];
    const active = existing.filter((ts) => ts > cutoff);

    if (active.length >= this.maxRequests) {
      const oldestActive = active[0] ?? nowMs;
      const retryAfterMs = Math.max(1_000, oldestActive + this.windowMs - nowMs);
      this.buckets.set(key, active);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSec: Math.ceil(retryAfterMs / 1_000),
      };
    }

    active.push(nowMs);
    // Re-insert for LRU eviction order when bounded maxKeys is reached
    if (this.buckets.has(key)) {
      this.buckets.delete(key);
    } else if (this.buckets.size >= this.maxKeys) {
      const oldestKey = this.buckets.keys().next().value;
      if (oldestKey !== undefined) {
        this.buckets.delete(oldestKey);
      }
    }
    this.buckets.set(key, active);

    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - active.length),
      retryAfterSec: 0,
    };
  }

  public sweepExpired(nowMs: number = Date.now()): number {
    const cutoff = nowMs - this.windowMs;
    let removed = 0;
    for (const [key, timestamps] of this.buckets.entries()) {
      const active = timestamps.filter((ts) => ts > cutoff);
      if (active.length === 0) {
        this.buckets.delete(key);
        removed += 1;
      } else {
        this.buckets.set(key, active);
      }
    }
    return removed;
  }

  public size(): number {
    return this.buckets.size;
  }
}

interface LoginLockoutState {
  failures: number;
  firstFailureMs: number;
  lockedUntilMs: number;
}

/**
 * Brute-force lockout guard for operator passkey authentication (/api/auth/admin-login).
 */
export class BruteForceLockoutGuard {
  private readonly maxAttempts: number;
  private readonly lockoutMs: number;
  private readonly attempts = new Map<string, LoginLockoutState>();
  private totalLockoutsTriggered = 0;

  constructor(params?: { maxAttempts?: number; lockoutMs?: number }) {
    this.maxAttempts = Math.max(
      2,
      params?.maxAttempts ?? OPERATIONAL_LIMITS.AUTH_FAIL_MAX_ATTEMPTS
    );
    this.lockoutMs = Math.max(5_000, params?.lockoutMs ?? OPERATIONAL_LIMITS.AUTH_LOCKOUT_MS);
  }

  public isLocked(
    key: string,
    nowMs: number = Date.now()
  ): { locked: boolean; retryAfterSec: number } {
    const entry = this.attempts.get(key);
    if (!entry) return { locked: false, retryAfterSec: 0 };
    if (entry.lockedUntilMs > nowMs) {
      return {
        locked: true,
        retryAfterSec: Math.max(1, Math.ceil((entry.lockedUntilMs - nowMs) / 1_000)),
      };
    }
    if (nowMs - entry.firstFailureMs > this.lockoutMs * 2) {
      this.attempts.delete(key);
    }
    return { locked: false, retryAfterSec: 0 };
  }

  public recordFailure(
    key: string,
    nowMs: number = Date.now()
  ): { lockedNow: boolean; failures: number; retryAfterSec: number } {
    const existing = this.attempts.get(key);
    if (!existing || nowMs - existing.firstFailureMs > this.lockoutMs * 2) {
      this.attempts.set(key, {
        failures: 1,
        firstFailureMs: nowMs,
        lockedUntilMs: 0,
      });
      return { lockedNow: false, failures: 1, retryAfterSec: 0 };
    }

    const nextFailures = existing.failures + 1;
    let lockedUntilMs = existing.lockedUntilMs;
    let lockedNow = false;
    if (nextFailures >= this.maxAttempts) {
      lockedUntilMs = nowMs + this.lockoutMs;
      lockedNow = true;
      this.totalLockoutsTriggered += 1;
    }

    this.attempts.set(key, {
      failures: nextFailures,
      firstFailureMs: existing.firstFailureMs,
      lockedUntilMs,
    });

    return {
      lockedNow,
      failures: nextFailures,
      retryAfterSec: lockedNow ? Math.ceil(this.lockoutMs / 1_000) : 0,
    };
  }

  public recordSuccess(key: string): void {
    this.attempts.delete(key);
  }

  public getTotalLockoutsTriggered(): number {
    return this.totalLockoutsTriggered;
  }
}

/**
 * Validates Origin/Referer against Host on state-changing HTTP requests authenticated via cookies
 * to defeat cross-site request forgery (CSRF). Non-browser Bearer/API requests without an Origin
 * header are permitted because cookies are not attached automatically by browsers cross-origin
 * without an Origin header on fetch/XHR/form POSTs.
 */
export function verifySameOriginRequest(params: {
  method: string;
  originHeader?: string;
  refererHeader?: string;
  hostHeader?: string;
  hasSessionCookie: boolean;
  hasBearerAuth: boolean;
  appUrl?: string;
}): { allowed: boolean; reason?: string } {
  const upperMethod = params.method.toUpperCase();
  if (upperMethod === 'GET' || upperMethod === 'HEAD' || upperMethod === 'OPTIONS') {
    return { allowed: true };
  }

  // Non-cookie API callers authenticating via Bearer tokens aren't vulnerable to ambient cookie CSRF
  if (params.hasBearerAuth || !params.hasSessionCookie) {
    return { allowed: true };
  }

  const rawOrigin = params.originHeader || params.refererHeader;
  if (!rawOrigin) {
    // Allow same-process curl/test clients when no browser Origin/Referer is sent; browser fetch/POST always sends Origin
    return { allowed: true };
  }

  let sourceHost: string;
  try {
    sourceHost = new URL(rawOrigin).host.toLowerCase();
  } catch {
    return {
      allowed: false,
      reason: 'Malformed Origin/Referer header on cookie-authenticated write.',
    };
  }

  const allowedHosts = new Set<string>();
  if (params.hostHeader) {
    allowedHosts.add(params.hostHeader.trim().toLowerCase());
  }
  if (params.appUrl) {
    try {
      allowedHosts.add(new URL(params.appUrl).host.toLowerCase());
    } catch {
      // Ignore malformed APP_URL
    }
  }

  if (allowedHosts.size === 0 || allowedHosts.has(sourceHost)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Cross-origin CSRF blocked: origin "${sourceHost}" does not match target host "${params.hostHeader || 'unknown'}".`,
  };
}

/**
 * Checks raw object JSON trees for prototype pollution keys (__proto__, constructor, prototype).
 */
export function containsUnsafePrototypeKey(input: unknown, depth: number = 0): boolean {
  if (depth > 8 || input === null || typeof input !== 'object') {
    return false;
  }
  if (Array.isArray(input)) {
    for (const item of input) {
      if (containsUnsafePrototypeKey(item, depth + 1)) return true;
    }
    return false;
  }

  for (const key of Object.keys(input as Record<string, unknown>)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return true;
    }
    if (containsUnsafePrototypeKey((input as Record<string, unknown>)[key], depth + 1)) {
      return true;
    }
  }
  return false;
}

export interface DecodedWsStreamResult {
  messages: string[];
  closeRequested: boolean;
  pingPayload: Buffer | null;
  remainingBuffer: Buffer;
  protocolError: string | null;
}

/**
 * Hardened RFC 6455 stream decoder supporting fragmented TCP reads, frame-size limits (32 KiB),
 * and incomplete-buffer overflow protection (64 KiB).
 */
export function decodeWsFramesHardened(
  buffer: Buffer,
  maxFrameBytes: number = OPERATIONAL_LIMITS.MAX_WS_FRAME_BYTES,
  maxBufferBytes: number = OPERATIONAL_LIMITS.MAX_WS_RX_BUFFER_BYTES
): DecodedWsStreamResult {
  const messages: string[] = [];
  let closeRequested = false;
  let pingPayload: Buffer | null = null;
  let offset = 0;

  if (buffer.length > maxBufferBytes) {
    return {
      messages: [],
      closeRequested: true,
      pingPayload: null,
      remainingBuffer: Buffer.alloc(0),
      protocolError: `WebSocket receive buffer exceeded ${maxBufferBytes} bytes.`,
    };
  }

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
      const bigLen = buffer.readBigUInt64BE(offset + 2);
      if (bigLen > BigInt(maxFrameBytes)) {
        return {
          messages,
          closeRequested: true,
          pingPayload,
          remainingBuffer: Buffer.alloc(0),
          protocolError: `WebSocket frame payload (${bigLen.toString()} bytes) exceeds ${maxFrameBytes} byte limit.`,
        };
      }
      payloadLen = Number(bigLen);
      headerLen = 10;
    }

    if (payloadLen > maxFrameBytes) {
      return {
        messages,
        closeRequested: true,
        pingPayload,
        remainingBuffer: Buffer.alloc(0),
        protocolError: `WebSocket frame payload (${payloadLen} bytes) exceeds ${maxFrameBytes} byte limit.`,
      };
    }

    const maskLen = isMasked ? 4 : 0;
    if (offset + headerLen + maskLen + payloadLen > buffer.length) {
      break;
    }

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

  return {
    messages,
    closeRequested,
    pingPayload,
    remainingBuffer:
      offset < buffer.length ? Buffer.from(buffer.subarray(offset)) : Buffer.alloc(0),
    protocolError: null,
  };
}

/**
 * Rolling latency / tick-jitter metrics tracker for 20Hz simulation and HTTP APIs.
 */
export class TickLatencyTracker {
  private readonly samplesMs: number[] = [];
  private readonly capacity: number;
  private maxObservedMs = 0;
  private overrunCount = 0;
  private totalTicks = 0;
  private readonly budgetMs: number;

  constructor(params?: { capacity?: number; budgetMs?: number }) {
    this.capacity = Math.max(10, params?.capacity ?? 200);
    this.budgetMs = Math.max(1, params?.budgetMs ?? 50);
  }

  public record(durationMs: number): void {
    this.totalTicks += 1;
    if (durationMs > this.maxObservedMs) {
      this.maxObservedMs = durationMs;
    }
    if (durationMs > this.budgetMs) {
      this.overrunCount += 1;
    }
    this.samplesMs.push(durationMs);
    if (this.samplesMs.length > this.capacity) {
      this.samplesMs.shift();
    }
  }

  public getSummary(): {
    totalTicks: number;
    budgetMs: number;
    overrunCount: number;
    p50Ms: number;
    p95Ms: number;
    maxMs: number;
  } {
    if (this.samplesMs.length === 0) {
      return {
        totalTicks: this.totalTicks,
        budgetMs: this.budgetMs,
        overrunCount: this.overrunCount,
        p50Ms: 0,
        p95Ms: 0,
        maxMs: Math.round(this.maxObservedMs * 100) / 100,
      };
    }

    const sorted = [...this.samplesMs].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0;
    return {
      totalTicks: this.totalTicks,
      budgetMs: this.budgetMs,
      overrunCount: this.overrunCount,
      p50Ms: Math.round(p50 * 100) / 100,
      p95Ms: Math.round(p95 * 100) / 100,
      maxMs: Math.round(this.maxObservedMs * 100) / 100,
    };
  }
}

/**
 * Evicts oldest non-pinned entries when the commander map exceeds MAX_PERSISTED_COMMANDERS.
 */
export function pruneCommanderMap<T extends { updatedAtIso: string }>(
  commanders: Record<string, T>,
  maxEntries: number = OPERATIONAL_LIMITS.MAX_PERSISTED_COMMANDERS,
  pinnedId: string = 'player-commander-01'
): number {
  const keys = Object.keys(commanders);
  if (keys.length <= maxEntries) return 0;

  const sortedByAge = keys
    .filter((k) => k !== pinnedId)
    .sort((a, b) => {
      const ta = Date.parse(commanders[a]?.updatedAtIso || '') || 0;
      const tb = Date.parse(commanders[b]?.updatedAtIso || '') || 0;
      return ta - tb;
    });

  let evicted = 0;
  const excess = keys.length - maxEntries;
  for (let i = 0; i < excess && i < sortedByAge.length; i++) {
    delete commanders[sortedByAge[i]];
    evicted += 1;
  }
  return evicted;
}
