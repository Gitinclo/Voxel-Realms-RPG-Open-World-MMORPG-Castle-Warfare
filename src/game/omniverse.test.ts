/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOP_100_OMNIVERSE_SPECIES_NPCS,
  OMNIVERSE_TIER_METADATA,
  SIX_LAYER_COSMIC_HIERARCHY,
  SOLARA_PRIME_UNIVERSE_ID,
  resolveInfiniteOmniverseByIndex,
  resolveSpeciesSixLayerCosmology,
  projectOmniverseNpcToWorldNPC,
  executeOmniverseSuperAdminCommand,
  executeWhitePageAuthorDecree,
  buildCanonicalWhitePageHierarchyTree,
  getWhitePageSingletonRoot,
  resetWhitePageSingletonRoot,
  validateCosmologicalTreeHierarchy,
  resolveEntityCosmologicalPath,
  evaluateEffectiveUniversePhysicsAndLogic,
  overrideOvervoidLogicRules,
  overrideUniversePhysicsConstants,
  spawnNestedUniverseInMultiverse,
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

test('executeOmniverseSuperAdminCommand supports bulk directive updates across all 100 species Background NPCs', () => {
  const bulkUpdate = executeOmniverseSuperAdminCommand({
    actorEmail: PRIMARY_ADMIN_EMAIL,
    roster: TOP_100_OMNIVERSE_SPECIES_NPCS,
    command: {
      type: 'set_directive',
      directive: 'enforce_admin_decree',
    },
  });
  assert.equal(bulkUpdate.allowed, true);
  assert.equal(
    bulkUpdate.updatedRoster.every((e) => e.superAdminDirective === 'enforce_admin_decree'),
    true
  );
});

test('executeOmniverseSuperAdminCommand projects and recalls entire cosmic tiers in the 3D Overworld', () => {
  const deployTier3 = executeOmniverseSuperAdminCommand({
    actorEmail: PRIMARY_ADMIN_EMAIL,
    roster: TOP_100_OMNIVERSE_SPECIES_NPCS,
    command: {
      type: 'project_tier_to_overworld',
      targetTier: 3,
      deploy: true,
    },
  });
  assert.equal(deployTier3.allowed, true);
  const tier3Entries = deployTier3.updatedRoster.filter((e) => e.tier === 3);
  assert.equal(tier3Entries.length, 20);
  assert.equal(
    tier3Entries.every((e) => e.deployedInOverworld),
    true
  );

  const recallTier3 = executeOmniverseSuperAdminCommand({
    actorEmail: PRIMARY_ADMIN_EMAIL,
    roster: deployTier3.updatedRoster,
    command: {
      type: 'project_tier_to_overworld',
      targetTier: 3,
      deploy: false,
    },
  });
  assert.equal(recallTier3.allowed, true);
  assert.equal(
    recallTier3.updatedRoster.filter((e) => e.tier === 3).every((e) => !e.deployedInOverworld),
    true
  );
});

test('projectOmniverseNpcToWorldNPC maps all 5 cosmic tiers to distinct 3D roles, titles, and Super Admin status', () => {
  const tierSamples = [1, 21, 41, 61, 81].map((rank, idx) => {
    const entry = TOP_100_OMNIVERSE_SPECIES_NPCS.find((e) => e.rank === rank)!;
    return projectOmniverseNpcToWorldNPC(entry, idx);
  });

  assert.equal(tierSamples.length, 5);
  for (const npc of tierSamples) {
    assert.equal(npc.level, 1000);
    assert.equal(npc.dialogue.length, 3);
    assert.ok(npc.title.includes('OMNI-'));
    assert.ok(npc.statusActionText?.includes(PRIMARY_ADMIN_EMAIL));
    assert.ok(npc.specialtyBuffDesc?.includes(PRIMARY_ADMIN_EMAIL));
  }
});

test('SIX_LAYER_COSMIC_HIERARCHY and resolveSpeciesSixLayerCosmology define all 6 canonical cosmological layers culminating in The White Page / The House of Ideas (creatergame31@gmail.com)', () => {
  assert.equal(SIX_LAYER_COSMIC_HIERARCHY.length, 6);
  assert.equal(SIX_LAYER_COSMIC_HIERARCHY[0].name, '1. Universe');
  assert.equal(SIX_LAYER_COSMIC_HIERARCHY[1].name, '2. Multiverse');
  assert.equal(SIX_LAYER_COSMIC_HIERARCHY[2].name, '3. Megaverse / Hyperverse');
  assert.equal(SIX_LAYER_COSMIC_HIERARCHY[3].name, '4. Omniverse');
  assert.equal(SIX_LAYER_COSMIC_HIERARCHY[4].name, '5. The Overvoid / Exoverse');
  assert.equal(SIX_LAYER_COSMIC_HIERARCHY[5].name, '6. The White Page / The House of Ideas');
  assert.equal(SIX_LAYER_COSMIC_HIERARCHY[5].sovereignController, PRIMARY_ADMIN_EMAIL);
  assert.ok(SIX_LAYER_COSMIC_HIERARCHY[5].canonicalDefinition.includes('Oblivion'));

  const outerGodsCosmology = resolveSpeciesSixLayerCosmology(TOP_100_OMNIVERSE_SPECIES_NPCS[0]);
  assert.equal(outerGodsCosmology.supremeAuthorEmail, PRIMARY_ADMIN_EMAIL);
  assert.ok(outerGodsCosmology.layer1Universe.includes('Universe'));
  assert.ok(outerGodsCosmology.layer2Multiverse.includes('Multiverse'));
  assert.ok(outerGodsCosmology.layer3MegaverseHyperverse.includes('Megaverse / Hyperverse'));
  assert.ok(outerGodsCosmology.layer4Omniverse.includes('OMNI-001'));
  assert.ok(outerGodsCosmology.layer5OvervoidExoverse.includes('Overvoid / Exoverse'));
  assert.ok(
    outerGodsCosmology.layer6WhitePageHouseOfIdeas.includes('The White Page / The House of Ideas')
  );
  assert.ok(outerGodsCosmology.layer6WhitePageHouseOfIdeas.includes(PRIMARY_ADMIN_EMAIL));
});

test('executeWhitePageAuthorDecree strictly enforces Supreme Author creatergame31@gmail.com across Layer-6 decrees including Oblivion and House of Ideas harvest', () => {
  const unauthorized = executeWhitePageAuthorDecree({
    actorEmail: 'mortal@example.com',
    roster: TOP_100_OMNIVERSE_SPECIES_NPCS,
    decreeType: 'inscribe_creation',
  });
  assert.equal(unauthorized.allowed, false);
  assert.ok(unauthorized.reason.includes(PRIMARY_ADMIN_EMAIL));

  const genesis = executeWhitePageAuthorDecree({
    actorEmail: PRIMARY_ADMIN_EMAIL,
    roster: TOP_100_OMNIVERSE_SPECIES_NPCS,
    decreeType: 'inscribe_creation',
  });
  assert.equal(genesis.allowed, true);
  assert.equal(genesis.tributeDiamondsGranted, 50_000_000n);
  assert.equal(
    genesis.updatedRoster.every((e) => e.superAdminDirective === 'channel_tribute'),
    true
  );

  const oblivion = executeWhitePageAuthorDecree({
    actorEmail: PRIMARY_ADMIN_EMAIL,
    roster: genesis.updatedRoster,
    decreeType: 'invoke_oblivion_reset',
  });
  assert.equal(oblivion.allowed, true);
  assert.equal(oblivion.tributeDiamondsGranted, 77_777_777n);
  assert.equal(oblivion.updatedRoster.filter((e) => e.deployedInOverworld).length, 5);
});

test('6-Tier Nested Cosmological Tree enforces WhitePageRoot singleton, Oblivion + Overvoid spawning, and strict Tier 6 -> Tier 1 nesting', () => {
  const root = resetWhitePageSingletonRoot();
  assert.equal(getWhitePageSingletonRoot(), root);
  assert.equal(root.id, 'THE_WHITE_PAGE');
  assert.equal(root.alias, 'The House of Ideas');
  assert.equal(root.creatorEmail, 'creatergame31@gmail.com');
  assert.equal(root.includesOblivion, true);
  assert.equal(root.oblivionState?.spawnedFrom, 'THE_WHITE_PAGE');

  const summary = validateCosmologicalTreeHierarchy(root);
  assert.equal(summary.valid, true);
  assert.equal(summary.violations.length, 0);
  assert.equal(summary.tierCounts.tier6WhitePageRoot, 1);
  assert.equal(summary.tierCounts.tier5Overvoids, 5);
  assert.equal(summary.tierCounts.tier4Omniverses, 100);
  assert.equal(summary.tierCounts.tier3Megaverses, 100);
  assert.equal(summary.tierCounts.tier2Multiverses, 100);
  assert.equal(summary.tierCounts.tier1Universes, 200);

  const solaraPath = resolveEntityCosmologicalPath(root, SOLARA_PRIME_UNIVERSE_ID);
  assert.equal(solaraPath.found, true);
  assert.deepEqual(solaraPath.breadcrumbIdentifiers, [
    'THE_WHITE_PAGE',
    'EXO-T5-SOLARA-PRIME',
    'OMNI-081',
    'HV-081',
    'MV-081',
    SOLARA_PRIME_UNIVERSE_ID,
  ]);
});

test('Custom logic rules at Tier 5 (Overvoid) and custom physics at Tier 1 (Universe) override standard baseline physics', () => {
  const tree = buildCanonicalWhitePageHierarchyTree();
  const baseProfile = evaluateEffectiveUniversePhysicsAndLogic(tree, SOLARA_PRIME_UNIVERSE_ID);
  assert.equal(baseProfile.universeId, SOLARA_PRIME_UNIVERSE_ID);
  assert.equal(baseProfile.overvoidId, 'EXO-T5-SOLARA-PRIME');
  assert.equal(baseProfile.effectiveSpeedOfLightMps, 299_792_458);

  // Override Tier 5 Overvoid logicSystem and cosmicHierarchyRules
  const afterTier5Override = overrideOvervoidLogicRules({
    root: tree,
    overvoidId: 'EXO-T5-SOLARA-PRIME',
    logicSystem: 'Non-Euclidean Acausal Dao-Tensor Logic',
    alias: 'The Overvoid',
    cosmicHierarchyRulesPatch: {
      realmSuppressionBase: 50,
      qiMultiplierBonus: 4.0,
      spacetimeOverrides: {
        speedOfLightMps: 599_584_916,
      },
    },
    syncSingleton: false,
  });

  // Override Tier 1 Universe spacetimeConfig and matterConstants
  const afterTier1Override = overrideUniversePhysicsConstants({
    root: afterTier5Override,
    universeId: SOLARA_PRIME_UNIVERSE_ID,
    spacetimeConfigPatch: {
      timeDilationFactor: 7.5,
      causalStructure: 'retrocausal_loop_allowed',
    },
    matterConstantsPatch: {
      gravityMultiplier: 3.25,
      qiSpiritDensityMultiplier: 5.0,
    },
    syncSingleton: false,
  });

  const updatedProfile = evaluateEffectiveUniversePhysicsAndLogic(
    afterTier1Override,
    SOLARA_PRIME_UNIVERSE_ID
  );
  assert.equal(updatedProfile.overvoidAlias, 'The Overvoid');
  assert.equal(updatedProfile.effectiveLogicSystem, 'Non-Euclidean Acausal Dao-Tensor Logic');
  assert.equal(updatedProfile.effectiveRealmSuppressionBase, 50);
  assert.equal(updatedProfile.effectiveSpeedOfLightMps, 599_584_916);
  assert.equal(updatedProfile.effectiveTimeDilationFactor, 7.5);
  assert.equal(updatedProfile.effectiveGravityMultiplier, 3.25);
  assert.equal(updatedProfile.effectiveQiMultiplier, 20.0); // 5.0 (Tier 1) * 4.0 (Tier 5)

  // Spawn a new child Universe inside Multiverse MV-081
  const afterSpawn = spawnNestedUniverseInMultiverse({
    root: afterTier1Override,
    multiverseId: 'MV-081',
    newUniverse: {
      id: 'U-081.3-POCKET-REALM',
      name: 'Solara Immortal Pocket Universe U-081.3',
      spacetimeConfig: { speedOfLightMps: 1_000_000_000, timeDilationFactor: 100.0 },
      matterConstants: { gravityMultiplier: 0.5, qiSpiritDensityMultiplier: 25.0 },
    },
    syncSingleton: false,
  });
  const spawnedCheck = validateCosmologicalTreeHierarchy(afterSpawn);
  assert.equal(spawnedCheck.valid, true);
  assert.equal(spawnedCheck.tierCounts.tier1Universes, 201);
});
