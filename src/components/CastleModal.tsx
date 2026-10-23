/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  Shield,
  Castle as CastleIcon,
  ArrowUpCircle,
  Users,
  Swords,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  calculateCastleTroopCapacity,
  calculateRallyCapacity,
  formatBigInt,
  getCastleUpgradeCost,
  getCastleEra,
  MAX_CASTLE_LEVEL,
} from '../game/math';
import { GameResources } from '../types/game';
import { sound } from '../game/audio';

interface CastleModalProps {
  castleLevel: number;
  resources: GameResources;
  onUpgradeCastle: () => void;
  onClose: () => void;
}

export const CastleModal: React.FC<CastleModalProps> = ({
  castleLevel,
  resources,
  onUpgradeCastle,
  onClose,
}) => {
  const currentCapacity = calculateCastleTroopCapacity(castleLevel);
  const nextCapacity = calculateCastleTroopCapacity(castleLevel + 1);
  const currentRally = calculateRallyCapacity(castleLevel);
  const nextRally = calculateRallyCapacity(castleLevel + 1);
  const upgradeCost = getCastleUpgradeCost(castleLevel);
  const currentEra = getCastleEra(castleLevel);

  const canAfford =
    resources.wood >= upgradeCost.wood &&
    resources.steel >= upgradeCost.steel &&
    resources.copper >= upgradeCost.copper &&
    resources.grain >= upgradeCost.grain &&
    resources.oil >= upgradeCost.oil &&
    resources.diamond >= upgradeCost.diamond;

  const isMaxLevel = castleLevel >= MAX_CASTLE_LEVEL;

  const handleUpgrade = () => {
    if (canAfford && !isMaxLevel) {
      sound.playUpgradeFanfare();
      onUpgradeCastle();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border-2 border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-400">
              <CastleIcon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-cinzel text-amber-100 flex items-center gap-2">
                Imperial Castle
                <span className="text-sm px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono">
                  Level {castleLevel} / {MAX_CASTLE_LEVEL}
                </span>
              </h2>
              <p className="text-xs text-amber-200/70">
                Hub of the Realm · Sovereign Fortification & Army Hub
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
          {/* Key Milestones Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/40 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Sparkles className="w-8 h-8 text-cyan-400 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-cyan-200">
                  Ultimate Milestone: Castle Level 100
                </div>
                <div className="text-xs text-slate-400">
                  Unlocks maximum capacity of{' '}
                  <span className="font-bold text-amber-300">
                    1,000 Trillion (1.00Q) Total Troops
                  </span>{' '}
                  and{' '}
                  <span className="font-bold text-cyan-300">1 Trillion (1.00T) Rally Limit</span>!
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Progress to Cap</div>
              <div className="text-lg font-bold font-mono text-cyan-300">{castleLevel}%</div>
            </div>
          </div>

          {/* Castle Era Card from Kingdom Systems Design */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  Era {currentEra.eraIndex} / 10
                </span>
                <span className="text-sm font-bold text-white font-cinzel">{currentEra.name}</span>
              </div>
              <p className="text-xs text-slate-300">
                Architecture: <span className="text-amber-200">{currentEra.buildingTheme}</span> ·
                Perk:{' '}
                <span className="text-emerald-300 font-semibold">{currentEra.perkDescription}</span>
              </p>
            </div>
            <div className="sm:text-right shrink-0">
              <div className="text-[11px] text-slate-400">Era Power Multiplier</div>
              <div className="text-base font-mono font-bold text-amber-400">
                {currentEra.castleMultiplier}x Multiplier
              </div>
            </div>
          </div>

          {/* Current Stats vs Next Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Troop Capacity Card */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" /> Total Troop Capacity
                </span>
                <span className="text-xs text-emerald-400 font-mono">T1-T20 Army Cap</span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-black font-mono text-white">
                    {formatBigInt(currentCapacity)}
                  </div>
                  <div className="text-xs text-slate-400">Current Castle Lv.{castleLevel}</div>
                </div>
                {!isMaxLevel && (
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-emerald-400">
                      +{formatBigInt(nextCapacity - currentCapacity)}
                    </div>
                    <div className="text-xs text-slate-400">Next Lv.{castleLevel + 1}</div>
                  </div>
                )}
              </div>
              <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(3, castleLevel))}%` }}
                />
              </div>
            </div>

            {/* Rally Capacity Card */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Swords className="w-4 h-4 text-rose-400" /> Max Rally Capacity
                </span>
                <span className="text-xs text-rose-400 font-mono">Max 1 Trillion</span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-black font-mono text-white">
                    {formatBigInt(currentRally)}
                  </div>
                  <div className="text-xs text-slate-400">Current Rally Cap</div>
                </div>
                {!isMaxLevel && (
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-rose-400">
                      +{formatBigInt(nextRally - currentRally)}
                    </div>
                    <div className="text-xs text-slate-400">Next Lv.{castleLevel + 1}</div>
                  </div>
                )}
              </div>
              <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(3, castleLevel))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Upgrade Cost Table */}
          {!isMaxLevel ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                Required Materials for Castle Level {castleLevel + 1}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div
                  className={`p-3 rounded-lg border ${
                    resources.wood >= upgradeCost.wood
                      ? 'bg-slate-800/80 border-slate-700'
                      : 'bg-red-950/30 border-red-500/50'
                  }`}
                >
                  <div className="text-xs text-slate-400">🌲 Wood</div>
                  <div className="font-mono font-bold text-sm">
                    {formatBigInt(resources.wood)} / {formatBigInt(upgradeCost.wood)}
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    resources.steel >= upgradeCost.steel
                      ? 'bg-slate-800/80 border-slate-700'
                      : 'bg-red-950/30 border-red-500/50'
                  }`}
                >
                  <div className="text-xs text-slate-400">⚔️ Steel</div>
                  <div className="font-mono font-bold text-sm">
                    {formatBigInt(resources.steel)} / {formatBigInt(upgradeCost.steel)}
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    resources.copper >= upgradeCost.copper
                      ? 'bg-slate-800/80 border-slate-700'
                      : 'bg-red-950/30 border-red-500/50'
                  }`}
                >
                  <div className="text-xs text-slate-400">🪙 Copper</div>
                  <div className="font-mono font-bold text-sm">
                    {formatBigInt(resources.copper)} / {formatBigInt(upgradeCost.copper)}
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    resources.grain >= upgradeCost.grain
                      ? 'bg-slate-800/80 border-slate-700'
                      : 'bg-red-950/30 border-red-500/50'
                  }`}
                >
                  <div className="text-xs text-slate-400">🌾 Grain</div>
                  <div className="font-mono font-bold text-sm">
                    {formatBigInt(resources.grain)} / {formatBigInt(upgradeCost.grain)}
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    resources.oil >= upgradeCost.oil
                      ? 'bg-slate-800/80 border-slate-700'
                      : 'bg-red-950/30 border-red-500/50'
                  }`}
                >
                  <div className="text-xs text-slate-400">🛢️ Oil</div>
                  <div className="font-mono font-bold text-sm">
                    {formatBigInt(resources.oil)} / {formatBigInt(upgradeCost.oil)}
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    resources.diamond >= upgradeCost.diamond
                      ? 'bg-slate-800/80 border-slate-700'
                      : 'bg-red-950/30 border-red-500/50'
                  }`}
                >
                  <div className="text-xs text-slate-400">💎 Diamond</div>
                  <div className="font-mono font-bold text-sm text-cyan-300">
                    {formatBigInt(resources.diamond)} / {formatBigInt(upgradeCost.diamond)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/40 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-amber-400 mx-auto" />
              <div className="text-lg font-bold text-amber-200">Supreme Citadel Achieved!</div>
              <p className="text-xs text-slate-400">
                You have reached the maximum Castle Level of 100 with 1,000 Trillion troop capacity
                and 1 Trillion rally strength.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {canAfford && !isMaxLevel
              ? 'Ready to fortify.'
              : isMaxLevel
                ? 'Maximum tier.'
                : 'Gather needed materials from Lv 1-10 resource points.'}
          </div>
          <button
            onClick={handleUpgrade}
            disabled={!canAfford || isMaxLevel}
            className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
              canAfford && !isMaxLevel
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <ArrowUpCircle className="w-5 h-5" />
            {isMaxLevel ? 'Max Citadel Reached' : `Upgrade to Level ${castleLevel + 1}`}
          </button>
        </div>
      </div>
    </div>
  );
};
