/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Shield, Crosshair, Bomb, Swords, Users, Sparkles } from 'lucide-react';
import { TroopType, GameResources, PlayerTroopRoster } from '../types/game';
import { getTroopTierInfo, formatBigInt } from '../game/math';
import { sound } from '../game/audio';

interface TroopBarracksModalProps {
  troops: PlayerTroopRoster;
  resources: GameResources;
  castleLevel: number;
  maxCapacity: bigint;
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
  onTrainTroops,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<TroopType>('shieldbearer');
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [trainMultiplier, setTrainMultiplier] = useState<bigint>(1000n);

  const currentInfo = getTroopTierInfo(selectedType, selectedTier);

  // Calculate total currently trained troops across all types and tiers
  const totalTroopsCount = Object.values(troops).reduce((sum, cur) => sum + cur, 0n);

  // Max unlocked tier based on castle level (Tier 1 at lv 0, up to Tier 20 at Lv 95+)
  const maxUnlockedTier = Math.min(20, Math.max(1, Math.floor(castleLevel / 5) + 1));

  // Required resources for the selected training batch
  const totalWood = currentInfo.woodCost * trainMultiplier;
  const totalSteel = currentInfo.steelCost * trainMultiplier;
  const totalCopper = currentInfo.copperCost * trainMultiplier;
  const totalGrain = currentInfo.grainCost * trainMultiplier;
  const totalOil = currentInfo.oilCost * trainMultiplier;
  const totalDiamond = currentInfo.diamondCost * trainMultiplier;

  const canAfford =
    resources.wood >= totalWood &&
    resources.steel >= totalSteel &&
    resources.copper >= totalCopper &&
    resources.grain >= totalGrain &&
    resources.oil >= totalOil &&
    resources.diamond >= totalDiamond &&
    totalTroopsCount + trainMultiplier <= maxCapacity;

  const handleTrain = () => {
    if (!canAfford) return;
    sound.playSwing();
    onTrainTroops(selectedType, selectedTier, trainMultiplier, {
      wood: totalWood,
      steel: totalSteel,
      copper: totalCopper,
      grain: totalGrain,
      oil: totalOil,
      diamond: totalDiamond,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-red-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 border-b border-red-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400">
              <Swords className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-cinzel text-red-100 flex items-center gap-2">
                Imperial War Barracks
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-400/40 text-red-300 font-mono">
                  Tiers T1 - T20 Unlocked
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
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
          {/* Total Army Capacity Gauge */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs text-slate-400">Total Troops Mobilized</div>
                <div className="text-xl font-black font-mono text-white">
                  {formatBigInt(totalTroopsCount)}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    / {formatBigInt(maxCapacity)} Max Cap
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full sm:w-48 bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Number((totalTroopsCount * 100n) / (maxCapacity || 1n)))}%`,
                }}
              />
            </div>
          </div>

          {/* Archetype Selector */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSelectedType('shieldbearer')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                selectedType === 'shieldbearer'
                  ? 'bg-blue-950/70 border-blue-400 text-blue-200 ring-2 ring-blue-500/30'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Shield className="w-6 h-6 text-blue-400" />
              <div className="text-sm font-bold">Shieldbearer</div>
              <div className="text-[11px] text-blue-300/80">Tank · Counter vs Shooters</div>
            </button>

            <button
              onClick={() => setSelectedType('shooter')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                selectedType === 'shooter'
                  ? 'bg-emerald-950/70 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/30'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Crosshair className="w-6 h-6 text-emerald-400" />
              <div className="text-sm font-bold">Shooter</div>
              <div className="text-[11px] text-emerald-300/80">Ranged · Counter vs Bombers</div>
            </button>

            <button
              onClick={() => setSelectedType('bomber')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                selectedType === 'bomber'
                  ? 'bg-orange-950/70 border-orange-400 text-orange-200 ring-2 ring-orange-500/30'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Bomb className="w-6 h-6 text-orange-400" />
              <div className="text-sm font-bold">Bomber</div>
              <div className="text-[11px] text-orange-300/80">Siege · Counter vs Shields</div>
            </button>
          </div>

          {/* Tier Slider / Selection (T1 - T20) */}
          <div className="space-y-2">
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
                    className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
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
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/90 via-slate-900 to-slate-950 border border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white font-cinzel flex items-center gap-2">
                  {currentInfo.name}
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono">
                    Rank T{selectedTier}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{currentInfo.description}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Power / Unit</div>
                <div className="text-base font-bold font-mono text-amber-300">
                  {formatBigInt(currentInfo.powerPerUnit)}
                </div>
              </div>
            </div>

            {/* Battle Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60 text-center">
                <div className="text-xs text-rose-400">Attack</div>
                <div className="text-sm font-bold font-mono text-white">
                  {formatBigInt(currentInfo.attack)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60 text-center">
                <div className="text-xs text-blue-400">Defense</div>
                <div className="text-sm font-bold font-mono text-white">
                  {formatBigInt(currentInfo.defense)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60 text-center">
                <div className="text-xs text-emerald-400">Health (HP)</div>
                <div className="text-sm font-bold font-mono text-white">
                  {formatBigInt(currentInfo.hp)}
                </div>
              </div>
            </div>
          </div>

          {/* Batch Train Multiplier Selector */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400">Training Batch Quantity</div>
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
                  className={`py-2 px-3 rounded-lg text-xs font-mono font-bold border transition-all ${
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
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400">
              Required Supplies for {formatBigInt(trainMultiplier)} Troops
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div
                className={`p-2 rounded-lg border text-xs font-mono ${
                  resources.wood >= totalWood
                    ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                    : 'bg-red-950/30 border-red-500/40 text-red-300'
                }`}
              >
                🌲 {formatBigInt(totalWood)} Wood
              </div>
              <div
                className={`p-2 rounded-lg border text-xs font-mono ${
                  resources.steel >= totalSteel
                    ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                    : 'bg-red-950/30 border-red-500/40 text-red-300'
                }`}
              >
                ⚔️ {formatBigInt(totalSteel)} Steel
              </div>
              <div
                className={`p-2 rounded-lg border text-xs font-mono ${
                  resources.copper >= totalCopper
                    ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                    : 'bg-red-950/30 border-red-500/40 text-red-300'
                }`}
              >
                🪙 {formatBigInt(totalCopper)} Copper
              </div>
              <div
                className={`p-2 rounded-lg border text-xs font-mono ${
                  resources.grain >= totalGrain
                    ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                    : 'bg-red-950/30 border-red-500/40 text-red-300'
                }`}
              >
                🌾 {formatBigInt(totalGrain)} Grain
              </div>
              <div
                className={`p-2 rounded-lg border text-xs font-mono ${
                  resources.oil >= totalOil
                    ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                    : 'bg-red-950/30 border-red-500/40 text-red-300'
                }`}
              >
                🛢️ {formatBigInt(totalOil)} Oil
              </div>
              {totalDiamond > 0n && (
                <div
                  className={`p-2 rounded-lg border text-xs font-mono ${
                    resources.diamond >= totalDiamond
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
        <div className="p-5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {canAfford
              ? `Ready to enlist ${formatBigInt(trainMultiplier)} ${currentInfo.name}.`
              : 'Insufficient supplies or exceeded castle troop capacity.'}
          </div>
          <button
            onClick={handleTrain}
            disabled={!canAfford}
            className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
              canAfford
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            Recruit {formatBigInt(trainMultiplier)} Troops
          </button>
        </div>
      </div>
    </div>
  );
};
