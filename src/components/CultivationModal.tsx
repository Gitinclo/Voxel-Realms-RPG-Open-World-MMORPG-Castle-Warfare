/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Zap,
  Flame,
  Layers,
  BookOpen,
  ShoppingBag,
  Compass,
  Eye,
  Activity,
  ScrollText,
  ArrowUpCircle,
  Search,
} from 'lucide-react';
import {
  CULTIVATION_REALMS,
  CULTIVATION_PATHS_REALMS,
  CULTIVATION_PATH_LIST,
  CULTIVATION_PATH_META,
  CULTIVATION_PILLS,
  CULTIVATION_MANUALS,
  INITIAL_KARMA_STATE,
  INITIAL_DISCIPLES,
  MYSTICAL_POWER_SKILLS,
  getRealmDef,
  calculateQiRequired,
  calculateCultivationMultiplier,
  calculatePassiveQiRate,
  calculateMindCultivationBonuses,
  calculateFourPathSynergy,
  calculateManualEffects,
  calculateManualUpgradeCost,
  calculateEquippedManualsSummary,
  evaluateBreakthroughAttempt,
  calculateRealmSuppression,
  evaluatePvPKillKarma,
  tickRedNameStationaryLightning,
  resolveRedNameDeathLootDrop,
  calculateMasterDiscipleEconomy,
  createTransmissionSkillScroll,
  getCultivationAuraVisualSpec,
} from '../game/cultivationMath';
import {
  PlayerCultivationState,
  CultivationEra,
  CultivationPill,
  CultivationPath,
} from '../types/cultivation';
import { GameResources } from '../types/game';
import { WeatherType, WEATHER_CONFIGS } from '../game/weather';
import { formatBigInt } from '../game/math';
import { sound } from '../game/audio';
import { applyVeteranScrollToCultivation, calculateVeteranScrollBonuses } from '../game/dailyLogin';
import confetti from 'canvas-confetti';

interface CultivationModalProps {
  cultivation: PlayerCultivationState;
  resources: GameResources;
  playerPower: bigint;
  weather: WeatherType;
  clanBuffActive: boolean;
  onMeditate: (path: CultivationPath, energyGained: bigint) => void;
  onBreakthrough: (path: CultivationPath, nextRealmIndex: number, nextLayer: number) => void;
  onCraftPill: (pill: CultivationPill, activePath: CultivationPath) => void;
  onConsumePill: (pillId: string) => void;
  onSurviveTribulation: (path: CultivationPath, nextRealmIndex: number, nextLayer: number) => void;
  onChangeRoot: (root: PlayerCultivationState['selectedRoot']) => void;
  onEquipManual: (path: CultivationPath, manualId: string) => void;
  onUpgradeManual: (manualId: string) => void;
  onDiscoverManual: (freeDeduction?: boolean) => void;
  onUnlockManualDirect: (manualId: string) => void;
  onUpdateCultivation?: (updater: (prev: PlayerCultivationState) => PlayerCultivationState) => void;
  onClose: () => void;
}

type TabType =
  'dantian' | 'breakthrough' | 'manuals' | 'lineage_karma' | 'codex' | 'alchemy' | 'meridians';

const ERA_THEMES: Record<
  CultivationEra,
  { label: string; bg: string; border: string; text: string }
> = {
  mortal: {
    label: '1. Mortal Era (Jade Pure Sacred Sect)',
    bg: 'from-amber-950/70 via-slate-900 to-emerald-950/70',
    border: 'border-amber-500/40',
    text: 'text-amber-300',
  },
  immortal_sage: {
    label: '2. Immortal & Sage Era (Heavenly Court & Immortal World)',
    bg: 'from-indigo-950/70 via-slate-900 to-purple-950/70',
    border: 'border-indigo-500/40',
    text: 'text-indigo-300',
  },
  chaos_dao: {
    label: '3. Great Dao & Cosmic Era (The Chaos)',
    bg: 'from-purple-950/70 via-slate-900 to-rose-950/70',
    border: 'border-purple-500/40',
    text: 'text-purple-300',
  },
  ultimate_origin: {
    label: '4. The Peak: Ultimate Origin Supreme (Han Jue Exclusivity)',
    bg: 'from-amber-950/90 via-purple-950/90 to-blue-950/90',
    border: 'border-amber-400',
    text: 'text-amber-200',
  },
};

const PATH_STYLES: Record<
  CultivationPath,
  {
    activeCard: string;
    badge: string;
    bar: string;
    button: string;
    sphereBorder: string;
  }
> = {
  qi: {
    activeCard: 'bg-amber-950/45 border-amber-400 text-amber-100 shadow-md shadow-amber-500/15',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    bar: 'from-amber-500 via-emerald-400 to-cyan-400',
    button: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20',
    sphereBorder: 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.35)]',
  },
  body: {
    activeCard: 'bg-rose-950/45 border-rose-400 text-rose-100 shadow-md shadow-rose-500/15',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    bar: 'from-rose-500 via-orange-400 to-amber-400',
    button: 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20',
    sphereBorder: 'border-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.35)]',
  },
  soul: {
    activeCard: 'bg-cyan-950/45 border-cyan-400 text-cyan-100 shadow-md shadow-cyan-500/15',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    bar: 'from-cyan-500 via-sky-400 to-indigo-400',
    button: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20',
    sphereBorder: 'border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.35)]',
  },
  mind: {
    activeCard: 'bg-purple-950/45 border-purple-400 text-purple-100 shadow-md shadow-purple-500/15',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    bar: 'from-purple-500 via-fuchsia-400 to-amber-300',
    button: 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/20',
    sphereBorder: 'border-purple-400 shadow-[0_0_30px_rgba(192,132,252,0.35)]',
  },
};

export const CultivationModal: React.FC<CultivationModalProps> = ({
  cultivation,
  resources,
  playerPower,
  weather,
  clanBuffActive,
  onMeditate,
  onBreakthrough,
  onCraftPill,
  onConsumePill,
  onSurviveTribulation,
  onChangeRoot,
  onEquipManual,
  onUpgradeManual,
  onDiscoverManual,
  onUnlockManualDirect,
  onUpdateCultivation,
  onClose,
}) => {
  const [selectedPath, setSelectedPath] = useState<CultivationPath>('qi');
  const [activeTab, setActiveTab] = useState<TabType>('dantian');
  const [selectedPillForBreakthrough, setSelectedPillForBreakthrough] = useState<string | null>(
    null
  );
  const [breakthroughNotice, setBreakthroughNotice] = useState<string | null>(null);
  const [isTribulationModalOpen, setIsTribulationModalOpen] = useState<boolean>(false);
  const [tribulationStrikesDone, setTribulationStrikesDone] = useState<number>(0);
  const [codexEraFilter, setCodexEraFilter] = useState<CultivationEra | 'all'>('all');
  const [manualPathFilter, setManualPathFilter] = useState<CultivationPath | 'all'>('all');
  const [suppressionTargetRealm, setSuppressionTargetRealm] = useState<number>(0); // Default Qi Refinement
  const [lineageNotice, setLineageNotice] = useState<string | null>(null);

  const karmaState = cultivation.karma || INITIAL_KARMA_STATE;
  const disciplesList = cultivation.disciples || INITIAL_DISCIPLES;
  const masterTaxRatePct = cultivation.masterTaxRatePct ?? 20;
  const learnedMysticalSkills = cultivation.learnedMysticalSkills || ['skill_heaven_earth_sleeve'];
  const skillScrollInventory = cultivation.skillScrollInventory || [];
  const spiritStones = cultivation.spiritStones ?? 48_000n;
  const masteredGreatDaos = cultivation.masteredGreatDaos ?? 4;
  const activeAuraRealmIndex =
    typeof cultivation.auraOverrideRealmIndex === 'number'
      ? cultivation.auraOverrideRealmIndex
      : cultivation.paths.qi.realmIndex;

  const masterDiscipleEconomy = calculateMasterDiscipleEconomy({
    masterRealmIndex: cultivation.paths.qi.realmIndex,
    disciples: disciplesList,
    masterTaxRatePct,
  });
  const activeAuraSpec = getCultivationAuraVisualSpec(activeAuraRealmIndex, masteredGreatDaos);
  const suppressionResult = calculateRealmSuppression(
    cultivation.paths.qi.realmIndex,
    suppressionTargetRealm
  );

  const pathProgress = cultivation.paths[selectedPath];
  const pathMeta = CULTIVATION_PATH_META[selectedPath];
  const pathStyle = PATH_STYLES[selectedPath];
  const pathRealms = CULTIVATION_PATHS_REALMS[selectedPath];
  const currentRealm = getRealmDef(selectedPath, pathProgress.realmIndex);

  const mindProgress = cultivation.paths.mind;
  const mindBonuses = calculateMindCultivationBonuses(mindProgress.realmIndex, mindProgress.layer);
  const fourPathSynergy = calculateFourPathSynergy(cultivation.paths);
  const manualsSummary = calculateEquippedManualsSummary(
    cultivation.equippedManuals,
    cultivation.ownedManuals
  );
  const activeManualSummary = manualsSummary.byPath[selectedPath];
  const veteranScrollBonuses = calculateVeteranScrollBonuses(
    cultivation.veteranScrollsComprehended ?? 0
  );

  const requiredEnergy = calculateQiRequired(
    pathProgress.realmIndex,
    pathProgress.layer,
    selectedPath
  );
  const pathMultiplier = calculateCultivationMultiplier(
    pathProgress.realmIndex,
    pathProgress.layer,
    selectedPath
  );
  const energyPct = Math.min(
    100,
    Number((pathProgress.currentEnergy * 100n) / (requiredEnergy || 1n))
  );
  const passiveRate = calculatePassiveQiRate(
    pathProgress.realmIndex,
    weather,
    clanBuffActive,
    selectedPath,
    mindProgress.realmIndex,
    mindProgress.layer,
    activeManualSummary.passiveRateBoostPct + veteranScrollBonuses.passiveSpeedBonusPct
  );
  const eraTheme = ERA_THEMES[currentRealm.era];

  // Manual cultivation channeling for the active path
  const handleManualChannel = () => {
    const burst = passiveRate * 12n + 150n;
    onMeditate(selectedPath, burst);
    sound.playSwing();
  };

  // Attempt breakthrough on the active path
  const handleAttemptBreakthrough = () => {
    let pillBonus = 0;
    if (selectedPillForBreakthrough) {
      const pill = CULTIVATION_PILLS.find((p) => p.id === selectedPillForBreakthrough);
      if (pill) {
        pillBonus = pill.successRateBoostPct;
        onConsumePill(pill.id);
        setSelectedPillForBreakthrough(null);
      }
    }

    const evaluation = evaluateBreakthroughAttempt({
      realmIndex: pathProgress.realmIndex,
      layer: pathProgress.layer,
      currentQi: pathProgress.currentEnergy,
      requiredQi: requiredEnergy,
      pillBonusPct: pillBonus,
      mindBonusPct: mindBonuses.breakthroughBonusPct,
      manualBonusPct:
        activeManualSummary.breakthroughBoostPct + veteranScrollBonuses.breakthroughSuccessBonusPct,
      path: selectedPath,
    });

    if (evaluation.needsTribulation) {
      setIsTribulationModalOpen(true);
      setTribulationStrikesDone(0);
      setBreakthroughNotice(evaluation.message);
      sound.playUpgradeFanfare();
    } else if (evaluation.success) {
      onBreakthrough(selectedPath, evaluation.newRealmIndex, evaluation.newLayer);
      setBreakthroughNotice(evaluation.message);
      confetti({ particleCount: 70, spread: 80 });
      sound.playUpgradeFanfare();
    } else {
      setBreakthroughNotice(evaluation.message);
      sound.playSwing();
    }
  };

  const weatherConf = WEATHER_CONFIGS[weather] || WEATHER_CONFIGS.clear;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border-2 border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div
          className={`shrink-0 relative px-4 sm:px-6 py-3.5 bg-gradient-to-r ${eraTheme.bg} border-b ${eraTheme.border} flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-slate-950/80 border border-amber-500/40 shadow-inner">
              {currentRealm.icon}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-bold border ${pathStyle.badge}`}
                >
                  {pathMeta.name}
                </span>
                <h2 className="text-base sm:text-xl font-bold font-cinzel text-amber-100 flex items-center gap-2">
                  <span>{currentRealm.name}</span>
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-400/40">
                  Layer {pathProgress.layer} / 9
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-400/30">
                  {fourPathSynergy.totalCombinedMultiplier.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })}
                  x Total 4-Path Multiplier
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                {eraTheme.label} ·{' '}
                <span className="font-mono text-emerald-300">
                  Secluded {cultivation.secludedYears} Years
                </span>{' '}
                ·{' '}
                <span className="font-mono text-purple-300">
                  Dao Heart Speed {mindBonuses.cultivationSpeedMult}x
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs font-mono text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />+{formatBigInt(passiveRate)}{' '}
              {pathMeta.energyName}/s
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* FOUR SUPREME CULTIVATION PATHS SELECTOR (Qi / Body / Soul / Mind) */}
        <div className="shrink-0 bg-slate-950/90 border-b border-slate-800 px-4 sm:px-6 py-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CULTIVATION_PATH_LIST.map((pathKey) => {
              const meta = CULTIVATION_PATH_META[pathKey];
              const prog = cultivation.paths[pathKey];
              const realmDef = getRealmDef(pathKey, prog.realmIndex);
              const isSelected = selectedPath === pathKey;
              const style = PATH_STYLES[pathKey];

              return (
                <button
                  key={pathKey}
                  onClick={() => {
                    setSelectedPath(pathKey);
                    setBreakthroughNotice(null);
                    sound.playSwing();
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? style.activeCard
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl shrink-0">{meta.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold font-cinzel truncate flex items-center gap-1">
                        <span>{meta.name}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-300 truncate">
                        {realmDef.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border ${style.badge}`}
                    >
                      L{prog.layer}/9
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="shrink-0 flex border-b border-slate-800 bg-slate-950/70 px-4 sm:px-6 gap-1 sm:gap-2 pt-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'dantian', label: `${pathMeta.vesselName} & 4-Path Resonance`, icon: Flame },
            { id: 'breakthrough', label: `Breakthrough (${pathProgress.layer}/9)`, icon: Zap },
            {
              id: 'manuals',
              label: `Ancient Manuals (${Object.keys(cultivation.ownedManuals).length}/${CULTIVATION_MANUALS.length})`,
              icon: ScrollText,
            },
            { id: 'lineage_karma', label: 'Master/Disciple, Karma & Aura', icon: Eye },
            { id: 'codex', label: `23 ${pathMeta.name} Realms`, icon: BookOpen },
            { id: 'alchemy', label: 'Alchemy Cauldron', icon: ShoppingBag },
            { id: 'meridians', label: 'Spiritual Roots', icon: Compass },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  sound.playSwing();
                }}
                className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-t-xl flex items-center gap-1.5 border-t-2 shrink-0 transition-all ${
                  active
                    ? 'bg-slate-900 border-amber-400 text-amber-200 shadow-inner'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-slate-200 space-y-5">
          {/* TAB 1: CAVE ABODE, ACTIVE PATH VESSEL & 4-PATH RESONANCE */}
          {activeTab === 'dantian' && (
            <div className="space-y-5">
              {/* Active Path Cultivation Visualizer Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 border border-indigo-500/30 flex flex-col items-center justify-center relative overflow-hidden text-center">
                <div className="absolute w-72 h-72 rounded-full border border-indigo-500/20 animate-spin duration-10000 pointer-events-none" />
                <div className="absolute w-96 h-96 rounded-full border border-purple-500/10 pointer-events-none" />

                <div className="relative z-10 space-y-3.5 max-w-xl w-full">
                  <div
                    className={`relative inline-flex items-center justify-center p-5 rounded-full bg-slate-900/90 border-2 ${pathStyle.sphereBorder} mx-auto animate-pulse`}
                  >
                    <span className="text-5xl select-none">{currentRealm.icon}</span>
                  </div>

                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider text-amber-300/90">
                      {pathMeta.name} — {pathMeta.vesselName}
                    </div>
                    <h3 className="text-xl font-bold font-cinzel text-white flex items-center justify-center gap-2 mt-0.5 flex-wrap">
                      <span>{currentRealm.name}</span>
                      <span className="text-amber-400 font-mono">
                        Layer {pathProgress.layer} / 9
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                      {currentRealm.description}
                    </p>
                    <p className="text-[11px] text-emerald-300 font-mono mt-1">
                      Path Bonus: {pathMeta.combatBonusDesc} (
                      {pathMultiplier.toLocaleString(undefined, { maximumFractionDigits: 1 })}x)
                    </p>
                  </div>

                  {/* Energy Progress Gauge */}
                  <div className="space-y-1.5 w-full">
                    <div className="flex justify-between text-xs font-mono font-bold">
                      <span className="text-amber-300">
                        {pathMeta.vesselName} {pathMeta.energyName} Accumulation
                      </span>
                      <span className="text-emerald-400">
                        {formatBigInt(pathProgress.currentEnergy)} / {formatBigInt(requiredEnergy)}{' '}
                        ({energyPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
                      <div
                        className={`bg-gradient-to-r ${pathStyle.bar} h-full rounded-full transition-all duration-300 shadow-sm`}
                        style={{ width: `${energyPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
                    <button
                      onClick={handleManualChannel}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold font-mono shadow-md active:scale-95 transition-all flex items-center gap-2 ${pathStyle.button}`}
                    >
                      <Sparkles className="w-4 h-4" />
                      {pathMeta.actionVerb} (+{formatBigInt(passiveRate * 12n + 150n)}{' '}
                      {pathMeta.energyName})
                    </button>
                    <button
                      onClick={() => setActiveTab('breakthrough')}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono shadow-md shadow-indigo-600/30 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4 text-amber-300" />
                      Breakthrough Layer ({pathProgress.layer}/9)
                    </button>
                    <button
                      disabled={(cultivation.veteranScrolls ?? 0) <= 0}
                      onClick={() => {
                        if (!onUpdateCultivation) return;
                        onUpdateCultivation((prev) => {
                          const res = applyVeteranScrollToCultivation(prev, selectedPath, 1);
                          if (res.success) {
                            confetti({ particleCount: 55, spread: 70 });
                            sound.playUpgradeFanfare();
                          }
                          return res.updatedCultivation;
                        });
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono border transition-all flex items-center gap-1.5 ${
                        (cultivation.veteranScrolls ?? 0) > 0
                          ? 'bg-amber-950/90 hover:bg-amber-900 border-amber-400 text-amber-200 shadow-md active:scale-95 cursor-pointer'
                          : 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                      title="Comprehend 1 Veteran Scroll (earned from Daily Login Rewards) for +80% Layer Energy, +30 Scripture Fragments, and Permanent +18% Cultivation Speed"
                    >
                      <ScrollText className="w-4 h-4 text-amber-400" />
                      Veteran Scroll ({cultivation.veteranScrolls ?? 0} Owned · +
                      {veteranScrollBonuses.passiveSpeedBonusPct}% Speed)
                    </button>
                  </div>
                </div>
              </div>

              {/* Four-Path Harmony & Combat Resonance Overview */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <h4 className="text-sm font-bold font-cinzel text-amber-300 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-amber-400" />
                      Four-Pillar Supreme Cultivation Resonance (Qi · Body · Soul · Mind)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Cultivating Qi, Body, Soul, and Mind in harmony multiplies your Kingdom Might
                      and eliminates all weaknesses.
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-[11px] text-slate-400">Harmony Resonance</div>
                    <div className="text-sm font-bold text-emerald-400">
                      {fourPathSynergy.resonanceBonusMult}x Resonance ·{' '}
                      {fourPathSynergy.totalCombinedMultiplier.toLocaleString(undefined, {
                        maximumFractionDigits: 1,
                      })}
                      x Total
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-1">
                    <div className="text-xs font-bold text-amber-300 flex items-center justify-between">
                      <span>🧘 Qi Cultivation</span>
                      <span className="font-mono">{fourPathSynergy.qiMult.toFixed(1)}x</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      {getRealmDef('qi', cultivation.paths.qi.realmIndex).name} (L
                      {cultivation.paths.qi.layer})
                    </div>
                    <div className="text-[10px] font-mono text-amber-200/80">
                      Primary Spiritual Might & Spell Base
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/30 space-y-1">
                    <div className="text-xs font-bold text-rose-300 flex items-center justify-between">
                      <span>🛡️ Body Cultivation</span>
                      <span className="font-mono">+{fourPathSynergy.troopHpDefenseBonusPct}%</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      {getRealmDef('body', cultivation.paths.body.realmIndex).name} (L
                      {cultivation.paths.body.layer})
                    </div>
                    <div className="text-[10px] font-mono text-rose-200/80">
                      Troop HP, Citadel Defense & Lightning Resist
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-1">
                    <div className="text-xs font-bold text-cyan-300 flex items-center justify-between">
                      <span>👁️ Soul Cultivation</span>
                      <span className="font-mono">+{fourPathSynergy.troopAttackCritBonusPct}%</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      {getRealmDef('soul', cultivation.paths.soul.realmIndex).name} (L
                      {cultivation.paths.soul.layer})
                    </div>
                    <div className="text-[10px] font-mono text-cyan-200/80">
                      Divine Sense Crit, Troop Attack & Rally Cap
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-purple-500/30 space-y-1">
                    <div className="text-xs font-bold text-purple-300 flex items-center justify-between">
                      <span>🪷 Mind Cultivation</span>
                      <span className="font-mono">
                        +{fourPathSynergy.breakthroughSuccessBonusPct}% Odds
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      {getRealmDef('mind', cultivation.paths.mind.realmIndex).name} (L
                      {cultivation.paths.mind.layer})
                    </div>
                    <div className="text-[10px] font-mono text-purple-200/80">
                      {fourPathSynergy.allPathSpeedMult}x All-Path Speed ·{' '}
                      {mindBonuses.innerDemonImmunityPct}% Demon Immunity
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Grid: Weather, Roots, Clan Spirit Array */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1 text-cyan-300">
                      {weatherConf.icon} Weather Resonance
                    </span>
                    <span className="font-mono text-white capitalize">{weather}</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    {weather === 'storm'
                      ? '⚡ Lightning surges! Body Tempering (+65%) & Qi (+50%) accelerated.'
                      : weather === 'rain'
                        ? '🌧️ Spiritual rain calms the Dao Heart! Mind (+40%) & Qi (+25%) boosted.'
                        : weather === 'snow'
                          ? '❄️ Cold Yin crystalizes Divine Sense! Soul (+40%) & Qi (+20%) boosted.'
                          : '☀️ Solar Yang radiance streams down, steady +15% all-path absorption.'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1 text-amber-300">
                      <Compass className="w-3.5 h-3.5" /> Spiritual Root Affinity
                    </span>
                    <span className="font-mono text-amber-300 capitalize">
                      {cultivation.selectedRoot}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Purity:{' '}
                    <span className="font-mono font-bold text-emerald-400">
                      {cultivation.rootPurityPct}%
                    </span>
                    . Synergizes with troop elemental damage and spell resistance.
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1 text-purple-300">
                      <Layers className="w-3.5 h-3.5" /> Clan Dao Spirit Spring
                    </span>
                    <span
                      className={`font-mono text-xs ${
                        clanBuffActive ? 'text-emerald-400 font-bold' : 'text-slate-500'
                      }`}
                    >
                      {clanBuffActive ? 'ACTIVE (+30%)' : 'Dormant'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    {clanBuffActive
                      ? 'Alliance Spirit Vein is active! All 4 cultivation paths gain +30% rate.'
                      : 'Activate Clan Vault Territory Blessings to accelerate all sect disciples.'}
                  </div>
                </div>
              </div>

              {/* Han Jue Philosophy & Lore */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-amber-400 font-cinzel">
                  {pathMeta.name} Scripture — {currentRealm.name}
                </div>
                <p className="text-xs text-slate-400 italic">"{currentRealm.lore}"</p>
              </div>
            </div>
          )}

          {/* TAB 2: BREAKTHROUGH & TRIBULATION */}
          {activeTab === 'breakthrough' && (
            <div className="space-y-6">
              {breakthroughNotice && (
                <div className="p-3.5 rounded-xl bg-blue-950/60 border border-blue-500/40 text-xs text-blue-200 flex items-center justify-between">
                  <span>{breakthroughNotice}</span>
                  <button
                    onClick={() => setBreakthroughNotice(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Layer Progression Matrix (1 to 9) */}
              <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>
                      [{pathMeta.name}] {currentRealm.name} — Nine Heavenly Layers
                    </span>
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    Target:{' '}
                    {pathProgress.layer === 9
                      ? 'Major Realm Ascension'
                      : `Layer ${pathProgress.layer + 1}`}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((layerNum) => {
                    const isPassed = layerNum < pathProgress.layer;
                    const isCurrent = layerNum === pathProgress.layer;
                    const isPeak = layerNum === 9;

                    return (
                      <div
                        key={layerNum}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isCurrent
                            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/30'
                            : isPassed
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-900/60 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="text-[10px] font-mono font-bold">L{layerNum}</div>
                        <div className="text-sm mt-1">
                          {isPassed ? '✓' : isCurrent ? pathMeta.icon : isPeak ? '⚡' : '○'}
                        </div>
                        <div className="text-[9px] font-mono mt-1 text-slate-400">
                          {isPeak ? 'Peak' : `x${(1 + (layerNum - 1) * 0.12).toFixed(2)}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Breakthrough Attempt Card */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-indigo-500/40 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2 font-cinzel">
                      <Zap className="w-5 h-5 text-amber-400" />
                      {pathProgress.layer === 9
                        ? `Ascension to Next ${pathMeta.name} Realm`
                        : `Advance ${pathMeta.name} to Layer ${pathProgress.layer + 1}`}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {pathProgress.layer === 9
                        ? `Requires withstanding the Heavenly Lightning Tribulation to break into the next ${pathMeta.name} realm!`
                        : `Condenses ${pathMeta.energyName} inside your ${pathMeta.vesselName} to advance to the next layer.`}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">
                      Success Probability (incl. Mind & Manual)
                    </div>
                    <div className="text-lg font-bold font-mono text-emerald-400">
                      {Math.min(
                        100,
                        (pathProgress.layer === 9 ? 60 : 80) +
                          mindBonuses.breakthroughBonusPct +
                          activeManualSummary.breakthroughBoostPct +
                          (selectedPillForBreakthrough
                            ? CULTIVATION_PILLS.find((p) => p.id === selectedPillForBreakthrough)
                                ?.successRateBoostPct || 0
                            : 0)
                      )}
                      %
                      <span className="text-xs text-purple-300 ml-1">
                        (+{mindBonuses.breakthroughBonusPct}% Mind · +
                        {activeManualSummary.breakthroughBoostPct}% Manual)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pill Booster Selection */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-400" /> Apply Alchemy
                    Breakthrough Pill:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CULTIVATION_PILLS.map((pill) => {
                      const count = cultivation.inventoryPills[pill.id] || 0;
                      const isSelected = selectedPillForBreakthrough === pill.id;

                      return (
                        <div
                          key={pill.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400'
                              : 'bg-slate-900/60 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{pill.icon}</span>
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>{pill.name}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono uppercase">
                                  {pill.targetPath}
                                </span>
                              </div>
                              <div className="text-[10px] text-emerald-400 font-mono">
                                +{pill.successRateBoostPct}% Success · Owned: {count}
                              </div>
                            </div>
                          </div>

                          <button
                            disabled={count <= 0}
                            onClick={() =>
                              setSelectedPillForBreakthrough(isSelected ? null : pill.id)
                            }
                            className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : count > 0
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                  : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            {isSelected ? 'Equipped' : count > 0 ? 'Equip' : 'None'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Breakthrough Trigger Button */}
                <button
                  onClick={handleAttemptBreakthrough}
                  disabled={pathProgress.currentEnergy < requiredEnergy}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-lg transition-all ${
                    pathProgress.currentEnergy >= requiredEnergy
                      ? 'bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 shadow-amber-500/20 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  {pathProgress.currentEnergy >= requiredEnergy
                    ? `Commence ${pathMeta.name} Breakthrough (${formatBigInt(requiredEnergy)} ${pathMeta.energyName})`
                    : `Need More ${pathMeta.energyName} (${formatBigInt(pathProgress.currentEnergy)} / ${formatBigInt(requiredEnergy)})`}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2.5: ANCIENT CULTIVATION MANUALS INVENTORY & PAVILION */}
          {activeTab === 'manuals' && (
            <div className="space-y-5">
              {/* Top Pavilion Banner: Discovery & Scripture Fragments */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/60 border border-amber-500/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold font-cinzel text-amber-200 flex items-center gap-2">
                      <ScrollText className="w-5 h-5 text-amber-400" />
                      Jade Pure Sacred Scripture Pavilion
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-xs font-mono font-bold text-amber-300">
                      📜 {cultivation.scriptureFragments} Scripture Fragments
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-2xl">
                    Find, equip, and upgrade ancient techniques across Qi, Body, Soul, and Mind.
                    Each path has 1 active slot that boosts passive gathering rates and breakthrough
                    success chances.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    onClick={() => {
                      onDiscoverManual(true);
                      sound.playSwing();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-200 text-xs font-bold font-mono transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Deduce Insights (+25 📜)
                  </button>
                  <button
                    onClick={() => {
                      onDiscoverManual(false);
                      sound.playUpgradeFanfare();
                    }}
                    disabled={resources.diamond < 200n}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all active:scale-95 flex items-center gap-1.5 shadow-md ${
                      resources.diamond >= 200n
                        ? 'bg-gradient-to-r from-amber-500 to-indigo-500 hover:from-amber-400 hover:to-indigo-400 text-slate-950 shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    Explore Secret Realm (200 💎)
                  </button>
                </div>
              </div>

              {/* Equipped Four-Path Manuals Array */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono text-slate-400 px-1">
                  <span className="font-bold text-slate-200 uppercase tracking-wider">
                    Equipped Four-Pillar Technique Slots (1 Per Path)
                  </span>
                  <span className="text-emerald-400 font-bold">
                    Total Active Boost: +{manualsSummary.totalPassiveBonusPct}% Passive Rate · +
                    {manualsSummary.totalBreakthroughBonusPct}% Breakthrough
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {CULTIVATION_PATH_LIST.map((pathKey) => {
                    const meta = CULTIVATION_PATH_META[pathKey];
                    const slotInfo = manualsSummary.byPath[pathKey];
                    const eqManual = slotInfo.manual;
                    const style = PATH_STYLES[pathKey];

                    return (
                      <div
                        key={pathKey}
                        className={`p-3.5 rounded-xl border bg-slate-900/90 flex flex-col justify-between gap-2 ${
                          eqManual ? 'border-amber-500/40' : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${style.badge}`}
                          >
                            {meta.icon} {meta.name} Slot
                          </span>
                          {eqManual && (
                            <span className="text-[10px] font-mono font-bold text-amber-300">
                              Lv.{slotInfo.level}/{eqManual.maxLevel}
                            </span>
                          )}
                        </div>

                        {eqManual ? (
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{eqManual.icon}</span>
                              <span className="truncate">{eqManual.name}</span>
                            </div>
                            <div className="text-[11px] font-mono text-emerald-400 mt-1">
                              +{slotInfo.passiveRateBoostPct}% {meta.energyName}/s · +
                              {slotInfo.breakthroughBoostPct}% Breakthrough
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic py-1">
                            No manual equipped
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Path Filter Bar for Manuals Inventory */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>
                    Ancient Technique Manuals Inventory (
                    {Object.keys(cultivation.ownedManuals).length}/{CULTIVATION_MANUALS.length}{' '}
                    Discovered)
                  </span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {(['all', 'qi', 'body', 'soul', 'mind'] as const).map((filterKey) => (
                    <button
                      key={filterKey}
                      onClick={() => setManualPathFilter(filterKey)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold uppercase transition-all ${
                        manualPathFilter === filterKey
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {filterKey === 'all'
                        ? 'All Paths (12)'
                        : `${CULTIVATION_PATH_META[filterKey].name}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manuals Inventory Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CULTIVATION_MANUALS.filter(
                  (m) => manualPathFilter === 'all' || m.path === manualPathFilter
                ).map((manual) => {
                  const ownedState = cultivation.ownedManuals[manual.id];
                  const isOwned = Boolean(ownedState);
                  const currentLevel = ownedState ? ownedState.level : 1;
                  const isEquipped = cultivation.equippedManuals[manual.path] === manual.id;
                  const pMeta = CULTIVATION_PATH_META[manual.path];
                  const pStyle = PATH_STYLES[manual.path];
                  const effects = calculateManualEffects(manual.id, currentLevel);
                  const nextEffects =
                    currentLevel < manual.maxLevel
                      ? calculateManualEffects(manual.id, currentLevel + 1)
                      : null;
                  const upgradeCost = calculateManualUpgradeCost(manual, currentLevel);
                  const canAffordUpgrade =
                    isOwned &&
                    !upgradeCost.isMaxLevel &&
                    cultivation.scriptureFragments >= upgradeCost.fragments &&
                    resources.diamond >= upgradeCost.diamonds;
                  const canUnlockDirect = !isOwned && cultivation.scriptureFragments >= 40;

                  return (
                    <div
                      key={manual.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                        isEquipped
                          ? 'bg-amber-950/35 border-amber-400/80 ring-1 ring-amber-400/30'
                          : isOwned
                            ? 'bg-slate-800/75 border-slate-700'
                            : 'bg-slate-900/50 border-slate-800/80 opacity-85'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl p-2 rounded-xl bg-slate-950 border border-slate-700 shrink-0">
                              {manual.icon}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-bold text-white">{manual.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${pStyle.badge}`}
                                >
                                  {pMeta.icon} {pMeta.name}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono uppercase border border-slate-700">
                                  {manual.tier.replace('_', ' ')}
                                </span>
                                {isOwned ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                                    Mastery Lv.{currentLevel}/{manual.maxLevel}
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                    Undiscovered
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300">{manual.description}</p>
                        <p className="text-[11px] text-slate-400 italic">"{manual.lore}"</p>

                        {/* Bonuses Box */}
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono space-y-1">
                          <div className="flex items-center justify-between text-emerald-400 font-bold">
                            <span>
                              {isOwned
                                ? `Active Effects (Lv.${currentLevel}):`
                                : 'Base Effects (Lv.1):'}
                            </span>
                            <span>
                              +{effects.passiveRateBoostPct}% {pMeta.energyName}/s · +
                              {effects.breakthroughBoostPct}% Breakthrough
                            </span>
                          </div>
                          {isOwned && nextEffects && (
                            <div className="flex items-center justify-between text-amber-300/90">
                              <span>Next Level (Lv.{currentLevel + 1}):</span>
                              <span>
                                +{nextEffects.passiveRateBoostPct}% {pMeta.energyName}/s · +
                                {nextEffects.breakthroughBoostPct}% Breakthrough
                              </span>
                            </div>
                          )}
                          {isOwned && !upgradeCost.isMaxLevel && (
                            <div className="text-slate-400">
                              Upgrade Cost: {upgradeCost.fragments} 📜 Fragments ·{' '}
                              {formatBigInt(upgradeCost.diamonds)} 💎
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons: Equip & Upgrade OR Unlock */}
                      {isOwned ? (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => {
                              onEquipManual(manual.path, manual.id);
                              sound.playSwing();
                            }}
                            disabled={isEquipped}
                            aria-label={
                              isEquipped ? `Equipped ${manual.name}` : `Equip ${manual.name}`
                            }
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold font-mono transition-all ${
                              isEquipped
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 cursor-default'
                                : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 active:scale-95'
                            }`}
                          >
                            {isEquipped ? '✓ Equipped in Slot' : `Equip (${pMeta.name})`}
                          </button>

                          <button
                            onClick={() => {
                              if (canAffordUpgrade) {
                                onUpgradeManual(manual.id);
                                sound.playUpgradeFanfare();
                              }
                            }}
                            disabled={!canAffordUpgrade}
                            aria-label={`Upgrade ${manual.name}`}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold font-mono flex items-center justify-center gap-1 transition-all ${
                              upgradeCost.isMaxLevel
                                ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 cursor-default'
                                : canAffordUpgrade
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                            {upgradeCost.isMaxLevel
                              ? 'Max Mastery (Lv.10)'
                              : `Upgrade Lv.${currentLevel + 1} (${upgradeCost.fragments}📜)`}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (canUnlockDirect) {
                              onUnlockManualDirect(manual.id);
                              sound.playUpgradeFanfare();
                            }
                          }}
                          disabled={!canUnlockDirect}
                          aria-label={`Comprehend ${manual.name}`}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-bold font-mono transition-all ${
                            canUnlockDirect
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 active:scale-95'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {canUnlockDirect
                            ? `Comprehend Scripture (40 📜 Fragments)`
                            : `Undiscovered (Need 40 📜 or Explore Secret Realm)`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: 23 REALM CODEX FOR SELECTED PATH */}
          {activeTab === 'codex' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-400" /> All 23 {pathMeta.name} Realms
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Every realm across Mortal, Immortal & Sage, Great Dao Chaos, and Ultimate Origin
                    is divided into 9 layers.
                  </p>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {(
                    ['all', 'mortal', 'immortal_sage', 'chaos_dao', 'ultimate_origin'] as const
                  ).map((era) => (
                    <button
                      key={era}
                      onClick={() => setCodexEraFilter(era)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold capitalize transition-all ${
                        codexEraFilter === era
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {era.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Codex List */}
              <div className="space-y-2.5">
                {pathRealms
                  .filter((r) => codexEraFilter === 'all' || r.era === codexEraFilter)
                  .map((r) => {
                    const isCurrent = r.index === pathProgress.realmIndex;
                    const isUnlocked = r.index <= pathProgress.realmIndex;

                    return (
                      <div
                        key={r.id}
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                          isCurrent
                            ? 'bg-amber-950/40 border-amber-400/80 ring-2 ring-amber-400/30'
                            : isUnlocked
                              ? 'bg-slate-800/80 border-slate-700'
                              : 'bg-slate-900/40 border-slate-800/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <span className="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-700 shrink-0">
                            {r.icon}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs text-amber-400">
                                #{r.index + 1}
                              </span>
                              <span className="text-sm font-bold text-white">{r.name}</span>
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-700 text-slate-300 font-mono">
                                9 Layers
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-400/40">
                                  CURRENT REALM (L{pathProgress.layer}/9)
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 mt-1">{r.description}</p>
                            <p className="text-[11px] text-slate-400 italic mt-0.5">"{r.lore}"</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 self-end sm:self-center font-mono">
                          <div className="text-xs text-slate-400">Realm Base Multiplier</div>
                          <div className="text-sm font-bold text-amber-300">
                            {r.basePowerMultiplier.toLocaleString()}x Power
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 4: ALCHEMY CAULDRON */}
          {activeTab === 'alchemy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-400" /> Immortal Four-Path Alchemy
                    Cauldron
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Refine sacred herbs, dragon blood, and bodhi seeds into pills that grant instant
                    energy to your active path ({pathMeta.name}) and boost breakthrough odds.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CULTIVATION_PILLS.map((pill) => {
                  const owned = cultivation.inventoryPills[pill.id] || 0;
                  const canAfford =
                    resources.wood >= pill.costHerbWood &&
                    resources.grain >= pill.costHerbGrain &&
                    resources.diamond >= pill.costDiamonds;

                  const targetLabel =
                    pill.targetPath === 'all'
                      ? 'All 4 Paths'
                      : CULTIVATION_PATH_META[pill.targetPath].name;

                  return (
                    <div
                      key={pill.id}
                      className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-700">
                            {pill.icon}
                          </span>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                              <span>{pill.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                                {targetLabel}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                                Owned: {owned}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{pill.description}</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-900/60 text-[11px] font-mono text-slate-300 space-y-0.5">
                        <div className="text-emerald-400 font-bold">
                          +{pill.successRateBoostPct}% Breakthrough Odds · +
                          {formatBigInt(pill.qiBonus)} Instant Energy
                        </div>
                        <div className="text-slate-400">
                          Cost: {formatBigInt(pill.costHerbWood)} Wood (Herbs) ·{' '}
                          {formatBigInt(pill.costHerbGrain)} Grain ·{' '}
                          {formatBigInt(pill.costDiamonds)} 💎
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (canAfford) {
                            const targetPathForEnergy: CultivationPath =
                              pill.targetPath === 'all' ? selectedPath : pill.targetPath;
                            onCraftPill(pill, targetPathForEnergy);
                            sound.playUpgradeFanfare();
                          }
                        }}
                        disabled={!canAfford}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold font-mono transition-all ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {canAfford
                          ? `Refine Pill (+Energy to ${targetLabel})`
                          : 'Need More Materials'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: SPIRITUAL ROOTS */}
          {activeTab === 'meridians' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-400" /> Five Elements & Primordial
                  Spiritual Roots
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your innate spiritual root shapes how cosmic energy flows through your Qi, Body,
                  Soul, and Mind vessels.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    id: 'lightning' as const,
                    name: 'Heavenly Thunder Root',
                    icon: '⚡',
                    desc: 'Chain lightning resonates through Bomber artillery & Body Tempering. +30% Storm meditation.',
                  },
                  {
                    id: 'void' as const,
                    name: 'Primordial Void Root',
                    icon: '🌌',
                    desc: 'Han Jue’s favorite concealment aura. +25% Critical dodge, Soul stealth & Mind tranquility.',
                  },
                  {
                    id: 'fire' as const,
                    name: 'True Sun Dragon Root',
                    icon: '🔥',
                    desc: 'Incinerates enemy vanguard defense. +20% pure troop attack & Blood Essence boiling.',
                  },
                  {
                    id: 'water' as const,
                    name: 'Abyssal Dewdrop Root',
                    icon: '💧',
                    desc: 'Continuous meridian and Dao Heart cleansing. +25% Rain weather cultivation.',
                  },
                  {
                    id: 'earth' as const,
                    name: 'Immortal Granite Leyline Root',
                    icon: '🛡️',
                    desc: 'Fortifies castle walls, Body vessels, and Shieldbearers with unbreakable stone shields.',
                  },
                  {
                    id: 'chaos' as const,
                    name: 'Chaos Primordial Origin Root',
                    icon: '🪐',
                    desc: 'Absorbs all elemental laws without conflict. +50% Qi, Body, Soul, and Mind cultivation rates.',
                  },
                ].map((root) => {
                  const isSelected = cultivation.selectedRoot === root.id;

                  return (
                    <div
                      key={root.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-400/80 ring-2 ring-amber-400/30'
                          : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800/90'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-700">
                          {root.icon}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            {root.name}
                            {isSelected && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">{root.desc}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onChangeRoot(root.id);
                          sound.playUpgradeFanfare();
                        }}
                        className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold font-mono transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 cursor-default'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {isSelected ? 'Channeling Root' : 'Attune Root'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: MASTER/DISCIPLE HIERARCHY, THE KARMA SYSTEM, REALM SUPPRESSION & AURA VISUALIZER */}
          {activeTab === 'lineage_karma' && (
            <div className="space-y-6">
              {lineageNotice && (
                <div className="p-3.5 rounded-xl bg-amber-950/75 border border-amber-400/50 text-xs font-mono text-amber-200 flex items-center justify-between gap-2">
                  <span>{lineageNotice}</span>
                  <button
                    onClick={() => setLineageNotice(null)}
                    className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* 1. REALM SUPPRESSION (Golden Core deals 100x damage to Qi Refinement) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-rose-950/40 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold font-cinzel text-amber-200 flex items-center gap-2">
                      <span>⚔️ 1. Realm Suppression Law (境界绝对压制 · 10^ΔRealm)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono">
                        Golden Core vs Qi Refinement = 100x Damage
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Each major realm above an opponent multiplies damage dealt by 10x (2 realms =
                      100x, 3 realms = 1,000x) and crushes incoming attacks.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-mono">
                      Your Qi Cultivation Realm
                    </div>
                    <div className="text-sm font-bold text-amber-300 mt-0.5">
                      [{cultivation.paths.qi.realmIndex}]{' '}
                      {getRealmDef('qi', cultivation.paths.qi.realmIndex).name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Layer {cultivation.paths.qi.layer} / 9
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <label
                      htmlFor="suppression-target-select"
                      className="block text-[11px] text-slate-400 font-mono mb-1"
                    >
                      Target Cultivator Realm to Suppress
                    </label>
                    <select
                      id="suppression-target-select"
                      value={suppressionTargetRealm}
                      onChange={(e) => setSuppressionTargetRealm(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                    >
                      {CULTIVATION_REALMS.map((r) => (
                        <option key={r.id} value={r.index}>
                          [{r.index}] {r.name} ({r.chineseName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40">
                    <div className="text-[11px] text-amber-300 font-mono font-bold">
                      Active Suppression Multiplier
                    </div>
                    <div className="text-lg font-mono font-bold text-white mt-0.5">
                      {suppressionResult.damageMultiplier >= 1
                        ? `${suppressionResult.damageMultiplier.toLocaleString()}x Damage`
                        : `${suppressionResult.damageMultiplier}x (Suppressed)`}
                    </div>
                    <div className="text-[11px] text-emerald-300 font-mono">
                      Damage Reduction Taken: {suppressionResult.incomingDamageReductionPct}%
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. THE KARMA SYSTEM (Red Name Fiend, Tribulation Lightning, Bounty & Loot Drop) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/50 via-slate-900 to-indigo-950/50 border border-rose-500/40 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold font-cinzel text-rose-200 flex items-center gap-2">
                      <span>⚡ 2. The Karma System (因果红名 · 天罚雷劫与悬赏爆装)</span>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold border ${
                          karmaState.alignment === 'red_fiend'
                            ? 'bg-rose-600/30 border-rose-400 text-rose-200 animate-pulse'
                            : karmaState.alignment === 'gold_justice'
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                              : 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                        }`}
                      >
                        {karmaState.alignment === 'red_fiend'
                          ? '🩸 RED NAME FIEND'
                          : karmaState.alignment === 'gold_justice'
                            ? '⚖️ GOLD NAME · JUSTICE'
                            : '🟢 GREEN NAME · INNOCENT'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Killing a Green-Name lower-realm player turns your Karma negative (Red Name):
                      (1) Stationary Red-Name players are struck by Instant-Kill Tribulation
                      Lightning, (2) Location is revealed on the map with a Bounty to Justice
                      players, and (3) Dying as a Red-Name drops equipped manuals/items!
                    </p>
                  </div>
                </div>

                {/* Karma Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-mono">Karma Value</div>
                    <div
                      className={`text-lg font-mono font-bold mt-0.5 ${
                        karmaState.karmaValue < 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {karmaState.karmaValue > 0
                        ? `+${karmaState.karmaValue}`
                        : karmaState.karmaValue}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Unlawful PKs: {karmaState.unlawfulKills} · Justice Kills:{' '}
                      {karmaState.righteousKills}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-mono">
                      1. Tribulation Lock-On
                    </div>
                    <div className="text-lg font-mono font-bold text-amber-300 mt-0.5">
                      {karmaState.karmaValue < 0
                        ? `${karmaState.stationarySeconds}s / ${karmaState.maxStationaryThresholdSec}s`
                        : 'Dormant (Safe)'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {karmaState.karmaValue < 0
                        ? 'Keep moving or face instant-kill lightning!'
                        : 'Only strikes Red-Name Fiends'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-mono">
                      2. Justice Map Bounty
                    </div>
                    <div className="text-lg font-mono font-bold text-rose-300 mt-0.5">
                      {formatBigInt(karmaState.bountySpiritStones)} Stones
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {karmaState.isLocationRevealed
                        ? '📍 Coordinates Revealed on Radar!'
                        : '🛡️ Hidden in Seclusion'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-mono">
                      3. Red-Name Loot Risk
                    </div>
                    <div className="text-sm font-mono font-bold text-purple-300 mt-1 truncate">
                      {karmaState.droppedLootHistory.length > 0
                        ? `Last Dropped: ${karmaState.droppedLootHistory[0]}`
                        : karmaState.karmaValue < 0
                          ? '⚠️ Equipped Manuals At Risk!'
                          : 'Protected (Green Name)'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Drops equipped items on Red-Name death
                    </div>
                  </div>
                </div>

                {/* Interactive Karma & Tribulation Action Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => {
                      sound.playSwing();
                      const res = evaluatePvPKillKarma({
                        currentKarma: karmaState,
                        attackerRealmIndex: Math.max(2, cultivation.paths.qi.realmIndex),
                        victimRealmIndex: 0,
                        victimKarmaValue: 100, // Green-Name Innocent
                        victimName: 'Junior Disciple Lin (Qi Refinement)',
                      });
                      setLineageNotice(res.message);
                      if (onUpdateCultivation) {
                        onUpdateCultivation((prev) => ({
                          ...prev,
                          karma: res.updatedKarma,
                        }));
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl bg-rose-600/25 hover:bg-rose-600/40 border border-rose-500/50 text-rose-200 text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    🩸 Slay Green-Name Low-Level Player (Turn Red Name)
                  </button>

                  <button
                    onClick={() => {
                      sound.playThunder();
                      const stepRes = tickRedNameStationaryLightning({
                        karma:
                          karmaState.karmaValue < 0
                            ? karmaState
                            : {
                                ...karmaState,
                                karmaValue: -300,
                                alignment: 'red_fiend',
                                isLocationRevealed: true,
                                bountySpiritStones: 100_000n,
                              },
                        isMoving: false,
                        deltaSec: 4,
                      });

                      if (stepRes.struckByInstantKillLightning) {
                        const dropRes = resolveRedNameDeathLootDrop({
                          karma: stepRes.updatedKarma,
                          equippedManuals: cultivation.equippedManuals,
                          inventoryPills: cultivation.inventoryPills,
                        });
                        setLineageNotice(
                          `${stepRes.warningMessage} High-Risk Death Penalty: Dropped [${dropRes.droppedItemName}]!`
                        );
                        if (onUpdateCultivation) {
                          onUpdateCultivation((prev) => ({
                            ...prev,
                            equippedManuals: dropRes.updatedEquippedManuals,
                            inventoryPills: dropRes.updatedInventoryPills,
                            karma: dropRes.updatedKarma,
                          }));
                        }
                      } else {
                        setLineageNotice(
                          stepRes.warningMessage ||
                            `⚡ Stationary Red-Name Timer: ${stepRes.updatedKarma.stationarySeconds}s / ${stepRes.updatedKarma.maxStationaryThresholdSec}s. Linger once more to trigger Instant-Kill Tribulation Lightning!`
                        );
                        if (onUpdateCultivation) {
                          onUpdateCultivation((prev) => ({
                            ...prev,
                            karma: stepRes.updatedKarma,
                          }));
                        }
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl bg-amber-600/25 hover:bg-amber-600/40 border border-amber-500/50 text-amber-200 text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    ⚡ Camp Stationary (+4s Tribulation Lightning Test)
                  </button>

                  <button
                    onClick={() => {
                      sound.playUpgradeFanfare();
                      const res = evaluatePvPKillKarma({
                        currentKarma: karmaState,
                        attackerRealmIndex: cultivation.paths.qi.realmIndex,
                        victimRealmIndex: cultivation.paths.qi.realmIndex,
                        victimKarmaValue: -450, // Red-Name Demonic Fiend
                        victimName: 'Blood Sea Patriarch [Red Name]',
                      });
                      setLineageNotice(res.message);
                      if (onUpdateCultivation) {
                        onUpdateCultivation((prev) => ({
                          ...prev,
                          karma: {
                            ...res.updatedKarma,
                            stationarySeconds: 0,
                          },
                          spiritStones:
                            (prev.spiritStones ?? 48_000n) + res.bountyEarnedSpiritStones,
                        }));
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/50 text-emerald-200 text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    ⚖️ Hunt Red-Name Bounty (+150 Karma & Spirit Stones)
                  </button>
                </div>
              </div>

              {/* 3. SOCIAL STRUCTURE: MASTER & DISCIPLE HIERARCHY (Resource Funneling & Skill Transmission) */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/40 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold font-cinzel text-cyan-200 flex items-center gap-2">
                      <span>
                        🏯 5. Social Structure: Master & Disciple Hierarchy (师徒体系 ·
                        资源反哺与神通传功)
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono font-bold">
                        Spirit Stones: {formatBigInt(spiritStones)} 💎
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Replaces standard parties with a Master-Disciple lineage: Disciples within 50m
                      gain a{' '}
                      <span className="text-emerald-300 font-mono font-bold">
                        +{masterDiscipleEconomy.proximitySpeedBuffPct}%
                      </span>{' '}
                      cultivation speed aura, while the Master collects a{' '}
                      <span className="text-amber-300 font-mono font-bold">
                        {masterTaxRatePct}%
                      </span>{' '}
                      Spirit Stone & Qi tax and passes down rare Skill Scrolls!
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        sound.playUpgradeFanfare();
                        if (onUpdateCultivation) {
                          onUpdateCultivation((prev) => ({
                            ...prev,
                            disciples: (prev.disciples || INITIAL_DISCIPLES).map((d) => ({
                              ...d,
                              distanceMeters: 15,
                            })),
                          }));
                        }
                        setLineageNotice(
                          '🔔 Summoned all Disciples into your Cave Abode (<50m)! All Disciples now receive the Master Proximity Cultivation Speed Buff!'
                        );
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-mono font-bold cursor-pointer"
                    >
                      🔔 Summon All Disciples (&lt;50m Aura)
                    </button>

                    <button
                      onClick={() => {
                        sound.playButton();
                        const bonusStones =
                          masterDiscipleEconomy.totalMasterTaxSpiritStonesPerSec * 30n;
                        const bonusQi = masterDiscipleEconomy.totalMasterTaxQiPerSec * 30n;
                        if (onUpdateCultivation) {
                          onUpdateCultivation((prev) => ({
                            ...prev,
                            spiritStones: (prev.spiritStones ?? 48_000n) + bonusStones,
                            currentQi: prev.currentQi + bonusQi,
                            paths: {
                              ...prev.paths,
                              qi: {
                                ...prev.paths.qi,
                                currentEnergy: prev.paths.qi.currentEnergy + bonusQi,
                              },
                            },
                          }));
                        }
                        setLineageNotice(
                          `💰 Collected Filial Disciple Tax Tribute: +${formatBigInt(bonusStones)} Spirit Stones & +${formatBigInt(bonusQi)} Spiritual Qi!`
                        );
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold cursor-pointer"
                    >
                      💰 Harvest Disciple Tax (+
                      {formatBigInt(masterDiscipleEconomy.totalMasterTaxSpiritStonesPerSec * 30n)})
                    </button>
                  </div>
                </div>

                {/* Master Tax Slider */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label
                      htmlFor="master-tax-slider"
                      className="text-xs font-bold text-amber-300 font-mono"
                    >
                      Master Resource Funnel Tax Rate: {masterTaxRatePct}% of Disciple Loot & Spirit
                      Stones
                    </label>
                    <div className="text-[11px] text-slate-400">
                      Master Passive Tax Income: +
                      {formatBigInt(masterDiscipleEconomy.totalMasterTaxSpiritStonesPerSec)} Spirit
                      Stones/s & +{formatBigInt(masterDiscipleEconomy.totalMasterTaxQiPerSec)} Qi/s
                    </div>
                  </div>
                  <input
                    id="master-tax-slider"
                    type="range"
                    min={5}
                    max={50}
                    step={5}
                    value={masterTaxRatePct}
                    onChange={(e) => {
                      const nextTax = Number(e.target.value);
                      if (onUpdateCultivation) {
                        onUpdateCultivation((prev) => ({
                          ...prev,
                          masterTaxRatePct: nextTax,
                        }));
                      }
                    }}
                    className="w-full sm:w-56 accent-amber-400"
                  />
                </div>

                {/* Disciples Roster Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {disciplesList.map((disc) => {
                    const breakdown = masterDiscipleEconomy.discipleBreakdowns.find(
                      (b) => b.discipleId === disc.id
                    );
                    const realmDef = getRealmDef('qi', disc.realmIndex);
                    return (
                      <div
                        key={disc.id}
                        className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between gap-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-700">
                              {disc.avatarIcon}
                            </span>
                            <div>
                              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                                <span>{disc.name}</span>
                                <span className="text-[10px] text-cyan-300 font-mono">
                                  ({disc.chineseName})
                                </span>
                              </div>
                              <div className="text-xs text-amber-300 font-mono">
                                {realmDef.name} · Layer {disc.layer}/9 · Loyalty {disc.loyalty}%
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                              breakdown?.isNearMaster
                                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                          >
                            {breakdown?.isNearMaster
                              ? `Near Master (${disc.distanceMeters}m · +${breakdown.effectiveBuffPct}% Speed)`
                              : `Expedition (${disc.distanceMeters}m)`}
                          </span>
                        </div>

                        <div className="text-[11px] font-mono text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                          <span>
                            Master Tax Tribute:{' '}
                            <strong className="text-amber-300">
                              +{formatBigInt(breakdown?.taxedToMasterSpiritStones || 0n)} Stones/s
                            </strong>
                          </span>
                          <span>
                            Transmitted Skills:{' '}
                            <strong className="text-purple-300">
                              {disc.equippedSkills.length}
                            </strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Transmission: Create & Bestow Skill Scrolls (Mystical Power: Heaven Earth Sleeve) */}
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                        📜 Skill Transmission (神通传功玉简 — Economy Skill Scrolls)
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        Transcribe learned Mystical Powers (like <em>Heaven Earth Sleeve</em>) into
                        transferable Skill Scrolls to bestow upon loyal disciples or trade for
                        Spirit Stones.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-500/40">
                      Scrolls in Bag: {skillScrollInventory.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {MYSTICAL_POWER_SKILLS.map((skill) => {
                      const isLearned = learnedMysticalSkills.includes(skill.id);
                      return (
                        <div
                          key={skill.id}
                          className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>{skill.icon}</span>
                                <span>{skill.name}</span>
                              </span>
                              <span className="text-[10px] font-mono text-amber-300">
                                {skill.chineseName}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">{skill.description}</p>
                            <div className="text-[10px] font-mono text-cyan-300 mt-1">
                              Market Value: {formatBigInt(skill.marketValueSpiritStones)} Spirit
                              Stones · Transcribe Cost: {formatBigInt(skill.transcriptionCostQi)} Qi
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            {!isLearned ? (
                              <button
                                onClick={() => {
                                  sound.playUpgradeFanfare();
                                  if (onUpdateCultivation) {
                                    onUpdateCultivation((prev) => ({
                                      ...prev,
                                      learnedMysticalSkills: [
                                        ...(prev.learnedMysticalSkills || [
                                          'skill_heaven_earth_sleeve',
                                        ]),
                                        skill.id,
                                      ],
                                    }));
                                  }
                                  setLineageNotice(
                                    `✨ Mastered [${skill.name} (${skill.chineseName})]! You can now transcribe Skill Scrolls for your disciples.`
                                  );
                                }}
                                className="w-full py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold cursor-pointer"
                              >
                                Enlighten & Learn Technique
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    sound.playSwing();
                                    const res = createTransmissionSkillScroll({
                                      skillId: skill.id,
                                      masterName: 'Patriarch Han Jue',
                                      currentQi: cultivation.paths.qi.currentEnergy + 10_000_000n,
                                      currentDiamonds: resources.diamond + 10_000n,
                                      learnedSkills: learnedMysticalSkills,
                                    });
                                    setLineageNotice(res.message);
                                    if (res.success && res.scroll && onUpdateCultivation) {
                                      onUpdateCultivation((prev) => ({
                                        ...prev,
                                        skillScrollInventory: [
                                          res.scroll!,
                                          ...(prev.skillScrollInventory || []),
                                        ],
                                      }));
                                    }
                                  }}
                                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-mono font-bold cursor-pointer"
                                >
                                  📜 Create Skill Scroll
                                </button>
                                <button
                                  onClick={() => {
                                    sound.playUpgradeFanfare();
                                    if (onUpdateCultivation) {
                                      onUpdateCultivation((prev) => ({
                                        ...prev,
                                        disciples: (prev.disciples || INITIAL_DISCIPLES).map(
                                          (d, idx) =>
                                            idx === 0 && !d.equippedSkills.includes(skill.id)
                                              ? {
                                                  ...d,
                                                  loyalty: 100,
                                                  equippedSkills: [...d.equippedSkills, skill.id],
                                                }
                                              : d
                                        ),
                                        spiritStones:
                                          (prev.spiritStones ?? 48_000n) +
                                          skill.marketValueSpiritStones,
                                      }));
                                    }
                                    setLineageNotice(
                                      `🎁 Transmitted [${skill.name}] Scroll to Chief Disciple & Sect Economy (+${formatBigInt(skill.marketValueSpiritStones)} Spirit Stones)!`
                                    );
                                  }}
                                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/40 text-emerald-200 text-[11px] font-mono font-bold cursor-pointer"
                                >
                                  🎁 Bestow to Disciple
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 4. VISUALIZING POWER (THE "AURA" — No Overhead Level Numbers, HDR10+ Visual Cues) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-amber-950/50 border border-purple-500/40 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold font-cinzel text-purple-200 flex items-center gap-2">
                      <span>
                        ✨ 6. Visualizing Power: The "Aura" (无等级头衔 · 境界异象显化 & HDR10+)
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200 font-mono font-bold">
                        {activeAuraSpec.hdrPeakLuminanceNits} Nits HDR10+
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Immortal cultivators never display crude level numbers above their heads.
                      Instead, power is recognized by unmistakable 3D & HDR10+ visual cues!
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { idx: 0, title: 'Qi Refinement', cue: 'No Aura (Mortal)', icon: '🧘' },
                    { idx: 1, title: 'Foundation', cue: 'Faint White Glow', icon: '🌫️' },
                    { idx: 2, title: 'Golden Core', cue: 'Spinning Golden Core', icon: '🔮' },
                    { idx: 3, title: 'Nascent Soul', cue: 'Floating Baby Avatar', icon: '👶' },
                    {
                      idx: 21,
                      title: 'Dao Creator',
                      cue: `${masteredGreatDaos} Divine Halos`,
                      icon: '☀️',
                    },
                  ].map((item) => {
                    const isSelected = activeAuraRealmIndex === item.idx;
                    return (
                      <button
                        key={item.idx}
                        onClick={() => {
                          sound.playSwing();
                          if (onUpdateCultivation) {
                            onUpdateCultivation((prev) => ({
                              ...prev,
                              auraOverrideRealmIndex: item.idx,
                            }));
                          }
                          setLineageNotice(
                            `✨ 3D Avatar Aura switched to [${item.title}]: ${item.cue} (Rendered live on your 3D character)!`
                          );
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-950/70 border-amber-400 text-white shadow-md shadow-amber-500/15'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-xl">{item.icon}</div>
                        <div className="text-xs font-bold font-cinzel mt-1">{item.title}</div>
                        <div className="text-[10px] font-mono text-amber-300 mt-0.5">
                          {item.cue}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-amber-300 font-mono">
                      Active 3D & Vulkan HDR10+ Aura: {activeAuraSpec.label} (
                      {activeAuraSpec.chineseLabel})
                    </div>
                    <p className="text-xs text-slate-300">{activeAuraSpec.description}</p>
                    <div className="text-[11px] font-mono text-cyan-300">
                      Translucent Chest Core:{' '}
                      {activeAuraSpec.hasTranslucentChestCore ? 'YES' : 'NO'} · Floating Nascent
                      Baby: {activeAuraSpec.hasFloatingBabyAvatar ? 'YES' : 'NO'} · Divine Halos:{' '}
                      {activeAuraSpec.haloCount}
                    </div>
                  </div>

                  <div className="w-full sm:w-64 shrink-0">
                    <label
                      htmlFor="great-dao-halos-slider"
                      className="block text-[11px] font-mono text-purple-300 mb-1"
                    >
                      Great Dao Rules Mastered: {masteredGreatDaos} Divine Halos
                    </label>
                    <input
                      id="great-dao-halos-slider"
                      type="range"
                      min={1}
                      max={12}
                      value={masteredGreatDaos}
                      onChange={(e) => {
                        const count = Number(e.target.value);
                        if (onUpdateCultivation) {
                          onUpdateCultivation((prev) => ({
                            ...prev,
                            masteredGreatDaos: count,
                          }));
                        }
                      }}
                      className="w-full accent-purple-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* HEAVENLY TRIBULATION MODAL POPUP */}
        {isTribulationModalOpen && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center animate-in fade-in duration-200">
            <div className="max-w-md space-y-4">
              <div className="p-4 rounded-full bg-rose-500/10 border-2 border-rose-500 inline-flex items-center justify-center text-5xl animate-bounce">
                ⚡
              </div>

              <div>
                <h3 className="text-xl font-bold font-cinzel text-amber-300">
                  {pathMeta.name} Heavenly Tribulation (九天神雷劫)
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  The Heavenly Dao tests your {pathMeta.vesselName} before allowing ascension to the
                  next sovereign realm!
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
                <div>
                  Celestial Strikes: {tribulationStrikesDone} / {currentRealm.tribulationRounds}
                </div>
                <div>
                  Your Combat Might:{' '}
                  <span className="text-amber-300 font-bold">{formatBigInt(playerPower)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  const nextStrike = tribulationStrikesDone + 1;
                  setTribulationStrikesDone(nextStrike);
                  sound.playSwing();

                  if (nextStrike >= currentRealm.tribulationRounds) {
                    setIsTribulationModalOpen(false);
                    const nextRealm = Math.min(pathRealms.length - 1, pathProgress.realmIndex + 1);
                    onSurviveTribulation(selectedPath, nextRealm, 1);
                    confetti({ particleCount: 100, spread: 100 });
                    sound.playUpgradeFanfare();
                  }
                }}
                className="w-full py-3 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold font-mono text-sm shadow-lg shadow-rose-600/30 transition-all active:scale-95"
              >
                Disperse Heavenly Strike ({tribulationStrikesDone + 1} /{' '}
                {currentRealm.tribulationRounds}) 🛡️
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
