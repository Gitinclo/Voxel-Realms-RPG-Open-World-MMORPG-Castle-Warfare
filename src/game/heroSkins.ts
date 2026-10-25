/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Hero, TroopType } from '../types/game';

export type HeroSkinId =
  'default' | 'solar_seraph' | 'abyssal_void' | 'celestial_jade' | 'bloodmoon_fiend';

export type HeroParticleAuraType =
  | 'valiant_radiance'
  | 'solar_flare_embers'
  | 'void_singularity_vortex'
  | 'jade_spirit_lotus'
  | 'crimson_lightning_tempest';

export interface HeroSkinConfig {
  id: HeroSkinId;
  name: string;
  subtitle: string;
  auraType: HeroParticleAuraType;
  auraName: string;
  auraDescription: string;
  primaryColorHex: string;
  secondaryColorHex: string;
  stageGradientClass: string;
  ringBorderClass: string;
  badgeClass: string;
  particleSymbols: [string, string, string];
  particleCount: number;
  orbitSpeedSec: number;
  heroIconMap: Record<string, string>;
  specialtyFallbackIcons: Record<TroopType, string>;
}

export interface AuraParticleDescriptor {
  id: string;
  symbol: string;
  angleDeg: number;
  radiusPx: number;
  durationSec: number;
  delaySec: number;
  scale: number;
}

export const HERO_SKIN_CATALOG: Record<HeroSkinId, HeroSkinConfig> = {
  default: {
    id: 'default',
    name: 'Sovereign Vanguard',
    subtitle: 'Original Imperial Regalia',
    auraType: 'valiant_radiance',
    auraName: 'Valiant Radiance Aura',
    auraDescription: 'Standard imperial command halo with steady golden starlight motes.',
    primaryColorHex: '#6366f1',
    secondaryColorHex: '#38bdf8',
    stageGradientClass: 'from-indigo-950/90 via-slate-900 to-slate-950',
    ringBorderClass: 'border-indigo-400/60 shadow-indigo-500/30',
    badgeClass: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/50',
    particleSymbols: ['✨', '⭐', '💠'],
    particleCount: 6,
    orbitSpeedSec: 8,
    heroIconMap: {
      hero_arthur: '🛡️',
      hero_lyra: '🏹',
      hero_ignis: '💣',
      hero_valkyrie: '⚡',
    },
    specialtyFallbackIcons: {
      shieldbearer: '🛡️',
      shooter: '🏹',
      bomber: '🔮',
    },
  },
  solar_seraph: {
    id: 'solar_seraph',
    name: 'Solar Seraphim',
    subtitle: '4000-Nit Sunforged Ascendant',
    auraType: 'solar_flare_embers',
    auraName: 'Solar Flare Corona',
    auraDescription: 'Blazing golden phoenix feathers and rising sunfire embers.',
    primaryColorHex: '#f59e0b',
    secondaryColorHex: '#fef08a',
    stageGradientClass: 'from-amber-950/90 via-orange-950/60 to-slate-950',
    ringBorderClass: 'border-amber-400/80 shadow-amber-500/40',
    badgeClass: 'bg-amber-500/25 text-amber-200 border-amber-400/60',
    particleSymbols: ['☀️', '🔥', '✨'],
    particleCount: 8,
    orbitSpeedSec: 5,
    heroIconMap: {
      hero_arthur: '☀️',
      hero_lyra: '🦅',
      hero_ignis: '☄️',
      hero_valkyrie: '👼',
    },
    specialtyFallbackIcons: {
      shieldbearer: '☀️',
      shooter: '🦅',
      bomber: '🌟',
    },
  },
  abyssal_void: {
    id: 'abyssal_void',
    name: 'Abyssal Voidwalker',
    subtitle: 'Event Horizon Conqueror',
    auraType: 'void_singularity_vortex',
    auraName: 'Void Singularity Vortex',
    auraDescription: 'Orbiting dark-matter rifts and violet dimensional lightning.',
    primaryColorHex: '#a855f7',
    secondaryColorHex: '#ec4899',
    stageGradientClass: 'from-purple-950/90 via-fuchsia-950/50 to-slate-950',
    ringBorderClass: 'border-purple-400/80 shadow-purple-500/40',
    badgeClass: 'bg-purple-500/25 text-purple-200 border-purple-400/60',
    particleSymbols: ['🌌', '🔮', '🌀'],
    particleCount: 9,
    orbitSpeedSec: 4.5,
    heroIconMap: {
      hero_arthur: '🌑',
      hero_lyra: '🦇',
      hero_ignis: '🕳️',
      hero_valkyrie: '🌩️',
    },
    specialtyFallbackIcons: {
      shieldbearer: '🌑',
      shooter: '🦇',
      bomber: '🌌',
    },
  },
  celestial_jade: {
    id: 'celestial_jade',
    name: 'Celestial Jade Immortal',
    subtitle: 'Nine-Heavens Dao Sovereign',
    auraType: 'jade_spirit_lotus',
    auraName: 'Immortal Jade Lotus Aura',
    auraDescription: 'Floating emerald Dao runes and tranquil spirit-qi lotus petals.',
    primaryColorHex: '#10b981',
    secondaryColorHex: '#2dd4bf',
    stageGradientClass: 'from-emerald-950/90 via-teal-950/60 to-slate-950',
    ringBorderClass: 'border-emerald-400/80 shadow-emerald-500/40',
    badgeClass: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/60',
    particleSymbols: ['🪷', '🐉', '🍃'],
    particleCount: 8,
    orbitSpeedSec: 6,
    heroIconMap: {
      hero_arthur: '🐉',
      hero_lyra: '🦢',
      hero_ignis: '🎆',
      hero_valkyrie: '💠',
    },
    specialtyFallbackIcons: {
      shieldbearer: '🐉',
      shooter: '🦢',
      bomber: '🪷',
    },
  },
  bloodmoon_fiend: {
    id: 'bloodmoon_fiend',
    name: 'Bloodmoon Warlord',
    subtitle: 'Crimson Asura Vanguard',
    auraType: 'crimson_lightning_tempest',
    auraName: 'Crimson Tribulation Tempest',
    auraDescription: 'Crackling blood-lightning arcs and scarlet battle-intent blades.',
    primaryColorHex: '#f43f5e',
    secondaryColorHex: '#fb7185',
    stageGradientClass: 'from-rose-950/90 via-red-950/60 to-slate-950',
    ringBorderClass: 'border-rose-400/80 shadow-rose-500/40',
    badgeClass: 'bg-rose-500/25 text-rose-200 border-rose-400/60',
    particleSymbols: ['🩸', '⚡', '🗡️'],
    particleCount: 10,
    orbitSpeedSec: 3.8,
    heroIconMap: {
      hero_arthur: '🩸',
      hero_lyra: '🕷️',
      hero_ignis: '🌋',
      hero_valkyrie: '⚔️',
    },
    specialtyFallbackIcons: {
      shieldbearer: '🩸',
      shooter: '🕷️',
      bomber: '👹',
    },
  },
};

export const HERO_SKIN_ORDER: HeroSkinId[] = [
  'default',
  'solar_seraph',
  'abyssal_void',
  'celestial_jade',
  'bloodmoon_fiend',
];

/**
 * Resolves the icon for a given hero and skin ID, preserving the hero's original baseAvatarIcon for 'default'.
 */
export function resolveHeroSkinIcon(hero: Hero, skinId: HeroSkinId): string {
  const baseIcon = hero.baseAvatarIcon || hero.avatarIcon;
  if (skinId === 'default') {
    return HERO_SKIN_CATALOG.default.heroIconMap[hero.id] || baseIcon;
  }
  const skin = HERO_SKIN_CATALOG[skinId] || HERO_SKIN_CATALOG.default;
  return skin.heroIconMap[hero.id] || skin.specialtyFallbackIcons[hero.troopSpecialty] || baseIcon;
}

/**
 * Returns all available aesthetic skins for a recruited hero with their resolved dynamic icons.
 */
export function getHeroSkinsForHero(hero: Hero): Array<HeroSkinConfig & { resolvedIcon: string }> {
  return HERO_SKIN_ORDER.map((skinId) => {
    const cfg = HERO_SKIN_CATALOG[skinId];
    return {
      ...cfg,
      resolvedIcon: resolveHeroSkinIcon(hero, skinId),
    };
  });
}

/**
 * Resolves the currently active skin configuration and icon for a hero.
 */
export function resolveHeroActiveSkin(hero: Hero): HeroSkinConfig & { resolvedIcon: string } {
  const skinId = (hero.equippedSkinId as HeroSkinId) || 'default';
  const cfg = HERO_SKIN_CATALOG[skinId] || HERO_SKIN_CATALOG.default;
  return {
    ...cfg,
    resolvedIcon: resolveHeroSkinIcon(hero, cfg.id),
  };
}

/**
 * Immutably equips a skin on a hero, dynamically swapping their avatarIcon and particle aura type.
 */
export function applySkinToHero(hero: Hero, skinId: HeroSkinId): Hero {
  const cfg = HERO_SKIN_CATALOG[skinId] || HERO_SKIN_CATALOG.default;
  const baseIcon = hero.baseAvatarIcon || hero.avatarIcon;
  const nextIcon = resolveHeroSkinIcon({ ...hero, baseAvatarIcon: baseIcon }, cfg.id);

  return {
    ...hero,
    baseAvatarIcon: baseIcon,
    equippedSkinId: cfg.id,
    avatarIcon: nextIcon,
    activeAuraType: cfg.auraType,
  };
}

/**
 * Generates deterministic orbital particle descriptors for a skin's particle aura effect.
 */
export function generateAuraParticles(skinId: HeroSkinId): AuraParticleDescriptor[] {
  const cfg = HERO_SKIN_CATALOG[skinId] || HERO_SKIN_CATALOG.default;
  const count = cfg.particleCount;
  const particles: AuraParticleDescriptor[] = [];

  for (let i = 0; i < count; i++) {
    const angleDeg = Math.round((i / count) * 360);
    const symbol = cfg.particleSymbols[i % cfg.particleSymbols.length];
    const radiusPx = 36 + (i % 3) * 8;
    const durationSec = Number((cfg.orbitSpeedSec + (i % 3) * 0.6).toFixed(2));
    const delaySec = Number(((i * 0.35) % 2.5).toFixed(2));
    const scale = Number((0.85 + (i % 3) * 0.15).toFixed(2));

    particles.push({
      id: `${cfg.id}_p_${i}`,
      symbol,
      angleDeg,
      radiusPx,
      durationSec,
      delaySec,
      scale,
    });
  }

  return particles;
}
