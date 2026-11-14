/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_TERRITORY_SECTORS,
  ClientPredictionRingBuffer,
  CohortDirtyBit,
  CSP_RING_BUFFER_CAPACITY,
  applyRallyActionCommand,
  applySiegeDeltaUpdate,
  applyTroopPositionCommand,
  buildMultiRegionReplicationStatus,
  computeSectorStateHash,
  createInitialAuthoritativeSiegeSectorState,
  dequantizeAngleUint16,
  dequantizeCoordInt16,
  deserializeBigIntWire,
  fnv1a32,
  quantizeAngleUint16,
  quantizeCoordInt16,
  reconcileClientPrediction,
  serializeBigIntWire,
  stepAuthoritativeSiegeTick,
} from './siegeNetProtocol';
import { MAX_CASTLE_TROOP_CAPACITY, MAX_RALLY_CAPACITY } from './math';

test('1. Spatial int16 quantization & uint16 angle quantization maintain 0.01m precision and clamp bounds', () => {
  assert.equal(quantizeCoordInt16(0), 0);
  assert.equal(quantizeCoordInt16(14.25), 1425);
  assert.equal(dequantizeCoordInt16(1425), 14.25);

  // Out-of-bounds clamping to [-32768, 32767]
  assert.equal(quantizeCoordInt16(-999.9), -32768);
  assert.equal(quantizeCoordInt16(999.9), 32767);
  assert.equal(dequantizeCoordInt16(-32768), -327.68);
  assert.equal(dequantizeCoordInt16(32767), 327.67);

  const halfPiQ = quantizeAngleUint16(Math.PI / 2);
  assert.ok(Math.abs(dequantizeAngleUint16(halfPiQ) - Math.PI / 2) < 0.001);
});

test('2. BigInt wire serialization preserves exact 64-bit+ precision up to 1,000 Trillion (10^15) and clamps overflow', () => {
  const oneTrillion = 1_000_000_000_000n;
  const maxCitadel = MAX_CASTLE_TROOP_CAPACITY; // 1,000,000,000,000,000n

  assert.equal(serializeBigIntWire(oneTrillion), '1000000000000');
  assert.equal(deserializeBigIntWire('1000000000000'), oneTrillion);

  assert.equal(serializeBigIntWire(maxCitadel), '1000000000000000');
  assert.equal(deserializeBigIntWire('1000000000000000'), maxCitadel);

  // Rejects negative or non-numeric strings and clamps above maxCap
  assert.equal(serializeBigIntWire(-500n), '0');
  assert.equal(deserializeBigIntWire('-500'), 0n);
  assert.equal(deserializeBigIntWire('invalid_wire'), 0n);
  assert.equal(serializeBigIntWire(maxCitadel + 999_999n, maxCitadel), maxCitadel.toString(10));
});

test('3. Authoritative 50v50 Siege Sector initialization & 20Hz delta-compression round-trip match FNV-1a stateHash', () => {
  assert.equal(ALL_TERRITORY_SECTORS.length, 9);
  const initialState = createInitialAuthoritativeSiegeSectorState('B2');
  assert.equal(initialState.sector, 'B2');
  assert.equal(initialState.cohorts.length, 12);
  assert.equal(initialState.fortifications.length, 4);
  assert.ok(initialState.stateHash > 0);
  assert.equal(initialState.stateHash, computeSectorStateHash(initialState));

  // Issue a troop position command on Cohort #0
  const afterCmd = applyTroopPositionCommand(initialState, {
    commanderId: 'player-commander-01',
    cohortId: 0,
    clientSeq: 7,
    targetXQuantized: quantizeCoordInt16(14),
    targetZQuantized: quantizeCoordInt16(0),
    facingAngleQuantized: 0,
    formation: 'WEDGE_CHARGE',
    primaryBranch: 'bomber',
  });

  assert.equal(afterCmd.cohorts[0].formation, 'WEDGE_CHARGE');
  assert.equal(afterCmd.cohorts[0].primaryBranch, 'bomber');
  assert.equal(afterCmd.cohorts[0].lastAckClientSeq, 7);

  // Step 20Hz authoritative tick and verify delta packet reconstruction matches stateHash
  const { nextState, deltaPacket } = stepAuthoritativeSiegeTick(afterCmd);
  assert.equal(nextState.serverTick, afterCmd.serverTick + 1);
  assert.ok(deltaPacket.payload.changedCohorts.length > 0);
  assert.ok(
    deltaPacket.payload.compressedBytesEstimate < deltaPacket.payload.uncompressedBytesEstimate
  );

  // Check CohortDirtyBit flags on moving cohort
  const cohort0Delta = deltaPacket.payload.changedCohorts.find((d) => d.cohortId === 0);
  assert.ok(cohort0Delta);
  assert.ok((cohort0Delta.dirtyMask & CohortDirtyBit.POSITION) !== 0);

  // Reconstruct client state from deltaPacket and verify exact FNV-1a checksum parity
  const clientReconstructed = applySiegeDeltaUpdate(afterCmd, deltaPacket);
  assert.equal(clientReconstructed.serverTick, nextState.serverTick);
  assert.equal(clientReconstructed.stateHash, nextState.stateHash);
});

test('4. 1-Trillion War Rally synchronization enforces MAX_RALLY_CAPACITY (1T) and transitions phases', () => {
  let state = createInitialAuthoritativeSiegeSectorState('A1');
  assert.equal(state.activeRally.maxCapacityWire, MAX_RALLY_CAPACITY.toString(10));

  // Reinforce with 900B troops — should clamp totalCommittedTroopsWire at exactly 1,000,000,000,000 (1T)
  state = applyRallyActionCommand(state, {
    commanderId: 'archon-overload-99',
    commanderName: 'GrandArchonValen',
    commanderRealmIndex: 9,
    allianceTag: 'SOL',
    action: 'JOIN_RALLY',
    sector: 'A1',
    shieldbearersWire: '400000000000',
    shootersWire: '300000000000',
    bombersWire: '200000000000',
    troopTier: 20,
  });

  assert.equal(
    deserializeBigIntWire(state.activeRally.totalCommittedTroopsWire, MAX_RALLY_CAPACITY),
    MAX_RALLY_CAPACITY
  );

  // Launch rally immediately
  state = applyRallyActionCommand(state, {
    commanderId: 'player-commander-01',
    commanderName: 'Sovereign Vanguard (You)',
    commanderRealmIndex: 7,
    allianceTag: 'SOL',
    action: 'LAUNCH_NOW',
    sector: 'A1',
    shieldbearersWire: '0',
    shootersWire: '0',
    bombersWire: '0',
    troopTier: 18,
  });
  assert.equal(state.activeRally.phase, 'LOCKED_MARCHING');
});

test('5. 128-Frame Client-Side Prediction (CSP) Ring Buffer handles Exact Match, Hermite Smoothing (<=0.15m), and Hard Rollback (>0.15m)', () => {
  const ring = new ClientPredictionRingBuffer();
  assert.equal(CSP_RING_BUFFER_CAPACITY, 128);

  const state = createInitialAuthoritativeSiegeSectorState('B2');
  const cohort0 = state.cohorts[0];

  // Record frame #1 matching authoritative position
  ring.recordFrame({
    clientSeq: 1,
    cohortId: 0,
    predictedPosXQuantized: cohort0.posXQuantized,
    predictedPosZQuantized: cohort0.posZQuantized,
    targetXQuantized: cohort0.targetXQuantized,
    targetZQuantized: cohort0.targetZQuantized,
    formation: 'SHIELD_WALL',
  });

  const exact = reconcileClientPrediction(
    ring,
    1,
    cohort0,
    cohort0.posXQuantized,
    cohort0.posZQuantized
  );
  assert.equal(exact.mode, 'EXACT_MATCH');
  assert.equal(exact.positionErrorQuantized, 0);

  // Record frame #2 with minor 10-unit (0.10m <= 0.15m) drift -> HERMITE_SMOOTH
  ring.recordFrame({
    clientSeq: 2,
    cohortId: 0,
    predictedPosXQuantized: cohort0.posXQuantized + 10,
    predictedPosZQuantized: cohort0.posZQuantized,
    targetXQuantized: cohort0.targetXQuantized,
    targetZQuantized: cohort0.targetZQuantized,
    formation: 'SHIELD_WALL',
  });
  const smooth = reconcileClientPrediction(
    ring,
    2,
    cohort0,
    cohort0.posXQuantized + 10,
    cohort0.posZQuantized
  );
  assert.equal(smooth.mode, 'HERMITE_SMOOTH');
  assert.equal(smooth.positionErrorQuantized, 10);

  // Record frame #3 with large 80-unit (0.80m > 0.15m) desync + unacknowledged frame #4 -> HARD_ROLLBACK_REPLAY
  ring.recordFrame({
    clientSeq: 3,
    cohortId: 0,
    predictedPosXQuantized: cohort0.posXQuantized + 80,
    predictedPosZQuantized: cohort0.posZQuantized,
    targetXQuantized: cohort0.posXQuantized + 500,
    targetZQuantized: cohort0.posZQuantized,
    formation: 'WEDGE_CHARGE',
  });
  ring.recordFrame({
    clientSeq: 4,
    cohortId: 0,
    predictedPosXQuantized: cohort0.posXQuantized + 110,
    predictedPosZQuantized: cohort0.posZQuantized,
    targetXQuantized: cohort0.posXQuantized + 500,
    targetZQuantized: cohort0.posZQuantized,
    formation: 'WEDGE_CHARGE',
  });

  const rollback = reconcileClientPrediction(
    ring,
    3,
    cohort0,
    cohort0.posXQuantized + 110,
    cohort0.posZQuantized
  );
  assert.equal(rollback.mode, 'HARD_ROLLBACK_REPLAY');
  assert.equal(rollback.replayedFramesCount, 1);
  assert.ok(rollback.reconciledPosXQuantized > cohort0.posXQuantized);
});

test('6. Multi-Region Replication Status verifies 3 regional clusters in quorum with matching FNV-1a stateHash', () => {
  const sectorState = createInitialAuthoritativeSiegeSectorState('B2');
  const snapshot = buildMultiRegionReplicationStatus(
    'us-east-solara-1',
    sectorState,
    4,
    '2026-11-14T00:00:00.000Z'
  );

  assert.equal(snapshot.clusters.length, 3);
  assert.equal(snapshot.allRegionsInQuorum, true);
  assert.equal(snapshot.consensusStateHash, sectorState.stateHash);
  assert.equal(snapshot.clusters[0].role, 'PRIMARY_AUTHORITATIVE');
  assert.equal(snapshot.clusters[1].role, 'HOT_STANDBY_REPLICA');
  assert.equal(snapshot.clusters[2].role, 'HOT_STANDBY_REPLICA');
  assert.equal(fnv1a32('voxel-realms-siege-test'), fnv1a32('voxel-realms-siege-test'));
});
