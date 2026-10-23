/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Sparkles,
  ScrollText,
  CheckCircle2,
  FastForward,
  Gift,
  Flame,
  Shield,
  ArrowUpRight,
  Compass,
} from 'lucide-react';
import {
  ScaledDailyLoginReward,
  DailyLoginEvaluation,
  calculateVeteranScrollBonuses,
} from '../game/dailyLogin';
import { CultivationPath, PlayerCultivationState } from '../types/cultivation';
import { CULTIVATION_PATH_LIST, CULTIVATION_PATH_META, getRealmDef } from '../game/cultivationMath';
import { formatBigInt } from '../game/math';
import { sound } from '../game/audio';

interface DailyLoginModalProps {
  evaluation: DailyLoginEvaluation;
  schedule: ScaledDailyLoginReward[];
  castleLevel: number;
  cultivation: PlayerCultivationState;
  onClaimToday: () => void;
  onAdvanceSimulatedDay: () => void;
  onComprehendVeteranScroll: (targetPath: CultivationPath | 'all', count: number) => void;
  onOpenCultivationModal: () => void;
  onClose: () => void;
}

export const DailyLoginModal: React.FC<DailyLoginModalProps> = ({
  evaluation,
  schedule,
  castleLevel,
  cultivation,
  onClaimToday,
  onAdvanceSimulatedDay,
  onComprehendVeteranScroll,
  onOpenCultivationModal,
  onClose,
}) => {
  const [selectedDayPreview, setSelectedDayPreview] = useState<number>(evaluation.activeCycleDay);
  const [selectedScrollTarget, setSelectedScrollTarget] = useState<CultivationPath | 'all'>('all');

  // Keep preview synced if activeCycleDay changes (e.g. when simulating next day)
  React.useEffect(() => {
    setSelectedDayPreview(evaluation.activeCycleDay);
  }, [evaluation.activeCycleDay]);

  const activeReward =
    schedule.find((r) => r.day === selectedDayPreview) ||
    schedule[evaluation.activeCycleDay - 1] ||
    schedule[0];

  const todayReward = schedule[evaluation.activeCycleDay - 1] || schedule[0];
  const ownedScrolls = cultivation.veteranScrolls ?? 0;
  const comprehendedScrolls = cultivation.veteranScrollsComprehended ?? 0;
  const scrollBonuses = calculateVeteranScrollBonuses(comprehendedScrolls);
  const currentQiRealm = getRealmDef('qi', cultivation.paths.qi.realmIndex);

  const isDayClaimedInCycle = (day: number): boolean => {
    if (evaluation.canClaimToday) {
      return day < evaluation.activeCycleDay;
    }
    return day <= evaluation.activeCycleDay;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/88 pointer-events-auto select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-login-modal-title"
    >
      <div className="relative w-full max-w-5xl max-h-[96vh] flex flex-col rounded-2xl bg-slate-900 border-2 border-amber-500/50 shadow-[0_0_60px_rgba(245,158,11,0.22)] overflow-hidden text-slate-100">
        {/* Top Ornate Header */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-2.5 bg-gradient-to-r from-amber-950/85 via-slate-900 to-purple-950/80 border-b border-amber-500/30 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-lg shadow-inner">
              📜
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="daily-login-modal-title"
                  className="text-sm sm:text-base font-black font-cinzel tracking-wide text-amber-200"
                >
                  DAILY LOGIN REWARD · IMPERIAL &amp; IMMORTAL DECREE
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  IMMORTAL LINEAGE EDICT
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Scaling Citadel Resources, Imperial Diamonds &amp; Sacred{' '}
                <span className="text-amber-300 font-semibold">Veteran Scrolls</span> for Four-Path Cultivation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Streak Counter */}
            <div className="px-2.5 py-1 rounded-xl bg-slate-950/90 border border-amber-500/40 flex items-center gap-1.5 text-xs font-mono tabular-nums">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Streak:</span>
              <span className="font-bold text-amber-300" data-testid="daily-streak-count">
                {evaluation.currentStreak}d
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-300 font-bold">{todayReward.scalingMultiplier}x Scale</span>
            </div>

            {/* Simulate Next Day Button for Testing / Multi-Day Progression */}
            <button
              type="button"
              onClick={() => {
                sound.playSwing();
                onAdvanceSimulatedDay();
              }}
              data-testid="simulate-next-day-btn"
              className="px-2.5 py-1 rounded-xl bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-400/50 text-indigo-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="Advance calendar by +1 Day to preview or claim the next consecutive daily login reward"
            >
              <FastForward className="w-3.5 h-3.5 text-indigo-300" />
              <span>Next Dawn (+1d)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Daily Login Rewards"
              className="p-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-2.5">
          {/* Scaling Formula Banner */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-amber-400 font-bold">ACTIVE SCALING FACTORS:</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                🏰 Citadel Lv.{castleLevel}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300">
                🧘 {currentQiRealm.name} (Realm #{cultivation.paths.qi.realmIndex + 1})
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-300">
                🗓️ {evaluation.totalDaysClaimed} Total Logins
              </span>
            </div>
            <div className="text-slate-400">
              Date Key: <span className="text-slate-200 font-bold">{evaluation.effectiveDateKey}</span>
            </div>
          </div>

          {/* 7-Day Consecutive Login Schedule Grid */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                7-Day Consecutive Immortal Provision Cycle
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Click any day card to inspect scaled rewards
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {schedule.map((tier) => {
                const isClaimed = isDayClaimedInCycle(tier.day);
                const isToday = tier.day === evaluation.activeCycleDay;
                const isSelected = tier.day === selectedDayPreview;

                return (
                  <button
                    key={tier.day}
                    type="button"
                    onClick={() => {
                      sound.playSwing();
                      setSelectedDayPreview(tier.day);
                    }}
                    data-testid={`daily-tier-card-${tier.day}`}
                    className={`relative p-2 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isToday && evaluation.canClaimToday
                        ? 'bg-gradient-to-b from-amber-950/80 via-slate-900 to-amber-950/50 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                        : isClaimed
                        ? 'bg-slate-950/75 border-emerald-500/40 opacity-90'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-600'
                    } ${isSelected ? 'ring-2 ring-amber-300' : ''}`}
                  >
                    {/* Top Day Header */}
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                          isToday
                            ? 'bg-amber-400 text-slate-950'
                            : isClaimed
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        DAY {tier.day}
                      </span>
                      {tier.isMilestone && (
                        <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-500/20 px-1 py-0.5 rounded border border-amber-400/30">
                          {tier.day === 7 ? 'JACKPOT' : 'MILESTONE'}
                        </span>
                      )}
                    </div>

                    {/* Center Icon & Highlights */}
                    <div className="my-1 flex items-center gap-1.5">
                      <span className="text-lg">{tier.icon}</span>
                      <span className="text-[11px] font-bold text-white line-clamp-1 font-cinzel">
                        {tier.title.split(' ')[0]} {tier.title.split(' ')[1]}
                      </span>
                    </div>

                    {/* Compact Reward Summary */}
                    <div className="pt-1 border-t border-slate-800/80 space-y-0.5 text-[10px] font-mono tabular-nums">
                      <div className="flex items-center justify-between text-amber-300 font-bold">
                        <span>📜 Scroll</span>
                        <span>+{tier.veteranScrolls}</span>
                      </div>
                      <div className="flex items-center justify-between text-cyan-300">
                        <span>💎 Gems</span>
                        <span>+{formatBigInt(tier.resources.diamond)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>🌲 Res</span>
                        <span>+{formatBigInt(tier.resources.wood)}</span>
                      </div>
                    </div>

                    {/* Status Footer */}
                    <div className="mt-1 text-center">
                      {isClaimed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> CLAIMED
                        </span>
                      ) : isToday && evaluation.canClaimToday ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 animate-pulse">
                          <Sparkles className="w-3 h-3" /> READY TODAY
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">UPCOMING</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Two-Column Lower Section: Left = Active Day Reward & Claim CTA | Right = Veteran Scroll Cultivation Chamber */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Left Column (7 cols): Detailed Reward Breakdown & Claim Button */}
            <div className="lg:col-span-7 p-3 rounded-2xl bg-slate-950/90 border border-amber-500/40 flex flex-col justify-between space-y-2.5">
              <div>
                <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{activeReward.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold uppercase text-amber-400">
                          Day {activeReward.day} Decree Package
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          · {activeReward.chineseTitle}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold font-cinzel text-white">
                        {activeReward.title}
                      </h4>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-400/40 text-[11px] font-mono font-bold text-amber-300 tabular-nums">
                    {activeReward.scalingMultiplier}x Scaled Yield
                  </span>
                </div>

                {/* Special Veteran Scroll Spotlight Box */}
                <div className="mt-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-950/70 via-purple-950/50 to-slate-900 border border-amber-400/50 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/25 border border-amber-300 flex items-center justify-center text-lg shrink-0">
                    📜
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold font-cinzel text-amber-200">
                        Special Cultivation Artifact: Veteran Scroll (Ancient Lineage)
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-mono font-black text-[10px] tabular-nums">
                        +{activeReward.veteranScrolls} SCROLL{activeReward.veteranScrolls > 1 ? 'S' : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                      Infuses <span className="text-amber-300 font-semibold">+80% Realm Layer Energy</span> (or +35%
                      across all 4 Paths), <span className="text-cyan-300 font-semibold">+30 Scripture Fragments</span>,
                      and permanently boosts{' '}
                      <span className="text-emerald-300 font-semibold">
                        All-Path Cultivation Speed (+18%) &amp; Breakthrough Chance (+3%)
                      </span>
                      .
                    </p>
                  </div>
                </div>

                {/* Resource & Diamond Grid */}
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono tabular-nums">
                  <div className="px-2 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/40 flex items-center justify-between">
                    <span className="text-slate-300">💎 Diamonds</span>
                    <span className="font-bold text-cyan-300">
                      +{formatBigInt(activeReward.resources.diamond)}
                    </span>
                  </div>
                  <div className="px-2 py-1.5 rounded-lg bg-slate-900 border border-purple-500/40 flex items-center justify-between">
                    <span className="text-slate-300">🔮 Stones</span>
                    <span className="font-bold text-purple-300">
                      +{formatBigInt(activeReward.spiritStones)}
                    </span>
                  </div>
                  <div className="px-2 py-1.5 rounded-lg bg-slate-900 border border-amber-500/40 flex items-center justify-between">
                    <span className="text-slate-300">📖 Frags</span>
                    <span className="font-bold text-amber-300">+{activeReward.scriptureFragments}</span>
                  </div>
                  <div className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">🌲 Wood</span>
                    <span className="font-bold text-emerald-300">
                      +{formatBigInt(activeReward.resources.wood)}
                    </span>
                  </div>
                  <div className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">⚔️ Steel</span>
                    <span className="font-bold text-slate-200">
                      +{formatBigInt(activeReward.resources.steel)}
                    </span>
                  </div>
                  <div className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">🪙 Copper</span>
                    <span className="font-bold text-amber-200">
                      +{formatBigInt(activeReward.resources.copper)}
                    </span>
                  </div>
                  <div className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">🌾 Grain</span>
                    <span className="font-bold text-yellow-300">
                      +{formatBigInt(activeReward.resources.grain)}
                    </span>
                  </div>
                  <div className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">🛢️ Oil</span>
                    <span className="font-bold text-rose-300">
                      +{formatBigInt(activeReward.resources.oil)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Claim Action Bar */}
              <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-[11px] text-slate-400 font-mono">
                  {evaluation.canClaimToday ? (
                    <span className="text-emerald-400 font-bold">
                      ● Day {evaluation.activeCycleDay} Decree ready for immediate claim!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Claimed today. Click &ldquo;Next Dawn (+1d)&rdquo; to advance.</span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!evaluation.canClaimToday}
                  onClick={onClaimToday}
                  data-testid="claim-daily-reward-btn"
                  className={`w-full sm:w-auto px-4 py-2 rounded-xl font-cinzel font-black text-xs flex items-center justify-center gap-1.5 transition-all shrink-0 ${
                    evaluation.canClaimToday
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 active:scale-95 cursor-pointer'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  {evaluation.canClaimToday
                    ? `CLAIM DAY ${evaluation.activeCycleDay} REWARD (+${todayReward.veteranScrolls} VETERAN SCROLL)`
                    : `DAY ${evaluation.activeCycleDay} REWARD CLAIMED`}
                </button>
              </div>
            </div>

            {/* Right Column (5 cols): Veteran Scroll Cultivation Chamber */}
            <div className="lg:col-span-5 p-3 rounded-2xl bg-slate-950/90 border border-purple-500/40 flex flex-col justify-between space-y-2.5">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <ScrollText className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold font-cinzel text-amber-200">
                      VETERAN SCROLL CULTIVATION SANCTUM
                    </h4>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-[11px] font-mono font-black text-amber-300 tabular-nums"
                    data-testid="owned-veteran-scrolls-badge"
                  >
                    📜 {ownedScrolls} Owned
                  </span>
                </div>

                {/* Permanent Mastery Bonuses Summary */}
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 space-y-0.5 text-[11px] font-mono tabular-nums">
                  <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                    Active Veteran Scroll Lineage Mastery ({comprehendedScrolls} Comprehended)
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Passive All-Path Cultivation Speed:</span>
                    <span className="text-emerald-400 font-bold" data-testid="veteran-speed-bonus">
                      +{scrollBonuses.passiveSpeedBonusPct}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Breakthrough &amp; Tribulation Success:</span>
                    <span className="text-amber-300 font-bold">
                      +{scrollBonuses.breakthroughSuccessBonusPct}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Spiritual Combat Resonance:</span>
                    <span className="text-cyan-300 font-bold">
                      +{scrollBonuses.combatResonanceBonusPct}%
                    </span>
                  </div>
                </div>

                {/* Target Cultivation Path Selector */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">
                    Select Path for Veteran Scroll Comprehension:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedScrollTarget('all')}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        selectedScrollTarget === 'all'
                          ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🌌 All 4 (+35%)
                    </button>
                    {CULTIVATION_PATH_LIST.map((path) => {
                      const meta = CULTIVATION_PATH_META[path];
                      return (
                        <button
                          key={path}
                          type="button"
                          onClick={() => setSelectedScrollTarget(path)}
                          className={`px-2 py-1 rounded-lg border text-[11px] font-mono font-bold transition-all cursor-pointer ${
                            selectedScrollTarget === path
                              ? 'bg-purple-500/25 border-purple-400 text-purple-200'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {meta.icon} {meta.name.split(' ')[0]} (+80%)
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Activate Veteran Scroll CTA + Link to Cave Abode */}
              <div className="space-y-1.5 pt-1.5 border-t border-slate-800">
                <button
                  type="button"
                  disabled={ownedScrolls <= 0}
                  onClick={() => {
                    sound.playUpgradeFanfare();
                    onComprehendVeteranScroll(selectedScrollTarget, 1);
                  }}
                  data-testid="comprehend-veteran-scroll-btn"
                  className={`w-full py-1.5 px-3 rounded-xl font-cinzel font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                    ownedScrolls > 0
                      ? 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-400 shadow-lg shadow-purple-600/25 active:scale-95 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {ownedScrolls > 0
                    ? `COMPREHEND 1x VETERAN SCROLL (${selectedScrollTarget.toUpperCase()})`
                    : 'CLAIM DAILY REWARD TO OBTAIN VETERAN SCROLL'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playSwing();
                    onOpenCultivationModal();
                  }}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono font-bold text-amber-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Open Secluded Cultivation Cave Abode</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
