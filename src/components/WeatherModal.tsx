/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, CloudRain, Sun, Snowflake, Zap, ArrowRight, Shield, Swords, Pickaxe, Sparkles } from 'lucide-react';
import { WeatherType, WEATHER_CONFIGS } from '../game/weather';
import { sound } from '../game/audio';

interface WeatherModalProps {
  currentWeather: WeatherType;
  durationRemainingSec: number;
  onCycleWeather: () => void;
  onSetWeather: (w: WeatherType) => void;
  onClose: () => void;
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  currentWeather,
  durationRemainingSec,
  onCycleWeather,
  onSetWeather,
  onClose,
}) => {
  const activeConfig = WEATHER_CONFIGS[currentWeather];

  const handleSelect = (w: WeatherType) => {
    onSetWeather(w);
    if (w === 'storm') sound.playThunder();
    else sound.playWeatherChange();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border-2 border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl p-2 rounded-xl bg-slate-800/80 border border-slate-700">
              {activeConfig.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold font-cinzel text-white flex items-center gap-2">
                Realm Weather Observatory
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono">
                  {activeConfig.name}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Atmospheric conditions dynamically alter combat effectiveness & open-world harvesting
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-200">
          {/* Active Weather Highlight */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-indigo-950/50 border border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activeConfig.icon}</span>
                <span className="text-base font-bold text-white font-cinzel">{activeConfig.name}</span>
                <span className="text-xs text-cyan-300 font-mono">
                  (Next Shift in {Math.floor(durationRemainingSec)}s)
                </span>
              </div>
              <p className="text-xs text-slate-300">{activeConfig.subtitle}</p>
            </div>
            <button
              onClick={() => {
                onCycleWeather();
                sound.playWeatherChange();
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/30 active:scale-95 transition-all shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" /> Advance Weather
            </button>
          </div>

          {/* Quick Weather State Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              Forecast Atmosphere States (Click to Summon):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(['clear', 'rain', 'snow', 'storm'] as WeatherType[]).map((w) => {
                const conf = WEATHER_CONFIGS[w];
                const isActive = currentWeather === w;
                return (
                  <button
                    key={w}
                    onClick={() => handleSelect(w)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-500/30'
                        : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{conf.icon}</span>
                      <span className="text-xs font-bold text-white">{conf.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">{conf.subtitle}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Status Effects Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Combat Effects Card */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-300 uppercase tracking-wider">
                <Swords className="w-4 h-4 text-rose-400" />
                Troop Combat Status Modifiers
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {activeConfig.combatFlavorText}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded bg-slate-900/80 border border-blue-500/30">
                  <div className="text-[10px] text-blue-300 font-bold">Shieldbearer</div>
                  <div className="font-bold text-white">
                    {activeConfig.troopDefenseMultipliers.shieldbearer > 1.0 ? (
                      <span className="text-emerald-400">
                        +{Math.round((activeConfig.troopDefenseMultipliers.shieldbearer - 1) * 100)}% DEF
                      </span>
                    ) : (
                      'Normal'
                    )}
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-900/80 border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-300 font-bold">Shooter</div>
                  <div className="font-bold text-white">
                    {activeConfig.troopAttackMultipliers.shooter < 1.0 ? (
                      <span className="text-rose-400">
                        -{Math.round((1 - activeConfig.troopAttackMultipliers.shooter) * 100)}% ATK
                      </span>
                    ) : activeConfig.troopAttackMultipliers.shooter > 1.0 ? (
                      <span className="text-emerald-400">
                        +{Math.round((activeConfig.troopAttackMultipliers.shooter - 1) * 100)}% ATK
                      </span>
                    ) : (
                      'Normal'
                    )}
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-900/80 border border-orange-500/30">
                  <div className="text-[10px] text-orange-300 font-bold">Bomber</div>
                  <div className="font-bold text-white">
                    {activeConfig.troopAttackMultipliers.bomber > 1.0 ? (
                      <span className="text-emerald-400 font-bold">
                        +{Math.round((activeConfig.troopAttackMultipliers.bomber - 1) * 100)}% ATK
                      </span>
                    ) : activeConfig.troopAttackMultipliers.bomber < 1.0 ? (
                      <span className="text-rose-400 font-bold">
                        -{Math.round((1 - activeConfig.troopAttackMultipliers.bomber) * 100)}% ATK
                      </span>
                    ) : (
                      'Normal'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Resource Gathering Effects Card */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                <Pickaxe className="w-4 h-4 text-emerald-400" />
                Resource Harvesting Yield Modifiers
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {activeConfig.gatherFlavorText}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">🌲 Wood</div>
                  <div className="font-bold">
                    {Math.round(activeConfig.gatherYieldMultipliers.wood * 100)}%
                  </div>
                </div>
                <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">🌾 Grain</div>
                  <div className="font-bold">
                    {Math.round(activeConfig.gatherYieldMultipliers.grain * 100)}%
                  </div>
                </div>
                <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">💎 Diamond</div>
                  <div className="font-bold text-cyan-300">
                    {Math.round(activeConfig.gatherYieldMultipliers.diamond * 100)}%
                  </div>
                </div>
                <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">🛢️ Oil</div>
                  <div className="font-bold">
                    {Math.round(activeConfig.gatherYieldMultipliers.oil * 100)}%
                  </div>
                </div>
                <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">⚔️ Steel</div>
                  <div className="font-bold">
                    {Math.round(activeConfig.gatherYieldMultipliers.steel * 100)}%
                  </div>
                </div>
                <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">🪙 Copper</div>
                  <div className="font-bold">
                    {Math.round(activeConfig.gatherYieldMultipliers.copper * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Weather changes naturally every 60 seconds or can be summoned on demand.
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all"
          >
            Close Observatory
          </button>
        </div>
      </div>
    </div>
  );
};
