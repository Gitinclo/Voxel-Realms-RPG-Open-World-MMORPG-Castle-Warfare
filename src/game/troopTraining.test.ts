/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTrainingDurationMs,
  formatTrainingCountdown,
  evaluateTrainingJob,
  accelerateTrainingJob,
  completeTrainingJobInstantly,
  TroopTrainingJob,
  getTroopRosterKey,
  getMaxUnlockedTroopTier,
  getRequiredCastleLevelForTier,
  getPromotableTroopEntries,
  countPromotableTroops,
  calculateTroopPromotionQuote,
  applyTroopPromotion,
} from './troopTraining';
import { getTroopTierInfo } from './math';
import { GameResources, PlayerTroopRoster } from '../types/game';

test('calculateTrainingDurationMs scales up with higher troop tier and larger batch sizes', () => {
  const smallT1 = calculateTrainingDurationMs({
    tier: 1,
    amount: 100n,
    castleLevel: 10,
  });
  const largeT1 = calculateTrainingDurationMs({
    tier: 1,
    amount: 10_000_000n,
    castleLevel: 10,
  });
  const largeT20 = calculateTrainingDurationMs({
    tier: 20,
    amount: 10_000_000n,
    castleLevel: 10,
  });

  assert.ok(
    largeT1.durationMs > smallT1.durationMs,
    `Expected 10M batch (${largeT1.durationMs}ms) > 100 batch (${smallT1.durationMs}ms)`
  );
  assert.ok(
    largeT20.durationMs > largeT1.durationMs,
    `Expected T20 batch (${largeT20.durationMs}ms) > T1 batch (${largeT1.durationMs}ms)`
  );
  assert.equal(smallT1.cadenceLabel, 'Squad Drill');
  assert.equal(largeT20.cadenceLabel, 'Imperial Armada Levy');
});

test('calculateTrainingDurationMs reduces training time when castle level and VIP speed bonus increase', () => {
  const base = calculateTrainingDurationMs({
    tier: 10,
    amount: 100_000n,
    castleLevel: 5,
    vipSpeedBonusPct: 0,
  });
  const buffed = calculateTrainingDurationMs({
    tier: 10,
    amount: 100_000n,
    castleLevel: 50,
    vipSpeedBonusPct: 60,
  });

  assert.ok(
    buffed.durationMs < base.durationMs,
    `Expected buffed duration (${buffed.durationMs}ms) < base duration (${base.durationMs}ms)`
  );
  assert.equal(buffed.speedBonusPct, 160);
});

test('formatTrainingCountdown formats sub-minute and multi-minute remaining times cleanly', () => {
  assert.equal(formatTrainingCountdown(0), '00.0s');
  assert.equal(formatTrainingCountdown(4850), '04.8s');
  assert.equal(formatTrainingCountdown(12340), '12.3s');
  assert.equal(formatTrainingCountdown(74200), '01m 14.2s');
});

test('evaluateTrainingJob computes progress percentage, remaining time, and partial troop mobilization', () => {
  const job: TroopTrainingJob = {
    id: 'job_1',
    type: 'shieldbearer',
    tier: 5,
    unitName: 'T5 Adamant Sentinel',
    amount: 10_000n,
    costPaid: { wood: 50_000n },
    startedAtMs: 1_000_000,
    durationMs: 10_000,
    acceleratedMs: 0,
  };

  const startEval = evaluateTrainingJob(job, 1_000_000);
  assert.equal(startEval.progressPct, 0);
  assert.equal(startEval.remainingMs, 10_000);
  assert.equal(startEval.trainedSoFar, 0n);
  assert.equal(startEval.isComplete, false);

  const halfEval = evaluateTrainingJob(job, 1_005_000);
  assert.equal(halfEval.progressPct, 50);
  assert.equal(halfEval.remainingMs, 5_000);
  assert.equal(halfEval.trainedSoFar, 5_000n);
  assert.equal(halfEval.formattedRemaining, '05.0s');
  assert.equal(halfEval.isComplete, false);

  const doneEval = evaluateTrainingJob(job, 1_012_000);
  assert.equal(doneEval.progressPct, 100);
  assert.equal(doneEval.remainingMs, 0);
  assert.equal(doneEval.trainedSoFar, 10_000n);
  assert.equal(doneEval.formattedRemaining, '00.0s');
  assert.equal(doneEval.isComplete, true);
});

test('accelerateTrainingJob and completeTrainingJobInstantly advance progress accurately', () => {
  const job: TroopTrainingJob = {
    id: 'job_2',
    type: 'bomber',
    tier: 12,
    unitName: 'T12 Antimatter Siege',
    amount: 1_000_000n,
    costPaid: { oil: 500_000n },
    startedAtMs: 2_000_000,
    durationMs: 12_000,
    acceleratedMs: 0,
  };

  const boosted = accelerateTrainingJob(job, 3_000);
  const evalAfterBoost = evaluateTrainingJob(boosted, 2_003_000);
  assert.equal(evalAfterBoost.elapsedMs, 6_000);
  assert.equal(evalAfterBoost.progressPct, 50);
  assert.equal(evalAfterBoost.remainingMs, 6_000);

  const completed = completeTrainingJobInstantly(boosted);
  const evalAfterComplete = evaluateTrainingJob(completed, 2_003_000);
  assert.equal(evalAfterComplete.isComplete, true);
  assert.equal(evalAfterComplete.progressPct, 100);
  assert.equal(evalAfterComplete.trainedSoFar, 1_000_000n);
});

test('getPromotableTroopEntries and countPromotableTroops filter strictly below maxUnlockedTier', () => {
  const roster: PlayerTroopRoster = {
    shieldbearer_t1: 1_500n,
    shieldbearer_t3: 500n,
    shieldbearer_t5: 2_000n,
    shooter_t2: 800n,
    bomber_t20: 10_000n,
  };

  assert.equal(getTroopRosterKey('shieldbearer', 1), 'shieldbearer_t1');

  const sbAtMax5 = getPromotableTroopEntries(roster, 'shieldbearer', 5);
  assert.deepEqual(
    sbAtMax5.map((e) => [e.tier, e.ownedCount]),
    [
      [1, 1_500n],
      [3, 500n],
    ]
  );

  const counts = countPromotableTroops(roster, 5);
  assert.equal(counts.byType.shieldbearer, 2_000n);
  assert.equal(counts.byType.shooter, 800n);
  assert.equal(counts.byType.bomber, 0n);
  assert.equal(counts.total, 2_800n);
});

test('calculateTroopPromotionQuote computes exact incremental resource costs and power deltas', () => {
  const t1 = getTroopTierInfo('shieldbearer', 1);
  const t2 = getTroopTierInfo('shieldbearer', 2);
  const roster: PlayerTroopRoster = { shieldbearer_t1: 1_000n };
  const resources: GameResources = {
    wood: 1_000_000n,
    steel: 1_000_000n,
    copper: 1_000_000n,
    grain: 1_000_000n,
    oil: 1_000_000n,
    diamond: 500n,
  };

  const quote = calculateTroopPromotionQuote({
    troops: roster,
    resources,
    type: 'shieldbearer',
    sourceTier: 1,
    targetTier: 2,
    amount: 400n,
    maxUnlockedTier: 5,
  });

  assert.equal(quote.valid, true);
  assert.equal(quote.canAfford, true);
  assert.equal(quote.unitCostDelta.wood, t2.woodCost - t1.woodCost);
  assert.equal(quote.totalCost.wood, (t2.woodCost - t1.woodCost) * 400n);
  assert.equal(quote.totalCost.steel, (t2.steelCost - t1.steelCost) * 400n);
  assert.equal(quote.totalCost.diamond, 0n);
  assert.equal(quote.statDeltas.attackPerUnit, t2.attack - t1.attack);
  assert.equal(quote.statDeltas.totalPowerGain, (t2.powerPerUnit - t1.powerPerUnit) * 400n);
});

test('applyTroopPromotion rejects invalid tiers, locked tiers, insufficient troops, and insufficient resources', () => {
  const roster: PlayerTroopRoster = { shooter_t1: 500n, shooter_t4: 100n };
  const richResources: GameResources = {
    wood: 50_000_000n,
    steel: 50_000_000n,
    copper: 50_000_000n,
    grain: 50_000_000n,
    oil: 50_000_000n,
    diamond: 10_000n,
  };
  const poorResources: GameResources = {
    wood: 10n,
    steel: 10n,
    copper: 10n,
    grain: 10n,
    oil: 10n,
    diamond: 0n,
  };

  // Same or lower target tier
  const sameTier = applyTroopPromotion({
    troops: roster,
    resources: richResources,
    type: 'shooter',
    sourceTier: 4,
    targetTier: 4,
    amount: 50n,
    maxUnlockedTier: 10,
  });
  assert.equal(sameTier.ok, false);
  assert.match(sameTier.error ?? '', /higher than the source tier/i);

  // Locked target tier
  const lockedTier = applyTroopPromotion({
    troops: roster,
    resources: richResources,
    type: 'shooter',
    sourceTier: 1,
    targetTier: 8,
    amount: 50n,
    maxUnlockedTier: 5,
  });
  assert.equal(lockedTier.ok, false);
  assert.match(lockedTier.error ?? '', /locked/i);

  // Insufficient owned troops
  const tooMany = applyTroopPromotion({
    troops: roster,
    resources: richResources,
    type: 'shooter',
    sourceTier: 1,
    targetTier: 2,
    amount: 600n,
    maxUnlockedTier: 5,
  });
  assert.equal(tooMany.ok, false);
  assert.match(tooMany.error ?? '', /not enough/i);

  // Insufficient resources
  const tooPoor = applyTroopPromotion({
    troops: roster,
    resources: poorResources,
    type: 'shooter',
    sourceTier: 1,
    targetTier: 2,
    amount: 100n,
    maxUnlockedTier: 5,
  });
  assert.equal(tooPoor.ok, false);
  assert.equal(tooPoor.quote.canAfford, false);
  assert.ok((tooPoor.quote.missingResources.wood ?? 0n) > 0n);
});

test('applyTroopPromotion promotes troops while preserving total army headcount and deducting extra resources', () => {
  const roster: PlayerTroopRoster = {
    bomber_t1: 1_000n,
    bomber_t2: 250n,
    shieldbearer_t20: 10_000n,
  };
  const resources: GameResources = {
    wood: 100_000_000n,
    steel: 100_000_000n,
    copper: 100_000_000n,
    grain: 100_000_000n,
    oil: 100_000_000n,
    diamond: 50_000n,
  };

  const prevTotal = Object.values(roster).reduce((sum, n) => sum + n, 0n);

  const result = applyTroopPromotion({
    troops: roster,
    resources,
    type: 'bomber',
    sourceTier: 1,
    targetTier: 12,
    amount: 200n,
    maxUnlockedTier: 15,
  });

  assert.equal(result.ok, true);
  assert.equal(result.nextTroops.bomber_t1, 800n);
  assert.equal(result.nextTroops.bomber_t2, 250n);
  assert.equal(result.nextTroops.bomber_t12, 200n);

  // Total headcount unchanged
  const nextTotal = Object.values(result.nextTroops).reduce((sum, n) => sum + n, 0n);
  assert.equal(nextTotal, prevTotal);

  // Incremental diamond cost charged for T1 -> T12 (T12 costs 20 diamonds/unit)
  assert.equal(result.quote.totalCost.diamond, 200n * 20n);
  assert.equal(result.nextResources.diamond, resources.diamond - 4_000n);
  assert.equal(result.nextResources.wood, resources.wood - result.quote.totalCost.wood);

  // Zero-resource-cost mode preserves resources while still promoting troops
  const immuneResult = applyTroopPromotion({
    troops: roster,
    resources: { wood: 0n, steel: 0n, copper: 0n, grain: 0n, oil: 0n, diamond: 0n },
    type: 'bomber',
    sourceTier: 1,
    targetTier: 2,
    amount: 100n,
    maxUnlockedTier: 5,
    zeroResourceCost: true,
  });
  assert.equal(immuneResult.ok, true);
  assert.equal(immuneResult.nextTroops.bomber_t1, 900n);
  assert.equal(immuneResult.nextTroops.bomber_t2, 350n);
  assert.equal(immuneResult.nextResources.wood, 0n);
});

test('applyTroopPromotion blocks promotions when destination tier is not unlocked by castleLevel', () => {
  assert.equal(getMaxUnlockedTroopTier(0), 1);
  assert.equal(getMaxUnlockedTroopTier(4), 1);
  assert.equal(getMaxUnlockedTroopTier(5), 2);
  assert.equal(getMaxUnlockedTroopTier(20), 5);
  assert.equal(getMaxUnlockedTroopTier(95), 20);
  assert.equal(getMaxUnlockedTroopTier(100), 20);

  assert.equal(getRequiredCastleLevelForTier(1), 0);
  assert.equal(getRequiredCastleLevelForTier(2), 5);
  assert.equal(getRequiredCastleLevelForTier(5), 20);
  assert.equal(getRequiredCastleLevelForTier(20), 95);

  const roster: PlayerTroopRoster = { shieldbearer_t1: 1_000n };
  const resources: GameResources = {
    wood: 100_000_000n,
    steel: 100_000_000n,
    copper: 100_000_000n,
    grain: 100_000_000n,
    oil: 100_000_000n,
    diamond: 100_000n,
  };

  // Castle Lv.4 unlocks only T1 -> promoting T1 -> T2 must fail with descriptive castle-level error
  const blockedT2 = applyTroopPromotion({
    troops: roster,
    resources,
    type: 'shieldbearer',
    sourceTier: 1,
    targetTier: 2,
    amount: 250n,
    castleLevel: 4,
  });
  assert.equal(blockedT2.ok, false);
  assert.equal(blockedT2.quote.valid, false);
  assert.match(blockedT2.error ?? '', /Cannot promote to Tier T2/i);
  assert.match(blockedT2.error ?? '', /requires Castle Level 5/i);
  assert.match(blockedT2.error ?? '', /current Castle Level 4/i);
  assert.equal(blockedT2.nextTroops.shieldbearer_t1, 1_000n);
  assert.equal(blockedT2.nextTroops.shieldbearer_t2 ?? 0n, 0n);
  assert.equal(blockedT2.nextResources.wood, resources.wood);

  // Passing an inflated maxUnlockedTier alongside castleLevel must NOT bypass castleLevel validation
  const cannotBypass = applyTroopPromotion({
    troops: roster,
    resources,
    type: 'shieldbearer',
    sourceTier: 1,
    targetTier: 5,
    amount: 100n,
    castleLevel: 14, // unlocks T3 only (T5 requires Castle Level 20)
    maxUnlockedTier: 20,
  });
  assert.equal(cannotBypass.ok, false);
  assert.match(cannotBypass.error ?? '', /Cannot promote to Tier T5/i);
  assert.match(cannotBypass.error ?? '', /requires Castle Level 20/i);
  assert.match(cannotBypass.error ?? '', /current Castle Level 14/i);

  // At Castle Lv.5 (exact T2 unlock boundary), T1 -> T2 succeeds cleanly
  const unlockedT2 = applyTroopPromotion({
    troops: roster,
    resources,
    type: 'shieldbearer',
    sourceTier: 1,
    targetTier: 2,
    amount: 250n,
    castleLevel: 5,
  });
  assert.equal(unlockedT2.ok, true);
  assert.equal(unlockedT2.nextTroops.shieldbearer_t1, 750n);
  assert.equal(unlockedT2.nextTroops.shieldbearer_t2, 250n);
});
