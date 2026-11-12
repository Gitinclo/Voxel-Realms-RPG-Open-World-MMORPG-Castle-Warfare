/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterAppearance, CharacterSpeciesId } from '../types/game';
import { PRIMARY_ADMIN_EMAIL, verifyAccountPrivileges } from './adminModeration';

export type SpeciesLineageCategory = 'fantasy_kingdom' | 'xianxia_immortal' | 'cosmic_primordial';

export interface SpeciesPassiveBonuses {
  castleUpgradeSpeedPct: number;
  shieldbearerDefensePct: number;
  shooterAttackPct: number;
  bomberSiegeAttackPct: number;
  rallyCapacityPct: number;
  gatherSpeedPct: number;
  marchSpeedPct: number;
  qiCultivationSpeedPct: number;
  bodyCultivationSpeedPct: number;
  soulCultivationSpeedPct: number;
  mindCultivationSpeedPct: number;
  tribulationResistancePct: number;
}

export interface SpeciesVisualMeshTraits {
  bodyScale: [number, number, number]; // [scaleX, scaleY, scaleZ]
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
  accentColorHex: number;
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
  icon: string;
  loreSummary: string;
  visualTraitsDescription: string;
  primaryBuffSummary: string;
  passives: SpeciesPassiveBonuses;
  meshTraits: SpeciesVisualMeshTraits;
}

export interface SpeciesSwitchAuthorizationResult {
  allowed: boolean;
  requiresAdminApproval: boolean;
  authorizedByEmail: string | null;
  reason: string;
}

export const CHARACTER_SPECIES_CATALOG: CharacterSpeciesSpec[] = [
  {
    id: 'human',
    name: 'Terran Sovereign (Human)',
    chineseName: '人族皇裔',
    lineage: 'fantasy_kingdom',
    lineageLabel: 'Mortal & Kingdom Fantasy',
    icon: '👑',
    loreSummary:
      'Versatile realm builders and master strategists of Solara Citadel with balanced affinity across all four cultivation paths.',
    visualTraitsDescription: 'Balanced heroic stature + Imperial Sovereign Diadem',
    primaryBuffSummary: '+10% Castle Upgrade Speed · +10% Mind Path Enlightenment',
    passives: {
      castleUpgradeSpeedPct: 10,
      shieldbearerDefensePct: 5,
      shooterAttackPct: 5,
      bomberSiegeAttackPct: 5,
      rallyCapacityPct: 5,
      gatherSpeedPct: 8,
      marchSpeedPct: 5,
      qiCultivationSpeedPct: 8,
      bodyCultivationSpeedPct: 8,
      soulCultivationSpeedPct: 8,
      mindCultivationSpeedPct: 10,
      tribulationResistancePct: 5,
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
      accentColorHex: 0xffd700,
      recommendedSkinColor: '#f1c27d',
      recommendedEyeColor: '#00e5ff',
      recommendedHairColor: '#e65100',
    },
  },
  {
    id: 'sylvan_elf',
    name: 'Sylvan High Elf (Spirit Elf)',
    chineseName: '森罗灵族',
    lineage: 'fantasy_kingdom',
    lineageLabel: 'Mortal & Kingdom Fantasy',
    icon: '🏹',
    loreSummary:
      'Ancient forest immortals attuned to nature leylines, wind precision archery, and pure Qi condensation.',
    visualTraitsDescription: 'Elongated Pointed Elven Ears · Slender Agile Stature (1.05x Height)',
    primaryBuffSummary: '+15% Shooter Attack · +12% Qi Path Spiritual Gathering',
    passives: {
      castleUpgradeSpeedPct: 4,
      shieldbearerDefensePct: 0,
      shooterAttackPct: 15,
      bomberSiegeAttackPct: 4,
      rallyCapacityPct: 5,
      gatherSpeedPct: 12,
      marchSpeedPct: 12,
      qiCultivationSpeedPct: 12,
      bodyCultivationSpeedPct: 4,
      soulCultivationSpeedPct: 10,
      mindCultivationSpeedPct: 8,
      tribulationResistancePct: 6,
    },
    meshTraits: {
      bodyScale: [0.93, 1.05, 0.93],
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
      accentColorHex: 0x34d399,
      recommendedSkinColor: '#ffdbac',
      recommendedEyeColor: '#10b981',
      recommendedHairColor: '#ffd700',
    },
  },
  {
    id: 'ironforge_dwarf',
    name: 'Ironforge Runic Dwarf',
    chineseName: '矮人神匠',
    lineage: 'fantasy_kingdom',
    lineageLabel: 'Mortal & Kingdom Fantasy',
    icon: '⚒️',
    loreSummary:
      'Master subterranean runic smiths and unbreakable siege artillery engineers who turn mountains into fortresses.',
    visualTraitsDescription: 'Stocky Broad Frame (0.86x Height, 1.18x Width) · Braided Runic Beard',
    primaryBuffSummary: '+15% Bomber & Siege Damage · +15% Steel & Diamond Yield',
    passives: {
      castleUpgradeSpeedPct: 12,
      shieldbearerDefensePct: 10,
      shooterAttackPct: 0,
      bomberSiegeAttackPct: 15,
      rallyCapacityPct: 5,
      gatherSpeedPct: 15,
      marchSpeedPct: 0,
      qiCultivationSpeedPct: 5,
      bodyCultivationSpeedPct: 12,
      soulCultivationSpeedPct: 5,
      mindCultivationSpeedPct: 8,
      tribulationResistancePct: 10,
    },
    meshTraits: {
      bodyScale: [1.18, 0.86, 1.16],
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
      accentColorHex: 0xf59e0b,
      recommendedSkinColor: '#e0ac69',
      recommendedEyeColor: '#fbbf24',
      recommendedHairColor: '#b71c1c',
    },
  },
  {
    id: 'warborn_orc',
    name: 'Warborn Goliath (Titanblood Orc)',
    chineseName: '蛮荒巨灵',
    lineage: 'fantasy_kingdom',
    lineageLabel: 'Mortal & Kingdom Fantasy',
    icon: '🪓',
    loreSummary:
      'Colossal frontline juggernauts forged in the Scorched Crags whose physical body cultivation shatters enemy shield walls.',
    visualTraitsDescription: 'Towering 1.15x Muscular Stature · Lower Ivory War Tusks',
    primaryBuffSummary: '+15% Shieldbearer Defense & HP · +15% Body Path Constitution',
    passives: {
      castleUpgradeSpeedPct: 0,
      shieldbearerDefensePct: 15,
      shooterAttackPct: 5,
      bomberSiegeAttackPct: 10,
      rallyCapacityPct: 10,
      gatherSpeedPct: 5,
      marchSpeedPct: 6,
      qiCultivationSpeedPct: 4,
      bodyCultivationSpeedPct: 15,
      soulCultivationSpeedPct: 4,
      mindCultivationSpeedPct: 4,
      tribulationResistancePct: 12,
    },
    meshTraits: {
      bodyScale: [1.16, 1.14, 1.15],
      hasPointedElfEars: false,
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
      accentColorHex: 0xef4444,
      recommendedSkinColor: '#65a30d',
      recommendedEyeColor: '#ef4444',
      recommendedHairColor: '#1a1a1a',
    },
  },
  {
    id: 'azure_dragonkin',
    name: 'Azure Dragonkin (Draconic Sovereign)',
    chineseName: '太古龙族',
    lineage: 'xianxia_immortal',
    lineageLabel: 'Immortal Xianxia Bloodline',
    icon: '🐉',
    loreSummary:
      'Direct descendants of the Primordial Ancestral Dragons commanding celestial thunder, sovereign rallies, and draconic prestige.',
    visualTraitsDescription: 'Curved Crystalline Dragon Horns · Articulated Draconic Tail',
    primaryBuffSummary: '+20% Max Rally Capacity · +15% Tribulation Lightning Resistance',
    passives: {
      castleUpgradeSpeedPct: 8,
      shieldbearerDefensePct: 10,
      shooterAttackPct: 10,
      bomberSiegeAttackPct: 10,
      rallyCapacityPct: 20,
      gatherSpeedPct: 6,
      marchSpeedPct: 10,
      qiCultivationSpeedPct: 12,
      bodyCultivationSpeedPct: 12,
      soulCultivationSpeedPct: 10,
      mindCultivationSpeedPct: 10,
      tribulationResistancePct: 15,
    },
    meshTraits: {
      bodyScale: [1.06, 1.07, 1.05],
      hasPointedElfEars: false,
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
      accentColorHex: 0x06b6d4,
      recommendedSkinColor: '#ffdbac',
      recommendedEyeColor: '#00e5ff',
      recommendedHairColor: '#00e5ff',
    },
  },
  {
    id: 'celestial_kitsune',
    name: 'Celestial Nine-Tailed Kitsune',
    chineseName: '九尾天狐',
    lineage: 'xianxia_immortal',
    lineageLabel: 'Immortal Xianxia Bloodline',
    icon: '🦊',
    loreSummary:
      'Immortal fox spirits of Qingqiu blessed with peerless divine soul perception, illusion formations, and fortune.',
    visualTraitsDescription: 'Upright Fox Spirit Ears · Multi-Strand Luminous Spirit Tails',
    primaryBuffSummary: '+20% Soul Path Divine Sense · +12% Resource & Scripture Luck',
    passives: {
      castleUpgradeSpeedPct: 6,
      shieldbearerDefensePct: 4,
      shooterAttackPct: 12,
      bomberSiegeAttackPct: 6,
      rallyCapacityPct: 8,
      gatherSpeedPct: 12,
      marchSpeedPct: 14,
      qiCultivationSpeedPct: 12,
      bodyCultivationSpeedPct: 5,
      soulCultivationSpeedPct: 20,
      mindCultivationSpeedPct: 14,
      tribulationResistancePct: 8,
    },
    meshTraits: {
      bodyScale: [0.95, 1.03, 0.95],
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
      accentColorHex: 0xec4899,
      recommendedSkinColor: '#ffdbac',
      recommendedEyeColor: '#f472b6',
      recommendedHairColor: '#e2e8f0',
    },
  },
  {
    id: 'asura_demon',
    name: 'Asura Blood Fiend (Infernal Mo)',
    chineseName: '修罗魔族',
    lineage: 'xianxia_immortal',
    lineageLabel: 'Immortal Xianxia Bloodline',
    icon: '😈',
    loreSummary:
      'Ruthless battle immortals born from the Primordial Blood Sea who thrive in siege slaughter and overwhelm foes with demonic might.',
    visualTraitsDescription: 'Swept Obsidian Demon Horns · Crimson Sclera · Infernal Tail',
    primaryBuffSummary: '+18% All-Troop & Boss Attack · +15% Body & Soul Cultivation',
    passives: {
      castleUpgradeSpeedPct: 4,
      shieldbearerDefensePct: 8,
      shooterAttackPct: 18,
      bomberSiegeAttackPct: 18,
      rallyCapacityPct: 12,
      gatherSpeedPct: 5,
      marchSpeedPct: 10,
      qiCultivationSpeedPct: 10,
      bodyCultivationSpeedPct: 15,
      soulCultivationSpeedPct: 15,
      mindCultivationSpeedPct: 5,
      tribulationResistancePct: 10,
    },
    meshTraits: {
      bodyScale: [1.08, 1.06, 1.06],
      hasPointedElfEars: false,
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
      accentColorHex: 0xe11d48,
      recommendedSkinColor: '#c68642',
      recommendedEyeColor: '#ff1744',
      recommendedHairColor: '#1a1a1a',
    },
  },
  {
    id: 'empyrean_angelic',
    name: 'Empyrean Winged Celestial',
    chineseName: '九天羽族',
    lineage: 'xianxia_immortal',
    lineageLabel: 'Immortal Xianxia Bloodline',
    icon: '🪽',
    loreSummary:
      'Radiant envoys of the Upper Nine Heavens bearing luminous golden wings that shield allied garrisons and accelerate sect disciples.',
    visualTraitsDescription: 'Dual Feathered Golden-White Wings · Celestial Brow Halo',
    primaryBuffSummary: '+15% Citadel Garrison Defense · +15% Qi & Mind Path Speed',
    passives: {
      castleUpgradeSpeedPct: 10,
      shieldbearerDefensePct: 15,
      shooterAttackPct: 10,
      bomberSiegeAttackPct: 6,
      rallyCapacityPct: 12,
      gatherSpeedPct: 10,
      marchSpeedPct: 15,
      qiCultivationSpeedPct: 15,
      bodyCultivationSpeedPct: 8,
      soulCultivationSpeedPct: 12,
      mindCultivationSpeedPct: 15,
      tribulationResistancePct: 14,
    },
    meshTraits: {
      bodyScale: [0.98, 1.06, 0.98],
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
      accentColorHex: 0xfbbf24,
      recommendedSkinColor: '#ffdbac',
      recommendedEyeColor: '#fbbf24',
      recommendedHairColor: '#ffd700',
    },
  },
  {
    id: 'void_walker',
    name: 'Void Walker (Astral Ethereal)',
    chineseName: '虚空神族',
    lineage: 'cosmic_primordial',
    lineageLabel: 'Primordial Cosmic Species',
    icon: '🌌',
    loreSummary:
      'Sovereign beings condensed from dimensional rifts who bend space to traverse territory sectors at lightning speed.',
    visualTraitsDescription: 'Orbiting Astral Void Crystals · Starlight Indigo Aura',
    primaryBuffSummary: '+25% Territory March Speed · +16% Soul & Mind Comprehension',
    passives: {
      castleUpgradeSpeedPct: 8,
      shieldbearerDefensePct: 6,
      shooterAttackPct: 14,
      bomberSiegeAttackPct: 12,
      rallyCapacityPct: 14,
      gatherSpeedPct: 10,
      marchSpeedPct: 25,
      qiCultivationSpeedPct: 14,
      bodyCultivationSpeedPct: 6,
      soulCultivationSpeedPct: 16,
      mindCultivationSpeedPct: 16,
      tribulationResistancePct: 12,
    },
    meshTraits: {
      bodyScale: [0.96, 1.08, 0.96],
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
      accentColorHex: 0x8b5cf6,
      recommendedSkinColor: '#818cf8',
      recommendedEyeColor: '#c084fc',
      recommendedHairColor: '#e2e8f0',
    },
  },
  {
    id: 'crystalline_golem',
    name: 'Crystalline Ancient Automaton',
    chineseName: '古神机关族',
    lineage: 'cosmic_primordial',
    lineageLabel: 'Primordial Cosmic Species',
    icon: '💎',
    loreSummary:
      'Living jadestone and obsidian constructs forged by primordial Dao Creators with an indestructible runic core reactor.',
    visualTraitsDescription: '1.14x Broad Faceted Construct Frame · Glowing Chest Core Reactor',
    primaryBuffSummary: '+25% Fortification & Shield Defense · +20% Body Path & Tribulation Ward',
    passives: {
      castleUpgradeSpeedPct: 14,
      shieldbearerDefensePct: 25,
      shooterAttackPct: 4,
      bomberSiegeAttackPct: 14,
      rallyCapacityPct: 10,
      gatherSpeedPct: 14,
      marchSpeedPct: 0,
      qiCultivationSpeedPct: 8,
      bodyCultivationSpeedPct: 20,
      soulCultivationSpeedPct: 6,
      mindCultivationSpeedPct: 12,
      tribulationResistancePct: 20,
    },
    meshTraits: {
      bodyScale: [1.16, 1.12, 1.16],
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
      hasGolemChestReactor: true,
      accentColorHex: 0x22d3ee,
      recommendedSkinColor: '#38bdf8',
      recommendedEyeColor: '#22d3ee',
      recommendedHairColor: '#00e5ff',
    },
  },
];

const SPECIES_MAP = new Map<CharacterSpeciesId, CharacterSpeciesSpec>(
  CHARACTER_SPECIES_CATALOG.map((spec) => [spec.id, spec])
);

export function getSpeciesSpec(speciesId?: CharacterSpeciesId): CharacterSpeciesSpec {
  if (!speciesId) {
    return CHARACTER_SPECIES_CATALOG[0];
  }
  return SPECIES_MAP.get(speciesId) || CHARACTER_SPECIES_CATALOG[0];
}

/**
 * Evaluates whether a player is allowed to switch from `currentAppearance.species`
 * to `targetSpeciesId`.
 *
 * Rules:
 * 1. If the species is not changing (`currentSpecies === targetSpeciesId`), always allowed.
 * 2. If `currentAppearance.speciesLocked` is false (initial character creation), the player may choose freely once.
 * 3. Once `speciesLocked` is true, switching species requires **Admin Permission**:
 *    - Either `currentAppearance.adminSpeciesSwitchApproved === true` (granted by Admin in GM/Admin Console), OR
 *    - The active session account has Admin/GM privileges (e.g., `creatergame31@gmail.com`).
 */
export function evaluateSpeciesSwitchPermission(params: {
  currentAppearance: CharacterAppearance;
  targetSpeciesId: CharacterSpeciesId;
  activeAccountEmail?: string;
}): SpeciesSwitchAuthorizationResult {
  const currentSpecies = params.currentAppearance.species || 'human';
  if (currentSpecies === params.targetSpeciesId) {
    return {
      allowed: true,
      requiresAdminApproval: false,
      authorizedByEmail: null,
      reason: 'Current species retained.',
    };
  }

  // Initial creation (not yet locked)
  if (!params.currentAppearance.speciesLocked) {
    return {
      allowed: true,
      requiresAdminApproval: false,
      authorizedByEmail: null,
      reason: 'Initial character creation species selection (locks upon saving).',
    };
  }

  // Check if Admin explicitly granted a Species Switch Decree on the character state
  if (params.currentAppearance.adminSpeciesSwitchApproved) {
    return {
      allowed: true,
      requiresAdminApproval: true,
      authorizedByEmail: PRIMARY_ADMIN_EMAIL,
      reason: `Species rebirth authorized by Admin Decree (${PRIMARY_ADMIN_EMAIL}).`,
    };
  }

  // Check if active account itself holds Admin / GM clearance (e.g., creatergame31@gmail.com)
  if (params.activeAccountEmail) {
    const privs = verifyAccountPrivileges(params.activeAccountEmail);
    if (privs.permissions.canManageRoles || privs.permissions.canUseGodmodeAndCheats) {
      return {
        allowed: true,
        requiresAdminApproval: true,
        authorizedByEmail: privs.email,
        reason: `Direct Admin/GM override active for ${privs.email} (Clearance Lv.${privs.clearanceLevel}).`,
      };
    }
  }

  return {
    allowed: false,
    requiresAdminApproval: true,
    authorizedByEmail: null,
    reason: `Species is locked to ${getSpeciesSpec(currentSpecies).name}. Switching species requires permission from Admin (${PRIMARY_ADMIN_EMAIL}).`,
  };
}
