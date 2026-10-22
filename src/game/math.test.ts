/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCastleTroopCapacity,
  calculateRallyCapacity,
  formatBigInt,
  getTroopTierInfo,
  simulateBattle,
  getResourceNodeStats,
  getCastleEra,
  calculateMultiplicativePowerRating,
  MAX_CASTLE_LEVEL,
  MAX_CASTLE_TROOP_CAPACITY,
  MAX_RALLY_CAPACITY,
} from './math';

test('10 castle eras transition accurately every 10 levels', () => {
  const era1 = getCastleEra(5);
  assert.equal(era1.eraIndex, 1);
  assert.equal(era1.castleMultiplier, 1);

  const era5 = getCastleEra(45);
  assert.equal(era5.eraIndex, 5);
  assert.equal(era5.castleMultiplier, 32);

  const era10 = getCastleEra(100);
  assert.equal(era10.eraIndex, 10);
  assert.equal(era10.castleMultiplier, 100);
});

test('multiplicative power rating reaches into the trillions as specified in kingdom-systems-design.md', () => {
  const power = calculateMultiplicativePowerRating({
    troops: {
      shieldbearer_t15: 1_000_000n,
      shooter_t18: 1_500_000n,
      bomber_t20: 2_500_000n,
    },
    castleLevel: 100,
    highestHeroRarityMultiplier: 10,
    researchLevel: 20,
  });

  // Expected: 5M troops * tier_power ~50 * 100 (castle) * 10 (hero) * 5 (research) >= 1 Trillion
  assert.ok(power >= 1_000_000_000_000n);
});

test('castle troop capacity scales accurately to 1000 trillion at level 100', () => {
  const cap0 = calculateCastleTroopCapacity(0);
  assert.equal(cap0, 10_000n);

  const cap100 = calculateCastleTroopCapacity(100);
  assert.equal(cap100, MAX_CASTLE_TROOP_CAPACITY);
  assert.equal(cap100, 1_000_000_000_000_000n); // 1,000 Trillion

  // Check monotonicity
  const cap50 = calculateCastleTroopCapacity(50);
  assert.ok(cap50 > cap0);
  assert.ok(cap100 > cap50);
});

test('rally capacity reaches 1 trillion at max level 100', () => {
  const rally0 = calculateRallyCapacity(0);
  assert.equal(rally0, 5_000n);

  const rally100 = calculateRallyCapacity(100);
  assert.equal(rally100, MAX_RALLY_CAPACITY);
  assert.equal(rally100, 1_000_000_000_000n); // 1 Trillion

  const rally50 = calculateRallyCapacity(50);
  assert.ok(rally50 > rally0);
  assert.ok(rally100 > rally50);
});

test('T1 to T20 troop tiers generate proper stats and scale', () => {
  const t1Shield = getTroopTierInfo('shieldbearer', 1);
  const t20Shield = getTroopTierInfo('shieldbearer', 20);
  assert.equal(t1Shield.tier, 1);
  assert.equal(t20Shield.tier, 20);
  assert.ok(t20Shield.attack > t1Shield.attack);
  assert.ok(t20Shield.defense > t1Shield.defense);
  assert.ok(t20Shield.powerPerUnit > t1Shield.powerPerUnit);

  const t1Shooter = getTroopTierInfo('shooter', 1);
  const t20Shooter = getTroopTierInfo('shooter', 20);
  assert.ok(t20Shooter.attack > t1Shooter.attack);

  const t1Bomber = getTroopTierInfo('bomber', 1);
  const t20Bomber = getTroopTierInfo('bomber', 20);
  assert.ok(t20Bomber.attack > t1Bomber.attack);
});

test('formatBigInt correctly formats thousands, millions, billions, trillions, and quadrillions', () => {
  assert.equal(formatBigInt(500n), '500');
  assert.equal(formatBigInt(15_000n), '15.0K');
  assert.equal(formatBigInt(2_500_000n), '2.50M');
  assert.equal(formatBigInt(45_000_000_000n), '45.00B');
  assert.equal(formatBigInt(1_000_000_000_000n), '1.00T');
  assert.equal(formatBigInt(1_000_000_000_000_000n), '1.00Q'); // 1,000 Trillion is 1 Quadrillion
});

test('resource nodes level 1 to 10 yield increasing capacity and gather speed', () => {
  const node1 = getResourceNodeStats('wood', 1);
  const node10 = getResourceNodeStats('wood', 10);
  assert.equal(node1.level, 1);
  assert.equal(node10.level, 10);
  assert.ok(node10.capacity > node1.capacity);
  assert.ok(node10.gatherRate > node1.gatherRate);
});

test('battle simulation yields expected victory with sufficient army', () => {
  const army = {
    shieldbearers: { tier: 5, count: 500n },
    shooters: { tier: 5, count: 500n },
    bombers: { tier: 5, count: 300n },
    heroAttackBonusPct: 20,
    heroDefenseBonusPct: 20,
  };

  const monster = {
    level: 15,
    hp: 15_000n,
    attack: 400n,
    defense: 200n,
    expReward: 1_200n,
    dropResources: { wood: 5_000n, steel: 3_000n },
  };

  const result = simulateBattle(army, monster);
  assert.equal(result.victory, true);
  assert.ok(result.damageDealt >= monster.hp);
  assert.equal(result.remainingEnemyHp, 0n);
  assert.ok(result.expGained > 0n);
});

test('battle simulation reflects storm weather exp bonus and combat modifiers', () => {
  const army = {
    shieldbearers: { tier: 5, count: 500n },
    shooters: { tier: 5, count: 500n },
    bombers: { tier: 5, count: 300n },
    heroAttackBonusPct: 20,
    heroDefenseBonusPct: 20,
  };

  const monster = {
    level: 15,
    hp: 15_000n,
    attack: 400n,
    defense: 200n,
    expReward: 1_000n,
    dropResources: { wood: 5_000n, steel: 3_000n },
  };

  const clearResult = simulateBattle(army, monster, 'clear');
  const stormResult = simulateBattle(army, monster, 'storm');

  assert.equal(clearResult.expGained, 1_000n);
  // Storm grants +35% exp
  assert.equal(stormResult.expGained, 1_350n);
  assert.ok(stormResult.victory, 'Storm army with bombers defeats monster');
});

