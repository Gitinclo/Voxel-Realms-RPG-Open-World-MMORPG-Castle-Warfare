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
  Flame,
  Crown,
  Pause,
  Play,
  CloudRain,
  UserCheck,
  Mail,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Send,
  Gavel,
} from 'lucide-react';
import { CharacterAppearance, CharacterSpeciesId, GameResources, TroopType } from '../types/game';
import { WeatherType } from '../game/weather';
import { sound } from '../game/audio';
import { CHARACTER_SPECIES_CATALOG, getSpeciesSpec } from '../game/species';
import {
  TOP_100_OMNIVERSE_SPECIES_NPCS,
  OMNIVERSE_CODEX_SPEC_VERSION,
  SIX_LAYER_COSMIC_HIERARCHY,
  OmniverseSpeciesNpcEntry,
  OmniverseTierNumber,
  WhitePageAuthorDecreeType,
  executeOmniverseSuperAdminCommand,
} from '../game/omniverse';
import {
  PRIMARY_ADMIN_EMAIL,
  OFFICIAL_CONTACT_DIRECTORY,
  ModeratedPlayerRecord,
  ModerationActionType,
  SupportTicket,
  ContactCategory,
  verifyAccountPrivileges,
  applyModerationAction,
  createContactTicket,
  resolveContactTicket,
  buildMailtoHref,
} from '../game/adminModeration';

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
  activeAccountEmail?: string;
  onChangeAccountEmail?: (email: string) => void;
  moderatedPlayers?: ModeratedPlayerRecord[];
  onUpdateModeratedPlayers?: (players: ModeratedPlayerRecord[]) => void;
  supportTickets?: SupportTicket[];
  onUpdateSupportTickets?: (tickets: SupportTicket[]) => void;
  onBroadcastSystemMessage?: (message: string, tag: string) => void;
  playerAppearance?: CharacterAppearance;
  onUpdatePlayerAppearance?: (updated: CharacterAppearance) => void;
  omniverseRoster?: OmniverseSpeciesNpcEntry[];
  onExecuteOmniverseCommand?: (
    command: Parameters<typeof executeOmniverseSuperAdminCommand>[0]['command']
  ) => void;
  onExecuteWhitePageDecree?: (decreeType: WhitePageAuthorDecreeType) => void;
  onOpenOmniverseDirector?: () => void;
  initialTab?: 'cheats' | 'troops' | 'world' | 'moderation' | 'contact' | 'logs';
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
  activeAccountEmail = PRIMARY_ADMIN_EMAIL,
  onChangeAccountEmail,
  moderatedPlayers = [],
  onUpdateModeratedPlayers,
  supportTickets = [],
  onUpdateSupportTickets,
  onBroadcastSystemMessage,
  playerAppearance,
  onUpdatePlayerAppearance,
  omniverseRoster = TOP_100_OMNIVERSE_SPECIES_NPCS,
  onExecuteOmniverseCommand,
  onExecuteWhitePageDecree,
  onOpenOmniverseDirector,
  initialTab = 'cheats',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'cheats' | 'troops' | 'world' | 'moderation' | 'contact' | 'logs'
  >(initialTab);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    `[AdminAuth] Root account ${PRIMARY_ADMIN_EMAIL} authenticated with Administration, GM, Admin & Moderator control (Clearance Lv.999).`,
    `[WhitePage/HouseOfIdeas] Layer 6 Supreme Author ${PRIMARY_ADMIN_EMAIL} verified over 5. Overvoid/Exoverse, 4. Omniverse, 3. Megaverse/Hyperverse, 2. Multiverse, 1. Universe & Nothingness (Oblivion).`,
    `[OmniverseMatrix] 100 Fictional Species Background NPCs & 100+∞ Sovereign Omniverses bound to Super Admin ${PRIMARY_ADMIN_EMAIL}.`,
    '[Architect 06/11/2026] v1.5.0 Software & Hardware Architect (x86_64 AVX-512 / ARM64 SVE2 / Apple Silicon 128B UMA / RISC-V RVV 1.0 + SoA Lock-Free DAG): ONLINE.',
    '[AdminConsole] Causality tick & RBAC moderation guardrails hooked into Game::update(float dt).',
  ]);

  // Account verification state
  const [emailInput, setEmailInput] = useState<string>(activeAccountEmail);
  const [moderationReason, setModerationReason] = useState<string>(
    'Code of Conduct & Realm Fair-Play Enforcement'
  );
  const [broadcastInput, setBroadcastInput] = useState<string>('');

  // Official Contact & Ticket form state
  const [ticketCategory, setTicketCategory] = useState<ContactCategory>('administration');
  const [ticketSubject, setTicketSubject] = useState<string>('');
  const [ticketMessage, setTicketMessage] = useState<string>('');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'normal' | 'high' | 'critical'>(
    'high'
  );
  const [ticketFormFeedback, setTicketFormFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [copiedEmailBadge, setCopiedEmailBadge] = useState<boolean>(false);

  const privilegeProfile = verifyAccountPrivileges(activeAccountEmail, moderatedPlayers);

  const addLog = (msg: string) => {
    setConsoleLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 24)]);
  };

  const handleCopyAdminEmail = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(PRIMARY_ADMIN_EMAIL).catch(() => {});
    }
    setCopiedEmailBadge(true);
    addLog(
      `INFO: Copied official Admin/GM/Moderator contact (${PRIMARY_ADMIN_EMAIL}) to clipboard.`
    );
    setTimeout(() => setCopiedEmailBadge(false), 2500);
  };

  const handleSwitchAccountEmail = (targetEmail: string) => {
    const cleaned = targetEmail.trim() || PRIMARY_ADMIN_EMAIL;
    setEmailInput(cleaned);
    onChangeAccountEmail?.(cleaned);
    const verified = verifyAccountPrivileges(cleaned, moderatedPlayers);
    addLog(
      `[AuthSwitch] Active session bound to ${verified.email} — Roles: [${verified.assignedRoles.join(', ')}] (Clearance Lv.${verified.clearanceLevel}).`
    );
  };

  const handleMaxCastle = () => {
    if (!privilegeProfile.permissions.canUseGodmodeAndCheats) {
      addLog(`DENIED: ${privilegeProfile.email} lacks GM cheat privileges.`);
      return;
    }
    onSetCastleLevel(100);
    sound.playUpgradeFanfare();
    addLog('CMD: Castle level set to 100 (Era X: Celestial Imperium, 1000T capacity unlocked).');
  };

  const handleGrantSupplies = () => {
    if (!privilegeProfile.permissions.canSpawnTroopsAndResources) {
      addLog(`DENIED: ${privilegeProfile.email} lacks GM resource grant privileges.`);
      return;
    }
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
    if (!privilegeProfile.permissions.canSpawnTroopsAndResources) {
      addLog(`DENIED: ${privilegeProfile.email} lacks GM troop spawner privileges.`);
      return;
    }
    onSpawnTroops(type, 20, amount);
    sound.playSwing();
    addLog(
      `CMD: Spawned +${amount.toLocaleString()} T20 ${type.toUpperCase()} cohort into garrison.`
    );
  };

  const handleExecuteModeration = (targetPlayerId: string, action: ModerationActionType) => {
    const result = applyModerationAction({
      roster: moderatedPlayers,
      targetPlayerId,
      action,
      reason: moderationReason,
      actorEmail: privilegeProfile.email,
    });
    addLog(result.logMessage);
    if (result.success) {
      sound.playSwing();
      onUpdateModeratedPlayers?.(result.updatedRoster);
      onBroadcastSystemMessage?.(result.logMessage, 'MODERATION');
    }
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = broadcastInput.trim();
    if (!trimmed) return;
    if (!privilegeProfile.permissions.canModerateChat) {
      addLog(`DENIED: ${privilegeProfile.email} cannot broadcast official GM/Moderator notices.`);
      return;
    }
    const formatted = `[${privilegeProfile.email} · GM/ADMIN DECREE]: ${trimmed}`;
    onBroadcastSystemMessage?.(formatted, 'GM DECREE');
    addLog(`BROADCAST: ${formatted}`);
    setBroadcastInput('');
    sound.playUpgradeFanfare();
  };

  const handleSubmitContactTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const result = createContactTicket({
      tickets: supportTickets,
      category: ticketCategory,
      senderName: privilegeProfile.displayName,
      senderEmail: privilegeProfile.email,
      subject: ticketSubject,
      message: ticketMessage,
      priority: ticketPriority,
    });

    if (!result.success || !result.ticket) {
      setTicketFormFeedback({
        type: 'error',
        text: result.error || 'Please provide both a subject and message.',
      });
      return;
    }

    onUpdateSupportTickets?.(result.updatedTickets);
    setTicketSubject('');
    setTicketMessage('');
    setTicketFormFeedback({
      type: 'success',
      text: `Ticket ${result.ticket.id} routed directly to Official Admin/GM/Moderator (${PRIMARY_ADMIN_EMAIL}).`,
    });
    addLog(
      `[CONTACT DISPATCH] Ticket ${result.ticket.id} ("${result.ticket.subject}") assigned to ${PRIMARY_ADMIN_EMAIL}.`
    );
    sound.playGather();
  };

  const handleTicketStatusUpdate = (
    ticketId: string,
    status: 'investigating' | 'resolved',
    note: string
  ) => {
    const result = resolveContactTicket({
      tickets: supportTickets,
      ticketId,
      status,
      resolutionNote: note,
      actorEmail: privilegeProfile.email,
      roster: moderatedPlayers,
    });
    addLog(result.logMessage);
    if (result.success) {
      sound.playSwing();
      onUpdateSupportTickets?.(result.updatedTickets);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        data-testid="admin-console-modal"
        className="relative w-full max-w-5xl bg-slate-900 border-2 border-red-500/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header with Root Account & Contact Identity */}
        <div className="relative px-4 sm:px-6 py-3.5 bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border-b border-red-500/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-mono font-black text-xs tracking-wider border border-red-400 shrink-0">
              GM / ADMIN / MOD
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-bold font-mono text-white flex flex-wrap items-center gap-2">
                <span className="truncate">Administration, GM & Moderator Control Center</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/40 shrink-0">
                  Root Contact: {PRIMARY_ADMIN_EMAIL}
                </span>
              </h2>
              <p className="text-[11px] text-slate-300 font-mono truncate">
                Active Session:{' '}
                <span className="text-emerald-300 font-bold" data-testid="admin-active-email">
                  {privilegeProfile.email}
                </span>{' '}
                · Clearance Lv.{privilegeProfile.clearanceLevel} · Roles:{' '}
                {privilegeProfile.assignedRoles.join(' / ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyAdminEmail}
              data-testid="copy-admin-email-btn"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy Official Admin / GM / Moderator Email"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {copiedEmailBadge ? 'Copied!' : PRIMARY_ADMIN_EMAIL}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close GM Console"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Account Privilege & RBAC Status Bar */}
        <div className="px-4 sm:px-6 py-2 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[11px]">Granted Privileges:</span>
            {privilegeProfile.assignedRoles.map((roleName) => (
              <span
                key={roleName}
                className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/40 text-red-200 font-mono font-bold text-[10px]"
              >
                {roleName}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <label htmlFor="admin-account-email-input" className="sr-only">
              Active Account Email
            </label>
            <input
              id="admin-account-email-input"
              data-testid="admin-account-email-input"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Verify account email..."
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-amber-400 w-48 sm:w-56"
            />
            <button
              type="button"
              data-testid="verify-account-email-btn"
              onClick={() => handleSwitchAccountEmail(emailInput)}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-[11px] cursor-pointer"
            >
              Bind Account
            </button>
            {privilegeProfile.email !== PRIMARY_ADMIN_EMAIL && (
              <button
                type="button"
                data-testid="restore-root-admin-btn"
                onClick={() => handleSwitchAccountEmail(PRIMARY_ADMIN_EMAIL)}
                className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-[11px] cursor-pointer"
              >
                Restore Root GM
              </button>
            )}
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex flex-wrap border-b border-slate-800 bg-slate-950/80 px-4 sm:px-6 gap-1 pt-2">
          {[
            { id: 'cheats', label: 'Godmode & Cheats', icon: Zap },
            { id: 'troops', label: 'T20 Spawner', icon: Shield },
            { id: 'world', label: 'World & Time', icon: Clock },
            { id: 'moderation', label: 'Admin & Moderator Control', icon: Gavel },
            { id: 'contact', label: 'Official Contact & Tickets', icon: Mail },
            { id: 'logs', label: 'Audit Logs', icon: Terminal },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                data-testid={`admin-tab-${t.id}`}
                onClick={() => {
                  setActiveTab(t.id as typeof activeTab);
                  sound.playSwing();
                }}
                className={`px-3 py-2 text-[11px] font-mono font-bold rounded-t-xl flex items-center gap-1.5 border-t-2 transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-slate-900 border-red-500 text-red-200'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-slate-200">
          {activeTab === 'cheats' && (
            <div className="space-y-4">
              {/* Root Owner Summary Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/60 via-slate-900 to-amber-950/60 border border-amber-500/40 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    Authorized Supreme Administrator / GM / Moderator Account
                  </div>
                  <div className="text-sm font-bold text-white font-mono">
                    {PRIMARY_ADMIN_EMAIL} — Full Administration, Game Master, Admin, Moderator &
                    Official Contact Authority
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('moderation')}
                    className="px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-mono font-bold cursor-pointer"
                  >
                    Open Moderator Panel →
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('contact')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold cursor-pointer"
                  >
                    Official Contact Hub →
                  </button>
                </div>
              </div>

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
                    type="button"
                    onClick={() => {
                      onToggleGodmode();
                      sound.playSwing();
                      addLog(`CMD: Godmode toggled ${!godmode ? 'ENABLED' : 'DISABLED'}.`);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
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
                    type="button"
                    onClick={handleMaxCastle}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
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
                    type="button"
                    onClick={handleGrantSupplies}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold shadow-md shadow-emerald-600/25 active:scale-95 cursor-pointer"
                  >
                    +100M ALL SUPPLIES
                  </button>
                </div>
              </div>

              {/* Castle Level Slider */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">Castle Level Set:</span>
                  <span className="font-mono text-amber-400 font-bold">
                    Level {castleLevel} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={castleLevel}
                  aria-label="Castle Level Slider"
                  onChange={(e) => {
                    const l = parseInt(e.target.value);
                    onSetCastleLevel(l);
                    addLog(`CMD: Castle Level slider adjusted to ${l}.`);
                  }}
                  className="w-full accent-amber-400"
                />
              </div>

              {/* Admin Species / Race Rebirth Authorization Control (creatergame31@gmail.com) */}
              {playerAppearance && onUpdatePlayerAppearance && (
                <div
                  data-testid="admin-species-authorization-card"
                  className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/40 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-cyan-200 flex items-center gap-2">
                        <span>Species / Race Rebirth Governance ({PRIMARY_ADMIN_EMAIL})</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono">
                          {getSpeciesSpec(playerAppearance.species).icon}{' '}
                          {getSpeciesSpec(playerAppearance.species).name}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Grant or revoke Admin Permission for switching Species / Race after initial
                        character creation, or force-assign any of the 10 lineages.
                      </p>
                    </div>
                    <button
                      type="button"
                      data-testid="admin-toggle-species-permission-btn"
                      onClick={() => {
                        const nextApproved = !playerAppearance.adminSpeciesSwitchApproved;
                        onUpdatePlayerAppearance({
                          ...playerAppearance,
                          adminSpeciesSwitchApproved: nextApproved,
                        });
                        sound.playUpgradeFanfare();
                        addLog(
                          `[SPECIES GOVERNANCE] ${PRIMARY_ADMIN_EMAIL} set Admin Species Switch Permission = ${nextApproved ? 'APPROVED' : 'REVOKED'}.`
                        );
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                        playerAppearance.adminSpeciesSwitchApproved
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-amber-500/20 text-amber-200 border-amber-400 hover:bg-amber-500/30'
                      }`}
                    >
                      {playerAppearance.adminSpeciesSwitchApproved
                        ? '✓ Species Switch Permission: APPROVED'
                        : 'Grant Species Switch Permission'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                    {CHARACTER_SPECIES_CATALOG.map((spec) => {
                      const active = (playerAppearance.species || 'human') === spec.id;
                      return (
                        <button
                          key={spec.id}
                          type="button"
                          onClick={() => {
                            onUpdatePlayerAppearance({
                              ...playerAppearance,
                              species: spec.id as CharacterSpeciesId,
                              speciesLocked: true,
                              adminSpeciesSwitchApproved: true,
                            });
                            sound.playButton();
                            addLog(
                              `[SPECIES OVERRIDE] ${PRIMARY_ADMIN_EMAIL} assigned Lord Species -> ${spec.name} (${spec.chineseName}).`
                            );
                          }}
                          className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1.5 truncate cursor-pointer ${
                            active
                              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{spec.icon}</span>
                          <span className="truncate">{spec.name.split(' (')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Super Admin Infinite Omniverse & 100 Species Background NPCs Control (creatergame31@gmail.com) */}
              <div
                data-testid="admin-omniverse-100-npc-card"
                className="p-4 rounded-xl bg-gradient-to-r from-fuchsia-950/60 via-slate-900 to-amber-950/40 border border-fuchsia-500/40 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-fuchsia-200">
                        🌌 Infinite Omniverse & 100 Fictional Species Background NPCs
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono font-bold">
                        SUPER ADMIN: {PRIMARY_ADMIN_EMAIL}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 font-mono">
                        📜 {OMNIVERSE_CODEX_SPEC_VERSION}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Command all 100 Species Background NPCs (Outer Gods, Beyonders, Endless,
                      Monitors, Xeelee, Time Lords, Fiendcelestials, Saiyans, Kryptonians, Eldar,
                      etc.) and their 100+∞ Sovereign Omniverses. Currently Projected in 3D
                      Overworld:{' '}
                      <strong className="text-emerald-300 font-mono">
                        {omniverseRoster.filter((e) => e.deployedInOverworld).length} / 100
                      </strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {onOpenOmniverseDirector && (
                      <button
                        type="button"
                        data-testid="admin-open-omniverse-matrix-btn"
                        onClick={() => {
                          sound.playButton();
                          onOpenOmniverseDirector();
                        }}
                        className="px-3 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-mono font-bold cursor-pointer"
                      >
                        Open Full 100-Omniverse Matrix
                      </button>
                    )}
                    {onExecuteOmniverseCommand && (
                      <button
                        type="button"
                        onClick={() => {
                          onExecuteOmniverseCommand({ type: 'harvest_all_omniverse_tribute' });
                          sound.playUpgradeFanfare();
                          addLog(
                            `[OMNIVERSE TRIBUTE] ${PRIMARY_ADMIN_EMAIL} harvested cosmic tribute across all 100 Sovereign Omniverses.`
                          );
                        }}
                        className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold cursor-pointer"
                      >
                        Harvest 100-Omniverse Tribute
                      </button>
                    )}
                  </div>
                </div>

                {onExecuteOmniverseCommand && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                    {([1, 2, 3, 4, 5] as OmniverseTierNumber[]).map((t) => {
                      const tierEntries = omniverseRoster.filter((e) => e.tier === t);
                      const deployedCount = tierEntries.filter((e) => e.deployedInOverworld).length;
                      const allDeployed = deployedCount === tierEntries.length;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            onExecuteOmniverseCommand({
                              type: 'project_tier_to_overworld',
                              targetTier: t,
                              deploy: !allDeployed,
                            });
                            sound.playButton();
                            addLog(
                              `[OMNIVERSE TIER ${t}] ${PRIMARY_ADMIN_EMAIL} ${!allDeployed ? 'projected' : 'recalled'} all 20 Tier ${t} Background NPCs.`
                            );
                          }}
                          className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold flex items-center justify-between cursor-pointer ${
                            deployedCount > 0
                              ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-200'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>Tier {t} NPCs</span>
                          <span>{deployedCount}/20</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 6-Layer Cosmic Ontology & Layer 6: The White Page / The House of Ideas Summary */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-white/30 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold font-mono text-white">
                      📜 6-Layer Cosmic Hierarchy → Layer 6: The White Page / The House of Ideas (
                      {PRIMARY_ADMIN_EMAIL})
                    </span>
                    <span className="text-[10px] font-mono text-amber-300">
                      Everything comes from here — even Nothingness (Oblivion)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                    {SIX_LAYER_COSMIC_HIERARCHY.map((layer) => (
                      <div
                        key={layer.id}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono space-y-0.5"
                      >
                        <div className="font-bold text-amber-200 truncate">
                          {layer.icon} {layer.name}
                        </div>
                        <div className="text-[9px] text-slate-300 line-clamp-2">
                          {layer.canonicalDefinition}
                        </div>
                      </div>
                    ))}
                  </div>
                  {onExecuteWhitePageDecree && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onExecuteWhitePageDecree('inscribe_creation');
                          sound.playUpgradeFanfare();
                          addLog(
                            `[WHITE PAGE / HOUSE OF IDEAS] ${PRIMARY_ADMIN_EMAIL} inscribed Genesis across all 6 Cosmic Layers.`
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white text-slate-950 hover:bg-amber-200 text-[10px] font-mono font-bold cursor-pointer"
                      >
                        📜 Inscribe Creation (+50M 💎)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onExecuteWhitePageDecree('realign_overvoid_logic');
                          sound.playUpgradeFanfare();
                          addLog(
                            `[OVERVOID / EXOVERSE] ${PRIMARY_ADMIN_EMAIL} realigned the laws of logic across all distinct Omniverses.`
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-200 hover:bg-amber-500/30 text-[10px] font-mono font-bold cursor-pointer"
                      >
                        🕳️ Realign Overvoid Logic (+25M 💎)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onExecuteWhitePageDecree('invoke_oblivion_reset');
                          sound.playUpgradeFanfare();
                          addLog(
                            `[OBLIVION / WHITE PAGE] ${PRIMARY_ADMIN_EMAIL} invoked Nothingness (Oblivion) & anchored Top 5 Envoys.`
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-fuchsia-500/20 border border-fuchsia-400/50 text-fuchsia-200 hover:bg-fuchsia-500/30 text-[10px] font-mono font-bold cursor-pointer"
                      >
                        🌑 Invoke Oblivion Anchor (+77.7M 💎)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onExecuteWhitePageDecree('channel_house_of_ideas_harvest');
                          sound.playUpgradeFanfare();
                          addLog(
                            `[HOUSE OF IDEAS] ${PRIMARY_ADMIN_EMAIL} harvested 10x Omni-Tribute across all 6 Cosmic Layers.`
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/30 text-[10px] font-mono font-bold cursor-pointer"
                      >
                        🏛️ House of Ideas 10x Harvest
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'troops' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <h3 className="text-sm font-bold text-white">
                  T20 Celestial Vanguard Army Spawner
                </h3>
                <p className="text-xs text-slate-400">
                  Instantly summon massive cohorts of Rank T20 troops to test billion and trillion
                  power scaling.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-blue-500/40 space-y-2">
                    <div className="text-xs font-bold text-blue-300">T20 Celestial Aegis</div>
                    <div className="text-[11px] text-slate-400">Supreme Tank Cohort</div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSpawnT20Troops('shieldbearer', 100_000n)}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-mono font-bold cursor-pointer"
                      >
                        +100K
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSpawnT20Troops('shieldbearer', 10_000_000n)}
                        className="flex-1 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-mono font-bold cursor-pointer"
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
                        type="button"
                        onClick={() => handleSpawnT20Troops('shooter', 100_000n)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-mono font-bold cursor-pointer"
                      >
                        +100K
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSpawnT20Troops('shooter', 10_000_000n)}
                        className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-mono font-bold cursor-pointer"
                      >
                        +10M
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-orange-500/40 space-y-2">
                    <div className="text-xs font-bold text-orange-300">
                      T20 Celestial Annihilator
                    </div>
                    <div className="text-[11px] text-slate-400">Omega Siege Mortars</div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSpawnT20Troops('bomber', 100_000n)}
                        className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-mono font-bold cursor-pointer"
                      >
                        +100K
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSpawnT20Troops('bomber', 10_000_000n)}
                        className="flex-1 py-1.5 bg-orange-700 hover:bg-orange-600 text-white rounded text-xs font-mono font-bold cursor-pointer"
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
                    type="button"
                    onClick={() => {
                      onToggleTimeFreeze();
                      sound.playSwing();
                      addLog(`CMD: Time freeze toggled ${!isTimeFrozen ? 'FROZEN' : 'RESUMED'}.`);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer ${
                      isTimeFrozen ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isTimeFrozen ? (
                      <Play className="w-3.5 h-3.5" />
                    ) : (
                      <Pause className="w-3.5 h-3.5" />
                    )}
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
                        type="button"
                        onClick={() => {
                          onSetTimeSpeed(spd);
                          addLog(`CMD: Time scale set to ${spd}x.`);
                        }}
                        className={`flex-1 py-1.5 rounded text-xs font-mono font-bold border cursor-pointer ${
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
                      type="button"
                      onClick={() => {
                        if (onSetWeather) onSetWeather(w);
                        if (w === 'storm') sound.playThunder();
                        else sound.playWeatherChange();
                        addLog(`CMD: Atmosphere manually altered to ${w.toUpperCase()}.`);
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-mono font-bold capitalize border transition-all cursor-pointer ${
                        currentWeather === w
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {w === 'clear'
                        ? '☀️ Clear'
                        : w === 'rain'
                          ? '🌧️ Rain'
                          : w === 'snow'
                            ? '❄️ Snow'
                            : '⚡ Storm'}
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
                    Triggers simulated rival lord invasion from the leaderboard to test defense
                    garrison.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onTriggerRivalRaid();
                    sound.playExplosion();
                    addLog(
                      'CMD: Dispatched AI Rival Kingdom [TITAN] Lord Chronos territory raid simulation.'
                    );
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold shadow-md shadow-rose-600/30 active:scale-95 cursor-pointer"
                >
                  TRIGGER RAID
                </button>
              </div>
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="space-y-4" data-testid="admin-moderation-panel">
              {/* Server-Wide GM / Moderator Decree Broadcast */}
              <form
                onSubmit={handleSendBroadcast}
                className="p-4 rounded-xl bg-slate-800/60 border border-amber-500/40 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-amber-400" />
                    Global GM / Moderator Realm Decree Broadcast
                  </div>
                  <span className="text-[11px] font-mono text-amber-300">
                    Sender: {privilegeProfile.email}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <label htmlFor="gm-broadcast-input" className="sr-only">
                    GM Broadcast Message
                  </label>
                  <input
                    id="gm-broadcast-input"
                    data-testid="gm-broadcast-input"
                    type="text"
                    value={broadcastInput}
                    onChange={(e) => setBroadcastInput(e.target.value)}
                    placeholder="Enter server-wide GM / Moderator announcement for Clan & World Chat..."
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    data-testid="gm-broadcast-submit-btn"
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Broadcast Decree</span>
                  </button>
                </div>
              </form>

              {/* Sanction Reason Input */}
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700 flex flex-col sm:flex-row sm:items-center gap-2">
                <label
                  htmlFor="moderation-reason-input"
                  className="text-xs font-mono font-bold text-slate-300 whitespace-nowrap"
                >
                  Moderation / Role Reason:
                </label>
                <input
                  id="moderation-reason-input"
                  data-testid="moderation-reason-input"
                  type="text"
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-400"
                />
              </div>

              {/* Player & Staff Moderation Roster */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>
                    REALM ACCOUNT & MODERATION ROSTER ({moderatedPlayers.length} ACCOUNTS)
                  </span>
                  <span className="text-emerald-400">
                    Root Admin Protected: {PRIMARY_ADMIN_EMAIL}
                  </span>
                </div>

                <div className="space-y-2">
                  {moderatedPlayers.map((player) => {
                    const isRoot = player.email === PRIMARY_ADMIN_EMAIL;
                    return (
                      <div
                        key={player.id}
                        data-testid={`mod-player-row-${player.id}`}
                        className={`p-3.5 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                          isRoot
                            ? 'bg-red-950/30 border-red-500/50'
                            : 'bg-slate-950/80 border-slate-800'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-bold text-amber-400">
                              [{player.clanTag}]
                            </span>
                            <span className="text-sm font-bold text-white">{player.name}</span>
                            <span className="text-xs font-mono text-cyan-300">{player.email}</span>
                            <span
                              data-testid={`mod-player-role-${player.id}`}
                              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                                player.role === 'owner_admin'
                                  ? 'bg-red-600 text-white'
                                  : player.role === 'game_master'
                                    ? 'bg-purple-600 text-white'
                                    : player.role === 'administrator'
                                      ? 'bg-amber-500 text-slate-950'
                                      : player.role === 'moderator'
                                        ? 'bg-cyan-500 text-slate-950'
                                        : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {player.role.replace('_', ' ')}
                            </span>
                            <span
                              data-testid={`mod-player-status-${player.id}`}
                              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                                player.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : player.status === 'warned'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : player.status === 'muted'
                                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                                      : 'bg-rose-600/30 text-rose-200 border border-rose-500/50'
                              }`}
                            >
                              {player.status.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              Warnings: {player.warningsCount}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            Audit Note: {player.sanctionReason} (By: {player.lastActionBy})
                          </div>
                        </div>

                        {isRoot ? (
                          <div className="px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-500/40 text-[11px] font-mono font-bold text-red-200 shrink-0">
                            🛡️ Root Owner / GM / Admin / Moderator
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              data-testid={`mod-warn-${player.id}`}
                              onClick={() => handleExecuteModeration(player.id, 'warn')}
                              className="px-2.5 py-1 rounded bg-amber-600/80 hover:bg-amber-500 text-white text-[11px] font-mono font-bold cursor-pointer"
                            >
                              Warn
                            </button>
                            <button
                              type="button"
                              data-testid={`mod-mute-${player.id}`}
                              onClick={() => handleExecuteModeration(player.id, 'mute')}
                              className="px-2.5 py-1 rounded bg-orange-600/80 hover:bg-orange-500 text-white text-[11px] font-mono font-bold cursor-pointer"
                            >
                              Mute Chat
                            </button>
                            <button
                              type="button"
                              data-testid={`mod-ban-${player.id}`}
                              onClick={() => handleExecuteModeration(player.id, 'temp_ban')}
                              className="px-2.5 py-1 rounded bg-rose-600/90 hover:bg-rose-500 text-white text-[11px] font-mono font-bold cursor-pointer"
                            >
                              Temp Ban
                            </button>
                            <button
                              type="button"
                              data-testid={`mod-restore-${player.id}`}
                              onClick={() => handleExecuteModeration(player.id, 'restore_active')}
                              className="px-2.5 py-1 rounded bg-emerald-600/80 hover:bg-emerald-500 text-white text-[11px] font-mono font-bold cursor-pointer"
                            >
                              Restore
                            </button>
                            <button
                              type="button"
                              data-testid={`mod-grant-mod-${player.id}`}
                              onClick={() => handleExecuteModeration(player.id, 'grant_moderator')}
                              className="px-2.5 py-1 rounded bg-cyan-600/80 hover:bg-cyan-500 text-white text-[11px] font-mono font-bold cursor-pointer"
                            >
                              +Moderator
                            </button>
                            <button
                              type="button"
                              data-testid={`mod-grant-admin-${player.id}`}
                              onClick={() => handleExecuteModeration(player.id, 'grant_admin')}
                              className="px-2.5 py-1 rounded bg-purple-600/80 hover:bg-purple-500 text-white text-[11px] font-mono font-bold cursor-pointer"
                            >
                              +Admin
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-5" data-testid="admin-contact-panel">
              {/* Official Contact Directory for creatergame31@gmail.com */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-amber-500/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-amber-400" />
                      Official Administration, GM, Admin & Moderator Contact Directory
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      All executive administration, Game Master interventions, moderation reports,
                      appeals, and security disclosures are managed by{' '}
                      <span className="font-mono font-bold text-amber-300">
                        {PRIMARY_ADMIN_EMAIL}
                      </span>
                      .
                    </p>
                  </div>
                  <a
                    href={`mailto:${PRIMARY_ADMIN_EMAIL}?subject=${encodeURIComponent('[ADMIN/GM/MODERATOR] Voxel Realms RPG Official Inquiry')}`}
                    data-testid="direct-mailto-primary-link"
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 shadow-md"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email {PRIMARY_ADMIN_EMAIL}</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {OFFICIAL_CONTACT_DIRECTORY.map((channel) => (
                    <div
                      key={channel.id}
                      className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white">{channel.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                            {channel.roleLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{channel.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                        <span className="text-cyan-300 font-bold">{channel.email}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{channel.slaText}</span>
                          <a
                            href={buildMailtoHref(channel)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
                          >
                            Compose ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* In-App Ticket Dispatch Form to creatergame31@gmail.com */}
              <form
                onSubmit={handleSubmitContactTicket}
                className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    Dispatch In-App Support / Moderation Ticket to {PRIMARY_ADMIN_EMAIL}
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-400">
                    Assigned To: {PRIMARY_ADMIN_EMAIL}
                  </span>
                </div>

                {ticketFormFeedback && (
                  <div
                    data-testid="ticket-form-feedback"
                    className={`p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
                      ticketFormFeedback.type === 'success'
                        ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
                        : 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
                    }`}
                  >
                    {ticketFormFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{ticketFormFeedback.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label
                      htmlFor="ticket-category-select"
                      className="block text-[11px] font-mono text-slate-400 mb-1"
                    >
                      Department / Control Desk
                    </label>
                    <select
                      id="ticket-category-select"
                      data-testid="ticket-category-select"
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value as ContactCategory)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white"
                    >
                      <option value="administration">Administration Control</option>
                      <option value="gm_intervention">Game Master (GM) Ops</option>
                      <option value="moderation_report">Moderator Conduct Report</option>
                      <option value="ban_appeal">Admin Sanction Appeal</option>
                      <option value="security_disclosure">Security / GDPR Contact</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="ticket-priority-select"
                      className="block text-[11px] font-mono text-slate-400 mb-1"
                    >
                      Priority Level
                    </label>
                    <select
                      id="ticket-priority-select"
                      value={ticketPriority}
                      onChange={(e) =>
                        setTicketPriority(e.target.value as 'low' | 'normal' | 'high' | 'critical')
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="ticket-subject-input"
                      className="block text-[11px] font-mono text-slate-400 mb-1"
                    >
                      Ticket Subject
                    </label>
                    <input
                      id="ticket-subject-input"
                      data-testid="ticket-subject-input"
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Brief inquiry or report title..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <label htmlFor="ticket-message-input" className="sr-only">
                    Ticket Details
                  </label>
                  <input
                    id="ticket-message-input"
                    data-testid="ticket-message-input"
                    type="text"
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder={`Describe the request or report for ${PRIMARY_ADMIN_EMAIL}...`}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white"
                  />
                  <button
                    type="submit"
                    data-testid="submit-ticket-btn"
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch to {PRIMARY_ADMIN_EMAIL}</span>
                  </button>
                </div>
              </form>

              {/* Live Support & Moderation Ticket Queue */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
                  <span>
                    LIVE GM / MODERATOR TICKET QUEUE ({supportTickets.length} TICKETS ASSIGNED TO{' '}
                    {PRIMARY_ADMIN_EMAIL})
                  </span>
                </div>
                <div className="space-y-2">
                  {supportTickets.map((tkt) => (
                    <div
                      key={tkt.id}
                      data-testid={`support-ticket-${tkt.id}`}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-white">{tkt.subject}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono uppercase">
                            {tkt.category.replace('_', ' ')}
                          </span>
                          <span
                            data-testid={`ticket-status-${tkt.id}`}
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                              tkt.status === 'resolved'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : tkt.status === 'investigating'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            }`}
                          >
                            {tkt.status}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Assigned: {tkt.assignedToEmail}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{tkt.message}</p>
                        {tkt.resolutionNote && (
                          <p className="text-[11px] font-mono text-emerald-400">
                            Resolution ({tkt.resolvedByEmail}): {tkt.resolutionNote}
                          </p>
                        )}
                      </div>

                      {tkt.status !== 'resolved' && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            data-testid={`investigate-ticket-${tkt.id}`}
                            onClick={() =>
                              handleTicketStatusUpdate(
                                tkt.id,
                                'investigating',
                                `Under GM/Moderator review by ${PRIMARY_ADMIN_EMAIL}`
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white text-[11px] font-mono font-bold cursor-pointer"
                          >
                            Investigate
                          </button>
                          <button
                            type="button"
                            data-testid={`resolve-ticket-${tkt.id}`}
                            onClick={() =>
                              handleTicketStatusUpdate(
                                tkt.id,
                                'resolved',
                                `Verified & resolved by ${PRIMARY_ADMIN_EMAIL}`
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono font-bold cursor-pointer"
                          >
                            Resolve
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              <div className="text-xs font-mono text-slate-400">
                Native Engine & GM/Moderator Audit Event Stream ({PRIMARY_ADMIN_EMAIL})
              </div>
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
