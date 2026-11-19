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

export type AuthoritativeGameplayActionType =
  'GATHER_WOOD_NODE' | 'GATHER_GRAIN_NODE' | 'SLAY_PATROL_MONSTER' | 'SIEGE_CHECKPOINT_REWARD';

export interface GameplayActionRewardSpec {
  actionType: AuthoritativeGameplayActionType;
  resource: LedgerResourceKey;
  amountWire: string;
  reason: LedgerTxReason;
  cooldownMs: number;
}

/**
 * Server-owned deterministic gameplay reward table.
 * Clients submit ONLY the action type; the server derives resource, amount, reason, and cooldown.
 */
export const AUTHORITATIVE_GAMEPLAY_ACTIONS: Record<
  AuthoritativeGameplayActionType,
  GameplayActionRewardSpec
> = {
  GATHER_WOOD_NODE: {
    actionType: 'GATHER_WOOD_NODE',
    resource: 'wood',
    amountWire: '150',
    reason: 'GATHER_REWARD',
    cooldownMs: 5_000,
  },
  GATHER_GRAIN_NODE: {
    actionType: 'GATHER_GRAIN_NODE',
    resource: 'grain',
    amountWire: '150',
    reason: 'GATHER_REWARD',
    cooldownMs: 5_000,
  },
  SLAY_PATROL_MONSTER: {
    actionType: 'SLAY_PATROL_MONSTER',
    resource: 'diamonds',
    amountWire: '10',
    reason: 'MONSTER_LOOT',
    cooldownMs: 10_000,
  },
  SIEGE_CHECKPOINT_REWARD: {
    actionType: 'SIEGE_CHECKPOINT_REWARD',
    resource: 'steel',
    amountWire: '250',
    reason: 'SIEGE_REWARD',
    cooldownMs: 15_000,
  },
};

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
  /** Server-tracked last claim timestamp (ms) per gameplay action type to prevent mint spamming. */
  lastActionClaimMs?: Partial<Record<AuthoritativeGameplayActionType, number>>;
  updatedAtIso: string;
}

export interface EconomyTransactionRequest {
  idempotencyKey: string;
  resource: LedgerResourceKey;
  direction: LedgerTxDirection;
  amountWire: string;
  reason: LedgerTxReason;
  isPrivilegedStaff?: boolean;
  /**
   * Internal server-only authorization flag set exclusively by trusted server gameplay handlers
   * (such as claimAuthoritativeGameplayAction). NEVER read from HTTP request bodies.
   */
  serverAuthorizedCredit?: boolean;
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
      statusCode: 400 | 403 | 409 | 429;
      code:
        | 'INVALID_IDEMPOTENCY_KEY'
        | 'INVALID_RESOURCE'
        | 'INVALID_DIRECTION'
        | 'INVALID_REASON'
        | 'INVALID_AMOUNT'
        | 'INVALID_ACTION_TYPE'
        | 'CLIENT_SELF_CREDIT_FORBIDDEN'
        | 'ADMIN_REASON_FORBIDDEN'
        | 'INSUFFICIENT_FUNDS'
        | 'ACTION_COOLDOWN_ACTIVE';
      retryAfterSec?: number;
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
    lastActionClaimMs: {},
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

  // CRITICAL AUTHORITY GATE:
  // Clients may NEVER directly mint currency/resource credits via arbitrary transactions.
  // Credits are granted ONLY by server-validated gameplay actions (serverAuthorizedCredit=true)
  // or privileged staff ADMIN_ADJUSTMENT operations.
  if (req.direction === 'credit' && !req.serverAuthorizedCredit) {
    const isStaffAdminGrant = Boolean(req.isPrivilegedStaff && req.reason === 'ADMIN_ADJUSTMENT');
    if (!isStaffAdminGrant) {
      return {
        ok: false,
        statusCode: 403,
        code: 'CLIENT_SELF_CREDIT_FORBIDDEN',
        error:
          'Direct client credit transactions are forbidden. Rewards must be granted via server-validated gameplay actions.',
      };
    }
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
    lastActionClaimMs: { ...(account.lastActionClaimMs || {}) },
    updatedAtIso: nowIso,
  };

  return {
    ok: true,
    replayed: false,
    entry,
    account: nextAccount,
  };
}

/**
 * Server-authoritative gameplay reward grant:
 * Client submits ONLY `{ idempotencyKey, actionType }`.
 * The server enforces per-action cooldowns and derives the exact resource, amount, and reason.
 */
export function claimAuthoritativeGameplayAction(
  account: CommanderEconomyAccount,
  req: {
    idempotencyKey: string;
    actionType: AuthoritativeGameplayActionType;
  },
  nowMs: number = Date.now()
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

  const spec =
    AUTHORITATIVE_GAMEPLAY_ACTIONS[req.actionType as AuthoritativeGameplayActionType] ?? null;
  if (!spec) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_ACTION_TYPE',
      error: `Unsupported gameplay action type: ${String(req.actionType)}`,
    };
  }

  // Exact idempotency replay succeeds deterministically without re-checking cooldown or double-crediting.
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

  // Enforce server-side cooldown so players cannot spam fresh idempotency keys to mint infinite rewards.
  const lastClaim = account.lastActionClaimMs?.[spec.actionType] ?? 0;
  const elapsedMs = nowMs - lastClaim;
  if (lastClaim > 0 && elapsedMs < spec.cooldownMs) {
    const retryAfterSec = Math.max(1, Math.ceil((spec.cooldownMs - elapsedMs) / 1000));
    return {
      ok: false,
      statusCode: 429,
      code: 'ACTION_COOLDOWN_ACTIVE',
      retryAfterSec,
      error: `Gameplay action ${spec.actionType} is on server cooldown. Retry after ${retryAfterSec}s.`,
    };
  }

  const txResult = applyAuthoritativeEconomyTransaction(
    account,
    {
      idempotencyKey: key,
      resource: spec.resource,
      direction: 'credit',
      amountWire: spec.amountWire,
      reason: spec.reason,
      serverAuthorizedCredit: true,
    },
    new Date(nowMs).toISOString()
  );

  if (!txResult.ok) {
    return txResult;
  }

  return {
    ...txResult,
    account: {
      ...txResult.account,
      lastActionClaimMs: {
        ...(txResult.account.lastActionClaimMs || {}),
        [spec.actionType]: nowMs,
      },
    },
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
