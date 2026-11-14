/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { AtomicRealmPersistence } from './serverPersistence';

interface MockRealmState {
  version: number;
  activeSector: string;
  gold: string;
}

function isMockRealmState(raw: unknown): raw is MockRealmState {
  if (!raw || typeof raw !== 'object') return false;
  const r = raw as Partial<MockRealmState>;
  return (
    typeof r.version === 'number' &&
    typeof r.activeSector === 'string' &&
    typeof r.gold === 'string'
  );
}

test('AtomicRealmPersistence writes SHA-256 envelopes, creates .bak, and recovers from truncated or tampered primary saves', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vr-persist-'));
  try {
    const persistence = new AtomicRealmPersistence<MockRealmState>({
      dataDir: tmpDir,
      fileName: 'realm_state.json',
      validateState: isMockRealmState,
    });

    const v1: MockRealmState = { version: 1, activeSector: 'B2', gold: '1000' };
    const v2: MockRealmState = { version: 2, activeSector: 'C3', gold: '500000' };

    assert.equal(persistence.saveAtomic(v1), true);
    assert.equal(persistence.saveAtomic(v2), true);

    const primaryPath = path.join(tmpDir, 'realm_state.json');
    const backupPath = path.join(tmpDir, 'realm_state.json.bak');
    assert.equal(fs.existsSync(primaryPath), true);
    assert.equal(fs.existsSync(backupPath), true);

    // Simulate mid-write crash truncating primary file
    fs.writeFileSync(primaryPath, '{"schemaVersion":2,"state":{"trunc', 'utf8');

    const recoveredFromTrunc = persistence.loadWithBackupRecovery(() => ({
      version: 0,
      activeSector: 'A1',
      gold: '0',
    }));
    // Must recover prior verified backup (v1) instead of wiping to fresh initial state!
    assert.equal(recoveredFromTrunc.version, 1);
    assert.equal(recoveredFromTrunc.activeSector, 'B2');
    assert.equal(persistence.getHealthMetrics().recoveredFromBackup, true);

    // Write v2 cleanly again, then tamper state without updating SHA-256 checksum
    assert.equal(persistence.saveAtomic(v2), true);
    const envelope = JSON.parse(fs.readFileSync(primaryPath, 'utf8'));
    envelope.state.gold = '999999999999999';
    fs.writeFileSync(primaryPath, JSON.stringify(envelope), 'utf8');

    const persistence2 = new AtomicRealmPersistence<MockRealmState>({
      dataDir: tmpDir,
      fileName: 'realm_state.json',
      validateState: isMockRealmState,
    });
    const recoveredFromTamper = persistence2.loadWithBackupRecovery(() => ({
      version: 0,
      activeSector: 'A1',
      gold: '0',
    }));
    assert.equal(recoveredFromTamper.version, 1);
    assert.equal(recoveredFromTamper.gold, '1000');
    assert.equal(persistence2.getHealthMetrics().recoveredFromBackup, true);
    assert.ok(
      persistence2.getHealthMetrics().recoveryReason?.includes('SHA-256 checksum mismatch')
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('AtomicRealmPersistence upgrades legacy v1 raw JSON snapshots and quarantines unrecoverable corrupt files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vr-persist-legacy-'));
  try {
    const primaryPath = path.join(tmpDir, 'realm_state.json');
    fs.writeFileSync(
      primaryPath,
      JSON.stringify({ version: 7, activeSector: 'B1', gold: '7777' }),
      'utf8'
    );

    const persistence = new AtomicRealmPersistence<MockRealmState>({
      dataDir: tmpDir,
      fileName: 'realm_state.json',
      validateState: isMockRealmState,
    });
    const loaded = persistence.loadWithBackupRecovery(() => ({
      version: 0,
      activeSector: 'A1',
      gold: '0',
    }));
    assert.equal(loaded.version, 7);
    assert.equal(loaded.gold, '7777');

    // Verify upgraded to schemaVersion 2 with SHA-256
    const upgraded = JSON.parse(fs.readFileSync(primaryPath, 'utf8'));
    assert.equal(upgraded.schemaVersion, 2);
    assert.equal(typeof upgraded.checksumSha256, 'string');

    // Now test unrecoverable corruption when neither primary nor .bak is valid
    fs.unlinkSync(path.join(tmpDir, 'realm_state.json.bak'));
    fs.writeFileSync(primaryPath, 'NOT_JSON', 'utf8');
    const fallback = persistence.loadWithBackupRecovery(() => ({
      version: 99,
      activeSector: 'A1',
      gold: '10',
    }));
    assert.equal(fallback.version, 99);
    const files = fs.readdirSync(tmpDir);
    assert.ok(files.some((f) => f.startsWith('realm_state.json.corrupt-')));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
