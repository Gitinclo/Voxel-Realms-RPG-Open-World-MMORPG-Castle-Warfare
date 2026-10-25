/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Shield,
  Crosshair,
  Bomb,
  Swords,
  Users,
  Sparkles,
  Clock,
  FastForward,
  CheckCircle2,
  XCircle,
  Lock,
  Crown,
} from 'lucide-react';
import { TroopType, GameResources, PlayerTroopRoster } from '../types/game';
import { getTroopTierInfo, formatBigInt } from '../game/math';
import {
  TroopTrainingJob,
  calculateTrainingDurationMs,
  evaluateTrainingJob,
  accelerateTrainingJob,
  completeTrainingJobInstantly,
  formatTrainingCountdown,
} from '../game/troopTraining';
import {
  INITIAL_VIP_SUBSCRIPTION_STATE,
  PersistedVipSubscriptionState,
  checkVipFeatureAccess,
  evaluateVipSubscription,
} from '../game/vipSubscription';
import { sound } from '../game/audio';

interface TroopBarracksModalProps {
  troops: PlayerTroopRoster;
  resources: GameResources;
  castleLevel: number;
  maxCapacity: bigint;
  vipSpeedBonusPct?: number;
  vipState?: PersistedVipSubscriptionState;
  vipEffectiveDateKey?: string;
  onOpenVipSubscription?: () => void;
  onTrainTroops: (
    type: TroopType,
    tier: number,
    amount: bigint,
    cost: Partial<GameResources>
  ) => void;
  onClose: () => void;
}

export const TroopBarracksModal: React.FC<TroopBarracksModalProps> = ({
  troops,
  resources,
  castleLevel,
  maxCapacity,
  vipSpeedBonusPct = 0,
  vipState = INITIAL_VIP_SUBSCRIPTION_STATE,
  vipEffectiveDateKey = '2026-01-01',
  onOpenVipSubscription,
  onTrainTroops,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<TroopType>('shieldbearer');
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [trainMultiplier, setTrainMultiplier] = useState<bigint>(1000n);

  // Active & queued training jobs
  const [activeJob, setActiveJob] = useState<TroopTrainingJob | null>(null);
  const [queuedJobs, setQueuedJobs] = useState<TroopTrainingJob[]>([]);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [lastCompletedBanner, setLastCompletedBanner] = useState<string | null>(null);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  const onTrainTroopsRef = useRef(onTrainTroops);
  useEffect(() => {
    onTrainTroopsRef.current = onTrainTroops;
  }, [onTrainTroops]);

  // Evaluate VIP access control for premium barracks features
  const vipEvaluation = evaluateVipSubscription(vipState, vipEffectiveDateKey);
  const speedUpAccess = checkVipFeatureAccess(vipState, vipEffectiveDateKey, 'barracks_speed_up');
  const instantFinishAccess = checkVipFeatureAccess(
    vipState,
    vipEffectiveDateKey,
    'barracks_instant_finish'
  );
  const multiQueueAccess = checkVipFeatureAccess(
    vipState,
    vipEffectiveDateKey,
    'barracks_multi_queue',
    { currentQueueCount: queuedJobs.length }
  );
  const maxQueueSlots = vipEvaluation.tierConfig.perks.extraMarchQueues;

  const currentInfo = getTroopTierInfo(selectedType, selectedTier);

  // Calculate total currently trained troops across all types and tiers
  const totalTroopsCount = Object.values(troops).reduce((sum, cur) => sum + cur, 0n);

  // Calculate committed resources and troop count across active + queued jobs
  const allPendingJobs = activeJob ? [activeJob, ...queuedJobs] : queuedJobs;
  const reservedTroops = allPendingJobs.reduce((sum, j) => sum + j.amount, 0n);
  const reservedWood = allPendingJobs.reduce((sum, j) => sum + (j.costPaid.wood || 0n), 0n);
  const reservedSteel = allPendingJobs.reduce((sum, j) => sum + (j.costPaid.steel || 0n), 0n);
  const reservedCopper = allPendingJobs.reduce((sum, j) => sum + (j.costPaid.copper || 0n), 0n);
  const reservedGrain = allPendingJobs.reduce((sum, j) => sum + (j.costPaid.grain || 0n), 0n);
  const reservedOil = allPendingJobs.reduce((sum, j) => sum + (j.costPaid.oil || 0n), 0n);
  const reservedDiamond = allPendingJobs.reduce((sum, j) => sum + (j.costPaid.diamond || 0n), 0n);

  const availableResources: GameResources = {
    wood: resources.wood > reservedWood ? resources.wood - reservedWood : 0n,
    steel: resources.steel > reservedSteel ? resources.steel - reservedSteel : 0n,
    copper: resources.copper > reservedCopper ? resources.copper - reservedCopper : 0n,
    grain: resources.grain > reservedGrain ? resources.grain - reservedGrain : 0n,
    oil: resources.oil > reservedOil ? resources.oil - reservedOil : 0n,
    diamond: resources.diamond > reservedDiamond ? resources.diamond - reservedDiamond : 0n,
  };

  // Max unlocked tier based on castle level (Tier 1 at lv 0, up to Tier 20 at Lv 95+)
  const maxUnlockedTier = Math.min(20, Math.max(1, Math.floor(castleLevel / 5) + 1));

  // Required resources for the selected training batch
  const totalWood = currentInfo.woodCost * trainMultiplier;
  const totalSteel = currentInfo.steelCost * trainMultiplier;
  const totalCopper = currentInfo.copperCost * trainMultiplier;
  const totalGrain = currentInfo.grainCost * trainMultiplier;
  const totalOil = currentInfo.oilCost * trainMultiplier;
  const totalDiamond = currentInfo.diamondCost * trainMultiplier;

  // Estimated training duration for the currently selected tier & batch size
  const durationEstimate = calculateTrainingDurationMs({
    tier: selectedTier,
    amount: trainMultiplier,
    castleLevel,
    vipSpeedBonusPct,
  });

  const queueFull = Boolean(activeJob) && queuedJobs.length >= maxQueueSlots;

  const canAfford =
    !queueFull &&
    availableResources.wood >= totalWood &&
    availableResources.steel >= totalSteel &&
    availableResources.copper >= totalCopper &&
    availableResources.grain >= totalGrain &&
    availableResources.oil >= totalOil &&
    availableResources.diamond >= totalDiamond &&
    totalTroopsCount + reservedTroops + trainMultiplier <= maxCapacity;

  // High-frequency tick loop while an active training job is running
  useEffect(() => {
    if (!activeJob) return;
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 80);
    return () => clearInterval(interval);
  }, [activeJob]);

  // Evaluate active training job & handle completion + queue promotion
  const activeEval = activeJob ? evaluateTrainingJob(activeJob, nowMs) : null;

  useEffect(() => {
    if (!activeJob || !activeEval || !activeEval.isComplete) return;

    // Dispatch completed batch to parent state
    onTrainTroopsRef.current(activeJob.type, activeJob.tier, activeJob.amount, activeJob.costPaid);
    setLastCompletedBanner(
      `Mobilized +${formatBigInt(activeJob.amount)} ${activeJob.unitName} into garrison!`
    );

    if (queuedJobs.length > 0) {
      const [nextJob, ...rest] = queuedJobs;
      const now = Date.now();
      setActiveJob({
        ...nextJob,
        startedAtMs: now,
      });
      setQueuedJobs(rest);
      setNowMs(now);
    } else {
      setActiveJob(null);
    }
  }, [activeJob, activeEval, queuedJobs]);

  const handleTrain = () => {
    if (activeJob && !multiQueueAccess.allowed) {
      sound.playSwing();
      setAccessDeniedMessage(multiQueueAccess.reason);
      return;
    }
    if (!canAfford) return;
    sound.playSwing();
    const now = Date.now();
    const newJob: TroopTrainingJob = {
      id: `train_${now}_${Math.random().toString(36).slice(2, 6)}`,
      type: selectedType,
      tier: selectedTier,
      unitName: currentInfo.name,
      amount: trainMultiplier,
      costPaid: {
        wood: totalWood,
        steel: totalSteel,
        copper: totalCopper,
        grain: totalGrain,
        oil: totalOil,
        diamond: totalDiamond,
      },
      startedAtMs: now,
      durationMs: durationEstimate.durationMs,
      acceleratedMs: 0,
    };

    setLastCompletedBanner(null);
    setAccessDeniedMessage(null);
    if (!activeJob) {
      setNowMs(now);
      setActiveJob(newJob);
    } else {
      setQueuedJobs((prev) => [...prev, newJob]);
    }
  };

  const handleSpeedUpActive = () => {
    if (!activeJob) return;
    sound.playSwing();
    if (!speedUpAccess.allowed) {
      setAccessDeniedMessage(speedUpAccess.reason);
      return;
    }
    setAccessDeniedMessage(null);
    setActiveJob((prev) => (prev ? accelerateTrainingJob(prev, 5000) : null));
    setNowMs(Date.now());
  };

  const handleInstantFinishActive = () => {
    if (!activeJob) return;
    sound.playSwing();
    if (!instantFinishAccess.allowed) {
      setAccessDeniedMessage(instantFinishAccess.reason);
      return;
    }
    setAccessDeniedMessage(null);
    setActiveJob((prev) => (prev ? completeTrainingJobInstantly(prev) : null));
    setNowMs(Date.now());
  };

  const handleCancelActive = () => {
    if (!activeJob) return;
    sound.playSwing();
    if (queuedJobs.length > 0) {
      const [nextJob, ...rest] = queuedJobs;
      const now = Date.now();
      setActiveJob({ ...nextJob, startedAtMs: now });
      setQueuedJobs(rest);
      setNowMs(now);
    } else {
      setActiveJob(null);
    }
  };

  const displayedTroopsCount = totalTroopsCount + (activeEval ? activeEval.trainedSoFar : 0n);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="barracks-modal-title"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-red-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="relative px-5 py-3.5 bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 border-b border-red-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="barracks-modal-title"
                className="text-lg sm:text-xl font-bold font-cinzel text-red-100 flex items-center gap-2"
              >
                Imperial War Barracks
                <span className="text-xs text-red-300 font-mono">
                  · Tiers T1–T20 · Speed +{durationEstimate.speedBonusPct}%
                </span>
              </h2>
              <p className="text-xs text-red-200/70">
                Train Shieldbearers, Shooters, and Bombers up to 1,000 Trillion Capacity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3 text-slate-200">
          {/* Total Army Capacity Gauge */}
          <div className="px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs text-slate-400">Total Troops Mobilized</div>
                <div className="text-base sm:text-lg font-black font-mono tabular-nums text-white">
                  {formatBigInt(displayedTroopsCount)}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    / {formatBigInt(maxCapacity)} Max Cap
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full sm:w-48 bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-transform duration-200 origin-left"
                style={{
                  transform: `scaleX(${Math.min(
                    1,
                    Number((displayedTroopsCount * 1000n) / (maxCapacity || 1n)) / 1000
                  )})`,
                }}
              />
            </div>
          </div>

          {/* Active Batch Training Progress Bar Panel */}
          {activeJob && activeEval && (
            <div
              data-testid="barracks-active-training-panel"
              className="p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/50 space-y-2.5 shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>
                        Training +{formatBigInt(activeJob.amount)} {activeJob.unitName}
                      </span>
                      <span
                        data-testid="barracks-progress-pct"
                        className="text-xs font-mono tabular-nums text-amber-300"
                      >
                        · {activeEval.progressPct}%
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono tabular-nums">
                      Graduated: {formatBigInt(activeEval.trainedSoFar)} /{' '}
                      {formatBigInt(activeJob.amount)} units
                      {queuedJobs.length > 0 && ` · +${queuedJobs.length} queued`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div
                    data-testid="barracks-remaining-time"
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold tabular-nums whitespace-nowrap"
                  >
                    {activeEval.formattedRemaining} remaining
                  </div>
                  <button
                    type="button"
                    data-testid="barracks-speedup-btn"
                    onClick={handleSpeedUpActive}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                      speedUpAccess.allowed
                        ? 'bg-emerald-600/25 hover:bg-emerald-600/40 border-emerald-500/50 text-emerald-200 cursor-pointer'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-amber-500/50 cursor-pointer'
                    }`}
                  >
                    {speedUpAccess.allowed ? (
                      <FastForward className="w-3.5 h-3.5" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    {speedUpAccess.allowed ? 'Speed Up (-5s)' : 'Speed Up [VIP 1+]'}
                  </button>
                  <button
                    type="button"
                    data-testid="barracks-instant-finish-btn"
                    onClick={handleInstantFinishActive}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                      instantFinishAccess.allowed
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                        : 'bg-slate-900 border border-slate-700 text-slate-400 hover:border-amber-500/50 cursor-pointer'
                    }`}
                  >
                    {instantFinishAccess.allowed ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    {instantFinishAccess.allowed ? 'Instant Finish' : 'Instant Finish [VIP 2+]'}
                  </button>
                  <button
                    type="button"
                    data-testid="barracks-cancel-btn"
                    onClick={handleCancelActive}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
                    aria-label="Cancel active training batch"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div
                role="progressbar"
                aria-label={`Training ${activeJob.unitName}`}
                aria-valuenow={activeEval.progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                data-testid="barracks-training-progressbar"
                className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700"
              >
                <div
                  className="h-full w-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400 origin-left transition-transform duration-100 ease-linear"
                  style={{
                    transform: `scaleX(${activeEval.progressRatio})`,
                  }}
                />
              </div>

              {/* Access Denied Prompt inside Active Training Panel */}
              {accessDeniedMessage && (
                <div
                  data-testid="barracks-vip-lock-notice"
                  className="px-3 py-2 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-between gap-2 text-xs text-amber-200"
                >
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    {accessDeniedMessage}
                  </span>
                  {onOpenVipSubscription && (
                    <button
                      type="button"
                      onClick={onOpenVipSubscription}
                      className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Crown className="w-3 h-3" />
                      Upgrade VIP
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Completed Batch Banner */}
          {!activeJob && lastCompletedBanner && (
            <div
              data-testid="barracks-completed-banner"
              className="px-3.5 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                {lastCompletedBanner}
              </span>
              <span className="font-mono text-emerald-400">100% Complete</span>
            </div>
          )}

          {/* Archetype Selector */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => setSelectedType('shieldbearer')}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                selectedType === 'shieldbearer'
                  ? 'bg-blue-950/70 border-blue-400 text-blue-200 ring-2 ring-blue-500/30'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Shield className="w-5 h-5 text-blue-400" />
              <div className="text-sm font-bold">Shieldbearer</div>
              <div className="text-[11px] text-blue-300/80">Tank · Counter vs Shooters</div>
            </button>

            <button
              onClick={() => setSelectedType('shooter')}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                selectedType === 'shooter'
                  ? 'bg-emerald-950/70 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/30'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Crosshair className="w-5 h-5 text-emerald-400" />
              <div className="text-sm font-bold">Shooter</div>
              <div className="text-[11px] text-emerald-300/80">Ranged · Counter vs Bombers</div>
            </button>

            <button
              onClick={() => setSelectedType('bomber')}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                selectedType === 'bomber'
                  ? 'bg-orange-950/70 border-orange-400 text-orange-200 ring-2 ring-orange-500/30'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Bomb className="w-5 h-5 text-orange-400" />
              <div className="text-sm font-bold">Bomber</div>
              <div className="text-[11px] text-orange-300/80">Siege · Counter vs Shields</div>
            </button>
          </div>

          {/* Tier Slider / Selection (T1 - T20) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Select Troop Tier (T1 to T20)</span>
              <span className="text-amber-400 font-mono">
                Unlocked: T1 - T{maxUnlockedTier} (Castle Lv.{castleLevel})
              </span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((t) => {
                const unlocked = t <= maxUnlockedTier;
                return (
                  <button
                    key={t}
                    disabled={!unlocked}
                    onClick={() => setSelectedTier(t)}
                    className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                      selectedTier === t
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/20'
                        : unlocked
                          ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          : 'bg-slate-900/60 text-slate-600 border-slate-800/80 cursor-not-allowed'
                    }`}
                  >
                    T{t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Troop Card Info */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-slate-800/90 via-slate-900 to-slate-950 border border-slate-700 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-base font-bold text-white font-cinzel flex items-center gap-2">
                  {currentInfo.name}
                  <span className="text-xs text-amber-300 font-mono">· Rank T{selectedTier}</span>
                </h3>
                <p className="text-xs text-slate-400">{currentInfo.description}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Power / Unit</div>
                <div className="text-base font-bold font-mono tabular-nums text-amber-300">
                  {formatBigInt(currentInfo.powerPerUnit)}
                </div>
              </div>
            </div>

            {/* Battle Stats */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="py-1.5 px-2 rounded-lg bg-slate-800/50 border border-slate-700/60 text-center">
                <div className="text-xs text-rose-400">Attack</div>
                <div className="text-sm font-bold font-mono tabular-nums text-white">
                  {formatBigInt(currentInfo.attack)}
                </div>
              </div>
              <div className="py-1.5 px-2 rounded-lg bg-slate-800/50 border border-slate-700/60 text-center">
                <div className="text-xs text-blue-400">Defense</div>
                <div className="text-sm font-bold font-mono tabular-nums text-white">
                  {formatBigInt(currentInfo.defense)}
                </div>
              </div>
              <div className="py-1.5 px-2 rounded-lg bg-slate-800/50 border border-slate-700/60 text-center">
                <div className="text-xs text-emerald-400">Health (HP)</div>
                <div className="text-sm font-bold font-mono tabular-nums text-white">
                  {formatBigInt(currentInfo.hp)}
                </div>
              </div>
            </div>
          </div>

          {/* Batch Train Multiplier Selector */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Training Batch Quantity</span>
              <span
                data-testid="barracks-estimated-time"
                className="text-amber-300 font-mono tabular-nums"
              >
                {durationEstimate.cadenceLabel} · Est. Time:{' '}
                {formatTrainingCountdown(durationEstimate.durationMs)}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { label: '100', val: 100n },
                { label: '1,000', val: 1000n },
                { label: '10,000', val: 10000n },
                { label: '100,000', val: 100000n },
                { label: '1.00M', val: 1000000n },
                { label: '10.00M', val: 10000000n },
              ].map((b) => (
                <button
                  key={b.label}
                  onClick={() => setTrainMultiplier(b.val)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold border transition-all whitespace-nowrap ${
                    trainMultiplier === b.val
                      ? 'bg-red-500 text-white border-red-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  +{b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resource Costs for Batch */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-400">
              Required Supplies for {formatBigInt(trainMultiplier)} Troops
            </div>
            <div
              className={`grid grid-cols-2 ${
                totalDiamond > 0n ? 'sm:grid-cols-6' : 'sm:grid-cols-5'
              } gap-2`}
            >
              <div
                className={`py-1.5 px-2.5 rounded-lg border text-xs font-mono tabular-nums whitespace-nowrap ${
                  availableResources.wood >= totalWood
                    ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                    : 'bg-red-950/30 border-red-500/40 text-red-300'
                }`}
              >
                🌲 {formatBigInt(totalWood)} Wood
              </div>
              <div
                className={`py-1.5 px-2.5 rounded-lg border text-xs font-mono tabular-nums whitespace-nowrap ${
                  availableResources.steel >= totalSteel
                    ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                    : 'bg-red-950/30 border-red-500/40 text-red-300'
                }`}
              >
                ⚔️ {formatBigInt(totalSteel)} Steel
              </div>
              <div
                className={`py-1.5 px-2.5 rounded-lg border text-xs font-mono tabular-nums whitespace-nowrap ${
                  availableResources.copper >= totalCopper
                    ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                    : 'bg-red-950/30 border-red-500/40 text-red-300'
                }`}
              >
                🪙 {formatBigInt(totalCopper)} Copper
              </div>
              <div
                className={`py-1.5 px-2.5 rounded-lg border text-xs font-mono tabular-nums whitespace-nowrap ${
                  availableResources.grain >= totalGrain
                    ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                    : 'bg-red-950/30 border-red-500/40 text-red-300'
                }`}
              >
                🌾 {formatBigInt(totalGrain)} Grain
              </div>
              <div
                className={`py-1.5 px-2.5 rounded-lg border text-xs font-mono tabular-nums whitespace-nowrap ${
                  availableResources.oil >= totalOil
                    ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                    : 'bg-red-950/30 border-red-500/40 text-red-300'
                }`}
              >
                🛢️ {formatBigInt(totalOil)} Oil
              </div>
              {totalDiamond > 0n && (
                <div
                  className={`py-1.5 px-2.5 rounded-lg border text-xs font-mono tabular-nums whitespace-nowrap ${
                    availableResources.diamond >= totalDiamond
                      ? 'bg-slate-800/60 border-slate-700 text-cyan-300'
                      : 'bg-red-950/30 border-red-500/40 text-red-300'
                  }`}
                >
                  💎 {formatBigInt(totalDiamond)} Diamond
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            {canAfford
              ? `Ready to enlist ${formatBigInt(trainMultiplier)} ${currentInfo.name} (${formatTrainingCountdown(durationEstimate.durationMs)} drill).`
              : activeJob && !multiQueueAccess.allowed
                ? multiQueueAccess.reason
                : 'Insufficient supplies or exceeded castle troop capacity.'}
          </div>
          <button
            data-testid="barracks-recruit-btn"
            onClick={handleTrain}
            disabled={!canAfford}
            className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
              canAfford
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {activeJob && !multiQueueAccess.allowed ? (
              <Lock className="w-4 h-4 text-amber-400" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {activeJob
              ? multiQueueAccess.allowed
                ? `Queue +${formatBigInt(trainMultiplier)} Troops (${queuedJobs.length}/${multiQueueAccess.maxAllowedQueues})`
                : 'Queue Locked [VIP 1+]'
              : `Recruit ${formatBigInt(trainMultiplier)} Troops`}
          </button>
        </div>
      </div>
    </div>
  );
};
