/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Flame, Heart, Shield, Sparkles, Swords, Wind } from 'lucide-react';
import {
  ACTION_CLASSES,
  ActionCombatState,
  WorldZoneInfo,
  getDomainSpec,
  listActiveStatusLabels,
} from '../game/actionCombat';

export type ActionCombatTrigger = 'strike' | 'power' | 'heal' | 'dash' | 'domain';

interface ActionCombatOverlayProps {
  combatState: ActionCombatState;
  zone: WorldZoneInfo;
  onTriggerAction: (action: ActionCombatTrigger) => void;
  onOpenPause: () => void;
}

export const ActionCombatOverlay: React.FC<ActionCombatOverlayProps> = ({
  combatState,
  zone,
  onTriggerAction,
  onOpenPause,
}) => {
  const cls = ACTION_CLASSES[combatState.classId];
  const domainSpec = getDomainSpec(combatState.domainLevel);
  const hpRatio =
    combatState.maxHp > 0 ? Math.max(0, Math.min(1, combatState.hp / combatState.maxHp)) : 1;
  const staminaRatio =
    combatState.maxStamina > 0
      ? Math.max(0, Math.min(1, combatState.stamina / combatState.maxStamina))
      : 1;
  const activeStatuses = listActiveStatusLabels(combatState.statusEffects);

  // Trailing damage ghost bar (delays downward HP transitions for crisp combat readability)
  const [ghostHpPct, setGhostHpPct] = useState(hpRatio * 100);
  useEffect(() => {
    const targetPct = hpRatio * 100;
    if (targetPct >= ghostHpPct) {
      setGhostHpPct(targetPct);
      return;
    }
    const timer = window.setTimeout(() => setGhostHpPct(targetPct), 260);
    return () => window.clearTimeout(timer);
  }, [hpRatio, ghostHpPct]);

  const isLowHp = hpRatio < 0.25;
  const isDomainActive = combatState.domainActiveSec > 0;

  return (
    <>
      {/* Radial Low-HP / Ascendant Domain Vignette (zero backdrop-blur) */}
      {(isLowHp || isDomainActive) && (
        <div
          aria-hidden="true"
          data-testid="action-combat-vignette"
          className="fixed inset-0 pointer-events-none z-10 transition-opacity duration-300"
          style={{
            background: isDomainActive
              ? 'radial-gradient(circle at center, transparent 54%, rgba(124, 58, 237, 0.34) 100%)'
              : 'radial-gradient(circle at center, transparent 52%, rgba(220, 38, 38, 0.38) 100%)',
          }}
        />
      )}

      {/* Compact Action Combat Strip — centered cleanly above the Chunk Progress Bar */}
      <div
        data-testid="action-combat-strip"
        className="fixed bottom-[120px] sm:bottom-[142px] left-1/2 -translate-x-1/2 z-30 w-[184px] sm:w-[440px] pointer-events-none"
      >
        {/* Combo / Streak Callout Pill */}
        {(combatState.comboCount >= 2 || isDomainActive) && (
          <div className="flex items-center justify-center gap-1.5 mb-1">
            {combatState.comboCount >= 2 && (
              <span
                data-testid="combat-combo-badge"
                className="px-2 py-0.5 rounded-md bg-amber-950/95 border border-amber-400/70 text-[10px] font-mono font-black text-amber-200 shadow-md"
              >
                {combatState.comboCount}x COMBO
                {combatState.lastStreakCallout ? ` · ${combatState.lastStreakCallout}` : ''}
              </span>
            )}
            {isDomainActive && (
              <span
                data-testid="combat-domain-active-badge"
                className="px-2 py-0.5 rounded-md bg-purple-950/95 border border-purple-400/80 text-[10px] font-mono font-black text-purple-200 shadow-md"
              >
                DOMAIN {combatState.domainActiveSec.toFixed(1)}s · {domainSpec.radiusMeters}m
              </span>
            )}
          </div>
        )}

        <div className="pointer-events-auto rounded-xl bg-slate-950/92 border border-slate-700/85 shadow-xl px-1.5 py-1 sm:px-2.5 sm:py-2 space-y-1 sm:space-y-1.5">
          {/* Top Row: Class + Zone + Vitals Bars */}
          <div className="flex items-center justify-between gap-1.5 text-[9px] sm:text-[10px] font-mono">
            <button
              type="button"
              onClick={onOpenPause}
              data-testid="combat-class-pill"
              className="flex items-center gap-1 text-slate-200 hover:text-amber-300 font-bold truncate cursor-pointer"
              title="Open Pause & Class Switcher [Esc]"
            >
              <span>{cls.icon}</span>
              <span className="truncate">{cls.name}</span>
              <span className="text-amber-400 hidden sm:inline">Lv.{combatState.playerLevel}</span>
            </button>

            <span
              data-testid="combat-zone-badge"
              className={`px-1.5 py-0.5 rounded border text-[9px] font-bold truncate max-w-[100px] sm:max-w-[190px] ${zone.badgeClass}`}
            >
              {zone.name}
            </span>

            <span className="hidden sm:inline text-amber-300 font-bold tabular-nums shrink-0">
              {combatState.gold}g · 🪶{combatState.reviveTokens}
            </span>
          </div>

          {/* HP + Stamina Dual Micro Bars */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="space-y-0.5">
              <div className="flex justify-between text-[9px] font-mono text-rose-200 tabular-nums leading-none">
                <span>HP</span>
                <span data-testid="combat-hp-text">
                  {Math.ceil(combatState.hp)}/{combatState.maxHp}
                </span>
              </div>
              <div className="relative h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-amber-400/75 transition-all duration-300"
                  style={{ width: `${ghostHpPct}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-100"
                  style={{ width: `${hpRatio * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex justify-between text-[9px] font-mono text-cyan-200 tabular-nums leading-none">
                <span>STM</span>
                <span data-testid="combat-stamina-text">
                  {Math.round(combatState.stamina)}/{combatState.maxStamina}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-100"
                  style={{ width: `${staminaRatio * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Active Status Tags (if any) */}
          {activeStatuses.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {activeStatuses.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.2 rounded bg-rose-950/90 border border-rose-500/50 text-[8px] font-mono font-black text-rose-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 5 Action Combat Skill Buttons */}
          <div className="grid grid-cols-5 gap-1">
            <button
              type="button"
              data-testid="combat-skill-strike"
              onClick={() => onTriggerAction('strike')}
              disabled={combatState.strikeCooldownSec > 0}
              aria-label="Basic Strike (Z)"
              title="Basic Strike [Z]"
              className={`relative rounded-lg px-1 py-1 border text-[9px] sm:text-[10px] font-mono font-bold flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 ${
                combatState.strikeCooldownSec > 0
                  ? 'bg-slate-900 border-slate-700 text-slate-500'
                  : 'bg-slate-900 hover:bg-rose-950/80 border-rose-500/50 text-rose-200'
              }`}
            >
              <Swords className="w-3 h-3 text-rose-400" />
              <span className="leading-tight mt-0.5">
                {combatState.strikeCooldownSec > 0
                  ? `${combatState.strikeCooldownSec.toFixed(1)}s`
                  : 'Z'}
              </span>
              <span className="hidden sm:inline text-[8px] text-slate-400 leading-none">
                Strike
              </span>
            </button>

            <button
              type="button"
              data-testid="combat-skill-power"
              onClick={() => onTriggerAction('power')}
              disabled={combatState.powerCooldownSec > 0}
              aria-label={`Class Power: ${cls.powerSkillName} (X)`}
              title={`${cls.powerSkillName} [X] — ${cls.powerSkillDesc}`}
              className={`relative rounded-lg px-1 py-1 border text-[9px] sm:text-[10px] font-mono font-bold flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 ${
                combatState.powerCooldownSec > 0
                  ? 'bg-slate-900 border-slate-700 text-slate-500'
                  : 'bg-slate-900 hover:bg-sky-950/80 border-sky-400/50 text-sky-200'
              }`}
            >
              <Flame className="w-3 h-3 text-sky-400" />
              <span className="leading-tight mt-0.5">
                {combatState.powerCooldownSec > 0
                  ? `${combatState.powerCooldownSec.toFixed(1)}s`
                  : 'X'}
              </span>
              <span className="hidden sm:inline text-[8px] text-slate-400 leading-none truncate max-w-full">
                {cls.powerSkillName.split(' ')[0]}
              </span>
            </button>

            <button
              type="button"
              data-testid="combat-skill-heal"
              onClick={() => onTriggerAction('heal')}
              disabled={combatState.healCooldownSec > 0}
              aria-label="Vitality Heal (C)"
              title="Vitality Heal [C]"
              className={`relative rounded-lg px-1 py-1 border text-[9px] sm:text-[10px] font-mono font-bold flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 ${
                combatState.healCooldownSec > 0
                  ? 'bg-slate-900 border-slate-700 text-slate-500'
                  : 'bg-slate-900 hover:bg-emerald-950/80 border-emerald-400/50 text-emerald-200'
              }`}
            >
              <Heart className="w-3 h-3 text-emerald-400" />
              <span className="leading-tight mt-0.5">
                {combatState.healCooldownSec > 0
                  ? `${combatState.healCooldownSec.toFixed(1)}s`
                  : 'C'}
              </span>
              <span className="hidden sm:inline text-[8px] text-slate-400 leading-none">Heal</span>
            </button>

            <button
              type="button"
              data-testid="combat-skill-dash"
              onClick={() => onTriggerAction('dash')}
              disabled={combatState.dashCooldownSec > 0 || combatState.stamina < 20}
              aria-label="Phantom Dash (Ctrl)"
              title="Phantom Dash [Ctrl] (20 Stamina · i-frames)"
              className={`relative rounded-lg px-1 py-1 border text-[9px] sm:text-[10px] font-mono font-bold flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 ${
                combatState.dashCooldownSec > 0 || combatState.stamina < 20
                  ? 'bg-slate-900 border-slate-700 text-slate-500'
                  : 'bg-slate-900 hover:bg-cyan-950/80 border-cyan-400/50 text-cyan-200'
              }`}
            >
              <Wind className="w-3 h-3 text-cyan-400" />
              <span className="leading-tight mt-0.5">
                {combatState.dashCooldownSec > 0
                  ? `${combatState.dashCooldownSec.toFixed(1)}s`
                  : 'Ctrl'}
              </span>
              <span className="hidden sm:inline text-[8px] text-slate-400 leading-none">Dash</span>
            </button>

            <button
              type="button"
              data-testid="combat-skill-domain"
              onClick={() => onTriggerAction('domain')}
              disabled={combatState.domainCooldownSec > 0}
              aria-label={`Ascendant Domain Lv.${combatState.domainLevel} (G)`}
              title={`Ascendant Domain Lv.${combatState.domainLevel} [G] — ${domainSpec.radiusMeters}m AoE · ${domainSpec.tickDps} DPS`}
              className={`relative rounded-lg px-1 py-1 border text-[9px] sm:text-[10px] font-mono font-bold flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 ${
                isDomainActive
                  ? 'bg-purple-600/90 border-purple-300 text-white shadow-md shadow-purple-500/40'
                  : combatState.domainCooldownSec > 0
                    ? 'bg-slate-900 border-slate-700 text-slate-500'
                    : 'bg-purple-950/85 hover:bg-purple-900 border-purple-400/70 text-purple-200'
              }`}
            >
              {isDomainActive ? (
                <Sparkles className="w-3 h-3 text-amber-200" />
              ) : (
                <Shield className="w-3 h-3 text-purple-400" />
              )}
              <span className="leading-tight mt-0.5">
                {combatState.domainCooldownSec > 0
                  ? `${Math.ceil(combatState.domainCooldownSec)}s`
                  : 'G'}
              </span>
              <span className="hidden sm:inline text-[8px] text-purple-300 leading-none">
                Dom.{combatState.domainLevel}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
