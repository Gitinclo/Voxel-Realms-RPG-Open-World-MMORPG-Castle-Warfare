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
