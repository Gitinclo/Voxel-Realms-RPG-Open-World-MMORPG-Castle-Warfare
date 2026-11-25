/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Activity, Pause, Play, RotateCcw, ShoppingBag, Sparkles, Swords, X } from 'lucide-react';
import {
  ACTION_CLASSES,
  ActionClassId,
  ActionCombatState,
  FIELD_PROVISIONS_CATALOG,
  FieldProvisionId,
  WorldZoneInfo,
  getDomainSpec,
  getDomainXpRequired,
} from '../game/actionCombat';
import { CausalityEngineState, buildCausalityRuleSnapshots } from '../game/worldCausalityEngine';

type PauseTab = 'overview' | 'classes' | 'provisions' | 'causality';

interface PauseMenuModalProps {
  combatState: ActionCombatState;
  causalityState: CausalityEngineState;
  zone: WorldZoneInfo;
  onResume: () => void;
  onReturnToTitle: () => void;
  onSelectClass: (classId: ActionClassId) => void;
  onPurchaseProvision: (itemId: FieldProvisionId) => void;
}

export const PauseMenuModal: React.FC<PauseMenuModalProps> = ({
  combatState,
  causalityState,
  zone,
  onResume,
  onReturnToTitle,
  onSelectClass,
  onPurchaseProvision,
}) => {
  const [activeTab, setActiveTab] = useState<PauseTab>('overview');
  const currentClass = ACTION_CLASSES[combatState.classId];
  const domainSpec = getDomainSpec(combatState.domainLevel);
  const domainXpReq = getDomainXpRequired(combatState.domainLevel);
  const ruleSnapshots = buildCausalityRuleSnapshots(causalityState);

  return (
    <div
      data-testid="pause-menu-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Realm Pause and Ascendant Arsenal"
      className="fixed inset-0 z-50 bg-slate-950/88 flex items-center justify-center p-3 sm:p-6"
    >
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/25 border border-purple-400/50 flex items-center justify-center text-purple-300">
              <Pause className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-cinzel font-black text-amber-300 leading-tight">
                Realm Paused · Ascendant Arsenal
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                {currentClass.icon} {currentClass.name} Lv.{combatState.playerLevel} · {zone.name} ·{' '}
                <span className="text-amber-300 font-bold">{combatState.gold} Gold</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onResume}
            aria-label="Resume game"
            data-testid="pause-close-btn"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Bar */}
        <div
          role="tablist"
          aria-label="Pause Menu Sections"
          className="grid grid-cols-4 gap-1 p-2 bg-slate-950/70 border-b border-slate-800 text-xs font-mono font-bold"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            data-testid="pause-tab-overview"
            onClick={() => setActiveTab('overview')}
            className={`px-2 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Overview</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'classes'}
            data-testid="pause-tab-classes"
            onClick={() => setActiveTab('classes')}
            className={`px-2 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'classes'
                ? 'bg-sky-400 text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Swords className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Classes</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'provisions'}
            data-testid="pause-tab-provisions"
            onClick={() => setActiveTab('provisions')}
            className={`px-2 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'provisions'
                ? 'bg-emerald-400 text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Provisions</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'causality'}
            data-testid="pause-tab-causality"
            onClick={() => setActiveTab('causality')}
            className={`px-2 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'causality'
                ? 'bg-purple-400 text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Causality v2</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">VITALITY</div>
                  <div className="text-rose-300 font-black text-base">
                    {Math.ceil(combatState.hp)} / {combatState.maxHp}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">GOLD POUCH</div>
                  <div className="text-amber-300 font-black text-base">{combatState.gold}g</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">REVIVE TOKENS</div>
                  <div className="text-emerald-300 font-black text-base">
                    🪶 {combatState.reviveTokens}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">STREAK / KILLS</div>
                  <div className="text-cyan-300 font-black text-base">
                    {combatState.killStreak} / {combatState.totalKills}
                  </div>
                </div>
              </div>

              {/* Ascendant Domain Progression Panel */}
              <div className="p-4 rounded-xl bg-purple-950/35 border border-purple-500/40 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider text-purple-300 font-bold">
                      Ascendant Domain Expansion · Lv.{domainSpec.level} / 999
                    </div>
                    <div className="text-[11px] font-mono text-slate-300">
                      Radius {domainSpec.radiusMeters}m · Cooldown {domainSpec.cooldownSeconds}s ·{' '}
                      {domainSpec.tickDps} DPS · XP {combatState.domainXp}/{domainXpReq}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-900/70 border border-purple-400/50 text-[11px] font-mono font-bold text-purple-200">
                    Hotkey [G]
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-mono">
                  {domainSpec.unlockedMilestones.map((m) => (
                    <div
                      key={m.minLevel}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-purple-500/30 text-slate-200"
                    >
                      <span className="text-amber-300 font-bold">
                        Lv.{m.minLevel} {m.name}:
                      </span>{' '}
                      <span className="text-slate-300">{m.summary}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Controls Legend */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <strong className="text-amber-300">WASD / Arrows:</strong> Move
                </div>
                <div>
                  <strong className="text-amber-300">Shift:</strong> Sprint (Ground)
                </div>
                <div>
                  <strong className="text-amber-300">Ctrl:</strong> Phantom Dash
                </div>
                <div>
                  <strong className="text-amber-300">Z / X / C:</strong> Strike / Power / Heal
                </div>
                <div>
                  <strong className="text-amber-300">G:</strong> Ascendant Domain
                </div>
                <div>
                  <strong className="text-amber-300">Wheel / Drag:</strong> Zoom &amp; Orbit
                </div>
              </div>
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(ACTION_CLASSES) as ActionClassId[]).map((id) => {
                const cls = ACTION_CLASSES[id];
                const isSelected = combatState.classId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    data-testid={`pause-class-${id}`}
                    onClick={() => onSelectClass(id)}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-sky-950/70 border-sky-400 ring-1 ring-sky-400'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-cinzel font-black text-sm text-white">
                        {cls.icon} {cls.name}{' '}
                        <span className="text-[11px] font-mono text-slate-400">· {cls.title}</span>
                      </div>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded bg-sky-400 text-slate-950 text-[10px] font-mono font-black">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-300">
                      HP {cls.maxHp} · ATK {cls.baseAttack} · DEF {cls.baseDefense} · CRIT{' '}
                      {Math.round(cls.critChance * 100)}%
                    </div>
                    <div className="text-[11px] text-amber-200">
                      <strong>[X] {cls.powerSkillName}:</strong> {cls.powerSkillDesc}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'provisions' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                <span>Payment-Free Field Provisions (In-Game Gold Only)</span>
                <span data-testid="pause-provisions-gold" className="text-amber-300 font-black">
                  Balance: {combatState.gold} Gold
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {FIELD_PROVISIONS_CATALOG.map((item) => {
                  const canAfford = combatState.gold >= item.goldCost;
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center justify-between font-bold text-sm text-white">
                          <span>
                            {item.icon} {item.name}
                          </span>
                          <span className="font-mono text-xs text-amber-300">{item.goldCost}g</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{item.description}</p>
                      </div>
                      <button
                        type="button"
                        data-testid={`pause-buy-${item.id}`}
                        disabled={!canAfford}
                        onClick={() => onPurchaseProvision(item.id)}
                        className={`w-full py-1.5 rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer ${
                          canAfford
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? `Acquire (${item.goldCost}g)` : 'Insufficient Gold'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'causality' && (
            <div className="space-y-3">
              <div className="text-xs font-mono text-purple-200 bg-purple-950/40 border border-purple-500/40 px-3 py-2 rounded-xl flex items-center justify-between">
                <span>Causality Engine v2 · Priority-Sorted Reactive Rules (AND / OR / NOT)</span>
                <span className="font-bold">{ruleSnapshots.length} Active Rules</span>
              </div>

              <div className="space-y-1.5">
                {ruleSnapshots.map((rule) => (
                  <div
                    key={rule.id}
                    data-testid={`causality-rule-${rule.id}`}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 text-[10px] font-bold">
                          P{rule.priority}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-900/70 text-purple-200 text-[10px] font-bold">
                          {rule.combinator}
                        </span>
                        <span className="font-bold text-white">{rule.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{rule.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-[10px]">
                      <span className="text-slate-400">
                        Fired: {rule.fireCount}
                        {rule.maxFires > 0 ? `/${rule.maxFires}` : ''}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          rule.exhausted
                            ? 'bg-slate-800 text-slate-400'
                            : rule.ready
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {rule.exhausted
                          ? 'COMPLETED'
                          : rule.ready
                            ? 'ARMED'
                            : `CD ${rule.cooldownRemaining}s`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 bg-slate-950 border-t border-slate-800">
          <button
            type="button"
            data-testid="pause-return-title-btn"
            onClick={onReturnToTitle}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Return to Title</span>
          </button>

          <button
            type="button"
            data-testid="pause-resume-btn"
            onClick={onResume}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-black flex items-center gap-1.5 shadow-lg cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume Realm [Esc]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
