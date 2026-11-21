/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import confetti from 'canvas-confetti';
import type { GameResources, MonsterTarget, ResourceType } from '../types/game';
import type { CultivationPath, PlayerCultivationState } from '../types/cultivation';
import { formatBigInt } from '../game/math';
import { sound } from '../game/audio';
import {
  DAILY_LOGIN_STORAGE_KEY,
  INITIAL_DAILY_LOGIN_STATE,
  PersistedDailyLoginState,
  applyVeteranScrollToCultivation,
  claimDailyLoginReward,
  evaluateDailyLoginState,
  getCalendarDateKey,
  getSevenDayRewardSchedule,
} from '../game/dailyLogin';
import {
  DAILY_MISSIONS_STORAGE_KEY,
  DailyMissionBoardState,
  DailyMissionCategory,
  DailyMissionDestinationModal,
  advanceDailyMissionById,
  applyMissionRewardBundle,
  claimDailyMissionMilestone,
  claimDailyMissionReward,
  countClaimableDailyMissions,
  deserializeDailyMissionBoard,
  recordDailyMissionEvent,
  refreshDailyMissionBoard,
  serializeDailyMissionBoard,
  syncBoardForDate,
} from '../game/dailyMissions';
import {
  BillingCycle,
  INITIAL_VIP_SUBSCRIPTION_STATE,
  PersistedVipSubscriptionState,
  VIP_SUBSCRIPTION_STORAGE_KEY,
  VIP_TIER_CONFIGS,
  VipTierId,
  activateVipSubscription,
  claimVipDailyStipend,
  evaluateVipSubscription,
} from '../game/vipSubscription';

export interface UseDailySystemsParams {
  initialCultivation: PlayerCultivationState;
  initialVipState: PersistedVipSubscriptionState;
  castleLevel: number;
  cultivation: PlayerCultivationState;
  resources: GameResources;
  monsters: MonsterTarget[];
  immuneToAllThings: boolean;
  setResources: Dispatch<SetStateAction<GameResources>>;
  setCultivation: Dispatch<SetStateAction<PlayerCultivationState>>;
  setSelectedMonster: Dispatch<SetStateAction<MonsterTarget>>;
  onOpenDestinationModal: (destination: DailyMissionDestinationModal) => void;
  setToastMessage: Dispatch<SetStateAction<string | null>>;
}

export function useDailySystems({
  initialCultivation,
  initialVipState,
  castleLevel,
  cultivation,
  resources,
  monsters,
  immuneToAllThings,
  setResources,
  setCultivation,
  setSelectedMonster,
  onOpenDestinationModal,
  setToastMessage,
}: UseDailySystemsParams) {
  const [dailyLoginState, setDailyLoginState] = useState<PersistedDailyLoginState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(DAILY_LOGIN_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return { ...INITIAL_DAILY_LOGIN_STATE, ...parsed };
        }
      } catch {
        // Fallback to initial state if localStorage is unavailable or malformed
      }
    }
    return INITIAL_DAILY_LOGIN_STATE;
  });

  const [dailyMissionBoard, setDailyMissionBoard] = useState<DailyMissionBoardState>(() => {
    const initDateKey = getCalendarDateKey(new Date(), 0);
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(DAILY_MISSIONS_STORAGE_KEY);
        if (raw) {
          const hydrated = deserializeDailyMissionBoard(raw);
          if (hydrated) {
            return syncBoardForDate(hydrated, initDateKey, initialCultivation);
          }
        }
      } catch {
        // Fallback to freshly generated board
      }
    }
    return syncBoardForDate(null, initDateKey, initialCultivation);
  });

  const [vipState, setVipState] = useState<PersistedVipSubscriptionState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(VIP_SUBSCRIPTION_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PersistedVipSubscriptionState>;
          if (parsed.activeTier && parsed.activeTier !== 'free') {
            return { ...INITIAL_VIP_SUBSCRIPTION_STATE, ...parsed };
          }
        }
      } catch {
        // Fallback to initial state
      }
    }
    return initialVipState;
  });

  const vipEffectiveDateKey = getCalendarDateKey(new Date(), vipState.simulatedVipDayOffset);
  const vipEvaluation = evaluateVipSubscription(vipState, vipEffectiveDateKey);

  const effectiveDateKey = getCalendarDateKey(new Date(), dailyLoginState.simulatedDayOffset);
  const dailyLoginEvaluation = evaluateDailyLoginState(dailyLoginState, effectiveDateKey);
  const dailyRewardSchedule = getSevenDayRewardSchedule({
    castleLevel,
    cultivationRealmIndex: cultivation.paths.qi.realmIndex,
    totalDaysClaimed: dailyLoginState.totalDaysClaimed,
  });

  const activeDailyMissionBoard = syncBoardForDate(
    dailyMissionBoard,
    effectiveDateKey,
    cultivation
  );
  const claimableDailyMissionsCount = countClaimableDailyMissions(activeDailyMissionBoard);
  const dailyMissionsClaimedCount = activeDailyMissionBoard.missions.filter(
    (m) => m.claimed
  ).length;

  useEffect(() => {
    if (dailyMissionBoard.dateKey !== effectiveDateKey) {
      setDailyMissionBoard((prev) => syncBoardForDate(prev, effectiveDateKey, cultivation));
    }
  }, [dailyMissionBoard.dateKey, effectiveDateKey, cultivation]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          DAILY_MISSIONS_STORAGE_KEY,
          serializeDailyMissionBoard(dailyMissionBoard)
        );
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [dailyMissionBoard]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(DAILY_LOGIN_STORAGE_KEY, JSON.stringify(dailyLoginState));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [dailyLoginState]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(VIP_SUBSCRIPTION_STORAGE_KEY, JSON.stringify(vipState));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [vipState]);

  useEffect(() => {
    if (dailyLoginEvaluation.shouldAutoTriggerOnLoad) {
      setDailyLoginState((prev) => ({
        ...prev,
        lastAutoTriggeredDateKey: effectiveDateKey,
      }));
    }
  }, [dailyLoginEvaluation.shouldAutoTriggerOnLoad, effectiveDateKey]);

  const handleClaimDailyLoginReward = () => {
    const result = claimDailyLoginReward({
      currentState: dailyLoginState,
      effectiveDateKey,
      castleLevel,
      cultivationRealmIndex: cultivation.paths.qi.realmIndex,
    });

    if (!result.claimed || !result.reward) return;
    const reward = result.reward;

    setDailyLoginState(result.updatedState);
    setResources((prev) => ({
      wood: prev.wood + reward.resources.wood,
      steel: prev.steel + reward.resources.steel,
      copper: prev.copper + reward.resources.copper,
      grain: prev.grain + reward.resources.grain,
      oil: prev.oil + reward.resources.oil,
      diamond: prev.diamond + reward.resources.diamond,
    }));

    setCultivation((prev) => ({
      ...prev,
      veteranScrolls: (prev.veteranScrolls ?? 0) + reward.veteranScrolls,
      scriptureFragments: prev.scriptureFragments + reward.scriptureFragments,
      spiritStones: (prev.spiritStones ?? 0n) + reward.spiritStones,
    }));

    sound.playUpgradeFanfare();
    confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
    setToastMessage(
      `🎁 Claimed Day ${reward.day} Login Decree: +${formatBigInt(reward.resources.diamond)} 💎, +${reward.veteranScrolls}x Veteran Scroll & Scaled Resources!`
    );
  };

  const handleAdvanceSimulatedDay = () => {
    setDailyLoginState((prev) => ({
      ...prev,
      simulatedDayOffset: (prev.simulatedDayOffset || 0) + 1,
    }));
    setToastMessage('🌅 Advanced calendar by +1 Day! Next Daily Login Decree is now ready.');
  };

  const handleComprehendVeteranScroll = (
    targetPath: CultivationPath | 'all',
    count: number = 1
  ) => {
    const result = applyVeteranScrollToCultivation(cultivation, targetPath, count);
    if (!result.success) {
      setToastMessage(result.message);
      return;
    }
    setCultivation(result.updatedCultivation);
    confetti({ particleCount: 60, spread: 70 });
    setToastMessage(result.message);
  };

  function recordDailyMissionProgress(
    category: DailyMissionCategory,
    delta: number = 1,
    filter?: { path?: CultivationPath; resource?: ResourceType }
  ) {
    setDailyMissionBoard((prev) => {
      const synced = syncBoardForDate(prev, effectiveDateKey, cultivation);
      const res = recordDailyMissionEvent(synced, category, delta, filter);
      return res.updatedBoard;
    });
  }

  const handleAdvanceDailyMission = (missionId: string) => {
    const result = advanceDailyMissionById(activeDailyMissionBoard, missionId, 1);
    if (!result.advancedMission) return;
    setDailyMissionBoard(result.updatedBoard);

    const m = result.advancedMission;
    if (m.completed) {
      sound.playUpgradeFanfare();
      setToastMessage(`Commission complete: "${m.title}" is ready to claim!`);
    } else {
      setToastMessage(`Commission progress: "${m.title}" (${m.currentCount}/${m.targetCount}).`);
    }
  };

  const handleClaimDailyMission = (missionId: string) => {
    const result = claimDailyMissionReward(activeDailyMissionBoard, missionId);
    if (!result.claimed || !result.reward || !result.mission) return;

    setDailyMissionBoard(result.updatedBoard);
    const applied = applyMissionRewardBundle({
      resources,
      cultivation,
      reward: result.reward,
    });
    setResources(applied.nextResources);
    setCultivation(applied.nextCultivation);

    sound.playUpgradeFanfare();
    confetti({ particleCount: 55, spread: 70, origin: { y: 0.65 } });
    setToastMessage(
      `Claimed "${result.mission.title}": +${formatBigInt(result.reward.resources.diamond)} Diamonds, +${formatBigInt(result.reward.spiritStones)} Spirit Stones & scaled materials.`
    );
  };

  const handleClaimDailyMissionMilestone = (milestoneId: 'milestone_3' | 'milestone_5') => {
    const result = claimDailyMissionMilestone(activeDailyMissionBoard, milestoneId);
    if (!result.claimed || !result.reward || !result.milestone) return;

    setDailyMissionBoard(result.updatedBoard);
    const applied = applyMissionRewardBundle({
      resources,
      cultivation,
      reward: result.reward,
    });
    setResources(applied.nextResources);
    setCultivation(applied.nextCultivation);

    sound.playUpgradeFanfare();
    confetti({ particleCount: 75, spread: 85, origin: { y: 0.6 } });
    setToastMessage(
      `Opened ${result.milestone.title}: +${formatBigInt(result.reward.resources.diamond)} Diamonds, +${formatBigInt(result.reward.spiritStones)} Spirit Stones${
        result.reward.veteranScrolls > 0 ? `, +${result.reward.veteranScrolls} Veteran Scroll` : ''
      }!`
    );
  };

  const handleClaimAllDailyMissions = () => {
    let workingBoard = activeDailyMissionBoard;
    let workingResources = resources;
    let workingCultivation = cultivation;
    let totalClaimedCount = 0;
    let totalDiamonds = 0n;
    let totalSpiritStones = 0n;

    for (const mission of workingBoard.missions) {
      if (mission.completed && !mission.claimed) {
        const res = claimDailyMissionReward(workingBoard, mission.id);
        if (res.claimed && res.reward) {
          workingBoard = res.updatedBoard;
          const applied = applyMissionRewardBundle({
            resources: workingResources,
            cultivation: workingCultivation,
            reward: res.reward,
          });
          workingResources = applied.nextResources;
          workingCultivation = applied.nextCultivation;
          totalClaimedCount += 1;
          totalDiamonds += res.reward.resources.diamond;
          totalSpiritStones += res.reward.spiritStones;
        }
      }
    }

    for (const ms of workingBoard.milestones) {
      const msRes = claimDailyMissionMilestone(workingBoard, ms.id);
      if (msRes.claimed && msRes.reward) {
        workingBoard = msRes.updatedBoard;
        const applied = applyMissionRewardBundle({
          resources: workingResources,
          cultivation: workingCultivation,
          reward: msRes.reward,
        });
        workingResources = applied.nextResources;
        workingCultivation = applied.nextCultivation;
        totalClaimedCount += 1;
        totalDiamonds += msRes.reward.resources.diamond;
        totalSpiritStones += msRes.reward.spiritStones;
      }
    }

    if (totalClaimedCount === 0) return;

    setDailyMissionBoard(workingBoard);
    setResources(workingResources);
    setCultivation(workingCultivation);
    sound.playUpgradeFanfare();
    confetti({ particleCount: 85, spread: 90, origin: { y: 0.6 } });
    setToastMessage(
      `Claimed ${totalClaimedCount} daily mission rewards: +${formatBigInt(totalDiamonds)} Diamonds & +${formatBigInt(totalSpiritStones)} Spirit Stones!`
    );
  };

  const handleRefreshDailyMissionBoard = () => {
    const res = refreshDailyMissionBoard({
      board: activeDailyMissionBoard,
      cultivation,
      playerDiamonds: resources.diamond,
      bypassCost: immuneToAllThings,
    });

    if (!res.ok) {
      setToastMessage(res.reason || 'Unable to refresh daily mission board.');
      return;
    }

    if (res.diamondCostPaid > 0n) {
      setResources((prev) => ({
        ...prev,
        diamond: prev.diamond - res.diamondCostPaid,
      }));
    }

    setDailyMissionBoard(res.updatedBoard);
    setToastMessage(
      `Generated 5 randomized commissions for Cycle ${res.updatedBoard.cycleIndex} scaled to your cultivation realm.`
    );
  };

  const handleNavigateFromDailyMission = (destination: DailyMissionDestinationModal) => {
    if (destination === 'world_boss') {
      setSelectedMonster(monsters[monsters.length - 1]);
    }
    onOpenDestinationModal(destination);
  };

  const handleActivateVipTier = (
    tierId: VipTierId,
    billingCycle: BillingCycle,
    paymentMethod: 'diamonds'
  ) => {
    if (paymentMethod !== 'diamonds') return;
    const targetConfig = VIP_TIER_CONFIGS[tierId];
    const diamondCost =
      billingCycle === 'annual' ? targetConfig.annualDiamondCost : targetConfig.monthlyDiamondCost;

    if (!immuneToAllThings && resources.diamond < diamondCost) {
      setToastMessage('⚠️ Insufficient Diamonds in treasury for this VIP tier.');
      return;
    }

    const activation = activateVipSubscription(vipState, tierId, billingCycle, vipEffectiveDateKey);
    setVipState(activation.nextState);

    setResources((prev) => ({
      ...prev,
      diamond:
        prev.diamond - (!immuneToAllThings ? diamondCost : 0n) + activation.instantBonusDiamonds,
    }));

    confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    setToastMessage(
      `👑 Unlocked ${targetConfig.name} (${billingCycle === 'annual' ? 'Annual' : 'Monthly'}) with ${formatBigInt(diamondCost)} 💎! Gained +${formatBigInt(activation.instantBonusDiamonds)} 💎 rebate & +${activation.pointsAdded} VIP Loyalty Pts!`
    );
  };

  const handleClaimVipStipend = () => {
    const result = claimVipDailyStipend(vipState, vipEffectiveDateKey);
    if (!result.claimed) return;

    setVipState(result.nextState);
    const stipend = result.stipend;

    setResources((prev) => ({
      wood: prev.wood + stipend.resources.wood,
      steel: prev.steel + stipend.resources.steel,
      copper: prev.copper + stipend.resources.copper,
      grain: prev.grain + stipend.resources.grain,
      oil: prev.oil + stipend.resources.oil,
      diamond: prev.diamond + stipend.diamonds,
    }));

    setCultivation((prev) => ({
      ...prev,
      spiritStones: (prev.spiritStones ?? 0n) + stipend.spiritStones,
      veteranScrolls: (prev.veteranScrolls ?? 0) + stipend.veteranScrolls,
      secludedYears: prev.secludedYears + stipend.secludedYears,
      scriptureFragments: prev.scriptureFragments + stipend.scriptureFragments,
    }));

    confetti({ particleCount: 70, spread: 75, origin: { y: 0.6 } });
    setToastMessage(
      `👑 Claimed ${vipEvaluation.tierConfig.name} Daily Stipend: +${formatBigInt(stipend.diamonds)} 💎, +${formatBigInt(stipend.spiritStones)} Spirit Stones & +${stipend.veteranScrolls} Veteran Scrolls!`
    );
  };

  const handleAdvanceSimulatedVipDay = () => {
    setVipState((prev) => {
      const nextDaysRemaining =
        prev.expiresAtDaysRemaining > 1
          ? prev.expiresAtDaysRemaining - 1
          : prev.autoRenewEnabled && prev.activeTier !== 'free'
            ? prev.billingCycle === 'annual'
              ? 365
              : 30
            : 0;
      const nextActiveTier = nextDaysRemaining > 0 ? prev.activeTier : 'free';
      if (nextActiveTier === 'free') {
        setCultivation((c) => ({ ...c, auraOverrideRealmIndex: null }));
      }
      return {
        ...prev,
        activeTier: nextActiveTier,
        simulatedVipDayOffset: (prev.simulatedVipDayOffset || 0) + 1,
        expiresAtDaysRemaining: nextDaysRemaining,
      };
    });
    setToastMessage('🌅 Advanced VIP Covenant calendar by +1 Day! Daily VIP Stipend is now ready.');
  };

  const handleToggleVipAutoRenew = () => {
    setVipState((prev) => {
      const next = !prev.autoRenewEnabled;
      setToastMessage(
        `🔄 VIP Auto-Renewal turned ${next ? 'ON' : 'OFF'}. You can change this at any time.`
      );
      return { ...prev, autoRenewEnabled: next };
    });
  };

  const handleCancelVipSubscription = () => {
    setVipState((prev) => ({
      ...prev,
      activeTier: 'free',
      expiresAtDaysRemaining: 0,
      autoRenewEnabled: false,
    }));
    setCultivation((prev) => ({
      ...prev,
      auraOverrideRealmIndex: null,
    }));
    setToastMessage(
      '🛡️ VIP Membership cancelled and reverted to Free Sovereign. All VIP-locked features have been re-locked.'
    );
  };

  return {
    dailyLoginState,
    setDailyLoginState,
    dailyMissionBoard,
    setDailyMissionBoard,
    vipState,
    setVipState,
    vipEffectiveDateKey,
    vipEvaluation,
    effectiveDateKey,
    dailyLoginEvaluation,
    dailyRewardSchedule,
    activeDailyMissionBoard,
    claimableDailyMissionsCount,
    dailyMissionsClaimedCount,
    handleClaimDailyLoginReward,
    handleAdvanceSimulatedDay,
    handleComprehendVeteranScroll,
    recordDailyMissionProgress,
    handleAdvanceDailyMission,
    handleClaimDailyMission,
    handleClaimDailyMissionMilestone,
    handleClaimAllDailyMissions,
    handleRefreshDailyMissionBoard,
    handleNavigateFromDailyMission,
    handleActivateVipTier,
    handleClaimVipStipend,
    handleAdvanceSimulatedVipDay,
    handleToggleVipAutoRenew,
    handleCancelVipSubscription,
  };
}
