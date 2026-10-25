/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Shield,
  Swords,
  Compass,
  Crosshair,
  Castle,
  Sparkles,
  Users,
  Send,
  Flag,
} from 'lucide-react';
import { ClanEmblem, ClanWarOutpost } from '../types/game';
import { formatBigInt } from '../game/math';
import {
  TerritoryGridSector,
  TerritorySectorType,
  buildClanTerritoryGrid,
  evaluateTerritoryControlSummary,
} from '../game/clanMath';
import { ClanEmblemView } from './ClanEmblemView';
import { sound } from '../game/audio';

interface ClanTerritoryMapProps {
  playerClanName: string;
  playerClanTag: string;
  playerClanEmblem: ClanEmblem;
  enemyClanName: string;
  enemyClanTag: string;
  enemyClanEmblem: ClanEmblem;
  outposts: ClanWarOutpost[];
  playerPower: bigint;
  onAssaultOutpost: (outpostId: string) => void;
  onSendTacticalPing?: (message: string) => void;
}

type ZoneFilter = 'all' | 'player_clan' | 'enemy_clan' | 'neutral';

const COLUMN_HEADERS = [
  { col: 0, code: 'Col 1', label: 'Western Bastion' },
  { col: 1, code: 'Col 2', label: 'Central Rift Frontier' },
  { col: 2, code: 'Col 3', label: 'Eastern Dread Keep' },
];

const ROW_LABELS = [
  { row: 0, code: 'Row A', subtitle: 'Northern Ridge' },
  { row: 1, code: 'Row B', subtitle: 'Sovereign Core' },
  { row: 2, code: 'Row C', subtitle: 'Southern Causeway' },
];

function getSectorTypeLabel(type: TerritorySectorType): string {
  switch (type) {
    case 'citadel':
      return 'Fortress Citadel';
    case 'obelisk':
      return 'Arcane Obelisk';
    case 'leyline':
      return 'Spirit Leyline';
    case 'watchtower':
      return 'Recon Watchtower';
    case 'depot':
      return 'Supply Granary';
    case 'causeway':
      return 'Siege Causeway';
    default:
      return 'Strategic Zone';
  }
}

export const ClanTerritoryMap: React.FC<ClanTerritoryMapProps> = ({
  playerClanName,
  playerClanTag,
  playerClanEmblem,
  enemyClanName,
  enemyClanTag,
  enemyClanEmblem,
  outposts,
  playerPower,
  onAssaultOutpost,
  onSendTacticalPing,
}) => {
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('all');
  const [selectedSectorCode, setSelectedSectorCode] = useState<string>('B2');
  const [lastActionBanner, setLastActionBanner] = useState<string | null>(null);

  const grid = useMemo(
    () => buildClanTerritoryGrid(outposts, playerPower),
    [outposts, playerPower]
  );

  const summary = useMemo(() => evaluateTerritoryControlSummary(grid), [grid]);

  const selectedSector: TerritoryGridSector = useMemo(() => {
    return (
      grid.find((s) => s.sectorCode === selectedSectorCode) ||
      grid.find((s) => s.sectorCode === 'B2') ||
      grid[0]
    );
  }, [grid, selectedSectorCode]);

  const handleSelectSector = (sector: TerritoryGridSector) => {
    sound.playSwing();
    setSelectedSectorCode(sector.sectorCode);
  };

  const handleExecuteSectorAction = (sector: TerritoryGridSector) => {
    const wasPlayerControlled = sector.controlledBy === 'player_clan';
    sound.playUpgradeFanfare();
    onAssaultOutpost(sector.outpostId);
    setLastActionBanner(
      wasPlayerControlled
        ? `Reinforced [${sector.sectorCode}] ${sector.name} with +50,000 Vanguard Troops!`
        : `Captured [${sector.sectorCode}] ${sector.name} for [${playerClanTag}] ${playerClanName}!`
    );
  };

  const handlePingSector = (sector: TerritoryGridSector) => {
    if (!onSendTacticalPing) return;
    sound.playSwing();
    const actionVerb =
      sector.controlledBy === 'player_clan'
        ? 'Reinforce allied garrison at'
        : sector.controlledBy === 'enemy_clan'
          ? 'Concentrate siege artillery on enemy zone'
          : 'Secure contested frontier sector';
    const pingText = `[Tactical Map ${sector.sectorCode}] ${actionVerb} ${sector.name} (${formatBigInt(sector.defenseRating)} DEF · +${sector.pointsPerMinute} pts/min)!`;
    onSendTacticalPing(pingText);
    setLastActionBanner(
      `Dispatched tactical coordinates for [${sector.sectorCode}] ${sector.name} to Clan Chat.`
    );
  };

  return (
    <div
      className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4"
      data-testid="clan-territory-map"
    >
      {/* Top Header & Sovereignty Control Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Compass className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Strategic Territory Theater</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-300 font-semibold" data-testid="territory-dominance-status">
              {summary.dominanceStatus}
            </span>
            <span aria-hidden="true">·</span>
            <span>{summary.frontlineSectorsCount} Active Frontline Sectors</span>
          </div>
          <h4 className="text-base sm:text-lg font-bold font-cinzel text-white mt-0.5">
            Clan Territory Control Map — Outposts vs. Enemy-Occupied Zones
          </h4>
        </div>

        {/* Interactive Filter Tabs */}
        <div
          className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800"
          role="group"
          aria-label="Filter territory zones by controller"
        >
          {[
            { id: 'all', label: `All Zones (${summary.totalSectors})` },
            {
              id: 'player_clan',
              label: `[${playerClanTag}] Controlled (${summary.playerControlledCount})`,
            },
            {
              id: 'enemy_clan',
              label: `[${enemyClanTag}] Occupied (${summary.enemyControlledCount})`,
            },
            { id: 'neutral', label: `Neutral (${summary.neutralCount})` },
          ].map((tab) => {
            const active = zoneFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`territory-filter-${tab.id}`}
                onClick={() => {
                  sound.playSwing();
                  setZoneFilter(tab.id as ZoneFilter);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sovereignty Balance Bar & Income Comparison */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums">
          <div className="flex items-center gap-2 text-blue-300">
            <ClanEmblemView emblem={playerClanEmblem} size="xs" />
            <span className="font-bold">
              [{playerClanTag}] {playerClanName}: {summary.playerControlledCount}/
              {summary.totalSectors} Outposts ({summary.playerControlPct}%)
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-emerald-300">+{summary.playerPointsPerMinute} pts/min</span>
          </div>

          <div className="text-slate-400">
            Neutral Frontier: {summary.neutralCount} ({summary.neutralControlPct}%)
          </div>

          <div className="flex items-center gap-2 text-rose-300">
            <span className="text-rose-400">+{summary.enemyPointsPerMinute} pts/min</span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="font-bold">
              [{enemyClanTag}] {enemyClanName}: {summary.enemyControlledCount}/
              {summary.totalSectors} Occupied ({summary.enemyControlPct}%)
            </span>
            <ClanEmblemView emblem={enemyClanEmblem} size="xs" />
          </div>
        </div>

        {/* 3-Segment Sovereignty Dominance Bar */}
        <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden flex border border-slate-800">
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${summary.playerControlPct}%` }}
            title={`Allied Control: ${summary.playerControlPct}%`}
          />
          <div
            className="bg-amber-500/70 h-full transition-all duration-300"
            style={{ width: `${summary.neutralControlPct}%` }}
            title={`Contested Neutral: ${summary.neutralControlPct}%`}
          />
          <div
            className="bg-rose-600 h-full transition-all duration-300"
            style={{ width: `${summary.enemyControlPct}%` }}
            title={`Enemy Occupied: ${summary.enemyControlPct}%`}
          />
        </div>
      </div>

      {/* Action Confirmation Banner */}
      {lastActionBanner && (
        <div
          data-testid="territory-action-banner"
          className="px-3.5 py-2 rounded-xl bg-blue-950/60 border border-blue-500/40 text-xs font-mono text-blue-200 flex items-center justify-between gap-2"
        >
          <span>{lastActionBanner}</span>
          <button
            type="button"
            onClick={() => setLastActionBanner(null)}
            className="text-slate-400 hover:text-white text-[11px] font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split View: 3x3 Strategic Territory Grid (Left 7 cols) + Tactical Inspector (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left 7 Cols: 3x3 Coordinate Outpost Grid */}
        <div className="lg:col-span-7 space-y-2">
          {/* Column Axis Headers */}
          <div className="grid grid-cols-3 gap-2.5 px-1">
            {COLUMN_HEADERS.map((col) => (
              <div
                key={col.col}
                className="text-[11px] font-mono text-slate-400 flex items-center justify-between px-2 py-1 rounded-lg bg-slate-900/70 border border-slate-800/80"
              >
                <span className="font-bold text-slate-300">{col.code}</span>
                <span className="truncate ml-1">{col.label}</span>
              </div>
            ))}
          </div>

          {/* 3x3 Sector Matrix */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
            data-testid="clan-territory-map-grid"
          >
            {grid.map((sector) => {
              const isSelected = selectedSector.sectorCode === sector.sectorCode;
              const isFilteredOut = zoneFilter !== 'all' && sector.controlledBy !== zoneFilter;
              const isPlayer = sector.controlledBy === 'player_clan';
              const isEnemy = sector.controlledBy === 'enemy_clan';

              const tileStyle = isPlayer
                ? 'bg-blue-950/45 border-blue-500/60 hover:border-blue-400 text-blue-100'
                : isEnemy
                  ? 'bg-rose-950/45 border-rose-500/60 hover:border-rose-400 text-rose-100'
                  : 'bg-slate-900/85 border-amber-500/50 hover:border-amber-400 text-amber-100';

              const selectedRing = isSelected
                ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-500/10'
                : '';

              return (
                <button
                  key={sector.sectorCode}
                  type="button"
                  data-testid={`territory-sector-${sector.sectorCode}`}
                  data-controller={sector.controlledBy}
                  onClick={() => handleSelectSector(sector)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer ${tileStyle} ${selectedRing} ${
                    isFilteredOut ? 'opacity-30' : 'opacity-100'
                  }`}
                >
                  {/* Top Row: Sector Coordinate + Occupation Status */}
                  <div className="w-full flex items-center justify-between gap-1 text-[11px] font-mono tabular-nums">
                    <span className="font-bold text-white flex items-center gap-1">
                      <span>[{sector.sectorCode}]</span>
                      <span className="text-slate-400 font-normal">
                        {ROW_LABELS[sector.row]?.subtitle.split(' ')[0]}
                      </span>
                    </span>
                    <span
                      className={
                        isPlayer
                          ? 'text-blue-300 font-semibold'
                          : isEnemy
                            ? 'text-rose-300 font-semibold'
                            : 'text-amber-300 font-semibold'
                      }
                    >
                      {isPlayer
                        ? `[${playerClanTag}] Held`
                        : isEnemy
                          ? `[${enemyClanTag}] Zone`
                          : 'Contested'}
                    </span>
                  </div>

                  {/* Middle Row: Sector Name & Type */}
                  <div>
                    <div className="text-xs sm:text-sm font-bold font-cinzel text-white truncate">
                      {sector.name}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>{getSectorTypeLabel(sector.sectorType)}</span>
                      {sector.isFrontlineContested && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-300 font-mono">Frontline</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bottom Telemetry: Garrison & Output */}
                  <div className="w-full pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono tabular-nums">
                    <span className="text-slate-300">DEF {formatBigInt(sector.defenseRating)}</span>
                    <span
                      className={
                        isPlayer
                          ? 'text-emerald-300 font-bold'
                          : isEnemy
                            ? 'text-rose-300 font-bold'
                            : 'text-amber-300 font-bold'
                      }
                    >
                      +{sector.pointsPerMinute}/m
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Map Legend Bar */}
          <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 px-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-blue-300">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                Controlled Outpost ([{playerClanTag}])
              </span>
              <span className="flex items-center gap-1.5 text-rose-300">
                <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                Enemy-Occupied Zone ([{enemyClanTag}])
              </span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <Flag className="w-3.5 h-3.5 text-amber-400" />
                Contested Neutral Sector
              </span>
            </div>
            <span>Click any sector to inspect or launch assault</span>
          </div>
        </div>

        {/* Right 5 Cols: Selected Sector Tactical Inspector & Command Panel */}
        <div
          className="lg:col-span-5 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3.5"
          data-testid="territory-sector-inspector"
        >
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                <span>Sector {selectedSector.sectorCode}</span>
                <span aria-hidden="true">·</span>
                <span>{getSectorTypeLabel(selectedSector.sectorType)}</span>
                {selectedSector.isFrontlineContested && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-300 font-semibold">Active Frontline</span>
                  </>
                )}
              </div>
              <h5
                className="text-base font-bold font-cinzel text-white mt-0.5"
                data-testid="inspector-sector-name"
              >
                {selectedSector.name}
              </h5>
            </div>

            <div className="text-right font-mono text-xs">
              <div
                data-testid="inspector-sector-controller"
                className={
                  selectedSector.controlledBy === 'player_clan'
                    ? 'text-blue-300 font-bold'
                    : selectedSector.controlledBy === 'enemy_clan'
                      ? 'text-rose-300 font-bold'
                      : 'text-amber-300 font-bold'
                }
              >
                {selectedSector.controlledBy === 'player_clan'
                  ? `Held by [${playerClanTag}]`
                  : selectedSector.controlledBy === 'enemy_clan'
                    ? `Occupied by [${enemyClanTag}]`
                    : 'Unclaimed Frontier'}
              </div>
              <div className="text-[11px] text-emerald-400">
                +{selectedSector.pointsPerMinute} War Pts/min
              </div>
            </div>
          </div>

          {/* Key Tactical Metrics */}
          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono tabular-nums">
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/90">
              <div className="text-[11px] text-slate-400">Fortification DEF</div>
              <div className="text-sm font-bold text-amber-300 mt-0.5">
                {formatBigInt(selectedSector.defenseRating)}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/90">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" /> Garrison Troops
              </div>
              <div
                className="text-sm font-bold text-slate-100 mt-0.5"
                data-testid="inspector-sector-garrison"
              >
                {formatBigInt(selectedSector.garrisonTroops)}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/90">
              <div className="text-[11px] text-slate-400">Your Strike Might</div>
              <div className="text-sm font-bold text-cyan-300 mt-0.5">
                {formatBigInt(playerPower)}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/90">
              <div className="text-[11px] text-slate-400">Siege Success Odds</div>
              <div
                className={`text-sm font-bold mt-0.5 ${
                  selectedSector.assaultWinProbabilityPct >= 75
                    ? 'text-emerald-400'
                    : selectedSector.assaultWinProbabilityPct >= 45
                      ? 'text-amber-300'
                      : 'text-rose-400'
                }`}
              >
                {selectedSector.assaultWinProbabilityPct}% Victory Est.
              </div>
            </div>
          </div>

          {/* Strategic Sector Bonus */}
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/90 space-y-1">
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sector Sovereignty Bonus</span>
            </div>
            <p className="text-xs text-slate-200 font-medium">{selectedSector.strategicBonus}</p>
          </div>

          {/* Direct Tactical Actions */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              data-testid="territory-assault-btn"
              onClick={() => handleExecuteSectorAction(selectedSector)}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedSector.controlledBy === 'player_clan'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 active:scale-95'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 active:scale-95'
              }`}
            >
              {selectedSector.controlledBy === 'player_clan' ? (
                <>
                  <Castle className="w-4 h-4" />
                  Reinforce Outpost Garrison (+50K Troops)
                </>
              ) : (
                <>
                  <Swords className="w-4 h-4" />
                  Launch Siege Assault on [{selectedSector.sectorCode}]
                </>
              )}
            </button>

            {onSendTacticalPing && (
              <button
                type="button"
                data-testid="territory-ping-btn"
                onClick={() => handlePingSector(selectedSector)}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-blue-400" />
                Dispatch Sector [{selectedSector.sectorCode}] Coordinates to Clan Chat
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
