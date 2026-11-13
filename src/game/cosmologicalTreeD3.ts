/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as d3 from 'd3';
import {
  COSMIC_LIMITS,
  Megaverse,
  Multiverse,
  OblivionDomainState,
  Omniverse,
  Overvoid,
  Universe,
  WhitePageRoot,
} from '../types/game';
import {
  EffectiveCosmologicalPhysicsProfile,
  SOLARA_PRIME_UNIVERSE_ID,
  STANDARD_OVERVOID_COSMIC_RULES,
  STANDARD_UNIVERSE_MATTER_CONSTANTS,
  STANDARD_UNIVERSE_SPACETIME_CONFIG,
  evaluateEffectiveUniversePhysicsAndLogic,
  getWhitePageSingletonRoot,
  overvoidMatchesIdentifier,
} from './omniverse';

export type CosmologicalNodeTier = 6 | 5 | 4 | 3 | 2 | 1 | 0; // 0 represents Oblivion (Non-Existence spawned from Tier 6)

export type CosmologicalNodeKind =
  | 'white_page_root'
  | 'oblivion_void'
  | 'overvoid'
  | 'omniverse'
  | 'megaverse'
  | 'multiverse'
  | 'universe';

export interface CosmologicalD3NodeDatum {
  id: string;
  name: string;
  shortLabel: string;
  tier: CosmologicalNodeTier;
  tierLabel: string;
  kind: CosmologicalNodeKind;
  alias?: string;
  parentId: string | null;
  hasCustomOverride: boolean;
  badgeText: string;
  subtitle: string;
  cardinalityLabel: string;
  generatorSeed?: string;
  totalDescendantUniverses: number;
  isCollapsed?: boolean;
  hiddenChildCount?: number;
  representativeUniverseId?: string;
  metadata: Record<string, unknown>;
  children?: CosmologicalD3NodeDatum[];
}

export interface CosmologicalD3BuildOptions {
  /** Filter to a specific Tier 5 Overvoid ID or sector group ID ('EXO-T1-APEX'..'EXO-T5-SOLARA-PRIME'), or 'ALL'. */
  overvoidFilterId?: string | 'ALL';
  /** Maximum number of Overvoids per sector / Omniverses per Overvoid to expand when in compact mode. */
  maxOmniversesPerOvervoid?: number;
  /** Optional search string to match against Universe, Multiverse, Megaverse, Omniverse, or Overvoid names/IDs. */
  searchQuery?: string;
  /** Set of node IDs whose children are collapsed in the interactive tree. */
  collapsedNodeIds?: ReadonlySet<string>;
  /** Always keep the lineage path of this Universe ID expanded and visible. */
  highlightedUniverseId?: string;
}

export interface PositionedCosmologicalD3Node {
  id: string;
  data: CosmologicalD3NodeDatum;
  depth: number;
  height: number;
  x: number;
  y: number;
  parentId: string | null;
  isOnHighlightedPath: boolean;
}

export interface PositionedCosmologicalD3Link {
  id: string;
  sourceId: string;
  targetId: string;
  sourceTier: CosmologicalNodeTier;
  targetTier: CosmologicalNodeTier;
  source: { x: number; y: number };
  target: { x: number; y: number };
  isOnHighlightedPath: boolean;
}

export interface CosmologicalD3LayoutResult {
  rootNode: PositionedCosmologicalD3Node;
  nodes: PositionedCosmologicalD3Node[];
  links: PositionedCosmologicalD3Link[];
  highlightedPathIds: Set<string>;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
  tierNodeCounts: Record<CosmologicalNodeTier, number>;
}

const IGNORED_RULE_METADATA_KEYS = new Set([
  'sectorGroupId',
  'sectorGroupName',
  'overvoidIndex',
  'speciesRank',
  'speciesName',
]);

function hasCustomTier5Overrides(overvoid: Overvoid): boolean {
  return Object.keys(overvoid.cosmicHierarchyRules).some(
    (k) =>
      !IGNORED_RULE_METADATA_KEYS.has(k) &&
      overvoid.cosmicHierarchyRules[k] !== STANDARD_OVERVOID_COSMIC_RULES[k]
  );
}

function hasCustomTier1Overrides(universe: Universe): boolean {
  const customSpacetime = Object.keys(universe.spacetimeConfig).some(
    (k) => universe.spacetimeConfig[k] !== STANDARD_UNIVERSE_SPACETIME_CONFIG[k]
  );
  const customMatter = Object.keys(universe.matterConstants).some(
    (k) => universe.matterConstants[k] !== STANDARD_UNIVERSE_MATTER_CONSTANTS[k]
  );
  return customSpacetime || customMatter;
}

function buildUniverseDatum(
  universe: Universe,
  parentMultiverseId: string,
  root: WhitePageRoot
): CosmologicalD3NodeDatum {
  const effective: EffectiveCosmologicalPhysicsProfile = evaluateEffectiveUniversePhysicsAndLogic(
    root,
    universe.id
  );
  const shortName =
    universe.name.length > 34 ? `${universe.name.slice(0, 32).trim()}…` : universe.name;

  return {
    id: universe.id,
    name: universe.name,
    shortLabel: `${universe.id}`,
    tier: 1,
    tierLabel: 'Tier 1: Universe (∞)',
    kind: 'universe',
    parentId: parentMultiverseId,
    hasCustomOverride: hasCustomTier1Overrides(universe),
    badgeText: `${effective.effectiveQiMultiplier}x Qi · ${effective.effectiveGravityMultiplier}G`,
    subtitle: shortName,
    cardinalityLabel: '∞ (Unbounded)',
    totalDescendantUniverses: 1,
    representativeUniverseId: universe.id,
    metadata: {
      tier: 1,
      cardinality: 'Infinity',
      spacetimeConfig: universe.spacetimeConfig,
      matterConstants: universe.matterConstants,
      effectiveQiMultiplier: effective.effectiveQiMultiplier,
      effectiveGravityMultiplier: effective.effectiveGravityMultiplier,
      effectiveTimeDilationFactor: effective.effectiveTimeDilationFactor,
      effectiveSpeedOfLightMps: effective.effectiveSpeedOfLightMps,
    },
  };
}

function buildMultiverseDatum(
  multiverse: Multiverse,
  parentMegaverseId: string,
  root: WhitePageRoot,
  collapsedNodeIds: ReadonlySet<string>
): CosmologicalD3NodeDatum {
  const isCollapsed = collapsedNodeIds.has(multiverse.id);
  const loadedUniverses = multiverse.universes.loadedNodes;
  const childUniverses = loadedUniverses.map((u) => buildUniverseDatum(u, multiverse.id, root));

  return {
    id: multiverse.id,
    name: multiverse.name,
    shortLabel: `${multiverse.id} (${multiverse.topology})`,
    tier: 2,
    tierLabel: 'Tier 2: Multiverse (∞)',
    kind: 'multiverse',
    parentId: parentMegaverseId,
    hasCustomOverride: false,
    badgeText: `${multiverse.topology.toUpperCase()} · ${loadedUniverses.length}/∞ Univ`,
    subtitle: multiverse.name,
    cardinalityLabel: '∞ (Lazy Stream)',
    generatorSeed: multiverse.universes.generatorSeed,
    totalDescendantUniverses: loadedUniverses.length,
    isCollapsed,
    hiddenChildCount: isCollapsed ? childUniverses.length : 0,
    representativeUniverseId: loadedUniverses[0]?.id,
    metadata: {
      tier: 2,
      cardinality: 'Infinity',
      topology: multiverse.topology,
      generatorSeed: multiverse.universes.generatorSeed,
      loadedUniverseCount: loadedUniverses.length,
    },
    children: isCollapsed ? [] : childUniverses,
  };
}

function buildMegaverseDatum(
  megaverse: Megaverse,
  parentOmniverseId: string,
  root: WhitePageRoot,
  collapsedNodeIds: ReadonlySet<string>
): CosmologicalD3NodeDatum {
  const isCollapsed = collapsedNodeIds.has(megaverse.id);
  const loadedMultiverses = megaverse.multiverses.loadedNodes;
  const childMultiverses = loadedMultiverses.map((mv) =>
    buildMultiverseDatum(mv, megaverse.id, root, collapsedNodeIds)
  );
  const totalUniverses = loadedMultiverses.reduce(
    (sum, mv) => sum + mv.universes.loadedNodes.length,
    0
  );
  const firstUnivId = loadedMultiverses[0]?.universes.loadedNodes[0]?.id;

  return {
    id: megaverse.id,
    name: megaverse.name,
    shortLabel: `${megaverse.id} [${megaverse.alias}]`,
    tier: 3,
    tierLabel: `Tier 3: ${megaverse.alias} (∞)`,
    kind: 'megaverse',
    alias: megaverse.alias,
    parentId: parentOmniverseId,
    hasCustomOverride: false,
    badgeText: `${megaverse.alias} · ${loadedMultiverses.length}/∞ MV`,
    subtitle: megaverse.name,
    cardinalityLabel: '∞ (Lazy Stream)',
    generatorSeed: megaverse.multiverses.generatorSeed,
    totalDescendantUniverses: totalUniverses,
    isCollapsed,
    hiddenChildCount: isCollapsed ? childMultiverses.length : 0,
    representativeUniverseId: firstUnivId,
    metadata: {
      tier: 3,
      cardinality: 'Infinity',
      alias: megaverse.alias,
      generatorSeed: megaverse.multiverses.generatorSeed,
      loadedMultiverseCount: loadedMultiverses.length,
      totalLoadedUniverses: totalUniverses,
    },
    children: isCollapsed ? [] : childMultiverses,
  };
}

function buildOmniverseDatum(
  omniverse: Omniverse,
  parentOvervoidId: string,
  root: WhitePageRoot,
  collapsedNodeIds: ReadonlySet<string>
): CosmologicalD3NodeDatum {
  const isCollapsed = collapsedNodeIds.has(omniverse.id);
  const loadedMegaverses = omniverse.megaverses.loadedNodes;
  const childMegaverses = loadedMegaverses.map((mg) =>
    buildMegaverseDatum(mg, omniverse.id, root, collapsedNodeIds)
  );
  const totalUniverses = loadedMegaverses.reduce(
    (sum, mg) =>
      sum + mg.multiverses.loadedNodes.reduce((s2, mv) => s2 + mv.universes.loadedNodes.length, 0),
    0
  );
  const firstUnivId = loadedMegaverses[0]?.multiverses.loadedNodes[0]?.universes.loadedNodes[0]?.id;

  return {
    id: omniverse.id,
    name: omniverse.name,
    shortLabel: `${omniverse.id} (${omniverse.temporalScope})`,
    tier: 4,
    tierLabel: 'Tier 4: Omniverse (∞)',
    kind: 'omniverse',
    parentId: parentOvervoidId,
    hasCustomOverride: false,
    badgeText: `Scope: ${omniverse.temporalScope.toUpperCase()} · ${loadedMegaverses.length}/∞ HV`,
    subtitle: omniverse.name,
    cardinalityLabel: '∞ (Lazy Stream)',
    generatorSeed: omniverse.megaverses.generatorSeed,
    totalDescendantUniverses: totalUniverses,
    isCollapsed,
    hiddenChildCount: isCollapsed ? childMegaverses.length : 0,
    representativeUniverseId: firstUnivId,
    metadata: {
      tier: 4,
      cardinality: 'Infinity',
      temporalScope: omniverse.temporalScope,
      generatorSeed: omniverse.megaverses.generatorSeed,
      loadedMegaverseCount: loadedMegaverses.length,
      totalLoadedUniverses: totalUniverses,
    },
    children: isCollapsed ? [] : childMegaverses,
  };
}

function omniverseMatchesSearch(omniverse: Omniverse, queryLower: string): boolean {
  if (!queryLower) return true;
  if (
    omniverse.id.toLowerCase().includes(queryLower) ||
    omniverse.name.toLowerCase().includes(queryLower)
  ) {
    return true;
  }
  for (const mg of omniverse.megaverses.loadedNodes) {
    if (mg.id.toLowerCase().includes(queryLower) || mg.name.toLowerCase().includes(queryLower)) {
      return true;
    }
    for (const mv of mg.multiverses.loadedNodes) {
      if (mv.id.toLowerCase().includes(queryLower) || mv.name.toLowerCase().includes(queryLower)) {
        return true;
      }
      for (const u of mv.universes.loadedNodes) {
        if (u.id.toLowerCase().includes(queryLower) || u.name.toLowerCase().includes(queryLower)) {
          return true;
        }
      }
    }
  }
  return false;
}

function omniverseContainsUniverse(omniverse: Omniverse, targetUniverseId: string): boolean {
  for (const mg of omniverse.megaverses.loadedNodes) {
    for (const mv of mg.multiverses.loadedNodes) {
      for (const u of mv.universes.loadedNodes) {
        if (u.id === targetUniverseId) return true;
      }
    }
  }
  return false;
}

function overvoidContainsUniverse(overvoid: Overvoid, targetUniverseId: string): boolean {
  for (const omni of overvoid.omniverses.loadedNodes) {
    if (omniverseContainsUniverse(omni, targetUniverseId)) return true;
  }
  return false;
}

function buildOblivionDatum(
  oblivion: OblivionDomainState | undefined,
  rootId: string
): CosmologicalD3NodeDatum {
  const state: OblivionDomainState = oblivion ?? {
    id: 'OBLIVION_NOTHINGNESS',
    name: 'Absolute Nothingness (Oblivion / Pre-Existential Void)',
    spawnedFrom: 'THE_WHITE_PAGE',
    entropyVoidRatio: 0.12,
    active: true,
    exists: true,
    description: 'Absolute nothingness originating from The White Page',
  };

  return {
    id: state.id,
    name: state.name,
    shortLabel: `${state.id} (Nothingness)`,
    tier: 0,
    tierLabel: 'Oblivion (Non-Existence)',
    kind: 'oblivion_void',
    alias: 'Oblivion',
    parentId: rootId,
    hasCustomOverride: false,
    badgeText: `Exists: ${String(state.exists)} · Entropy: ${state.entropyVoidRatio}`,
    subtitle: state.description,
    cardinalityLabel: 'Originating Void',
    totalDescendantUniverses: 0,
    metadata: {
      spawnedFrom: state.spawnedFrom,
      entropyVoidRatio: state.entropyVoidRatio,
      active: state.active,
      exists: state.exists,
      description: state.description,
    },
    children: [],
  };
}

/**
 * Converts the 6-tier `WhitePageRoot` state into a hierarchical `CosmologicalD3NodeDatum` tree
 * ready for `d3.hierarchy()`.
 * Respects `COSMIC_LIMITS`:
 * - Tier 6: 1 Singleton (`THE_WHITE_PAGE`)
 * - Tier 5: 100 Bounded Overvoids (`OVERVOID-001`..`OVERVOID-100`), sliced according to `maxOmniversesPerOvervoid`
 * - Tiers 4..1: `InfiniteCollection` lazy streams (`loadedNodes` out of `Infinity`)
 */
export function buildCosmologicalD3HierarchyData(
  root: WhitePageRoot = getWhitePageSingletonRoot(),
  options: CosmologicalD3BuildOptions = {}
): CosmologicalD3NodeDatum {
  const overvoidFilterId = options.overvoidFilterId ?? 'ALL';
  const maxSlicePerSector = options.maxOmniversesPerOvervoid ?? 3;
  const searchQueryLower = (options.searchQuery ?? '').trim().toLowerCase();
  const collapsedNodeIds = options.collapsedNodeIds ?? new Set<string>();
  const highlightedUniverseId = options.highlightedUniverseId ?? SOLARA_PRIME_UNIVERSE_ID;

  const allOvervoids = root.overvoids ?? root.exonverses ?? [];
  const matchingFilterOvervoids = allOvervoids.filter((ov) =>
    overvoidFilterId === 'ALL' ? true : overvoidMatchesIdentifier(ov, overvoidFilterId)
  );

  // Slice Overvoids per sector so compact mode stays clean while "All 100" expands all 100 Overvoids
  const sectorCounts = new Map<string, number>();
  const slicedOvervoids: Overvoid[] = [];

  for (const ov of matchingFilterOvervoids) {
    const matchesSearch =
      !searchQueryLower ||
      ov.id.toLowerCase().includes(searchQueryLower) ||
      ov.name.toLowerCase().includes(searchQueryLower) ||
      ov.omniverses.loadedNodes.some((omni) => omniverseMatchesSearch(omni, searchQueryLower));

    const containsHighlighted = overvoidContainsUniverse(ov, highlightedUniverseId);
    if (!matchesSearch && !containsHighlighted) {
      continue;
    }

    const sectorKey = String(ov.cosmicHierarchyRules?.sectorGroupId ?? 'DEFAULT');
    const currentSectorCount = sectorCounts.get(sectorKey) ?? 0;

    if (searchQueryLower || currentSectorCount < maxSlicePerSector || containsHighlighted) {
      slicedOvervoids.push(ov);
      sectorCounts.set(sectorKey, currentSectorCount + 1);
    }
  }

  const overvoidChildren: CosmologicalD3NodeDatum[] = [];

  for (const overvoid of slicedOvervoids) {
    const isCollapsed = collapsedNodeIds.has(overvoid.id);
    const loadedOmnis = overvoid.omniverses.loadedNodes;
    const matchingOmniverses = loadedOmnis.filter(
      (omni) =>
        omniverseMatchesSearch(omni, searchQueryLower) ||
        omniverseContainsUniverse(omni, highlightedUniverseId)
    );

    const slicedOmniverses = matchingOmniverses.slice(
      0,
      Math.max(1, maxSlicePerSector, matchingOmniverses.length)
    );

    const childOmniverses = slicedOmniverses.map((omni) =>
      buildOmniverseDatum(omni, overvoid.id, root, collapsedNodeIds)
    );

    const totalOvervoidUniverses = loadedOmnis.reduce(
      (sum, omni) =>
        sum +
        omni.megaverses.loadedNodes.reduce(
          (s2, mg) =>
            s2 +
            mg.multiverses.loadedNodes.reduce((s3, mv) => s3 + mv.universes.loadedNodes.length, 0),
          0
        ),
      0
    );

    const firstUnivId =
      slicedOmniverses[0]?.megaverses.loadedNodes[0]?.multiverses.loadedNodes[0]?.universes
        .loadedNodes[0]?.id ??
      loadedOmnis[0]?.megaverses.loadedNodes[0]?.multiverses.loadedNodes[0]?.universes
        .loadedNodes[0]?.id;

    overvoidChildren.push({
      id: overvoid.id,
      name: overvoid.name,
      shortLabel: `${overvoid.id} [#${overvoid.index}/100]`,
      tier: 5,
      tierLabel: `Tier 5: ${overvoid.alias} (#${overvoid.index}/100)`,
      kind: 'overvoid',
      alias: overvoid.alias,
      parentId: root.id,
      hasCustomOverride: hasCustomTier5Overrides(overvoid),
      badgeText: `${overvoid.alias} #${overvoid.index}/100 · ${loadedOmnis.length}/∞ Omni`,
      subtitle: overvoid.logicSystem,
      cardinalityLabel: `${overvoid.index} of ${COSMIC_LIMITS.OVERVOID_MAX_COUNT} (Bounded Cap)`,
      generatorSeed: overvoid.omniverses.generatorSeed,
      totalDescendantUniverses: totalOvervoidUniverses,
      isCollapsed,
      hiddenChildCount: isCollapsed ? loadedOmnis.length : 0,
      representativeUniverseId: firstUnivId,
      metadata: {
        tier: 5,
        index: overvoid.index,
        maxCount: COSMIC_LIMITS.OVERVOID_MAX_COUNT,
        alias: overvoid.alias,
        logicSystem: overvoid.logicSystem,
        cosmicHierarchyRules: overvoid.cosmicHierarchyRules,
        generatorSeed: overvoid.omniverses.generatorSeed,
        loadedOmniverses: loadedOmnis.length,
        omniverseTotalCount: 'Infinity',
      },
      children: isCollapsed ? [] : childOmniverses,
    });
  }

  const rootChildren: CosmologicalD3NodeDatum[] = [...overvoidChildren];
  if (root.oblivionState?.exists === true) {
    rootChildren.push(buildOblivionDatum(root.oblivionState, root.id));
  }

  const totalRootUniverses = allOvervoids.reduce(
    (sum, ov) =>
      sum +
      ov.omniverses.loadedNodes.reduce(
        (s1, omni) =>
          s1 +
          omni.megaverses.loadedNodes.reduce(
            (s2, mg) =>
              s2 +
              mg.multiverses.loadedNodes.reduce(
                (s3, mv) => s3 + mv.universes.loadedNodes.length,
                0
              ),
            0
          ),
        0
      ),
    0
  );

  const isRootCollapsed = collapsedNodeIds.has(root.id);

  return {
    id: root.id,
    name: `${root.id} (${root.alias})`,
    shortLabel: `${root.id} · ${root.alias}`,
    tier: 6,
    tierLabel: 'Tier 6: Singleton Root (1)',
    kind: 'white_page_root',
    alias: root.alias,
    parentId: null,
    hasCustomOverride: false,
    badgeText: `Singleton (1) · ${allOvervoids.length}/100 Overvoids · ${root.creatorEmail}`,
    subtitle: 'Absolute Root Node & Origin Engine of All 100 Overvoids and Oblivion',
    cardinalityLabel: '1 (Strict Singleton)',
    totalDescendantUniverses: totalRootUniverses,
    isCollapsed: isRootCollapsed,
    hiddenChildCount: isRootCollapsed
      ? rootChildren.length
      : Math.max(0, allOvervoids.length - overvoidChildren.length),
    representativeUniverseId: SOLARA_PRIME_UNIVERSE_ID,
    metadata: {
      tier: 6,
      isSingleton: root.isSingleton,
      cardinality: COSMIC_LIMITS.WHITE_PAGE_COUNT,
      creatorEmail: root.creatorEmail,
      oblivionState: root.oblivionState,
      overvoidCount: allOvervoids.length,
      displayedOvervoids: overvoidChildren.length,
      totalLoadedUniverses: totalRootUniverses,
    },
    children: isRootCollapsed ? [] : rootChildren,
  };
}

/**
 * Computes a deterministic D3 tree layout (`d3.hierarchy` + `d3.tree`) for the 6-tier
 * cosmological hierarchy in either horizontal (`left-to-right`) or radial (`360° orbit`) mode.
 */
export function computeCosmologicalD3TreeLayout(
  root: WhitePageRoot = getWhitePageSingletonRoot(),
  options: CosmologicalD3BuildOptions & {
    layoutMode?: 'horizontal' | 'radial';
    nodeVerticalSpacing?: number;
    tierHorizontalSpacing?: number;
  } = {}
): CosmologicalD3LayoutResult {
  const layoutMode = options.layoutMode ?? 'horizontal';
  const nodeVerticalSpacing = options.nodeVerticalSpacing ?? 56;
  const tierHorizontalSpacing = options.tierHorizontalSpacing ?? 195;

  const hierarchyData = buildCosmologicalD3HierarchyData(root, options);
  const d3Root = d3.hierarchy<CosmologicalD3NodeDatum>(hierarchyData, (d) => d.children);

  // Determine highlighted ancestor chain for the selected node or universe
  const targetId = options.highlightedUniverseId ?? SOLARA_PRIME_UNIVERSE_ID;
  const highlightedPathIds = new Set<string>();
  d3Root.each((node) => {
    if (node.data.id === targetId) {
      let curr: d3.HierarchyNode<CosmologicalD3NodeDatum> | null = node;
      while (curr) {
        highlightedPathIds.add(curr.data.id);
        curr = curr.parent;
      }
    }
  });

  const tierNodeCounts: Record<CosmologicalNodeTier, number> = {
    6: 0,
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
    0: 0,
  };

  if (layoutMode === 'radial') {
    const leafCount = Math.max(8, d3Root.leaves().length);
    const maxRadius = Math.max(460, leafCount * 22);
    const treeLayout = d3
      .tree<CosmologicalD3NodeDatum>()
      .size([2 * Math.PI, maxRadius])
      .separation((a, b) => (a.parent === b.parent ? 1.2 : 2.0) / Math.max(1, a.depth));

    const laidOutRoot = treeLayout(d3Root);
    const nodes: PositionedCosmologicalD3Node[] = [];
    const nodeById = new Map<string, PositionedCosmologicalD3Node>();

    laidOutRoot.each((node) => {
      const angle = node.x - Math.PI / 2;
      const radius = node.depth === 0 ? 0 : node.y;
      const cartesianX = Number((Math.cos(angle) * radius).toFixed(2));
      const cartesianY = Number((Math.sin(angle) * radius).toFixed(2));
      tierNodeCounts[node.data.tier] = (tierNodeCounts[node.data.tier] ?? 0) + 1;

      const positioned: PositionedCosmologicalD3Node = {
        id: node.data.id,
        data: node.data,
        depth: node.depth,
        height: node.height,
        x: cartesianX,
        y: cartesianY,
        parentId: node.parent?.data.id ?? null,
        isOnHighlightedPath: highlightedPathIds.has(node.data.id),
      };
      nodes.push(positioned);
      nodeById.set(positioned.id, positioned);
    });

    const links: PositionedCosmologicalD3Link[] = laidOutRoot.links().map((lnk) => {
      const src = nodeById.get(lnk.source.data.id)!;
      const tgt = nodeById.get(lnk.target.data.id)!;
      return {
        id: `${src.id}->${tgt.id}`,
        sourceId: src.id,
        targetId: tgt.id,
        sourceTier: src.data.tier,
        targetTier: tgt.data.tier,
        source: { x: src.x, y: src.y },
        target: { x: tgt.x, y: tgt.y },
        isOnHighlightedPath: highlightedPathIds.has(src.id) && highlightedPathIds.has(tgt.id),
      };
    });

    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const minX = Math.min(...xs, -500) - 180;
    const maxX = Math.max(...xs, 500) + 180;
    const minY = Math.min(...ys, -500) - 120;
    const maxY = Math.max(...ys, 500) + 120;

    return {
      rootNode: nodes[0],
      nodes,
      links,
      highlightedPathIds,
      bounds: {
        minX,
        maxX,
        minY,
        maxY,
        width: Math.max(800, maxX - minX),
        height: Math.max(600, maxY - minY),
      },
      tierNodeCounts,
    };
  }

  // Standard horizontal left-to-right tree layout (Tier 6 on left -> Tier 1 leaf on right)
  const treeLayout = d3
    .tree<CosmologicalD3NodeDatum>()
    .nodeSize([nodeVerticalSpacing, tierHorizontalSpacing])
    .separation((a, b) => (a.parent === b.parent ? 1.05 : 1.45));

  const laidOutRoot = treeLayout(d3Root);
  const nodes: PositionedCosmologicalD3Node[] = [];
  const nodeById = new Map<string, PositionedCosmologicalD3Node>();

  laidOutRoot.each((node) => {
    // In horizontal orientation, horizontal coordinate is node.y (depth * tierHorizontalSpacing)
    // and vertical coordinate is node.x
    const horizX = Number(node.y.toFixed(2));
    const vertY = Number(node.x.toFixed(2));
    tierNodeCounts[node.data.tier] = (tierNodeCounts[node.data.tier] ?? 0) + 1;

    const positioned: PositionedCosmologicalD3Node = {
      id: node.data.id,
      data: node.data,
      depth: node.depth,
      height: node.height,
      x: horizX,
      y: vertY,
      parentId: node.parent?.data.id ?? null,
      isOnHighlightedPath: highlightedPathIds.has(node.data.id),
    };
    nodes.push(positioned);
    nodeById.set(positioned.id, positioned);
  });

  const links: PositionedCosmologicalD3Link[] = laidOutRoot.links().map((lnk) => {
    const src = nodeById.get(lnk.source.data.id)!;
    const tgt = nodeById.get(lnk.target.data.id)!;
    return {
      id: `${src.id}->${tgt.id}`,
      sourceId: src.id,
      targetId: tgt.id,
      sourceTier: src.id === 'THE_WHITE_PAGE' ? 6 : src.data.tier,
      targetTier: tgt.data.tier,
      source: { x: src.x, y: src.y },
      target: { x: tgt.x, y: tgt.y },
      isOnHighlightedPath: highlightedPathIds.has(src.id) && highlightedPathIds.has(tgt.id),
    };
  });

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs, 0) - 140;
  const maxX = Math.max(...xs, tierHorizontalSpacing * 5) + 280;
  const minY = Math.min(...ys, -260) - 90;
  const maxY = Math.max(...ys, 260) + 90;

  return {
    rootNode: nodes[0],
    nodes,
    links,
    highlightedPathIds,
    bounds: {
      minX,
      maxX,
      minY,
      maxY,
      width: Math.max(960, maxX - minX),
      height: Math.max(540, maxY - minY),
    },
    tierNodeCounts,
  };
}
