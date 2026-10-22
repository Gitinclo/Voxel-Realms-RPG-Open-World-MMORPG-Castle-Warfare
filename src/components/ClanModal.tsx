/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Users,
  Gift,
  ShoppingBag,
  Coins,
  Sparkles,
  Swords,
  MessageSquare,
  Crown,
  Flame,
  Award,
  Send,
  Plus,
  Edit3,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Skull,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  UserX,
  Info,
} from 'lucide-react';
import {
  Clan,
  ClanMember,
  ClanRole,
  ClanEmblem,
  ClanBuff,
  ClanWarOutpost,
  ClanChatMessage,
  GameResources,
  ResourceType,
} from '../types/game';
import { formatBigInt } from '../game/math';
import {
  ROLE_HIERARCHY,
  getRolePermissions,
  canPromoteMember,
  canDemoteMember,
  canKickMember,
  validateClanCreation,
  calculateOutpostAssault,
  calculateCoopBossStrike,
} from '../game/clanMath';
import { INITIAL_CLAN_BUFFS } from '../game/initialData';
import { sound } from '../game/audio';
import { ClanEmblemView } from './ClanEmblemView';

interface ClanModalProps {
  clan: Clan;
  members: ClanMember[];
  resources: GameResources;
  clanCoins: bigint;
  playerPower: bigint;
  chatMessages: ClanChatMessage[];
  onDonate: (type: ResourceType, amount: bigint, coinsEarned: bigint) => void;
  onBuyStoreItem: (itemId: string, cost: bigint) => void;
  onSendChatMessage: (message: string, isSystem?: boolean, tag?: string) => void;
  onActivateBuff: (buff: ClanBuff) => void;
  onAssaultOutpost: (outpostId: string) => void;
  onAttackCoopBoss: (damage: bigint) => void;
  onClaimCoopChest: (milestonePct: number, diamonds: bigint, honor: bigint) => void;
  onUpdateEmblem: (newEmblem: ClanEmblem) => void;
  onCreateNewClan: (newClan: { name: string; tag: string; motto: string; emblem: ClanEmblem; minCastleLevel: number }) => void;
  onPromoteMember: (memberId: string) => void;
  onDemoteMember: (memberId: string) => void;
  onKickMember: (memberId: string) => void;
  onWithdrawVaultRations: () => void;
  onClose: () => void;
}

type TabType = 'hall' | 'roles' | 'vault' | 'war' | 'chat' | 'tech' | 'store';

const COLOR_PALETTE = [
  '#dc2626', // Crimson Red
  '#2563eb', // Royal Cobalt
  '#059669', // Emerald
  '#7c3aed', // Arcane Purple
  '#d97706', // Amber Gold
  '#0891b2', // Cyan
  '#db2777', // Rose Magenta
  '#1e293b', // Midnight Slate
  '#475569', // Steel Silver
  '#f59e0b', // Radiant Gold
];

const SHAPES: ClanEmblem['shape'][] = ['shield', 'crest', 'diamond', 'roundel', 'banner', 'octagon'];
const SIGILS: ClanEmblem['sigil'][] = ['dragon', 'crown', 'swords', 'phoenix', 'wolf', 'lion', 'skull', 'lightning', 'citadel', 'gryphon'];
const BORDER_STYLES: ClanEmblem['borderStyle'][] = ['gold_filigree', 'runed_iron', 'star_silver', 'spiked_bronze'];

export const ClanModal: React.FC<ClanModalProps> = ({
  clan,
  members,
  resources,
  clanCoins,
  playerPower,
  chatMessages,
  onDonate,
  onBuyStoreItem,
  onSendChatMessage,
  onActivateBuff,
  onAssaultOutpost,
  onAttackCoopBoss,
  onClaimCoopChest,
  onUpdateEmblem,
  onCreateNewClan,
  onPromoteMember,
  onDemoteMember,
  onKickMember,
  onWithdrawVaultRations,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('hall');
  const [showEmblemEditor, setShowEmblemEditor] = useState<boolean>(false);
  const [showCreateClanModal, setShowCreateClanModal] = useState<boolean>(false);
  const [showPermissionsMatrix, setShowPermissionsMatrix] = useState<boolean>(false);

  // Emblem Editing State
  const [draftEmblem, setDraftEmblem] = useState<ClanEmblem>(clan.emblem);

  // Clan Creation State
  const [newClanName, setNewClanName] = useState<string>('');
  const [newClanTag, setNewClanTag] = useState<string>('');
  const [newClanMotto, setNewClanMotto] = useState<string>('Glory to the Voxel Sovereigns!');
  const [newClanMinLevel, setNewClanMinLevel] = useState<number>(10);
  const [createError, setCreateError] = useState<string | null>(null);

  // Chat message input state
  const [chatInput, setChatInput] = useState<string>('');

  // Player's member object in clan (default to Aiden Skyrender)
  const currentMember = members.find((m) => m.id === 'cm_player') || members[0];
  const playerRole: ClanRole = currentMember ? currentMember.role : 'Leader';
  const playerPermissions = getRolePermissions(playerRole);

  // Sync draft emblem when clan changes
  useEffect(() => {
    setDraftEmblem(clan.emblem);
  }, [clan.emblem]);

  const DONATION_OPTIONS: {
    type: ResourceType;
    icon: string;
    label: string;
    amount: bigint;
    coins: bigint;
  }[] = [
    { type: 'wood', icon: '🌲', label: '100K Wood', amount: 100_000n, coins: 200n },
    { type: 'steel', icon: '⚔️', label: '80K Steel', amount: 80_000n, coins: 250n },
    { type: 'copper', icon: '🪙', label: '60K Copper', amount: 60_000n, coins: 220n },
    { type: 'grain', icon: '🌾', label: '120K Grain', amount: 120_000n, coins: 180n },
    { type: 'oil', icon: '🛢️', label: '50K Oil', amount: 50_000n, coins: 300n },
    { type: 'diamond', icon: '💎', label: '500 Diamonds', amount: 500n, coins: 1500n },
  ];

  const STORE_ITEMS = [
    {
      id: 'shield_24h',
      name: '24-Hour Imperial Aegis Shield',
      desc: 'Protects your castle and troops from enemy raids.',
      cost: 2_000n,
      icon: '🛡️',
    },
    {
      id: 'rally_boost',
      name: '1 Trillion Rally Capacity Horn',
      desc: 'Increases next rally capacity limit by +25%.',
      cost: 4_500n,
      icon: '📯',
    },
    {
      id: 'speedup_8h',
      name: '8-Hour Royal Speedup',
      desc: 'Instantly finishes troop training and building construction.',
      cost: 1_200n,
      icon: '⚡',
    },
    {
      id: 'divine_summon',
      name: 'Divine Hero Summon Pact',
      desc: 'Guarantees recruitment of a Mythic or Divine commander.',
      cost: 8_000n,
      icon: '📜',
    },
  ];

  const QUICK_PINGS = [
    { label: '⚔️ Rally Outpost', text: 'All legionnaires: rally on Dragon Spire Outpost immediately!' },
    { label: '🛡️ Fortify Citadel', text: 'Iron Citadel needs garrison reinforcements! Send Shieldbearers!' },
    { label: '🐉 Void Rift Strike', text: 'Void Leviathan rift is vulnerable! Launch coordinated strike!' },
    { label: '🎁 Vault Supplies', text: 'Alliance Vault needs resource contributions for upcoming war buffs!' },
  ];

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChatMessage(chatInput.trim());
    setChatInput('');
    sound.playSwing();
  };

  const handleQuickPing = (text: string) => {
    onSendChatMessage(text);
    sound.playSwing();
  };

  const handleSaveEmblem = () => {
    onUpdateEmblem(draftEmblem);
    setShowEmblemEditor(false);
    sound.playUpgradeFanfare();
  };

  const handleCreateClanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateClanCreation({
      name: newClanName,
      tag: newClanTag,
      minCastleLevel: newClanMinLevel,
    });
    if (!validation.valid) {
      setCreateError(validation.error || 'Invalid clan parameters.');
      return;
    }
    setCreateError(null);
    onCreateNewClan({
      name: newClanName.trim(),
      tag: newClanTag.trim().toUpperCase(),
      motto: newClanMotto.trim(),
      emblem: draftEmblem,
      minCastleLevel: newClanMinLevel,
    });
    setShowCreateClanModal(false);
    sound.playUpgradeFanfare();
  };

  const handleDonateAction = (opt: (typeof DONATION_OPTIONS)[0]) => {
    if (resources[opt.type] >= opt.amount) {
      sound.playUpgradeFanfare();
      onDonate(opt.type, opt.amount, opt.coins);
    }
  };

  const handleBuy = (item: (typeof STORE_ITEMS)[0]) => {
    if (clanCoins >= item.cost) {
      sound.playUpgradeFanfare();
      onBuyStoreItem(item.id, item.cost);
    }
  };

  // Cooperative Boss percentage
  const boss = clan.coopBoss;
  const bossHpPct = Math.max(0, Math.min(100, Number((boss.hp * 100n) / (boss.maxHp || 1n))));

  // Clan War data
  const war = clan.activeWar;
  const totalWarScore = war ? (war.playerClanScore + war.opponentClanScore || 1) : 1;
  const playerClanScorePct = war ? Math.round((war.playerClanScore / totalWarScore) * 100) : 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border-2 border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="relative px-4 sm:px-6 py-4 bg-gradient-to-r from-blue-950/90 via-slate-900 to-indigo-950/90 border-b border-blue-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ClanEmblemView emblem={clan.emblem} size="sm" showGlow />
              {playerPermissions.canEditEmblem && (
                <button
                  onClick={() => setShowEmblemEditor(true)}
                  className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-800 border border-blue-400 text-blue-300 hover:text-white hover:bg-blue-600 transition-colors shadow-sm"
                  title="Customize Heraldic Emblem"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold font-cinzel text-blue-100 flex items-center gap-1.5">
                  <span className="text-amber-400 font-mono">[{clan.tag}]</span> {clan.name}
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 font-mono font-bold">
                  Clan Lv.{clan.level}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono">
                  {clan.warsWon} Wars Won
                </span>
              </div>
              <p className="text-xs text-blue-200/70 truncate max-w-md mt-0.5">{clan.motto}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
              <Coins className="w-4 h-4 text-amber-400" />
              {formatBigInt(clanCoins)} Honor
            </div>
            {playerRole === 'Leader' && (
              <button
                onClick={() => setShowCreateClanModal(true)}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/50 text-blue-200 text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Found New Clan
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/70 px-4 sm:px-6 gap-1 sm:gap-2 pt-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'hall', label: 'Clan Hall', icon: Shield },
            { id: 'roles', label: `Legion (${members.length})`, icon: Users },
            { id: 'vault', label: 'Treasury & Buffs', icon: Gift },
            { id: 'war', label: 'Wars & Rift Raid', icon: Swords },
            { id: 'chat', label: 'Allied Dispatch', icon: MessageSquare },
            { id: 'tech', label: 'Alliance Tech', icon: Sparkles },
            { id: 'store', label: 'Honor Store', icon: ShoppingBag },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  sound.playSwing();
                }}
                className={`px-3 sm:px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-1.5 border-t-2 shrink-0 transition-all ${
                  active
                    ? 'bg-slate-900 border-blue-400 text-blue-200 shadow-inner'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-slate-200 space-y-5">
          {/* TAB 1: CLAN HALL */}
          {activeTab === 'hall' && (
            <div className="space-y-6">
              {/* Clan Overview Hero Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 flex flex-col sm:flex-row items-center gap-5 justify-between">
                <div className="flex items-center gap-5">
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-blue-500/40 shadow-lg">
                    <ClanEmblemView emblem={clan.emblem} size="lg" showGlow />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold font-cinzel text-white">[{clan.tag}] {clan.name}</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-mono font-bold">
                        Tier 8 Sovereign
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 italic">"{clan.motto}"</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-3 text-xs text-slate-400 font-mono">
                      <div>Leader: <span className="text-amber-300 font-bold">{clan.leader}</span></div>
                      <div>Members: <span className="text-blue-300 font-bold">{members.length} / {clan.maxMembers}</span></div>
                      <div>Min Castle: <span className="text-emerald-300 font-bold">Lv.{clan.minCastleLevel}</span></div>
                      <div>Policy: <span className="text-slate-200 capitalize font-bold">{clan.joinPolicy}</span></div>
                      <div>Total Might: <span className="text-amber-400 font-bold">{formatBigInt(clan.totalPower)}</span></div>
                      <div>War Record: <span className="text-rose-400 font-bold">{clan.warsWon} Victories</span></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
                  {playerPermissions.canEditEmblem && (
                    <button
                      onClick={() => setShowEmblemEditor(true)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 transition-all active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Heraldic Customizer
                    </button>
                  )}
                  <button
                    onClick={() => setShowPermissionsMatrix(true)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    Role Authority Matrix
                  </button>
                </div>
              </div>

              {/* Clan Quick Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1.5 text-amber-300"><Gift className="w-4 h-4" /> Alliance Vault</span>
                    <span className="font-mono">{formatBigInt(clan.vault.clanHonor)} Honor</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-white">
                    {formatBigInt(clan.vault.wood + clan.vault.steel + clan.vault.copper)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Shared materials pool ready for territory defense and war buffs.
                  </div>
                  <button
                    onClick={() => setActiveTab('vault')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 pt-1"
                  >
                    Open Treasury &rarr;
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1.5 text-rose-300"><Swords className="w-4 h-4" /> Active War</span>
                    <span className="font-mono text-emerald-400 font-bold">Leading</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-white flex items-center gap-2">
                    <span className="text-blue-400">{war?.playerClanScore || 0}</span>
                    <span className="text-slate-500">vs</span>
                    <span className="text-rose-400">{war?.opponentClanScore || 0}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Target: [{war?.opponentClan.tag || 'TITAN'}] {war?.opponentClan.name || 'Chronos Imperium'}
                  </div>
                  <button
                    onClick={() => setActiveTab('war')}
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 pt-1"
                  >
                    Outpost Assault &rarr;
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1.5 text-indigo-300"><Skull className="w-4 h-4" /> Void Leviathan</span>
                    <span className="font-mono text-amber-400 font-bold">{bossHpPct}% HP</span>
                  </div>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${bossHpPct}%` }} />
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {formatBigInt(boss.hp)} / {formatBigInt(boss.maxHp)} Health
                  </div>
                  <button
                    onClick={() => setActiveTab('war')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 pt-1"
                  >
                    Enter Raid Rift &rarr;
                  </button>
                </div>
              </div>

              {/* Active Territory Blessings Banner */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Active Alliance Blessings & Rations
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    {clan.activeBuffs.length} Active Buff{clan.activeBuffs.length === 1 ? '' : 's'}
                  </span>
                </div>
                {clan.activeBuffs.length === 0 ? (
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                    <span>No territory blessings currently active. Elder or Leader can activate blessings in Treasury.</span>
                    <button
                      onClick={() => setActiveTab('vault')}
                      className="px-3 py-1 rounded-md bg-blue-600/30 hover:bg-blue-600 text-blue-200 text-xs font-bold transition-colors"
                    >
                      Activate Blessings
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {clan.activeBuffs.map((buff) => (
                      <div
                        key={buff.id}
                        className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{buff.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-amber-200">{buff.name}</div>
                            <div className="text-[10px] text-slate-400">{buff.desc}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Active
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ROLES & PERMISSIONS */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" /> Clan Roster & Hierarchy
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your Authority: <span className="text-amber-300 font-bold">{playerRole}</span>. Manage promotions, demotions, and memberships according to Clan Law.
                  </p>
                </div>
                <button
                  onClick={() => setShowPermissionsMatrix(!showPermissionsMatrix)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/50 text-blue-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Info className="w-3.5 h-3.5" />
                  {showPermissionsMatrix ? 'Hide Authority Matrix' : 'View Authority Matrix'}
                </button>
              </div>

              {/* Permissions Matrix Accordion */}
              {showPermissionsMatrix && (
                <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-500/30 space-y-3 animate-in fade-in duration-150">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                    Clan Authority & Privileges Matrix
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2 pr-3">Privilege</th>
                          <th className="py-2 px-2 text-center text-amber-400">Leader</th>
                          <th className="py-2 px-2 text-center text-blue-400">Elder</th>
                          <th className="py-2 px-2 text-center text-indigo-400">Elite</th>
                          <th className="py-2 px-2 text-center text-slate-300">Member</th>
                          <th className="py-2 px-2 text-center text-slate-400">Recruit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        <tr>
                          <td className="py-1.5 pr-3">Declare Weekly Clan War</td>
                          <td className="text-center text-emerald-400">✓</td>
                          <td className="text-center text-slate-600">-</td>
                          <td className="text-center text-slate-600">-</td>
                          <td className="text-center text-slate-600">-</td>
                          <td className="text-center text-slate-600">-</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 pr-3">Trigger Territory War Blessings</td>
                          <td className="text-center text-emerald-400">✓</td>
                          <td className="text-center text-emerald-400">✓</td>
                          <td className="text-center text-slate-600">-</td>
                          <td className="text-center text-slate-600">-</td>
                          <td className="text-center text-slate-600">-</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 pr-3">Withdraw Daily Vault Rations</td>
                          <td className="text-center text-emerald-400">✓</td>
                          <td className="text-center text-emerald-400">✓</td>
                          <td className="text-center text-emerald-400">✓</td>
                          <td className="text-center text-slate-600">-</td>
                          <td className="text-center text-slate-600">-</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 pr-3">Promote / Demote Roster</td>
                          <td className="text-center text-emerald-400">✓ Full</td>
                          <td className="text-center text-emerald-400">✓ Limited</td>
                          <td className="text-center text-slate-600">-</td>
                          <td className="text-center text-slate-600">-</td>
                          <td className="text-center text-slate-600">-</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 pr-3">Discharge / Kick Members</td>
                          <td className="text-center text-emerald-400">✓ (All)</td>
                          <td className="text-center text-emerald-400">✓ (Lower)</td>
                          <td className="text-center text-slate-600">-</td>
                          <td className="text-center text-slate-600">-</td>
                          <td className="text-center text-slate-600">-</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 pr-3">Heraldic Emblem Customization</td>
                          <td className="text-center text-emerald-400">✓</td>
                          <td className="text-center text-slate-600">-</td>
                          <td className="text-center text-slate-600">-</td>
                          <td className="text-center text-slate-600">-</td>
                          <td className="text-center text-slate-600">-</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 pr-3">Post Official War Notices</td>
                          <td className="text-center text-emerald-400">✓</td>
                          <td className="text-center text-emerald-400">✓</td>
                          <td className="text-center text-slate-600">-</td>
                          <td className="text-center text-slate-600">-</td>
                          <td className="text-center text-slate-600">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Roster List */}
              <div className="space-y-2">
                {members.map((m) => {
                  const isSelf = m.id === 'cm_player' || m.name === 'Aiden Skyrender';
                  const canPromote = !isSelf && canPromoteMember(playerRole, m.role);
                  const canDemote = !isSelf && canDemoteMember(playerRole, m.role);
                  const canKick = !isSelf && canKickMember(playerRole, m.role);

                  const roleBadgeColor = {
                    Leader: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
                    Elder: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
                    Elite: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
                    Member: 'bg-slate-700 text-slate-200 border-slate-600',
                    Recruit: 'bg-slate-800 text-slate-400 border-slate-700',
                  }[m.role];

                  return (
                    <div
                      key={m.id}
                      className={`p-3 sm:p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                        isSelf
                          ? 'bg-blue-950/40 border-blue-400/60 ring-1 ring-blue-400/30'
                          : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800/90'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-700 shrink-0">
                          {m.avatar}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white">{m.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold ${roleBadgeColor}`}>
                              {m.role}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-400/40">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            Power: <span className="text-amber-300 font-bold">{formatBigInt(m.power)}</span> · Castle Lv.{m.castleLevel} · Donated {formatBigInt(m.donations)} · Joined {m.joinedDaysAgo}d ago
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <div className="flex items-center gap-1.5 mr-2">
                          <span className={`w-2 h-2 rounded-full ${m.online ? 'bg-emerald-400 shadow-xs shadow-emerald-400' : 'bg-slate-600'}`} />
                          <span className="text-[11px] text-slate-400 font-mono">{m.online ? 'Online' : 'Offline'}</span>
                        </div>

                        {/* Interactive Role Buttons */}
                        {canPromote && (
                          <button
                            onClick={() => {
                              onPromoteMember(m.id);
                              sound.playUpgradeFanfare();
                            }}
                            title={`Promote ${m.name}`}
                            className="p-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                            <span className="hidden md:inline text-[11px]">Promote</span>
                          </button>
                        )}
                        {canDemote && (
                          <button
                            onClick={() => {
                              onDemoteMember(m.id);
                              sound.playSwing();
                            }}
                            title={`Demote ${m.name}`}
                            className="p-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600 text-amber-200 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                            <span className="hidden md:inline text-[11px]">Demote</span>
                          </button>
                        )}
                        {canKick && (
                          <button
                            onClick={() => {
                              onKickMember(m.id);
                              sound.playSwing();
                            }}
                            title={`Kick ${m.name} from clan`}
                            className="p-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600 text-rose-200 border border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span className="hidden md:inline text-[11px]">Kick</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: VAULT & BUFFS */}
          {activeTab === 'vault' && (
            <div className="space-y-6">
              {/* Vault Treasury Status */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Gift className="w-5 h-5 text-amber-400" /> Alliance Treasury & Vault
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Contribute raw resources to reinforce the clan treasury and earn Honor Coins.
                    </p>
                  </div>
                  {playerPermissions.canWithdrawVault && (
                    <button
                      onClick={() => {
                        onWithdrawVaultRations();
                        sound.playUpgradeFanfare();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <Coins className="w-4 h-4" />
                      Claim Lord Daily Rations
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  {[
                    { label: 'Wood', val: clan.vault.wood, icon: '🌲', color: 'text-amber-300' },
                    { label: 'Steel', val: clan.vault.steel, icon: '⚔️', color: 'text-slate-300' },
                    { label: 'Copper', val: clan.vault.copper, icon: '🪙', color: 'text-amber-400' },
                    { label: 'Grain', val: clan.vault.grain, icon: '🌾', color: 'text-yellow-300' },
                    { label: 'Oil', val: clan.vault.oil, icon: '🛢️', color: 'text-emerald-400' },
                    { label: 'Diamonds', val: clan.vault.diamond, icon: '💎', color: 'text-cyan-300' },
                    { label: 'Clan Honor', val: clan.vault.clanHonor, icon: '🎖️', color: 'text-purple-300' },
                  ].map((res) => (
                    <div key={res.label} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
                      <div className="text-lg">{res.icon}</div>
                      <div className="text-[10px] text-slate-400">{res.label}</div>
                      <div className={`text-xs font-bold font-mono mt-0.5 ${res.color}`}>
                        {formatBigInt(res.val)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Territory War Blessings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Sovereign Territory Blessings
                    </h4>
                    <p className="text-xs text-slate-400">
                      Elders and Leaders can spend Clan Honor to empower all members across the realm.
                    </p>
                  </div>
                  <div className="text-xs font-mono text-amber-400 font-bold">
                    Vault Honor: {formatBigInt(clan.vault.clanHonor)} 🎖️
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {INITIAL_CLAN_BUFFS.map((buff) => {
                    const isActive = clan.activeBuffs.some((b) => b.id === buff.id);
                    const canAfford = clan.vault.clanHonor >= buff.costHonor;
                    const canActivate = playerPermissions.canTriggerBuffs && !isActive && canAfford;

                    return (
                      <div
                        key={buff.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                          isActive
                            ? 'bg-amber-950/30 border-amber-500/50 ring-1 ring-amber-500/30'
                            : 'bg-slate-800/60 border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-700">
                              {buff.icon}
                            </span>
                            <div>
                              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                                {buff.name}
                                {isActive && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">{buff.desc}</div>
                              <div className="text-[11px] text-slate-500 font-mono mt-1">
                                Duration: {buff.durationSeconds / 3600} Hours
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-mono font-bold text-amber-300">
                              {formatBigInt(buff.costHonor)} Honor
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (canActivate) {
                              onActivateBuff(buff);
                              sound.playUpgradeFanfare();
                            }
                          }}
                          disabled={!canActivate}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            isActive
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 cursor-default'
                              : canActivate
                              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 active:scale-95'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {isActive
                            ? 'Blessing Active'
                            : !playerPermissions.canTriggerBuffs
                            ? 'Requires Elder / Leader'
                            : !canAfford
                            ? 'Need More Vault Honor'
                            : 'Activate Territory Blessing'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resource Donations to Vault */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-blue-400" /> Lord Resource Supplies (Earn Personal Honor)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {DONATION_OPTIONS.map((opt) => {
                    const hasEnough = resources[opt.type] >= opt.amount;
                    return (
                      <div
                        key={opt.type}
                        className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{opt.icon}</span>
                            <div>
                              <div className="text-sm font-bold text-white">{opt.label}</div>
                              <div className="text-xs text-slate-400">
                                In stock: {formatBigInt(resources[opt.type])}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs font-mono font-bold text-amber-400">
                            +{formatBigInt(opt.coins)} 🪙
                          </div>
                        </div>

                        <button
                          onClick={() => handleDonateAction(opt)}
                          disabled={!hasEnough}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            hasEnough
                              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 active:scale-95'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Gift className="w-3.5 h-3.5" />
                          {hasEnough ? 'Contribute Supplies' : 'Need More Resources'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WARS & CO-OP RIFT */}
          {activeTab === 'war' && (
            <div className="space-y-6">
              {/* Clan War Outposts Section */}
              {war && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/50 via-slate-900 to-indigo-950/50 border border-rose-500/40 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/40 font-mono">
                          Clan War Season 4 Active
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Time Remaining: {Math.floor(war.timeRemainingSec / 60)}m
                        </span>
                      </div>
                      <h3 className="text-lg font-bold font-cinzel text-white mt-1">
                        [{clan.tag}] {clan.name} vs [{war.opponentClan.tag}] {war.opponentClan.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <ClanEmblemView emblem={clan.emblem} size="xs" />
                        <span className="text-xs font-bold text-blue-300 font-mono">
                          {war.playerClanScore} pts
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">VS</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-rose-300 font-mono">
                          {war.opponentClanScore} pts
                        </span>
                        <ClanEmblemView emblem={war.opponentClan.emblem} size="xs" />
                      </div>
                    </div>
                  </div>

                  {/* War Score Bar */}
                  <div className="w-full bg-rose-950 h-3 rounded-full overflow-hidden flex border border-slate-700">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${playerClanScorePct}%` }}
                    />
                    <div
                      className="bg-rose-500 h-full transition-all duration-300"
                      style={{ width: `${100 - playerClanScorePct}%` }}
                    />
                  </div>

                  {/* War Outposts Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {war.outposts.map((outpost) => {
                      const isPlayer = outpost.controlledBy === 'player_clan';
                      const isEnemy = outpost.controlledBy === 'enemy_clan';

                      return (
                        <div
                          key={outpost.id}
                          className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
                            isPlayer
                              ? 'bg-blue-950/40 border-blue-500/50'
                              : isEnemy
                              ? 'bg-rose-950/40 border-rose-500/50'
                              : 'bg-slate-800/60 border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <Swords className="w-3.5 h-3.5" /> {outpost.name}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.2 rounded font-mono font-bold ${
                                  isPlayer
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                                    : isEnemy
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                                    : 'bg-slate-700 text-slate-300'
                                }`}
                              >
                                {isPlayer ? 'Held by Clan' : isEnemy ? 'Enemy Garrison' : 'Contested Neutral'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-2 space-y-0.5">
                              <div>Defense: <span className="text-amber-300">{formatBigInt(outpost.defenseRating)}</span></div>
                              <div>Garrison: <span className="text-slate-200">{formatBigInt(outpost.garrisonTroops)} Troops</span></div>
                              <div>Output: <span className="text-emerald-400">+{outpost.pointsPerMinute} pts/min</span></div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onAssaultOutpost(outpost.id);
                              sound.playUpgradeFanfare();
                            }}
                            className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                              isPlayer
                                ? 'bg-blue-600/40 hover:bg-blue-600 text-blue-200 border border-blue-400/40'
                                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 active:scale-95'
                            }`}
                          >
                            {isPlayer ? 'Reinforce Outpost' : 'Launch Siege Assault'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Co-op Boss Challenge Section */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/40 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl p-2 rounded-2xl bg-slate-950 border border-indigo-500/40">
                      {boss.avatar}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold font-cinzel text-white">{boss.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold border border-purple-400/40">
                          Lv.{boss.level} Raid Rift
                        </span>
                      </div>
                      <p className="text-xs text-indigo-200/70">{boss.title}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const strikeDmg = calculateCoopBossStrike(playerPower, 50_000_000n, 15);
                      onAttackCoopBoss(strikeDmg);
                      sound.playUpgradeFanfare();
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-mono shadow-md shadow-purple-600/30 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Flame className="w-4 h-4 text-amber-300" />
                    Strike Leviathan
                  </button>
                </div>

                {/* Boss Health Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span className="text-purple-300">Void Energy Shield</span>
                    <span className="text-amber-400">{formatBigInt(boss.hp)} / {formatBigInt(boss.maxHp)} ({bossHpPct}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className="bg-gradient-to-r from-purple-600 via-indigo-500 to-amber-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${bossHpPct}%` }}
                    />
                  </div>
                </div>

                {/* Milestone Chests */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300">Co-op Milestone Chests:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {boss.rewardChests.map((chest) => {
                      const unlocked = bossHpPct <= chest.milestonePct;
                      return (
                        <div
                          key={chest.milestonePct}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                            chest.claimed
                              ? 'bg-slate-900/60 border-slate-800 text-slate-500'
                              : unlocked
                              ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                              : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
                          }`}
                        >
                          <div>
                            <div className="font-bold flex items-center gap-1">
                              🎁 {chest.milestonePct}% HP Mark
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {formatBigInt(chest.diamonds)} 💎 + {formatBigInt(chest.honor)} 🎖️
                            </div>
                          </div>
                          {chest.claimed ? (
                            <span className="text-[10px] text-slate-500 font-bold">Claimed</span>
                          ) : unlocked ? (
                            <button
                              onClick={() => {
                                onClaimCoopChest(chest.milestonePct, chest.diamonds, chest.honor);
                                sound.playUpgradeFanfare();
                              }}
                              className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] shadow-sm transition-all"
                            >
                              Claim
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500">Locked</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Damage Leaderboard in Clan */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Raid Contribution Records
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    {boss.totalClanContributions.map((c, i) => (
                      <div key={c.memberName} className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-300">#{i + 1} {c.memberName}</span>
                        <span className="text-amber-400 font-bold">{formatBigInt(c.damage)} DMG</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ALLIED CHAT */}
          {activeTab === 'chat' && (
            <div className="space-y-4 flex flex-col h-[60vh] max-h-[500px]">
              {/* Quick Tactical Pings */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0">
                {QUICK_PINGS.map((ping) => (
                  <button
                    key={ping.label}
                    onClick={() => handleQuickPing(ping.text)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold whitespace-nowrap transition-all"
                  >
                    {ping.label}
                  </button>
                ))}
              </div>

              {/* Chat Messages Feed */}
              <div className="flex-1 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                {chatMessages.map((msg) => {
                  if (msg.isSystemNotice) {
                    return (
                      <div
                        key={msg.id}
                        className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/30 flex items-center gap-2.5 text-xs text-blue-200"
                      >
                        <span className="text-lg shrink-0">{msg.senderAvatar}</span>
                        <div className="flex-1">
                          <span className="px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-300 font-mono text-[10px] font-bold mr-1.5">
                            {msg.tag || 'SYSTEM'}
                          </span>
                          <span>{msg.message}</span>
                        </div>
                      </div>
                    );
                  }

                  const isMe = msg.senderName === 'Aiden Skyrender' || msg.senderId === 'cm_player';
                  const roleColor = {
                    Leader: 'text-amber-400',
                    Elder: 'text-blue-400',
                    Elite: 'text-purple-400',
                    Member: 'text-slate-300',
                    Recruit: 'text-slate-400',
                  }[msg.senderRole];

                  return (
                    <div
                      key={msg.id}
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                        isMe
                          ? 'bg-blue-950/30 border-blue-500/40 ml-4'
                          : 'bg-slate-900/60 border-slate-800 mr-4'
                      }`}
                    >
                      <span className="text-2xl p-1 rounded-lg bg-slate-800 border border-slate-700 shrink-0">
                        {msg.senderAvatar}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{msg.senderName}</span>
                          <span className={`text-[10px] font-mono font-bold ${roleColor}`}>
                            [{msg.senderRole}]
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono ml-auto">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 mt-1 break-words">{msg.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Field */}
              <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Send tactical dispatch as [${playerRole}] ${clan.leader}...`}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-400"
                  maxLength={120}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    chatInput.trim()
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dispatch</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 6: CLAN TECH */}
          {activeTab === 'tech' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Troop Attack Research</span>
                    <span className="text-xs font-mono text-amber-400">Lv.{clan.techLevel.troopAttack}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Increases ATK rating for all clan Shieldbearers, Shooters, and Bombers by +{clan.techLevel.troopAttack * 2.5}%.
                  </p>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${(clan.techLevel.troopAttack / 20) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Troop Defense Bulwark</span>
                    <span className="text-xs font-mono text-amber-400">Lv.{clan.techLevel.troopDefense}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Increases DEF & HP rating by +{clan.techLevel.troopDefense * 2.5}% across all tiers.
                  </p>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${(clan.techLevel.troopDefense / 20) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Resource Harvest Extraction</span>
                    <span className="text-xs font-mono text-amber-400">Lv.{clan.techLevel.gatherSpeed}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Accelerates gathering from open world Wood, Steel, Copper, Diamond, Grain, and Oil nodes by +{clan.techLevel.gatherSpeed * 4}%.
                  </p>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${(clan.techLevel.gatherSpeed / 20) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Grand Rally Expansion</span>
                    <span className="text-xs font-mono text-amber-400">Lv.{clan.techLevel.rallyCapacity}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Scales maximum World Titan rally member capacity towards 1 Trillion troops limit.
                  </p>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full"
                      style={{ width: `${(clan.techLevel.rallyCapacity / 20) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: HONOR STORE */}
          {activeTab === 'store' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STORE_ITEMS.map((item) => {
                  const canBuy = clanCoins >= item.cost;
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-700">
                          {item.icon}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-white">{item.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleBuy(item)}
                        disabled={!canBuy}
                        className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold shrink-0 transition-all ${
                          canBuy
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95 shadow-md shadow-amber-500/20'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {formatBigInt(item.cost)} 🪙
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* EMBLEM CUSTOMIZER MODAL */}
        {showEmblemEditor && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md p-4 sm:p-6 overflow-y-auto flex flex-col justify-between animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold font-cinzel text-white">Heraldic Emblem Workshop</h3>
              </div>
              <button
                onClick={() => setShowEmblemEditor(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
              {/* Preview */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900 border border-slate-800">
                <ClanEmblemView emblem={draftEmblem} size="xl" showGlow />
                <div className="text-center mt-4">
                  <div className="text-base font-bold text-white font-cinzel">[{clan.tag}] {clan.name}</div>
                  <div className="text-xs text-slate-400 capitalize mt-1 font-mono">
                    {draftEmblem.shape} · {draftEmblem.sigil} · {draftEmblem.borderStyle.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Customization Controls */}
              <div className="md:col-span-2 space-y-4">
                {/* Shape Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-300 font-mono uppercase block mb-1.5">
                    Heraldic Shield Shape
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {SHAPES.map((shape) => (
                      <button
                        key={shape}
                        type="button"
                        onClick={() => setDraftEmblem((prev) => ({ ...prev, shape }))}
                        className={`p-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                          draftEmblem.shape === shape
                            ? 'bg-blue-600 border-blue-400 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {shape}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sigil Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-300 font-mono uppercase block mb-1.5">
                    Center Sigil Emblem
                  </label>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {SIGILS.map((sigil) => (
                      <button
                        key={sigil}
                        type="button"
                        onClick={() => setDraftEmblem((prev) => ({ ...prev, sigil }))}
                        className={`p-2 rounded-xl text-sm border flex items-center justify-center transition-all ${
                          draftEmblem.sigil === sigil
                            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/30'
                            : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <ClanEmblemView emblem={{ ...draftEmblem, sigil }} size="xs" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary & Secondary Color Palettes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 font-mono uppercase block mb-1.5">
                      Primary Heraldic Tint
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PALETTE.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setDraftEmblem((prev) => ({ ...prev, primaryColor: color }))}
                          style={{ backgroundColor: color }}
                          className={`w-7 h-7 rounded-lg border transition-all ${
                            draftEmblem.primaryColor === color ? 'ring-2 ring-white scale-110' : 'border-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 font-mono uppercase block mb-1.5">
                      Secondary Gradient Accent
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PALETTE.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setDraftEmblem((prev) => ({ ...prev, secondaryColor: color }))}
                          style={{ backgroundColor: color }}
                          className={`w-7 h-7 rounded-lg border transition-all ${
                            draftEmblem.secondaryColor === color ? 'ring-2 ring-white scale-110' : 'border-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Border Style */}
                <div>
                  <label className="text-xs font-bold text-slate-300 font-mono uppercase block mb-1.5">
                    Frame & Trim Style
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BORDER_STYLES.map((borderStyle) => (
                      <button
                        key={borderStyle}
                        type="button"
                        onClick={() => setDraftEmblem((prev) => ({ ...prev, borderStyle }))}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                          draftEmblem.borderStyle === borderStyle
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {borderStyle.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowEmblemEditor(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEmblem}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30"
              >
                Inscribe Emblem
              </button>
            </div>
          </div>
        )}

        {/* CLAN CREATION MODAL */}
        {showCreateClanModal && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md p-4 sm:p-6 overflow-y-auto flex flex-col justify-between animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold font-cinzel text-white">Found a Sovereign Clan</h3>
              </div>
              <button
                onClick={() => setShowCreateClanModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClanSubmit} className="space-y-4 py-4">
              {createError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 font-mono uppercase block mb-1">
                    Clan Name (3 - 24 Characters)
                  </label>
                  <input
                    type="text"
                    value={newClanName}
                    onChange={(e) => setNewClanName(e.target.value)}
                    placeholder="e.g. Ironclad Dominion"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 font-mono uppercase block mb-1">
                    Clan Tag (2 - 6 Letters)
                  </label>
                  <input
                    type="text"
                    value={newClanTag}
                    onChange={(e) => setNewClanTag(e.target.value.toUpperCase())}
                    placeholder="e.g. IRON"
                    maxLength={6}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono uppercase text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 font-mono uppercase block mb-1">
                  Clan Motto / War Cry
                </label>
                <input
                  type="text"
                  value={newClanMotto}
                  onChange={(e) => setNewClanMotto(e.target.value)}
                  placeholder="e.g. Unbroken and Unyielding!"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 font-mono uppercase block mb-1">
                  Minimum Castle Level Requirement ({newClanMinLevel})
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newClanMinLevel}
                  onChange={(e) => setNewClanMinLevel(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Emblem Preview & Quick Edit */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ClanEmblemView emblem={draftEmblem} size="md" showGlow />
                  <div>
                    <div className="text-xs font-bold text-white">Default Clan Heraldry</div>
                    <div className="text-[11px] text-slate-400">Can be refined further anytime in the Workshop</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmblemEditor(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-200 border border-blue-400/40 text-xs font-bold"
                >
                  Customize Heraldry
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateClanModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono shadow-md shadow-amber-500/20"
                >
                  Found Clan (500 💎)
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
