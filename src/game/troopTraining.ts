/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameResources, TroopType } from '../types/game';

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
