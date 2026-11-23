/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Grid3X3, X, Compass, Layers } from 'lucide-react';
import {
  DEFAULT_VOXEL_CHUNK_SIZE_METERS,
  VoxelChunkDebugCell,
  buildVoxelChunkDebugGridSnapshot,
} from '../game/openWorld3DEngine';

export interface ChunkGridDebugOverlayProps {
  /** Snapshot of raw sector keys currently cached in `streamedChunkKeysRef.current`. */
  streamedChunkKeys: readonly string[];
  /** Live player world X position in meters. */
  playerWorldX: number;
  /** Live player world Z position in meters. */
  playerWorldZ: number;
  /** Optional approaching frontier chunk/sector key from boundary proximity evaluation. */
  targetChunkKey?: string | null;
  /** Whether the player is currently approaching an uncached frontier edge. */
  isNearChunkEdge?: boolean;
  /** Total streamed chunk counter tracked alongside `streamedChunkKeysRef`. */
  streamedChunkCount?: number;
  /** Display mode: floating HUD overlay over 3D world or embedded inside Admin Console. */
  variant?: 'overlay' | 'embedded';
  /** Callback to hide/disable the debug overlay (shown in overlay variant). */
  onClose?: () => void;
}

export const ChunkGridDebugOverlay: React.FC<ChunkGridDebugOverlayProps> = ({
  streamedChunkKeys,
  playerWorldX,
  playerWorldZ,
  targetChunkKey = null,
  isNearChunkEdge = false,
  streamedChunkCount,
  variant = 'overlay',
  onClose,
}) => {
  const [gridRadius, setGridRadius] = useState<2 | 3>(2);
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);

  const snapshot = useMemo(
    () =>
      buildVoxelChunkDebugGridSnapshot({
        streamedChunkKeys,
        playerWorldX,
        playerWorldZ,
        chunkSizeMeters: DEFAULT_VOXEL_CHUNK_SIZE_METERS,
        gridRadius,
        targetChunkKey: isNearChunkEdge ? targetChunkKey : null,
      }),
    [streamedChunkKeys, playerWorldX, playerWorldZ, gridRadius, isNearChunkEdge, targetChunkKey]
  );

  const inspectedCell: VoxelChunkDebugCell = useMemo(() => {
    if (selectedCellKey) {
      const found = snapshot.cells.find((c) => c.key === selectedCellKey);
      if (found) return found;
    }
    return (
      snapshot.cells.find((c) => c.isCurrentPlayerChunk) ??
      snapshot.cells[Math.floor(snapshot.cells.length / 2)]
    );
  }, [selectedCellKey, snapshot.cells]);

  const isOverlay = variant === 'overlay';

  const matrixElement = (
    <div
      data-testid={`${variant}-chunk-grid-matrix`}
      role="grid"
      aria-label={`256 by 256 meter voxel chunk cache grid (${snapshot.gridDimension} by ${snapshot.gridDimension} sectors)`}
      className={`grid ${isOverlay ? 'gap-0.5 sm:gap-1' : 'gap-1'}`}
      style={{
        gridTemplateColumns: `repeat(${snapshot.gridDimension}, minmax(0, 1fr))`,
      }}
    >
      {snapshot.cells.map((cell) => {
        const isSelected = inspectedCell.key === cell.key;
        const cellStyle = cell.isCurrentPlayerChunk
          ? 'bg-amber-500/25 border-amber-400 text-amber-100'
          : cell.cachedSource === 'frontier_sector' || cell.cachedSource === 'both'
            ? 'bg-cyan-500/25 border-cyan-400/80 text-cyan-100'
            : cell.isCached
              ? 'bg-emerald-500/22 border-emerald-400/70 text-emerald-100'
              : cell.isTargetFrontierChunk
                ? 'bg-amber-950/35 border-amber-400/80 border-dashed text-amber-200'
                : 'bg-slate-900/90 border-slate-800 text-slate-500 hover:border-slate-600';

        const cellHeightClass = isOverlay
          ? gridRadius === 3
            ? 'h-[18px] sm:h-[19px]'
            : 'h-[22px] sm:h-[24px]'
          : gridRadius === 3
            ? 'h-8'
            : 'h-11';

        return (
          <button
            key={cell.key}
            type="button"
            role="gridcell"
            data-testid={`${variant}-chunk-cell-${cell.chunkX}-${cell.chunkZ}`}
            data-cached={cell.isCached ? 'true' : 'false'}
            data-cache-source={cell.cachedSource}
            aria-label={`Chunk ${cell.chunkX},${cell.chunkZ}, ${
              cell.isCurrentPlayerChunk ? 'player active, ' : ''
            }${cell.isCached ? `cached (${cell.cachedSource})` : 'uncached'}, ${cell.lodLabel}`}
            onClick={() => setSelectedCellKey(cell.key)}
            className={`relative ${cellHeightClass} rounded-md border flex flex-col items-center justify-center px-0.5 transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${cellStyle} ${
              isSelected ? 'ring-1 ring-white/90' : ''
            }`}
          >
            <span
              className={`font-mono font-bold tabular-nums leading-none ${
                gridRadius === 3 ? 'text-[8px]' : 'text-[9px] sm:text-[10px]'
              }`}
            >
              {cell.chunkX},{cell.chunkZ}
            </span>

            {gridRadius === 2 && (
              <span
                className={`${
                  isOverlay ? 'hidden sm:inline text-[7px]' : 'text-[7px] sm:text-[8px]'
                } font-mono leading-none mt-0.5 opacity-85`}
              >
                {cell.isCurrentPlayerChunk
                  ? 'YOU'
                  : cell.cachedSource === 'frontier_sector' || cell.cachedSource === 'both'
                    ? 'SEC'
                    : cell.isCached
                      ? 'RAM'
                      : cell.isTargetFrontierChunk
                        ? 'NEXT'
                        : '·'}
              </span>
            )}

            {/* Sub-chunk live player position marker inside active 256m x 256m cell */}
            {cell.isCurrentPlayerChunk && (
              <span
                aria-hidden="true"
                className="absolute w-1.5 h-1.5 rounded-full bg-amber-300 border border-slate-950 shadow-xs pointer-events-none"
                style={{
                  left: `${snapshot.playerLocalPercentX}%`,
                  top: `${snapshot.playerLocalPercentZ}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );

  const inspectorElement = (
    <div
      data-testid={`${variant}-chunk-inspector`}
      className={`${
        isOverlay ? 'px-2 py-1' : 'px-2.5 py-1.5'
      } rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] font-mono space-y-0.5 tabular-nums`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-white font-bold flex items-center gap-1 min-w-0 truncate">
          <Layers className="w-3 h-3 text-cyan-400 shrink-0" aria-hidden="true" />
          <span className="truncate">
            ({inspectedCell.chunkX}, {inspectedCell.chunkZ}) · {inspectedCell.lodLabel}
          </span>
        </span>
        <span
          className={`shrink-0 ${
            inspectedCell.isCached
              ? inspectedCell.cachedSource === 'frontier_sector'
                ? 'text-cyan-300 font-bold'
                : 'text-emerald-300 font-bold'
              : 'text-slate-400'
          }`}
        >
          {inspectedCell.isCached
            ? inspectedCell.cachedSource === 'frontier_sector'
              ? 'FRONTIER'
              : inspectedCell.cachedSource === 'both'
                ? 'COORD+SEC'
                : 'CACHED'
            : 'UNCACHED'}
        </span>
      </div>

      <div className="text-slate-400 flex items-center justify-between gap-2 text-[9px] sm:text-[10px]">
        <span>
          X[{inspectedCell.worldMinX}..{inspectedCell.worldMaxX}m]
        </span>
        <span>
          Z[{inspectedCell.worldMinZ}..{inspectedCell.worldMaxZ}m]
        </span>
      </div>

      {inspectedCell.isCurrentPlayerChunk && (
        <div
          className={`${isOverlay ? 'hidden sm:block' : ''} text-amber-300 text-[9px] sm:text-[10px]`}
        >
          Local: ({snapshot.playerLocalX}m, {snapshot.playerLocalZ}m) / 256m
        </div>
      )}

      <div className="text-slate-300 truncate text-[9px] sm:text-[10px]">
        Key:{' '}
        <span className="text-cyan-200">
          {inspectedCell.matchedKeys.length > 0
            ? inspectedCell.matchedKeys.join(', ')
            : 'Not cached'}
        </span>
      </div>
    </div>
  );

  const legendElement = (
    <div
      className={`${
        isOverlay ? 'hidden sm:flex' : 'flex'
      } flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[9px] sm:text-[10px] font-mono text-slate-400`}
    >
      <span className="flex items-center gap-1">
        <span
          aria-hidden="true"
          className="w-2 h-2 rounded-xs bg-amber-500/40 border border-amber-400"
        />
        <span>Active</span>
      </span>
      <span className="flex items-center gap-1">
        <span
          aria-hidden="true"
          className="w-2 h-2 rounded-xs bg-emerald-500/35 border border-emerald-400"
        />
        <span>Cached</span>
      </span>
      <span className="flex items-center gap-1">
        <span
          aria-hidden="true"
          className="w-2 h-2 rounded-xs bg-cyan-500/35 border border-cyan-400"
        />
        <span>Frontier</span>
      </span>
      <span className="flex items-center gap-1">
        <span
          aria-hidden="true"
          className="w-2 h-2 rounded-xs bg-slate-900 border border-slate-700"
        />
        <span>Uncached</span>
      </span>
    </div>
  );

  const content = (
    <div
      data-testid={isOverlay ? 'chunk-grid-debug-overlay' : 'admin-chunk-grid-embedded'}
      className={
        isOverlay
          ? 'w-[244px] sm:w-[264px] rounded-xl bg-slate-950/92 border border-cyan-500/45 shadow-2xl text-slate-100 pointer-events-auto overflow-hidden'
          : 'rounded-xl bg-slate-950/85 border border-slate-700/90 text-slate-100 overflow-hidden'
      }
    >
      {/* Header Bar */}
      <div
        className={`${
          isOverlay ? 'px-2.5 py-1' : 'px-2.5 py-1.5'
        } bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-2`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Grid3X3 className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
          <span className="text-[11px] font-mono font-bold text-white whitespace-nowrap truncate">
            {isOverlay ? 'Chunk Grid' : '256×256m Voxel Chunk Cache Grid'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div
            role="group"
            aria-label="Chunk grid radius"
            className="flex items-center bg-slate-950 border border-slate-800 rounded-md p-0.5"
          >
            <button
              type="button"
              data-testid={`${variant}-grid-radius-5`}
              onClick={() => setGridRadius(2)}
              aria-pressed={gridRadius === 2}
              className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ${
                gridRadius === 2
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              5×5
            </button>
            <button
              type="button"
              data-testid={`${variant}-grid-radius-7`}
              onClick={() => setGridRadius(3)}
              aria-pressed={gridRadius === 3}
              className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ${
                gridRadius === 3
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              7×7
            </button>
          </div>

          {isOverlay && onClose && (
            <button
              type="button"
              data-testid="close-chunk-grid-debug-overlay-btn"
              onClick={onClose}
              aria-label="Hide 256x256 Voxel Chunk Grid Debug Overlay"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {isOverlay ? (
        <div className="p-1.5 sm:p-2 space-y-1">
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-slate-400 tabular-nums">
            <span>
              256m · C({snapshot.playerChunkX},{snapshot.playerChunkZ}) ·{' '}
              <strong data-testid="overlay-chunk-cache-count" className="text-emerald-300">
                {snapshot.totalCachedKeyCount}
              </strong>{' '}
              cached
            </span>
            <span>
              {snapshot.visibleCachedCount}/{snapshot.totalVisibleCells} ({snapshot.cacheHitPercent}
              %)
            </span>
          </div>

          {matrixElement}
          {inspectorElement}
          {legendElement}
        </div>
      ) : (
        <div className="p-3 grid grid-cols-1 lg:grid-cols-[276px_1fr] gap-4 items-start">
          {/* Left Column: Compact 256x256 Matrix */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 tabular-nums">
              <span className="flex items-center gap-1">
                <Compass className="w-3 h-3 text-slate-500" aria-hidden="true" />
                <span>N (-Z) Up · E (+X) Right</span>
              </span>
              <span>
                In View: <strong className="text-emerald-300">{snapshot.visibleCachedCount}</strong>
                /{snapshot.totalVisibleCells}
              </span>
            </div>
            {matrixElement}
            {legendElement}
          </div>

          {/* Right Column: Live Sector Inspector & Raw streamedChunkKeysRef Entries */}
          <div className="space-y-2.5 min-w-0">
            <div className="grid grid-cols-3 gap-2 text-center font-mono tabular-nums">
              <div className="px-2 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <div className="text-[9px] text-slate-400">Active Chunk</div>
                <div className="text-xs font-bold text-amber-300">
                  C({snapshot.playerChunkX},{snapshot.playerChunkZ})
                </div>
              </div>
              <div className="px-2 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <div className="text-[9px] text-slate-400">Cached Keys</div>
                <div
                  data-testid="embedded-chunk-cache-count"
                  className="text-xs font-bold text-emerald-300"
                >
                  {snapshot.totalCachedKeyCount}
                </div>
              </div>
              <div className="px-2 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <div className="text-[9px] text-slate-400">Streamed</div>
                <div className="text-xs font-bold text-cyan-300">
                  {typeof streamedChunkCount === 'number'
                    ? streamedChunkCount
                    : snapshot.cachedCoordinateCount}
                </div>
              </div>
            </div>

            {inspectorElement}

            <div className="space-y-1">
              <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>streamedChunkKeysRef ({snapshot.rawKeys.length} entries)</span>
                <span>
                  {snapshot.chunkSizeMeters}m × {snapshot.chunkSizeMeters}m
                </span>
              </div>
              <div
                data-testid="admin-streamed-chunk-keys-list"
                className="text-[10px] font-mono text-cyan-200/90 bg-slate-900/70 border border-slate-800 rounded-md px-2.5 py-2 break-all leading-relaxed max-h-24 overflow-y-auto tabular-nums"
              >
                {snapshot.rawKeys.length > 0 ? snapshot.rawKeys.join(' · ') : 'Empty cache'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isOverlay) {
    return (
      <aside
        aria-label="256x256 Voxel Chunk Grid Debug Overlay"
        className="fixed top-[168px] left-2.5 sm:top-[58px] sm:left-auto sm:right-4 z-40 pointer-events-none"
      >
        {content}
      </aside>
    );
  }

  return content;
};
