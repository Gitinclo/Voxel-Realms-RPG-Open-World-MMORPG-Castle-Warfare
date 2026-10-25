/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Award, Swords, Sparkles, Star, ChevronRight, Palette, Check } from 'lucide-react';
import { Hero, HeroRarity } from '../types/game';
import {
  HeroSkinId,
  generateAuraParticles,
  getHeroSkinsForHero,
  resolveHeroActiveSkin,
} from '../game/heroSkins';
import { formatBigInt } from '../game/math';
import { sound } from '../game/audio';

interface HeroModalProps {
  heroes: Hero[];
  playerExp: bigint;
  diamonds: bigint;
  onLevelUpHero: (heroId: string) => void;
  onRecruitHero: () => void;
  onSelectHeroSkin?: (heroId: string, skinId: HeroSkinId) => void;
  onClose: () => void;
}

export const HeroModal: React.FC<HeroModalProps> = ({
  heroes,
  playerExp,
  diamonds: _diamonds,
  onLevelUpHero,
  onRecruitHero,
  onSelectHeroSkin,
  onClose,
}) => {
  const [selectedHeroId, setSelectedHeroId] = useState<string>(heroes[0]?.id || '');

  const hero = heroes.find((h) => h.id === selectedHeroId) || heroes[0];
  const activeSkin = hero ? resolveHeroActiveSkin(hero) : null;
  const availableSkins = hero ? getHeroSkinsForHero(hero) : [];
  const auraParticles = activeSkin ? generateAuraParticles(activeSkin.id) : [];

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

  const handleSkinSelect = (skinId: HeroSkinId) => {
    if (!hero) return;
    sound.playSwing();
    onSelectHeroSkin?.(hero.id, skinId);
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
                Commanders who lead your T1-T20 legions, custom aesthetic skins &amp; particle auras
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
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Summon Hero (500💎)
              </button>
            </div>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {heroes.map((h) => {
                const isSelected = h.id === selectedHeroId;
                const hSkin = resolveHeroActiveSkin(h);
                return (
                  <button
                    key={h.id}
                    data-testid={`roster-hero-card-${h.id}`}
                    onClick={() => {
                      setSelectedHeroId(h.id);
                      sound.playSwing();
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-400 ring-2 ring-indigo-500/30'
                        : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`relative text-2xl p-2 rounded-lg bg-slate-900 border ${hSkin.ringBorderClass}`}
                        data-testid={`roster-hero-icon-${h.id}`}
                      >
                        <span>{h.avatarIcon}</span>
                        <span className="absolute -top-1.5 -right-1.5 text-[10px]">
                          {hSkin.particleSymbols[0]}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                          <span>{h.name}</span>
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
                        <div className="text-[10px] text-indigo-300/90 font-mono mt-0.5">
                          Skin: {hSkin.name} ({hSkin.auraName})
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
          {hero && activeSkin && (
            <div className="md:col-span-7 space-y-4">
              <div
                className={`p-4 rounded-xl bg-gradient-to-br ${activeSkin.stageGradientClass} border border-slate-700 space-y-4 transition-all duration-300`}
              >
                <div className="flex items-start justify-between border-b border-slate-800/80 pb-4 gap-3 flex-wrap">
                  <div className="flex items-center gap-4">
                    {/* Dynamic Hero Portrait + Particle Aura Stage */}
                    <div
                      data-testid="hero-aura-stage"
                      data-skin-id={activeSkin.id}
                      data-aura-type={activeSkin.auraType}
                      className={`relative w-20 h-20 rounded-2xl bg-slate-950/90 border-2 ${activeSkin.ringBorderClass} shadow-lg flex items-center justify-center overflow-hidden shrink-0`}
                    >
                      {/* Animated Concentric Particle Aura Rings */}
                      <div
                        className={`absolute inset-1 rounded-xl border ${activeSkin.ringBorderClass} opacity-60 animate-pulse`}
                      />
                      <div
                        className={`absolute inset-2.5 rounded-full border border-dashed ${activeSkin.ringBorderClass} opacity-45 animate-spin`}
                      />

                      {/* Dynamic Particle Aura Emitter Motes */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        data-testid="hero-aura-particles-container"
                      >
                        {auraParticles.map((p, idx) => {
                          const posClasses = [
                            'top-0.5 left-1.5',
                            'top-0.5 right-1.5',
                            'bottom-0.5 left-1.5',
                            'bottom-0.5 right-1.5',
                            'top-1/2 left-0.5 -translate-y-1/2',
                            'top-1/2 right-0.5 -translate-y-1/2',
                            'top-0.5 left-1/2 -translate-x-1/2',
                            'bottom-0.5 left-1/2 -translate-x-1/2',
                            'top-2 left-2',
                            'bottom-2 right-2',
                          ];
                          return (
                            <span
                              key={p.id}
                              data-testid="hero-aura-particle"
                              className={`absolute text-[11px] animate-bounce select-none ${
                                posClasses[idx % posClasses.length]
                              }`}
                            >
                              {p.symbol}
                            </span>
                          );
                        })}
                      </div>

                      {/* Dynamically Swapped Hero Icon */}
                      <span
                        data-testid="selected-hero-avatar-icon"
                        className="relative z-10 text-4xl drop-shadow-md transition-transform duration-200 scale-105"
                      >
                        {hero.avatarIcon}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold font-cinzel text-white flex items-center gap-2 flex-wrap">
                        <span>{hero.name}</span>
                        <span
                          className={`text-xs uppercase font-mono px-2 py-0.5 rounded border ${getRarityBadge(
                            hero.rarity
                          )}`}
                        >
                          {hero.rarity}
                        </span>
                      </h3>
                      <div className="text-xs text-indigo-300 font-medium">{hero.title}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < hero.star ? 'fill-amber-400' : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span
                          data-testid="active-hero-aura-name"
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${activeSkin.badgeClass}`}
                        >
                          {activeSkin.particleSymbols[0]} {activeSkin.auraName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Total Hero Might</div>
                    <div className="text-lg font-bold font-mono text-amber-300">
                      {formatBigInt(hero.power)}
                    </div>
                    <div
                      className="text-[11px] font-mono text-slate-300 mt-0.5"
                      data-testid="active-hero-skin-name"
                    >
                      {activeSkin.name}
                    </div>
                  </div>
                </div>

                {/* Visual Customization Section: Aesthetic Skins & Particle Auras */}
                <div
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/30 space-y-2.5"
                  data-testid="hero-skin-customization-section"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-amber-400" />
                      <span>Visual Customization · Aesthetic Skins &amp; Particle Auras</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {activeSkin.auraDescription}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {availableSkins.map((skin) => {
                      const isEquipped = activeSkin.id === skin.id;
                      return (
                        <button
                          key={skin.id}
                          type="button"
                          data-testid={`hero-skin-btn-${skin.id}`}
                          aria-pressed={isEquipped}
                          onClick={() => handleSkinSelect(skin.id)}
                          className={`relative p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all cursor-pointer ${
                            isEquipped
                              ? `${skin.badgeClass} ring-2 ring-amber-400/50 shadow-md`
                              : 'bg-slate-900/90 border-slate-800 hover:border-slate-600 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-2xl">{skin.resolvedIcon}</span>
                            <span className="text-xs font-mono">
                              {skin.particleSymbols.slice(0, 2).join('')}
                            </span>
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-white leading-tight">
                              {skin.name}
                            </div>
                            <div className="text-[9px] font-mono text-slate-400 truncate mt-0.5">
                              {skin.auraName}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[9px] font-mono font-bold">
                            {isEquipped ? (
                              <span className="text-amber-300 flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> EQUIPPED
                              </span>
                            ) : (
                              <span className="text-slate-400">EQUIP SKIN</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Troop Specialty & Stat Bonuses */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400">
                    Army Leadership Multipliers
                  </div>
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
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer'
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
