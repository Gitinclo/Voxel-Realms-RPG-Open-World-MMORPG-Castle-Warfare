/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Compass, DownloadCloud, Castle as CastleIcon, ZoomIn, ZoomOut } from 'lucide-react';
import { ResourceNode, ResourceType } from '../types/game';
import { ChunkBoundaryProximityEvaluation } from '../game/openWorld3DEngine';
import { sound } from '../game/audio';

export interface MinimapProps {
  playerX: number;
  playerZ: number;
  resourceNodes: ResourceNode[];
  boundaryStatus?: ChunkBoundaryProximityEvaluation;
  streamedChunkCount?: number;
  onSelectResourceNode?: (node: ResourceNode) => void;
  onSelectCastle?: () => void;
  onFetchNewAreaData?: () => void;
}

const RESOURCE_NODE_STYLES: Record<
  ResourceType,
  { label: string; colorClass: string; dotHex: string; shortCode: string }
> = {
  wood: {
    label: 'Wood',
    colorClass: 'bg-emerald-500 border-emerald-200 text-slate-950',
    dotHex: '#10b981',
    shortCode: 'W',
  },
  grain: {
    label: 'Grain',
    colorClass: 'bg-lime-400 border-lime-100 text-slate-950',
    dotHex: '#a3e635',
    shortCode: 'G',
  },
  steel: {
    label: 'Steel',
    colorClass: 'bg-slate-300 border-white text-slate-950',
    dotHex: '#cbd5e1',
    shortCode: 'S',
  },
  copper: {
    label: 'Copper',
    colorClass: 'bg-amber-500 border-amber-200 text-slate-950',
    dotHex: '#f59e0b',
    shortCode: 'C',
  },
  oil: {
    label: 'Oil',
    colorClass: 'bg-purple-500 border-purple-200 text-white',
    dotHex: '#a855f7',
    shortCode: 'O',
  },
  diamond: {
    label: 'Diamond',
    colorClass: 'bg-cyan-400 border-cyan-100 text-slate-950',
    dotHex: '#22d3ee',
    shortCode: 'D',
  },
};

export const Minimap: React.FC<MinimapProps> = ({
  playerX,
  playerZ,
  resourceNodes,
  boundaryStatus,
  streamedChunkCount = 9,
  onSelectResourceNode,
  onSelectCastle,
  onFetchNewAreaData,
}) => {
  const [radarRadiusMeters, setRadarRadiusMeters] = useState<number>(45);
  const isNearEdge = Boolean(boundaryStatus?.isNearChunkEdge);

  const projectToRadarPct = (worldX: number, worldZ: number) => {
    const dx = worldX - playerX;
    const dz = worldZ - playerZ;
    const normX = Math.max(-0.92, Math.min(0.92, dx / radarRadiusMeters));
    const normZ = Math.max(-0.92, Math.min(0.92, dz / radarRadiusMeters));
    return {
      leftPct: 50 + normX * 44,
      topPct: 50 + normZ * 44,
      distanceMeters: Math.round(Math.hypot(dx, dz)),
    };
  };

  const citadelProj = projectToRadarPct(0, 0);

  return (
    <div
      data-testid="hud-minimap"
      className={`pointer-events-auto w-44 sm:w-52 rounded-2xl bg-slate-950/95 border shadow-2xl p-2.5 transition-colors ${
        isNearEdge ? 'border-amber-400 shadow-amber-500/20' : 'border-slate-800'
      }`}
    >
      {/* Header Row: Title, Chunk Coord & Radar Range Toggle */}
      <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-800/90">
        <div className="flex items-center gap-1.5 min-w-0">
          <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-[11px] font-bold font-cinzel text-slate-100 truncate">
            Realm Radar
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span
            data-testid="minimap-chunk-coord"
            className="text-[9px] font-mono text-slate-400 tabular-nums"
            title="Current Streamed World Chunk"
          >
            C({boundaryStatus?.chunkX ?? 0},{boundaryStatus?.chunkZ ?? 0})
          </span>
          <button
            type="button"
            data-testid="minimap-zoom-toggle-btn"
            onClick={() => {
              sound.playSwing();
              setRadarRadiusMeters((prev) => (prev === 45 ? 100 : 45));
            }}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
            aria-label={
              radarRadiusMeters === 45 ? 'Zoom out minimap radar' : 'Zoom in minimap radar'
            }
            title={`Radar Range: ±${radarRadiusMeters}m (Click to toggle)`}
          >
            {radarRadiusMeters === 45 ? (
              <ZoomOut className="w-3 h-3 text-cyan-300" />
            ) : (
              <ZoomIn className="w-3 h-3 text-amber-300" />
            )}
          </button>
        </div>
      </div>

      {/* Radar Map Viewport */}
      <div
        data-testid="minimap-radar-surface"
        className={`relative mt-2 w-full aspect-square rounded-xl bg-slate-900 overflow-hidden border ${
          isNearEdge ? 'border-amber-400/80' : 'border-slate-800'
        }`}
      >
        {/* Radar Grid Lines & Range Rings */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-35"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r="22"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="0.6"
            strokeDasharray="2 2"
          />
          <circle cx="50" cy="50" r="42" fill="none" stroke="#475569" strokeWidth="0.6" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="#334155" strokeWidth="0.6" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#334155" strokeWidth="0.6" />
          {isNearEdge && (
            <rect
              x="2"
              y="2"
              width="96"
              height="96"
              rx="6"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
          )}
        </svg>

        {/* Cardinal Directions */}
        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold text-slate-400 pointer-events-none">
          N
        </span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold text-slate-400 pointer-events-none">
          S
        </span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-mono font-bold text-slate-400 pointer-events-none">
          W
        </span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] font-mono font-bold text-slate-400 pointer-events-none">
          E
        </span>

        {/* Solara Citadel Central Keep Pin (0, 0) */}
        <button
          type="button"
          data-testid="minimap-citadel-marker"
          onClick={() => {
            sound.playSwing();
            onSelectCastle?.();
          }}
          style={{
            left: `${citadelProj.leftPct}%`,
            top: `${citadelProj.topPct}%`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-amber-500/90 hover:bg-amber-400 border border-amber-100 text-slate-950 flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110 z-10"
          title={`Solara Citadel Keep (0, 0) · ${citadelProj.distanceMeters}m away`}
          aria-label="Solara Citadel Keep on Minimap"
        >
          <CastleIcon className="w-3 h-3" />
        </button>

        {/* Surrounding Resource Nodes */}
        {resourceNodes.map((node) => {
          const style = RESOURCE_NODE_STYLES[node.type] || RESOURCE_NODE_STYLES.wood;
          const proj = projectToRadarPct(node.x, node.z);
          return (
            <button
              key={node.id}
              type="button"
              data-testid={`minimap-node-${node.id}`}
              onClick={() => {
                sound.playSwing();
                onSelectResourceNode?.(node);
              }}
              style={{
                left: `${proj.leftPct}%`,
                top: `${proj.topPct}%`,
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border text-[8px] font-mono font-black flex items-center justify-center shadow cursor-pointer transition-transform hover:scale-125 z-20 ${style.colorClass}`}
              title={`Lv.${node.level} ${style.label} Node (${node.x}, ${node.z}) · ${proj.distanceMeters}m`}
              aria-label={`Lv.${node.level} ${style.label} Resource Node at ${node.x}, ${node.z}`}
            >
              {style.shortCode}
            </button>
          );
        })}

        {/* Player Real-Time Position Marker (Center of Radar) */}
        <div
          data-testid="minimap-player-marker"
          style={{ left: '50%', top: '50%' }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-cyan-400 shadow-md z-30 pointer-events-none"
          title={`Player Position (${Math.round(playerX)}, ${Math.round(playerZ)})`}
        />
      </div>

      {/* Live Coordinates & Resource Node Count Footer */}
      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-300 tabular-nums">
        <span data-testid="minimap-player-coords">
          X:{Math.round(playerX)} · Z:{Math.round(playerZ)}
        </span>
        <span className="text-emerald-300" data-testid="minimap-node-count">
          {resourceNodes.length} Nodes · {streamedChunkCount} Chunks
        </span>
      </div>

      {/* Compact Chunk Edge Fetch Action if Approaching Boundary */}
      {isNearEdge && onFetchNewAreaData && (
        <button
          type="button"
          data-testid="minimap-fetch-area-btn"
          onClick={() => {
            sound.playSwing();
            onFetchNewAreaData();
          }}
          className="mt-1.5 w-full px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
        >
          <DownloadCloud className="w-3 h-3 shrink-0" />
          <span className="truncate">Fetch {boundaryStatus?.approachingDirection} Area</span>
        </button>
      )}
    </div>
  );
};
