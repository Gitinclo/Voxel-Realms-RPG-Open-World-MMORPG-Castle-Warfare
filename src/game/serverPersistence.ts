/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface SignedSaveEnvelope<T> {
  schemaVersion: 2;
  savedAtIso: string;
  checksumSha256: string;
  state: T;
}

export interface PersistenceHealthMetrics {
  primaryPath: string;
  backupPath: string;
  totalWrites: number;
  failedWrites: number;
  recoveredFromBackup: boolean;
  recoveryReason: string | null;
  lastWriteDurationMs: number;
  lastFlushAtIso: string | null;
  lastError: string | null;
  writable: boolean;
}

export function computeCanonicalJsonSha256(payload: unknown): string {
  const canonicalJson = JSON.stringify(payload);
  return crypto.createHash('sha256').update(canonicalJson, 'utf8').digest('hex');
}

function isSignedSaveEnvelope<T>(raw: unknown): raw is SignedSaveEnvelope<T> {
  if (!raw || typeof raw !== 'object') return false;
  const candidate = raw as Partial<SignedSaveEnvelope<T>>;
  return (
    candidate.schemaVersion === 2 &&
    typeof candidate.savedAtIso === 'string' &&
    typeof candidate.checksumSha256 === 'string' &&
    candidate.state !== undefined
  );
}

function readAndVerifyFile<T>(
  filePath: string,
  validateState: (state: unknown) => state is T
): { ok: true; state: T; legacyUnverified: boolean } | { ok: false; reason: string } {
  try {
    if (!fs.existsSync(filePath)) {
      return { ok: false, reason: `File does not exist: ${path.basename(filePath)}` };
    }
    const rawText = fs.readFileSync(filePath, 'utf8');
    if (!rawText.trim()) {
      return { ok: false, reason: `File is empty: ${path.basename(filePath)}` };
    }
    const parsed = JSON.parse(rawText) as unknown;

    if (isSignedSaveEnvelope<T>(parsed)) {
      const expectedHash = computeCanonicalJsonSha256(parsed.state);
      const a = Buffer.from(parsed.checksumSha256, 'utf8');
      const b = Buffer.from(expectedHash, 'utf8');
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return {
          ok: false,
          reason: `SHA-256 checksum mismatch in ${path.basename(filePath)}`,
        };
      }
      if (!validateState(parsed.state)) {
        return {
          ok: false,
          reason: `Schema validation failed in ${path.basename(filePath)}`,
        };
      }
      return { ok: true, state: parsed.state, legacyUnverified: false };
    }

    // Legacy v1 raw snapshot migration support
    if (validateState(parsed)) {
      return { ok: true, state: parsed, legacyUnverified: true };
    }

    return {
      ok: false,
      reason: `Unrecognized or corrupt state schema in ${path.basename(filePath)}`,
    };
  } catch (err) {
    return {
      ok: false,
      reason: `Parse/read failure on ${path.basename(filePath)}: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export class AtomicRealmPersistence<T> {
  private readonly dataDir: string;
  private readonly primaryPath: string;
  private readonly backupPath: string;
  private readonly validateState: (state: unknown) => state is T;
  private writeCounter = 0;

  private metrics: PersistenceHealthMetrics;

  constructor(params: {
    dataDir: string;
    fileName?: string;
    validateState: (state: unknown) => state is T;
  }) {
    this.dataDir = path.resolve(params.dataDir);
    const fileName = params.fileName || 'online_realm_state.json';
    this.primaryPath = path.join(this.dataDir, fileName);
    this.backupPath = path.join(this.dataDir, `${fileName}.bak`);
    this.validateState = params.validateState;
    this.metrics = {
      primaryPath: this.primaryPath,
      backupPath: this.backupPath,
      totalWrites: 0,
      failedWrites: 0,
      recoveredFromBackup: false,
      recoveryReason: null,
      lastWriteDurationMs: 0,
      lastFlushAtIso: null,
      lastError: null,
      writable: true,
    };
  }

  public getHealthMetrics(): PersistenceHealthMetrics {
    return { ...this.metrics };
  }

  public loadWithBackupRecovery(createInitialState: () => T): T {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
    } catch (err) {
      this.metrics.writable = false;
      this.metrics.lastError = `Cannot create data dir: ${err instanceof Error ? err.message : String(err)}`;
    }

    const primaryAttempt = readAndVerifyFile(this.primaryPath, this.validateState);
    if (primaryAttempt.ok) {
      if (primaryAttempt.legacyUnverified) {
        // Upgrade legacy snapshot into atomic SHA-256 envelope + backup immediately
        this.saveAtomic(primaryAttempt.state);
      }
      return primaryAttempt.state;
    }

    // Primary missing or corrupted — try verified rolling backup
    const backupAttempt = readAndVerifyFile(this.backupPath, this.validateState);
    if (backupAttempt.ok) {
      this.metrics.recoveredFromBackup = true;
      this.metrics.recoveryReason = primaryAttempt.reason;
      // Restore primary atomically from verified backup
      this.saveAtomic(backupAttempt.state);
      return backupAttempt.state;
    }

    // If primary existed on disk and was corrupted with no valid backup, quarantine corrupt artifact for forensics
    if (fs.existsSync(this.primaryPath)) {
      this.metrics.recoveryReason = `${primaryAttempt.reason}; ${backupAttempt.reason}`;
      try {
        const quarantinePath = `${this.primaryPath}.corrupt-${Date.now()}`;
        fs.renameSync(this.primaryPath, quarantinePath);
      } catch {
        // Ignore quarantine failure on read-only FS
      }
    }

    const fresh = createInitialState();
    this.saveAtomic(fresh);
    return fresh;
  }

  public saveAtomic(state: T, nowIso: string = new Date().toISOString()): boolean {
    const startNs = process.hrtime.bigint();
    this.writeCounter += 1;
    const tempPath = `${this.primaryPath}.tmp-${process.pid}-${this.writeCounter}`;

    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      const envelope: SignedSaveEnvelope<T> = {
        schemaVersion: 2,
        savedAtIso: nowIso,
        checksumSha256: computeCanonicalJsonSha256(state),
        state,
      };
      const serialized = JSON.stringify(envelope);

      // 1. Write full payload to isolated temp file and fsync descriptor before rename
      const fd = fs.openSync(tempPath, 'w', 0o600);
      try {
        fs.writeFileSync(fd, serialized, 'utf8');
        fs.fsyncSync(fd);
      } finally {
        fs.closeSync(fd);
      }

      // 2. Promote current primary to .bak ONLY if primary is currently valid
      if (fs.existsSync(this.primaryPath)) {
        const currentCheck = readAndVerifyFile(this.primaryPath, this.validateState);
        if (currentCheck.ok) {
          fs.copyFileSync(this.primaryPath, this.backupPath);
        }
      }

      // 3. Atomic POSIX rename over primary target
      fs.renameSync(tempPath, this.primaryPath);

      this.metrics.totalWrites += 1;
      this.metrics.writable = true;
      this.metrics.lastError = null;
      this.metrics.lastFlushAtIso = nowIso;
      this.metrics.lastWriteDurationMs =
        Math.round(Number(process.hrtime.bigint() - startNs) / 10_000) / 100;
      return true;
    } catch (err) {
      this.metrics.failedWrites += 1;
      this.metrics.writable = false;
      this.metrics.lastError = err instanceof Error ? err.message : String(err);
      this.metrics.lastWriteDurationMs =
        Math.round(Number(process.hrtime.bigint() - startNs) / 10_000) / 100;
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch {
        // Ignore temp cleanup failure
      }
      return false;
    }
  }
}
