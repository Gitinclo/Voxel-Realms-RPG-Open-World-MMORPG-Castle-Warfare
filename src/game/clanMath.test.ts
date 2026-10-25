/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRolePermissions,
  canPromoteMember,
  canDemoteMember,
  canKickMember,
  validateClanCreation,
  calculateClanTotalPower,
  calculateOutpostAssault,
  calculateCoopBossStrike,
  buildClanTerritoryGrid,
  evaluateTerritoryControlSummary,
} from './clanMath';
import { ClanMember } from '../types/game';
import { INITIAL_CLAN_WAR } from './initialData';

test('role permissions enforce strict hierarchical rights', () => {
  const leaderPerms = getRolePermissions('Leader');
  assert.equal(leaderPerms.canDeclareWar, true);
  assert.equal(leaderPerms.canTriggerBuffs, true);
  assert.equal(leaderPerms.canWithdrawVault, true);
  assert.equal(leaderPerms.canEditEmblem, true);

  const elderPerms = getRolePermissions('Elder');
  assert.equal(elderPerms.canDeclareWar, false);
  assert.equal(elderPerms.canTriggerBuffs, true);
  assert.equal(elderPerms.canWithdrawVault, true);
  assert.equal(elderPerms.canEditEmblem, false);

  const elitePerms = getRolePermissions('Elite');
  assert.equal(elitePerms.canDeclareWar, false);
  assert.equal(elitePerms.canTriggerBuffs, false);
  assert.equal(elitePerms.canWithdrawVault, true);

  const memberPerms = getRolePermissions('Member');
  assert.equal(memberPerms.canWithdrawVault, false);
  assert.equal(memberPerms.canDeclareWar, false);
});

test('promotion and demotion follow chain of command', () => {
  assert.equal(canPromoteMember('Leader', 'Elder'), true);
  assert.equal(canPromoteMember('Leader', 'Leader'), false);
  assert.equal(canPromoteMember('Elder', 'Member'), true);
  assert.equal(canPromoteMember('Elder', 'Elder'), false);
  assert.equal(canPromoteMember('Elite', 'Member'), false);

  assert.equal(canDemoteMember('Leader', 'Elder'), true);
  assert.equal(canDemoteMember('Elder', 'Elite'), true);
  assert.equal(canDemoteMember('Elder', 'Leader'), false);

  assert.equal(canKickMember('Leader', 'Elder'), true);
  assert.equal(canKickMember('Elder', 'Member'), true);
  assert.equal(canKickMember('Member', 'Elder'), false);
});

test('clan creation validation correctly checks names, tags and castle limits', () => {
  const valid = validateClanCreation({
    name: 'DragonSlayers',
    tag: 'VALOR',
    minCastleLevel: 10,
  });
  assert.equal(valid.valid, true);

  const invalidTag = validateClanCreation({
    name: 'Imperial Vanguard',
    tag: 'toolongtag',
    minCastleLevel: 5,
  });
  assert.equal(invalidTag.valid, false);

  const shortName = validateClanCreation({
    name: 'AB',
    tag: 'OK',
    minCastleLevel: 1,
  });
  assert.equal(shortName.valid, false);
});

test('calculateClanTotalPower aggregates member power with tech multipliers and war victories', () => {
  const members: ClanMember[] = [
    {
      id: '1',
      name: 'Leader',
      role: 'Leader',
      power: 100_000_000n,
      donations: 0n,
      online: true,
      avatar: '👑',
      castleLevel: 25,
      joinedDaysAgo: 10,
    },
    {
      id: '2',
      name: 'Elder',
      role: 'Elder',
      power: 50_000_000n,
      donations: 0n,
      online: true,
      avatar: '⚔️',
      castleLevel: 20,
      joinedDaysAgo: 8,
    },
  ];

  const total = calculateClanTotalPower(members, 1.2, 3);
  // (150M * 1.2) + 3 * 50M = 180M + 150M = 330M
  assert.equal(total, 330_000_000n);
});

test('outpost assault calculates damage and victory points correctly', () => {
  const wonAssault = calculateOutpostAssault(10_000_000n, 5_000_000n);
  assert.equal(wonAssault.conquered, true);
  assert.equal(wonAssault.pointsEarned, 250);

  const partialAssault = calculateOutpostAssault(1_000_000n, 10_000_000n);
  assert.equal(partialAssault.conquered, false);
  assert.ok(partialAssault.damageDealt > 0n);
});

test('coop boss strike applies clan buff multipliers', () => {
  const normalDmg = calculateCoopBossStrike(10_000_000n, 2_000_000n, 0);
  const buffedDmg = calculateCoopBossStrike(10_000_000n, 2_000_000n, 30); // +30% Titan Hunter focus

  assert.ok(buffedDmg > normalDmg);
  assert.equal(buffedDmg, (normalDmg * 130n) / 100n);
});

test('buildClanTerritoryGrid and evaluateTerritoryControlSummary map 3x3 outposts and reflect live captures', () => {
  const initialGrid = buildClanTerritoryGrid(INITIAL_CLAN_WAR.outposts, 50_000_000n);
  assert.equal(initialGrid.length, 9);
  assert.equal(initialGrid[0].sectorCode, 'A1');
  assert.equal(initialGrid[4].sectorCode, 'B2');
  assert.equal(initialGrid[8].sectorCode, 'C3');

  const initialSummary = evaluateTerritoryControlSummary(initialGrid);
  assert.equal(initialSummary.totalSectors, 9);
  assert.equal(initialSummary.playerControlledCount, 3);
  assert.equal(initialSummary.enemyControlledCount, 4);
  assert.equal(initialSummary.neutralCount, 2);
  assert.ok(initialSummary.frontlineSectorsCount > 0);

  // Simulate capturing enemy Iron Citadel (B3) and neutral Dragon Spire (B2)
  const updatedOutposts = INITIAL_CLAN_WAR.outposts.map((o) =>
    o.id === 'outpost_iron_citadel' || o.id === 'outpost_dragon_spire'
      ? { ...o, controlledBy: 'player_clan' as const }
      : o
  );
  const updatedGrid = buildClanTerritoryGrid(updatedOutposts, 50_000_000n);
  const updatedSummary = evaluateTerritoryControlSummary(updatedGrid);
  assert.equal(updatedSummary.playerControlledCount, 5);
  assert.equal(updatedSummary.enemyControlledCount, 3);
  assert.equal(updatedSummary.neutralCount, 1);
  assert.equal(updatedSummary.dominanceStatus, 'Tactical Advantage');
});
