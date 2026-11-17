/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GOD_IMMUNITY_DOMAINS,
  GOD_IMMUNITY_DOMAIN_SPECS,
  GOD_OMNI_ATTRIBUTES,
  GOD_OMNI_PILLAR_IDS,
  GOD_OMNI_PILLAR_SPECS,
  applyGodImmunityToIncomingEffect,
  buildMaxedGodCharacterBundle,
  evaluateGodCharacterImmunity,
  evaluateGodOmniAttribute,
  getGodOmniAttributesByPillar,
} from './godModeCharacter';
import { PRIMARY_ADMIN_EMAIL } from './adminModeration';
import {
  CULTIVATION_MANUALS,
  CULTIVATION_PATH_LIST,
  CULTIVATION_REALMS,
  MYSTICAL_POWER_SKILLS,
} from './cultivationMath';
import { MAX_CASTLE_LEVEL, MAX_CASTLE_TROOP_CAPACITY } from './math';
import { evaluateVipSubscription } from './vipSubscription';

test('evaluateGodCharacterImmunity grants all 12 immunity domains and 100 Omni-Attributes across 5 Divine Pillars exclusively to creatergame31@gmail.com', () => {
  const rootImmunity = evaluateGodCharacterImmunity(PRIMARY_ADMIN_EMAIL, true);
  assert.equal(rootImmunity.isRootGodAccount, true);
  assert.equal(rootImmunity.immuneToAllThings, true);
  assert.equal(rootImmunity.incomingDamageMultiplier, 0);
  assert.equal(rootImmunity.tribulationDamageMultiplier, 0);
  assert.equal(rootImmunity.activeImmunities.length, 12);
  assert.equal(GOD_IMMUNITY_DOMAIN_SPECS.length, 12);
  assert.equal(rootImmunity.activeOmniAttributesCount, 100);
  assert.equal(rootImmunity.activeOmniPillarsCount, 5);
  assert.equal(rootImmunity.omniAttributes.length, 100);
  assert.equal(GOD_OMNI_ATTRIBUTES.length, 100);
  assert.equal(GOD_OMNI_PILLAR_SPECS.length, 5);

  // Verify each of the 5 Divine Pillars has exactly 20 unique Omni-Attributes
  const uniqueIds = new Set(GOD_OMNI_ATTRIBUTES.map((a) => a.id));
  const uniqueNames = new Set(GOD_OMNI_ATTRIBUTES.map((a) => a.name));
  assert.equal(uniqueIds.size, 100);
  assert.equal(uniqueNames.size, 100);

  for (const pillarId of GOD_OMNI_PILLAR_IDS) {
    const pillarAttrs = getGodOmniAttributesByPillar(pillarId);
    assert.equal(pillarAttrs.length, 20, `Expected 20 Omni-Attributes in pillar ${pillarId}`);
  }

  // Spot-check canonical attributes across all 5 pillars via evaluateGodOmniAttribute
  for (const sampleName of [
    'Omnipotent',
    'Omnific',
    'Omniconquering',
    'Omniscient',
    'Omniprohetic',
    'Omniscrutinizing',
    'Omnipresent',
    'Omnitemporal',
    'Omniabiding',
    'Omnibenevolent',
    'Omnijust',
    'Omnimoral',
    'Omnivolent',
    'Omnimalevolent',
    'Omnidestructive',
    'Omnidivine',
  ]) {
    const activeCheck = evaluateGodOmniAttribute(PRIMARY_ADMIN_EMAIL, sampleName, true);
    assert.equal(activeCheck.found, true, `Expected ${sampleName} in GOD_OMNI_ATTRIBUTES`);
    assert.equal(activeCheck.active, true, `Expected ${sampleName} active for root owner`);

    const outsiderCheck = evaluateGodOmniAttribute('player@voxelrealms.example', sampleName, true);
    assert.equal(outsiderCheck.found, true);
    assert.equal(outsiderCheck.active, false);
  }

  // Case-insensitive and whitespace-trimmed match for primary owner
  const normalizedRoot = evaluateGodCharacterImmunity('  CREATERGAME31@GMAIL.COM ', true);
  assert.equal(normalizedRoot.immuneToAllThings, true);
  assert.equal(normalizedRoot.activeOmniAttributesCount, 100);

  // Disabled godmode pauses active immunity and omni-attributes cleanly
  const pausedRoot = evaluateGodCharacterImmunity(PRIMARY_ADMIN_EMAIL, false);
  assert.equal(pausedRoot.isRootGodAccount, true);
  assert.equal(pausedRoot.immuneToAllThings, false);
  assert.equal(pausedRoot.activeOmniAttributesCount, 0);
  assert.equal(pausedRoot.incomingDamageMultiplier, 1);

  // Fail-closed for all other emails
  for (const outsider of ['player@voxelrealms.example', 'admin@gmail.com', '', null, undefined]) {
    const res = evaluateGodCharacterImmunity(outsider, true);
    assert.equal(res.isRootGodAccount, false);
    assert.equal(res.immuneToAllThings, false);
    assert.equal(res.activeImmunities.length, 0);
    assert.equal(res.activeOmniAttributesCount, 0);
    assert.equal(res.omniAttributes.length, 0);
    assert.equal(res.incomingDamageMultiplier, 1);
  }
});

test('applyGodImmunityToIncomingEffect nullifies every domain for creatergame31@gmail.com and passes through for others', () => {
  for (const domain of GOD_IMMUNITY_DOMAINS) {
    const blocked = applyGodImmunityToIncomingEffect(PRIMARY_ADMIN_EMAIL, {
      domain,
      magnitude: 999_999_999_999n,
      sourceLabel: 'Void Leviathan Apocalypse',
    });
    assert.equal(blocked.blocked, true);
    assert.equal(blocked.effectiveMagnitude, 0n);
    assert.equal(blocked.statusApplied, false);
    assert.equal(blocked.immunityDomain, domain);

    const outsider = applyGodImmunityToIncomingEffect('chronos.titan@voxelrealms.example', {
      domain,
      magnitude: 50_000n,
      sourceLabel: 'Void Leviathan Apocalypse',
    });
    assert.equal(outsider.blocked, false);
    assert.equal(outsider.effectiveMagnitude, 50_000n);
    assert.equal(outsider.statusApplied, true);
  }
});

test('buildMaxedGodCharacterBundle creates a fully maxed-out Lv.100 / Realm 22 L9 / 1,000T / VIP 3 / 100 Omni-Attribute Sovereign bundle', () => {
  const bundle = buildMaxedGodCharacterBundle();

  assert.equal(bundle.accountEmail, 'creatergame31@gmail.com');
  assert.equal(bundle.castleLevel, MAX_CASTLE_LEVEL);
  assert.equal(bundle.castleLevel, 100);
  assert.equal(bundle.immunity.immuneToAllThings, true);
  assert.equal(bundle.immunity.activeOmniAttributesCount, 100);
  assert.equal(bundle.immunity.activeOmniPillarsCount, 5);
  assert.equal(bundle.appearance.armorTier, 20);
  assert.equal(bundle.appearance.adminSpeciesSwitchApproved, true);

  // Troops sum strictly to MAX_CASTLE_TROOP_CAPACITY (1,000T T20 forces)
  const totalTroops =
    (bundle.troops.shieldbearer_t20 ?? 0n) +
    (bundle.troops.shooter_t20 ?? 0n) +
    (bundle.troops.bomber_t20 ?? 0n);
  assert.equal(totalTroops, MAX_CASTLE_TROOP_CAPACITY);
  assert.equal(totalTroops, 1_000_000_000_000_000n);

  // Treasury maxed across all 6 core supplies
  assert.equal(bundle.resources.diamond, 999_999_999_999_999n);
  assert.equal(bundle.resources.wood, 999_999_999_999_999n);

  // Cultivation maxed across all 4 paths, Realm 22 (Ultimate Origin), Layer 9, 12 Manuals, 4 Skills, 12 Daos
  const maxRealmIdx = CULTIVATION_REALMS.length - 1;
  assert.equal(bundle.cultivation.currentRealmIndex, maxRealmIdx);
  assert.equal(bundle.cultivation.currentLayer, 9);
  for (const path of CULTIVATION_PATH_LIST) {
    assert.equal(bundle.cultivation.paths[path].realmIndex, maxRealmIdx);
    assert.equal(bundle.cultivation.paths[path].layer, 9);
  }
  assert.equal(Object.keys(bundle.cultivation.ownedManuals).length, CULTIVATION_MANUALS.length);
  for (const manual of CULTIVATION_MANUALS) {
    assert.equal(bundle.cultivation.ownedManuals[manual.id].level, manual.maxLevel);
  }
  assert.equal(bundle.cultivation.learnedMysticalSkills?.length, MYSTICAL_POWER_SKILLS.length);
  assert.equal(bundle.cultivation.masteredGreatDaos, 12);
  assert.equal(bundle.cultivation.rootPurityPct, 100);
  assert.equal(bundle.cultivation.selectedRoot, 'chaos');
  assert.equal(bundle.cultivation.karma?.alignment, 'gold_justice');
  assert.equal(bundle.cultivation.karma?.karmaValue, 100_000);

  // VIP 3 + Loyalty Lv. 15 verified via evaluateVipSubscription
  const vipEval = evaluateVipSubscription(bundle.vipState, '2026-11-16');
  assert.equal(vipEval.tierConfig.id, 'celestial_sovereign');
  assert.equal(vipEval.tierConfig.rank, 3);
  assert.equal(vipEval.isActiveSubscriber, true);
  assert.equal(vipEval.vipLoyaltyLevel, 15);

  // Heroes all maxed at Lv.999, 5-star Divine
  assert.ok(bundle.heroes.length > 0);
  for (const hero of bundle.heroes) {
    assert.equal(hero.level, 999);
    assert.equal(hero.star, 5);
    assert.equal(hero.rarity, 'divine');
  }
});
