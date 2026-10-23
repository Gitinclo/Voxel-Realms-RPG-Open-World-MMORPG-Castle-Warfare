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

export type KarmaAlignment = 'green_innocent' | 'white_neutral' | 'gold_justice' | 'red_fiend';

export interface BountyRecord {
  targetName: string;
  realmName: string;
  karmaValue: number;
  x: number;
  z: number;
  rewardSpiritStones: bigint;
  rewardDiamonds: bigint;
  isRevealedToJustice: boolean;
}

export interface PlayerKarmaState {
  karmaValue: number; // >= 0 is Green/White/Gold, < 0 is Red Name (Fiend)
  alignment: KarmaAlignment;
  unlawfulKills: number;
  righteousKills: number;
  stationarySeconds: number; // Red-name players struck by instant-kill Tribulation Lightning if stationary >= 8s
  maxStationaryThresholdSec: number;
  bountySpiritStones: bigint;
  isLocationRevealed: boolean;
  lastLightningStrikeMsg: string | null;
  droppedLootHistory: string[];
}

export interface Disciple {
  id: string;
  name: string;
  chineseName: string;
  realmIndex: number;
  layer: number;
  loyalty: number; // 0 to 100
  distanceMeters: number; // Distance from Master; <= 50m grants proximity cultivation speed buff
  baseSpiritStonesPerSec: bigint;
  baseQiPerSec: bigint;
  equippedSkills: string[];
  avatarIcon: string;
}

export interface MysticalPowerSkill {
  id: string;
  name: string;
  chineseName: string;
  tier: CultivationEra;
  requiredRealmIndex: number;
  description: string;
  combatMultiplierBonus: number;
  transcriptionCostQi: bigint;
  transcriptionCostDiamonds: bigint;
  marketValueSpiritStones: bigint;
  icon: string;
}

export interface SkillScrollItem {
  scrollId: string;
  skillId: string;
  skillName: string;
  chineseName: string;
  creatorMasterName: string;
  combatMultiplierBonus: number;
  marketValueSpiritStones: bigint;
  createdAt: number;
}

export type AuraVisualCueType =
  | 'none'
  | 'faint_white_glow'
  | 'spinning_golden_core'
  | 'floating_nascent_baby'
  | 'divine_halos';

export interface CultivationAuraVisualSpec {
  cueType: AuraVisualCueType;
  label: string;
  chineseLabel: string;
  description: string;
  primaryColorHex: string;
  secondaryColorHex: string;
  hdrPeakLuminanceNits: number; // HDR10+ nits (100 to 4000 nits)
  haloCount: number; // For Dao Creator: number of Great Dao rules mastered
  hasTranslucentChestCore: boolean;
  hasFloatingBabyAvatar: boolean;
  suppressOverheadLevelTag: boolean;
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
  // New Systems: Karma, Master & Disciple Social Hierarchy, and Great Dao Aura Cues
  karma?: PlayerKarmaState;
  disciples?: Disciple[];
  masterTaxRatePct?: number; // % of disciple loot/spirit stones funneled to Master (e.g., 20%)
  learnedMysticalSkills?: string[];
  skillScrollInventory?: SkillScrollItem[];
  spiritStones?: bigint;
  masteredGreatDaos?: number; // Number of Great Dao rules mastered (determines Dao Creator Halo count)
  auraOverrideRealmIndex?: number | null; // Optional preview override for 3D & HDR10+ visualizer
  veteranScrolls?: number; // Special 'Veteran Scroll' inventory for cultivation
  veteranScrollsComprehended?: number; // Total Veteran Scrolls activated for permanent cultivation bonuses
}


