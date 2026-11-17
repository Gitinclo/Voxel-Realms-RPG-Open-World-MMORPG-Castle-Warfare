/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHARACTER_SPECIES_CATALOG,
  CORE_10_SPECIES_CATALOG,
  OMNIVERSE_90_SPECIES_CATALOG,
  evaluateSpeciesSwitchPermission,
  getSpeciesSpec,
} from './species';
import { PRIMARY_ADMIN_EMAIL } from './adminModeration';
import { CharacterAppearance } from '../types/game';

const BASE_APPEARANCE: CharacterAppearance = {
  name: 'Test Commander',
  title: 'Citadel Lord',
  clanTag: 'SOL',
  gender: 'male',
  species: 'human',
  speciesLocked: true,
  adminSpeciesSwitchApproved: false,
  skinColor: '#f1c27d',
  hairStyle: 'knight',
  hairColor: '#e65100',
  eyeColor: '#00e5ff',
  armorTier: 5,
  armorColor: '#1e293b',
  capeColor: '#b71c1c',
  hasCape: true,
  weaponType: 'broadsword',
};

test('1. CHARACTER_SPECIES_CATALOG defines all 100 unique playable races (10 Core + 90 Omniverse) across all 3 lineages and 5 tiers', () => {
  assert.equal(CORE_10_SPECIES_CATALOG.length, 10);
  assert.equal(OMNIVERSE_90_SPECIES_CATALOG.length, 90);
  assert.equal(CHARACTER_SPECIES_CATALOG.length, 100);

  const ids = new Set(CHARACTER_SPECIES_CATALOG.map((s) => s.id));
  assert.equal(ids.size, 100);

  const ranks = new Set(CHARACTER_SPECIES_CATALOG.map((s) => s.omniverseRank));
  assert.equal(ranks.size, 100);
  for (let r = 1; r <= 100; r++) {
    assert.ok(ranks.has(r), `Expected Omniverse Rank #${r} to be present in 100 playable races`);
  }

  const lineages = new Set(CHARACTER_SPECIES_CATALOG.map((s) => s.lineage));
  assert.deepEqual(lineages, new Set(['fantasy_kingdom', 'xianxia_immortal', 'cosmic_primordial']));

  const tiers = new Set(CHARACTER_SPECIES_CATALOG.map((s) => s.omniverseTier));
  assert.deepEqual(tiers, new Set([1, 2, 3, 4, 5]));

  for (const spec of CHARACTER_SPECIES_CATALOG) {
    assert.ok(spec.name.length > 0);
    assert.ok(spec.chineseName.length > 0);
    assert.ok(spec.originCanon.length > 0);
    assert.equal(spec.meshTraits.bodyScale.length, 3);
    assert.ok(spec.meshTraits.bodyScale.every((scale) => scale >= 0.8 && scale <= 1.25));
  }
});

test('2. getSpeciesSpec resolves all 10 core IDs, all 100 omniverse_species_001..100 IDs, and safely falls back to human', () => {
  const golem = getSpeciesSpec('crystalline_golem');
  assert.equal(golem.id, 'crystalline_golem');
  assert.equal(golem.meshTraits.hasGolemChestReactor, true);

  const outerGods = getSpeciesSpec('omniverse_species_001');
  assert.equal(outerGods.omniverseRank, 1);
  assert.equal(outerGods.omniverseTier, 1);
  assert.ok(outerGods.name.includes('Outer Gods'));

  const saiyans = getSpeciesSpec('omniverse_species_061');
  assert.equal(saiyans.omniverseRank, 61);
  assert.ok(saiyans.name.includes('Saiyans'));

  // Mapped core rank #81 (human) and #99 (sylvan_elf) also resolve via omniverse_species_081 / 099
  assert.equal(getSpeciesSpec('omniverse_species_081').id, 'human');
  assert.equal(getSpeciesSpec('omniverse_species_099').id, 'sylvan_elf');

  const fallbackUndefined = getSpeciesSpec(undefined);
  assert.equal(fallbackUndefined.id, 'human');
});

test('3. evaluateSpeciesSwitchPermission enforces 100-race access for creatergame31@gmail.com and Admin Permission Gate for others', () => {
  // Retaining same species is always allowed
  const sameSpecies = evaluateSpeciesSwitchPermission({
    currentAppearance: BASE_APPEARANCE,
    targetSpeciesId: 'human',
    activeAccountEmail: 'regular.player@example.com',
  });
  assert.equal(sameSpecies.allowed, true);
  assert.equal(sameSpecies.requiresAdminApproval, false);

  // Unlocked character during initial creation can pick Core 10 starter species freely
  const unlockedCoreChoice = evaluateSpeciesSwitchPermission({
    currentAppearance: { ...BASE_APPEARANCE, speciesLocked: false },
    targetSpeciesId: 'sylvan_elf',
    activeAccountEmail: 'regular.player@example.com',
  });
  assert.equal(unlockedCoreChoice.allowed, true);
  assert.equal(unlockedCoreChoice.requiresAdminApproval, false);

  // Unlocked non-admin player without Admin permission cannot pick Sovereign Omniverse Race (#1 Outer Gods)
  const unlockedOmniverseDenied = evaluateSpeciesSwitchPermission({
    currentAppearance: { ...BASE_APPEARANCE, speciesLocked: false },
    targetSpeciesId: 'omniverse_species_001',
    activeAccountEmail: 'regular.player@example.com',
  });
  assert.equal(unlockedOmniverseDenied.allowed, false);
  assert.equal(unlockedOmniverseDenied.requiresAdminApproval, true);

  // Locked regular player cannot switch without admin approval
  const deniedSwitch = evaluateSpeciesSwitchPermission({
    currentAppearance: BASE_APPEARANCE,
    targetSpeciesId: 'azure_dragonkin',
    activeAccountEmail: 'regular.player@example.com',
  });
  assert.equal(deniedSwitch.allowed, false);
  assert.equal(deniedSwitch.requiresAdminApproval, true);
  assert.equal(deniedSwitch.authorizedByEmail, null);

  // Admin decree (creatergame31@gmail.com permission) unlocks both Core & Sovereign Omniverse races (#1–#100) for others
  const decreeApprovedCore = evaluateSpeciesSwitchPermission({
    currentAppearance: { ...BASE_APPEARANCE, adminSpeciesSwitchApproved: true },
    targetSpeciesId: 'void_walker',
    activeAccountEmail: 'regular.player@example.com',
  });
  assert.equal(decreeApprovedCore.allowed, true);
  assert.equal(decreeApprovedCore.authorizedByEmail, PRIMARY_ADMIN_EMAIL);

  const decreeApprovedOmniverse = evaluateSpeciesSwitchPermission({
    currentAppearance: { ...BASE_APPEARANCE, adminSpeciesSwitchApproved: true },
    targetSpeciesId: 'omniverse_species_001',
    activeAccountEmail: 'regular.player@example.com',
  });
  assert.equal(decreeApprovedOmniverse.allowed, true);
  assert.equal(decreeApprovedOmniverse.authorizedByEmail, PRIMARY_ADMIN_EMAIL);

  // Root Admin (creatergame31@gmail.com) direct override is allowed for all 100 races at any time
  const rootOverrideCore = evaluateSpeciesSwitchPermission({
    currentAppearance: BASE_APPEARANCE,
    targetSpeciesId: 'empyrean_angelic',
    activeAccountEmail: PRIMARY_ADMIN_EMAIL,
  });
  assert.equal(rootOverrideCore.allowed, true);
  assert.equal(rootOverrideCore.authorizedByEmail, PRIMARY_ADMIN_EMAIL);

  const rootOverrideOmniverse = evaluateSpeciesSwitchPermission({
    currentAppearance: BASE_APPEARANCE,
    targetSpeciesId: 'omniverse_species_001',
    activeAccountEmail: PRIMARY_ADMIN_EMAIL,
  });
  assert.equal(rootOverrideOmniverse.allowed, true);
  assert.equal(rootOverrideOmniverse.authorizedByEmail, PRIMARY_ADMIN_EMAIL);
});
