/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyAuthoritativeCastleUpgrade,
  applyAuthoritativeMarketTrade,
  applyAuthoritativeTroopPurchase,
  verifyEconomyLedgerIntegrity,
} from '../game/economyLedger';
import {
  EconomyAccountRow,
  EconomyLedgerRow,
  OptimisticConcurrencyError,
  PgQueryableClient,
  PgTransactionalPool,
  executeEconomyMutationWithPgLock,
} from './economyRepository';

interface InMemoryPgState {
  accounts: Map<string, EconomyAccountRow>;
  ledger: EconomyLedgerRow[];
  failNextUpdateCount: number;
  sqlLog: string[];
}

function createMockPgPool(state: InMemoryPgState): PgTransactionalPool {
  return {
    async connect(): Promise<PgQueryableClient> {
      let txAccounts = new Map(state.accounts);
      let txLedger = [...state.ledger];
      let inTx = false;

      return {
        async query<TRow extends Record<string, unknown> = Record<string, unknown>>(
          sql: string,
          values: unknown[] = []
        ): Promise<{ rows: TRow[]; rowCount: number | null }> {
          const normalized = sql.replace(/\s+/g, ' ').trim();
          state.sqlLog.push(normalized);

          if (normalized === 'BEGIN') {
            inTx = true;
            txAccounts = new Map(state.accounts);
            txLedger = [...state.ledger];
            return { rows: [], rowCount: 0 };
          }
          if (normalized === 'COMMIT') {
            if (inTx) {
              state.accounts = txAccounts;
              state.ledger = txLedger;
              inTx = false;
            }
            return { rows: [], rowCount: 0 };
          }
          if (normalized === 'ROLLBACK') {
            inTx = false;
            txAccounts = new Map(state.accounts);
            txLedger = [...state.ledger];
            return { rows: [], rowCount: 0 };
          }

          if (normalized.startsWith('INSERT INTO economy_accounts')) {
            const commanderId = String(values[0]);
            if (!txAccounts.has(commanderId)) {
              txAccounts.set(commanderId, {
                commander_id: commanderId,
                castle_level: Number(values[1]),
                balances_json: JSON.parse(String(values[2])),
                troops_json: JSON.parse(String(values[3])),
                total_tax_collected_wire: String(values[4]),
                last_action_claim_json: JSON.parse(String(values[5])),
                version: Number(values[6]),
                updated_at: String(values[7]),
              });
              return { rows: [], rowCount: 1 };
            }
            return { rows: [], rowCount: 0 };
          }

          if (normalized.includes('FROM economy_accounts') && normalized.includes('FOR UPDATE')) {
            const commanderId = String(values[0]);
            const row = txAccounts.get(commanderId);
            return {
              rows: row ? ([structuredClone(row)] as unknown as TRow[]) : [],
              rowCount: row ? 1 : 0,
            };
          }

          if (normalized.includes('FROM economy_ledger_entries')) {
            const commanderId = String(values[0]);
            const rows = txLedger
              .filter((r) => r.commander_id === commanderId)
              .sort((a, b) => a.seq - b.seq);
            return {
              rows: structuredClone(rows) as unknown as TRow[],
              rowCount: rows.length,
            };
          }

          if (normalized.startsWith('INSERT INTO economy_ledger_entries')) {
            const commanderId = String(values[0]);
            const idempotencyKey = String(values[4]);
            const exists = txLedger.some(
              (r) => r.commander_id === commanderId && r.idempotency_key === idempotencyKey
            );
            if (exists) {
              return { rows: [], rowCount: 0 };
            }
            txLedger.push({
              commander_id: commanderId,
              seq: Number(values[1]),
              tx_id: String(values[2]),
              event_id: String(values[3]),
              idempotency_key: idempotencyKey,
              resource: String(values[5]) as EconomyLedgerRow['resource'],
              direction: String(values[6]) as EconomyLedgerRow['direction'],
              amount_wire: String(values[7]),
              balance_after_wire: String(values[8]),
              reason: String(values[9]) as EconomyLedgerRow['reason'],
              prev_hash: String(values[10]),
              entry_hash: String(values[11]),
              created_at_iso: String(values[12]),
            });
            return { rows: [], rowCount: 1 };
          }

          if (normalized.startsWith('UPDATE economy_accounts')) {
            const commanderId = String(values[0]);
            const expectedVersion = Number(values[8]);
            if (state.failNextUpdateCount > 0) {
              state.failNextUpdateCount -= 1;
              return { rows: [], rowCount: 0 };
            }
            const existing = txAccounts.get(commanderId);
            if (!existing || existing.version !== expectedVersion) {
              return { rows: [], rowCount: 0 };
            }
            txAccounts.set(commanderId, {
              commander_id: commanderId,
              castle_level: Number(values[1]),
              balances_json: JSON.parse(String(values[2])),
              troops_json: JSON.parse(String(values[3])),
              total_tax_collected_wire: String(values[4]),
              last_action_claim_json: JSON.parse(String(values[5])),
              version: Number(values[6]),
              updated_at: String(values[7]),
            });
            return { rows: [], rowCount: 1 };
          }

          throw new Error(`Unhandled SQL in mock pool: ${normalized}`);
        },
        release() {
          // no-op
        },
      };
    },
  };
}

test('executeEconomyMutationWithPgLock commits ACID castle upgrade, market trade & idempotent replay', async () => {
  const state: InMemoryPgState = {
    accounts: new Map(),
    ledger: [],
    failNextUpdateCount: 0,
    sqlLog: [],
  };
  const pool = createMockPgPool(state);

  // 1. Atomic Castle Upgrade (Lv.1 -> Lv.2)
  const upgradeRun = await executeEconomyMutationWithPgLock({
    pool,
    commanderId: 'pg-cmdr-01',
    mutate: (acc) => {
      const res = applyAuthoritativeCastleUpgrade(acc, { idempotencyKey: 'pg-castle-up-1' });
      return {
        ok: res.ok,
        replayed: res.ok ? res.replayed : false,
        account: res.ok ? res.account : undefined,
        newEntries: res.ok ? res.entries : undefined,
        result: res,
      };
    },
  });

  assert.equal(upgradeRun.committed, true);
  assert.equal(upgradeRun.attempts, 1);
  assert.equal(upgradeRun.result.ok, true);
  if (upgradeRun.result.ok) {
    assert.equal(upgradeRun.result.newLevel, 2);
    assert.equal(verifyEconomyLedgerIntegrity(upgradeRun.result.account).valid, true);
  }
  assert.ok(state.sqlLog.some((q) => q.includes('FOR UPDATE')));
  assert.equal(state.ledger.length, 3);

  // 2. Exact replay does NOT write duplicate rows and rolls back read-only txn cleanly
  const replayRun = await executeEconomyMutationWithPgLock({
    pool,
    commanderId: 'pg-cmdr-01',
    mutate: (acc) => {
      const res = applyAuthoritativeCastleUpgrade(acc, { idempotencyKey: 'pg-castle-up-1' });
      return {
        ok: res.ok,
        replayed: res.ok ? res.replayed : false,
        account: res.ok ? res.account : undefined,
        newEntries: res.ok ? res.entries : undefined,
        result: res,
      };
    },
  });
  assert.equal(replayRun.committed, false);
  assert.equal(replayRun.result.ok, true);
  if (replayRun.result.ok) {
    assert.equal(replayRun.result.replayed, true);
  }
  assert.equal(state.ledger.length, 3);

  // 3. Marketplace trade with 5% tax commits atomically on top of existing hash chain
  const marketRun = await executeEconomyMutationWithPgLock({
    pool,
    commanderId: 'pg-cmdr-01',
    mutate: (acc) => {
      const res = applyAuthoritativeMarketTrade(acc, {
        idempotencyKey: 'pg-mkt-01',
        fromResource: 'wood',
        toResource: 'grain',
        inputAmountWire: '1000',
      });
      return {
        ok: res.ok,
        replayed: res.ok ? res.replayed : false,
        account: res.ok ? res.account : undefined,
        newEntries: res.ok ? res.entries : undefined,
        result: res,
      };
    },
  });
  assert.equal(marketRun.committed, true);
  assert.equal(marketRun.result.ok, true);
  if (marketRun.result.ok) {
    assert.equal(marketRun.result.taxAmountWire, '50');
    assert.equal(marketRun.result.netOutputWire, '950');
    assert.equal(verifyEconomyLedgerIntegrity(marketRun.result.account).valid, true);
  }
  assert.equal(state.ledger.length, 5);
});

test('executeEconomyMutationWithPgLock rolls back rejected mutations and retries optimistic version conflicts', async () => {
  const state: InMemoryPgState = {
    accounts: new Map(),
    ledger: [],
    failNextUpdateCount: 0,
    sqlLog: [],
  };
  const pool = createMockPgPool(state);

  // Rejected tier-locked troop purchase must roll back without creating ledger rows
  const rejected = await executeEconomyMutationWithPgLock({
    pool,
    commanderId: 'pg-cmdr-02',
    mutate: (acc) => {
      const res = applyAuthoritativeTroopPurchase(acc, {
        idempotencyKey: 'pg-locked-t5',
        branch: 'bombers',
        tier: 5,
        quantity: 2,
      });
      return {
        ok: res.ok,
        replayed: false,
        result: res,
      };
    },
  });
  assert.equal(rejected.committed, false);
  assert.equal(rejected.result.ok, false);
  if (!rejected.result.ok) {
    assert.equal(rejected.result.code, 'TIER_LOCKED_BY_CASTLE_LEVEL');
  }
  assert.equal(state.ledger.length, 0);

  // Simulate 1 transient optimistic concurrency conflict -> succeeds on attempt 2
  state.failNextUpdateCount = 1;
  const retried = await executeEconomyMutationWithPgLock({
    pool,
    commanderId: 'pg-cmdr-02',
    maxRetries: 3,
    mutate: (acc) => {
      const res = applyAuthoritativeTroopPurchase(acc, {
        idempotencyKey: 'pg-valid-t1',
        branch: 'shieldbearers',
        tier: 1,
        quantity: 3,
      });
      return {
        ok: res.ok,
        replayed: res.ok ? res.replayed : false,
        account: res.ok ? res.account : undefined,
        newEntries: res.ok ? res.entries : undefined,
        result: res,
      };
    },
  });
  assert.equal(retried.committed, true);
  assert.equal(retried.attempts, 2);
  assert.equal(retried.result.ok, true);
  assert.equal(state.ledger.length, 3);

  // Exhausting all retries throws typed OptimisticConcurrencyError
  state.failNextUpdateCount = 5;
  await assert.rejects(
    executeEconomyMutationWithPgLock({
      pool,
      commanderId: 'pg-cmdr-02',
      maxRetries: 2,
      mutate: (acc) => {
        const res = applyAuthoritativeCastleUpgrade(acc, { idempotencyKey: 'pg-conflict-fail' });
        return {
          ok: res.ok,
          replayed: res.ok ? res.replayed : false,
          account: res.ok ? res.account : undefined,
          newEntries: res.ok ? res.entries : undefined,
          result: res,
        };
      },
    }),
    OptimisticConcurrencyError
  );
  assert.equal(
    state.ledger.length,
    3,
    'Aborted conflicting write must not leak partial ledger rows'
  );
});
