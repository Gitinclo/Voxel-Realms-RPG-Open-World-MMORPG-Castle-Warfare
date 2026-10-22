/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MonsterAIBehaviorState,
  MonsterAttackPattern,
  MonsterComplexityBracketId,
  MonsterEnvInteraction,
  MonsterMovementPolicy,
  MonsterTarget,
  NPC,
  NPCAIBehaviorState,
  NPCDirective,
  NPCRole,
  NPCTradeOffer,
  Quest,
  ResourceNode,
  ResourceType,
  WaypointCoord,
  WorldAIEventLog,
} from '../types/game';
import { WeatherType } from './weather';

export interface MonsterComplexityProfile {
  bracketId: MonsterComplexityBracketId;
  name: string;
  minLevel: number;
  maxLevel: number;
  tier: MonsterTarget['tier'];
  movementPolicy: MonsterMovementPolicy;
  movementPolicyLabel: string;
  pathfindingAlgorithm: string;
  pathfindingMaxNodes: number;
  aggroRadius: number;
  tacticalIQ: number; // 10 to 100
  attackPatterns: MonsterAttackPattern[];
  environmentalInteractions: MonsterEnvInteraction[];
  summary: string;
}

export const MONSTER_COMPLEXITY_BRACKETS: MonsterComplexityProfile[] = [
  {
    bracketId: 'bracket_1_feral',
    name: 'Tier I: Feral Pack Instinct (Lv. 1–50)',
    minLevel: 1,
    maxLevel: 50,
    tier: 'minion',
    movementPolicy: 'pack_swarmer',
    movementPolicyLabel: 'Pack Swarmer & Roaming Scavenger',
    pathfindingAlgorithm: 'Direct Line-of-Sight Steering + Basic Obstacle Bounce',
    pathfindingMaxNodes: 3,
    aggroRadius: 10,
    tacticalIQ: 20,
    summary:
      'Low-level feral creatures that roam in packs, raid unguarded Wood/Grain nodes, and flee into forest cover during storms or when below 25% HP.',
    attackPatterns: [
      {
        id: 'atk_feral_slash',
        name: 'Feral Claw Flurry',
        type: 'melee_cleave',
        windupSeconds: 0.4,
        damageMultiplier: 1.15,
        aoeRadius: 2.5,
        statusEffect: 'Minor Bleed (-5% March Speed)',
        counterTroop: 'shieldbearer',
        description: 'Rapid close-range claw strikes targeting frontline infantry.',
      },
      {
        id: 'atk_pack_howl',
        name: 'Bloodmoon Pack Howl',
        type: 'aoe_slam',
        windupSeconds: 0.6,
        damageMultiplier: 1.3,
        aoeRadius: 4.0,
        statusEffect: 'Feral Frenzy (+15% Attack Speed)',
        counterTroop: 'shooter',
        description: 'Alerts nearby pack minions, boosting movement and attack cadence.',
      },
    ],
    environmentalInteractions: [
      {
        trigger: 'weather_storm',
        actionName: 'Cower in Forest Canopy',
        effectDescription: 'Retreats toward Wood nodes during thunderstorms (-15% Aggro Range, +20% Evasion).',
        buffStat: 'defense',
        magnitudePct: 20,
      },
      {
        trigger: 'near_resource_node',
        actionName: 'Forage Timber & Grain',
        effectDescription: 'Pilfers small amounts of unguarded Grain/Wood to restore 4% HP per tick.',
        buffStat: 'regen',
        magnitudePct: 4,
      },
    ],
  },
  {
    bracketId: 'bracket_2_tactical',
    name: 'Tier II: Tactical Sentinel (Lv. 51–200)',
    minLevel: 51,
    maxLevel: 200,
    tier: 'elite',
    movementPolicy: 'shielded_charger',
    movementPolicyLabel: 'Shielded Phalanx & Line-of-Sight Charger',
    pathfindingAlgorithm: 'Grid A* Waypoint Navigation (Elevation & Keep Avoidance)',
    pathfindingMaxNodes: 5,
    aggroRadius: 14,
    tacticalIQ: 45,
    summary:
      'Armored elemental and golem elites that navigate around terrain obstacles, absorb mineral veins to fortify armor, and execute telegraphed seismic slams.',
    attackPatterns: [
      {
        id: 'atk_seismic_slam',
        name: 'Seismic Tectonic Slam',
        type: 'aoe_slam',
        windupSeconds: 0.65,
        damageMultiplier: 1.65,
        aoeRadius: 5.5,
        statusEffect: 'Ground Tremor (Stuns Frontline 1.5s)',
        counterTroop: 'bomber',
        description: 'Heavy windup shockwave that shatters clustered Shieldbearer formations.',
      },
      {
        id: 'atk_granite_bulwark',
        name: 'Granite Bastion Charge',
        type: 'melee_cleave',
        windupSeconds: 0.5,
        damageMultiplier: 1.45,
        aoeRadius: 3.5,
        statusEffect: 'Mineral Carapace (+35% DEF)',
        counterTroop: 'bomber',
        description: 'Locks stone plates and bull-rushes along a clear line of sight.',
      },
      {
        id: 'atk_boulder_hurl',
        name: 'Crag Boulder Bombard',
        type: 'ranged_barrage',
        windupSeconds: 0.7,
        damageMultiplier: 1.55,
        aoeRadius: 4.5,
        statusEffect: 'Armor Fracture (-15% Shield Block)',
        counterTroop: 'shieldbearer',
        description: 'Hurls excavated bedrock at ranged Shooter squads trying to kite.',
      },
    ],
    environmentalInteractions: [
      {
        trigger: 'near_resource_node',
        actionName: 'Absorb Mineral Vein',
        effectDescription: 'Draws metallic ore from Steel/Copper nodes to harden carapace (+30% Defense).',
        buffStat: 'defense',
        magnitudePct: 30,
      },
      {
        trigger: 'weather_rain',
        actionName: 'Hydro-Stone Tempering',
        effectDescription: 'Rain cools molten cracks, regenerating 6% Max HP and negating burn effects.',
        buffStat: 'regen',
        magnitudePct: 6,
      },
    ],
  },
  {
    bracketId: 'bracket_3_sovereign',
    name: 'Tier III: Sovereign Predator (Lv. 201–500)',
    minLevel: 201,
    maxLevel: 500,
    tier: 'boss',
    movementPolicy: 'flanking_orbiter',
    movementPolicyLabel: 'Flanking Orbiter & Backline Dive-Bomber',
    pathfindingAlgorithm: 'Tactical Flank Vector A* (Backline Threat Weighting)',
    pathfindingMaxNodes: 7,
    aggroRadius: 18,
    tacticalIQ: 70,
    summary:
      'Apex drakes and warlords that circle around frontline shields to dive-bomb Shooter/Bomber backlines, ignite Oil wells, and lay persistent magma hazard zones.',
    attackPatterns: [
      {
        id: 'atk_infernal_cone',
        name: 'Infernal Dragonbreath Cone',
        type: 'cone_breath',
        windupSeconds: 0.75,
        damageMultiplier: 2.1,
        aoeRadius: 7.5,
        statusEffect: 'Hellfire Ignition (Burn DoT 4s)',
        counterTroop: 'shieldbearer',
        description: 'Sweeps a 90-degree cone of molten fire across the battlefield.',
      },
      {
        id: 'atk_magma_eruption',
        name: 'Cataclysmic Magma Plume',
        type: 'aoe_slam',
        windupSeconds: 0.8,
        damageMultiplier: 2.35,
        aoeRadius: 6.5,
        statusEffect: 'Scorched Earth Zone (-25% DEF)',
        counterTroop: 'shooter',
        description: 'Summons 3 delayed geysers beneath high-density ranged units.',
      },
      {
        id: 'atk_winged_dive',
        name: 'Supersonic Apex Dive',
        type: 'melee_cleave',
        windupSeconds: 0.55,
        damageMultiplier: 1.95,
        aoeRadius: 5.0,
        statusEffect: 'Knockback Scatter',
        counterTroop: 'shooter',
        description: 'Leaps over Shieldbearers to strike vulnerable siege artillery directly.',
      },
    ],
    environmentalInteractions: [
      {
        trigger: 'near_resource_node',
        actionName: 'Ignite Oil & Hydrocarbon Veins',
        effectDescription: 'Superheats nearby Oil nodes to boost fire attack power by +35%.',
        buffStat: 'attack',
        magnitudePct: 35,
      },
      {
        trigger: 'low_hp',
        actionName: 'Draconic Thermal Overdrive',
        effectDescription: 'Below 40% HP, scales shed molten slag (+25% Speed & Attack).',
        buffStat: 'speed',
        magnitudePct: 25,
      },
    ],
  },
  {
    bracketId: 'bracket_4_abyssal',
    name: 'Tier IV: Abyssal Calamity (Lv. 501–850)',
    minLevel: 501,
    maxLevel: 850,
    tier: 'boss',
    movementPolicy: 'blink_intercepter',
    movementPolicyLabel: 'Phase-Blink Hunter & Void Hazard Architect',
    pathfindingAlgorithm: 'Predictive Lead-Target A* + Dimensional Rift Blink',
    pathfindingMaxNodes: 9,
    aggroRadius: 22,
    tacticalIQ: 88,
    summary:
      'Ancient abyssal wyrms that predict player vectors, blink across terrain obstacles, corrupt Diamond crystal nodes into shield beacons, and thrive in night/storm states.',
    attackPatterns: [
      {
        id: 'atk_void_implosion',
        name: 'Void Singularity Implosion',
        type: 'void_rift',
        windupSeconds: 0.85,
        damageMultiplier: 2.8,
        aoeRadius: 8.5,
        statusEffect: 'Gravity Vortex (Pulls & Silences)',
        counterTroop: 'bomber',
        description: 'Opens a dimensional tear that drags legions inward before detonating.',
      },
      {
        id: 'atk_soul_tether',
        name: 'Abyssal Soul-Drain Beam',
        type: 'ranged_barrage',
        windupSeconds: 0.7,
        damageMultiplier: 2.5,
        aoeRadius: 6.0,
        statusEffect: 'parasitic Leech (Heals 10% Damage Dealt)',
        counterTroop: 'shooter',
        description: 'Fires a piercing beam of dark Qi that siphons vitality from troops.',
      },
      {
        id: 'atk_miasma_nova',
        name: 'Chaos Corrosion Nova',
        type: 'aoe_slam',
        windupSeconds: 0.75,
        damageMultiplier: 2.65,
        aoeRadius: 8.0,
        statusEffect: 'Armor Melt (-35% Troop Defense)',
        counterTroop: 'shieldbearer',
        description: 'Blankets the sector in abyssal fog that corrodes metallic armor.',
      },
    ],
    environmentalInteractions: [
      {
        trigger: 'nightfall',
        actionName: 'Umbral Nocturne Empowerment',
        effectDescription: 'Between 18:00 and 06:00, draws dark starlight for +40% Attack & +20% Crit.',
        buffStat: 'attack',
        magnitudePct: 40,
      },
      {
        trigger: 'near_resource_node',
        actionName: 'Corrupt Diamond Leyline',
        effectDescription: 'Siphons Diamond crystal nodes to project a regenerating Void Barrier.',
        buffStat: 'node_siphon',
        magnitudePct: 45,
      },
    ],
  },
  {
    bracketId: 'bracket_5_apex_titan',
    name: 'Tier V: Apex World Titan (Lv. 851–1000)',
    minLevel: 851,
    maxLevel: 1000,
    tier: 'world_titan',
    movementPolicy: 'supreme_arbiter',
    movementPolicyLabel: 'Multi-Phase Supreme Arbiter & Adaptive Counter-Matrix',
    pathfindingAlgorithm: 'Omnidirectional Spatial Dominance + Orbital Crystal Formation',
    pathfindingMaxNodes: 12,
    aggroRadius: 30,
    tacticalIQ: 100,
    summary:
      'God-level World Titans (Lv. 851–1000) featuring 3-phase boss transitions, adaptive troop resistance matrices, celestial weather manipulation, and realm-wide hazard telegraphs.',
    attackPatterns: [
      {
        id: 'atk_celestial_starfall',
        name: 'Phase I: Nine-Heavens Starfall Barrage',
        type: 'ranged_barrage',
        windupSeconds: 0.8,
        damageMultiplier: 3.4,
        aoeRadius: 10.0,
        statusEffect: 'Starlight Suppression (-20% All Stats)',
        counterTroop: 'shieldbearer',
        description: 'Calls down orbital crystal meteors across multiple target rings.',
      },
      {
        id: 'atk_dao_annihilation_beam',
        name: 'Phase II: Great Dao Annihilation Lance',
        type: 'void_rift',
        windupSeconds: 0.9,
        damageMultiplier: 4.1,
        aoeRadius: 11.0,
        statusEffect: 'Law Erasure (Bypasses 50% Armor)',
        counterTroop: 'shooter',
        description: 'Sweeps a cosmic ray of pure Great Dao law across the battlefield.',
      },
      {
        id: 'atk_origin_supernova',
        name: 'Phase III: Ultimate Origin Supernova',
        type: 'omni_cataclysm',
        windupSeconds: 1.0,
        damageMultiplier: 5.2,
        aoeRadius: 14.0,
        statusEffect: 'Multiverse Collapse + Adaptive Shield (+50% DEF)',
        counterTroop: 'bomber',
        description: 'Arena-wide cataclysm triggered below 35% HP; requires full Clan Rally or Guard intervention.',
      },
    ],
    environmentalInteractions: [
      {
        trigger: 'weather_storm',
        actionName: 'Sovereign Tempest Dominion',
        effectDescription: 'Commands lightning storms to strike nearby armies (+55% Attack & AoE Radius).',
        buffStat: 'attack',
        magnitudePct: 55,
      },
      {
        trigger: 'near_resource_node',
        actionName: 'Devour World Vein Essence',
        effectDescription: 'Drains all high-level resource veins within 18m to fuel orbital crystal shields.',
        buffStat: 'node_siphon',
        magnitudePct: 60,
      },
      {
        trigger: 'low_hp',
        actionName: 'Adaptive Counter-Matrix Protocol',
        effectDescription: 'Analyzes incoming army composition and raises resistance by +50% against dominant troop type.',
        buffStat: 'defense',
        magnitudePct: 50,
      },
    ],
  },
];

/**
 * Resolves the Monster Complexity Profile for any monster level from 1 to 1000.
 */
export function getMonsterComplexityByLevel(level: number): MonsterComplexityProfile {
  const clamped = Math.max(1, Math.min(1000, Math.floor(level)));
  const found = MONSTER_COMPLEXITY_BRACKETS.find(
    (b) => clamped >= b.minLevel && clamped <= b.maxLevel
  );
  return found || MONSTER_COMPLEXITY_BRACKETS[MONSTER_COMPLEXITY_BRACKETS.length - 1];
}

/**
 * Generates a complete, level-scaled MonsterTarget (Level 1 to 1000) with AI attributes.
 */
export function createScaledMonsterByLevel(
  level: number,
  customName?: string,
  spawnCoord?: WaypointCoord
): MonsterTarget {
  const clampedLevel = Math.max(1, Math.min(1000, Math.floor(level)));
  const profile = getMonsterComplexityByLevel(clampedLevel);

  // Exponential + polynomial stat progression from Lv 1 to Lv 1000
  const levelFactor = BigInt(clampedLevel);
  const tierMult =
    profile.tier === 'world_titan'
      ? 180n
      : profile.tier === 'boss'
      ? 45n
      : profile.tier === 'elite'
      ? 12n
      : 3n;

  const baseHp = (1200n + levelFactor * levelFactor * 240n) * tierMult;
  const baseAttack = (45n + levelFactor * levelFactor * 5n) * tierMult;
  const baseDefense = (30n + levelFactor * levelFactor * 4n) * tierMult;
  const expReward = (250n + levelFactor * 1450n) * tierMult;

  const defaultNamesByBracket: Record<MonsterComplexityBracketId, string> = {
    bracket_1_feral: 'Razorclaw Forest Pack',
    bracket_2_tactical: 'Runed Obsidian Sentinel',
    bracket_3_sovereign: 'Solaris Dread-Wyvern',
    bracket_4_abyssal: 'Netherworld Rift Behemoth',
    bracket_5_apex_titan: 'Primeval Chaos Archon [Titan]',
  };

  const x = spawnCoord ? spawnCoord.x : Math.round(Math.cos(clampedLevel * 0.7) * 24);
  const z = spawnCoord ? spawnCoord.z : Math.round(Math.sin(clampedLevel * 0.7) * 24);

  return {
    id: `m_scaled_${clampedLevel}_${Date.now().toString(36).slice(-4)}`,
    name: customName || `${defaultNamesByBracket[profile.bracketId]}`,
    level: clampedLevel,
    tier: profile.tier,
    hp: baseHp,
    maxHp: baseHp,
    attack: baseAttack,
    defense: baseDefense,
    x,
    z,
    homeX: x,
    homeZ: z,
    expReward,
    dropResources: {
      wood: levelFactor * 4500n,
      steel: levelFactor * 3800n,
      grain: levelFactor * 5000n,
      oil: clampedLevel >= 100 ? levelFactor * 2200n : 0n,
      diamond: BigInt(Math.max(10, Math.floor(clampedLevel * 12))),
    },
    dropEquipmentChest:
      clampedLevel >= 851
        ? 'Cosmic God-Slayer Cache'
        : clampedLevel >= 501
        ? 'Abyssal Relic Casket'
        : clampedLevel >= 201
        ? 'Infernal Dragonplate Coffer'
        : clampedLevel >= 51
        ? 'Gilded Titan Chest'
        : undefined,
    isWorldBoss: profile.tier === 'world_titan',
    aiState: 'patrolling',
    movementPolicy: profile.movementPolicy,
    complexityBracket: profile.bracketId,
    activeAttackPatternId: profile.attackPatterns[0].id,
    telegraphProgress: 0,
    pathWaypoints: [{ x, z }],
    activeEnvInteraction: profile.environmentalInteractions[0]?.actionName,
    aggroRadius: profile.aggroRadius,
  };
}

/**
 * Checks whether a world coordinate (x, z) is blocked by the central Castle Keep obstacle
 * or out of playable bounds.
 */
export function isWorldCoordinateWalkable(x: number, z: number): boolean {
  if (x < -36 || x > 36 || z < -36 || z > 36) return false;
  // Central Castle Keep occupies [-7.5..7.5, -7.5..7.5], except south gatehouse corridor
  if (Math.abs(x) < 7.5 && Math.abs(z) < 7.5) {
    return false;
  }
  return true;
}

/**
 * Computes a collision-free multi-waypoint path between start and goal on the open-world grid
 * using deterministic A* search with obstacle avoidance around the Castle Keep and terrain boundaries.
 */
export function computeAIPath(
  start: WaypointCoord,
  goal: WaypointCoord,
  maxWaypoints: number = 6
): WaypointCoord[] {
  const stepSize = 4;
  const clampCoord = (v: number) => Math.max(-34, Math.min(34, Math.round(v / stepSize) * stepSize));

  const sx = clampCoord(start.x);
  const sz = clampCoord(start.z);
  let gx = clampCoord(goal.x);
  let gz = clampCoord(goal.z);

  // If goal is inside castle keep, project to nearest outer perimeter point
  if (!isWorldCoordinateWalkable(gx, gz)) {
    gx = gx >= 0 ? 8 : -8;
    gz = gz >= 0 ? 8 : -8;
  }

  if (sx === gx && sz === gz) {
    return [{ x: Math.round(goal.x), z: Math.round(goal.z) }];
  }

  interface AStarNode {
    x: number;
    z: number;
    g: number;
    h: number;
    f: number;
    parent?: AStarNode;
  }

  const key = (x: number, z: number) => `${x},${z}`;
  const open: AStarNode[] = [];
  const closed = new Set<string>();

  const heuristic = (x1: number, z1: number, x2: number, z2: number) =>
    Math.hypot(x2 - x1, z2 - z1);

  open.push({
    x: sx,
    z: sz,
    g: 0,
    h: heuristic(sx, sz, gx, gz),
    f: heuristic(sx, sz, gx, gz),
  });

  const dirs = [
    [stepSize, 0],
    [-stepSize, 0],
    [0, stepSize],
    [0, -stepSize],
    [stepSize, stepSize],
    [stepSize, -stepSize],
    [-stepSize, stepSize],
    [-stepSize, -stepSize],
  ];

  let bestNode: AStarNode = open[0];
  let iterations = 0;

  while (open.length > 0 && iterations < 140) {
    iterations++;
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;

    if (current.h < bestNode.h) {
      bestNode = current;
    }

    if (Math.hypot(current.x - gx, current.z - gz) <= stepSize) {
      bestNode = {
        x: gx,
        z: gz,
        g: current.g + stepSize,
        h: 0,
        f: current.g + stepSize,
        parent: current,
      };
      break;
    }

    closed.add(key(current.x, current.z));

    for (const [dx, dz] of dirs) {
      const nx = current.x + dx;
      const nz = current.z + dz;
      const nKey = key(nx, nz);

      if (closed.has(nKey) || !isWorldCoordinateWalkable(nx, nz)) continue;

      const moveCost = dx !== 0 && dz !== 0 ? stepSize * 1.414 : stepSize;
      const gScore = current.g + moveCost;
      const hScore = heuristic(nx, nz, gx, gz);
      const existing = open.find((n) => n.x === nx && n.z === nz);

      if (!existing) {
        open.push({
          x: nx,
          z: nz,
          g: gScore,
          h: hScore,
          f: gScore + hScore,
          parent: current,
        });
      } else if (gScore < existing.g) {
        existing.g = gScore;
        existing.f = gScore + existing.h;
        existing.parent = current;
      }
    }
  }

  const rawPath: WaypointCoord[] = [];
  let cursor: AStarNode | undefined = bestNode;
  while (cursor) {
    rawPath.unshift({ x: cursor.x, z: cursor.z });
    cursor = cursor.parent;
  }

  // Ensure exact goal is at end and cap length
  if (rawPath.length > 1) {
    rawPath.shift(); // drop current cell
  }
  rawPath[rawPath.length - 1] = { x: Math.round(goal.x), z: Math.round(goal.z) };
  return rawPath.slice(0, Math.max(1, maxWaypoints));
}

/**
 * Role & Level metadata for NPCs (Trader, Guard, Marshal, Quest-Giver Elder, Blacksmith, Mystic)
 */
export interface NPCRoleBehaviorProfile {
  role: NPCRole;
  roleLabel: string;
  icon: string;
  primaryDuty: string;
  aiCapabilities: string[];
  levelScalingFormula: string;
}

export const NPC_ROLE_PROFILES: Record<NPCRole, NPCRoleBehaviorProfile> = {
  elder: {
    role: 'elder',
    roleLabel: 'Grand Quest-Giver & Lorekeeper',
    icon: '📜',
    primaryDuty: 'Generates dynamic realm quests, wards the Citadel, and guides cultivation breakthroughs.',
    aiCapabilities: [
      'Scans world threat level to issue radiant Monster Hunt & Resource Quests',
      'Projects Arcane Leyline Ward (+DEF% to Citadel during Storms)',
      'Seeks shelter inside the Sanctum during severe lightning tempests',
    ],
    levelScalingFormula: '+1.5% Quest EXP & Diamond bounty per 10 NPC levels',
  },
  guard: {
    role: 'guard',
    roleLabel: 'Citadel Vanguard Guard',
    icon: '🛡️',
    primaryDuty: 'Patrols outer perimeter roads, intercepts encroaching monsters, and defends resource nodes.',
    aiCapabilities: [
      'Autonomous A* perimeter patrol & monster aggro interception',
      'Engages nearby monsters in real-time skirmishes, chipping enemy HP',
      'Rallies to escort Caravan Traders when ambush predators approach',
    ],
    levelScalingFormula: 'Guard Strike Damage scales with Level^2 × 120',
  },
  marshal: {
    role: 'marshal',
    roleLabel: 'Supreme War Marshal',
    icon: '⚔️',
    primaryDuty: 'Commands garrison defense, coordinates boss rallies, and hunts elite/boss threats.',
    aiCapabilities: [
      'Prioritizes Elite & Boss monsters threatening resource harvesters',
      'Issues tactical counter-formation buffs (+ATK% to player legions)',
      'Executes heavy Armor-Piercing Halberd strikes on nearby monsters',
    ],
    levelScalingFormula: 'Command Aura grants +(Level / 15)% Legion Attack & Guard DPS',
  },
  merchant: {
    role: 'merchant',
    roleLabel: 'Traveling Caravan Trader',
    icon: '⚖️',
    primaryDuty: 'Travels between Resource Nodes and Solara Citadel offering live barter deals.',
    aiCapabilities: [
      'Dynamic route pathfinding between high-yield Resource Nodes and Castle Gate',
      'Adjusts barter exchange rates based on Weather & World Threat',
      'Triggers Evasive Maneuver & requests Guard escort when monsters enter 12m radius',
    ],
    levelScalingFormula: 'Unlocks higher-volume Diamond & rare resource barter lots with level',
  },
  blacksmith: {
    role: 'blacksmith',
    roleLabel: 'Master Runic Blacksmith',
    icon: '⚒️',
    primaryDuty: 'Prospects Steel/Copper veins autonomously and smites T1–T20 siege armaments.',
    aiCapabilities: [
      'Treks to Steel & Copper nodes to extract high-purity ore into NPC stash',
      'Returns to Citadel Anvil to smelt passive Steel & Copper reserves for the Lord',
      'Repairs Guard armor between monster skirmishes',
    ],
    levelScalingFormula: 'Passive Smelting Yield = Level × 180 Steel/Copper per AI cycle',
  },
  mystic: {
    role: 'mystic',
    roleLabel: 'Daoist Spirit Harvester',
    icon: '🔮',
    primaryDuty: 'Harvests spiritual Wood, Grain & Diamond nodes and purifies monster corruption.',
    aiCapabilities: [
      'Autonomously visits Wood, Grain & Diamond nodes to gather tithe stashes',
      'Dispels Abyssal/Titan corruption on resource veins',
      'Channels celestial weather harmony to boost realm gathering speed',
    ],
    levelScalingFormula: 'Autonomous Harvest Rate = Level × 150 Resources + Diamond Crystallization',
  },
};

/**
 * Selects the optimal Monster Attack Pattern and AI state based on monster level, HP ratio,
 * distance to player/guards, time of day, and weather.
 */
export function evaluateMonsterAIDecision(params: {
  monster: MonsterTarget;
  playerPos: WaypointCoord;
  npcs: NPC[];
  resourceNodes: ResourceNode[];
  weather: WeatherType;
  timeOfDayHours: number;
}): {
  nextState: MonsterAIBehaviorState;
  selectedPattern: MonsterAttackPattern;
  targetCoord: WaypointCoord;
  activeEnvInteraction: string;
  tacticalNote: string;
} {
  const { monster, playerPos, npcs, resourceNodes, weather, timeOfDayHours } = params;
  const profile = getMonsterComplexityByLevel(monster.level);
  const hpRatio = Number(monster.hp) / Math.max(1, Number(monster.maxHp));
  const isNight = timeOfDayHours < 6 || timeOfDayHours >= 18;

  // Find nearest guard/marshal NPC
  const guards = npcs.filter((n) => n.role === 'guard' || n.role === 'marshal');
  let nearestGuard: NPC | undefined;
  let nearestGuardDist = Infinity;
  for (const g of guards) {
    const d = Math.hypot(g.x - monster.x, g.z - monster.z);
    if (d < nearestGuardDist) {
      nearestGuardDist = d;
      nearestGuard = g;
    }
  }

  // Find nearest resource node
  let nearestNode: ResourceNode | undefined;
  let nearestNodeDist = Infinity;
  for (const node of resourceNodes) {
    const d = Math.hypot(node.x - monster.x, node.z - monster.z);
    if (d < nearestNodeDist) {
      nearestNodeDist = d;
      nearestNode = node;
    }
  }

  const distToPlayer = Math.hypot(playerPos.x - monster.x, playerPos.z - monster.z);

  // Determine environmental interaction
  let activeEnvInteraction = 'Scanning local terrain leylines';
  if (weather === 'storm' && profile.bracketId === 'bracket_1_feral') {
    activeEnvInteraction = 'Cowering in forest canopy from lightning (+20% Evasion)';
  } else if (weather === 'storm' && monster.level >= 500) {
    activeEnvInteraction = 'Sovereign Tempest Dominion (+55% Storm Attack)';
  } else if (isNight && monster.level >= 500) {
    activeEnvInteraction = 'Umbral Nocturne Empowerment (+40% Night Attack)';
  } else if (nearestNode && nearestNodeDist <= 12) {
    activeEnvInteraction = `Siphoning ${nearestNode.type.toUpperCase()} Lv.${nearestNode.level} vein (+${
      20 + Math.min(40, Math.floor(monster.level / 20))
    }% Power)`;
  } else if (weather === 'rain' && profile.bracketId === 'bracket_2_tactical') {
    activeEnvInteraction = 'Hydro-Stone Carapace Tempering (+6% HP Regen)';
  }

  // Select attack pattern based on complexity bracket & HP phase
  const patterns = profile.attackPatterns;
  let selectedPattern = patterns[0];
  if (profile.bracketId === 'bracket_5_apex_titan') {
    if (hpRatio < 0.35 && patterns[2]) {
      selectedPattern = patterns[2]; // Phase III Supernova
    } else if (hpRatio < 0.7 && patterns[1]) {
      selectedPattern = patterns[1]; // Phase II Dao Lance
    } else {
      selectedPattern = patterns[0]; // Phase I Starfall
    }
  } else if (patterns.length > 1) {
    if (hpRatio < 0.45 && patterns[patterns.length - 1]) {
      selectedPattern = patterns[patterns.length - 1];
    } else if (distToPlayer < 10 && patterns[1]) {
      selectedPattern = patterns[1];
    }
  }

  // State machine transition rules scaled by monster level (1..1000)
  if (hpRatio < 0.25 && monster.level <= 50) {
    // Low-level feral monsters flee toward forest edge when critically wounded
    const retreatTarget = nearestNode
      ? { x: nearestNode.x, z: nearestNode.z }
      : { x: monster.homeX ?? -26, z: monster.homeZ ?? -26 };
    return {
      nextState: 'seeking_shelter',
      selectedPattern,
      targetCoord: retreatTarget,
      activeEnvInteraction,
      tacticalNote: `Morale broken (<25% HP) — retreating toward cover at [${retreatTarget.x}, ${retreatTarget.z}].`,
    };
  }

  if (nearestGuard && nearestGuardDist <= 9) {
    return {
      nextState: 'clashing_guard',
      selectedPattern,
      targetCoord: { x: nearestGuard.x, z: nearestGuard.z },
      activeEnvInteraction,
      tacticalNote: `Engaged in melee clash with ${nearestGuard.name} using ${selectedPattern.name}!`,
    };
  }

  if (hpRatio < 0.4 && monster.level >= 200) {
    return {
      nextState: 'enraged_berserk',
      selectedPattern,
      targetCoord: { x: playerPos.x, z: playerPos.z },
      activeEnvInteraction,
      tacticalNote: `Enraged Phase triggered! Channeling ${selectedPattern.name} (${selectedPattern.windupSeconds}s telegraph).`,
    };
  }

  if (distToPlayer <= profile.aggroRadius * 0.65) {
    return {
      nextState: 'attack_windup',
      selectedPattern,
      targetCoord: { x: playerPos.x, z: playerPos.z },
      activeEnvInteraction,
      tacticalNote: `Target locked within ${Math.round(distToPlayer)}m — winding up ${selectedPattern.name}!`,
    };
  }

  if (distToPlayer <= profile.aggroRadius) {
    // Higher-level monsters compute a flanking offset instead of walking straight in
    if (monster.level >= 200) {
      const angle = Math.atan2(monster.z - playerPos.z, monster.x - playerPos.x) + Math.PI / 3;
      const flankX = Math.max(-32, Math.min(32, Math.round(playerPos.x + Math.cos(angle) * 8)));
      const flankZ = Math.max(-32, Math.min(32, Math.round(playerPos.z + Math.sin(angle) * 8)));
      return {
        nextState: 'flanking_march',
        selectedPattern,
        targetCoord: { x: flankX, z: flankZ },
        activeEnvInteraction,
        tacticalNote: `Executing ${profile.movementPolicyLabel} maneuver toward [${flankX}, ${flankZ}].`,
      };
    }
    return {
      nextState: 'stalking_player',
      selectedPattern,
      targetCoord: { x: playerPos.x, z: playerPos.z },
      activeEnvInteraction,
      tacticalNote: `Stalking Lord vanguard (${Math.round(distToPlayer)}m away).`,
    };
  }

  // Ambient / Resource Node interaction when out of player aggro
  if (nearestNode && nearestNodeDist <= 18) {
    return {
      nextState: 'siphoning_node',
      selectedPattern,
      targetCoord: { x: nearestNode.x, z: nearestNode.z },
      activeEnvInteraction,
      tacticalNote: `Approaching Lv.${nearestNode.level} ${nearestNode.type.toUpperCase()} vein to siphon energy.`,
    };
  }

  // Default patrol around home territory
  const homeX = monster.homeX ?? monster.x;
  const homeZ = monster.homeZ ?? monster.z;
  const patrolAngle = ((Date.now() / 4000 + monster.level) % (Math.PI * 2));
  const patrolX = Math.max(-33, Math.min(33, Math.round(homeX + Math.cos(patrolAngle) * 6)));
  const patrolZ = Math.max(-33, Math.min(33, Math.round(homeZ + Math.sin(patrolAngle) * 6)));

  return {
    nextState: 'patrolling',
    selectedPattern,
    targetCoord: { x: patrolX, z: patrolZ },
    activeEnvInteraction,
    tacticalNote: `Patrolling territory sector [${patrolX}, ${patrolZ}].`,
  };
}

/**
 * Evaluates an NPC's role, level (1–1000), current directive, and world context to determine
 * its next autonomous behavior state, waypoint target, and resource/combat output.
 */
export function evaluateNPCAIDecision(params: {
  npc: NPC;
  monsters: MonsterTarget[];
  resourceNodes: ResourceNode[];
  weather: WeatherType;
  timeOfDayHours: number;
}): {
  nextState: NPCAIBehaviorState;
  targetCoord: WaypointCoord;
  statusActionText: string;
  gatheredDelta: Partial<Record<ResourceType, bigint>>;
  monsterDamageDealt?: { monsterId: string; damage: bigint };
} {
  const { npc, monsters, resourceNodes, weather, timeOfDayHours } = params;
  const directive: NPCDirective = npc.directive || 'autonomous';
  const isNight = timeOfDayHours < 6 || timeOfDayHours >= 18;

  // Find nearest living monster
  let nearestMonster: MonsterTarget | undefined;
  let nearestMonsterDist = Infinity;
  for (const m of monsters) {
    if (m.hp <= 0n) continue;
    const d = Math.hypot(m.x - npc.x, m.z - npc.z);
    if (d < nearestMonsterDist) {
      nearestMonsterDist = d;
      nearestMonster = m;
    }
  }

  // 1. Honor explicit player directives first
  if (directive === 'hunt_monsters' && nearestMonster) {
    const inStrikeRange = nearestMonsterDist <= 8;
    const strikeDmg = BigInt(npc.level * npc.level * 95);
    return {
      nextState: inStrikeRange ? 'combating_monster' : 'intercepting_monster',
      targetCoord: { x: nearestMonster.x, z: nearestMonster.z },
      statusActionText: inStrikeRange
        ? `Striking ${nearestMonster.name} (Lv.${nearestMonster.level}) for ${strikeDmg.toLocaleString()} DMG!`
        : `Marching to intercept ${nearestMonster.name} at [${Math.round(nearestMonster.x)}, ${Math.round(nearestMonster.z)}]`,
      gatheredDelta: {},
      monsterDamageDealt: inStrikeRange
        ? { monsterId: nearestMonster.id, damage: strikeDmg }
        : undefined,
    };
  }

  if (directive === 'gather_resources' && resourceNodes.length > 0) {
    const preferredNode =
      npc.role === 'blacksmith'
        ? resourceNodes.find((n) => n.type === 'steel' || n.type === 'copper') || resourceNodes[0]
        : resourceNodes.find((n) => n.type === 'diamond' || n.type === 'wood' || n.type === 'grain') ||
          resourceNodes[0];

    const yieldAmt = BigInt(npc.level * 160);
    return {
      nextState: 'gathering_resource',
      targetCoord: { x: preferredNode.x, z: preferredNode.z },
      statusActionText: `Harvesting Lv.${preferredNode.level} ${preferredNode.type.toUpperCase()} Node (+${yieldAmt.toLocaleString()}/tick)`,
      gatheredDelta: { [preferredNode.type]: yieldAmt },
    };
  }

  if (directive === 'patrol_citadel') {
    const patrolWaypoints: WaypointCoord[] = [
      { x: 12, z: 12 },
      { x: -12, z: 12 },
      { x: -12, z: -12 },
      { x: 12, z: -12 },
    ];
    const wp = patrolWaypoints[Math.floor((Date.now() / 5000 + npc.level) % patrolWaypoints.length)];
    return {
      nextState: 'patrolling_citadel',
      targetCoord: wp,
      statusActionText: `Patrolling Solara Citadel bastion perimeter [${wp.x}, ${wp.z}]`,
      gatheredDelta: {},
    };
  }

  // 2. Role-specific autonomous behavior trees scaled by NPC level (1–1000)
  switch (npc.role) {
    case 'guard':
    case 'marshal': {
      const aggroRange = npc.role === 'marshal' ? 28 : 22;
      if (nearestMonster && nearestMonsterDist <= aggroRange) {
        const inMelee = nearestMonsterDist <= 8.5;
        const baseDmg = BigInt(npc.level * npc.level * (npc.role === 'marshal' ? 140 : 100));
        return {
          nextState: inMelee ? 'combating_monster' : 'intercepting_monster',
          targetCoord: { x: nearestMonster.x, z: nearestMonster.z },
          statusActionText: inMelee
            ? `Clashing with ${nearestMonster.name} (Lv.${nearestMonster.level})!`
            : `Intercepting encroaching ${nearestMonster.name} (${Math.round(nearestMonsterDist)}m)`,
          gatheredDelta: {},
          monsterDamageDealt: inMelee
            ? { monsterId: nearestMonster.id, damage: baseDmg }
            : undefined,
        };
      }
      const guardCircuit: WaypointCoord[] = [
        { x: 0, z: 12 },
        { x: 14, z: 10 },
        { x: -14, z: 10 },
      ];
      const target = guardCircuit[Math.floor((Date.now() / 6000 + npc.level) % guardCircuit.length)];
      return {
        nextState: 'patrolling_citadel',
        targetCoord: target,
        statusActionText: isNight
          ? `Night Watch Patrol along Citadel Gate [${target.x}, ${target.z}]`
          : `Vanguard Garrison Patrol [${target.x}, ${target.z}]`,
        gatheredDelta: {},
      };
    }

    case 'merchant': {
      // Trader checks for nearby monsters along caravan route
      if (nearestMonster && nearestMonsterDist <= 13) {
        const safeGate: WaypointCoord = { x: 4, z: 12 };
        return {
          nextState: 'evading_threat',
          targetCoord: safeGate,
          statusActionText: `Evading ${nearestMonster.name}! Rerouting caravan to Citadel Gate!`,
          gatheredDelta: { copper: BigInt(npc.level * 60) },
        };
      }
      const tradeStops: WaypointCoord[] = [
        { x: 10, z: 14 },
        { x: -12, z: 22 },
        { x: 16, z: 26 },
      ];
      const stop = tradeStops[Math.floor((Date.now() / 7000) % tradeStops.length)];
      return {
        nextState: 'caravan_trading',
        targetCoord: stop,
        statusActionText:
          weather === 'storm'
            ? `Storm Surge Pricing Active — Offering Hazard Barter Deals`
            : `Caravan Bazaar Open at [${stop.x}, ${stop.z}] — Appraising Rare Gems`,
        gatheredDelta: {
          copper: BigInt(npc.level * 110),
          diamond: BigInt(Math.max(2, Math.floor(npc.level / 90))),
        },
      };
    }

    case 'blacksmith': {
      const oreNode =
        resourceNodes.find((n) => n.type === 'steel' || n.type === 'copper') || resourceNodes[0];
      const cyclePhase = Math.floor((Date.now() / 8000) % 2);
      if (cyclePhase === 0 && oreNode) {
        const steelYield = BigInt(npc.level * 190);
        const copperYield = BigInt(npc.level * 140);
        return {
          nextState: 'gathering_resource',
          targetCoord: { x: oreNode.x, z: oreNode.z },
          statusActionText: `Prospecting Lv.${oreNode.level} ${oreNode.type.toUpperCase()} vein for runic ingots`,
          gatheredDelta: { steel: steelYield, copper: copperYield },
        };
      }
      return {
        nextState: 'forging_armaments',
        targetCoord: { x: npc.homeX ?? -10, z: npc.homeZ ?? 14 },
        statusActionText: `Smelting T${Math.min(20, Math.max(6, Math.floor(npc.level / 25)))} Runic Warplate at Citadel Forge`,
        gatheredDelta: { steel: BigInt(npc.level * 120) },
      };
    }

    case 'mystic': {
      const spiritNode =
        resourceNodes.find((n) => n.type === 'diamond' || n.type === 'wood' || n.type === 'grain') ||
        resourceNodes[0];
      const woodYield = BigInt(npc.level * 175);
      const grainYield = BigInt(npc.level * 195);
      const diamondYield = BigInt(Math.max(5, Math.floor(npc.level / 40)));
      return {
        nextState: weather === 'storm' ? 'channeling_blessing' : 'gathering_resource',
        targetCoord: spiritNode
          ? { x: spiritNode.x, z: spiritNode.z }
          : { x: npc.homeX ?? -16, z: npc.homeZ ?? -12 },
        statusActionText:
          weather === 'storm'
            ? `Channeling Nine-Heavens Tempest Array (+25% Realm Qi & Harvest)`
            : `Harvesting Spiritual Leyline at ${spiritNode?.type.toUpperCase() || 'WOOD'} Node`,
        gatheredDelta: {
          wood: woodYield,
          grain: grainYield,
          diamond: diamondYield,
        },
      };
    }

    case 'elder':
    default: {
      if (weather === 'storm') {
        return {
          nextState: 'channeling_blessing',
          targetCoord: { x: npc.homeX ?? 10, z: npc.homeZ ?? 14 },
          statusActionText: `Projecting Arcane Aegis Dome over Solara Citadel`,
          gatheredDelta: { diamond: BigInt(Math.max(3, Math.floor(npc.level / 50))) },
        };
      }
      return {
        nextState: 'offering_quest',
        targetCoord: { x: npc.homeX ?? 10, z: npc.homeZ ?? 14 },
        statusActionText:
          npc.activeQuest && !npc.activeQuest.claimed
            ? `Radiant Commission Ready: "${npc.activeQuest.title}"`
            : `Observing Realm Leylines & Preparing Commissions`,
        gatheredDelta: { grain: BigInt(npc.level * 90) },
      };
    }
  }
}

/**
 * Steps a 2D position smoothly toward the first waypoint in a path, returning the updated
 * coordinate and remaining waypoints.
 */
export function stepActorAlongPath(
  current: WaypointCoord,
  waypoints: WaypointCoord[],
  stepDistance: number
): { nextPos: WaypointCoord; remainingWaypoints: WaypointCoord[] } {
  if (!waypoints || waypoints.length === 0) {
    return { nextPos: current, remainingWaypoints: [] };
  }

  const target = waypoints[0];
  const dx = target.x - current.x;
  const dz = target.z - current.z;
  const dist = Math.hypot(dx, dz);

  if (dist <= stepDistance) {
    return {
      nextPos: { x: target.x, z: target.z },
      remainingWaypoints: waypoints.slice(1),
    };
  }

  const ratio = stepDistance / dist;
  const nx = Math.round((current.x + dx * ratio) * 10) / 10;
  const nz = Math.round((current.z + dz * ratio) * 10) / 10;

  return {
    nextPos: { x: nx, z: nz },
    remainingWaypoints: waypoints,
  };
}

/**
 * Generates a level-scaled Radiant Quest from an NPC based on their level (1–1000) and role.
 */
export function generateRadiantQuestForNPC(npc: NPC, castleLevel: number): Quest {
  const scaleMult = BigInt(Math.max(1, Math.floor(npc.level / 25) + castleLevel));

  if (npc.role === 'marshal' || npc.role === 'guard') {
    return {
      id: `quest_${npc.id}_${Date.now().toString(36).slice(-4)}`,
      title: `Vanguard Purge: Cull Threatening Beasts`,
      description: `${npc.name} (Lv.${npc.level}) requests an immediate strike or AI skirmish against encroaching monsters.`,
      requiredLevel: Math.max(1, Math.floor(npc.level / 20)),
      targetType: 'defeat_monster',
      targetAmount: 1n,
      currentAmount: 1n, // Ready to claim or complete via combat
      completed: true,
      claimed: false,
      rewardExp: 45_000n * scaleMult,
      rewardDiamonds: 120n * scaleMult,
      rewardResources: {
        steel: 85_000n * scaleMult,
        oil: 45_000n * scaleMult,
      },
    };
  }

  if (npc.role === 'blacksmith') {
    return {
      id: `quest_${npc.id}_${Date.now().toString(36).slice(-4)}`,
      title: `Imperial Forge Quota: Smelt Heavy Alloys`,
      description: `${npc.name} has prepared runic molds requiring high-purity Steel and Copper reserves.`,
      requiredLevel: Math.max(1, Math.floor(npc.level / 20)),
      targetType: 'gather_resource',
      targetAmount: 100_000n,
      currentAmount: 100_000n,
      completed: true,
      claimed: false,
      rewardExp: 35_000n * scaleMult,
      rewardDiamonds: 95n * scaleMult,
      rewardResources: {
        steel: 140_000n * scaleMult,
        copper: 110_000n * scaleMult,
      },
    };
  }

  return {
    id: `quest_${npc.id}_${Date.now().toString(36).slice(-4)}`,
    title: `Sanctum Decree: Fortify the Realm Leylines`,
    description: `${npc.name} (Lv.${npc.level}) has charted a surge in ambient world energy around Solara Citadel.`,
    requiredLevel: Math.max(1, Math.floor(npc.level / 25)),
    targetType: 'upgrade_castle',
    targetAmount: 1n,
    currentAmount: 1n,
    completed: true,
    claimed: false,
    rewardExp: 50_000n * scaleMult,
    rewardDiamonds: 150n * scaleMult,
    rewardResources: {
      wood: 120_000n * scaleMult,
      grain: 120_000n * scaleMult,
    },
  };
}

/**
 * Advances the entire Open-World AI simulation by one step, updating NPCs, Monsters,
 * A* paths, autonomous resource gathering stashes, guard-vs-monster combat damage,
 * and generating World AI telemetry logs.
 */
export function tickWorldAI(params: {
  npcs: NPC[];
  monsters: MonsterTarget[];
  resourceNodes: ResourceNode[];
  playerPos: WaypointCoord;
  weather: WeatherType;
  timeOfDayHours: number;
}): {
  updatedNpcs: NPC[];
  updatedMonsters: MonsterTarget[];
  newLogs: WorldAIEventLog[];
} {
  const { npcs, monsters, resourceNodes, playerPos, weather, timeOfDayHours } = params;
  const newLogs: WorldAIEventLog[] = [];
  const monsterDamageMap = new Map<string, { totalDmg: bigint; attackerName: string }>();

  // 1. Update NPCs
  const updatedNpcs = npcs.map((npc) => {
    const decision = evaluateNPCAIDecision({
      npc,
      monsters,
      resourceNodes,
      weather,
      timeOfDayHours,
    });

    const path = computeAIPath({ x: npc.x, z: npc.z }, decision.targetCoord, 5);
    const moveStep = npc.role === 'guard' || npc.role === 'marshal' ? 2.4 : 1.8;
    const stepped = stepActorAlongPath({ x: npc.x, z: npc.z }, path, moveStep);

    // Accumulate gathered resources in NPC stash
    const currentStash: Partial<Record<ResourceType, bigint>> = { ...(npc.gatheredStash || {}) };
    Object.entries(decision.gatheredDelta).forEach(([resKey, amt]) => {
      const k = resKey as ResourceType;
      if (amt && amt > 0n) {
        currentStash[k] = (currentStash[k] || 0n) + amt;
      }
    });

    // Record monster damage if guard/marshal struck a monster
    if (decision.monsterDamageDealt) {
      const { monsterId, damage } = decision.monsterDamageDealt;
      const prev = monsterDamageMap.get(monsterId);
      monsterDamageMap.set(monsterId, {
        totalDmg: (prev?.totalDmg || 0n) + damage,
        attackerName: npc.name,
      });
    }

    if (decision.nextState !== npc.aiState) {
      newLogs.push({
        id: `ai_npc_${npc.id}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        timestamp: Date.now(),
        actorName: npc.name,
        actorType: 'npc',
        actorLevel: npc.level,
        category:
          decision.nextState === 'combating_monster' || decision.nextState === 'intercepting_monster'
            ? 'combat'
            : decision.nextState === 'gathering_resource' || decision.nextState === 'forging_armaments'
            ? 'gathering'
            : decision.nextState === 'caravan_trading'
            ? 'trade'
            : 'pathfinding',
        message: `[${NPC_ROLE_PROFILES[npc.role].roleLabel}] ${decision.statusActionText}`,
      });
    }

    return {
      ...npc,
      x: stepped.nextPos.x,
      z: stepped.nextPos.z,
      aiState: decision.nextState,
      statusActionText: decision.statusActionText,
      pathWaypoints: stepped.remainingWaypoints,
      gatheredStash: currentStash,
    };
  });

  // 2. Update Monsters (Level 1 to 1000 scaling)
  const updatedMonsters = monsters.map((monster) => {
    const profile = getMonsterComplexityByLevel(monster.level);
    const guardHit = monsterDamageMap.get(monster.id);

    let nextHp = monster.hp;
    if (guardHit && guardHit.totalDmg > 0n) {
      // Keep at least 10% HP from autonomous guard chip so player can still finish or rally, or respawn if defeated
      const minFloor = monster.maxHp / 10n;
      nextHp = monster.hp > guardHit.totalDmg + minFloor ? monster.hp - guardHit.totalDmg : minFloor;
    }

    const decision = evaluateMonsterAIDecision({
      monster: { ...monster, hp: nextHp },
      playerPos,
      npcs: updatedNpcs,
      resourceNodes,
      weather,
      timeOfDayHours,
    });

    // Regeneration from environmental interactions
    if (decision.activeEnvInteraction.includes('Regen') || decision.nextState === 'siphoning_node') {
      const regenAmt = monster.maxHp / 50n; // +2% HP
      nextHp = nextHp + regenAmt > monster.maxHp ? monster.maxHp : nextHp + regenAmt;
    }

    const path = computeAIPath(
      { x: monster.x, z: monster.z },
      decision.targetCoord,
      profile.pathfindingMaxNodes
    );
    const speed =
      decision.nextState === 'enraged_berserk'
        ? 2.6
        : decision.nextState === 'flanking_march'
        ? 2.2
        : 1.5;
    const stepped = stepActorAlongPath({ x: monster.x, z: monster.z }, path, speed);

    const nextTelegraph =
      decision.nextState === 'attack_windup' ||
      decision.nextState === 'enraged_berserk' ||
      decision.nextState === 'clashing_guard'
        ? ((monster.telegraphProgress || 0) + 0.35) % 1
        : 0;

    if (decision.nextState !== monster.aiState || guardHit) {
      newLogs.push({
        id: `ai_mon_${monster.id}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        timestamp: Date.now(),
        actorName: monster.name,
        actorType: 'monster',
        actorLevel: monster.level,
        category:
          decision.nextState === 'siphoning_node'
            ? 'environment'
            : decision.nextState === 'attack_windup' ||
              decision.nextState === 'enraged_berserk' ||
              decision.nextState === 'clashing_guard'
            ? 'combat'
            : 'pathfinding',
        message: guardHit
          ? `Clashed with ${guardHit.attackerName} (-${guardHit.totalDmg.toLocaleString()} HP) · ${decision.tacticalNote}`
          : `${decision.tacticalNote} [${decision.activeEnvInteraction}]`,
      });
    }

    return {
      ...monster,
      hp: nextHp,
      x: stepped.nextPos.x,
      z: stepped.nextPos.z,
      aiState: decision.nextState,
      movementPolicy: profile.movementPolicy,
      complexityBracket: profile.bracketId,
      activeAttackPatternId: decision.selectedPattern.id,
      telegraphProgress: Number(nextTelegraph.toFixed(2)),
      pathWaypoints: stepped.remainingWaypoints,
      activeEnvInteraction: decision.activeEnvInteraction,
      aggroRadius: profile.aggroRadius,
    };
  });

  return {
    updatedNpcs,
    updatedMonsters,
    newLogs,
  };
}
