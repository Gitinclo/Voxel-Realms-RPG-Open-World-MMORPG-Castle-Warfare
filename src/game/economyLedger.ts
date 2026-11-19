/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';

export type LedgerResourceKey =
  'diamonds' | 'wood' | 'steel' | 'copper' | 'grain' | 'oil' | 'spiritStones';

export type LedgerTxDirection = 'credit' | 'debit';

export type LedgerTxReason =
  | 'GATHER_REWARD'
  | 'MONSTER_LOOT'
  | 'MARKET_TRADE'
  | 'TROOP_PROMOTION'
  | 'CASTLE_UPGRADE'
  | 'VIP_DIAMOND_COVENANT'
  | 'SIEGE_REWARD'
  | 'ADMIN_ADJUSTMENT';

export const ALLOWED_LEDGER_RESOURCES: readonly LedgerResourceKey[] = [
  'diamonds',
  'wood',
  'steel',
  'copper',
  'grain',
  'oil',
  'spiritStones',
] as const;

export const ALLOWED_LEDGER_REASONS: readonly LedgerTxReason[] = [
  'GATHER_REWARD',
  'MONSTER_LOOT',
  'MARKET_TRADE',
  'TROOP_PROMOTION',
  'CASTLE_UPGRADE',
  'VIP_DIAMOND_COVENANT',
  'SIEGE_REWARD',
  'ADMIN_ADJUSTMENT',
] as const;

/** Hard per-transaction credit cap for regular players to prevent economy inflation exploits. */
export const MAX_PLAYER_SINGLE_TX_CREDIT = 1_000_000n;
/** Hard upper cap for any single ledger transaction (including privileged admin adjustments). */
export const MAX_ABSOLUTE_SINGLE_TX = 1_000_000_000_000n;
export const GENESIS_LEDGER_HASH = '0'.repeat(64);
export const MAX_RETAINED_LEDGER_ENTRIES = 500;

export type AuthoritativeWalletBalances = Record<LedgerResourceKey, string>;

export interface EconomyLedgerEntry {
  seq: number;
  txId: string;
  idempotencyKey: string;
  commanderId: string;
  resource: LedgerResourceKey;
  direction: LedgerTxDirection;
  amountWire: string;
  balanceAfterWire: string;
  reason: LedgerTxReason;
  createdAtIso: string;
  prevHash: string;
  entryHash: string;
}

export interface CommanderEconomyAccount {
  commanderId: string;
  balances: AuthoritativeWalletBalances;
  ledger: EconomyLedgerEntry[];
  /** Maps idempotencyKey -> txId for deterministic replay protection. */
  idempotencyIndex: Record<string, string>;
  updatedAtIso: string;
}

export interface EconomyTransactionRequest {
  idempotencyKey: string;
  resource: LedgerResourceKey;
  direction: LedgerTxDirection;
  amountWire: string;
  reason: LedgerTxReason;
  isPrivilegedStaff?: boolean;
}

export type EconomyTransactionResult =
  | {
      ok: true;
      replayed: boolean;
      entry: EconomyLedgerEntry;
      account: CommanderEconomyAccount;
    }
  | {
      ok: false;
      statusCode: 400 | 403 | 409;
      code:
        | 'INVALID_IDEMPOTENCY_KEY'
        | 'INVALID_RESOURCE'
        | 'INVALID_DIRECTION'
        | 'INVALID_REASON'
        | 'INVALID_AMOUNT'
        | 'CREDIT_LIMIT_EXCEEDED'
        | 'ADMIN_REASON_FORBIDDEN'
        | 'INSUFFICIENT_FUNDS';
      error: string;
    };

export function createInitialEconomyAccount(
  commanderId: string,
  nowIso: string = new Date().toISOString()
): CommanderEconomyAccount {
  return {
    commanderId,
    balances: {
      diamonds: '100',
      wood: '5000',
      steel: '3000',
      copper: '2000',
      grain: '5000',
      oil: '1500',
      spiritStones: '250',
    },
    ledger: [],
    idempotencyIndex: {},
    updatedAtIso: nowIso,
  };
}

export function computeLedgerEntryHash(entry: Omit<EconomyLedgerEntry, 'entryHash'>): string {
  const canonical = JSON.stringify({
    seq: entry.seq,
    txId: entry.txId,
    idempotencyKey: entry.idempotencyKey,
    commanderId: entry.commanderId,
    resource: entry.resource,
    direction: entry.direction,
    amountWire: entry.amountWire,
    balanceAfterWire: entry.balanceAfterWire,
    reason: entry.reason,
    createdAtIso: entry.createdAtIso,
    prevHash: entry.prevHash,
  });
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export function applyAuthoritativeEconomyTransaction(
  account: CommanderEconomyAccount,
  req: EconomyTransactionRequest,
  nowIso: string = new Date().toISOString()
): EconomyTransactionResult {
  const key = typeof req.idempotencyKey === 'string' ? req.idempotencyKey.trim() : '';
  if (key.length < 6 || key.length > 128 || !/^[a-zA-Z0-9:._-]+$/.test(key)) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_IDEMPOTENCY_KEY',
      error:
        'idempotencyKey must be 6-128 characters using only alphanumerics, colons, dots, underscores, or hyphens.',
    };
  }

  // Deterministic idempotency replay check: return original committed entry without re-applying.
  const existingTxId = account.idempotencyIndex[key];
  if (existingTxId) {
    const existingEntry = account.ledger.find((e) => e.txId === existingTxId);
    if (existingEntry) {
      return {
        ok: true,
        replayed: true,
        entry: existingEntry,
        account,
      };
    }
  }

  if (!ALLOWED_LEDGER_RESOURCES.includes(req.resource)) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_RESOURCE',
      error: `Unsupported economy resource: ${String(req.resource)}`,
    };
  }

  if (req.direction !== 'credit' && req.direction !== 'debit') {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_DIRECTION',
      error: 'Transaction direction must be "credit" or "debit".',
    };
  }

  if (!ALLOWED_LEDGER_REASONS.includes(req.reason)) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_REASON',
      error: `Unsupported transaction reason: ${String(req.reason)}`,
    };
  }

  if (req.reason === 'ADMIN_ADJUSTMENT' && !req.isPrivilegedStaff) {
    return {
      ok: false,
      statusCode: 403,
      code: 'ADMIN_REASON_FORBIDDEN',
      error: 'ADMIN_ADJUSTMENT transactions require privileged operator clearance.',
    };
  }

  if (typeof req.amountWire !== 'string' || !/^\d+$/.test(req.amountWire.trim())) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_AMOUNT',
      error: 'amountWire must be a positive base-10 integer string.',
    };
  }

  const amount = BigInt(req.amountWire.trim());
  if (amount <= 0n || amount > MAX_ABSOLUTE_SINGLE_TX) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_AMOUNT',
      error: `Transaction amount must be between 1 and ${MAX_ABSOLUTE_SINGLE_TX.toString()}.`,
    };
  }

  if (
    req.direction === 'credit' &&
    !req.isPrivilegedStaff &&
    amount > MAX_PLAYER_SINGLE_TX_CREDIT
  ) {
    return {
      ok: false,
      statusCode: 403,
      code: 'CREDIT_LIMIT_EXCEEDED',
      error: `Single player credit cannot exceed ${MAX_PLAYER_SINGLE_TX_CREDIT.toString()} units.`,
    };
  }

  const currentBalance = BigInt(account.balances[req.resource] || '0');
  let nextBalance: bigint;
  if (req.direction === 'debit') {
    if (currentBalance < amount) {
      return {
        ok: false,
        statusCode: 409,
        code: 'INSUFFICIENT_FUNDS',
        error: `Insufficient ${req.resource}: available=${currentBalance.toString()}, required=${amount.toString()}.`,
      };
    }
    nextBalance = currentBalance - amount;
  } else {
    nextBalance = currentBalance + amount;
  }

  const lastEntry = account.ledger[account.ledger.length - 1];
  const seq = lastEntry ? lastEntry.seq + 1 : 1;
  const prevHash = lastEntry ? lastEntry.entryHash : GENESIS_LEDGER_HASH;
  const txId = `tx_${seq}_${crypto.randomUUID().slice(0, 8)}`;

  const unsignedEntry: Omit<EconomyLedgerEntry, 'entryHash'> = {
    seq,
    txId,
    idempotencyKey: key,
    commanderId: account.commanderId,
    resource: req.resource,
    direction: req.direction,
    amountWire: amount.toString(),
    balanceAfterWire: nextBalance.toString(),
    reason: req.reason,
    createdAtIso: nowIso,
    prevHash,
  };

  const entry: EconomyLedgerEntry = {
    ...unsignedEntry,
    entryHash: computeLedgerEntryHash(unsignedEntry),
  };

  const nextLedger = [...account.ledger, entry];
  const trimmedLedger =
    nextLedger.length > MAX_RETAINED_LEDGER_ENTRIES
      ? nextLedger.slice(nextLedger.length - MAX_RETAINED_LEDGER_ENTRIES)
      : nextLedger;

  const nextIndex: Record<string, string> = {};
  for (const item of trimmedLedger) {
    nextIndex[item.idempotencyKey] = item.txId;
  }

  const nextAccount: CommanderEconomyAccount = {
    commanderId: account.commanderId,
    balances: {
      ...account.balances,
      [req.resource]: nextBalance.toString(),
    },
    ledger: trimmedLedger,
    idempotencyIndex: nextIndex,
    updatedAtIso: nowIso,
  };

  return {
    ok: true,
    replayed: false,
    entry,
    account: nextAccount,
  };
}

export function verifyEconomyLedgerIntegrity(account: CommanderEconomyAccount): {
  valid: boolean;
  checkedEntries: number;
  brokenAtSeq: number | null;
  reason: string | null;
} {
  let expectedPrevHash: string | null = null;

  for (let i = 0; i < account.ledger.length; i++) {
    const entry = account.ledger[i];
    if (i === 0 && entry.seq === 1 && entry.prevHash !== GENESIS_LEDGER_HASH) {
      return {
        valid: false,
        checkedEntries: i + 1,
        brokenAtSeq: entry.seq,
        reason: 'Genesis entry prevHash does not match GENESIS_LEDGER_HASH.',
      };
    }
    if (expectedPrevHash !== null && entry.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        checkedEntries: i + 1,
        brokenAtSeq: entry.seq,
        reason: `Hash chain mismatch at seq ${entry.seq}.`,
      };
    }
    const { entryHash, ...unsigned } = entry;
    const recomputed = computeLedgerEntryHash(unsigned);
    if (recomputed !== entryHash) {
      return {
        valid: false,
        checkedEntries: i + 1,
        brokenAtSeq: entry.seq,
        reason: `Entry digest tampered at seq ${entry.seq}.`,
      };
    }
    expectedPrevHash = entryHash;
  }

  return {
    valid: true,
    checkedEntries: account.ledger.length,
    brokenAtSeq: null,
    reason: null,
  };
}
