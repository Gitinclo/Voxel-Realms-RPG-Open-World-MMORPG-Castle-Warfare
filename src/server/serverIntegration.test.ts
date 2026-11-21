/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { createVoxelServerRuntime } from './createApp';
import type {
  EconomyAccountRow,
  EconomyLedgerRow,
  PgTransactionalPool,
} from '../db/economyRepository';

async function startEphemeralRuntime(options?: {
  isProduction?: boolean;
  pgPool?: PgTransactionalPool | null;
}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vr-int-test-'));
  const runtime = createVoxelServerRuntime({
    port: 0,
    dataDir,
    enableTickLoop: false,
    pgPool: options?.pgPool ?? null,
    env: {
      NODE_ENV: options?.isProduction ? 'production' : 'test',
      ALLOW_PREVIEW_IFRAME: 'false',
      VOXEL_TRUST_PROXY: 'loopback',
    },
    securityConfig: {
      isProduction: Boolean(options?.isProduction),
      sessionSecret: 'integration-test-session-secret-0123456789abcdef',
      adminPasskey: 'integration-test-admin-passkey-9876543210',
      allowProductionGodMode: false,
      ephemeralSessionSecretGenerated: false,
      ephemeralDevPasskeyGenerated: false,
      failClosedMisconfigured: false,
      misconfigurationReason: null,
    },
  });

  await new Promise<void>((resolve) => {
    runtime.httpServer.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = runtime.httpServer.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  return {
    baseUrl,
    runtime,
    cleanup: async () => {
      await runtime.shutdown();
      fs.rmSync(dataDir, { recursive: true, force: true });
    },
  };
}

function extractSessionCookie(res: Response): string {
  const raw = res.headers.get('set-cookie') || '';
  return raw.split(';')[0] || '';
}

test('Vertical Slice Integration: session -> character sync -> authoritative economy -> export -> DSR delete -> revocation', async () => {
  const { baseUrl, cleanup } = await startEphemeralRuntime({ isProduction: true });
  try {
    // 1. Verify production security headers drop unsafe-eval
    const healthRes = await fetch(`${baseUrl}/healthz`);
    assert.equal(healthRes.status, 200);
    const csp = healthRes.headers.get('content-security-policy') || '';
    assert.equal(csp.includes("'unsafe-eval'"), false);
    assert.equal(healthRes.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(healthRes.headers.get('x-frame-options'), 'SAMEORIGIN');

    // 2. Mint scoped player session
    const loginRes = await fetch(`${baseUrl}/api/auth/player-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commanderId: 'slice-hero-1', displayName: 'Slice Hero' }),
    });
    assert.equal(loginRes.status, 200);
    const cookie = extractSessionCookie(loginRes);
    assert.ok(cookie.startsWith('vr_session='));

    // 3. Sync character profile
    const syncRes = await fetch(`${baseUrl}/api/online/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ commanderName: 'Slice Hero', allianceTag: 'SOL', sector: 'B2' }),
    });
    assert.equal(syncRes.status, 200);
    const syncJson = (await syncRes.json()) as {
      ok: boolean;
      syncedProfile: { commanderName: string };
    };
    assert.equal(syncJson.ok, true);
    assert.equal(syncJson.syncedProfile.commanderName, 'Slice Hero');

    // 4. Server-authoritative gameplay reward claim + idempotency replay
    const claimBody = JSON.stringify({
      idempotencyKey: 'evt-gather-1',
      actionType: 'GATHER_WOOD_NODE',
      entityId: 'wood-node-1',
    });
    const claim1 = await fetch(`${baseUrl}/api/online/economy/claim-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: claimBody,
    });
    assert.equal(claim1.status, 200);
    const claim2 = await fetch(`${baseUrl}/api/online/economy/claim-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: claimBody,
    });
    const claim2Json = (await claim2.json()) as { ok: boolean; replayed: boolean };
    assert.equal(claim2Json.ok, true);
    assert.equal(claim2Json.replayed, true);

    // 5. Server-authoritative castle upgrade & troop purchase
    const upgradeRes = await fetch(`${baseUrl}/api/online/economy/castle-upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ idempotencyKey: 'evt-castle-up-1' }),
    });
    assert.equal(upgradeRes.status, 200);
    const upgradeJson = (await upgradeRes.json()) as { ok: boolean; newLevel: number };
    assert.equal(upgradeJson.newLevel, 2);

    const troopRes = await fetch(`${baseUrl}/api/online/economy/purchase-troops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        idempotencyKey: 'evt-troop-buy-1',
        branch: 'shieldbearers',
        tier: 1,
        quantity: 10,
      }),
    });
    assert.equal(troopRes.status, 200);

    // Locked high tier rejected 403
    const lockedTroopRes = await fetch(`${baseUrl}/api/online/economy/purchase-troops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        idempotencyKey: 'evt-troop-buy-locked',
        branch: 'bombers',
        tier: 15,
        quantity: 5,
      }),
    });
    assert.equal(lockedTroopRes.status, 403);

    // 6. Export PII & Delete Account (DSR)
    const exportRes = await fetch(`${baseUrl}/api/online/account/export`, {
      headers: { Cookie: cookie },
    });
    assert.equal(exportRes.status, 200);
    const exportJson = (await exportRes.json()) as {
      ok: boolean;
      commanderSnapshot: { commanderId: string };
      economyAccount: { castleLevel: number };
    };
    assert.equal(exportJson.commanderSnapshot.commanderId, 'guest-slice-hero-1');
    assert.equal(exportJson.economyAccount.castleLevel, 2);

    const deleteRes = await fetch(`${baseUrl}/api/online/account`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    assert.equal(deleteRes.status, 200);
    const deleteJson = (await deleteRes.json()) as {
      ok: boolean;
      erased: boolean;
      dsrReceiptId: string;
      erasurePipelineStatus: { serverSessionId: string };
    };
    assert.equal(deleteJson.erased, true);
    assert.ok(deleteJson.dsrReceiptId.startsWith('dsr_'));
    assert.equal(deleteJson.erasurePipelineStatus.serverSessionId, 'revoked_in_memory');

    // 7. Replaying deleted cookie MUST fail with 401 due to server-side session revocation
    const replayAfterDelete = await fetch(`${baseUrl}/api/online/economy/balance`, {
      headers: { Cookie: cookie },
    });
    assert.equal(replayAfterDelete.status, 401);
  } finally {
    await cleanup();
  }
});

test('Server-side session revocation rejects replayed cookies immediately after POST /api/auth/logout', async () => {
  const { baseUrl, cleanup } = await startEphemeralRuntime();
  try {
    const loginRes = await fetch(`${baseUrl}/api/auth/player-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commanderId: 'revoke-test-1', displayName: 'Revoke Tester' }),
    });
    const cookie = extractSessionCookie(loginRes);

    const beforeLogout = await fetch(`${baseUrl}/api/auth/session`, {
      headers: { Cookie: cookie },
    });
    const beforeJson = (await beforeLogout.json()) as { authenticated: boolean };
    assert.equal(beforeJson.authenticated, true);

    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: cookie },
    });
    const logoutJson = (await logoutRes.json()) as { ok: boolean; sessionRevoked: boolean };
    assert.equal(logoutJson.sessionRevoked, true);

    const replayBalance = await fetch(`${baseUrl}/api/online/economy/balance`, {
      headers: { Cookie: cookie },
    });
    assert.equal(replayBalance.status, 401);
  } finally {
    await cleanup();
  }
});

test('PostgreSQL ACID economy backend runs BEGIN -> SELECT FOR UPDATE -> INSERT -> UPDATE -> COMMIT via HTTP', async () => {
  const executedSql: string[] = [];
  const accountRows = new Map<string, EconomyAccountRow>();
  const ledgerRows = new Map<string, EconomyLedgerRow[]>();

  const mockPgPool: PgTransactionalPool = {
    async connect() {
      return {
        async query<TRow extends Record<string, unknown>>(text: string, values: unknown[] = []) {
          const sql = text.replace(/\s+/g, ' ').trim();
          executedSql.push(sql);

          if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
            return { rows: [] as TRow[], rowCount: 0 };
          }
          if (sql.startsWith('INSERT INTO economy_accounts')) {
            const cmdrId = String(values[0]);
            if (!accountRows.has(cmdrId)) {
              accountRows.set(cmdrId, {
                commander_id: cmdrId,
                castle_level: Number(values[1]),
                balances_json: JSON.parse(String(values[2])),
                troops_json: JSON.parse(String(values[3])),
                total_tax_collected_wire: String(values[4]),
                last_action_claim_json: JSON.parse(String(values[5])),
                version: Number(values[6]),
                updated_at: String(values[7]),
              });
              ledgerRows.set(cmdrId, []);
            }
            return { rows: [] as TRow[], rowCount: 1 };
          }
          if (sql.includes('FROM economy_accounts')) {
            const row = accountRows.get(String(values[0]));
            return { rows: (row ? [row] : []) as unknown as TRow[], rowCount: row ? 1 : 0 };
          }
          if (sql.includes('FROM economy_ledger_entries')) {
            const rows = ledgerRows.get(String(values[0])) ?? [];
            return { rows: rows as unknown as TRow[], rowCount: rows.length };
          }
          if (sql.startsWith('INSERT INTO economy_ledger_entries')) {
            const cmdrId = String(values[0]);
            const list = ledgerRows.get(cmdrId) ?? [];
            list.push({
              commander_id: cmdrId,
              seq: Number(values[1]),
              tx_id: String(values[2]),
              event_id: String(values[3]),
              idempotency_key: String(values[4]),
              resource: values[5] as EconomyLedgerRow['resource'],
              direction: values[6] as EconomyLedgerRow['direction'],
              amount_wire: String(values[7]),
              balance_after_wire: String(values[8]),
              reason: values[9] as EconomyLedgerRow['reason'],
              prev_hash: String(values[10]),
              entry_hash: String(values[11]),
              created_at_iso: String(values[12]),
            });
            ledgerRows.set(cmdrId, list);
            return { rows: [] as TRow[], rowCount: 1 };
          }
          if (sql.startsWith('UPDATE economy_accounts')) {
            const cmdrId = String(values[0]);
            const existing = accountRows.get(cmdrId);
            if (!existing || existing.version !== Number(values[8])) {
              return { rows: [] as TRow[], rowCount: 0 };
            }
            accountRows.set(cmdrId, {
              commander_id: cmdrId,
              castle_level: Number(values[1]),
              balances_json: JSON.parse(String(values[2])),
              troops_json: JSON.parse(String(values[3])),
              total_tax_collected_wire: String(values[4]),
              last_action_claim_json: JSON.parse(String(values[5])),
              version: Number(values[6]),
              updated_at: String(values[7]),
            });
            return { rows: [] as TRow[], rowCount: 1 };
          }
          return { rows: [] as TRow[], rowCount: 0 };
        },
        release() {},
      };
    },
  };

  const { baseUrl, cleanup } = await startEphemeralRuntime({ pgPool: mockPgPool });
  try {
    const loginRes = await fetch(`${baseUrl}/api/auth/player-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commanderId: 'pg-cmdr-1', displayName: 'PG Sovereign' }),
    });
    const cookie = extractSessionCookie(loginRes);

    const upgradeRes = await fetch(`${baseUrl}/api/online/economy/castle-upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ idempotencyKey: 'pg-castle-up-1' }),
    });
    assert.equal(upgradeRes.status, 200);
    const upgradeJson = (await upgradeRes.json()) as {
      ok: boolean;
      backend: string;
      newLevel: number;
    };
    assert.equal(upgradeJson.backend, 'postgres');
    assert.equal(upgradeJson.newLevel, 2);

    assert.equal(executedSql.includes('BEGIN'), true);
    assert.equal(
      executedSql.some((s) => s.includes('FOR UPDATE')),
      true
    );
    assert.equal(
      executedSql.some((s) => s.startsWith('INSERT INTO economy_ledger_entries')),
      true
    );
    assert.equal(executedSql.includes('COMMIT'), true);
  } finally {
    await cleanup();
  }
});

test('OpenAPI 3.2 contract parity: every path documented in docs/openapi.yaml is mounted on Express', () => {
  const openapiText = fs.readFileSync(path.resolve(process.cwd(), 'docs/openapi.yaml'), 'utf8');
  const documentedPaths = Array.from(openapiText.matchAll(/^ {2}(\/[^\s:]+):$/gm)).map((m) => m[1]);
  assert.ok(documentedPaths.length >= 30, 'Expected at least 30 OpenAPI paths');

  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vr-openapi-test-'));
  const runtime = createVoxelServerRuntime({
    port: 0,
    dataDir,
    enableTickLoop: false,
    securityConfig: {
      isProduction: false,
      sessionSecret: 'openapi-parity-secret-0123456789',
      adminPasskey: 'openapi-parity-passkey',
      allowProductionGodMode: false,
      ephemeralSessionSecretGenerated: false,
      ephemeralDevPasskeyGenerated: false,
      failClosedMisconfigured: false,
      misconfigurationReason: null,
    },
  });

  try {
    const mountedPaths = new Set<string>();
    const routerStack =
      (
        runtime.app as unknown as {
          router?: { stack?: Array<{ route?: { path?: string | string[] } }> };
        }
      ).router?.stack ?? [];
    for (const layer of routerStack) {
      const p = layer.route?.path;
      if (typeof p === 'string') mountedPaths.add(p);
      else if (Array.isArray(p)) p.forEach((item) => mountedPaths.add(item));
    }

    for (const docPath of documentedPaths) {
      assert.equal(
        mountedPaths.has(docPath),
        true,
        `OpenAPI documented route ${docPath} is not mounted on Express`
      );
    }
  } finally {
    void runtime.shutdown();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});
