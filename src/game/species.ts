/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterAppearance, CharacterSpeciesId, CoreCharacterSpeciesId } from '../types/game';
import { PRIMARY_ADMIN_EMAIL, isPrimaryAdminAccount } from './adminModeration';
import { TOP_100_OMNIVERSE_SPECIES_NPCS } from './omniverse';

export type SpeciesLineageCategory = 'fantasy_kingdom' | 'xianxia_immortal' | 'cosmic_primordial';

export interface SpeciesPassiveBonuses {
  shieldbearerDefensePct: number;
  shooterAttackPct: number;
  bomberSiegeAttackPct: number;
  rallyCapacityPct: number;
  qiCultivationSpeedPct: number;
  bodyCultivationSpeedPct: number;
  soulCultivationSpeedPct: number;
  mindCultivationSpeedPct: number;
}

export interface Species3DMeshTraits {
  /** [scaleX, scaleY, scaleZ] applied to the 3D character rig */
  bodyScale: [number, number, number];
  hasPointedElfEars: boolean;
  hasKitsuneFoxEars: boolean;
  hasRunicBeard: boolean;
  hasOrcTusks: boolean;
  hasDragonHorns: boolean;
  hasAsuraHorns: boolean;
  hasCelestialWings: boolean;
  hasDraconicTail: boolean;
  hasKitsuneTails: boolean;
  hasVoidOrbitCrystals: boolean;
  hasGolemChestReactor: boolean;
  accentColorHex: string;
  recommendedSkinColor: string;
  recommendedEyeColor: string;
  recommendedHairColor: string;
}

export interface CharacterSpeciesSpec {
  id: CharacterSpeciesId;
  name: string;
  chineseName: string;
  lineage: SpeciesLineageCategory;
  lineageLabel: string;
  omniverseRank: number;
  omniverseTier: 1 | 2 | 3 | 4 | 5;
  originCanon: string;
  isCoreStarterSpecies: boolean;
  requiresAdminPermission: boolean;
  icon: string;
  loreSummary: string;
  visualTraitsDescription: string;
  primaryBuffSummary: string;
  passives: SpeciesPassiveBonuses;
  meshTraits: Species3DMeshTraits;
}

/**
 * The 10 Canonical Founding Solara Bloodlines (mapped to their canonical Omniverse Ranks).
 * Available during initial character creation; switching after lock requires Admin (creatergame31@gmail.com) permission.
 */
export const CORE_10_SPECIES_CATALOG: CharacterSpeciesSpec[] = [
  {
    id: 'human',
    name: 'Terran Sovereign (Human)',
    chineseName: '人族·皇道苍生',
    lineage: 'fantasy_kingdom',
    lineageLabel: 'Fantasy Sovereign Lineage',
    omniverseRank: 81,
    omniverseTier: 5,
    originCanon: 'All Fiction / Solara Citadel',
    isCoreStarterSpecies: true,
    requiresAdminPermission: false,
    icon: '👑',
    loreSummary:
      'Adaptable mortal rulers of Solara Citadel whose balanced Dao affinity and tactical discipline unite all three military branches.',
    visualTraitsDescription: 'Balanced Imperial proportions, golden-amber aura & royal signet trim',
    primaryBuffSummary: '+15% Rally Capacity & +12% All Four-Path Cultivation Speed',
    passives: {
      shieldbearerDefensePct: 10,
      shooterAttackPct: 10,
      bomberSiegeAttackPct: 10,
      rallyCapacityPct: 15,
      qiCultivationSpeedPct: 12,
      bodyCultivationSpeedPct: 12,
      soulCultivationSpeedPct: 12,
      mindCultivationSpeedPct: 12,
    },
    meshTraits: {
      bodyScale: [1.0, 1.0, 1.0],
      hasPointedElfEars: false,
      hasKitsuneFoxEars: false,
      hasRunicBeard: false,
      hasOrcTusks: false,
      hasDragonHorns: false,
      hasAsuraHorns: false,
      hasCelestialWings: false,
      hasDraconicTail: false,
      hasKitsuneTails: false,
      hasVoidOrbitCrystals: false,
      hasGolemChestReactor: false,
      accentColorHex: '#fbbf24',
      recommendedSkinColor: '#f1c27d',
      recommendedEyeColor: '#00e5ff',
      recommendedHairColor: '#1a1a1a',
    },
  },
  {
    id: 'sylvan_elf',
    name: 'Sylvan High-Elf',
    chineseName: '精灵·苍翠星裔',
    lineage: 'fantasy_kingdom',
    lineageLabel: 'Fantasy Sovereign Lineage',
    omniverseRank: 99,
    omniverseTier: 5,
    originCanon: 'Fantasy, Tolkien, D&D',
    isCoreStarterSpecies: true,
    requiresAdminPermission: false,
    icon: '🏹',
    loreSummary:
      'Immortal starlight archers of the Emerald Canopy whose elongated spirit-ears attune directly to wind and astral leylines.',
    visualTraitsDescription: 'Tall slender stature, elongated pointed elven ears & emerald eyes',
    primaryBuffSummary: '+25% Shooter Attack & +20% Soul / Mind Cultivation Speed',
    passives: {
      shieldbearerDefensePct: 5,
      shooterAttackPct: 25,
      bomberSiegeAttackPct: 10,
      rallyCapacityPct: 10,
      qiCultivationSpeedPct: 18,
      bodyCultivationSpeedPct: 6,
      soulCultivationSpeedPct: 20,
      mindCultivationSpeedPct: 20,
    },
    meshTraits: {
      bodyScale: [0.94, 1.07, 0.94],
      hasPointedElfEars: true,
      hasKitsuneFoxEars: false,
      hasRunicBeard: false,
      hasOrcTusks: false,
      hasDragonHorns: false,
      hasAsuraHorns: false,
      hasCelestialWings: false,
      hasDraconicTail: false,
      hasKitsuneTails: false,
      hasVoidOrbitCrystals: false,
      hasGolemChestReactor: false,
      accentColorHex: '#34d399',
      recommendedSkinColor: '#ffdbac',
      recommendedEyeColor: '#00e676',
      recommendedHairColor: '#ffd700',
    },
  },
  {
    id: 'ironforge_dwarf',
    name: 'Ironforge Runedwarf',
    chineseName: '矮人·神炉符匠',
    lineage: 'fantasy_kingdom',
    lineageLabel: 'Fantasy Sovereign Lineage',
    omniverseRank: 100,
    omniverseTier: 5,
    originCanon: 'Fantasy, Tolkien, Mythology',
    isCoreStarterSpecies: true,
    requiresAdminPermission: false,
    icon: '⚒️',
    loreSummary:
      'Stout subterranean master-smiths who temper citadel bastions and heavy siege mortars with deep-earth runic fire.',
    visualTraitsDescription: 'Broad stout frame, braided runic war-beard & bronze forge plating',
    primaryBuffSummary: '+25% Shieldbearer Defense & +22% Bomber Siege Attack',
    passives: {
      shieldbearerDefensePct: 25,
      shooterAttackPct: 6,
      bomberSiegeAttackPct: 22,
      rallyCapacityPct: 10,
      qiCultivationSpeedPct: 8,
      bodyCultivationSpeedPct: 22,
      soulCultivationSpeedPct: 8,
      mindCultivationSpeedPct: 14,
    },
    meshTraits: {
      bodyScale: [1.14, 0.86, 1.12],
      hasPointedElfEars: false,
      hasKitsuneFoxEars: false,
      hasRunicBeard: true,
      hasOrcTusks: false,
      hasDragonHorns: false,
      hasAsuraHorns: false,
      hasCelestialWings: false,
      hasDraconicTail: false,
      hasKitsuneTails: false,
      hasVoidOrbitCrystals: false,
      hasGolemChestReactor: false,
      accentColorHex: '#f59e0b',
      recommendedSkinColor: '#e0ac69',
      recommendedEyeColor: '#ffea00',
      recommendedHairColor: '#e65100',
    },
  },
  {
    id: 'warborn_orc',
    name: 'Warborn Berserker (Orc)',
    chineseName: '兽人·血怒狂战',
    lineage: 'fantasy_kingdom',
    lineageLabel: 'Fantasy Sovereign Lineage',
    omniverseRank: 85,
    omniverseTier: 5,
    originCanon: 'Warhammer 40,000 & Fantasy',
    isCoreStarterSpecies: true,
    requiresAdminPermission: false,
    icon: '🪓',
    loreSummary:
      'Towering iron-tusked warlords bred in volcanic arenas whose bloodline ignites physical marrow and front-line shock charges.',
    visualTraitsDescription: 'Massive muscular build, protruding ivory war-tusks & pointed ears',
    primaryBuffSummary: '+28% Body Tempering Speed & +20% Shieldbearer / Bomber Might',
    passives: {
      shieldbearerDefensePct: 20,
      shooterAttackPct: 8,
      bomberSiegeAttackPct: 20,
      rallyCapacityPct: 12,
      qiCultivationSpeedPct: 6,
      bodyCultivationSpeedPct: 28,
      soulCultivationSpeedPct: 6,
      mindCultivationSpeedPct: 8,
    },
    meshTraits: {
      bodyScale: [1.18, 1.09, 1.16],
      hasPointedElfEars: true,
      hasKitsuneFoxEars: false,
      hasRunicBeard: false,
      hasOrcTusks: true,
      hasDragonHorns: false,
      hasAsuraHorns: false,
      hasCelestialWings: false,
      hasDraconicTail: false,
      hasKitsuneTails: false,
      hasVoidOrbitCrystals: false,
      hasGolemChestReactor: false,
      accentColorHex: '#ef4444',
      recommendedSkinColor: '#65a30d',
      recommendedEyeColor: '#ff1744',
      recommendedHairColor: '#1a1a1a',
    },
  },
  {
    id: 'azure_dragonkin',
    name: 'Azure Dragonkin',
    chineseName: '龙族·太古苍龙',
    lineage: 'xianxia_immortal',
    lineageLabel: 'Xianxia Immortal Lineage',
    omniverseRank: 50,
    omniverseTier: 3,
    originCanon: 'Mythology & Fantasy',
    isCoreStarterSpecies: true,
    requiresAdminPermission: false,
    icon: '🐉',
    loreSummary:
      'Scions of the Primordial Azure Dragon Sovereign bearing crystalline coral horns and a sweeping draconic tail that breathes pure Heaven Qi.',
    visualTraitsDescription:
      'Crystalline azure dragon antlers, sweeping draconic tail & cyan scales',
    primaryBuffSummary: '+25% Qi & Body Cultivation Speed + 18% All-Troop Combat Authority',
    passives: {
      shieldbearerDefensePct: 18,
      shooterAttackPct: 18,
      bomberSiegeAttackPct: 18,
      rallyCapacityPct: 16,
      qiCultivationSpeedPct: 25,
      bodyCultivationSpeedPct: 25,
      soulCultivationSpeedPct: 15,
      mindCultivationSpeedPct: 15,
    },
    meshTraits: {
      bodyScale: [1.06, 1.06, 1.06],
      hasPointedElfEars: true,
      hasKitsuneFoxEars: false,
      hasRunicBeard: false,
      hasOrcTusks: false,
      hasDragonHorns: true,
      hasAsuraHorns: false,
      hasCelestialWings: false,
      hasDraconicTail: true,
      hasKitsuneTails: false,
      hasVoidOrbitCrystals: false,
      hasGolemChestReactor: false,
      accentColorHex: '#06b6d4',
      recommendedSkinColor: '#ffdbac',
      recommendedEyeColor: '#00e5ff',
      recommendedHairColor: '#00e5ff',
    },
  },
  {
    id: 'celestial_kitsune',
    name: 'Celestial Nine-Tail Kitsune',
    chineseName: '天狐·青丘九尾',
    lineage: 'xianxia_immortal',
    lineageLabel: 'Xianxia Immortal Lineage',
    omniverseRank: 53,
    omniverseTier: 3,
    originCanon: 'East Asian Mythology & Fantasy',
    isCoreStarterSpecies: true,
    requiresAdminPermission: false,
    icon: '🦊',
    loreSummary:
      'Mystic sovereigns of Qingqiu Mountain crowned with spirit-fox ears and radiant nine-tailed illusions that sever enemy divine sense.',
    visualTraitsDescription: 'Top-mounted spirit fox ears, radiant multi-tail fan & violet eyes',
    primaryBuffSummary: '+30% Soul & Mind Cultivation Speed + 22% Shooter Precision',
    passives: {
      shieldbearerDefensePct: 8,
      shooterAttackPct: 22,
      bomberSiegeAttackPct: 14,
      rallyCapacityPct: 12,
      qiCultivationSpeedPct: 22,
      bodyCultivationSpeedPct: 8,
      soulCultivationSpeedPct: 30,
      mindCultivationSpeedPct: 30,
    },
    meshTraits: {
      bodyScale: [0.96, 1.03, 0.96],
      hasPointedElfEars: false,
      hasKitsuneFoxEars: true,
      hasRunicBeard: false,
      hasOrcTusks: false,
      hasDragonHorns: false,
      hasAsuraHorns: false,
      hasCelestialWings: false,
      hasDraconicTail: false,
      hasKitsuneTails: true,
      hasVoidOrbitCrystals: false,
      hasGolemChestReactor: false,
      accentColorHex: '#ec4899',
      recommendedSkinColor: '#ffdbac',
      recommendedEyeColor: '#d500f9',
      recommendedHairColor: '#9e9e9e',
    },
  },
  {
    id: 'asura_demon',
    name: 'Asura Bloodfiend',
    chineseName: '修罗·冥河魔神',
    lineage: 'xianxia_immortal',
    lineageLabel: 'Xianxia Immortal Lineage',
    omniverseRank: 51,
    omniverseTier: 3,
    originCanon: 'Mythology, DOOM, Devil May Cry',
    isCoreStarterSpecies: true,
    requiresAdminPermission: false,
    icon: '😈',
    loreSummary:
      'Born from the Netherworld Sea of Blood with curved obsidian horns and slaughter intent thatdevours heaven-defying tribulations.',
    visualTraitsDescription: 'Curved obsidian Asura horns, pointed ears & crimson-abyssal aura',
    primaryBuffSummary: '+28% Bomber Siege Devastation & +24% Shooter / Body Ferocity',
    passives: {
      shieldbearerDefensePct: 12,
      shooterAttackPct: 24,
      bomberSiegeAttackPct: 28,
      rallyCapacityPct: 15,
      qiCultivationSpeedPct: 20,
      bodyCultivationSpeedPct: 24,
      soulCultivationSpeedPct: 14,
      mindCultivationSpeedPct: 10,
    },
    meshTraits: {
      bodyScale: [1.08, 1.06, 1.06],
      hasPointedElfEars: true,
      hasKitsuneFoxEars: false,
      hasRunicBeard: false,
      hasOrcTusks: false,
      hasDragonHorns: false,
      hasAsuraHorns: true,
      hasCelestialWings: false,
      hasDraconicTail: true,
      hasKitsuneTails: false,
      hasVoidOrbitCrystals: false,
      hasGolemChestReactor: false,
      accentColorHex: '#e11d48',
      recommendedSkinColor: '#c084fc',
      recommendedEyeColor: '#ff1744',
      recommendedHairColor: '#b71c1c',
    },
  },
  {
    id: 'empyrean_angelic',
    name: 'Empyrean Seraph',
    chineseName: '天人·六翼炽圣',
    lineage: 'xianxia_immortal',
    lineageLabel: 'Xianxia Immortal Lineage',
    omniverseRank: 12,
    omniverseTier: 1,
    originCanon: 'Dragon Ball Super & Sacred Mythos',
    isCoreStarterSpecies: true,
    requiresAdminPermission: false,
    icon: '🪽',
    loreSummary:
      'Luminous arbiters of the Nine Heavens whose feathered golden wings project an indestructible Celestial Aegis over allied legions.',
    visualTraitsDescription:
      'Luminous feathered seraphic wings, golden halo resonance & solar eyes',
    primaryBuffSummary: '+25% Rally Capacity, +22% Shieldbearer Defense & +24% Qi/Mind Speed',
    passives: {
      shieldbearerDefensePct: 22,
      shooterAttackPct: 16,
      bomberSiegeAttackPct: 16,
      rallyCapacityPct: 25,
      qiCultivationSpeedPct: 24,
      bodyCultivationSpeedPct: 14,
      soulCultivationSpeedPct: 22,
      mindCultivationSpeedPct: 24,
    },
    meshTraits: {
      bodyScale: [1.02, 1.08, 1.02],
      hasPointedElfEars: false,
      hasKitsuneFoxEars: false,
      hasRunicBeard: false,
      hasOrcTusks: false,
      hasDragonHorns: false,
      hasAsuraHorns: false,
      hasCelestialWings: true,
      hasDraconicTail: false,
      hasKitsuneTails: false,
      hasVoidOrbitCrystals: false,
      hasGolemChestReactor: false,
      accentColorHex: '#fde047',
      recommendedSkinColor: '#ffdbac',
      recommendedEyeColor: '#ffea00',
      recommendedHairColor: '#ffd700',
    },
  },
  {
    id: 'void_walker',
    name: 'Nether Void-Walker',
    chineseName: '虚空·归墟行者',
    lineage: 'cosmic_primordial',
    lineageLabel: 'Cosmic & Primordial Lineage',
    omniverseRank: 22,
    omniverseTier: 2,
    originCanon: 'Xeelee Sequence & Dimensional Void',
    isCoreStarterSpecies: true,
    requiresAdminPermission: false,
    icon: '🌌',
    loreSummary:
      'Trans-dimensional sovereigns from the Chaos Sea encircled by orbiting dark-matter monoliths that warp space-time trajectories.',
    visualTraitsDescription: 'Orbiting amethyst void-shards, astral skin tone & quantum eye glow',
    primaryBuffSummary: '+32% Mind & Qi Comprehension + 24% Bomber / Shooter Dimensional Strike',
    passives: {
      shieldbearerDefensePct: 14,
      shooterAttackPct: 24,
      bomberSiegeAttackPct: 24,
      rallyCapacityPct: 18,
      qiCultivationSpeedPct: 32,
      bodyCultivationSpeedPct: 12,
      soulCultivationSpeedPct: 28,
      mindCultivationSpeedPct: 32,
    },
    meshTraits: {
      bodyScale: [0.98, 1.08, 0.98],
      hasPointedElfEars: true,
      hasKitsuneFoxEars: false,
      hasRunicBeard: false,
      hasOrcTusks: false,
      hasDragonHorns: false,
      hasAsuraHorns: false,
      hasCelestialWings: false,
      hasDraconicTail: false,
      hasKitsuneTails: false,
      hasVoidOrbitCrystals: true,
      hasGolemChestReactor: false,
      accentColorHex: '#a855f7',
      recommendedSkinColor: '#818cf8',
      recommendedEyeColor: '#d500f9',
      recommendedHairColor: '#9e9e9e',
    },
  },
  {
    id: 'crystalline_golem',
    name: 'Astral Crystal-Golem',
    chineseName: '圣灵·星核泰坦',
    lineage: 'cosmic_primordial',
    lineageLabel: 'Cosmic & Primordial Lineage',
    omniverseRank: 80,
    omniverseTier: 4,
    originCanon: 'Steven Universe & Astral Constructs',
    isCoreStarterSpecies: true,
    requiresAdminPermission: false,
    icon: '💎',
    loreSummary:
      'Sentient star-core colossi forged in supernova heart-furnaces; their chest houses a glowing prism reactor of indestructible law.',
    visualTraitsDescription:
      'Colossal titan stature, glowing chest star-reactor & floating crystal crown',
    primaryBuffSummary: '+35% Shieldbearer Defense & +35% Body Tempering Indestructibility',
    passives: {
      shieldbearerDefensePct: 35,
      shooterAttackPct: 10,
      bomberSiegeAttackPct: 25,
      rallyCapacityPct: 20,
      qiCultivationSpeedPct: 16,
      bodyCultivationSpeedPct: 35,
      soulCultivationSpeedPct: 14,
      mindCultivationSpeedPct: 18,
    },
    meshTraits: {
      bodyScale: [1.22, 1.14, 1.22],
      hasPointedElfEars: false,
      hasKitsuneFoxEars: false,
      hasRunicBeard: false,
      hasOrcTusks: false,
      hasDragonHorns: false,
      hasAsuraHorns: false,
      hasCelestialWings: false,
      hasDraconicTail: false,
      hasKitsuneTails: false,
      hasVoidOrbitCrystals: true,
      hasGolemChestReactor: true,
      accentColorHex: '#22d3ee',
      recommendedSkinColor: '#38bdf8',
      recommendedEyeColor: '#00e5ff',
      recommendedHairColor: '#00e5ff',
    },
  },
];

const CORE_MAPPED_RANKS = new Set<number>(
  CORE_10_SPECIES_CATALOG.map((spec) => spec.omniverseRank)
);

const TIER_CHINESE_PREFIX: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '太初至高·',
  2: '星宇神明·',
  3: '万古仙魔·',
  4: '霸体圣裔·',
  5: '星海万族·',
};

const TIER_ACCENT_PALETTE: Record<
  1 | 2 | 3 | 4 | 5,
  { accent: string; skin: string; eye: string; hair: string }
> = {
  1: { accent: '#c084fc', skin: '#e2e8f0', eye: '#d500f9', hair: '#facc15' },
  2: { accent: '#38bdf8', skin: '#60a5fa', eye: '#00e5ff', hair: '#e2e8f0' },
  3: { accent: '#fbbf24', skin: '#ffdbac', eye: '#ffea00', hair: '#e65100' },
  4: { accent: '#f43f5e', skin: '#f1c27d', eye: '#ff1744', hair: '#1a1a1a' },
  5: { accent: '#34d399', skin: '#e0ac69', eye: '#00e676', hair: '#4e342e' },
};

function buildOmniversePlayableSpeciesSpec(
  entry: (typeof TOP_100_OMNIVERSE_SPECIES_NPCS)[number]
): CharacterSpeciesSpec {
  const rank = entry.rank;
  const tier = entry.tier;
  const lineage: SpeciesLineageCategory =
    tier <= 2 ? 'cosmic_primordial' : tier <= 4 ? 'xianxia_immortal' : 'fantasy_kingdom';
  const lineageLabel =
    lineage === 'cosmic_primordial'
      ? `Omniverse Tier ${tier} · Cosmic & Primordial Lineage`
      : lineage === 'xianxia_immortal'
        ? `Omniverse Tier ${tier} · Xianxia & Mythic Lineage`
        : `Omniverse Tier ${tier} · Galactic & Fantasy Lineage`;

  const tierBonus = (6 - tier) * 6; // +30 for Tier 1 down to +6 for Tier 5
  const rankBonus = Math.max(2, Math.round((101 - rank) * 0.25));

  const shieldbearerDefensePct = 14 + tierBonus + (rank % 9);
  const shooterAttackPct = 16 + tierBonus + ((rank * 3) % 11);
  const bomberSiegeAttackPct = 15 + tierBonus + ((rank * 5) % 10);
  const rallyCapacityPct = 12 + tierBonus + (rank % 7);
  const qiCultivationSpeedPct = 18 + tierBonus + rankBonus;
  const bodyCultivationSpeedPct = 16 + tierBonus + ((rank * 2) % 9);
  const soulCultivationSpeedPct = 18 + tierBonus + ((rank * 4) % 10);
  const mindCultivationSpeedPct = 20 + tierBonus + rankBonus;

  const palette = TIER_ACCENT_PALETTE[tier];
  const scaleXZ = Number((0.94 + ((rank * 5) % 24) * 0.01).toFixed(2));
  const scaleY = Number((0.95 + ((rank * 7) % 24) * 0.01).toFixed(2));

  const hasPointedElfEars = rank % 3 === 0;
  const hasKitsuneFoxEars = rank % 11 === 0;
  const hasRunicBeard = rank % 9 === 0;
  const hasOrcTusks = rank % 8 === 0;
  const hasDragonHorns = tier === 1 || rank % 5 === 0;
  const hasAsuraHorns = tier === 3 || rank % 7 === 0;
  const hasCelestialWings = tier <= 2 || rank % 4 === 0;
  const hasDraconicTail = rank % 6 === 0;
  const hasKitsuneTails = rank % 13 === 0;
  const hasVoidOrbitCrystals = tier <= 2 || rank % 3 === 1;
  const hasGolemChestReactor = tier === 2 || rank % 5 === 2;

  const traitList: string[] = [];
  if (hasCelestialWings) traitList.push('seraphic energy wings');
  if (hasVoidOrbitCrystals) traitList.push('orbiting void crystals');
  if (hasGolemChestReactor) traitList.push('star-core chest reactor');
  if (hasDragonHorns) traitList.push('sovereign dragon horns');
  else if (hasAsuraHorns) traitList.push('obsidian war-horns');
  if (hasDraconicTail) traitList.push('sweeping draconic tail');
  if (hasKitsuneTails) traitList.push('spirit-tail array');
  if (traitList.length === 0) traitList.push('sovereign astral aura & runic armor trim');

  return {
    id: entry.id as CharacterSpeciesId,
    name: `${entry.speciesName} (Rank #${rank})`,
    chineseName: `${TIER_CHINESE_PREFIX[tier]}第${rank}序列`,
    lineage,
    lineageLabel,
    omniverseRank: rank,
    omniverseTier: tier,
    originCanon: entry.originCanon,
    isCoreStarterSpecies: false,
    requiresAdminPermission: true,
    icon: entry.icon,
    loreSummary: entry.loreSummary,
    visualTraitsDescription: `${entry.originCanon} · ${traitList.slice(0, 3).join(', ')}`,
    primaryBuffSummary: `+${shooterAttackPct}% Shooter/Siege · +${qiCultivationSpeedPct}% Qi/Mind Speed (${entry.originCanon})`,
    passives: {
      shieldbearerDefensePct,
      shooterAttackPct,
      bomberSiegeAttackPct,
      rallyCapacityPct,
      qiCultivationSpeedPct,
      bodyCultivationSpeedPct,
      soulCultivationSpeedPct,
      mindCultivationSpeedPct,
    },
    meshTraits: {
      bodyScale: [scaleXZ, scaleY, scaleXZ],
      hasPointedElfEars,
      hasKitsuneFoxEars,
      hasRunicBeard,
      hasOrcTusks,
      hasDragonHorns,
      hasAsuraHorns,
      hasCelestialWings,
      hasDraconicTail,
      hasKitsuneTails,
      hasVoidOrbitCrystals,
      hasGolemChestReactor,
      accentColorHex: palette.accent,
      recommendedSkinColor: palette.skin,
      recommendedEyeColor: palette.eye,
      recommendedHairColor: palette.hair,
    },
  };
}

/**
 * The 90 Sovereign Omniverse Races (Ranks #1–#100 excluding the 10 mapped Core Solara Bloodlines).
 * Unlocked automatically for Root Creator (creatergame31@gmail.com) and any player granted Admin permission.
 */
export const OMNIVERSE_90_SPECIES_CATALOG: CharacterSpeciesSpec[] =
  TOP_100_OMNIVERSE_SPECIES_NPCS.filter((entry) => !CORE_MAPPED_RANKS.has(entry.rank)).map(
    buildOmniversePlayableSpeciesSpec
  );

/**
 * Complete 100 Playable Species / Races Catalog:
 * - First 10 entries: The 10 Canonical Solara Starter Bloodlines (preserving exact IDs 'human' .. 'crystalline_golem')
 * - Next 90 entries: The 90 Sovereign Omniverse Races from Ranks #1–#100
 * Total = 100 unique playable races covering all 100 Omniverse Ranks (#1–#100).
 */
export const CHARACTER_SPECIES_CATALOG: CharacterSpeciesSpec[] = [
  ...CORE_10_SPECIES_CATALOG,
  ...OMNIVERSE_90_SPECIES_CATALOG,
];

const SPECIES_MAP = new Map<string, CharacterSpeciesSpec>();
for (const spec of CHARACTER_SPECIES_CATALOG) {
  SPECIES_MAP.set(spec.id, spec);
  const paddedRankId = `omniverse_species_${String(spec.omniverseRank).padStart(3, '0')}`;
  if (!SPECIES_MAP.has(paddedRankId)) {
    SPECIES_MAP.set(paddedRankId, spec);
  }
}

export function getSpeciesSpec(speciesId?: CharacterSpeciesId): CharacterSpeciesSpec {
  if (!speciesId) {
    return CHARACTER_SPECIES_CATALOG[0];
  }
  return SPECIES_MAP.get(speciesId) || CHARACTER_SPECIES_CATALOG[0];
}

export interface SpeciesSwitchPermissionEvaluation {
  allowed: boolean;
  requiresAdminApproval: boolean;
  authorizedByEmail: string | null;
  reason: string;
}

/**
 * Evaluates whether a player can select or switch to `targetSpeciesId`.
 * - Root Creator (`creatergame31@gmail.com`) can freely select and switch among all 100 races at any time.
 * - Other players with Admin (`creatergame31@gmail.com`) permission (`adminSpeciesSwitchApproved === true`)
 *   can also select and switch among all 100 races at any time.
 * - Without Admin (`creatergame31@gmail.com`) permission, non-admin players may select from the 10 Core
 *   Solara Starter Races during initial creation (`!speciesLocked`), while switching after lock or selecting
 *   the 90 Sovereign Omniverse Races requires Admin (`creatergame31@gmail.com`) permission.
 */
export function evaluateSpeciesSwitchPermission(params: {
  currentAppearance?: Pick<
    CharacterAppearance,
    'species' | 'speciesLocked' | 'adminSpeciesSwitchApproved'
  >;
  targetSpeciesId: CharacterSpeciesId;
  activeAccountEmail?: string | null;
}): SpeciesSwitchPermissionEvaluation {
  const { currentAppearance, targetSpeciesId, activeAccountEmail } = params;
  const currentSpecies = currentAppearance?.species || 'human';
  const isLocked = Boolean(currentAppearance?.speciesLocked);
  const adminApproved = Boolean(currentAppearance?.adminSpeciesSwitchApproved);
  const isRootAdmin = isPrimaryAdminAccount(activeAccountEmail ?? '');
  const targetSpec = getSpeciesSpec(targetSpeciesId);

  // 1. Root Creator (creatergame31@gmail.com) has unrestricted access to all 100 playable races
  if (isRootAdmin) {
    return {
      allowed: true,
      requiresAdminApproval: false,
      authorizedByEmail: PRIMARY_ADMIN_EMAIL,
      reason: `Authorized by Root Creator Admin (${PRIMARY_ADMIN_EMAIL}) — unrestricted access to all 100 playable races.`,
    };
  }

  // 2. Keeping current species selection is always allowed
  if (currentSpecies === targetSpeciesId || currentSpecies === targetSpec.id) {
    return {
      allowed: true,
      requiresAdminApproval: false,
      authorizedByEmail: adminApproved ? PRIMARY_ADMIN_EMAIL : null,
      reason: 'Keeping current species selection.',
    };
  }

  // 3. Explicit Admin (creatergame31@gmail.com) permission unlocks all 100 races & species switching
  if (adminApproved) {
    return {
      allowed: true,
      requiresAdminApproval: true,
      authorizedByEmail: PRIMARY_ADMIN_EMAIL,
      reason: `Species selection & rebirth approved by Admin Decree (${PRIMARY_ADMIN_EMAIL}) across all 100 races.`,
    };
  }

  // 4. Initial character creation (!isLocked) allows the 10 Core Solara Starter Races without Admin approval,
  //    while the 90 Sovereign Omniverse Races require Admin (creatergame31@gmail.com) permission.
  if (!isLocked) {
    if (!targetSpec.requiresAdminPermission) {
      return {
        allowed: true,
        requiresAdminApproval: false,
        authorizedByEmail: null,
        reason: 'Initial character species selection is unlocked for Core Solara lineages.',
      };
    }
    return {
      allowed: false,
      requiresAdminApproval: true,
      authorizedByEmail: null,
      reason: `Omniverse Sovereign Race ${targetSpec.name} requires Admin (${PRIMARY_ADMIN_EMAIL}) permission.`,
    };
  }

  // 5. Locked species requires Admin (creatergame31@gmail.com) permission to switch
  return {
    allowed: false,
    requiresAdminApproval: true,
    authorizedByEmail: null,
    reason: `Species is locked to ${getSpeciesSpec(currentSpecies).name}. Switching species requires permission from Admin (${PRIMARY_ADMIN_EMAIL}).`,
  };
}

export type CoreSpeciesIdAlias = CoreCharacterSpeciesId;
