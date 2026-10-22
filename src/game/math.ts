/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TroopTierInfo, TroopType, ResourceType } from '../types/game';
import {
  WeatherType,
  calculateWeatherTroopAttack,
  calculateWeatherTroopDefense,
  WEATHER_CONFIGS,
} from './weather';

// Maximum capacity constants specified in prompt
export const MAX_CASTLE_LEVEL = 100;
export const MAX_CASTLE_TROOP_CAPACITY = 1_000_000_000_000_000n; // 1,000 Trillion
export const BASE_CASTLE_TROOP_CAPACITY = 10_000n; // Level 0
export const MAX_RALLY_CAPACITY = 1_000_000_000_000n; // 1 Trillion
export const BASE_RALLY_CAPACITY = 5_000n; // Level 0

export interface CastleEra {
  eraIndex: number; // 1 to 10
  name: string;
  minLevel: number;
  maxLevel: number;
  unlockedTroopTier: number;
  buildingTheme: string;
  castleMultiplier: number; // 1x to 100x
  perkDescription: string;
}

export const CASTLE_ERAS: CastleEra[] = [
  { eraIndex: 1, name: 'Era I: Timber Encampment', minLevel: 0, maxLevel: 9, unlockedTroopTier: 2, buildingTheme: 'Timber & Earth', castleMultiplier: 1, perkDescription: 'Base gathering speed +10%' },
  { eraIndex: 2, name: 'Era II: Stone Bastion', minLevel: 10, maxLevel: 19, unlockedTroopTier: 4, buildingTheme: 'Granite Walls', castleMultiplier: 5, perkDescription: 'Troop defense +25%' },
  { eraIndex: 3, name: 'Era III: Iron Keep', minLevel: 20, maxLevel: 29, unlockedTroopTier: 6, buildingTheme: 'Reinforced Iron', castleMultiplier: 12, perkDescription: 'Shieldbearer block rating +30%' },
  { eraIndex: 4, name: 'Era IV: Steel Fortress', minLevel: 30, maxLevel: 39, unlockedTroopTier: 8, buildingTheme: 'High Carbon Steel', castleMultiplier: 20, perkDescription: 'Shooter range +40%' },
  { eraIndex: 5, name: 'Era V: Mythril Citadel', minLevel: 40, maxLevel: 49, unlockedTroopTier: 10, buildingTheme: 'Enchanted Mythril', castleMultiplier: 32, perkDescription: 'Bomber blast radius +50%' },
  { eraIndex: 6, name: 'Era VI: Obsidian Spire', minLevel: 50, maxLevel: 59, unlockedTroopTier: 12, buildingTheme: 'Volcanic Obsidian', castleMultiplier: 45, perkDescription: 'All troop attack +60%' },
  { eraIndex: 7, name: 'Era VII: Dragonscale Palace', minLevel: 60, maxLevel: 69, unlockedTroopTier: 14, buildingTheme: 'Draconic Runes', castleMultiplier: 60, perkDescription: 'Rally march speed +75%' },
  { eraIndex: 8, name: 'Era VIII: Void Sanctum', minLevel: 70, maxLevel: 79, unlockedTroopTier: 16, buildingTheme: 'Dark Matter Flux', castleMultiplier: 75, perkDescription: 'Titan damage resistance +45%' },
  { eraIndex: 9, name: 'Era IX: Astral Dominion', minLevel: 80, maxLevel: 89, unlockedTroopTier: 18, buildingTheme: 'Starlight Crystal', castleMultiplier: 90, perkDescription: 'Rally capacity boost +100%' },
  { eraIndex: 10, name: 'Era X: Celestial Imperium', minLevel: 90, maxLevel: 100, unlockedTroopTier: 20, buildingTheme: 'Divine Singularity', castleMultiplier: 100, perkDescription: 'Unlocks T20 Celestial Aegis & 1000 Trillion Capacity' },
];

export function getCastleEra(level: number): CastleEra {
  const clamped = Math.max(0, Math.min(100, level));
  const era = CASTLE_ERAS.find((e) => clamped >= e.minLevel && clamped <= e.maxLevel);
  return era || CASTLE_ERAS[0];
}

/**
 * Calculates Multiplicative Trillion-Scale Power Rating from kingdom-systems-design.md:
 * PowerRating = Σ(troop_count × tier_power) × CastleMultiplier × HeroMultiplier × ResearchMultiplier
 */
export function calculateMultiplicativePowerRating(params: {
  troops: Record<string, bigint>;
  castleLevel: number;
  highestHeroRarityMultiplier: number;
  researchLevel: number;
}): bigint {
  const era = getCastleEra(params.castleLevel);
  const castleMult = BigInt(Math.max(1, era.castleMultiplier));
  const heroMult = BigInt(Math.max(1, Math.floor(params.highestHeroRarityMultiplier)));
  const researchMult = BigInt(Math.max(1, Math.min(5, Math.floor(params.researchLevel / 4) + 1)));

  let baseTroopPower = 0n;
  for (const [key, count] of Object.entries(params.troops)) {
    if (count <= 0n) continue;
    const parts = key.split('_t');
    const tier = parts.length > 1 ? parseInt(parts[1]) : 1;
    const tierPower = BigInt(Math.max(1, Math.floor(Math.pow(1.25, tier - 1))));
    baseTroopPower += count * tierPower;
  }

  if (baseTroopPower === 0n) {
    baseTroopPower = BigInt(params.castleLevel * 50_000 + 10_000);
  }

  return baseTroopPower * castleMult * heroMult * researchMult;
}

/**
 * Calculates Castle Troop Capacity for level 0 to 100.
 * At level 0: 10,000
 * At level 100: exactly 1,000,000,000,000,000n (1,000 Trillion)
 */
export function calculateCastleTroopCapacity(castleLevel: number): bigint {
  const level = Math.max(0, Math.min(MAX_CASTLE_LEVEL, castleLevel));
  if (level === 0) return BASE_CASTLE_TROOP_CAPACITY;
  if (level === MAX_CASTLE_LEVEL) return MAX_CASTLE_TROOP_CAPACITY;

  // Exponential scale from level 1 to 100
  // ratio = (level / 100)^5.8 ensures smooth progression from thousands to trillions
  const t = level / 100;
  const growth = Math.pow(t, 5.2);
  const diff = Number(MAX_CASTLE_TROOP_CAPACITY - BASE_CASTLE_TROOP_CAPACITY);
  const capacity = Number(BASE_CASTLE_TROOP_CAPACITY) + diff * growth;
  return BigInt(Math.floor(capacity));
}

/**
 * Calculates Clan Rally Capacity for castle level 0 to 100.
 * At level 0: 5,000
 * At level 100: exactly 1,000,000,000,000n (1 Trillion)
 */
export function calculateRallyCapacity(castleLevel: number): bigint {
  const level = Math.max(0, Math.min(MAX_CASTLE_LEVEL, castleLevel));
  if (level === 0) return BASE_RALLY_CAPACITY;
  if (level === MAX_CASTLE_LEVEL) return MAX_RALLY_CAPACITY;

  const t = level / 100;
  const growth = Math.pow(t, 4.8);
  const diff = Number(MAX_RALLY_CAPACITY - BASE_RALLY_CAPACITY);
  const capacity = Number(BASE_RALLY_CAPACITY) + diff * growth;
  return BigInt(Math.floor(capacity));
}

/**
 * Formats ultra-large BigInt numbers cleanly for UI display (e.g., 1000.00T, 45.20B, 3.50M, 120.5K)
 */
export function formatBigInt(num: bigint | number): string {
  const b = typeof num === 'bigint' ? num : BigInt(Math.floor(num));
  if (b < 0n) return `-${formatBigInt(-b)}`;
  
  if (b >= 1_000_000_000_000_000n) {
    const quadrillions = Number(b / 10_000_000_000_000n) / 100;
    return `${quadrillions.toFixed(2)}Q`;
  }
  if (b >= 1_000_000_000_000n) {
    const trillions = Number(b / 10_000_000_000n) / 100;
    return `${trillions.toFixed(2)}T`;
  }
  if (b >= 1_000_000_000n) {
    const billions = Number(b / 10_000_000n) / 100;
    return `${billions.toFixed(2)}B`;
  }
  if (b >= 1_000_000n) {
    const millions = Number(b / 10_000n) / 100;
    return `${millions.toFixed(2)}M`;
  }
  if (b >= 1_000n) {
    const thousands = Number(b / 10n) / 100;
    return `${thousands.toFixed(1)}K`;
  }
  return b.toString();
}

/**
 * Troop names for T1 - T20
 */
const SHIELDBEARER_NAMES = [
  'Wooden Buckler', 'Bronze Guardian', 'Iron Shieldbearer', 'Steel Vanguard', 'Adamant Sentinel',
  'Runed Bulwark', 'Mythril Phalanx', 'Dragonscale Bastion', 'Obsidian Colossus', 'Titan Aegis',
  'Solar Fortress', 'Starlight Ward', 'Void Barrier', 'Chrono Juggernaut', 'Singularity Wall',
  'Primordial Aegis', 'Nebula Custodian', 'Cosmic Protector', 'Transcendent Shield', 'Celestial Aegis'
];

const SHOOTER_NAMES = [
  'Shortbow Scout', 'Recurve Archer', 'Crossbow Hunter', 'Longbow Marksman', 'Arbalest Sniper',
  'Eagle-Eye Ranger', 'Windrunner Bow', 'Dragon-Bone Balister', 'Arcane Deadeye', 'Plasma Ballista',
  'Thunderbolt Sniper', 'Starlight Railgun', 'Void Bowmaster', 'Quasar Striker', 'Supernova Marksman',
  'Chronos Arrow', 'Astral Sharpshooter', 'Dimensional Piercer', 'Infinity Archer', 'Celestial Deadeye'
];

const BOMBER_NAMES = [
  'Pitch Slinger', 'Powder Lobber', 'Iron Mortar', 'Catapult Engineer', 'Trebuchet Demolisher',
  'Flamethrower Crew', 'Siege Cannonier', 'Dragonfire Mortar', 'Alchemy Bombardier', 'Magma Howitzer',
  'Storm Blaster', 'Antimatter Siege', 'Void Cataclysm', 'Orbital Bombard', 'Pulsar Demolisher',
  'Supercluster Bomber', 'Dark Matter Mortar', 'Cosmic Annihilator', 'Omega Siege Titan', 'Celestial Annihilator'
];

/**
 * Generate T1 - T20 stats for the 3 troop archetypes
 */
export function getTroopTierInfo(type: TroopType, tier: number): TroopTierInfo {
  const clampedTier = Math.max(1, Math.min(20, tier));
  const t = BigInt(clampedTier);
  const tierIndex = clampedTier - 1;

  let name = '';
  let baseAtk = 10n;
  let baseDef = 10n;
  let baseHp = 50n;

  if (type === 'shieldbearer') {
    name = SHIELDBEARER_NAMES[tierIndex];
    baseAtk = 8n * (2n ** (t - 1n));
    baseDef = 28n * (2n ** (t - 1n));
    baseHp = 120n * (2n ** (t - 1n));
  } else if (type === 'shooter') {
    name = SHOOTER_NAMES[tierIndex];
    baseAtk = 32n * (2n ** (t - 1n));
    baseDef = 12n * (2n ** (t - 1n));
    baseHp = 55n * (2n ** (t - 1n));
  } else {
    name = BOMBER_NAMES[tierIndex];
    baseAtk = 45n * (2n ** (t - 1n));
    baseDef = 16n * (2n ** (t - 1n));
    baseHp = 70n * (2n ** (t - 1n));
  }

  // Power scale
  const powerPerUnit = (baseAtk * 3n + baseDef * 3n + baseHp) / 2n;

  // Resource costs scale with tier
  const costMultiplier = 5n * (2n ** (t - 1n));

  return {
    tier: clampedTier,
    type,
    name: `T${clampedTier} ${name}`,
    attack: baseAtk,
    defense: baseDef,
    hp: baseHp,
    speed: type === 'shooter' ? 12 : type === 'shieldbearer' ? 9 : 7,
    woodCost: costMultiplier * 10n,
    steelCost: type === 'shieldbearer' ? costMultiplier * 15n : costMultiplier * 8n,
    copperCost: costMultiplier * 6n,
    grainCost: costMultiplier * 12n,
    oilCost: type === 'bomber' ? costMultiplier * 18n : costMultiplier * 5n,
    diamondCost: clampedTier > 10 ? BigInt(clampedTier - 10) * 10n : 0n,
    powerPerUnit,
    description:
      type === 'shieldbearer'
        ? `Heavy vanguard tank. Counter to Shooters with +50% block rating.`
        : type === 'shooter'
        ? `Long-range armor piercer. Devastates Bombers with rapid volleys.`
        : `Devastating siege demolitionist. Shatters Shieldbearer fortifications with explosive AOE.`
  };
}

/**
 * Calculates Castle upgrade resource costs for level 0 to 100
 */
export function getCastleUpgradeCost(currentLevel: number): Record<ResourceType, bigint> {
  const nextLvl = BigInt(currentLevel + 1);
  const factor = nextLvl ** 2n;

  return {
    wood: factor * 2500n,
    steel: factor * 1800n,
    copper: factor * 1200n,
    grain: factor * 2000n,
    oil: factor * 900n,
    diamond: nextLvl * 50n
  };
}

/**
 * Troop combat effectiveness against other types:
 * Shieldbearer beats Shooter (+35% bonus)
 * Shooter beats Bomber (+35% bonus)
 * Bomber beats Shieldbearer (+35% bonus)
 */
export function getTroopTypeAdvantage(attacker: TroopType, defender: TroopType): number {
  if (attacker === 'shieldbearer' && defender === 'shooter') return 1.35;
  if (attacker === 'shooter' && defender === 'bomber') return 1.35;
  if (attacker === 'bomber' && defender === 'shieldbearer') return 1.35;
  if (attacker === defender) return 1.0;
  return 0.75;
}

/**
 * Simulate battle between player army and a monster/enemy army.
 * Returns victory flag, rounds, casualties, and power score.
 */
export interface BattleArmy {
  shieldbearers: { tier: number; count: bigint };
  shooters: { tier: number; count: bigint };
  bombers: { tier: number; count: bigint };
  heroAttackBonusPct?: number;
  heroDefenseBonusPct?: number;
}

export interface BattleResult {
  victory: boolean;
  rounds: number;
  damageDealt: bigint;
  damageTaken: bigint;
  remainingEnemyHp: bigint;
  playerCasualties: {
    shieldbearers: bigint;
    shooters: bigint;
    bombers: bigint;
  };
  expGained: bigint;
  lootAwarded: Partial<Record<ResourceType, bigint>>;
}

export function simulateBattle(
  army: BattleArmy,
  monster: {
    level: number;
    hp: bigint;
    attack: bigint;
    defense: bigint;
    expReward: bigint;
    dropResources: Partial<Record<ResourceType, bigint>>;
  },
  weather: WeatherType = 'clear'
): BattleResult {
  // Calculate total army attack, defense, HP with weather status effects
  const sbInfo = getTroopTierInfo('shieldbearer', army.shieldbearers.tier);
  const shInfo = getTroopTierInfo('shooter', army.shooters.tier);
  const bmInfo = getTroopTierInfo('bomber', army.bombers.tier);

  const weatherConfig = WEATHER_CONFIGS[weather] || WEATHER_CONFIGS.clear;
  const sbAtk = calculateWeatherTroopAttack(sbInfo.attack, 'shieldbearer', weather);
  const sbDef = calculateWeatherTroopDefense(sbInfo.defense, 'shieldbearer', weather);
  const shAtk = calculateWeatherTroopAttack(shInfo.attack, 'shooter', weather);
  const shDef = calculateWeatherTroopDefense(shInfo.defense, 'shooter', weather);
  const bmAtk = calculateWeatherTroopAttack(bmInfo.attack, 'bomber', weather);
  const bmDef = calculateWeatherTroopDefense(bmInfo.defense, 'bomber', weather);

  const heroAtkMult = 1 + (army.heroAttackBonusPct || 0) / 100;
  const heroDefMult = 1 + (army.heroDefenseBonusPct || 0) / 100;

  const totalAtk =
    BigInt(Math.floor(Number(army.shieldbearers.count * sbAtk) * heroAtkMult)) +
    BigInt(Math.floor(Number(army.shooters.count * shAtk) * heroAtkMult)) +
    BigInt(Math.floor(Number(army.bombers.count * bmAtk) * heroAtkMult));

  const totalDef =
    BigInt(Math.floor(Number(army.shieldbearers.count * sbDef) * heroDefMult)) +
    BigInt(Math.floor(Number(army.shooters.count * shDef) * heroDefMult)) +
    BigInt(Math.floor(Number(army.bombers.count * bmDef) * heroDefMult));

  const totalTroopHp =
    army.shieldbearers.count * sbInfo.hp +
    army.shooters.count * shInfo.hp +
    army.bombers.count * bmInfo.hp;

  if (totalTroopHp === 0n) {
    return {
      victory: false,
      rounds: 1,
      damageDealt: 0n,
      damageTaken: 0n,
      remainingEnemyHp: monster.hp,
      playerCasualties: { shieldbearers: 0n, shooters: 0n, bombers: 0n },
      expGained: 0n,
      lootAwarded: {}
    };
  }

  // Turn-based damage loop (up to 10 rounds)
  let enemyHp = monster.hp;
  let playerHp = totalTroopHp;
  let rounds = 0;

  while (enemyHp > 0n && playerHp > 0n && rounds < 10) {
    rounds++;

    // Player attacks monster
    const rawPlayerDmg = totalAtk > monster.defense ? totalAtk - monster.defense / 2n : totalAtk / 2n;
    const playerDmg = rawPlayerDmg > 1n ? rawPlayerDmg : 1n;
    enemyHp = enemyHp > playerDmg ? enemyHp - playerDmg : 0n;

    if (enemyHp === 0n) break;

    // Monster attacks player (shieldbearers absorb brunt)
    const rawMonsterDmg = monster.attack > totalDef ? monster.attack - totalDef / 3n : monster.attack / 3n;
    const monsterDmg = rawMonsterDmg > 1n ? rawMonsterDmg : 1n;
    playerHp = playerHp > monsterDmg ? playerHp - monsterDmg : 0n;
  }

  const victory = enemyHp === 0n;
  const hpLost = totalTroopHp - playerHp;
  const casualtyRatio = totalTroopHp > 0n ? Number(hpLost) / Number(totalTroopHp) : 0;

  // Distribute casualties: Shieldbearers take frontline (60%), Shooters (20%), Bombers (20%)
  const sbCasualties = BigInt(Math.floor(Number(army.shieldbearers.count) * casualtyRatio * 0.7));
  const shCasualties = BigInt(Math.floor(Number(army.shooters.count) * casualtyRatio * 0.2));
  const bmCasualties = BigInt(Math.floor(Number(army.bombers.count) * casualtyRatio * 0.1));

  // Exp calculation with weather bonus
  const expMultiplier = 1 + (weatherConfig.monsterExpBonusPct || 0) / 100;
  const finalExp = BigInt(Math.floor(Number(monster.expReward) * expMultiplier));

  return {
    victory,
    rounds,
    damageDealt: monster.hp - enemyHp,
    damageTaken: hpLost,
    remainingEnemyHp: enemyHp,
    playerCasualties: {
      shieldbearers: sbCasualties > army.shieldbearers.count ? army.shieldbearers.count : sbCasualties,
      shooters: shCasualties > army.shooters.count ? army.shooters.count : shCasualties,
      bombers: bmCasualties > army.bombers.count ? army.bombers.count : bmCasualties
    },
    expGained: victory ? finalExp : finalExp / 5n,
    lootAwarded: victory ? monster.dropResources : {}
  };
}

/**
 * Resource point generation yield calculation for Node Level 1 to 10
 */
export function getResourceNodeStats(type: ResourceType, level: number) {
  const clampedLvl = Math.max(1, Math.min(10, level));
  const baseYield = BigInt(clampedLvl * 50_000);
  const gatherSpeed = BigInt(clampedLvl * 150); // units per second

  return {
    level: clampedLvl,
    capacity: baseYield,
    gatherRate: gatherSpeed
  };
}
