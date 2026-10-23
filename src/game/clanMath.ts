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
