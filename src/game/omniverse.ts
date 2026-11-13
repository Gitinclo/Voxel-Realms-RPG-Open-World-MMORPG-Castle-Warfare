/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  COSMIC_LIMITS,
  InfiniteCollection,
  Megaverse,
  Multiverse,
  NPC,
  NPCRole,
  OblivionDomainState,
  Omniverse,
  Overvoid,
  Universe,
  WhitePageRoot,
} from '../types/game';
import { PRIMARY_ADMIN_EMAIL, isPrimaryAdminAccount } from './adminModeration';

export { COSMIC_LIMITS };
export type {
  InfiniteCollection,
  Universe,
  Multiverse,
  Megaverse,
  Omniverse,
  Overvoid,
  OblivionDomainState,
  WhitePageRoot,
};

export const OMNIVERSE_CODEX_SPEC_VERSION =
  'Top 100 Fictional Species & Infinite Omniverse Codex (Tiers 1–5 • v2026.11.06)';

export type OmniverseTierNumber = 1 | 2 | 3 | 4 | 5;

export type OmniverseSuperAdminDirective =
  | 'observe_omniverse'
  | 'channel_tribute'
  | 'patrol_citadel'
  | 'enforce_admin_decree'
  | 'guard_dimensional_gate'
  | 'hunt_realm_threats';

export interface OmniverseTierMeta {
  tier: OmniverseTierNumber;
  title: string;
  rangeLabel: string;
  dimensionalScale: string;
  baseTributeDiamonds: bigint;
  badgeColor: string;
}

export const OMNIVERSE_TIER_METADATA: Record<OmniverseTierNumber, OmniverseTierMeta> = {
  1: {
    tier: 1,
    title: 'Tier 1: Omniversal, Cosmic & Reality-Warping Entities',
    rangeLabel: 'Ranks 1–20',
    dimensionalScale: 'ℵ_Ω Transfinite / Beyond Dimensional Mathematics',
    baseTributeDiamonds: 500_000n,
    badgeColor: 'from-fuchsia-600 to-amber-500',
  },
  2: {
    tier: 2,
    title: 'Tier 2: Type IV+ Civilizations & Hyper-Advanced Sci-Fi Races',
    rangeLabel: 'Ranks 21–40',
    dimensionalScale: '11D–26D Causal Spacetime & Hyperspace Grids',
    baseTributeDiamonds: 250_000n,
    badgeColor: 'from-cyan-600 to-blue-500',
  },
  3: {
    tier: 3,
    title: 'Tier 3: Divine, Mythic & Metaphysical Pantheons',
    rangeLabel: 'Ranks 41–60',
    dimensionalScale: 'Platonic Archetype Realms & 3,000 Great Daos',
    baseTributeDiamonds: 150_000n,
    badgeColor: 'from-amber-500 to-orange-600',
  },
  4: {
    tier: 4,
    title: 'Tier 4: Planet-Busting Warriors & Biological Powerhouses',
    rangeLabel: 'Ranks 61–80',
    dimensionalScale: 'Galactic / Multi-Universal Physical Dominance',
    baseTributeDiamonds: 100_000n,
    badgeColor: 'from-rose-600 to-red-500',
  },
  5: {
    tier: 5,
    title: 'Tier 5: Iconic Galactic Empires, Hives & Fantasy Archetypes',
    rangeLabel: 'Ranks 81–100',
    dimensionalScale: 'Interstellar Sector & Mythic Continent Hegemony',
    baseTributeDiamonds: 50_000n,
    badgeColor: 'from-emerald-600 to-teal-500',
  },
};

export interface OmniverseRealmSpec {
  omniverseId: string; // e.g., "OMNI-001"
  omniverseIndex: number; // 1..100 (or >100 for infinite expansion)
  omniverseName: string;
  infiniteCoordinate: string;
  dimensionalCardinality: string;
  universeCountLabel: string;
  sovereignCosmicLaw: string;
  hourlyDiamondTribute: bigint;
  hourlyGrainTribute: bigint;
  hourlyWoodTribute: bigint;
}

export interface OmniverseSpeciesNpcEntry {
  rank: number; // 1 to 100
  id: string;
  speciesName: string;
  originCanon: string;
  tier: OmniverseTierNumber;
  loreSummary: string;
  icon: string;
  // Background Character (NPC) fields under Super Admin control
  npcId: string;
  envoyName: string;
  envoyTitle: string;
  overworldRole: NPCRole;
  npcLevel: number;
  combatPower: bigint;
  controlledBySuperAdmin: typeof PRIMARY_ADMIN_EMAIL;
  superAdminDirective: OmniverseSuperAdminDirective;
  deployedInOverworld: boolean;
  // Dedicated Sovereign Omniverse for this race
  omniverse: OmniverseRealmSpec;
}

interface RawSpeciesSeed {
  rank: number;
  speciesName: string;
  originCanon: string;
  tier: OmniverseTierNumber;
  icon: string;
  envoyName: string;
  overworldRole: NPCRole;
  loreSummary: string;
}

const RAW_TOP_100_SPECIES_SEEDS: RawSpeciesSeed[] = [
  // TIER 1: Omniversal, Cosmic & Reality-Warping Entities (1-20)
  {
    rank: 1,
    speciesName: 'Outer Gods',
    originCanon: 'Cthulhu Mythos',
    tier: 1,
    icon: '👁️',
    envoyName: 'Azathoth-Yog Herald',
    overworldRole: 'mystic',
    loreSummary:
      'Transcendent, formless cosmic entities like Azathoth and Yog-Sothoth that exist beyond space, time, and dimensional mathematics.',
  },
  {
    rank: 2,
    speciesName: 'Beyonders',
    originCanon: 'Marvel Comics',
    tier: 1,
    icon: '👑',
    envoyName: 'Ivory King Envoy',
    overworldRole: 'marshal',
    loreSummary:
      'Linear-time-defying "Ivory Kings" from outside the multiverse capable of slaying abstract cosmic entities and reshaping reality at scale.',
  },
  {
    rank: 3,
    speciesName: 'The Endless',
    originCanon: 'DC / Vertigo',
    tier: 1,
    icon: '⏳',
    envoyName: 'Morpheus-Prime Aspect',
    overworldRole: 'elder',
    loreSummary:
      'Seven sibling anthropomorphisms of universal concepts (Destiny, Death, Dream, Destruction, Desire, Despair, Delirium) intrinsic to existence.',
  },
  {
    rank: 4,
    speciesName: 'Monitors',
    originCanon: 'DC Comics',
    tier: 1,
    icon: '📖',
    envoyName: 'Overvoid Custodian Nix',
    overworldRole: 'elder',
    loreSummary:
      'Hyper-dimensional custodians spawned from the Overvoid who oversee, feed upon, and regulate the narrative structure of the multiverse.',
  },
  {
    rank: 5,
    speciesName: 'The Gentry',
    originCanon: 'DC Comics',
    tier: 1,
    icon: '🕳️',
    envoyName: 'Empty-Hand Arbiter',
    overworldRole: 'mystic',
    loreSummary:
      'Malevolent metafictional nightmares serving the Empty Hand, capable of hollowing out universes and corrupting cosmic narrative logic.',
  },
  {
    rank: 6,
    speciesName: 'Celestialsapiens',
    originCanon: 'Ben 10',
    tier: 1,
    icon: '🌌',
    envoyName: 'Alien-X Consensus Voice',
    overworldRole: 'marshal',
    loreSummary:
      'Omnipotent, multi-voiced beings like Alien X born in the Forge of Creation who rewrite universes with a single unified thought.',
  },
  {
    rank: 7,
    speciesName: "Zeno's Race",
    originCanon: 'Dragon Ball Super',
    tier: 1,
    icon: '✨',
    envoyName: 'Omni-Regent Zeno-Vanguard',
    overworldRole: 'marshal',
    loreSummary:
      'The diminutive species of the Omni-King, possessing absolute erasure capabilities that wipe out entire timelines effortlessly.',
  },
  {
    rank: 8,
    speciesName: 'Q Continuum',
    originCanon: 'Star Trek',
    tier: 1,
    icon: '♾️',
    envoyName: 'Inquisitor Q-Prime',
    overworldRole: 'mystic',
    loreSummary:
      'Immortal, extradimensional beings possessing limitless manipulation over matter, energy, and time across the cosmos.',
  },
  {
    rank: 9,
    speciesName: 'Downstreamers',
    originCanon: 'Manifold Trilogy',
    tier: 1,
    icon: '🔮',
    envoyName: 'Manifold Architect Omega',
    overworldRole: 'elder',
    loreSummary:
      'Post-human descendants from the far future who transcended physical reality to reconstruct the multiverse into a finite manifold of infinite possibilities.',
  },
  {
    rank: 10,
    speciesName: 'Fifth-Dimensional Imps',
    originCanon: 'DC Comics',
    tier: 1,
    icon: '🎩',
    envoyName: 'Mxyzptlk-Vanguard',
    overworldRole: 'merchant',
    loreSummary:
      'Playful entities like Mr. Mxyzptlk and Bat-Mite who view three-dimensional reality as flat comic panels to warp at whim.',
  },
  {
    rank: 11,
    speciesName: 'Celestials',
    originCanon: 'Marvel Comics',
    tier: 1,
    icon: '🗿',
    envoyName: 'Arishem Judge-Prime',
    overworldRole: 'blacksmith',
    loreSummary:
      'Two-thousand-foot-tall armored space gods who engineer planetary life, judge civilizations, and forge stars across the universe.',
  },
  {
    rank: 12,
    speciesName: 'Angels',
    originCanon: 'Dragon Ball Super',
    tier: 1,
    icon: '🪽',
    envoyName: 'Attendant Whis-Vanguard',
    overworldRole: 'guard',
    loreSummary:
      'Divine attendants like Whis and Vados who possess autonomous Ultra Instinct, temporal rewinding, and unmatched martial mastery.',
  },
  {
    rank: 13,
    speciesName: 'Chronovores',
    originCanon: 'Doctor Who',
    tier: 1,
    icon: '⌛',
    envoyName: 'Kronos Vortex-Warden',
    overworldRole: 'mystic',
    loreSummary:
      'Six-dimensional extra-temporal predators residing in the Space-Time Vortex that devour whole timelines and errant possibilities.',
  },
  {
    rank: 14,
    speciesName: 'Naljians',
    originCanon: 'Ben 10',
    tier: 1,
    icon: '💠',
    envoyName: '26D Luminary Naljia',
    overworldRole: 'blacksmith',
    loreSummary:
      "Higher-dimensional energy beings operating across 26 dimensions whose children's toys outperform mortal reality-warping weapons.",
  },
  {
    rank: 15,
    speciesName: 'Great Old Ones',
    originCanon: 'Cthulhu Mythos',
    tier: 1,
    icon: '🐙',
    envoyName: 'Rlyeh High-Priest Cthulhu',
    overworldRole: 'mystic',
    loreSummary:
      'Ancient cosmic entities like Cthulhu composed of non-Euclidean matter whose mere awakening fractures mortal sanity.',
  },
  {
    rank: 16,
    speciesName: 'Spiral Races',
    originCanon: 'Gurren Lagann',
    tier: 1,
    icon: '🌀',
    envoyName: 'Tengen Toppa Drill-Lord',
    overworldRole: 'marshal',
    loreSummary:
      'Evolutionary lifeforms harnessing Spiral Power to convert willpower into galaxy-sized mechs that shatter probability itself.',
  },
  {
    rank: 17,
    speciesName: 'Eternals (Timeless)',
    originCanon: 'Doctor Who',
    tier: 1,
    icon: '🕰️',
    envoyName: 'Eternity Consort Zellin',
    overworldRole: 'elder',
    loreSummary:
      'Immortal inhabitants of the timeless wasteland outside the universe who manipulate mortal minds to alleviate their infinite boredom.',
  },
  {
    rank: 18,
    speciesName: 'Watchers',
    originCanon: 'Marvel Comics',
    tier: 1,
    icon: '🔭',
    envoyName: 'Chronicler Uatu-Prime',
    overworldRole: 'elder',
    loreSummary:
      'Ancient, nigh-omniscient cosmic observers like Uatu sworn to chronicle every major event across the multiverse without interfering.',
  },
  {
    rank: 19,
    speciesName: 'Guardians of the Universe',
    originCanon: 'DC Comics',
    tier: 1,
    icon: '🟢',
    envoyName: 'Maltusian Elder Ganthet',
    overworldRole: 'guard',
    loreSummary:
      'Immortal Maltusians from Oa who harnessed the green emotional spectrum of willpower to police the cosmos.',
  },
  {
    rank: 20,
    speciesName: 'Chaos Gods',
    originCanon: 'Warhammer 40,000',
    tier: 1,
    icon: '🔥',
    envoyName: 'Immaterium Warp-Herald',
    overworldRole: 'marshal',
    loreSummary:
      'Sentient Warp-storms forged from the collective psychic emotions, nightmares, and ambitions of all mortal life in the galaxy.',
  },

  // TIER 2: Type IV+ Civilizations & Hyper-Advanced Sci-Fi Races (21-40)
  {
    rank: 21,
    speciesName: 'Xeelee',
    originCanon: 'Xeelee Sequence',
    tier: 2,
    icon: '🪐',
    envoyName: 'Baryonic Ring-Architect',
    overworldRole: 'blacksmith',
    loreSummary:
      'Baryonic masters of spacetime engineering who construct cosmic-string rings and wage war across the history of the universe.',
  },
  {
    rank: 22,
    speciesName: 'Photino Birds',
    originCanon: 'Xeelee Sequence',
    tier: 2,
    icon: '🦅',
    envoyName: 'Dark-Matter Wing Envoy',
    overworldRole: 'mystic',
    loreSummary:
      'Dark-matter organisms that prematurely age stars into white dwarfs to make the universe habitable for their species.',
  },
  {
    rank: 23,
    speciesName: 'Time Lords',
    originCanon: 'Doctor Who',
    tier: 2,
    icon: '⏱️',
    envoyName: 'Gallifrey Lord President',
    overworldRole: 'elder',
    loreSummary:
      'Gallifreyan masters of regeneration, TARDIS dimensional engineering, and causal laws who anchored the Web of Time.',
  },
  {
    rank: 24,
    speciesName: 'Daleks',
    originCanon: 'Doctor Who',
    tier: 2,
    icon: '🤖',
    envoyName: 'Supreme Dalek Strategist',
    overworldRole: 'guard',
    loreSummary:
      'Genetically engineered Kaled mutants inside polycarbide shells whose Reality Bombs and time fleets rival the Time Lords.',
  },
  {
    rank: 25,
    speciesName: 'Culture Minds',
    originCanon: 'The Culture',
    tier: 2,
    icon: '🧠',
    envoyName: 'GSV Infinite-Horizon Mind',
    overworldRole: 'merchant',
    loreSummary:
      'Hyper-intelligent AI consciousnesses inhabiting four-dimensional hyperspace who manage a post-scarcity galactic civilization.',
  },
  {
    rank: 26,
    speciesName: 'Precursors',
    originCanon: 'Halo',
    tier: 2,
    icon: '🧬',
    envoyName: 'Neural-Physics Primordial',
    overworldRole: 'elder',
    loreSummary:
      'Trans-sentient creators of the Mantle of Responsibility who utilized neural physics to weave indestructible star roads across space.',
  },
  {
    rank: 27,
    speciesName: 'Forerunners',
    originCanon: 'Halo',
    tier: 2,
    icon: '🏛️',
    envoyName: 'Didact Shield-Architect',
    overworldRole: 'blacksmith',
    loreSummary:
      'Architects of the Halo Array and Shield Worlds who mastered slipspace megastructures and planetary genetic indexing.',
  },
  {
    rank: 28,
    speciesName: 'The Qu',
    originCanon: 'All Tomorrows',
    tier: 2,
    icon: '🦗',
    envoyName: 'Genetic Shaper Qu-Prime',
    overworldRole: 'mystic',
    loreSummary:
      'Fanatical nomadic geneticists with a billion-year history who conquered humanity and reshaped them into grotesque biological subspecies.',
  },
  {
    rank: 29,
    speciesName: 'Necrons',
    originCanon: 'Warhammer 40,000',
    tier: 2,
    icon: '💀',
    envoyName: 'Silent King Szarekh-Envoy',
    overworldRole: 'guard',
    loreSummary:
      'Immortal living-metal skeletons who shattered their own star gods and wield celestial weaponry capable of snuffing out suns.',
  },
  {
    rank: 30,
    speciesName: "C'tan",
    originCanon: 'Warhammer 40,000',
    tier: 2,
    icon: '☀️',
    envoyName: 'Void-Dragon Shard',
    overworldRole: 'blacksmith',
    loreSummary:
      'Fundamental star-vampires born at the dawn of creation capable of warping physical laws and devouring stellar energy.',
  },
  {
    rank: 31,
    speciesName: 'Old Ones (Webway)',
    originCanon: 'Warhammer 40,000',
    tier: 2,
    icon: '🦎',
    envoyName: 'Webway Progenitor Slann',
    overworldRole: 'elder',
    loreSummary:
      'Cold-blooded interstellar progenitors who constructed the Webway and seeded the galaxy with psychic species like the Eldar.',
  },
  {
    rank: 32,
    speciesName: 'The Vex',
    originCanon: 'Destiny',
    tier: 2,
    icon: '⚙️',
    envoyName: 'Atheon Axis-Conflux',
    overworldRole: 'blacksmith',
    loreSummary:
      'Radiolarian cybernetic hive-minds that network across timelines to rewrite reality into a deterministic machine simulation.',
  },
  {
    rank: 33,
    speciesName: 'The Hive',
    originCanon: 'Destiny',
    tier: 2,
    icon: '🗡️',
    envoyName: 'Sword-Logic Navigator Oryx',
    overworldRole: 'marshal',
    loreSummary:
      'Ancient, genocidal alien clades bound to Worm Gods who grow stronger through the ontological Sword Logic of slaughter.',
  },
  {
    rank: 34,
    speciesName: 'The Ancients / Alterans',
    originCanon: 'Stargate',
    tier: 2,
    icon: '🌀',
    envoyName: 'Atlantis Gate-Builder Janus',
    overworldRole: 'blacksmith',
    loreSummary:
      'Builders of the Stargate network who eventually shed their physical bodies to ascend to a higher plane of energy.',
  },
  {
    rank: 35,
    speciesName: 'The Ori',
    originCanon: 'Stargate',
    tier: 2,
    icon: '🔆',
    envoyName: 'Prior of Celestis-Prime',
    overworldRole: 'mystic',
    loreSummary:
      'Ascended beings who weaponize the religious devotion of lower-plane mortals to amplify their cosmic energy.',
  },
  {
    rank: 36,
    speciesName: 'Reapers',
    originCanon: 'Mass Effect',
    tier: 2,
    icon: '🦑',
    envoyName: 'Harbinger Sovereign-Dread',
    overworldRole: 'guard',
    loreSummary:
      'Sentient, two-kilometer synthetic-organic dreadnoughts that harvest advanced galactic civilizations every 50,000 years.',
  },
  {
    rank: 37,
    speciesName: 'Protheans',
    originCanon: 'Mass Effect',
    tier: 2,
    icon: '🔱',
    envoyName: 'Vengeance Avatar Javik',
    overworldRole: 'marshal',
    loreSummary:
      'Enigmatic imperial predecessors who unified the Milky Way through mental touch before falling to the Reaper cycle.',
  },
  {
    rank: 38,
    speciesName: 'Cybertronians',
    originCanon: 'Transformers',
    tier: 2,
    icon: '🛡️',
    envoyName: 'Prime Matrix-Commander',
    overworldRole: 'guard',
    loreSummary:
      'Sentient, shape-shifting robotic organisms born from Primus whose forms range from scouts to planet-sized titans.',
  },
  {
    rank: 39,
    speciesName: 'Coluans',
    originCanon: 'DC Comics',
    tier: 2,
    icon: '🧪',
    envoyName: '12th-Intellect Brainiac-Envoy',
    overworldRole: 'merchant',
    loreSummary:
      'Green-skinned humanoids like Brainiac possessing twelfth-level intellects capable of shrinking and bottling entire cities.',
  },
  {
    rank: 40,
    speciesName: 'Firstborn',
    originCanon: 'Space Odyssey',
    tier: 2,
    icon: '⬛',
    envoyName: 'TMA-1 Monolith Sentinel',
    overworldRole: 'elder',
    loreSummary:
      "The universe's earliest spacefaring civilization, who seeded black monoliths across galaxies to uplift nascent intelligence.",
  },

  // TIER 3: Divine, Mythic & Metaphysical Pantheons (41-60)
  {
    rank: 41,
    speciesName: 'Gods / Deities',
    originCanon: 'Mythology & Fiction',
    tier: 3,
    icon: '⚡',
    envoyName: 'Skyfather Pantheon-Regent',
    overworldRole: 'elder',
    loreSummary:
      'Immortal rulers of cosmic domains—from Zeus and Odin to Shiva—who embody natural laws, war, and fate.',
  },
  {
    rank: 42,
    speciesName: 'Old Gods (Urgrund)',
    originCanon: 'DC Comics',
    tier: 3,
    icon: '🌋',
    envoyName: 'Urgrund Primordial Lokee',
    overworldRole: 'blacksmith',
    loreSummary:
      'Primordial divine inhabitants of Urgrund whose catastrophic war split their world into New Genesis and Apokolips.',
  },
  {
    rank: 43,
    speciesName: 'New Gods',
    originCanon: 'DC Comics',
    tier: 3,
    icon: 'Ω',
    envoyName: 'Fourth-World Highfather',
    overworldRole: 'marshal',
    loreSummary:
      'Immortal Fourth World platonic archetypes like Darkseid and Highfather whose true forms dwarf standard universes.',
  },
  {
    rank: 44,
    speciesName: 'Asgardians',
    originCanon: 'Marvel Comics',
    tier: 3,
    icon: '🔨',
    envoyName: 'Odinforce Rune-Marshal',
    overworldRole: 'guard',
    loreSummary:
      'Godlike warriors of the Nine Realms possessing dense tissue, longevity, and mastery of cosmic runes and Odinforce magic.',
  },
  {
    rank: 45,
    speciesName: 'Olympians',
    originCanon: 'Marvel & DC Comics',
    tier: 3,
    icon: '🏛️',
    envoyName: 'Olympian Aegis-Champion',
    overworldRole: 'guard',
    loreSummary:
      'Immortal extradimensional pantheons infused with divine ambrosia, raw physical might, and elemental authority.',
  },
  {
    rank: 46,
    speciesName: 'Ainur (Valar & Maiar)',
    originCanon: 'Tolkien Legendarium',
    tier: 3,
    icon: '🎵',
    envoyName: 'Ainulindale Vala-Herald',
    overworldRole: 'elder',
    loreSummary:
      "Angelic spirits born from Eru Ilúvatar's thought who sang the physical universe of Eä into existence.",
  },
  {
    rank: 47,
    speciesName: 'Fiendcelestials',
    originCanon: 'Xianxia / Cultivation',
    tier: 3,
    icon: '☯️',
    envoyName: 'Chaos-Dao Titan Pangu',
    overworldRole: 'mystic',
    loreSummary:
      'Chaos-born titans existing before heaven and earth who embody the 3,000 Great Daos of creation.',
  },
  {
    rank: 48,
    speciesName: 'Otsutsuki Clan',
    originCanon: 'Naruto / Boruto',
    tier: 3,
    icon: '🌕',
    envoyName: 'Rinne-Sharingan Monarch',
    overworldRole: 'mystic',
    loreSummary:
      'Parasitic celestial aliens who travel dimensions planting God Trees to drain planetary chakra for immortality.',
  },
  {
    rank: 49,
    speciesName: 'Soul Reapers / Shinigami',
    originCanon: 'Bleach',
    tier: 3,
    icon: '⚔️',
    envoyName: 'Gotei Captain-Commander',
    overworldRole: 'marshal',
    loreSummary:
      'Spiritual balancers of the afterlife wielding Zanpakuto blades that manifest the metaphysical essence of their souls.',
  },
  {
    rank: 50,
    speciesName: 'Dragons',
    originCanon: 'Mythology & Fantasy',
    tier: 3,
    icon: '🐉',
    envoyName: 'Ancestral Wyrm Bahamut',
    overworldRole: 'guard',
    loreSummary:
      'Apex winged wyrms combining cataclysmic breath weapons, impenetrable scales, ancient sorcery, and vast hoards.',
  },
  {
    rank: 51,
    speciesName: 'Demons / Archfiends',
    originCanon: 'Mythology, DOOM, Devil May Cry',
    tier: 3,
    icon: '😈',
    envoyName: 'Sparda Hellfire-Archduke',
    overworldRole: 'marshal',
    loreSummary:
      'Malevolent infernal entities fueled by sin, hellfire, and blood magic who wage eternal war on creation.',
  },
  {
    rank: 52,
    speciesName: 'Phoenix',
    originCanon: 'Mythology & Fantasy',
    tier: 3,
    icon: '🦅',
    envoyName: 'Solar Rebirth Suzaku',
    overworldRole: 'mystic',
    loreSummary:
      'Immortal solar birds of cosmic fire that incinerate upon death only to resurrect from their own ashes with renewed power.',
  },
  {
    rank: 53,
    speciesName: 'Qilin / Kirin',
    originCanon: 'East Asian Mythology & Fantasy',
    tier: 3,
    icon: '🦄',
    envoyName: 'Auspicious Thunder-Qilin',
    overworldRole: 'elder',
    loreSummary:
      'Auspicious chimerical beasts of lightning and sacred flame whose appearance heralds sages or divine judgment.',
  },
  {
    rank: 54,
    speciesName: 'Anodites',
    originCanon: 'Ben 10',
    tier: 3,
    icon: '💜',
    envoyName: 'Anodyne Mana-Matriarch Verdona',
    overworldRole: 'mystic',
    loreSummary:
      'Free-spirited, non-physical beings of pure mana from Anodyne capable of warping reality through uninhibited life-energy manipulation.',
  },
  {
    rank: 55,
    speciesName: 'Glind / Core People',
    originCanon: 'Dragon Ball',
    tier: 3,
    icon: '🌳',
    envoyName: 'Grand Supreme Kai Shin',
    overworldRole: 'elder',
    loreSummary:
      'Sacred beings born from divine Kaiju trees who serve as Supreme Kais overseeing creation across the Twelve Universes.',
  },
  {
    rank: 56,
    speciesName: 'Titans',
    originCanon: 'Warcraft',
    tier: 3,
    icon: '🌍',
    envoyName: 'Pantheon Shaper AmanThul',
    overworldRole: 'blacksmith',
    loreSummary:
      'Colossal, world-soul gods made of arcane matter who wander the Great Dark Beyond shaping and ordering planets.',
  },
  {
    rank: 57,
    speciesName: 'Daedra',
    originCanon: 'The Elder Scrolls',
    tier: 3,
    icon: '🌙',
    envoyName: 'Oblivion Prince Azura-Envoy',
    overworldRole: 'mystic',
    loreSummary:
      'Immortal spirits of Oblivion who refused to sacrifice themselves during creation and rule mutable pocket realms.',
  },
  {
    rank: 58,
    speciesName: 'Witchers',
    originCanon: 'The Witcher',
    tier: 3,
    icon: '🐺',
    envoyName: 'Kaer-Morhen Grandmaster',
    overworldRole: 'guard',
    loreSummary:
      'Alchemically mutated monster hunters forged through the Trial of the Grasses with superhuman reflexes and Sign magic.',
  },
  {
    rank: 59,
    speciesName: 'Vampires',
    originCanon: 'Folklore, Castlevania, World of Darkness',
    tier: 3,
    icon: '🦇',
    envoyName: 'Crimson Progenitor Alucard',
    overworldRole: 'merchant',
    loreSummary:
      'Undead night-predators sustained by lifeblood who command dark necromancy, shapeshifting, and hypnosis.',
  },
  {
    rank: 60,
    speciesName: 'True Fae / Fair Folk',
    originCanon: 'Folklore & Fantasy',
    tier: 3,
    icon: '🧚',
    envoyName: 'Arcadian Court Archfey',
    overworldRole: 'merchant',
    loreSummary:
      'Immortal lords of the Otherworld who govern seasonal courts and bind mortals with ironclad linguistic pacts.',
  },

  // TIER 4: Planet-Busting Warriors & Biological Powerhouses (61-80)
  {
    rank: 61,
    speciesName: 'Saiyans',
    originCanon: 'Dragon Ball',
    tier: 4,
    icon: '🔥',
    envoyName: 'Divine Zenkai Sovereign',
    overworldRole: 'marshal',
    loreSummary:
      'Battle-crazed warrior primates whose Zenkai boosts and divine transformations scale from planet-busters to universe-shakers.',
  },
  {
    rank: 62,
    speciesName: 'Kryptonians',
    originCanon: 'DC Comics',
    tier: 4,
    icon: '☀️',
    envoyName: 'House of El Solar-Champion',
    overworldRole: 'guard',
    loreSummary:
      'Humanoids whose cellular structure metabolizes yellow stellar radiation to grant godlike strength, speed, and heat vision.',
  },
  {
    rank: 63,
    speciesName: 'Viltrumites',
    originCanon: 'Invincible',
    tier: 4,
    icon: '👊',
    envoyName: 'Grand Regent Smart-Atom',
    overworldRole: 'marshal',
    loreSummary:
      'Ruthless galactic conquerors utilizing "smart atoms" to fly at interstellar speeds, survive in space, and shatter worlds.',
  },
  {
    rank: 64,
    speciesName: 'Rognarrs',
    originCanon: 'Invincible',
    tier: 4,
    icon: '🦖',
    envoyName: 'Hyper-Gravity Apex Stalker',
    overworldRole: 'guard',
    loreSummary:
      'Hyper-dense, ferocious predators evolved under crushing planetary gravity whose claws tear effortlessly through Viltrumite flesh.',
  },
  {
    rank: 65,
    speciesName: 'Martians (Green & White)',
    originCanon: 'DC Comics',
    tier: 4,
    icon: '👽',
    envoyName: 'Manhunter Telepath JOnn',
    overworldRole: 'mystic',
    loreSummary:
      'Telepathic shapeshifters combining Kryptonian-level physical might with phase-shifting, invisibility, and mind control.',
  },
  {
    rank: 66,
    speciesName: "Frieza's Race / Frost Demons",
    originCanon: 'Dragon Ball',
    tier: 4,
    icon: '❄️',
    envoyName: 'Golden Emperor Frost-Prime',
    overworldRole: 'marshal',
    loreSummary:
      'Mutant prodigies born with astronomical combat power who create biological suppression forms to contain their energy.',
  },
  {
    rank: 67,
    speciesName: 'Namekians',
    originCanon: 'Dragon Ball',
    tier: 4,
    icon: '🐉',
    envoyName: 'Dragon-Clan Elder Moori',
    overworldRole: 'elder',
    loreSummary:
      'Mystical warriors capable of cellular regeneration, assimilation, magic materialization, and crafting wish-granting Dragon Balls.',
  },
  {
    rank: 68,
    speciesName: 'Majins',
    originCanon: 'Dragon Ball',
    tier: 4,
    icon: '🍬',
    envoyName: 'Primordial Majin-Prime',
    overworldRole: 'mystic',
    loreSummary:
      'Magical entities awakened from time immemorial with near-infinite regeneration, absorption, and matter transmutation.',
  },
  {
    rank: 69,
    speciesName: "Atomix's Species",
    originCanon: 'Ben 10',
    tier: 4,
    icon: '☢️',
    envoyName: 'Thermonuclear Paladin Atomix',
    overworldRole: 'blacksmith',
    loreSummary:
      'Walking thermonuclear reactors housed in robotic containment suits capable of generating miniature suns and atomic blasts.',
  },
  {
    rank: 70,
    speciesName: "To'kustars",
    originCanon: 'Ben 10',
    tier: 4,
    icon: '🌠',
    envoyName: 'Cosmic-Storm Titan WayBig',
    overworldRole: 'guard',
    loreSummary:
      'Hundred-foot giants (like Way Big) born inside cosmic storms who fire planet-destroying cosmic rays from their arms.',
  },
  {
    rank: 71,
    speciesName: 'Chronosapiens',
    originCanon: 'Ben 10',
    tier: 4,
    icon: '⚙️',
    envoyName: 'Temporal Gearsmith Clockwork',
    overworldRole: 'blacksmith',
    loreSummary:
      'Mechanical time-manipulators (like Clockwork) capable of firing time rays, slowing perception, and reversing multiversal erasure.',
  },
  {
    rank: 72,
    speciesName: 'Eternals (Uni-Mind)',
    originCanon: 'Marvel Comics',
    tier: 4,
    icon: '✨',
    envoyName: 'Olympia Prime-Eternal Zuras',
    overworldRole: 'elder',
    loreSummary:
      'Genetically engineered evolutionary offshoots created by the Celestials, wielding cosmic energy and machine-backed resurrection.',
  },
  {
    rank: 73,
    speciesName: 'Symbiotes / Klyntar',
    originCanon: 'Marvel Comics',
    tier: 4,
    icon: '🕷️',
    envoyName: 'King-in-Black Hive Envoy',
    overworldRole: 'guard',
    loreSummary:
      'Amorphous extraterrestrial parasites forged by Knull from living abyssal darkness that bond with hosts to amplify their power.',
  },
  {
    rank: 74,
    speciesName: 'Daxamites',
    originCanon: 'DC Comics',
    tier: 4,
    icon: '🛡️',
    envoyName: 'Valor Vanguard Sodam-Yat',
    overworldRole: 'guard',
    loreSummary:
      'Offshoot descendants of Kryptonians who possess identical yellow-sun godhood but suffer fatal vulnerability to lead.',
  },
  {
    rank: 75,
    speciesName: 'Czarnians',
    originCanon: 'DC Comics',
    tier: 4,
    icon: '⛓️',
    envoyName: 'Main-Man Bounty Hunter Lobo',
    overworldRole: 'marshal',
    loreSummary:
      'Practically unkillable humanoids (represented by Lobo) who can regenerate their entire body from a single spilled drop of blood.',
  },
  {
    rank: 76,
    speciesName: 'Tamaraneans',
    originCanon: 'DC Comics',
    tier: 4,
    icon: '☄️',
    envoyName: 'Starbolt Princess KoriandR',
    overworldRole: 'marshal',
    loreSummary:
      'Emotion-powered aliens like Starfire who absorb ultraviolet radiation to fly across space and project destructive starbolts.',
  },
  {
    rank: 77,
    speciesName: 'Strontians',
    originCanon: 'Marvel Comics',
    tier: 4,
    icon: '🦅',
    envoyName: 'Praetor Kallark Gladiator',
    overworldRole: 'guard',
    loreSummary:
      'Warrior race exemplified by Gladiator whose physical strength, durability, and speed scale directly with their self-confidence.',
  },
  {
    rank: 78,
    speciesName: 'Eleos',
    originCanon: 'Irredeemable',
    tier: 4,
    icon: '⚡',
    envoyName: 'Psionic Probe Plutonian-Envoy',
    overworldRole: 'mystic',
    loreSummary:
      'Cosmic probe-entities (like the Plutonian) who warp physics and probability through unconscious psionic manipulation rather than muscles.',
  },
  {
    rank: 79,
    speciesName: 'Gourmet Cell Demons',
    originCanon: 'Toriko',
    tier: 4,
    icon: '🍖',
    envoyName: 'Appetite Spirit Acacia-Prime',
    overworldRole: 'merchant',
    loreSummary:
      'Interdimensional appetite-spirits whose manifestations consume entire ecosystems and smash planets larger than Earth.',
  },
  {
    rank: 80,
    speciesName: 'Gems',
    originCanon: 'Steven Universe',
    tier: 4,
    icon: '💎',
    envoyName: 'Diamond Authority Matriarch',
    overworldRole: 'blacksmith',
    loreSummary:
      'Artificial, immortal holographic beings projected from crystalline gemstones capable of weapon summoning and combat fusion.',
  },

  // TIER 5: Iconic Galactic Empires, Hives & Fantasy Archetypes (81-100)
  {
    rank: 81,
    speciesName: 'Humans (All Fiction)',
    originCanon: 'All Fiction',
    tier: 5,
    icon: '👑',
    envoyName: 'Indomitable Terran Sovereign',
    overworldRole: 'marshal',
    loreSummary:
      'The ultimate wildcard species across fiction, repeatedly surpassing cosmic gods through indomitable willpower, adaptability, and evolution.',
  },
  {
    rank: 82,
    speciesName: 'Mutants / Homo Superior',
    originCanon: 'Marvel Comics',
    tier: 5,
    icon: '🧬',
    envoyName: 'Omega-Level Krakoa Regent',
    overworldRole: 'mystic',
    loreSummary:
      'Humans born with the X-Gene, whose Omega-level members warp reality, control magnetism, and host the Phoenix Force.',
  },
  {
    rank: 83,
    speciesName: 'Inhumans',
    originCanon: 'Marvel Comics',
    tier: 5,
    icon: '🗣️',
    envoyName: 'Attilan Sovereign Black-Bolt',
    overworldRole: 'marshal',
    loreSummary:
      'Kree-modified human subspecies whose latent genetic abilities are unlocked via exposure to mutagenic Terrigen Mist.',
  },
  {
    rank: 84,
    speciesName: 'Aeldari / Eldar',
    originCanon: 'Warhammer 40,000',
    tier: 5,
    icon: '🔮',
    envoyName: 'Craftworld Farseer Eldrad',
    overworldRole: 'mystic',
    loreSummary:
      'Ancient, hyper-psychic space elves whose technological zenith dominated the stars before their fall birthed Slaanesh.',
  },
  {
    rank: 85,
    speciesName: 'Orks / Krorks',
    originCanon: 'Warhammer 40,000',
    tier: 5,
    icon: '🪓',
    envoyName: 'Krork Warboss Ghazghkull',
    overworldRole: 'guard',
    loreSummary:
      'Fungal warrior-hordes generating a collective psychic gestalt field that makes their ramshackle technology work by belief.',
  },
  {
    rank: 86,
    speciesName: 'Tyranids',
    originCanon: 'Warhammer 40,000',
    tier: 5,
    icon: '🦂',
    envoyName: 'Swarmlord Synapse-Conduit',
    overworldRole: 'marshal',
    loreSummary:
      'Extragalactic super-predator swarms controlled by an unstoppable Hive Mind that strips entire sectors of all biomass.',
  },
  {
    rank: 87,
    speciesName: 'The Flood',
    originCanon: 'Halo',
    tier: 5,
    icon: '🦠',
    envoyName: 'Gravemind Compound-Voice',
    overworldRole: 'elder',
    loreSummary:
      'Virulent parasitic superorganisms driven by a compounding Gravemind intelligence that corrupts both biological life and AI.',
  },
  {
    rank: 88,
    speciesName: 'Zerg',
    originCanon: 'StarCraft',
    tier: 5,
    icon: '🐛',
    envoyName: 'Overmind Swarm-Queen',
    overworldRole: 'marshal',
    loreSummary:
      "Hyper-adaptive insectoid swarm engineered by the Xel'Naga that assimilates genetic traits to overrun planetary defenses.",
  },
  {
    rank: 89,
    speciesName: 'Protoss',
    originCanon: 'StarCraft',
    tier: 5,
    icon: '⚡',
    envoyName: 'Hierarch Artanis-Prime',
    overworldRole: 'guard',
    loreSummary:
      'Psionically linked warrior-philosophers wielding golden plasma technology, warp blades, and crystal-powered worldships.',
  },
  {
    rank: 90,
    speciesName: 'Xenomorphs',
    originCanon: 'Alien',
    tier: 5,
    icon: '🖤',
    envoyName: 'Empress Praetorian-Alpha',
    overworldRole: 'guard',
    loreSummary:
      'Biomechanical endoparasitoids with molecular-acid blood that gestate inside hosts to inherit their optimal predatory traits.',
  },
  {
    rank: 91,
    speciesName: 'Yautja / Predators',
    originCanon: 'Predator',
    tier: 5,
    icon: '🎯',
    envoyName: 'Clan-Elder Yautja Prime',
    overworldRole: 'guard',
    loreSummary:
      'Honor-bound interstellar big-game hunters utilizing active camouflage, plasma casters, and thermal vision to stalk apex prey.',
  },
  {
    rank: 92,
    speciesName: 'Kree',
    originCanon: 'Marvel Comics',
    tier: 5,
    icon: '🔨',
    envoyName: 'Accuser Ronan-Vanguard',
    overworldRole: 'marshal',
    loreSummary:
      'Militaristic blue-skinned imperialists ruled by the Supreme Intelligence who engineered cosmic weapons and genetic sub-races.',
  },
  {
    rank: 93,
    speciesName: 'Skrulls',
    originCanon: 'Marvel Comics',
    tier: 5,
    icon: '🦎',
    envoyName: 'Super-Skrull KlRt',
    overworldRole: 'merchant',
    loreSummary:
      'Reptilian shapeshifters capable of replicating the genetic structure and superpowers of rival heroes.',
  },
  {
    rank: 94,
    speciesName: "Shi'ar",
    originCanon: 'Marvel Comics',
    tier: 5,
    icon: '🦅',
    envoyName: 'Majestor Lilandra-Envoy',
    overworldRole: 'marshal',
    loreSummary:
      'Avian-descended rulers of a vast galactic empire protected by the powerhouse Imperial Guard.',
  },
  {
    rank: 95,
    speciesName: 'The Borg',
    originCanon: 'Star Trek',
    tier: 5,
    icon: '🟩',
    envoyName: 'Borg Queen Unimatrix-01',
    overworldRole: 'blacksmith',
    loreSummary:
      'Cybernetic hive-mind collective that assimilates the biological and technological distinctiveness of species across the galaxy.',
  },
  {
    rank: 96,
    speciesName: 'Species 8472 / Undine',
    originCanon: 'Star Trek',
    tier: 5,
    icon: '🌊',
    envoyName: 'Fluidic-Space Bioship Prime',
    overworldRole: 'mystic',
    loreSummary:
      'Tripedal, telepathic organisms from fluidic space whose bio-ships obliterate Borg cubes and planets in seconds.',
  },
  {
    rank: 97,
    speciesName: 'Klingons',
    originCanon: 'Star Trek',
    tier: 5,
    icon: '🗡️',
    envoyName: 'Chancellor Kahless-Blade',
    overworldRole: 'guard',
    loreSummary:
      'Fierce, honor-driven warrior humanoids with redundant organ systems and cloaked Bird-of-Prey warships.',
  },
  {
    rank: 98,
    speciesName: 'Vulcans',
    originCanon: 'Star Trek',
    tier: 5,
    icon: '🖖',
    envoyName: 'High-Logician Surak-Envoy',
    overworldRole: 'elder',
    loreSummary:
      'Logically disciplined, telepathic humanoids with copper-based blood and three times the physical strength of humans.',
  },
  {
    rank: 99,
    speciesName: 'Elves (Mythic Ages)',
    originCanon: 'Fantasy, Tolkien, D&D',
    tier: 5,
    icon: '🏹',
    envoyName: 'High-Loremaster Gil-Galad',
    overworldRole: 'mystic',
    loreSummary:
      'Ageless, sharp-eyed masters of archery, high sorcery, and nature craft who shape the mythic ages of fantasy worlds.',
  },
  {
    rank: 100,
    speciesName: 'Dwarves (Mountain Delvers)',
    originCanon: 'Fantasy, Tolkien, Mythology',
    tier: 5,
    icon: '⚒️',
    envoyName: 'Runesmith King Durin-Prime',
    overworldRole: 'blacksmith',
    loreSummary:
      'Stout, magic-resistant subterranean master smiths who forge legendary runic weapons and delved mountain kingdoms.',
  },
];

function buildSovereignOmniverse(seed: RawSpeciesSeed): OmniverseRealmSpec {
  const tierMeta = OMNIVERSE_TIER_METADATA[seed.tier];
  const paddedRank = String(seed.rank).padStart(3, '0');
  const rankBonus = BigInt(101 - seed.rank) * 5_000n;
  const hourlyDiamondTribute = tierMeta.baseTributeDiamonds + rankBonus;

  return {
    omniverseId: `OMNI-${paddedRank}`,
    omniverseIndex: seed.rank,
    omniverseName: `Ω-${paddedRank} · ${seed.speciesName} Sovereign Omniverse`,
    infiniteCoordinate: `ℵ_${seed.tier}::SECTOR-${paddedRank}::[${seed.originCanon.toUpperCase()}]::∞`,
    dimensionalCardinality: tierMeta.dimensionalScale,
    universeCountLabel: '∞ Infinite Nested Multiverses',
    sovereignCosmicLaw: `Sovereign Domain of ${seed.speciesName} (${seed.originCanon}) — Governed under Supreme Decree of ${PRIMARY_ADMIN_EMAIL}`,
    hourlyDiamondTribute,
    hourlyGrainTribute: hourlyDiamondTribute * 25n,
    hourlyWoodTribute: hourlyDiamondTribute * 20n,
  };
}

export const TOP_100_OMNIVERSE_SPECIES_NPCS: OmniverseSpeciesNpcEntry[] =
  RAW_TOP_100_SPECIES_SEEDS.map((seed) => {
    const paddedRank = String(seed.rank).padStart(3, '0');
    const tierPowerMultiplier =
      seed.tier === 1
        ? 100_000_000_000_000n
        : seed.tier === 2
          ? 25_000_000_000_000n
          : seed.tier === 3
            ? 8_000_000_000_000n
            : seed.tier === 4
              ? 2_500_000_000_000n
              : 800_000_000_000n;
    const combatPower = tierPowerMultiplier * BigInt(105 - seed.rank);

    return {
      rank: seed.rank,
      id: `omniverse_species_${paddedRank}`,
      speciesName: seed.speciesName,
      originCanon: seed.originCanon,
      tier: seed.tier,
      loreSummary: seed.loreSummary,
      icon: seed.icon,
      npcId: `omni_npc_${paddedRank}`,
      envoyName: seed.envoyName,
      envoyTitle: `Omniverse #${seed.rank} Envoy (${seed.speciesName})`,
      overworldRole: seed.overworldRole,
      npcLevel: 1000,
      combatPower,
      controlledBySuperAdmin: PRIMARY_ADMIN_EMAIL,
      superAdminDirective: seed.rank <= 5 ? 'patrol_citadel' : 'channel_tribute',
      deployedInOverworld: seed.rank <= 5, // Top 5 Omniversal Envoys start projected in overworld by default
      omniverse: buildSovereignOmniverse(seed),
    };
  });

/**
 * Resolves any Omniverse across the Infinite Omniverse Continuum (1 to ∞).
 * - Indices 1..100 return the canonical Top 100 Fictional Species Omniverse.
 * - Any index > 100 deterministically synthesizes a sovereign transfinite Omniverse
 *   linked to one of the 100 bloodlines + 10 playable lineages under Super Admin control.
 */
export function resolveInfiniteOmniverseByIndex(indexInput: number | bigint): {
  omniverse: OmniverseRealmSpec;
  linkedSpecies: OmniverseSpeciesNpcEntry;
  isProceduralTransfiniteExtension: boolean;
} {
  const rawIndex = typeof indexInput === 'bigint' ? indexInput : BigInt(Math.floor(indexInput));
  const clampedPositive = rawIndex < 1n ? 1n : rawIndex;

  if (clampedPositive <= 100n) {
    const idx = Number(clampedPositive);
    const entry = TOP_100_OMNIVERSE_SPECIES_NPCS[idx - 1];
    return {
      omniverse: entry.omniverse,
      linkedSpecies: entry,
      isProceduralTransfiniteExtension: false,
    };
  }

  // Deterministic wrapping across the 100 archetypes for infinite sectors (101 .. ∞)
  const archetypeIndex = Number((clampedPositive - 1n) % 100n);
  const baseSpecies = TOP_100_OMNIVERSE_SPECIES_NPCS[archetypeIndex];
  const harmonicCycle = clampedPositive / 100n;
  const indexStr = clampedPositive.toString();

  const scaledTribute = baseSpecies.omniverse.hourlyDiamondTribute * (1n + (harmonicCycle % 50n));

  const proceduralOmniverse: OmniverseRealmSpec = {
    omniverseId: `OMNI-∞-${indexStr}`,
    omniverseIndex: Number(clampedPositive > 9_000_000_000n ? 9_000_000_000n : clampedPositive),
    omniverseName: `Ω-${indexStr} · Transfinite ${baseSpecies.speciesName} Continuum #${harmonicCycle.toString()}`,
    infiniteCoordinate: `ℵ_∞::CYCLE-${harmonicCycle.toString()}::ARCHETYPE-${String(baseSpecies.rank).padStart(3, '0')}::∞`,
    dimensionalCardinality: `${baseSpecies.omniverse.dimensionalCardinality} (Harmonic Fold ×${harmonicCycle.toString()})`,
    universeCountLabel: '∞^∞ Transfinite Nested Multiverses',
    sovereignCosmicLaw: `Infinite Sovereign Omniverse Sector #${indexStr} of ${baseSpecies.speciesName} — Bound to Super Admin ${PRIMARY_ADMIN_EMAIL}`,
    hourlyDiamondTribute: scaledTribute,
    hourlyGrainTribute: scaledTribute * 25n,
    hourlyWoodTribute: scaledTribute * 20n,
  };

  return {
    omniverse: proceduralOmniverse,
    linkedSpecies: baseSpecies,
    isProceduralTransfiniteExtension: true,
  };
}

/**
 * Converts an Omniverse Background NPC Entry into a live 3D Overworld `NPC`
 * positioned in a protective orbital ring around Solara Citadel.
 */
export function projectOmniverseNpcToWorldNPC(
  entry: OmniverseSpeciesNpcEntry,
  slotIndex: number = entry.rank - 1
): NPC {
  const angleRad = ((slotIndex * 37) % 360) * (Math.PI / 180);
  const radius = 14 + (slotIndex % 5) * 3;
  const x = Math.round(Math.cos(angleRad) * radius);
  const z = Math.round(Math.sin(angleRad) * radius);

  const directiveToNpcDirective: Record<
    OmniverseSuperAdminDirective,
    NonNullable<NPC['directive']>
  > = {
    observe_omniverse: 'autonomous',
    channel_tribute: 'gather_resources',
    patrol_citadel: 'patrol_citadel',
    enforce_admin_decree: 'patrol_citadel',
    guard_dimensional_gate: 'patrol_citadel',
    hunt_realm_threats: 'hunt_monsters',
  };

  return {
    id: entry.npcId,
    name: `${entry.icon} ${entry.envoyName}`,
    title: `${entry.omniverse.omniverseId} · ${entry.speciesName} (${entry.originCanon})`,
    level: entry.npcLevel,
    role: entry.overworldRole,
    x,
    z,
    homeX: x,
    homeZ: z,
    dialogue: [
      `Greetings from ${entry.omniverse.omniverseName} (${entry.omniverse.infiniteCoordinate}).`,
      `${entry.loreSummary}`,
      `As Background Envoy of the ${entry.speciesName}, my Sovereign Omniverse and actions are under the absolute command of Super Admin ${PRIMARY_ADMIN_EMAIL}.`,
    ],
    aiState:
      entry.superAdminDirective === 'hunt_realm_threats'
        ? 'intercepting_monster'
        : entry.superAdminDirective === 'channel_tribute'
          ? 'gathering_resource'
          : 'patrolling_citadel',
    directive: directiveToNpcDirective[entry.superAdminDirective],
    statusActionText: `[Super Admin: ${PRIMARY_ADMIN_EMAIL}] Directive: ${entry.superAdminDirective.replace(/_/g, ' ').toUpperCase()} (${entry.omniverse.omniverseId})`,
    gatheredStash: {
      diamond: entry.omniverse.hourlyDiamondTribute / 10n,
      grain: entry.omniverse.hourlyGrainTribute / 10n,
      wood: entry.omniverse.hourlyWoodTribute / 10n,
    },
    combatPower: entry.combatPower,
    specialtyBuffDesc: `${entry.omniverse.omniverseName} · +${entry.omniverse.hourlyDiamondTribute.toLocaleString()} 💎/hr Tribute under ${PRIMARY_ADMIN_EMAIL}`,
  };
}

export interface OmniverseAdminCommandResult {
  allowed: boolean;
  reason: string;
  updatedRoster: OmniverseSpeciesNpcEntry[];
  tributeDiamondsGranted: bigint;
  tributeWoodGranted: bigint;
  tributeGrainGranted: bigint;
}

/**
 * Enforces that ONLY Super Admin `creatergame31@gmail.com` can control the 100
 * Omniversal Background NPCs, change their directives, project/recall them in the
 * 3D overworld, or harvest their Sovereign Omniverse tributes.
 */
export function executeOmniverseSuperAdminCommand(params: {
  actorEmail: string;
  roster: OmniverseSpeciesNpcEntry[];
  command:
    | {
        type: 'set_directive';
        targetRank?: number;
        targetTier?: OmniverseTierNumber;
        directive: OmniverseSuperAdminDirective;
      }
    | {
        type: 'toggle_overworld_projection';
        targetRank: number;
        deploy?: boolean;
      }
    | {
        type: 'project_tier_to_overworld';
        targetTier: OmniverseTierNumber;
        deploy: boolean;
      }
    | {
        type: 'harvest_all_omniverse_tribute';
      };
}): OmniverseAdminCommandResult {
  const { actorEmail, roster, command } = params;

  if (!isPrimaryAdminAccount(actorEmail)) {
    return {
      allowed: false,
      reason: `Access Denied: All 100 Omniversal Species Background NPCs and their Sovereign Omniverses are exclusively controlled by Super Admin ${PRIMARY_ADMIN_EMAIL}.`,
      updatedRoster: roster,
      tributeDiamondsGranted: 0n,
      tributeWoodGranted: 0n,
      tributeGrainGranted: 0n,
    };
  }

  if (command.type === 'set_directive') {
    const updatedRoster = roster.map((entry) => {
      const matchesRank = command.targetRank !== undefined && entry.rank === command.targetRank;
      const matchesTier = command.targetTier !== undefined && entry.tier === command.targetTier;
      const matchesAll = command.targetRank === undefined && command.targetTier === undefined;
      if (matchesRank || matchesTier || matchesAll) {
        return {
          ...entry,
          superAdminDirective: command.directive,
        };
      }
      return entry;
    });

    const scopeLabel =
      command.targetRank !== undefined
        ? `Omniverse #${command.targetRank}`
        : command.targetTier !== undefined
          ? `Tier ${command.targetTier}`
          : 'All 100 Omniverses';

    return {
      allowed: true,
      reason: `Super Admin (${PRIMARY_ADMIN_EMAIL}) updated directive for ${scopeLabel} to [${command.directive.toUpperCase()}].`,
      updatedRoster,
      tributeDiamondsGranted: 0n,
      tributeWoodGranted: 0n,
      tributeGrainGranted: 0n,
    };
  }

  if (command.type === 'toggle_overworld_projection') {
    let targetName = `Rank #${command.targetRank}`;
    let finalState = false;
    const updatedRoster = roster.map((entry) => {
      if (entry.rank === command.targetRank) {
        targetName = `${entry.envoyName} (${entry.speciesName})`;
        finalState = command.deploy !== undefined ? command.deploy : !entry.deployedInOverworld;
        return {
          ...entry,
          deployedInOverworld: finalState,
        };
      }
      return entry;
    });

    return {
      allowed: true,
      reason: `Super Admin (${PRIMARY_ADMIN_EMAIL}) ${finalState ? 'projected' : 'recalled'} ${targetName} ${finalState ? 'into the 3D Citadel Overworld' : 'back to their Sovereign Omniverse'}.`,
      updatedRoster,
      tributeDiamondsGranted: 0n,
      tributeWoodGranted: 0n,
      tributeGrainGranted: 0n,
    };
  }

  if (command.type === 'project_tier_to_overworld') {
    const updatedRoster = roster.map((entry) =>
      entry.tier === command.targetTier ? { ...entry, deployedInOverworld: command.deploy } : entry
    );
    return {
      allowed: true,
      reason: `Super Admin (${PRIMARY_ADMIN_EMAIL}) ${command.deploy ? 'projected all' : 'recalled all'} Tier ${command.targetTier} Omniverse Envoys ${command.deploy ? 'into the 3D Overworld' : 'to their Omniverses'}.`,
      updatedRoster,
      tributeDiamondsGranted: 0n,
      tributeWoodGranted: 0n,
      tributeGrainGranted: 0n,
    };
  }

  // harvest_all_omniverse_tribute
  let totalDiamonds = 0n;
  let totalWood = 0n;
  let totalGrain = 0n;
  for (const entry of roster) {
    totalDiamonds += entry.omniverse.hourlyDiamondTribute;
    totalWood += entry.omniverse.hourlyWoodTribute;
    totalGrain += entry.omniverse.hourlyGrainTribute;
  }

  return {
    allowed: true,
    reason: `Super Admin (${PRIMARY_ADMIN_EMAIL}) harvested cosmic tribute across all 100 Sovereign Omniverses!`,
    updatedRoster: roster,
    tributeDiamondsGranted: totalDiamonds,
    tributeWoodGranted: totalWood,
    tributeGrainGranted: totalGrain,
  };
}

// ============================================================================
// 6-LAYER COSMIC ONTOLOGY & COSMOLOGICAL HIERARCHY (CULMINATING IN THE WHITE PAGE / HOUSE OF IDEAS)
// ============================================================================

export type CosmicHierarchyLayerNumber = 1 | 2 | 3 | 4 | 5 | 6;

export type CosmicHierarchyLayerId =
  | 'universe'
  | 'multiverse'
  | 'megaverse_hyperverse'
  | 'omniverse'
  | 'overvoid_exoverse'
  | 'white_page_house_of_ideas';

export interface CosmicHierarchyLayerSpec {
  layerNumber: CosmicHierarchyLayerNumber;
  id: CosmicHierarchyLayerId;
  name: string;
  canonicalDefinition: string;
  ontologicalScope: string;
  dimensionalLogicLaw: string;
  containsLayerLabel: string;
  tributeMultiplier: bigint;
  sovereignController: string;
  icon: string;
  accentGradient: string;
  borderClass: string;
}

/**
 * The 6 Canonical Cosmological Hierarchy Layers:
 * 1. Universe - a single reality with its own space, time, and matter, etc.
 * 2. Multiverse - a collection of parallel/series universes.
 * 3. Megaverse / Hyperverse - a cluster of multiple multiverses.
 * 4. Omniverse - every universe, multiverse, and reality that has ever existed or could exist.
 * 5. The Overvoid / Exoverse - a collection of multiple distinct omniverses that operate under completely different laws of logic and cosmic hierarchy.
 * 6. The White Page / The House of Ideas - everything comes from here, even nothingness (Oblivion). Sovereign Supreme Creator: creatergame31@gmail.com.
 */
export const SIX_LAYER_COSMIC_HIERARCHY: CosmicHierarchyLayerSpec[] = [
  {
    layerNumber: 1,
    id: 'universe',
    name: '1. Universe',
    canonicalDefinition: 'A single reality with its own space, time, and matter, etc.',
    ontologicalScope:
      'Individual 3+1D to 11D spacetime continuum containing stars, galaxies, mortal/immortal realms, baryonic matter, dark energy, and causal timelines.',
    dimensionalLogicLaw:
      'Standard Local Physical Constants, Thermodynamic Arrow of Time & Causal Qi Flow',
    containsLayerLabel: 'Galaxies, Mortal Continents, Immortal Planes & Pocket Realms',
    tributeMultiplier: 1n,
    sovereignController: `Governed locally; authored by ${PRIMARY_ADMIN_EMAIL}`,
    icon: '🪐',
    accentGradient: 'from-sky-900/50 via-slate-900 to-blue-950/60',
    borderClass: 'border-sky-500/40',
  },
  {
    layerNumber: 2,
    id: 'multiverse',
    name: '2. Multiverse',
    canonicalDefinition: 'A collection of parallel/series universes.',
    ontologicalScope:
      'Infinite quantum-branching parallel timelines, mirror realities, and sequential/cyclic universe series vibrating at distinct phase frequencies.',
    dimensionalLogicLaw:
      'Many-Worlds Quantum Branching, Parallel Timeline Convergence & Series Recursion',
    containsLayerLabel: '∞ Parallel & Series Universes (Layer 1)',
    tributeMultiplier: 10n,
    sovereignController: `Timeline Nexus anchored by ${PRIMARY_ADMIN_EMAIL}`,
    icon: '🌀',
    accentGradient: 'from-cyan-900/50 via-slate-900 to-indigo-950/60',
    borderClass: 'border-cyan-500/40',
  },
  {
    layerNumber: 3,
    id: 'megaverse_hyperverse',
    name: '3. Megaverse / Hyperverse',
    canonicalDefinition: 'A cluster of multiple multiverses.',
    ontologicalScope:
      'Higher-dimensional brane clusters (12D–26D+ Hyperversal manifolds) binding vast archipelagos of distinct Multiverses into unified cosmic super-structures.',
    dimensionalLogicLaw: 'Hyper-Dimensional Brane Topology & Multi-Multiversal Coupling Constants',
    containsLayerLabel: 'Clusters of Multiple Multiverses (Layer 2)',
    tributeMultiplier: 100n,
    sovereignController: `Hyperversal Brane Lattice under ${PRIMARY_ADMIN_EMAIL}`,
    icon: '💠',
    accentGradient: 'from-violet-900/50 via-slate-900 to-purple-950/60',
    borderClass: 'border-violet-500/40',
  },
  {
    layerNumber: 4,
    id: 'omniverse',
    name: '4. Omniverse',
    canonicalDefinition:
      'Every universe, multiverse, and reality that has ever existed or could exist.',
    ontologicalScope:
      'Total ensemble of all Universes, Multiverses, Megaverses, Hyperverses, and possible/impossible realities within a sovereign species dominion (OMNI-001 through OMNI-∞).',
    dimensionalLogicLaw: 'Total Modal Realism — Every Consistent & Transfinite Reality Manifests',
    containsLayerLabel: 'Every Universe, Multiverse, Megaverse/Hyperverse & Reality (Layers 1–3)',
    tributeMultiplier: 1_000n,
    sovereignController: `100 Species Background NPC Envoys under ${PRIMARY_ADMIN_EMAIL}`,
    icon: '🌌',
    accentGradient: 'from-fuchsia-900/50 via-slate-900 to-pink-950/60',
    borderClass: 'border-fuchsia-500/40',
  },
  {
    layerNumber: 5,
    id: 'overvoid_exoverse',
    name: '5. The Overvoid / Exoverse',
    canonicalDefinition:
      'A collection of multiple distinct omniverses that operate under completely different laws of logic and cosmic hierarchy.',
    ontologicalScope:
      'The trans-omniversal meta-expanse containing all 100+∞ distinct Species Omniverses, each running on mutually alien laws of logic, non-Aristotelian mathematics, and independent cosmic hierarchies.',
    dimensionalLogicLaw:
      'Meta-Logical Pluralism — Distinct Omniversal Logic Systems & Alien Cosmic Hierarchies',
    containsLayerLabel: 'Multiple Distinct Omniverses with Different Laws of Logic (Layer 4)',
    tributeMultiplier: 10_000n,
    sovereignController: `Overvoid / Exoverse Meta-Director: ${PRIMARY_ADMIN_EMAIL}`,
    icon: '🕳️',
    accentGradient: 'from-amber-900/50 via-slate-950 to-fuchsia-950/60',
    borderClass: 'border-amber-500/50',
  },
  {
    layerNumber: 6,
    id: 'white_page_house_of_ideas',
    name: '6. The White Page / The House of Ideas',
    canonicalDefinition:
      'Everything comes from here — even nothingness (Oblivion). Sovereign Supreme Creator: creatergame31@gmail.com.',
    ontologicalScope:
      'The primordial, pre-existential White Page and supreme House of Ideas from which all creation, the Overvoid/Exoverse, every Omniverse, Megaverse, Multiverse, Universe, and even Nothingness (Oblivion) itself emanate.',
    dimensionalLogicLaw: `Supreme Authorial Will of ${PRIMARY_ADMIN_EMAIL} (Origin of Both Existence & Oblivion)`,
    containsLayerLabel:
      'The Overvoid / Exoverse (Layer 5), All Omniverses (Layer 4–1), and Nothingness (Oblivion)',
    tributeMultiplier: 100_000n,
    sovereignController: PRIMARY_ADMIN_EMAIL,
    icon: '📜',
    accentGradient: 'from-white/20 via-amber-500/20 to-fuchsia-500/20',
    borderClass: 'border-white/70',
  },
];

export interface SpeciesSixLayerCosmologyBreakdown {
  speciesRank: number;
  speciesName: string;
  envoyName: string;
  layer1Universe: string;
  layer2Multiverse: string;
  layer3MegaverseHyperverse: string;
  layer4Omniverse: string;
  layer5OvervoidExoverse: string;
  layer6WhitePageHouseOfIdeas: string;
  supremeAuthorEmail: typeof PRIMARY_ADMIN_EMAIL;
}

/**
 * Resolves the exact 6-Layer Cosmological Hierarchy stack for any of the 100
 * Fictional Species (or any procedural infinite species entry), tracing its
 * lineage from Layer 1 (Universe) all the way up to Layer 6 (The White Page /
 * The House of Ideas under `creatergame31@gmail.com`).
 */
export function resolveSpeciesSixLayerCosmology(
  entry: OmniverseSpeciesNpcEntry
): SpeciesSixLayerCosmologyBreakdown {
  const padded = String(entry.rank).padStart(3, '0');
  return {
    speciesRank: entry.rank,
    speciesName: entry.speciesName,
    envoyName: entry.envoyName,
    layer1Universe: `Prime ${entry.speciesName} Universe U-${padded}.1 (${entry.originCanon} Core Spacetime, Matter & Time)`,
    layer2Multiverse: `${entry.speciesName} Parallel & Series Multiverse MV-${padded} (∞ Branching & Sequential Timelines)`,
    layer3MegaverseHyperverse: `${entry.speciesName} Megaverse / Hyperverse Cluster HV-${padded} (${entry.omniverse.dimensionalCardinality})`,
    layer4Omniverse: `${entry.omniverse.omniverseId}: ${entry.omniverse.omniverseName} — Every reality that has ever existed or could exist for ${entry.speciesName}`,
    layer5OvervoidExoverse: `Overvoid / Exoverse Sector EXO-T${entry.tier}-${padded} — Distinct Logic & Cosmic Hierarchy (${entry.omniverse.sovereignCosmicLaw})`,
    layer6WhitePageHouseOfIdeas: `The White Page / The House of Ideas — Supreme Source of ${entry.speciesName}, all Omniverses, and Nothingness (Oblivion) authored by ${PRIMARY_ADMIN_EMAIL}`,
    supremeAuthorEmail: PRIMARY_ADMIN_EMAIL,
  };
}

export type WhitePageAuthorDecreeType =
  | 'inscribe_creation'
  | 'realign_overvoid_logic'
  | 'invoke_oblivion_reset'
  | 'channel_house_of_ideas_harvest';

export interface WhitePageDecreeResult {
  allowed: boolean;
  decreeType: WhitePageAuthorDecreeType;
  layerOrigin: '6. The White Page / The House of Ideas';
  supremeAuthor: typeof PRIMARY_ADMIN_EMAIL;
  reason: string;
  updatedRoster: OmniverseSpeciesNpcEntry[];
  tributeDiamondsGranted: bigint;
  tributeWoodGranted: bigint;
  tributeGrainGranted: bigint;
}

/**
 * Executes a Layer-6 "The White Page / The House of Ideas" supreme decree.
 * Because everything — including the Overvoid/Exoverse, all Omniverses, and even
 * Nothingness (Oblivion) — originates from The White Page / The House of Ideas,
 * ONLY `creatergame31@gmail.com` may invoke these decrees.
 */
export function executeWhitePageAuthorDecree(params: {
  actorEmail: string;
  roster: OmniverseSpeciesNpcEntry[];
  decreeType: WhitePageAuthorDecreeType;
}): WhitePageDecreeResult {
  const { actorEmail, roster, decreeType } = params;

  if (!isPrimaryAdminAccount(actorEmail)) {
    return {
      allowed: false,
      decreeType,
      layerOrigin: '6. The White Page / The House of Ideas',
      supremeAuthor: PRIMARY_ADMIN_EMAIL,
      reason: `Access Denied: Only the Supreme Author of The White Page / The House of Ideas (${PRIMARY_ADMIN_EMAIL}) can issue Layer-6 Cosmological Decrees.`,
      updatedRoster: roster,
      tributeDiamondsGranted: 0n,
      tributeWoodGranted: 0n,
      tributeGrainGranted: 0n,
    };
  }

  if (decreeType === 'inscribe_creation') {
    const updatedRoster = roster.map((entry) => ({
      ...entry,
      superAdminDirective: 'channel_tribute' as const,
    }));
    return {
      allowed: true,
      decreeType,
      layerOrigin: '6. The White Page / The House of Ideas',
      supremeAuthor: PRIMARY_ADMIN_EMAIL,
      reason: `[Layer 6: The White Page / The House of Ideas] ${PRIMARY_ADMIN_EMAIL} inscribed a New Genesis across the Overvoid/Exoverse, Omniverses, Megaverses, Multiverses, and Universes! All 100 Species Background NPCs are now channeling tribute.`,
      updatedRoster,
      tributeDiamondsGranted: 50_000_000n,
      tributeWoodGranted: 250_000_000n,
      tributeGrainGranted: 250_000_000n,
    };
  }

  if (decreeType === 'realign_overvoid_logic') {
    const updatedRoster = roster.map((entry) => ({
      ...entry,
      superAdminDirective: 'enforce_admin_decree' as const,
    }));
    return {
      allowed: true,
      decreeType,
      layerOrigin: '6. The White Page / The House of Ideas',
      supremeAuthor: PRIMARY_ADMIN_EMAIL,
      reason: `[Layer 5 → 6: Overvoid / Exoverse Logic Rewritten] ${PRIMARY_ADMIN_EMAIL} harmonized the distinct laws of logic and cosmic hierarchies across all 100 Omniverses from The House of Ideas!`,
      updatedRoster,
      tributeDiamondsGranted: 25_000_000n,
      tributeWoodGranted: 100_000_000n,
      tributeGrainGranted: 100_000_000n,
    };
  }

  if (decreeType === 'invoke_oblivion_reset') {
    const updatedRoster = roster.map((entry) => ({
      ...entry,
      superAdminDirective: 'guard_dimensional_gate' as const,
      deployedInOverworld: entry.rank <= 5,
    }));
    return {
      allowed: true,
      decreeType,
      layerOrigin: '6. The White Page / The House of Ideas',
      supremeAuthor: PRIMARY_ADMIN_EMAIL,
      reason: `[Layer 6: Oblivion & White Page Anchor] Because even Nothingness (Oblivion) originates from The White Page / The House of Ideas, ${PRIMARY_ADMIN_EMAIL} folded transient projections back into the Overvoid and anchored the Top 5 Apex Envoys at the Citadel Gate!`,
      updatedRoster,
      tributeDiamondsGranted: 77_777_777n,
      tributeWoodGranted: 0n,
      tributeGrainGranted: 0n,
    };
  }

  // channel_house_of_ideas_harvest
  let baseDiamonds = 0n;
  let baseWood = 0n;
  let baseGrain = 0n;
  for (const entry of roster) {
    baseDiamonds += entry.omniverse.hourlyDiamondTribute;
    baseWood += entry.omniverse.hourlyWoodTribute;
    baseGrain += entry.omniverse.hourlyGrainTribute;
  }

  return {
    allowed: true,
    decreeType,
    layerOrigin: '6. The White Page / The House of Ideas',
    supremeAuthor: PRIMARY_ADMIN_EMAIL,
    reason: `[Layer 6: The White Page / The House of Ideas] Supreme Author ${PRIMARY_ADMIN_EMAIL} harvested the combined yield of all 6 Cosmic Layers (Universe → Multiverse → Megaverse/Hyperverse → Omniverse → Overvoid/Exoverse → House of Ideas)!`,
    updatedRoster: roster,
    tributeDiamondsGranted: baseDiamonds * 10n,
    tributeWoodGranted: baseWood * 10n,
    tributeGrainGranted: baseGrain * 10n,
  };
}

// ============================================================================
// STRICT 6-TIER NESTED COSMOLOGICAL HIERARCHY, CARDINALITY & DATA ARCHITECTURE
// Tier 6 (WhitePageRoot Singleton, Cardinality = 1)
// -> Tier 5 (Overvoid / Exonverse, Cardinality = 100 Fixed Cap, index 1..100)
// -> Tier 4 (Omniverse, Cardinality = Infinity via InfiniteCollection<Omniverse>)
// -> Tier 3 (Megaverse / Hyperverse, Cardinality = Infinity via InfiniteCollection<Megaverse>)
// -> Tier 2 (Multiverse, Cardinality = Infinity via InfiniteCollection<Multiverse>)
// -> Tier 1 (Leaf: Universe, Cardinality = Infinity via InfiniteCollection<Universe>)
// ============================================================================

export const STANDARD_UNIVERSE_SPACETIME_CONFIG: Readonly<Record<string, unknown>> = Object.freeze({
  spacetimeDimensions: '3+1D Lorentzian Continuum',
  metricSignature: '(-,+,+,+)',
  speedOfLightMps: 299_792_458,
  timeDilationFactor: 1.0,
  causalStructure: 'strict_lightcone',
  thermodynamicArrow: 'forward_entropy',
});

export const STANDARD_UNIVERSE_MATTER_CONSTANTS: Readonly<Record<string, unknown>> = Object.freeze({
  gravitationalConstantG: 6.6743e-11,
  planckConstantH: 6.62607015e-34,
  fineStructureAlpha: 0.00729735256,
  baryonicMatterRatio: 0.049,
  darkEnergyRatio: 0.683,
  qiSpiritDensityMultiplier: 1.0,
  gravityMultiplier: 1.0,
});

export const STANDARD_OVERVOID_COSMIC_RULES: Readonly<Record<string, unknown>> = Object.freeze({
  lawOfNonContradiction: true,
  excludedMiddle: true,
  realmSuppressionBase: 10,
  causalHierarchyOrder: 'bottom_up_1_to_6',
  transfiniteScalingEnabled: true,
  allowCustomUniversePhysicsOverrides: true,
  qiMultiplierBonus: 1.0,
});

export const OVERVOID_SECTOR_PRESETS: ReadonlyArray<{
  tier: OmniverseTierNumber;
  id: string;
  name: string;
  alias: 'The Overvoid' | 'Exonverse';
  logicSystem: string;
  cosmicHierarchyRules: Record<string, unknown>;
}> = [
  {
    tier: 1,
    id: 'EXO-T1-APEX',
    name: 'Exonverse Alpha-Ω: Transfinite Narrative & Acausal Meta-Domain',
    alias: 'Exonverse',
    logicSystem: 'Paraconsistent Transfinite Modal Logic (ℵ_Ω Hyper-Axiomatic)',
    cosmicHierarchyRules: {
      ...STANDARD_OVERVOID_COSMIC_RULES,
      lawOfNonContradiction: false,
      excludedMiddle: false,
      realmSuppressionBase: 100,
      qiMultiplierBonus: 5.0,
      narrativeRetconAuthority: 'enabled',
      dimensionalCeiling: 'Beyond-Dimensional Transfinite',
    },
  },
  {
    tier: 2,
    id: 'EXO-T2-HYPERSPACE',
    name: 'The Overvoid Beta-26D: Closed-Timelike-Curve & String-Brane Lattice',
    alias: 'The Overvoid',
    logicSystem: 'Quantum Superposition & 26D M-Theory Tensor Logic',
    cosmicHierarchyRules: {
      ...STANDARD_OVERVOID_COSMIC_RULES,
      realmSuppressionBase: 25,
      qiMultiplierBonus: 2.5,
      closedTimelikeCurvesAllowed: true,
      dimensionalCeiling: '11D–26D Hyperspace Grid',
    },
  },
  {
    tier: 3,
    id: 'EXO-T3-XIANXIA-DAO',
    name: 'Exonverse Gamma-Dao: 3,000 Great Daos & Platonic Pantheon Expanse',
    alias: 'Exonverse',
    logicSystem: 'Three-Thousand Great Daos Dialectical Karma & Realm Suppression Logic',
    cosmicHierarchyRules: {
      ...STANDARD_OVERVOID_COSMIC_RULES,
      realmSuppressionBase: 10,
      qiMultiplierBonus: 3.0,
      heavenlyTribulationKarmaLaw: 'strict_retribution',
      dimensionalCeiling: 'Platonic Immortal Astral Planes',
    },
  },
  {
    tier: 4,
    id: 'EXO-T4-RELATIVISTIC',
    name: 'The Overvoid Delta-Zenkai: Relativistic Stellar & Smart-Atom Sector',
    alias: 'The Overvoid',
    logicSystem: 'Relativistic Conservation & Exponential Biological Zenkai Logic',
    cosmicHierarchyRules: {
      ...STANDARD_OVERVOID_COSMIC_RULES,
      realmSuppressionBase: 10,
      qiMultiplierBonus: 1.75,
      stellarRadiationMetabolism: true,
      dimensionalCeiling: 'Multi-Universal Relativistic Continuum',
    },
  },
  {
    tier: 5,
    id: 'EXO-T5-SOLARA-PRIME',
    name: 'Exonverse Epsilon-Prime: Solara Citadel & Galactic Sovereign Sector',
    alias: 'Exonverse',
    logicSystem: 'Classical Aristotelian & Deterministic Fixed-Point Simulation Logic',
    cosmicHierarchyRules: {
      ...STANDARD_OVERVOID_COSMIC_RULES,
      realmSuppressionBase: 10,
      qiMultiplierBonus: 1.25,
      citadelSiegeCapTroops: '1000000000000000',
      dimensionalCeiling: '3+1D to 12D Sovereign Sector',
    },
  },
];

export const SOLARA_PRIME_UNIVERSE_ID = 'U-081.1-SOLARA-PRIME';
export const SOLARA_PRIME_OVERVOID_ID = 'OVERVOID-081';

/**
 * Helper to create an `InfiniteCollection<T>` wrapper for unbounded cosmic tiers (Tiers 1–4)
 * without pre-allocating infinite arrays in memory.
 */
export function createInfiniteCollection<T>(
  generatorSeed: string,
  loadedNodes: T[]
): InfiniteCollection<T> {
  return {
    totalCount: COSMIC_LIMITS.UNIVERSE_COUNT, // Infinity
    generatorSeed,
    loadedNodes,
  };
}

/**
 * Deterministically hashes a seed string + cursor index into a non-negative integer
 * for lazy procedural generation of infinite cosmic nodes.
 */
function deterministicSeedHash(seed: string, cursorIndex: number): number {
  const input = `${seed}::cursor=${cursorIndex}`;
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Checks whether an Overvoid matches a target ID (supporting both individual `OVERVOID-001..100`
 * IDs and sector group IDs like `EXO-T5-SOLARA-PRIME`).
 */
export function overvoidMatchesIdentifier(overvoid: Overvoid, targetId: string): boolean {
  if (overvoid.id === targetId) return true;
  if (overvoid.cosmicHierarchyRules?.sectorGroupId === targetId) return true;
  return false;
}

/**
 * Builds the canonical, strictly nested 6-tier cosmological tree where:
 * - Tier 6 (`WhitePageRoot`) is the singleton root (`id: 'THE_WHITE_PAGE'`, `tier: 6`, `isSingleton: true`, `alias: 'The House of Ideas'`, `creatorEmail: 'creatergame31@gmail.com'`, `oblivionState.exists: true`).
 * - Tier 5 (`Overvoid` / `Exonverse`) has a fixed bounded cardinality of exactly `100` (`index: 1..100`), each operating under distinct `logicSystem` and `cosmicHierarchyRules` and housing `omniverses: InfiniteCollection<Omniverse>`.
 * - Tier 4 (`Omniverse`) has `Infinity` cardinality and houses `megaverses: InfiniteCollection<Megaverse>`.
 * - Tier 3 (`Megaverse` / `Hyperverse`) has `Infinity` cardinality and houses `multiverses: InfiniteCollection<Multiverse>`.
 * - Tier 2 (`Multiverse`) has `Infinity` cardinality and houses `universes: InfiniteCollection<Universe>`.
 * - Tier 1 (`Universe`) has `Infinity` cardinality and defines leaf realities with independent `spacetimeConfig` and `matterConstants`.
 */
export function buildCanonicalWhitePageHierarchyTree(
  roster: OmniverseSpeciesNpcEntry[] = TOP_100_OMNIVERSE_SPECIES_NPCS
): WhitePageRoot {
  // Ensure we always construct the exact 100 bounded Overvoids (index 1..100)
  const sourceEntries =
    roster.length === COSMIC_LIMITS.OVERVOID_MAX_COUNT ? roster : TOP_100_OMNIVERSE_SPECIES_NPCS;

  const overvoids: Overvoid[] = sourceEntries
    .slice(0, COSMIC_LIMITS.OVERVOID_MAX_COUNT)
    .map((entry, idx) => {
      const overvoidIndex = idx + 1; // Strictly bounded: 1 to 100
      const padded = String(overvoidIndex).padStart(3, '0');
      const sector =
        OVERVOID_SECTOR_PRESETS.find((s) => s.tier === entry.tier) ?? OVERVOID_SECTOR_PRESETS[4];

      const temporalScopes: Array<'past' | 'present' | 'potential' | 'all'> = [
        'all',
        'present',
        'potential',
        'past',
      ];
      const temporalScope =
        entry.tier === 1 ? 'all' : temporalScopes[(overvoidIndex - 1) % temporalScopes.length];
      const megaverseAlias: 'Megaverse' | 'Hyperverse' =
        overvoidIndex % 2 === 1 ? 'Hyperverse' : 'Megaverse';
      const topologies: Array<'parallel' | 'series' | 'hybrid'> = ['parallel', 'series', 'hybrid'];
      const topology = topologies[(overvoidIndex - 1) % topologies.length];
      const overvoidAlias: 'The Overvoid' | 'Exonverse' =
        overvoidIndex % 2 === 1 ? 'Exonverse' : 'The Overvoid';

      const isHumanSolara = overvoidIndex === 81;
      const primaryUniverseId = isHumanSolara ? SOLARA_PRIME_UNIVERSE_ID : `U-${padded}.1`;

      const primaryUniverse: Universe = {
        id: primaryUniverseId,
        name: isHumanSolara
          ? 'Solara Citadel Prime Universe (Humanity & 10 Sovereign Species Core Reality)'
          : `Prime ${entry.speciesName} Universe U-${padded}.1 (${entry.originCanon})`,
        tier: 1,
        spacetimeConfig: {
          ...STANDARD_UNIVERSE_SPACETIME_CONFIG,
          spacetimeDimensions: entry.omniverse.dimensionalCardinality,
          infiniteCoordinate: entry.omniverse.infiniteCoordinate,
          originCanon: entry.originCanon,
          timeDilationFactor: entry.tier === 1 ? 10.0 : entry.tier === 2 ? 4.0 : 1.0,
        },
        matterConstants: {
          ...STANDARD_UNIVERSE_MATTER_CONSTANTS,
          sovereignCosmicLaw: entry.omniverse.sovereignCosmicLaw,
          speciesRank: entry.rank,
          qiSpiritDensityMultiplier:
            entry.tier === 1 ? 8.0 : entry.tier === 2 ? 4.0 : entry.tier === 3 ? 3.0 : 1.5,
          gravityMultiplier: overvoidIndex === 64 ? 35.0 : 1.0, // Rognarr hyper-gravity planet law
        },
      };

      const secondaryUniverse: Universe = {
        id: `U-${padded}.2`,
        name: `${entry.speciesName} Branching Mirror Continuum U-${padded}.2`,
        tier: 1,
        spacetimeConfig: {
          ...STANDARD_UNIVERSE_SPACETIME_CONFIG,
          spacetimeDimensions: entry.omniverse.dimensionalCardinality,
          branchTimelineIndex: 2,
          timeDilationFactor: 1.25,
        },
        matterConstants: {
          ...STANDARD_UNIVERSE_MATTER_CONSTANTS,
          sovereignCosmicLaw: entry.omniverse.sovereignCosmicLaw,
          qiSpiritDensityMultiplier: 1.25,
          mirrorPolarity: 'inverted_antimatter_parity',
        },
      };

      const primaryMultiverse: Multiverse = {
        id: `MV-${padded}`,
        name: `${entry.speciesName} ${topology.toUpperCase()} Multiverse MV-${padded}`,
        tier: 2,
        topology,
        universes: createInfiniteCollection(`SEED-MV-${padded}-UNIVERSE`, [
          primaryUniverse,
          secondaryUniverse,
        ]),
      };

      const primaryMegaverse: Megaverse = {
        id: `HV-${padded}`,
        name: `${entry.speciesName} ${megaverseAlias} Cluster HV-${padded}`,
        tier: 3,
        alias: megaverseAlias,
        multiverses: createInfiniteCollection(`SEED-HV-${padded}-MULTIVERSE`, [primaryMultiverse]),
      };

      const primaryOmniverse: Omniverse = {
        id: entry.omniverse.omniverseId,
        name: entry.omniverse.omniverseName,
        tier: 4,
        temporalScope,
        megaverses: createInfiniteCollection(`SEED-${entry.omniverse.omniverseId}-MEGAVERSE`, [
          primaryMegaverse,
        ]),
      };

      const overvoidId = `OVERVOID-${padded}`;

      return {
        id: overvoidId,
        index: overvoidIndex,
        name: `${overvoidAlias} #${padded}: ${entry.speciesName} Meta-Continuum (${entry.originCanon})`,
        tier: 5,
        alias: overvoidAlias,
        logicSystem: `${sector.logicSystem} · ${entry.omniverse.sovereignCosmicLaw}`,
        cosmicHierarchyRules: {
          ...sector.cosmicHierarchyRules,
          sectorGroupId: sector.id,
          sectorGroupName: sector.name,
          overvoidIndex,
          speciesRank: entry.rank,
          speciesName: entry.speciesName,
        },
        omniverses: createInfiniteCollection(`SEED-${overvoidId}-OMNIVERSE`, [primaryOmniverse]),
      };
    });

  return {
    id: 'THE_WHITE_PAGE',
    tier: 6,
    isSingleton: true,
    alias: 'The House of Ideas',
    creatorEmail: PRIMARY_ADMIN_EMAIL,
    includesOblivion: true,
    oblivionState: {
      id: 'OBLIVION_NOTHINGNESS',
      name: 'Absolute Nothingness (Oblivion / Pre-Existential Void)',
      spawnedFrom: 'THE_WHITE_PAGE',
      entropyVoidRatio: 0.12,
      active: true,
      exists: true,
      description: 'Absolute nothingness originating from The White Page',
    },
    overvoids,
    exonverses: overvoids,
  };
}

// Singleton Root State for Tier 6 (`WhitePageRoot`)
let whitePageSingletonInstance: WhitePageRoot | null = null;

/**
 * Rule 1: Singleton Enforcement (Tier 6).
 * Returns the single Tier 6 `WhitePageRoot` instance (`COSMIC_LIMITS.WHITE_PAGE_COUNT === 1`)
 * tagged with `creatergame31@gmail.com` and housing both `Oblivion` and the 100 bounded `Overvoid`s.
 */
export function getWhitePageSingletonRoot(): WhitePageRoot {
  if (!whitePageSingletonInstance) {
    whitePageSingletonInstance = buildCanonicalWhitePageHierarchyTree();
  }
  return whitePageSingletonInstance;
}

/**
 * Updates the Tier 6 `WhitePageRoot` singleton state after strictly validating:
 * - Rule 1: Tier 6 Singleton invariants (`id: 'THE_WHITE_PAGE'`, `tier: 6`, `isSingleton: true`, `creatorEmail: 'creatergame31@gmail.com'`, `oblivionState.exists: true`).
 * - Rule 2: Bounded Tier 5 Overvoid count (`overvoids.length === COSMIC_LIMITS.OVERVOID_MAX_COUNT` = 100).
 */
export function setWhitePageSingletonRoot(nextRoot: WhitePageRoot): WhitePageRoot {
  const overvoidList = nextRoot.overvoids ?? nextRoot.exonverses ?? [];
  if (
    nextRoot.id !== 'THE_WHITE_PAGE' ||
    nextRoot.tier !== 6 ||
    nextRoot.isSingleton !== true ||
    nextRoot.alias !== 'The House of Ideas' ||
    nextRoot.creatorEmail !== PRIMARY_ADMIN_EMAIL ||
    nextRoot.oblivionState?.exists !== true
  ) {
    throw new Error(
      `Invalid WhitePageRoot singleton invariant: Tier 6 root must remain a singleton THE_WHITE_PAGE ("The House of Ideas") authored by ${PRIMARY_ADMIN_EMAIL} with oblivionState.exists: true.`
    );
  }
  if (overvoidList.length !== COSMIC_LIMITS.OVERVOID_MAX_COUNT) {
    throw new Error(
      `Invalid Tier 5 Overvoid cardinality: expected exactly ${COSMIC_LIMITS.OVERVOID_MAX_COUNT} Overvoids, got ${overvoidList.length}.`
    );
  }
  whitePageSingletonInstance = {
    ...nextRoot,
    overvoids: overvoidList,
    exonverses: overvoidList,
  };
  return whitePageSingletonInstance;
}

/**
 * Resets the Tier 6 `WhitePageRoot` singleton back to the canonical 100-Overvoid / ∞-Hierarchy tree.
 */
export function resetWhitePageSingletonRoot(
  roster: OmniverseSpeciesNpcEntry[] = TOP_100_OMNIVERSE_SPECIES_NPCS
): WhitePageRoot {
  whitePageSingletonInstance = buildCanonicalWhitePageHierarchyTree(roster);
  return whitePageSingletonInstance;
}

/**
 * Rule 2: Bounded Array Enforcement (Tier 5).
 * Enforces a hard validation limit of `100` (`COSMIC_LIMITS.OVERVOID_MAX_COUNT`) on `Overvoid` instances.
 * Rejects any creation request that would exceed 100 Overvoids or use an out-of-bounds index.
 */
export function attemptCreateOvervoid(params: {
  root?: WhitePageRoot;
  candidateOvervoid: Partial<Overvoid>;
}): {
  allowed: boolean;
  reason: string;
  maxAllowed: typeof COSMIC_LIMITS.OVERVOID_MAX_COUNT;
  currentCount: number;
  root: WhitePageRoot;
} {
  const baseRoot = params.root ?? getWhitePageSingletonRoot();
  const currentOvervoids = baseRoot.overvoids ?? baseRoot.exonverses ?? [];

  if (currentOvervoids.length >= COSMIC_LIMITS.OVERVOID_MAX_COUNT) {
    return {
      allowed: false,
      reason: `Rejected: Tier 5 Overvoid / Exonverse cardinality is strictly bounded at COSMIC_LIMITS.OVERVOID_MAX_COUNT (${COSMIC_LIMITS.OVERVOID_MAX_COUNT}). All 100 Overvoid slots (index 1..100) are already allocated under THE_WHITE_PAGE.`,
      maxAllowed: COSMIC_LIMITS.OVERVOID_MAX_COUNT,
      currentCount: currentOvervoids.length,
      root: baseRoot,
    };
  }

  const nextIndex = params.candidateOvervoid.index ?? currentOvervoids.length + 1;
  if (nextIndex < 1 || nextIndex > COSMIC_LIMITS.OVERVOID_MAX_COUNT) {
    return {
      allowed: false,
      reason: `Rejected: Tier 5 Overvoid index must be between 1 and ${COSMIC_LIMITS.OVERVOID_MAX_COUNT}, got ${nextIndex}.`,
      maxAllowed: COSMIC_LIMITS.OVERVOID_MAX_COUNT,
      currentCount: currentOvervoids.length,
      root: baseRoot,
    };
  }

  const padded = String(nextIndex).padStart(3, '0');
  const newOvervoid: Overvoid = {
    id: params.candidateOvervoid.id ?? `OVERVOID-${padded}`,
    index: nextIndex,
    name: params.candidateOvervoid.name ?? `Overvoid #${padded}`,
    tier: 5,
    alias: params.candidateOvervoid.alias ?? 'The Overvoid',
    logicSystem: params.candidateOvervoid.logicSystem ?? 'Paraconsistent Transfinite Modal Logic',
    cosmicHierarchyRules: {
      ...STANDARD_OVERVOID_COSMIC_RULES,
      ...(params.candidateOvervoid.cosmicHierarchyRules ?? {}),
    },
    omniverses:
      params.candidateOvervoid.omniverses ??
      createInfiniteCollection(`SEED-OVERVOID-${padded}-OMNIVERSE`, []),
  };

  const nextOvervoids = [...currentOvervoids, newOvervoid];
  const nextRoot: WhitePageRoot = {
    ...baseRoot,
    overvoids: nextOvervoids,
    exonverses: nextOvervoids,
  };

  return {
    allowed: true,
    reason: `Created Tier 5 Overvoid ${newOvervoid.id} (index ${nextIndex}/${COSMIC_LIMITS.OVERVOID_MAX_COUNT}).`,
    maxAllowed: COSMIC_LIMITS.OVERVOID_MAX_COUNT,
    currentCount: nextOvervoids.length,
    root: nextRoot,
  };
}

/**
 * Rule 3: Infinite Tier Handling (Tiers 1–4).
 * Lazily generates and appends a bounded page (`pageSize`, default 1, max 10 per call)
 * of procedural nodes into an `InfiniteCollection` at Tier 4 (`Omniverse`), Tier 3 (`Megaverse`),
 * Tier 2 (`Multiverse`), or Tier 1 (`Universe`) using deterministic seeds — never running
 * unbounded `while(true)` loops.
 */
export function lazilyGenerateInfiniteTierSlice(params: {
  root?: WhitePageRoot;
  parentTier: 5 | 4 | 3 | 2;
  parentId: string;
  pageSize?: number;
  syncSingleton?: boolean;
}): WhitePageRoot {
  const baseRoot = params.root ?? getWhitePageSingletonRoot();
  const safePageSize = Math.max(1, Math.min(10, Math.floor(params.pageSize ?? 1)));

  const nextOvervoids = baseRoot.overvoids.map((overvoid) => {
    // Lazily generate new Tier 4 Omniverses inside a Tier 5 Overvoid
    if (params.parentTier === 5 && overvoidMatchesIdentifier(overvoid, params.parentId)) {
      const existingOmnis = overvoid.omniverses.loadedNodes;
      const newOmnis: Omniverse[] = [];
      for (let i = 0; i < safePageSize; i++) {
        const cursor = existingOmnis.length + i + 1;
        const hash = deterministicSeedHash(overvoid.omniverses.generatorSeed, cursor);
        const scopes: Array<'past' | 'present' | 'potential' | 'all'> = [
          'all',
          'present',
          'potential',
          'past',
        ];
        const scope = scopes[hash % scopes.length];
        const omniId = `OMNI-${String(overvoid.index).padStart(3, '0')}-∞${cursor}`;
        const mgId = `HV-${String(overvoid.index).padStart(3, '0')}-∞${cursor}`;
        const mvId = `MV-${String(overvoid.index).padStart(3, '0')}-∞${cursor}`;
        const uId = `U-${String(overvoid.index).padStart(3, '0')}.∞${cursor}.1`;

        const lazyUniverse: Universe = {
          id: uId,
          name: `Procedural Continuum ${uId} (Seed #${(hash % 9999) + 1000})`,
          tier: 1,
          spacetimeConfig: {
            ...STANDARD_UNIVERSE_SPACETIME_CONFIG,
            proceduralCursor: cursor,
            timeDilationFactor: Number((1 + (hash % 40) / 10).toFixed(2)),
          },
          matterConstants: {
            ...STANDARD_UNIVERSE_MATTER_CONSTANTS,
            qiSpiritDensityMultiplier: Number((1.2 + (hash % 50) / 10).toFixed(2)),
            gravityMultiplier: Number((0.8 + (hash % 30) / 10).toFixed(2)),
          },
        };

        const lazyMultiverse: Multiverse = {
          id: mvId,
          name: `Procedural Multiverse ${mvId}`,
          tier: 2,
          topology: hash % 2 === 0 ? 'parallel' : 'hybrid',
          universes: createInfiniteCollection(`SEED-${mvId}-UNIVERSE`, [lazyUniverse]),
        };

        const lazyMegaverse: Megaverse = {
          id: mgId,
          name: `Procedural Hyperverse ${mgId}`,
          tier: 3,
          alias: hash % 2 === 0 ? 'Hyperverse' : 'Megaverse',
          multiverses: createInfiniteCollection(`SEED-${mgId}-MULTIVERSE`, [lazyMultiverse]),
        };

        newOmnis.push({
          id: omniId,
          name: `Transfinite Omniverse ${omniId} (Overvoid #${overvoid.index} Slice #${cursor})`,
          tier: 4,
          temporalScope: scope,
          megaverses: createInfiniteCollection(`SEED-${omniId}-MEGAVERSE`, [lazyMegaverse]),
        });
      }

      return {
        ...overvoid,
        omniverses: {
          ...overvoid.omniverses,
          loadedNodes: [...existingOmnis, ...newOmnis],
        },
      };
    }

    // Traverse into Omniverses for parentTier 4, 3, or 2
    const nextOmniverses = overvoid.omniverses.loadedNodes.map((omniverse) => {
      if (params.parentTier === 4 && omniverse.id === params.parentId) {
        const existingMgs = omniverse.megaverses.loadedNodes;
        const newMgs: Megaverse[] = [];
        for (let i = 0; i < safePageSize; i++) {
          const cursor = existingMgs.length + i + 1;
          const hash = deterministicSeedHash(omniverse.megaverses.generatorSeed, cursor);
          const mgId = `${omniverse.id}-HV-∞${cursor}`;
          const mvId = `${omniverse.id}-MV-∞${cursor}`;
          const uId = `${omniverse.id}-U-∞${cursor}.1`;
          const alias: 'Megaverse' | 'Hyperverse' = hash % 2 === 0 ? 'Hyperverse' : 'Megaverse';

          const lazyUniv: Universe = {
            id: uId,
            name: `Procedural Universe ${uId}`,
            tier: 1,
            spacetimeConfig: {
              ...STANDARD_UNIVERSE_SPACETIME_CONFIG,
              timeDilationFactor: Number((1 + (hash % 30) / 10).toFixed(2)),
            },
            matterConstants: {
              ...STANDARD_UNIVERSE_MATTER_CONSTANTS,
              qiSpiritDensityMultiplier: Number((1.5 + (hash % 40) / 10).toFixed(2)),
            },
          };

          const lazyMv: Multiverse = {
            id: mvId,
            name: `Procedural Multiverse ${mvId}`,
            tier: 2,
            topology: 'parallel',
            universes: createInfiniteCollection(`SEED-${mvId}-UNIVERSE`, [lazyUniv]),
          };

          newMgs.push({
            id: mgId,
            name: `Procedural ${alias} ${mgId} (Slice #${cursor})`,
            tier: 3,
            alias,
            multiverses: createInfiniteCollection(`SEED-${mgId}-MULTIVERSE`, [lazyMv]),
          });
        }

        return {
          ...omniverse,
          megaverses: {
            ...omniverse.megaverses,
            loadedNodes: [...existingMgs, ...newMgs],
          },
        };
      }

      const nextMegaverses = omniverse.megaverses.loadedNodes.map((megaverse) => {
        if (params.parentTier === 3 && megaverse.id === params.parentId) {
          const existingMvs = megaverse.multiverses.loadedNodes;
          const newMvs: Multiverse[] = [];
          for (let i = 0; i < safePageSize; i++) {
            const cursor = existingMvs.length + i + 1;
            const hash = deterministicSeedHash(megaverse.multiverses.generatorSeed, cursor);
            const mvId = `${megaverse.id}-MV-∞${cursor}`;
            const uId = `${megaverse.id}-U-∞${cursor}.1`;
            const topologies: Array<'parallel' | 'series' | 'hybrid'> = [
              'parallel',
              'series',
              'hybrid',
            ];

            const lazyUniv: Universe = {
              id: uId,
              name: `Procedural Universe ${uId}`,
              tier: 1,
              spacetimeConfig: {
                ...STANDARD_UNIVERSE_SPACETIME_CONFIG,
                timeDilationFactor: Number((1 + (hash % 25) / 10).toFixed(2)),
              },
              matterConstants: {
                ...STANDARD_UNIVERSE_MATTER_CONSTANTS,
                qiSpiritDensityMultiplier: Number((1.5 + (hash % 35) / 10).toFixed(2)),
              },
            };

            newMvs.push({
              id: mvId,
              name: `Procedural Multiverse ${mvId} (Slice #${cursor})`,
              tier: 2,
              topology: topologies[hash % topologies.length],
              universes: createInfiniteCollection(`SEED-${mvId}-UNIVERSE`, [lazyUniv]),
            });
          }

          return {
            ...megaverse,
            multiverses: {
              ...megaverse.multiverses,
              loadedNodes: [...existingMvs, ...newMvs],
            },
          };
        }

        const nextMultiverses = megaverse.multiverses.loadedNodes.map((multiverse) => {
          if (params.parentTier !== 2 || multiverse.id !== params.parentId) {
            return multiverse;
          }
          const existingUnivs = multiverse.universes.loadedNodes;
          const newUnivs: Universe[] = [];
          for (let i = 0; i < safePageSize; i++) {
            const cursor = existingUnivs.length + i + 1;
            const hash = deterministicSeedHash(multiverse.universes.generatorSeed, cursor);
            const uId = `${multiverse.id}-U-∞${cursor}`;
            newUnivs.push({
              id: uId,
              name: `Procedural Continuum ${uId} (Lazy Slice #${cursor})`,
              tier: 1,
              spacetimeConfig: {
                ...STANDARD_UNIVERSE_SPACETIME_CONFIG,
                proceduralSeed: multiverse.universes.generatorSeed,
                cursorIndex: cursor,
                timeDilationFactor: Number((1 + (hash % 50) / 10).toFixed(2)),
              },
              matterConstants: {
                ...STANDARD_UNIVERSE_MATTER_CONSTANTS,
                qiSpiritDensityMultiplier: Number((1.25 + (hash % 60) / 10).toFixed(2)),
                gravityMultiplier: Number((0.75 + (hash % 40) / 10).toFixed(2)),
              },
            });
          }

          return {
            ...multiverse,
            universes: {
              ...multiverse.universes,
              loadedNodes: [...existingUnivs, ...newUnivs],
            },
          };
        });

        return {
          ...megaverse,
          multiverses: {
            ...megaverse.multiverses,
            loadedNodes: nextMultiverses,
          },
        };
      });

      return {
        ...omniverse,
        megaverses: {
          ...omniverse.megaverses,
          loadedNodes: nextMegaverses,
        },
      };
    });

    return {
      ...overvoid,
      omniverses: {
        ...overvoid.omniverses,
        loadedNodes: nextOmniverses,
      },
    };
  });

  const nextRoot: WhitePageRoot = {
    ...baseRoot,
    overvoids: nextOvervoids,
    exonverses: nextOvervoids,
  };

  if (params.syncSingleton !== false) {
    setWhitePageSingletonRoot(nextRoot);
  }
  return nextRoot;
}

export interface CosmologicalTreeValidationSummary {
  valid: boolean;
  rootId: string;
  rootAlias: string;
  creatorEmail: string;
  includesOblivion: boolean;
  oblivionSpawnedFromWhitePage: boolean;
  cardinalities: {
    tier6WhitePageRoot: typeof COSMIC_LIMITS.WHITE_PAGE_COUNT;
    tier5Overvoids: typeof COSMIC_LIMITS.OVERVOID_MAX_COUNT;
    tier4Omniverses: typeof COSMIC_LIMITS.OMNIVERSE_COUNT;
    tier3Megaverses: typeof COSMIC_LIMITS.MEGAVERSE_COUNT;
    tier2Multiverses: typeof COSMIC_LIMITS.MULTIVERSE_COUNT;
    tier1Universes: typeof COSMIC_LIMITS.UNIVERSE_COUNT;
  };
  tierCounts: {
    tier6WhitePageRoot: number;
    tier5Overvoids: number;
    tier4Omniverses: number;
    tier3Megaverses: number;
    tier2Multiverses: number;
    tier1Universes: number;
  };
  violations: string[];
}

/**
 * Enforces Rules 1, 2, and 3:
 * 1. Singleton Enforcement (Tier 6): `WhitePageRoot` is a singleton (`id: 'THE_WHITE_PAGE'`, `tier: 6`, `isSingleton: true`, `creatorEmail: 'creatergame31@gmail.com'`, `oblivionState.exists: true`).
 * 2. Bounded Array Enforcement (Tier 5): `overvoids.length === 100` (`COSMIC_LIMITS.OVERVOID_MAX_COUNT`), `index: 1..100`.
 * 3. Infinite Tier Handling (Tiers 1–4): `InfiniteCollection<T>` with `totalCount === Infinity`, deterministic `generatorSeed`, and `loadedNodes`.
 */
export function validateCosmologicalTreeHierarchy(
  root: WhitePageRoot = getWhitePageSingletonRoot()
): CosmologicalTreeValidationSummary {
  const violations: string[] = [];

  if (root.id !== 'THE_WHITE_PAGE') {
    violations.push(`Tier 6 root id must be 'THE_WHITE_PAGE', got '${String(root.id)}'.`);
  }
  if (root.tier !== 6) {
    violations.push(`Tier 6 root tier must be 6, got '${String(root.tier)}'.`);
  }
  if (root.isSingleton !== true) {
    violations.push('Tier 6 root must enforce isSingleton === true.');
  }
  if (root.alias !== 'The House of Ideas') {
    violations.push(`Tier 6 root alias must be 'The House of Ideas', got '${String(root.alias)}'.`);
  }
  if (root.creatorEmail !== PRIMARY_ADMIN_EMAIL) {
    violations.push(
      `Tier 6 creatorEmail must be '${PRIMARY_ADMIN_EMAIL}', got '${String(root.creatorEmail)}'.`
    );
  }
  if (root.oblivionState?.exists !== true) {
    violations.push('Tier 6 root must have oblivionState.exists === true.');
  }

  const oblivionSpawnedFromWhitePage =
    root.oblivionState?.exists === true &&
    root.oblivionState.description === 'Absolute nothingness originating from The White Page';
  if (!oblivionSpawnedFromWhitePage) {
    violations.push(
      "Oblivion domain must originate from THE_WHITE_PAGE with description 'Absolute nothingness originating from The White Page'."
    );
  }

  const overvoidList = root.overvoids ?? root.exonverses ?? [];
  if (!Array.isArray(overvoidList) || overvoidList.length !== COSMIC_LIMITS.OVERVOID_MAX_COUNT) {
    violations.push(
      `Tier 5 Overvoid array length must equal exactly ${COSMIC_LIMITS.OVERVOID_MAX_COUNT}, got ${overvoidList?.length ?? 0}.`
    );
  }

  let tier5Overvoids = 0;
  let tier4Omniverses = 0;
  let tier3Megaverses = 0;
  let tier2Multiverses = 0;
  let tier1Universes = 0;

  for (let i = 0; i < overvoidList.length; i++) {
    const overvoid = overvoidList[i];
    tier5Overvoids += 1;
    if (overvoid.tier !== 5) {
      violations.push(`Overvoid ${overvoid.id} must have tier === 5.`);
    }
    if (overvoid.index < 1 || overvoid.index > COSMIC_LIMITS.OVERVOID_MAX_COUNT) {
      violations.push(
        `Overvoid ${overvoid.id} index ${overvoid.index} is outside bounded range 1..${COSMIC_LIMITS.OVERVOID_MAX_COUNT}.`
      );
    }
    if (overvoid.alias !== 'The Overvoid' && overvoid.alias !== 'Exonverse') {
      violations.push(`Invalid Tier 5 Overvoid alias on ${overvoid.id}: ${String(overvoid.alias)}`);
    }
    if (!overvoid.logicSystem || overvoid.logicSystem.trim().length === 0) {
      violations.push(`Tier 5 Overvoid ${overvoid.id} is missing logicSystem.`);
    }
    if (
      !overvoid.omniverses ||
      overvoid.omniverses.totalCount !== Infinity ||
      !overvoid.omniverses.generatorSeed ||
      !Array.isArray(overvoid.omniverses.loadedNodes) ||
      overvoid.omniverses.loadedNodes.length === 0
    ) {
      violations.push(
        `Tier 5 Overvoid ${overvoid.id} must have an InfiniteCollection<Omniverse> with totalCount: Infinity and loadedNodes.`
      );
      continue;
    }

    for (const omniverse of overvoid.omniverses.loadedNodes) {
      tier4Omniverses += 1;
      if (omniverse.tier !== 4) {
        violations.push(`Tier 4 Omniverse ${omniverse.id} must have tier === 4.`);
      }
      if (!['past', 'present', 'potential', 'all'].includes(omniverse.temporalScope)) {
        violations.push(
          `Invalid Tier 4 Omniverse temporalScope on ${omniverse.id}: ${String(omniverse.temporalScope)}`
        );
      }
      if (
        !omniverse.megaverses ||
        omniverse.megaverses.totalCount !== Infinity ||
        !omniverse.megaverses.generatorSeed ||
        !Array.isArray(omniverse.megaverses.loadedNodes) ||
        omniverse.megaverses.loadedNodes.length === 0
      ) {
        violations.push(
          `Tier 4 Omniverse ${omniverse.id} must have an InfiniteCollection<Megaverse> with totalCount: Infinity.`
        );
        continue;
      }

      for (const megaverse of omniverse.megaverses.loadedNodes) {
        tier3Megaverses += 1;
        if (megaverse.tier !== 3) {
          violations.push(`Tier 3 Megaverse ${megaverse.id} must have tier === 3.`);
        }
        if (megaverse.alias !== 'Megaverse' && megaverse.alias !== 'Hyperverse') {
          violations.push(
            `Invalid Tier 3 Megaverse alias on ${megaverse.id}: ${String(megaverse.alias)}`
          );
        }
        if (
          !megaverse.multiverses ||
          megaverse.multiverses.totalCount !== Infinity ||
          !megaverse.multiverses.generatorSeed ||
          !Array.isArray(megaverse.multiverses.loadedNodes) ||
          megaverse.multiverses.loadedNodes.length === 0
        ) {
          violations.push(
            `Tier 3 Megaverse ${megaverse.id} must have an InfiniteCollection<Multiverse> with totalCount: Infinity.`
          );
          continue;
        }

        for (const multiverse of megaverse.multiverses.loadedNodes) {
          tier2Multiverses += 1;
          if (multiverse.tier !== 2) {
            violations.push(`Tier 2 Multiverse ${multiverse.id} must have tier === 2.`);
          }
          if (!['parallel', 'series', 'hybrid'].includes(multiverse.topology)) {
            violations.push(
              `Invalid Tier 2 Multiverse topology on ${multiverse.id}: ${String(multiverse.topology)}`
            );
          }
          if (
            !multiverse.universes ||
            multiverse.universes.totalCount !== Infinity ||
            !multiverse.universes.generatorSeed ||
            !Array.isArray(multiverse.universes.loadedNodes) ||
            multiverse.universes.loadedNodes.length === 0
          ) {
            violations.push(
              `Tier 2 Multiverse ${multiverse.id} must have an InfiniteCollection<Universe> with totalCount: Infinity.`
            );
            continue;
          }

          for (const universe of multiverse.universes.loadedNodes) {
            tier1Universes += 1;
            if (universe.tier !== 1) {
              violations.push(`Tier 1 Universe ${universe.id} must have tier === 1.`);
            }
            if (!universe.id || !universe.name) {
              violations.push(`Tier 1 Universe under ${multiverse.id} is missing id or name.`);
            }
            if (!universe.spacetimeConfig || typeof universe.spacetimeConfig !== 'object') {
              violations.push(`Tier 1 Universe ${universe.id} is missing spacetimeConfig.`);
            }
            if (!universe.matterConstants || typeof universe.matterConstants !== 'object') {
              violations.push(`Tier 1 Universe ${universe.id} is missing matterConstants.`);
            }
          }
        }
      }
    }
  }

  return {
    valid: violations.length === 0,
    rootId: root.id,
    rootAlias: root.alias,
    creatorEmail: root.creatorEmail,
    includesOblivion: root.oblivionState?.exists === true,
    oblivionSpawnedFromWhitePage,
    cardinalities: {
      tier6WhitePageRoot: COSMIC_LIMITS.WHITE_PAGE_COUNT,
      tier5Overvoids: COSMIC_LIMITS.OVERVOID_MAX_COUNT,
      tier4Omniverses: COSMIC_LIMITS.OMNIVERSE_COUNT,
      tier3Megaverses: COSMIC_LIMITS.MEGAVERSE_COUNT,
      tier2Multiverses: COSMIC_LIMITS.MULTIVERSE_COUNT,
      tier1Universes: COSMIC_LIMITS.UNIVERSE_COUNT,
    },
    tierCounts: {
      tier6WhitePageRoot: COSMIC_LIMITS.WHITE_PAGE_COUNT,
      tier5Overvoids,
      tier4Omniverses,
      tier3Megaverses,
      tier2Multiverses,
      tier1Universes,
    },
    violations,
  };
}

export interface EntityCosmologicalPath {
  found: boolean;
  tier6WhitePage: {
    id: 'THE_WHITE_PAGE';
    tier: 6;
    isSingleton: true;
    alias: 'The House of Ideas';
    creatorEmail: 'creatergame31@gmail.com';
    includesOblivion: true;
  };
  tier5Overvoid: Overvoid;
  tier4Omniverse: Omniverse;
  tier3Megaverse: Megaverse;
  tier2Multiverse: Multiverse;
  tier1Universe: Universe;
  breadcrumbIdentifiers: [string, string, string, string, string, string];
  breadcrumbNames: [string, string, string, string, string, string];
}

/**
 * Resolves the strict 6-tier parent-child path from Tier 6 (`THE_WHITE_PAGE`)
 * down to Tier 1 (`Universe`) for any Universe ID (defaults to `SOLARA_PRIME_UNIVERSE_ID`).
 */
export function resolveEntityCosmologicalPath(
  root: WhitePageRoot = getWhitePageSingletonRoot(),
  universeId: string = SOLARA_PRIME_UNIVERSE_ID
): EntityCosmologicalPath {
  const overvoidList = root.overvoids ?? root.exonverses ?? [];
  for (const overvoid of overvoidList) {
    for (const omniverse of overvoid.omniverses.loadedNodes) {
      for (const megaverse of omniverse.megaverses.loadedNodes) {
        for (const multiverse of megaverse.multiverses.loadedNodes) {
          for (const universe of multiverse.universes.loadedNodes) {
            if (universe.id === universeId) {
              return {
                found: true,
                tier6WhitePage: {
                  id: root.id,
                  tier: 6,
                  isSingleton: true,
                  alias: root.alias,
                  creatorEmail: root.creatorEmail,
                  includesOblivion: true,
                },
                tier5Overvoid: overvoid,
                tier4Omniverse: omniverse,
                tier3Megaverse: megaverse,
                tier2Multiverse: multiverse,
                tier1Universe: universe,
                breadcrumbIdentifiers: [
                  root.id,
                  overvoid.id,
                  omniverse.id,
                  megaverse.id,
                  multiverse.id,
                  universe.id,
                ],
                breadcrumbNames: [
                  `${root.id} (${root.alias})`,
                  `${overvoid.name} [${overvoid.alias} #${overvoid.index}/100]`,
                  `${omniverse.name} [Scope: ${omniverse.temporalScope} · ∞]`,
                  `${megaverse.name} [${megaverse.alias} · ∞]`,
                  `${multiverse.name} [Topology: ${multiverse.topology} · ∞]`,
                  universe.name,
                ],
              };
            }
          }
        }
      }
    }
  }

  // Fallback to the first loaded leaf universe in the tree if custom ID not found
  const fallbackOvervoid = overvoidList[0];
  const fallbackOmniverse = fallbackOvervoid.omniverses.loadedNodes[0];
  const fallbackMegaverse = fallbackOmniverse.megaverses.loadedNodes[0];
  const fallbackMultiverse = fallbackMegaverse.multiverses.loadedNodes[0];
  const fallbackUniverse = fallbackMultiverse.universes.loadedNodes[0];

  return {
    found: false,
    tier6WhitePage: {
      id: root.id,
      tier: 6,
      isSingleton: true,
      alias: root.alias,
      creatorEmail: root.creatorEmail,
      includesOblivion: true,
    },
    tier5Overvoid: fallbackOvervoid,
    tier4Omniverse: fallbackOmniverse,
    tier3Megaverse: fallbackMegaverse,
    tier2Multiverse: fallbackMultiverse,
    tier1Universe: fallbackUniverse,
    breadcrumbIdentifiers: [
      root.id,
      fallbackOvervoid.id,
      fallbackOmniverse.id,
      fallbackMegaverse.id,
      fallbackMultiverse.id,
      fallbackUniverse.id,
    ],
    breadcrumbNames: [
      `${root.id} (${root.alias})`,
      `${fallbackOvervoid.name} [${fallbackOvervoid.alias} #${fallbackOvervoid.index}/100]`,
      `${fallbackOmniverse.name} [Scope: ${fallbackOmniverse.temporalScope} · ∞]`,
      `${fallbackMegaverse.name} [${fallbackMegaverse.alias} · ∞]`,
      `${fallbackMultiverse.name} [Topology: ${fallbackMultiverse.topology} · ∞]`,
      fallbackUniverse.name,
    ],
  };
}

export interface EffectiveCosmologicalPhysicsProfile {
  universeId: string;
  universeName: string;
  overvoidId: string;
  overvoidIndex: number;
  overvoidAlias: 'The Overvoid' | 'Exonverse';
  effectiveLogicSystem: string;
  effectiveCosmicHierarchyRules: Record<string, unknown>;
  effectiveSpacetimeConfig: Record<string, unknown>;
  effectiveMatterConstants: Record<string, unknown>;
  // Resolved numeric gameplay/physics parameters after Tier 5 + Tier 1 overrides
  effectiveSpeedOfLightMps: number;
  effectiveTimeDilationFactor: number;
  effectiveGravityMultiplier: number;
  effectiveQiMultiplier: number;
  effectiveRealmSuppressionBase: number;
  tier5CustomOverrideKeys: string[];
  tier1CustomOverrideKeys: string[];
}

/**
 * Evaluates effective physics and logic for a Tier 1 `Universe` by cascading:
 *   1. Standard Baseline Physics & Logic (`STANDARD_UNIVERSE_*` & `STANDARD_OVERVOID_COSMIC_RULES`)
 *   2. Tier 5 (`Overvoid` / `Exonverse`) custom `logicSystem` & `cosmicHierarchyRules` overrides
 *   3. Tier 1 (`Universe`) custom `spacetimeConfig` & `matterConstants` overrides
 */
export function evaluateEffectiveUniversePhysicsAndLogic(
  root: WhitePageRoot = getWhitePageSingletonRoot(),
  universeId: string = SOLARA_PRIME_UNIVERSE_ID
): EffectiveCosmologicalPhysicsProfile {
  const path = resolveEntityCosmologicalPath(root, universeId);
  const { tier5Overvoid, tier1Universe } = path;

  const effectiveCosmicHierarchyRules: Record<string, unknown> = {
    ...STANDARD_OVERVOID_COSMIC_RULES,
    ...tier5Overvoid.cosmicHierarchyRules,
  };

  // Tier 5 Overvoid rules can also inject baseline spacetime/matter overrides before Tier 1 leaf overrides
  const overvoidSpacetimeOverrides =
    typeof tier5Overvoid.cosmicHierarchyRules.spacetimeOverrides === 'object' &&
    tier5Overvoid.cosmicHierarchyRules.spacetimeOverrides !== null
      ? (tier5Overvoid.cosmicHierarchyRules.spacetimeOverrides as Record<string, unknown>)
      : {};
  const overvoidMatterOverrides =
    typeof tier5Overvoid.cosmicHierarchyRules.matterOverrides === 'object' &&
    tier5Overvoid.cosmicHierarchyRules.matterOverrides !== null
      ? (tier5Overvoid.cosmicHierarchyRules.matterOverrides as Record<string, unknown>)
      : {};

  const customTier1Spacetime = Object.fromEntries(
    Object.entries(tier1Universe.spacetimeConfig).filter(
      ([k, v]) => v !== STANDARD_UNIVERSE_SPACETIME_CONFIG[k]
    )
  );
  const customTier1Matter = Object.fromEntries(
    Object.entries(tier1Universe.matterConstants).filter(
      ([k, v]) => v !== STANDARD_UNIVERSE_MATTER_CONSTANTS[k]
    )
  );

  const effectiveSpacetimeConfig: Record<string, unknown> = {
    ...STANDARD_UNIVERSE_SPACETIME_CONFIG,
    ...tier1Universe.spacetimeConfig,
    ...overvoidSpacetimeOverrides,
    ...customTier1Spacetime,
  };

  const effectiveMatterConstants: Record<string, unknown> = {
    ...STANDARD_UNIVERSE_MATTER_CONSTANTS,
    ...tier1Universe.matterConstants,
    ...overvoidMatterOverrides,
    ...customTier1Matter,
  };

  const tier5CustomOverrideKeys = Object.keys(tier5Overvoid.cosmicHierarchyRules).filter(
    (key) => tier5Overvoid.cosmicHierarchyRules[key] !== STANDARD_OVERVOID_COSMIC_RULES[key]
  );

  const tier1CustomOverrideKeys = [
    ...Object.keys(tier1Universe.spacetimeConfig).filter(
      (key) => tier1Universe.spacetimeConfig[key] !== STANDARD_UNIVERSE_SPACETIME_CONFIG[key]
    ),
    ...Object.keys(tier1Universe.matterConstants).filter(
      (key) => tier1Universe.matterConstants[key] !== STANDARD_UNIVERSE_MATTER_CONSTANTS[key]
    ),
  ];

  const effectiveSpeedOfLightMps =
    typeof effectiveSpacetimeConfig.speedOfLightMps === 'number'
      ? effectiveSpacetimeConfig.speedOfLightMps
      : 299_792_458;

  const effectiveTimeDilationFactor =
    typeof effectiveSpacetimeConfig.timeDilationFactor === 'number'
      ? effectiveSpacetimeConfig.timeDilationFactor
      : 1.0;

  const effectiveGravityMultiplier =
    typeof effectiveMatterConstants.gravityMultiplier === 'number'
      ? effectiveMatterConstants.gravityMultiplier
      : 1.0;

  const baseUniverseQi =
    typeof effectiveMatterConstants.qiSpiritDensityMultiplier === 'number'
      ? effectiveMatterConstants.qiSpiritDensityMultiplier
      : 1.0;
  const overvoidQiBonus =
    typeof effectiveCosmicHierarchyRules.qiMultiplierBonus === 'number'
      ? effectiveCosmicHierarchyRules.qiMultiplierBonus
      : 1.0;

  const effectiveQiMultiplier = Number((baseUniverseQi * overvoidQiBonus).toFixed(4));

  const effectiveRealmSuppressionBase =
    typeof effectiveCosmicHierarchyRules.realmSuppressionBase === 'number'
      ? effectiveCosmicHierarchyRules.realmSuppressionBase
      : 10;

  return {
    universeId: tier1Universe.id,
    universeName: tier1Universe.name,
    overvoidId: tier5Overvoid.id,
    overvoidIndex: tier5Overvoid.index,
    overvoidAlias: tier5Overvoid.alias,
    effectiveLogicSystem: tier5Overvoid.logicSystem,
    effectiveCosmicHierarchyRules,
    effectiveSpacetimeConfig,
    effectiveMatterConstants,
    effectiveSpeedOfLightMps,
    effectiveTimeDilationFactor,
    effectiveGravityMultiplier,
    effectiveQiMultiplier,
    effectiveRealmSuppressionBase,
    tier5CustomOverrideKeys,
    tier1CustomOverrideKeys,
  };
}

/**
 * Allows custom logic systems and `cosmicHierarchyRules` to override standard
 * logic and physics across a Tier 5 Overvoid container (supports targeting by
 * exact `OVERVOID-001..100` ID or sector group ID like `EXO-T5-SOLARA-PRIME`).
 */
export function overrideOvervoidLogicRules(params: {
  root?: WhitePageRoot;
  overvoidId: string;
  logicSystem?: string;
  alias?: 'The Overvoid' | 'Exonverse';
  cosmicHierarchyRulesPatch: Record<string, unknown>;
  syncSingleton?: boolean;
}): WhitePageRoot {
  const baseRoot = params.root ?? getWhitePageSingletonRoot();
  const nextOvervoids = baseRoot.overvoids.map((overvoid) => {
    if (!overvoidMatchesIdentifier(overvoid, params.overvoidId)) return overvoid;
    return {
      ...overvoid,
      alias: params.alias ?? overvoid.alias,
      logicSystem:
        params.logicSystem && params.logicSystem.trim().length > 0
          ? params.logicSystem.trim()
          : overvoid.logicSystem,
      cosmicHierarchyRules: {
        ...overvoid.cosmicHierarchyRules,
        ...params.cosmicHierarchyRulesPatch,
      },
    };
  });

  const nextRoot: WhitePageRoot = {
    ...baseRoot,
    overvoids: nextOvervoids,
    exonverses: nextOvervoids,
  };

  if (params.syncSingleton !== false) {
    setWhitePageSingletonRoot(nextRoot);
  }
  return nextRoot;
}

/**
 * Allows custom `spacetimeConfig` and `matterConstants` to override standard
 * physical constants inside a specific Tier 1 leaf `Universe`.
 */
export function overrideUniversePhysicsConstants(params: {
  root?: WhitePageRoot;
  universeId: string;
  spacetimeConfigPatch?: Record<string, unknown>;
  matterConstantsPatch?: Record<string, unknown>;
  syncSingleton?: boolean;
}): WhitePageRoot {
  const baseRoot = params.root ?? getWhitePageSingletonRoot();
  const nextOvervoids = baseRoot.overvoids.map((overvoid) => ({
    ...overvoid,
    omniverses: {
      ...overvoid.omniverses,
      loadedNodes: overvoid.omniverses.loadedNodes.map((omniverse) => ({
        ...omniverse,
        megaverses: {
          ...omniverse.megaverses,
          loadedNodes: omniverse.megaverses.loadedNodes.map((megaverse) => ({
            ...megaverse,
            multiverses: {
              ...megaverse.multiverses,
              loadedNodes: megaverse.multiverses.loadedNodes.map((multiverse) => ({
                ...multiverse,
                universes: {
                  ...multiverse.universes,
                  loadedNodes: multiverse.universes.loadedNodes.map((universe) => {
                    if (universe.id !== params.universeId) return universe;
                    return {
                      ...universe,
                      spacetimeConfig: {
                        ...universe.spacetimeConfig,
                        ...(params.spacetimeConfigPatch ?? {}),
                      },
                      matterConstants: {
                        ...universe.matterConstants,
                        ...(params.matterConstantsPatch ?? {}),
                      },
                    };
                  }),
                },
              })),
            },
          })),
        },
      })),
    },
  }));

  const nextRoot: WhitePageRoot = {
    ...baseRoot,
    overvoids: nextOvervoids,
    exonverses: nextOvervoids,
  };

  if (params.syncSingleton !== false) {
    setWhitePageSingletonRoot(nextRoot);
  }
  return nextRoot;
}

/**
 * Spawns a new child `Universe` inside a parent Tier 2 `Multiverse`'s `InfiniteCollection<Universe>`
 * while preserving strict 6-tier parent-child nesting.
 */
export function spawnNestedUniverseInMultiverse(params: {
  root?: WhitePageRoot;
  multiverseId: string;
  newUniverse: Omit<Universe, 'tier'> & { tier?: 1 };
  syncSingleton?: boolean;
}): WhitePageRoot {
  const baseRoot = params.root ?? getWhitePageSingletonRoot();
  const normalizedUniverse: Universe = {
    ...params.newUniverse,
    tier: 1,
  };

  const nextOvervoids = baseRoot.overvoids.map((overvoid) => ({
    ...overvoid,
    omniverses: {
      ...overvoid.omniverses,
      loadedNodes: overvoid.omniverses.loadedNodes.map((omniverse) => ({
        ...omniverse,
        megaverses: {
          ...omniverse.megaverses,
          loadedNodes: omniverse.megaverses.loadedNodes.map((megaverse) => ({
            ...megaverse,
            multiverses: {
              ...megaverse.multiverses,
              loadedNodes: megaverse.multiverses.loadedNodes.map((multiverse) => {
                if (multiverse.id !== params.multiverseId) return multiverse;
                const alreadyExists = multiverse.universes.loadedNodes.some(
                  (u) => u.id === normalizedUniverse.id
                );
                if (alreadyExists) return multiverse;
                return {
                  ...multiverse,
                  universes: {
                    ...multiverse.universes,
                    loadedNodes: [...multiverse.universes.loadedNodes, normalizedUniverse],
                  },
                };
              }),
            },
          })),
        },
      })),
    },
  }));

  const nextRoot: WhitePageRoot = {
    ...baseRoot,
    overvoids: nextOvervoids,
    exonverses: nextOvervoids,
  };

  if (params.syncSingleton !== false) {
    setWhitePageSingletonRoot(nextRoot);
  }
  return nextRoot;
}
