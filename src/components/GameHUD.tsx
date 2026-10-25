/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Castle,
  Swords,
  Award,
  Shield,
  Flame,
  Pickaxe,
  Trophy,
  Cpu,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Sparkles,
  Brain,
  Gift,
  Crown,
} from 'lucide-react';
import { CharacterAppearance, GameResources } from '../types/game';
import { WeatherType, WEATHER_CONFIGS } from '../game/weather';
import { formatBigInt } from '../game/math';
import { sound } from '../game/audio';

interface GameHUDProps {
  playerAppearance: CharacterAppearance;
  castleLevel: number;
  playerPower: bigint;
  playerExp: bigint;
  resources: GameResources;
  timeOfDayHours: number;
  timeSpeedMultiplier: number;
  weather?: WeatherType;
  weatherRemainingSec?: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onCycleTimeSpeed: () => void;
  onOpenWeather?: () => void;
  cultivationRealmName?: string;
  cultivationLayer?: number;
  onOpenCultivation: () => void;
  onOpenWorldAI?: () => void;
  onOpenCastle: () => void;
  onOpenTroops: () => void;
  onOpenCharacterCreation: () => void;
  onOpenHeroes: () => void;
  onOpenClan: () => void;
  onOpenWorldBoss: () => void;
  onOpenResources: () => void;
  onOpenLeaderboard: () => void;
  onOpenCppCore: () => void;
  onOpenAdminConsole: () => void;
  onOpenDailyLogin?: () => void;
  canClaimDailyLogin?: boolean;
  dailyStreakDays?: number;
  veteranScrollsOwned?: number;
  onOpenVipSubscription?: () => void;
  vipBadgeLabel?: string;
  canClaimVipStipend?: boolean;
  vipLoyaltyLevel?: number;
  graphicsQuality?: 'ultra' | 'high' | 'balanced';
  onCycleGraphicsQuality?: () => void;
  targetPlatform?: 'pc_console' | 'mobile';
  onToggleTargetPlatform?: () => void;
  godmode?: boolean;
  onTouchMove?: (delta: { x: number; y: number }) => void;
  onTouchEnd?: () => void;
  onActionClick?: (action: 'attack' | 'gather' | 'jump') => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  playerAppearance,
  castleLevel,
  playerPower,
  playerExp: _playerExp,
  resources,
  timeOfDayHours,
  timeSpeedMultiplier,
  weather = 'clear',
  weatherRemainingSec = 60,
  isMuted,
  onToggleMute,
  onCycleTimeSpeed,
  onOpenWeather,
  cultivationRealmName = 'Qi Refinement',
  cultivationLayer = 1,
  onOpenCultivation,
  onOpenWorldAI,
  onOpenCastle,
  onOpenTroops,
  onOpenCharacterCreation,
  onOpenHeroes,
  onOpenClan,
  onOpenWorldBoss,
  onOpenResources,
  onOpenLeaderboard,
  onOpenCppCore,
  onOpenAdminConsole,
  onOpenDailyLogin,
  canClaimDailyLogin = false,
  dailyStreakDays = 0,
  veteranScrollsOwned = 0,
  onOpenVipSubscription,
  vipBadgeLabel = 'VIP 0',
  canClaimVipStipend = false,
  vipLoyaltyLevel = 1,
  graphicsQuality = 'ultra',
  onCycleGraphicsQuality,
  targetPlatform = 'pc_console',
  onToggleTargetPlatform,
  godmode,
  onTouchMove,
  onTouchEnd,
  onActionClick,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // Touch joystick tracking
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [, setIsDraggingJoystick] = useState(false);

  const formattedHours = Math.floor(timeOfDayHours);
  const formattedMinutes = Math.floor((timeOfDayHours % 1) * 60);
  const timeString = `${String(formattedHours).padStart(2, '0')}:${String(formattedMinutes).padStart(2, '0')}`;
  const isNight = timeOfDayHours < 6 || timeOfDayHours >= 18;
  const weatherConfig = WEATHER_CONFIGS[weather] || WEATHER_CONFIGS.clear;

  const handleJoystickTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDraggingJoystick(true);
    handleJoystickMove(e);
  };

  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 36;

    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);
    const posX = Math.cos(angle) * clampedDist;
    const posY = Math.sin(angle) * clampedDist;

    setJoystickPos({ x: posX, y: posY });

    if (onTouchMove) {
      onTouchMove({ x: posX / maxDist, y: posY / maxDist });
    }
  };

  const handleJoystickTouchEnd = () => {
    setIsDraggingJoystick(false);
    setJoystickPos({ x: 0, y: 0 });
    if (onTouchEnd) onTouchEnd();
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Lord Identity Card */}
        <div className="pointer-events-auto p-2.5 sm:p-3 rounded-2xl bg-slate-950/85 border border-slate-800 shadow-xl flex items-center gap-3">
          <button
            onClick={() => {
              sound.playSwing();
              onOpenCharacterCreation();
            }}
            className="relative group p-1 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
            title="Open Character Creation Centre"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-lg">
              {playerAppearance.name.charAt(0)}
            </div>
            <span className="absolute -bottom-1 -right-1 text-[10px] px-1 rounded bg-cyan-500 text-slate-950 font-bold font-mono">
              T{playerAppearance.armorTier}
            </span>
          </button>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-mono font-bold text-amber-400">
                [{playerAppearance.clanTag}]
              </span>
              <span className="text-sm font-bold text-white font-cinzel">
                {playerAppearance.name}
              </span>
              <button
                onClick={() => {
                  sound.playSwing();
                  onOpenCultivation();
                }}
                className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 hover:text-white border border-amber-400/40 font-mono font-bold flex items-center gap-1 transition-all"
                title="Open Cultivation Cave Abode & Dantian"
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                {cultivationRealmName} L{cultivationLayer}
              </button>
              {onOpenVipSubscription && (
                <button
                  type="button"
                  data-testid="hud-vip-badge-btn"
                  onClick={() => {
                    sound.playSwing();
                    onOpenVipSubscription();
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/60 font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Open Imperial VIP Member Subscription & Daily Stipend Chest"
                >
                  <Crown className="w-2.5 h-2.5 text-amber-400" />
                  <span>{vipBadgeLabel}</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
              <span
                className="text-emerald-400 font-bold tabular-nums"
                data-testid="hud-player-might"
              >
                {formatBigInt(playerPower)} Might
              </span>
              <span>·</span>
              <span className="text-cyan-400 font-bold">Castle Lv.{castleLevel}</span>
            </div>
          </div>
        </div>

        {/* Resources Ticker */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 p-2 rounded-2xl bg-slate-950/85 border border-slate-800 shadow-xl overflow-x-auto max-w-full">
          <button
            onClick={onOpenResources}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800/60 transition-colors"
            title="Wood supplies"
          >
            <span className="text-sm">🌲</span>
            <span className="text-xs font-mono font-bold text-slate-200">
              {formatBigInt(resources.wood)}
            </span>
          </button>

          <button
            onClick={onOpenResources}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800/60 transition-colors"
            title="Steel supplies"
          >
            <span className="text-sm">⚔️</span>
            <span className="text-xs font-mono font-bold text-slate-200">
              {formatBigInt(resources.steel)}
            </span>
          </button>

          <button
            onClick={onOpenResources}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800/60 transition-colors"
            title="Copper supplies"
          >
            <span className="text-sm">🪙</span>
            <span className="text-xs font-mono font-bold text-slate-200">
              {formatBigInt(resources.copper)}
            </span>
          </button>

          <button
            onClick={onOpenResources}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800/60 transition-colors"
            title="Grain supplies"
          >
            <span className="text-sm">🌾</span>
            <span className="text-xs font-mono font-bold text-slate-200">
              {formatBigInt(resources.grain)}
            </span>
          </button>

          <button
            onClick={onOpenResources}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800/60 transition-colors"
            title="Oil supplies"
          >
            <span className="text-sm">🛢️</span>
            <span className="text-xs font-mono font-bold text-slate-200">
              {formatBigInt(resources.oil)}
            </span>
          </button>

          <button
            onClick={onOpenResources}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800/60 transition-colors"
            title="Diamond gems"
          >
            <span className="text-sm">💎</span>
            <span
              className="text-xs font-mono font-bold text-cyan-300"
              data-testid="hud-diamond-count"
            >
              {formatBigInt(resources.diamond)}
            </span>
          </button>

          {onOpenDailyLogin && (
            <button
              onClick={() => {
                sound.playSwing();
                onOpenDailyLogin();
              }}
              data-testid="hud-daily-login-btn"
              className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                canClaimDailyLogin
                  ? 'bg-amber-500/25 border-amber-400 text-amber-200 animate-pulse'
                  : 'bg-slate-900/90 border-amber-500/40 text-amber-300 hover:bg-slate-800'
              }`}
              title="Open Daily Login Reward & Veteran Scroll Chamber"
            >
              <span className="text-sm">📜</span>
              <span className="text-xs font-mono font-bold tabular-nums">
                {veteranScrollsOwned} Scroll{veteranScrollsOwned === 1 ? '' : 's'}
              </span>
              {canClaimDailyLogin && (
                <span className="px-1 rounded bg-amber-400 text-slate-950 text-[9px] font-mono font-black">
                  CLAIM
                </span>
              )}
            </button>
          )}
        </div>

        {/* Dynamic Weather System & Day/Night Clock */}
        <div className="pointer-events-auto flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/85 border border-slate-800 shadow-xl">
          {/* Weather Status Effect Indicator */}
          <button
            onClick={() => {
              sound.playWeatherChange();
              if (onOpenWeather) onOpenWeather();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-xs font-mono text-cyan-200 hover:bg-slate-800 transition-all shadow-md shadow-cyan-950/50"
            title="Open Weather Observatory: view dynamic weather status effects on combat and gathering"
          >
            <span className="text-sm">{weatherConfig.icon}</span>
            <span className="font-bold text-white hidden sm:inline">{weatherConfig.name}</span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold">
              {Math.ceil(weatherRemainingSec)}s
            </span>
          </button>

          {/* Day / Night Indicator */}
          <button
            onClick={onCycleTimeSpeed}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs font-mono text-slate-300"
            title="Click to accelerate day/night cycle"
          >
            {isNight ? (
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{timeString}</span>
            <span className="text-[10px] text-amber-400 font-bold">{timeSpeedMultiplier}x</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300"
            aria-label={isMuted ? 'Unmute game audio' : 'Mute game audio'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Graphics Quality Preset Selector (Next-Gen Ultra GTA V + Genshin / High / Balanced) */}
          {onCycleGraphicsQuality && (
            <button
              onClick={() => {
                sound.playSwing();
                onCycleGraphicsQuality();
              }}
              data-testid="hud-graphics-quality-btn"
              className="px-2.5 py-1 rounded-xl bg-slate-900 border border-purple-500/40 hover:border-purple-400 text-[11px] font-mono font-bold text-purple-200 hover:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer"
              title="Cycle 3D Graphics Quality (Next-Gen Ultra: 4K BC7 Master Textures + LOD 0 Hero Meshes + Hybrid Real-Time GI + Full Uber Shader)"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>
                {graphicsQuality === 'ultra'
                  ? 'NEXT-GEN ULTRA (BC7 4K · LOD 0 · 245K POLY)'
                  : graphicsQuality === 'high'
                    ? 'HIGH (BC7 2K · LOD 0/1 · 142K POLY)'
                    : 'BALANCED (60 FPS · 78K POLY)'}
              </span>
            </button>
          )}

          {/* Cross-Platform Pipeline Override Toggle (PC/PS5 BC7 vs Mobile ASTC) */}
          {onToggleTargetPlatform && (
            <button
              type="button"
              onClick={() => {
                sound.playSwing();
                onToggleTargetPlatform();
              }}
              data-testid="hud-platform-override-btn"
              className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono font-bold transition-all cursor-pointer ${
                targetPlatform === 'pc_console'
                  ? 'bg-slate-900 border-cyan-500/40 hover:border-cyan-400 text-cyan-200'
                  : 'bg-amber-950/70 border-amber-400/50 hover:border-amber-300 text-amber-200'
              }`}
              title="Toggle Cross-Platform Engine Override: PC/PS5/Xbox (BC7 · LOD 0 · Hybrid GI · Full Uber Shader) vs Mobile Android/iOS (ASTC · Skips LOD 0 · Baked Lightmaps · 640MB Base)"
            >
              {targetPlatform === 'pc_console'
                ? 'PC/PS5 [BC7 · LOD 0]'
                : 'MOBILE [ASTC · LOD BIAS +1]'}
            </button>
          )}

          {/* GM / Admin Console Badge from admin_console.cpp */}
          <button
            onClick={() => {
              sound.playSwing();
              onOpenAdminConsole();
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black border transition-all active:scale-95 ${
              godmode
                ? 'bg-red-600 text-white border-red-400 shadow-md shadow-red-600/40'
                : 'bg-gradient-to-r from-red-950 to-amber-950 text-amber-300 border-red-500/50 hover:border-amber-400'
            }`}
            title="Open GM Admin Console (Hotkey: ~ / Backtick)"
          >
            GM{godmode ? ' [GOD]' : ''}
          </button>
        </div>
      </div>

      {/* Zone Indicator (Safe Zone / Wilderness) from ironhold.html & ShadowRealm */}
      <div className="mx-auto pointer-events-auto">
        <div className="px-3.5 py-1 rounded-full bg-slate-950/80 border border-emerald-500/40 text-[11px] font-cinzel text-emerald-300 shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Solara Citadel [Safe Zone]</span>
          <span className="text-slate-500">·</span>
          <span className="text-amber-400 font-mono text-[10px]">PvE Enabled</span>
        </div>
      </div>

      {/* Middle Interactive Touch Overlay (Visible on mobile/tablets) */}
      <div className="flex-1 flex items-end justify-between pointer-events-none pb-4">
        {/* On-screen Virtual Joystick (Bottom Left) */}
        <div
          ref={joystickBaseRef}
          onMouseDown={handleJoystickTouchStart}
          onTouchStart={handleJoystickTouchStart}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickTouchEnd}
          className="pointer-events-auto relative w-24 h-24 rounded-full bg-slate-950/75 border-2 border-slate-700/80 flex items-center justify-center touch-none select-none sm:opacity-90 hover:opacity-100"
          title="Virtual D-Pad (Touch / Drag to move hero)"
        >
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 font-mono font-bold">
            MOVE
          </div>
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30 transition-transform duration-75"
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
            }}
          />
        </div>

        {/* Quick Action Touch Buttons (Bottom Right) */}
        <div className="pointer-events-auto flex flex-col gap-2.5">
          <button
            onClick={() => onActionClick?.('attack')}
            className="w-12 h-12 rounded-full bg-rose-600/90 border-2 border-rose-400/80 shadow-lg shadow-rose-600/30 flex items-center justify-center text-white active:scale-90 transition-transform"
            aria-label="Attack Target"
          >
            <Swords className="w-6 h-6" />
          </button>
          <button
            onClick={() => onActionClick?.('gather')}
            className="w-11 h-11 rounded-full bg-emerald-600/90 border-2 border-emerald-400/80 shadow-lg shadow-emerald-600/30 flex items-center justify-center text-white active:scale-90 transition-transform self-end"
            aria-label="Gather Node"
          >
            <Pickaxe className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Unified Bottom Control Dock */}
      <div className="pointer-events-auto mx-auto flex flex-col items-center">
        {/* Collapse / Expand Toggle */}
        <button
          onClick={() => {
            sound.playSwing();
            setIsDockCollapsed(!isDockCollapsed);
          }}
          className="px-3 py-1 rounded-t-xl bg-slate-950/90 border-t border-x border-slate-700 text-[11px] font-mono font-bold text-slate-300 flex items-center gap-1 hover:text-white transition-colors"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> Show Command Dock
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" /> Zen Mode
            </>
          )}
        </button>

        {/* Main Dock Container */}
        <div
          className={`px-3 py-2 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-2xl flex items-center gap-1.5 sm:gap-2 transition-all duration-300 overflow-x-auto max-w-[96vw] ${
            isDockCollapsed
              ? 'translate-y-24 opacity-0 pointer-events-none'
              : 'translate-y-0 opacity-100'
          }`}
        >
          {onOpenVipSubscription && (
            <button
              type="button"
              onClick={() => {
                sound.playSwing();
                onOpenVipSubscription();
              }}
              data-testid="dock-vip-pass-btn"
              className={`relative p-2 sm:px-3 sm:py-2 rounded-xl border flex flex-col sm:flex-row items-center gap-1.5 transition-all active:scale-95 shrink-0 cursor-pointer ${
                canClaimVipStipend
                  ? 'bg-amber-500/30 hover:bg-amber-500/40 border-amber-300 text-amber-100 shadow-md shadow-amber-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 border-amber-500/50 text-amber-300'
              }`}
            >
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold font-cinzel">VIP Pass</span>
              <span className="text-[10px] font-mono text-amber-300 hidden sm:inline tabular-nums">
                {canClaimVipStipend ? 'STIPEND!' : `Lv.${vipLoyaltyLevel}`}
              </span>
            </button>
          )}

          {onOpenDailyLogin && (
            <button
              onClick={() => {
                sound.playSwing();
                onOpenDailyLogin();
              }}
              data-testid="dock-daily-login-btn"
              className={`relative p-2 sm:px-3 sm:py-2 rounded-xl border flex flex-col sm:flex-row items-center gap-1.5 transition-all active:scale-95 shrink-0 cursor-pointer ${
                canClaimDailyLogin
                  ? 'bg-amber-500/30 hover:bg-amber-500/40 border-amber-300 text-amber-100 shadow-md shadow-amber-500/30'
                  : 'bg-amber-950/50 hover:bg-amber-900/50 border-amber-500/40 text-amber-200'
              }`}
            >
              <Gift className="w-5 h-5 text-amber-300" />
              <span className="text-xs font-bold font-cinzel">Daily Login</span>
              <span className="text-[10px] font-mono text-amber-300 hidden sm:inline tabular-nums">
                {canClaimDailyLogin ? 'READY!' : `${dailyStreakDays}d Streak`}
              </span>
            </button>
          )}

          <button
            onClick={() => {
              sound.playSwing();
              onOpenCultivation();
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400 text-amber-200 flex flex-col sm:flex-row items-center gap-1.5 transition-all active:scale-95 shrink-0 shadow-sm shadow-amber-500/20"
          >
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="text-xs font-bold font-cinzel">Cultivate</span>
            <span className="text-[10px] font-mono text-amber-300 hidden sm:inline">
              4 Paths · 23R
            </span>
          </button>

          <button
            onClick={() => {
              sound.playSwing();
              onOpenWorldAI?.();
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400 text-cyan-200 flex flex-col sm:flex-row items-center gap-1.5 transition-all active:scale-95 shrink-0 shadow-sm shadow-cyan-500/20"
          >
            <Brain className="w-5 h-5 text-cyan-300" />
            <span className="text-xs font-bold font-cinzel">World AI</span>
            <span className="text-[10px] font-mono text-cyan-300 hidden sm:inline">
              NPC & Lv1000
            </span>
          </button>

          <button
            onClick={() => {
              sound.playSwing();
              onOpenCastle();
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 flex flex-col sm:flex-row items-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            <Castle className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold font-cinzel">Castle</span>
            <span className="text-[10px] font-mono text-amber-200 hidden sm:inline">1000T Cap</span>
          </button>

          <button
            onClick={() => {
              sound.playSwing();
              onOpenTroops();
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 flex flex-col sm:flex-row items-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            <Swords className="w-5 h-5 text-red-400" />
            <span className="text-xs font-bold font-cinzel">Barracks</span>
            <span className="text-[10px] font-mono text-red-200 hidden sm:inline">T1-T20</span>
          </button>

          <button
            onClick={() => {
              sound.playSwing();
              onOpenWorldBoss();
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 flex flex-col sm:flex-row items-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            <Flame className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-bold font-cinzel">Rally</span>
            <span className="text-[10px] font-mono text-purple-200 hidden sm:inline">1T Cap</span>
          </button>

          <button
            onClick={() => {
              sound.playSwing();
              onOpenClan();
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-300 flex flex-col sm:flex-row items-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-bold font-cinzel">Clan</span>
            <span className="text-[10px] font-mono text-blue-200 hidden sm:inline">Donations</span>
          </button>

          <button
            onClick={() => {
              sound.playSwing();
              onOpenHeroes();
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 flex flex-col sm:flex-row items-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            <Award className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold font-cinzel">Heroes</span>
            <span className="text-[10px] font-mono text-indigo-200 hidden sm:inline">Divine</span>
          </button>

          <button
            onClick={() => {
              sound.playSwing();
              onOpenResources();
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 flex flex-col sm:flex-row items-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            <Pickaxe className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold font-cinzel">Harvest</span>
            <span className="text-[10px] font-mono text-emerald-200 hidden sm:inline">Lv 1-10</span>
          </button>

          <button
            onClick={() => {
              sound.playWeatherChange();
              if (onOpenWeather) onOpenWeather();
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 flex flex-col sm:flex-row items-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            <CloudRain className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-bold font-cinzel">Weather</span>
            <span className="text-[10px] font-mono text-cyan-200 hidden sm:inline">
              {weatherConfig.name.split(' ')[0]}
            </span>
          </button>

          <button
            onClick={() => {
              sound.playSwing();
              onOpenLeaderboard();
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex flex-col sm:flex-row items-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold font-cinzel">Rankings</span>
          </button>

          <button
            onClick={() => {
              sound.playSwing();
              onOpenCppCore();
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 flex flex-col sm:flex-row items-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold font-mono">C++ 20+</span>
          </button>
        </div>
      </div>
    </div>
  );
};
