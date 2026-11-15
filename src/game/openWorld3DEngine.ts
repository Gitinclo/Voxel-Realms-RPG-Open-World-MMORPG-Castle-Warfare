/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { createNoise2D, createNoise3D } from 'simplex-noise';
import { MeshBVH, acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import * as CANNON from 'cannon-es';
import { Easing, Group as TweenGroup, Tween } from '@tweenjs/tween.js';

// Extend Three.js BufferGeometry & Mesh prototypes for O(log N) BVH raycasting
let bvhPrototypesRegistered = false;

export function enableOpenWorldMeshBVH(raycaster?: THREE.Raycaster): void {
  if (!bvhPrototypesRegistered) {
    const geoProto = THREE.BufferGeometry.prototype as unknown as {
      computeBoundsTree?: typeof computeBoundsTree;
      disposeBoundsTree?: typeof disposeBoundsTree;
    };
    const meshProto = THREE.Mesh.prototype as unknown as {
      raycast: typeof acceleratedRaycast;
    };
    geoProto.computeBoundsTree = computeBoundsTree;
    geoProto.disposeBoundsTree = disposeBoundsTree;
    meshProto.raycast = acceleratedRaycast;
    bvhPrototypesRegistered = true;
  }
  if (raycaster) {
    (raycaster as THREE.Raycaster & { firstHitOnly?: boolean }).firstHitOnly = true;
  }
}

/**
 * Builds Bounding Volume Hierarchy (`MeshBVH`) acceleration trees across a Three.js scene subtree
 * so open-world pointer picking and terrain queries run in O(log N) time.
 */
export function buildSceneBVHTrees(root: THREE.Object3D): number {
  enableOpenWorldMeshBVH();
  let builtCount = 0;
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.BufferGeometry) {
      const geo = obj.geometry as THREE.BufferGeometry & {
        boundsTree?: MeshBVH;
        computeBoundsTree?: () => MeshBVH;
      };
      if (!geo.boundsTree && geo.attributes.position && geo.attributes.position.count >= 12) {
        geo.boundsTree = new MeshBVH(geo);
        builtCount += 1;
      }
    }
  });
  return builtCount;
}

/**
 * Disposes `MeshBVH` bounds trees across a Three.js scene subtree on unmount.
 */
export function disposeSceneBVHTrees(root: THREE.Object3D): number {
  let disposedCount = 0;
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.BufferGeometry) {
      const geo = obj.geometry as THREE.BufferGeometry & {
        boundsTree?: MeshBVH;
        disposeBoundsTree?: () => void;
      };
      if (geo.boundsTree) {
        if (typeof geo.disposeBoundsTree === 'function') {
          geo.disposeBoundsTree();
        } else {
          geo.boundsTree = undefined;
        }
        disposedCount += 1;
      }
    }
  });
  return disposedCount;
}

// ============================================================================
// 1. SIMPLEX-NOISE MULTI-OCTAVE OPEN-WORLD VOXEL BIOME & TERRAIN SYNTHESIS
// ============================================================================

export type OpenWorldBiomeId =
  | 'solara_citadel_basin'
  | 'jade_bamboo_grove'
  | 'crimson_thunder_ridge'
  | 'frost_lotus_tundra'
  | 'astral_leyline_marsh'
  | 'obsidian_siege_wastes';

export interface OpenWorldTerrainSample {
  x: number;
  z: number;
  elevationMeters: number;
  moisture: number;
  temperature: number;
  caveDensity3D: number;
  biome: OpenWorldBiomeId;
}

/**
 * Deterministic Mulberry32 PRNG for reproducible multi-peer open-world noise seeds.
 */
export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class OpenWorldSimplexGenerator {
  private readonly elevationNoise2D: ReturnType<typeof createNoise2D>;
  private readonly moistureNoise2D: ReturnType<typeof createNoise2D>;
  private readonly temperatureNoise2D: ReturnType<typeof createNoise2D>;
  private readonly cavernNoise3D: ReturnType<typeof createNoise3D>;

  constructor(seed: number = 20261106) {
    this.elevationNoise2D = createNoise2D(createSeededRng(seed));
    this.moistureNoise2D = createNoise2D(createSeededRng(seed ^ 0x9e3779b9));
    this.temperatureNoise2D = createNoise2D(createSeededRng(seed ^ 0x85ebca6b));
    this.cavernNoise3D = createNoise3D(createSeededRng(seed ^ 0xc2b2ae35));
  }

  /**
   * Computes multi-octave fractal Brownian motion (fBm) terrain height with a smooth
   * Citadel safe-basin plateau inside radius <= 24m so castle walls sit flush on Y = 0.
   */
  public sampleTerrain(x: number, z: number, sampleY: number = 0): OpenWorldTerrainSample {
    const distFromCitadel = Math.hypot(x, z);
    const basinMask =
      distFromCitadel <= 22
        ? 0
        : distFromCitadel >= 36
          ? 1
          : THREE.MathUtils.smoothstep(distFromCitadel, 22, 36);

    const freq1 = 0.018;
    const freq2 = 0.042;
    const freq3 = 0.095;

    const n1 = this.elevationNoise2D(x * freq1, z * freq1);
    const n2 = this.elevationNoise2D(x * freq2 + 17.3, z * freq2 - 11.7) * 0.5;
    const n3 = this.elevationNoise2D(x * freq3 - 31.1, z * freq3 + 23.9) * 0.25;
    const fbm = (n1 + n2 + n3) / 1.75; // Normalized [-1, 1]

    // Quantize outer hills to 0.5m voxel terraces while keeping citadel basin flat
    const rawElevation = fbm * 8.5 * basinMask;
    const elevationMeters = Math.round(rawElevation * 2) / 2 + 0;

    const moisture = (this.moistureNoise2D(x * 0.014 + 50, z * 0.014 + 50) + 1) * 0.5;
    const temperature = (this.temperatureNoise2D(x * 0.012 - 80, z * 0.012 - 80) + 1) * 0.5;
    const caveDensity3D = (this.cavernNoise3D(x * 0.05, sampleY * 0.08, z * 0.05) + 1) * 0.5;

    let biome: OpenWorldBiomeId = 'jade_bamboo_grove';
    if (distFromCitadel <= 24) {
      biome = 'solara_citadel_basin';
    } else if (temperature < 0.28) {
      biome = 'frost_lotus_tundra';
    } else if (temperature > 0.72 && moisture < 0.42) {
      biome = 'obsidian_siege_wastes';
    } else if (elevationMeters >= 2.5) {
      biome = 'crimson_thunder_ridge';
    } else if (moisture >= 0.65) {
      biome = 'astral_leyline_marsh';
    }

    return {
      x,
      z,
      elevationMeters,
      moisture,
      temperature,
      caveDensity3D,
      biome,
    };
  }
}

// ============================================================================
// 2. CANNON-ES 3D RIGID-BODY OPEN-WORLD PHYSICS & SIEGE ARTILLERY SOLVER
// ============================================================================

export interface SiegeTrajectoryPoint {
  timeSec: number;
  x: number;
  y: number;
  z: number;
  speedMetersPerSec: number;
}

export interface SiegeTrajectoryResult {
  points: SiegeTrajectoryPoint[];
  impactX: number;
  impactY: number;
  impactZ: number;
  flightDurationSec: number;
  kineticImpactMegaJoules: number;
}

/**
 * Simulates a 3D siege projectile (Trebuchet boulder / Soulfire Cannon shell) using a
 * real `cannon-es` rigid-body physics world with SAPBroadphase, gravity, and wind drag.
 */
export function simulateSiegeArtilleryTrajectory(params: {
  origin: { x: number; y: number; z: number };
  launchVelocity: { vx: number; vy: number; vz: number };
  windVector?: { wx: number; wz: number };
  projectileMassKg?: number;
  maxSteps?: number;
  fixedTimeStepSec?: number;
}): SiegeTrajectoryResult {
  const {
    origin,
    launchVelocity,
    windVector = { wx: 0, wz: 0 },
    projectileMassKg = 450,
    maxSteps = 240,
    fixedTimeStepSec = 1 / 30,
  } = params;

  const world = new CANNON.World();
  world.gravity.set(0, -9.81, 0);
  world.broadphase = new CANNON.SAPBroadphase(world);

  const projectileBody = new CANNON.Body({
    mass: Math.max(1, projectileMassKg),
    shape: new CANNON.Sphere(0.65),
    position: new CANNON.Vec3(origin.x, Math.max(0.5, origin.y), origin.z),
    velocity: new CANNON.Vec3(launchVelocity.vx, launchVelocity.vy, launchVelocity.vz),
    linearDamping: 0.02,
  });
  world.addBody(projectileBody);

  const points: SiegeTrajectoryPoint[] = [];
  let elapsed = 0;

  for (let step = 0; step < maxSteps; step++) {
    // Apply subtle wind force each tick
    projectileBody.applyForce(
      new CANNON.Vec3(windVector.wx * 12, 0, windVector.wz * 12),
      projectileBody.position
    );
    world.step(fixedTimeStepSec);
    elapsed += fixedTimeStepSec;

    const vx = projectileBody.velocity.x;
    const vy = projectileBody.velocity.y;
    const vz = projectileBody.velocity.z;
    const speed = Math.hypot(vx, vy, vz);

    points.push({
      timeSec: Number(elapsed.toFixed(3)),
      x: projectileBody.position.x,
      y: Math.max(0, projectileBody.position.y),
      z: projectileBody.position.z,
      speedMetersPerSec: speed,
    });

    if (projectileBody.position.y <= 0 && step > 0) {
      break;
    }
  }

  const last = points[points.length - 1] ?? {
    timeSec: 0,
    x: origin.x,
    y: origin.y,
    z: origin.z,
    speedMetersPerSec: 0,
  };
  const kineticJoules = 0.5 * projectileMassKg * last.speedMetersPerSec ** 2;

  return {
    points,
    impactX: last.x,
    impactY: last.y,
    impactZ: last.z,
    flightDurationSec: last.timeSec,
    kineticImpactMegaJoules: Number((kineticJoules / 1_000_000).toFixed(4)),
  };
}

/**
 * Steps a 3D `cannon-es` rigid-body collision world between the player avatar and the
 * central Solara Citadel keep box so characters slide smoothly along fortress walls.
 */
export function resolvePlayerCitadelCollisionCannon(params: {
  desiredX: number;
  desiredZ: number;
  citadelHalfExtent?: number;
  playerRadius?: number;
}): { resolvedX: number; resolvedZ: number; collidedWithKeep: boolean } {
  const { desiredX, desiredZ, citadelHalfExtent = 7.2, playerRadius = 0.85 } = params;

  const world = new CANNON.World();
  world.broadphase = new CANNON.SAPBroadphase(world);

  const keepBody = new CANNON.Body({
    mass: 0, // Static fortress keep
    shape: new CANNON.Box(new CANNON.Vec3(citadelHalfExtent, 8, citadelHalfExtent)),
    position: new CANNON.Vec3(0, 4, 0),
  });
  world.addBody(keepBody);

  const playerBody = new CANNON.Body({
    mass: 80,
    shape: new CANNON.Sphere(playerRadius),
    position: new CANNON.Vec3(desiredX, 1, desiredZ),
  });
  world.addBody(playerBody);

  world.step(1 / 60);

  const minClearance = citadelHalfExtent + playerRadius;
  const insideKeepBox = Math.abs(desiredX) < minClearance && Math.abs(desiredZ) < minClearance;

  if (!insideKeepBox) {
    return {
      resolvedX: desiredX,
      resolvedZ: desiredZ,
      collidedWithKeep: false,
    };
  }

  // Push out along the shallowest penetration axis
  const overlapX = minClearance - Math.abs(desiredX);
  const overlapZ = minClearance - Math.abs(desiredZ);
  if (overlapX < overlapZ) {
    return {
      resolvedX: (desiredX >= 0 ? 1 : -1) * minClearance,
      resolvedZ: desiredZ,
      collidedWithKeep: true,
    };
  }
  return {
    resolvedX: desiredX,
    resolvedZ: (desiredZ >= 0 ? 1 : -1) * minClearance,
    collidedWithKeep: true,
  };
}

// ============================================================================
// 3. @TWEENJS/TWEEN.JS SMOOTH CAMERA ORBIT & COMBAT IMPULSE INTERPOLATION
// ============================================================================

export class OpenWorldCameraTweenController {
  private readonly group = new TweenGroup();
  private state = {
    orbitAngleRad: 0,
    zoomDistanceMeters: 20,
    elevationMeters: 13.5,
  };

  constructor(initialOrbitRad = 0, initialZoomMeters = 20, initialElevationMeters = 13.5) {
    this.state = {
      orbitAngleRad: initialOrbitRad,
      zoomDistanceMeters: initialZoomMeters,
      elevationMeters: initialElevationMeters,
    };
  }

  public tweenOrbitTo(targetAngleRad: number, durationMs: number = 220): void {
    this.group.removeAll();
    const tween = new Tween(this.state, this.group)
      .to({ orbitAngleRad: targetAngleRad }, Math.max(16, durationMs))
      .easing(Easing.Cubic.Out)
      .start(0);
    void tween;
  }

  public update(nowMs: number): {
    orbitAngleRad: number;
    zoomDistanceMeters: number;
    elevationMeters: number;
  } {
    this.group.update(nowMs);
    return { ...this.state };
  }
}
