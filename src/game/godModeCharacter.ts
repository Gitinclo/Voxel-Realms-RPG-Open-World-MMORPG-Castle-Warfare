/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PRIMARY_ADMIN_EMAIL, isPrimaryAdminAccount } from './adminModeration';
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

/**
 * 5 Divine Pillars encompassing the 100 Supreme Omni-Attributes exclusively bound to
 * the Root Creator account (`creatergame31@gmail.com`).
 */
export const GOD_OMNI_PILLAR_IDS = [
  'power_authority_creation',
  'knowledge_wisdom_vision',
  'presence_space_time',
  'goodness_morality_divine_nature',
  'cosmic_unity_volition',
] as const;

export type GodOmniPillarId = (typeof GOD_OMNI_PILLAR_IDS)[number];

export interface GodOmniPillarSpec {
  id: GodOmniPillarId;
  title: string;
  shortLabel: string;
  attributeCount: number;
  summary: string;
}

export const GOD_OMNI_PILLAR_SPECS: readonly GodOmniPillarSpec[] = [
  {
    id: 'power_authority_creation',
    title: 'Power, Authority & Creation',
    shortLabel: 'Power & Creation',
    attributeCount: 20,
    summary:
      'Unlimited creative force, first-cause origin, supreme kingship, and absolute dominion over all realms, forces, and cosmic laws.',
  },
  {
    id: 'knowledge_wisdom_vision',
    title: 'Knowledge, Wisdom & Vision',
    shortLabel: 'Knowledge & Vision',
    attributeCount: 20,
    summary:
      'Complete infinite omniscience across past, present, and future, all-seeing dimensional perception, and unclouded cosmic truth.',
  },
  {
    id: 'presence_space_time',
    title: 'Presence, Space & Time',
    shortLabel: 'Space & Time',
    attributeCount: 20,
    summary:
      'Simultaneous omnipresence across all locations, timelines, dimensions, and planes of existence without boundary or beginning.',
  },
  {
    id: 'goodness_morality_divine_nature',
    title: 'Goodness, Morality & Divine Nature',
    shortLabel: 'Divine Nature',
    attributeCount: 20,
    summary:
      'Infinite benevolence, incorruptible justice, boundless grace, moral perfection, and divine harmony uniting all creation.',
  },
  {
    id: 'cosmic_unity_volition',
    title: 'Cosmic Unity & Volition (Including Dark/Dualistic Deities)',
    shortLabel: 'Cosmic Volition',
    attributeCount: 20,
    summary:
      'Supreme cosmic will, world-soul synthesis, dualistic creation/annihilation mastery, immutability, and complete fullness of godhood.',
  },
] as const;

export interface GodOmniAttributeSpec {
  id: string;
  name: string;
  pillar: GodOmniPillarId;
  description: string;
}

export const GOD_OMNI_ATTRIBUTES: readonly GodOmniAttributeSpec[] = [
  // Pillar 1: Power, Authority & Creation (20)
  {
    id: 'omni_omnipotent',
    name: 'Omnipotent',
    pillar: 'power_authority_creation',
    description: 'Possessing unlimited, absolute power and authority.',
  },
  {
    id: 'omni_omnific',
    name: 'Omnific',
    pillar: 'power_authority_creation',
    description: 'Creating all things; having the power to bring everything into existence.',
  },
  {
    id: 'omni_omnificent',
    name: 'Omnificent',
    pillar: 'power_authority_creation',
    description: 'Unlimited in creative force and capacity.',
  },
  {
    id: 'omni_omniregent',
    name: 'Omniregent',
    pillar: 'power_authority_creation',
    description: 'Ruling as the supreme sovereign over all realms and beings.',
  },
  {
    id: 'omni_omnicausal',
    name: 'Omnicausal',
    pillar: 'power_authority_creation',
    description: 'Serving as the ultimate first cause behind everything that exists.',
  },
  {
    id: 'omni_omnicompetent',
    name: 'Omnicompetent',
    pillar: 'power_authority_creation',
    description: 'Fully capable of governing, judging, and handling every cosmic matter.',
  },
  {
    id: 'omni_omnidominant',
    name: 'Omnidominant',
    pillar: 'power_authority_creation',
    description: 'Holding total supremacy and dominance over all forces.',
  },
  {
    id: 'omni_omniparent',
    name: 'Omniparent',
    pillar: 'power_authority_creation',
    description: 'Acting as the ultimate creator, progenitor, or parent of all life.',
  },
  {
    id: 'omni_omnipotentate',
    name: 'Omnipotentate',
    pillar: 'power_authority_creation',
    description: 'A supreme ruler holding all power in the universe.',
  },
  {
    id: 'omni_omnisovereign',
    name: 'Omnisovereign',
    pillar: 'power_authority_creation',
    description: 'Exercising absolute kingship and dominion over all creation.',
  },
  {
    id: 'omni_omniforce',
    name: 'Omniforce',
    pillar: 'power_authority_creation',
    description: 'Embodying the entirety of all cosmic energy and strength.',
  },
  {
    id: 'omni_omnimaster',
    name: 'Omnimaster',
    pillar: 'power_authority_creation',
    description: 'Having complete mastery over every element, law, and spirit.',
  },
  {
    id: 'omni_omnivictorious',
    name: 'Omnivictorious',
    pillar: 'power_authority_creation',
    description: 'Triumphant over all opposition, chaos, and darkness.',
  },
  {
    id: 'omni_omnidirective',
    name: 'Omnidirective',
    pillar: 'power_authority_creation',
    description: 'Guiding and ordering the path of the entire universe.',
  },
  {
    id: 'omni_omnimaker',
    name: 'Omnimaker',
    pillar: 'power_authority_creation',
    description: 'The sole architect and builder of all worlds.',
  },
  {
    id: 'omni_omnipropulsive',
    name: 'Omnipropulsive',
    pillar: 'power_authority_creation',
    description: 'Providing the driving force behind all motion in the cosmos.',
  },
  {
    id: 'omni_omnigoverning',
    name: 'Omnigoverning',
    pillar: 'power_authority_creation',
    description: 'Maintaining total order and governance across all reality.',
  },
  {
    id: 'omni_omnisustaining',
    name: 'Omnisustaining',
    pillar: 'power_authority_creation',
    description: 'Continuously holding all of creation together so it does not cease to exist.',
  },
  {
    id: 'omni_omnipotential',
    name: 'Omnipotential',
    pillar: 'power_authority_creation',
    description: 'Containing the infinite potential for anything that could ever be.',
  },
  {
    id: 'omni_omniconquering',
    name: 'Omniconquering',
    pillar: 'power_authority_creation',
    description: 'Overcoming all evil, death, and cosmic adversaries.',
  },

  // Pillar 2: Knowledge, Wisdom & Vision (20)
  {
    id: 'omni_omniscient',
    name: 'Omniscient',
    pillar: 'knowledge_wisdom_vision',
    description: 'Possessing complete, infinite knowledge of past, present, and future.',
  },
  {
    id: 'omni_omnisapient',
    name: 'Omnisapient',
    pillar: 'knowledge_wisdom_vision',
    description: 'Holding absolute, flawless wisdom and divine judgment.',
  },
  {
    id: 'omni_omnivident',
    name: 'Omnivident',
    pillar: 'knowledge_wisdom_vision',
    description: 'All-seeing; perceiving every event across all dimensions simultaneously.',
  },
  {
    id: 'omni_omnispective',
    name: 'Omnispective',
    pillar: 'knowledge_wisdom_vision',
    description: 'Able to observe everything in existence without blind spots.',
  },
  {
    id: 'omni_omnipercipient',
    name: 'Omnipercipient',
    pillar: 'knowledge_wisdom_vision',
    description: 'Perceiving every thought, emotion, and physical detail in the universe.',
  },
  {
    id: 'omni_omnivigilant',
    name: 'Omnivigilant',
    pillar: 'knowledge_wisdom_vision',
    description: 'Watching over all creation tirelessly without ever slumbering.',
  },
  {
    id: 'omni_omnilingual',
    name: 'Omnilingual',
    pillar: 'knowledge_wisdom_vision',
    description: 'Understanding and speaking every language, mortal or divine.',
  },
  {
    id: 'omni_omnilegent',
    name: 'Omnilegent',
    pillar: 'knowledge_wisdom_vision',
    description: 'Knowing the contents of every written, spoken, or unwritten truth.',
  },
  {
    id: 'omni_omnicognizant',
    name: 'Omnicognizant',
    pillar: 'knowledge_wisdom_vision',
    description: 'Fully aware of all realities, timelines, and possibilities.',
  },
  {
    id: 'omni_omniprohetic',
    name: 'Omniprohetic',
    pillar: 'knowledge_wisdom_vision',
    description: 'Foreknowing every future event before it occurs.',
  },
  {
    id: 'omni_omnidiscernment',
    name: 'Omnidiscernment',
    pillar: 'knowledge_wisdom_vision',
    description: 'Instantly distinguishing truth from falsehood in all hearts.',
  },
  {
    id: 'omni_omniaware',
    name: 'Omniaware',
    pillar: 'knowledge_wisdom_vision',
    description: 'Conscious of every atom and soul in the cosmos at once.',
  },
  {
    id: 'omni_omnilucent',
    name: 'Omnilucent',
    pillar: 'knowledge_wisdom_vision',
    description: 'Radiating divine light and illumination that reveals all hidden things.',
  },
  {
    id: 'omni_omnirevealing',
    name: 'Omnirevealing',
    pillar: 'knowledge_wisdom_vision',
    description: 'Unveiling all cosmic mysteries and truths to creation.',
  },
  {
    id: 'omni_omnimemory',
    name: 'Omnimemory',
    pillar: 'knowledge_wisdom_vision',
    description: 'Retaining perfect, eternal memory of everything that has ever happened.',
  },
  {
    id: 'omni_omnisensor',
    name: 'Omnisensor',
    pillar: 'knowledge_wisdom_vision',
    description: 'Sensing every vibration, prayer, and shift across reality.',
  },
  {
    id: 'omni_omnitruth',
    name: 'Omnitruth',
    pillar: 'knowledge_wisdom_vision',
    description: 'Embodying the absolute, unchanging truth of all existence.',
  },
  {
    id: 'omni_omniclarity',
    name: 'Omniclarity',
    pillar: 'knowledge_wisdom_vision',
    description: 'Seeing through all illusions and complexities with total clarity.',
  },
  {
    id: 'omni_omniguiding',
    name: 'Omniguiding',
    pillar: 'knowledge_wisdom_vision',
    description: 'Illuminating the righteous path for all seekers.',
  },
  {
    id: 'omni_omniscrutinizing',
    name: 'Omniscrutinizing',
    pillar: 'knowledge_wisdom_vision',
    description: 'Examining every soul and action with perfect precision.',
  },

  // Pillar 3: Presence, Space & Time (20)
  {
    id: 'omni_omnipresent',
    name: 'Omnipresent',
    pillar: 'presence_space_time',
    description: 'Existing everywhere in the universe at the exact same moment.',
  },
  {
    id: 'omni_omnitemporal',
    name: 'Omnitemporal',
    pillar: 'presence_space_time',
    description: 'Existing across all time—past, present, and future simultaneously.',
  },
  {
    id: 'omni_omnilocal',
    name: 'Omnilocal',
    pillar: 'presence_space_time',
    description: 'Occupying every physical and spiritual location at once.',
  },
  {
    id: 'omni_omnidistance',
    name: 'Omnidistance',
    pillar: 'presence_space_time',
    description: 'Spanning across infinite distances without boundary.',
  },
  {
    id: 'omni_omniprevalent',
    name: 'Omniprevalent',
    pillar: 'presence_space_time',
    description: 'Prevailing and existing throughout every corner of reality.',
  },
  {
    id: 'omni_omnisubstantial',
    name: 'Omnisubstantial',
    pillar: 'presence_space_time',
    description: 'Comprising the fundamental essence and substance of all things.',
  },
  {
    id: 'omni_omnicorporeal',
    name: 'Omnicorporeal',
    pillar: 'presence_space_time',
    description: 'Capable of manifesting in any physical or divine form.',
  },
  {
    id: 'omni_omniform',
    name: 'Omniform',
    pillar: 'presence_space_time',
    description: 'Possessing every form, shape, and manifestation across creation.',
  },
  {
    id: 'omni_omniphasic',
    name: 'Omniphasic',
    pillar: 'presence_space_time',
    description: 'Existing across all states, dimensions, and planes of reality.',
  },
  {
    id: 'omni_omnimobile',
    name: 'Omnimobile',
    pillar: 'presence_space_time',
    description: 'Moving freely and instantaneously across all realms.',
  },
  {
    id: 'omni_omniambient',
    name: 'Omniambient',
    pillar: 'presence_space_time',
    description: 'Surrounding and permeating every environment in existence.',
  },
  {
    id: 'omni_omnibearing',
    name: 'Omnibearing',
    pillar: 'presence_space_time',
    description: 'Extending infinitely in every conceivable direction.',
  },
  {
    id: 'omni_omnidimensional',
    name: 'Omnidimensional',
    pillar: 'presence_space_time',
    description: 'Inhabiting every higher and lower dimension at once.',
  },
  {
    id: 'omni_omnieternal',
    name: 'Omnieternal',
    pillar: 'presence_space_time',
    description: 'Having no beginning and no end across all ages.',
  },
  {
    id: 'omni_omniimmanent',
    name: 'Omniimmanent',
    pillar: 'presence_space_time',
    description: 'Indwelling within every part of the created world.',
  },
  {
    id: 'omni_omnitranscendent',
    name: 'Omnitranscendent',
    pillar: 'presence_space_time',
    description: 'Rising infinitely above and beyond all physical creation.',
  },
  {
    id: 'omni_omnivagant',
    name: 'Omnivagant',
    pillar: 'presence_space_time',
    description: 'Moving throughout the entirety of the cosmos without restriction.',
  },
  {
    id: 'omni_omnicentric',
    name: 'Omnicentric',
    pillar: 'presence_space_time',
    description: 'Serving as the true center of all existence.',
  },
  {
    id: 'omni_omnispatial',
    name: 'Omnispatial',
    pillar: 'presence_space_time',
    description: 'Encompassing the entirety of space itself.',
  },
  {
    id: 'omni_omniabiding',
    name: 'Omniabiding',
    pillar: 'presence_space_time',
    description: 'Remaining steadfast and present in all places forever.',
  },

  // Pillar 4: Goodness, Morality & Divine Nature (20)
  {
    id: 'omni_omnibenevolent',
    name: 'Omnibenevolent',
    pillar: 'goodness_morality_divine_nature',
    description: 'Possessing infinite, unconditional goodness and love.',
  },
  {
    id: 'omni_omnimerciful',
    name: 'Omnimerciful',
    pillar: 'goodness_morality_divine_nature',
    description: 'Extending boundless compassion, grace, and forgiveness to all.',
  },
  {
    id: 'omni_omnigracious',
    name: 'Omnigracious',
    pillar: 'goodness_morality_divine_nature',
    description: 'Bestowing unlimited favor and blessings upon creation.',
  },
  {
    id: 'omni_omnijust',
    name: 'Omnijust',
    pillar: 'goodness_morality_divine_nature',
    description: 'Executing perfect, incorruptible justice in every judgment.',
  },
  {
    id: 'omni_omnipure',
    name: 'Omnipure',
    pillar: 'goodness_morality_divine_nature',
    description: 'Completely free from any flaw, stain, or corruption.',
  },
  {
    id: 'omni_omniholy',
    name: 'Omniholy',
    pillar: 'goodness_morality_divine_nature',
    description: 'Supremely sacred, revered, and set apart above all else.',
  },
  {
    id: 'omni_omnipacific',
    name: 'Omnipacific',
    pillar: 'goodness_morality_divine_nature',
    description: 'Bringing ultimate peace and harmony to the cosmos.',
  },
  {
    id: 'omni_omniloving',
    name: 'Omniloving',
    pillar: 'goodness_morality_divine_nature',
    description: 'Loving all beings infinitely and unconditionally.',
  },
  {
    id: 'omni_omniforgiving',
    name: 'Omniforgiving',
    pillar: 'goodness_morality_divine_nature',
    description: 'Capable of absolving any transgression or sin.',
  },
  {
    id: 'omni_omniblessed',
    name: 'Omniblessed',
    pillar: 'goodness_morality_divine_nature',
    description: 'Eternally blessed and the source of all blessings.',
  },
  {
    id: 'omni_omnisympathetic',
    name: 'Omnisympathetic',
    pillar: 'goodness_morality_divine_nature',
    description: 'Feeling deep compassion for the suffering of every creature.',
  },
  {
    id: 'omni_omnibountiful',
    name: 'Omnibountiful',
    pillar: 'goodness_morality_divine_nature',
    description: 'Giving generously and endlessly to sustain all life.',
  },
  {
    id: 'omni_omnipatient',
    name: 'Omnipatient',
    pillar: 'goodness_morality_divine_nature',
    description: 'Enduring with infinite patience and long-suffering.',
  },
  {
    id: 'omni_omnifaithful',
    name: 'Omnifaithful',
    pillar: 'goodness_morality_divine_nature',
    description: 'Remaining completely true to every promise and covenant.',
  },
  {
    id: 'omni_omnirighteous',
    name: 'Omnirighteous',
    pillar: 'goodness_morality_divine_nature',
    description: 'Always acting in total moral perfection.',
  },
  {
    id: 'omni_omnisaving',
    name: 'Omnisaving',
    pillar: 'goodness_morality_divine_nature',
    description: 'Offering redemption and salvation to all who seek it.',
  },
  {
    id: 'omni_omnitolerant',
    name: 'Omnitolerant',
    pillar: 'goodness_morality_divine_nature',
    description: 'Bearing with all creation with boundless grace.',
  },
  {
    id: 'omni_omniharmonious',
    name: 'Omniharmonious',
    pillar: 'goodness_morality_divine_nature',
    description: 'Uniting all opposing forces in divine balance.',
  },
  {
    id: 'omni_omnicaring',
    name: 'Omnicaring',
    pillar: 'goodness_morality_divine_nature',
    description: 'Watching over and tending to the needs of every living thing.',
  },
  {
    id: 'omni_omnimoral',
    name: 'Omnimoral',
    pillar: 'goodness_morality_divine_nature',
    description: 'Serving as the absolute foundation of all moral law.',
  },

  // Pillar 5: Cosmic Unity & Volition (Including Dark/Dualistic Deities) (20)
  {
    id: 'omni_omnivolent',
    name: 'Omnivolent',
    pillar: 'cosmic_unity_volition',
    description: 'Willing all things that come to pass.',
  },
  {
    id: 'omni_omnisentient',
    name: 'Omnisentient',
    pillar: 'cosmic_unity_volition',
    description: 'Experiencing total cosmic consciousness and awareness.',
  },
  {
    id: 'omni_omnipathy',
    name: 'Omnipathy',
    pillar: 'cosmic_unity_volition',
    description: 'Feeling the collective emotions and states of the entire universe.',
  },
  {
    id: 'omni_omnisatisfying',
    name: 'Omnisatisfying',
    pillar: 'cosmic_unity_volition',
    description: 'Fulfilling the deepest spiritual longing of every soul.',
  },
  {
    id: 'omni_omnisubjective',
    name: 'Omnisubjective',
    pillar: 'cosmic_unity_volition',
    description: 'Encompassing every perspective and consciousness within itself.',
  },
  {
    id: 'omni_omnipersonal',
    name: 'Omnipersonal',
    pillar: 'cosmic_unity_volition',
    description: 'Relating intimately to every individual being at once.',
  },
  {
    id: 'omni_omnigenesis',
    name: 'Omnigenesis',
    pillar: 'cosmic_unity_volition',
    description: 'Serving as the singular origin point of all species and worlds.',
  },
  {
    id: 'omni_omnisoul',
    name: 'Omnisoul',
    pillar: 'cosmic_unity_volition',
    description: 'Acting as the great world-soul connecting all living spirits.',
  },
  {
    id: 'omni_omniessence',
    name: 'Omniessence',
    pillar: 'cosmic_unity_volition',
    description: 'Being the core spiritual essence behind all matter.',
  },
  {
    id: 'omni_omnimalevolent',
    name: 'Omnimalevolent',
    pillar: 'cosmic_unity_volition',
    description: 'Possessing absolute malice toward all creation (used for dark or evil deities).',
  },
  {
    id: 'omni_omnidestructive',
    name: 'Omnidestructive',
    pillar: 'cosmic_unity_volition',
    description:
      'Capable of unmaking and annihilating all of existence (e.g., gods of destruction).',
  },
  {
    id: 'omni_omniconsuming',
    name: 'Omniconsuming',
    pillar: 'cosmic_unity_volition',
    description: 'Devouring all worlds, time, and matter at the end of an age.',
  },
  {
    id: 'omni_omniterrible',
    name: 'Omniterrible',
    pillar: 'cosmic_unity_volition',
    description: 'Inspiring overwhelming awe, dread, and reverence in all mortals.',
  },
  {
    id: 'omni_omnimysterious',
    name: 'Omnimysterious',
    pillar: 'cosmic_unity_volition',
    description: 'Remaining infinitely beyond full human comprehension.',
  },
  {
    id: 'omni_omniimmutable',
    name: 'Omniimmutable',
    pillar: 'cosmic_unity_volition',
    description: 'Completely unchanging and unshakeable across eternity.',
  },
  {
    id: 'omni_omniperfect',
    name: 'Omniperfect',
    pillar: 'cosmic_unity_volition',
    description: 'Lacking nothing; complete in every conceivable attribute.',
  },
  {
    id: 'omni_omnisufficient',
    name: 'Omnisufficient',
    pillar: 'cosmic_unity_volition',
    description: 'Needing nothing outside of itself to exist or thrive.',
  },
  {
    id: 'omni_omniunifying',
    name: 'Omniunifying',
    pillar: 'cosmic_unity_volition',
    description: 'Drawing all scattered creation back into cosmic oneness.',
  },
  {
    id: 'omni_omnimajestic',
    name: 'Omnimajestic',
    pillar: 'cosmic_unity_volition',
    description: 'Clothed in infinite splendor, glory, and grandeur.',
  },
  {
    id: 'omni_omnidivine',
    name: 'Omnidivine',
    pillar: 'cosmic_unity_volition',
    description: 'Embodying the complete fullness of godhood.',
  },
] as const;

export function getGodOmniAttributesByPillar(
  pillar: GodOmniPillarId
): readonly GodOmniAttributeSpec[] {
  return GOD_OMNI_ATTRIBUTES.filter((attr) => attr.pillar === pillar);
}

export interface GodOmniAttributeEvaluation {
  found: boolean;
  active: boolean;
  attribute: GodOmniAttributeSpec | null;
  accountEmail: string;
}

/**
 * Evaluates whether a specific Omni-Attribute (by name such as 'Omnipotent' or ID 'omni_omnipotent')
 * is active for the given account email. Fail-closed for all accounts except `creatergame31@gmail.com`.
 */
export function evaluateGodOmniAttribute(
  email: string | null | undefined,
  attributeNameOrId: string,
  godmodeEnabled: boolean = true
): GodOmniAttributeEvaluation {
  const normalizedTarget = attributeNameOrId.trim().toLowerCase();
  const matched =
    GOD_OMNI_ATTRIBUTES.find(
      (a) => a.id.toLowerCase() === normalizedTarget || a.name.toLowerCase() === normalizedTarget
    ) ?? null;
  const status = evaluateGodCharacterImmunity(email, godmodeEnabled);
  return {
    found: Boolean(matched),
    active: Boolean(matched && status.immuneToAllThings),
    attribute: matched,
    accountEmail: (email || '').trim().toLowerCase(),
  };
}

export interface GodCharacterImmunityStatus {
  isRootGodAccount: boolean;
  immuneToAllThings: boolean;
  activeImmunities: readonly GodImmunityDomain[];
  activeOmniAttributesCount: number;
  activeOmniPillarsCount: number;
  omniAttributes: readonly GodOmniAttributeSpec[];
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
 * Evaluates whether an account is granted Supreme Creator God "Immunity to All Things"
 * and all 100 Supreme Omni-Attributes across 5 Divine Pillars.
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
      activeOmniAttributesCount: 0,
      activeOmniPillarsCount: 0,
      omniAttributes: [],
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
    activeOmniAttributesCount: GOD_OMNI_ATTRIBUTES.length,
    activeOmniPillarsCount: GOD_OMNI_PILLAR_SPECS.length,
    omniAttributes: GOD_OMNI_ATTRIBUTES,
    incomingDamageMultiplier: 0,
    tribulationDamageMultiplier: 0,
    suppressionDefenseFloor: 1,
    label:
      'Supreme Creator God Sovereignty · Immune to All Things (12/12 Domains · 100/100 Omni-Attributes)',
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
 * - Full 12/12 All-Things Immunity + 100/100 Supreme Omni-Attributes across 5 Divine Pillars
 */
export function buildMaxedGodCharacterBundle(params?: {
  email?: string;
  baseAppearance?: Partial<CharacterAppearance>;
  baseHeroes?: Hero[];
  currentDateKey?: string;
}): MaxedGodCharacterBundle {
  const accountEmail = 'creatergame31@gmail.com';
  const currentDateKey = params?.currentDateKey || '2026-11-17';
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
    title: 'Omnipotent God Sovereign · 100 Omni-Attributes · Immune to All Things',
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

/**
 * Sovereign Divine Flight Specification for Root Creator (`creatergame31@gmail.com`).
 * Powered by the Presence, Space & Time and Power & Creation Omni-Attributes:
 * - Omnimobile (Moving freely and instantaneously across all realms)
 * - Omnipropulsive (Providing the driving force behind all motion in the cosmos)
 * - Omnitranscendent (Rising infinitely above and beyond all physical creation)
 * - Omnivagant (Moving throughout the entirety of the cosmos without restriction)
 */
export const GOD_FLIGHT_SPEC = {
  ownerEmail: PRIMARY_ADMIN_EMAIL,
  mountTitle: 'Sovereign Nine-Heavens Imperial Flying Sword & Astral Cloud Halo',
  defaultCruiseAltitude: 8.5,
  minAltitude: 0,
  minAirborneAltitude: 1.0,
  maxAltitude: 45.0,
  citadelWallBypassAltitude: 2.5,
  flightSpeedMultiplier: 2.5,
  verticalClimbSpeedPerSec: 16.0,
  altitudeStepDelta: 4.5,
  linkedOmniAttributeIds: [
    'Omnimobile',
    'Omnipropulsive',
    'Omnitranscendent',
    'Omnivagant',
  ] as const,
  altitudePresets: [
    { id: 'ground', label: 'Ground (0m)', altitude: 0 },
    { id: 'cruise', label: 'Sword Cruise (8.5m)', altitude: 8.5 },
    { id: 'citadel_roof', label: 'Citadel Keep Spire (18m)', altitude: 18.0 },
    { id: 'celestia_island', label: 'Celestia Sky Island (28m)', altitude: 28.0 },
    { id: 'apex_stratosphere', label: 'Apex Stratosphere (45m)', altitude: 45.0 },
  ] as const,
} as const;

export interface GodFlightPermissionStatus {
  email: string;
  isRootGodAccount: boolean;
  allowed: boolean;
  flightSpeedMultiplier: number;
  maxAltitude: number;
  defaultCruiseAltitude: number;
  citadelWallBypassAltitude: number;
  mountTitle: string;
  linkedOmniAttributeIds: readonly string[];
  reason: string;
}

/**
 * Evaluates whether the specified account is authorized for Sovereign Divine Flight.
 * Fail-closed: only `creatergame31@gmail.com` with Godmode active is granted Sovereign Divine Flight.
 */
export function evaluateGodFlightPermission(
  email: string | null | undefined,
  godmodeEnabled: boolean = true
): GodFlightPermissionStatus {
  const normalized = (email || '').trim().toLowerCase();
  const isRoot = isPrimaryAdminAccount(normalized);
  const allowed = Boolean(isRoot && godmodeEnabled);

  if (!allowed) {
    return {
      email: normalized || 'guest@voxelrealms.example',
      isRootGodAccount: isRoot,
      allowed: false,
      flightSpeedMultiplier: 1.0,
      maxAltitude: 0,
      defaultCruiseAltitude: 0,
      citadelWallBypassAltitude: GOD_FLIGHT_SPEC.citadelWallBypassAltitude,
      mountTitle: GOD_FLIGHT_SPEC.mountTitle,
      linkedOmniAttributeIds: [],
      reason: isRoot
        ? `Sovereign Divine Flight paused (Godmode toggle is currently disabled for ${PRIMARY_ADMIN_EMAIL}).`
        : `DENIED [Fail-Closed]: Sovereign Divine Flight is reserved exclusively for Root Creator (${PRIMARY_ADMIN_EMAIL}).`,
    };
  }

  return {
    email: PRIMARY_ADMIN_EMAIL,
    isRootGodAccount: true,
    allowed: true,
    flightSpeedMultiplier: GOD_FLIGHT_SPEC.flightSpeedMultiplier,
    maxAltitude: GOD_FLIGHT_SPEC.maxAltitude,
    defaultCruiseAltitude: GOD_FLIGHT_SPEC.defaultCruiseAltitude,
    citadelWallBypassAltitude: GOD_FLIGHT_SPEC.citadelWallBypassAltitude,
    mountTitle: GOD_FLIGHT_SPEC.mountTitle,
    linkedOmniAttributeIds: GOD_FLIGHT_SPEC.linkedOmniAttributeIds,
    reason: `AUTHORIZED: Sovereign Divine Flight active for ${PRIMARY_ADMIN_EMAIL} (${GOD_FLIGHT_SPEC.flightSpeedMultiplier}x Speed · 0m–${GOD_FLIGHT_SPEC.maxAltitude}m Altitude · Citadel Keep Bypass).`,
  };
}

export interface GodFlightKinematicsInput {
  currentX: number;
  currentY: number;
  currentZ: number;
  moveInputX: number;
  moveInputZ: number;
  verticalInput: number; // -1 descend, 0 hold, +1 ascend
  cameraOrbitAngle: number;
  dt: number;
  isFlying: boolean;
  targetAltitude: number;
  permission: GodFlightPermissionStatus;
  baseGroundSpeed?: number;
  worldHalfExtent?: number;
}

export interface GodFlightKinematicsOutput {
  nextX: number;
  nextY: number;
  nextZ: number;
  nextTargetAltitude: number;
  isAirborne: boolean;
  bypassesCitadelWalls: boolean;
  effectiveSpeedMultiplier: number;
  worldMoveX: number;
  worldMoveZ: number;
  isMovingHorizontally: boolean;
}

/**
 * Pure deterministic 3D flight and ground movement kinematic solver.
 * When `isFlying && permission.allowed`, elevates the character smoothly toward `targetAltitude`
 * (or adjusts `targetAltitude` via `verticalInput`), applies the `2.5x` Sovereign Flight Speed
 * multiplier, and bypasses ground Citadel keep walls when `nextY >= 2.5`.
 */
export function computeNextGodFlightKinematics(
  input: GodFlightKinematicsInput
): GodFlightKinematicsOutput {
  const safeDt = Math.max(0, Math.min(input.dt, 0.25));
  const baseSpeed = input.baseGroundSpeed ?? 14;
  const halfExtent = input.worldHalfExtent ?? GOD_TELEPORT_SPEC.worldHalfExtent;
  const flightActive = Boolean(input.isFlying && input.permission.allowed);

  // 1. Compute target altitude & vertical elevation
  let nextTargetAltitude = flightActive
    ? Math.max(
        GOD_FLIGHT_SPEC.minAirborneAltitude,
        Math.min(
          input.permission.maxAltitude,
          input.targetAltitude > 0 ? input.targetAltitude : input.permission.defaultCruiseAltitude
        )
      )
    : 0;

  if (flightActive && Math.abs(input.verticalInput) > 0.01) {
    nextTargetAltitude = Math.max(
      GOD_FLIGHT_SPEC.minAirborneAltitude,
      Math.min(
        input.permission.maxAltitude,
        nextTargetAltitude +
          Math.sign(input.verticalInput) * GOD_FLIGHT_SPEC.verticalClimbSpeedPerSec * safeDt
      )
    );
  }

  let nextY = input.currentY;
  if (flightActive) {
    const altDiff = nextTargetAltitude - input.currentY;
    const maxStep = GOD_FLIGHT_SPEC.verticalClimbSpeedPerSec * safeDt;
    if (Math.abs(altDiff) <= maxStep) {
      nextY = nextTargetAltitude;
    } else {
      nextY = input.currentY + Math.sign(altDiff) * maxStep;
    }
    nextY = Math.max(0, Math.min(input.permission.maxAltitude, nextY));
  } else {
    // Smooth rapid landing when flight is toggled off
    const descentStep = GOD_FLIGHT_SPEC.verticalClimbSpeedPerSec * 1.5 * safeDt;
    nextY = Math.max(0, input.currentY - descentStep);
  }

  const isAirborne = flightActive && nextY >= GOD_FLIGHT_SPEC.minAirborneAltitude * 0.5;
  const effectiveSpeedMultiplier = isAirborne ? input.permission.flightSpeedMultiplier : 1.0;

  // 2. Compute horizontal movement in camera-relative world coordinates
  const moveLen = Math.hypot(input.moveInputX, input.moveInputZ);
  let nextX = input.currentX;
  let nextZ = input.currentZ;
  let worldMoveX = 0;
  let worldMoveZ = 0;
  const isMovingHorizontally = moveLen > 0.05;

  if (isMovingHorizontally) {
    const normX = input.moveInputX / moveLen;
    const normZ = input.moveInputZ / moveLen;
    const cosCam = Math.cos(input.cameraOrbitAngle);
    const sinCam = Math.sin(input.cameraOrbitAngle);

    worldMoveX = normX * cosCam - normZ * sinCam;
    worldMoveZ = normX * sinCam + normZ * cosCam;

    const stepDist = baseSpeed * effectiveSpeedMultiplier * safeDt;
    nextX = Math.max(-halfExtent, Math.min(halfExtent, input.currentX + worldMoveX * stepDist));
    nextZ = Math.max(-halfExtent, Math.min(halfExtent, input.currentZ + worldMoveZ * stepDist));
  }

  const bypassesCitadelWalls = isAirborne && nextY >= input.permission.citadelWallBypassAltitude;

  return {
    nextX,
    nextY,
    nextZ,
    nextTargetAltitude,
    isAirborne,
    bypassesCitadelWalls,
    effectiveSpeedMultiplier,
    worldMoveX,
    worldMoveZ,
    isMovingHorizontally,
  };
}

/**
 * Sovereign Divine Teleportation Specification for Root Creator (`creatergame31@gmail.com`).
 * Powered by the Presence, Space & Time Omni-Attributes:
 * - Omnipresent (Existing everywhere in the universe at the exact same moment)
 * - Omnilocal (Occupying every physical and spiritual location at once)
 * - Omnidistance (Spanning across infinite distances without boundary)
 * - Omnimobile (Moving freely and instantaneously across all realms)
 * - Omnispatial (Encompassing the entirety of space itself)
 */
export const GOD_TELEPORT_SPEC = {
  ownerEmail: PRIMARY_ADMIN_EMAIL,
  title: 'Sovereign Astral Spatial Warp & Omnipresent Teleportation',
  abilityTitle: 'Sovereign Astral Spatial Warp & Omnipresent Teleportation',
  forwardBlinkDistance: 12.0,
  forwardBlinkMeters: 12.0,
  worldHalfExtent: 100_000.0,
  maxWorldBoundXZ: 100_000.0,
  maxAltitude: 45.0,
  cooldownMs: 0,
  linkedOmniAttributeIds: [
    'Omnipresent',
    'Omnilocal',
    'Omnidistance',
    'Omnimobile',
    'Omnispatial',
  ] as const,
  waypoints: [
    {
      id: 'citadel_gate',
      label: 'Solara Citadel South Gate',
      shortLabel: 'Citadel Gate',
      icon: '🏰',
      x: 0,
      y: 0,
      z: 18,
      requiresFlight: false,
    },
    {
      id: 'citadel_spire',
      label: 'Imperial Citadel Apex Spire',
      shortLabel: 'Citadel Spire (18m)',
      icon: '👑',
      x: 0,
      y: 18.0,
      z: 0,
      requiresFlight: true,
    },
    {
      id: 'celestia_sky_island',
      label: 'Celestia Sky Island Sanctum',
      shortLabel: 'Sky Island (28m)',
      icon: '🏝️',
      x: -18,
      y: 28.0,
      z: -18,
      requiresFlight: true,
    },
    {
      id: 'ender_titan_arena',
      label: 'Apex World Boss Arena (Lv.1000 Titan)',
      shortLabel: 'Boss Arena',
      icon: '🐉',
      x: 24,
      y: 8.5,
      z: -24,
      requiresFlight: true,
    },
    {
      id: 'diamond_leyline',
      label: 'Diamond Crystal Leyline Outcrop',
      shortLabel: 'Diamond Node',
      icon: '💎',
      x: -24,
      y: 0,
      z: 14,
      requiresFlight: false,
    },
    {
      id: 'eastern_sakura',
      label: 'Eastern Sakura Spirit Grove',
      shortLabel: 'Sakura Grove',
      icon: '🌸',
      x: 26,
      y: 0,
      z: 16,
      requiresFlight: false,
    },
    {
      id: 'northern_glacier',
      label: 'Northern Frostpeak Glacier',
      shortLabel: 'Frostpeak',
      icon: '❄️',
      x: 0,
      y: 8.5,
      z: -32,
      requiresFlight: true,
    },
    {
      id: 'apex_stratosphere',
      label: 'Nine-Heavens Stratosphere Throne',
      shortLabel: 'Stratosphere (45m)',
      icon: '🌌',
      x: 0,
      y: 45.0,
      z: 0,
      requiresFlight: true,
    },
  ] as const,
} as const;

export type GodTeleportWaypointId = (typeof GOD_TELEPORT_SPEC.waypoints)[number]['id'];

export interface GodTeleportPermissionStatus {
  email: string;
  isRootGodAccount: boolean;
  allowed: boolean;
  cooldownMs: number;
  forwardBlinkDistance: number;
  forwardBlinkMeters: number;
  maxAltitude: number;
  worldHalfExtent: number;
  maxWorldBoundXZ: number;
  title: string;
  abilityTitle: string;
  linkedOmniAttributeIds: readonly string[];
  reason: string;
}

/**
 * Evaluates whether the specified account is authorized for Sovereign Divine Teleportation.
 * Fail-closed: only `creatergame31@gmail.com` with Godmode active is granted Sovereign Divine Teleportation.
 */
export function evaluateGodTeleportPermission(
  email: string | null | undefined,
  godmodeEnabled: boolean = true
): GodTeleportPermissionStatus {
  const normalized = (email || '').trim().toLowerCase();
  const isRoot = isPrimaryAdminAccount(normalized);
  const allowed = Boolean(isRoot && godmodeEnabled);

  if (!allowed) {
    return {
      email: normalized || 'guest@voxelrealms.example',
      isRootGodAccount: isRoot,
      allowed: false,
      cooldownMs: 30_000,
      forwardBlinkDistance: 0,
      forwardBlinkMeters: 0,
      maxAltitude: 0,
      worldHalfExtent: GOD_TELEPORT_SPEC.worldHalfExtent,
      maxWorldBoundXZ: GOD_TELEPORT_SPEC.maxWorldBoundXZ,
      title: GOD_TELEPORT_SPEC.title,
      abilityTitle: GOD_TELEPORT_SPEC.abilityTitle,
      linkedOmniAttributeIds: [],
      reason: isRoot
        ? `Sovereign Divine Teleportation paused (Godmode toggle is currently disabled for ${PRIMARY_ADMIN_EMAIL}).`
        : `DENIED [Fail-Closed]: Sovereign Divine Teleportation is reserved exclusively for Root Creator (${PRIMARY_ADMIN_EMAIL}).`,
    };
  }

  return {
    email: PRIMARY_ADMIN_EMAIL,
    isRootGodAccount: true,
    allowed: true,
    cooldownMs: 0,
    forwardBlinkDistance: GOD_TELEPORT_SPEC.forwardBlinkDistance,
    forwardBlinkMeters: GOD_TELEPORT_SPEC.forwardBlinkMeters,
    maxAltitude: GOD_TELEPORT_SPEC.maxAltitude,
    worldHalfExtent: GOD_TELEPORT_SPEC.worldHalfExtent,
    maxWorldBoundXZ: GOD_TELEPORT_SPEC.maxWorldBoundXZ,
    title: GOD_TELEPORT_SPEC.title,
    abilityTitle: GOD_TELEPORT_SPEC.abilityTitle,
    linkedOmniAttributeIds: GOD_TELEPORT_SPEC.linkedOmniAttributeIds,
    reason: `AUTHORIZED: Sovereign Divine Teleportation active for ${PRIMARY_ADMIN_EMAIL} (0ms Cooldown · 8 Realm Waypoints · Forward Blink · Custom XYZ Warp).`,
  };
}

export interface GodTeleportJumpInput {
  mode: 'waypoint' | 'coordinates' | 'forward_blink';
  waypointId?: GodTeleportWaypointId;
  targetX?: number;
  targetY?: number;
  targetZ?: number;
  currentX: number;
  currentY: number;
  currentZ: number;
  facingAngleRad?: number;
  permission: GodTeleportPermissionStatus;
}

export interface GodTeleportJumpOutput {
  teleported: boolean;
  nextX: number;
  nextY: number;
  nextZ: number;
  distanceTraveled: number;
  distanceMovedMeters: number;
  activatesFlight: boolean;
  destinationLabel: string;
  reason: string;
}

/**
 * Pure deterministic solver for Sovereign Divine Teleportation (`creatergame31@gmail.com`).
 * Supports instant teleportation to any of the 8 Sovereign Waypoints, arbitrary `(X, Y, Z)`
 * coordinates (or Shift+Click ground targets), or a `+12m` Forward Astral Blink.
 */
export function executeGodTeleportJump(input: GodTeleportJumpInput): GodTeleportJumpOutput {
  if (!input.permission.allowed) {
    return {
      teleported: false,
      nextX: input.currentX,
      nextY: input.currentY,
      nextZ: input.currentZ,
      distanceTraveled: 0,
      distanceMovedMeters: 0,
      activatesFlight: false,
      destinationLabel: 'Locked',
      reason: input.permission.reason,
    };
  }

  const halfExtent = input.permission.worldHalfExtent || GOD_TELEPORT_SPEC.worldHalfExtent;
  const maxAlt = input.permission.maxAltitude || GOD_TELEPORT_SPEC.maxAltitude;

  let desiredX = input.currentX;
  let desiredY = input.currentY;
  let desiredZ = input.currentZ;
  let destinationLabel = 'Astral Coordinates';

  if (input.mode === 'waypoint') {
    const wp =
      GOD_TELEPORT_SPEC.waypoints.find((w) => w.id === input.waypointId) ??
      GOD_TELEPORT_SPEC.waypoints[0];
    desiredX = wp.x;
    desiredY = wp.y;
    desiredZ = wp.z;
    destinationLabel = `${wp.icon} ${wp.label}`;
  } else if (input.mode === 'forward_blink') {
    const angle = input.facingAngleRad ?? 0;
    const dist = input.permission.forwardBlinkDistance || GOD_TELEPORT_SPEC.forwardBlinkDistance;
    desiredX = input.currentX + Math.sin(angle) * dist;
    desiredZ = input.currentZ + Math.cos(angle) * dist;
    desiredY = input.currentY;
    destinationLabel = `⚡ Forward Astral Blink (+${dist}m)`;
  } else {
    desiredX = Number.isFinite(input.targetX) ? Number(input.targetX) : input.currentX;
    desiredY = Number.isFinite(input.targetY) ? Number(input.targetY) : input.currentY;
    desiredZ = Number.isFinite(input.targetZ) ? Number(input.targetZ) : input.currentZ;
    destinationLabel = `⚡ Astral Warp (${desiredX.toFixed(1)}, ${desiredY.toFixed(1)}m, ${desiredZ.toFixed(1)})`;
  }

  let nextX = Math.max(-halfExtent, Math.min(halfExtent, Number(desiredX.toFixed(2))));
  let nextY = Math.max(0, Math.min(maxAlt, Number(desiredY.toFixed(2))));
  let nextZ = Math.max(-halfExtent, Math.min(halfExtent, Number(desiredZ.toFixed(2))));

  // If teleporting to ground level inside the Citadel Keep footprint, push cleanly outside the keep gate
  // unless teleporting to an airborne elevation (nextY >= 2.5m).
  if (
    nextY < GOD_FLIGHT_SPEC.citadelWallBypassAltitude &&
    Math.abs(nextX) < 5.9 &&
    Math.abs(nextZ) < 5.9
  ) {
    nextZ = 6.2;
  }

  const activatesFlight = nextY >= GOD_FLIGHT_SPEC.minAirborneAltitude;
  const distanceTraveled = Number(
    Math.hypot(nextX - input.currentX, nextY - input.currentY, nextZ - input.currentZ).toFixed(2)
  );

  return {
    teleported: true,
    nextX,
    nextY,
    nextZ,
    distanceTraveled,
    distanceMovedMeters: distanceTraveled,
    activatesFlight,
    destinationLabel,
    reason: `⚡ Teleported ${PRIMARY_ADMIN_EMAIL} to ${destinationLabel} [${nextX.toFixed(1)}, ${nextY.toFixed(1)}m, ${nextZ.toFixed(1)}] (${distanceTraveled}m warp · 0ms cooldown).`,
  };
}
