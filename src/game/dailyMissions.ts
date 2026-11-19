/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameResources, ResourceType } from '../types/game';
import { CultivationEra, CultivationPath, PlayerCultivationState } from '../types/cultivation';
import {
  CULTIVATION_PATH_LIST,
  CULTIVATION_PATH_META,
  calculateQiRequired,
  getRealmDef,
} from './cultivationMath';

export const DAILY_MISSIONS_STORAGE_KEY = 'voxel_realms_daily_missions_v1';
export const MISSIONS_PER_BOARD = 5;
export const FREE_REROLLS_PER_DAY = 1;
export const PAID_REROLL_DIAMOND_COST = 150n;

export type DailyMissionCategory =
  | 'cultivation_meditate'
  | 'resource_harvest'
  | 'pill_alchemy'
  | 'manual_study'
  | 'troop_muster'
  | 'boss_skirmish'
  | 'citadel_expansion'
  | 'market_caravan';

export type DailyMissionGroup = 'cultivation' | 'materials' | 'warfare';

export type DailyMissionDifficulty = 'standard' | 'veteran' | 'grandmaster';

export type DailyMissionDestinationModal =
  'cultivation' | 'resources' | 'troops' | 'world_boss' | 'castle' | 'marketplace';

export interface DailyMissionRewardBundle {
  resources: GameResources;
  spiritStones: bigint;
  scriptureFragments: number;
  veteranScrolls: number;
  cultivationEnergy: bigint;
  cultivationPath: CultivationPath;
}

export interface DailyMissionTask {
  id: string;
  templateId: string;
  title: string;
  description: string;
  category: DailyMissionCategory;
  group: DailyMissionGroup;
  difficulty: DailyMissionDifficulty;
  era: CultivationEra;
  scaledRealmIndex: number;
  scaledRealmName: string;
  targetPath?: CultivationPath;
  targetResource?: ResourceType;
  destinationModal: DailyMissionDestinationModal;
  destinationLabel: string;
  dispatchActionLabel: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  claimed: boolean;
  rewards: DailyMissionRewardBundle;
}

export interface DailyMissionMilestone {
  id: 'milestone_3' | 'milestone_5';
  requiredClaimed: number;
  title: string;
  subtitle: string;
  claimed: boolean;
  rewards: DailyMissionRewardBundle;
}

export interface DailyMissionBoardState {
  dateKey: string;
  cycleIndex: number;
  rerollsUsedToday: number;
  seedNonce: number;
  generatedForRealmIndex: number;
  generatedForLayer: number;
  generatedForEra: CultivationEra;
  totalMissionsCompletedLifetime: number;
  totalCyclesCompletedToday: number;
  missions: DailyMissionTask[];
  milestones: DailyMissionMilestone[];
}

export interface CultivationLevelSummary {
  highestRealmIndex: number;
  averageRealmIndex: number;
  highestLayer: number;
  dominantPath: CultivationPath;
  era: CultivationEra;
  realmName: string;
  eraLabel: string;
  powerScaleMultiplier: number;
}

const ERA_LABELS: Record<CultivationEra, string> = {
  mortal: 'Mortal Era',
  immortal_sage: 'Immortal Sage Era',
  chaos_dao: 'Chaos Dao Era',
  ultimate_origin: 'Ultimate Origin Era',
};

const RESOURCE_LABELS: Record<ResourceType, string> = {
  wood: 'Spirit Timber',
  steel: 'Refined Steel',
  copper: 'Imperial Copper',
  grain: 'Spirit Grain',
  oil: 'Siege Oil',
  diamond: 'Imperial Diamonds',
};

const MATERIAL_POOL: ResourceType[] = ['wood', 'steel', 'copper', 'grain', 'oil'];

interface MissionTemplate {
  templateId: string;
  category: DailyMissionCategory;
  group: DailyMissionGroup;
  destinationModal: DailyMissionDestinationModal;
  destinationLabel: string;
  dispatchActionLabel: string;
  baseTarget: number;
  usesPath: boolean;
  usesResource: boolean;
  eraTitles: Record<CultivationEra, string>;
  buildDescription: (ctx: {
    targetCount: number;
    realmName: string;
    path?: CultivationPath;
    resource?: ResourceType;
  }) => string;
}

const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    templateId: 'meditate_path',
    category: 'cultivation_meditate',
    group: 'cultivation',
    destinationModal: 'cultivation',
    destinationLabel: 'Open Cultivation',
    dispatchActionLabel: 'Channel Session',
    baseTarget: 3,
    usesPath: true,
    usesResource: false,
    eraTitles: {
      mortal: 'Secluded Meridian Circulation',
      immortal_sage: 'Celestial Leyline Absorption',
      chaos_dao: 'Primordial Dao Breath Tempering',
      ultimate_origin: 'White Page Origin Meditation',
    },
    buildDescription: ({ targetCount, realmName, path }) => {
      const meta = CULTIVATION_PATH_META[path ?? 'qi'];
      return `Complete ${targetCount} ${meta.name} meditation sessions attuned to ${realmName}.`;
    },
  },
  {
    templateId: 'harvest_materials',
    category: 'resource_harvest',
    group: 'materials',
    destinationModal: 'resources',
    destinationLabel: 'Open Harvest',
    dispatchActionLabel: 'Survey Vein',
    baseTarget: 2,
    usesPath: false,
    usesResource: true,
    eraTitles: {
      mortal: 'Frontier Vein Extraction',
      immortal_sage: 'Spirit Mineral Requisition',
      chaos_dao: 'Chaos Rift Material Harvest',
      ultimate_origin: 'Omniverse Vault Collection',
    },
    buildDescription: ({ targetCount, realmName, resource }) => {
      const resLabel = RESOURCE_LABELS[resource ?? 'wood'];
      return `Gather ${resLabel} shipments ${targetCount} times for ${realmName} refinement stores.`;
    },
  },
  {
    templateId: 'alchemy_refinement',
    category: 'pill_alchemy',
    group: 'cultivation',
    destinationModal: 'cultivation',
    destinationLabel: 'Open Alchemy',
    dispatchActionLabel: 'Refine Batch',
    baseTarget: 2,
    usesPath: true,
    usesResource: false,
    eraTitles: {
      mortal: 'Spirit Furnace Elixir Trial',
      immortal_sage: 'Nine-Turn Immortal Alchemy',
      chaos_dao: 'Chaos Core Cauldron Forging',
      ultimate_origin: 'Origin Essence Elixir Synthesis',
    },
    buildDescription: ({ targetCount, realmName, path }) => {
      const meta = CULTIVATION_PATH_META[path ?? 'qi'];
      return `Refine ${targetCount} cultivation pill batches aligned with ${meta.name} at ${realmName}.`;
    },
  },
  {
    templateId: 'scripture_study',
    category: 'manual_study',
    group: 'cultivation',
    destinationModal: 'cultivation',
    destinationLabel: 'Open Manuals',
    dispatchActionLabel: 'Deduce Verse',
    baseTarget: 2,
    usesPath: true,
    usesResource: false,
    eraTitles: {
      mortal: 'Jade Slip Scripture Study',
      immortal_sage: 'Immortal Pavilion Deduction',
      chaos_dao: 'Great Dao Manual Comprehension',
      ultimate_origin: 'House of Ideas Canon Study',
    },
    buildDescription: ({ targetCount, realmName }) =>
      `Deduce or upgrade ${targetCount} cultivation manuals to deepen ${realmName} insights.`,
  },
  {
    templateId: 'troop_garrison',
    category: 'troop_muster',
    group: 'warfare',
    destinationModal: 'troops',
    destinationLabel: 'Open Barracks',
    dispatchActionLabel: 'Drill Cohort',
    baseTarget: 2,
    usesPath: false,
    usesResource: false,
    eraTitles: {
      mortal: 'Citadel Garrison Muster',
      immortal_sage: 'Immortal Legion Conscription',
      chaos_dao: 'Chaos Banner Mobilization',
      ultimate_origin: 'Sovereign Vanguard Enlistment',
    },
    buildDescription: ({ targetCount, realmName }) =>
      `Enlist or drill ${targetCount} troop cohorts equipped for ${realmName} campaigns.`,
  },
  {
    templateId: 'titan_hunt',
    category: 'boss_skirmish',
    group: 'warfare',
    destinationModal: 'world_boss',
    destinationLabel: 'Open Rally',
    dispatchActionLabel: 'Run Skirmish',
    baseTarget: 2,
    usesPath: false,
    usesResource: false,
    eraTitles: {
      mortal: 'Wilderness Beast Suppression',
      immortal_sage: 'Abyssal Sovereign Hunt',
      chaos_dao: 'Chaos Behemoth Subjugation',
      ultimate_origin: 'Apex World Titan Strike',
    },
    buildDescription: ({ targetCount, realmName }) =>
      `Engage and strike hostile monsters or world bosses ${targetCount} times at ${realmName} tier.`,
  },
  {
    templateId: 'citadel_fortify',
    category: 'citadel_expansion',
    group: 'materials',
    destinationModal: 'castle',
    destinationLabel: 'Open Castle',
    dispatchActionLabel: 'Reinforce Wall',
    baseTarget: 1,
    usesPath: false,
    usesResource: false,
    eraTitles: {
      mortal: 'Keep Bastion Fortification',
      immortal_sage: 'Immortal Array Reinforcement',
      chaos_dao: 'Void-Warded Citadel Construction',
      ultimate_origin: 'Eternal Sovereign Bastion Works',
    },
    buildDescription: ({ targetCount, realmName }) =>
      `Complete ${targetCount} citadel fortification or clan vault contributions supporting ${realmName}.`,
  },
  {
    templateId: 'caravan_ledger',
    category: 'market_caravan',
    group: 'materials',
    destinationModal: 'marketplace',
    destinationLabel: 'Open Market',
    dispatchActionLabel: 'Settle Order',
    baseTarget: 2,
    usesPath: false,
    usesResource: true,
    eraTitles: {
      mortal: 'Merchant Guild Supply Order',
      immortal_sage: 'Celestial Caravan Arbitration',
      chaos_dao: 'Inter-Realm Material Exchange',
      ultimate_origin: 'Grand Imperial Treasury Contract',
    },
    buildDescription: ({ targetCount, resource }) => {
      const resLabel = RESOURCE_LABELS[resource ?? 'copper'];
      return `Settle ${targetCount} marketplace or caravan material orders involving ${resLabel}.`;
    },
  },
];

/**
 * Deterministic string hash (FNV-1a 32-bit) for repeatable seeded randomization.
 */
function hashSeedString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Mulberry32 deterministic PRNG returning values in [0, 1).
 */
function createSeededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function scaleBigInt(base: bigint, mult: number): bigint {
  return BigInt(Math.max(1, Math.round(Number(base) * mult)));
}

/**
 * Summarizes the player's current Four-Path cultivation progression for mission scaling.
 */
export function summarizeCultivationLevel(
  cultivation: PlayerCultivationState
): CultivationLevelSummary {
  let highestRealmIndex = Math.max(0, Math.min(22, cultivation.currentRealmIndex ?? 0));
  let highestLayer = Math.max(1, Math.min(9, cultivation.currentLayer ?? 1));
  let dominantPath: CultivationPath = 'qi';
  let sumRealm = 0;

  for (const path of CULTIVATION_PATH_LIST) {
    const prog = cultivation.paths?.[path];
    if (!prog) continue;
    const clampedRealm = Math.max(0, Math.min(22, prog.realmIndex));
    const clampedLayer = Math.max(1, Math.min(9, prog.layer));
    sumRealm += clampedRealm;
    if (
      clampedRealm > highestRealmIndex ||
      (clampedRealm === highestRealmIndex && clampedLayer > highestLayer)
    ) {
      highestRealmIndex = clampedRealm;
      highestLayer = clampedLayer;
      dominantPath = path;
    }
  }

  const averageRealmIndex = Number((sumRealm / CULTIVATION_PATH_LIST.length).toFixed(2));
  const realmDef = getRealmDef(dominantPath, highestRealmIndex);
  // Smooth monotonic scaling curve: 1.0x at Realm 0 L1 up to ~12.4x at Realm 22 L9
  const realmFactor = 1 + highestRealmIndex * 0.45 + averageRealmIndex * 0.06;
  const layerFactor = 1 + (highestLayer - 1) * 0.035;
  const powerScaleMultiplier = Number((realmFactor * layerFactor).toFixed(2));

  return {
    highestRealmIndex,
    averageRealmIndex,
    highestLayer,
    dominantPath,
    era: realmDef.era,
    realmName: realmDef.name,
    eraLabel: ERA_LABELS[realmDef.era],
    powerScaleMultiplier,
  };
}

function buildRewardBundle(params: {
  difficulty: DailyMissionDifficulty;
  summary: CultivationLevelSummary;
  targetPath: CultivationPath;
  targetResource?: ResourceType;
  isMilestone?: 'milestone_3' | 'milestone_5';
}): DailyMissionRewardBundle {
  const diffMult =
    params.difficulty === 'grandmaster' ? 2.1 : params.difficulty === 'veteran' ? 1.45 : 1.0;
  const milestoneMult =
    params.isMilestone === 'milestone_5' ? 3.2 : params.isMilestone === 'milestone_3' ? 1.85 : 1.0;
  const totalMult = params.summary.powerScaleMultiplier * diffMult * milestoneMult;

  const focusBonus = (res: ResourceType): number => (params.targetResource === res ? 1.45 : 1.0);

  const wood = scaleBigInt(45_000n, totalMult * focusBonus('wood'));
  const steel = scaleBigInt(36_000n, totalMult * focusBonus('steel'));
  const copper = scaleBigInt(32_000n, totalMult * focusBonus('copper'));
  const grain = scaleBigInt(52_000n, totalMult * focusBonus('grain'));
  const oil = scaleBigInt(22_000n, totalMult * focusBonus('oil'));
  const diamond = scaleBigInt(
    110n,
    (1 + params.summary.highestRealmIndex * 0.16) * diffMult * milestoneMult
  );

  const spiritStones = scaleBigInt(3_500n, totalMult);
  const scriptureFragments = Math.max(
    4,
    Math.round((6 + params.summary.highestRealmIndex * 1.1) * diffMult * milestoneMult)
  );
  const veteranScrolls =
    params.isMilestone === 'milestone_5' ? 1 : params.difficulty === 'grandmaster' ? 1 : 0;

  // Cultivation energy scales with the player's actual current layer requirement (capped cleanly)
  const reqForLayer = calculateQiRequired(
    params.summary.highestRealmIndex,
    params.summary.highestLayer,
    params.targetPath
  );
  const pctNum =
    params.isMilestone === 'milestone_5'
      ? 22n
      : params.isMilestone === 'milestone_3'
        ? 12n
        : params.difficulty === 'grandmaster'
          ? 14n
          : params.difficulty === 'veteran'
            ? 9n
            : 5n;
  const cultivationEnergy = (reqForLayer * pctNum) / 100n + 2_500n;

  return {
    resources: {
      wood,
      steel,
      copper,
      grain,
      oil,
      diamond,
    },
    spiritStones,
    scriptureFragments,
    veteranScrolls,
    cultivationEnergy,
    cultivationPath: params.targetPath,
  };
}

/**
 * Generates a fresh randomized Daily Mission board tailored to the player's current cultivation level.
 * Guarantees at least 1 cultivation task and 1 material-harvest/economy task plus 3 varied commissions.
 */
export function generateDailyMissionBoard(params: {
  dateKey: string;
  cultivation: PlayerCultivationState;
  cycleIndex?: number;
  rerollsUsedToday?: number;
  seedNonce?: number;
  totalMissionsCompletedLifetime?: number;
  totalCyclesCompletedToday?: number;
}): DailyMissionBoardState {
  const cycleIndex = Math.max(1, Math.floor(params.cycleIndex ?? 1));
  const rerollsUsedToday = Math.max(0, Math.floor(params.rerollsUsedToday ?? 0));
  const seedNonce = Math.max(0, Math.floor(params.seedNonce ?? 0));
  const summary = summarizeCultivationLevel(params.cultivation);

  const seedStr = `${params.dateKey}|c${cycleIndex}|n${seedNonce}|r${summary.highestRealmIndex}|e${summary.era}`;
  const rng = createSeededRng(hashSeedString(seedStr));

  const cultivationTemplates = MISSION_TEMPLATES.filter((t) => t.group === 'cultivation');
  const materialTemplates = MISSION_TEMPLATES.filter((t) => t.group === 'materials');
  const guaranteedCultivation =
    cultivationTemplates[Math.floor(rng() * cultivationTemplates.length)];
  const guaranteedMaterial = materialTemplates[Math.floor(rng() * materialTemplates.length)];

  const remainingPool = shuffleWithRng(
    MISSION_TEMPLATES.filter(
      (t) =>
        t.templateId !== guaranteedCultivation.templateId &&
        t.templateId !== guaranteedMaterial.templateId
    ),
    rng
  );

  const pickedTemplates = shuffleWithRng(
    [guaranteedCultivation, guaranteedMaterial, ...remainingPool.slice(0, MISSIONS_PER_BOARD - 2)],
    rng
  );

  // Assign a balanced difficulty spread: 2 standard, 2 veteran, 1 grandmaster
  const difficultySlots = shuffleWithRng<DailyMissionDifficulty>(
    ['standard', 'standard', 'veteran', 'veteran', 'grandmaster'],
    rng
  );

  const eraTargetBonus =
    summary.era === 'ultimate_origin'
      ? 2
      : summary.era === 'chaos_dao'
        ? 1
        : summary.era === 'immortal_sage'
          ? 1
          : 0;

  const missions: DailyMissionTask[] = pickedTemplates.map((tpl, idx) => {
    const difficulty = difficultySlots[idx] ?? 'standard';
    const diffTargetBonus = difficulty === 'grandmaster' ? 2 : difficulty === 'veteran' ? 1 : 0;
    const targetCount = Math.max(1, tpl.baseTarget + eraTargetBonus + diffTargetBonus);
    const targetPath = tpl.usesPath
      ? CULTIVATION_PATH_LIST[Math.floor(rng() * CULTIVATION_PATH_LIST.length)]
      : summary.dominantPath;
    const targetResource = tpl.usesResource
      ? MATERIAL_POOL[Math.floor(rng() * MATERIAL_POOL.length)]
      : undefined;

    const rewards = buildRewardBundle({
      difficulty,
      summary,
      targetPath,
      targetResource,
    });

    return {
      id: `dm_${params.dateKey}_c${cycleIndex}_n${seedNonce}_${idx + 1}_${tpl.templateId}`,
      templateId: tpl.templateId,
      title: tpl.eraTitles[summary.era],
      description: tpl.buildDescription({
        targetCount,
        realmName: summary.realmName,
        path: targetPath,
        resource: targetResource,
      }),
      category: tpl.category,
      group: tpl.group,
      difficulty,
      era: summary.era,
      scaledRealmIndex: summary.highestRealmIndex,
      scaledRealmName: summary.realmName,
      targetPath: tpl.usesPath ? targetPath : undefined,
      targetResource,
      destinationModal: tpl.destinationModal,
      destinationLabel: tpl.destinationLabel,
      dispatchActionLabel: tpl.dispatchActionLabel,
      targetCount,
      currentCount: 0,
      completed: false,
      claimed: false,
      rewards,
    };
  });

  const milestones: DailyMissionMilestone[] = [
    {
      id: 'milestone_3',
      requiredClaimed: 3,
      title: 'Commission Supply Cache',
      subtitle: 'Claim 3 daily commissions in the current cycle',
      claimed: false,
      rewards: buildRewardBundle({
        difficulty: 'veteran',
        summary,
        targetPath: summary.dominantPath,
        isMilestone: 'milestone_3',
      }),
    },
    {
      id: 'milestone_5',
      requiredClaimed: 5,
      title: 'Grand Cultivation Material Vault',
      subtitle: 'Claim all 5 commissions (+1 Veteran Scroll & Free Next Cycle)',
      claimed: false,
      rewards: buildRewardBundle({
        difficulty: 'grandmaster',
        summary,
        targetPath: summary.dominantPath,
        isMilestone: 'milestone_5',
      }),
    },
  ];

  return {
    dateKey: params.dateKey,
    cycleIndex,
    rerollsUsedToday,
    seedNonce,
    generatedForRealmIndex: summary.highestRealmIndex,
    generatedForLayer: summary.highestLayer,
    generatedForEra: summary.era,
    totalMissionsCompletedLifetime: params.totalMissionsCompletedLifetime ?? 0,
    totalCyclesCompletedToday: params.totalCyclesCompletedToday ?? 0,
    missions,
    milestones,
  };
}

/**
 * Advances progress on a specific mission by ID (e.g., interactive dispatch action).
 */
export function advanceDailyMissionById(
  board: DailyMissionBoardState,
  missionId: string,
  delta: number = 1
): { updatedBoard: DailyMissionBoardState; advancedMission: DailyMissionTask | null } {
  const safeDelta = Math.max(1, Math.floor(delta));
  let advancedMission: DailyMissionTask | null = null;

  const missions = board.missions.map((m) => {
    if (m.id !== missionId || m.claimed || m.completed) return m;
    const nextCount = Math.min(m.targetCount, m.currentCount + safeDelta);
    const updated: DailyMissionTask = {
      ...m,
      currentCount: nextCount,
      completed: nextCount >= m.targetCount,
    };
    advancedMission = updated;
    return updated;
  });

  return {
    updatedBoard: advancedMission ? { ...board, missions } : board,
    advancedMission,
  };
}

/**
 * Advances progress on all active missions matching a real gameplay event category.
 */
export function recordDailyMissionEvent(
  board: DailyMissionBoardState,
  category: DailyMissionCategory,
  delta: number = 1,
  filter?: { path?: CultivationPath; resource?: ResourceType }
): { updatedBoard: DailyMissionBoardState; updatedCount: number; newlyCompletedIds: string[] } {
  const safeDelta = Math.max(1, Math.floor(delta));
  let updatedCount = 0;
  const newlyCompletedIds: string[] = [];

  const missions = board.missions.map((m) => {
    if (m.category !== category || m.claimed || m.completed) return m;
    if (filter?.path && m.targetPath && m.targetPath !== filter.path) {
      return m;
    }
    if (filter?.resource && m.targetResource && m.targetResource !== filter.resource) {
      return m;
    }
    const nextCount = Math.min(m.targetCount, m.currentCount + safeDelta);
    const completedNow = nextCount >= m.targetCount;
    updatedCount += 1;
    if (completedNow && !m.completed) {
      newlyCompletedIds.push(m.id);
    }
    return {
      ...m,
      currentCount: nextCount,
      completed: completedNow,
    };
  });

  return {
    updatedBoard: updatedCount > 0 ? { ...board, missions } : board,
    updatedCount,
    newlyCompletedIds,
  };
}

/**
 * Applies a DailyMissionRewardBundle to both GameResources and PlayerCultivationState immutably.
 */
export function applyMissionRewardBundle(params: {
  resources: GameResources;
  cultivation: PlayerCultivationState;
  reward: DailyMissionRewardBundle;
}): {
  nextResources: GameResources;
  nextCultivation: PlayerCultivationState;
} {
  const { resources, cultivation, reward } = params;
  const nextResources: GameResources = {
    wood: resources.wood + reward.resources.wood,
    steel: resources.steel + reward.resources.steel,
    copper: resources.copper + reward.resources.copper,
    grain: resources.grain + reward.resources.grain,
    oil: resources.oil + reward.resources.oil,
    diamond: resources.diamond + reward.resources.diamond,
  };

  const targetPath = reward.cultivationPath;
  const prevPathProg = cultivation.paths[targetPath];
  const nextEnergy = (prevPathProg?.currentEnergy ?? 0n) + reward.cultivationEnergy;

  const nextCultivation: PlayerCultivationState = {
    ...cultivation,
    currentQi: targetPath === 'qi' ? nextEnergy : cultivation.currentQi,
    paths: {
      ...cultivation.paths,
      [targetPath]: {
        ...prevPathProg,
        currentEnergy: nextEnergy,
      },
    },
    spiritStones: (cultivation.spiritStones ?? 0n) + reward.spiritStones,
    scriptureFragments: cultivation.scriptureFragments + reward.scriptureFragments,
    veteranScrolls: (cultivation.veteranScrolls ?? 0) + reward.veteranScrolls,
  };

  return { nextResources, nextCultivation };
}

/**
 * Claims a completed daily mission's rewards (idempotent: refuses incomplete or already claimed).
 */
export function claimDailyMissionReward(
  board: DailyMissionBoardState,
  missionId: string
): {
  claimed: boolean;
  updatedBoard: DailyMissionBoardState;
  reward: DailyMissionRewardBundle | null;
  mission: DailyMissionTask | null;
} {
  const target = board.missions.find((m) => m.id === missionId);
  if (!target || !target.completed || target.claimed) {
    return { claimed: false, updatedBoard: board, reward: null, mission: null };
  }

  const missions = board.missions.map((m) => (m.id === missionId ? { ...m, claimed: true } : m));
  const allClaimedNow = missions.every((m) => m.claimed);

  return {
    claimed: true,
    updatedBoard: {
      ...board,
      missions,
      totalMissionsCompletedLifetime: board.totalMissionsCompletedLifetime + 1,
      totalCyclesCompletedToday: allClaimedNow
        ? board.totalCyclesCompletedToday + 1
        : board.totalCyclesCompletedToday,
    },
    reward: target.rewards,
    mission: { ...target, claimed: true },
  };
}

/**
 * Claims a daily milestone chest once enough missions in the current cycle have been claimed.
 */
export function claimDailyMissionMilestone(
  board: DailyMissionBoardState,
  milestoneId: 'milestone_3' | 'milestone_5'
): {
  claimed: boolean;
  updatedBoard: DailyMissionBoardState;
  reward: DailyMissionRewardBundle | null;
  milestone: DailyMissionMilestone | null;
} {
  const claimedCount = board.missions.filter((m) => m.claimed).length;
  const target = board.milestones.find((ms) => ms.id === milestoneId);
  if (!target || target.claimed || claimedCount < target.requiredClaimed) {
    return { claimed: false, updatedBoard: board, reward: null, milestone: null };
  }

  const milestones = board.milestones.map((ms) =>
    ms.id === milestoneId ? { ...ms, claimed: true } : ms
  );

  return {
    claimed: true,
    updatedBoard: { ...board, milestones },
    reward: target.rewards,
    milestone: { ...target, claimed: true },
  };
}

/**
 * Determines whether the player can reroll or start a new repeatable mission cycle and its Diamond cost.
 */
export function evaluateBoardRefreshOption(board: DailyMissionBoardState): {
  isCycleComplete: boolean;
  isFree: boolean;
  diamondCost: bigint;
  label: string;
} {
  const isCycleComplete = board.missions.every((m) => m.claimed);
  if (isCycleComplete) {
    return {
      isCycleComplete: true,
      isFree: true,
      diamondCost: 0n,
      label: 'Start Next Cycle (Free)',
    };
  }
  if (board.rerollsUsedToday < FREE_REROLLS_PER_DAY) {
    return {
      isCycleComplete: false,
      isFree: true,
      diamondCost: 0n,
      label: 'Refresh Tasks (Free)',
    };
  }
  return {
    isCycleComplete: false,
    isFree: false,
    diamondCost: PAID_REROLL_DIAMOND_COST,
    label: `Refresh Tasks (${PAID_REROLL_DIAMOND_COST.toString()} Diamonds)`,
  };
}

/**
 * Rerolls the current board or begins a new repeatable cycle using the player's latest cultivation level.
 */
export function refreshDailyMissionBoard(params: {
  board: DailyMissionBoardState;
  cultivation: PlayerCultivationState;
  playerDiamonds: bigint;
  bypassCost?: boolean;
}): {
  ok: boolean;
  diamondCostPaid: bigint;
  updatedBoard: DailyMissionBoardState;
  reason?: string;
} {
  const option = evaluateBoardRefreshOption(params.board);
  const cost = params.bypassCost ? 0n : option.diamondCost;

  if (!option.isFree && !params.bypassCost && params.playerDiamonds < cost) {
    return {
      ok: false,
      diamondCostPaid: 0n,
      updatedBoard: params.board,
      reason: `Need ${cost.toString()} Diamonds to refresh tasks early, or finish the remaining commissions for a free new cycle.`,
    };
  }

  const nextCycleIndex = option.isCycleComplete
    ? params.board.cycleIndex + 1
    : params.board.cycleIndex;
  const nextRerollsUsed = option.isCycleComplete
    ? params.board.rerollsUsedToday
    : params.board.rerollsUsedToday + 1;

  const updatedBoard = generateDailyMissionBoard({
    dateKey: params.board.dateKey,
    cultivation: params.cultivation,
    cycleIndex: nextCycleIndex,
    rerollsUsedToday: nextRerollsUsed,
    seedNonce: params.board.seedNonce + 1,
    totalMissionsCompletedLifetime: params.board.totalMissionsCompletedLifetime,
    totalCyclesCompletedToday: params.board.totalCyclesCompletedToday,
  });

  return {
    ok: true,
    diamondCostPaid: cost,
    updatedBoard,
  };
}

/**
 * Ensures the mission board matches the current calendar day, preserving lifetime stats across resets.
 */
export function syncBoardForDate(
  board: DailyMissionBoardState | null | undefined,
  dateKey: string,
  cultivation: PlayerCultivationState
): DailyMissionBoardState {
  if (
    !board ||
    board.dateKey !== dateKey ||
    !Array.isArray(board.missions) ||
    board.missions.length === 0
  ) {
    return generateDailyMissionBoard({
      dateKey,
      cultivation,
      cycleIndex: 1,
      rerollsUsedToday: 0,
      seedNonce: 0,
      totalMissionsCompletedLifetime: board?.totalMissionsCompletedLifetime ?? 0,
      totalCyclesCompletedToday: 0,
    });
  }
  return board;
}

/**
 * Counts unclaimed completed missions + claimable milestone chests for HUD notification indicators.
 */
export function countClaimableDailyMissions(board: DailyMissionBoardState): number {
  const readyMissions = board.missions.filter((m) => m.completed && !m.claimed).length;
  const claimedCount = board.missions.filter((m) => m.claimed).length;
  const readyMilestones = board.milestones.filter(
    (ms) => !ms.claimed && claimedCount >= ms.requiredClaimed
  ).length;
  return readyMissions + readyMilestones;
}

/**
 * BigInt-safe JSON serialization for persisting DailyMissionBoardState in localStorage.
 */
export function serializeDailyMissionBoard(board: DailyMissionBoardState): string {
  return JSON.stringify(board, (_key, value) =>
    typeof value === 'bigint' ? { __bigint: value.toString() } : value
  );
}

/**
 * BigInt-safe JSON deserialization with structural validation.
 */
export function deserializeDailyMissionBoard(raw: string): DailyMissionBoardState | null {
  try {
    const parsed = JSON.parse(raw, (_key, value) => {
      if (
        value &&
        typeof value === 'object' &&
        typeof (value as { __bigint?: unknown }).__bigint === 'string' &&
        Object.keys(value as Record<string, unknown>).length === 1
      ) {
        return BigInt((value as { __bigint: string }).__bigint);
      }
      return value;
    }) as Partial<DailyMissionBoardState>;

    if (
      !parsed ||
      typeof parsed.dateKey !== 'string' ||
      !Array.isArray(parsed.missions) ||
      !Array.isArray(parsed.milestones)
    ) {
      return null;
    }

    // Validate reward BigInt types to prevent corrupted storage crashes
    for (const m of parsed.missions) {
      if (
        !m ||
        typeof m.id !== 'string' ||
        !m.rewards ||
        typeof m.rewards.spiritStones !== 'bigint' ||
        typeof m.rewards.cultivationEnergy !== 'bigint' ||
        typeof m.rewards.resources?.wood !== 'bigint'
      ) {
        return null;
      }
    }

    return parsed as DailyMissionBoardState;
  } catch {
    return null;
  }
}
