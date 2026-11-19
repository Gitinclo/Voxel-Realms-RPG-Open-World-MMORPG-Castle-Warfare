/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  ClipboardList,
  FastForward,
  Gift,
  Play,
  RefreshCw,
  X,
} from 'lucide-react';
import { GameResources } from '../types/game';
import { PlayerCultivationState } from '../types/cultivation';
import {
  DailyMissionBoardState,
  DailyMissionDestinationModal,
  DailyMissionDifficulty,
  DailyMissionGroup,
  DailyMissionTask,
  countClaimableDailyMissions,
  evaluateBoardRefreshOption,
  summarizeCultivationLevel,
} from '../game/dailyMissions';
import { CULTIVATION_PATH_META } from '../game/cultivationMath';
import { formatBigInt } from '../game/math';
import { sound } from '../game/audio';

interface DailyMissionModalProps {
  board: DailyMissionBoardState;
  resources: GameResources;
  cultivation: PlayerCultivationState;
  bypassRerollCost?: boolean;
  onAdvanceMission: (missionId: string) => void;
  onClaimMission: (missionId: string) => void;
  onClaimMilestone: (milestoneId: 'milestone_3' | 'milestone_5') => void;
  onClaimAllReady: () => void;
  onRefreshBoard: () => void;
  onAdvanceSimulatedDay: () => void;
  onNavigateToModal: (modal: DailyMissionDestinationModal) => void;
  onClose: () => void;
}

const DIFFICULTY_LABEL: Record<DailyMissionDifficulty, string> = {
  standard: 'Standard',
  veteran: 'Veteran',
  grandmaster: 'Grandmaster',
};

const DIFFICULTY_TEXT_CLASS: Record<DailyMissionDifficulty, string> = {
  standard: 'text-slate-300',
  veteran: 'text-cyan-300',
  grandmaster: 'text-amber-300',
};

const GROUP_LABEL: Record<DailyMissionGroup, string> = {
  cultivation: 'Cultivation',
  materials: 'Materials',
  warfare: 'Warfare',
};

export const DailyMissionModal: React.FC<DailyMissionModalProps> = ({
  board,
  resources,
  cultivation,
  bypassRerollCost = false,
  onAdvanceMission,
  onClaimMission,
  onClaimMilestone,
  onClaimAllReady,
  onRefreshBoard,
  onAdvanceSimulatedDay,
  onNavigateToModal,
  onClose,
}) => {
  const [activeGroup, setActiveGroup] = useState<'all' | DailyMissionGroup>('all');

  const summary = useMemo(() => summarizeCultivationLevel(cultivation), [cultivation]);
  const refreshOption = useMemo(() => evaluateBoardRefreshOption(board), [board]);
  const claimableTotal = useMemo(() => countClaimableDailyMissions(board), [board]);

  const claimedMissionsCount = useMemo(
    () => board.missions.filter((m) => m.claimed).length,
    [board.missions]
  );

  const visibleMissions = useMemo(() => {
    if (activeGroup === 'all') return board.missions;
    return board.missions.filter((m) => m.group === activeGroup);
  }, [board.missions, activeGroup]);

  const cultivationUpgradedSinceGen =
    summary.highestRealmIndex > board.generatedForRealmIndex ||
    (summary.highestRealmIndex === board.generatedForRealmIndex &&
      summary.highestLayer > board.generatedForLayer);

  const canAffordRefresh =
    refreshOption.isFree || bypassRerollCost || resources.diamond >= refreshOption.diamondCost;

  const progressPct = Math.round((claimedMissionsCount / Math.max(1, board.missions.length)) * 100);

  const renderMissionMeta = (mission: DailyMissionTask) => {
    const parts: string[] = [DIFFICULTY_LABEL[mission.difficulty], GROUP_LABEL[mission.group]];
    if (mission.targetPath) {
      parts.push(CULTIVATION_PATH_META[mission.targetPath].name);
    }
    if (mission.targetResource) {
      parts.push(mission.targetResource.charAt(0).toUpperCase() + mission.targetResource.slice(1));
    }
    return parts;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/88 pointer-events-auto select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-missions-modal-title"
      data-testid="daily-missions-modal"
    >
      <div className="relative w-full max-w-5xl max-h-[94vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700/90 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-950/85 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <ClipboardList className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
              <h2
                id="daily-missions-modal-title"
                className="text-base sm:text-xl font-bold font-cinzel tracking-wide text-slate-50 truncate"
              >
                Daily Cultivation Missions
              </h2>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-slate-400 font-mono tabular-nums">
              <span className="text-amber-300 font-semibold" data-testid="dm-realm-summary">
                {summary.realmName} Layer {summary.highestLayer}
              </span>
              <span aria-hidden="true">·</span>
              <span>{summary.eraLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="text-cyan-300">{summary.powerScaleMultiplier}x Material Scale</span>
              <span aria-hidden="true">·</span>
              <span>Cycle {board.cycleIndex}</span>
              <span aria-hidden="true">·</span>
              <span>{board.dateKey}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                sound.playSwing();
                onAdvanceSimulatedDay();
              }}
              data-testid="dm-next-day-btn"
              className="min-h-[40px] px-2.5 sm:px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              title="Advance calendar day to generate a new daily rotation"
            >
              <FastForward className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
              <span className="hidden sm:inline">Next Day</span>
              <span className="sm:hidden">+1d</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Daily Missions"
              data-testid="dm-close-btn"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Resource & Cultivation Material Strip */}
        <div
          className="px-4 py-2 sm:px-6 sm:py-2.5 border-b border-slate-800 bg-slate-950/50 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] sm:text-xs font-mono tabular-nums"
          data-testid="dm-inventory-strip"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-300">
            <span>
              Wood <strong className="text-slate-100">{formatBigInt(resources.wood)}</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span>
              Steel <strong className="text-slate-100">{formatBigInt(resources.steel)}</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span>
              Copper <strong className="text-slate-100">{formatBigInt(resources.copper)}</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span>
              Grain <strong className="text-slate-100">{formatBigInt(resources.grain)}</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span>
              Oil <strong className="text-slate-100">{formatBigInt(resources.oil)}</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span>
              Diamonds{' '}
              <strong className="text-cyan-300" data-testid="dm-diamonds-balance">
                {formatBigInt(resources.diamond)}
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-300">
            <span>
              Spirit Stones{' '}
              <strong className="text-amber-300" data-testid="dm-spirit-stones-balance">
                {formatBigInt(cultivation.spiritStones ?? 0n)}
              </strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span>
              Scripture Frags{' '}
              <strong className="text-amber-200" data-testid="dm-scripture-frags-balance">
                {cultivation.scriptureFragments.toLocaleString()}
              </strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span>
              Veteran Scrolls{' '}
              <strong className="text-emerald-300" data-testid="dm-veteran-scrolls-balance">
                {(cultivation.veteranScrolls ?? 0).toLocaleString()}
              </strong>
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-5">
          {/* Cultivation Advancement Notice (if player broke through after board generation) */}
          {cultivationUpgradedSinceGen && (
            <div className="px-4 py-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              <p className="text-amber-100">
                Your cultivation advanced to{' '}
                <strong>
                  {summary.realmName} Layer {summary.highestLayer}
                </strong>
                . Refresh tasks to scale new commissions to your current realm.
              </p>
              <button
                type="button"
                disabled={!canAffordRefresh}
                onClick={() => {
                  sound.playSwing();
                  onRefreshBoard();
                }}
                className="min-h-[36px] px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Rescale Tasks
              </button>
            </div>
          )}

          {/* Cycle Progress & Milestone Material Caches */}
          <section aria-label="Cycle milestones" className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-100">
                Daily Cycle Progress ({claimedMissionsCount} / {board.missions.length} Claimed)
              </h3>
              <div className="text-xs font-mono text-slate-400 tabular-nums">
                Completed today: {board.totalCyclesCompletedToday} cycles · Lifetime:{' '}
                {board.totalMissionsCompletedLifetime} missions
              </div>
            </div>

            <div
              className="h-2 w-full rounded-full bg-slate-800 overflow-hidden"
              role="progressbar"
              aria-valuenow={claimedMissionsCount}
              aria-valuemin={0}
              aria-valuemax={board.missions.length}
              aria-label="Daily missions claimed progress"
            >
              <div
                className="h-full bg-amber-400 transition-all duration-200"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {board.milestones.map((ms) => {
                const unlocked = claimedMissionsCount >= ms.requiredClaimed;
                const canClaim = unlocked && !ms.claimed;

                return (
                  <div
                    key={ms.id}
                    data-testid={`dm-milestone-${ms.id}`}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      canClaim
                        ? 'bg-amber-950/35 border-amber-400/70'
                        : ms.claimed
                          ? 'bg-slate-950/60 border-emerald-500/35'
                          : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Gift
                          className={`w-4 h-4 shrink-0 ${
                            canClaim
                              ? 'text-amber-300'
                              : ms.claimed
                                ? 'text-emerald-400'
                                : 'text-slate-400'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-semibold text-slate-100 truncate">
                          {ms.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{ms.subtitle}</p>
                      <div className="text-[11px] font-mono text-slate-300 tabular-nums flex flex-wrap gap-x-2 gap-y-0.5">
                        <span className="text-cyan-300">
                          +{formatBigInt(ms.rewards.resources.diamond)} Diamonds
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-300">
                          +{formatBigInt(ms.rewards.spiritStones)} Spirit Stones
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>+{ms.rewards.scriptureFragments} Frags</span>
                        {ms.rewards.veteranScrolls > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-emerald-300">
                              +{ms.rewards.veteranScrolls} Veteran Scroll
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!canClaim}
                      onClick={() => {
                        sound.playUpgradeFanfare();
                        onClaimMilestone(ms.id);
                      }}
                      data-testid={`dm-claim-milestone-${ms.id}`}
                      className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                        canClaim
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                          : ms.claimed
                            ? 'bg-slate-800/80 text-emerald-300 border border-emerald-500/30 cursor-default'
                            : 'bg-slate-800/70 text-slate-400 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      {ms.claimed ? (
                        <>
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Claimed</span>
                        </>
                      ) : canClaim ? (
                        <span>Claim Cache</span>
                      ) : (
                        <span className="tabular-nums">
                          {claimedMissionsCount}/{ms.requiredClaimed} Required
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Filter Tabs + Section Header */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-100">
              Active Commissions ({visibleMissions.length})
            </h3>

            <div
              className="flex items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800"
              role="tablist"
              aria-label="Filter missions by category"
            >
              {(['all', 'cultivation', 'materials', 'warfare'] as const).map((group) => {
                const isActive = activeGroup === group;
                const label = group === 'all' ? 'All' : GROUP_LABEL[group];
                return (
                  <button
                    key={group}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    data-testid={`dm-filter-${group}`}
                    onClick={() => {
                      sound.playSwing();
                      setActiveGroup(group);
                    }}
                    className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                      isActive
                        ? 'bg-slate-800 text-amber-200'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mission List */}
          {visibleMissions.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400 border border-slate-800 rounded-xl bg-slate-950/40">
              No commissions in this category on the current board. Switch filter or refresh tasks.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-950/55 overflow-hidden">
              {visibleMissions.map((mission) => {
                const pct = Math.min(
                  100,
                  Math.round((mission.currentCount / Math.max(1, mission.targetCount)) * 100)
                );
                const metaParts = renderMissionMeta(mission);
                const pathMeta = CULTIVATION_PATH_META[mission.rewards.cultivationPath];

                return (
                  <div
                    key={mission.id}
                    data-testid={`dm-task-row-${mission.templateId}`}
                    className={`p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                      mission.claimed
                        ? 'bg-slate-950/40 opacity-80'
                        : mission.completed
                          ? 'bg-amber-950/20'
                          : 'hover:bg-slate-900/60'
                    }`}
                  >
                    {/* Left: Title, Metadata, Description, Progress, Rewards */}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                          <h4 className="text-sm sm:text-base font-semibold text-slate-100">
                            {mission.title}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            {metaParts.map((part, idx) => (
                              <React.Fragment key={`${mission.id}-meta-${part}`}>
                                {idx > 0 && (
                                  <span className="text-slate-600" aria-hidden="true">
                                    ·
                                  </span>
                                )}
                                <span
                                  className={
                                    idx === 0
                                      ? `${DIFFICULTY_TEXT_CLASS[mission.difficulty]} font-semibold`
                                      : 'text-slate-400'
                                  }
                                >
                                  {part}
                                </span>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                        <p className="mt-0.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {mission.description}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="flex items-center gap-3 max-w-md">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-200 ${
                              mission.claimed
                                ? 'bg-emerald-400'
                                : mission.completed
                                  ? 'bg-amber-400'
                                  : 'bg-cyan-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span
                          className="text-xs font-mono font-semibold text-slate-300 tabular-nums whitespace-nowrap"
                          data-testid={`dm-task-progress-${mission.templateId}`}
                        >
                          {mission.currentCount} / {mission.targetCount}
                        </span>
                      </div>

                      {/* Material & Cultivation Rewards */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono text-slate-300 tabular-nums">
                        <span className="text-slate-400">Rewards:</span>
                        <span>+{formatBigInt(mission.rewards.resources.wood)} Wood</span>
                        <span className="text-slate-600" aria-hidden="true">
                          ·
                        </span>
                        <span>+{formatBigInt(mission.rewards.resources.steel)} Steel</span>
                        <span className="text-slate-600" aria-hidden="true">
                          ·
                        </span>
                        <span>+{formatBigInt(mission.rewards.resources.copper)} Copper</span>
                        <span className="text-slate-600" aria-hidden="true">
                          ·
                        </span>
                        <span>+{formatBigInt(mission.rewards.resources.grain)} Grain</span>
                        <span className="text-slate-600" aria-hidden="true">
                          ·
                        </span>
                        <span>+{formatBigInt(mission.rewards.resources.oil)} Oil</span>
                        <span className="text-slate-600" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-cyan-300">
                          +{formatBigInt(mission.rewards.resources.diamond)} Diamonds
                        </span>
                        <span className="text-slate-600" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-amber-300">
                          +{formatBigInt(mission.rewards.spiritStones)} Spirit Stones
                        </span>
                        <span className="text-slate-600" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-amber-200">
                          +{mission.rewards.scriptureFragments} Frags
                        </span>
                        <span className="text-slate-600" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-emerald-300">
                          +{formatBigInt(mission.rewards.cultivationEnergy)} {pathMeta.energyName}
                        </span>
                        {mission.rewards.veteranScrolls > 0 && (
                          <>
                            <span className="text-slate-600" aria-hidden="true">
                              ·
                            </span>
                            <span className="text-amber-300 font-semibold">
                              +{mission.rewards.veteranScrolls} Veteran Scroll
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                      {mission.claimed ? (
                        <span
                          data-testid={`dm-task-claimed-${mission.templateId}`}
                          className="min-h-[40px] px-4 py-2 rounded-lg bg-slate-900 border border-emerald-500/35 text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                          <span>Claimed</span>
                        </span>
                      ) : mission.completed ? (
                        <button
                          type="button"
                          onClick={() => {
                            sound.playUpgradeFanfare();
                            onClaimMission(mission.id);
                          }}
                          data-testid={`dm-claim-task-${mission.templateId}`}
                          className="min-h-[40px] px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                        >
                          <Gift className="w-4 h-4" aria-hidden="true" />
                          <span>Claim Rewards</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              sound.playSwing();
                              onNavigateToModal(mission.destinationModal);
                            }}
                            data-testid={`dm-goto-task-${mission.templateId}`}
                            className="min-h-[40px] px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium inline-flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                          >
                            <span>{mission.destinationLabel}</span>
                            <ArrowUpRight
                              className="w-3.5 h-3.5 text-slate-400"
                              aria-hidden="true"
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              sound.playGather();
                              onAdvanceMission(mission.id);
                            }}
                            data-testid={`dm-advance-task-${mission.templateId}`}
                            className="min-h-[40px] px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                          >
                            <Play className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{mission.dispatchActionLabel}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="px-4 py-3.5 sm:px-6 border-t border-slate-800 bg-slate-950/85 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-mono">
            {refreshOption.isCycleComplete
              ? 'All 5 commissions claimed. Start a new randomized cycle for free.'
              : refreshOption.isFree
                ? '1 free board refresh available today · Progress also tracks live gameplay actions.'
                : bypassRerollCost
                  ? 'Repeatable commission refresh ready · Progress also tracks live gameplay actions.'
                  : 'Complete all 5 tasks for a free cycle, or refresh tasks with Diamonds.'}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={!canAffordRefresh}
              onClick={() => {
                sound.playSwing();
                onRefreshBoard();
              }}
              data-testid="dm-refresh-board-btn"
              className={`min-h-[40px] px-4 py-2 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                refreshOption.isCycleComplete
                  ? 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400 text-slate-950 cursor-pointer'
                  : canAffordRefresh
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100 cursor-pointer'
                    : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {refreshOption.isCycleComplete
                  ? 'Start Next Cycle'
                  : refreshOption.isFree || bypassRerollCost
                    ? 'Refresh Tasks (Free)'
                    : refreshOption.label}
              </span>
            </button>

            <button
              type="button"
              disabled={claimableTotal === 0}
              onClick={() => {
                sound.playUpgradeFanfare();
                onClaimAllReady();
              }}
              data-testid="dm-claim-all-btn"
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                claimableTotal > 0
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Gift className="w-4 h-4" aria-hidden="true" />
              <span className="tabular-nums">
                {claimableTotal > 0 ? `Claim All (${claimableTotal})` : 'No Ready Rewards'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
