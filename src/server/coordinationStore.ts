/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pluggable coordination store contract for session revocation and distributed metadata.
 * Defaults to bounded in-memory storage for single-instance runs and supports an optional
 * Redis REST backend (`REDIS_REST_URL` + `REDIS_REST_TOKEN`) for multi-replica deployments.
 */
export interface ServerCoordinationStore {
  readonly backendKind: 'memory' | 'redis_rest';
  revokeSession(sessionId: string, ttlMs: number): Promise<void>;
  isSessionRevoked(sessionId: string): boolean;
  isSessionRevokedAsync(sessionId: string): Promise<boolean>;
  sweepExpired(nowMs?: number): number;
  getRevokedCount(): number;
}

export class InMemoryCoordinationStore implements ServerCoordinationStore {
  public readonly backendKind = 'memory' as const;
  private readonly revokedSessions = new Map<string, number>();
  private readonly maxEntries: number;

  constructor(maxEntries: number = 20_000) {
    this.maxEntries = Math.max(100, maxEntries);
  }

  public async revokeSession(sessionId: string, ttlMs: number): Promise<void> {
    if (!sessionId) return;
    const expiresAt = Date.now() + Math.max(1_000, ttlMs);
    if (this.revokedSessions.size >= this.maxEntries) {
      this.sweepExpired();
      if (this.revokedSessions.size >= this.maxEntries) {
        const oldestKey = this.revokedSessions.keys().next().value;
        if (oldestKey) this.revokedSessions.delete(oldestKey);
      }
    }
    this.revokedSessions.set(sessionId, expiresAt);
  }

  public isSessionRevoked(sessionId: string): boolean {
    if (!sessionId) return false;
    const expiresAt = this.revokedSessions.get(sessionId);
    if (expiresAt === undefined) return false;
    if (expiresAt <= Date.now()) {
      this.revokedSessions.delete(sessionId);
      return false;
    }
    return true;
  }

  public async isSessionRevokedAsync(sessionId: string): Promise<boolean> {
    return this.isSessionRevoked(sessionId);
  }

  public sweepExpired(nowMs: number = Date.now()): number {
    let removed = 0;
    for (const [id, exp] of this.revokedSessions.entries()) {
      if (exp <= nowMs) {
        this.revokedSessions.delete(id);
        removed += 1;
      }
    }
    return removed;
  }

  public getRevokedCount(): number {
    return this.revokedSessions.size;
  }
}

export interface RedisRestCoordinationConfig {
  restUrl: string;
  restToken: string;
  fetchImpl?: typeof fetch;
}

/**
 * External Redis REST coordination store (compatible with Upstash / HTTP Redis gateways)
 * paired with a local write-through mirror so synchronous hot-path checks remain non-blocking.
 */
export class RedisRestCoordinationStore implements ServerCoordinationStore {
  public readonly backendKind = 'redis_rest' as const;
  private readonly localMirror = new InMemoryCoordinationStore();
  private readonly restUrl: string;
  private readonly restToken: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: RedisRestCoordinationConfig) {
    this.restUrl = config.restUrl.replace(/\/+$/, '');
    this.restToken = config.restToken;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  public async revokeSession(sessionId: string, ttlMs: number): Promise<void> {
    if (!sessionId) return;
    await this.localMirror.revokeSession(sessionId, ttlMs);
    const ttlSec = Math.max(1, Math.ceil(ttlMs / 1_000));
    try {
      await this.fetchImpl(`${this.restUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.restToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([['SET', `voxel:revoked:${sessionId}`, '1', 'EX', String(ttlSec)]]),
      });
    } catch (err) {
      console.warn('[CoordinationStore] Non-fatal Redis REST revocation write warning:', err);
    }
  }

  public isSessionRevoked(sessionId: string): boolean {
    return this.localMirror.isSessionRevoked(sessionId);
  }

  public async isSessionRevokedAsync(sessionId: string): Promise<boolean> {
    if (this.localMirror.isSessionRevoked(sessionId)) return true;
    try {
      const response = await this.fetchImpl(
        `${this.restUrl}/get/${encodeURIComponent(`voxel:revoked:${sessionId}`)}`,
        {
          headers: { Authorization: `Bearer ${this.restToken}` },
        }
      );
      if (!response.ok) return false;
      const body = (await response.json()) as { result?: string | null };
      if (body.result === '1') {
        await this.localMirror.revokeSession(sessionId, 60_000);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public sweepExpired(nowMs?: number): number {
    return this.localMirror.sweepExpired(nowMs);
  }

  public getRevokedCount(): number {
    return this.localMirror.getRevokedCount();
  }
}

export function createCoordinationStore(
  env: NodeJS.ProcessEnv = process.env
): ServerCoordinationStore {
  const restUrl = env.REDIS_REST_URL?.trim();
  const restToken = env.REDIS_REST_TOKEN?.trim();
  if (restUrl && restToken) {
    return new RedisRestCoordinationStore({ restUrl, restToken });
  }
  return new InMemoryCoordinationStore();
}
