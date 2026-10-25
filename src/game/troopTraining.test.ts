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
} from './troopTraining';

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
