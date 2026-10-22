/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CultivationEra = 'mortal' | 'immortal_sage' | 'chaos_dao' | 'ultimate_origin';

export type CultivationPath = 'qi' | 'body' | 'soul' | 'mind';

export interface CultivationPathMeta {
  id: CultivationPath;
  name: string;
  chineseName: string;
  energyName: string;
  vesselName: string;
  actionVerb: string;
  icon: string;
  specialtySummary: string;
  combatBonusDesc: string;
  accentColor: string;
}

export interface CultivationRealmDef {
  id: string;
  path?: CultivationPath;
  name: string;
  chineseName: string;
  era: CultivationEra;
  index: number; // 0 to 22
  totalLayers: 9;
  description: string;
  lore: string;
  basePowerMultiplier: number;
  baseQiPerLayer: bigint;
  tribulationRounds: number; // 0 for minor, 3 to 9 for major breakthrough
  icon: string;
}

export interface CultivationPill {
  id: string;
  name: string;
  targetPath: CultivationPath | 'all';
  tier: CultivationEra;
  requiredRealmIndex: number;
  successRateBoostPct: number;
  qiBonus: bigint;
  costHerbWood: bigint;
  costHerbGrain: bigint;
  costDiamonds: bigint;
  description: string;
  icon: string;
}

export interface CultivationManual {
  id: string;
  name: string;
  chineseName: string;
  path: CultivationPath;
  tier: CultivationEra;
  icon: string;
  description: string;
  lore: string;
  basePassiveRateBoostPct: number;
  passiveBoostPerLevelPct: number;
  baseBreakthroughBoostPct: number;
  breakthroughBoostPerLevelPct: number;
  maxLevel: number;
  baseUpgradeCostFragments: number;
  baseUpgradeCostDiamonds: bigint;
}

export interface OwnedManualState {
  manualId: string;
  level: number; // 1 to maxLevel
}

export interface CultivationPathProgress {
  realmIndex: number; // 0 to 22
  layer: number; // 1 to 9
  currentEnergy: bigint;
}

export interface PlayerCultivationState {
  // Primary Qi path fields kept in sync for backward compatibility
  currentRealmIndex: number; // 0 to 22
  currentLayer: number; // 1 to 9
  currentQi: bigint;
  passiveQiPerSec: bigint;
  // All 4 cultivation paths: Qi, Body, Soul, Mind
  paths: Record<CultivationPath, CultivationPathProgress>;
  // Cultivation Manuals Inventory & Equipped Slots
  ownedManuals: Record<string, OwnedManualState>;
  equippedManuals: Record<CultivationPath, string | null>;
  scriptureFragments: number;
  secludedYears: number; // Han Jue secluded cultivation duration in realm years
  tribulationUnderway: boolean;
  tribulationStrikesLeft: number;
  tribulationDamageRating: bigint;
  inventoryPills: Record<string, number>;
  selectedRoot: 'lightning' | 'void' | 'fire' | 'water' | 'earth' | 'chaos';
  rootPurityPct: number;
}
