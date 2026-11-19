/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameResources, PlayerTroopRoster, ResourceType, TroopType } from '../types/game';
import { getTroopTierInfo } from './math';

export interface TroopTrainingDurationEstimate {
  durationMs: number;
  baseDurationMs: number;
  speedBonusPct: number;
  cadenceLabel: string;
}

export interface TroopTrainingJob {
  id: string;
  type: TroopType;
  tier: number;
  unitName: string;
  amount: bigint;
  costPaid: Partial<GameResources>;
  startedAtMs: number;
  durationMs: number;
  acceleratedMs: number;
}

export interface TroopTrainingEvaluation {
  elapsedMs: number;
  remainingMs: number;
  progressRatio: number;
  progressPct: number;
  trainedSoFar: bigint;
  isComplete: boolean;
  formattedRemaining: string;
}

export interface PromotableTroopEntry {
  type: TroopType;
  tier: number;
  rosterKey: string;
  name: string;
  ownedCount: bigint;
  powerPerUnit: bigint;
}

export interface TroopPromotionStatDeltas {
  attackPerUnit: bigint;
  defensePerUnit: bigint;
  hpPerUnit: bigint;
  powerPerUnit: bigint;
  totalPowerGain: bigint;
}

export interface TroopPromotionQuote {
  valid: boolean;
  error?: string;
  type: TroopType;
  sourceTier: number;
  targetTier: number;
  sourceName: string;
  targetName: string;
  amount: bigint;
  ownedSourceCount: bigint;
  unitCostDelta: GameResources;
  totalCost: GameResources;
  canAfford: boolean;
  missingResources: Partial<Record<ResourceType, bigint>>;
  statDeltas: TroopPromotionStatDeltas;
}

export interface TroopPromotionResult {
  ok: boolean;
  error?: string;
  quote: TroopPromotionQuote;
  nextTroops: PlayerTroopRoster;
  nextResources: GameResources;
}

const ALL_TROOP_TYPES: TroopType[] = ['shieldbearer', 'shooter', 'bomber'];
const ALL_RESOURCE_KEYS: ResourceType[] = ['wood', 'steel', 'copper', 'grain', 'oil', 'diamond'];

/**
 * Returns the highest troop tier (T1-T20) unlocked by the given Castle Level.
 * T1 is unlocked at Castle Lv.0, with one additional tier unlocked every 5 levels (T20 at Lv.95+).
 */
export function getMaxUnlockedTroopTier(castleLevel: number): number {
  const clampedCastle = Math.max(0, Math.floor(castleLevel));
  return Math.min(20, Math.max(1, Math.floor(clampedCastle / 5) + 1));
}

/**
 * Returns the minimum Castle Level required to unlock the given troop tier (T1-T20).
 */
export function getRequiredCastleLevelForTier(tier: number): number {
  const clampedTier = Math.max(1, Math.min(20, Math.floor(tier)));
  return (clampedTier - 1) * 5;
}

/**
 * Returns the canonical roster key for a troop archetype and tier (e.g. "shieldbearer_t1").
 */
export function getTroopRosterKey(type: TroopType, tier: number): string {
  const clampedTier = Math.max(1, Math.min(20, Math.floor(tier)));
  return `${type}_t${clampedTier}`;
}

/**
 * Lists all owned low-tier troop stacks for an archetype that can be promoted
 * to a higher unlocked tier (tier < maxUnlockedTier and ownedCount > 0n).
 */
export function getPromotableTroopEntries(
  troops: PlayerTroopRoster,
  type: TroopType,
  maxUnlockedTier: number
): PromotableTroopEntry[] {
  const clampedMax = Math.max(1, Math.min(20, Math.floor(maxUnlockedTier)));
  const entries: PromotableTroopEntry[] = [];

  for (let tier = 1; tier < clampedMax; tier += 1) {
    const rosterKey = getTroopRosterKey(type, tier);
    const ownedCount = troops[rosterKey] ?? 0n;
    if (ownedCount > 0n) {
      const info = getTroopTierInfo(type, tier);
      entries.push({
        type,
        tier,
        rosterKey,
        name: info.name,
        ownedCount,
        powerPerUnit: info.powerPerUnit,
      });
    }
  }

  return entries;
}

/**
 * Counts total promotable low-tier troops across all archetypes and per archetype.
 */
export function countPromotableTroops(
  troops: PlayerTroopRoster,
  maxUnlockedTier: number
): { total: bigint; byType: Record<TroopType, bigint> } {
  const byType: Record<TroopType, bigint> = {
    shieldbearer: 0n,
    shooter: 0n,
    bomber: 0n,
  };

  for (const type of ALL_TROOP_TYPES) {
    const entries = getPromotableTroopEntries(troops, type, maxUnlockedTier);
    byType[type] = entries.reduce((sum, entry) => sum + entry.ownedCount, 0n);
  }

  return {
    total: byType.shieldbearer + byType.shooter + byType.bomber,
    byType,
  };
}

function clampBigIntDiff(a: bigint, b: bigint): bigint {
  return a > b ? a - b : 0n;
}

function resolveEffectiveMaxUnlockedTier(params: {
  castleLevel?: number;
  maxUnlockedTier?: number;
}): { effectiveMaxUnlocked: number; clampedCastleLevel?: number; castleUnlockedTier?: number } {
  const hasCastle = typeof params.castleLevel === 'number' && Number.isFinite(params.castleLevel);
  const clampedCastleLevel = hasCastle
    ? Math.max(0, Math.floor(params.castleLevel as number))
    : undefined;
  const castleUnlockedTier =
    clampedCastleLevel !== undefined ? getMaxUnlockedTroopTier(clampedCastleLevel) : undefined;

  const hasExplicitMax =
    typeof params.maxUnlockedTier === 'number' && Number.isFinite(params.maxUnlockedTier);
  const clampedExplicitMax = hasExplicitMax
    ? Math.max(1, Math.min(20, Math.floor(params.maxUnlockedTier as number)))
    : undefined;

  let effectiveMaxUnlocked = 1;
  if (castleUnlockedTier !== undefined && clampedExplicitMax !== undefined) {
    effectiveMaxUnlocked = Math.min(castleUnlockedTier, clampedExplicitMax);
  } else if (castleUnlockedTier !== undefined) {
    effectiveMaxUnlocked = castleUnlockedTier;
  } else if (clampedExplicitMax !== undefined) {
    effectiveMaxUnlocked = clampedExplicitMax;
  }

  return { effectiveMaxUnlocked, clampedCastleLevel, castleUnlockedTier };
}

function buildLockedTierError(params: {
  targetTier: number;
  effectiveMaxUnlocked: number;
  clampedCastleLevel?: number;
  castleUnlockedTier?: number;
}): string {
  const requiredCastleLevel = getRequiredCastleLevelForTier(params.targetTier);
  if (params.clampedCastleLevel !== undefined && params.castleUnlockedTier !== undefined) {
    return `Cannot promote to Tier T${params.targetTier}: requires Castle Level ${requiredCastleLevel} (current Castle Level ${params.clampedCastleLevel}, max unlocked tier T${params.castleUnlockedTier}).`;
  }
  return `Cannot promote to Tier T${params.targetTier}: tier is locked (requires Castle Level ${requiredCastleLevel}, max unlocked tier T${params.effectiveMaxUnlocked}).`;
}

export interface TroopPromotionParams {
  troops: PlayerTroopRoster;
  resources: GameResources;
  type: TroopType;
  sourceTier: number;
  targetTier: number;
  amount: bigint;
  castleLevel?: number;
  maxUnlockedTier?: number;
  zeroResourceCost?: boolean;
}

/**
 * Calculates the exact incremental resource cost, stat upgrades, power gain,
 * and eligibility of promoting `amount` units from `sourceTier` to `targetTier`.
 */
export function calculateTroopPromotionQuote(params: TroopPromotionParams): TroopPromotionQuote {
  const sourceTier = Math.floor(params.sourceTier);
  const targetTier = Math.floor(params.targetTier);
  const { effectiveMaxUnlocked, clampedCastleLevel, castleUnlockedTier } =
    resolveEffectiveMaxUnlockedTier(params);
  const safeAmount = params.amount > 0n ? params.amount : 0n;

  const sourceInfo = getTroopTierInfo(params.type, Math.max(1, Math.min(20, sourceTier)));
  const targetInfo = getTroopTierInfo(params.type, Math.max(1, Math.min(20, targetTier)));
  const ownedSourceCount =
    sourceTier >= 1 && sourceTier <= 20
      ? (params.troops[getTroopRosterKey(params.type, sourceTier)] ?? 0n)
      : 0n;

  const unitCostDelta: GameResources = {
    wood: clampBigIntDiff(targetInfo.woodCost, sourceInfo.woodCost),
    steel: clampBigIntDiff(targetInfo.steelCost, sourceInfo.steelCost),
    copper: clampBigIntDiff(targetInfo.copperCost, sourceInfo.copperCost),
    grain: clampBigIntDiff(targetInfo.grainCost, sourceInfo.grainCost),
    oil: clampBigIntDiff(targetInfo.oilCost, sourceInfo.oilCost),
    diamond: clampBigIntDiff(targetInfo.diamondCost, sourceInfo.diamondCost),
  };

  const totalCost: GameResources = {
    wood: unitCostDelta.wood * safeAmount,
    steel: unitCostDelta.steel * safeAmount,
    copper: unitCostDelta.copper * safeAmount,
    grain: unitCostDelta.grain * safeAmount,
    oil: unitCostDelta.oil * safeAmount,
    diamond: unitCostDelta.diamond * safeAmount,
  };

  const missingResources: Partial<Record<ResourceType, bigint>> = {};
  if (!params.zeroResourceCost) {
    for (const key of ALL_RESOURCE_KEYS) {
      if (params.resources[key] < totalCost[key]) {
        missingResources[key] = totalCost[key] - params.resources[key];
      }
    }
  }

  const canAfford = Object.keys(missingResources).length === 0;

  const attackPerUnit = clampBigIntDiff(targetInfo.attack, sourceInfo.attack);
  const defensePerUnit = clampBigIntDiff(targetInfo.defense, sourceInfo.defense);
  const hpPerUnit = clampBigIntDiff(targetInfo.hp, sourceInfo.hp);
  const powerPerUnit = clampBigIntDiff(targetInfo.powerPerUnit, sourceInfo.powerPerUnit);

  const statDeltas: TroopPromotionStatDeltas = {
    attackPerUnit,
    defensePerUnit,
    hpPerUnit,
    powerPerUnit,
    totalPowerGain: powerPerUnit * safeAmount,
  };

  let error: string | undefined;
  if (sourceTier < 1 || sourceTier > 19) {
    error = 'Source tier must be between T1 and T19.';
  } else if (targetTier < 2 || targetTier > 20) {
    error = 'Target tier must be between T2 and T20.';
  } else if (targetTier <= sourceTier) {
    error = 'Target tier must be higher than the source tier.';
  } else if (targetTier > effectiveMaxUnlocked) {
    error = buildLockedTierError({
      targetTier,
      effectiveMaxUnlocked,
      clampedCastleLevel,
      castleUnlockedTier,
    });
  } else if (params.amount <= 0n) {
    error = 'Enter a promotion quantity greater than zero.';
  } else if (ownedSourceCount < params.amount) {
    error = `Not enough ${sourceInfo.name} stationed to promote that batch.`;
  } else if (!canAfford) {
    error = 'Insufficient resources to pay the promotion supply cost.';
  }

  return {
    valid: !error,
    error,
    type: params.type,
    sourceTier,
    targetTier,
    sourceName: sourceInfo.name,
    targetName: targetInfo.name,
    amount: safeAmount,
    ownedSourceCount,
    unitCostDelta,
    totalCost,
    canAfford,
    missingResources,
    statDeltas,
  };
}

/**
 * Applies a validated troop tier promotion cleanly without changing total troop capacity.
 * Prevents promoting troops if the destination tier has not yet been unlocked by the current castle level.
 */
export function applyTroopPromotion(params: TroopPromotionParams): TroopPromotionResult {
  const quote = calculateTroopPromotionQuote(params);
  const { effectiveMaxUnlocked, clampedCastleLevel, castleUnlockedTier } =
    resolveEffectiveMaxUnlockedTier(params);

  // Explicitly guard against promoting into a destination tier not unlocked by the current castle level
  if (
    quote.targetTier > quote.sourceTier &&
    quote.targetTier >= 2 &&
    quote.targetTier <= 20 &&
    quote.targetTier > effectiveMaxUnlocked
  ) {
    const lockedError = buildLockedTierError({
      targetTier: quote.targetTier,
      effectiveMaxUnlocked,
      clampedCastleLevel,
      castleUnlockedTier,
    });
    return {
      ok: false,
      error: lockedError,
      quote: { ...quote, valid: false, error: lockedError },
      nextTroops: params.troops,
      nextResources: params.resources,
    };
  }

  if (!quote.valid) {
    return {
      ok: false,
      error: quote.error,
      quote,
      nextTroops: params.troops,
      nextResources: params.resources,
    };
  }

  const sourceKey = getTroopRosterKey(quote.type, quote.sourceTier);
  const targetKey = getTroopRosterKey(quote.type, quote.targetTier);

  const nextTroops: PlayerTroopRoster = {
    ...params.troops,
    [sourceKey]: (params.troops[sourceKey] ?? 0n) - quote.amount,
    [targetKey]: (params.troops[targetKey] ?? 0n) + quote.amount,
  };

  const nextResources: GameResources = params.zeroResourceCost
    ? { ...params.resources }
    : {
        wood: params.resources.wood - quote.totalCost.wood,
        steel: params.resources.steel - quote.totalCost.steel,
        copper: params.resources.copper - quote.totalCost.copper,
        grain: params.resources.grain - quote.totalCost.grain,
        oil: params.resources.oil - quote.totalCost.oil,
        diamond: params.resources.diamond - quote.totalCost.diamond,
      };

  return {
    ok: true,
    quote,
    nextTroops,
    nextResources,
  };
}

/**
 * Calculates the training duration in milliseconds for a batch of T1-T20 troops.
 * Scales logarithmically with batch size and linearly with troop tier (T1-T20),
 * reduced by Castle Level and VIP speed bonuses.
 */
export function calculateTrainingDurationMs(params: {
  tier: number;
  amount: bigint;
  castleLevel: number;
  vipSpeedBonusPct?: number;
}): TroopTrainingDurationEstimate {
  const clampedTier = Math.max(1, Math.min(20, Math.floor(params.tier)));
  const numericAmount = Math.max(1, Number(params.amount));
  const clampedCastle = Math.max(0, Math.min(100, Math.floor(params.castleLevel)));
  const vipBonus = Math.max(0, params.vipSpeedBonusPct ?? 0);

  // Log10 scale for batch size:
  // 100 -> log10 = 2
  // 1,000 -> log10 = 3
  // 10,000 -> log10 = 4
  // 100,000 -> log10 = 5
  // 1,000,000 -> log10 = 6
  // 10,000,000 -> log10 = 7
  const batchMagnitude = Math.max(1, Math.log10(numericAmount));

  // Tier factor: T1 = 1.0x up to T20 = 3.85x
  const tierFactor = 1 + (clampedTier - 1) * 0.15;

  // Base duration in ms before speed bonuses (~4.5s for 100 T1, ~7.3s for 1K T1, ~10.8s for 10K T1, up to ~45s for 10M T20)
  const rawBaseMs = Math.round((1500 + Math.pow(batchMagnitude, 1.65) * 950) * tierFactor);

  // Castle level grants +2% training speed per level; VIP adds its speed bonus
  const speedBonusPct = clampedCastle * 2 + vipBonus;
  const speedDivisor = 1 + speedBonusPct / 100;

  const adjustedMs = Math.round(rawBaseMs / speedDivisor);
  const durationMs = Math.max(2500, Math.min(45000, adjustedMs));

  let cadenceLabel = 'Squad Drill';
  if (numericAmount >= 10_000_000) {
    cadenceLabel = 'Imperial Armada Levy';
  } else if (numericAmount >= 1_000_000) {
    cadenceLabel = 'Grand Legion Mobilization';
  } else if (numericAmount >= 100_000) {
    cadenceLabel = 'Fortress Battalion Conscription';
  } else if (numericAmount >= 10_000) {
    cadenceLabel = 'Vanguard Regiment Drill';
  } else if (numericAmount >= 1_000) {
    cadenceLabel = 'Garrison Company Muster';
  }

  return {
    durationMs,
    baseDurationMs: rawBaseMs,
    speedBonusPct,
    cadenceLabel,
  };
}

/**
 * Formats remaining milliseconds into a clean tabular readout (e.g., "04.8s" or "01m 12.4s").
 */
export function formatTrainingCountdown(remainingMs: number): string {
  const safeMs = Math.max(0, remainingMs);
  if (safeMs === 0) {
    return '00.0s';
  }

  const totalSeconds = safeMs / 1000;
  if (totalSeconds < 60) {
    const wholeSeconds = Math.floor(totalSeconds);
    const tenths = Math.floor((safeMs % 1000) / 100);
    return `${String(wholeSeconds).padStart(2, '0')}.${tenths}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const remSeconds = totalSeconds - minutes * 60;
  const wholeRemSec = Math.floor(remSeconds);
  const tenths = Math.floor((safeMs % 1000) / 100);
  return `${String(minutes).padStart(2, '0')}m ${String(wholeRemSec).padStart(2, '0')}.${tenths}s`;
}

/**
 * Evaluates the live progress and remaining time of an active troop training job.
 */
export function evaluateTrainingJob(job: TroopTrainingJob, nowMs: number): TroopTrainingEvaluation {
  const safeDuration = Math.max(1, job.durationMs);
  const rawElapsed = Math.max(0, nowMs - job.startedAtMs) + Math.max(0, job.acceleratedMs);
  const elapsedMs = Math.min(safeDuration, rawElapsed);
  const remainingMs = Math.max(0, safeDuration - elapsedMs);
  const progressRatio = Math.min(1, Math.max(0, elapsedMs / safeDuration));
  const progressPct = Math.min(100, Math.max(0, Math.round(progressRatio * 100)));

  const trainedSoFar =
    remainingMs === 0 ? job.amount : BigInt(Math.floor(Number(job.amount) * progressRatio));

  return {
    elapsedMs,
    remainingMs,
    progressRatio,
    progressPct,
    trainedSoFar,
    isComplete: remainingMs === 0,
    formattedRemaining: formatTrainingCountdown(remainingMs),
  };
}

/**
 * Accelerates an active training job by the given milliseconds.
 */
export function accelerateTrainingJob(job: TroopTrainingJob, boostMs: number): TroopTrainingJob {
  const safeBoost = Math.max(0, Math.floor(boostMs));
  return {
    ...job,
    acceleratedMs: Math.min(job.durationMs, job.acceleratedMs + safeBoost),
  };
}

/**
 * Instantly completes an active training job.
 */
export function completeTrainingJobInstantly(job: TroopTrainingJob): TroopTrainingJob {
  return {
    ...job,
    acceleratedMs: job.durationMs,
  };
}
