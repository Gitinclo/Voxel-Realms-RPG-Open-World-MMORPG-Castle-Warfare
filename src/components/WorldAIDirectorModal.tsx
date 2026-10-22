/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Brain,
  Shield,
  Swords,
  Compass,
  Sparkles,
  Pickaxe,
  ScrollText,
  ArrowRightLeft,
  Play,
  PlusCircle,
  Activity,
  Navigation,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import {
  GameResources,
  MonsterTarget,
  NPC,
  NPCDirective,
  NPCTradeOffer,
  Quest,
  ResourceNode,
  ResourceType,
  WorldAIEventLog,
} from '../types/game';
import {
  MONSTER_COMPLEXITY_BRACKETS,
  NPC_ROLE_PROFILES,
  getMonsterComplexityByLevel,
  createScaledMonsterByLevel,
} from '../game/worldAI';
import { WeatherType, WEATHER_CONFIGS } from '../game/weather';
import { formatBigInt } from '../game/math';
import { sound } from '../game/audio';

interface WorldAIDirectorModalProps {
  npcs: NPC[];
  monsters: MonsterTarget[];
  resourceNodes: ResourceNode[];
  resources: GameResources;
  weather: WeatherType;
  timeOfDayHours: number;
  aiLogs: WorldAIEventLog[];
  initialTab?: 'npcs' | 'monsters' | 'telemetry';
  initialSelectedNpcId?: string;
  onSetNPCDirective: (npcId: string, directive: NPCDirective) => void;
  onClaimNPCStash: (npcId: string) => void;
  onClaimNPCQuest: (npcId: string, quest: Quest) => void;
  onExecuteNPCTrade: (npcId: string, offer: NPCTradeOffer) => void;
  onSpawnScaledMonster: (monster: MonsterTarget) => void;
  onEngageMonster: (monster: MonsterTarget) => void;
  onStepWorldAI: () => void;
  onClose: () => void;
}

export const WorldAIDirectorModal: React.FC<WorldAIDirectorModalProps> = ({
  npcs,
  monsters,
  resources,
  weather,
  timeOfDayHours,
  aiLogs,
  initialTab = 'npcs',
  initialSelectedNpcId,
  onSetNPCDirective,
  onClaimNPCStash,
  onClaimNPCQuest,
  onExecuteNPCTrade,
  onSpawnScaledMonster,
  onEngageMonster,
  onStepWorldAI,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'npcs' | 'monsters' | 'telemetry'>(initialTab);
  const [selectedNpcId, setSelectedNpcId] = useState<string>(
    initialSelectedNpcId || npcs[0]?.id || 'npc_elder'
  );
  const [simLevel, setSimLevel] = useState<number>(350);
  const [customMonsterName, setCustomMonsterName] = useState<string>('');

  const selectedNpc = npcs.find((n) => n.id === selectedNpcId) || npcs[0];
  const simProfile = getMonsterComplexityByLevel(simLevel);
  const previewMonster = createScaledMonsterByLevel(
    simLevel,
    customMonsterName.trim() || undefined,
    { x: 20, z: -18 }
  );
  const weatherCfg = WEATHER_CONFIGS[weather] || WEATHER_CONFIGS.clear;
  const isNight = timeOfDayHours < 6 || timeOfDayHours >= 18;

  const getNpcStateBadgeColor = (state?: NPC['aiState']) => {
    switch (state) {
      case 'combating_monster':
      case 'intercepting_monster':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'gathering_resource':
      case 'forging_armaments':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'caravan_trading':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'evading_threat':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
  };

  const getMonsterStateBadgeColor = (state?: MonsterTarget['aiState']) => {
    switch (state) {
      case 'enraged_berserk':
      case 'attack_windup':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'flanking_march':
      case 'clashing_guard':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'siphoning_node':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'seeking_shelter':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border-2 border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="shrink-0 px-3.5 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-slate-950 via-cyan-950/60 to-indigo-950/70 border-b border-cyan-500/30 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shrink-0">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-xl font-bold font-cinzel text-white leading-tight">
                  Autonomous World AI & Behavior Director
                </h2>
                <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono font-bold shrink-0">
                  Lv. 1–1000 AI Matrix
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 truncate">
                {weatherCfg.icon} {weatherCfg.name} · {isNight ? '🌙 Nocturnal' : '☀️ Daylight'} ·{' '}
                <span className="text-emerald-300 font-mono">
                  {npcs.length} NPCs · {monsters.length} Monsters
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => {
                sound.playSwing();
                onStepWorldAI();
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95 transition-all shrink-0"
              title="Advance all NPC and Monster AI state machines, pathfinding, and gathering by 1 step"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Step World AI</span>
              <span className="sm:hidden">Step AI</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="shrink-0 flex border-b border-slate-800 bg-slate-950/80 px-4 sm:px-6 gap-1.5 pt-2 overflow-x-auto">
          {[
            {
              id: 'npcs',
              label: `Living NPCs & Roles (${npcs.length})`,
              icon: Shield,
            },
            {
              id: 'monsters',
              label: `Monster AI & Lv. 1–1000 Scaling (${monsters.length})`,
              icon: Swords,
            },
            {
              id: 'telemetry',
              label: `World AI Activity & Pathfinding Log (${aiLogs.length})`,
              icon: Activity,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as 'npcs' | 'monsters' | 'telemetry');
                  sound.playSwing();
                }}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl flex items-center gap-1.5 border-t-2 shrink-0 transition-all ${
                  active
                    ? 'bg-slate-900 border-cyan-400 text-cyan-200'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-slate-200">
          {/* TAB 1: LIVING NPCS, ROLES, QUESTS, TRADE & AUTONOMOUS GATHERING */}
          {activeTab === 'npcs' && (
            <div className="space-y-5">
              {/* NPC Roster Selector Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {npcs.map((npc) => {
                  const roleProfile = NPC_ROLE_PROFILES[npc.role];
                  const isSelected = selectedNpc?.id === npc.id;
                  const stashCount = Object.values(npc.gatheredStash || {}).reduce(
                    (s, v) => s + (v || 0n),
                    0n
                  );

                  return (
                    <button
                      key={npc.id}
                      onClick={() => {
                        setSelectedNpcId(npc.id);
                        sound.playSwing();
                      }}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400/30'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl p-1.5 rounded-lg bg-slate-900 border border-slate-700 shrink-0">
                            {roleProfile.icon}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{npc.name}</div>
                            <div className="text-[11px] text-cyan-300 font-mono truncate">
                              Lv.{npc.level} · {roleProfile.roleLabel}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border shrink-0 ${getNpcStateBadgeColor(
                            npc.aiState
                          )}`}
                        >
                          {(npc.aiState || 'autonomous').replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 truncate">
                        {npc.statusActionText || roleProfile.primaryDuty}
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                        <span>
                          Pos: [{Math.round(npc.x)}, {Math.round(npc.z)}]
                        </span>
                        {stashCount > 0n && (
                          <span className="text-emerald-400 font-bold">
                            Stash: +{formatBigInt(stashCount)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected NPC Detail & Interactive Role Command Panel */}
              {selectedNpc && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-cyan-500/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2.5 rounded-xl bg-slate-900 border border-cyan-500/40">
                        {NPC_ROLE_PROFILES[selectedNpc.role].icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-bold font-cinzel text-white">
                            {selectedNpc.name}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 font-mono font-bold">
                            Level {selectedNpc.level} / 1000
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-mono">
                            {NPC_ROLE_PROFILES[selectedNpc.role].roleLabel}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-300 font-mono mt-0.5">
                          {selectedNpc.specialtyBuffDesc || NPC_ROLE_PROFILES[selectedNpc.role].levelScalingFormula}
                        </p>
                      </div>
                    </div>

                    {/* Tactical AI Directive Selector */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-mono text-slate-400 mr-1">AI Directive:</span>
                      {(
                        [
                          { id: 'autonomous', label: 'Autonomous Role' },
                          { id: 'patrol_citadel', label: 'Patrol Citadel' },
                          { id: 'gather_resources', label: 'Gather Nodes' },
                          { id: 'hunt_monsters', label: 'Hunt Monsters' },
                        ] as { id: NPCDirective; label: string }[]
                      ).map((dir) => (
                        <button
                          key={dir.id}
                          onClick={() => {
                            onSetNPCDirective(selectedNpc.id, dir.id);
                            sound.playSwing();
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                            (selectedNpc.directive || 'autonomous') === dir.id
                              ? 'bg-cyan-500 text-slate-950 shadow-sm'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {dir.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Pathfinding & Behavior Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Navigation className="w-3.5 h-3.5 text-cyan-400" /> Active AI Action & A* Path
                        </span>
                        <span className="text-cyan-300 font-bold">
                          [{Math.round(selectedNpc.x)}, {Math.round(selectedNpc.z)}]
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white">
                        {selectedNpc.statusActionText}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Waypoints:{' '}
                        {(selectedNpc.pathWaypoints || [])
                          .map((wp) => `[${wp.x}, ${wp.z}]`)
                          .join(' → ') || 'At destination'}
                      </div>
                      <ul className="text-[11px] text-slate-300 space-y-1 pt-1 border-t border-slate-800">
                        {NPC_ROLE_PROFILES[selectedNpc.role].aiCapabilities.map((cap, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-cyan-400">•</span>
                            <span>{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Autonomous Gathered Stash Box */}
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                            <Pickaxe className="w-3.5 h-3.5" /> Autonomous NPC Gathered Stash
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            Combat Rating: {formatBigInt(selectedNpc.combatPower || 5_000_000n)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {selectedNpc.name} continuously gathers or prospects resources during autonomous world ticks.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {Object.entries(selectedNpc.gatheredStash || {}).map(([res, amt]) =>
                            amt && amt > 0n ? (
                              <span
                                key={res}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold"
                              >
                                +{formatBigInt(amt)} {res.toUpperCase()}
                              </span>
                            ) : null
                          )}
                          {Object.values(selectedNpc.gatheredStash || {}).every(
                            (v) => !v || v === 0n
                          ) && (
                            <span className="text-xs text-slate-500 italic">
                              Stash recently collected — click "Step World AI" to gather more!
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onClaimNPCStash(selectedNpc.id);
                          sound.playUpgradeFanfare();
                        }}
                        disabled={Object.values(selectedNpc.gatheredStash || {}).every(
                          (v) => !v || v === 0n
                        )}
                        className={`w-full py-2 px-4 rounded-xl text-xs font-bold font-mono transition-all ${
                          Object.values(selectedNpc.gatheredStash || {}).some(
                            (v) => v && v > 0n
                          )
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Claim Autonomous Stash for Kingdom Treasury
                      </button>
                    </div>
                  </div>

                  {/* Role-Specific Interactive Module: Quest-Giver Commission OR Caravan Barter */}
                  {selectedNpc.activeQuest && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <ScrollText className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold font-cinzel text-amber-200 uppercase">
                            NPC Radiant Commission (Lv.{selectedNpc.level} Scaling)
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white">
                          {selectedNpc.activeQuest.title}
                        </div>
                        <p className="text-xs text-slate-300">
                          {selectedNpc.activeQuest.description}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono">
                          <span className="text-emerald-300 font-bold">
                            +{formatBigInt(selectedNpc.activeQuest.rewardExp)} EXP
                          </span>
                          <span className="text-cyan-300 font-bold">
                            +{formatBigInt(selectedNpc.activeQuest.rewardDiamonds)} 💎
                          </span>
                          {Object.entries(selectedNpc.activeQuest.rewardResources).map(
                            ([r, a]) =>
                              a ? (
                                <span key={r} className="text-amber-300">
                                  +{formatBigInt(a)} {r.toUpperCase()}
                                </span>
                              ) : null
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (selectedNpc.activeQuest) {
                            onClaimNPCQuest(selectedNpc.id, selectedNpc.activeQuest);
                            sound.playUpgradeFanfare();
                          }
                        }}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Complete & Claim Commission
                      </button>
                    </div>
                  )}

                  {selectedNpc.tradeOffers && selectedNpc.tradeOffers.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-cinzel text-amber-300 flex items-center gap-1.5">
                          <ArrowRightLeft className="w-4 h-4" /> Caravan Master Barter Exchange (Lv.{selectedNpc.level})
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          Live Route Rates · Weather: {weatherCfg.name}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {selectedNpc.tradeOffers.map((offer) => {
                          const canAfford =
                            resources[offer.giveResource] >= offer.giveAmount && offer.stock > 0;
                          return (
                            <div
                              key={offer.id}
                              className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-2"
                            >
                              <div>
                                <div className="text-xs font-bold text-white">{offer.label}</div>
                                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                  Stock Left: {offer.stock} lots
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (canAfford) {
                                    onExecuteNPCTrade(selectedNpc.id, offer);
                                    sound.playUpgradeFanfare();
                                  }
                                }}
                                disabled={!canAfford}
                                className={`w-full py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all ${
                                  canAfford
                                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                {offer.stock <= 0 ? 'Sold Out' : 'Execute Barter Trade'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MONSTER AI SCALING (LV. 1 TO 1000), ATTACK PATTERNS & PATHFINDING */}
          {activeTab === 'monsters' && (
            <div className="space-y-5">
              {/* Interactive Level 1–1000 AI Complexity Simulator & Custom Monster Spawner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-rose-950/30 to-purple-950/30 border border-rose-500/40 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold font-cinzel text-rose-200 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-400" />
                      Monster AI Complexity Scaling Simulator & World Spawner (Lv. 1 – 1000)
                    </h3>
                    <p className="text-xs text-slate-300">
                      Slide from Level 1 to 1000 to inspect how attack patterns, A* pathfinding depth, tactical IQ, and environmental interactions scale.
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap shrink-0">
                    {[1, 45, 120, 350, 700, 1000].map((presetLvl) => (
                      <button
                        key={presetLvl}
                        onClick={() => {
                          setSimLevel(presetLvl);
                          sound.playSwing();
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                          simLevel === presetLvl
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        Lv.{presetLvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slider + Custom Name + Spawn CTA */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Target Monster Level:</span>
                      <span className="text-rose-400 font-bold">Level {simLevel} / 1000</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={1000}
                      value={simLevel}
                      onChange={(e) => setSimLevel(Number(e.target.value))}
                      aria-label="Target Monster Level"
                      className="w-full accent-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Optional Custom Monster Name
                    </label>
                    <input
                      type="text"
                      value={customMonsterName}
                      onChange={(e) => setCustomMonsterName(e.target.value)}
                      placeholder={previewMonster.name}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-rose-400"
                    />
                  </div>

                  <button
                    onClick={() => {
                      onSpawnScaledMonster(previewMonster);
                      setCustomMonsterName('');
                      sound.playExplosion();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/25 active:scale-95 transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Spawn Lv.{simLevel} Monster in World
                  </button>
                </div>

                {/* Resulting Bracket Profile Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 font-cinzel">
                        {simProfile.name}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Tactical IQ: {simProfile.tacticalIQ}/100
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{simProfile.summary}</p>
                    <div className="text-[11px] font-mono text-cyan-300 space-y-0.5 pt-1 border-t border-slate-800">
                      <div>Movement Policy: {simProfile.movementPolicyLabel}</div>
                      <div>
                        Pathfinding: {simProfile.pathfindingAlgorithm} ({simProfile.pathfindingMaxNodes} waypoints, {simProfile.aggroRadius}m aggro)
                      </div>
                      <div className="text-slate-300">
                        Scaled Stats: {formatBigInt(previewMonster.hp)} HP · {formatBigInt(previewMonster.attack)} ATK · {formatBigInt(previewMonster.defense)} DEF
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-purple-300 font-cinzel">
                      Attack Pattern Rotation & Environmental AI
                    </div>
                    <div className="space-y-1.5">
                      {simProfile.attackPatterns.map((pat) => (
                        <div
                          key={pat.id}
                          className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1.5 font-mono font-bold text-white">
                            <span>
                              ⚡ {pat.name} ({pat.windupSeconds}s · {pat.damageMultiplier}x)
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] shrink-0">
                              Counter: {pat.counterTroop.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-slate-400 mt-1">
                            {pat.description} · <span className="text-amber-300">{pat.statusEffect}</span>
                          </div>
                        </div>
                      ))}
                      {simProfile.environmentalInteractions.map((env, i) => (
                        <div
                          key={i}
                          className="text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 pt-0.5"
                        >
                          <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>
                            Env Trigger [{env.actionName}]: {env.effectDescription}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Open-World Monsters & Live AI State Cards */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Active Open-World Monsters ({monsters.length} Tracked by AI Radar)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {monsters.map((mon) => {
                    const prof = getMonsterComplexityByLevel(mon.level);
                    const activePattern =
                      prof.attackPatterns.find((p) => p.id === mon.activeAttackPatternId) ||
                      prof.attackPatterns[0];
                    const hpPct = Math.min(
                      100,
                      Math.max(1, Number((mon.hp * 100n) / (mon.maxHp || 1n)))
                    );

                    return (
                      <div
                        key={mon.id}
                        className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-white">{mon.name}</span>
                                <span className="text-[11px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-bold">
                                  Lv.{mon.level}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono uppercase">
                                  {mon.tier.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="text-[11px] text-cyan-300 font-mono mt-0.5">
                                {prof.movementPolicyLabel} · Pos [{Math.round(mon.x)}, {Math.round(mon.z)}]
                              </div>
                            </div>

                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border shrink-0 ${getMonsterStateBadgeColor(
                                mon.aiState
                              )}`}
                            >
                              {(mon.aiState || 'patrolling').replace('_', ' ')}
                            </span>
                          </div>

                          {/* HP Bar */}
                          <div>
                            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                              <span>
                                HP: {formatBigInt(mon.hp)} / {formatBigInt(mon.maxHp)} ({hpPct}%)
                              </span>
                              <span>
                                ATK {formatBigInt(mon.attack)} · DEF {formatBigInt(mon.defense)}
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
                                style={{ width: `${hpPct}%` }}
                              />
                            </div>
                          </div>

                          {/* Attack Telegraph & Env Interaction */}
                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono space-y-1">
                            <div className="flex items-center justify-between text-amber-300">
                              <span>Active Pattern: {activePattern.name}</span>
                              <span>Counter: {activePattern.counterTroop.toUpperCase()}</span>
                            </div>
                            <div className="text-emerald-300">
                              Env AI: {mon.activeEnvInteraction || prof.environmentalInteractions[0]?.actionName}
                            </div>
                            <div className="text-slate-400">
                              A* Path:{' '}
                              {(mon.pathWaypoints || [])
                                .map((wp) => `[${wp.x}, ${wp.z}]`)
                                .join(' → ') || 'Holding sector'}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            sound.playSwing();
                            onEngageMonster(mon);
                          }}
                          className="w-full py-2 px-3 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                          <Swords className="w-3.5 h-3.5" />
                          Engage {mon.name} (Lv.{mon.level})
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE WORLD AI TELEMETRY & PATHFINDING LOG */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold font-cinzel text-cyan-300">
                    Real-Time Autonomous Decision & Pathfinding Stream
                  </h3>
                  <p className="text-xs text-slate-400">
                    Logs every autonomous NPC state transition, Guard-vs-Monster skirmish, resource node harvest, and Monster telegraph phase.
                  </p>
                </div>
                <button
                  onClick={() => {
                    sound.playSwing();
                    onStepWorldAI();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs shrink-0"
                >
                  Trigger Immediate AI Tick
                </button>
              </div>

              <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
                {aiLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3 text-xs font-mono"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.actorType === 'npc'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {log.actorType.toUpperCase()} Lv.{log.actorLevel}
                        </span>
                        <span className="font-bold text-white">{log.actorName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 uppercase">
                          {log.category}
                        </span>
                      </div>
                      <div className="text-slate-300">{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
