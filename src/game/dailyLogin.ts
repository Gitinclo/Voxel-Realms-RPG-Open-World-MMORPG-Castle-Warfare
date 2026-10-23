/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameResources } from '../types/game';
import { CultivationPath, PlayerCultivationState } from '../types/cultivation';
import {
  CULTIVATION_PATH_LIST,
  CULTIVATION_PATH_META,
  calculateQiRequired,
} from './cultivationMath';

export const DAILY_LOGIN_STORAGE_KEY = 'voxel_realms_daily_login_v1';

export interface DailyLoginTierBase {
  day: number; // 1 to 7
  title: string;
  chineseTitle: string;
  subtitle: string;
  icon: string;
  baseResources: {
    wood: bigint;
    steel: bigint;
    copper: bigint;
    grain: bigint;
    oil: bigint;
  };
  baseDiamonds: bigint;
  veteranScrolls: number;
  scriptureFragments: number;
  spiritStones: bigint;
  isMilestone: boolean;
}

export interface ScaledDailyLoginReward {
  day: number;
  title: string;
  chineseTitle: string;
  subtitle: string;
  icon: string;
  resources: GameResources; // includes diamond
  veteranScrolls: number;
  scriptureFragments: number;
  spiritStones: bigint;
  scalingMultiplier: number;
  isMilestone: boolean;
}

export interface PersistedDailyLoginState {
  lastClaimedDateKey: string | null; // YYYY-MM-DD
  lastAutoTriggeredDateKey: string | null; // YYYY-MM-DD
  streakDays: number; // consecutive days claimed (e.g. 1, 2, 3...)
  totalDaysClaimed: number; // lifetime claims
  simulatedDayOffset: number; // allows advancing day for testing/preview
}

export interface DailyLoginEvaluation {
  effectiveDateKey: string;
  canClaimToday: boolean;
  shouldAutoTriggerOnLoad: boolean;
  activeCycleDay: number; // 1..7 for the current claimable or most recently claimed day
  nextStreakIfClaimed: number;
  currentStreak: number;
  totalDaysClaimed: number;
  streakResetOccurred: boolean;
}

export interface VeteranScrollBonuses {
  comprehendedCount: number;
  passiveSpeedBonusPct: number;
  breakthroughSuccessBonusPct: number;
  combatResonanceBonusPct: number;
}

export const DAILY_LOGIN_BASE_TIERS: DailyLoginTierBase[] = [
  {
    day: 1,
    title: 'Dawn of the Immortal Vanguard',
    chineseTitle: 'Mortal Vanguard Mandate',
    subtitle: 'Foundational citadel supplies & 1x Veteran Scroll of Secluded Dao',
    icon: '🌅',
    baseResources: {
      wood: 150_000n,
      steel: 120_000n,
      copper: 95_000n,
      grain: 180_000n,
      oil: 65_000n,
    },
    baseDiamonds: 350n,
    veteranScrolls: 1,
    scriptureFragments: 15,
    spiritStones: 8_000n,
    isMilestone: false,
  },
  {
    day: 2,
    title: 'Fortress Garrison Provision',
    chineseTitle: 'Bastion Garrison Edict',
    subtitle: 'Reinforced smelting ingots & Veteran Meridian Scroll',
    icon: '🛡️',
    baseResources: {
      wood: 240_000n,
      steel: 200_000n,
      copper: 150_000n,
      grain: 280_000n,
      oil: 110_000n,
    },
    baseDiamonds: 500n,
    veteranScrolls: 1,
    scriptureFragments: 20,
    spiritStones: 14_000n,
    isMilestone: false,
  },
  {
    day: 3,
    title: 'Jade Pure Pavilion Tribute',
    chineseTitle: 'Jade Pavilion Tribute',
    subtitle: 'Major surge of diamonds & 2x Veteran Scrolls for Dantian expansion',
    icon: '📜',
    baseResources: {
      wood: 380_000n,
      steel: 320_000n,
      copper: 250_000n,
      grain: 420_000n,
      oil: 180_000n,
    },
    baseDiamonds: 800n,
    veteranScrolls: 2,
    scriptureFragments: 35,
    spiritStones: 25_000n,
    isMilestone: true,
  },
  {
    day: 4,
    title: 'Imperial War Chest Dispatch',
    chineseTitle: 'Imperial War Dispatch',
    subtitle: 'Heavy siege oil reserves & 2x Veteran Scrolls of Ancient Insight',
    icon: '⚔️',
    baseResources: {
      wood: 550_000n,
      steel: 480_000n,
      copper: 380_000n,
      grain: 600_000n,
      oil: 270_000n,
    },
    baseDiamonds: 1_100n,
    veteranScrolls: 2,
    scriptureFragments: 45,
    spiritStones: 38_000n,
    isMilestone: false,
  },
  {
    day: 5,
    title: 'Golden Core Leyline Harvest',
    chineseTitle: 'Golden Core Leyline',
    subtitle: 'Leyline crystal diamonds & 3x Veteran Scrolls of Four-Path Resonance',
    icon: '🔮',
    baseResources: {
      wood: 820_000n,
      steel: 700_000n,
      copper: 560_000n,
      grain: 900_000n,
      oil: 420_000n,
    },
    baseDiamonds: 1_600n,
    veteranScrolls: 3,
    scriptureFragments: 60,
    spiritStones: 55_000n,
    isMilestone: true,
  },
  {
    day: 6,
    title: 'Heavenly Court Treasury Vault',
    chineseTitle: 'Heavenly Court Vault',
    subtitle: 'Millions in strategic war resources & 3x Veteran Scrolls',
    icon: '🏯',
    baseResources: {
      wood: 1_250_000n,
      steel: 1_100_000n,
      copper: 880_000n,
      grain: 1_400_000n,
      oil: 680_000n,
    },
    baseDiamonds: 2_400n,
    veteranScrolls: 3,
    scriptureFragments: 80,
    spiritStones: 85_000n,
    isMilestone: false,
  },
  {
    day: 7,
    title: 'Ultimate Origin Sovereign Decree',
    chineseTitle: 'Origin Sovereign Decree',
    subtitle: 'Grand 7-Day Jackpot: 5,000+ Base Diamonds & 5x Supreme Veteran Scrolls!',
    icon: '👑',
    baseResources: {
      wood: 2_500_000n,
      steel: 2_200_000n,
      copper: 1_800_000n,
      grain: 2_800_000n,
      oil: 1_400_000n,
    },
    baseDiamonds: 5_000n,
    veteranScrolls: 5,
    scriptureFragments: 150,
    spiritStones: 180_000n,
    isMilestone: true,
  },
];

export const INITIAL_DAILY_LOGIN_STATE: PersistedDailyLoginState = {
  lastClaimedDateKey: null,
  lastAutoTriggeredDateKey: null,
  streakDays: 0,
  totalDaysClaimed: 0,
  simulatedDayOffset: 0,
};

/**
 * Formats a Date (plus optional day offset) into a canonical YYYY-MM-DD calendar key.
 */
export function getCalendarDateKey(baseDate: Date = new Date(), dayOffset: number = 0): string {
  const d = new Date(baseDate.getTime());
  if (dayOffset !== 0) {
    d.setUTCDate(d.getUTCDate() + dayOffset);
  }
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes the integer number of calendar days between two YYYY-MM-DD keys (target - previous).
 */
export function getCalendarDaysDiff(previousDateKey: string, currentDateKey: string): number {
  const [pY, pM, pD] = previousDateKey.split('-').map(Number);
  const [cY, cM, cD] = currentDateKey.split('-').map(Number);
  const prevMs = Date.UTC(pY, (pM || 1) - 1, pD || 1);
  const currMs = Date.UTC(cY, (cM || 1) - 1, cD || 1);
  return Math.round((currMs - prevMs) / 86_400_000);
}

/**
 * Evaluates the player's daily login status for the current calendar day.
 * Triggers automatically on the first load of a calendar day.
 */
export function evaluateDailyLoginState(
  state: PersistedDailyLoginState | null | undefined,
  effectiveDateKey: string
): DailyLoginEvaluation {
  const safeState: PersistedDailyLoginState = state
    ? { ...INITIAL_DAILY_LOGIN_STATE, ...state }
    : { ...INITIAL_DAILY_LOGIN_STATE };

  if (!safeState.lastClaimedDateKey) {
    // Brand new player or never claimed before
    const shouldAutoTriggerOnLoad = safeState.lastAutoTriggeredDateKey !== effectiveDateKey;
    return {
      effectiveDateKey,
      canClaimToday: true,
      shouldAutoTriggerOnLoad,
      activeCycleDay: 1,
      nextStreakIfClaimed: 1,
      currentStreak: 0,
      totalDaysClaimed: safeState.totalDaysClaimed,
      streakResetOccurred: false,
    };
  }

  const diffDays = getCalendarDaysDiff(safeState.lastClaimedDateKey, effectiveDateKey);

  if (diffDays <= 0) {
    // Already claimed today
    const activeCycleDay = ((Math.max(1, safeState.streakDays) - 1) % 7) + 1;
    return {
      effectiveDateKey,
      canClaimToday: false,
      shouldAutoTriggerOnLoad: false,
      activeCycleDay,
      nextStreakIfClaimed: safeState.streakDays,
      currentStreak: safeState.streakDays,
      totalDaysClaimed: safeState.totalDaysClaimed,
      streakResetOccurred: false,
    };
  }

  if (diffDays === 1) {
    // Consecutive day login!
    const nextStreak = safeState.streakDays + 1;
    const activeCycleDay = ((nextStreak - 1) % 7) + 1;
    const shouldAutoTriggerOnLoad = safeState.lastAutoTriggeredDateKey !== effectiveDateKey;
    return {
      effectiveDateKey,
      canClaimToday: true,
      shouldAutoTriggerOnLoad,
      activeCycleDay,
      nextStreakIfClaimed: nextStreak,
      currentStreak: safeState.streakDays,
      totalDaysClaimed: safeState.totalDaysClaimed,
      streakResetOccurred: false,
    };
  }

  // Missed one or more days (diffDays > 1): consecutive streak resets to Day 1,
  // while lifetime totalDaysClaimed is preserved for Veteran scaling.
  const shouldAutoTriggerOnLoad = safeState.lastAutoTriggeredDateKey !== effectiveDateKey;
  return {
    effectiveDateKey,
    canClaimToday: true,
    shouldAutoTriggerOnLoad,
    activeCycleDay: 1,
    nextStreakIfClaimed: 1,
    currentStreak: 0,
    totalDaysClaimed: safeState.totalDaysClaimed,
    streakResetOccurred: safeState.streakDays > 0,
  };
}

/**
 * Calculates the scaling multiplier and concrete reward amounts for a given cycle day (1..7),
 * scaled by Castle Level, Cultivation Realm Index, and Cumulative Veteran Login Cycles.
 */
export function calculateDailyLoginReward(params: {
  cycleDay: number; // 1 to 7
  castleLevel: number;
  cultivationRealmIndex: number;
  totalDaysClaimed: number;
}): ScaledDailyLoginReward {
  const clampedDay = Math.max(1, Math.min(7, Math.floor(params.cycleDay)));
  const tier = DAILY_LOGIN_BASE_TIERS[clampedDay - 1] || DAILY_LOGIN_BASE_TIERS[0];

  // Scaling formula:
  // - Castle Level adds +8% per level above 1
  // - Cultivation Realm adds +22% per realm index
  // - Completed 7-day Veteran cycles add +25% per full week claimed
  const castleBonus = Math.max(0, params.castleLevel - 1) * 0.08;
  const realmBonus = Math.max(0, params.cultivationRealmIndex) * 0.22;
  const completedWeeks = Math.floor(Math.max(0, params.totalDaysClaimed) / 7);
  const veteranCycleBonus = completedWeeks * 0.25;

  const scalingMultiplier = Number((1 + castleBonus + realmBonus + veteranCycleBonus).toFixed(2));
  const scaleBigInt = (val: bigint, mult: number): bigint =>
    BigInt(Math.max(1, Math.round(Number(val) * mult)));

  // Diamonds scale slightly more conservatively so economy stays balanced yet rewarding
  const diamondMultiplier = Number(
    (1 + castleBonus * 0.35 + realmBonus * 0.4 + veteranCycleBonus).toFixed(2)
  );

  // Veteran Scrolls also gain +1 bonus scroll per 2 completed 7-day cycles on milestone days
  const extraVeteranScrolls = tier.isMilestone ? Math.floor(completedWeeks / 2) : 0;

  return {
    day: tier.day,
    title: tier.title,
    chineseTitle: tier.chineseTitle,
    subtitle: tier.subtitle,
    icon: tier.icon,
    resources: {
      wood: scaleBigInt(tier.baseResources.wood, scalingMultiplier),
      steel: scaleBigInt(tier.baseResources.steel, scalingMultiplier),
      copper: scaleBigInt(tier.baseResources.copper, scalingMultiplier),
      grain: scaleBigInt(tier.baseResources.grain, scalingMultiplier),
      oil: scaleBigInt(tier.baseResources.oil, scalingMultiplier),
      diamond: scaleBigInt(tier.baseDiamonds, diamondMultiplier),
    },
    veteranScrolls: tier.veteranScrolls + extraVeteranScrolls,
    scriptureFragments: Math.round(tier.scriptureFragments * (1 + veteranCycleBonus * 0.5)),
    spiritStones: scaleBigInt(tier.spiritStones, scalingMultiplier),
    scalingMultiplier,
    isMilestone: tier.isMilestone,
  };
}

/**
 * Generates the full 7-day schedule of scaled rewards for display in the Daily Login UI.
 */
export function getSevenDayRewardSchedule(params: {
  castleLevel: number;
  cultivationRealmIndex: number;
  totalDaysClaimed: number;
}): ScaledDailyLoginReward[] {
  return DAILY_LOGIN_BASE_TIERS.map((tier) =>
    calculateDailyLoginReward({
      cycleDay: tier.day,
      castleLevel: params.castleLevel,
      cultivationRealmIndex: params.cultivationRealmIndex,
      totalDaysClaimed: params.totalDaysClaimed,
    })
  );
}

/**
 * Resolves claiming today's Daily Login Reward, returning the updated persistence state
 * and the exact reward bundle granted.
 */
export function claimDailyLoginReward(params: {
  currentState: PersistedDailyLoginState;
  effectiveDateKey: string;
  castleLevel: number;
  cultivationRealmIndex: number;
}): {
  claimed: boolean;
  updatedState: PersistedDailyLoginState;
  reward: ScaledDailyLoginReward | null;
  evaluationAfter: DailyLoginEvaluation;
} {
  const evalBefore = evaluateDailyLoginState(params.currentState, params.effectiveDateKey);
  if (!evalBefore.canClaimToday) {
    return {
      claimed: false,
      updatedState: params.currentState,
      reward: null,
      evaluationAfter: evalBefore,
    };
  }

  const reward = calculateDailyLoginReward({
    cycleDay: evalBefore.activeCycleDay,
    castleLevel: params.castleLevel,
    cultivationRealmIndex: params.cultivationRealmIndex,
    totalDaysClaimed: params.currentState.totalDaysClaimed,
  });

  const updatedState: PersistedDailyLoginState = {
    ...params.currentState,
    lastClaimedDateKey: params.effectiveDateKey,
    lastAutoTriggeredDateKey: params.effectiveDateKey,
    streakDays: evalBefore.nextStreakIfClaimed,
    totalDaysClaimed: params.currentState.totalDaysClaimed + 1,
  };

  const evaluationAfter = evaluateDailyLoginState(updatedState, params.effectiveDateKey);

  return {
    claimed: true,
    updatedState,
    reward,
    evaluationAfter,
  };
}

/**
 * Calculates the permanent cultivation bonuses granted by comprehended Veteran Scrolls.
 */
export function calculateVeteranScrollBonuses(comprehendedCount: number = 0): VeteranScrollBonuses {
  const safeCount = Math.max(0, Math.floor(comprehendedCount));
  return {
    comprehendedCount: safeCount,
    passiveSpeedBonusPct: safeCount * 18, // +18% all-path passive Qi/Body/Soul/Mind speed per scroll
    breakthroughSuccessBonusPct: Math.min(35, safeCount * 3), // +3% breakthrough chance per scroll (up to +35%)
    combatResonanceBonusPct: safeCount * 5, // +5% spiritual combat power resonance per scroll
  };
}

/**
 * Uses/comprehends 1 or more 'Veteran Scrolls' on a specific Cultivation Path (or 'all' paths),
 * granting a massive instant cultivation energy surge, Scripture Fragments, Secluded Years,
 * and permanent Veteran Scroll Mastery bonuses.
 */
export function applyVeteranScrollToCultivation(
  cultivation: PlayerCultivationState,
  targetPath: CultivationPath | 'all' = 'all',
  scrollsToUse: number = 1
): {
  success: boolean;
  updatedCultivation: PlayerCultivationState;
  energyGainedByPath: Record<CultivationPath, bigint>;
  fragmentsGained: number;
  yearsGained: number;
  message: string;
} {
  const currentOwned = cultivation.veteranScrolls ?? 0;
  const count = Math.max(1, Math.floor(scrollsToUse));
  const emptyGains: Record<CultivationPath, bigint> = { qi: 0n, body: 0n, soul: 0n, mind: 0n };

  if (currentOwned < count) {
    return {
      success: false,
      updatedCultivation: cultivation,
      energyGainedByPath: emptyGains,
      fragmentsGained: 0,
      yearsGained: 0,
      message:
        'No Veteran Scrolls available in your Cave Abode inventory. Claim Daily Login Rewards to obtain more!',
    };
  }

  const nextPaths = { ...cultivation.paths };
  const energyGainedByPath: Record<CultivationPath, bigint> = {
    qi: 0n,
    body: 0n,
    soul: 0n,
    mind: 0n,
  };

  if (targetPath === 'all') {
    for (const p of CULTIVATION_PATH_LIST) {
      const prog = nextPaths[p];
      const req = calculateQiRequired(prog.realmIndex, prog.layer, p);
      // 35% of required layer energy across ALL 4 paths per scroll
      const gain = ((req * 35n) / 100n + 25_000n) * BigInt(count);
      energyGainedByPath[p] = gain;
      nextPaths[p] = {
        ...prog,
        currentEnergy: prog.currentEnergy + gain,
      };
    }
  } else {
    const prog = nextPaths[targetPath];
    const req = calculateQiRequired(prog.realmIndex, prog.layer, targetPath);
    // 80% of required layer energy for the focused path per scroll
    const gain = ((req * 80n) / 100n + 60_000n) * BigInt(count);
    energyGainedByPath[targetPath] = gain;
    nextPaths[targetPath] = {
      ...prog,
      currentEnergy: prog.currentEnergy + gain,
    };
  }

  const fragmentsGained = 30 * count;
  const yearsGained = 120 * count;
  const nextComprehended = (cultivation.veteranScrollsComprehended ?? 0) + count;
  const bonuses = calculateVeteranScrollBonuses(nextComprehended);

  const updatedCultivation: PlayerCultivationState = {
    ...cultivation,
    currentQi: nextPaths.qi.currentEnergy,
    paths: nextPaths,
    scriptureFragments: cultivation.scriptureFragments + fragmentsGained,
    secludedYears: cultivation.secludedYears + yearsGained,
    veteranScrolls: currentOwned - count,
    veteranScrollsComprehended: nextComprehended,
  };

  const targetDesc =
    targetPath === 'all'
      ? 'All 4 Cultivation Paths (Qi, Body, Soul, Mind)'
      : CULTIVATION_PATH_META[targetPath].name;

  return {
    success: true,
    updatedCultivation,
    energyGainedByPath,
    fragmentsGained,
    yearsGained,
    message: `📜 Comprehended ${count}x Veteran Scroll on ${targetDesc}! Gained +${fragmentsGained} Scripture Fragments, +${yearsGained} Secluded Years, and Permanent Mastery (+${bonuses.passiveSpeedBonusPct}% Cultivation Speed)!`,
  };
}
