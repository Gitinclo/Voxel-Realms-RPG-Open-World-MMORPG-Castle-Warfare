/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SOLARA_PRIME_UNIVERSE_ID,
  buildCanonicalWhitePageHierarchyTree,
  overrideOvervoidLogicRules,
  overrideUniversePhysicsConstants,
  spawnNestedUniverseInMultiverse,
} from './omniverse';
import {
  buildCosmologicalD3HierarchyData,
  computeCosmologicalD3TreeLayout,
} from './cosmologicalTreeD3';

test('buildCosmologicalD3HierarchyData constructs 6-tier tree rooted at THE_WHITE_PAGE down to Universe leaves', () => {
  const root = buildCanonicalWhitePageHierarchyTree();
  const d3Data = buildCosmologicalD3HierarchyData(root, {
    overvoidFilterId: 'ALL',
    maxOmniversesPerOvervoid: 2,
    highlightedUniverseId: SOLARA_PRIME_UNIVERSE_ID,
  });

  assert.equal(d3Data.id, 'THE_WHITE_PAGE');
  assert.equal(d3Data.tier, 6);
  assert.equal(d3Data.kind, 'white_page_root');
  assert.equal(d3Data.cardinalityLabel, '1 (Strict Singleton)');
  assert.ok(Array.isArray(d3Data.children));

  // In compact mode (maxOmniversesPerOvervoid: 2 across 5 sectors = 10 Overvoids) + 1 Oblivion Void node
  const overvoidNodes = d3Data.children!.filter((c) => c.kind === 'overvoid');
  const oblivionNodes = d3Data.children!.filter((c) => c.kind === 'oblivion_void');
  assert.equal(overvoidNodes.length, 10);
  assert.equal(oblivionNodes.length, 1);
  assert.equal(oblivionNodes[0].id, 'OBLIVION_NOTHINGNESS');
  assert.equal(oblivionNodes[0].parentId, 'THE_WHITE_PAGE');

  // In full mode (maxOmniversesPerOvervoid: 20 across 5 sectors), all 100 Overvoids are included
  const fullD3Data = buildCosmologicalD3HierarchyData(root, {
    overvoidFilterId: 'ALL',
    maxOmniversesPerOvervoid: 20,
    highlightedUniverseId: SOLARA_PRIME_UNIVERSE_ID,
  });
  const allOvervoidNodes = fullD3Data.children!.filter((c) => c.kind === 'overvoid');
  assert.equal(allOvervoidNodes.length, 100);
});

test('computeCosmologicalD3TreeLayout computes valid coordinates, depths 0..5, and highlighted path for Solara Prime', () => {
  const root = buildCanonicalWhitePageHierarchyTree();
  const layout = computeCosmologicalD3TreeLayout(root, {
    layoutMode: 'horizontal',
    overvoidFilterId: 'EXO-T5-SOLARA-PRIME',
    maxOmniversesPerOvervoid: 3,
    highlightedUniverseId: SOLARA_PRIME_UNIVERSE_ID,
  });

  assert.equal(layout.rootNode.id, 'THE_WHITE_PAGE');
  assert.equal(layout.rootNode.depth, 0);
  assert.ok(layout.nodes.length > 6);
  assert.equal(layout.links.length, layout.nodes.length - 1);

  // Verify all 6 tiers exist in tierNodeCounts
  assert.equal(layout.tierNodeCounts[6], 1);
  assert.ok(layout.tierNodeCounts[5] >= 1);
  assert.ok(layout.tierNodeCounts[4] >= 1);
  assert.ok(layout.tierNodeCounts[3] >= 1);
  assert.ok(layout.tierNodeCounts[2] >= 1);
  assert.ok(layout.tierNodeCounts[1] >= 2);

  // Verify Solara Prime is at depth 5 (Tier 6=0, Tier 5=1, Tier 4=2, Tier 3=3, Tier 2=4, Tier 1=5)
  const solaraNode = layout.nodes.find((n) => n.id === SOLARA_PRIME_UNIVERSE_ID);
  assert.ok(solaraNode, 'Expected Solara Prime leaf Universe node in D3 layout');
  assert.equal(solaraNode!.depth, 5);
  assert.equal(solaraNode!.data.tier, 1);
  assert.equal(solaraNode!.isOnHighlightedPath, true);

  // Highlighted path should include all 6 tiers from THE_WHITE_PAGE down to SOLARA_PRIME_UNIVERSE_ID
  assert.equal(layout.highlightedPathIds.size, 6);
  assert.ok(layout.highlightedPathIds.has('THE_WHITE_PAGE'));
  assert.ok(layout.highlightedPathIds.has('OVERVOID-081'));
  assert.ok(layout.highlightedPathIds.has('OMNI-081'));
  assert.ok(layout.highlightedPathIds.has('HV-081'));
  assert.ok(layout.highlightedPathIds.has('MV-081'));
  assert.ok(layout.highlightedPathIds.has(SOLARA_PRIME_UNIVERSE_ID));
});

test('computeCosmologicalD3TreeLayout reflects live state mutations (spawned Universe, overrides, radial mode, and node collapse)', () => {
  let root = buildCanonicalWhitePageHierarchyTree();

  // Spawn a 3rd universe under MV-081
  root = spawnNestedUniverseInMultiverse({
    root,
    multiverseId: 'MV-081',
    newUniverse: {
      id: 'U-081.3-D3-TEST',
      name: 'D3 Spawned Continuum U-081.3',
      tier: 1,
      spacetimeConfig: { timeDilationFactor: 7.5 },
      matterConstants: { gravityMultiplier: 4.0, qiSpiritDensityMultiplier: 6.0 },
    },
    syncSingleton: false,
  });

  root = overrideOvervoidLogicRules({
    root,
    overvoidId: 'OVERVOID-081',
    logicSystem: 'D3 Custom Quantum Logic',
    cosmicHierarchyRulesPatch: { qiMultiplierBonus: 3.0 },
    syncSingleton: false,
  });

  root = overrideUniversePhysicsConstants({
    root,
    universeId: 'U-081.3-D3-TEST',
    matterConstantsPatch: { gravityMultiplier: 9.5 },
    syncSingleton: false,
  });

  const radialLayout = computeCosmologicalD3TreeLayout(root, {
    layoutMode: 'radial',
    overvoidFilterId: 'EXO-T5-SOLARA-PRIME',
    maxOmniversesPerOvervoid: 2,
    highlightedUniverseId: 'U-081.3-D3-TEST',
  });

  const spawnedNode = radialLayout.nodes.find((n) => n.id === 'U-081.3-D3-TEST');
  assert.ok(spawnedNode, 'Spawned child universe should appear in radial D3 tree');
  assert.equal(spawnedNode!.parentId, 'MV-081');
  assert.equal(spawnedNode!.data.hasCustomOverride, true);
  assert.ok(spawnedNode!.data.badgeText.includes('9.5G'));

  // Collapsing MV-081 hides its child Universe leaf nodes
  const collapsedLayout = computeCosmologicalD3TreeLayout(root, {
    layoutMode: 'horizontal',
    overvoidFilterId: 'EXO-T5-SOLARA-PRIME',
    maxOmniversesPerOvervoid: 2,
    collapsedNodeIds: new Set(['MV-081']),
  });
  const mv081Node = collapsedLayout.nodes.find((n) => n.id === 'MV-081');
  assert.ok(mv081Node);
  assert.equal(mv081Node!.data.isCollapsed, true);
  assert.equal(mv081Node!.data.hiddenChildCount, 3);
  assert.equal(
    collapsedLayout.nodes.some((n) => n.id === 'U-081.3-D3-TEST'),
    false
  );
});
