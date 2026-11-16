/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isPrimaryAdminAccount } from './adminModeration';
import {
  CULTIVATION_MANUALS,
  CULTIVATION_PATH_LIST,
  CULTIVATION_REALMS,
  INITIAL_DISCIPLES,
  INITIAL_KARMA_STATE,
  MYSTICAL_POWER_SKILLS,
} from './cultivationMath';
import { INITIAL_HEROES } from './initialData';
import { MAX_CASTLE_LEVEL, MAX_CASTLE_TROOP_CAPACITY } from './math';
import { PersistedVipSubscriptionState } from './vipSubscription';
import { CharacterAppearance, GameResources, Hero, PlayerTroopRoster } from '../types/game';
import { OwnedManualState, PlayerCultivationState } from '../types/cultivation';

/**
 * Comprehensive 12-domain "Immune to All Things" registry strictly reserved
 * for the verified Root Creator account (`creatergame31@gmail.com`) when Godmode is active.
 */
export const GOD_IMMUNITY_DOMAINS = [
  'all_damage_and_casualties',
  'realm_suppression',
  'heavenly_tribulation_lightning',
  'red_name_instant_kill_and_loot_drop',
  'karma_penalties_and_bounties',
  'mind_demons_curses_and_debuffs',
  'crowd_control_and_stuns',
  'economy_costs_taxes_and_drain',
  'cooldowns_and_lockouts',
  'moderation_sanctions_and_quarantine',
  'breakthrough_failures',
  'overvoid_erasure_and_oblivion',
] as const;

export type GodImmunityDomain = (typeof GOD_IMMUNITY_DOMAINS)[number];

export interface GodImmunityDomainSpec {
  id: GodImmunityDomain;
  title: string;
  description: string;
}

export const GOD_IMMUNITY_DOMAIN_SPECS: readonly GodImmunityDomainSpec[] = [
  {
    id: 'all_damage_and_casualties',
    title: 'Zero Damage & Zero Troop Casualties',
    description:
      'Nullifies all physical, elemental, siege, world boss, and raid HP/troop losses (0.0x incoming damage).',
  },
  {
    id: 'realm_suppression',
    title: 'Total Realm Suppression Immunity',
    description:
      'Completely ignores 10x–10^22x cross-realm suppression penalties from hostile entities.',
  },
  {
    id: 'heavenly_tribulation_lightning',
    title: 'Heavenly Tribulation Lightning Immunity',
    description:
      'All 9 Heavenly Tribulation thunder strikes deal 0 damage and resolve with guaranteed survival.',
  },
  {
    id: 'red_name_instant_kill_and_loot_drop',
    title: 'Judgment Lightning & Loot Drop Immunity',
    description:
      'Immune to stationary Red-Name instant-kill lightning and never drops Manuals, Pills, or Spirit Stones.',
  },
  {
    id: 'karma_penalties_and_bounties',
    title: 'Karma Lock & Bounty Stealth',
    description:
      'Maintains Supreme Golden Justice Karma (+100,000), never forced into Red-Name reveal or bounties.',
  },
  {
    id: 'mind_demons_curses_and_debuffs',
    title: 'Mind Demon, Curse & Status Immunity',
    description:
      'Impervious to Qi deviation, Book of Misfortune hexes, poison, burn, corrosion, and attribute decay.',
  },
  {
    id: 'crowd_control_and_stuns',
    title: 'Total Crowd-Control Immunity',
    description:
      'Cannot be stunned, frozen, knocked back, silenced, sealed inside pocket sleeves, or slowed.',
  },
  {
    id: 'economy_costs_taxes_and_drain',
    title: 'Zero-Loss Economic & Marketplace Immunity',
    description:
      'Immune to market escrow taxes, upkeep drain, resource shortages, and pill/craft depletion.',
  },
  {
    id: 'cooldowns_and_lockouts',
    title: 'Zero Cooldown & Phase Lock Immunity',
    description:
      'Bypasses training queues, rally phase locks, and retreat timers across world and siege zones.',
  },
  {
    id: 'moderation_sanctions_and_quarantine',
    title: 'Root Governance & Quarantine Immunity',
    description:
      'Protected from mutes, temp/perm bans, staff demotions, and multiplayer anti-cheat quarantine.',
  },
  {
    id: 'breakthrough_failures',
    title: '100% Deterministic Ascension',
    description:
      'Four-Path Cultivation breakthroughs never fail or suffer backlash across all 23 Realms × 9 Layers.',
  },
  {
    id: 'overvoid_erasure_and_oblivion',
    title: 'Layer-6 White Page Ontological Anchor',
    description:
      'Anchored in The White Page / House of Ideas; immune to Overvoid logic shifts and Oblivion erasure.',
  },
] as const;

export interface GodCharacterImmunityStatus {
  isRootGodAccount: boolean;
  immuneToAllThings: boolean;
  activeImmunities: readonly GodImmunityDomain[];
  incomingDamageMultiplier: 0 | 1;
  tribulationDamageMultiplier: 0 | 1;
  suppressionDefenseFloor: number;
  label: string;
}

export interface IncomingEffectCheck {
  domain: GodImmunityDomain;
  magnitude: bigint;
  sourceLabel?: string;
}

export interface IncomingEffectResolution {
  blocked: boolean;
  effectiveMagnitude: bigint;
  statusApplied: boolean;
  immunityDomain: GodImmunityDomain;
  reason: string;
}

export interface MaxedGodCharacterBundle {
  accountEmail: string;
  castleLevel: number;
  appearance: CharacterAppearance;
  resources: GameResources;
  troops: PlayerTroopRoster;
  playerExp: bigint;
  clanCoins: bigint;
  cultivation: PlayerCultivationState;
  vipState: PersistedVipSubscriptionState;
  heroes: Hero[];
  immunity: GodCharacterImmunityStatus;
}

/**
 * Evaluates whether an account is granted Supreme Creator God "Immunity to All Things".
 * Fail-closed: ONLY returns true when `email` normalizes to `creatergame31@gmail.com` AND `godmodeEnabled` is true.
 */
export function evaluateGodCharacterImmunity(
  email: string | null | undefined,
  godmodeEnabled: boolean = true
): GodCharacterImmunityStatus {
  const isRoot = Boolean(email && isPrimaryAdminAccount(email));
  if (!isRoot || !godmodeEnabled) {
    return {
      isRootGodAccount: isRoot,
      immuneToAllThings: false,
      activeImmunities: [],
      incomingDamageMultiplier: 1,
      tribulationDamageMultiplier: 1,
      suppressionDefenseFloor: 0,
      label: isRoot
        ? 'Root Creator Godmode Paused (Standard Simulation Active)'
        : 'Standard Mortal / Sovereign Rules (No Creator Immunity)',
    };
  }

  return {
    isRootGodAccount: true,
    immuneToAllThings: true,
    activeImmunities: GOD_IMMUNITY_DOMAINS,
    incomingDamageMultiplier: 0,
    tribulationDamageMultiplier: 0,
    suppressionDefenseFloor: 1,
    label: 'Supreme Creator God Sovereignty · Immune to All Things (12/12 Domains)',
  };
}

/**
 * Applies Supreme Creator Immunity to any incoming combat, tribulation, curse, economic drain,
 * crowd control, or cosmic erasure effect.
 */
export function applyGodImmunityToIncomingEffect(
  email: string | null | undefined,
  effect: IncomingEffectCheck,
  godmodeEnabled: boolean = true
): IncomingEffectResolution {
  const status = evaluateGodCharacterImmunity(email, godmodeEnabled);
  const safeMag = effect.magnitude < 0n ? 0n : effect.magnitude;

  if (status.immuneToAllThings && status.activeImmunities.includes(effect.domain)) {
    const src = effect.sourceLabel ? ` from ${effect.sourceLabel}` : '';
    return {
      blocked: true,
      effectiveMagnitude: 0n,
      statusApplied: false,
      immunityDomain: effect.domain,
      reason: `IMMUNE [${effect.domain}]: ${email} completely nullified incoming effect${src}.`,
    };
  }

  return {
    blocked: false,
    effectiveMagnitude: safeMag,
    statusApplied: true,
    immunityDomain: effect.domain,
    reason: 'Incoming effect resolved normally without Creator God Immunity.',
  };
}

/**
 * Synthesizes the complete Maxed-Out God Character preset for `creatergame31@gmail.com`:
 * - Castle Lv. 100 (Era X Celestial Imperium)
 * - 1,000 Trillion (1,000,000,000,000,000) T20 Troops across Shieldbearer, Shooter & Bomber
 * - ~1 Quadrillion across all 6 Treasury Currencies + Spirit Stones + 999,999 Scripture Fragments
 * - Realm 22 (Ultimate Origin Supreme Realm) Layer 9 across Qi, Body, Soul & Mind + all 12 Manuals Lv.10 + 12 Great Daos
 * - VIP 3 (Celestial Dao Sovereign · Loyalty Lv. 15)
 * - Heroes Lv. 999 · 5-Star Divine Supremacy
 * - Full 12/12 All-Things Immunity
 */
export function buildMaxedGodCharacterBundle(params?: {
  email?: string;
  baseAppearance?: Partial<CharacterAppearance>;
  baseHeroes?: Hero[];
  currentDateKey?: string;
}): MaxedGodCharacterBundle {
  const accountEmail = 'creatergame31@gmail.com';
  const currentDateKey = params?.currentDateKey || '2026-11-16';
  const maxRealmIndex = CULTIVATION_REALMS.length - 1; // 22 (Ultimate Origin Supreme Realm)
  const maxLayer = 9;
  const infiniteScaleEnergy = 999_999_999_999_999_999_999_999_999_999n;

  const ownedManuals: Record<string, OwnedManualState> = {};
  for (const manual of CULTIVATION_MANUALS) {
    ownedManuals[manual.id] = {
      manualId: manual.id,
      level: manual.maxLevel,
    };
  }

  const paths = {} as PlayerCultivationState['paths'];
  for (const path of CULTIVATION_PATH_LIST) {
    paths[path] = {
      realmIndex: maxRealmIndex,
      layer: maxLayer,
      currentEnergy: infiniteScaleEnergy,
    };
  }

  const sourceHeroes = params?.baseHeroes ?? INITIAL_HEROES;
  const maxedHeroes: Hero[] = sourceHeroes.map((hero) => ({
    ...hero,
    rarity: 'divine',
    level: 999,
    star: 5,
    power: 999_999_999_999_999n,
    statBonus: {
      attackBonusPct: 9_999,
      defenseBonusPct: 9_999,
      hpBonusPct: 9_999,
      rallyBonusPct: 9_999,
    },
  }));

  // 340T + 330T + 330T = 1,000T (exact MAX_CASTLE_TROOP_CAPACITY = 1_000_000_000_000_000n)
  const troops: PlayerTroopRoster = {
    shieldbearer_t20: 340_000_000_000_000n,
    shooter_t20: 330_000_000_000_000n,
    bomber_t20: MAX_CASTLE_TROOP_CAPACITY - 670_000_000_000_000n,
  };

  const appearance: CharacterAppearance = {
    name: params?.baseAppearance?.name || 'Aiden Skyrender (Creator GM)',
    title: 'Immortal God Sovereign · Immune to All Things',
    species: params?.baseAppearance?.species || 'azure_dragonkin',
    speciesLocked: false,
    adminSpeciesSwitchApproved: true,
    gender: params?.baseAppearance?.gender || 'warlord',
    skinColor: params?.baseAppearance?.skinColor || '#f1c27d',
    hairStyle: params?.baseAppearance?.hairStyle || 'knight',
    hairColor: params?.baseAppearance?.hairColor || '#fde047',
    eyeColor: params?.baseAppearance?.eyeColor || '#38bdf8',
    armorTier: 20,
    armorColor: params?.baseAppearance?.armorColor || '#f59e0b',
    weaponType: params?.baseAppearance?.weaponType || 'arcane_halberd',
    capeColor: params?.baseAppearance?.capeColor || '#dc2626',
    hasCape: true,
    clanTag: params?.baseAppearance?.clanTag || 'VALOR',
  };

  const resources: GameResources = {
    wood: 999_999_999_999_999n,
    steel: 999_999_999_999_999n,
    copper: 999_999_999_999_999n,
    grain: 999_999_999_999_999n,
    oil: 999_999_999_999_999n,
    diamond: 999_999_999_999_999n,
  };

  const cultivation: PlayerCultivationState = {
    currentRealmIndex: maxRealmIndex,
    currentLayer: maxLayer,
    currentQi: infiniteScaleEnergy,
    passiveQiPerSec: 999_999_999_999n,
    paths,
    ownedManuals,
    equippedManuals: {
      qi: 'manual_qi_ultimate_origin',
      body: 'manual_body_chaos_fiendcelestial',
      soul: 'manual_soul_omniscient_eye',
      mind: 'manual_mind_supreme_detachment',
    },
    scriptureFragments: 999_999,
    secludedYears: 9_999_999,
    tribulationUnderway: false,
    tribulationStrikesLeft: 0,
    tribulationDamageRating: 0n,
    inventoryPills: {
      pill_qi_condensation: 999,
      pill_foundation: 999,
      pill_dragon_blood_temper: 999,
      pill_core_condense: 999,
      pill_nascent_soul: 999,
      pill_bodhi_heart: 999,
    },
    selectedRoot: 'chaos',
    rootPurityPct: 100,
    karma: {
      ...INITIAL_KARMA_STATE,
      karmaValue: 100_000,
      alignment: 'gold_justice',
      unlawfulKills: 0,
      righteousKills: 999,
      stationarySeconds: 0,
      bountySpiritStones: 0n,
      isLocationRevealed: false,
      lastLightningStrikeMsg: null,
      droppedLootHistory: [],
    },
    disciples: INITIAL_DISCIPLES,
    masterTaxRatePct: 20,
    learnedMysticalSkills: MYSTICAL_POWER_SKILLS.map((s) => s.id),
    skillScrollInventory: [],
    spiritStones: 999_999_999_999_999n,
    masteredGreatDaos: 12,
    auraOverrideRealmIndex: maxRealmIndex,
    veteranScrolls: 999,
    veteranScrollsComprehended: 100,
  };

  const vipState: PersistedVipSubscriptionState = {
    activeTier: 'celestial_sovereign',
    billingCycle: 'annual',
    subscribedAtDateKey: currentDateKey,
    expiresAtDaysRemaining: 99_999,
    autoRenewEnabled: true,
    lastStipendClaimDateKey: null,
    totalStipendsClaimed: 99,
    vipLoyaltyPoints: 1_000_000, // Exceeds Lv.15 threshold (75,000)
    simulatedVipDayOffset: 0,
  };

  return {
    accountEmail,
    castleLevel: MAX_CASTLE_LEVEL,
    appearance,
    resources,
    troops,
    playerExp: 999_999_999_999_999n,
    clanCoins: 999_999_999n,
    cultivation,
    vipState,
    heroes: maxedHeroes,
    immunity: evaluateGodCharacterImmunity(accountEmail, true),
  };
}
