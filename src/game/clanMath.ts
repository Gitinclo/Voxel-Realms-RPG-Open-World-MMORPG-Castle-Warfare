/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClanMember, ClanRole, ClanPermissions } from '../types/game';

export const ROLE_HIERARCHY: Record<ClanRole, number> = {
  Leader: 5,
  Elder: 4,
  Elite: 3,
  Member: 2,
  Recruit: 1,
};

export function getRolePermissions(role: ClanRole): ClanPermissions {
  switch (role) {
    case 'Leader':
      return {
        canDeclareWar: true,
        canTriggerBuffs: true,
        canWithdrawVault: true,
        canPromoteDemote: true,
        canKickMembers: true,
        canApproveJoin: true,
        canEditEmblem: true,
        canPostAnnouncements: true,
      };
    case 'Elder':
      return {
        canDeclareWar: false,
        canTriggerBuffs: true,
        canWithdrawVault: true,
        canPromoteDemote: true, // can promote up to Elite, cannot promote to Elder/Leader
        canKickMembers: true, // can kick Recruit/Member
        canApproveJoin: true,
        canEditEmblem: false,
        canPostAnnouncements: true,
      };
    case 'Elite':
      return {
        canDeclareWar: false,
        canTriggerBuffs: false,
        canWithdrawVault: true,
        canPromoteDemote: false,
        canKickMembers: false,
        canApproveJoin: false,
        canEditEmblem: false,
        canPostAnnouncements: false,
      };
    case 'Member':
    case 'Recruit':
    default:
      return {
        canDeclareWar: false,
        canTriggerBuffs: false,
        canWithdrawVault: false,
        canPromoteDemote: false,
        canKickMembers: false,
        canApproveJoin: false,
        canEditEmblem: false,
        canPostAnnouncements: false,
      };
  }
}

export function canPromoteMember(actorRole: ClanRole, targetRole: ClanRole): boolean {
  if (actorRole === 'Leader') {
    return targetRole !== 'Leader'; // Leader can promote anyone up to Elder
  }
  if (actorRole === 'Elder') {
    return targetRole === 'Recruit' || targetRole === 'Member'; // Elder can promote Recruit->Member, Member->Elite
  }
  return false;
}

export function canDemoteMember(actorRole: ClanRole, targetRole: ClanRole): boolean {
  if (actorRole === 'Leader') {
    return targetRole !== 'Leader';
  }
  if (actorRole === 'Elder') {
    return targetRole === 'Elite' || targetRole === 'Member';
  }
  return false;
}

export function canKickMember(actorRole: ClanRole, targetRole: ClanRole): boolean {
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}

export function validateClanCreation(params: {
  name: string;
  tag: string;
  minCastleLevel: number;
}): { valid: boolean; error?: string } {
  const trimmedName = params.name.trim();
  const trimmedTag = params.tag.trim().toUpperCase();

  if (trimmedName.length < 3 || trimmedName.length > 24) {
    return { valid: false, error: 'Clan name must be between 3 and 24 characters.' };
  }
  if (trimmedTag.length < 2 || trimmedTag.length > 6) {
    return { valid: false, error: 'Clan tag must be between 2 and 6 letters.' };
  }
  if (!/^[A-Z0-9]+$/.test(trimmedTag)) {
    return { valid: false, error: 'Clan tag must contain only uppercase letters and numbers.' };
  }
  if (params.minCastleLevel < 0 || params.minCastleLevel > 100) {
    return { valid: false, error: 'Minimum castle level must be between 0 and 100.' };
  }
  return { valid: true };
}

export function calculateClanTotalPower(
  members: ClanMember[],
  techLevelMultiplier: number = 1.0,
  warVictories: number = 0
): bigint {
  const sumMembers = members.reduce((sum, m) => sum + m.power, 0n);
  const victoryBonus = BigInt(warVictories) * 50_000_000n;
  const scaled = Number(sumMembers) * techLevelMultiplier;
  return BigInt(Math.floor(scaled)) + victoryBonus;
}

export function calculateOutpostAssault(
  strikeForceAttack: bigint,
  outpostDefense: bigint
): { conquered: boolean; damageDealt: bigint; pointsEarned: number } {
  if (strikeForceAttack <= 0n) {
    return { conquered: false, damageDealt: 0n, pointsEarned: 0 };
  }
  const damage =
    strikeForceAttack > outpostDefense / 2n
      ? strikeForceAttack - outpostDefense / 3n
      : strikeForceAttack / 2n;
  const effectiveDamage = damage > 1n ? damage : 1n;
  const conquered = effectiveDamage >= outpostDefense;
  const points = conquered
    ? 250
    : Math.max(10, Math.floor(Number((effectiveDamage * 100n) / (outpostDefense || 1n))));

  return {
    conquered,
    damageDealt: effectiveDamage,
    pointsEarned: points,
  };
}

export function calculateCoopBossStrike(
  strikeForceAttack: bigint,
  bossDefense: bigint,
  activeBuffBonusPct: number = 0
): bigint {
  const buffMult = 1 + activeBuffBonusPct / 100;
  const baseDmg =
    strikeForceAttack > bossDefense ? strikeForceAttack - bossDefense / 2n : strikeForceAttack / 3n;
  const finalDmg = Number(baseDmg > 1n ? baseDmg : 1n) * buffMult;
  return BigInt(Math.max(1, Math.floor(finalDmg)));
}

export type TerritorySectorType =
  'citadel' | 'obelisk' | 'leyline' | 'watchtower' | 'depot' | 'causeway';

export interface TerritoryGridSector {
  outpostId: string;
  sectorCode: string; // e.g., 'A1' .. 'C3'
  row: number; // 0 .. 2
  col: number; // 0 .. 2
  name: string;
  sectorType: TerritorySectorType;
  controlledBy: 'player_clan' | 'enemy_clan' | 'neutral';
  defenseRating: bigint;
  garrisonTroops: bigint;
  pointsPerMinute: number;
  strategicBonus: string;
  isFrontlineContested: boolean;
  assaultWinProbabilityPct: number;
}

export interface TerritoryControlSummary {
  totalSectors: number;
  playerControlledCount: number;
  enemyControlledCount: number;
  neutralCount: number;
  playerControlPct: number;
  enemyControlPct: number;
  neutralControlPct: number;
  playerPointsPerMinute: number;
  enemyPointsPerMinute: number;
  frontlineSectorsCount: number;
  dominanceStatus:
    'Sovereign Dominance' | 'Tactical Advantage' | 'Contested Frontline' | 'Enemy Encirclement';
}

interface DefaultSectorBlueprint {
  outpostId: string;
  sectorCode: string;
  row: number;
  col: number;
  name: string;
  sectorType: TerritorySectorType;
  defaultControlledBy: 'player_clan' | 'enemy_clan' | 'neutral';
  defaultDefenseRating: bigint;
  defaultGarrisonTroops: bigint;
  defaultPointsPerMinute: number;
  strategicBonus: string;
}

export const DEFAULT_TERRITORY_SECTOR_BLUEPRINTS: DefaultSectorBlueprint[] = [
  {
    outpostId: 'outpost_solara_watch',
    sectorCode: 'A1',
    row: 0,
    col: 0,
    name: 'Solara Watchtower',
    sectorType: 'watchtower',
    defaultControlledBy: 'player_clan',
    defaultDefenseRating: 12_000_000n,
    defaultGarrisonTroops: 95_000n,
    defaultPointsPerMinute: 15,
    strategicBonus: '+10% Western Flank Recon & Early Raid Warning',
  },
  {
    outpostId: 'outpost_sunken_obelisk',
    sectorCode: 'A2',
    row: 0,
    col: 1,
    name: 'Sunken Obelisk',
    sectorType: 'obelisk',
    defaultControlledBy: 'player_clan',
    defaultDefenseRating: 15_000_000n,
    defaultGarrisonTroops: 120_000n,
    defaultPointsPerMinute: 20,
    strategicBonus: '+15% Arcane Shieldbearer Resilience',
  },
  {
    outpostId: 'outpost_ashfall_ridge',
    sectorCode: 'A3',
    row: 0,
    col: 2,
    name: 'Ashfall Ridge Bastion',
    sectorType: 'watchtower',
    defaultControlledBy: 'enemy_clan',
    defaultDefenseRating: 22_000_000n,
    defaultGarrisonTroops: 210_000n,
    defaultPointsPerMinute: 30,
    strategicBonus: '+12% High-Ground Shooter Volley Range',
  },
  {
    outpostId: 'outpost_azure_leyline',
    sectorCode: 'B1',
    row: 1,
    col: 0,
    name: 'Azure Leyline Sanctum',
    sectorType: 'leyline',
    defaultControlledBy: 'player_clan',
    defaultDefenseRating: 18_000_000n,
    defaultGarrisonTroops: 160_000n,
    defaultPointsPerMinute: 25,
    strategicBonus: '+18% Spiritual Qi & Clan Honor Harvest',
  },
  {
    outpostId: 'outpost_dragon_spire',
    sectorCode: 'B2',
    row: 1,
    col: 1,
    name: 'Dragon Spire',
    sectorType: 'obelisk',
    defaultControlledBy: 'neutral',
    defaultDefenseRating: 25_000_000n,
    defaultGarrisonTroops: 250_000n,
    defaultPointsPerMinute: 35,
    strategicBonus: '+20% All-Legion March Speed Across Central Rift',
  },
  {
    outpostId: 'outpost_iron_citadel',
    sectorCode: 'B3',
    row: 1,
    col: 2,
    name: 'Iron Citadel Fortress',
    sectorType: 'citadel',
    defaultControlledBy: 'enemy_clan',
    defaultDefenseRating: 30_000_000n,
    defaultGarrisonTroops: 400_000n,
    defaultPointsPerMinute: 50,
    strategicBonus: '+25% Siege Bomber Artillery Payload',
  },
  {
    outpostId: 'outpost_verdant_granary',
    sectorCode: 'C1',
    row: 2,
    col: 0,
    name: 'Verdant Supply Depot',
    sectorType: 'depot',
    defaultControlledBy: 'neutral',
    defaultDefenseRating: 14_000_000n,
    defaultGarrisonTroops: 110_000n,
    defaultPointsPerMinute: 20,
    strategicBonus: '-15% Garrison Upkeep & +20% Grain Supply',
  },
  {
    outpostId: 'outpost_starfall_bridge',
    sectorCode: 'C2',
    row: 2,
    col: 1,
    name: 'Starfall Causeway',
    sectorType: 'causeway',
    defaultControlledBy: 'enemy_clan',
    defaultDefenseRating: 26_000_000n,
    defaultGarrisonTroops: 280_000n,
    defaultPointsPerMinute: 35,
    strategicBonus: '+15% Southern Vanguard Reinforcement Velocity',
  },
  {
    outpostId: 'outpost_chronos_dreadkeep',
    sectorCode: 'C3',
    row: 2,
    col: 2,
    name: 'Chronos Dread Keep',
    sectorType: 'citadel',
    defaultControlledBy: 'enemy_clan',
    defaultDefenseRating: 38_000_000n,
    defaultGarrisonTroops: 520_000n,
    defaultPointsPerMinute: 60,
    strategicBonus: '+30% Sovereign War Score & Heavy Garrison Cap',
  },
];

export function buildClanTerritoryGrid(
  outposts: {
    id: string;
    name: string;
    controlledBy: 'player_clan' | 'enemy_clan' | 'neutral';
    defenseRating: bigint;
    pointsPerMinute: number;
    garrisonTroops: bigint;
  }[],
  playerPower: bigint = 25_000_000n
): TerritoryGridSector[] {
  const outpostById = new Map(outposts.map((o) => [o.id, o]));

  const initialCells = DEFAULT_TERRITORY_SECTOR_BLUEPRINTS.map((bp, idx) => {
    const matched = outpostById.get(bp.outpostId) || outposts[idx];
    const controlledBy =
      matched && matched.id === bp.outpostId ? matched.controlledBy : bp.defaultControlledBy;
    const defenseRating =
      matched && matched.id === bp.outpostId ? matched.defenseRating : bp.defaultDefenseRating;
    const garrisonTroops =
      matched && matched.id === bp.outpostId ? matched.garrisonTroops : bp.defaultGarrisonTroops;
    const pointsPerMinute =
      matched && matched.id === bp.outpostId ? matched.pointsPerMinute : bp.defaultPointsPerMinute;
    const name = matched && matched.id === bp.outpostId ? matched.name : bp.name;

    const assaultEval = calculateOutpostAssault(playerPower, defenseRating);
    const ratioPct =
      defenseRating > 0n
        ? Math.min(99, Math.max(8, Number((assaultEval.damageDealt * 100n) / defenseRating)))
        : 99;
    const assaultWinProbabilityPct = assaultEval.conquered ? 99 : ratioPct;

    return {
      outpostId: bp.outpostId,
      sectorCode: bp.sectorCode,
      row: bp.row,
      col: bp.col,
      name,
      sectorType: bp.sectorType,
      controlledBy,
      defenseRating,
      garrisonTroops,
      pointsPerMinute,
      strategicBonus: bp.strategicBonus,
      isFrontlineContested: false,
      assaultWinProbabilityPct,
    };
  });

  // Determine frontline contested status: any sector orthogonally adjacent to an opposing controller
  return initialCells.map((cell) => {
    const neighbors = initialCells.filter(
      (other) => Math.abs(other.row - cell.row) + Math.abs(other.col - cell.col) === 1
    );
    const isFrontlineContested =
      cell.controlledBy === 'neutral' ||
      neighbors.some(
        (n) =>
          (cell.controlledBy === 'player_clan' && n.controlledBy === 'enemy_clan') ||
          (cell.controlledBy === 'enemy_clan' && n.controlledBy === 'player_clan')
      );

    return {
      ...cell,
      isFrontlineContested,
    };
  });
}

export function evaluateTerritoryControlSummary(
  grid: TerritoryGridSector[]
): TerritoryControlSummary {
  const totalSectors = grid.length || 1;
  let playerControlledCount = 0;
  let enemyControlledCount = 0;
  let neutralCount = 0;
  let playerPointsPerMinute = 0;
  let enemyPointsPerMinute = 0;
  let frontlineSectorsCount = 0;

  for (const sector of grid) {
    if (sector.isFrontlineContested) {
      frontlineSectorsCount += 1;
    }
    if (sector.controlledBy === 'player_clan') {
      playerControlledCount += 1;
      playerPointsPerMinute += sector.pointsPerMinute;
    } else if (sector.controlledBy === 'enemy_clan') {
      enemyControlledCount += 1;
      enemyPointsPerMinute += sector.pointsPerMinute;
    } else {
      neutralCount += 1;
    }
  }

  const playerControlPct = Math.round((playerControlledCount / totalSectors) * 100);
  const enemyControlPct = Math.round((enemyControlledCount / totalSectors) * 100);
  const neutralControlPct = Math.max(0, 100 - playerControlPct - enemyControlPct);

  let dominanceStatus: TerritoryControlSummary['dominanceStatus'] = 'Contested Frontline';
  if (playerControlledCount >= Math.ceil(totalSectors * 0.65)) {
    dominanceStatus = 'Sovereign Dominance';
  } else if (playerControlledCount > enemyControlledCount) {
    dominanceStatus = 'Tactical Advantage';
  } else if (enemyControlledCount >= Math.ceil(totalSectors * 0.65)) {
    dominanceStatus = 'Enemy Encirclement';
  }

  return {
    totalSectors: grid.length,
    playerControlledCount,
    enemyControlledCount,
    neutralCount,
    playerControlPct,
    enemyControlPct,
    neutralControlPct,
    playerPointsPerMinute,
    enemyPointsPerMinute,
    frontlineSectorsCount,
    dominanceStatus,
  };
}
