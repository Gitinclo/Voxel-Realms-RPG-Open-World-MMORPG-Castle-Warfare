/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_DAILY_LOGIN_STATE,
  getCalendarDateKey,
  getCalendarDaysDiff,
  evaluateDailyLoginState,
  calculateDailyLoginReward,
  getSevenDayRewardSchedule,
  claimDailyLoginReward,
  calculateVeteranScrollBonuses,
  applyVeteranScrollToCultivation,
} from './dailyLogin';
import { PlayerCultivationState } from '../types/cultivation';

function createMockCultivationState(veteranScrolls: number = 2): PlayerCultivationState {
  return {
    currentRealmIndex: 3,
    currentLayer: 4,
    currentQi: 420_000n,
    passiveQiPerSec: 1_200n,
    paths: {
      qi: { realmIndex: 3, layer: 4, currentEnergy: 420_000n },
      body: { realmIndex: 2, layer: 6, currentEnergy: 1_850_000n },
      soul: { realmIndex: 3, layer: 2, currentEnergy: 12_500_000n },
      mind: { realmIndex: 3, layer: 5, currentEnergy: 19_000_000n },
    },
    ownedManuals: {},
    equippedManuals: { qi: null, body: null, soul: null, mind: null },
    scriptureFragments: 50,
    secludedYears: 1000,
    tribulationUnderway: false,
    tribulationStrikesLeft: 0,
    tribulationDamageRating: 0n,
    inventoryPills: {},
    selectedRoot: 'lightning',
    rootPurityPct: 92,
    veteranScrolls,
    veteranScrollsComprehended: 0,
  };
}

test('getCalendarDateKey and getCalendarDaysDiff compute accurate UTC calendar day deltas', () => {
  const base = new Date(Date.UTC(2026, 9, 22, 12, 0, 0));
  const key0 = getCalendarDateKey(base, 0);
  const key1 = getCalendarDateKey(base, 1);
  const key7 = getCalendarDateKey(base, 7);

  assert.equal(key0, '2026-10-22');
  assert.equal(key1, '2026-10-23');
  assert.equal(getCalendarDaysDiff(key0, key0), 0);
  assert.equal(getCalendarDaysDiff(key0, key1), 1);
  assert.equal(getCalendarDaysDiff(key0, key7), 7);
});

test('evaluateDailyLoginState triggers on first load of the day and prevents duplicate claims on the same day', () => {
  const today = '2026-10-22';

  // First load ever
  const evalFirstLoad = evaluateDailyLoginState(INITIAL_DAILY_LOGIN_STATE, today);
  assert.equal(evalFirstLoad.canClaimToday, true);
  assert.equal(evalFirstLoad.shouldAutoTriggerOnLoad, true);
  assert.equal(evalFirstLoad.activeCycleDay, 1);
  assert.equal(evalFirstLoad.nextStreakIfClaimed, 1);

  // Claim Day 1
  const claimRes = claimDailyLoginReward({
    currentState: INITIAL_DAILY_LOGIN_STATE,
    effectiveDateKey: today,
    castleLevel: 12,
    cultivationRealmIndex: 3,
  });
  assert.equal(claimRes.claimed, true);
  assert.ok(claimRes.reward);
  assert.equal(claimRes.reward.day, 1);
  assert.equal(claimRes.updatedState.streakDays, 1);
  assert.equal(claimRes.updatedState.totalDaysClaimed, 1);

  // Reloading on the same day should NOT auto-trigger or allow claiming again
  const evalSameDay = evaluateDailyLoginState(claimRes.updatedState, today);
  assert.equal(evalSameDay.canClaimToday, false);
  assert.equal(evalSameDay.shouldAutoTriggerOnLoad, false);
  assert.equal(evalSameDay.activeCycleDay, 1);

  const duplicateClaim = claimDailyLoginReward({
    currentState: claimRes.updatedState,
    effectiveDateKey: today,
    castleLevel: 12,
    cultivationRealmIndex: 3,
  });
  assert.equal(duplicateClaim.claimed, false);
  assert.equal(duplicateClaim.reward, null);
});

test('Consecutive daily logins advance streak from Day 1 to Day 7 and wrap to Day 1 on Day 8 while keeping veteran multiplier', () => {
  let state = { ...INITIAL_DAILY_LOGIN_STATE };
  const baseDate = new Date(Date.UTC(2026, 9, 1, 8, 0, 0));

  for (let i = 0; i < 8; i++) {
    const dateKey = getCalendarDateKey(baseDate, i);
    const ev = evaluateDailyLoginState(state, dateKey);
    assert.equal(ev.canClaimToday, true);
    assert.equal(ev.shouldAutoTriggerOnLoad, true);
    const expectedCycleDay = (i % 7) + 1;
    assert.equal(ev.activeCycleDay, expectedCycleDay);

    const res = claimDailyLoginReward({
      currentState: state,
      effectiveDateKey: dateKey,
      castleLevel: 15,
      cultivationRealmIndex: 4,
    });
    assert.equal(res.claimed, true);
    state = res.updatedState;
  }

  assert.equal(state.streakDays, 8);
  assert.equal(state.totalDaysClaimed, 8);

  // Missing a day resets consecutive streak to 1, but preserves totalDaysClaimed
  const skippedDateKey = getCalendarDateKey(baseDate, 10); // skipped day index 8
  const evalAfterSkip = evaluateDailyLoginState(state, skippedDateKey);
  assert.equal(evalAfterSkip.canClaimToday, true);
  assert.equal(evalAfterSkip.streakResetOccurred, true);
  assert.equal(evalAfterSkip.activeCycleDay, 1);
  assert.equal(evalAfterSkip.totalDaysClaimed, 8);
});

test('Scaling rewards increase across Day 1 to Day 7 and scale with Castle Level & Cultivation Realm', () => {
  const scheduleLow = getSevenDayRewardSchedule({
    castleLevel: 1,
    cultivationRealmIndex: 0,
    totalDaysClaimed: 0,
  });
  const scheduleHigh = getSevenDayRewardSchedule({
    castleLevel: 25,
    cultivationRealmIndex: 6,
    totalDaysClaimed: 14,
  });

  assert.equal(scheduleLow.length, 7);
  // Day 7 reward is strictly greater than Day 1 reward for resources, diamonds, and Veteran Scrolls
  assert.ok(scheduleLow[6].resources.wood > scheduleLow[0].resources.wood);
  assert.ok(scheduleLow[6].resources.diamond > scheduleLow[0].resources.diamond);
  assert.ok(scheduleLow[6].veteranScrolls > scheduleLow[0].veteranScrolls);
  assert.equal(scheduleLow[0].veteranScrolls, 1);
  assert.equal(scheduleLow[6].veteranScrolls, 5);

  // Higher castle level + realm + veteran cycles yield strictly larger rewards on Day 1
  assert.ok(scheduleHigh[0].resources.wood > scheduleLow[0].resources.wood);
  assert.ok(scheduleHigh[0].resources.diamond > scheduleLow[0].resources.diamond);
  assert.ok(scheduleHigh[6].veteranScrolls > scheduleLow[6].veteranScrolls);
});

test('Veteran Scroll comprehension boosts cultivation energy, scripture fragments, secluded years, and permanent mastery', () => {
  const initialCultivation = createMockCultivationState(3);

  // Comprehend 1 Veteran Scroll focused on Qi Path
  const resQi = applyVeteranScrollToCultivation(initialCultivation, 'qi', 1);
  assert.equal(resQi.success, true);
  assert.equal(resQi.updatedCultivation.veteranScrolls, 2);
  assert.equal(resQi.updatedCultivation.veteranScrollsComprehended, 1);
  assert.ok(resQi.updatedCultivation.paths.qi.currentEnergy > initialCultivation.paths.qi.currentEnergy);
  assert.equal(resQi.updatedCultivation.scriptureFragments, initialCultivation.scriptureFragments + 30);
  assert.equal(resQi.updatedCultivation.secludedYears, initialCultivation.secludedYears + 120);

  // Comprehend 2 Veteran Scrolls across ALL 4 paths
  const resAll = applyVeteranScrollToCultivation(resQi.updatedCultivation, 'all', 2);
  assert.equal(resAll.success, true);
  assert.equal(resAll.updatedCultivation.veteranScrolls, 0);
  assert.equal(resAll.updatedCultivation.veteranScrollsComprehended, 3);
  assert.ok(resAll.updatedCultivation.paths.body.currentEnergy > initialCultivation.paths.body.currentEnergy);
  assert.ok(resAll.updatedCultivation.paths.soul.currentEnergy > initialCultivation.paths.soul.currentEnergy);
  assert.ok(resAll.updatedCultivation.paths.mind.currentEnergy > initialCultivation.paths.mind.currentEnergy);

  const bonuses = calculateVeteranScrollBonuses(resAll.updatedCultivation.veteranScrollsComprehended);
  assert.equal(bonuses.comprehendedCount, 3);
  assert.equal(bonuses.passiveSpeedBonusPct, 54);
  assert.equal(bonuses.breakthroughSuccessBonusPct, 9);

  // Attempting to use another scroll when 0 remain returns success: false cleanly
  const resEmpty = applyVeteranScrollToCultivation(resAll.updatedCultivation, 'qi', 1);
  assert.equal(resEmpty.success, false);
});
