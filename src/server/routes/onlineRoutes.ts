/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Express } from 'express';
import {
  ALL_TERRITORY_SECTORS,
  MultiRegionClusterId,
  RallyActionCommandPacket,
  SiegeNetOpcode,
  TerritorySectorCode,
  TroopPositionCommandPacket,
  applyRallyActionCommand,
  applyTroopPositionCommand,
  buildMultiRegionReplicationStatus,
} from '../../game/siegeNetProtocol';
import {
  ALLOWED_CLUSTER_IDS,
  createAuditEntry,
  redactCommanderForPublicStatus,
  sanitizeAndValidateSyncPayload,
} from '../../game/serverAuth';
import { validateRallyCommandAuthority, validateTroopCommandAuthority } from '../../game/antiCheat';
import type { ServerContext } from '../types';

export function registerOnlineRoutes(app: Express, ctx: ServerContext): void {
  app.get('/api/online/status', (req, res) => {
    const requestedSector = (req.query.sector as TerritorySectorCode) || ctx.store.activeSector;
    const validSector: TerritorySectorCode = ALL_TERRITORY_SECTORS.includes(requestedSector)
      ? requestedSector
      : ctx.store.activeSector;

    const sectorState = ctx.store.sectors[validSector];
    const replication = buildMultiRegionReplicationStatus(
      ctx.store.primaryClusterId,
      sectorState,
      Object.keys(ctx.store.commanders).length,
      ctx.store.lastDiskFlushIso
    );

    const session = ctx.resolveRequestSession(req);
    const commandersPublic = Object.values(ctx.store.commanders).map((c) =>
      session?.permissions.canAccessGmConsole ? c : redactCommanderForPublicStatus(c)
    );

    res.json({
      ok: true,
      engine: 'Voxel Realms Authoritative 20Hz Siege & Multi-Region Persistence Server',
      connectedWebSocketPeers: ctx.peers.size,
      activeSector: validSector,
      globalActiveSector: ctx.store.activeSector,
      sectorState,
      replication,
      commanders: commandersPublic,
    });
  });

  app.post('/api/online/sync', (req, res) => {
    const session = ctx.requireAuthenticatedSession(req, res);
    if (!session) return;

    const body = (req.body || {}) as Record<string, unknown>;
    const canMutateGlobalRealmConfig = session.permissions.canAccessGmConsole;
    const rejectedGlobalFields: string[] = [];

    if (
      typeof body.primaryClusterId === 'string' &&
      ALLOWED_CLUSTER_IDS.includes(body.primaryClusterId as MultiRegionClusterId)
    ) {
      if (canMutateGlobalRealmConfig) {
        ctx.store.primaryClusterId = body.primaryClusterId as MultiRegionClusterId;
      } else if (body.primaryClusterId !== ctx.store.primaryClusterId) {
        rejectedGlobalFields.push('primaryClusterId');
      }
    }

    const requestedSector: TerritorySectorCode =
      typeof body.sector === 'string' &&
      ALL_TERRITORY_SECTORS.includes(body.sector as TerritorySectorCode)
        ? (body.sector as TerritorySectorCode)
        : ctx.store.activeSector;

    if (canMutateGlobalRealmConfig && typeof body.sector === 'string') {
      ctx.store.activeSector = requestedSector;
    }

    const existing = ctx.store.commanders[session.commanderId];
    const { snapshot: updatedProfile, sanitizedFields: profileSanitizedFields } =
      sanitizeAndValidateSyncPayload({
        existing,
        incomingBody: body,
        session,
        defaultClusterId: ctx.store.primaryClusterId,
      });
    const sanitizedFields = [...profileSanitizedFields, ...rejectedGlobalFields];

    if (sanitizedFields.length > 0) {
      ctx.appendAuditEntry(
        createAuditEntry({
          eventType: 'SYNC_SANITIZED',
          actorEmail: session.email,
          actorRole: session.role,
          outcome: 'clamped',
          detail: `Server rejected/clamped untrusted fields [${sanitizedFields.join(', ')}] on /api/online/sync`,
        })
      );
    }

    ctx.store.commanders[session.commanderId] = updatedProfile;
    ctx.persistStoreToDisk(ctx.store);

    const sectorState = ctx.store.sectors[requestedSector];
    const replication = buildMultiRegionReplicationStatus(
      ctx.store.primaryClusterId,
      sectorState,
      Object.keys(ctx.store.commanders).length,
      ctx.store.lastDiskFlushIso
    );

    res.json({
      ok: true,
      sanitizedFields,
      syncedProfile: updatedProfile,
      replication,
      sectorState,
    });
  });

  app.post('/api/online/siege/cmd', (req, res) => {
    const session = ctx.requireAuthenticatedSession(req, res);
    if (!session) return;

    const quarantine = ctx.antiCheatGuard.isQuarantined(
      session.commanderId,
      Date.now(),
      session.isRootOwner
    );
    if (quarantine.quarantined) {
      res.setHeader('Retry-After', String(quarantine.retryAfterSec));
      res.status(429).json({
        ok: false,
        violation: 'STRIKE_THRESHOLD_LOCKOUT',
        error: `Command privileges temporarily suspended due to anti-cheat violations (${quarantine.retryAfterSec}s remaining).`,
      });
      return;
    }

    const { sector, troopCmd, rallyCmd } = (req.body || {}) as {
      sector?: TerritorySectorCode;
      troopCmd?: TroopPositionCommandPacket;
      rallyCmd?: RallyActionCommandPacket;
    };

    if (!troopCmd && !rallyCmd) {
      res.status(400).json({
        ok: false,
        violation: 'INVALID_ENUM_INJECTION',
        error: 'Missing troopCmd or rallyCmd payload.',
      });
      return;
    }

    const targetSector: TerritorySectorCode =
      sector && ALL_TERRITORY_SECTORS.includes(sector) ? sector : ctx.store.activeSector;

    let current = ctx.store.sectors[targetSector];
    const warnings: string[] = [];

    if (troopCmd) {
      const troopCheck = validateTroopCommandAuthority({
        sectorState: current,
        session,
        rawCmd: troopCmd,
      });
      if (!troopCheck.allowed) {
        ctx.opsCounters.antiCheatRejections += 1;
        const strike = ctx.antiCheatGuard.recordStrike(
          session.commanderId,
          troopCheck.violation,
          Date.now(),
          session.isRootOwner
        );
        if (strike.quarantinedNow) {
          ctx.opsCounters.antiCheatStrikeLockouts += 1;
          res.setHeader('Retry-After', String(strike.retryAfterSec));
        }
        ctx.appendAuditEntry(
          createAuditEntry({
            eventType: 'ANTI_CHEAT_TRIGGERED',
            actorEmail: session.email,
            actorRole: session.role,
            outcome: 'denied',
            detail: `HTTP troopCmd rejected (${troopCheck.violation}, strike ${strike.strikeCount}): ${troopCheck.reason}`,
          })
        );
        ctx.persistStoreToDisk(ctx.store);
        res.status(strike.quarantinedNow ? 429 : troopCheck.statusCode).json({
          ok: false,
          violation: troopCheck.violation,
          strikeCount: strike.strikeCount,
          error: troopCheck.reason,
        });
        return;
      }
      warnings.push(...troopCheck.sanitizedWarnings);
      current = applyTroopPositionCommand(current, troopCheck.command);
    }

    if (rallyCmd) {
      const rallyCheck = validateRallyCommandAuthority({
        sectorState: current,
        session,
        serverCommander: ctx.store.commanders[session.commanderId],
        rawCmd: rallyCmd,
      });
      if (!rallyCheck.allowed) {
        ctx.opsCounters.antiCheatRejections += 1;
        const strike = ctx.antiCheatGuard.recordStrike(
          session.commanderId,
          rallyCheck.violation,
          Date.now(),
          session.isRootOwner
        );
        if (strike.quarantinedNow) {
          ctx.opsCounters.antiCheatStrikeLockouts += 1;
          res.setHeader('Retry-After', String(strike.retryAfterSec));
        }
        ctx.appendAuditEntry(
          createAuditEntry({
            eventType: 'ANTI_CHEAT_TRIGGERED',
            actorEmail: session.email,
            actorRole: session.role,
            outcome: 'denied',
            detail: `HTTP rallyCmd rejected (${rallyCheck.violation}, strike ${strike.strikeCount}): ${rallyCheck.reason}`,
          })
        );
        ctx.persistStoreToDisk(ctx.store);
        res.status(strike.quarantinedNow ? 429 : rallyCheck.statusCode).json({
          ok: false,
          violation: rallyCheck.violation,
          strikeCount: strike.strikeCount,
          error: rallyCheck.reason,
        });
        return;
      }
      warnings.push(...rallyCheck.sanitizedWarnings);
      current = applyRallyActionCommand(current, rallyCheck.command);
    }

    ctx.store.sectors[targetSector] = current;
    ctx.persistStoreToDisk(ctx.store);

    ctx.broadcastToSector(targetSector, {
      opcode: SiegeNetOpcode.S2C_FULL_SIEGE_SNAPSHOT,
      serverTick: current.serverTick,
      ackClientSeq: current.cohorts[0]?.lastAckClientSeq ?? 0,
      sector: targetSector,
      stateHash: current.stateHash,
      payload: { sectorState: current },
    });

    res.json({
      ok: true,
      sanitizedWarnings: warnings,
      sectorState: current,
    });
  });
}
