/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Shield,
  Crosshair,
  Bomb,
  ArrowRight,
  ArrowUpCircle,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
} from 'lucide-react';
import { GameResources, PlayerTroopRoster, ResourceType, TroopType } from '../types/game';
import { formatBigInt, getTroopTierInfo } from '../game/math';
import {
  calculateTroopPromotionQuote,
  countPromotableTroops,
  getPromotableTroopEntries,
  getTroopRosterKey,
} from '../game/troopTraining';
import { sound } from '../game/audio';

export interface UnitUpgradeModalProps {
  troops: PlayerTroopRoster;
  resources: GameResources;
  castleLevel: number;
  maxUnlockedTier: number;
  initialType?: TroopType;
  initialSourceTier?: number;
  zeroResourceCost?: boolean;
  onPromoteTroops: (
    type: TroopType,
    sourceTier: number,
    targetTier: number,
    amount: bigint
  ) => { ok: boolean; error?: string; powerGained?: bigint };
  onClose: () => void;
}

const ARCHETYPE_META: {
  type: TroopType;
  label: string;
  role: string;
  icon: React.FC<{ className?: string }>;
  activeClass: string;
  iconClass: string;
}[] = [
  {
    type: 'shieldbearer',
    label: 'Shieldbearer',
    role: 'Vanguard Tank',
    icon: Shield,
    activeClass: 'bg-blue-950/70 border-blue-400 text-blue-100 ring-1 ring-blue-400/40',
    iconClass: 'text-blue-400',
  },
  {
    type: 'shooter',
    label: 'Shooter',
    role: 'Ranged Volley',
    icon: Crosshair,
    activeClass: 'bg-emerald-950/70 border-emerald-400 text-emerald-100 ring-1 ring-emerald-400/40',
    iconClass: 'text-emerald-400',
  },
  {
    type: 'bomber',
    label: 'Bomber',
    role: 'Siege Ordnance',
    icon: Bomb,
    activeClass: 'bg-orange-950/70 border-orange-400 text-orange-100 ring-1 ring-orange-400/40',
    iconClass: 'text-orange-400',
  },
];

const RESOURCE_META: { key: ResourceType; label: string; symbol: string }[] = [
  { key: 'wood', label: 'Wood', symbol: '🌲' },
  { key: 'steel', label: 'Steel', symbol: '⚔️' },
  { key: 'copper', label: 'Copper', symbol: '🪙' },
  { key: 'grain', label: 'Grain', symbol: '🌾' },
  { key: 'oil', label: 'Oil', symbol: '🛢️' },
  { key: 'diamond', label: 'Diamond', symbol: '💎' },
];

function parsePositiveBigIntInput(raw: string): bigint {
  const digitsOnly = raw.replace(/[^0-9]/g, '');
  if (!digitsOnly) return 0n;
  try {
    return BigInt(digitsOnly);
  } catch {
    return 0n;
  }
}

export const UnitUpgradeModal: React.FC<UnitUpgradeModalProps> = ({
  troops,
  resources,
  castleLevel,
  maxUnlockedTier,
  initialType = 'shieldbearer',
  initialSourceTier,
  zeroResourceCost = false,
  onPromoteTroops,
  onClose,
}) => {
  const clampedMaxUnlocked = Math.max(1, Math.min(20, Math.floor(maxUnlockedTier)));
  const promotableSummary = useMemo(
    () => countPromotableTroops(troops, clampedMaxUnlocked),
    [troops, clampedMaxUnlocked]
  );

  // Pick initial archetype: prefer initialType if it has promotable units, otherwise first archetype with units
  const [selectedType, setSelectedType] = useState<TroopType>(() => {
    if (promotableSummary.byType[initialType] > 0n) {
      return initialType;
    }
    const fallback = ARCHETYPE_META.find((a) => promotableSummary.byType[a.type] > 0n);
    return fallback ? fallback.type : initialType;
  });

  const promotableEntries = useMemo(
    () => getPromotableTroopEntries(troops, selectedType, clampedMaxUnlocked),
    [troops, selectedType, clampedMaxUnlocked]
  );

  const [sourceTier, setSourceTier] = useState<number>(() => {
    if (
      initialSourceTier &&
      initialSourceTier < clampedMaxUnlocked &&
      (troops[getTroopRosterKey(selectedType, initialSourceTier)] ?? 0n) > 0n
    ) {
      return initialSourceTier;
    }
    return promotableEntries[0]?.tier ?? 1;
  });

  const [targetTier, setTargetTier] = useState<number>(() =>
    Math.min(clampedMaxUnlocked, Math.max(2, sourceTier + 1))
  );

  const ownedAtSource = useMemo(
    () => troops[getTroopRosterKey(selectedType, sourceTier)] ?? 0n,
    [troops, selectedType, sourceTier]
  );

  const [amountInput, setAmountInput] = useState<string>(() => {
    const initialOwned = promotableEntries[0]?.ownedCount ?? 0n;
    const defaultAmt = initialOwned > 1000n ? 1000n : initialOwned;
    return defaultAmt > 0n ? defaultAmt.toString() : '0';
  });

  const [feedbackBanner, setFeedbackBanner] = useState<{
    kind: 'success' | 'error';
    message: string;
  } | null>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Keep sourceTier, targetTier, and amount synchronized whenever archetype or roster changes
  useEffect(() => {
    if (promotableEntries.length === 0) {
      setAmountInput('0');
      return;
    }
    const stillValid = promotableEntries.some((entry) => entry.tier === sourceTier);
    const resolvedSource = stillValid ? sourceTier : promotableEntries[0].tier;
    if (resolvedSource !== sourceTier) {
      setSourceTier(resolvedSource);
    }

    const minTarget = Math.min(clampedMaxUnlocked, resolvedSource + 1);
    if (targetTier <= resolvedSource || targetTier > clampedMaxUnlocked) {
      setTargetTier(minTarget);
    }

    const availableAtSource = troops[getTroopRosterKey(selectedType, resolvedSource)] ?? 0n;
    setAmountInput((prev) => {
      const parsed = parsePositiveBigIntInput(prev);
      if (parsed === 0n && availableAtSource > 0n) {
        return (availableAtSource > 1000n ? 1000n : availableAtSource).toString();
      }
      if (parsed > availableAtSource) {
        return availableAtSource.toString();
      }
      return prev;
    });
  }, [promotableEntries, sourceTier, targetTier, clampedMaxUnlocked, selectedType, troops]);

  const parsedAmount = useMemo(() => parsePositiveBigIntInput(amountInput), [amountInput]);

  const availableTargetTiers = useMemo(() => {
    const tiers: number[] = [];
    for (let t = sourceTier + 1; t <= clampedMaxUnlocked; t += 1) {
      tiers.push(t);
    }
    return tiers;
  }, [sourceTier, clampedMaxUnlocked]);

  const effectiveTargetTier =
    targetTier > sourceTier && targetTier <= clampedMaxUnlocked
      ? targetTier
      : Math.min(clampedMaxUnlocked, sourceTier + 1);

  const sourceInfo = useMemo(
    () => getTroopTierInfo(selectedType, sourceTier),
    [selectedType, sourceTier]
  );
  const targetInfo = useMemo(
    () => getTroopTierInfo(selectedType, effectiveTargetTier),
    [selectedType, effectiveTargetTier]
  );

  const ownedAtTarget = troops[getTroopRosterKey(selectedType, effectiveTargetTier)] ?? 0n;

  const quote = useMemo(
    () =>
      calculateTroopPromotionQuote({
        troops,
        resources,
        type: selectedType,
        sourceTier,
        targetTier: effectiveTargetTier,
        amount: parsedAmount,
        castleLevel,
        maxUnlockedTier: clampedMaxUnlocked,
        zeroResourceCost,
      }),
    [
      troops,
      resources,
      selectedType,
      sourceTier,
      effectiveTargetTier,
      parsedAmount,
      castleLevel,
      clampedMaxUnlocked,
      zeroResourceCost,
    ]
  );

  const handleSelectArchetype = (nextType: TroopType) => {
    sound.playSwing();
    setSelectedType(nextType);
    setFeedbackBanner(null);
    const entries = getPromotableTroopEntries(troops, nextType, clampedMaxUnlocked);
    if (entries.length > 0) {
      const nextSource = entries[0].tier;
      setSourceTier(nextSource);
      setTargetTier(Math.min(clampedMaxUnlocked, nextSource + 1));
      const initialAmt = entries[0].ownedCount > 1000n ? 1000n : entries[0].ownedCount;
      setAmountInput(initialAmt.toString());
    } else {
      setAmountInput('0');
    }
  };

  const handleSelectSourceTier = (tier: number) => {
    sound.playSwing();
    setSourceTier(tier);
    setFeedbackBanner(null);
    if (targetTier <= tier) {
      setTargetTier(Math.min(clampedMaxUnlocked, tier + 1));
    }
    const owned = troops[getTroopRosterKey(selectedType, tier)] ?? 0n;
    const defaultAmt = owned > 1000n ? 1000n : owned;
    setAmountInput(defaultAmt.toString());
  };

  const handleSetBatchAmount = (nextAmount: bigint) => {
    sound.playSwing();
    const clamped = nextAmount > ownedAtSource ? ownedAtSource : nextAmount < 0n ? 0n : nextAmount;
    setAmountInput(clamped.toString());
    setFeedbackBanner(null);
  };

  const handleConfirmPromotion = () => {
    if (!quote.valid) {
      setFeedbackBanner({
        kind: 'error',
        message: quote.error ?? 'Unable to promote troops with the current selection.',
      });
      return;
    }

    sound.playSwing();
    const result = onPromoteTroops(selectedType, sourceTier, effectiveTargetTier, quote.amount);
    if (result.ok) {
      const powerDelta = result.powerGained ?? quote.statDeltas.totalPowerGain;
      setFeedbackBanner({
        kind: 'success',
        message: `Promoted ${formatBigInt(quote.amount)} ${quote.sourceName} → ${quote.targetName} (+${formatBigInt(powerDelta)} Garrison Power).`,
      });
    } else {
      setFeedbackBanner({
        kind: 'error',
        message: result.error ?? 'Promotion failed.',
      });
    }
  };

  const visibleResources = RESOURCE_META.filter(
    (item) => item.key !== 'diamond' || quote.totalCost.diamond > 0n
  );

  const otherArchetypesWithUnits = ARCHETYPE_META.filter(
    (meta) => meta.type !== selectedType && promotableSummary.byType[meta.type] > 0n
  );

  return (
    <div
      data-testid="unit-upgrade-modal"
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unit-upgrade-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3 bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-950 border-b border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 shrink-0">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="unit-upgrade-modal-title"
                className="text-lg font-bold font-cinzel text-amber-100 flex flex-wrap items-center gap-x-2"
              >
                <span>Unit Promotion Forge</span>
                <span className="text-xs font-mono text-amber-300/90 tabular-nums">
                  · Castle Lv.{castleLevel} · Max Tier T{clampedMaxUnlocked}
                </span>
              </h2>
              <p className="text-xs text-slate-300/80">
                Promote stationed low-tier troops into higher unlocked tiers using incremental
                supplies · Net capacity change: 0
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="unit-upgrade-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close unit promotion modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5 text-slate-200">
          {/* Archetype Selector */}
          <div className="grid grid-cols-3 gap-2">
            {ARCHETYPE_META.map((arch) => {
              const Icon = arch.icon;
              const promotableCount = promotableSummary.byType[arch.type];
              const isSelected = selectedType === arch.type;
              return (
                <button
                  key={arch.type}
                  type="button"
                  data-testid={`unit-upgrade-type-${arch.type}`}
                  onClick={() => handleSelectArchetype(arch.type)}
                  className={`p-2 rounded-xl border text-left transition-colors duration-75 cursor-pointer ${
                    isSelected
                      ? arch.activeClass
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-bold text-sm">
                      <Icon className={`w-4 h-4 ${arch.iconClass} shrink-0`} />
                      {arch.label}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-amber-300">
                      {formatBigInt(promotableCount)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {arch.role} · {promotableCount > 0n ? 'Ready to promote' : 'No low-tier units'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feedback Banner */}
          {feedbackBanner && (
            <div
              data-testid={
                feedbackBanner.kind === 'success'
                  ? 'unit-upgrade-success-banner'
                  : 'unit-upgrade-error-banner'
              }
              className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                feedbackBanner.kind === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
              }`}
            >
              {feedbackBanner.kind === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{feedbackBanner.message}</span>
            </div>
          )}

          {/* Empty States */}
          {clampedMaxUnlocked <= 1 ? (
            <div
              data-testid="unit-upgrade-empty-locked"
              className="p-6 rounded-xl bg-slate-950/80 border border-slate-700/80 text-center space-y-2"
            >
              <Layers className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Tier 2 Promotion Locked</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Upgrade your Imperial Citadel to Level 5 to unlock Tier 2 troops and begin promoting
                your Tier 1 militia.
              </p>
            </div>
          ) : promotableEntries.length === 0 ? (
            <div
              data-testid="unit-upgrade-empty-state"
              className="p-6 rounded-xl bg-slate-950/80 border border-slate-700/80 text-center space-y-3"
            >
              <Layers className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  No Promotable {ARCHETYPE_META.find((a) => a.type === selectedType)?.label} Units
                  Stationed
                </h3>
                <p className="text-xs text-slate-400 max-w-lg mx-auto">
                  Only existing troops below your highest unlocked tier (T1–T
                  {clampedMaxUnlocked - 1}) can be promoted. Train lower-tier regiments in the
                  Barracks first, or switch to another troop archetype.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {otherArchetypesWithUnits.map((arch) => (
                  <button
                    key={arch.type}
                    type="button"
                    onClick={() => handleSelectArchetype(arch.type)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-200 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Switch to {arch.label} ({formatBigInt(promotableSummary.byType[arch.type])})
                  </button>
                ))}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Return to Barracks
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Source Tier & Target Tier Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {/* Source Tier Picker */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">1. Existing Low-Tier Stack</span>
                    <span className="text-slate-400 font-mono tabular-nums">
                      {promotableEntries.length} stack{promotableEntries.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-0.5">
                    {promotableEntries.map((entry) => {
                      const active = entry.tier === sourceTier;
                      return (
                        <button
                          key={entry.rosterKey}
                          type="button"
                          data-testid={`unit-upgrade-source-t${entry.tier}`}
                          onClick={() => handleSelectSourceTier(entry.tier)}
                          className={`px-2.5 py-1.5 rounded-lg border text-left transition-colors duration-75 cursor-pointer ${
                            active
                              ? 'bg-amber-500/20 border-amber-400 text-amber-100'
                              : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono font-bold text-xs">T{entry.tier}</span>
                            <span className="font-mono text-xs tabular-nums text-amber-300">
                              {formatBigInt(entry.ownedCount)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {entry.name.replace(/^T\d+\s+/, '')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Tier Picker */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">2. Target Promotion Tier</span>
                    <span className="text-amber-300 font-mono tabular-nums">
                      T{sourceTier + 1}–T{clampedMaxUnlocked} unlocked
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {availableTargetTiers.map((tier) => {
                      const active = tier === effectiveTargetTier;
                      return (
                        <button
                          key={tier}
                          type="button"
                          data-testid={`unit-upgrade-target-t${tier}`}
                          onClick={() => {
                            sound.playSwing();
                            setTargetTier(tier);
                            setFeedbackBanner(null);
                          }}
                          className={`py-1 rounded-lg border text-xs font-mono font-bold transition-colors duration-75 cursor-pointer ${
                            active
                              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-sm'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          T{tier}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Side-by-Side Promotion Preview */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-slate-800/80 via-slate-900 to-slate-950 border border-slate-700/90 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-2.5">
                  {/* Source Card */}
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-400">Current Unit</span>
                      <span
                        data-testid="unit-upgrade-source-owned"
                        className="text-xs font-mono tabular-nums text-slate-300"
                      >
                        Owned: {formatBigInt(ownedAtSource)}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white font-cinzel">
                      {sourceInfo.name}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[11px] text-rose-400">ATK</div>
                        <div className="text-xs font-mono font-bold tabular-nums text-slate-200">
                          {formatBigInt(sourceInfo.attack)}
                        </div>
                      </div>
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[11px] text-blue-400">DEF</div>
                        <div className="text-xs font-mono font-bold tabular-nums text-slate-200">
                          {formatBigInt(sourceInfo.defense)}
                        </div>
                      </div>
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[11px] text-emerald-400">HP</div>
                        <div className="text-xs font-mono font-bold tabular-nums text-slate-200">
                          {formatBigInt(sourceInfo.hp)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transition Arrow */}
                  <div className="flex md:flex-col items-center justify-center gap-1 text-amber-300 px-1">
                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                    <span className="text-xs font-mono font-bold tabular-nums whitespace-nowrap">
                      T{sourceTier} → T{effectiveTargetTier}
                    </span>
                  </div>

                  {/* Target Card */}
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-amber-500/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-amber-300">Promoted Unit</span>
                      <span
                        data-testid="unit-upgrade-target-owned"
                        className="text-xs font-mono tabular-nums text-emerald-300"
                      >
                        Owned: {formatBigInt(ownedAtTarget)}
                        {parsedAmount > 0n && ` → ${formatBigInt(ownedAtTarget + parsedAmount)}`}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-amber-100 font-cinzel">
                      {targetInfo.name}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center pt-0.5">
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[11px] text-rose-400">ATK</div>
                        <div className="text-xs font-mono font-bold tabular-nums text-white">
                          {formatBigInt(targetInfo.attack)}
                        </div>
                        <div className="text-[10px] font-mono tabular-nums text-emerald-400">
                          +{formatBigInt(quote.statDeltas.attackPerUnit)}
                        </div>
                      </div>
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[11px] text-blue-400">DEF</div>
                        <div className="text-xs font-mono font-bold tabular-nums text-white">
                          {formatBigInt(targetInfo.defense)}
                        </div>
                        <div className="text-[10px] font-mono tabular-nums text-emerald-400">
                          +{formatBigInt(quote.statDeltas.defensePerUnit)}
                        </div>
                      </div>
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[11px] text-emerald-400">HP</div>
                        <div className="text-xs font-mono font-bold tabular-nums text-white">
                          {formatBigInt(targetInfo.hp)}
                        </div>
                        <div className="text-[10px] font-mono tabular-nums text-emerald-400">
                          +{formatBigInt(quote.statDeltas.hpPerUnit)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Power Gain Strip */}
                <div className="pt-1.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400 font-mono tabular-nums">
                    Power / Unit: {formatBigInt(sourceInfo.powerPerUnit)} →{' '}
                    <span className="text-amber-300 font-bold">
                      {formatBigInt(targetInfo.powerPerUnit)}
                    </span>{' '}
                    (+{formatBigInt(quote.statDeltas.powerPerUnit)}/unit)
                  </span>
                  <span
                    data-testid="unit-upgrade-power-gain"
                    className="font-mono font-bold tabular-nums text-emerald-300"
                  >
                    Batch Power Gain: +{formatBigInt(quote.statDeltas.totalPowerGain)}
                  </span>
                </div>
              </div>

              {/* Promotion Quantity Selector */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <label
                    htmlFor="unit-upgrade-amount-input"
                    className="font-semibold text-slate-300"
                  >
                    3. Troops to Promote
                  </label>
                  <span className="font-mono tabular-nums text-slate-400">
                    Available T{sourceTier}: {formatBigInt(ownedAtSource)} units
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    id="unit-upgrade-amount-input"
                    data-testid="unit-upgrade-amount-input"
                    type="text"
                    inputMode="numeric"
                    value={amountInput}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^0-9]/g, '');
                      setAmountInput(cleaned);
                      setFeedbackBanner(null);
                    }}
                    placeholder="Enter troop count"
                    className="w-full sm:w-44 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-sm font-mono font-bold tabular-nums text-white"
                  />
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 flex-1">
                    {[
                      { label: '100', val: 100n, fixed: true },
                      { label: '1,000', val: 1000n, fixed: true },
                      { label: '10,000', val: 10000n, fixed: true },
                      {
                        label: '25%',
                        val: ownedAtSource > 0n ? (ownedAtSource + 3n) / 4n : 0n,
                        fixed: false,
                      },
                      {
                        label: '50%',
                        val: ownedAtSource > 0n ? (ownedAtSource + 1n) / 2n : 0n,
                        fixed: false,
                      },
                      { label: 'Max', val: ownedAtSource, fixed: false },
                    ].map((preset) => {
                      const disabled =
                        ownedAtSource === 0n ||
                        preset.val === 0n ||
                        (preset.fixed && preset.val > ownedAtSource);
                      const isActive = !disabled && parsedAmount === preset.val && preset.val > 0n;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          disabled={disabled}
                          data-testid={`unit-upgrade-preset-${preset.label.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
                          onClick={() => handleSetBatchAmount(preset.val)}
                          className={`py-1.5 px-2 rounded-lg border text-xs font-mono font-bold whitespace-nowrap transition-colors duration-75 ${
                            disabled
                              ? 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
                              : isActive
                                ? 'bg-amber-500 text-slate-950 border-amber-300 cursor-pointer'
                                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 cursor-pointer'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Incremental Extra Resource Cost */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-300">
                    Extra Promotion Supplies (T{effectiveTargetTier} − T{sourceTier} Cost Delta)
                  </span>
                  <span className="font-mono text-slate-400">
                    {zeroResourceCost
                      ? 'Creator Immunity active · 0 supplies deducted'
                      : `For ${formatBigInt(parsedAmount)} units`}
                  </span>
                </div>
                <div
                  className={`grid grid-cols-2 ${
                    visibleResources.length === 6 ? 'sm:grid-cols-6' : 'sm:grid-cols-5'
                  } gap-2`}
                >
                  {visibleResources.map((res) => {
                    const needed = quote.totalCost[res.key];
                    const missing = quote.missingResources[res.key] ?? 0n;
                    const affordable = zeroResourceCost || missing === 0n;
                    return (
                      <div
                        key={res.key}
                        data-testid={`unit-upgrade-cost-${res.key}`}
                        className={`p-2 rounded-lg border text-xs font-mono tabular-nums ${
                          affordable
                            ? 'bg-slate-800/70 border-slate-700 text-slate-200'
                            : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span>
                            {res.symbol} {res.label}
                          </span>
                          <span className={affordable ? 'text-emerald-400' : 'text-rose-400'}>
                            {affordable ? 'OK' : 'Low'}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white mt-0.5">
                          {formatBigInt(needed)}
                        </div>
                        {!affordable && (
                          <div className="text-[10px] text-rose-300">
                            Need +{formatBigInt(missing)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {promotableEntries.length === 0
              ? 'Station low-tier troops in the Barracks to unlock unit promotion.'
              : quote.valid
                ? `Promote ${formatBigInt(quote.amount)} ${quote.sourceName} to ${quote.targetName} for +${formatBigInt(quote.statDeltas.totalPowerGain)} Power.`
                : (quote.error ?? 'Adjust your selection to continue.')}
          </div>
          <div className="flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              data-testid="unit-upgrade-confirm-btn"
              onClick={handleConfirmPromotion}
              disabled={!quote.valid || promotableEntries.length === 0}
              className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                quote.valid && promotableEntries.length > 0
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {quote.valid && promotableEntries.length > 0
                ? `Promote ${formatBigInt(quote.amount)} (T${sourceTier} → T${effectiveTargetTier})`
                : 'Promote Troops'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
