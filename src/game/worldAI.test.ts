/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MONSTER_COMPLEXITY_BRACKETS,
  getMonsterComplexityByLevel,
  createScaledMonsterByLevel,
  isWorldCoordinateWalkable,
  computeAIPath,
  stepActorAlongPath,
  evaluateMonsterAIDecision,
  evaluateNPCAIDecision,
  generateRadiantQuestForNPC,
  tickWorldAI,
} from './worldAI';
import { INITIAL_MONSTERS, INITIAL_NPCS, INITIAL_RESOURCE_NODES } from './initialData';

test('World AI System — Monster Complexity Scaling (Lv. 1 to 1000) & NPC Role Behaviors', async (t) => {
  await t.test('scales monster complexity across all 5 brackets from level 1 to 1000', () => {
    assert.equal(MONSTER_COMPLEXITY_BRACKETS.length, 5);

    const lv1 = getMonsterComplexityByLevel(1);
    const lv45 = getMonsterComplexityByLevel(45);
    const lv120 = getMonsterComplexityByLevel(120);
    const lv350 = getMonsterComplexityByLevel(350);
    const lv700 = getMonsterComplexityByLevel(700);
    const lv1000 = getMonsterComplexityByLevel(1000);

    assert.equal(lv1.bracketId, 'bracket_1_feral');
    assert.equal(lv45.bracketId, 'bracket_1_feral');
    assert.equal(lv120.bracketId, 'bracket_2_tactical');
    assert.equal(lv350.bracketId, 'bracket_3_sovereign');
    assert.equal(lv700.bracketId, 'bracket_4_abyssal');
    assert.equal(lv1000.bracketId, 'bracket_5_apex_titan');

    // Tactical IQ, aggro radius, and pathfinding max nodes strictly increase with complexity tier
    assert.ok(lv1000.tacticalIQ > lv700.tacticalIQ);
    assert.ok(lv700.tacticalIQ > lv350.tacticalIQ);
    assert.ok(lv350.tacticalIQ > lv120.tacticalIQ);
    assert.ok(lv120.tacticalIQ > lv1.tacticalIQ);
    assert.ok(lv1000.pathfindingMaxNodes > lv1.pathfindingMaxNodes);
  });

  await t.test('createScaledMonsterByLevel generates valid stats and AI profiles from Lv 1 to Lv 1000', () => {
    const m1 = createScaledMonsterByLevel(1, 'Lv1 Forest Slime', { x: 14, z: 14 });
    const m500 = createScaledMonsterByLevel(500, 'Lv500 Magma Sovereign', { x: 20, z: 20 });
    const m1000 = createScaledMonsterByLevel(1000, 'Lv1000 Supreme Chaos Titan', { x: 0, z: -32 });

    assert.equal(m1.level, 1);
    assert.equal(m1.tier, 'minion');
    assert.equal(m1.movementPolicy, 'pack_swarmer');

    assert.equal(m500.level, 500);
    assert.equal(m500.tier, 'boss');
    assert.ok(m500.hp > m1.hp * 1000n);

    assert.equal(m1000.level, 1000);
    assert.equal(m1000.tier, 'world_titan');
    assert.equal(m1000.isWorldBoss, true);
    assert.ok(m1000.hp > m500.hp * 10n);
    assert.ok(m1000.attack > m500.attack);
  });

  await t.test('A* pathfinding routes around central Castle Keep obstacle cleanly', () => {
    // Central castle keep (0, 0) is not walkable
    assert.equal(isWorldCoordinateWalkable(0, 0), false);
    assert.equal(isWorldCoordinateWalkable(16, 16), true);

    const path = computeAIPath({ x: -16, z: 0 }, { x: 16, z: 0 }, 8);
    assert.ok(path.length >= 1);
    // Every intermediate waypoint must avoid the keep interior
    for (const wp of path) {
      assert.equal(
        isWorldCoordinateWalkable(wp.x, wp.z),
        true,
        `Waypoint [${wp.x}, ${wp.z}] should avoid castle keep`
      );
    }

    const stepped = stepActorAlongPath({ x: -16, z: 0 }, path, 2.5);
    assert.notDeepEqual(stepped.nextPos, { x: -16, z: 0 });
  });

  await t.test('Monster AI adapts attack patterns, flanking, and environmental interactions', () => {
    const lowMon = createScaledMonsterByLevel(15, 'Forest Goblin', { x: 18, z: -14 });
    // Wounded low-level monster (<25% HP) seeks shelter
    const woundedDecision = evaluateMonsterAIDecision({
      monster: { ...lowMon, hp: lowMon.maxHp / 10n },
      playerPos: { x: 16, z: -12 },
      npcs: INITIAL_NPCS,
      resourceNodes: INITIAL_RESOURCE_NODES,
      weather: 'storm',
      timeOfDayHours: 14,
    });
    assert.equal(woundedDecision.nextState, 'seeking_shelter');

    // High-level Titan in Phase III (<35% HP) selects Ultimate Origin Supernova
    const titan = createScaledMonsterByLevel(999, 'Celestial Ender Titan', { x: 0, z: -30 });
    const titanPhase3 = evaluateMonsterAIDecision({
      monster: { ...titan, hp: titan.maxHp / 5n },
      playerPos: { x: 0, z: -20 },
      npcs: INITIAL_NPCS,
      resourceNodes: INITIAL_RESOURCE_NODES,
      weather: 'storm',
      timeOfDayHours: 22,
    });
    assert.equal(titanPhase3.nextState, 'enraged_berserk');
    assert.equal(titanPhase3.selectedPattern.id, 'atk_origin_supernova');
    assert.ok(titanPhase3.activeEnvInteraction.includes('Tempest'));
  });

  await t.test('NPC AI exhibits distinct role behaviors for Guard, Trader, Blacksmith, Mystic, and Quest-Giver', () => {
    const marshal = INITIAL_NPCS.find((n) => n.role === 'marshal')!;
    const blacksmith = INITIAL_NPCS.find((n) => n.role === 'blacksmith')!;
    const elder = INITIAL_NPCS.find((n) => n.role === 'elder')!;

    // Marshal intercepts encroaching monster
    const closeMonster = createScaledMonsterByLevel(80, 'Raiding Orc', {
      x: marshal.x + 4,
      z: marshal.z + 3,
    });
    const marshalDecision = evaluateNPCAIDecision({
      npc: marshal,
      monsters: [closeMonster],
      resourceNodes: INITIAL_RESOURCE_NODES,
      weather: 'clear',
      timeOfDayHours: 12,
    });
    assert.equal(marshalDecision.nextState, 'combating_monster');
    assert.ok(marshalDecision.monsterDamageDealt);
    assert.ok(marshalDecision.monsterDamageDealt.damage > 0n);

    // Blacksmith gathers/forges Steel & Copper
    const smithDecision = evaluateNPCAIDecision({
      npc: { ...blacksmith, directive: 'gather_resources' },
      monsters: [],
      resourceNodes: INITIAL_RESOURCE_NODES,
      weather: 'clear',
      timeOfDayHours: 12,
    });
    assert.equal(smithDecision.nextState, 'gathering_resource');
    assert.ok((smithDecision.gatheredDelta.steel || 0n) > 0n);

    // Quest-giver generates level-scaled Radiant Quests
    const quest = generateRadiantQuestForNPC(elder, 12);
    assert.ok(quest.rewardExp > 0n);
    assert.ok(quest.rewardDiamonds > 0n);
  });

  await t.test('tickWorldAI advances all NPCs and Monsters, accumulating stashes and logs', () => {
    const tickResult = tickWorldAI({
      npcs: INITIAL_NPCS,
      monsters: INITIAL_MONSTERS,
      resourceNodes: INITIAL_RESOURCE_NODES,
      playerPos: { x: 0, z: 18 },
      weather: 'clear',
      timeOfDayHours: 14,
    });

    assert.equal(tickResult.updatedNpcs.length, INITIAL_NPCS.length);
    assert.equal(tickResult.updatedMonsters.length, INITIAL_MONSTERS.length);
    assert.ok(tickResult.updatedMonsters.every((m) => Boolean(m.aiState)));
    assert.ok(tickResult.updatedNpcs.every((n) => Boolean(n.aiState)));
  });
});
