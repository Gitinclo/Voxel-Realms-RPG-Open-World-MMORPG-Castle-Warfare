/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LORE_HISTORICAL_EPOCHS,
  LORE_COMPENDIUM_CHAPTERS,
  OPEN_WORLD_BIOME_CODEX_CATALOG,
  OPEN_WORLD_MONSTER_CODEX_CATALOG,
  GOOGOL_LORE_ARCHIVE_SPEC,
  GOOGOL_LORE_WORD_EXPONENT,
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

test('LORE_HISTORICAL_EPOCHS defines all 7 chronological epochs from Pre-Genesis White Page (creatergame31@gmail.com) to 06/11/2026 Architect Convergence', () => {
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
    assert.ok(epoch.chronicleScrollText.length >= 4);
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

  // Origin (0,0) resolves to Solara Imperial Citadel Sanctum
  const originBiome = resolveBiomeAtWorldPosition(0, 0);
  assert.equal(originBiome.id, 'codex_biome_solara_citadel_sanctum');

  // Moving to (20, 18) enters Scorched Magma Caldera and approaches Infernal Magma Drake (28, 22)
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

  // Claiming a discovered codex entry grants Diamonds and Scripture Fragments once
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

  // Dynamic spawned monster builds and unlocks cleanly
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

test('Googol-Scale (10^100 Words Minimum) Procedural Akashic Lore Archive synthesizes deterministic multi-paragraph volumes across exponent tiers 0..100', () => {
  assert.equal(GOOGOL_LORE_WORD_EXPONENT, 100);
  assert.equal(GOOGOL_LORE_ARCHIVE_SPEC.minimumWordCountScientific, '10^100');
  assert.equal(GOOGOL_LORE_ARCHIVE_SPEC.authorEmail, PRIMARY_ADMIN_EMAIL);

  const slice100 = generateGoogolScaleLoreScrollSlice({
    exponentTier: 100,
    scrollOffset: 1,
    sliceCount: 3,
  });
  assert.equal(slice100.length, 3);
  for (const scroll of slice100) {
    assert.equal(scroll.exponentTier, 100);
    assert.equal(scroll.paragraphs.length, 3);
    assert.equal(scroll.modeledVolumeWordCount, 1000);
    assert.ok(scroll.volumeCoordinateLabel.includes('10^100'));
  }
});

test('searchLoreHistory filters epochs, compendium chapters, and Lore Codex entries by keyword or Supreme Author email', () => {
  const dragonSearch = searchLoreHistory('Drake', INITIAL_MONSTERS);
  assert.ok(dragonSearch.matchingCodexEntries.length >= 1);

  const authorSearch = searchLoreHistory(PRIMARY_ADMIN_EMAIL, INITIAL_MONSTERS);
  assert.ok(authorSearch.matchingEpochs.length >= 4);
  assert.ok(authorSearch.matchingCodexEntries.length >= 1);

  const emptySearch = searchLoreHistory('   ', INITIAL_MONSTERS);
  assert.equal(emptySearch.matchingEpochs.length, 7);
  assert.equal(emptySearch.matchingChapters.length, 6);
  assert.equal(emptySearch.matchingCodexEntries.length, 14);
});
