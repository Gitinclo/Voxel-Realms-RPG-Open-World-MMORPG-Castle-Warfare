/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameResources } from '../types/game';

export const VIP_SUBSCRIPTION_STORAGE_KEY = 'voxel_realms_vip_subscription_v1';

export type VipTierId = 'free' | 'silver_vanguard' | 'golden_immortal' | 'celestial_sovereign';

export type BillingCycle = 'monthly' | 'annual';

export interface VipDailyStipend {
  diamonds: bigint;
  spiritStones: bigint;
  veteranScrolls: number;
  secludedYears: number;
  scriptureFragments: number;
  resources: Omit<GameResources, 'diamond'>;
}

export interface VipTierConfig {
  id: VipTierId;
  rank: number; // 0, 1, 2, 3
  name: string;
  subtitle: string;
  badgeLabel: string;
  accentColor: 'slate' | 'cyan' | 'amber' | 'purple';
  monthlyPriceUsd: string;
  annualPriceUsd: string;
  monthlyDiamondCost: bigint;
  annualDiamondCost: bigint;
  instantActivationDiamonds: bigint;
  vipPointsPerDay: number;
  instantVipPoints: number;
  perks: {
    cultivationSpeedBonusPct: number;
    gatherSpeedBonusPct: number;
    combatMightBonusPct: number;
    rallyCapacityBonusPct: number;
    castleUpgradeDiscountPct: number;
    extraMarchQueues: number;
    instantTribulationShield: boolean;
    customAuraCrown: boolean;
  };
  dailyStipend: VipDailyStipend;
  featureHighlights: string[];
}

export interface PersistedVipSubscriptionState {
  activeTier: VipTierId;
  billingCycle: BillingCycle;
  subscribedAtDateKey: string | null;
  expiresAtDaysRemaining: number;
  autoRenewEnabled: boolean;
  lastStipendClaimDateKey: string | null;
  totalStipendsClaimed: number;
  vipLoyaltyPoints: number;
  simulatedVipDayOffset: number;
}

export interface VipSubscriptionEvaluation {
  tierConfig: VipTierConfig;
  isActiveSubscriber: boolean;
  canClaimDailyStipend: boolean;
  vipLoyaltyLevel: number;
  nextLevelPointsRequired: number;
  currentLevelProgressPct: number;
  loyaltyCombatBonusPct: number;
  totalEffectiveCultivationMultiplier: number;
  totalEffectiveGatherMultiplier: number;
  totalEffectiveCombatMultiplier: number;
  castleDiscountMultiplier: number;
}

export const VIP_TIER_CONFIGS: Record<VipTierId, VipTierConfig> = {
  free: {
    id: 'free',
    rank: 0,
    name: 'Free Sovereign',
    subtitle: 'Standard Citizen of Solara Citadel',
    badgeLabel: 'VIP 0',
    accentColor: 'slate',
    monthlyPriceUsd: '$0.00',
    annualPriceUsd: '$0.00',
    monthlyDiamondCost: 0n,
    annualDiamondCost: 0n,
    instantActivationDiamonds: 0n,
    vipPointsPerDay: 10,
    instantVipPoints: 0,
    perks: {
      cultivationSpeedBonusPct: 0,
      gatherSpeedBonusPct: 0,
      combatMightBonusPct: 0,
      rallyCapacityBonusPct: 0,
      castleUpgradeDiscountPct: 0,
      extraMarchQueues: 0,
      instantTribulationShield: false,
      customAuraCrown: false,
    },
    dailyStipend: {
      diamonds: 500n,
      spiritStones: 1_000n,
      veteranScrolls: 0,
      secludedYears: 10,
      scriptureFragments: 2,
      resources: {
        wood: 25_000n,
        steel: 20_000n,
        copper: 15_000n,
        grain: 30_000n,
        oil: 10_000n,
      },
    },
    featureHighlights: [
      'Standard 1.0x Four-Path Cultivation & Gathering rate',
      'Daily Citizen Ration Box (500 Diamonds + 1,000 Spirit Stones)',
      'Full access to 23 Realms & Castle Level 100 progression',
    ],
  },
  silver_vanguard: {
    id: 'silver_vanguard',
    rank: 1,
    name: 'Silver Vanguard Pass',
    subtitle: 'Outer Sect Elder & Citadel Commander',
    badgeLabel: 'VIP 1 · SILVER',
    accentColor: 'cyan',
    monthlyPriceUsd: '$4.99',
    annualPriceUsd: '$47.88',
    monthlyDiamondCost: 12_500n,
    annualDiamondCost: 120_000n,
    instantActivationDiamonds: 6_000n,
    vipPointsPerDay: 120,
    instantVipPoints: 600,
    perks: {
      cultivationSpeedBonusPct: 25,
      gatherSpeedBonusPct: 25,
      combatMightBonusPct: 15,
      rallyCapacityBonusPct: 10,
      castleUpgradeDiscountPct: 15,
      extraMarchQueues: 1,
      instantTribulationShield: false,
      customAuraCrown: false,
    },
    dailyStipend: {
      diamonds: 5_000n,
      spiritStones: 12_000n,
      veteranScrolls: 1,
      secludedYears: 60,
      scriptureFragments: 8,
      resources: {
        wood: 350_000n,
        steel: 300_000n,
        copper: 250_000n,
        grain: 400_000n,
        oil: 180_000n,
      },
    },
    featureHighlights: [
      '+25% Four-Path Cultivation Qi, Body, Soul & Mind Speed',
      '+25% Resource Node Harvest Speed & -15% Castle Upgrade Cost',
      '+15% All-Troop Combat Might & +10% Rally Capacity',
      'Daily Stipend: 5,000 Diamonds, 12,000 Spirit Stones & 1 Veteran Scroll',
    ],
  },
  golden_immortal: {
    id: 'golden_immortal',
    rank: 2,
    name: 'Golden Immortal Covenant',
    subtitle: 'Grand Sect Patriarch & Imperial Warlord',
    badgeLabel: 'VIP 2 · GOLD',
    accentColor: 'amber',
    monthlyPriceUsd: '$9.99',
    annualPriceUsd: '$95.88',
    monthlyDiamondCost: 25_000n,
    annualDiamondCost: 240_000n,
    instantActivationDiamonds: 15_000n,
    vipPointsPerDay: 300,
    instantVipPoints: 1_800,
    perks: {
      cultivationSpeedBonusPct: 60,
      gatherSpeedBonusPct: 50,
      combatMightBonusPct: 35,
      rallyCapacityBonusPct: 25,
      castleUpgradeDiscountPct: 25,
      extraMarchQueues: 2,
      instantTribulationShield: true,
      customAuraCrown: true,
    },
    dailyStipend: {
      diamonds: 18_000n,
      spiritStones: 40_000n,
      veteranScrolls: 2,
      secludedYears: 180,
      scriptureFragments: 20,
      resources: {
        wood: 1_500_000n,
        steel: 1_250_000n,
        copper: 1_000_000n,
        grain: 1_800_000n,
        oil: 900_000n,
      },
    },
    featureHighlights: [
      '+60% Four-Path Cultivation Speed & Heavenly Tribulation Ward',
      '+50% Resource Node Harvest Speed & -25% Castle Upgrade Cost',
      '+35% All-Troop Combat Might & +25% World Boss Rally Capacity',
      'Daily Stipend: 18,000 Diamonds, 40,000 Spirit Stones & 2 Veteran Scrolls',
    ],
  },
  celestial_sovereign: {
    id: 'celestial_sovereign',
    rank: 3,
    name: 'Celestial Dao Sovereign',
    subtitle: 'Supreme Hidden Ancestor & Eternal Overlord',
    badgeLabel: 'VIP 3 · CELESTIAL',
    accentColor: 'purple',
    monthlyPriceUsd: '$19.99',
    annualPriceUsd: '$191.88',
    monthlyDiamondCost: 50_000n,
    annualDiamondCost: 480_000n,
    instantActivationDiamonds: 45_000n,
    vipPointsPerDay: 750,
    instantVipPoints: 5_000,
    perks: {
      cultivationSpeedBonusPct: 120,
      gatherSpeedBonusPct: 100,
      combatMightBonusPct: 75,
      rallyCapacityBonusPct: 50,
      castleUpgradeDiscountPct: 35,
      extraMarchQueues: 4,
      instantTribulationShield: true,
      customAuraCrown: true,
    },
    dailyStipend: {
      diamonds: 50_000n,
      spiritStones: 120_000n,
      veteranScrolls: 4,
      secludedYears: 500,
      scriptureFragments: 50,
      resources: {
        wood: 6_000_000n,
        steel: 5_000_000n,
        copper: 4_500_000n,
        grain: 7_500_000n,
        oil: 3_500_000n,
      },
    },
    featureHighlights: [
      '+120% Four-Path Cultivation Speed (2.2x Qi/Body/Soul/Mind Absorption)',
      '+100% Resource Node Harvest Speed (2.0x Yield) & -35% Castle Upgrade Cost',
      '+75% All-Troop Combat Might & +50% World Boss Rally Capacity',
      'Daily Stipend: 50,000 Diamonds, 120,000 Spirit Stones, 4 Veteran Scrolls & 500 Secluded Years',
    ],
  },
};

export const VIP_TIER_LIST: VipTierConfig[] = [
  VIP_TIER_CONFIGS.free,
  VIP_TIER_CONFIGS.silver_vanguard,
  VIP_TIER_CONFIGS.golden_immortal,
  VIP_TIER_CONFIGS.celestial_sovereign,
];

export const INITIAL_VIP_SUBSCRIPTION_STATE: PersistedVipSubscriptionState = {
  activeTier: 'free',
  billingCycle: 'monthly',
  subscribedAtDateKey: null,
  expiresAtDaysRemaining: 0,
  autoRenewEnabled: true,
  lastStipendClaimDateKey: null,
  totalStipendsClaimed: 0,
  vipLoyaltyPoints: 250, // Starts at VIP Loyalty Lv.1
  simulatedVipDayOffset: 0,
};

/**
 * Calculates VIP Loyalty Level (1 to 15) from cumulative VIP Loyalty Points.
 */
export function calculateVipLoyaltyStatus(points: number): {
  level: number;
  nextLevelPointsRequired: number;
  currentLevelProgressPct: number;
  loyaltyCombatBonusPct: number;
} {
  const safePoints = Math.max(0, Math.floor(points));
  // Thresholds for VIP Loyalty Levels 1..15
  const thresholds = [
    0, 200, 600, 1200, 2200, 3600, 5500, 8000, 11500, 16000, 22000, 30000, 40000, 55000, 75000,
  ];

  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (safePoints >= thresholds[i]) {
      level = i + 1;
    } else {
      break;
    }
  }

  const currentFloor = thresholds[level - 1] ?? 0;
  const nextThreshold = thresholds[level] ?? thresholds[thresholds.length - 1];
  const progressPct =
    level >= thresholds.length
      ? 100
      : Math.min(
          100,
          Math.max(
            0,
            Math.round(((safePoints - currentFloor) / (nextThreshold - currentFloor)) * 100)
          )
        );

  return {
    level,
    nextLevelPointsRequired: nextThreshold,
    currentLevelProgressPct: progressPct,
    loyaltyCombatBonusPct: level * 2, // +2% per VIP Loyalty Level (up to +30%)
  };
}

export type VipProtectedFeature =
  | 'barracks_speed_up'
  | 'barracks_instant_finish'
  | 'barracks_multi_queue'
  | 'tribulation_ward_shield'
  | 'custom_aura_crown'
  | 'extra_gather_march'
  | 'castle_upgrade_discount'
  | 'rally_capacity_boost';

export interface VipAccessCheckResult {
  allowed: boolean;
  effectiveTier: VipTierId;
  effectiveRank: number;
  requiredTierName: string;
  requiredRank: number;
  reason: string;
  maxAllowedQueues: number;
}

/**
 * Evaluates current VIP subscription status, multipliers, and daily stipend eligibility.
 * Enforces strict validation so expired, unsubscribed, or malformed states always resolve to 'free'.
 */
export function evaluateVipSubscription(
  state: PersistedVipSubscriptionState,
  currentDateKey: string
): VipSubscriptionEvaluation {
  const hasValidPaidTier =
    state.activeTier === 'silver_vanguard' ||
    state.activeTier === 'golden_immortal' ||
    state.activeTier === 'celestial_sovereign';

  const isActiveSubscriber =
    hasValidPaidTier &&
    typeof state.expiresAtDaysRemaining === 'number' &&
    Number.isFinite(state.expiresAtDaysRemaining) &&
    state.expiresAtDaysRemaining > 0 &&
    typeof state.subscribedAtDateKey === 'string' &&
    state.subscribedAtDateKey.trim().length > 0;

  const effectiveTierId: VipTierId = isActiveSubscriber ? state.activeTier : 'free';
  const tierConfig = VIP_TIER_CONFIGS[effectiveTierId] || VIP_TIER_CONFIGS.free;

  const canClaimDailyStipend = state.lastStipendClaimDateKey !== currentDateKey;
  const loyalty = calculateVipLoyaltyStatus(state.vipLoyaltyPoints);

  const totalEffectiveCultivationMultiplier = 1 + tierConfig.perks.cultivationSpeedBonusPct / 100;
  const totalEffectiveGatherMultiplier = 1 + tierConfig.perks.gatherSpeedBonusPct / 100;
  const totalEffectiveCombatMultiplier =
    1 + (tierConfig.perks.combatMightBonusPct + loyalty.loyaltyCombatBonusPct) / 100;
  const castleDiscountMultiplier = Math.max(
    0.5,
    1 - tierConfig.perks.castleUpgradeDiscountPct / 100
  );

  return {
    tierConfig,
    isActiveSubscriber,
    canClaimDailyStipend,
    vipLoyaltyLevel: loyalty.level,
    nextLevelPointsRequired: loyalty.nextLevelPointsRequired,
    currentLevelProgressPct: loyalty.currentLevelProgressPct,
    loyaltyCombatBonusPct: loyalty.loyaltyCombatBonusPct,
    totalEffectiveCultivationMultiplier,
    totalEffectiveGatherMultiplier,
    totalEffectiveCombatMultiplier,
    castleDiscountMultiplier,
  };
}

/**
 * Authoritative access-control gatekeeper for all VIP-protected premium features.
 * Verifies active subscription state before permitting premium actions.
 */
export function checkVipFeatureAccess(
  state: PersistedVipSubscriptionState,
  currentDateKey: string,
  feature: VipProtectedFeature,
  context?: {
    currentQueueCount?: number;
    activeGatherMarches?: number;
  }
): VipAccessCheckResult {
  const evaluation = evaluateVipSubscription(state, currentDateKey);
  const { tierConfig } = evaluation;
  const effectiveTier = tierConfig.id;
  const effectiveRank = tierConfig.rank;

  switch (feature) {
    case 'barracks_speed_up': {
      const allowed = effectiveRank >= 1;
      return {
        allowed,
        effectiveTier,
        effectiveRank,
        requiredTierName: VIP_TIER_CONFIGS.silver_vanguard.name,
        requiredRank: 1,
        reason: allowed
          ? 'VIP Drill Acceleration authorized.'
          : 'Requires active VIP 1 (Silver Vanguard) or higher to accelerate troop training.',
        maxAllowedQueues: tierConfig.perks.extraMarchQueues,
      };
    }

    case 'barracks_instant_finish': {
      const allowed = effectiveRank >= 2;
      return {
        allowed,
        effectiveTier,
        effectiveRank,
        requiredTierName: VIP_TIER_CONFIGS.golden_immortal.name,
        requiredRank: 2,
        reason: allowed
          ? 'VIP Instant Mobilization authorized.'
          : 'Requires active VIP 2 (Golden Immortal) or higher for instant batch completion.',
        maxAllowedQueues: tierConfig.perks.extraMarchQueues,
      };
    }

    case 'barracks_multi_queue': {
      const maxAllowedQueues = tierConfig.perks.extraMarchQueues;
      const currentQueueCount = Math.max(0, context?.currentQueueCount ?? 0);
      const allowed = effectiveRank >= 1 && currentQueueCount < maxAllowedQueues;
      const nextRank = Math.min(3, Math.max(1, effectiveRank + 1));
      const requiredTier =
        VIP_TIER_LIST.find((t) => t.rank === nextRank) || VIP_TIER_CONFIGS.silver_vanguard;

      return {
        allowed,
        effectiveTier,
        effectiveRank,
        requiredTierName: requiredTier.name,
        requiredRank: nextRank,
        reason: allowed
          ? `Queue slot authorized (${currentQueueCount + 1}/${maxAllowedQueues}).`
          : effectiveRank === 0
            ? 'Multi-batch training queue requires active VIP 1 (Silver Vanguard) or higher.'
            : `Reached ${tierConfig.badgeLabel} queue limit (${maxAllowedQueues} extra batches). Upgrade VIP tier for more slots.`,
        maxAllowedQueues,
      };
    }

    case 'tribulation_ward_shield': {
      const allowed = tierConfig.perks.instantTribulationShield;
      return {
        allowed,
        effectiveTier,
        effectiveRank,
        requiredTierName: VIP_TIER_CONFIGS.golden_immortal.name,
        requiredRank: 2,
        reason: allowed
          ? 'Heavenly Tribulation Ward authorized.'
          : 'Requires active VIP 2 (Golden Immortal) or higher to invoke the Heavenly Tribulation Ward.',
        maxAllowedQueues: tierConfig.perks.extraMarchQueues,
      };
    }

    case 'custom_aura_crown': {
      const allowed = tierConfig.perks.customAuraCrown;
      return {
        allowed,
        effectiveTier,
        effectiveRank,
        requiredTierName: VIP_TIER_CONFIGS.golden_immortal.name,
        requiredRank: 2,
        reason: allowed
          ? 'Sovereign Aura & Great Dao Halo customization authorized.'
          : 'Requires active VIP 2 (Golden Immortal) or higher to customize 3D Sovereign Aura & Great Dao Halos.',
        maxAllowedQueues: tierConfig.perks.extraMarchQueues,
      };
    }

    case 'extra_gather_march': {
      const maxAllowedQueues = 1 + tierConfig.perks.extraMarchQueues;
      const activeGatherMarches = Math.max(0, context?.activeGatherMarches ?? 0);
      const allowed = activeGatherMarches < maxAllowedQueues;
      const nextRank = Math.min(3, Math.max(1, effectiveRank + 1));
      const requiredTier =
        VIP_TIER_LIST.find((t) => t.rank === nextRank) || VIP_TIER_CONFIGS.silver_vanguard;

      return {
        allowed,
        effectiveTier,
        effectiveRank,
        requiredTierName: requiredTier.name,
        requiredRank: nextRank,
        reason: allowed
          ? `Gathering march authorized (${activeGatherMarches + 1}/${maxAllowedQueues}).`
          : `Reached ${tierConfig.badgeLabel} simultaneous gathering march limit (${maxAllowedQueues}). Upgrade VIP tier to dispatch up to 5 marches.`,
        maxAllowedQueues,
      };
    }

    case 'castle_upgrade_discount': {
      const allowed = tierConfig.perks.castleUpgradeDiscountPct > 0;
      return {
        allowed,
        effectiveTier,
        effectiveRank,
        requiredTierName: VIP_TIER_CONFIGS.silver_vanguard.name,
        requiredRank: 1,
        reason: allowed
          ? `VIP -${tierConfig.perks.castleUpgradeDiscountPct}% Castle Upgrade Discount active.`
          : 'Requires active VIP 1+ for Castle Upgrade resource discounts.',
        maxAllowedQueues: tierConfig.perks.extraMarchQueues,
      };
    }

    case 'rally_capacity_boost': {
      const allowed = tierConfig.perks.rallyCapacityBonusPct > 0;
      return {
        allowed,
        effectiveTier,
        effectiveRank,
        requiredTierName: VIP_TIER_CONFIGS.silver_vanguard.name,
        requiredRank: 1,
        reason: allowed
          ? `VIP +${tierConfig.perks.rallyCapacityBonusPct}% Rally Capacity Bonus active.`
          : 'Requires active VIP 1+ for Rally Capacity boost.',
        maxAllowedQueues: tierConfig.perks.extraMarchQueues,
      };
    }
  }
}

/**
 * Calculates effective Rally Capacity with active VIP rallyCapacityBonusPct applied.
 */
export function calculateVipRallyCapacity(
  baseRallyCapacity: bigint,
  evaluation: VipSubscriptionEvaluation
): bigint {
  const bonusPct = Math.max(0, evaluation.tierConfig.perks.rallyCapacityBonusPct);
  if (bonusPct === 0) return baseRallyCapacity;
  return (baseRallyCapacity * BigInt(100 + bonusPct)) / 100n;
}

/**
 * Activates or upgrades a VIP subscription tier and returns the updated state and instant bonus.
 */
export function activateVipSubscription(
  prevState: PersistedVipSubscriptionState,
  targetTier: VipTierId,
  billingCycle: BillingCycle,
  currentDateKey: string
): {
  nextState: PersistedVipSubscriptionState;
  instantBonusDiamonds: bigint;
  pointsAdded: number;
} {
  const config = VIP_TIER_CONFIGS[targetTier];
  if (targetTier === 'free') {
    return {
      nextState: {
        ...prevState,
        activeTier: 'free',
        expiresAtDaysRemaining: 0,
        autoRenewEnabled: false,
      },
      instantBonusDiamonds: 0n,
      pointsAdded: 0,
    };
  }

  const cycleDays = billingCycle === 'annual' ? 365 : 30;
  const cycleMultiplier = billingCycle === 'annual' ? 3 : 1;
  const instantBonusDiamonds = config.instantActivationDiamonds * BigInt(cycleMultiplier);
  const pointsAdded = config.instantVipPoints * cycleMultiplier;

  const isSameTierRenewal =
    prevState.activeTier === targetTier && prevState.expiresAtDaysRemaining > 0;

  return {
    nextState: {
      ...prevState,
      activeTier: targetTier,
      billingCycle,
      subscribedAtDateKey: currentDateKey,
      expiresAtDaysRemaining: isSameTierRenewal
        ? prevState.expiresAtDaysRemaining + cycleDays
        : cycleDays,
      autoRenewEnabled: true,
      vipLoyaltyPoints: prevState.vipLoyaltyPoints + pointsAdded,
    },
    instantBonusDiamonds,
    pointsAdded,
  };
}

/**
 * Claims the daily VIP stipend for the current calendar day.
 */
export function claimVipDailyStipend(
  prevState: PersistedVipSubscriptionState,
  currentDateKey: string
): {
  claimed: boolean;
  nextState: PersistedVipSubscriptionState;
  stipend: VipDailyStipend;
  pointsEarned: number;
} {
  const evaluation = evaluateVipSubscription(prevState, currentDateKey);
  if (!evaluation.canClaimDailyStipend) {
    return {
      claimed: false,
      nextState: prevState,
      stipend: evaluation.tierConfig.dailyStipend,
      pointsEarned: 0,
    };
  }

  const pointsEarned = evaluation.tierConfig.vipPointsPerDay;

  return {
    claimed: true,
    nextState: {
      ...prevState,
      lastStipendClaimDateKey: currentDateKey,
      totalStipendsClaimed: prevState.totalStipendsClaimed + 1,
      vipLoyaltyPoints: prevState.vipLoyaltyPoints + pointsEarned,
    },
    stipend: evaluation.tierConfig.dailyStipend,
    pointsEarned,
  };
}

/**
 * Applies the active VIP Castle Upgrade Discount to a base resource cost object.
 */
export function applyVipDiscountToCosts(
  baseCosts: GameResources,
  discountPct: number
): GameResources {
  const clampedDiscount = Math.min(50, Math.max(0, Math.floor(discountPct)));
  if (clampedDiscount <= 0) return baseCosts;
  const multiplier = BigInt(100 - clampedDiscount);

  return {
    wood: (baseCosts.wood * multiplier) / 100n,
    steel: (baseCosts.steel * multiplier) / 100n,
    copper: (baseCosts.copper * multiplier) / 100n,
    grain: (baseCosts.grain * multiplier) / 100n,
    oil: (baseCosts.oil * multiplier) / 100n,
    diamond: (baseCosts.diamond * multiplier) / 100n,
  };
}
