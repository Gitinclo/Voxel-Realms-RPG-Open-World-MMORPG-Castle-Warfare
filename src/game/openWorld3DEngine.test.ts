/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  OpenWorldCameraTweenController,
  OpenWorldSimplexGenerator,
  buildSceneBVHTrees,
  disposeSceneBVHTrees,
  enableOpenWorldMeshBVH,
  resolvePlayerCitadelCollisionCannon,
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
