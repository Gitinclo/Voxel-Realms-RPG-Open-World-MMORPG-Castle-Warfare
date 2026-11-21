/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CommanderEconomyAccount,
  EconomyLedgerEntry,
  createInitialEconomyAccount,
} from '../game/economyLedger';
import {
  EconomyAccountRow,
  EconomyLedgerRow,
  PgTransactionalPool,
  TransactionalMutationOutcome,
  executeEconomyMutationWithPgLock,
  hydrateEconomyAccountFromPgRows,
} from '../db/economyRepository';
import type { PersistedMultiRegionStore } from './types';

export interface AuthoritativeEconomyService {
  readonly backendKind: 'postgres' | 'disk';
  getAccount(commanderId: string): Promise<CommanderEconomyAccount>;
  mutateAccount<TResult>(params: {
    commanderId: string;
    mutate: (account: CommanderEconomyAccount) => TransactionalMutationOutcome<TResult>;
  }): Promise<{ result: TResult; committed: boolean; backend: 'postgres' | 'disk' }>;
}

/**
 * Creates a unified authoritative economy service backed by PostgreSQL ACID transactions
 * (`SELECT ... FOR UPDATE` + optimistic version check) when a PostgreSQL pool is provided,
 * or single-instance atomic disk persistence when running without PostgreSQL.
 */
export function createAuthoritativeEconomyService(options: {
  store: PersistedMultiRegionStore;
  persistStoreToDisk: (targetStore: PersistedMultiRegionStore) => void;
  pgPool?: PgTransactionalPool | null;
}): AuthoritativeEconomyService {
  const getOrCreateDiskAccount = (commanderId: string): CommanderEconomyAccount => {
    if (!options.store.economyAccounts) {
      options.store.economyAccounts = {};
    }
    if (!options.store.economyAccounts[commanderId]) {
      options.store.economyAccounts[commanderId] = createInitialEconomyAccount(commanderId);
    }
    return options.store.economyAccounts[commanderId];
  };

  if (options.pgPool) {
    const pool = options.pgPool;
    return {
      backendKind: 'postgres',

      async getAccount(commanderId: string): Promise<CommanderEconomyAccount> {
        const client = await pool.connect();
        try {
          const initial = createInitialEconomyAccount(commanderId);
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

          const accountRes = await client.query<EconomyAccountRow>(
            `SELECT commander_id, castle_level, balances_json, troops_json,
                    total_tax_collected_wire, last_action_claim_json, version, updated_at
               FROM economy_accounts
              WHERE commander_id = $1`,
            [commanderId]
          );
          if (accountRes.rows.length === 0) {
            return initial;
          }
          const ledgerRes = await client.query<EconomyLedgerRow>(
            `SELECT seq, tx_id, event_id, idempotency_key, commander_id, resource, direction,
                    amount_wire, balance_after_wire, reason, prev_hash, entry_hash, created_at_iso
               FROM economy_ledger_entries
              WHERE commander_id = $1
              ORDER BY seq ASC`,
            [commanderId]
          );
          return hydrateEconomyAccountFromPgRows(accountRes.rows[0], ledgerRes.rows);
        } finally {
          client.release?.();
        }
      },

      async mutateAccount<TResult>(params: {
        commanderId: string;
        mutate: (account: CommanderEconomyAccount) => TransactionalMutationOutcome<TResult>;
      }): Promise<{ result: TResult; committed: boolean; backend: 'postgres' | 'disk' }> {
        const tx = await executeEconomyMutationWithPgLock<TResult>({
          pool,
          commanderId: params.commanderId,
          mutate: params.mutate,
        });
        return {
          result: tx.result,
          committed: tx.committed,
          backend: 'postgres',
        };
      },
    };
  }

  return {
    backendKind: 'disk',

    async getAccount(commanderId: string): Promise<CommanderEconomyAccount> {
      return getOrCreateDiskAccount(commanderId);
    },

    async mutateAccount<TResult>(params: {
      commanderId: string;
      mutate: (account: CommanderEconomyAccount) => TransactionalMutationOutcome<TResult>;
    }): Promise<{ result: TResult; committed: boolean; backend: 'postgres' | 'disk' }> {
      const current = getOrCreateDiskAccount(params.commanderId);
      const outcome = params.mutate(current);
      if (outcome.ok && !outcome.replayed && outcome.account) {
        options.store.economyAccounts![params.commanderId] = outcome.account;
        options.persistStoreToDisk(options.store);
        return { result: outcome.result, committed: true, backend: 'disk' };
      }
      return { result: outcome.result, committed: false, backend: 'disk' };
    },
  };
}

export function extractNewLedgerEntries(
  previousCount: number,
  updatedAccount: CommanderEconomyAccount
): EconomyLedgerEntry[] {
  return updatedAccount.ledger.slice(Math.max(0, previousCount));
}
