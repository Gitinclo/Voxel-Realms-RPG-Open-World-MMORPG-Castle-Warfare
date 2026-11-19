/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PAID_REROLL_DIAMOND_COST,
  advanceDailyMissionById,
  applyMissionRewardBundle,
  claimDailyMissionMilestone,
  claimDailyMissionReward,
  countClaimableDailyMissions,
  deserializeDailyMissionBoard,
  evaluateBoardRefreshOption,
  generateDailyMissionBoard,
  recordDailyMissionEvent,
  refreshDailyMissionBoard,
  serializeDailyMissionBoard,
  summarizeCultivationLevel,
  syncBoardForDate,
} from './dailyMissions';
import { INITIAL_RESOURCES } from './initialData';
import { PlayerCultivationState } from '../types/cultivation';

function buildCultivationAtRealm(realmIndex: number, layer: number = 1): PlayerCultivationState {
  return {
    currentRealmIndex: realmIndex,
    currentLayer: layer,
    currentQi: 0n,
    passiveQiPerSec: 120n,
    paths: {
      qi: { realmIndex, layer, currentEnergy: 0n },
      body: { realmIndex, layer, currentEnergy: 0n },
      soul: { realmIndex, layer, currentEnergy: 0n },
      mind: { realmIndex, layer, currentEnergy: 0n },
    },
    ownedManuals: {},
    equippedManuals: { qi: null, body: null, soul: null, mind: null },
    scriptureFragments: 10,
    secludedYears: 0,
    tribulationUnderway: false,
    tribulationStrikesLeft: 0,
    tribulationDamageRating: 0n,
    inventoryPills: {},
    selectedRoot: 'lightning',
    rootPurityPct: 80,
    spiritStones: 5_000n,
    veteranScrolls: 0,
    veteranScrollsComprehended: 0,
  };
}

test('generates 5 deterministic cultivation-scaled missions per date and randomizes across dates/rerolls', () => {
  const mortal = buildCultivationAtRealm(0, 1);
  const boardA = generateDailyMissionBoard({ dateKey: '2026-11-19', cultivation: mortal });
  const boardB = generateDailyMissionBoard({ dateKey: '2026-11-19', cultivation: mortal });
  const nextDay = generateDailyMissionBoard({ dateKey: '2026-11-20', cultivation: mortal });

  assert.equal(boardA.missions.length, 5);
  assert.deepEqual(
    boardA.missions.map((m) => m.templateId),
    boardB.missions.map((m) => m.templateId)
  );
  // Guarantees at least one cultivation task and one materials task
  assert.ok(boardA.missions.some((m) => m.group === 'cultivation'));
  assert.ok(boardA.missions.some((m) => m.group === 'materials'));
  // Distinct IDs across days
  assert.notEqual(boardA.missions[0].id, nextDay.missions[0].id);
});

test('scales mission era, targets, and material rewards monotonically with player cultivation level', () => {
  const mortal = buildCultivationAtRealm(0, 1);
  const immortal = buildCultivationAtRealm(10, 5);
  const origin = buildCultivationAtRealm(22, 9);

  const mortalSummary = summarizeCultivationLevel(mortal);
  const immortalSummary = summarizeCultivationLevel(immortal);
  const originSummary = summarizeCultivationLevel(origin);

  assert.equal(mortalSummary.era, 'mortal');
  assert.equal(immortalSummary.era, 'immortal_sage');
  assert.equal(originSummary.era, 'ultimate_origin');
  assert.ok(mortalSummary.powerScaleMultiplier < immortalSummary.powerScaleMultiplier);
  assert.ok(immortalSummary.powerScaleMultiplier < originSummary.powerScaleMultiplier);

  const mortalBoard = generateDailyMissionBoard({ dateKey: '2026-11-19', cultivation: mortal });
  const originBoard = generateDailyMissionBoard({ dateKey: '2026-11-19', cultivation: origin });

  const mortalTotalWood = mortalBoard.missions.reduce(
    (acc, m) => acc + m.rewards.resources.wood,
    0n
  );
  const originTotalWood = originBoard.missions.reduce(
    (acc, m) => acc + m.rewards.resources.wood,
    0n
  );
  const mortalTotalStones = mortalBoard.missions.reduce(
    (acc, m) => acc + m.rewards.spiritStones,
    0n
  );
  const originTotalStones = originBoard.missions.reduce(
    (acc, m) => acc + m.rewards.spiritStones,
    0n
  );

  assert.ok(originTotalWood > mortalTotalWood * 5n);
  assert.ok(originTotalStones > mortalTotalStones * 5n);
});

test('tracks progress, prevents double claiming, and integrates rewards into resources and cultivation state', () => {
  const cultivation = buildCultivationAtRealm(4, 3);
  let board = generateDailyMissionBoard({ dateKey: '2026-11-19', cultivation });
  const targetMission = board.missions[0];

  // Cannot claim before completion
  const premature = claimDailyMissionReward(board, targetMission.id);
  assert.equal(premature.claimed, false);

  // Advance to completion
  const advanced = advanceDailyMissionById(board, targetMission.id, targetMission.targetCount + 5);
  board = advanced.updatedBoard;
  assert.equal(advanced.advancedMission?.currentCount, targetMission.targetCount);
  assert.equal(advanced.advancedMission?.completed, true);
  assert.equal(countClaimableDailyMissions(board), 1);

  // Claim once and apply rewards
  const claimResult = claimDailyMissionReward(board, targetMission.id);
  assert.equal(claimResult.claimed, true);
  assert.ok(claimResult.reward);
  board = claimResult.updatedBoard;

  // Double-claim must be rejected
  const duplicateClaim = claimDailyMissionReward(board, targetMission.id);
  assert.equal(duplicateClaim.claimed, false);

  // Verify exact resource + cultivation state integration
  const applied = applyMissionRewardBundle({
    resources: INITIAL_RESOURCES,
    cultivation,
    reward: claimResult.reward,
  });

  assert.equal(
    applied.nextResources.wood,
    INITIAL_RESOURCES.wood + claimResult.reward.resources.wood
  );
  assert.equal(
    applied.nextResources.diamond,
    INITIAL_RESOURCES.diamond + claimResult.reward.resources.diamond
  );
  assert.equal(
    applied.nextCultivation.spiritStones,
    (cultivation.spiritStones ?? 0n) + claimResult.reward.spiritStones
  );
  assert.equal(
    applied.nextCultivation.scriptureFragments,
    cultivation.scriptureFragments + claimResult.reward.scriptureFragments
  );
  const rewardPath = claimResult.reward.cultivationPath;
  assert.equal(
    applied.nextCultivation.paths[rewardPath].currentEnergy,
    cultivation.paths[rewardPath].currentEnergy + claimResult.reward.cultivationEnergy
  );
});

test('recordDailyMissionEvent advances matching gameplay events and unlocks 3/5 and 5/5 milestones + free repeatable cycle', () => {
  const cultivation = buildCultivationAtRealm(8, 2);
  let board = generateDailyMissionBoard({ dateKey: '2026-11-19', cultivation });

  // Complete and claim first 3 missions via gameplay event hook
  for (let i = 0; i < 3; i += 1) {
    const m = board.missions[i];
    const ev = recordDailyMissionEvent(board, m.category, m.targetCount, {
      path: m.targetPath,
      resource: m.targetResource,
    });
    assert.ok(ev.updatedCount >= 1);
    board = ev.updatedBoard;
    const claim = claimDailyMissionReward(board, m.id);
    assert.equal(claim.claimed, true);
    board = claim.updatedBoard;
  }

  // 3/5 milestone now claimable, 5/5 still locked
  const ms5Early = claimDailyMissionMilestone(board, 'milestone_5');
  assert.equal(ms5Early.claimed, false);
  const ms3 = claimDailyMissionMilestone(board, 'milestone_3');
  assert.equal(ms3.claimed, true);
  assert.ok(ms3.reward && ms3.reward.spiritStones > 0n);
  board = ms3.updatedBoard;

  // Complete remaining 2 missions
  for (let i = 3; i < 5; i += 1) {
    const m = board.missions[i];
    board = advanceDailyMissionById(board, m.id, m.targetCount).updatedBoard;
    board = claimDailyMissionReward(board, m.id).updatedBoard;
  }

  assert.equal(board.totalCyclesCompletedToday, 1);
  const ms5 = claimDailyMissionMilestone(board, 'milestone_5');
  assert.equal(ms5.claimed, true);
  assert.equal(ms5.reward?.veteranScrolls, 1);
  board = ms5.updatedBoard;

  // Completed board unlocks a FREE repeatable next cycle
  const refreshOption = evaluateBoardRefreshOption(board);
  assert.equal(refreshOption.isCycleComplete, true);
  assert.equal(refreshOption.isFree, true);
  assert.equal(refreshOption.diamondCost, 0n);

  const nextCycle = refreshDailyMissionBoard({
    board,
    cultivation,
    playerDiamonds: 0n,
  });
  assert.equal(nextCycle.ok, true);
  assert.equal(nextCycle.updatedBoard.cycleIndex, 2);
  assert.equal(
    nextCycle.updatedBoard.missions.every((m) => !m.claimed && m.currentCount === 0),
    true
  );
  assert.equal(nextCycle.updatedBoard.totalMissionsCompletedLifetime, 5);
});

test('enforces 1 free reroll per day then diamond cost, and round-trips BigInt serialization cleanly', () => {
  const cultivation = buildCultivationAtRealm(2, 4);
  const board = generateDailyMissionBoard({ dateKey: '2026-11-19', cultivation });

  // First reroll is free
  const firstReroll = refreshDailyMissionBoard({ board, cultivation, playerDiamonds: 0n });
  assert.equal(firstReroll.ok, true);
  assert.equal(firstReroll.diamondCostPaid, 0n);
  assert.equal(firstReroll.updatedBoard.rerollsUsedToday, 1);

  // Second reroll requires diamonds if insufficient
  const deniedReroll = refreshDailyMissionBoard({
    board: firstReroll.updatedBoard,
    cultivation,
    playerDiamonds: PAID_REROLL_DIAMOND_COST - 1n,
  });
  assert.equal(deniedReroll.ok, false);

  // Second reroll succeeds with sufficient diamonds
  const paidReroll = refreshDailyMissionBoard({
    board: firstReroll.updatedBoard,
    cultivation,
    playerDiamonds: PAID_REROLL_DIAMOND_COST,
  });
  assert.equal(paidReroll.ok, true);
  assert.equal(paidReroll.diamondCostPaid, PAID_REROLL_DIAMOND_COST);

  // BigInt-safe persistence round-trip
  const serialized = serializeDailyMissionBoard(paidReroll.updatedBoard);
  const hydrated = deserializeDailyMissionBoard(serialized);
  assert.ok(hydrated);
  assert.equal(hydrated.dateKey, '2026-11-19');
  assert.equal(
    hydrated.missions[0].rewards.resources.wood,
    paidReroll.updatedBoard.missions[0].rewards.resources.wood
  );

  // Date rollover resets board cleanly while keeping lifetime completed count
  const rolledOver = syncBoardForDate(
    { ...hydrated, totalMissionsCompletedLifetime: 12 },
    '2026-11-20',
    cultivation
  );
  assert.equal(rolledOver.dateKey, '2026-11-20');
  assert.equal(rolledOver.cycleIndex, 1);
  assert.equal(rolledOver.rerollsUsedToday, 0);
  assert.equal(rolledOver.totalMissionsCompletedLifetime, 12);
});
