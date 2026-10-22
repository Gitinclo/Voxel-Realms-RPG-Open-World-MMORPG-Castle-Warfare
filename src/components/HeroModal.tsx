/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Award, Shield, Swords, Sparkles, Star, ChevronRight } from 'lucide-react';
import { Hero, HeroRarity } from '../types/game';
import { formatBigInt } from '../game/math';
import { sound } from '../game/audio';

interface HeroModalProps {
  heroes: Hero[];
  playerExp: bigint;
  diamonds: bigint;
  onLevelUpHero: (heroId: string) => void;
  onRecruitHero: () => void;
  onClose: () => void;
}

export const HeroModal: React.FC<HeroModalProps> = ({
  heroes,
  playerExp,
  diamonds,
  onLevelUpHero,
  onRecruitHero,
  onClose,
}) => {
  const [selectedHeroId, setSelectedHeroId] = useState<string>(heroes[0]?.id || '');

  const hero = heroes.find((h) => h.id === selectedHeroId) || heroes[0];

  const getRarityBadge = (rarity: HeroRarity) => {
    switch (rarity) {
      case 'divine':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'mythic':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
      case 'legendary':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'epic':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50';
      case 'rare':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/50';
    }
  };

  const levelCost = BigInt(hero ? hero.level * 2500 : 1000);
  const canLevelUp = playerExp >= levelCost;

  const handleLevelUp = () => {
    if (hero && canLevelUp) {
      sound.playLevelUp();
      onLevelUpHero(hero.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-indigo-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border-b border-indigo-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/50 text-indigo-400">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-cinzel text-indigo-100 flex items-center gap-2">
                Hall of Champions
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 font-mono">
                  Hero Ranks: Rare to Divine
                </span>
              </h2>
              <p className="text-xs text-indigo-200/70">
                Commanders who lead your T1-T20 legions and bolster army rally strength
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
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 text-slate-200">
          {/* Hero Roster List Column */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Your Commanders ({heroes.length})</span>
              <button
                onClick={() => {
                  sound.playUpgradeFanfare();
                  onRecruitHero();
                }}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
              >
                <Sparkles className="w-3.5 h-3.5" /> Summon Hero (500💎)
              </button>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {heroes.map((h) => {
                const isSelected = h.id === selectedHeroId;
                return (
                  <button
                    key={h.id}
                    onClick={() => {
                      setSelectedHeroId(h.id);
                      sound.playSwing();
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-400 ring-2 ring-indigo-500/30'
                        : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl p-2 rounded-lg bg-slate-900 border border-slate-700">
                        {h.avatarIcon}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          {h.name}
                          <span
                            className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded border ${getRarityBadge(
                              h.rarity
                            )}`}
                          >
                            {h.rarity}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          Level {h.level} · {formatBigInt(h.power)} Power
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 ${isSelected ? 'text-indigo-400' : 'text-slate-600'}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Hero Details Column */}
          {hero && (
            <div className="md:col-span-7 space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/90 via-slate-900 to-slate-950 border border-slate-700 space-y-4">
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3.5">
                    <div className="text-4xl p-3 rounded-2xl bg-slate-800 border border-slate-600">
                      {hero.avatarIcon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-cinzel text-white flex items-center gap-2">
                        {hero.name}
                        <span
                          className={`text-xs uppercase font-mono px-2 py-0.5 rounded border ${getRarityBadge(
                            hero.rarity
                          )}`}
                        >
                          {hero.rarity}
                        </span>
                      </h3>
                      <div className="text-xs text-indigo-300 font-medium">{hero.title}</div>
                      <div className="flex items-center gap-1 mt-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < hero.star ? 'fill-amber-400' : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Total Hero Might</div>
                    <div className="text-lg font-bold font-mono text-amber-300">
                      {formatBigInt(hero.power)}
                    </div>
                  </div>
                </div>

                {/* Troop Specialty & Stat Bonuses */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400">Army Leadership Multipliers</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-center">
                      <div className="text-[11px] text-rose-400 font-semibold">Troop ATK</div>
                      <div className="text-base font-bold font-mono text-white">
                        +{hero.statBonus.attackBonusPct}%
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-center">
                      <div className="text-[11px] text-blue-400 font-semibold">Troop DEF</div>
                      <div className="text-base font-bold font-mono text-white">
                        +{hero.statBonus.defenseBonusPct}%
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-center">
                      <div className="text-[11px] text-emerald-400 font-semibold">Troop HP</div>
                      <div className="text-base font-bold font-mono text-white">
                        +{hero.statBonus.hpBonusPct}%
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-center">
                      <div className="text-[11px] text-purple-400 font-semibold">Rally Cap</div>
                      <div className="text-base font-bold font-mono text-white">
                        +{hero.statBonus.rallyBonusPct}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Unique Ultimate Skill */}
                <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30">
                  <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Ultimate Skill: {hero.skillName}
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">{hero.skillDesc}</div>
                </div>
              </div>

              {/* Level Up Button */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Upgrade Cost</div>
                  <div className="text-sm font-mono font-bold text-white">
                    {formatBigInt(levelCost)} Realm EXP{' '}
                    <span className="text-xs text-slate-400 font-normal">
                      (You have: {formatBigInt(playerExp)})
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLevelUp}
                  disabled={!canLevelUp}
                  className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
                    canLevelUp
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Swords className="w-4 h-4" />
                  Level Up to {hero.level + 1}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
