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
  Package,
  Settings,
  LayoutGrid,
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
  const [isInventoryDrawerOpen, setIsInventoryDrawerOpen] = useState(false);
  const [isEngineSettingsOpen, setIsEngineSettingsOpen] = useState(false);
  const [isMoreHubOpen, setIsMoreHubOpen] = useState(false);

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

  const hasMoreAlert = canClaimVipStipend || canClaimDailyLogin;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none select-none flex flex-col justify-between p-2.5 sm:p-4">
      {/* Consolidated Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-2">
        {/* Top Row: Lord Identity Card + Primary Currencies & Expandable Inventory Drawer */}
        <div className="flex flex-wrap items-center justify-between gap-2 w-full lg:w-auto">
          {/* Lord Identity Card */}
          <div className="pointer-events-auto px-2.5 py-2 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-xl flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                sound.playSwing();
                onOpenCharacterCreation();
              }}
              className="relative group p-0.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              title="Open Character Creation Centre"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-base sm:text-lg">
                {playerAppearance.name.charAt(0)}
              </div>
              <span className="absolute -bottom-1 -right-1 text-[9px] px-1 rounded bg-cyan-500 text-slate-950 font-bold font-mono">
                T{playerAppearance.armorTier}
              </span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-mono font-bold text-amber-400">
                  [{playerAppearance.clanTag}]
                </span>
                <span className="text-xs sm:text-sm font-bold text-white font-cinzel truncate max-w-[130px] sm:max-w-none">
                  {playerAppearance.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playSwing();
                    onOpenCultivation();
                  }}
                  className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/40 font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                  title="Open Cultivation Cave Abode & Dantian"
                >
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>
                    {cultivationRealmName} L{cultivationLayer}
                  </span>
                </button>
                {onOpenVipSubscription && (
                  <button
                    type="button"
                    data-testid="hud-vip-badge-btn"
                    onClick={() => {
                      sound.playSwing();
                      onOpenVipSubscription();
                    }}
                    className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/60 font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                    title="Open Imperial VIP Member Subscription & Daily Stipend Chest"
                  >
                    <Crown className="w-2.5 h-2.5 text-amber-400" />
                    <span>{vipBadgeLabel}</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400 font-mono">
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

          {/* Primary Currencies Bar (3 Primary Currencies + Expandable Inventory Drawer) */}
          <div
            className="pointer-events-auto relative flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-xl"
            data-testid="hud-primary-resources"
          >
            <button
              type="button"
              onClick={onOpenResources}
              className="flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer"
              title="Copper Coins (Primary Currency)"
            >
              <span className="text-xs sm:text-sm">🪙</span>
              <span className="text-xs font-mono font-bold text-amber-200 tabular-nums">
                {formatBigInt(resources.copper)}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenResources}
              className="flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer"
              title="Grain Provisions (Primary Currency)"
            >
              <span className="text-xs sm:text-sm">🌾</span>
              <span className="text-xs font-mono font-bold text-emerald-200 tabular-nums">
                {formatBigInt(resources.grain)}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenResources}
              className="flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer"
              title="Diamond Gems (Primary Currency)"
            >
              <span className="text-xs sm:text-sm">💎</span>
              <span
                className="text-xs font-mono font-bold text-cyan-300 tabular-nums"
                data-testid="hud-diamond-count"
              >
                {formatBigInt(resources.diamond)}
              </span>
            </button>

            {/* Expandable Secondary Resources & Scrolls Inventory Drawer Trigger */}
            <button
              type="button"
              data-testid="hud-inventory-drawer-toggle"
              aria-expanded={isInventoryDrawerOpen}
              onClick={() => {
                sound.playSwing();
                setIsInventoryDrawerOpen((prev) => !prev);
                setIsEngineSettingsOpen(false);
              }}
              className={`relative flex items-center gap-1 px-2 py-1 rounded-xl border text-xs font-mono font-bold transition-colors cursor-pointer ${
                isInventoryDrawerOpen
                  ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
              title="Toggle Secondary Resources & Scrolls Inventory Drawer"
            >
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>Bag</span>
              {canClaimDailyLogin && (
                <span className="px-1 rounded bg-amber-400 text-slate-950 text-[9px] font-mono font-black">
                  !
                </span>
              )}
              {isInventoryDrawerOpen ? (
                <ChevronUp className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              )}
            </button>

            {/* Expandable Inventory Drawer Popover (Wood, Steel, Oil, Scrolls) */}
            {isInventoryDrawerOpen && (
              <div
                data-testid="hud-inventory-drawer"
                className="absolute right-0 top-full mt-2 w-64 p-3 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-slate-700 shadow-2xl z-50 space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400 border-b border-slate-800 pb-1.5">
                  <span>SECONDARY MATERIALS & SCROLLS</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsInventoryDrawerOpen(false);
                      onOpenResources();
                    }}
                    className="text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    Harvest →
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsInventoryDrawerOpen(false);
                      onOpenResources();
                    }}
                    className="flex flex-col items-center p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
                    title="Wood supplies"
                  >
                    <span className="text-sm">🌲</span>
                    <span className="text-[10px] text-slate-400">Wood</span>
                    <span className="text-xs font-mono font-bold text-slate-100 tabular-nums">
                      {formatBigInt(resources.wood)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsInventoryDrawerOpen(false);
                      onOpenResources();
                    }}
                    className="flex flex-col items-center p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
                    title="Steel supplies"
                  >
                    <span className="text-sm">⚔️</span>
                    <span className="text-[10px] text-slate-400">Steel</span>
                    <span className="text-xs font-mono font-bold text-slate-100 tabular-nums">
                      {formatBigInt(resources.steel)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsInventoryDrawerOpen(false);
                      onOpenResources();
                    }}
                    className="flex flex-col items-center p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
                    title="Oil supplies"
                  >
                    <span className="text-sm">🛢️</span>
                    <span className="text-[10px] text-slate-400">Oil</span>
                    <span className="text-xs font-mono font-bold text-slate-100 tabular-nums">
                      {formatBigInt(resources.oil)}
                    </span>
                  </button>
                </div>

                {onOpenDailyLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playSwing();
                      setIsInventoryDrawerOpen(false);
                      onOpenDailyLogin();
                    }}
                    data-testid="hud-daily-login-btn"
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                      canClaimDailyLogin
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                        : 'bg-slate-900 border-amber-500/40 text-amber-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-mono font-bold tabular-nums">
                      <span>📜</span>
                      <span>
                        {veteranScrollsOwned} Scroll{veteranScrollsOwned === 1 ? '' : 's'}
                      </span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-mono font-black">
                      {canClaimDailyLogin ? 'CLAIM' : 'OPEN'}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Merged World Status Widget (Zone + Weather + Clock + Audio + Collapsible Engine Settings) */}
        <div
          className="pointer-events-auto relative flex items-center justify-between sm:justify-end gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-xl w-full sm:w-auto max-w-full self-start lg:self-auto"
          data-testid="hud-merged-status-bar"
        >
          {/* Compact Zone Label */}
          <div className="flex items-center gap-1 pr-1.5 border-r border-slate-800 text-[10px] sm:text-[11px] font-cinzel text-emerald-300 whitespace-nowrap min-w-0">
            <span className="hidden sm:inline">Solara</span>
            <span>Citadel</span>
            <span className="text-slate-500">·</span>
            <span className="text-amber-400 font-mono text-[9px] sm:text-[10px]">Safe</span>
          </div>

          {/* Weather Indicator */}
          <button
            type="button"
            onClick={() => {
              sound.playWeatherChange();
              if (onOpenWeather) onOpenWeather();
            }}
            className="flex items-center gap-1 px-1.5 py-1 sm:px-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 text-xs font-mono text-cyan-200 transition-colors cursor-pointer whitespace-nowrap min-w-0"
            title="Open Weather Observatory"
          >
            <span className="text-xs">{weatherConfig.icon}</span>
            <span className="font-bold text-white text-[10px] sm:text-[11px] truncate max-w-[78px] sm:max-w-none">
              {weatherConfig.name}
            </span>
            <span className="text-[9px] sm:text-[10px] text-cyan-400 font-bold tabular-nums">
              {Math.ceil(weatherRemainingSec)}s
            </span>
          </button>

          {/* In-Game Clock */}
          <button
            type="button"
            onClick={onCycleTimeSpeed}
            className="flex items-center gap-1 px-1.5 py-1 sm:px-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-[10px] sm:text-[11px] font-mono text-slate-200 transition-colors cursor-pointer whitespace-nowrap tabular-nums"
            title="Click to accelerate day/night cycle"
          >
            {isNight ? (
              <Moon className="w-3 h-3 text-indigo-400" />
            ) : (
              <Sun className="w-3 h-3 text-amber-400" />
            )}
            <span>{timeString}</span>
            <span className="text-[9px] sm:text-[10px] text-amber-400 font-bold">
              {timeSpeedMultiplier}x
            </span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleMute}
            className="p-1 sm:p-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:bg-slate-800 text-slate-300 cursor-pointer shrink-0"
            aria-label={isMuted ? 'Unmute game audio' : 'Mute game audio'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          {/* Collapsible Technical Metrics & Engine Settings Toggle */}
          <button
            type="button"
            data-testid="hud-engine-settings-toggle"
            aria-expanded={isEngineSettingsOpen}
            aria-label="Engine & Graphics Settings"
            onClick={() => {
              sound.playSwing();
              setIsEngineSettingsOpen((prev) => !prev);
              setIsInventoryDrawerOpen(false);
            }}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isEngineSettingsOpen || godmode
                ? 'bg-purple-500/25 border-purple-400 text-purple-200'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle Technical Engine Stats, Graphics Quality, Platform Overrides & GM Console"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Collapsible Engine & Debug Settings Menu Popover */}
          {isEngineSettingsOpen && (
            <div
              data-testid="hud-engine-settings-drawer"
              className="absolute right-0 top-full mt-2 w-72 p-3 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-slate-700 shadow-2xl z-50 space-y-2.5"
            >
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400 border-b border-slate-800 pb-1.5">
                <span>ENGINE & GRAPHICS PIPELINE</span>
                <span className="text-emerald-400">60 FPS</span>
              </div>

              {onCycleGraphicsQuality && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playSwing();
                    onCycleGraphicsQuality();
                  }}
                  data-testid="hud-graphics-quality-btn"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-purple-500/40 hover:border-purple-400 text-[11px] font-mono font-bold text-purple-200 hover:bg-slate-800 transition-all flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">
                      {graphicsQuality === 'ultra'
                        ? 'NEXT-GEN ULTRA (BC7 4K · LOD 0 · 245K POLY)'
                        : graphicsQuality === 'high'
                          ? 'HIGH (BC7 2K · LOD 0/1 · 142K POLY)'
                          : 'BALANCED (60 FPS · 78K POLY)'}
                    </span>
                  </span>
                </button>
              )}

              {onToggleTargetPlatform && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playSwing();
                    onToggleTargetPlatform();
                  }}
                  data-testid="hud-platform-override-btn"
                  className={`w-full px-3 py-2 rounded-xl border text-[11px] font-mono font-bold transition-all flex items-center justify-between cursor-pointer ${
                    targetPlatform === 'pc_console'
                      ? 'bg-slate-900 border-cyan-500/40 hover:border-cyan-400 text-cyan-200'
                      : 'bg-amber-950/70 border-amber-400/50 hover:border-amber-300 text-amber-200'
                  }`}
                >
                  <span>Platform Override:</span>
                  <span>
                    {targetPlatform === 'pc_console'
                      ? 'PC/PS5 [BC7 · LOD 0]'
                      : 'MOBILE [ASTC · LOD BIAS +1]'}
                  </span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sound.playSwing();
                    setIsEngineSettingsOpen(false);
                    onOpenCppCore();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>C++ 20+</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playSwing();
                    setIsEngineSettingsOpen(false);
                    onOpenAdminConsole();
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-black border transition-all cursor-pointer ${
                    godmode
                      ? 'bg-red-600 text-white border-red-400'
                      : 'bg-slate-900 text-amber-300 border-red-500/50 hover:border-amber-400'
                  }`}
                >
                  GM{godmode ? ' [GOD]' : ' Console'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle Interactive Touch Overlay (Raised above bottom dock with enlarged action buttons) */}
      <div className="flex-1 flex items-end justify-between pointer-events-none pb-5 sm:pb-6 mb-1">
        {/* On-screen Virtual Joystick (Bottom Left) */}
        <div
          ref={joystickBaseRef}
          onMouseDown={handleJoystickTouchStart}
          onTouchStart={handleJoystickTouchStart}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickTouchEnd}
          className="pointer-events-auto relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-950/80 border-2 border-slate-700/80 flex items-center justify-center touch-none select-none sm:opacity-90 hover:opacity-100 shadow-xl"
          title="Virtual D-Pad (Touch / Drag to move hero)"
        >
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 font-mono font-bold">
            MOVE
          </div>
          <div
            className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30 transition-transform duration-75"
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
            }}
          />
        </div>

        {/* Enlarged Quick Action Touch Buttons (Bottom Right, raised with wider spacing) */}
        <div className="pointer-events-auto flex flex-col items-center gap-4 mr-1 sm:mr-2 mb-2">
          <button
            type="button"
            data-testid="hud-action-attack-btn"
            onClick={() => onActionClick?.('attack')}
            className="w-16 h-16 rounded-full bg-rose-600/95 hover:bg-rose-500 border-2 border-rose-300/90 shadow-xl shadow-rose-950/80 flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer"
            aria-label="Attack Target"
          >
            <Swords className="w-7 h-7" />
          </button>
          <button
            type="button"
            data-testid="hud-action-gather-btn"
            onClick={() => onActionClick?.('gather')}
            className="w-14 h-14 rounded-full bg-emerald-600/95 hover:bg-emerald-500 border-2 border-emerald-300/90 shadow-xl shadow-emerald-950/80 flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer"
            aria-label="Gather Node"
          >
            <Pickaxe className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Unified Bottom Control Dock (5 Square Icon Tabs + Expandable Command Hub Drawer) */}
      <div className="pointer-events-auto mx-auto w-full max-w-md sm:max-w-lg flex flex-col items-center relative">
        {/* Pop-up More / Kingdom Command Hub Drawer */}
        {isMoreHubOpen && !isDockCollapsed && (
          <div
            data-testid="dock-more-hub-drawer"
            className="w-full mb-2 p-3 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-slate-700 shadow-2xl grid grid-cols-4 sm:grid-cols-5 gap-2"
          >
            {onOpenVipSubscription && (
              <button
                type="button"
                onClick={() => {
                  sound.playSwing();
                  setIsMoreHubOpen(false);
                  onOpenVipSubscription();
                }}
                data-testid="dock-vip-pass-btn"
                className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
                  canClaimVipStipend
                    ? 'bg-amber-500/25 border-amber-300 text-amber-100'
                    : 'bg-slate-900 hover:bg-slate-800 border-amber-500/40 text-amber-300'
                }`}
              >
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="text-[10px] font-bold font-cinzel whitespace-nowrap">
                  VIP Pass
                </span>
                <span className="text-[9px] font-mono text-amber-300 tabular-nums">
                  {canClaimVipStipend ? 'STIPEND!' : `Lv.${vipLoyaltyLevel}`}
                </span>
              </button>
            )}

            {onOpenDailyLogin && (
              <button
                type="button"
                onClick={() => {
                  sound.playSwing();
                  setIsMoreHubOpen(false);
                  onOpenDailyLogin();
                }}
                data-testid="dock-daily-login-btn"
                className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
                  canClaimDailyLogin
                    ? 'bg-amber-500/25 border-amber-300 text-amber-100'
                    : 'bg-slate-900 hover:bg-slate-800 border-amber-500/40 text-amber-200'
                }`}
              >
                <Gift className="w-5 h-5 text-amber-300" />
                <span className="text-[10px] font-bold font-cinzel whitespace-nowrap">
                  Daily Login
                </span>
                <span className="text-[9px] font-mono text-amber-300 tabular-nums">
                  {canClaimDailyLogin ? 'READY!' : `${dailyStreakDays}d`}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                sound.playSwing();
                setIsMoreHubOpen(false);
                onOpenWorldAI?.();
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-200 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <Brain className="w-5 h-5 text-cyan-400" />
              <span className="text-[10px] font-bold font-cinzel whitespace-nowrap">World AI</span>
              <span className="text-[9px] font-mono text-cyan-300">Lv1000</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playSwing();
                setIsMoreHubOpen(false);
                onOpenWorldBoss();
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/40 text-purple-300 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <Flame className="w-5 h-5 text-purple-400" />
              <span className="text-[10px] font-bold font-cinzel whitespace-nowrap">Rally</span>
              <span className="text-[9px] font-mono text-purple-200">1T Cap</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playSwing();
                setIsMoreHubOpen(false);
                onOpenClan();
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-blue-500/40 text-blue-300 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="text-[10px] font-bold font-cinzel whitespace-nowrap">Clan</span>
              <span className="text-[9px] font-mono text-blue-200">Territory</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playSwing();
                setIsMoreHubOpen(false);
                onOpenResources();
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <Pickaxe className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] font-bold font-cinzel whitespace-nowrap">Harvest</span>
              <span className="text-[9px] font-mono text-emerald-200">Lv 1-10</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playWeatherChange();
                setIsMoreHubOpen(false);
                onOpenWeather?.();
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <CloudRain className="w-5 h-5 text-cyan-400" />
              <span className="text-[10px] font-bold font-cinzel whitespace-nowrap">Weather</span>
              <span className="text-[9px] font-mono text-cyan-200">
                {weatherConfig.name.split(' ')[0]}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playSwing();
                setIsMoreHubOpen(false);
                onOpenLeaderboard();
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-[10px] font-bold font-cinzel whitespace-nowrap">Rankings</span>
              <span className="text-[9px] font-mono text-slate-400">Top 10</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playSwing();
                setIsMoreHubOpen(false);
                onOpenCppCore();
              }}
              className="p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <Cpu className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] font-bold font-mono whitespace-nowrap">C++ 20+</span>
              <span className="text-[9px] font-mono text-emerald-400">Engine</span>
            </button>
          </div>
        )}

        {/* Collapse / Expand Toggle */}
        <button
          type="button"
          onClick={() => {
            sound.playSwing();
            setIsDockCollapsed(!isDockCollapsed);
            setIsMoreHubOpen(false);
          }}
          className="px-3 py-1 rounded-t-xl bg-slate-950/90 border-t border-x border-slate-700 text-[10px] font-mono font-bold text-slate-300 flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3 h-3" /> Show Command Dock
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" /> Zen Mode
            </>
          )}
        </button>

        {/* 5 Square Icon Tabs (No Horizontal Overflow on Mobile Portrait) */}
        <div
          data-testid="hud-bottom-tab-bar"
          className={`w-full px-2 py-1.5 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-slate-800 shadow-2xl grid grid-cols-5 gap-1.5 sm:gap-2 transition-all duration-200 ${
            isDockCollapsed
              ? 'translate-y-24 opacity-0 pointer-events-none'
              : 'translate-y-0 opacity-100'
          }`}
        >
          <button
            type="button"
            data-testid="dock-castle-btn"
            onClick={() => {
              sound.playSwing();
              setIsMoreHubOpen(false);
              onOpenCastle();
            }}
            className="min-h-[54px] py-1.5 px-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <Castle className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] sm:text-[11px] font-bold font-cinzel leading-none whitespace-nowrap">
              Castle
            </span>
          </button>

          <button
            type="button"
            data-testid="dock-barracks-btn"
            onClick={() => {
              sound.playSwing();
              setIsMoreHubOpen(false);
              onOpenTroops();
            }}
            className="min-h-[54px] py-1.5 px-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-200 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <Swords className="w-5 h-5 text-rose-400" />
            <span className="text-[10px] sm:text-[11px] font-bold font-cinzel leading-none whitespace-nowrap">
              Barracks
            </span>
          </button>

          <button
            type="button"
            data-testid="dock-cultivate-btn"
            onClick={() => {
              sound.playSwing();
              setIsMoreHubOpen(false);
              onOpenCultivation();
            }}
            className="min-h-[54px] py-1.5 px-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-100 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="text-[10px] sm:text-[11px] font-bold font-cinzel leading-none whitespace-nowrap">
              Cultivate
            </span>
          </button>

          <button
            type="button"
            data-testid="dock-heroes-btn"
            onClick={() => {
              sound.playSwing();
              setIsMoreHubOpen(false);
              onOpenHeroes();
            }}
            className="min-h-[54px] py-1.5 px-1 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-200 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <Award className="w-5 h-5 text-indigo-400" />
            <span className="text-[10px] sm:text-[11px] font-bold font-cinzel leading-none whitespace-nowrap">
              Heroes
            </span>
          </button>

          <button
            type="button"
            data-testid="dock-more-hub-btn"
            aria-expanded={isMoreHubOpen}
            onClick={() => {
              sound.playSwing();
              setIsMoreHubOpen((prev) => !prev);
            }}
            className={`relative min-h-[54px] py-1.5 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
              isMoreHubOpen
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-100'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <LayoutGrid className="w-5 h-5 text-cyan-400" />
            <span className="text-[10px] sm:text-[11px] font-bold font-cinzel leading-none whitespace-nowrap">
              More
            </span>
            {hasMoreAlert && (
              <span className="absolute top-1 right-1.5 px-1 rounded bg-amber-400 text-slate-950 text-[8px] font-mono font-black">
                !
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
