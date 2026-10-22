/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Trophy, Medal, Crown, Flame, Castle, Swords, Shield } from 'lucide-react';
import { LeaderboardEntry, ClanLeaderboardEntry } from '../types/game';
import { formatBigInt } from '../game/math';
import { INITIAL_CLAN_LEADERBOARD } from '../game/initialData';
import { sound } from '../game/audio';
import { ClanEmblemView } from './ClanEmblemView';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  clanEntries?: ClanLeaderboardEntry[];
  playerPower: bigint;
  playerCastleLevel: number;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  entries,
  clanEntries = INITIAL_CLAN_LEADERBOARD,
  playerPower,
  playerCastleLevel,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'power' | 'castle' | 'monsters' | 'clans'>('power');

  const sortedPlayerEntries = [...entries].sort((a, b) => {
    if (activeTab === 'power') {
      return a.power > b.power ? -1 : 1;
    }
    if (activeTab === 'castle') {
      return b.castleLevel - a.castleLevel;
    }
    return b.monstersSlain - a.monstersSlain;
  });

  const sortedClanEntries = [...clanEntries].sort((a, b) => (a.totalPower > b.totalPower ? -1 : 1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-400">
              <Trophy className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-cinzel text-amber-100 flex items-center gap-2">
                Imperial Hall of Fame
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono">
                  Realm Rankings
                </span>
              </h2>
              <p className="text-xs text-amber-200/70">
                Top Realm Lords, Clan Sovereigns, and Titan Slayers
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

        {/* Filter Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 sm:px-6 gap-2 pt-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'power', label: 'Lord Might', icon: Crown },
            { id: 'clans', label: 'Clan Sovereigns', icon: Shield },
            { id: 'castle', label: 'Fortification', icon: Castle },
            { id: 'monsters', label: 'Titan Kills', icon: Swords },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab);
                  sound.playSwing();
                }}
                className={`px-3 sm:px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-t-2 shrink-0 transition-all ${
                  active
                    ? 'bg-slate-900 border-amber-400 text-amber-200'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 text-slate-200">
          {/* Clan Sovereigns Tab */}
          {activeTab === 'clans' ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs text-blue-200">
                <span>Rankings determined by total clan member might, territory outposts held, and war victories.</span>
                <span className="font-mono font-bold text-amber-300">Season 4 Active</span>
              </div>

              {sortedClanEntries.map((clanEntry, idx) => {
                const rank = idx + 1;
                const isTop3 = rank <= 3;
                const isPlayerClan = clanEntry.isPlayerClan || clanEntry.tag === 'VALOR';

                return (
                  <div
                    key={clanEntry.id}
                    className={`p-3 sm:p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                      isPlayerClan
                        ? 'bg-blue-950/40 border-blue-400/80 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10'
                        : isTop3
                        ? 'bg-slate-800/80 border-slate-700'
                        : 'bg-slate-900/60 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black font-mono text-sm shrink-0 ${
                          rank === 1
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                            : rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : rank === 3
                            ? 'bg-amber-700 text-amber-100'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                      </div>

                      {/* Clan Heraldic Emblem */}
                      <ClanEmblemView emblem={clanEntry.emblem} size="sm" showGlow={isTop3} />

                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-amber-400">[{clanEntry.tag}]</span>
                          {clanEntry.name}
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-mono font-bold">
                            Lv.{clanEntry.level}
                          </span>
                          {isPlayerClan && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold">
                              YOUR CLAN
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>Leader: {clanEntry.leader}</span>
                          <span>·</span>
                          <span>{clanEntry.memberCount}/{clanEntry.maxMembers} Members</span>
                          <span>·</span>
                          <span className="text-emerald-400 font-semibold">{clanEntry.territoryOutposts} Outposts</span>
                          <span>·</span>
                          <span className="text-amber-400 font-semibold">{clanEntry.warsWon} Wars Won</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right self-end sm:self-center shrink-0">
                      <div className="text-xs text-slate-400">Total Clan Might</div>
                      <div className="text-base font-bold font-mono text-amber-300">
                        {formatBigInt(clanEntry.totalPower)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Player Individual Tabs */
            sortedPlayerEntries.map((entry, idx) => {
              const rank = idx + 1;
              const isTop3 = rank <= 3;
              const isPlayer = entry.isPlayer;

              return (
                <div
                  key={entry.name}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isPlayer
                      ? 'bg-amber-950/40 border-amber-400/80 ring-2 ring-amber-500/20'
                      : isTop3
                      ? 'bg-slate-800/80 border-slate-700'
                      : 'bg-slate-900/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black font-mono text-sm shrink-0 ${
                        rank === 1
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                          : rank === 2
                          ? 'bg-slate-300 text-slate-950'
                          : rank === 3
                          ? 'bg-amber-700 text-amber-100'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                    </div>

                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="font-mono text-xs text-amber-400">[{entry.clanTag}]</span>
                        {entry.name}
                        {isPlayer && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        Castle Level {entry.castleLevel} · {formatBigInt(entry.troopsTotal)} Troops · {entry.monstersSlain} Titans Slain
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">
                      {activeTab === 'power' ? 'Combat Might' : activeTab === 'castle' ? 'Fortification Level' : 'Monsters Slain'}
                    </div>
                    <div className="text-base font-bold font-mono text-amber-300">
                      {activeTab === 'power'
                        ? formatBigInt(entry.power)
                        : activeTab === 'castle'
                        ? `Lv. ${entry.castleLevel}`
                        : `${entry.monstersSlain} Titans`}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
