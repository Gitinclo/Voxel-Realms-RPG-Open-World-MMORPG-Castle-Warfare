/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  DEFAULT_EXPECTED_WORLD_CHUNKS,
  DEFAULT_VOXEL_CHUNK_SIZE_METERS,
  HIGH_END_PC_MAC_CONTINENTAL_EXPANSION_TABLE,
  INTERNATIONAL_MMORPG_BENCHMARK_TABLE,
  INTERNATIONAL_MMORPG_PILLARS,
  OpenWorldCameraTweenController,
  OpenWorldChunkStreamingManager,
  OpenWorldSimplexGenerator,
  ServerMeshSpatialGridAuthority,
  buildSceneBVHTrees,
  buildVoxelChunkDebugGridSnapshot,
  computeCameraRelativeGpuTransform64,
  disposeSceneBVHTrees,
  enableOpenWorldMeshBVH,
  evaluateChunkBoundaryProximity,
  evaluateInternationalMmorpgStandardCompliance,
  evaluateWorldMapStreamingProgress,
  parseStreamedChunkKey,
  rebaseFloatingOriginCoord,
  resolvePlayerCitadelCollisionCannon,
  resolveThreeDimensionalObjectCollision,
  simulateSiegeArtilleryTrajectory,
} from './openWorld3DEngine';

test('1. OpenWorldSimplexGenerator produces deterministic multi-octave fBm heights and flat Citadel basin', () => {
  const genA = new OpenWorldSimplexGenerator(20261106);
  const genB = new OpenWorldSimplexGenerator(20261106);

  // Inside Solara Citadel safe basin (r <= 22m), terrain height must be flat 0m
  const centerSample = genA.sampleTerrain(0, 0);
  assert.equal(centerSample.elevationMeters, 0);
  assert.equal(centerSample.biome, 'solara_citadel_basin');

  // Outer frontier coordinates must match deterministically across instances
  const outerA = genA.sampleTerrain(64, -52, 4);
  const outerB = genB.sampleTerrain(64, -52, 4);
  assert.equal(outerA.elevationMeters, outerB.elevationMeters);
  assert.equal(outerA.moisture, outerB.moisture);
  assert.equal(outerA.temperature, outerB.temperature);
  assert.equal(outerA.caveDensity3D, outerB.caveDensity3D);
  assert.equal(outerA.biome, outerB.biome);
});

test('2. three-mesh-bvh builds and disposes MeshBVH acceleration trees and accelerates Three.js raycasting', () => {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(2, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  mesh.position.set(0, 0, -10);
  mesh.updateMatrixWorld(true);
  group.add(mesh);

  const raycaster = new THREE.Raycaster(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1));
  enableOpenWorldMeshBVH(raycaster);

  const built = buildSceneBVHTrees(group);
  assert.equal(built, 1);

  const hits = raycaster.intersectObject(group, true);
  assert.equal(hits.length, 1);
  assert.ok(Math.abs(hits[0].distance - 8) < 0.05);

  const disposed = disposeSceneBVHTrees(group);
  assert.equal(disposed, 1);
});

test('3. cannon-es simulateSiegeArtilleryTrajectory & resolvePlayerCitadelCollisionCannon compute 3D physics accurately', () => {
  const traj = simulateSiegeArtilleryTrajectory({
    origin: { x: -40, y: 6, z: 0 },
    launchVelocity: { vx: 28, vy: 18, vz: 0 },
    windVector: { wx: 1.5, wz: -0.5 },
    projectileMassKg: 500,
  });

  assert.ok(traj.points.length >= 5);
  assert.ok(traj.impactX > -40);
  assert.equal(traj.impactY, 0);
  assert.ok(traj.flightDurationSec > 0.5);
  assert.ok(traj.kineticImpactMegaJoules > 0);

  // Player outside keep does not collide
  const freeMove = resolvePlayerCitadelCollisionCannon({ desiredX: 0, desiredZ: 18 });
  assert.equal(freeMove.collidedWithKeep, false);
  assert.equal(freeMove.resolvedZ, 18);

  // Player attempting to walk inside keep (0, 3) is pushed out to clearance boundary
  const blockedMove = resolvePlayerCitadelCollisionCannon({ desiredX: 0, desiredZ: 3 });
  assert.equal(blockedMove.collidedWithKeep, true);
  assert.ok(blockedMove.resolvedZ >= 8.0);
});

test('4. @tweenjs/tween.js OpenWorldCameraTweenController smoothly interpolates camera orbit angle', () => {
  const ctrl = new OpenWorldCameraTweenController(0, 20, 13.5);
  ctrl.tweenOrbitTo(Math.PI / 2, 200);

  const mid = ctrl.update(100);
  assert.ok(mid.orbitAngleRad > 0.2 && mid.orbitAngleRad < Math.PI / 2);

  const end = ctrl.update(250);
  assert.ok(Math.abs(end.orbitAngleRad - Math.PI / 2) < 1e-4);
});

test('5. resolveThreeDimensionalObjectCollision enforces Momentum Conservation, Newtons Third Law, and Elastic / Inelastic / Perfectly Inelastic energy regimes', () => {
  const bodyA = {
    id: 'boulder_alpha',
    massKg: 10,
    position: { x: 0, y: 1, z: 0 },
    velocity: { vx: 12, vy: 0, vz: 0 },
    radiusMeters: 1.0,
  };
  const bodyB = {
    id: 'boulder_beta',
    massKg: 10,
    position: { x: 1.8, y: 1, z: 0 }, // Overlapping by 0.2m (combined radius = 2.0m)
    velocity: { vx: 0, vy: 0, vz: 0 },
    radiusMeters: 1.0,
  };

  // 1. Elastic Collision (e = 1.0): Momentum AND Kinetic Energy are both conserved; equal masses swap velocities
  const elastic = resolveThreeDimensionalObjectCollision({
    bodyA,
    bodyB,
    regime: 'elastic',
  });
  assert.equal(elastic.collided, true);
  assert.equal(elastic.restitutionCoefficient, 1.0);
  assert.equal(elastic.momentumConserved, true);
  assert.equal(elastic.newtonThirdLawVerified, true);
  assert.ok(Math.abs(elastic.kineticEnergyLostJoules) < 1e-7);
  assert.ok(Math.abs(elastic.bodyAAfter.velocity.vx - 0) < 1e-7);
  assert.ok(Math.abs(elastic.bodyBAfter.velocity.vx - 12) < 1e-7);
  // Colliders pushed apart so they no longer overlap
  const postDist = Math.hypot(
    elastic.bodyBAfter.position.x - elastic.bodyAAfter.position.x,
    elastic.bodyBAfter.position.y - elastic.bodyAAfter.position.y,
    elastic.bodyBAfter.position.z - elastic.bodyAAfter.position.z
  );
  assert.ok(postDist >= 2.0 - 1e-6);

  // 2. Inelastic Collision (e = 0.5): Momentum conserved, partial kinetic energy lost
  const inelastic = resolveThreeDimensionalObjectCollision({
    bodyA,
    bodyB,
    regime: 'inelastic',
    inelasticRestitution: 0.5,
  });
  assert.equal(inelastic.collided, true);
  assert.equal(inelastic.momentumConserved, true);
  assert.equal(inelastic.newtonThirdLawVerified, true);
  assert.ok(inelastic.kineticEnergyLostJoules > 0);
  assert.ok(inelastic.kineticEnergyAfterJoules < inelastic.kineticEnergyBeforeJoules);

  // 3. Perfectly Inelastic Collision (e = 0.0): Objects move with common final velocity (6 m/s) & maximize KE loss
  const perfectlyInelastic = resolveThreeDimensionalObjectCollision({
    bodyA,
    bodyB,
    regime: 'perfectly_inelastic',
  });
  assert.equal(perfectlyInelastic.collided, true);
  assert.equal(perfectlyInelastic.restitutionCoefficient, 0.0);
  assert.equal(perfectlyInelastic.momentumConserved, true);
  assert.equal(perfectlyInelastic.newtonThirdLawVerified, true);
  assert.ok(Math.abs(perfectlyInelastic.bodyAAfter.velocity.vx - 6) < 1e-7);
  assert.ok(Math.abs(perfectlyInelastic.bodyBAfter.velocity.vx - 6) < 1e-7);
  assert.ok(perfectlyInelastic.kineticEnergyLostJoules > inelastic.kineticEnergyLostJoules);
});

test('6. evaluateInternationalMmorpgStandardCompliance verifies 4 benchmark domains and 5 core MMORPG pillars (21 subsystems)', () => {
  assert.equal(INTERNATIONAL_MMORPG_BENCHMARK_TABLE.length, 4);
  assert.equal(INTERNATIONAL_MMORPG_PILLARS.length, 5);

  const report = evaluateInternationalMmorpgStandardCompliance({
    openWorldServerTickHz: 20, // 20Hz authoritative siege & open-world server tick
    mobileClientFps: 60,
    pcConsoleClientFps: 120,
    mobileRttMs: 95,
    pcConsoleRttMs: 42,
  });

  assert.equal(report.compliant, true);
  assert.equal(report.totalPillars, 5);
  assert.equal(report.totalSubsystems, 21);
  assert.equal(report.benchmarkDomainsVerified, 4);
  assert.equal(report.serverTickHzInOpenWorldWindow, true);
  assert.equal(report.mobileFpsWithinTarget, true);
  assert.equal(report.pcConsoleFpsWithinTarget, true);
  assert.equal(report.mobileRttWithinBudget, true);
  assert.equal(report.pcConsoleRttWithinBudget, true);
});

test('7. High-End PC & Mac 100km×100km 64-Bit LWC Camera-Relative GPU Transform & Floating Origin Rebasing eliminate float32 jitter', () => {
  assert.equal(HIGH_END_PC_MAC_CONTINENTAL_EXPANSION_TABLE.length, 5);

  // At 100 km (100,000 meters), raw 32-bit float loses sub-centimeter precision,
  // but 64-bit CPU world subtraction + 32-bit camera-relative GPU transform preserves millimeter accuracy
  const lwc = computeCameraRelativeGpuTransform64({
    entityWorldX: 100_000.125,
    entityWorldY: 42.5,
    entityWorldZ: -100_000.875,
    cameraWorldX: 100_000.0,
    cameraWorldY: 40.0,
    cameraWorldZ: -100_000.0,
  });

  assert.equal(lwc.cameraGpuOriginZeroVerified, true);
  assert.equal(lwc.jitterFreeAt100Km, true);
  assert.equal(lwc.cameraRelativeGpuF32[0], 0.125);
  assert.equal(lwc.cameraRelativeGpuF32[1], 2.5);
  assert.equal(lwc.cameraRelativeGpuF32[2], -0.875);

  // Cross-platform Floating Origin Rebasing past 5,000m into 256m x 256m tiles
  const rebased = rebaseFloatingOriginCoord({
    worldX: 5200.5,
    worldZ: -1050.25,
    chunkSizeMeters: 256,
    rebaseThresholdMeters: 5000,
  });
  assert.equal(rebased.rebased, true);
  assert.equal(rebased.chunkX, 20);
  assert.equal(rebased.chunkZ, -5);
  assert.ok(rebased.localOffsetX >= 0 && rebased.localOffsetX < 256);
  assert.ok(rebased.localOffsetZ >= 0 && rebased.localOffsetZ < 256);
  assert.equal(rebased.reconstructedWorldX, 5200.5);
  assert.equal(rebased.reconstructedWorldZ, -1050.25);
});

test('8. Three.js OpenWorldChunkStreamingManager (256m tiles, POI stamps, hysteresis disposal) & ServerMeshSpatialGridAuthority (100m ghost buffer & replication graph)', () => {
  const chunkMgr = new OpenWorldChunkStreamingManager({
    chunkSizeMeters: 256,
    activeRadiusChunks: 1, // 3x3 = 9 active chunks
    disposeRadiusChunks: 2,
    impostorDistanceMeters: 150,
  });

  // Step 1: Spawn at Solara Citadel (0, 0) -> loads 3x3 = 9 chunks
  const step1 = chunkMgr.updateStreamingAroundPlayer(0, 0);
  assert.equal(step1.activeChunkCount, 9);
  assert.equal(step1.loadedThisStep.length, 9);
  assert.equal(step1.disposedThisStep.length, 0);

  // Verify Solara Citadel POI stamp flattens elevation at (0, 0) and suppresses foliage
  const poiSample = chunkMgr.sampleElevationWithPoiStamps(0, 0);
  assert.equal(poiSample.elevationMeters, 0);
  assert.equal(poiSample.suppressFoliage, true);
  assert.equal(poiSample.appliedPoiId, 'poi_solara_citadel');

  // Step 2: Teleport player far East (chunkX = 10, worldX = 2560m) -> old 9 chunks exceed hysteresis and are strictly disposed
  const step2 = chunkMgr.updateStreamingAroundPlayer(2560, 0);
  assert.equal(step2.activeChunkCount, 9);
  assert.equal(step2.disposedThisStep.length, 9);
  assert.equal(chunkMgr.getTotalDisposedCount(), 9);

  // Clean up remaining chunks
  const finalDisposed = chunkMgr.disposeAll();
  assert.equal(finalDisposed, 9);
  assert.equal(chunkMgr.getTotalDisposedCount(), 18);

  // Verify Server Meshing 100m Ghost Entity Boundary Overlap & < 50ms Handoff
  const meshAuth = new ServerMeshSpatialGridAuthority({
    zoneSizeMeters: 2000,
    ghostOverlapMeters: 100,
    aoiCellSizeMeters: 64,
  });

  // Near eastern border of zone (0,0) at x = 1950m (within 100m of 2000m border)
  const nearBorder = meshAuth.evaluateZoneAndGhostBoundary({
    worldX: 1950,
    worldZ: 500,
  });
  assert.equal(nearBorder.primaryServerZoneId, 'srv_zone_0_0');
  assert.equal(nearBorder.inBoundaryGhostBuffer, true);
  assert.ok(nearBorder.neighborGhostZoneIds.includes('srv_zone_1_0'));
  assert.equal(nearBorder.handoffTriggered, false);

  // Step across border to x = 2010m -> triggers sub-50ms server handoff to srv_zone_1_0
  const crossedBorder = meshAuth.evaluateZoneAndGhostBoundary({
    worldX: 2010,
    worldZ: 500,
    previousZoneId: nearBorder.primaryServerZoneId,
  });
  assert.equal(crossedBorder.primaryServerZoneId, 'srv_zone_1_0');
  assert.equal(crossedBorder.handoffTriggered, true);
  assert.ok(
    crossedBorder.estimatedHandoffLatencyMs > 0 && crossedBorder.estimatedHandoffLatencyMs < 50
  );

  // Verify Multi-Tiered Replication Graph frequencies (50m @ 30-60Hz, 300m @ 10Hz, 2km @ 2Hz, >2km @ 0Hz)
  const tierCombat = meshAuth.evaluateReplicationGraphTier({
    observerWorldX: 0,
    observerWorldZ: 0,
    targetWorldX: 30,
    targetWorldZ: 0,
    instancedPvpMode: true,
  });
  assert.equal(tierCombat.tier, 'combat_target_50m');
  assert.equal(tierCombat.targetUpdateHz, 60);

  const tierRider = meshAuth.evaluateReplicationGraphTier({
    observerWorldX: 0,
    observerWorldZ: 0,
    targetWorldX: 220,
    targetWorldZ: 0,
  });
  assert.equal(tierRider.tier, 'visible_rider_300m');
  assert.equal(tierRider.targetUpdateHz, 10);

  const tierBoss = meshAuth.evaluateReplicationGraphTier({
    observerWorldX: 0,
    observerWorldZ: 0,
    targetWorldX: 1500,
    targetWorldZ: 0,
  });
  assert.equal(tierBoss.tier, 'world_boss_siege_2km');
  assert.equal(tierBoss.targetUpdateHz, 2);

  const tierCulled = meshAuth.evaluateReplicationGraphTier({
    observerWorldX: 0,
    observerWorldZ: 0,
    targetWorldX: 3500,
    targetWorldZ: 0,
  });
  assert.equal(tierCulled.tier, 'horizon_hlod_culled');
  assert.equal(tierCulled.targetUpdateHz, 0);
});

test('9. evaluateChunkBoundaryProximity triggers visual warning, screen-shake, and fetch prompt near chunk edges and clears once fetched', () => {
  // At initial spawn (0, 18), player is safely inside the loaded chunk with no warning or shake
  const atSpawn = evaluateChunkBoundaryProximity({
    playerWorldX: 0,
    playerWorldZ: 18,
    timeSeconds: 1.25,
  });
  assert.equal(atSpawn.isNearChunkEdge, false);
  assert.equal(atSpawn.promptFetchNewArea, false);
  assert.equal(atSpawn.shakeIntensity, 0);

  // Approaching Northern Frostpeak frontier (0, -34) triggers North boundary warning & screen-shake
  const nearNorthFrontier = evaluateChunkBoundaryProximity({
    playerWorldX: 0,
    playerWorldZ: -34,
    timeSeconds: 1.25,
  });
  assert.equal(nearNorthFrontier.isNearChunkEdge, true);
  assert.equal(nearNorthFrontier.promptFetchNewArea, true);
  assert.equal(nearNorthFrontier.approachingDirection, 'North');
  assert.ok(nearNorthFrontier.shakeIntensity > 0);
  assert.ok(nearNorthFrontier.warningMessage.includes('Fetch New Area Data'));

  // Once the target chunk/sector is fetched, warning and shake clear for that boundary
  const afterFetch = evaluateChunkBoundaryProximity({
    playerWorldX: 0,
    playerWorldZ: -34,
    fetchedBoundaryKeys: [nearNorthFrontier.targetChunkKey],
    timeSeconds: 1.25,
  });
  assert.equal(afterFetch.isNearChunkEdge, false);
  assert.equal(afterFetch.promptFetchNewArea, false);
  assert.equal(afterFetch.shakeIntensity, 0);

  // Approaching 256m outer chunk East edge at (244, 120) triggers East chunk warning
  const nearOuterEast = evaluateChunkBoundaryProximity({
    playerWorldX: 244,
    playerWorldZ: 120,
    timeSeconds: 2.0,
  });
  assert.equal(nearOuterEast.isNearChunkEdge, true);
  assert.equal(nearOuterEast.approachingDirection, 'East');
  assert.equal(nearOuterEast.targetChunkKey, '1,0');
  assert.ok(nearOuterEast.shakeIntensity > 0.25);
});

test('10. evaluateWorldMapStreamingProgress computes bounded percentages, status labels, and expansion overflow', () => {
  assert.equal(DEFAULT_EXPECTED_WORLD_CHUNKS, 25);

  const initial = evaluateWorldMapStreamingProgress({ streamedChunkCount: 9 });
  assert.equal(initial.clampedStreamedChunks, 9);
  assert.equal(initial.totalExpectedChunks, 25);
  assert.equal(initial.remainingChunks, 16);
  assert.equal(initial.progressPercent, 36);
  assert.equal(initial.isComplete, false);
  assert.equal(initial.statusLabel, 'World Map');

  const nearEdge = evaluateWorldMapStreamingProgress({
    streamedChunkCount: 12,
    isNearChunkEdge: true,
  });
  assert.equal(nearEdge.progressPercent, 48);
  assert.equal(nearEdge.statusLabel, 'Frontier Ready');

  const activeStreaming = evaluateWorldMapStreamingProgress({
    streamedChunkCount: 15,
    isNearChunkEdge: true,
    isStreamingActive: true,
  });
  assert.equal(activeStreaming.progressPercent, 60);
  assert.equal(activeStreaming.statusLabel, 'Streaming Sector...');

  const complete = evaluateWorldMapStreamingProgress({ streamedChunkCount: 25 });
  assert.equal(complete.progressPercent, 100);
  assert.equal(complete.remainingChunks, 0);
  assert.equal(complete.isComplete, true);
  assert.equal(complete.isExpandedBeyondRegion, false);
  assert.equal(complete.statusLabel, 'Region Loaded');

  const expanded = evaluateWorldMapStreamingProgress({ streamedChunkCount: 31 });
  assert.equal(expanded.progressPercent, 100);
  assert.equal(expanded.clampedStreamedChunks, 25);
  assert.equal(expanded.isExpandedBeyondRegion, true);
  assert.equal(expanded.expandedExtraChunks, 6);
  assert.equal(expanded.statusLabel, 'Continental Expansion');

  const guarded = evaluateWorldMapStreamingProgress({
    streamedChunkCount: -5,
    totalExpectedChunks: Number.NaN,
  });
  assert.equal(guarded.streamedChunkCount, 0);
  assert.equal(guarded.totalExpectedChunks, DEFAULT_EXPECTED_WORLD_CHUNKS);
  assert.equal(guarded.progressPercent, 0);
});

test('11. parseStreamedChunkKey parses canonical coordinates and directional frontier sector keys', () => {
  const coord = parseStreamedChunkKey('-1,2');
  assert.deepEqual(coord, {
    rawKey: '-1,2',
    chunkX: -1,
    chunkZ: 2,
    canonicalKey: '-1,2',
    source: 'coordinate',
  });

  const frontier = parseStreamedChunkKey('sector_north_0_-2');
  assert.deepEqual(frontier, {
    rawKey: 'sector_north_0_-2',
    chunkX: 0,
    chunkZ: -2,
    canonicalKey: '0,-2',
    source: 'frontier_sector',
    direction: 'north',
  });

  assert.equal(parseStreamedChunkKey('invalid_key'), null);
  assert.equal(parseStreamedChunkKey(''), null);
});

test('12. buildVoxelChunkDebugGridSnapshot maps 256x256 cached sectors, player sub-chunk position, and frontier targets', () => {
  assert.equal(DEFAULT_VOXEL_CHUNK_SIZE_METERS, 256);

  const initialCache = new Set([
    '-1,-1',
    '0,-1',
    '1,-1',
    '-1,0',
    '0,0',
    '1,0',
    '-1,1',
    '0,1',
    '1,1',
    'sector_north_0_-2',
  ]);

  const snapshot = buildVoxelChunkDebugGridSnapshot({
    streamedChunkKeys: initialCache,
    playerWorldX: 64,
    playerWorldZ: 128,
    gridRadius: 2,
    targetChunkKey: 'sector_east_2_0',
  });

  assert.equal(snapshot.chunkSizeMeters, 256);
  assert.equal(snapshot.gridDimension, 5);
  assert.equal(snapshot.totalVisibleCells, 25);
  assert.equal(snapshot.playerChunkX, 0);
  assert.equal(snapshot.playerChunkZ, 0);
  assert.equal(snapshot.playerLocalX, 64);
  assert.equal(snapshot.playerLocalZ, 128);
  assert.equal(snapshot.playerLocalPercentX, 25);
  assert.equal(snapshot.playerLocalPercentZ, 50);
  assert.equal(snapshot.totalCachedKeyCount, 10);
  assert.equal(snapshot.cachedCoordinateCount, 10);
  assert.equal(snapshot.visibleCachedCount, 10);
  assert.equal(snapshot.cacheHitPercent, 40);

  const originCell = snapshot.cells.find((c) => c.key === '0,0');
  assert.ok(originCell);
  assert.equal(originCell.isCurrentPlayerChunk, true);
  assert.equal(originCell.isCached, true);
  assert.equal(originCell.cachedSource, 'coordinate');
  assert.equal(originCell.lodLabel, 'LOD0');
  assert.equal(originCell.worldMinX, 0);
  assert.equal(originCell.worldMaxX, 256);

  const northFrontierCell = snapshot.cells.find((c) => c.key === '0,-2');
  assert.ok(northFrontierCell);
  assert.equal(northFrontierCell.isCached, true);
  assert.equal(northFrontierCell.cachedSource, 'frontier_sector');
  assert.deepEqual(northFrontierCell.matchedKeys, ['sector_north_0_-2']);
  assert.equal(northFrontierCell.lodLabel, 'LOD2');

  const eastTargetCell = snapshot.cells.find((c) => c.key === '2,0');
  assert.ok(eastTargetCell);
  assert.equal(eastTargetCell.isCached, false);
  assert.equal(eastTargetCell.isTargetFrontierChunk, true);

  // Verify 7x7 expansion (radius 3) includes HLOD ring
  const wideSnapshot = buildVoxelChunkDebugGridSnapshot({
    streamedChunkKeys: initialCache,
    playerWorldX: 64,
    playerWorldZ: 128,
    gridRadius: 3,
  });
  assert.equal(wideSnapshot.gridDimension, 7);
  assert.equal(wideSnapshot.totalVisibleCells, 49);
  const cornerCell = wideSnapshot.cells.find((c) => c.key === '-3,-3');
  assert.ok(cornerCell);
  assert.equal(cornerCell.lodLabel, 'HLOD');
});
