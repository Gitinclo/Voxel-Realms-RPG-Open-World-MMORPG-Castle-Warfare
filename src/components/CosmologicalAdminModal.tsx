/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  GitBranch,
  Orbit,
  Sparkles,
  PlusCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  Layers,
  ChevronRight,
  FolderMinus,
  FolderPlus,
} from 'lucide-react';
import { WhitePageRoot } from '../types/game';
import {
  COSMIC_LIMITS,
  OVERVOID_SECTOR_PRESETS,
  OmniverseSpeciesNpcEntry,
  SOLARA_PRIME_UNIVERSE_ID,
  TOP_100_OMNIVERSE_SPECIES_NPCS,
  attemptCreateOvervoid,
  evaluateEffectiveUniversePhysicsAndLogic,
  getWhitePageSingletonRoot,
  lazilyGenerateInfiniteTierSlice,
  overrideOvervoidLogicRules,
  overrideUniversePhysicsConstants,
  resetWhitePageSingletonRoot,
  resolveEntityCosmologicalPath,
  spawnNestedUniverseInMultiverse,
  validateCosmologicalTreeHierarchy,
} from '../game/omniverse';
import {
  CosmologicalNodeTier,
  PositionedCosmologicalD3Link,
  PositionedCosmologicalD3Node,
  computeCosmologicalD3TreeLayout,
} from '../game/cosmologicalTreeD3';
import { PRIMARY_ADMIN_EMAIL, isPrimaryAdminAccount } from '../game/adminModeration';
import { sound } from '../game/audio';

export interface CosmologicalAdminModalProps {
  cosmologicalTree?: WhitePageRoot;
  onUpdateCosmologicalTree?: (nextTree: WhitePageRoot) => void;
  omniverseRoster?: OmniverseSpeciesNpcEntry[];
  activeAccountEmail?: string;
  initialSelectedUniverseId?: string;
  onNotify?: (message: string) => void;
  onClose: () => void;
}

interface TierVisualStyle {
  tierLabel: string;
  fillHex: string;
  strokeHex: string;
  badgeBgHex: string;
  textHex: string;
  nodeRadius: number;
}

const TIER_VISUAL_STYLES: Record<CosmologicalNodeTier, TierVisualStyle> = {
  6: {
    tierLabel: 'T6 · White Page Root',
    fillHex: '#fef3c7',
    strokeHex: '#f59e0b',
    badgeBgHex: '#78350f',
    textHex: '#fde68a',
    nodeRadius: 15,
  },
  0: {
    tierLabel: 'Oblivion (Void)',
    fillHex: '#4a044e',
    strokeHex: '#e879f9',
    badgeBgHex: '#3b0764',
    textHex: '#f5d0fe',
    nodeRadius: 11,
  },
  5: {
    tierLabel: 'T5 · Overvoid / Exonverse',
    fillHex: '#451a03',
    strokeHex: '#fbbf24',
    badgeBgHex: '#78350f',
    textHex: '#fcd34d',
    nodeRadius: 13,
  },
  4: {
    tierLabel: 'T4 · Omniverse',
    fillHex: '#500724',
    strokeHex: '#f472b6',
    badgeBgHex: '#831843',
    textHex: '#fbcfe8',
    nodeRadius: 11,
  },
  3: {
    tierLabel: 'T3 · Megaverse / Hyperverse',
    fillHex: '#2e1065',
    strokeHex: '#a78bfa',
    badgeBgHex: '#4c1d95',
    textHex: '#ddd6fe',
    nodeRadius: 10,
  },
  2: {
    tierLabel: 'T2 · Multiverse',
    fillHex: '#083344',
    strokeHex: '#22d3ee',
    badgeBgHex: '#155e75',
    textHex: '#a5f3fc',
    nodeRadius: 9,
  },
  1: {
    tierLabel: 'T1 · Leaf Universe',
    fillHex: '#0c4a6e',
    strokeHex: '#38bdf8',
    badgeBgHex: '#075985',
    textHex: '#bae6fd',
    nodeRadius: 8,
  },
};

export const CosmologicalAdminModal: React.FC<CosmologicalAdminModalProps> = ({
  cosmologicalTree: externalTree,
  onUpdateCosmologicalTree,
  omniverseRoster = TOP_100_OMNIVERSE_SPECIES_NPCS,
  activeAccountEmail = PRIMARY_ADMIN_EMAIL,
  initialSelectedUniverseId = SOLARA_PRIME_UNIVERSE_ID,
  onNotify,
  onClose,
}) => {
  const [internalTree, setInternalTree] = useState<WhitePageRoot>(() =>
    getWhitePageSingletonRoot()
  );
  const activeTree = externalTree ?? internalTree;

  const updateTreeState = (nextTree: WhitePageRoot) => {
    setInternalTree(nextTree);
    onUpdateCosmologicalTree?.(nextTree);
  };

  const [layoutMode, setLayoutMode] = useState<'horizontal' | 'radial'>('horizontal');
  const [overvoidFilterId, setOvervoidFilterId] = useState<string | 'ALL'>('ALL');
  const [maxOmniversesPerOvervoid, setMaxOmniversesPerOvervoid] = useState<number>(2);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>(initialSelectedUniverseId);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(initialSelectedUniverseId);
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(() => new Set());

  // Custom override form inputs
  const [customLogicSystemInput, setCustomLogicSystemInput] = useState<string>(
    'Acausal Paraconsistent White-Page Hyper-Logic'
  );
  const [customTimeDilationInput, setCustomTimeDilationInput] = useState<number>(12.0);
  const [customGravityInput, setCustomGravityInput] = useState<number>(3.5);
  const [customQiDensityInput, setCustomQiDensityInput] = useState<number>(9.0);
  const [lastCapGuardMessage, setLastCapGuardMessage] = useState<string | null>(null);

  // D3 Zoom state
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [zoomTransform, setZoomTransform] = useState<d3.ZoomTransform>(() =>
    d3.zoomIdentity.translate(140, 320).scale(0.78)
  );

  const isSuperAdmin = isPrimaryAdminAccount(activeAccountEmail);

  const validation = useMemo(() => validateCosmologicalTreeHierarchy(activeTree), [activeTree]);

  const d3Layout = useMemo(
    () =>
      computeCosmologicalD3TreeLayout(activeTree, {
        layoutMode,
        overvoidFilterId,
        maxOmniversesPerOvervoid,
        searchQuery,
        collapsedNodeIds,
        highlightedUniverseId: selectedUniverseId,
      }),
    [
      activeTree,
      layoutMode,
      overvoidFilterId,
      maxOmniversesPerOvervoid,
      searchQuery,
      collapsedNodeIds,
      selectedUniverseId,
    ]
  );

  const selectedPath = useMemo(
    () => resolveEntityCosmologicalPath(activeTree, selectedUniverseId),
    [activeTree, selectedUniverseId]
  );

  const effectivePhysics = useMemo(
    () => evaluateEffectiveUniversePhysicsAndLogic(activeTree, selectedUniverseId),
    [activeTree, selectedUniverseId]
  );

  const selectedD3Node: PositionedCosmologicalD3Node = useMemo(() => {
    return (
      d3Layout.nodes.find((n) => n.id === selectedNodeId) ??
      d3Layout.nodes.find((n) => n.id === selectedUniverseId) ??
      d3Layout.rootNode
    );
  }, [d3Layout, selectedNodeId, selectedUniverseId]);

  // Attach d3.zoom to SVG element
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.18, 2.75])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        setZoomTransform(event.transform);
      });

    zoomBehaviorRef.current = zoomBehavior;
    const selection = d3.select(svgEl);
    selection.call(zoomBehavior);

    // Initialize default centering transform inside the 1000x620 viewBox coordinate system
    const initialTransform =
      layoutMode === 'radial'
        ? d3.zoomIdentity.translate(500, 310).scale(0.54)
        : d3.zoomIdentity.translate(54, 310).scale(0.76);
    selection.call(zoomBehavior.transform, initialTransform);

    return () => {
      selection.on('.zoom', null);
    };
  }, [layoutMode, overvoidFilterId]);

  const handleZoomBy = (factor: number) => {
    const svgEl = svgRef.current;
    const zb = zoomBehaviorRef.current;
    if (!svgEl || !zb) return;
    d3.select(svgEl).transition().duration(180).call(zb.scaleBy, factor);
  };

  const handleResetView = () => {
    const svgEl = svgRef.current;
    const zb = zoomBehaviorRef.current;
    if (!svgEl || !zb) return;
    const targetTransform =
      layoutMode === 'radial'
        ? d3.zoomIdentity.translate(500, 310).scale(0.54)
        : d3.zoomIdentity.translate(54, 310).scale(0.76);
    d3.select(svgEl).transition().duration(200).call(zb.transform, targetTransform);
  };

  const handleToggleCollapseNode = (nodeId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    sound.playSwing();
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleSelectD3Node = (node: PositionedCosmologicalD3Node) => {
    sound.playSwing();
    setSelectedNodeId(node.id);
    if (node.data.kind === 'universe') {
      setSelectedUniverseId(node.id);
    } else if (node.data.representativeUniverseId) {
      setSelectedUniverseId(node.data.representativeUniverseId);
    }
  };

  const buildLinkPath = (link: PositionedCosmologicalD3Link): string => {
    if (layoutMode === 'radial') {
      return `M ${link.source.x},${link.source.y} C ${(link.source.x + link.target.x) * 0.5},${link.source.y} ${(link.source.x + link.target.x) * 0.5},${link.target.y} ${link.target.x},${link.target.y}`;
    }
    const linkGen = d3
      .linkHorizontal<
        PositionedCosmologicalD3Link,
        {
          x: number;
          y: number;
        }
      >()
      .x((d) => d.x)
      .y((d) => d.y);
    return (
      linkGen(link) ?? `M ${link.source.x},${link.source.y} L ${link.target.x},${link.target.y}`
    );
  };

  const handleOverrideTier5Logic = () => {
    const updated = overrideOvervoidLogicRules({
      root: activeTree,
      overvoidId: selectedPath.tier5Overvoid.id,
      logicSystem: customLogicSystemInput.trim() || selectedPath.tier5Overvoid.logicSystem,
      cosmicHierarchyRulesPatch: {
        realmSuppressionBase: 100,
        qiMultiplierBonus: 6.0,
        customAuthorOverrideBy: PRIMARY_ADMIN_EMAIL,
      },
    });
    updateTreeState(updated);
    sound.playUpgradeFanfare();
    onNotify?.(
      `🕳️ Overrode Tier 5 Overvoid [${selectedPath.tier5Overvoid.id}] logic -> ${customLogicSystemInput}`
    );
  };

  const handleOverrideTier1Physics = () => {
    const updated = overrideUniversePhysicsConstants({
      root: activeTree,
      universeId: selectedPath.tier1Universe.id,
      spacetimeConfigPatch: {
        timeDilationFactor: customTimeDilationInput,
        speedOfLightMps: 999_999_999,
      },
      matterConstantsPatch: {
        gravityMultiplier: customGravityInput,
        qiSpiritDensityMultiplier: customQiDensityInput,
      },
    });
    updateTreeState(updated);
    sound.playUpgradeFanfare();
    onNotify?.(
      `🪐 Overrode Tier 1 Universe [${selectedPath.tier1Universe.id}] physics -> ${customQiDensityInput}x Qi, ${customGravityInput}G, ${customTimeDilationInput}x Time Dilation`
    );
  };

  const handleSpawnChildUniverse = () => {
    const targetMultiverse = selectedPath.tier2Multiverse;
    const nextIndex = targetMultiverse.universes.loadedNodes.length + 1;
    const newUniverseId = `${targetMultiverse.id}-U${nextIndex}`;
    const updated = spawnNestedUniverseInMultiverse({
      root: activeTree,
      multiverseId: targetMultiverse.id,
      newUniverse: {
        id: newUniverseId,
        name: `Spawned Continuum ${newUniverseId} (${targetMultiverse.topology.toUpperCase()})`,
        tier: 1,
        spacetimeConfig: {
          spacetimeDimensions: '11D Brane Continuum',
          timeDilationFactor: 5.0,
          speedOfLightMps: 500_000_000,
        },
        matterConstants: {
          gravityMultiplier: 1.5,
          qiSpiritDensityMultiplier: 4.5,
        },
      },
    });
    // Ensure parent Multiverse is expanded so the new Universe leaf is immediately visible
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      next.delete(targetMultiverse.id);
      return next;
    });
    updateTreeState(updated);
    setSelectedUniverseId(newUniverseId);
    setSelectedNodeId(newUniverseId);
    sound.playUpgradeFanfare();
    onNotify?.(
      `🌌 Spawned new Tier 1 leaf Universe [${newUniverseId}] inside Multiverse [${targetMultiverse.id}] (InfiniteCollection)!`
    );
  };

  const handleLazyLoadInfiniteSlice = () => {
    const nodeTier = selectedD3Node.data.tier;
    const parentTier: 5 | 4 | 3 | 2 =
      nodeTier === 5 || nodeTier === 4 || nodeTier === 3 || nodeTier === 2 ? nodeTier : 2;
    const parentId =
      parentTier === 5
        ? selectedPath.tier5Overvoid.id
        : parentTier === 4
          ? selectedPath.tier4Omniverse.id
          : parentTier === 3
            ? selectedPath.tier3Megaverse.id
            : selectedPath.tier2Multiverse.id;

    const updated = lazilyGenerateInfiniteTierSlice({
      root: activeTree,
      parentTier,
      parentId,
      pageSize: 1,
    });
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      next.delete(parentId);
      return next;
    });
    updateTreeState(updated);
    sound.playUpgradeFanfare();
    const msg = `♾️ Lazily generated next procedural ∞ slice under Tier ${parentTier} [${parentId}] using deterministic generatorSeed!`;
    setLastCapGuardMessage(msg);
    onNotify?.(msg);
  };

  const handleTestOvervoidCap = () => {
    const attempt = attemptCreateOvervoid({
      root: activeTree,
      candidateOvervoid: {
        id: 'OVERVOID-101-OVERFLOW',
        index: 101,
        name: 'Illegal 101st Overvoid',
      },
    });
    sound.playSwing();
    setLastCapGuardMessage(attempt.reason);
    onNotify?.(`🛡️ ${attempt.reason}`);
  };

  const handleResetTree = () => {
    const reset = resetWhitePageSingletonRoot(omniverseRoster);
    setCollapsedNodeIds(new Set());
    setLastCapGuardMessage(null);
    updateTreeState(reset);
    setSelectedUniverseId(SOLARA_PRIME_UNIVERSE_ID);
    setSelectedNodeId(SOLARA_PRIME_UNIVERSE_ID);
    sound.playSwing();
    onNotify?.('🔄 Reset 6-Tier Cosmological Hierarchy Tree to canonical state.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 animate-in fade-in duration-200">
      <div
        data-testid="cosmological-admin-modal"
        role="dialog"
        aria-modal="true"
        aria-label="6-Tier Cosmological Hierarchy D3 Interactive Tree Visualizer"
        className="relative w-full max-w-7xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
      >
        {/* Top Header */}
        <div className="shrink-0 px-4 sm:px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 shrink-0">
              <GitBranch className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-lg font-bold font-cinzel text-white truncate">
                  6-Tier Cosmological Hierarchy — Interactive D3 Tree Visualizer
                </h2>
                <span className="text-xs font-mono text-amber-300">
                  Root: {activeTree.id} ({activeTree.alias}) · {activeTree.creatorEmail}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5 flex-wrap">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {validation.valid ? '6-Tier Nesting Validated' : 'Validation Warning'}
                </span>
                <span>·</span>
                <span className="tabular-nums">
                  {validation.tierCounts.tier6WhitePageRoot} Singleton Root →{' '}
                  <strong className="text-amber-300" data-testid="d3-total-overvoid-count">
                    {validation.tierCounts.tier5Overvoids}/{COSMIC_LIMITS.OVERVOID_MAX_COUNT}{' '}
                    Overvoids
                  </strong>{' '}
                  → {validation.tierCounts.tier4Omniverses}/∞ Omniverses →{' '}
                  {validation.tierCounts.tier3Megaverses}/∞ Megaverses →{' '}
                  {validation.tierCounts.tier2Multiverses}/∞ Multiverses →{' '}
                  <strong className="text-cyan-300" data-testid="d3-total-universe-count">
                    {validation.tierCounts.tier1Universes}/∞ Universes
                  </strong>
                </span>
                <span>·</span>
                <span className="text-fuchsia-300">
                  Oblivion: {String(activeTree.oblivionState.exists)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="d3-modal-reset-tree-btn"
              onClick={handleResetTree}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Tree</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Cosmological Hierarchy Modal"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Control Toolbar: Sector Filter, Search, Density, Orientation & Zoom */}
        <div className="shrink-0 px-4 sm:px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Overvoid Sector Filter & Search */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              data-testid="d3-filter-overvoid-ALL"
              onClick={() => {
                setOvervoidFilterId('ALL');
                sound.playSwing();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                overvoidFilterId === 'ALL'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              All 100 Overvoids
            </button>
            {OVERVOID_SECTOR_PRESETS.map((sector, idx) => (
              <button
                key={sector.id}
                type="button"
                data-testid={`d3-filter-overvoid-${sector.id}`}
                onClick={() => {
                  setOvervoidFilterId(sector.id);
                  sound.playSwing();
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  overvoidFilterId === sector.id
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                T5-S{idx + 1}: {sector.id.replace('EXO-', '')} (#{idx * 20 + 1}–{(idx + 1) * 20})
              </button>
            ))}

            <div className="relative ml-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                data-testid="d3-tree-search-input"
                aria-label="Filter cosmological tree nodes"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter Universe / Omniverse..."
                className="pl-7 pr-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 w-44 sm:w-52"
              />
            </div>
          </div>

          {/* Right: Density, Layout Orientation & Zoom Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              aria-label="Omniverse Branch Density"
              data-testid="d3-branch-density-select"
              value={maxOmniversesPerOvervoid}
              onChange={(e) => setMaxOmniversesPerOvervoid(Number(e.target.value))}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-200 cursor-pointer"
            >
              <option value={2}>Compact (2 Omni / Overvoid)</option>
              <option value={5}>Balanced (5 Omni / Overvoid)</option>
              <option value={20}>Full 100 Omniverses (All Leaves)</option>
            </select>

            <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
              <button
                type="button"
                data-testid="d3-layout-horizontal-btn"
                onClick={() => {
                  setLayoutMode('horizontal');
                  sound.playSwing();
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  layoutMode === 'horizontal'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Horizontal</span>
              </button>
              <button
                type="button"
                data-testid="d3-layout-radial-btn"
                onClick={() => {
                  setLayoutMode('radial');
                  sound.playSwing();
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  layoutMode === 'radial'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Orbit className="w-3.5 h-3.5" />
                <span>Radial 360°</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                data-testid="d3-zoom-in-btn"
                onClick={() => handleZoomBy(1.25)}
                aria-label="Zoom In D3 Tree"
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                data-testid="d3-zoom-out-btn"
                onClick={() => handleZoomBy(0.8)}
                aria-label="Zoom Out D3 Tree"
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                data-testid="d3-zoom-reset-btn"
                onClick={handleResetView}
                aria-label="Reset D3 Tree Camera"
                className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Workspace Split: Left = Interactive D3 SVG Tree Canvas | Right = 6-Tier Node & Physics Inspector */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left 8 Columns: D3 Interactive Tree Canvas */}
          <div className="lg:col-span-8 flex flex-col bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-800 relative min-h-[380px] sm:min-h-[480px]">
            {/* Tier Depth Legend Overlay */}
            <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <div className="flex flex-wrap items-center gap-3">
                {([6, 0, 5, 4, 3, 2, 1] as CosmologicalNodeTier[]).map((t) => {
                  const style = TIER_VISUAL_STYLES[t];
                  const count = d3Layout.tierNodeCounts[t] ?? 0;
                  return (
                    <span key={t} className="inline-flex items-center gap-1.5 text-slate-300">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block border"
                        style={{
                          backgroundColor: style.fillHex,
                          borderColor: style.strokeHex,
                        }}
                      />
                      <span>{style.tierLabel}</span>
                      <span className="text-slate-500 tabular-nums">({count})</span>
                    </span>
                  );
                })}
              </div>
              <span className="text-slate-400 tabular-nums" data-testid="d3-rendered-stats">
                Rendered: {d3Layout.nodes.length} nodes · {d3Layout.links.length} links
              </span>
            </div>

            {/* Quick Leaf Universe Presets Bar */}
            <div className="px-3.5 py-1.5 bg-slate-950 border-b border-slate-900 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
              <span className="text-slate-400 shrink-0">Trace Lineage:</span>
              {[
                { label: 'Solara Prime (U-081.1)', id: SOLARA_PRIME_UNIVERSE_ID },
                { label: 'Outer Gods (U-001.1)', id: 'U-001.1' },
                { label: 'Xeelee (U-021.1)', id: 'U-021.1' },
                { label: 'Deities (U-041.1)', id: 'U-041.1' },
                { label: 'Rognarr 35G (U-064.1)', id: 'U-064.1' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  data-testid={`d3-preset-universe-${preset.id}`}
                  onClick={() => {
                    setSelectedUniverseId(preset.id);
                    setSelectedNodeId(preset.id);
                    sound.playSwing();
                  }}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedUniverseId === preset.id
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Interactive D3 SVG Surface */}
            <div className="flex-1 relative overflow-hidden bg-slate-950">
              <svg
                ref={svgRef}
                data-testid="cosmological-d3-svg"
                className="w-full h-full cursor-grab active:cursor-grabbing select-none"
                viewBox="0 0 1000 620"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <radialGradient id="d3WhitePageGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fde68a" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <g
                  data-testid="cosmological-d3-viewport-group"
                  transform={`translate(${zoomTransform.x},${zoomTransform.y}) scale(${zoomTransform.k})`}
                >
                  {/* Depth Column Guide Lines in Horizontal Mode */}
                  {layoutMode === 'horizontal' &&
                    [
                      { depth: 0, label: 'T6 · WHITE PAGE' },
                      { depth: 1, label: 'T5 · OVERVOID (+VOID)' },
                      { depth: 2, label: 'T4 · OMNIVERSE' },
                      { depth: 3, label: 'T3 · MEGAVERSE' },
                      { depth: 4, label: 'T2 · MULTIVERSE' },
                      { depth: 5, label: 'T1 · LEAF UNIVERSE' },
                    ].map((col) => {
                      const colX = col.depth * 195;
                      return (
                        <g key={col.depth} transform={`translate(${colX}, 0)`}>
                          <line
                            x1={0}
                            y1={d3Layout.bounds.minY}
                            x2={0}
                            y2={d3Layout.bounds.maxY}
                            stroke="#1e293b"
                            strokeWidth={1}
                            strokeDasharray="4 6"
                          />
                          <text
                            x={0}
                            y={d3Layout.bounds.minY + 24}
                            textAnchor="middle"
                            fill="#64748b"
                            fontSize={10}
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {col.label}
                          </text>
                        </g>
                      );
                    })}

                  {/* Concentric Orbit Rings in Radial Mode */}
                  {layoutMode === 'radial' &&
                    [1, 2, 3, 4, 5].map((depthIdx) => {
                      const sampleNode = d3Layout.nodes.find((n) => n.depth === depthIdx);
                      if (!sampleNode) return null;
                      const radius = Math.hypot(sampleNode.x, sampleNode.y);
                      return (
                        <circle
                          key={depthIdx}
                          cx={0}
                          cy={0}
                          r={radius}
                          fill="none"
                          stroke="#1e293b"
                          strokeWidth={1}
                          strokeDasharray="4 6"
                        />
                      );
                    })}

                  {/* Parent-Child Links */}
                  <g data-testid="cosmological-d3-links-layer">
                    {d3Layout.links.map((lnk) => {
                      const isOblivionLink = lnk.targetTier === 0;
                      const strokeColor = isOblivionLink
                        ? '#e879f9'
                        : lnk.isOnHighlightedPath
                          ? '#38bdf8'
                          : '#334155';
                      const strokeWidth = lnk.isOnHighlightedPath ? 2.6 : 1.35;

                      return (
                        <path
                          key={lnk.id}
                          data-testid={`d3-link-${lnk.sourceId}-${lnk.targetId}`}
                          d={buildLinkPath(lnk)}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                          strokeDasharray={isOblivionLink ? '5 4' : undefined}
                          opacity={lnk.isOnHighlightedPath ? 0.98 : 0.68}
                        />
                      );
                    })}
                  </g>

                  {/* Hierarchy Nodes */}
                  <g data-testid="cosmological-d3-nodes-layer">
                    {d3Layout.nodes.map((node) => {
                      const style = TIER_VISUAL_STYLES[node.data.tier];
                      const isSelected = node.id === selectedD3Node.id;
                      const isHighlighted = node.isOnHighlightedPath;
                      const hasOverride = node.data.hasCustomOverride;
                      const canCollapse = node.data.tier >= 2 && node.data.tier <= 5;

                      const strokeHex = isSelected
                        ? '#ffffff'
                        : hasOverride
                          ? '#34d399'
                          : style.strokeHex;

                      return (
                        <g
                          key={node.id}
                          data-testid={`d3-node-${node.id}`}
                          transform={`translate(${node.x},${node.y})`}
                          onClick={() => handleSelectD3Node(node)}
                          className="cursor-pointer"
                        >
                          {/* Subtle halo on Tier 6 Root or selected node */}
                          {(node.data.tier === 6 || isSelected) && (
                            <circle
                              r={style.nodeRadius + 9}
                              fill="url(#d3WhitePageGlow)"
                              pointerEvents="none"
                            />
                          )}

                          {/* Node Circle */}
                          <circle
                            r={style.nodeRadius}
                            fill={style.fillHex}
                            stroke={strokeHex}
                            strokeWidth={isSelected ? 3 : isHighlighted ? 2.4 : 1.6}
                          />

                          {/* Tier Number / Icon inside Circle */}
                          <text
                            dy="0.34em"
                            textAnchor="middle"
                            fill={node.data.tier === 6 ? '#0f172a' : '#f8fafc'}
                            fontSize={node.data.tier === 6 ? 9 : 8}
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {node.data.tier === 0 ? 'Ø' : `T${node.data.tier}`}
                          </text>

                          {/* Node Label & Metadata Pill */}
                          <g
                            transform={
                              layoutMode === 'horizontal'
                                ? node.data.tier === 6
                                  ? `translate(-16, -${style.nodeRadius + 20})`
                                  : `translate(${style.nodeRadius + 7}, -5)`
                                : `translate(${node.x >= 0 ? style.nodeRadius + 7 : -(style.nodeRadius + 7)}, -4)`
                            }
                          >
                            <text
                              textAnchor={layoutMode === 'radial' && node.x < 0 ? 'end' : 'start'}
                              fill={isSelected ? '#ffffff' : style.textHex}
                              stroke="#020617"
                              strokeWidth={3.2}
                              strokeLinejoin="round"
                              style={{ paintOrder: 'stroke fill' }}
                              fontSize={node.data.tier === 6 ? 11.5 : 10}
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              {node.data.shortLabel}
                            </text>
                            <text
                              y={12}
                              textAnchor={layoutMode === 'radial' && node.x < 0 ? 'end' : 'start'}
                              fill={hasOverride ? '#6ee7b7' : '#94a3b8'}
                              stroke="#020617"
                              strokeWidth={2.8}
                              strokeLinejoin="round"
                              style={{ paintOrder: 'stroke fill' }}
                              fontSize={8.5}
                              fontFamily="monospace"
                            >
                              {node.data.badgeText}
                            </text>
                          </g>

                          {/* Expand / Collapse Affordance Button on Container Tiers (T5..T2) */}
                          {canCollapse && (
                            <g
                              data-testid={`d3-toggle-collapse-${node.id}`}
                              transform={`translate(0, ${style.nodeRadius + 11})`}
                              onClick={(e) => handleToggleCollapseNode(node.id, e)}
                            >
                              <rect
                                x={-14}
                                y={-7}
                                width={28}
                                height={14}
                                rx={4}
                                fill={node.data.isCollapsed ? '#0284c7' : '#1e293b'}
                                stroke="#475569"
                                strokeWidth={1}
                              />
                              <text
                                dy="0.32em"
                                textAnchor="middle"
                                fill="#f8fafc"
                                fontSize={8}
                                fontFamily="monospace"
                                fontWeight="bold"
                              >
                                {node.data.isCollapsed
                                  ? `+${node.data.hiddenChildCount ?? 1}`
                                  : '−'}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </g>
                </g>
              </svg>
            </div>
          </div>

          {/* Right 4 Columns: 6-Tier Node Inspector & Live Physics/Hierarchy Controls */}
          <div className="lg:col-span-4 overflow-y-auto p-4 sm:p-5 bg-slate-900/90 space-y-4 text-slate-200">
            {/* Selected D3 Node Summary Card */}
            <div
              data-testid="d3-selected-node-inspector"
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-bold text-amber-300">
                  {selectedD3Node.data.tierLabel} · Depth {selectedD3Node.depth}
                </span>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {selectedD3Node.data.totalDescendantUniverses} Leaf Univ
                </span>
              </div>

              <div
                className="text-sm font-bold font-mono text-white break-words"
                data-testid="d3-inspector-node-id"
              >
                {selectedD3Node.data.id}
              </div>
              <div className="text-xs text-slate-300 leading-snug">{selectedD3Node.data.name}</div>
              <div className="text-[11px] font-mono text-cyan-300">
                Parent Node: {selectedD3Node.parentId ?? 'NONE (Singleton Root)'} ·{' '}
                {selectedD3Node.data.badgeText}
              </div>

              {selectedD3Node.data.tier >= 2 && selectedD3Node.data.tier <= 5 && (
                <button
                  type="button"
                  onClick={() => handleToggleCollapseNode(selectedD3Node.id)}
                  className="w-full mt-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-semibold text-cyan-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {selectedD3Node.data.isCollapsed ? (
                    <>
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Expand Child Branch in D3 Tree</span>
                    </>
                  ) : (
                    <>
                      <FolderMinus className="w-3.5 h-3.5" />
                      <span>Collapse Child Branch in D3 Tree</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Strict 6-Tier Parent-Child Lineage Chain */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-cinzel text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Active 6-Tier Parent → Child Path</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400">Tier 6 → Tier 1</span>
              </div>

              <div className="space-y-1.5 text-[11px] font-mono">
                {[
                  {
                    tier: 6,
                    label: 'Tier 6 · WhitePageRoot (Cardinality = 1 Singleton)',
                    id: selectedPath.tier6WhitePage.id,
                    detail: `${selectedPath.tier6WhitePage.alias} (${selectedPath.tier6WhitePage.creatorEmail})`,
                  },
                  {
                    tier: 5,
                    label: `Tier 5 · ${selectedPath.tier5Overvoid.alias} (#${selectedPath.tier5Overvoid.index}/${COSMIC_LIMITS.OVERVOID_MAX_COUNT} Bounded)`,
                    id: selectedPath.tier5Overvoid.id,
                    detail: selectedPath.tier5Overvoid.logicSystem,
                  },
                  {
                    tier: 4,
                    label: 'Tier 4 · Omniverse (Cardinality = ∞ Stream)',
                    id: selectedPath.tier4Omniverse.id,
                    detail: `Scope: ${selectedPath.tier4Omniverse.temporalScope} · Seed: ${selectedPath.tier4Omniverse.megaverses.generatorSeed}`,
                  },
                  {
                    tier: 3,
                    label: `Tier 3 · ${selectedPath.tier3Megaverse.alias} (Cardinality = ∞ Stream)`,
                    id: selectedPath.tier3Megaverse.id,
                    detail: `${selectedPath.tier3Megaverse.name} · Seed: ${selectedPath.tier3Megaverse.multiverses.generatorSeed}`,
                  },
                  {
                    tier: 2,
                    label: 'Tier 2 · Multiverse (Cardinality = ∞ Stream)',
                    id: selectedPath.tier2Multiverse.id,
                    detail: `Topology: ${selectedPath.tier2Multiverse.topology} (${selectedPath.tier2Multiverse.universes.loadedNodes.length}/∞ loaded)`,
                  },
                  {
                    tier: 1,
                    label: 'Tier 1 · Leaf Universe (Cardinality = ∞ Unbounded)',
                    id: selectedPath.tier1Universe.id,
                    detail: selectedPath.tier1Universe.name,
                  },
                ].map((step) => (
                  <button
                    key={step.tier}
                    type="button"
                    onClick={() => {
                      setSelectedNodeId(step.id);
                      sound.playSwing();
                    }}
                    className={`w-full text-left p-2 rounded-lg border transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      selectedD3Node.id === step.id
                        ? 'bg-cyan-950/50 border-cyan-400 text-white'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] text-amber-300 font-semibold">{step.label}</div>
                      <div className="text-xs font-bold text-white truncate">{step.id}</div>
                      <div className="text-[10px] text-slate-400 truncate">{step.detail}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Effective Cascaded Physics & Logic Readout (Rule 3) */}
            <div
              data-testid="d3-effective-physics-card"
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-cinzel text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cascaded Physics & Logic ({effectivePhysics.universeId})</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Effective Qi Multiplier</div>
                  <div
                    className="text-sm font-bold text-amber-300 tabular-nums"
                    data-testid="d3-effective-qi-multiplier"
                  >
                    {effectivePhysics.effectiveQiMultiplier}x
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Gravity Constant</div>
                  <div
                    className="text-sm font-bold text-emerald-300 tabular-nums"
                    data-testid="d3-effective-gravity"
                  >
                    {effectivePhysics.effectiveGravityMultiplier}G
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Time Dilation</div>
                  <div className="text-sm font-bold text-cyan-300 tabular-nums">
                    {effectivePhysics.effectiveTimeDilationFactor}x
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Realm Suppression</div>
                  <div className="text-sm font-bold text-fuchsia-300 tabular-nums">
                    {effectivePhysics.effectiveRealmSuppressionBase}x
                  </div>
                </div>
              </div>

              <div className="text-[11px] font-mono text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400">Active Logic System: </span>
                <strong className="text-white" data-testid="d3-effective-logic-system">
                  {effectivePhysics.effectiveLogicSystem}
                </strong>
              </div>
            </div>

            {/* Live Hierarchy, Lazy ∞ Pagination & Physics Controls */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-bold font-cinzel text-white">
                Live Hierarchy, Lazy ∞ Streams & Physics Controls ({PRIMARY_ADMIN_EMAIL})
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="d3-custom-logic-input"
                  className="block text-[10px] font-mono text-slate-400"
                >
                  Tier 5 ({selectedPath.tier5Overvoid.id} #{selectedPath.tier5Overvoid.index}/100)
                  Custom Logic Override
                </label>
                <div className="flex gap-1.5">
                  <input
                    id="d3-custom-logic-input"
                    type="text"
                    value={customLogicSystemInput}
                    onChange={(e) => setCustomLogicSystemInput(e.target.value)}
                    className="flex-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                  />
                  <button
                    type="button"
                    disabled={!isSuperAdmin}
                    data-testid="d3-modal-override-tier5-btn"
                    onClick={handleOverrideTier5Logic}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-mono font-bold cursor-pointer whitespace-nowrap"
                  >
                    Apply T5
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                <div>
                  <label htmlFor="d3-qi-input" className="block text-slate-400 mb-0.5">
                    T1 Qi Density
                  </label>
                  <input
                    id="d3-qi-input"
                    type="number"
                    step="0.5"
                    value={customQiDensityInput}
                    onChange={(e) => setCustomQiDensityInput(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="d3-grav-input" className="block text-slate-400 mb-0.5">
                    T1 Gravity (G)
                  </label>
                  <input
                    id="d3-grav-input"
                    type="number"
                    step="0.5"
                    value={customGravityInput}
                    onChange={(e) => setCustomGravityInput(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="d3-time-input" className="block text-slate-400 mb-0.5">
                    Time Dilation
                  </label>
                  <input
                    id="d3-time-input"
                    type="number"
                    step="0.5"
                    value={customTimeDilationInput}
                    onChange={(e) => setCustomTimeDilationInput(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  disabled={!isSuperAdmin}
                  data-testid="d3-modal-override-tier1-btn"
                  onClick={handleOverrideTier1Physics}
                  className="flex-1 py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 text-xs font-mono font-bold cursor-pointer whitespace-nowrap"
                >
                  Override Tier 1 Physics
                </button>
                <button
                  type="button"
                  disabled={!isSuperAdmin}
                  data-testid="d3-modal-spawn-universe-btn"
                  onClick={handleSpawnChildUniverse}
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-mono font-bold flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Spawn Child Universe</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={!isSuperAdmin}
                  data-testid="d3-modal-lazy-load-infinite-btn"
                  onClick={handleLazyLoadInfiniteSlice}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-fuchsia-950 hover:bg-fuchsia-900 border border-fuchsia-500/60 text-fuchsia-200 text-[11px] font-mono font-semibold cursor-pointer whitespace-nowrap"
                >
                  ♾️ Lazy-Load Next ∞ Slice
                </button>
                <button
                  type="button"
                  data-testid="d3-modal-test-overvoid-cap-btn"
                  onClick={handleTestOvervoidCap}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/50 text-amber-200 text-[11px] font-mono font-semibold cursor-pointer whitespace-nowrap"
                >
                  🛡️ Verify 100 Overvoid Cap
                </button>
              </div>

              {lastCapGuardMessage && (
                <div
                  data-testid="d3-cap-guard-status"
                  className="p-2 rounded-lg bg-slate-900 border border-amber-500/40 text-[10px] font-mono text-amber-200"
                >
                  {lastCapGuardMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
