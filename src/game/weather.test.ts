/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WEATHER_CONFIGS,
  calculateWeatherGatherRate,
  calculateWeatherTroopAttack,
  calculateWeatherTroopDefense,
  getNextWeather,
} from './weather';

test('rain boosts wood and grain harvests while dampening shooter volleys', () => {
  const baseRate = 1000n;
  const woodHarvest = calculateWeatherGatherRate(baseRate, 'wood', 'rain');
  const grainHarvest = calculateWeatherGatherRate(baseRate, 'grain', 'rain');
  const steelHarvest = calculateWeatherGatherRate(baseRate, 'steel', 'rain');

  assert.ok(woodHarvest > baseRate, 'Rain should boost wood harvest');
  assert.ok(grainHarvest > baseRate, 'Rain should boost grain harvest');
  assert.ok(steelHarvest < baseRate, 'Rain should reduce steel mining yield');

  // Combat status effects
  const shooterAtk = calculateWeatherTroopAttack(1000n, 'shooter', 'rain');
  const shieldDef = calculateWeatherTroopDefense(1000n, 'shieldbearer', 'rain');

  assert.ok(shooterAtk < 1000n, 'Rain should decrease shooter attack');
  assert.ok(shieldDef > 1000n, 'Rain should increase shieldbearer defense');
});

test('snow boosts diamond mining and dampens bomber artillery', () => {
  const diamondGather = calculateWeatherGatherRate(1000n, 'diamond', 'snow');
  const grainGather = calculateWeatherGatherRate(1000n, 'grain', 'snow');

  assert.ok(diamondGather > 1000n, 'Frost fissures should amplify diamond yields');
  assert.ok(grainGather < 1000n, 'Subzero chill should reduce grain harvest');

  const bomberAtk = calculateWeatherTroopAttack(1000n, 'bomber', 'snow');
  assert.ok(bomberAtk < 1000n, 'Snow should cause delayed bomber fuses');
});

test('storm surges oil well extraction and supercharges bomber siege damage', () => {
  const oilGather = calculateWeatherGatherRate(1000n, 'oil', 'storm');
  assert.equal(oilGather, 1500n, 'Storm should boost oil extraction by 50%');

  const bomberAtk = calculateWeatherTroopAttack(1000n, 'bomber', 'storm');
  assert.equal(bomberAtk, 1400n, 'Storm gale should boost bomber attack by 40%');

  const stormExp = WEATHER_CONFIGS.storm.monsterExpBonusPct;
  assert.equal(stormExp, 35, 'Charged tempest monsters provide +35% exp');
});

test('clear weather maintains baseline multipliers and swift scouting', () => {
  const woodRate = calculateWeatherGatherRate(500n, 'wood', 'clear');
  assert.equal(woodRate, 500n);

  const shieldAtk = calculateWeatherTroopAttack(800n, 'shieldbearer', 'clear');
  assert.equal(shieldAtk, 800n);

  assert.equal(WEATHER_CONFIGS.clear.marchSpeedMultiplier, 1.15);
});

test('weather cycle properly transitions across states', () => {
  assert.equal(getNextWeather('clear'), 'rain');
  assert.equal(getNextWeather('rain'), 'storm');
  assert.equal(getNextWeather('storm'), 'clear');
});
