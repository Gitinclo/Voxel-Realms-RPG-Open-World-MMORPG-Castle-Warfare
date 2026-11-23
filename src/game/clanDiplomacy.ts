/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ClanDiplomacyState,
  ClanDiplomaticLogAction,
  ClanDiplomaticLogEntry,
  ClanDiplomaticProposal,
  ClanDiplomaticRelation,
  ClanDiplomaticStance,
  ClanLeaderboardEntry,
  ClanRole,
  ClanTreatyProposalType,
} from '../types/game';
import { getRolePermissions } from './clanMath';

export const MAX_ACTIVE_ALLIES = 3;
export const MAX_ACTIVE_NAPS = 5;
export const DEFAULT_NAP_DURATION_DAYS = 14;
export const DEFAULT_ALLIANCE_DURATION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface DiplomaticStanceMeta {
  stance: ClanDiplomaticStance;
  label: string;
  shortLabel: string;
  effectSummary: string;
  rallyAttackBonusPct: number;
  tradeYieldBonusPct: number;
  warHonorBonusPct: number;
}

export const DIPLOMATIC_STANCE_META: Record<ClanDiplomaticStance, DiplomaticStanceMeta> = {
  allied: {
    stance: 'allied',
    label: 'Sovereign Alliance',
    shortLabel: 'Allied',
    effectSummary: '+10% Joint Rally Might, Shared Sector Defense & Open Garrison Passage',
    rallyAttackBonusPct: 10,
    tradeYieldBonusPct: 8,
    warHonorBonusPct: 0,
  },
  nap: {
    stance: 'nap',
    label: 'Non-Aggression Pact (NAP)',
    shortLabel: 'NAP',
    effectSummary: 'Zero-Raid Protected Borders & +5% Inter-Clan Caravan Trade Yield',
    rallyAttackBonusPct: 0,
    tradeYieldBonusPct: 5,
    warHonorBonusPct: 0,
  },
  neutral: {
    stance: 'neutral',
    label: 'Neutral Standing',
    shortLabel: 'Neutral',
    effectSummary: 'Standard Realm Rules — Open to Alliance, NAP, or War Declarations',
    rallyAttackBonusPct: 0,
    tradeYieldBonusPct: 0,
    warHonorBonusPct: 0,
  },
  war: {
    stance: 'war',
    label: 'State of War',
    shortLabel: 'At War',
    effectSummary: 'Active Territory Hostilities, Outpost Siege Enabled & +15% War Honor',
    rallyAttackBonusPct: 0,
    tradeYieldBonusPct: 0,
    warHonorBonusPct: 15,
  },
};

export interface DiplomacyRoleAuthority {
  canViewDiplomacy: boolean;
  canManageNapAndPeace: boolean;
  canManageAlliances: boolean;
  canDeclareWar: boolean;
}

export function getDiplomacyAuthority(role: ClanRole): DiplomacyRoleAuthority {
  const perms = getRolePermissions(role);
  return {
    canViewDiplomacy: true,
    canManageNapAndPeace: role === 'Leader' || role === 'Elder',
    canManageAlliances: role === 'Leader',
    canDeclareWar: perms.canDeclareWar,
  };
}

export function clampTrustScore(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildInitialDiplomacyState(
  worldClans: ClanLeaderboardEntry[],
  activeWarClanId: string | null = 'clan_chronos',
  now: number = Date.now()
): ClanDiplomacyState {
  const externalClans = worldClans.filter((c) => !c.isPlayerClan);

  const relations: ClanDiplomaticRelation[] = externalClans.map((clan) => {
    if (clan.id === activeWarClanId || clan.id === 'clan_chronos') {
      return {
        clanId: clan.id,
        stance: 'war',
        sinceTimestamp: now - 3 * DAY_MS,
        trustScore: 12,
        pactTerms: 'Active 9-Sector Territory Siege over Iron Citadel & Ashfall Ridge.',
      };
    }
    if (clan.id === 'clan_nova') {
      return {
        clanId: clan.id,
        stance: 'allied',
        sinceTimestamp: now - 11 * DAY_MS,
        treatyExpiresAt: now + 19 * DAY_MS,
        trustScore: 88,
        pactTerms: 'Mutual Defense Covenant & Joint Void Rift Raid Support.',
      };
    }
    if (clan.id === 'clan_apex') {
      return {
        clanId: clan.id,
        stance: 'nap',
        sinceTimestamp: now - 6 * DAY_MS,
        treatyExpiresAt: now + 8 * DAY_MS,
        trustScore: 68,
        pactTerms: '14-Day Border Non-Aggression Pact across Southern Verdant Routes.',
      };
    }
    return {
      clanId: clan.id,
      stance: 'neutral',
      sinceTimestamp: now - 14 * DAY_MS,
      trustScore: 46,
      pactTerms: 'No formal treaty currently signed.',
    };
  });

  const voidClan = externalClans.find((c) => c.id === 'clan_void');
  const proposals: ClanDiplomaticProposal[] = voidClan
    ? [
        {
          id: 'prop_void_nap_init',
          targetClanId: voidClan.id,
          targetClanName: voidClan.name,
          targetClanTag: voidClan.tag,
          direction: 'incoming',
          proposalType: 'nap',
          proposedBy: voidClan.leader,
          message:
            'We propose a 14-day Non-Aggression Pact to secure our eastern supply convoys while Chronos Imperium marches.',
          createdAt: now - 2 * 60 * 60 * 1000,
          durationDays: DEFAULT_NAP_DURATION_DAYS,
        },
      ]
    : [];

  const history: ClanDiplomaticLogEntry[] = [
    {
      id: 'dip_log_war_chronos',
      timestamp: now - 3 * DAY_MS,
      targetClanId: 'clan_chronos',
      targetClanName: 'Chronos Imperium',
      targetClanTag: 'TITAN',
      action: 'war_declared',
      actorName: 'Lord Chronos',
      summary: 'War declared over Iron Citadel Fortress and Ashfall Ridge.',
    },
    {
      id: 'dip_log_nap_apex',
      timestamp: now - 6 * DAY_MS,
      targetClanId: 'clan_apex',
      targetClanName: 'Iron Vanguard',
      targetClanTag: 'APEX',
      action: 'nap_signed',
      actorName: 'ShadowFang',
      summary: 'Signed a 14-day Non-Aggression Pact protecting shared trade lanes.',
    },
    {
      id: 'dip_log_ally_nova',
      timestamp: now - 11 * DAY_MS,
      targetClanId: 'clan_nova',
      targetClanName: 'Astral Dominion',
      targetClanTag: 'NOVA',
      action: 'alliance_formed',
      actorName: 'Queen Seraphina',
      summary: 'Ratified a Sovereign Alliance with shared rally reinforcement rights.',
    },
  ];

  return { relations, proposals, history };
}

export interface DiplomacySummary {
  alliedCount: number;
  napCount: number;
  neutralCount: number;
  warCount: number;
  incomingProposalsCount: number;
  outgoingProposalsCount: number;
  totalRallyBonusPct: number;
  totalTradeBonusPct: number;
  totalWarHonorBonusPct: number;
}

export function evaluateDiplomacySummary(state: ClanDiplomacyState): DiplomacySummary {
  let alliedCount = 0;
  let napCount = 0;
  let neutralCount = 0;
  let warCount = 0;

  for (const rel of state.relations) {
    if (rel.stance === 'allied') alliedCount += 1;
    else if (rel.stance === 'nap') napCount += 1;
    else if (rel.stance === 'war') warCount += 1;
    else neutralCount += 1;
  }

  let incomingProposalsCount = 0;
  let outgoingProposalsCount = 0;
  for (const p of state.proposals) {
    if (p.direction === 'incoming') incomingProposalsCount += 1;
    else outgoingProposalsCount += 1;
  }

  return {
    alliedCount,
    napCount,
    neutralCount,
    warCount,
    incomingProposalsCount,
    outgoingProposalsCount,
    totalRallyBonusPct: Math.min(
      30,
      alliedCount * DIPLOMATIC_STANCE_META.allied.rallyAttackBonusPct
    ),
    totalTradeBonusPct: Math.min(
      40,
      alliedCount * DIPLOMATIC_STANCE_META.allied.tradeYieldBonusPct +
        napCount * DIPLOMATIC_STANCE_META.nap.tradeYieldBonusPct
    ),
    totalWarHonorBonusPct: warCount > 0 ? DIPLOMATIC_STANCE_META.war.warHonorBonusPct : 0,
  };
}

export function getRelationForClan(
  state: ClanDiplomacyState,
  targetClanId: string
): ClanDiplomaticRelation {
  return (
    state.relations.find((r) => r.clanId === targetClanId) || {
      clanId: targetClanId,
      stance: 'neutral',
      sinceTimestamp: 0,
      trustScore: 50,
    }
  );
}

export interface DiplomaticRiskAssessment {
  requiresConfirmation: boolean;
  isTreatyBreach: boolean;
  trustPenalty: number;
  warningText: string;
}

export function evaluateWarDeclarationRisk(
  state: ClanDiplomacyState,
  targetClanId: string,
  targetClanName: string
): DiplomaticRiskAssessment {
  const rel = getRelationForClan(state, targetClanId);
  if (rel.stance === 'allied') {
    return {
      requiresConfirmation: true,
      isTreatyBreach: true,
      trustPenalty: 45,
      warningText: `Declaring war on ${targetClanName} will shatter an active Sovereign Alliance (-45 Trust, revokes +10% Joint Rally Might).`,
    };
  }
  if (rel.stance === 'nap') {
    return {
      requiresConfirmation: true,
      isTreatyBreach: true,
      trustPenalty: 30,
      warningText: `Declaring war on ${targetClanName} will breach an active Non-Aggression Pact (-30 Trust, revokes +5% Trade Yield).`,
    };
  }
  return {
    requiresConfirmation: true,
    isTreatyBreach: false,
    trustPenalty: 15,
    warningText: `Formal war declaration against ${targetClanName} opens all border sectors to full siege warfare.`,
  };
}

export interface DiplomacyMutationResult {
  ok: boolean;
  error?: string;
  nextState: ClanDiplomacyState;
  systemNotice?: string;
  chatTag?: string;
}

function upsertRelation(
  relations: ClanDiplomaticRelation[],
  nextRel: ClanDiplomaticRelation
): ClanDiplomaticRelation[] {
  const exists = relations.some((r) => r.clanId === nextRel.clanId);
  if (!exists) return [...relations, nextRel];
  return relations.map((r) => (r.clanId === nextRel.clanId ? nextRel : r));
}

function prependHistory(
  history: ClanDiplomaticLogEntry[],
  entry: Omit<ClanDiplomaticLogEntry, 'id'>
): ClanDiplomaticLogEntry[] {
  const id = `dip_${entry.timestamp}_${Math.random().toString(36).slice(2, 7)}`;
  return [{ ...entry, id }, ...history].slice(0, 40);
}

export function sendDiplomaticProposal(
  state: ClanDiplomacyState,
  params: {
    actorName: string;
    actorRole: ClanRole;
    targetClanId: string;
    targetClanName: string;
    targetClanTag: string;
    proposalType: ClanTreatyProposalType;
    message?: string;
    durationDays?: number;
    now?: number;
  }
): DiplomacyMutationResult {
  const now = params.now ?? Date.now();
  const auth = getDiplomacyAuthority(params.actorRole);

  if (params.proposalType === 'alliance' && !auth.canManageAlliances) {
    return {
      ok: false,
      error: 'Only the Clan Leader can propose a Sovereign Alliance.',
      nextState: state,
    };
  }
  if (
    (params.proposalType === 'nap' || params.proposalType === 'peace') &&
    !auth.canManageNapAndPeace
  ) {
    return {
      ok: false,
      error: 'Only the Clan Leader or Elders can dispatch NAP and Peace envoys.',
      nextState: state,
    };
  }

  const currentRel = getRelationForClan(state, params.targetClanId);
  const summary = evaluateDiplomacySummary(state);

  if (params.proposalType === 'alliance') {
    if (currentRel.stance === 'allied') {
      return { ok: false, error: `${params.targetClanName} is already an Ally.`, nextState: state };
    }
    if (currentRel.stance === 'war') {
      return {
        ok: false,
        error: `Cannot propose an Alliance while at war with ${params.targetClanName}. Sign Peace first.`,
        nextState: state,
      };
    }
    if (summary.alliedCount >= MAX_ACTIVE_ALLIES) {
      return {
        ok: false,
        error: `Maximum of ${MAX_ACTIVE_ALLIES} active Sovereign Alliances reached.`,
        nextState: state,
      };
    }
  }

  if (params.proposalType === 'nap') {
    if (currentRel.stance === 'nap') {
      return {
        ok: false,
        error: `An active NAP already exists with ${params.targetClanName}.`,
        nextState: state,
      };
    }
    if (currentRel.stance === 'allied') {
      return {
        ok: false,
        error: `${params.targetClanName} is already a Sovereign Ally (higher pact than NAP).`,
        nextState: state,
      };
    }
    if (currentRel.stance === 'war') {
      return {
        ok: false,
        error: `Cannot propose a NAP while at war with ${params.targetClanName}. Propose Peace first.`,
        nextState: state,
      };
    }
    if (summary.napCount >= MAX_ACTIVE_NAPS) {
      return {
        ok: false,
        error: `Maximum of ${MAX_ACTIVE_NAPS} active Non-Aggression Pacts reached.`,
        nextState: state,
      };
    }
  }

  if (params.proposalType === 'peace' && currentRel.stance !== 'war') {
    return {
      ok: false,
      error: `Peace treaties can only be proposed to clans currently at war.`,
      nextState: state,
    };
  }

  const duplicate = state.proposals.find(
    (p) =>
      p.targetClanId === params.targetClanId &&
      p.proposalType === params.proposalType &&
      p.direction === 'outgoing'
  );
  if (duplicate) {
    return {
      ok: false,
      error: `An outgoing ${params.proposalType.toUpperCase()} proposal is already awaiting ${params.targetClanName}'s reply.`,
      nextState: state,
    };
  }

  const durationDays =
    params.durationDays ??
    (params.proposalType === 'alliance'
      ? DEFAULT_ALLIANCE_DURATION_DAYS
      : params.proposalType === 'nap'
        ? DEFAULT_NAP_DURATION_DAYS
        : undefined);

  const label =
    params.proposalType === 'alliance'
      ? 'Sovereign Alliance'
      : params.proposalType === 'nap'
        ? 'Non-Aggression Pact (NAP)'
        : 'Peace & Ceasefire Treaty';

  const defaultMessage =
    params.proposalType === 'alliance'
      ? `Formal Sovereign Alliance invitation (${durationDays}d) for shared defense and rallies.`
      : params.proposalType === 'nap'
        ? `Proposing a ${durationDays}-day Non-Aggression Pact securing border convoys.`
        : `Offering immediate cessation of hostilities and border restoration.`;

  const proposal: ClanDiplomaticProposal = {
    id: `prop_${now}_${Math.random().toString(36).slice(2, 7)}`,
    targetClanId: params.targetClanId,
    targetClanName: params.targetClanName,
    targetClanTag: params.targetClanTag,
    direction: 'outgoing',
    proposalType: params.proposalType,
    proposedBy: params.actorName,
    message: params.message?.trim() || defaultMessage,
    createdAt: now,
    durationDays,
  };

  const nextState: ClanDiplomacyState = {
    ...state,
    proposals: [proposal, ...state.proposals],
    history: prependHistory(state.history, {
      timestamp: now,
      targetClanId: params.targetClanId,
      targetClanName: params.targetClanName,
      targetClanTag: params.targetClanTag,
      action: 'proposal_sent',
      actorName: params.actorName,
      summary: `Dispatched ${label} proposal to [${params.targetClanTag}] ${params.targetClanName}.`,
    }),
  };

  return {
    ok: true,
    nextState,
    systemNotice: `${params.actorName} sent a ${label} envoy to [${params.targetClanTag}] ${params.targetClanName}.`,
    chatTag: 'DIPLOMACY',
  };
}

export function respondToDiplomaticProposal(
  state: ClanDiplomacyState,
  params: {
    proposalId: string;
    decision: 'accept' | 'decline' | 'cancel';
    actorName: string;
    actorRole: ClanRole;
    now?: number;
  }
): DiplomacyMutationResult {
  const now = params.now ?? Date.now();
  const proposal = state.proposals.find((p) => p.id === params.proposalId);
  if (!proposal) {
    return {
      ok: false,
      error: 'Diplomatic proposal not found or already resolved.',
      nextState: state,
    };
  }

  const auth = getDiplomacyAuthority(params.actorRole);
  if (proposal.proposalType === 'alliance' && !auth.canManageAlliances) {
    return {
      ok: false,
      error: 'Only the Clan Leader can ratify or reject Sovereign Alliance proposals.',
      nextState: state,
    };
  }
  if (!auth.canManageNapAndPeace) {
    return {
      ok: false,
      error: 'Only the Clan Leader or Elders can resolve diplomatic proposals.',
      nextState: state,
    };
  }

  if (params.decision === 'cancel') {
    if (proposal.direction !== 'outgoing') {
      return { ok: false, error: 'Only outgoing proposals can be withdrawn.', nextState: state };
    }
    const nextState: ClanDiplomacyState = {
      ...state,
      proposals: state.proposals.filter((p) => p.id !== proposal.id),
      history: prependHistory(state.history, {
        timestamp: now,
        targetClanId: proposal.targetClanId,
        targetClanName: proposal.targetClanName,
        targetClanTag: proposal.targetClanTag,
        action: 'proposal_cancelled',
        actorName: params.actorName,
        summary: `Withdrew outgoing ${proposal.proposalType.toUpperCase()} proposal to [${proposal.targetClanTag}] ${proposal.targetClanName}.`,
      }),
    };
    return {
      ok: true,
      nextState,
      systemNotice: `${params.actorName} withdrew the ${proposal.proposalType.toUpperCase()} proposal to [${proposal.targetClanTag}] ${proposal.targetClanName}.`,
      chatTag: 'DIPLOMACY',
    };
  }

  if (params.decision === 'decline') {
    const nextState: ClanDiplomacyState = {
      ...state,
      proposals: state.proposals.filter((p) => p.id !== proposal.id),
      history: prependHistory(state.history, {
        timestamp: now,
        targetClanId: proposal.targetClanId,
        targetClanName: proposal.targetClanName,
        targetClanTag: proposal.targetClanTag,
        action: 'proposal_declined',
        actorName: params.actorName,
        summary: `Declined ${proposal.proposalType.toUpperCase()} proposal from [${proposal.targetClanTag}] ${proposal.targetClanName}.`,
      }),
    };
    return {
      ok: true,
      nextState,
      systemNotice: `${params.actorName} declined the ${proposal.proposalType.toUpperCase()} offer from [${proposal.targetClanTag}] ${proposal.targetClanName}.`,
      chatTag: 'DIPLOMACY',
    };
  }

  // Accept (ratify either incoming proposal or envoy ratification for outgoing proposal)
  const summary = evaluateDiplomacySummary(state);
  const currentRel = getRelationForClan(state, proposal.targetClanId);

  if (proposal.proposalType === 'alliance' && currentRel.stance !== 'allied') {
    if (summary.alliedCount >= MAX_ACTIVE_ALLIES) {
      return {
        ok: false,
        error: `Cannot ratify Alliance: maximum of ${MAX_ACTIVE_ALLIES} active Allies reached.`,
        nextState: state,
      };
    }
  }
  if (proposal.proposalType === 'nap' && currentRel.stance !== 'nap') {
    if (summary.napCount >= MAX_ACTIVE_NAPS) {
      return {
        ok: false,
        error: `Cannot ratify NAP: maximum of ${MAX_ACTIVE_NAPS} active NAPs reached.`,
        nextState: state,
      };
    }
  }

  let nextStance: ClanDiplomaticStance = 'neutral';
  let logAction: ClanDiplomaticLogAction = 'peace_signed';
  let trustDelta = 15;
  let treatyDays = proposal.durationDays;
  let chatTag = 'DIPLOMACY';
  let terms = 'Formal ceasefire ratified; borders restored to neutral standing.';

  if (proposal.proposalType === 'alliance') {
    nextStance = 'allied';
    logAction = 'alliance_formed';
    trustDelta = 22;
    treatyDays = treatyDays ?? DEFAULT_ALLIANCE_DURATION_DAYS;
    chatTag = 'ALLIANCE';
    terms = `${treatyDays}-Day Sovereign Alliance: +10% Joint Rally Might & Shared Sector Defense.`;
  } else if (proposal.proposalType === 'nap') {
    nextStance = 'nap';
    logAction = 'nap_signed';
    trustDelta = 16;
    treatyDays = treatyDays ?? DEFAULT_NAP_DURATION_DAYS;
    chatTag = 'NAP PACT';
    terms = `${treatyDays}-Day Non-Aggression Pact: Zero-Raid Borders & +5% Trade Yield.`;
  } else {
    nextStance = 'neutral';
    logAction = 'peace_signed';
    trustDelta = 18;
    treatyDays = undefined;
    chatTag = 'PEACE TREATY';
    terms = 'Peace Treaty ratified — armed hostilities ended.';
  }

  const nextRelation: ClanDiplomaticRelation = {
    clanId: proposal.targetClanId,
    stance: nextStance,
    sinceTimestamp: now,
    treatyExpiresAt: treatyDays ? now + treatyDays * DAY_MS : undefined,
    trustScore: clampTrustScore(currentRel.trustScore + trustDelta),
    pactTerms: terms,
  };

  const nextState: ClanDiplomacyState = {
    relations: upsertRelation(state.relations, nextRelation),
    proposals: state.proposals.filter(
      (p) => p.id !== proposal.id && p.targetClanId !== proposal.targetClanId
    ),
    history: prependHistory(state.history, {
      timestamp: now,
      targetClanId: proposal.targetClanId,
      targetClanName: proposal.targetClanName,
      targetClanTag: proposal.targetClanTag,
      action: logAction,
      actorName: params.actorName,
      summary: `Ratified ${proposal.proposalType.toUpperCase()} with [${proposal.targetClanTag}] ${proposal.targetClanName}.`,
    }),
  };

  return {
    ok: true,
    nextState,
    systemNotice: `${params.actorName} ratified ${proposal.proposalType === 'alliance' ? 'a Sovereign Alliance' : proposal.proposalType === 'nap' ? 'a Non-Aggression Pact (NAP)' : 'a Peace Treaty'} with [${proposal.targetClanTag}] ${proposal.targetClanName}!`,
    chatTag,
  };
}

export function declareClanWar(
  state: ClanDiplomacyState,
  params: {
    actorName: string;
    actorRole: ClanRole;
    targetClanId: string;
    targetClanName: string;
    targetClanTag: string;
    reason?: string;
    now?: number;
  }
): DiplomacyMutationResult {
  const now = params.now ?? Date.now();
  const auth = getDiplomacyAuthority(params.actorRole);
  if (!auth.canDeclareWar) {
    return {
      ok: false,
      error: 'Only the Clan Leader may issue formal War Declarations.',
      nextState: state,
    };
  }

  const currentRel = getRelationForClan(state, params.targetClanId);
  if (currentRel.stance === 'war') {
    return {
      ok: false,
      error: `Your clan is already at war with ${params.targetClanName}.`,
      nextState: state,
    };
  }

  const risk = evaluateWarDeclarationRisk(state, params.targetClanId, params.targetClanName);
  const cleanReason = params.reason?.trim() || 'Contested border outposts and realm supremacy.';

  const nextRelation: ClanDiplomaticRelation = {
    clanId: params.targetClanId,
    stance: 'war',
    sinceTimestamp: now,
    treatyExpiresAt: undefined,
    trustScore: clampTrustScore(currentRel.trustScore - risk.trustPenalty),
    pactTerms: `Active War Declaration: ${cleanReason}`,
  };

  const breachNote = risk.isTreatyBreach
    ? ` (Breached active ${currentRel.stance.toUpperCase()} treaty!)`
    : '';

  const nextState: ClanDiplomacyState = {
    relations: upsertRelation(state.relations, nextRelation),
    proposals: state.proposals.filter((p) => p.targetClanId !== params.targetClanId),
    history: prependHistory(state.history, {
      timestamp: now,
      targetClanId: params.targetClanId,
      targetClanName: params.targetClanName,
      targetClanTag: params.targetClanTag,
      action: 'war_declared',
      actorName: params.actorName,
      summary: `Declared WAR on [${params.targetClanTag}] ${params.targetClanName}${breachNote}: ${cleanReason}`,
    }),
  };

  return {
    ok: true,
    nextState,
    systemNotice: `⚔️ WAR DECLARED! ${params.actorName} declared war on [${params.targetClanTag}] ${params.targetClanName}${breachNote}`,
    chatTag: 'WAR DECLARED',
  };
}

export function dissolveDiplomaticPact(
  state: ClanDiplomacyState,
  params: {
    actorName: string;
    actorRole: ClanRole;
    targetClanId: string;
    targetClanName: string;
    targetClanTag: string;
    now?: number;
  }
): DiplomacyMutationResult {
  const now = params.now ?? Date.now();
  const currentRel = getRelationForClan(state, params.targetClanId);
  const auth = getDiplomacyAuthority(params.actorRole);

  if (currentRel.stance === 'neutral') {
    return {
      ok: false,
      error: `${params.targetClanName} is already at Neutral standing.`,
      nextState: state,
    };
  }

  if (currentRel.stance === 'allied' && !auth.canManageAlliances) {
    return {
      ok: false,
      error: 'Only the Clan Leader can dissolve an active Sovereign Alliance.',
      nextState: state,
    };
  }

  if (currentRel.stance === 'nap' && !auth.canManageNapAndPeace) {
    return {
      ok: false,
      error: 'Only the Clan Leader or Elders can terminate a Non-Aggression Pact.',
      nextState: state,
    };
  }

  if (currentRel.stance === 'war' && !auth.canManageNapAndPeace) {
    return {
      ok: false,
      error: 'Only the Clan Leader or Elders can sign an immediate ceasefire.',
      nextState: state,
    };
  }

  const logAction: ClanDiplomaticLogAction =
    currentRel.stance === 'allied'
      ? 'alliance_broken'
      : currentRel.stance === 'nap'
        ? 'nap_broken'
        : 'peace_signed';

  const trustDelta = currentRel.stance === 'war' ? 14 : currentRel.stance === 'allied' ? -20 : -12;
  const summaryText =
    currentRel.stance === 'allied'
      ? `Dissolved Sovereign Alliance with [${params.targetClanTag}] ${params.targetClanName}.`
      : currentRel.stance === 'nap'
        ? `Terminated Non-Aggression Pact with [${params.targetClanTag}] ${params.targetClanName}.`
        : `Signed immediate Ceasefire & Peace with [${params.targetClanTag}] ${params.targetClanName}.`;

  const nextRelation: ClanDiplomaticRelation = {
    clanId: params.targetClanId,
    stance: 'neutral',
    sinceTimestamp: now,
    treatyExpiresAt: undefined,
    trustScore: clampTrustScore(currentRel.trustScore + trustDelta),
    pactTerms:
      currentRel.stance === 'war'
        ? 'Ceasefire signed — hostilities suspended.'
        : 'Prior pact dissolved; standing reset to Neutral.',
  };

  const nextState: ClanDiplomacyState = {
    relations: upsertRelation(state.relations, nextRelation),
    proposals: state.proposals.filter((p) => p.targetClanId !== params.targetClanId),
    history: prependHistory(state.history, {
      timestamp: now,
      targetClanId: params.targetClanId,
      targetClanName: params.targetClanName,
      targetClanTag: params.targetClanTag,
      action: logAction,
      actorName: params.actorName,
      summary: summaryText,
    }),
  };

  return {
    ok: true,
    nextState,
    systemNotice: `${params.actorName} ${currentRel.stance === 'war' ? 'signed a ceasefire with' : 'ended the treaty with'} [${params.targetClanTag}] ${params.targetClanName}.`,
    chatTag: currentRel.stance === 'war' ? 'PEACE TREATY' : 'DIPLOMACY',
  };
}
