/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Shield,
  Zap,
  Terminal,
  Clock,
  Sparkles,
  Flame,
  Award,
  Crown,
  Pause,
  Play,
  RotateCcw,
  CloudRain,
} from 'lucide-react';
import { GameResources, ResourceType, TroopType } from '../types/game';
import { WeatherType } from '../game/weather';
import { sound } from '../game/audio';

interface AdminConsoleModalProps {
  godmode: boolean;
  onToggleGodmode: () => void;
  castleLevel: number;
  onSetCastleLevel: (lvl: number) => void;
  onGrantResources: (amount: Partial<GameResources>) => void;
  onSpawnTroops: (type: TroopType, tier: number, amount: bigint) => void;
  timeSpeedMultiplier: number;
  onSetTimeSpeed: (speed: number) => void;
  isTimeFrozen: boolean;
  onToggleTimeFreeze: () => void;
  onTriggerRivalRaid: () => void;
  currentWeather?: WeatherType;
  onSetWeather?: (w: WeatherType) => void;
  onClose: () => void;
}

export const AdminConsoleModal: React.FC<AdminConsoleModalProps> = ({
  godmode,
  onToggleGodmode,
  castleLevel,
  onSetCastleLevel,
  onGrantResources,
  onSpawnTroops,
  timeSpeedMultiplier,
  onSetTimeSpeed,
  isTimeFrozen,
  onToggleTimeFreeze,
  onTriggerRivalRaid,
  currentWeather = 'clear',
  onSetWeather,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'cheats' | 'troops' | 'world' | 'logs'>('cheats');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[AdminAuth] Session authenticated with GM privileges (Level 999 root).',
    '[GameEngine] AVX-512 SIMD vector subsystem: ONLINE.',
    '[AdminConsole] Causality tick hooked into Game::update(float dt).',
  ]);

  const addLog = (msg: string) => {
    setConsoleLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  const handleMaxCastle = () => {
    onSetCastleLevel(100);
    sound.playUpgradeFanfare();
    addLog('CMD: Castle level set to 100 (Era X: Celestial Imperium, 1000T capacity unlocked).');
  };

  const handleGrantSupplies = () => {
    onGrantResources({
      wood: 100_000_000n,
      steel: 100_000_000n,
      copper: 100_000_000n,
      grain: 100_000_000n,
      oil: 100_000_000n,
      diamond: 1_000_000n,
    });
    sound.playGather();
    addLog('CMD: Granted +100M Wood/Steel/Copper/Grain/Oil & +1M Diamonds.');
  };

  const handleSpawnT20Troops = (type: TroopType, amount: bigint) => {
    onSpawnTroops(type, 20, amount);
    sound.playSwing();
    addLog(`CMD: Spawned +${amount.toLocaleString()} T20 ${type.toUpperCase()} cohort into garrison.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-red-500/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header matching admin_console_cadf656e.cpp */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border-b border-red-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-mono font-black text-xs tracking-wider border border-red-400">
              GM CONSOLE
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2">
                ShadowRealm / VoxelRealms Game Master Controller
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                  C++20 Native Interop
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Wired to: Entities, Transform, Castle Era, Troop Cohorts & SIMD Simulator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close GM Console"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 px-6 gap-2 pt-2">
          {[
            { id: 'cheats', label: 'Godmode & Cheats', icon: Zap },
            { id: 'troops', label: 'T20 Troop Spawner', icon: Shield },
            { id: 'world', label: 'Time & World Events', icon: Clock },
            { id: 'logs', label: 'Admin Logs', icon: Terminal },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id as typeof activeTab);
                  sound.playSwing();
                }}
                className={`px-4 py-2 text-xs font-mono font-bold rounded-t-xl flex items-center gap-2 border-t-2 transition-all ${
                  active
                    ? 'bg-slate-900 border-red-500 text-red-200'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-200">
          {activeTab === 'cheats' && (
            <div className="space-y-4">
              {/* Godmode & Instant Castle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-400" />
                      Godmode (Invulnerability)
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Infinite Lord HP, zero casualty attrition, counter-strike block.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onToggleGodmode();
                      sound.playSwing();
                      addLog(`CMD: Godmode toggled ${!godmode ? 'ENABLED' : 'DISABLED'}.`);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      godmode
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {godmode ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      Instant Max Castle (Lv.100)
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Unlocks Era X: Celestial Imperium & 1,000 Trillion troop cap.
                    </div>
                  </div>
                  <button
                    onClick={handleMaxCastle}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold shadow-lg shadow-amber-500/20 active:scale-95"
                  >
                    SET LEVEL 100
                  </button>
                </div>
              </div>

              {/* Instant Resources & Supplies */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Infinite Kingdom Treasury</h3>
                    <p className="text-xs text-slate-400">
                      Grant +100 Million of Wood, Steel, Copper, Grain, Oil and +1M Diamonds.
                    </p>
                  </div>
                  <button
                    onClick={handleGrantSupplies}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold shadow-md shadow-emerald-600/25 active:scale-95"
                  >
                    +100M ALL SUPPLIES
                  </button>
                </div>
              </div>

              {/* Castle Level Slider */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">Castle Level Set:</span>
                  <span className="font-mono text-amber-400 font-bold">Level {castleLevel} / 100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={castleLevel}
                  onChange={(e) => {
                    const l = parseInt(e.target.value);
                    onSetCastleLevel(l);
                    addLog(`CMD: Castle Level slider adjusted to ${l}.`);
                  }}
                  className="w-full accent-amber-400"
                />
              </div>
            </div>
          )}

          {activeTab === 'troops' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <h3 className="text-sm font-bold text-white">T20 Celestial Vanguard Army Spawner</h3>
                <p className="text-xs text-slate-400">
                  Instantly summon massive cohorts of Rank T20 troops to test billion and trillion power scaling.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-blue-500/40 space-y-2">
                    <div className="text-xs font-bold text-blue-300">T20 Celestial Aegis</div>
                    <div className="text-[11px] text-slate-400">Supreme Tank Cohort</div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleSpawnT20Troops('shieldbearer', 100_000n)}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-mono font-bold"
                      >
                        +100K
                      </button>
                      <button
                        onClick={() => handleSpawnT20Troops('shieldbearer', 10_000_000n)}
                        className="flex-1 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-mono font-bold"
                      >
                        +10M
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-2">
                    <div className="text-xs font-bold text-emerald-300">T20 Celestial Deadeye</div>
                    <div className="text-[11px] text-slate-400">Infinite Sniper Cohort</div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleSpawnT20Troops('shooter', 100_000n)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-mono font-bold"
                      >
                        +100K
                      </button>
                      <button
                        onClick={() => handleSpawnT20Troops('shooter', 10_000_000n)}
                        className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-mono font-bold"
                      >
                        +10M
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-orange-500/40 space-y-2">
                    <div className="text-xs font-bold text-orange-300">T20 Celestial Annihilator</div>
                    <div className="text-[11px] text-slate-400">Omega Siege Mortars</div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleSpawnT20Troops('bomber', 100_000n)}
                        className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-mono font-bold"
                      >
                        +100K
                      </button>
                      <button
                        onClick={() => handleSpawnT20Troops('bomber', 10_000_000n)}
                        className="flex-1 py-1.5 bg-orange-700 hover:bg-orange-600 text-white rounded text-xs font-mono font-bold"
                      >
                        +10M
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'world' && (
            <div className="space-y-4">
              {/* Time Freeze & Time Scale */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      Day / Night Time Engine Simulation
                    </h3>
                    <p className="text-xs text-slate-400">
                      Matches AdminConsole isTimeFrozen and timeScale APIs.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onToggleTimeFreeze();
                      sound.playSwing();
                      addLog(`CMD: Time freeze toggled ${!isTimeFrozen ? 'FROZEN' : 'RESUMED'}.`);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 ${
                      isTimeFrozen ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isTimeFrozen ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    {isTimeFrozen ? 'RESUME TIME' : 'FREEZE TIME'}
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Time Multiplier:</span>
                    <span className="text-cyan-400 font-bold">{timeSpeedMultiplier}x Realtime</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 5, 10, 25, 50].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => {
                          onSetTimeSpeed(spd);
                          addLog(`CMD: Time scale set to ${spd}x.`);
                        }}
                        className={`flex-1 py-1.5 rounded text-xs font-mono font-bold border ${
                          timeSpeedMultiplier === spd
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Weather Engine Control */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-cyan-400" />
                    Atmospheric Weather Engine State
                  </h3>
                  <span className="text-xs font-mono text-cyan-300 font-bold uppercase">
                    Active: {currentWeather || 'clear'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['clear', 'rain', 'snow', 'storm'] as WeatherType[]).map((w) => (
                    <button
                      key={w}
                      onClick={() => {
                        if (onSetWeather) onSetWeather(w);
                        if (w === 'storm') sound.playThunder();
                        else sound.playWeatherChange();
                        addLog(`CMD: Atmosphere manually altered to ${w.toUpperCase()}.`);
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-mono font-bold capitalize border transition-all ${
                        currentWeather === w
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {w === 'clear' ? '☀️ Clear' : w === 'rain' ? '🌧️ Rain' : w === 'snow' ? '❄️ Snow' : '⚡ Storm'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulated Rival Kingdom Raid */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-400" />
                    Simulate Rival Kingdom Territory Raid
                  </h3>
                  <p className="text-xs text-slate-400">
                    Triggers simulated rival lord invasion from the leaderboard to test defense garrison.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onTriggerRivalRaid();
                    sound.playExplosion();
                    addLog('CMD: Dispatched AI Rival Kingdom [TITAN] Lord Chronos territory raid simulation.');
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold shadow-md shadow-rose-600/30 active:scale-95"
                >
                  TRIGGER RAID
                </button>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              <div className="text-xs font-mono text-slate-400">Native Engine Event Stream</div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 space-y-1.5 max-h-[340px] overflow-y-auto">
                {consoleLogs.map((log, i) => (
                  <div key={i} className="leading-relaxed">
                    {log}
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
