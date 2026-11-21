/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { INITIAL_MODERATED_PLAYERS, INITIAL_SUPPORT_TICKETS } from '../game/adminModeration';
import {
  ALL_TERRITORY_SECTORS,
  AuthoritativeSiegeSectorState,
  TerritorySectorCode,
  createInitialAuthoritativeSiegeSectorState,
} from '../game/siegeNetProtocol';
import type { PersistedMultiRegionStore } from './types';

export function isValidPersistedStore(raw: unknown): raw is PersistedMultiRegionStore {
  if (!raw || typeof raw !== 'object') return false;
  const parsed = raw as Partial<PersistedMultiRegionStore>;
  return Boolean(
    parsed.sectors &&
    typeof parsed.sectors === 'object' &&
    parsed.sectors.B2 &&
    typeof parsed.activeSector === 'string' &&
    Array.isArray(parsed.moderatedPlayers)
  );
}

export function createDefaultStore(): PersistedMultiRegionStore {
  const sectors = {} as Record<TerritorySectorCode, AuthoritativeSiegeSectorState>;
  for (const sector of ALL_TERRITORY_SECTORS) {
    sectors[sector] = createInitialAuthoritativeSiegeSectorState(sector);
  }

  const nowIso = new Date().toISOString();
  return {
    primaryClusterId: 'us-east-solara-1',
    activeSector: 'B2',
    lastDiskFlushIso: nowIso,
    sectors,
    commanders: {
      'player-commander-01': {
        commanderId: 'player-commander-01',
        commanderName: 'Sovereign Vanguard',
        email: 'player01@voxelrealms.example',
        allianceTag: 'SOL',
        castleLevel: 12,
        cultivationRealmIndex: 2,
        vipTier: 0,
        karma: 50,
        garrisonTroopsWire: '250000',
        discoveredCodexCount: 4,
        preferredRegion: 'us-east-solara-1',
        updatedAtIso: nowIso,
      },
    },
    moderatedPlayers: [...INITIAL_MODERATED_PLAYERS],
    supportTickets: [...INITIAL_SUPPORT_TICKETS],
    securityAuditLog: [],
    activeDecrees: [],
    speciesSwitchGlobalApproved: false,
    economyAccounts: {},
  };
}
