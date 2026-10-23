/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { CharacterAppearance, MonsterTarget, NPC, ResourceNode } from '../types/game';

/**
 * Graphics Quality Preset Type
 */
export type GraphicsQualityPreset = 'ultra' | 'high' | 'balanced';

// ============================================================================
// PROCEDURAL PBR CANVAS TEXTURES (Albedo + Bump/Roughness Maps)
// ============================================================================

const textureCache = new Map<string, THREE.CanvasTexture>();

function getOrCreateCanvasTexture(
  key: string,
  size: number,
  isColorMap: boolean,
  repeat: number,
  drawFn: (ctx: CanvasRenderingContext2D, size: number) => void
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  drawFn(ctx, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColorMap ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.needsUpdate = true;
  textureCache.set(key, tex);
  return tex;
}

function getGrassAlbedoTexture(): THREE.CanvasTexture | null {
  return getOrCreateCanvasTexture('grass_albedo', 256, true, 1, (ctx, s) => {
    ctx.fillStyle = '#43a047';
    ctx.fillRect(0, 0, s, s);
    // Subtle organic grass blades & clover speckles
    for (let i = 0; i < 900; i++) {
      const x = (i * 73) % s;
      const y = (i * 137) % s;
      ctx.fillStyle = i % 3 === 0 ? '#2e7d32' : i % 3 === 1 ? '#66bb6a' : '#388e3c';
      ctx.fillRect(x, y, 3, 6);
    }
    // Subtle voxel bevel border
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, s - 4, s - 4);
  });
}

function getStoneMasonryTexture(): THREE.CanvasTexture | null {
  return getOrCreateCanvasTexture('stone_masonry', 256, true, 1, (ctx, s) => {
    ctx.fillStyle = '#607d8b';
    ctx.fillRect(0, 0, s, s);
    const rows = 4;
    const rowH = s / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      const cols = 2;
      const colW = s / cols;
      const offset = (r % 2) * (colW / 2);
      for (let c = -1; c <= cols; c++) {
        const x = c * colW + offset;
        const shade = ((r * 3 + c * 7) % 3) * 8 - 8;
        ctx.fillStyle = `rgb(${102 + shade}, ${126 + shade}, ${138 + shade})`;
        ctx.fillRect(x + 3, y + 3, colW - 6, rowH - 6);
        // Highlight top edge
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(x + 3, y + 3, colW - 6, 4);
      }
    }
  });
}

function getStoneBumpTexture(): THREE.CanvasTexture | null {
  return getOrCreateCanvasTexture('stone_bump', 256, false, 1, (ctx, s) => {
    ctx.fillStyle = '#303030';
    ctx.fillRect(0, 0, s, s);
    const rows = 4;
    const rowH = s / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      const cols = 2;
      const colW = s / cols;
      const offset = (r % 2) * (colW / 2);
      for (let c = -1; c <= cols; c++) {
        const x = c * colW + offset;
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(x + 4, y + 4, colW - 8, rowH - 8);
      }
    }
  });
}

function getWoodBarkTexture(): THREE.CanvasTexture | null {
  return getOrCreateCanvasTexture('wood_bark', 256, true, 1, (ctx, s) => {
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 48; i++) {
      const x = (i * 19) % s;
      ctx.fillStyle = i % 2 === 0 ? '#4e342e' : '#6d4c41';
      ctx.fillRect(x, 0, 5, s);
    }
  });
}

function getWaterNormalBumpTexture(): THREE.CanvasTexture | null {
  return getOrCreateCanvasTexture('water_bump', 256, false, 14, (ctx, s) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 4) {
      for (let x = 0; x < s; x += 4) {
        const wave =
          Math.sin((x / s) * Math.PI * 4) * Math.cos((y / s) * Math.PI * 4) * 0.5 + 0.5;
        const val = Math.floor(80 + wave * 140);
        ctx.fillStyle = `rgb(${val},${val},${val})`;
        ctx.fillRect(x, y, 4, 4);
      }
    }
  });
}

let softShadowTextureCache: THREE.CanvasTexture | null = null;
function createSoftContactShadow(radius: number, opacity: number = 0.48): THREE.Mesh {
  if (!softShadowTextureCache && typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
      grad.addColorStop(0, 'rgba(2, 6, 23, 0.85)');
      grad.addColorStop(0.55, 'rgba(2, 6, 23, 0.35)');
      grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    softShadowTextureCache = new THREE.CanvasTexture(canvas);
  }
  const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: softShadowTextureCache || null,
    color: 0x020617,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.03;
  return mesh;
}

// ============================================================================
// STUDIO PBR MATERIALS (MeshPhysicalMaterial & MeshStandardMaterial)
// ============================================================================

const grassMap = getGrassAlbedoTexture();
const stoneMap = getStoneMasonryTexture();
const stoneBump = getStoneBumpTexture();
const woodMap = getWoodBarkTexture();
const waterBump = getWaterNormalBumpTexture();

const voxelMaterials = {
  grass: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: grassMap,
    bumpMap: grassMap,
    bumpScale: 0.04,
    roughness: 0.82,
    metalness: 0.06,
  }),
  grassDark: new THREE.MeshStandardMaterial({
    color: 0x2e7d32,
    roughness: 0.86,
    metalness: 0.05,
  }),
  dirt: new THREE.MeshStandardMaterial({
    color: 0x6d4c41,
    roughness: 0.92,
    metalness: 0.04,
  }),
  stone: new THREE.MeshStandardMaterial({
    color: 0xcfd8dc,
    map: stoneMap,
    bumpMap: stoneBump,
    bumpScale: 0.08,
    roughness: 0.65,
    metalness: 0.18,
  }),
  stoneDark: new THREE.MeshStandardMaterial({
    color: 0x78909c,
    map: stoneMap,
    bumpMap: stoneBump,
    bumpScale: 0.1,
    roughness: 0.58,
    metalness: 0.28,
  }),
  cobblestone: new THREE.MeshStandardMaterial({
    color: 0x90a4ae,
    map: stoneMap,
    bumpMap: stoneBump,
    bumpScale: 0.09,
    roughness: 0.68,
    metalness: 0.22,
  }),
  woodTrunk: new THREE.MeshStandardMaterial({
    color: 0x8d6e63,
    map: woodMap,
    bumpMap: woodMap,
    bumpScale: 0.06,
    roughness: 0.85,
  }),
  leaves: new THREE.MeshStandardMaterial({
    color: 0x2e7d32,
    roughness: 0.72,
    metalness: 0.08,
  }),
  leavesLight: new THREE.MeshStandardMaterial({
    color: 0x4caf50,
    roughness: 0.7,
    metalness: 0.08,
  }),
  leavesAutumn: new THREE.MeshPhysicalMaterial({
    color: 0xd84315,
    roughness: 0.45,
    metalness: 0.15,
    clearcoat: 0.35,
    clearcoatRoughness: 0.3,
  }),
  water: new THREE.MeshPhysicalMaterial({
    color: 0x0288d1,
    emissive: 0x01579b,
    emissiveIntensity: 0.18,
    roughness: 0.08,
    metalness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    reflectivity: 0.95,
    ior: 1.333,
    bumpMap: waterBump,
    bumpScale: 0.06,
    transparent: true,
    opacity: 0.88,
  }),
  steelOre: new THREE.MeshPhysicalMaterial({
    color: 0xcfd8dc,
    roughness: 0.22,
    metalness: 0.92,
    clearcoat: 0.5,
    clearcoatRoughness: 0.15,
  }),
  copperOre: new THREE.MeshPhysicalMaterial({
    color: 0xe68a5c,
    roughness: 0.26,
    metalness: 0.88,
    clearcoat: 0.45,
  }),
  diamondOre: new THREE.MeshPhysicalMaterial({
    color: 0x00e5ff,
    roughness: 0.06,
    metalness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    ior: 2.417,
    reflectivity: 1.0,
    emissive: 0x00b0ff,
    emissiveIntensity: 0.65,
  }),
  goldAccent: new THREE.MeshPhysicalMaterial({
    color: 0xffd700,
    emissive: 0xb45309,
    emissiveIntensity: 0.15,
    roughness: 0.18,
    metalness: 0.95,
    clearcoat: 0.7,
    clearcoatRoughness: 0.1,
  }),
  grainGold: new THREE.MeshStandardMaterial({
    color: 0xfbc02d,
    roughness: 0.78,
    metalness: 0.1,
  }),
  oilDark: new THREE.MeshPhysicalMaterial({
    color: 0x1e293b,
    roughness: 0.12,
    metalness: 0.85,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
  }),
  lanternGlow: new THREE.MeshStandardMaterial({
    color: 0xffecb3,
    emissive: 0xff9800,
    emissiveIntensity: 1.8,
    roughness: 0.1,
  }),
};

/**
 * Helper to draw high-DPI crisp canvas billboards
 */
function createCrispBillboardSprite(
  width: number,
  height: number,
  scaleX: number,
  scaleY: number,
  posY: number,
  drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.Sprite {
  let texture: THREE.CanvasTexture | null = null;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawFn(ctx, width, height);
    }
    texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 8;
  }
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(scaleX, scaleY, 1);
  sprite.position.y = posY;
  return sprite;
}

/**
 * Creates the High-Definition Voxel Open World Terrain with Biomes, Imperial Roads,
 * Foliage Tufts, Lantern Posts, and Animated Crystal Water
 */
export function createVoxelTerrain(): THREE.Group {
  const terrainGroup = new THREE.Group();
  terrainGroup.name = 'VoxelTerrain';

  const boxGeo = new THREE.BoxGeometry(2, 2, 2);

  // Stepped elevation grid (40x40 chunks)
  const gridSize = 40;
  const step = 2;
  const half = (gridSize * step) / 2;

  const count = gridSize * gridSize;
  const grassInstanced = new THREE.InstancedMesh(boxGeo, voxelMaterials.grass, count);
  grassInstanced.castShadow = true;
  grassInstanced.receiveShadow = true;

  const stoneInstanced = new THREE.InstancedMesh(
    boxGeo,
    voxelMaterials.stone,
    Math.floor(count * 0.48)
  );
  stoneInstanced.castShadow = true;
  stoneInstanced.receiveShadow = true;

  // Instanced wild grass blades & wildflowers for lush surface micro-detail
  const tuftGeo = new THREE.ConeGeometry(0.28, 0.65, 4);
  const tuftMat = new THREE.MeshStandardMaterial({
    color: 0x66bb6a,
    roughness: 0.75,
  });
  const grassTuftInstanced = new THREE.InstancedMesh(tuftGeo, tuftMat, 360);
  grassTuftInstanced.castShadow = false;
  grassTuftInstanced.receiveShadow = true;

  const mat4 = new THREE.Matrix4();
  const tempColor = new THREE.Color();
  let gIdx = 0;
  let sIdx = 0;
  let tIdx = 0;

  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      const worldX = x * step - half;
      const worldZ = z * step - half;

      const distFromCenter = Math.sqrt(worldX * worldX + worldZ * worldZ);
      const isImperialRoad =
        (Math.abs(worldX) <= 2 && Math.abs(worldZ) > 8 && Math.abs(worldZ) < 34) ||
        (Math.abs(worldZ) <= 2 && Math.abs(worldX) > 8 && Math.abs(worldX) < 34);

      const elevation = isImperialRoad
        ? 0
        : Math.floor(
            Math.sin(worldX * 0.08) * 1.5 +
              Math.cos(worldZ * 0.08) * 1.5 +
              (distFromCenter > 28 ? (distFromCenter - 28) * 0.15 : 0)
          );

      const heightY = elevation * 2;

      mat4.identity();
      mat4.setPosition(worldX, heightY - 1, worldZ);
      const currentGrassIndex = gIdx++;
      grassInstanced.setMatrixAt(currentGrassIndex, mat4);

      // Per-instance biome color tinting
      if (isImperialRoad) {
        tempColor.setHex(0x90a4ae); // Paved imperial stone road
      } else if (elevation >= 2) {
        tempColor.setHex(0x81c784); // Highland alpine meadow
      } else if (elevation <= -1) {
        tempColor.setHex(0xa5d6a7); // Shoreline moss
      } else {
        const checker = (x + z) % 2 === 0 ? 0x66bb6a : 0x4caf50;
        tempColor.setHex(checker);
      }
      grassInstanced.setColorAt(currentGrassIndex, tempColor);

      // Scatter 3D grass tufts on flat meadow blocks outside the castle/road
      if (
        !isImperialRoad &&
        distFromCenter > 12 &&
        elevation >= 0 &&
        tIdx < grassTuftInstanced.count &&
        (x * 17 + z * 31) % 5 === 0
      ) {
        const tuftMat4 = new THREE.Matrix4();
        tuftMat4.makeRotationY((x * z) % 3.14);
        tuftMat4.setPosition(
          worldX + ((x % 2) - 0.5) * 0.6,
          heightY + 0.3,
          worldZ + ((z % 2) - 0.5) * 0.6
        );
        grassTuftInstanced.setMatrixAt(tIdx, tuftMat4);
        tempColor.setHex((x + z) % 7 === 0 ? 0xffca28 : 0x66bb6a);
        grassTuftInstanced.setColorAt(tIdx, tempColor);
        tIdx++;
      }

      // If elevated, place stone foundation blocks underneath
      if (elevation > 0 && sIdx < stoneInstanced.count) {
        mat4.identity();
        mat4.setPosition(worldX, heightY - 3, worldZ);
        const stoneIndex = sIdx++;
        stoneInstanced.setMatrixAt(stoneIndex, mat4);
        tempColor.setHex(elevation > 2 ? 0xb0bec5 : 0x78909c);
        stoneInstanced.setColorAt(stoneIndex, tempColor);
      }
    }
  }

  grassInstanced.instanceMatrix.needsUpdate = true;
  if (grassInstanced.instanceColor) grassInstanced.instanceColor.needsUpdate = true;
  stoneInstanced.instanceMatrix.needsUpdate = true;
  if (stoneInstanced.instanceColor) stoneInstanced.instanceColor.needsUpdate = true;
  grassTuftInstanced.instanceMatrix.needsUpdate = true;
  if (grassTuftInstanced.instanceColor) grassTuftInstanced.instanceColor.needsUpdate = true;

  terrainGroup.add(grassInstanced);
  terrainGroup.add(stoneInstanced);
  terrainGroup.add(grassTuftInstanced);

  // Imperial Avenue Lantern Posts along South & North Approaches
  const lanternCoords = [
    [-3.2, 12],
    [3.2, 12],
    [-3.2, 20],
    [3.2, 20],
    [-3.2, -12],
    [3.2, -12],
  ];
  const postGeo = new THREE.CylinderGeometry(0.12, 0.16, 2.8, 6);
  const lampGeo = new THREE.BoxGeometry(0.45, 0.55, 0.45);
  lanternCoords.forEach(([lx, lz]) => {
    const post = new THREE.Mesh(postGeo, voxelMaterials.stoneDark);
    post.position.set(lx, 1.4, lz);
    post.castShadow = true;
    terrainGroup.add(post);

    const lamp = new THREE.Mesh(lampGeo, voxelMaterials.lanternGlow);
    lamp.position.set(lx, 2.95, lz);
    terrainGroup.add(lamp);
  });

  // Crystal Water Plane in the Valley
  const waterGeo = new THREE.PlaneGeometry(140, 140, 24, 24);
  const waterMesh = new THREE.Mesh(waterGeo, voxelMaterials.water);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = -2.05;
  waterMesh.receiveShadow = true;
  waterMesh.name = 'VoxelWaterPlane';
  terrainGroup.add(waterMesh);

  return terrainGroup;
}

/**
 * Procedural Multi-part Grand Citadel Structure (Castle Level 0 - 100)
 * Composite architectural model: Stepped plinth, curtain walls with crenellations,
 * Keep with glowing Gothic windows, 4 corner towers with finials, gatehouse portcullis,
 * braziers, flag banners, and counter-rotating Celestial Runic Spire.
 */
export function createVoxelCastle(level: number): THREE.Group {
  const castle = new THREE.Group();
  castle.name = 'PlayerCastle';

  // Soft ground ambient occlusion shadow under citadel
  castle.add(createSoftContactShadow(11.5, 0.65));

  // Stepped Stone Plinth Foundation
  const outerPlinth = new THREE.Mesh(
    new THREE.BoxGeometry(17.5, 1.5, 17.5),
    voxelMaterials.stoneDark
  );
  outerPlinth.position.y = 0.75;
  outerPlinth.castShadow = true;
  outerPlinth.receiveShadow = true;
  castle.add(outerPlinth);

  const baseGeo = new THREE.BoxGeometry(16, 4, 16);
  const baseMesh = new THREE.Mesh(baseGeo, voxelMaterials.stoneDark);
  baseMesh.position.y = 2.2;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  castle.add(baseMesh);

  // Crenellated Battlements (Merlons) around the outer curtain wall
  const merlonGeo = new THREE.BoxGeometry(1.1, 0.9, 1.1);
  for (let i = -6; i <= 6; i += 2.4) {
    const northMerlon = new THREE.Mesh(merlonGeo, voxelMaterials.stone);
    northMerlon.position.set(i, 4.65, -7.4);
    castle.add(northMerlon);

    if (Math.abs(i) > 2.2) {
      const southMerlon = new THREE.Mesh(merlonGeo, voxelMaterials.stone);
      southMerlon.position.set(i, 4.65, 7.4);
      castle.add(southMerlon);
    }

    const westMerlon = new THREE.Mesh(merlonGeo, voxelMaterials.stone);
    westMerlon.position.set(-7.4, 4.65, i);
    castle.add(westMerlon);

    const eastMerlon = new THREE.Mesh(merlonGeo, voxelMaterials.stone);
    eastMerlon.position.set(7.4, 4.65, i);
    castle.add(eastMerlon);
  }

  // Central Keep (scales with castle level)
  const keepHeight = 8 + Math.min(24, Math.floor(level * 0.24));
  const keepGeo = new THREE.BoxGeometry(10, keepHeight, 10);
  const keepMesh = new THREE.Mesh(keepGeo, voxelMaterials.cobblestone);
  keepMesh.position.y = 4 + keepHeight / 2;
  keepMesh.castShadow = true;
  keepMesh.receiveShadow = true;
  castle.add(keepMesh);

  // Gold Trim Crown Moulding on Keep
  const crownTrim = new THREE.Mesh(
    new THREE.BoxGeometry(10.6, 0.6, 10.6),
    voxelMaterials.goldAccent
  );
  crownTrim.position.y = 4 + keepHeight;
  castle.add(crownTrim);

  // Glowing Arched Windows on the Keep facades
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xffecb3,
    emissive: level > 40 ? 0x00e5ff : 0xffb300,
    emissiveIntensity: 1.3,
    roughness: 0.1,
  });
  const winGeo = new THREE.BoxGeometry(0.9, 2.2, 0.2);
  const windowRows = Math.max(1, Math.min(3, Math.floor(keepHeight / 6)));
  for (let r = 0; r < windowRows; r++) {
    const wy = 7 + r * 4.5;
    [-2.4, 2.4].forEach((wx) => {
      const winFront = new THREE.Mesh(winGeo, windowMat);
      winFront.position.set(wx, wy, 5.05);
      castle.add(winFront);

      const winBack = new THREE.Mesh(winGeo, windowMat);
      winBack.position.set(wx, wy, -5.05);
      castle.add(winBack);
    });
  }

  // 4 Corner Watchtowers with Machicolations, Conical Roofs & Golden Finials
  const towerHeight = keepHeight + 4;
  const towerGeo = new THREE.BoxGeometry(3.6, towerHeight, 3.6);
  const collarGeo = new THREE.BoxGeometry(4.1, 0.7, 4.1);
  const roofGeo = new THREE.ConeGeometry(2.8, 4.0, 8);
  const finialGeo = new THREE.OctahedronGeometry(0.35);

  const towerOffsets = [
    [-7, -7],
    [7, -7],
    [-7, 7],
    [7, 7],
  ];

  towerOffsets.forEach(([ox, oz]) => {
    const tower = new THREE.Mesh(towerGeo, voxelMaterials.stone);
    tower.position.set(ox, towerHeight / 2, oz);
    tower.castShadow = true;
    tower.receiveShadow = true;
    castle.add(tower);

    const collar = new THREE.Mesh(collarGeo, voxelMaterials.stoneDark);
    collar.position.set(ox, towerHeight, oz);
    castle.add(collar);

    const roof = new THREE.Mesh(roofGeo, voxelMaterials.leavesAutumn);
    roof.position.set(ox, towerHeight + 2.0, oz);
    roof.castShadow = true;
    castle.add(roof);

    const finial = new THREE.Mesh(finialGeo, voxelMaterials.goldAccent);
    finial.position.set(ox, towerHeight + 4.15, oz);
    castle.add(finial);
  });

  // Grand Gatehouse Entrance + Iron Portcullis Grate + Twin Braziers
  const gateFrame = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 5.8, 2.4),
    voxelMaterials.stone
  );
  gateFrame.position.set(0, 2.9, 8.0);
  gateFrame.castShadow = true;
  castle.add(gateFrame);

  const gateGeo = new THREE.BoxGeometry(3.8, 4.8, 2.6);
  const gateMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.85 });
  const gate = new THREE.Mesh(gateGeo, gateMat);
  gate.position.set(0, 2.4, 8.05);
  castle.add(gate);

  // Portcullis Iron Bars
  const barGeo = new THREE.CylinderGeometry(0.06, 0.06, 4.6, 6);
  for (let bx = -1.4; bx <= 1.4; bx += 0.7) {
    const bar = new THREE.Mesh(barGeo, voxelMaterials.steelOre);
    bar.position.set(bx, 2.4, 9.4);
    castle.add(bar);
  }

  // Twin Gatehouse Flaming Braziers
  [-2.6, 2.6].forEach((bx) => {
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 1.4, 8),
      voxelMaterials.stoneDark
    );
    pedestal.position.set(bx, 0.7, 9.8);
    castle.add(pedestal);

    const flame = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.42, 1),
      voxelMaterials.lanternGlow
    );
    flame.position.set(bx, 1.65, 9.8);
    castle.add(flame);
  });

  // Glowing Runic Spire at the top (Power Level Indicator) + Orbital Rings
  const spireColor = level > 80 ? 0xff00ff : level > 40 ? 0x00e5ff : 0xffd700;
  const spireEmissive = level > 80 ? 0xd500f9 : level > 40 ? 0x00b0ff : 0xffab00;
  const spireMat = new THREE.MeshPhysicalMaterial({
    color: spireColor,
    emissive: spireEmissive,
    emissiveIntensity: 1.4,
    roughness: 0.08,
    metalness: 0.85,
    clearcoat: 1.0,
  });
  const spireRadius = 1.8 + Math.min(2, level * 0.02);
  const spireGeo = new THREE.OctahedronGeometry(spireRadius, 1);
  const spire = new THREE.Mesh(spireGeo, spireMat);
  spire.position.y = 4 + keepHeight + 3.2;
  spire.name = 'CastleSpire';

  // Celestial Orbital Rings around the Castle Spire
  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(spireRadius * 1.45, 0.08, 10, 32),
    voxelMaterials.goldAccent
  );
  outerRing.rotation.x = Math.PI / 3;
  outerRing.name = 'CastleSpireRingOuter';
  spire.add(outerRing);

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(spireRadius * 1.18, 0.06, 8, 28),
    voxelMaterials.diamondOre
  );
  innerRing.rotation.y = Math.PI / 4;
  innerRing.name = 'CastleSpireRingInner';
  spire.add(innerRing);

  castle.add(spire);

  // Royal Castle Banner Flag
  const flagPoleGeo = new THREE.CylinderGeometry(0.1, 0.12, 5.5, 8);
  const flagPole = new THREE.Mesh(flagPoleGeo, voxelMaterials.steelOre);
  flagPole.position.set(0, 4 + keepHeight + 4.2, 0);
  castle.add(flagPole);

  const flagClothGeo = new THREE.BoxGeometry(2.4, 1.45, 0.1);
  const flagClothMat = new THREE.MeshStandardMaterial({
    color: 0xd32f2f,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.25,
    roughness: 0.55,
  });
  const flagCloth = new THREE.Mesh(flagClothGeo, flagClothMat);
  flagCloth.position.set(1.2, 4 + keepHeight + 5.6, 0);
  castle.add(flagCloth);

  return castle;
}

/**
 * Procedural Multi-part Resource Node Mesh (Level 1 - 10)
 */
export function createResourceNodeMesh(node: ResourceNode): THREE.Group {
  const group = new THREE.Group();
  group.name = `ResourceNode_${node.type}_${node.level}`;
  group.position.set(node.x, 0, node.z);

  const scaleFactor = 0.8 + node.level * 0.08;
  group.add(createSoftContactShadow(2.2 * scaleFactor, 0.5));

  if (node.type === 'wood') {
    // Ancient Multi-tier Voxel Tree with roots, branches & fallen log
    const trunkGeo = new THREE.BoxGeometry(
      1.2 * scaleFactor,
      4.6 * scaleFactor,
      1.2 * scaleFactor
    );
    const trunk = new THREE.Mesh(trunkGeo, voxelMaterials.woodTrunk);
    trunk.position.y = 2.3 * scaleFactor;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    const foliageSizes = [3.6, 2.8, 2.0, 1.2];
    foliageSizes.forEach((sz, idx) => {
      const leavesGeo = new THREE.BoxGeometry(
        sz * scaleFactor,
        1.45 * scaleFactor,
        sz * scaleFactor
      );
      const mat = idx % 2 === 0 ? voxelMaterials.leaves : voxelMaterials.leavesLight;
      const leaves = new THREE.Mesh(leavesGeo, mat);
      leaves.position.y = (3.8 + idx * 1.15) * scaleFactor;
      leaves.rotation.y = (idx * Math.PI) / 8;
      leaves.castShadow = true;
      leaves.receiveShadow = true;
      group.add(leaves);
    });

    // Fallen timber log & sawbuck stack
    const logGeo = new THREE.CylinderGeometry(
      0.42 * scaleFactor,
      0.42 * scaleFactor,
      2.6 * scaleFactor,
      8
    );
    logGeo.rotateZ(Math.PI / 2);
    const log = new THREE.Mesh(logGeo, voxelMaterials.woodTrunk);
    log.position.set(1.55, 0.42 * scaleFactor, 1.0);
    log.rotation.y = 0.4;
    log.castShadow = true;
    group.add(log);
  } else if (node.type === 'steel' || node.type === 'copper' || node.type === 'diamond') {
    // Mineral Rock Outcrop with faceted crystal veins & mining lantern
    const rockMat = voxelMaterials.stoneDark;
    const oreMat =
      node.type === 'steel'
        ? voxelMaterials.steelOre
        : node.type === 'copper'
        ? voxelMaterials.copperOre
        : voxelMaterials.diamondOre;

    const baseRockGeo = new THREE.DodecahedronGeometry(1.85 * scaleFactor, 0);
    const baseRock = new THREE.Mesh(baseRockGeo, rockMat);
    baseRock.position.y = 1.15 * scaleFactor;
    baseRock.castShadow = true;
    baseRock.receiveShadow = true;
    group.add(baseRock);

    // 6 Protruding Crystal / Ore Spires
    const oreGeo = new THREE.OctahedronGeometry(0.68 * scaleFactor, 0);
    for (let i = 0; i < 6; i++) {
      const ore = new THREE.Mesh(oreGeo, oreMat);
      const angle = (i * Math.PI) / 3;
      ore.position.set(
        Math.cos(angle) * 1.18 * scaleFactor,
        (1.0 + (i % 3) * 0.42) * scaleFactor,
        Math.sin(angle) * 1.18 * scaleFactor
      );
      ore.scale.set(0.85, 1.55, 0.85);
      ore.rotation.set(0.35 * i, angle, 0.25);
      ore.castShadow = true;
      group.add(ore);
    }
  } else if (node.type === 'grain') {
    // Voxel Farm Plot with golden wheat rows & rotating windmill tower
    const plotGeo = new THREE.BoxGeometry(3.8 * scaleFactor, 0.4, 3.8 * scaleFactor);
    const plot = new THREE.Mesh(plotGeo, voxelMaterials.dirt);
    plot.position.y = 0.2;
    plot.receiveShadow = true;
    group.add(plot);

    // Wheat stalks
    const wheatGeo = new THREE.BoxGeometry(
      0.62 * scaleFactor,
      1.45 * scaleFactor,
      0.62 * scaleFactor
    );
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const wheat = new THREE.Mesh(wheatGeo, voxelMaterials.grainGold);
        wheat.position.set(i * 1.05 * scaleFactor, 0.9 * scaleFactor, j * 1.05 * scaleFactor);
        wheat.castShadow = true;
        group.add(wheat);
      }
    }

    // Mini Windmill on corner of farm plot
    const millTower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38 * scaleFactor, 0.55 * scaleFactor, 2.6 * scaleFactor, 8),
      voxelMaterials.stone
    );
    millTower.position.set(-1.6 * scaleFactor, 1.3 * scaleFactor, -1.6 * scaleFactor);
    millTower.castShadow = true;
    group.add(millTower);

    const bladesGroup = new THREE.Group();
    bladesGroup.position.set(-1.6 * scaleFactor, 2.3 * scaleFactor, -1.15 * scaleFactor);
    bladesGroup.name = 'GrainWindmillBlades';
    const bladeA = new THREE.Mesh(
      new THREE.BoxGeometry(2.2 * scaleFactor, 0.22 * scaleFactor, 0.08),
      voxelMaterials.woodTrunk
    );
    const bladeB = new THREE.Mesh(
      new THREE.BoxGeometry(0.22 * scaleFactor, 2.2 * scaleFactor, 0.08),
      voxelMaterials.woodTrunk
    );
    bladesGroup.add(bladeA, bladeB);
    group.add(bladesGroup);
  } else {
    // Industrial Spirit Oil Derrick / Pumpjack Rig
    const frameGeo = new THREE.ConeGeometry(1.65 * scaleFactor, 4.2 * scaleFactor, 4);
    frameGeo.rotateY(Math.PI / 4);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x455a64,
      roughness: 0.45,
      metalness: 0.8,
      wireframe: true,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 2.1 * scaleFactor;
    group.add(frame);

    // Animated Pumpjack Walking Beam
    const pumpGeo = new THREE.BoxGeometry(
      2.2 * scaleFactor,
      0.55 * scaleFactor,
      0.55 * scaleFactor
    );
    const pump = new THREE.Mesh(pumpGeo, voxelMaterials.steelOre);
    pump.position.set(0, 3.6 * scaleFactor, 0);
    pump.name = 'OilPumpHead';
    pump.castShadow = true;
    group.add(pump);

    // Oil Storage Barrels
    const barrelGeo = new THREE.CylinderGeometry(
      0.42 * scaleFactor,
      0.42 * scaleFactor,
      1.05 * scaleFactor,
      12
    );
    const barrel1 = new THREE.Mesh(barrelGeo, voxelMaterials.oilDark);
    barrel1.position.set(1.5 * scaleFactor, 0.52 * scaleFactor, 0.8 * scaleFactor);
    barrel1.castShadow = true;
    const barrel2 = new THREE.Mesh(barrelGeo, voxelMaterials.oilDark);
    barrel2.position.set(0.85 * scaleFactor, 0.52 * scaleFactor, 1.45 * scaleFactor);
    barrel2.castShadow = true;
    group.add(barrel1, barrel2);
  }

  // High-DPI Retina Floating Resource Badge
  const badge = createCrispBillboardSprite(
    256,
    128,
    3.1,
    1.55,
    5.3 * scaleFactor,
    (ctx, w, h) => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
      ctx.roundRect(8, 8, w - 16, h - 16, 22);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.font = 'bold 42px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(`${node.type.toUpperCase()}`, w / 2, 56);
      ctx.font = 'bold 38px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`Lv.${node.level}`, w / 2, 102);
    }
  );
  group.add(badge);

  return group;
}

/**
 * Procedural Multi-part Monster Mesh (Level 1 - 1000)
 * Minions, Elites, Bosses, and Celestial World Titans with detailed armor plates,
 * glowing cores, spinal ridges, weapons, and sweeping boss wings.
 */
export function createMonsterMesh(monster: MonsterTarget): THREE.Group {
  const group = new THREE.Group();
  group.name = `Monster_${monster.id}`;
  group.position.set(monster.x, 0, monster.z);

  const isBoss = monster.isWorldBoss || monster.level > 500;
  const scale = isBoss ? 2.8 : monster.level > 200 ? 1.8 : 1.2;

  group.add(createSoftContactShadow(1.6 * scale, 0.58));

  const bodyColor =
    monster.level > 800
      ? 0x4a148c // Cosmic Void Purple
      : monster.level > 500
      ? 0xb71c1c // Dragon Crimson
      : monster.level > 200
      ? 0x37474f // Iron Titan
      : monster.level > 50
      ? 0x558b2f // Forest Troll
      : 0x2e7d32; // Goblin Green

  const monsterMat = new THREE.MeshPhysicalMaterial({
    color: bodyColor,
    roughness: monster.level > 200 ? 0.32 : 0.58,
    metalness: monster.level > 200 ? 0.72 : 0.22,
    clearcoat: monster.level > 200 ? 0.6 : 0.15,
  });

  const darkPlateMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.8,
  });

  // Torso
  const torsoGeo = new THREE.BoxGeometry(1.6 * scale, 2.0 * scale, 1.2 * scale);
  const torso = new THREE.Mesh(torsoGeo, monsterMat);
  torso.position.y = 2.0 * scale;
  torso.castShadow = true;
  torso.receiveShadow = true;
  group.add(torso);

  // Glowing Abyssal Chest Core
  const coreColor = isBoss ? 0xff1744 : monster.level > 200 ? 0x00e5ff : 0xf59e0b;
  const chestCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.38 * scale, 0),
    new THREE.MeshStandardMaterial({
      color: coreColor,
      emissive: coreColor,
      emissiveIntensity: 1.5,
      roughness: 0.1,
    })
  );
  chestCore.position.set(0, 2.15 * scale, 0.58 * scale);
  group.add(chestCore);

  // Armored Shoulder Pauldrons
  const pauldronGeo = new THREE.BoxGeometry(0.75 * scale, 0.65 * scale, 0.85 * scale);
  const pauldronL = new THREE.Mesh(pauldronGeo, darkPlateMat);
  pauldronL.position.set(-1.15 * scale, 2.85 * scale, 0);
  pauldronL.rotation.z = 0.2;
  const pauldronR = new THREE.Mesh(pauldronGeo, darkPlateMat);
  pauldronR.position.set(1.15 * scale, 2.85 * scale, 0);
  pauldronR.rotation.z = -0.2;
  group.add(pauldronL, pauldronR);

  // Head with Fierce Brow & Glowing Eyes
  const headGeo = new THREE.BoxGeometry(1.2 * scale, 1.2 * scale, 1.2 * scale);
  const head = new THREE.Mesh(headGeo, monsterMat);
  head.position.y = 3.6 * scale;
  head.castShadow = true;
  group.add(head);

  const eyeColor = monster.level > 500 ? 0xff1744 : 0xffeb3b;
  const eyeMat = new THREE.MeshStandardMaterial({
    color: eyeColor,
    emissive: eyeColor,
    emissiveIntensity: 1.8,
  });
  const eyeGeo = new THREE.BoxGeometry(0.26 * scale, 0.22 * scale, 0.2 * scale);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.35 * scale, 3.7 * scale, 0.62 * scale);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.35 * scale, 3.7 * scale, 0.62 * scale);
  group.add(leftEye, rightEye);

  // Arms and Weapon/Claws
  const armGeo = new THREE.BoxGeometry(0.6 * scale, 1.8 * scale, 0.6 * scale);
  const leftArm = new THREE.Mesh(armGeo, monsterMat);
  leftArm.position.set(-1.2 * scale, 2.0 * scale, 0);
  leftArm.castShadow = true;
  const rightArm = new THREE.Mesh(armGeo, monsterMat);
  rightArm.position.set(1.2 * scale, 2.0 * scale, 0);
  rightArm.castShadow = true;
  group.add(leftArm, rightArm);

  // Monster Cleaver / War Club in right hand
  const clubBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.28 * scale, 1.65 * scale, 0.55 * scale),
    darkPlateMat
  );
  clubBlade.position.set(1.25 * scale, 1.35 * scale, 0.65 * scale);
  clubBlade.rotation.x = Math.PI / 3;
  clubBlade.castShadow = true;
  group.add(clubBlade);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.6 * scale, 1.4 * scale, 0.6 * scale);
  const leftLeg = new THREE.Mesh(legGeo, monsterMat);
  leftLeg.position.set(-0.45 * scale, 0.7 * scale, 0);
  leftLeg.castShadow = true;
  const rightLeg = new THREE.Mesh(legGeo, monsterMat);
  rightLeg.position.set(0.45 * scale, 0.7 * scale, 0);
  rightLeg.castShadow = true;
  group.add(leftLeg, rightLeg);

  // World Boss / Elite Horns, Sweeping Wings & Orbital Crystals
  if (isBoss) {
    const hornGeo = new THREE.ConeGeometry(0.32 * scale, 1.55 * scale, 6);
    const hornMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.25,
      metalness: 0.8,
    });
    const hornL = new THREE.Mesh(hornGeo, hornMat);
    hornL.position.set(-0.62 * scale, 4.65 * scale, 0);
    hornL.rotation.z = 0.42;
    const hornR = new THREE.Mesh(hornGeo, hornMat);
    hornR.position.set(0.62 * scale, 4.65 * scale, 0);
    hornR.rotation.z = -0.42;
    group.add(hornL, hornR);

    // Sweeping Sovereign Wings
    const wingMat = new THREE.MeshPhysicalMaterial({
      color: monster.level > 800 ? 0x7e22ce : 0x991b1b,
      emissive: monster.level > 800 ? 0x581c87 : 0x7f1d1d,
      emissiveIntensity: 0.45,
      roughness: 0.35,
      metalness: 0.5,
      clearcoat: 0.6,
    });
    const wingGeo = new THREE.BoxGeometry(2.2 * scale, 1.6 * scale, 0.16 * scale);
    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(-1.65 * scale, 2.75 * scale, -0.68 * scale);
    wingL.rotation.set(0.15, 0.35, 0.28);
    wingL.castShadow = true;
    const wingR = new THREE.Mesh(wingGeo, wingMat);
    wingR.position.set(1.65 * scale, 2.75 * scale, -0.68 * scale);
    wingR.rotation.set(0.15, -0.35, -0.28);
    wingR.castShadow = true;
    group.add(wingL, wingR);

    // Floating Orbital Crystals
    const crystalGeo = new THREE.OctahedronGeometry(0.42 * scale, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      emissive: 0xff0055,
      emissiveIntensity: 1.6,
      roughness: 0.1,
    });
    for (let c = 0; c < 3; c++) {
      const cr = new THREE.Mesh(crystalGeo, crystalMat);
      const ang = (c * Math.PI * 2) / 3;
      cr.position.set(
        Math.cos(ang) * 2.25 * scale,
        3.2 * scale,
        Math.sin(ang) * 2.25 * scale
      );
      cr.name = `OrbitalCrystal_${c}`;
      group.add(cr);
    }
  }

  // Ground Attack Telegraph Ring (visual windup warning on terrain)
  const ringRadius = isBoss ? 4.2 : monster.level > 200 ? 3.0 : 2.2;
  const telegraphGeo = new THREE.RingGeometry(ringRadius * 0.78, ringRadius, 32);
  telegraphGeo.rotateX(-Math.PI / 2);
  const telegraphMat = new THREE.MeshBasicMaterial({
    color: isBoss ? 0xff1744 : 0xff9100,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  const telegraphRing = new THREE.Mesh(telegraphGeo, telegraphMat);
  telegraphRing.position.y = 0.08;
  telegraphRing.name = 'MonsterTelegraphRing';
  group.add(telegraphRing);

  // High-DPI Retina Overhead Nameplate
  const sprite = createCrispBillboardSprite(
    384,
    152,
    4.6,
    1.85,
    5.25 * scale,
    (ctx, w, h) => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
      ctx.roundRect(8, 8, w - 16, h - 16, 20);
      ctx.fill();
      ctx.strokeStyle = isBoss ? '#f43f5e' : '#eab308';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.font = 'bold 34px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(`${monster.name.slice(0, 18)}`, w / 2, 48);
      ctx.font = 'bold 34px monospace';
      ctx.fillStyle = isBoss ? '#fb7185' : '#fde047';
      ctx.fillText(
        `Lv.${monster.level} [${(monster.aiState || 'patrol').split('_')[0].toUpperCase()}]`,
        w / 2,
        96
      );
      ctx.font = 'bold 26px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(
        `${(monster.movementPolicy || 'pack_swarmer').replace('_', ' ')}`,
        w / 2,
        130
      );
    }
  );
  group.add(sprite);

  return group;
}

/**
 * Procedural Multi-part Autonomous NPC Mesh (6 Specialized Roles:
 * Elder, Blacksmith, Marshal, Guard, Merchant, Mystic)
 */
export function createNPCMesh(npc: NPC): THREE.Group {
  const npcModel = new THREE.Group();
  npcModel.position.set(npc.x, 0, npc.z);
  npcModel.name = `NPC_${npc.id}`;

  const roleColors: Record<string, number> = {
    elder: 0x6a1b9a,
    blacksmith: 0xd84315,
    marshal: 0x1565c0,
    guard: 0x00838f,
    merchant: 0xf59e0b,
    mystic: 0x10b981,
  };
  const roleColor = roleColors[npc.role] || 0x1565c0;
  const isArmored = npc.role === 'guard' || npc.role === 'marshal';

  npcModel.add(createSoftContactShadow(1.35, 0.52));

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: roleColor,
    roughness: isArmored ? 0.25 : 0.55,
    metalness: isArmored ? 0.82 : 0.2,
    clearcoat: isArmored ? 0.65 : 0.15,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xffdbac,
    roughness: 0.65,
  });

  // Legs / Robe Hem
  const legGeo = new THREE.BoxGeometry(0.38, 0.85, 0.38);
  const legL = new THREE.Mesh(legGeo, bodyMat);
  legL.position.set(-0.24, 0.42, 0);
  legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, bodyMat);
  legR.position.set(0.24, 0.42, 0);
  legR.castShadow = true;
  npcModel.add(legL, legR);

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.25, 0.65), bodyMat);
  torso.position.y = 1.4;
  torso.castShadow = true;
  torso.receiveShadow = true;
  npcModel.add(torso);

  // Gold Waist Sash / Belt
  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.18, 0.7),
    voxelMaterials.goldAccent
  );
  belt.position.y = 0.95;
  npcModel.add(belt);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.32, 0.95, 0.32);
  const armL = new THREE.Mesh(armGeo, bodyMat);
  armL.position.set(-0.66, 1.4, 0);
  armL.castShadow = true;
  const armR = new THREE.Mesh(armGeo, bodyMat);
  armR.position.set(0.66, 1.4, 0);
  armR.castShadow = true;
  npcModel.add(armL, armR);

  // Head & Eyes
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.78, 0.78), skinMat);
  head.position.y = 2.42;
  head.castShadow = true;
  npcModel.add(head);

  const eyeMat = new THREE.MeshStandardMaterial({
    color: npc.role === 'mystic' || npc.role === 'elder' ? 0x38bdf8 : 0x1e293b,
    emissive: npc.role === 'mystic' ? 0x10b981 : 0x000000,
    emissiveIntensity: npc.role === 'mystic' ? 1.2 : 0,
  });
  const eyeGeo = new THREE.BoxGeometry(0.12, 0.12, 0.08);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.18, 2.46, 0.4);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.18, 2.46, 0.4);
  npcModel.add(eyeL, eyeR);

  // Role-Specific Iconic Silhouette Gear & Props
  if (npc.role === 'elder') {
    // Long White Immortal Beard, Daoist Crown & Dragon Staff with Floating Jade Orb
    const beard = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.75, 4),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc })
    );
    beard.rotation.x = Math.PI;
    beard.position.set(0, 1.92, 0.38);
    npcModel.add(beard);

    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.28, 0.35, 8),
      voxelMaterials.goldAccent
    );
    crown.position.set(0, 2.95, 0);
    npcModel.add(crown);

    const staff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6),
      voxelMaterials.woodTrunk
    );
    staff.position.set(0.75, 1.3, 0.25);
    npcModel.add(staff);

    const staffOrb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 1),
      voxelMaterials.diamondOre
    );
    staffOrb.position.set(0.75, 2.75, 0.25);
    npcModel.add(staffOrb);
  } else if (npc.role === 'blacksmith') {
    // Forgemaster Hammer & Glowing Magma Pauldrons
    const hammerShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6),
      voxelMaterials.woodTrunk
    );
    hammerShaft.position.set(0.75, 1.35, 0.28);
    npcModel.add(hammerShaft);

    const hammerHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.35, 0.72),
      voxelMaterials.steelOre
    );
    hammerHead.position.set(0.75, 2.0, 0.28);
    npcModel.add(hammerHead);
  } else if (npc.role === 'marshal' || npc.role === 'guard') {
    // Plumed Great-Helm, Pauldrons, Halberd & Shield
    const helm = new THREE.Mesh(
      new THREE.BoxGeometry(0.84, 0.38, 0.84),
      voxelMaterials.steelOre
    );
    helm.position.set(0, 2.85, 0);
    npcModel.add(helm);

    const plume = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.45, 0.65),
      new THREE.MeshStandardMaterial({
        color: npc.role === 'marshal' ? 0xfbbf24 : 0x06b6d4,
      })
    );
    plume.position.set(0, 3.15, -0.05);
    npcModel.add(plume);

    const halberdShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 2.7, 6),
      voxelMaterials.woodTrunk
    );
    halberdShaft.position.set(0.78, 1.35, 0.2);
    npcModel.add(halberdShaft);

    const halberdBlade = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.65, 4),
      voxelMaterials.goldAccent
    );
    halberdBlade.position.set(0.78, 2.8, 0.2);
    npcModel.add(halberdBlade);
  } else if (npc.role === 'merchant') {
    // Treasure Backpack & Golden Coin Lantern
    const pack = new THREE.Mesh(
      new THREE.BoxGeometry(0.88, 1.15, 0.65),
      voxelMaterials.woodTrunk
    );
    pack.position.set(0, 1.55, -0.58);
    pack.castShadow = true;
    npcModel.add(pack);

    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.65, 0.25, 8),
      voxelMaterials.goldAccent
    );
    hat.position.set(0, 2.85, 0);
    npcModel.add(hat);
  } else if (npc.role === 'mystic') {
    // Floating Astrolabe Ring & Jade Spirit Orbs
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.04, 8, 24),
      voxelMaterials.diamondOre
    );
    ring.position.set(0, 1.85, -0.35);
    npcModel.add(ring);
  }

  // Role Aura Ring on Ground
  const auraGeo = new THREE.RingGeometry(0.92, 1.28, 28);
  auraGeo.rotateX(-Math.PI / 2);
  const auraMat = new THREE.MeshBasicMaterial({
    color: roleColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const auraMesh = new THREE.Mesh(auraGeo, auraMat);
  auraMesh.position.y = 0.06;
  npcModel.add(auraMesh);

  // High-DPI Retina NPC Overhead Billboard
  const spr = createCrispBillboardSprite(384, 144, 3.85, 1.45, 3.85, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.roundRect(8, 8, w - 16, h - 16, 20);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.font = 'bold 34px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${npc.name}`, w / 2, 54);
    ctx.font = 'bold 30px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`Lv.${npc.level} ${npc.role.toUpperCase()}`, w / 2, 106);
  });
  npcModel.add(spr);

  return npcModel;
}

/**
 * Procedural Multi-part Player Avatar with Cultivation Aura Visual Cues (No Overhead Level Numbers)
 * - Qi Refinement (0): No aura
 * - Foundation (1): Faint white glow
 * - Golden Core (2): Spinning Golden Core behind back & inside translucent chest dantian
 * - Nascent Soul (3..20): Floating astral "baby" avatar above head
 * - Dao Creator (21..22): Divine Rings (Halos) behind back = # of Great Dao rules mastered
 */
export function createPlayerMesh(
  appearance: CharacterAppearance,
  realmIndex: number = 3,
  masteredGreatDaos: number = 3,
  isRedName: boolean = false
): THREE.Group {
  const player = new THREE.Group();
  player.name = 'PlayerAvatar';

  player.add(createSoftContactShadow(1.3, 0.55));

  const skinMat = new THREE.MeshStandardMaterial({
    color: appearance.skinColor,
    roughness: 0.65,
    metalness: 0.05,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: appearance.hairColor,
    roughness: 0.72,
  });

  const isHighTier = appearance.armorTier > 10;
  const isGodTier = appearance.armorTier >= 18;
  const isGoldenCoreRealm = realmIndex === 2;
  const armorMat = new THREE.MeshPhysicalMaterial({
    color: appearance.armorColor,
    roughness: isHighTier ? 0.18 : 0.48,
    metalness: isHighTier ? 0.88 : 0.4,
    clearcoat: isHighTier ? 0.8 : 0.25,
    clearcoatRoughness: 0.12,
    emissive: isGodTier ? 0x00e5ff : isGoldenCoreRealm ? 0xf59e0b : 0x000000,
    emissiveIntensity: isGodTier ? 0.45 : isGoldenCoreRealm ? 0.28 : 0,
    transparent: isGoldenCoreRealm,
    opacity: isGoldenCoreRealm ? 0.68 : 1.0,
  });

  // Head
  const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 2.1;
  head.castShadow = true;
  player.add(head);

  // Glowing Cultivator Eyes
  const eyeMat = new THREE.MeshStandardMaterial({
    color: isRedName ? 0xff1744 : appearance.eyeColor,
    emissive: isRedName ? 0xff1744 : appearance.eyeColor,
    emissiveIntensity: isRedName ? 1.5 : 0.85,
  });
  const eyeGeo = new THREE.BoxGeometry(0.13, 0.13, 0.08);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.2, 2.15, 0.42);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.2, 2.15, 0.42);
  player.add(eyeL, eyeR);

  // Hair & Sovereign Diadem Crown
  const hairGeo = new THREE.BoxGeometry(0.86, 0.35, 0.86);
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0, 2.5, 0);
  player.add(hair);

  const diadem = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.16, 0.12),
    voxelMaterials.goldAccent
  );
  diadem.position.set(0, 2.48, 0.44);
  player.add(diadem);

  // Torso / Chestplate + Gold Belt
  const torsoGeo = new THREE.BoxGeometry(0.9, 1.1, 0.6);
  const torso = new THREE.Mesh(torsoGeo, armorMat);
  torso.position.y = 1.25;
  torso.castShadow = true;
  player.add(torso);

  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(0.94, 0.16, 0.64),
    voxelMaterials.goldAccent
  );
  belt.position.y = 0.78;
  player.add(belt);

  // Layered Shoulder Pauldrons with Gold Trim
  const pauldronGeo = new THREE.BoxGeometry(0.38, 0.38, 0.44);
  const pauldronL = new THREE.Mesh(pauldronGeo, armorMat);
  pauldronL.position.set(-0.62, 1.72, 0);
  const pauldronR = new THREE.Mesh(pauldronGeo, armorMat);
  pauldronR.position.set(0.62, 1.72, 0);
  player.add(pauldronL, pauldronR);

  // Left & Right Arms
  const armGeo = new THREE.BoxGeometry(0.32, 0.9, 0.32);
  const armL = new THREE.Mesh(armGeo, skinMat);
  armL.position.set(-0.6, 1.2, 0);
  armL.castShadow = true;
  const armR = new THREE.Mesh(armGeo, skinMat);
  armR.position.set(0.6, 1.2, 0);
  armR.castShadow = true;
  player.add(armL, armR);

  // Weapon in Right Hand
  const weaponGroup = new THREE.Group();
  weaponGroup.position.set(0.65, 0.8, 0.2);

  if (appearance.weaponType === 'broadsword') {
    const bladeGeo = new THREE.BoxGeometry(0.13, 1.48, 0.06);
    const bladeMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.35,
      metalness: 0.95,
      roughness: 0.08,
      clearcoat: 1.0,
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 0.62;
    weaponGroup.add(blade);

    const guardGeo = new THREE.BoxGeometry(0.44, 0.1, 0.12);
    const guard = new THREE.Mesh(guardGeo, voxelMaterials.goldAccent);
    guard.position.y = 0.04;
    weaponGroup.add(guard);
  } else if (appearance.weaponType === 'crossbow') {
    const bowStockGeo = new THREE.BoxGeometry(0.15, 0.15, 0.85);
    const bowStock = new THREE.Mesh(bowStockGeo, voxelMaterials.woodTrunk);
    weaponGroup.add(bowStock);
    const bowArmsGeo = new THREE.BoxGeometry(0.95, 0.1, 0.1);
    const bowArms = new THREE.Mesh(bowArmsGeo, voxelMaterials.steelOre);
    bowArms.position.z = 0.36;
    weaponGroup.add(bowArms);
  } else if (appearance.weaponType === 'siege_mortar') {
    const cannonGeo = new THREE.CylinderGeometry(0.2, 0.25, 1.15, 10);
    const cannon = new THREE.Mesh(cannonGeo, voxelMaterials.steelOre);
    cannon.rotation.x = Math.PI / 4;
    weaponGroup.add(cannon);
  } else {
    const shaftGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.05, 8);
    const shaft = new THREE.Mesh(shaftGeo, voxelMaterials.woodTrunk);
    shaft.position.y = 0.5;
    weaponGroup.add(shaft);
    const spearGeo = new THREE.ConeGeometry(0.2, 0.65, 6);
    const spear = new THREE.Mesh(spearGeo, voxelMaterials.diamondOre);
    spear.position.y = 1.62;
    weaponGroup.add(spear);
  }
  player.add(weaponGroup);

  // Runic Shield in Left Hand
  const shieldGeo = new THREE.BoxGeometry(0.1, 0.82, 0.62);
  const shieldMat = new THREE.MeshPhysicalMaterial({
    color: 0x1565c0,
    metalness: 0.8,
    roughness: 0.2,
    clearcoat: 0.7,
  });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shield.position.set(-0.75, 1.1, 0.15);
  player.add(shield);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.36, 0.8, 0.36);
  const legL = new THREE.Mesh(legGeo, armorMat);
  legL.position.set(-0.24, 0.4, 0);
  legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, armorMat);
  legR.position.set(0.24, 0.4, 0);
  legR.castShadow = true;
  player.add(legL, legR);

  // Cape
  if (appearance.hasCape) {
    const capeGeo = new THREE.BoxGeometry(0.82, 1.32, 0.06);
    const capeMat = new THREE.MeshStandardMaterial({
      color: appearance.capeColor,
      roughness: 0.78,
    });
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.set(0, 1.1, -0.35);
    cape.rotation.x = 0.16;
    cape.castShadow = true;
    player.add(cape);
  }

  // ==========================================================================
  // CULTIVATION POWER VISUAL CUES ("THE AURA" — Replaces Overhead Level Numbers)
  // ==========================================================================
  const auraGroup = new THREE.Group();
  auraGroup.name = 'CultivationAuraGroup';

  if (realmIndex === 1) {
    const mistGeo = new THREE.SphereGeometry(1.15, 20, 20);
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    });
    const mistShell = new THREE.Mesh(mistGeo, mistMat);
    mistShell.position.y = 1.35;
    mistShell.name = 'CultivationFoundationGlow';
    auraGroup.add(mistShell);
  } else if (realmIndex === 2) {
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.6,
      metalness: 0.95,
      roughness: 0.08,
    });
    const chestCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 1), coreMat);
    chestCore.position.set(0, 1.25, 0.05);
    chestCore.name = 'CultivationChestCore';
    auraGroup.add(chestCore);

    const backCoreGroup = new THREE.Group();
    backCoreGroup.position.set(0, 1.65, -0.68);
    backCoreGroup.name = 'CultivationGoldenCore';
    const backSphere = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 1), coreMat);
    const backRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.045, 10, 28),
      new THREE.MeshBasicMaterial({ color: 0xfde047 })
    );
    backCoreGroup.add(backSphere, backRing);
    auraGroup.add(backCoreGroup);
  } else if (realmIndex >= 3 && realmIndex <= 20) {
    const babyGroup = new THREE.Group();
    babyGroup.position.set(0, 3.15, 0);
    babyGroup.name = 'CultivationNascentBaby';

    const babyMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.35,
      transparent: true,
      opacity: 0.9,
    });
    const babyBody = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.24), babyMat);
    const babyHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), babyMat);
    babyHead.position.y = 0.32;
    const babyLotus = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.05, 10, 24),
      new THREE.MeshBasicMaterial({ color: 0xfde047 })
    );
    babyLotus.rotation.x = Math.PI / 2;
    babyLotus.position.y = -0.18;

    babyGroup.add(babyBody, babyHead, babyLotus);
    auraGroup.add(babyGroup);
  } else if (realmIndex >= 21) {
    const haloGroup = new THREE.Group();
    haloGroup.position.set(0, 1.85, -0.75);
    haloGroup.name = 'CultivationDivineHalos';

    const haloCount = Math.max(1, Math.min(12, masteredGreatDaos));
    for (let h = 0; h < haloCount; h++) {
      const radius = 0.75 + h * 0.16;
      const haloGeo = new THREE.TorusGeometry(radius, 0.035, 10, 36);
      const haloMat = new THREE.MeshBasicMaterial({
        color: h % 2 === 0 ? 0xfde047 : 0xc084fc,
      });
      const haloRing = new THREE.Mesh(haloGeo, haloMat);
      haloRing.rotation.z = (h * Math.PI) / haloCount;
      haloGroup.add(haloRing);
    }
    auraGroup.add(haloGroup);
  }

  if (isRedName) {
    const redGeo = new THREE.RingGeometry(1.1, 1.45, 28);
    redGeo.rotateX(-Math.PI / 2);
    const redMat = new THREE.MeshBasicMaterial({
      color: 0xff1744,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    });
    const redRing = new THREE.Mesh(redGeo, redMat);
    redRing.position.y = 0.08;
    redRing.name = 'RedNameKarmaRing';
    auraGroup.add(redRing);
  }

  player.add(auraGroup);

  // High-DPI Retina Floating Player Name & Sect Title Banner (No Level Numbers above head!)
  const sprite = createCrispBillboardSprite(
    400,
    128,
    3.6,
    1.2,
    realmIndex >= 3 && realmIndex <= 20 ? 3.95 : 3.25,
    (ctx, w, h) => {
      ctx.fillStyle = isRedName ? 'rgba(69, 10, 10, 0.92)' : 'rgba(15, 23, 42, 0.88)';
      ctx.roundRect(8, 8, w - 16, h - 16, 20);
      ctx.fill();
      ctx.strokeStyle = isRedName ? '#ff1744' : '#38bdf8';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = isRedName ? '#fecdd3' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(`[${appearance.clanTag}] ${appearance.name}`, w / 2, 52);
      ctx.font = 'bold 30px monospace';
      ctx.fillStyle = isRedName ? '#ff1744' : '#38bdf8';
      ctx.fillText(isRedName ? '🩸 RED NAME · BOUNTY' : `${appearance.title}`, w / 2, 100);
    }
  );
  player.add(sprite);

  return player;
}
