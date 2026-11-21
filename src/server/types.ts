/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request, Response } from 'express';
import type { Duplex } from 'node:stream';
import type {
  AdminPermissions,
  ModeratedPlayerRecord,
  SecurityAuditEntry,
  ServerSessionInfo,
  SupportTicket,
} from '../game/adminModeration';
import type {
  AuthoritativeSiegeSectorState,
  MultiRegionClusterId,
  PersistedRealmPlayerSnapshot,
  SiegeNetEnvelope,
  TerritorySectorCode,
} from '../game/siegeNetProtocol';
import type { CommanderEconomyAccount } from '../game/economyLedger';
import type {
  BruteForceLockoutGuard,
  SlidingWindowRateLimiter,
  TickLatencyTracker,
} from '../game/serverHardening';
import type { AtomicRealmPersistence } from '../game/serverPersistence';
import type { AntiCheatGuard } from '../game/antiCheat';
import type { ServerRuntimeSecurityConfig } from '../game/serverAuth';
import type { ServerCoordinationStore } from './coordinationStore';
import type { AuthoritativeEconomyService } from './economyService';

export interface ServerDecreeRecord {
  id: string;
  authorEmail: string;
  authorRole: string;
  message: string;
  createdAtIso: string;
}

export interface PersistedMultiRegionStore {
  primaryClusterId: MultiRegionClusterId;
  activeSector: TerritorySectorCode;
  lastDiskFlushIso: string;
  sectors: Record<TerritorySectorCode, AuthoritativeSiegeSectorState>;
  commanders: Record<string, PersistedRealmPlayerSnapshot>;
  moderatedPlayers: ModeratedPlayerRecord[];
  supportTickets: SupportTicket[];
  securityAuditLog: SecurityAuditEntry[];
  activeDecrees: ServerDecreeRecord[];
  speciesSwitchGlobalApproved: boolean;
  economyAccounts?: Record<string, CommanderEconomyAccount>;
}

export interface ConnectedSiegePeer {
  id: string;
  ip: string;
  socket: Duplex;
  subscribedSector: TerritorySectorCode;
  connectedAtIso: string;
  session: ServerSessionInfo | null;
  rxBuffer: Buffer;
  msgLimiter: SlidingWindowRateLimiter;
  rateViolations: number;
  lastClientSeq: number;
}

export interface OpsCounters {
  startedAtIso: string;
  httpRequestsTotal: number;
  rateLimitBlocks: number;
  csrfBlocks: number;
  prototypePollutionBlocks: number;
  wsConnectionsAccepted: number;
  wsConnectionsRejected: number;
  wsFramesRejected: number;
  wsRateLimitDisconnects: number;
  wsSlowConsumerDisconnects: number;
  antiCheatRejections: number;
  antiCheatSanitizedWrites: number;
  antiCheatStrikeLockouts: number;
}

export interface ServerContext {
  port: number;
  trustProxy: boolean | number | string | string[];
  securityConfig: ServerRuntimeSecurityConfig;
  store: PersistedMultiRegionStore;
  persistence: AtomicRealmPersistence<PersistedMultiRegionStore>;
  peers: Map<string, ConnectedSiegePeer>;
  apiWriteLimiter: SlidingWindowRateLimiter;
  loginLockoutGuard: BruteForceLockoutGuard;
  tickLatencyTracker: TickLatencyTracker;
  antiCheatGuard: AntiCheatGuard;
  coordinationStore: ServerCoordinationStore;
  economyService: AuthoritativeEconomyService;
  opsCounters: OpsCounters;
  isShuttingDown: () => boolean;
  persistStoreToDisk: (targetStore: PersistedMultiRegionStore) => void;
  appendAuditEntry: (entry: SecurityAuditEntry) => void;
  resolveRequestSession: (req: Request) => ServerSessionInfo | null;
  requireAuthenticatedSession: (req: Request, res: Response) => ServerSessionInfo | null;
  requireStaffPermission: (
    req: Request,
    res: Response,
    permission: keyof AdminPermissions
  ) => ServerSessionInfo | null;
  getOrCreateEconomyAccount: (commanderId: string) => CommanderEconomyAccount;
  broadcastToSector: <TPayload>(
    sector: TerritorySectorCode,
    envelope: SiegeNetEnvelope<TPayload>
  ) => void;
  broadcastSectorPresence: (sector: TerritorySectorCode) => void;
}
