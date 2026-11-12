/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NPC, NPCRole } from '../types/game';
import { PRIMARY_ADMIN_EMAIL, isPrimaryAdminAccount } from './adminModeration';

export const TOP_100_SPECIES_PDF_ASSET_PATH =
  '/assets/aistudio/List_all__top_100_species-races_in_all_Fiction__._..._c0980fd8.pdf';

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
