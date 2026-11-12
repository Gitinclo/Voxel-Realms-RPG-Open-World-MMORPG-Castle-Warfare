/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOP_100_OMNIVERSE_SPECIES_NPCS,
  OMNIVERSE_TIER_METADATA,
  resolveInfiniteOmniverseByIndex,
  projectOmniverseNpcToWorldNPC,
  executeOmniverseSuperAdminCommand,
} from './omniverse';
import { PRIMARY_ADMIN_EMAIL } from './adminModeration';

test('TOP_100_OMNIVERSE_SPECIES_NPCS contains all 100 species across 5 tiers with dedicated Sovereign Omniverses', () => {
  assert.equal(TOP_100_OMNIVERSE_SPECIES_NPCS.length, 100);

  const seenRanks = new Set<number>();
  const seenOmniverseIds = new Set<string>();
  const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const entry of TOP_100_OMNIVERSE_SPECIES_NPCS) {
    assert.ok(entry.rank >= 1 && entry.rank <= 100);
    seenRanks.add(entry.rank);
    seenOmniverseIds.add(entry.omniverse.omniverseId);
    tierCounts[entry.tier] += 1;

    assert.equal(entry.controlledBySuperAdmin, PRIMARY_ADMIN_EMAIL);
    assert.equal(entry.npcLevel, 1000);
    assert.ok(entry.combatPower > 0n);
    assert.ok(entry.omniverse.hourlyDiamondTribute > 0n);
    assert.ok(entry.omniverse.omniverseName.includes(entry.speciesName));
  }

  assert.equal(seenRanks.size, 100);
  assert.equal(seenOmniverseIds.size, 100);
  assert.equal(tierCounts[1], 20);
  assert.equal(tierCounts[2], 20);
  assert.equal(tierCounts[3], 20);
  assert.equal(tierCounts[4], 20);
  assert.equal(tierCounts[5], 20);
  assert.equal(Object.keys(OMNIVERSE_TIER_METADATA).length, 5);

  // Spot-check canonical entries from each tier
  assert.equal(TOP_100_OMNIVERSE_SPECIES_NPCS[0].speciesName, 'Outer Gods');
  assert.equal(TOP_100_OMNIVERSE_SPECIES_NPCS[20].speciesName, 'Xeelee');
  assert.equal(TOP_100_OMNIVERSE_SPECIES_NPCS[40].speciesName, 'Gods / Deities');
  assert.equal(TOP_100_OMNIVERSE_SPECIES_NPCS[60].speciesName, 'Saiyans');
  assert.equal(TOP_100_OMNIVERSE_SPECIES_NPCS[99].speciesName, 'Dwarves (Mountain Delvers)');
});

test('resolveInfiniteOmniverseByIndex supports both canonical 1-100 and infinite transfinite omniverse indices', () => {
  const first = resolveInfiniteOmniverseByIndex(1);
  assert.equal(first.isProceduralTransfiniteExtension, false);
  assert.equal(first.omniverse.omniverseId, 'OMNI-001');
  assert.equal(first.linkedSpecies.speciesName, 'Outer Gods');

  const hundredth = resolveInfiniteOmniverseByIndex(100);
  assert.equal(hundredth.isProceduralTransfiniteExtension, false);
  assert.equal(hundredth.omniverse.omniverseId, 'OMNI-100');

  const infiniteSector = resolveInfiniteOmniverseByIndex(777_777_777_777_777_777n);
  assert.equal(infiniteSector.isProceduralTransfiniteExtension, true);
  assert.ok(infiniteSector.omniverse.omniverseId.startsWith('OMNI-∞-'));
  assert.ok(infiniteSector.omniverse.sovereignCosmicLaw.includes(PRIMARY_ADMIN_EMAIL));
  assert.ok(infiniteSector.omniverse.hourlyDiamondTribute > 0n);
});

test('executeOmniverseSuperAdminCommand strictly enforces Super Admin creatergame31@gmail.com control and projects 3D World NPCs', () => {
  const denied = executeOmniverseSuperAdminCommand({
    actorEmail: 'random_player@example.com',
    roster: TOP_100_OMNIVERSE_SPECIES_NPCS,
    command: {
      type: 'set_directive',
      targetRank: 1,
      directive: 'hunt_realm_threats',
    },
  });
  assert.equal(denied.allowed, false);
  assert.ok(denied.reason.includes(PRIMARY_ADMIN_EMAIL));

  const approvedDirective = executeOmniverseSuperAdminCommand({
    actorEmail: PRIMARY_ADMIN_EMAIL,
    roster: TOP_100_OMNIVERSE_SPECIES_NPCS,
    command: {
      type: 'set_directive',
      targetRank: 1,
      directive: 'hunt_realm_threats',
    },
  });
  assert.equal(approvedDirective.allowed, true);
  assert.equal(approvedDirective.updatedRoster[0].superAdminDirective, 'hunt_realm_threats');

  const projectedWorldNpc = projectOmniverseNpcToWorldNPC(approvedDirective.updatedRoster[0], 0);
  assert.equal(projectedWorldNpc.id, 'omni_npc_001');
  assert.equal(projectedWorldNpc.level, 1000);
  assert.equal(projectedWorldNpc.directive, 'hunt_monsters');
  assert.ok(projectedWorldNpc.dialogue.some((line) => line.includes(PRIMARY_ADMIN_EMAIL)));

  const harvest = executeOmniverseSuperAdminCommand({
    actorEmail: PRIMARY_ADMIN_EMAIL,
    roster: approvedDirective.updatedRoster,
    command: {
      type: 'harvest_all_omniverse_tribute',
    },
  });
  assert.equal(harvest.allowed, true);
  assert.ok(harvest.tributeDiamondsGranted > 10_000_000n);
});
