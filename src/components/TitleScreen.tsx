/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Play,
  Shield,
  Sparkles,
  Gift,
  Crown,
  Gavel,
  BookOpen,
  GitBranch,
  LogOut,
  RefreshCw,
  Mail,
  Scale,
  ShoppingBag,
  ClipboardList,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { sound } from '../game/audio';
import { PRIMARY_ADMIN_EMAIL } from '../game/adminModeration';
import { GAME_LAUNCH_DATE_DISPLAY } from '../game/launchSchedule';
import { GoogleSignInButton } from './GoogleSignInButton';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenCharacterCreation: () => void;
  onOpenDailyLogin?: () => void;
  canClaimDailyLogin?: boolean;
  onOpenDailyMissions?: () => void;
  claimableDailyMissionsCount?: number;
  onOpenVipSubscription?: () => void;
  vipBadgeLabel?: string;
  canClaimVipStipend?: boolean;
  onOpenAdminConsole?: () => void;
  onOpenLoreHistory?: () => void;
  onOpenCosmologicalAdmin?: () => void;
  onOpenGmail?: () => void;
  onOpenEula?: () => void;
  onOpenMarketplace?: () => void;
  authUserEmail?: string | null;
  authLoading?: boolean;
  isSyncingAccount?: boolean;
  authError?: string | null;
  onSignInGoogle?: () => void;
  onSignOutGoogle?: () => void;
  onSyncAccount?: () => void;
  onDismissAuthError?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenCharacterCreation,
  onOpenDailyLogin,
  canClaimDailyLogin = false,
  onOpenDailyMissions,
  claimableDailyMissionsCount = 0,
  onOpenVipSubscription,
  vipBadgeLabel = 'VIP 0',
  canClaimVipStipend = false,
  onOpenAdminConsole,
  onOpenLoreHistory,
  onOpenCosmologicalAdmin,
  onOpenGmail,
  onOpenEula,
  onOpenMarketplace,
  authUserEmail = null,
  authLoading = false,
  isSyncingAccount = false,
  authError = null,
  onSignInGoogle,
  onSignOutGoogle,
  onSyncAccount,
  onDismissAuthError,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMoreOpen, setIsDesktopMoreOpen] = useState(false);

  const totalAlertCount =
    (canClaimDailyLogin ? 1 : 0) +
    (canClaimVipStipend ? 1 : 0) +
    (claimableDailyMissionsCount > 0 ? claimableDailyMissionsCount : 0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMobileMenuOpen || isDesktopMoreOpen) {
          setIsMobileMenuOpen(false);
          setIsDesktopMoreOpen(false);
        }
        return;
      }
      if (isMobileMenuOpen || isDesktopMoreOpen) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          (target.tagName === 'BUTTON' && target.getAttribute('data-start') !== 'true'))
      ) {
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        sound.playUpgradeFanfare();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStartGame, isMobileMenuOpen, isDesktopMoreOpen]);

  const handleMenuAction = (action?: () => void) => {
    sound.playSwing();
    setIsMobileMenuOpen(false);
    setIsDesktopMoreOpen(false);
    action?.();
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between px-3 py-3 sm:px-5 sm:py-5 lg:px-5 xl:px-8 lg:py-6 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-slate-950/70 via-slate-950/20 to-slate-950/75 pointer-events-auto select-none">
      {/* Compact Single-Row Top Bar */}
      <div className="shrink-0 w-full max-w-7xl mx-auto flex items-center justify-between gap-2 relative z-20">
        {/* Left: Version Emblem */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/90 border border-amber-500/35 text-amber-300 text-[11px] font-mono font-bold shrink-0"
          title={`v1.5.0 · Launch Date: ${GAME_LAUNCH_DATE_DISPLAY} · 245K PBR + HDR`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>v1.5.0</span>
          <span className="hidden 2xl:inline text-amber-200/80">
            · Launch {GAME_LAUNCH_DATE_DISPLAY}
          </span>
        </div>

        {/* Desktop Single-Row Quick Actions + Secondary Systems Popover */}
        <div className="hidden lg:flex flex-wrap items-center justify-end gap-1.5 min-w-0">
          {onOpenVipSubscription && (
            <button
              type="button"
              data-testid="title-vip-pass-btn"
              onClick={() => handleMenuAction(onOpenVipSubscription)}
              className="relative px-2.5 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-800 border border-amber-400/60 text-xs font-bold text-amber-300 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              title={`VIP Member Pass (${vipBadgeLabel})`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>VIP Member Pass</span>
              {canClaimVipStipend && (
                <span className="px-1 py-0.5 rounded bg-amber-400 text-slate-950 font-mono font-black text-[9px] leading-none">
                  STIPEND
                </span>
              )}
            </button>
          )}

          {onOpenDailyLogin && (
            <button
              type="button"
              data-testid="title-daily-login-btn"
              onClick={() => handleMenuAction(onOpenDailyLogin)}
              className="relative px-2.5 py-1.5 rounded-xl bg-amber-950/90 hover:bg-amber-900 border border-amber-500/50 text-xs font-bold text-amber-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              title="Daily Login Decree"
            >
              <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Daily Login</span>
              {canClaimDailyLogin && (
                <span className="px-1 py-0.5 rounded bg-amber-400 text-slate-950 font-mono font-black text-[9px] leading-none">
                  NEW
                </span>
              )}
            </button>
          )}

          {onOpenDailyMissions && (
            <button
              type="button"
              data-testid="title-daily-missions-btn"
              onClick={() => handleMenuAction(onOpenDailyMissions)}
              className="relative px-2.5 py-1.5 rounded-xl bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/50 text-xs font-bold text-cyan-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              title="Open Daily Cultivation Missions & Repeatable Material Commissions"
            >
              <ClipboardList className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Daily Missions</span>
              {claimableDailyMissionsCount > 0 && (
                <span className="px-1 py-0.5 rounded bg-amber-400 text-slate-950 font-mono font-black text-[9px] leading-none tabular-nums">
                  {claimableDailyMissionsCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            data-testid="title-character-creation-btn"
            onClick={() => handleMenuAction(onOpenCharacterCreation)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Character Creation Centre</span>
          </button>

          {onOpenEula && (
            <button
              type="button"
              data-testid="title-eula-btn"
              onClick={() => handleMenuAction(onOpenEula)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-800 border border-amber-400/40 text-xs font-bold text-amber-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              title="Open End User License Agreement (EULA v1.5.0 · 17/11/2026)"
            >
              <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>EULA</span>
            </button>
          )}

          {/* Secondary Realm Systems Popover */}
          <div className="relative">
            <button
              type="button"
              data-testid="title-more-menu-btn"
              aria-expanded={isDesktopMoreOpen}
              onClick={() => {
                sound.playSwing();
                setIsDesktopMoreOpen((prev) => !prev);
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap ${
                isDesktopMoreOpen
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                  : 'bg-slate-950/90 hover:bg-slate-800 border-slate-700 text-slate-200'
              }`}
              title="Open Marketplace, Lore Codex, Cosmology D3, GM Console & Gmail"
            >
              <Menu className="w-3.5 h-3.5 text-amber-400" />
              <span>Realm Menu</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  isDesktopMoreOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isDesktopMoreOpen && (
              <div
                data-testid="title-desktop-more-popover"
                className="absolute right-0 top-full mt-2 w-72 p-2.5 rounded-2xl bg-slate-950/95 border border-slate-700 shadow-2xl z-50 space-y-1.5"
              >
                <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Realm Systems &amp; Archives
                </div>

                {onOpenMarketplace && (
                  <button
                    type="button"
                    data-testid="title-marketplace-btn"
                    onClick={() => handleMenuAction(onOpenMarketplace)}
                    className="w-full px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-xs font-bold text-amber-200 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Imperial Marketplace</span>
                  </button>
                )}

                {onOpenLoreHistory && (
                  <button
                    type="button"
                    data-testid="title-lore-history-btn"
                    onClick={() => handleMenuAction(onOpenLoreHistory)}
                    className="w-full px-3 py-2 rounded-xl bg-fuchsia-950/80 hover:bg-fuchsia-900/80 border border-fuchsia-500/40 text-xs font-bold text-fuchsia-200 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                  >
                    <BookOpen className="w-4 h-4 text-fuchsia-400 shrink-0" />
                    <span>Lore &amp; History Codex</span>
                  </button>
                )}

                {onOpenCosmologicalAdmin && (
                  <button
                    type="button"
                    data-testid="title-cosmology-d3-btn"
                    onClick={() => handleMenuAction(onOpenCosmologicalAdmin)}
                    className="w-full px-3 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/40 text-xs font-mono font-bold text-cyan-200 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                  >
                    <GitBranch className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>6-Tier Cosmology D3</span>
                  </button>
                )}

                {onOpenAdminConsole && (
                  <button
                    type="button"
                    data-testid="title-admin-console-btn"
                    onClick={() => handleMenuAction(onOpenAdminConsole)}
                    className="w-full px-3 py-2 rounded-xl bg-red-950/80 hover:bg-red-900/80 border border-red-500/40 text-xs font-mono font-bold text-red-200 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                    title={`Administration, GM, Moderator Control & Contact (${PRIMARY_ADMIN_EMAIL})`}
                  >
                    <Gavel className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="truncate">GM / Admin / Mod</span>
                  </button>
                )}

                {onOpenGmail && (
                  <button
                    type="button"
                    data-testid="title-gmail-btn"
                    onClick={() => handleMenuAction(onOpenGmail)}
                    className="w-full px-3 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900/80 border border-amber-500/40 text-xs font-bold text-amber-200 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                  >
                    <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Gmail Dispatch Center</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Account Status (Desktop) */}
          {!authLoading &&
            (authUserEmail ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-xs font-bold text-emerald-200 shrink-0">
                <span
                  className="max-w-[110px] truncate font-mono text-[11px]"
                  title={authUserEmail}
                >
                  {authUserEmail}
                </span>
                {onSyncAccount && (
                  <button
                    type="button"
                    data-testid="title-sync-account-btn"
                    onClick={onSyncAccount}
                    disabled={isSyncingAccount}
                    className="px-1.5 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-100 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                    title="Sync Commander Progress"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncingAccount ? 'animate-spin' : ''}`} />
                    <span className="text-[11px]">{isSyncingAccount ? '...' : 'Save'}</span>
                  </button>
                )}
                {onSignOutGoogle && (
                  <button
                    type="button"
                    data-testid="title-signout-btn"
                    onClick={onSignOutGoogle}
                    className="p-1 rounded-lg hover:bg-emerald-500/25 text-emerald-200 transition-all cursor-pointer"
                    aria-label="Sign Out"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              onSignInGoogle && <GoogleSignInButton onClick={onSignInGoogle} compact />
            ))}
        </div>

        {/* Mobile & Tablet Compact Top-Right Controls (Single Row, Zero Clutter) */}
        <div className="flex lg:hidden items-center gap-1.5 shrink-0">
          {!authLoading && authUserEmail && onSyncAccount && (
            <button
              type="button"
              onClick={onSyncAccount}
              disabled={isSyncingAccount}
              className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title={`Save Cloud Progress (${authUserEmail})`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAccount ? 'animate-spin' : ''}`} />
              <span>{isSyncingAccount ? 'Saving' : 'Save'}</span>
            </button>
          )}

          <button
            type="button"
            data-testid="title-mobile-menu-btn"
            aria-expanded={isMobileMenuOpen}
            onClick={() => {
              sound.playSwing();
              setIsMobileMenuOpen(true);
            }}
            className="relative min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-950/95 hover:bg-slate-800 border border-amber-500/55 text-amber-200 text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
            aria-label="Open Realm Menu"
          >
            <Menu className="w-4 h-4 text-amber-400" />
            <span>Menu</span>
            {totalAlertCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono font-black text-[10px] leading-none tabular-nums">
                {totalAlertCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {authError && (
        <div className="shrink-0 mx-auto mt-2 max-w-lg w-full px-3.5 py-2 rounded-xl bg-rose-950/95 border border-rose-500/60 text-rose-200 text-xs flex items-center justify-between gap-3">
          <span className="truncate">{authError}</span>
          {onDismissAuthError && (
            <button
              type="button"
              onClick={onDismissAuthError}
              className="text-rose-300 hover:text-white font-bold cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Center Hero Lockup — Scrim-Backed & Always Above the Fold */}
      <div className="w-full max-w-xl mx-auto my-auto py-2 sm:py-4">
        <div className="px-4 py-5 sm:px-8 sm:py-7 rounded-3xl bg-slate-950/80 border border-amber-500/25 shadow-[0_24px_64px_rgba(2,6,23,0.9)] text-center space-y-4 sm:space-y-5">
          {/* Title Lockup */}
          <div className="space-y-1.5">
            <div className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.22em] uppercase text-amber-400">
              Open World Voxel MMORPG
            </div>
            <h1 className="text-4xl sm:text-6xl font-black font-cinzel tracking-tight text-amber-300 drop-shadow-[0_4px_14px_rgba(0,0,0,0.9)] leading-none">
              VOXEL REALMS
            </h1>
            <p className="text-[11px] sm:text-sm font-cinzel text-slate-200 tracking-wider pt-0.5">
              CASTLE SIEGE · 1,000 TRILLION CAPACITY · TITAN RALLIES
            </p>
          </div>

          {/* Primary CTA — Always Prominent & Unobstructed Above the Fold */}
          <div className="flex flex-col items-center gap-2.5 pt-1">
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                sound.playUpgradeFanfare();
                onStartGame();
              }}
              className="w-full sm:w-auto min-h-[52px] px-8 sm:px-12 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black font-cinzel text-base sm:text-lg shadow-xl shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-slate-950" />
              <span>ENTER THE REALM</span>
            </button>

            {/* Quick Mobile Shortcuts for Top 2 Pre-Game Flows */}
            <div className="flex lg:hidden items-center justify-center gap-2 w-full pt-0.5">
              <button
                type="button"
                onClick={() => handleMenuAction(onOpenCharacterCreation)}
                className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-slate-900/95 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">Character</span>
              </button>
              {onOpenDailyMissions && (
                <button
                  type="button"
                  onClick={() => handleMenuAction(onOpenDailyMissions)}
                  className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/45 text-xs font-bold text-cyan-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <ClipboardList className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">Missions</span>
                  {claimableDailyMissionsCount > 0 && (
                    <span className="px-1 py-0.5 rounded bg-amber-400 text-slate-950 font-mono font-black text-[9px] leading-none tabular-nums">
                      {claimableDailyMissionsCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Clean Unboxed World Spec Line */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] font-mono text-slate-300/90 leading-relaxed">
            <div>
              Castle Lv 0–100 · T1–T20 Troops (1,000T Cap) · 10 Playable Species · 6-Layer Cosmology
            </div>
            <div
              className="text-[10px] text-amber-300/80 truncate"
              title={`Target Launch: ${GAME_LAUNCH_DATE_DISPLAY} · The White Page / House of Ideas (${PRIMARY_ADMIN_EMAIL})`}
            >
              Launch Date: {GAME_LAUNCH_DATE_DISPLAY} · {PRIMARY_ADMIN_EMAIL}
            </div>
          </div>
        </div>
      </div>

      {/* Flat Control Hint Line */}
      <div className="shrink-0 text-center text-[10px] sm:text-xs font-mono text-slate-300/85 tracking-wide pt-1">
        WASD / Arrows Move · Mouse Drag Look · Space Interact · Touch D-Pad on Mobile
      </div>

      {/* Mobile & Tablet Full Realm Systems Menu Sheet (Zero Features Deleted) */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Realm Systems Menu"
          data-testid="title-realm-menu-drawer"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/85 p-3 sm:p-6"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-full max-w-md max-h-[86vh] overflow-y-auto rounded-3xl bg-slate-950 border border-amber-500/40 shadow-2xl p-4 sm:p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-black font-cinzel text-amber-300">
                  Realm Systems &amp; Archives
                </h2>
                <p className="text-[10px] font-mono text-slate-400">
                  v1.5.0 · Launch {GAME_LAUNCH_DATE_DISPLAY} · 245K PBR + HDR
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close Realm Menu"
                className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Account Section */}
            {!authLoading && (
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                {authUserEmail ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                        Signed In Commander
                      </div>
                      <div
                        className="text-xs font-mono text-slate-200 truncate"
                        title={authUserEmail}
                      >
                        {authUserEmail}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {onSyncAccount && (
                        <button
                          type="button"
                          onClick={() => {
                            onSyncAccount();
                            setIsMobileMenuOpen(false);
                          }}
                          disabled={isSyncingAccount}
                          className="min-h-[38px] px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${isSyncingAccount ? 'animate-spin' : ''}`}
                          />
                          <span>{isSyncingAccount ? 'Saving' : 'Save'}</span>
                        </button>
                      )}
                      {onSignOutGoogle && (
                        <button
                          type="button"
                          onClick={() => {
                            onSignOutGoogle();
                            setIsMobileMenuOpen(false);
                          }}
                          className="min-h-[38px] min-w-[38px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
                          aria-label="Sign Out"
                          title="Sign Out"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  onSignInGoogle && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-300 font-semibold">Cloud Save Sync</span>
                      <GoogleSignInButton
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onSignInGoogle();
                        }}
                      />
                    </div>
                  )
                )}
              </div>
            )}

            {/* Complete 10-Destination Grid (Every System Preserved & Thumb-Sized) */}
            <div className="grid grid-cols-2 gap-2">
              {onOpenDailyLogin && (
                <button
                  type="button"
                  onClick={() => handleMenuAction(onOpenDailyLogin)}
                  className="min-h-[54px] p-2.5 rounded-2xl bg-amber-950/75 hover:bg-amber-900/80 border border-amber-500/50 text-left flex items-center gap-2.5 cursor-pointer"
                >
                  <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-amber-100 truncate">Daily Login</div>
                    <div className="text-[10px] font-mono text-amber-300">
                      {canClaimDailyLogin ? 'NEW REWARD' : 'Decree'}
                    </div>
                  </div>
                </button>
              )}

              {onOpenDailyMissions && (
                <button
                  type="button"
                  onClick={() => handleMenuAction(onOpenDailyMissions)}
                  className="min-h-[54px] p-2.5 rounded-2xl bg-cyan-950/75 hover:bg-cyan-900/80 border border-cyan-500/50 text-left flex items-center gap-2.5 cursor-pointer"
                >
                  <ClipboardList className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-cyan-100 truncate">Daily Missions</div>
                    <div className="text-[10px] font-mono text-cyan-300">
                      {claimableDailyMissionsCount > 0
                        ? `${claimableDailyMissionsCount} Ready`
                        : 'Commissions'}
                    </div>
                  </div>
                </button>
              )}

              {onOpenVipSubscription && (
                <button
                  type="button"
                  onClick={() => handleMenuAction(onOpenVipSubscription)}
                  className="min-h-[54px] p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-amber-400/50 text-left flex items-center gap-2.5 cursor-pointer"
                >
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-amber-200 truncate">VIP Pass</div>
                    <div className="text-[10px] font-mono text-amber-300 truncate">
                      {canClaimVipStipend ? 'STIPEND READY' : vipBadgeLabel}
                    </div>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleMenuAction(onOpenCharacterCreation)}
                className="min-h-[54px] p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left flex items-center gap-2.5 cursor-pointer"
              >
                <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-100 truncate">Character</div>
                  <div className="text-[10px] font-mono text-slate-400">10 Species</div>
                </div>
              </button>

              {onOpenMarketplace && (
                <button
                  type="button"
                  onClick={() => handleMenuAction(onOpenMarketplace)}
                  className="min-h-[54px] p-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/45 text-left flex items-center gap-2.5 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-amber-100 truncate">Marketplace</div>
                    <div className="text-[10px] font-mono text-amber-300">Grand Guild</div>
                  </div>
                </button>
              )}

              {onOpenLoreHistory && (
                <button
                  type="button"
                  onClick={() => handleMenuAction(onOpenLoreHistory)}
                  className="min-h-[54px] p-2.5 rounded-2xl bg-fuchsia-950/75 hover:bg-fuchsia-900/80 border border-fuchsia-500/45 text-left flex items-center gap-2.5 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-fuchsia-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-fuchsia-100 truncate">Lore Codex</div>
                    <div className="text-[10px] font-mono text-fuchsia-300">7 Epochs</div>
                  </div>
                </button>
              )}

              {onOpenCosmologicalAdmin && (
                <button
                  type="button"
                  onClick={() => handleMenuAction(onOpenCosmologicalAdmin)}
                  className="min-h-[54px] p-2.5 rounded-2xl bg-cyan-950/75 hover:bg-cyan-900/80 border border-cyan-500/45 text-left flex items-center gap-2.5 cursor-pointer"
                >
                  <GitBranch className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-cyan-100 truncate">Cosmology D3</div>
                    <div className="text-[10px] font-mono text-cyan-300">6-Tier Tree</div>
                  </div>
                </button>
              )}

              {onOpenAdminConsole && (
                <button
                  type="button"
                  onClick={() => handleMenuAction(onOpenAdminConsole)}
                  className="min-h-[54px] p-2.5 rounded-2xl bg-red-950/75 hover:bg-red-900/80 border border-red-500/45 text-left flex items-center gap-2.5 cursor-pointer"
                >
                  <Gavel className="w-4 h-4 text-red-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-red-100 truncate">GM / Admin</div>
                    <div className="text-[10px] font-mono text-red-300">Moderation</div>
                  </div>
                </button>
              )}

              {onOpenGmail && (
                <button
                  type="button"
                  onClick={() => handleMenuAction(onOpenGmail)}
                  className="min-h-[54px] p-2.5 rounded-2xl bg-amber-950/75 hover:bg-amber-900/80 border border-amber-500/45 text-left flex items-center gap-2.5 cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-amber-100 truncate">Gmail</div>
                    <div className="text-[10px] font-mono text-amber-300">Dispatch</div>
                  </div>
                </button>
              )}

              {onOpenEula && (
                <button
                  type="button"
                  onClick={() => handleMenuAction(onOpenEula)}
                  className="min-h-[54px] p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-amber-400/40 text-left flex items-center gap-2.5 cursor-pointer"
                >
                  <Scale className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-amber-100 truncate">EULA</div>
                    <div className="text-[10px] font-mono text-slate-400">Legal v1.5.0</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
