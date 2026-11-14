/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHARACTER_SPECIES_CATALOG,
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

test('1. CHARACTER_SPECIES_CATALOG defines 10 unique species across all 3 lineages', () => {
  assert.equal(CHARACTER_SPECIES_CATALOG.length, 10);

  const ids = new Set(CHARACTER_SPECIES_CATALOG.map((s) => s.id));
  assert.equal(ids.size, 10);

  const lineages = new Set(CHARACTER_SPECIES_CATALOG.map((s) => s.lineage));
  assert.deepEqual(lineages, new Set(['fantasy_kingdom', 'xianxia_immortal', 'cosmic_primordial']));

  for (const spec of CHARACTER_SPECIES_CATALOG) {
    assert.ok(spec.name.length > 0);
    assert.ok(spec.chineseName.length > 0);
    assert.equal(spec.meshTraits.bodyScale.length, 3);
    assert.ok(spec.meshTraits.bodyScale.every((scale) => scale >= 0.8 && scale <= 1.25));
  }
});

test('2. getSpeciesSpec resolves canonical specs and safely falls back to human', () => {
  const golem = getSpeciesSpec('crystalline_golem');
  assert.equal(golem.id, 'crystalline_golem');
  assert.equal(golem.meshTraits.hasGolemChestReactor, true);

  const fallbackUndefined = getSpeciesSpec(undefined);
  assert.equal(fallbackUndefined.id, 'human');
});

test('3. evaluateSpeciesSwitchPermission enforces initial lock & Admin Rebirth Gate', () => {
  // Retaining same species is always allowed
  const sameSpecies = evaluateSpeciesSwitchPermission({
    currentAppearance: BASE_APPEARANCE,
    targetSpeciesId: 'human',
    activeAccountEmail: 'regular.player@example.com',
  });
  assert.equal(sameSpecies.allowed, true);
  assert.equal(sameSpecies.requiresAdminApproval, false);

  // Unlocked character during initial creation can pick any species freely
  const unlockedChoice = evaluateSpeciesSwitchPermission({
    currentAppearance: { ...BASE_APPEARANCE, speciesLocked: false },
    targetSpeciesId: 'sylvan_elf',
    activeAccountEmail: 'regular.player@example.com',
  });
  assert.equal(unlockedChoice.allowed, true);
  assert.equal(unlockedChoice.requiresAdminApproval, false);

  // Locked regular player cannot switch without admin approval
  const deniedSwitch = evaluateSpeciesSwitchPermission({
    currentAppearance: BASE_APPEARANCE,
    targetSpeciesId: 'azure_dragonkin',
    activeAccountEmail: 'regular.player@example.com',
  });
  assert.equal(deniedSwitch.allowed, false);
  assert.equal(deniedSwitch.requiresAdminApproval, true);
  assert.equal(deniedSwitch.authorizedByEmail, null);

  // Admin decree unlocks locked species switch
  const decreeApproved = evaluateSpeciesSwitchPermission({
    currentAppearance: { ...BASE_APPEARANCE, adminSpeciesSwitchApproved: true },
    targetSpeciesId: 'void_walker',
    activeAccountEmail: 'regular.player@example.com',
  });
  assert.equal(decreeApproved.allowed, true);
  assert.equal(decreeApproved.authorizedByEmail, PRIMARY_ADMIN_EMAIL);

  // Root Admin direct override is allowed even while speciesLocked is true
  const rootOverride = evaluateSpeciesSwitchPermission({
    currentAppearance: BASE_APPEARANCE,
    targetSpeciesId: 'empyrean_angelic',
    activeAccountEmail: PRIMARY_ADMIN_EMAIL,
  });
  assert.equal(rootOverride.allowed, true);
  assert.equal(rootOverride.authorizedByEmail, PRIMARY_ADMIN_EMAIL);
});
