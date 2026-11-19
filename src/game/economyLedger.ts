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
  | 'QUEST_REWARD'
  | 'MARKET_TRADE'
  | 'MARKET_TAX_FEE'
  | 'TROOP_PURCHASE'
  | 'TROOP_PROMOTION'
  | 'CASTLE_UPGRADE'
  | 'VIP_DIAMOND_COVENANT'
  | 'VIP_DAILY_STIPEND'
  | 'SIEGE_REWARD'
  | 'ADMIN_ADJUSTMENT';

export type TroopBranchKey = 'shieldbearers' | 'shooters' | 'bombers';

export const ALLOWED_TROOP_BRANCHES: readonly TroopBranchKey[] = [
  'shieldbearers',
  'shooters',
  'bombers',
] as const;

export type AuthoritativeGameplayActionType =
  | 'GATHER_WOOD_NODE'
  | 'GATHER_GRAIN_NODE'
  | 'GATHER_STEEL_NODE'
  | 'GATHER_OIL_NODE'
  | 'SLAY_PATROL_MONSTER'
  | 'COMPLETE_QUEST_MILESTONE'
  | 'SIEGE_CHECKPOINT_REWARD'
  | 'CLAIM_VIP_DAILY_STIPEND';

export interface GameplayActionRewardSpec {
  actionType: AuthoritativeGameplayActionType;
  resource: LedgerResourceKey;
  amountWire: string;
  reason: LedgerTxReason;
  cooldownMs: number;
}

/**
 * Server-owned deterministic gameplay reward table.
 * Clients submit ONLY the event/action type; the server derives resource, amount, reason, and cooldown.
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
  GATHER_STEEL_NODE: {
    actionType: 'GATHER_STEEL_NODE',
    resource: 'steel',
    amountWire: '120',
    reason: 'GATHER_REWARD',
    cooldownMs: 5_000,
  },
  GATHER_OIL_NODE: {
    actionType: 'GATHER_OIL_NODE',
    resource: 'oil',
    amountWire: '80',
    reason: 'GATHER_REWARD',
    cooldownMs: 8_000,
  },
  SLAY_PATROL_MONSTER: {
    actionType: 'SLAY_PATROL_MONSTER',
    resource: 'diamonds',
    amountWire: '10',
    reason: 'MONSTER_LOOT',
    cooldownMs: 10_000,
  },
  COMPLETE_QUEST_MILESTONE: {
    actionType: 'COMPLETE_QUEST_MILESTONE',
    resource: 'diamonds',
    amountWire: '25',
    reason: 'QUEST_REWARD',
    cooldownMs: 30_000,
  },
  SIEGE_CHECKPOINT_REWARD: {
    actionType: 'SIEGE_CHECKPOINT_REWARD',
    resource: 'steel',
    amountWire: '250',
    reason: 'SIEGE_REWARD',
    cooldownMs: 15_000,
  },
  CLAIM_VIP_DAILY_STIPEND: {
    actionType: 'CLAIM_VIP_DAILY_STIPEND',
    resource: 'diamonds',
    amountWire: '50',
    reason: 'VIP_DAILY_STIPEND',
    cooldownMs: 24 * 60 * 60 * 1000,
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
  'QUEST_REWARD',
  'MARKET_TRADE',
  'MARKET_TAX_FEE',
  'TROOP_PURCHASE',
  'TROOP_PROMOTION',
  'CASTLE_UPGRADE',
  'VIP_DIAMOND_COVENANT',
  'VIP_DAILY_STIPEND',
  'SIEGE_REWARD',
  'ADMIN_ADJUSTMENT',
] as const;

/**
 * Authoritative base exchange value per 1 unit of each resource (scaled integer weight)
 * used exclusively by the server to price Marketplace conversions.
 */
export const MARKET_RESOURCE_WEIGHT: Record<LedgerResourceKey, bigint> = {
  wood: 1n,
  grain: 1n,
  copper: 2n,
  steel: 3n,
  oil: 4n,
  spiritStones: 10n,
  diamonds: 50n,
};

/** 5.00% Imperial Marketplace tax (500 basis points out of 10,000). */
export const MARKET_TAX_BPS = 500n;
export const BPS_DENOMINATOR = 10_000n;

/** Hard upper cap for any single ledger transaction (including privileged admin adjustments). */
export const MAX_ABSOLUTE_SINGLE_TX = 1_000_000_000_000n;
export const GENESIS_LEDGER_HASH = '0'.repeat(64);
export const MAX_RETAINED_LEDGER_ENTRIES = 500;
export const MAX_AUTHORITATIVE_CASTLE_LEVEL = 100;
export const MAX_SINGLE_TROOP_PURCHASE_QTY = 10_000;

export type AuthoritativeWalletBalances = Record<LedgerResourceKey, string>;

export type AuthoritativeTroopInventory = Record<TroopBranchKey, Record<number, number>>;

export interface EconomyLedgerEntry {
  seq: number;
  txId: string;
  eventId: string;
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
  castleLevel: number;
  balances: AuthoritativeWalletBalances;
  troops: AuthoritativeTroopInventory;
  totalTaxCollectedWire: string;
  ledger: EconomyLedgerEntry[];
  /** Maps idempotencyKey -> txId for deterministic replay protection. */
  idempotencyIndex: Record<string, string>;
  /** Server-tracked last claim timestamp (ms) per gameplay action type to prevent mint spamming. */
  lastActionClaimMs?: Partial<Record<AuthoritativeGameplayActionType, number>>;
  version: number;
  updatedAtIso: string;
}

export interface EconomyTransactionRequest {
  idempotencyKey: string;
  resource: LedgerResourceKey;
  direction: LedgerTxDirection;
  amountWire: string;
  reason: LedgerTxReason;
  eventId?: string;
  isPrivilegedStaff?: boolean;
  /**
   * Internal server-only authorization flag set exclusively by trusted server gameplay handlers
   * (such as claimAuthoritativeGameplayAction or applyAuthoritativeMarketTrade).
   * NEVER read from HTTP request bodies.
   */
  serverAuthorizedCredit?: boolean;
}

export type EconomyErrorCode =
  | 'INVALID_IDEMPOTENCY_KEY'
  | 'INVALID_RESOURCE'
  | 'INVALID_DIRECTION'
  | 'INVALID_REASON'
  | 'INVALID_AMOUNT'
  | 'INVALID_ACTION_TYPE'
  | 'INVALID_EVENT_CONTEXT'
  | 'INVALID_EVENT_TIMESTAMP'
  | 'INVALID_TROOP_REQUEST'
  | 'INVALID_MARKET_PAIR'
  | 'MAX_CASTLE_LEVEL_REACHED'
  | 'TIER_LOCKED_BY_CASTLE_LEVEL'
  | 'CLIENT_PAYLOAD_OVERRIDE_FORBIDDEN'
  | 'CLIENT_SELF_CREDIT_FORBIDDEN'
  | 'ADMIN_REASON_FORBIDDEN'
  | 'INSUFFICIENT_FUNDS'
  | 'ACTION_COOLDOWN_ACTIVE';

export interface EconomyErrorResult {
  ok: false;
  statusCode: 400 | 403 | 409 | 429;
  code: EconomyErrorCode;
  retryAfterSec?: number;
  error: string;
}

export type EconomyTransactionResult =
  | {
      ok: true;
      replayed: boolean;
      entry: EconomyLedgerEntry;
      account: CommanderEconomyAccount;
    }
  | EconomyErrorResult;

export interface CastleUpgradeCost {
  wood: bigint;
  steel: bigint;
  grain: bigint;
}

export type CastleUpgradeResult =
  | {
      ok: true;
      replayed: boolean;
      eventId: string;
      previousLevel: number;
      newLevel: number;
      costs: Record<'wood' | 'steel' | 'grain', string>;
      entries: EconomyLedgerEntry[];
      account: CommanderEconomyAccount;
    }
  | EconomyErrorResult;

export type TroopPurchaseResult =
  | {
      ok: true;
      replayed: boolean;
      eventId: string;
      branch: TroopBranchKey;
      tier: number;
      quantity: number;
      newBranchTierCount: number;
      costs: Record<'wood' | 'grain' | 'steel', string>;
      entries: EconomyLedgerEntry[];
      account: CommanderEconomyAccount;
    }
  | EconomyErrorResult;

export type MarketTradeResult =
  | {
      ok: true;
      replayed: boolean;
      eventId: string;
      fromResource: LedgerResourceKey;
      toResource: LedgerResourceKey;
      inputAmountWire: string;
      grossOutputWire: string;
      taxAmountWire: string;
      netOutputWire: string;
      taxBps: number;
      entries: EconomyLedgerEntry[];
      account: CommanderEconomyAccount;
    }
  | EconomyErrorResult;

export function createInitialEconomyAccount(
  commanderId: string,
  nowIso: string = new Date().toISOString()
): CommanderEconomyAccount {
  return {
    commanderId,
    castleLevel: 1,
    balances: {
      diamonds: '100',
      wood: '5000',
      steel: '3000',
      copper: '2000',
      grain: '5000',
      oil: '1500',
      spiritStones: '250',
    },
    troops: {
      shieldbearers: { 1: 10 },
      shooters: { 1: 10 },
      bombers: { 1: 5 },
    },
    totalTaxCollectedWire: '0',
    ledger: [],
    idempotencyIndex: {},
    lastActionClaimMs: {},
    version: 1,
    updatedAtIso: nowIso,
  };
}

function normalizeAccountDefaults(account: CommanderEconomyAccount): CommanderEconomyAccount {
  return {
    ...account,
    castleLevel:
      typeof account.castleLevel === 'number' && account.castleLevel >= 1 ? account.castleLevel : 1,
    troops: account.troops ?? {
      shieldbearers: {},
      shooters: {},
      bombers: {},
    },
    totalTaxCollectedWire: account.totalTaxCollectedWire ?? '0',
    version: typeof account.version === 'number' && account.version >= 1 ? account.version : 1,
  };
}

export function generateServerEventId(prefix = 'evt'): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

export function computeMaxUnlockedTroopTier(castleLevel: number): number {
  const clamped = Math.max(1, Math.min(MAX_AUTHORITATIVE_CASTLE_LEVEL, Math.floor(castleLevel)));
  return Math.min(20, Math.max(1, Math.floor((clamped - 1) / 5) + 1));
}

export function computeAuthoritativeCastleUpgradeCost(currentLevel: number): CastleUpgradeCost {
  const lvl = BigInt(Math.max(1, Math.floor(currentLevel)));
  return {
    wood: 400n * lvl * lvl,
    steel: 250n * lvl * lvl,
    grain: 300n * lvl * lvl,
  };
}

export function computeAuthoritativeTroopPurchaseCost(
  branch: TroopBranchKey,
  tier: number,
  quantity: number
): { wood: bigint; grain: bigint; steel: bigint } {
  const t = BigInt(Math.max(1, Math.min(20, Math.floor(tier))));
  const qty = BigInt(Math.max(1, Math.floor(quantity)));
  const branchSteelMult = branch === 'bombers' ? 3n : branch === 'shieldbearers' ? 2n : 1n;
  const branchWoodMult = branch === 'shooters' ? 3n : 2n;
  const tierFactor = t * t;
  return {
    wood: 20n * branchWoodMult * tierFactor * qty,
    grain: 25n * tierFactor * qty,
    steel: 15n * branchSteelMult * tierFactor * qty,
  };
}

export function computeLedgerEntryHash(entry: Omit<EconomyLedgerEntry, 'entryHash'>): string {
  const canonical = JSON.stringify({
    seq: entry.seq,
    txId: entry.txId,
    eventId: entry.eventId ?? '',
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

function validateIdempotencyKey(rawKey: unknown): string | null {
  const key = typeof rawKey === 'string' ? rawKey.trim() : '';
  if (key.length < 6 || key.length > 128 || !/^[a-zA-Z0-9:._-]+$/.test(key)) {
    return null;
  }
  return key;
}

export function applyAuthoritativeEconomyTransaction(
  rawAccount: CommanderEconomyAccount,
  req: EconomyTransactionRequest,
  nowIso: string = new Date().toISOString()
): EconomyTransactionResult {
  const account = normalizeAccountDefaults(rawAccount);
  const key = validateIdempotencyKey(req.idempotencyKey);
  if (!key) {
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
  // Credits are granted ONLY by server-validated gameplay/market handlers (serverAuthorizedCredit=true)
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
  const eventId = req.eventId || generateServerEventId('evt');

  const unsignedEntry: Omit<EconomyLedgerEntry, 'entryHash'> = {
    seq,
    txId,
    eventId,
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
    ...account,
    balances: {
      ...account.balances,
      [req.resource]: nextBalance.toString(),
    },
    ledger: trimmedLedger,
    idempotencyIndex: nextIndex,
    lastActionClaimMs: { ...(account.lastActionClaimMs || {}) },
    version: account.version + 1,
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
 * The server enforces per-action cooldowns and derives the exact resource, amount, eventId, and reason.
 */
export function claimAuthoritativeGameplayAction(
  rawAccount: CommanderEconomyAccount,
  req: {
    idempotencyKey: string;
    actionType: AuthoritativeGameplayActionType;
  },
  nowMs: number = Date.now()
): EconomyTransactionResult {
  const account = normalizeAccountDefaults(rawAccount);
  const key = validateIdempotencyKey(req.idempotencyKey);
  if (!key) {
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
      eventId: generateServerEventId('reward'),
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

export const VALID_GAMEPLAY_SECTORS = new Set<string>([
  'A1',
  'A2',
  'A3',
  'A4',
  'B1',
  'B2',
  'B3',
  'B4',
  'C1',
  'C2',
  'C3',
  'C4',
  'D1',
  'D2',
  'D3',
  'D4',
]);

const FORBIDDEN_CLIENT_EVENT_FIELDS = [
  'amount',
  'amountWire',
  'resource',
  'direction',
  'reason',
  'cost',
  'costs',
  'tax',
  'taxAmount',
  'outputAmount',
  'serverAuthorizedCredit',
  'isPrivilegedStaff',
] as const;

export const MAX_EVENT_PAST_SKEW_MS = 5 * 60 * 1000;
export const MAX_EVENT_FUTURE_SKEW_MS = 30 * 1000;

export interface GameplayEventValidationInput {
  idempotencyKey?: unknown;
  eventType?: unknown;
  actionType?: unknown;
  sectorId?: unknown;
  entityId?: unknown;
  occurredAtMs?: unknown;
  [extraKey: string]: unknown;
}

/**
 * Validates an untrusted client gameplay event payload and grants the corresponding
 * server-derived reward via `claimAuthoritativeGameplayAction`.
 *
 * Explicitly rejects any attempt by the client to smuggle ledger mutation fields.
 */
export function validateAndApplyGameplayEvent(
  account: CommanderEconomyAccount,
  rawPayload: GameplayEventValidationInput,
  nowMs: number = Date.now()
): EconomyTransactionResult {
  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_EVENT_CONTEXT',
      error: 'Gameplay event payload must be a JSON object.',
    };
  }

  for (const forbiddenField of FORBIDDEN_CLIENT_EVENT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(rawPayload, forbiddenField)) {
      return {
        ok: false,
        statusCode: 400,
        code: 'CLIENT_PAYLOAD_OVERRIDE_FORBIDDEN',
        error: `Clients cannot supply ledger field "${forbiddenField}" in gameplay events. Rewards are computed exclusively on the server.`,
      };
    }
  }

  if (rawPayload.sectorId !== undefined && rawPayload.sectorId !== null) {
    const sector = typeof rawPayload.sectorId === 'string' ? rawPayload.sectorId.trim() : '';
    if (!VALID_GAMEPLAY_SECTORS.has(sector)) {
      return {
        ok: false,
        statusCode: 400,
        code: 'INVALID_EVENT_CONTEXT',
        error: `Invalid gameplay sectorId: ${String(rawPayload.sectorId)}`,
      };
    }
  }

  if (rawPayload.entityId !== undefined && rawPayload.entityId !== null) {
    const entityId = typeof rawPayload.entityId === 'string' ? rawPayload.entityId.trim() : '';
    if (entityId.length < 2 || entityId.length > 64 || !/^[a-zA-Z0-9:._-]+$/.test(entityId)) {
      return {
        ok: false,
        statusCode: 400,
        code: 'INVALID_EVENT_CONTEXT',
        error: 'entityId must be 2-64 safe identifier characters.',
      };
    }
  }

  if (rawPayload.occurredAtMs !== undefined && rawPayload.occurredAtMs !== null) {
    if (typeof rawPayload.occurredAtMs !== 'number' || !Number.isFinite(rawPayload.occurredAtMs)) {
      return {
        ok: false,
        statusCode: 400,
        code: 'INVALID_EVENT_TIMESTAMP',
        error: 'occurredAtMs must be a finite epoch millisecond timestamp.',
      };
    }
    const skewMs = nowMs - rawPayload.occurredAtMs;
    if (skewMs > MAX_EVENT_PAST_SKEW_MS || skewMs < -MAX_EVENT_FUTURE_SKEW_MS) {
      return {
        ok: false,
        statusCode: 400,
        code: 'INVALID_EVENT_TIMESTAMP',
        error: 'Gameplay event timestamp falls outside the server acceptance window.',
      };
    }
  }

  const resolvedAction = (rawPayload.eventType ??
    rawPayload.actionType) as AuthoritativeGameplayActionType;

  return claimAuthoritativeGameplayAction(
    account,
    {
      idempotencyKey:
        typeof rawPayload.idempotencyKey === 'string' ? rawPayload.idempotencyKey : '',
      actionType: resolvedAction,
    },
    nowMs
  );
}

/**
 * Server-authoritative Castle Upgrade:
 * Derives Wood/Steel/Grain costs strictly from `account.castleLevel`, checks all balances atomically,
 * deducts resources, increments castleLevel, and supports deterministic idempotency replays.
 */
export function applyAuthoritativeCastleUpgrade(
  rawAccount: CommanderEconomyAccount,
  rawPayload: { idempotencyKey?: unknown; [extra: string]: unknown },
  nowIso: string = new Date().toISOString()
): CastleUpgradeResult {
  const account = normalizeAccountDefaults(rawAccount);
  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_EVENT_CONTEXT',
      error: 'Castle upgrade payload must be a JSON object.',
    };
  }
  for (const forbiddenField of FORBIDDEN_CLIENT_EVENT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(rawPayload, forbiddenField)) {
      return {
        ok: false,
        statusCode: 400,
        code: 'CLIENT_PAYLOAD_OVERRIDE_FORBIDDEN',
        error: `Clients cannot supply "${forbiddenField}" for castle upgrades. Upgrade costs are server-derived.`,
      };
    }
  }

  const key = validateIdempotencyKey(rawPayload.idempotencyKey);
  if (!key) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_IDEMPOTENCY_KEY',
      error: 'idempotencyKey must be 6-128 valid characters.',
    };
  }

  const woodKey = `${key}:wood`;
  const steelKey = `${key}:steel`;
  const grainKey = `${key}:grain`;
  if (account.idempotencyIndex[woodKey]) {
    const existingEntries = [woodKey, steelKey, grainKey]
      .map((k) => account.ledger.find((e) => e.txId === account.idempotencyIndex[k]))
      .filter((e): e is EconomyLedgerEntry => Boolean(e));
    if (existingEntries.length === 3) {
      return {
        ok: true,
        replayed: true,
        eventId: existingEntries[0].eventId,
        previousLevel: Math.max(1, account.castleLevel - 1),
        newLevel: account.castleLevel,
        costs: {
          wood: existingEntries[0].amountWire,
          steel: existingEntries[1].amountWire,
          grain: existingEntries[2].amountWire,
        },
        entries: existingEntries,
        account,
      };
    }
  }

  if (account.castleLevel >= MAX_AUTHORITATIVE_CASTLE_LEVEL) {
    return {
      ok: false,
      statusCode: 409,
      code: 'MAX_CASTLE_LEVEL_REACHED',
      error: `Castle has already reached maximum authoritative level ${MAX_AUTHORITATIVE_CASTLE_LEVEL}.`,
    };
  }

  const costs = computeAuthoritativeCastleUpgradeCost(account.castleLevel);
  const availWood = BigInt(account.balances.wood || '0');
  const availSteel = BigInt(account.balances.steel || '0');
  const availGrain = BigInt(account.balances.grain || '0');

  if (availWood < costs.wood || availSteel < costs.steel || availGrain < costs.grain) {
    return {
      ok: false,
      statusCode: 409,
      code: 'INSUFFICIENT_FUNDS',
      error: `Insufficient resources for Castle Lv.${account.castleLevel + 1}: need wood=${costs.wood}, steel=${costs.steel}, grain=${costs.grain}.`,
    };
  }

  const eventId = generateServerEventId('castle');
  const t1 = applyAuthoritativeEconomyTransaction(
    account,
    {
      idempotencyKey: woodKey,
      resource: 'wood',
      direction: 'debit',
      amountWire: costs.wood.toString(),
      reason: 'CASTLE_UPGRADE',
      eventId,
    },
    nowIso
  );
  if (!t1.ok) return t1;

  const t2 = applyAuthoritativeEconomyTransaction(
    t1.account,
    {
      idempotencyKey: steelKey,
      resource: 'steel',
      direction: 'debit',
      amountWire: costs.steel.toString(),
      reason: 'CASTLE_UPGRADE',
      eventId,
    },
    nowIso
  );
  if (!t2.ok) return t2;

  const t3 = applyAuthoritativeEconomyTransaction(
    t2.account,
    {
      idempotencyKey: grainKey,
      resource: 'grain',
      direction: 'debit',
      amountWire: costs.grain.toString(),
      reason: 'CASTLE_UPGRADE',
      eventId,
    },
    nowIso
  );
  if (!t3.ok) return t3;

  const nextLevel = account.castleLevel + 1;
  const finalAccount: CommanderEconomyAccount = {
    ...t3.account,
    castleLevel: nextLevel,
  };

  return {
    ok: true,
    replayed: false,
    eventId,
    previousLevel: account.castleLevel,
    newLevel: nextLevel,
    costs: {
      wood: costs.wood.toString(),
      steel: costs.steel.toString(),
      grain: costs.grain.toString(),
    },
    entries: [t1.entry, t2.entry, t3.entry],
    account: finalAccount,
  };
}

/**
 * Server-authoritative Troop Purchase:
 * Enforces castle-level tier unlock, derives unit costs server-side, checks all balances atomically,
 * deducts resources, and increments server-authoritative garrison counts.
 */
export function applyAuthoritativeTroopPurchase(
  rawAccount: CommanderEconomyAccount,
  rawPayload: {
    idempotencyKey?: unknown;
    branch?: unknown;
    tier?: unknown;
    quantity?: unknown;
    [extra: string]: unknown;
  },
  nowIso: string = new Date().toISOString()
): TroopPurchaseResult {
  const account = normalizeAccountDefaults(rawAccount);
  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_TROOP_REQUEST',
      error: 'Troop purchase payload must be a JSON object.',
    };
  }
  for (const forbiddenField of FORBIDDEN_CLIENT_EVENT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(rawPayload, forbiddenField)) {
      return {
        ok: false,
        statusCode: 400,
        code: 'CLIENT_PAYLOAD_OVERRIDE_FORBIDDEN',
        error: `Clients cannot supply "${forbiddenField}" when purchasing troops. Unit pricing is server-derived.`,
      };
    }
  }

  const key = validateIdempotencyKey(rawPayload.idempotencyKey);
  if (!key) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_IDEMPOTENCY_KEY',
      error: 'idempotencyKey must be 6-128 valid characters.',
    };
  }

  const branch = rawPayload.branch as TroopBranchKey;
  if (!ALLOWED_TROOP_BRANCHES.includes(branch)) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_TROOP_REQUEST',
      error: `Invalid troop branch: ${String(rawPayload.branch)}`,
    };
  }

  const tier = typeof rawPayload.tier === 'number' ? rawPayload.tier : Number.NaN;
  const quantity = typeof rawPayload.quantity === 'number' ? rawPayload.quantity : Number.NaN;
  if (!Number.isInteger(tier) || tier < 1 || tier > 20) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_TROOP_REQUEST',
      error: 'Troop tier must be an integer between 1 and 20.',
    };
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_SINGLE_TROOP_PURCHASE_QTY) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_TROOP_REQUEST',
      error: `Troop quantity must be an integer between 1 and ${MAX_SINGLE_TROOP_PURCHASE_QTY}.`,
    };
  }

  const woodKey = `${key}:wood`;
  const grainKey = `${key}:grain`;
  const steelKey = `${key}:steel`;
  if (account.idempotencyIndex[woodKey]) {
    const existingEntries = [woodKey, grainKey, steelKey]
      .map((k) => account.ledger.find((e) => e.txId === account.idempotencyIndex[k]))
      .filter((e): e is EconomyLedgerEntry => Boolean(e));
    if (existingEntries.length === 3) {
      return {
        ok: true,
        replayed: true,
        eventId: existingEntries[0].eventId,
        branch,
        tier,
        quantity,
        newBranchTierCount: account.troops[branch]?.[tier] ?? 0,
        costs: {
          wood: existingEntries[0].amountWire,
          grain: existingEntries[1].amountWire,
          steel: existingEntries[2].amountWire,
        },
        entries: existingEntries,
        account,
      };
    }
  }

  const maxUnlockedTier = computeMaxUnlockedTroopTier(account.castleLevel);
  if (tier > maxUnlockedTier) {
    return {
      ok: false,
      statusCode: 403,
      code: 'TIER_LOCKED_BY_CASTLE_LEVEL',
      error: `Tier T${tier} requires a higher Castle level (current Castle Lv.${account.castleLevel} unlocks up to T${maxUnlockedTier}).`,
    };
  }

  const costs = computeAuthoritativeTroopPurchaseCost(branch, tier, quantity);
  const availWood = BigInt(account.balances.wood || '0');
  const availGrain = BigInt(account.balances.grain || '0');
  const availSteel = BigInt(account.balances.steel || '0');

  if (availWood < costs.wood || availGrain < costs.grain || availSteel < costs.steel) {
    return {
      ok: false,
      statusCode: 409,
      code: 'INSUFFICIENT_FUNDS',
      error: `Insufficient resources to train ${quantity}x T${tier} ${branch}: need wood=${costs.wood}, grain=${costs.grain}, steel=${costs.steel}.`,
    };
  }

  const eventId = generateServerEventId('troop');
  const t1 = applyAuthoritativeEconomyTransaction(
    account,
    {
      idempotencyKey: woodKey,
      resource: 'wood',
      direction: 'debit',
      amountWire: costs.wood.toString(),
      reason: 'TROOP_PURCHASE',
      eventId,
    },
    nowIso
  );
  if (!t1.ok) return t1;

  const t2 = applyAuthoritativeEconomyTransaction(
    t1.account,
    {
      idempotencyKey: grainKey,
      resource: 'grain',
      direction: 'debit',
      amountWire: costs.grain.toString(),
      reason: 'TROOP_PURCHASE',
      eventId,
    },
    nowIso
  );
  if (!t2.ok) return t2;

  const t3 = applyAuthoritativeEconomyTransaction(
    t2.account,
    {
      idempotencyKey: steelKey,
      resource: 'steel',
      direction: 'debit',
      amountWire: costs.steel.toString(),
      reason: 'TROOP_PURCHASE',
      eventId,
    },
    nowIso
  );
  if (!t3.ok) return t3;

  const prevCount = account.troops[branch]?.[tier] ?? 0;
  const nextCount = prevCount + quantity;
  const nextTroops: AuthoritativeTroopInventory = {
    shieldbearers: { ...(account.troops.shieldbearers || {}) },
    shooters: { ...(account.troops.shooters || {}) },
    bombers: { ...(account.troops.bombers || {}) },
  };
  nextTroops[branch][tier] = nextCount;

  const finalAccount: CommanderEconomyAccount = {
    ...t3.account,
    troops: nextTroops,
  };

  return {
    ok: true,
    replayed: false,
    eventId,
    branch,
    tier,
    quantity,
    newBranchTierCount: nextCount,
    costs: {
      wood: costs.wood.toString(),
      grain: costs.grain.toString(),
      steel: costs.steel.toString(),
    },
    entries: [t1.entry, t2.entry, t3.entry],
    account: finalAccount,
  };
}

/**
 * Server-authoritative Marketplace Trade with Imperial 5% Tax Fee:
 * Client specifies `{ idempotencyKey, fromResource, toResource, inputAmountWire }`.
 * Server computes the exact exchange output, deducts the 5% tax fee, atomically debits input
 * and credits net output, and records tax collected.
 */
export function applyAuthoritativeMarketTrade(
  rawAccount: CommanderEconomyAccount,
  rawPayload: {
    idempotencyKey?: unknown;
    fromResource?: unknown;
    toResource?: unknown;
    inputAmountWire?: unknown;
    [extra: string]: unknown;
  },
  nowIso: string = new Date().toISOString()
): MarketTradeResult {
  const account = normalizeAccountDefaults(rawAccount);
  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_MARKET_PAIR',
      error: 'Market trade payload must be a JSON object.',
    };
  }
  for (const forbiddenField of FORBIDDEN_CLIENT_EVENT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(rawPayload, forbiddenField)) {
      return {
        ok: false,
        statusCode: 400,
        code: 'CLIENT_PAYLOAD_OVERRIDE_FORBIDDEN',
        error: `Clients cannot supply "${forbiddenField}" in marketplace trades. Exchange rates and taxes are server-derived.`,
      };
    }
  }

  const key = validateIdempotencyKey(rawPayload.idempotencyKey);
  if (!key) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_IDEMPOTENCY_KEY',
      error: 'idempotencyKey must be 6-128 valid characters.',
    };
  }

  const fromResource = rawPayload.fromResource as LedgerResourceKey;
  const toResource = rawPayload.toResource as LedgerResourceKey;
  if (
    !ALLOWED_LEDGER_RESOURCES.includes(fromResource) ||
    !ALLOWED_LEDGER_RESOURCES.includes(toResource) ||
    fromResource === toResource
  ) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_MARKET_PAIR',
      error: 'fromResource and toResource must be two distinct supported resources.',
    };
  }

  if (
    typeof rawPayload.inputAmountWire !== 'string' ||
    !/^\d+$/.test(rawPayload.inputAmountWire.trim())
  ) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_AMOUNT',
      error: 'inputAmountWire must be a positive base-10 integer string.',
    };
  }

  const inputAmount = BigInt(rawPayload.inputAmountWire.trim());
  if (inputAmount <= 0n || inputAmount > MAX_ABSOLUTE_SINGLE_TX) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_AMOUNT',
      error: `inputAmountWire must be between 1 and ${MAX_ABSOLUTE_SINGLE_TX.toString()}.`,
    };
  }

  const debitKey = `${key}:debit`;
  const creditKey = `${key}:credit`;
  if (account.idempotencyIndex[debitKey]) {
    const existingDebit = account.ledger.find((e) => e.txId === account.idempotencyIndex[debitKey]);
    const existingCredit = account.ledger.find(
      (e) => e.txId === account.idempotencyIndex[creditKey]
    );
    if (existingDebit && existingCredit) {
      const fromWeight = MARKET_RESOURCE_WEIGHT[fromResource];
      const toWeight = MARKET_RESOURCE_WEIGHT[toResource];
      const grossOutput = (BigInt(existingDebit.amountWire) * fromWeight) / toWeight;
      const netOutput = BigInt(existingCredit.amountWire);
      const taxAmount = grossOutput > netOutput ? grossOutput - netOutput : 0n;
      return {
        ok: true,
        replayed: true,
        eventId: existingDebit.eventId,
        fromResource,
        toResource,
        inputAmountWire: existingDebit.amountWire,
        grossOutputWire: grossOutput.toString(),
        taxAmountWire: taxAmount.toString(),
        netOutputWire: existingCredit.amountWire,
        taxBps: Number(MARKET_TAX_BPS),
        entries: [existingDebit, existingCredit],
        account,
      };
    }
  }

  const fromWeight = MARKET_RESOURCE_WEIGHT[fromResource];
  const toWeight = MARKET_RESOURCE_WEIGHT[toResource];
  const grossOutput = (inputAmount * fromWeight) / toWeight;
  if (grossOutput < 2n) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_AMOUNT',
      error: `Trade input ${inputAmount.toString()} ${fromResource} is too small to yield positive net ${toResource} after 5% market tax.`,
    };
  }

  // Round tax upward to at least 1 unit so small trades cannot evade marketplace taxes
  const rawTax = (grossOutput * MARKET_TAX_BPS) / BPS_DENOMINATOR;
  const taxAmount = rawTax > 0n ? rawTax : 1n;
  const netOutput = grossOutput - taxAmount;
  if (netOutput <= 0n) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INVALID_AMOUNT',
      error: 'Net output after marketplace tax must be at least 1 unit.',
    };
  }

  const availFrom = BigInt(account.balances[fromResource] || '0');
  if (availFrom < inputAmount) {
    return {
      ok: false,
      statusCode: 409,
      code: 'INSUFFICIENT_FUNDS',
      error: `Insufficient ${fromResource}: available=${availFrom.toString()}, required=${inputAmount.toString()}.`,
    };
  }

  const eventId = generateServerEventId('mkt');
  const debitRes = applyAuthoritativeEconomyTransaction(
    account,
    {
      idempotencyKey: debitKey,
      resource: fromResource,
      direction: 'debit',
      amountWire: inputAmount.toString(),
      reason: 'MARKET_TRADE',
      eventId,
    },
    nowIso
  );
  if (!debitRes.ok) return debitRes;

  const creditRes = applyAuthoritativeEconomyTransaction(
    debitRes.account,
    {
      idempotencyKey: creditKey,
      resource: toResource,
      direction: 'credit',
      amountWire: netOutput.toString(),
      reason: 'MARKET_TRADE',
      eventId,
      serverAuthorizedCredit: true,
    },
    nowIso
  );
  if (!creditRes.ok) return creditRes;

  const taxValueInBaseUnits = taxAmount * toWeight;
  const nextTotalTax = BigInt(creditRes.account.totalTaxCollectedWire || '0') + taxValueInBaseUnits;

  const finalAccount: CommanderEconomyAccount = {
    ...creditRes.account,
    totalTaxCollectedWire: nextTotalTax.toString(),
  };

  return {
    ok: true,
    replayed: false,
    eventId,
    fromResource,
    toResource,
    inputAmountWire: inputAmount.toString(),
    grossOutputWire: grossOutput.toString(),
    taxAmountWire: taxAmount.toString(),
    netOutputWire: netOutput.toString(),
    taxBps: Number(MARKET_TAX_BPS),
    entries: [debitRes.entry, creditRes.entry],
    account: finalAccount,
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
