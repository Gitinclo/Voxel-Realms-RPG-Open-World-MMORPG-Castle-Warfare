/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';
import type http from 'node:http';
import {
  ALL_TERRITORY_SECTORS,
  AuthoritativeSiegeSectorState,
  SiegeNetEnvelope,
  SiegeNetOpcode,
  TerritorySectorCode,
  applyRallyActionCommand,
  applyTroopPositionCommand,
  stepAuthoritativeSiegeTick,
} from '../game/siegeNetProtocol';
import {
  createAuditEntry,
  extractSessionTokenFromHeaders,
  resolveAuthenticatedSession,
} from '../game/serverAuth';
import {
  OPERATIONAL_LIMITS,
  SlidingWindowRateLimiter,
  containsUnsafePrototypeKey,
  decodeWsFramesHardened,
  resolveClientIpFromHeaders,
  verifyWebSocketOrigin,
} from '../game/serverHardening';
import { validateRallyCommandAuthority, validateTroopCommandAuthority } from '../game/antiCheat';
import { isTrustProxyEnabled } from './securityHeaders';
import { WS_GUID, encodeWsCloseFrame, encodeWsTextFrame } from './wsFrames';
import type { ConnectedSiegePeer, ServerContext } from './types';

export function startSiegeTickLoop(ctx: ServerContext): ReturnType<typeof setInterval> {
  let tickCounter = 0;
  return setInterval(() => {
    if (ctx.isShuttingDown()) return;
    const tickStartNs = process.hrtime.bigint();
    tickCounter++;
    const sectorsToTick = new Set<TerritorySectorCode>([ctx.store.activeSector]);
    for (const peer of ctx.peers.values()) {
      sectorsToTick.add(peer.subscribedSector);
    }

    for (const sectorCode of sectorsToTick) {
      const currentSectorState = ctx.store.sectors[sectorCode];
      if (!currentSectorState) continue;
      const { nextState, deltaPacket } = stepAuthoritativeSiegeTick(currentSectorState);
      ctx.store.sectors[sectorCode] = nextState;

      if (ctx.peers.size > 0) {
        ctx.broadcastToSector(sectorCode, deltaPacket);

        if (nextState.serverTick % 100 === 0) {
          ctx.broadcastToSector(sectorCode, {
            opcode: SiegeNetOpcode.S2C_FULL_SIEGE_SNAPSHOT,
            serverTick: nextState.serverTick,
            ackClientSeq: nextState.cohorts[0]?.lastAckClientSeq ?? 0,
            sector: sectorCode,
            stateHash: nextState.stateHash,
            payload: { sectorState: nextState },
          });
        }
      }
    }

    if (tickCounter % 200 === 0) {
      ctx.persistStoreToDisk(ctx.store);
    }

    const elapsedMs = Number(process.hrtime.bigint() - tickStartNs) / 1_000_000;
    ctx.tickLatencyTracker.record(elapsedMs);
  }, 50);
}

export function attachSiegeWebSocketGateway(httpServer: http.Server, ctx: ServerContext): void {
  const trustProxyHeaders = isTrustProxyEnabled(ctx.trustProxy);

  httpServer.on('upgrade', (req, socket, head) => {
    const url = req.url || '';
    if (!url.startsWith('/ws/siege')) {
      return;
    }

    if (ctx.isShuttingDown() || ctx.peers.size >= OPERATIONAL_LIMITS.MAX_WS_PEERS) {
      ctx.opsCounters.wsConnectionsRejected += 1;
      socket.write('HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }

    const originCheck = verifyWebSocketOrigin({
      originHeader: req.headers.origin,
      hostHeader: req.headers.host,
      appUrl: process.env.APP_URL,
    });
    if (!originCheck.allowed) {
      ctx.opsCounters.wsConnectionsRejected += 1;
      ctx.opsCounters.csrfBlocks += 1;
      socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url, `http://${req.headers.host || `localhost:${ctx.port}`}`);
    } catch {
      ctx.opsCounters.wsConnectionsRejected += 1;
      socket.write('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }

    if (parsedUrl.searchParams.has('token')) {
      ctx.opsCounters.wsConnectionsRejected += 1;
      socket.write('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }

    const peerIp = resolveClientIpFromHeaders({
      forwardedForHeader: req.headers['x-forwarded-for'],
      remoteAddress: req.socket.remoteAddress,
      trustProxy: trustProxyHeaders,
    });
    let ipPeerCount = 0;
    for (const p of ctx.peers.values()) {
      if (p.ip === peerIp) ipPeerCount += 1;
    }
    if (ipPeerCount >= OPERATIONAL_LIMITS.MAX_WS_PEERS_PER_IP) {
      ctx.opsCounters.wsConnectionsRejected += 1;
      socket.write('HTTP/1.1 429 Too Many Requests\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }

    const wsKey = req.headers['sec-websocket-key'];
    if (!wsKey || typeof wsKey !== 'string') {
      socket.destroy();
      return;
    }

    const acceptKey = crypto
      .createHash('sha1')
      .update(wsKey + WS_GUID)
      .digest('base64');

    const responseHeaders = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '\r\n',
    ];
    socket.write(responseHeaders.join('\r\n'));
    if (head && head.length > 0) {
      socket.unshift(head);
    }

    const sectorParam = (parsedUrl.searchParams.get('sector') ||
      ctx.store.activeSector) as TerritorySectorCode;
    const validSector: TerritorySectorCode = ALL_TERRITORY_SECTORS.includes(sectorParam)
      ? sectorParam
      : ctx.store.activeSector;

    const wsToken = extractSessionTokenFromHeaders({
      cookieHeader: req.headers.cookie,
      authorizationHeader: req.headers.authorization,
    });
    const resolvedWsSession = resolveAuthenticatedSession({
      token: wsToken,
      secret: ctx.securityConfig.sessionSecret,
      roster: ctx.store.moderatedPlayers,
      allowGodMode: ctx.securityConfig.allowProductionGodMode,
    });
    const activeWsSession =
      resolvedWsSession.authenticated &&
      !ctx.coordinationStore.isSessionRevoked(resolvedWsSession.session.sessionId)
        ? resolvedWsSession.session
        : null;

    const peerId = `peer-${crypto.randomUUID().slice(0, 8)}`;
    const peer: ConnectedSiegePeer = {
      id: peerId,
      ip: peerIp,
      socket,
      subscribedSector: validSector,
      connectedAtIso: new Date().toISOString(),
      session: activeWsSession,
      rxBuffer: Buffer.alloc(0),
      msgLimiter: new SlidingWindowRateLimiter({
        maxRequests: OPERATIONAL_LIMITS.WS_MESSAGES_PER_WINDOW,
        windowMs: OPERATIONAL_LIMITS.WS_RATE_WINDOW_MS,
        maxKeys: 8,
      }),
      rateViolations: 0,
      lastClientSeq: -1,
    };
    ctx.peers.set(peerId, peer);
    ctx.opsCounters.wsConnectionsAccepted += 1;

    const initialState = ctx.store.sectors[validSector];
    const snapshotEnvelope: SiegeNetEnvelope<{ sectorState: AuthoritativeSiegeSectorState }> = {
      opcode: SiegeNetOpcode.S2C_FULL_SIEGE_SNAPSHOT,
      serverTick: initialState.serverTick,
      ackClientSeq: initialState.cohorts[0]?.lastAckClientSeq ?? 0,
      sector: validSector,
      stateHash: initialState.stateHash,
      payload: { sectorState: initialState },
    };
    socket.write(encodeWsTextFrame(JSON.stringify(snapshotEnvelope)));
    ctx.broadcastSectorPresence(validSector);

    socket.on('data', (chunk: Buffer) => {
      const combined = peer.rxBuffer.length > 0 ? Buffer.concat([peer.rxBuffer, chunk]) : chunk;
      const decoded = decodeWsFramesHardened(combined);
      peer.rxBuffer = decoded.remainingBuffer;

      if (decoded.protocolError) {
        ctx.opsCounters.wsFramesRejected += 1;
        ctx.peers.delete(peerId);
        ctx.broadcastSectorPresence(peer.subscribedSector);
        try {
          socket.end(encodeWsCloseFrame(1009, decoded.protocolError));
        } catch {
          socket.destroy();
        }
        return;
      }

      if (decoded.closeRequested) {
        ctx.peers.delete(peerId);
        ctx.broadcastSectorPresence(peer.subscribedSector);
        socket.end();
        return;
      }

      if (decoded.pingPayload) {
        const pong = Buffer.concat([
          Buffer.from([0x8a, decoded.pingPayload.length & 0x7f]),
          decoded.pingPayload.subarray(0, 125),
        ]);
        socket.write(pong);
      }

      for (const rawMsg of decoded.messages) {
        const msgRate = peer.msgLimiter.check('ws-msg');
        if (!msgRate.allowed) {
          peer.rateViolations += 1;
          socket.write(
            encodeWsTextFrame(
              JSON.stringify({
                opcode: 'S2C_RATE_LIMIT',
                code: 429,
                error: 'WebSocket message rate limit exceeded.',
              })
            )
          );
          if (peer.rateViolations >= 3) {
            ctx.opsCounters.wsRateLimitDisconnects += 1;
            ctx.peers.delete(peerId);
            ctx.broadcastSectorPresence(peer.subscribedSector);
            socket.end(encodeWsCloseFrame(1008, 'Sustained WebSocket message flood'));
            return;
          }
          continue;
        }

        try {
          const parsed = JSON.parse(rawMsg) as {
            opcode?: SiegeNetOpcode;
            sector?: TerritorySectorCode;
            payload?: unknown;
          };

          if (containsUnsafePrototypeKey(parsed)) {
            ctx.opsCounters.wsFramesRejected += 1;
            continue;
          }

          const previousSector = peer.subscribedSector;
          if (parsed.sector && ALL_TERRITORY_SECTORS.includes(parsed.sector)) {
            peer.subscribedSector = parsed.sector;
            if (parsed.sector !== previousSector) {
              ctx.broadcastSectorPresence(previousSector);
              ctx.broadcastSectorPresence(parsed.sector);
            }
          }

          const isMutatingCommand =
            parsed.opcode === SiegeNetOpcode.C2S_TROOP_POSITION_CMD ||
            parsed.opcode === SiegeNetOpcode.C2S_RALLY_ACTION_CMD;

          if (isMutatingCommand && !peer.session) {
            ctx.appendAuditEntry(
              createAuditEntry({
                eventType: 'WS_COMMAND_REJECTED',
                actorEmail: 'anonymous',
                actorRole: 'anonymous',
                outcome: 'denied',
                detail: `Rejected unauthenticated WebSocket command (${parsed.opcode}) from ${peerId}`,
              })
            );
            socket.write(
              encodeWsTextFrame(
                JSON.stringify({
                  opcode: 'S2C_AUTH_ERROR',
                  code: 401,
                  error: 'WebSocket state mutations require an authenticated server session.',
                })
              )
            );
            continue;
          }

          const targetSector = peer.subscribedSector;
          let sectorState = ctx.store.sectors[targetSector];

          if (isMutatingCommand && peer.session) {
            const quarantine = ctx.antiCheatGuard.isQuarantined(
              peer.session.commanderId,
              Date.now(),
              peer.session.isRootOwner
            );
            if (quarantine.quarantined) {
              socket.write(
                encodeWsTextFrame(
                  JSON.stringify({
                    opcode: SiegeNetOpcode.S2C_COMMAND_REJECTED,
                    serverTick: sectorState.serverTick,
                    ackClientSeq: Math.max(0, peer.lastClientSeq),
                    sector: targetSector,
                    stateHash: sectorState.stateHash,
                    payload: {
                      violation: 'STRIKE_THRESHOLD_LOCKOUT',
                      code: 429,
                      error: `Command quarantine active (${quarantine.retryAfterSec}s remaining).`,
                    },
                  })
                )
              );
              ctx.peers.delete(peerId);
              ctx.broadcastSectorPresence(targetSector);
              socket.end(encodeWsCloseFrame(1008, 'Anti-cheat quarantine active'));
              return;
            }
          }

          if (peer.session && parsed.opcode === SiegeNetOpcode.C2S_TROOP_POSITION_CMD) {
            const troopCheck = validateTroopCommandAuthority({
              sectorState,
              session: peer.session,
              rawCmd: parsed.payload,
              lastClientSeq: peer.lastClientSeq,
            });
            if (!troopCheck.allowed) {
              ctx.opsCounters.antiCheatRejections += 1;
              const strike = ctx.antiCheatGuard.recordStrike(
                peer.session.commanderId,
                troopCheck.violation,
                Date.now(),
                peer.session.isRootOwner
              );
              if (strike.quarantinedNow) {
                ctx.opsCounters.antiCheatStrikeLockouts += 1;
              }
              ctx.appendAuditEntry(
                createAuditEntry({
                  eventType: 'ANTI_CHEAT_TRIGGERED',
                  actorEmail: peer.session.email,
                  actorRole: peer.session.role,
                  outcome: 'denied',
                  detail: `WS troopCmd blocked (${troopCheck.violation}, strike ${strike.strikeCount}): ${troopCheck.reason}`,
                })
              );
              socket.write(
                encodeWsTextFrame(
                  JSON.stringify({
                    opcode: SiegeNetOpcode.S2C_COMMAND_REJECTED,
                    serverTick: sectorState.serverTick,
                    ackClientSeq: Math.max(0, peer.lastClientSeq),
                    sector: targetSector,
                    stateHash: sectorState.stateHash,
                    payload: {
                      violation: troopCheck.violation,
                      code: strike.quarantinedNow ? 429 : troopCheck.statusCode,
                      strikeCount: strike.strikeCount,
                      error: troopCheck.reason,
                    },
                  })
                )
              );
              if (strike.quarantinedNow) {
                ctx.persistStoreToDisk(ctx.store);
                ctx.peers.delete(peerId);
                ctx.broadcastSectorPresence(targetSector);
                socket.end(encodeWsCloseFrame(1008, 'Anti-cheat strike threshold exceeded'));
                return;
              }
              continue;
            }

            peer.lastClientSeq = troopCheck.command.clientSeq;
            sectorState = applyTroopPositionCommand(sectorState, troopCheck.command);
            ctx.store.sectors[targetSector] = sectorState;
          } else if (peer.session && parsed.opcode === SiegeNetOpcode.C2S_RALLY_ACTION_CMD) {
            const rallyCheck = validateRallyCommandAuthority({
              sectorState,
              session: peer.session,
              serverCommander: ctx.store.commanders[peer.session.commanderId],
              rawCmd: parsed.payload,
            });
            if (!rallyCheck.allowed) {
              ctx.opsCounters.antiCheatRejections += 1;
              const strike = ctx.antiCheatGuard.recordStrike(
                peer.session.commanderId,
                rallyCheck.violation,
                Date.now(),
                peer.session.isRootOwner
              );
              if (strike.quarantinedNow) {
                ctx.opsCounters.antiCheatStrikeLockouts += 1;
              }
              ctx.appendAuditEntry(
                createAuditEntry({
                  eventType: 'ANTI_CHEAT_TRIGGERED',
                  actorEmail: peer.session.email,
                  actorRole: peer.session.role,
                  outcome: 'denied',
                  detail: `WS rallyCmd blocked (${rallyCheck.violation}, strike ${strike.strikeCount}): ${rallyCheck.reason}`,
                })
              );
              socket.write(
                encodeWsTextFrame(
                  JSON.stringify({
                    opcode: SiegeNetOpcode.S2C_COMMAND_REJECTED,
                    serverTick: sectorState.serverTick,
                    ackClientSeq: Math.max(0, peer.lastClientSeq),
                    sector: targetSector,
                    stateHash: sectorState.stateHash,
                    payload: {
                      violation: rallyCheck.violation,
                      code: strike.quarantinedNow ? 429 : rallyCheck.statusCode,
                      strikeCount: strike.strikeCount,
                      error: rallyCheck.reason,
                    },
                  })
                )
              );
              if (strike.quarantinedNow) {
                ctx.persistStoreToDisk(ctx.store);
                ctx.peers.delete(peerId);
                ctx.broadcastSectorPresence(targetSector);
                socket.end(encodeWsCloseFrame(1008, 'Anti-cheat strike threshold exceeded'));
                return;
              }
              continue;
            }

            sectorState = applyRallyActionCommand(sectorState, rallyCheck.command);
            ctx.store.sectors[targetSector] = sectorState;
          }

          ctx.broadcastToSector(targetSector, {
            opcode: SiegeNetOpcode.S2C_FULL_SIEGE_SNAPSHOT,
            serverTick: sectorState.serverTick,
            ackClientSeq: sectorState.cohorts[0]?.lastAckClientSeq ?? 0,
            sector: targetSector,
            stateHash: sectorState.stateHash,
            payload: { sectorState },
          });
        } catch {
          ctx.opsCounters.wsFramesRejected += 1;
        }
      }
    });

    socket.on('close', () => {
      const leftSector = peer.subscribedSector;
      ctx.peers.delete(peerId);
      ctx.broadcastSectorPresence(leftSector);
    });
    socket.on('error', () => {
      const leftSector = peer.subscribedSector;
      ctx.peers.delete(peerId);
      ctx.broadcastSectorPresence(leftSector);
    });
  });
}
