/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Duplex } from 'node:stream';
import { createServer as createViteServer } from 'vite';
import {
  ALL_TERRITORY_SECTORS,
  AuthoritativeSiegeSectorState,
  MultiRegionClusterId,
  PersistedRealmPlayerSnapshot,
  RallyActionCommandPacket,
  SiegeNetEnvelope,
  SiegeNetOpcode,
  TerritorySectorCode,
  TroopPositionCommandPacket,
  applyRallyActionCommand,
  applyTroopPositionCommand,
  buildMultiRegionReplicationStatus,
  createInitialAuthoritativeSiegeSectorState,
  stepAuthoritativeSiegeTick,
} from './src/game/siegeNetProtocol';

const PORT = 3000;
const DATA_DIR = path.resolve(import.meta.dirname, 'data');
const STATE_FILE_PATH = path.join(DATA_DIR, 'online_realm_state.json');
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

interface PersistedMultiRegionStore {
  primaryClusterId: MultiRegionClusterId;
  activeSector: TerritorySectorCode;
  lastDiskFlushIso: string;
  sectors: Record<TerritorySectorCode, AuthoritativeSiegeSectorState>;
  commanders: Record<string, PersistedRealmPlayerSnapshot>;
}

function loadOrInitializeStore(): PersistedMultiRegionStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STATE_FILE_PATH)) {
      const raw = fs.readFileSync(STATE_FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as PersistedMultiRegionStore;
      if (parsed && parsed.sectors && parsed.sectors.B2) {
        return parsed;
      }
    }
  } catch {
    // Fallback to clean initialization if disk state is absent or corrupted
  }

  const sectors = {} as Record<TerritorySectorCode, AuthoritativeSiegeSectorState>;
  for (const sector of ALL_TERRITORY_SECTORS) {
    sectors[sector] = createInitialAuthoritativeSiegeSectorState(sector);
  }

  const nowIso = new Date().toISOString();
  const initialStore: PersistedMultiRegionStore = {
    primaryClusterId: 'us-east-solara-1',
    activeSector: 'B2',
    lastDiskFlushIso: nowIso,
    sectors,
    commanders: {
      'player-commander-01': {
        commanderId: 'player-commander-01',
        commanderName: 'Sovereign Vanguard',
        email: 'creatergame31@gmail.com',
        allianceTag: 'SOL',
        castleLevel: 100,
        cultivationRealmIndex: 7,
        vipTier: 3,
        karma: 250,
        garrisonTroopsWire: '1000000000000000',
        discoveredCodexCount: 16,
        preferredRegion: 'us-east-solara-1',
        updatedAtIso: nowIso,
      },
    },
  };

  persistStoreToDisk(initialStore);
  return initialStore;
}

function persistStoreToDisk(store: PersistedMultiRegionStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    store.lastDiskFlushIso = new Date().toISOString();
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(store, null, 2), 'utf8');
  } catch {
    // Non-fatal in read-only or ephemeral environments
  }
}

// ============================================================================
// RFC 6455 WEBSOCKET FRAMING HELPERS (ZERO EXTERNAL WS DEPENDENCY REQUIRED)
// ============================================================================

interface ConnectedSiegePeer {
  id: string;
  socket: Duplex;
  subscribedSector: TerritorySectorCode;
  connectedAtIso: string;
}

function encodeWsTextFrame(jsonText: string): Buffer {
  const payload = Buffer.from(jsonText, 'utf8');
  const len = payload.byteLength;
  if (len < 126) {
    const header = Buffer.from([0x81, len]);
    return Buffer.concat([header, payload]);
  }
  if (len < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
    return Buffer.concat([header, payload]);
  }
  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(len), 2);
  return Buffer.concat([header, payload]);
}

function decodeWsFrames(buffer: Buffer): {
  messages: string[];
  closeRequested: boolean;
  pingPayload: Buffer | null;
} {
  const messages: string[] = [];
  let closeRequested = false;
  let pingPayload: Buffer | null = null;
  let offset = 0;

  while (offset + 2 <= buffer.length) {
    const byte0 = buffer[offset];
    const byte1 = buffer[offset + 1];
    const opcode = byte0 & 0x0f;
    const isMasked = (byte1 & 0x80) !== 0;
    let payloadLen = byte1 & 0x7f;
    let headerLen = 2;

    if (payloadLen === 126) {
      if (offset + 4 > buffer.length) break;
      payloadLen = buffer.readUInt16BE(offset + 2);
      headerLen = 4;
    } else if (payloadLen === 127) {
      if (offset + 10 > buffer.length) break;
      payloadLen = Number(buffer.readBigUInt64BE(offset + 2));
      headerLen = 10;
    }

    const maskLen = isMasked ? 4 : 0;
    if (offset + headerLen + maskLen + payloadLen > buffer.length) break;

    const payloadStart = offset + headerLen + maskLen;
    const rawPayload = Buffer.from(buffer.subarray(payloadStart, payloadStart + payloadLen));

    if (isMasked) {
      const maskKey = buffer.subarray(offset + headerLen, offset + headerLen + 4);
      for (let i = 0; i < rawPayload.length; i++) {
        rawPayload[i] ^= maskKey[i & 3];
      }
    }

    if (opcode === 0x08) {
      closeRequested = true;
    } else if (opcode === 0x09) {
      pingPayload = rawPayload;
    } else if (opcode === 0x01) {
      messages.push(rawPayload.toString('utf8'));
    }

    offset = payloadStart + payloadLen;
  }

  return { messages, closeRequested, pingPayload };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const store = loadOrInitializeStore();
  const peers = new Map<string, ConnectedSiegePeer>();

  const broadcastToSector = <TPayload>(
    sector: TerritorySectorCode,
    envelope: SiegeNetEnvelope<TPayload>
  ) => {
    const frame = encodeWsTextFrame(JSON.stringify(envelope));
    for (const [peerId, peer] of peers.entries()) {
      if (peer.subscribedSector === sector && !peer.socket.destroyed) {
        try {
          peer.socket.write(frame);
        } catch {
          peers.delete(peerId);
        }
      }
    }
  };

  // ==========================================================================
  // AUTHORITATIVE 20HZ (50ms) SIEGE SERVER LOOP & PERIODIC DISK PERSISTENCE
  // ==========================================================================
  let tickCounter = 0;
  setInterval(() => {
    tickCounter++;
    const activeSector = store.activeSector;
    const currentSectorState = store.sectors[activeSector];
    const { nextState, deltaPacket } = stepAuthoritativeSiegeTick(currentSectorState);
    store.sectors[activeSector] = nextState;

    // Broadcast 20Hz delta update to connected WebSocket peers
    if (peers.size > 0) {
      broadcastToSector(activeSector, deltaPacket);

      // Every 100 ticks (5.0 seconds), broadcast full keyframe & multi-region replication status
      if (nextState.serverTick % 100 === 0) {
        broadcastToSector(activeSector, {
          opcode: SiegeNetOpcode.S2C_FULL_SIEGE_SNAPSHOT,
          serverTick: nextState.serverTick,
          ackClientSeq: nextState.cohorts[0]?.lastAckClientSeq ?? 0,
          sector: activeSector,
          stateHash: nextState.stateHash,
          payload: { sectorState: nextState },
        });
      }
    }

    // Flush multi-region state to disk every 200 ticks (10.0 seconds)
    if (tickCounter % 200 === 0) {
      persistStoreToDisk(store);
    }
  }, 50);

  // ==========================================================================
  // MULTI-REGION PERSISTENCE & SIEGE REST API ROUTES (/api/online/*)
  // ==========================================================================

  app.get('/api/online/status', (req, res) => {
    const requestedSector = (req.query.sector as TerritorySectorCode) || store.activeSector;
    const validSector: TerritorySectorCode = ALL_TERRITORY_SECTORS.includes(requestedSector)
      ? requestedSector
      : store.activeSector;
    store.activeSector = validSector;

    const sectorState = store.sectors[validSector];
    const replication = buildMultiRegionReplicationStatus(
      store.primaryClusterId,
      sectorState,
      Object.keys(store.commanders).length,
      store.lastDiskFlushIso
    );

    res.json({
      ok: true,
      engine: 'Voxel Realms Authoritative 20Hz Siege & Multi-Region Persistence Server',
      connectedWebSocketPeers: peers.size,
      activeSector: validSector,
      sectorState,
      replication,
      commanders: Object.values(store.commanders),
    });
  });

  app.post('/api/online/sync', (req, res) => {
    const body = req.body as Partial<PersistedRealmPlayerSnapshot> & {
      primaryClusterId?: MultiRegionClusterId;
      sector?: TerritorySectorCode;
    };

    if (
      body.primaryClusterId &&
      ['us-east-solara-1', 'eu-central-valhalla-1', 'ap-southeast-celestia-1'].includes(
        body.primaryClusterId
      )
    ) {
      store.primaryClusterId = body.primaryClusterId;
    }

    if (body.sector && ALL_TERRITORY_SECTORS.includes(body.sector)) {
      store.activeSector = body.sector;
    }

    const commanderId = body.commanderId || 'player-commander-01';
    const existing = store.commanders[commanderId] ?? store.commanders['player-commander-01'];
    const updatedProfile: PersistedRealmPlayerSnapshot = {
      commanderId,
      commanderName: body.commanderName ?? existing?.commanderName ?? 'Sovereign Vanguard',
      email: body.email ?? existing?.email ?? 'creatergame31@gmail.com',
      allianceTag: body.allianceTag ?? existing?.allianceTag ?? 'SOL',
      castleLevel:
        typeof body.castleLevel === 'number' ? body.castleLevel : (existing?.castleLevel ?? 100),
      cultivationRealmIndex:
        typeof body.cultivationRealmIndex === 'number'
          ? body.cultivationRealmIndex
          : (existing?.cultivationRealmIndex ?? 7),
      vipTier: typeof body.vipTier === 'number' ? body.vipTier : (existing?.vipTier ?? 3),
      karma: typeof body.karma === 'number' ? body.karma : (existing?.karma ?? 250),
      garrisonTroopsWire:
        body.garrisonTroopsWire ?? existing?.garrisonTroopsWire ?? '1000000000000000',
      discoveredCodexCount:
        typeof body.discoveredCodexCount === 'number'
          ? body.discoveredCodexCount
          : (existing?.discoveredCodexCount ?? 16),
      preferredRegion: body.preferredRegion ?? store.primaryClusterId,
      updatedAtIso: new Date().toISOString(),
    };

    store.commanders[commanderId] = updatedProfile;
    persistStoreToDisk(store);

    const sectorState = store.sectors[store.activeSector];
    const replication = buildMultiRegionReplicationStatus(
      store.primaryClusterId,
      sectorState,
      Object.keys(store.commanders).length,
      store.lastDiskFlushIso
    );

    res.json({
      ok: true,
      syncedProfile: updatedProfile,
      replication,
      sectorState,
    });
  });

  app.post('/api/online/siege/cmd', (req, res) => {
    const { sector, troopCmd, rallyCmd } = req.body as {
      sector?: TerritorySectorCode;
      troopCmd?: TroopPositionCommandPacket;
      rallyCmd?: RallyActionCommandPacket;
    };

    const targetSector: TerritorySectorCode =
      sector && ALL_TERRITORY_SECTORS.includes(sector) ? sector : store.activeSector;
    store.activeSector = targetSector;

    let current = store.sectors[targetSector];
    if (troopCmd) {
      current = applyTroopPositionCommand(current, troopCmd);
    }
    if (rallyCmd) {
      current = applyRallyActionCommand(current, rallyCmd);
    }
    store.sectors[targetSector] = current;
    persistStoreToDisk(store);

    broadcastToSector(targetSector, {
      opcode: SiegeNetOpcode.S2C_FULL_SIEGE_SNAPSHOT,
      serverTick: current.serverTick,
      ackClientSeq: current.cohorts[0]?.lastAckClientSeq ?? 0,
      sector: targetSector,
      stateHash: current.stateHash,
      payload: { sectorState: current },
    });

    res.json({
      ok: true,
      sectorState: current,
    });
  });

  const httpServer = http.createServer(app);

  // ==========================================================================
  // RFC 6455 WEBSOCKET UPGRADE HANDLER ON /ws/siege
  // ==========================================================================
  httpServer.on('upgrade', (req, socket, head) => {
    const url = req.url || '';
    if (!url.startsWith('/ws/siege')) {
      return; // Allow Vite middleware to handle any other upgrades if needed
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

    const parsedUrl = new URL(url, 'http://localhost:3000');
    const sectorParam = (parsedUrl.searchParams.get('sector') ||
      store.activeSector) as TerritorySectorCode;
    const validSector: TerritorySectorCode = ALL_TERRITORY_SECTORS.includes(sectorParam)
      ? sectorParam
      : store.activeSector;
    store.activeSector = validSector;

    const peerId = `peer-${crypto.randomUUID().slice(0, 8)}`;
    const peer: ConnectedSiegePeer = {
      id: peerId,
      socket,
      subscribedSector: validSector,
      connectedAtIso: new Date().toISOString(),
    };
    peers.set(peerId, peer);

    // Immediately send authoritative S2C_FULL_SIEGE_SNAPSHOT upon connection
    const initialState = store.sectors[validSector];
    const snapshotEnvelope: SiegeNetEnvelope<{ sectorState: AuthoritativeSiegeSectorState }> = {
      opcode: SiegeNetOpcode.S2C_FULL_SIEGE_SNAPSHOT,
      serverTick: initialState.serverTick,
      ackClientSeq: initialState.cohorts[0]?.lastAckClientSeq ?? 0,
      sector: validSector,
      stateHash: initialState.stateHash,
      payload: { sectorState: initialState },
    };
    socket.write(encodeWsTextFrame(JSON.stringify(snapshotEnvelope)));

    socket.on('data', (chunk: Buffer) => {
      const { messages, closeRequested, pingPayload } = decodeWsFrames(chunk);
      if (closeRequested) {
        peers.delete(peerId);
        socket.end();
        return;
      }
      if (pingPayload) {
        const pong = Buffer.concat([
          Buffer.from([0x8a, pingPayload.length & 0x7f]),
          pingPayload.subarray(0, 125),
        ]);
        socket.write(pong);
      }

      for (const rawMsg of messages) {
        try {
          const parsed = JSON.parse(rawMsg) as {
            opcode?: SiegeNetOpcode;
            sector?: TerritorySectorCode;
            payload?: unknown;
          };

          if (parsed.sector && ALL_TERRITORY_SECTORS.includes(parsed.sector)) {
            peer.subscribedSector = parsed.sector;
            store.activeSector = parsed.sector;
          }

          const targetSector = peer.subscribedSector;
          let sectorState = store.sectors[targetSector];

          if (parsed.opcode === SiegeNetOpcode.C2S_TROOP_POSITION_CMD && parsed.payload) {
            sectorState = applyTroopPositionCommand(
              sectorState,
              parsed.payload as TroopPositionCommandPacket
            );
            store.sectors[targetSector] = sectorState;
          } else if (parsed.opcode === SiegeNetOpcode.C2S_RALLY_ACTION_CMD && parsed.payload) {
            sectorState = applyRallyActionCommand(
              sectorState,
              parsed.payload as RallyActionCommandPacket
            );
            store.sectors[targetSector] = sectorState;
          }

          broadcastToSector(targetSector, {
            opcode: SiegeNetOpcode.S2C_FULL_SIEGE_SNAPSHOT,
            serverTick: sectorState.serverTick,
            ackClientSeq: sectorState.cohorts[0]?.lastAckClientSeq ?? 0,
            sector: targetSector,
            stateHash: sectorState.stateHash,
            payload: { sectorState },
          });
        } catch {
          // Ignore malformed client frames
        }
      }
    });

    socket.on('close', () => {
      peers.delete(peerId);
    });
    socket.on('error', () => {
      peers.delete(peerId);
    });
  });

  // ==========================================================================
  // VITE MIDDLEWARE (DEV) OR STATIC ASSET SERVING (PRODUCTION)
  // ==========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(import.meta.dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[Voxel Realms Server] Authoritative 20Hz 50v50 Siege & Multi-Region Persistence listening on http://0.0.0.0:${PORT}`
    );
  });
}

startServer();
