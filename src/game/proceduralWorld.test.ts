/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createVoxelTerrain,
  createVoxelCastle,
  createResourceNodeMesh,
  createNPCMesh,
  createMonsterMesh,
  createPlayerMesh,
} from './proceduralWorld';
import {
  INITIAL_APPEARANCE,
  INITIAL_HEROES,
  INITIAL_MONSTERS,
  INITIAL_NPCS,
  INITIAL_RESOURCE_NODES,
  INITIAL_RESOURCES,
  INITIAL_TROOPS,
} from './initialData';
import { CPP_CODE_MODULES, CPP_ENGINE_SPEC, getSimulatedEngineStats } from './cppEngine';

test('procedural voxel terrain builds instanced meshes and animated water plane cleanly', () => {
  const terrain = createVoxelTerrain();
  assert.equal(terrain.name, 'VoxelTerrain');
  assert.ok(terrain.children.length >= 4, 'Terrain contains grass, stone, foliage tufts, and water');

  const waterMesh = terrain.getObjectByName('VoxelWaterPlane');
  assert.ok(waterMesh, 'Terrain includes animated PBR VoxelWaterPlane mesh');
});

test('createVoxelCastle scales geometry and celestial runic spire rings across levels 1 to 100', () => {
  const castleLv1 = createVoxelCastle(1);
  assert.equal(castleLv1.name, 'PlayerCastle');
  assert.ok(castleLv1.getObjectByName('CastleSpireRingOuter'));
  assert.ok(castleLv1.getObjectByName('CastleSpireRingInner'));

  const castleLv80 = createVoxelCastle(80);
  const spireRingOuter = castleLv80.getObjectByName('CastleSpireRingOuter');
  assert.ok(spireRingOuter, 'Lv.80 castle includes counter-rotating celestial runic spire rings');
  assert.ok(castleLv80.children.length >= castleLv1.children.length);
});

test('createResourceNodeMesh, createNPCMesh, and createMonsterMesh build valid 3D scene graphs', () => {
  for (const node of INITIAL_RESOURCE_NODES) {
    const mesh = createResourceNodeMesh(node);
    assert.equal(mesh.name, `ResourceNode_${node.type}_${node.level}`);
    assert.ok(mesh.children.length >= 3);
  }

  for (const npc of INITIAL_NPCS) {
    const mesh = createNPCMesh(npc);
    assert.equal(mesh.name, `NPC_${npc.id}`);
    assert.ok(mesh.children.length >= 6, 'NPC has articulated legs, torso, belt, arms, head, and role gear');
  }

  for (const monster of INITIAL_MONSTERS) {
    const mesh = createMonsterMesh(monster);
    assert.equal(mesh.name, `Monster_${monster.id}`);
    assert.ok(
      mesh.getObjectByName('MonsterTelegraphRing'),
      'Monster includes ground attack telegraph ring'
    );
    if (monster.isWorldBoss || monster.level > 500) {
      assert.ok(
        mesh.getObjectByName('OrbitalCrystal_0'),
        'Boss monster includes floating orbital crystals'
      );
    }
  }
});

test('createPlayerMesh renders realm-specific cultivation auras and Red-Name karma ring', () => {
  // Qi Refinement (0): No special aura child meshes
  const qiAvatar = createPlayerMesh(INITIAL_APPEARANCE, 0, 1, false);
  const qiAura = qiAvatar.getObjectByName('CultivationAuraGroup');
  assert.ok(qiAura);
  assert.equal(qiAura.children.length, 0, 'Qi Refinement has no aura visual meshes');

  // Foundation Establishment (1): Faint White Glow
  const foundationAvatar = createPlayerMesh(INITIAL_APPEARANCE, 1, 1, false);
  assert.ok(
    foundationAvatar.getObjectByName('CultivationFoundationGlow'),
    'Foundation Establishment renders faint white spiritual mist shell'
  );

  // Golden Core (2): Spinning Chest & Back Golden Core
  const goldenCoreAvatar = createPlayerMesh(INITIAL_APPEARANCE, 2, 1, false);
  assert.ok(goldenCoreAvatar.getObjectByName('CultivationChestCore'));
  assert.ok(goldenCoreAvatar.getObjectByName('CultivationGoldenCore'));

  // Nascent Soul (3): Floating Nascent Baby Avatar
  const nascentAvatar = createPlayerMesh(INITIAL_APPEARANCE, 3, 1, false);
  assert.ok(nascentAvatar.getObjectByName('CultivationNascentBaby'));

  // Dao Creator (21) + Red Name Karma Ring
  const creatorAvatar = createPlayerMesh(INITIAL_APPEARANCE, 21, 6, true);
  const halos = creatorAvatar.getObjectByName('CultivationDivineHalos');
  assert.ok(halos, 'Dao Creator renders concentric divine halo group');
  assert.equal(halos.children.length, 6, 'Halo count matches mastered Great Dao rules');
  assert.ok(
    creatorAvatar.getObjectByName('RedNameKarmaRing'),
    'Red-Name player renders crimson karma warning ring'
  );
});

test('C++20 engine telemetry and initial world data remain consistent and non-empty', () => {
  const stats = getSimulatedEngineStats();
  assert.equal(stats.tickRateHz, 60.0);
  assert.equal(stats.peakLuminanceNits, 4000);
  assert.equal(CPP_CODE_MODULES.length, 4);
  assert.ok(CPP_ENGINE_SPEC.features.length >= 5);

  assert.ok(INITIAL_RESOURCES.wood > 0n);
  assert.ok(Object.keys(INITIAL_TROOPS).length >= 9);
  assert.ok(INITIAL_HEROES.length >= 4);
  assert.ok(INITIAL_NPCS.length >= 5);
  assert.ok(INITIAL_MONSTERS.length >= 4);
});
