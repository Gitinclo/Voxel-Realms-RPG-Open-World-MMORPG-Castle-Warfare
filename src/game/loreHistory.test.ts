/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LORE_HISTORICAL_EPOCHS,
  LORE_COMPENDIUM_CHAPTERS,
  comprehendLoreEpoch,
  searchLoreHistory,
} from './loreHistory';
import { PRIMARY_ADMIN_EMAIL } from './adminModeration';

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
    assert.ok(epoch.chronicleScrollText.length >= 3);
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

test('searchLoreHistory filters epochs and compendium chapters by keyword or Supreme Author email', () => {
  const oblivionSearch = searchLoreHistory('Oblivion');
  assert.ok(oblivionSearch.matchingEpochs.length >= 1);
  assert.ok(oblivionSearch.matchingChapters.length >= 1);

  const authorSearch = searchLoreHistory(PRIMARY_ADMIN_EMAIL);
  assert.ok(authorSearch.matchingEpochs.length >= 4);

  const emptySearch = searchLoreHistory('   ');
  assert.equal(emptySearch.matchingEpochs.length, 7);
  assert.equal(emptySearch.matchingChapters.length, 6);
});
