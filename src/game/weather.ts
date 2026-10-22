/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResourceType, TroopType } from '../types/game';

export type WeatherType = 'clear' | 'rain' | 'snow' | 'storm';

export interface WeatherStatusEffect {
  type: WeatherType;
  name: string;
  icon: string;
  subtitle: string;
  skyColorHex: number;
  fogColorHex: number;
  fogDensity: number;
  sunlightMult: number;
  // Resource gather multipliers (e.g. +35% = 1.35)
  gatherYieldMultipliers: Record<ResourceType, number>;
  // Combat multipliers per troop archetype
  troopAttackMultipliers: Record<TroopType, number>;
  troopDefenseMultipliers: Record<TroopType, number>;
  marchSpeedMultiplier: number;
  monsterExpBonusPct: number;
  combatFlavorText: string;
  gatherFlavorText: string;
}

export const WEATHER_CONFIGS: Record<WeatherType, WeatherStatusEffect> = {
  clear: {
    type: 'clear',
    name: 'Clear Skies',
    icon: '☀️',
    subtitle: 'Optimal visibility and balanced marching tempo',
    skyColorHex: 0x38bdf8,
    fogColorHex: 0x87ceeb,
    fogDensity: 0.012,
    sunlightMult: 1.0,
    gatherYieldMultipliers: {
      wood: 1.0,
      steel: 1.0,
      copper: 1.0,
      grain: 1.0,
      oil: 1.0,
      diamond: 1.0,
    },
    troopAttackMultipliers: {
      shieldbearer: 1.0,
      shooter: 1.0,
      bomber: 1.0,
    },
    troopDefenseMultipliers: {
      shieldbearer: 1.0,
      shooter: 1.0,
      bomber: 1.0,
    },
    marchSpeedMultiplier: 1.15, // +15% swift scouting
    monsterExpBonusPct: 0,
    combatFlavorText: 'Standard combat conditions. Troops fight at full discipline.',
    gatherFlavorText: 'Balanced extraction across all open-world resource veins.',
  },
  rain: {
    type: 'rain',
    name: 'Abyssal Torrent',
    icon: '🌧️',
    subtitle: 'Heavy rainfall fuels flora and soil agriculture',
    skyColorHex: 0x334155,
    fogColorHex: 0x475569,
    fogDensity: 0.022,
    sunlightMult: 0.55,
    gatherYieldMultipliers: {
      wood: 1.35, // +35% forestry surge
      grain: 1.4, // +40% bumper harvest
      steel: 0.85, // -15% flooded quarry
      copper: 0.9,
      oil: 1.0,
      diamond: 1.0,
    },
    troopAttackMultipliers: {
      shieldbearer: 1.05,
      shooter: 0.85, // -15% wet bowstrings & reduced visibility
      bomber: 0.95,
    },
    troopDefenseMultipliers: {
      shieldbearer: 1.25, // +25% soaked armor dampens kinetic damage
      shooter: 1.0,
      bomber: 1.0,
    },
    marchSpeedMultiplier: 0.9, // -10% muddy roads
    monsterExpBonusPct: 10,
    combatFlavorText: 'Shieldbearers gain +25% DEF; Shooters lose 15% ATK due to dampened volleys.',
    gatherFlavorText: 'Wood (+35%) and Grain (+40%) yields amplified; Steel mining slowed (-15%).',
  },
  snow: {
    type: 'snow',
    name: 'Frostfall Blizzard',
    icon: '❄️',
    subtitle: 'Sub-zero frost crystallizes minerals and freezes roads',
    skyColorHex: 0x94a3b8,
    fogColorHex: 0xcfd8dc,
    fogDensity: 0.026,
    sunlightMult: 0.75,
    gatherYieldMultipliers: {
      wood: 0.85,
      grain: 0.75, // -25% frozen crops
      steel: 1.15,
      copper: 1.2,
      oil: 0.9,
      diamond: 1.45, // +45% radiant frost gem fissures
    },
    troopAttackMultipliers: {
      shieldbearer: 0.95,
      shooter: 1.1, // +10% crisp air precision
      bomber: 0.85, // -15% frozen artillery fuses
    },
    troopDefenseMultipliers: {
      shieldbearer: 1.1,
      shooter: 1.0,
      bomber: 1.0,
    },
    marchSpeedMultiplier: 0.8, // -20% snowdrifts
    monsterExpBonusPct: 15,
    combatFlavorText: 'Diamond armor cracks open; Shooters gain +10% pierce; Bombers suffer delayed fuses (-15%).',
    gatherFlavorText: 'Diamond gems (+45%) and Copper (+20%) thrive; Grain production freezes (-25%).',
  },
  storm: {
    type: 'storm',
    name: 'Tempest Maelstrom',
    icon: '⚡',
    subtitle: 'Violent gale-force storms and high-voltage atmospheric energy',
    skyColorHex: 0x1e1b4b,
    fogColorHex: 0x312e81,
    fogDensity: 0.03,
    sunlightMult: 0.4,
    gatherYieldMultipliers: {
      wood: 0.8,
      grain: 0.8,
      steel: 1.35, // +35% lightning-smelted slag
      copper: 1.25,
      oil: 1.5, // +50% pressurized well eruptions
      diamond: 1.2,
    },
    troopAttackMultipliers: {
      shieldbearer: 0.95,
      shooter: 0.8, // -20% ferocious winds scatter arrows
      bomber: 1.4, // +40% explosive concussive gale force
    },
    troopDefenseMultipliers: {
      shieldbearer: 1.1,
      shooter: 0.9,
      bomber: 1.15,
    },
    marchSpeedMultiplier: 0.85,
    monsterExpBonusPct: 35, // Overcharged lightning beasts grant +35% EXP
    combatFlavorText: 'Bombers unleash catastrophic +40% siege devastation; Shooters lose 20% accuracy.',
    gatherFlavorText: 'Oil extraction surges (+50%) and Steel (+35%); Timber and Grain gathering hindered (-20%).',
  },
};

/**
 * Calculates modified resource gather rate based on active weather state
 */
export function calculateWeatherGatherRate(
  baseRatePerSec: bigint,
  resourceType: ResourceType,
  weather: WeatherType
): bigint {
  const config = WEATHER_CONFIGS[weather] || WEATHER_CONFIGS.clear;
  const multiplier = config.gatherYieldMultipliers[resourceType] ?? 1.0;
  const modified = Number(baseRatePerSec) * multiplier;
  return BigInt(Math.max(1, Math.floor(modified)));
}

/**
 * Calculates modified troop combat attack based on active weather state
 */
export function calculateWeatherTroopAttack(
  baseAttack: bigint,
  troopType: TroopType,
  weather: WeatherType
): bigint {
  const config = WEATHER_CONFIGS[weather] || WEATHER_CONFIGS.clear;
  const multiplier = config.troopAttackMultipliers[troopType] ?? 1.0;
  const modified = Number(baseAttack) * multiplier;
  return BigInt(Math.max(1, Math.floor(modified)));
}

/**
 * Calculates modified troop combat defense based on active weather state
 */
export function calculateWeatherTroopDefense(
  baseDefense: bigint,
  troopType: TroopType,
  weather: WeatherType
): bigint {
  const config = WEATHER_CONFIGS[weather] || WEATHER_CONFIGS.clear;
  const multiplier = config.troopDefenseMultipliers[troopType] ?? 1.0;
  const modified = Number(baseDefense) * multiplier;
  return BigInt(Math.max(1, Math.floor(modified)));
}

/**
 * Returns the next weather state in sequence or random cycle
 */
export function getNextWeather(current: WeatherType): WeatherType {
  const sequence: WeatherType[] = ['clear', 'rain', 'storm', 'clear', 'snow'];
  const currentIndex = sequence.indexOf(current);
  const nextIndex = (currentIndex + 1) % sequence.length;
  return sequence[nextIndex];
}
