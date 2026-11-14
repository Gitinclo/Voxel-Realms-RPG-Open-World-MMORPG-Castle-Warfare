/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Radio,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { ClanEmblem, ClanWarOutpost } from '../types/game';
import { MAX_RALLY_CAPACITY, formatBigInt } from '../game/math';
import {
  TerritoryGridSector,
  TerritorySectorType,
  buildClanTerritoryGrid,
  evaluateTerritoryControlSummary,
} from '../game/clanMath';
import {
  AuthoritativeSiegeSectorState,
  ClientPredictionRingBuffer,
  MultiRegionClusterId,
  MultiRegionReplicationSnapshot,
  RallyActionCommandPacket,
  SiegeDeltaUpdatePacket,
  SiegeFormationType,
  SiegeNetEnvelope,
  SiegeNetOpcode,
  TerritorySectorCode,
  TroopPositionCommandPacket,
  applyRallyActionCommand,
  applySiegeDeltaUpdate,
  applyTroopPositionCommand,
  buildMultiRegionReplicationStatus,
  createInitialAuthoritativeSiegeSectorState,
  dequantizeCoordInt16,
  deserializeBigIntWire,
  quantizeCoordInt16,
  reconcileClientPrediction,
  stepAuthoritativeSiegeTick,
} from '../game/siegeNetProtocol';
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

const FORMATIONS: { id: SiegeFormationType; label: string; bonus: string }[] = [
  { id: 'SHIELD_WALL', label: 'Shield Wall', bonus: '+45% DEF · 0.72x SPD' },
  { id: 'PHALANX_ADVANCE', label: 'Phalanx Advance', bonus: '+25% DEF · +15% ATK' },
  { id: 'WEDGE_CHARGE', label: 'Wedge Charge', bonus: '+40% ATK · 1.35x SPD' },
  { id: 'LOOSE_SKIRMISH', label: 'Loose Skirmish', bonus: '+5% ATK/DEF · 1.15x SPD' },
];

const REGION_CLUSTERS: { id: MultiRegionClusterId; label: string }[] = [
  { id: 'us-east-solara-1', label: 'US-East · Solara-1' },
  { id: 'eu-central-valhalla-1', label: 'EU-Central · Valhalla-1' },
  { id: 'ap-southeast-celestia-1', label: 'AP-Southeast · Celestia-1' },
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
  const [selectedSectorCode, setSelectedSectorCode] = useState<TerritorySectorCode>('B2');
  const [lastActionBanner, setLastActionBanner] = useState<string | null>(null);

  // Authoritative 20Hz 50v50 WebSocket Siege & Multi-Region Persistence state
  const [siegeState, setSiegeState] = useState<AuthoritativeSiegeSectorState>(() =>
    createInitialAuthoritativeSiegeSectorState('B2')
  );
  const [activeRegion, setActiveRegion] = useState<MultiRegionClusterId>('us-east-solara-1');
  const [replicationSnapshot, setReplicationSnapshot] = useState<MultiRegionReplicationSnapshot>(
    () =>
      buildMultiRegionReplicationStatus(
        'us-east-solara-1',
        createInitialAuthoritativeSiegeSectorState('B2'),
        1,
        new Date().toISOString()
      )
  );
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [selectedFormation, setSelectedFormation] = useState<SiegeFormationType>('SHIELD_WALL');
  const [cspModeLabel, setCspModeLabel] = useState<string>('EXACT_MATCH');
  const [lastDeltaBytes, setLastDeltaBytes] = useState<{ raw: number; compressed: number }>({
    raw: 1344,
    compressed: 156,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const clientSeqRef = useRef<number>(1);
  const cspRingRef = useRef<ClientPredictionRingBuffer>(new ClientPredictionRingBuffer());

  // Ensure a valid server-issued HMAC session cookie exists before connecting /ws/siege
  useEffect(() => {
    let isMounted = true;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    const initOnlineSiegeSession = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session', { credentials: 'same-origin' });
        const sessionData = sessionRes.ok
          ? ((await sessionRes.json()) as { authenticated?: boolean })
          : null;
        if (!sessionData?.authenticated) {
          await fetch('/api/auth/player-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
              commanderId: 'player-commander-01',
              displayName: 'Sovereign Vanguard',
              email: 'player@voxelrealms.example',
            }),
          });
        }
      } catch {
        // Offline fallback continues cleanly below
      }

      if (!isMounted) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/siege?sector=${selectedSectorCode}`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          if (!isMounted || typeof event.data !== 'string') return;
          try {
            const env = JSON.parse(event.data) as SiegeNetEnvelope<unknown>;
            if (env.opcode === SiegeNetOpcode.S2C_FULL_SIEGE_SNAPSHOT) {
              const payload = env.payload as { sectorState: AuthoritativeSiegeSectorState };
              if (payload?.sectorState) {
                setSiegeState(payload.sectorState);
                setReplicationSnapshot((prev) =>
                  buildMultiRegionReplicationStatus(
                    prev.primaryClusterId,
                    payload.sectorState,
                    prev.persistedCommandersCount,
                    prev.lastDiskFlushIso
                  )
                );
              }
            } else if (env.opcode === SiegeNetOpcode.S2C_DELTA_SIEGE_UPDATE) {
              const deltaEnv = env as SiegeNetEnvelope<SiegeDeltaUpdatePacket>;
              setLastDeltaBytes({
                raw: deltaEnv.payload.uncompressedBytesEstimate,
                compressed: deltaEnv.payload.compressedBytesEstimate,
              });
              setSiegeState((prev) => {
                const updated = applySiegeDeltaUpdate(prev, deltaEnv);
                const c0 = updated.cohorts[0];
                if (c0) {
                  const rec = reconcileClientPrediction(
                    cspRingRef.current,
                    deltaEnv.ackClientSeq,
                    c0,
                    c0.posXQuantized,
                    c0.posZQuantized
                  );
                  setCspModeLabel(rec.mode);
                }
                setReplicationSnapshot((rep) =>
                  buildMultiRegionReplicationStatus(
                    rep.primaryClusterId,
                    updated,
                    rep.persistedCommandersCount,
                    rep.lastDiskFlushIso
                  )
                );
                return updated;
              });
            }
          } catch {
            // Ignore malformed WS frame
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setWsConnected(false);
        };

        ws.onerror = () => {
          if (!isMounted) return;
          setWsConnected(false);
        };
      } catch {
        setWsConnected(false);
      }

      // Fetch initial multi-region status via REST
      fetch(`/api/online/status?sector=${selectedSectorCode}`, { credentials: 'same-origin' })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!isMounted || !data?.ok) return;
          if (data.sectorState) setSiegeState(data.sectorState);
          if (data.replication) setReplicationSnapshot(data.replication);
        })
        .catch(() => {
          // Fallback ticker keeps deterministic 50v50 siege advancing if offline
        });
    };

    void initOnlineSiegeSession();

    fallbackInterval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setSiegeState((prev) => {
          const { nextState, deltaPacket } = stepAuthoritativeSiegeTick(prev);
          setLastDeltaBytes({
            raw: deltaPacket.payload.uncompressedBytesEstimate,
            compressed: deltaPacket.payload.compressedBytesEstimate,
          });
          return nextState;
        });
      }
    }, 250);

    return () => {
      isMounted = false;
      if (fallbackInterval) clearInterval(fallbackInterval);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [selectedSectorCode]);

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
    const code = sector.sectorCode as TerritorySectorCode;
    setSelectedSectorCode(code);
    setSiegeState(createInitialAuthoritativeSiegeSectorState(code));
  };

  const handleDispatchFormationCommand = (formation: SiegeFormationType) => {
    sound.playSwing();
    setSelectedFormation(formation);
    const seq = clientSeqRef.current++;
    const c0 = siegeState.cohorts[0];
    const targetXQuantized = quantizeCoordInt16(14);
    const targetZQuantized = quantizeCoordInt16(0);

    if (c0) {
      cspRingRef.current.recordFrame({
        clientSeq: seq,
        cohortId: 0,
        predictedPosXQuantized: c0.posXQuantized,
        predictedPosZQuantized: c0.posZQuantized,
        targetXQuantized,
        targetZQuantized,
        formation,
      });
    }

    const troopCmd: TroopPositionCommandPacket = {
      commanderId: 'player-commander-01',
      cohortId: 0,
      clientSeq: seq,
      targetXQuantized,
      targetZQuantized,
      facingAngleQuantized: 0,
      formation,
      primaryBranch: 'shieldbearer',
    };

    setSiegeState((prev) => applyTroopPositionCommand(prev, troopCmd));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          opcode: SiegeNetOpcode.C2S_TROOP_POSITION_CMD,
          sector: selectedSectorCode,
          payload: troopCmd,
        })
      );
    } else {
      fetch('/api/online/siege/cmd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ sector: selectedSectorCode, troopCmd }),
      }).catch(() => {});
    }

    setLastActionBanner(
      `Dispatched C2S_TROOP_POSITION_CMD (0x01 · Seq #${seq}): Vanguard Cohort #0 -> ${formation} on Sector [${selectedSectorCode}].`
    );
  };

  const handleJoinOrLaunchRally = (action: 'JOIN_RALLY' | 'LAUNCH_NOW') => {
    sound.playUpgradeFanfare();
    const rallyCmd: RallyActionCommandPacket = {
      commanderId: 'player-commander-01',
      commanderName: 'Sovereign Vanguard (You)',
      commanderRealmIndex: 7,
      allianceTag: playerClanTag,
      action,
      sector: selectedSectorCode,
      shieldbearersWire: '50000000000',
      shootersWire: '40000000000',
      bombersWire: '35000000000',
      troopTier: 18,
    };

    setSiegeState((prev) => applyRallyActionCommand(prev, rallyCmd));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          opcode: SiegeNetOpcode.C2S_RALLY_ACTION_CMD,
          sector: selectedSectorCode,
          payload: rallyCmd,
        })
      );
    } else {
      fetch('/api/online/siege/cmd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ sector: selectedSectorCode, rallyCmd }),
      }).catch(() => {});
    }

    setLastActionBanner(
      action === 'LAUNCH_NOW'
        ? `Dispatched C2S_RALLY_ACTION_CMD (0x02): 1T War Rally locked & marching on Sector [${selectedSectorCode}]!`
        : `Dispatched C2S_RALLY_ACTION_CMD (0x02): Committed +125B Tri-Branch Troops to 1T War Rally on [${selectedSectorCode}]!`
    );
  };

  const handleSyncMultiRegionState = async (clusterId: MultiRegionClusterId) => {
    sound.playUpgradeFanfare();
    setActiveRegion(clusterId);
    try {
      const resp = await fetch('/api/online/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          primaryClusterId: clusterId,
          sector: selectedSectorCode,
          commanderId: 'player-commander-01',
          commanderName: 'Sovereign Vanguard',
          allianceTag: playerClanTag,
          preferredRegion: clusterId,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.replication) setReplicationSnapshot(data.replication);
        if (data.sectorState) setSiegeState(data.sectorState);
      } else {
        setReplicationSnapshot((prev) =>
          buildMultiRegionReplicationStatus(
            clusterId,
            siegeState,
            prev.persistedCommandersCount,
            new Date().toISOString()
          )
        );
      }
    } catch {
      setReplicationSnapshot((prev) =>
        buildMultiRegionReplicationStatus(
          clusterId,
          siegeState,
          prev.persistedCommandersCount,
          new Date().toISOString()
        )
      );
    }
    setLastActionBanner(
      `Replicated authoritative realm state across 3 regional clusters (Primary: ${clusterId} · FNV-1a 0x${siegeState.stateHash.toString(16).toUpperCase()}).`
    );
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

  const rallyCommittedBigInt = deserializeBigIntWire(
    siegeState.activeRally.totalCommittedTroopsWire,
    MAX_RALLY_CAPACITY
  );
  const rallyFillPct = Math.min(
    100,
    Math.round((Number(rallyCommittedBigInt) / Number(MAX_RALLY_CAPACITY)) * 100)
  );

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

      {/* Authoritative 20Hz 50v50 WebSocket Siege & Multi-Region Persistence Console */}
      <div
        className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-3"
        data-testid="live-siege-websocket-console"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span
              data-testid="siege-ws-status-badge"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold ${
                wsConnected
                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                  : 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50'
              }`}
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              {wsConnected ? 'LIVE 20Hz WEBSOCKET (/ws/siege)' : '20Hz AUTHORITATIVE SIEGE ENGINE'}
            </span>
            <span className="text-slate-300">
              Tick <strong className="text-white">#{siegeState.serverTick}</strong> (50ms)
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-amber-300">
              FNV-1a 0x{siegeState.stateHash.toString(16).toUpperCase().padStart(8, '0')}
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-emerald-300">
              Delta {lastDeltaBytes.compressed}B / {lastDeltaBytes.raw}B · CSP {cspModeLabel}
            </span>
          </div>

          {/* Multi-Region Persistence Node Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            {REGION_CLUSTERS.map((reg) => {
              const isPrimary = activeRegion === reg.id;
              return (
                <button
                  key={reg.id}
                  type="button"
                  data-testid={`region-node-${reg.id}`}
                  onClick={() => handleSyncMultiRegionState(reg.id)}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                    isPrimary
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {reg.label}
                </button>
              );
            })}
            <button
              type="button"
              data-testid="multi-region-sync-btn"
              onClick={() => handleSyncMultiRegionState(activeRegion)}
              className="px-2.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Sync Quorum ({replicationSnapshot.clusters.length}/3)
            </button>
          </div>
        </div>

        {/* Live 50v50 Formation Command Bar + 1-Trillion Rally Assembly + Fortification HP */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          {/* Formation Selector (5 cols) */}
          <div className="lg:col-span-5 space-y-1.5">
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>50v50 Vanguard Cohort #0 Formation (C2S 0x01)</span>
              <span className="text-cyan-300">
                Pos ({dequantizeCoordInt16(siegeState.cohorts[0]?.posXQuantized ?? 0).toFixed(1)}m,{' '}
                {dequantizeCoordInt16(siegeState.cohorts[0]?.posZQuantized ?? 0).toFixed(1)}m)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {FORMATIONS.map((fmt) => {
                const isSelected = selectedFormation === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    data-testid={`siege-formation-${fmt.id}`}
                    onClick={() => handleDispatchFormationCommand(fmt.id)}
                    className={`px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-400 text-white'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-bold font-mono">{fmt.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{fmt.bonus}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1-Trillion War Rally Synchronization (4 cols) */}
          <div className="lg:col-span-4 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-amber-300 font-bold">
                1T War Rally ({siegeState.activeRally.phase})
              </span>
              <span className="text-slate-300">
                {formatBigInt(rallyCommittedBigInt)} / 1.00T ({rallyFillPct}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${rallyFillPct}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                type="button"
                data-testid="siege-join-rally-btn"
                onClick={() => handleJoinOrLaunchRally('JOIN_RALLY')}
                className="flex-1 py-1 px-2 rounded-md bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono font-bold text-[11px] cursor-pointer"
              >
                +125B Join Rally
              </button>
              <button
                type="button"
                data-testid="siege-launch-rally-btn"
                onClick={() => handleJoinOrLaunchRally('LAUNCH_NOW')}
                className="flex-1 py-1 px-2 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-[11px] cursor-pointer"
              >
                Launch Siege (0x02)
              </button>
            </div>
          </div>

          {/* Fortification Integrity Telemetry (3 cols) */}
          <div className="lg:col-span-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="text-[11px] font-mono text-slate-400">
              Sector [{selectedSectorCode}] Fortifications
            </div>
            {siegeState.fortifications.slice(0, 2).map((fort) => {
              const hp = deserializeBigIntWire(fort.integrityHpWire);
              const maxHp = deserializeBigIntWire(fort.maxIntegrityHpWire);
              const pct = maxHp > 0n ? Math.round((Number(hp) / Number(maxHp)) * 100) : 0;
              return (
                <div key={fort.structureId} className="text-[11px] font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span className="truncate">{fort.structureType.replace('_', ' ')}</span>
                    <span
                      className={fort.breached ? 'text-rose-400 font-bold' : 'text-emerald-300'}
                    >
                      {fort.breached ? 'BREACHED' : `${pct}%`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
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
