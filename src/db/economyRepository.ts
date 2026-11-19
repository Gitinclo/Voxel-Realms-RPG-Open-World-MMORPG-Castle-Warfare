/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CommanderEconomyAccount,
  EconomyLedgerEntry,
  createInitialEconomyAccount,
} from '../game/economyLedger';

/**
 * Minimal PostgreSQL client/pool contract compatible with `pg.Pool` / `pg.PoolClient`
 * so transactional locking (`BEGIN ... SELECT ... FOR UPDATE ... COMMIT`) and optimistic
 * concurrency retries can be verified deterministically in unit tests without needing a live DB.
 */
export interface PgQueryableClient {
  query<TRow extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: unknown[]
  ): Promise<{ rows: TRow[]; rowCount: number | null }>;
  release?: () => void;
}

export interface PgTransactionalPool {
  connect(): Promise<PgQueryableClient>;
}

export interface EconomyAccountRow extends Record<string, unknown> {
  commander_id: string;
  castle_level: number;
  balances_json: CommanderEconomyAccount['balances'];
  troops_json: CommanderEconomyAccount['troops'];
  total_tax_collected_wire: string;
  last_action_claim_json: CommanderEconomyAccount['lastActionClaimMs'];
  version: number;
  updated_at: string | Date;
}

export interface EconomyLedgerRow extends Record<string, unknown> {
  seq: number;
  tx_id: string;
  event_id: string;
  idempotency_key: string;
  commander_id: string;
  resource: EconomyLedgerEntry['resource'];
  direction: EconomyLedgerEntry['direction'];
  amount_wire: string;
  balance_after_wire: string;
  reason: EconomyLedgerEntry['reason'];
  prev_hash: string;
  entry_hash: string;
  created_at_iso: string;
}

export interface TransactionalMutationOutcome<TResult> {
  ok: boolean;
  replayed?: boolean;
  account?: CommanderEconomyAccount;
  newEntries?: EconomyLedgerEntry[];
  result: TResult;
}

export class OptimisticConcurrencyError extends Error {
  public readonly commanderId: string;
  public readonly expectedVersion: number;

  constructor(commanderId: string, expectedVersion: number) {
    super(
      `Optimistic concurrency conflict updating economy_accounts for ${commanderId} at version ${expectedVersion}.`
    );
    this.name = 'OptimisticConcurrencyError';
    this.commanderId = commanderId;
    this.expectedVersion = expectedVersion;
  }
}

export function hydrateEconomyAccountFromPgRows(
  accountRow: EconomyAccountRow,
  ledgerRows: EconomyLedgerRow[]
): CommanderEconomyAccount {
  const ledger: EconomyLedgerEntry[] = ledgerRows
    .slice()
    .sort((a, b) => a.seq - b.seq)
    .map((row) => ({
      seq: row.seq,
      txId: row.tx_id,
      eventId: row.event_id,
      idempotencyKey: row.idempotency_key,
      commanderId: row.commander_id,
      resource: row.resource,
      direction: row.direction,
      amountWire: row.amount_wire,
      balanceAfterWire: row.balance_after_wire,
      reason: row.reason,
      createdAtIso: row.created_at_iso,
      prevHash: row.prev_hash,
      entryHash: row.entry_hash,
    }));

  const idempotencyIndex: Record<string, string> = {};
  for (const entry of ledger) {
    idempotencyIndex[entry.idempotencyKey] = entry.txId;
  }

  const updatedAtIso =
    accountRow.updated_at instanceof Date
      ? accountRow.updated_at.toISOString()
      : String(accountRow.updated_at || new Date().toISOString());

  return {
    commanderId: accountRow.commander_id,
    castleLevel: accountRow.castle_level,
    balances: accountRow.balances_json,
    troops: accountRow.troops_json,
    totalTaxCollectedWire: accountRow.total_tax_collected_wire,
    ledger,
    idempotencyIndex,
    lastActionClaimMs: accountRow.last_action_claim_json ?? {},
    version: accountRow.version,
    updatedAtIso,
  };
}

/**
 * Executes a pure server-authoritative economy mutation inside a PostgreSQL ACID transaction:
 * 1. `BEGIN`
 * 2. Upsert initial account row if absent (`ON CONFLICT DO NOTHING`)
 * 3. Acquire row-level lock via `SELECT ... FROM economy_accounts WHERE commander_id = $1 FOR UPDATE`
 * 4. Hydrate recent hash-chained ledger entries & run pure mutation callback
 * 5. On rejection or idempotent replay, `ROLLBACK` (no writes) and return deterministic result
 * 6. On new mutation, insert ledger entries (`ON CONFLICT (commander_id, idempotency_key) DO NOTHING`)
 *    and update `economy_accounts` guarded by `WHERE commander_id = $1 AND version = $expectedVersion`
 * 7. `COMMIT` (or retry cleanly up to `maxRetries` on optimistic concurrency conflict)
 */
export async function executeEconomyMutationWithPgLock<TResult>(params: {
  pool: PgTransactionalPool;
  commanderId: string;
  maxRetries?: number;
  mutate: (account: CommanderEconomyAccount) => TransactionalMutationOutcome<TResult>;
}): Promise<{ result: TResult; attempts: number; committed: boolean }> {
  const maxRetries = Math.max(1, params.maxRetries ?? 3);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const client = await params.pool.connect();
    try {
      await client.query('BEGIN');

      const initial = createInitialEconomyAccount(params.commanderId);
      await client.query(
        `INSERT INTO economy_accounts (
          commander_id, castle_level, balances_json, troops_json,
          total_tax_collected_wire, last_action_claim_json, version, updated_at
        ) VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6::jsonb, $7, $8)
        ON CONFLICT (commander_id) DO NOTHING`,
        [
          initial.commanderId,
          initial.castleLevel,
          JSON.stringify(initial.balances),
          JSON.stringify(initial.troops),
          initial.totalTaxCollectedWire,
          JSON.stringify(initial.lastActionClaimMs ?? {}),
          initial.version,
          initial.updatedAtIso,
        ]
      );

      const lockedRes = await client.query<EconomyAccountRow>(
        `SELECT commander_id, castle_level, balances_json, troops_json,
                total_tax_collected_wire, last_action_claim_json, version, updated_at
           FROM economy_accounts
          WHERE commander_id = $1
          FOR UPDATE`,
        [params.commanderId]
      );

      if (lockedRes.rows.length === 0) {
        throw new Error(`Failed to lock economy account row for ${params.commanderId}`);
      }
      const lockedRow = lockedRes.rows[0];
      const expectedVersion = lockedRow.version;

      const ledgerRes = await client.query<EconomyLedgerRow>(
        `SELECT seq, tx_id, event_id, idempotency_key, commander_id, resource, direction,
                amount_wire, balance_after_wire, reason, prev_hash, entry_hash, created_at_iso
           FROM economy_ledger_entries
          WHERE commander_id = $1
          ORDER BY seq ASC`,
        [params.commanderId]
      );

      const currentAccount = hydrateEconomyAccountFromPgRows(lockedRow, ledgerRes.rows);
      const outcome = params.mutate(currentAccount);

      if (!outcome.ok || outcome.replayed || !outcome.account) {
        await client.query('ROLLBACK');
        return {
          result: outcome.result,
          attempts: attempt,
          committed: false,
        };
      }

      const entriesToInsert = outcome.newEntries ?? [];
      for (const entry of entriesToInsert) {
        await client.query(
          `INSERT INTO economy_ledger_entries (
            commander_id, seq, tx_id, event_id, idempotency_key,
            resource, direction, amount_wire, balance_after_wire,
            reason, prev_hash, entry_hash, created_at_iso
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (commander_id, idempotency_key) DO NOTHING`,
          [
            entry.commanderId,
            entry.seq,
            entry.txId,
            entry.eventId,
            entry.idempotencyKey,
            entry.resource,
            entry.direction,
            entry.amountWire,
            entry.balanceAfterWire,
            entry.reason,
            entry.prevHash,
            entry.entryHash,
            entry.createdAtIso,
          ]
        );
      }

      const updateRes = await client.query(
        `UPDATE economy_accounts
            SET castle_level = $2,
                balances_json = $3::jsonb,
                troops_json = $4::jsonb,
                total_tax_collected_wire = $5,
                last_action_claim_json = $6::jsonb,
                version = $7,
                updated_at = $8
          WHERE commander_id = $1 AND version = $9`,
        [
          outcome.account.commanderId,
          outcome.account.castleLevel,
          JSON.stringify(outcome.account.balances),
          JSON.stringify(outcome.account.troops),
          outcome.account.totalTaxCollectedWire,
          JSON.stringify(outcome.account.lastActionClaimMs ?? {}),
          outcome.account.version,
          outcome.account.updatedAtIso,
          expectedVersion,
        ]
      );

      if ((updateRes.rowCount ?? 0) === 0) {
        await client.query('ROLLBACK');
        if (attempt < maxRetries) {
          continue;
        }
        throw new OptimisticConcurrencyError(params.commanderId, expectedVersion);
      }

      await client.query('COMMIT');
      return {
        result: outcome.result,
        attempts: attempt,
        committed: true,
      };
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Ignore secondary rollback failure on broken socket
      }
      throw err;
    } finally {
      client.release?.();
    }
  }

  throw new OptimisticConcurrencyError(params.commanderId, -1);
}
