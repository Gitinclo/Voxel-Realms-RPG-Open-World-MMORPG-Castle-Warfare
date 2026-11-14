/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LORE_HISTORICAL_EPOCHS,
  LORE_COMPENDIUM_CHAPTERS,
  LORE_DYNASTIC_ANNALS,
  OPEN_WORLD_BIOME_CODEX_CATALOG,
  OPEN_WORLD_MONSTER_CODEX_CATALOG,
  GOOGOL_LORE_ARCHIVE_SPEC,
  GOOGOL_LORE_WORD_EXPONENT,
  GOOGOL_INTEGER_DECIMAL,
  GOOGOL_MAX_VOLUME_INDEX,
  INITIAL_LORE_CODEX_STATE,
  comprehendLoreEpoch,
  searchLoreHistory,
  resolveBiomeAtWorldPosition,
  evaluateOpenWorldLoreDiscovery,
  unlockLoreCodexEntry,
  claimLoreCodexReward,
  generateGoogolScaleLoreScrollSlice,
  buildDynamicMonsterCodexEntry,
} from './loreHistory';
import { PRIMARY_ADMIN_EMAIL } from './adminModeration';
import { INITIAL_MONSTERS } from './initialData';

test('LORE_HISTORICAL_EPOCHS defines all 7 chronological epochs with expanded 6+ section chronicles from White Page to 06/11/2026 Architect Convergence', () => {
  assert.equal(LORE_HISTORICAL_EPOCHS.length, 7);
  assert.equal(LORE_HISTORICAL_EPOCHS[0].epochNumber, 0);
  assert.ok(LORE_HISTORICAL_EPOCHS[0].title.includes('The White Page'));
  assert.ok(LORE_HISTORICAL_EPOCHS[0].summary.includes(PRIMARY_ADMIN_EMAIL));
  assert.ok(LORE_HISTORICAL_EPOCHS[0].summary.includes('Oblivion'));

  assert.equal(LORE_HISTORICAL_EPOCHS[6].epochNumber, 6);
  assert.ok(LORE_HISTORICAL_EPOCHS[6].title.includes('06/11/2026'));

  for (const epoch of LORE_HISTORICAL_EPOCHS) {
    assert.ok(epoch.comprehensionRewardDiamonds > 0n);
    assert.ok(epoch.comprehensionRewardFragments > 0);
    assert.ok(epoch.chronicleScrollText.length >= 6);
  }
});

test('LORE_DYNASTIC_ANNALS defines 12 Imperial Dynastic Annals & Legendary Artifact Histories across all 6 Cosmic Layers', () => {
  assert.equal(LORE_DYNASTIC_ANNALS.length, 12);
  for (const annal of LORE_DYNASTIC_ANNALS) {
    assert.ok(annal.title.length > 0);
    assert.ok(annal.fullTextParagraphs.length >= 2);
    assert.ok(annal.relatedKeywords.length >= 3);
  }
});

test('LORE_COMPENDIUM_CHAPTERS covers all 6 lore pillars including 6-Layer Cosmology, 100 Omniversal Species, and 10 Playable Bloodlines', () => {
  assert.equal(LORE_COMPENDIUM_CHAPTERS.length, 6);
  const categories = new Set(LORE_COMPENDIUM_CHAPTERS.map((c) => c.category));
  assert.equal(categories.has('cosmology'), true);
  assert.equal(categories.has('omniverse_envoys'), true);
  assert.equal(categories.has('playable_species'), true);
  assert.equal(categories.has('cultivation_dao'), true);
  assert.equal(categories.has('citadel_warfare'), true);
  assert.equal(categories.has('architect_convergence'), true);

  const cosmologyChapter = LORE_COMPENDIUM_CHAPTERS.find((c) => c.category === 'cosmology')!;
  assert.equal(cosmologyChapter.keyTenets.length, 6);
  assert.equal(cosmologyChapter.inscribedBy, PRIMARY_ADMIN_EMAIL);
});

test('comprehendLoreEpoch grants one-time Diamond and Scripture Fragment rewards and blocks duplicate claims', () => {
  const firstClaim = comprehendLoreEpoch({
    epochId: 'epoch_0_white_page_genesis',
    comprehendedEpochIds: [],
  });
  assert.equal(firstClaim.newlyComprehended, true);
  assert.equal(firstClaim.rewardDiamonds, 250_000n);
  assert.equal(firstClaim.rewardFragments, 30);
  assert.deepEqual(firstClaim.updatedComprehendedIds, ['epoch_0_white_page_genesis']);

  const duplicateClaim = comprehendLoreEpoch({
    epochId: 'epoch_0_white_page_genesis',
    comprehendedEpochIds: firstClaim.updatedComprehendedIds,
  });
  assert.equal(duplicateClaim.newlyComprehended, false);
  assert.equal(duplicateClaim.rewardDiamonds, 0n);
  assert.equal(duplicateClaim.rewardFragments, 0);
});

test('Lore Codex auto-populates entries when discovering monsters or visiting biomes in the open world', () => {
  assert.equal(OPEN_WORLD_BIOME_CODEX_CATALOG.length, 8);
  assert.equal(OPEN_WORLD_MONSTER_CODEX_CATALOG.length, 6);

  const originBiome = resolveBiomeAtWorldPosition(0, 0);
  assert.equal(originBiome.id, 'codex_biome_solara_citadel_sanctum');

  const discovery = evaluateOpenWorldLoreDiscovery({
    currentState: INITIAL_LORE_CODEX_STATE,
    playerX: 20,
    playerZ: 18,
    monsters: INITIAL_MONSTERS,
    monsterProximityRadius: 16,
  });

  const discoveredIds = discovery.newlyDiscoveredEntries.map((e) => e.id);
  assert.ok(discoveredIds.includes('codex_biome_scorched_magma_caldera'));
  assert.ok(discoveredIds.includes('codex_monster_m_drake_240'));
  assert.equal(discovery.updatedState.lastVisitedBiomeId, 'codex_biome_scorched_magma_caldera');

  const claim1 = claimLoreCodexReward({
    currentState: discovery.updatedState,
    entryId: 'codex_biome_scorched_magma_caldera',
    monsters: INITIAL_MONSTERS,
  });
  assert.equal(claim1.claimed, true);
  assert.ok(claim1.rewardDiamonds > 0n);
  assert.ok(claim1.rewardFragments > 0);

  const claim2 = claimLoreCodexReward({
    currentState: claim1.updatedState,
    entryId: 'codex_biome_scorched_magma_caldera',
    monsters: INITIAL_MONSTERS,
  });
  assert.equal(claim2.claimed, false);
  assert.equal(claim2.rewardDiamonds, 0n);

  const dynamicEntry = buildDynamicMonsterCodexEntry({
    id: 'm_custom_999',
    name: 'Void Star Behemoth',
    level: 850,
    hp: 5_000_000n,
    maxHp: 5_000_000n,
    attack: 120_000n,
    defense: 90_000n,
    tier: 'boss',
    complexityBracket: 'bracket_4_abyssal',
    x: 20,
    z: 20,
    homeX: 20,
    homeZ: 20,
    expReward: 500_000n,
    dropResources: { wood: 1000n, steel: 1000n, diamond: 5000n },
    aggroRadius: 18,
    movementPolicy: 'flanking_orbiter',
    aiState: 'patrolling',
    activeAttackPatternId: 'atk_void_implosion',
    telegraphProgress: 0,
    pathWaypoints: [],
    activeEnvInteraction: 'Leyline Singularity',
  });
  const unlockedDynamic = unlockLoreCodexEntry({
    currentState: claim1.updatedState,
    entry: dynamicEntry,
    discoveredVia: 'monster_encounter',
  });
  assert.equal(unlockedDynamic.newlyDiscovered, true);
  assert.ok(Boolean(unlockedDynamic.updatedState.discoveredRecords['codex_monster_m_custom_999']));
});

test('Googol-Scale (10^100 Words Minimum) Procedural Akashic Lore Archive synthesizes >= 1,000 real words per volume across 10^97 BigInt coordinates', () => {
  assert.equal(GOOGOL_LORE_WORD_EXPONENT, 100);
  assert.equal(GOOGOL_INTEGER_DECIMAL.length, 101);
  assert.equal(GOOGOL_MAX_VOLUME_INDEX, 10n ** 97n);
  assert.equal(GOOGOL_LORE_ARCHIVE_SPEC.minimumWordCountScientific, '10^100');
  assert.equal(GOOGOL_LORE_ARCHIVE_SPEC.authorEmail, PRIMARY_ADMIN_EMAIL);

  const sliceStart = generateGoogolScaleLoreScrollSlice({
    exponentTier: 100,
    scrollOffset: 1n,
    sliceCount: 3,
  });
  assert.equal(sliceStart.length, 3);
  for (const scroll of sliceStart) {
    assert.equal(scroll.exponentTier, 100);
    assert.equal(scroll.paragraphs.length, 7);
    assert.ok(
      scroll.actualWordCount >= 1000,
      `Expected >= 1000 real words, got ${scroll.actualWordCount}`
    );
    assert.ok(scroll.volumeCoordinateLabel.includes('10^100'));
  }

  // Test jumping directly to the 10^97th volume (reaching the 10^100-th word horizon)
  const sliceHorizon = generateGoogolScaleLoreScrollSlice({
    exponentTier: 100,
    scrollOffset: GOOGOL_MAX_VOLUME_INDEX,
    sliceCount: 1,
  });
  assert.equal(sliceHorizon.length, 1);
  assert.equal(sliceHorizon[0].volumeIndexString, GOOGOL_MAX_VOLUME_INDEX.toString());
  assert.ok(sliceHorizon[0].actualWordCount >= 1000);
});

test('searchLoreHistory filters epochs, compendium chapters, 12 Dynastic Annals, and Lore Codex entries', () => {
  const dragonSearch = searchLoreHistory('Drake', INITIAL_MONSTERS);
  assert.ok(dragonSearch.matchingCodexEntries.length >= 1);
  assert.ok(dragonSearch.matchingAnnals.length >= 1);

  const authorSearch = searchLoreHistory(PRIMARY_ADMIN_EMAIL, INITIAL_MONSTERS);
  assert.ok(authorSearch.matchingEpochs.length >= 4);
  assert.ok(authorSearch.matchingCodexEntries.length >= 1);
  assert.ok(authorSearch.matchingAnnals.length >= 3);

  const emptySearch = searchLoreHistory('   ', INITIAL_MONSTERS);
  assert.equal(emptySearch.matchingEpochs.length, 7);
  assert.equal(emptySearch.matchingChapters.length, 6);
  assert.equal(emptySearch.matchingCodexEntries.length, 14);
  assert.equal(emptySearch.matchingAnnals.length, 12);
});
