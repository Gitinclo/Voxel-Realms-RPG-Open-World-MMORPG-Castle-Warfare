/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { CharacterAppearance, MonsterTarget, ResourceNode, ResourceType } from '../types/game';

// Shared materials and geometries for optimal draw-call efficiency
const voxelMaterials = {
  grass: new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.85, metalness: 0.1 }),
  grassDark: new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.9, metalness: 0.05 }),
  dirt: new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.95 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.7, metalness: 0.2 }),
  stoneDark: new THREE.MeshStandardMaterial({ color: 0x455a64, roughness: 0.65, metalness: 0.3 }),
  cobblestone: new THREE.MeshStandardMaterial({ color: 0x546e7a, roughness: 0.8 }),
  woodTrunk: new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 }),
  leaves: new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8 }),
  leavesAutumn: new THREE.MeshStandardMaterial({ color: 0xe65100, roughness: 0.8 }),
  water: new THREE.MeshStandardMaterial({ color: 0x1e88e5, roughness: 0.2, metalness: 0.8, transparent: true, opacity: 0.85 }),
  steelOre: new THREE.MeshStandardMaterial({ color: 0xb0bec5, roughness: 0.3, metalness: 0.85 }),
  copperOre: new THREE.MeshStandardMaterial({ color: 0xd87d4a, roughness: 0.4, metalness: 0.8 }),
  diamondOre: new THREE.MeshStandardMaterial({ color: 0x00e5ff, roughness: 0.1, metalness: 0.9, emissive: 0x00b0ff, emissiveIntensity: 0.4 }),
  goldAccent: new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.25, metalness: 0.9 }),
  grainGold: new THREE.MeshStandardMaterial({ color: 0xfbc02d, roughness: 0.9 }),
  oilDark: new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.2, metalness: 0.85 }),
};

/**
 * Creates the Voxel Open World Terrain with Biomes
 */
export function createVoxelTerrain(): THREE.Group {
  const terrainGroup = new THREE.Group();
  terrainGroup.name = 'VoxelTerrain';

  const boxGeo = new THREE.BoxGeometry(2, 2, 2);

  // Stepped elevation grid (60x60 chunks)
  const gridSize = 40;
  const step = 2;
  const half = (gridSize * step) / 2;

  // We group voxels by material into instanced meshes
  const count = gridSize * gridSize;
  const grassInstanced = new THREE.InstancedMesh(boxGeo, voxelMaterials.grass, count);
  grassInstanced.castShadow = true;
  grassInstanced.receiveShadow = true;

  const stoneInstanced = new THREE.InstancedMesh(boxGeo, voxelMaterials.stone, Math.floor(count * 0.4));
  stoneInstanced.castShadow = true;
  stoneInstanced.receiveShadow = true;

  const mat4 = new THREE.Matrix4();
  let gIdx = 0;
  let sIdx = 0;

  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      const worldX = (x * step) - half;
      const worldZ = (z * step) - half;

      // Distance from center
      const distFromCenter = Math.sqrt(worldX * worldX + worldZ * worldZ);

      // Noise-like elevation calculation
      const elevation = Math.floor(
        Math.sin(worldX * 0.08) * 1.5 +
        Math.cos(worldZ * 0.08) * 1.5 +
        (distFromCenter > 28 ? (distFromCenter - 28) * 0.15 : 0)
      );

      const heightY = elevation * 2;

      // Place top grass block
      mat4.setPosition(worldX, heightY - 1, worldZ);
      grassInstanced.setMatrixAt(gIdx++, mat4);

      // If elevated, place stone blocks underneath
      if (elevation > 0 && sIdx < stoneInstanced.count) {
        mat4.setPosition(worldX, heightY - 3, worldZ);
        stoneInstanced.setMatrixAt(sIdx++, mat4);
      }
    }
  }

  grassInstanced.instanceMatrix.needsUpdate = true;
  stoneInstanced.instanceMatrix.needsUpdate = true;

  terrainGroup.add(grassInstanced);
  terrainGroup.add(stoneInstanced);

  // Water plane in the valley
  const waterGeo = new THREE.PlaneGeometry(120, 120);
  const waterMesh = new THREE.Mesh(waterGeo, voxelMaterials.water);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = -2.1;
  waterMesh.receiveShadow = true;
  terrainGroup.add(waterMesh);

  return terrainGroup;
}

/**
 * Procedural Multi-part Castle Structure (Castle Level 0 - 100)
 * 3-12 part composite model: Keep, 4 corner towers, battlements, gatehouse, flag banners, glowing runic spire
 */
export function createVoxelCastle(level: number): THREE.Group {
  const castle = new THREE.Group();
  castle.name = 'PlayerCastle';

  // Base stone foundation
  const baseGeo = new THREE.BoxGeometry(16, 4, 16);
  const baseMesh = new THREE.Mesh(baseGeo, voxelMaterials.stoneDark);
  baseMesh.position.y = 2;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  castle.add(baseMesh);

  // Central Keep (scales with castle level)
  const keepHeight = 8 + Math.min(24, Math.floor(level * 0.24));
  const keepGeo = new THREE.BoxGeometry(10, keepHeight, 10);
  const keepMesh = new THREE.Mesh(keepGeo, voxelMaterials.cobblestone);
  keepMesh.position.y = 4 + keepHeight / 2;
  keepMesh.castShadow = true;
  castle.add(keepMesh);

  // 4 Corner Towers
  const towerHeight = keepHeight + 4;
  const towerGeo = new THREE.BoxGeometry(3.5, towerHeight, 3.5);
  const roofGeo = new THREE.ConeGeometry(2.5, 3.5, 4);
  roofGeo.rotateY(Math.PI / 4);

  const towerOffsets = [
    [-7, -7],
    [7, -7],
    [-7, 7],
    [7, 7]
  ];

  towerOffsets.forEach(([ox, oz]) => {
    const tower = new THREE.Mesh(towerGeo, voxelMaterials.stone);
    tower.position.set(ox, towerHeight / 2, oz);
    tower.castShadow = true;
    castle.add(tower);

    const roof = new THREE.Mesh(roofGeo, voxelMaterials.leavesAutumn);
    roof.position.set(ox, towerHeight + 1.75, oz);
    roof.castShadow = true;
    castle.add(roof);
  });

  // Gatehouse entrance
  const gateGeo = new THREE.BoxGeometry(4, 5, 2);
  const gateMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
  const gate = new THREE.Mesh(gateGeo, gateMat);
  gate.position.set(0, 2.5, 8.1);
  castle.add(gate);

  // Glowing Runic Spire at the top (power level indicator)
  const spireMat = new THREE.MeshStandardMaterial({
    color: level > 80 ? 0xff00ff : level > 40 ? 0x00e5ff : 0xffd700,
    emissive: level > 80 ? 0xd500f9 : level > 40 ? 0x00b0ff : 0xffab00,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.8
  });
  const spireGeo = new THREE.OctahedronGeometry(1.8 + Math.min(2, level * 0.02));
  const spire = new THREE.Mesh(spireGeo, spireMat);
  spire.position.y = 4 + keepHeight + 3;
  spire.name = 'CastleSpire';
  castle.add(spire);

  // Castle banner flag
  const flagPoleGeo = new THREE.CylinderGeometry(0.1, 0.1, 5, 6);
  const flagPole = new THREE.Mesh(flagPoleGeo, voxelMaterials.steelOre);
  flagPole.position.set(0, 4 + keepHeight + 4, 0);
  castle.add(flagPole);

  const flagClothGeo = new THREE.BoxGeometry(2.2, 1.4, 0.1);
  const flagClothMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.6 });
  const flagCloth = new THREE.Mesh(flagClothGeo, flagClothMat);
  flagCloth.position.set(1.1, 4 + keepHeight + 5.2, 0);
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

  if (node.type === 'wood') {
    // Pine/Oak multi-tier voxel tree with fallen log
    const trunkGeo = new THREE.BoxGeometry(1.2 * scaleFactor, 4.5 * scaleFactor, 1.2 * scaleFactor);
    const trunk = new THREE.Mesh(trunkGeo, voxelMaterials.woodTrunk);
    trunk.position.y = 2.25 * scaleFactor;
    trunk.castShadow = true;
    group.add(trunk);

    const foliageSizes = [3.5, 2.7, 1.8];
    foliageSizes.forEach((sz, idx) => {
      const leavesGeo = new THREE.BoxGeometry(sz * scaleFactor, 1.6 * scaleFactor, sz * scaleFactor);
      const leaves = new THREE.Mesh(leavesGeo, voxelMaterials.leaves);
      leaves.position.y = (4.0 + idx * 1.3) * scaleFactor;
      leaves.castShadow = true;
      group.add(leaves);
    });

    // Fallen wood log
    const logGeo = new THREE.BoxGeometry(2.5 * scaleFactor, 0.8 * scaleFactor, 0.8 * scaleFactor);
    const log = new THREE.Mesh(logGeo, voxelMaterials.woodTrunk);
    log.position.set(1.5, 0.4, 1.0);
    log.rotation.y = 0.4;
    group.add(log);

  } else if (node.type === 'steel' || node.type === 'copper' || node.type === 'diamond') {
    // Mineral rock outcrop with protruding crystal/ore cubes
    const rockMat = voxelMaterials.stoneDark;
    const oreMat =
      node.type === 'steel'
        ? voxelMaterials.steelOre
        : node.type === 'copper'
        ? voxelMaterials.copperOre
        : voxelMaterials.diamondOre;

    const baseRockGeo = new THREE.DodecahedronGeometry(1.8 * scaleFactor);
    const baseRock = new THREE.Mesh(baseRockGeo, rockMat);
    baseRock.position.y = 1.2 * scaleFactor;
    baseRock.castShadow = true;
    group.add(baseRock);

    // 4 ore crystals protruding
    const oreGeo = new THREE.BoxGeometry(0.8 * scaleFactor, 1.2 * scaleFactor, 0.8 * scaleFactor);
    for (let i = 0; i < 4; i++) {
      const ore = new THREE.Mesh(oreGeo, oreMat);
      const angle = (i * Math.PI) / 2;
      ore.position.set(Math.cos(angle) * 1.1 * scaleFactor, (1.2 + (i % 2) * 0.4) * scaleFactor, Math.sin(angle) * 1.1 * scaleFactor);
      ore.rotation.set(0.3 * i, angle, 0.2);
      ore.castShadow = true;
      group.add(ore);
    }
  } else if (node.type === 'grain') {
    // Voxel farm plot with golden wheat bales and mini windmill
    const plotGeo = new THREE.BoxGeometry(3.5 * scaleFactor, 0.4, 3.5 * scaleFactor);
    const plot = new THREE.Mesh(plotGeo, voxelMaterials.dirt);
    plot.position.y = 0.2;
    group.add(plot);

    // Wheat stalks
    const wheatGeo = new THREE.BoxGeometry(0.7 * scaleFactor, 1.4 * scaleFactor, 0.7 * scaleFactor);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const wheat = new THREE.Mesh(wheatGeo, voxelMaterials.grainGold);
        wheat.position.set(i * 1.0 * scaleFactor, 0.9 * scaleFactor, j * 1.0 * scaleFactor);
        wheat.castShadow = true;
        group.add(wheat);
      }
    }
  } else {
    // Oil Derrick / Well
    const frameGeo = new THREE.ConeGeometry(1.6 * scaleFactor, 4.0 * scaleFactor, 4);
    frameGeo.rotateY(Math.PI / 4);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.6, metalness: 0.7, wireframe: true });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 2.0 * scaleFactor;
    group.add(frame);

    // Pump jack head
    const pumpGeo = new THREE.BoxGeometry(2.0 * scaleFactor, 0.6 * scaleFactor, 0.6 * scaleFactor);
    const pump = new THREE.Mesh(pumpGeo, voxelMaterials.steelOre);
    pump.position.set(0, 3.6 * scaleFactor, 0);
    group.add(pump);

    // Oil barrels
    const barrelGeo = new THREE.CylinderGeometry(0.4 * scaleFactor, 0.4 * scaleFactor, 1.0 * scaleFactor, 8);
    const barrel = new THREE.Mesh(barrelGeo, voxelMaterials.oilDark);
    barrel.position.set(1.5 * scaleFactor, 0.5 * scaleFactor, 0.8 * scaleFactor);
    group.add(barrel);
  }

  // Level floating badge billboard
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect(4, 4, 120, 56, 12);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${node.type.toUpperCase()}`, 64, 28);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`Lv.${node.level}`, 64, 52);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const badgeMat = new THREE.SpriteMaterial({ map: texture });
  const badge = new THREE.Sprite(badgeMat);
  badge.scale.set(3, 1.5, 1);
  badge.position.y = 5.2 * scaleFactor;
  group.add(badge);

  return group;
}

/**
 * Procedural Multi-part Monster Mesh (Level 1 - 1000)
 * Minions, Elites, Bosses, and Celestial World Titans
 */
export function createMonsterMesh(monster: MonsterTarget): THREE.Group {
  const group = new THREE.Group();
  group.name = `Monster_${monster.id}`;
  group.position.set(monster.x, 0, monster.z);

  const isBoss = monster.isWorldBoss || monster.level > 500;
  const scale = isBoss ? 2.8 : monster.level > 200 ? 1.8 : 1.2;

  // Base Monster Material based on level
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

  const monsterMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.6,
    metalness: monster.level > 200 ? 0.6 : 0.2
  });

  // Torso
  const torsoGeo = new THREE.BoxGeometry(1.6 * scale, 2.0 * scale, 1.2 * scale);
  const torso = new THREE.Mesh(torsoGeo, monsterMat);
  torso.position.y = 2.0 * scale;
  torso.castShadow = true;
  group.add(torso);

  // Head with glowing eyes
  const headGeo = new THREE.BoxGeometry(1.2 * scale, 1.2 * scale, 1.2 * scale);
  const head = new THREE.Mesh(headGeo, monsterMat);
  head.position.y = 3.6 * scale;
  head.castShadow = true;
  group.add(head);

  // Glowing eyes
  const eyeColor = monster.level > 500 ? 0xff1744 : 0xffeb3b;
  const eyeMat = new THREE.MeshStandardMaterial({ color: eyeColor, emissive: eyeColor, emissiveIntensity: 0.9 });
  const eyeGeo = new THREE.BoxGeometry(0.25 * scale, 0.25 * scale, 0.2 * scale);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.35 * scale, 3.7 * scale, 0.62 * scale);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.35 * scale, 3.7 * scale, 0.62 * scale);
  group.add(leftEye);
  group.add(rightEye);

  // Arms and Claws
  const armGeo = new THREE.BoxGeometry(0.6 * scale, 1.8 * scale, 0.6 * scale);
  const leftArm = new THREE.Mesh(armGeo, monsterMat);
  leftArm.position.set(-1.2 * scale, 2.0 * scale, 0);
  leftArm.castShadow = true;
  const rightArm = new THREE.Mesh(armGeo, monsterMat);
  rightArm.position.set(1.2 * scale, 2.0 * scale, 0);
  rightArm.castShadow = true;
  group.add(leftArm);
  group.add(rightArm);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.6 * scale, 1.4 * scale, 0.6 * scale);
  const leftLeg = new THREE.Mesh(legGeo, monsterMat);
  leftLeg.position.set(-0.45 * scale, 0.7 * scale, 0);
  leftLeg.castShadow = true;
  const rightLeg = new THREE.Mesh(legGeo, monsterMat);
  rightLeg.position.set(0.45 * scale, 0.7 * scale, 0);
  rightLeg.castShadow = true;
  group.add(leftLeg);
  group.add(rightLeg);

  // If World Boss or Elite, add horns / wings / orbital runes
  if (isBoss) {
    const hornGeo = new THREE.ConeGeometry(0.3 * scale, 1.4 * scale, 4);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.4 });
    const hornL = new THREE.Mesh(hornGeo, hornMat);
    hornL.position.set(-0.6 * scale, 4.6 * scale, 0);
    hornL.rotation.z = 0.4;
    const hornR = new THREE.Mesh(hornGeo, hornMat);
    hornR.position.set(0.6 * scale, 4.6 * scale, 0);
    hornR.rotation.z = -0.4;
    group.add(hornL);
    group.add(hornR);

    // Floating orbital crystals
    const crystalGeo = new THREE.OctahedronGeometry(0.4 * scale);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      emissive: 0xff0055,
      emissiveIntensity: 0.8
    });
    for (let c = 0; c < 3; c++) {
      const cr = new THREE.Mesh(crystalGeo, crystalMat);
      const ang = (c * Math.PI * 2) / 3;
      cr.position.set(Math.cos(ang) * 2.2 * scale, 3.2 * scale, Math.sin(ang) * 2.2 * scale);
      cr.name = `OrbitalCrystal_${c}`;
      group.add(cr);
    }
  }

  // Ground Attack Telegraph Ring (visual windup warning on terrain)
  const ringRadius = isBoss ? 4.2 : monster.level > 200 ? 3.0 : 2.2;
  const telegraphGeo = new THREE.RingGeometry(ringRadius * 0.78, ringRadius, 24);
  telegraphGeo.rotateX(-Math.PI / 2);
  const telegraphMat = new THREE.MeshBasicMaterial({
    color: isBoss ? 0xff1744 : 0xff9100,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const telegraphRing = new THREE.Mesh(telegraphGeo, telegraphMat);
  telegraphRing.position.y = 0.08;
  telegraphRing.name = 'MonsterTelegraphRing';
  group.add(telegraphRing);

  // Floating Health, Level & AI Behavior Overhead Bar
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 76;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.roundRect(4, 4, 184, 68, 10);
    ctx.fill();
    ctx.strokeStyle = isBoss ? '#f43f5e' : '#eab308';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = 'bold 17px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${monster.name.slice(0, 18)}`, 96, 24);
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = isBoss ? '#fb7185' : '#fde047';
    ctx.fillText(`Lv.${monster.level} [${(monster.aiState || 'patrol').split('_')[0].toUpperCase()}]`, 96, 48);
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${(monster.movementPolicy || 'pack_swarmer').replace('_', ' ')}`, 96, 65);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const spriteMat = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(4.5, 1.8, 1);
  sprite.position.y = 5.2 * scale;
  group.add(sprite);

  return group;
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

  // Skin material
  const skinMat = new THREE.MeshStandardMaterial({
    color: appearance.skinColor,
    roughness: 0.7,
    metalness: 0.05,
  });

  // Hair material
  const hairMat = new THREE.MeshStandardMaterial({
    color: appearance.hairColor,
    roughness: 0.8,
  });

  // Armor material with tier-based specular & Golden Core translucent chest support
  const isHighTier = appearance.armorTier > 10;
  const isGodTier = appearance.armorTier >= 18;
  const isGoldenCoreRealm = realmIndex === 2;
  const armorMat = new THREE.MeshStandardMaterial({
    color: appearance.armorColor,
    roughness: isHighTier ? 0.25 : 0.6,
    metalness: isHighTier ? 0.85 : 0.3,
    emissive: isGodTier ? 0x00e5ff : isGoldenCoreRealm ? 0xf59e0b : 0x000000,
    emissiveIntensity: isGodTier ? 0.35 : isGoldenCoreRealm ? 0.22 : 0,
    transparent: isGoldenCoreRealm,
    opacity: isGoldenCoreRealm ? 0.68 : 1.0,
  });

  // Head
  const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 2.1;
  head.castShadow = true;
  player.add(head);

  // Eyes
  const eyeMat = new THREE.MeshStandardMaterial({
    color: isRedName ? 0xff1744 : appearance.eyeColor,
    emissive: isRedName ? 0xff1744 : appearance.eyeColor,
    emissiveIntensity: isRedName ? 0.95 : 0.6,
  });
  const eyeGeo = new THREE.BoxGeometry(0.12, 0.12, 0.08);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.2, 2.15, 0.42);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.2, 2.15, 0.42);
  player.add(eyeL);
  player.add(eyeR);

  // Hair / Helmet
  const hairGeo = new THREE.BoxGeometry(0.86, 0.35, 0.86);
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0, 2.5, 0);
  player.add(hair);

  // Torso / Chestplate
  const torsoGeo = new THREE.BoxGeometry(0.9, 1.1, 0.6);
  const torso = new THREE.Mesh(torsoGeo, armorMat);
  torso.position.y = 1.25;
  torso.castShadow = true;
  player.add(torso);

  // Shoulder Pauldrons
  const pauldronGeo = new THREE.BoxGeometry(0.35, 0.35, 0.4);
  const pauldronL = new THREE.Mesh(pauldronGeo, armorMat);
  pauldronL.position.set(-0.62, 1.7, 0);
  const pauldronR = new THREE.Mesh(pauldronGeo, armorMat);
  pauldronR.position.set(0.62, 1.7, 0);
  player.add(pauldronL);
  player.add(pauldronR);

  // Left & Right Arms
  const armGeo = new THREE.BoxGeometry(0.32, 0.9, 0.32);
  const armL = new THREE.Mesh(armGeo, skinMat);
  armL.position.set(-0.6, 1.2, 0);
  armL.castShadow = true;
  const armR = new THREE.Mesh(armGeo, skinMat);
  armR.position.set(0.6, 1.2, 0);
  armR.castShadow = true;
  player.add(armL);
  player.add(armR);

  // Weapon in Right Hand
  const weaponGroup = new THREE.Group();
  weaponGroup.position.set(0.65, 0.8, 0.2);

  if (appearance.weaponType === 'broadsword') {
    const bladeGeo = new THREE.BoxGeometry(0.12, 1.4, 0.06);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.9, roughness: 0.1 });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 0.6;
    weaponGroup.add(blade);

    const guardGeo = new THREE.BoxGeometry(0.4, 0.08, 0.1);
    const guard = new THREE.Mesh(guardGeo, voxelMaterials.goldAccent);
    guard.position.y = 0.04;
    weaponGroup.add(guard);
  } else if (appearance.weaponType === 'crossbow') {
    const bowStockGeo = new THREE.BoxGeometry(0.15, 0.15, 0.8);
    const bowStock = new THREE.Mesh(bowStockGeo, voxelMaterials.woodTrunk);
    weaponGroup.add(bowStock);
    const bowArmsGeo = new THREE.BoxGeometry(0.9, 0.1, 0.1);
    const bowArms = new THREE.Mesh(bowArmsGeo, voxelMaterials.steelOre);
    bowArms.position.z = 0.35;
    weaponGroup.add(bowArms);
  } else if (appearance.weaponType === 'siege_mortar') {
    const cannonGeo = new THREE.CylinderGeometry(0.2, 0.25, 1.1, 8);
    const cannon = new THREE.Mesh(cannonGeo, voxelMaterials.steelOre);
    cannon.rotation.x = Math.PI / 4;
    weaponGroup.add(cannon);
  } else {
    const shaftGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.0, 6);
    const shaft = new THREE.Mesh(shaftGeo, voxelMaterials.woodTrunk);
    shaft.position.y = 0.5;
    weaponGroup.add(shaft);
    const spearGeo = new THREE.ConeGeometry(0.18, 0.6, 4);
    const spear = new THREE.Mesh(spearGeo, voxelMaterials.diamondOre);
    spear.position.y = 1.6;
    weaponGroup.add(spear);
  }
  player.add(weaponGroup);

  // Shield in Left Hand
  const shieldGeo = new THREE.BoxGeometry(0.1, 0.8, 0.6);
  const shieldMat = new THREE.MeshStandardMaterial({ color: 0x1565c0, metalness: 0.7, roughness: 0.3 });
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
  player.add(legL);
  player.add(legR);

  // Cape
  if (appearance.hasCape) {
    const capeGeo = new THREE.BoxGeometry(0.8, 1.3, 0.05);
    const capeMat = new THREE.MeshStandardMaterial({ color: appearance.capeColor, roughness: 0.85 });
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.set(0, 1.1, -0.35);
    cape.rotation.x = 0.15;
    player.add(cape);
  }

  // ==========================================================================
  // CULTIVATION POWER VISUAL CUES ("THE AURA" — Replaces Overhead Level Numbers)
  // ==========================================================================
  const auraGroup = new THREE.Group();
  auraGroup.name = 'CultivationAuraGroup';

  if (realmIndex === 1) {
    // Foundation Establishment: Faint white spiritual glow
    const mistGeo = new THREE.SphereGeometry(1.15, 16, 16);
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    const mistShell = new THREE.Mesh(mistGeo, mistMat);
    mistShell.position.y = 1.35;
    mistShell.name = 'CultivationFoundationGlow';
    auraGroup.add(mistShell);
  } else if (realmIndex === 2) {
    // Golden Core: Literal Golden Core spinning inside translucent chest AND behind back
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.4,
      metalness: 0.95,
      roughness: 0.1,
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
      new THREE.TorusGeometry(0.62, 0.045, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0xfde047 })
    );
    backCoreGroup.add(backSphere);
    backCoreGroup.add(backRing);
    auraGroup.add(backCoreGroup);
  } else if (realmIndex >= 3 && realmIndex <= 20) {
    // Nascent Soul: A small astral "baby" avatar floating above the cultivator's head
    const babyGroup = new THREE.Group();
    babyGroup.position.set(0, 3.15, 0);
    babyGroup.name = 'CultivationNascentBaby';

    const babyMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.1,
      transparent: true,
      opacity: 0.88,
    });
    const babyBody = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.24), babyMat);
    const babyHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), babyMat);
    babyHead.position.y = 0.32;
    const babyLotus = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.05, 8, 16),
      new THREE.MeshBasicMaterial({ color: 0xfde047 })
    );
    babyLotus.rotation.x = Math.PI / 2;
    babyLotus.position.y = -0.18;

    babyGroup.add(babyBody);
    babyGroup.add(babyHead);
    babyGroup.add(babyLotus);
    auraGroup.add(babyGroup);
  } else if (realmIndex >= 21) {
    // Dao Creator / Ultimate Origin: Divine Rings (Halos) behind back = # of Great Dao rules mastered
    const haloGroup = new THREE.Group();
    haloGroup.position.set(0, 1.85, -0.75);
    haloGroup.name = 'CultivationDivineHalos';

    const haloCount = Math.max(1, Math.min(12, masteredGreatDaos));
    for (let h = 0; h < haloCount; h++) {
      const radius = 0.75 + h * 0.16;
      const haloGeo = new THREE.TorusGeometry(radius, 0.035, 8, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: h % 2 === 0 ? 0xfde047 : 0xc084fc,
      });
      const haloRing = new THREE.Mesh(haloGeo, haloMat);
      haloRing.rotation.z = (h * Math.PI) / haloCount;
      haloGroup.add(haloRing);
    }
    auraGroup.add(haloGroup);
  }

  // Red-Name Karma Crimson Warning Ring on ground if player has negative Karma
  if (isRedName) {
    const redGeo = new THREE.RingGeometry(1.1, 1.45, 24);
    redGeo.rotateX(-Math.PI / 2);
    const redMat = new THREE.MeshBasicMaterial({
      color: 0xff1744,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    const redRing = new THREE.Mesh(redGeo, redMat);
    redRing.position.y = 0.08;
    redRing.name = 'RedNameKarmaRing';
    auraGroup.add(redRing);
  }

  player.add(auraGroup);

  // Floating Player Name & Sect Title Banner (No Level Numbers above head!)
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = isRedName ? 'rgba(69, 10, 10, 0.90)' : 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect(4, 4, 192, 56, 10);
    ctx.fill();
    ctx.strokeStyle = isRedName ? '#ff1744' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = isRedName ? '#fecdd3' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`[${appearance.clanTag}] ${appearance.name}`, 100, 26);
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = isRedName ? '#ff1744' : '#38bdf8';
    ctx.fillText(isRedName ? '🩸 RED NAME · BOUNTY' : `${appearance.title}`, 100, 50);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const spriteMat = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(3.6, 1.2, 1);
  sprite.position.y = realmIndex >= 3 && realmIndex <= 20 ? 3.95 : 3.25;
  player.add(sprite);

  return player;
}

