/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Play, Shield, Sparkles, Gift } from 'lucide-react';
import { sound } from '../game/audio';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenCharacterCreation: () => void;
  onOpenDailyLogin?: () => void;
  canClaimDailyLogin?: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenCharacterCreation,
  onOpenDailyLogin,
  canClaimDailyLogin = false,
}) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        sound.playUpgradeFanfare();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStartGame]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-6 sm:p-12 bg-radial from-slate-900/60 via-slate-950/80 to-slate-950 pointer-events-auto select-none">
      {/* Top Banner & Game Highlights */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          HDR10+ ADVANCED 3D · C++ 20+ SIMD ENGINE
        </div>

        <div className="flex items-center gap-2">
          {onOpenDailyLogin && (
            <button
              type="button"
              onClick={onOpenDailyLogin}
              className="relative px-3.5 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900/80 border border-amber-500/50 text-xs font-bold text-amber-200 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Gift className="w-4 h-4 text-amber-400" />
              <span>Daily Login Decree</span>
              {canClaimDailyLogin && (
                <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-mono font-black text-[10px] animate-pulse">
                  NEW
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCharacterCreation}
            className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            Character Creation Centre
          </button>
        </div>
      </div>

      {/* Center Hero Lockup */}
      <div className="max-w-2xl mx-auto text-center space-y-6 my-auto">
        {/* Bespoke Title Logo Lockup */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
            Open World Voxel MMORPG
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-cinzel tracking-tight text-amber-300 drop-shadow-xl">
            VOXEL REALMS
          </h1>
          <div className="text-sm sm:text-base font-cinzel text-slate-300 tracking-wider">
            CASTLE SIEGE · 1,000 TRILLION CAPACITY · TITAN RALLIES
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-slate-400">
          <span className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800">
            🏰 Castle Lv 0 - 100
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800">
            ⚔️ T1 - T20 Troops (Shield, Shooter, Bomber)
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800">
            📯 1 Trillion Rally Cap
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800">
            🐲 Lv 1 - 1000 Monsters
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800">
            📜 Daily Veteran Scrolls
          </span>
        </div>

        {/* Start Button */}
        <div className="pt-4 flex flex-col items-center gap-3">
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              sound.playUpgradeFanfare();
              onStartGame();
            }}
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black font-cinzel text-lg shadow-xl shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-slate-950" />
            ENTER THE REALM
          </button>
        </div>
      </div>

      {/* Flat Control Hint Line */}
      <div className="text-center text-xs font-mono text-slate-400 tracking-wide">
        WASD / Arrow Keys Move · Mouse Drag Look · Space / Click Interact · Touch D-Pad on Android
      </div>
    </div>
  );
};

