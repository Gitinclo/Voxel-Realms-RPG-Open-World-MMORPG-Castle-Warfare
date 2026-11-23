/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Clock,
  Crown,
  Flame,
  Handshake,
  History,
  Inbox,
  Scale,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Swords,
  X,
} from 'lucide-react';
import {
  Clan,
  ClanDiplomacyState,
  ClanDiplomaticLogAction,
  ClanDiplomaticStance,
  ClanLeaderboardEntry,
  ClanRole,
  ClanTreatyProposalType,
} from '../types/game';
import {
  DEFAULT_ALLIANCE_DURATION_DAYS,
  DEFAULT_NAP_DURATION_DAYS,
  DIPLOMATIC_STANCE_META,
  DiplomacyMutationResult,
  MAX_ACTIVE_ALLIES,
  MAX_ACTIVE_NAPS,
  evaluateDiplomacySummary,
  evaluateWarDeclarationRisk,
  getDiplomacyAuthority,
  getRelationForClan,
} from '../game/clanDiplomacy';
import { formatBigInt } from '../game/math';
import { sound } from '../game/audio';
import { ClanEmblemView } from './ClanEmblemView';

interface ClanDiplomacyTabProps {
  playerClan: Clan;
  worldClans: ClanLeaderboardEntry[];
  diplomacy: ClanDiplomacyState;
  playerRole: ClanRole;
  playerName: string;
  onSendProposal: (params: {
    targetClanId: string;
    targetClanName: string;
    targetClanTag: string;
    proposalType: ClanTreatyProposalType;
    message?: string;
    durationDays?: number;
  }) => DiplomacyMutationResult;
  onRespondProposal: (params: {
    proposalId: string;
    decision: 'accept' | 'decline' | 'cancel';
  }) => DiplomacyMutationResult;
  onDeclareWar: (params: {
    targetClanId: string;
    targetClanName: string;
    targetClanTag: string;
    reason?: string;
  }) => DiplomacyMutationResult;
  onDissolvePact: (params: {
    targetClanId: string;
    targetClanName: string;
    targetClanTag: string;
  }) => DiplomacyMutationResult;
}

type StanceFilter = 'all' | ClanDiplomaticStance;

const STANCE_STYLE: Record<
  ClanDiplomaticStance,
  {
    badge: string;
    border: string;
    bar: string;
    cardAccent: string;
  }
> = {
  allied: {
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    border: 'border-emerald-500/35',
    bar: 'from-emerald-500 to-teal-400',
    cardAccent: 'bg-emerald-950/20',
  },
  nap: {
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
    border: 'border-sky-500/35',
    bar: 'from-sky-500 to-cyan-400',
    cardAccent: 'bg-sky-950/20',
  },
  neutral: {
    badge: 'bg-slate-700/60 text-slate-300 border-slate-600/60',
    border: 'border-slate-700/80',
    bar: 'from-slate-500 to-slate-400',
    cardAccent: 'bg-slate-900/60',
  },
  war: {
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
    border: 'border-rose-500/45',
    bar: 'from-rose-600 to-orange-500',
    cardAccent: 'bg-rose-950/20',
  },
};

const PROPOSAL_TYPE_LABEL: Record<ClanTreatyProposalType, string> = {
  alliance: 'Sovereign Alliance',
  nap: 'Non-Aggression Pact (NAP)',
  peace: 'Peace & Ceasefire Treaty',
};

const PROPOSAL_TYPE_BADGE: Record<ClanTreatyProposalType, string> = {
  alliance: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  nap: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  peace: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
};

function formatRemainingDays(expiresAt?: number): string | null {
  if (!expiresAt) return null;
  const diffMs = expiresAt - Date.now();
  if (diffMs <= 0) return 'Renewing';
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return `${days}d left`;
}

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

function getLogActionMeta(action: ClanDiplomaticLogAction): {
  label: string;
  tone: string;
} {
  switch (action) {
    case 'alliance_formed':
      return {
        label: 'Alliance Formed',
        tone: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
      };
    case 'alliance_broken':
      return {
        label: 'Alliance Ended',
        tone: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
      };
    case 'nap_signed':
      return { label: 'NAP Ratified', tone: 'text-sky-300 border-sky-500/30 bg-sky-500/10' };
    case 'nap_broken':
      return {
        label: 'NAP Terminated',
        tone: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
      };
    case 'war_declared':
      return { label: 'War Declared', tone: 'text-rose-300 border-rose-500/35 bg-rose-500/15' };
    case 'peace_signed':
      return { label: 'Peace Signed', tone: 'text-teal-300 border-teal-500/30 bg-teal-500/10' };
    case 'proposal_sent':
      return { label: 'Envoy Sent', tone: 'text-indigo-300 border-indigo-500/30 bg-indigo-500/10' };
    case 'proposal_declined':
      return {
        label: 'Offer Declined',
        tone: 'text-slate-300 border-slate-600/50 bg-slate-800/70',
      };
    case 'proposal_cancelled':
      return { label: 'Offer Withdrawn', tone: 'text-slate-400 border-slate-700 bg-slate-800/60' };
  }
}

export const ClanDiplomacyTab: React.FC<ClanDiplomacyTabProps> = ({
  playerClan,
  worldClans,
  diplomacy,
  playerRole,
  playerName,
  onSendProposal,
  onRespondProposal,
  onDeclareWar,
  onDissolvePact,
}) => {
  const [stanceFilter, setStanceFilter] = useState<StanceFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(
    null
  );

  // War Declaration confirmation dialog state
  const [warTarget, setWarTarget] = useState<ClanLeaderboardEntry | null>(null);
  const [warReason, setWarReason] = useState<string>('');

  // Proposal composer dialog state
  const [proposalDraft, setProposalDraft] = useState<{
    clan: ClanLeaderboardEntry;
    proposalType: ClanTreatyProposalType;
    durationDays: number;
    message: string;
  } | null>(null);

  const authority = useMemo(() => getDiplomacyAuthority(playerRole), [playerRole]);
  const summary = useMemo(() => evaluateDiplomacySummary(diplomacy), [diplomacy]);

  const externalClans = useMemo(
    () => worldClans.filter((c) => !c.isPlayerClan && c.id !== playerClan.id),
    [worldClans, playerClan.id]
  );

  const clanById = useMemo(() => {
    const map = new Map<string, ClanLeaderboardEntry>();
    for (const c of externalClans) {
      map.set(c.id, c);
    }
    return map;
  }, [externalClans]);

  const filteredClans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return externalClans
      .map((clan) => ({
        clan,
        relation: getRelationForClan(diplomacy, clan.id),
      }))
      .filter(({ clan, relation }) => {
        if (stanceFilter !== 'all' && relation.stance !== stanceFilter) return false;
        if (!q) return true;
        return (
          clan.name.toLowerCase().includes(q) ||
          clan.tag.toLowerCase().includes(q) ||
          clan.leader.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const rankOrder: Record<ClanDiplomaticStance, number> = {
          war: 0,
          allied: 1,
          nap: 2,
          neutral: 3,
        };
        const diff = rankOrder[a.relation.stance] - rankOrder[b.relation.stance];
        if (diff !== 0) return diff;
        return a.clan.rank - b.clan.rank;
      });
  }, [externalClans, diplomacy, stanceFilter, searchQuery]);

  const incomingProposals = useMemo(
    () => diplomacy.proposals.filter((p) => p.direction === 'incoming'),
    [diplomacy.proposals]
  );
  const outgoingProposals = useMemo(
    () => diplomacy.proposals.filter((p) => p.direction === 'outgoing'),
    [diplomacy.proposals]
  );

  const handleActionResult = (res: DiplomacyMutationResult) => {
    if (!res.ok) {
      setFeedback({
        kind: 'error',
        text: res.error || 'Diplomatic action could not be completed.',
      });
      return;
    }
    setFeedback({
      kind: 'success',
      text: res.systemNotice || 'Diplomatic standing updated.',
    });
  };

  const openProposalComposer = (
    targetClan: ClanLeaderboardEntry,
    proposalType: ClanTreatyProposalType
  ) => {
    const defaultDuration =
      proposalType === 'alliance'
        ? DEFAULT_ALLIANCE_DURATION_DAYS
        : proposalType === 'nap'
          ? DEFAULT_NAP_DURATION_DAYS
          : 0;
    const defaultMsg =
      proposalType === 'alliance'
        ? `[${playerClan.tag}] ${playerClan.name} offers a Sovereign Alliance for shared rallies and border defense.`
        : proposalType === 'nap'
          ? `[${playerClan.tag}] ${playerClan.name} proposes a ${defaultDuration}-day Non-Aggression Pact protecting caravan trade.`
          : `[${playerClan.tag}] ${playerClan.name} offers a formal Ceasefire & Peace Treaty to end hostilities.`;
    setProposalDraft({
      clan: targetClan,
      proposalType,
      durationDays: defaultDuration,
      message: defaultMsg,
    });
    sound.playSwing();
  };

  const submitProposalDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalDraft) return;
    const res = onSendProposal({
      targetClanId: proposalDraft.clan.id,
      targetClanName: proposalDraft.clan.name,
      targetClanTag: proposalDraft.clan.tag,
      proposalType: proposalDraft.proposalType,
      message: proposalDraft.message,
      durationDays: proposalDraft.proposalType === 'peace' ? undefined : proposalDraft.durationDays,
    });
    handleActionResult(res);
    if (res.ok) {
      sound.playLevelUp();
      setProposalDraft(null);
    }
  };

  const openWarConfirmation = (targetClan: ClanLeaderboardEntry) => {
    setWarTarget(targetClan);
    setWarReason('');
    sound.playSwing();
  };

  const confirmWarDeclaration = () => {
    if (!warTarget) return;
    const res = onDeclareWar({
      targetClanId: warTarget.id,
      targetClanName: warTarget.name,
      targetClanTag: warTarget.tag,
      reason: warReason,
    });
    handleActionResult(res);
    if (res.ok) {
      sound.playSwing();
      setWarTarget(null);
      setWarReason('');
    }
  };

  const warRisk = warTarget
    ? evaluateWarDeclarationRisk(diplomacy, warTarget.id, warTarget.name)
    : null;

  return (
    <div className="space-y-6" data-testid="clan-diplomacy-panel">
      {/* Header & Diplomatic Standing Overview */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/35 to-slate-900 border border-blue-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Handshake className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold font-cinzel text-white">
                Clan Diplomacy &amp; Sovereign Treaties
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Manage Sovereign Alliances, Non-Aggression Pacts (NAP), and formal War Declarations
              across the realm for{' '}
              <span className="text-blue-200 font-semibold">
                [{playerClan.tag}] {playerClan.name}
              </span>
              .
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs">
            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400">Authority:</span>
            <span className="font-bold text-amber-300" data-testid="diplomacy-role-badge">
              {playerRole}
            </span>
            <span className="text-[10px] text-slate-400 hidden lg:inline">
              {authority.canDeclareWar
                ? '· Full Treaty Power'
                : authority.canManageNapAndPeace
                  ? '· NAP & Peace'
                  : '· Read-Only'}
            </span>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
            <div className="flex items-center justify-between text-[11px] uppercase font-mono text-emerald-300/80">
              <span>Alliances</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div
              className="text-xl font-bold font-mono text-emerald-200 mt-1"
              data-testid="diplomacy-count-allied"
            >
              {summary.alliedCount}
              <span className="text-xs text-emerald-400/70 font-normal">
                {' '}
                / {MAX_ACTIVE_ALLIES}
              </span>
            </div>
            <div className="text-[11px] text-emerald-300/70 mt-0.5">
              +{summary.totalRallyBonusPct}% Joint Rally Might
            </div>
          </div>

          <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/30">
            <div className="flex items-center justify-between text-[11px] uppercase font-mono text-sky-300/80">
              <span>Active NAPs</span>
              <Handshake className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div
              className="text-xl font-bold font-mono text-sky-200 mt-1"
              data-testid="diplomacy-count-nap"
            >
              {summary.napCount}
              <span className="text-xs text-sky-400/70 font-normal"> / {MAX_ACTIVE_NAPS}</span>
            </div>
            <div className="text-[11px] text-sky-300/70 mt-0.5">
              +{summary.totalTradeBonusPct}% Caravan Trade Yield
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30">
            <div className="flex items-center justify-between text-[11px] uppercase font-mono text-rose-300/80">
              <span>Active Wars</span>
              <Swords className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div
              className="text-xl font-bold font-mono text-rose-200 mt-1"
              data-testid="diplomacy-count-war"
            >
              {summary.warCount}
            </div>
            <div className="text-[11px] text-rose-300/70 mt-0.5">
              {summary.totalWarHonorBonusPct > 0
                ? `+${summary.totalWarHonorBonusPct}% Siege War Honor`
                : 'Borders at Peace'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/30">
            <div className="flex items-center justify-between text-[11px] uppercase font-mono text-amber-300/80">
              <span>Pending Envoys</span>
              <Inbox className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div
              className="text-xl font-bold font-mono text-amber-200 mt-1"
              data-testid="diplomacy-count-proposals"
            >
              {summary.incomingProposalsCount + summary.outgoingProposalsCount}
            </div>
            <div className="text-[11px] text-amber-300/70 mt-0.5">
              {summary.incomingProposalsCount} incoming · {summary.outgoingProposalsCount} outgoing
            </div>
          </div>
        </div>
      </div>

      {/* Inline Status / Validation Feedback Banner */}
      {feedback && (
        <div
          role="status"
          data-testid="diplomacy-feedback-banner"
          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            feedback.kind === 'error'
              ? 'bg-rose-950/50 border-rose-500/50 text-rose-200'
              : 'bg-emerald-950/45 border-emerald-500/45 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.kind === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg hover:bg-slate-800/70 text-slate-400 hover:text-white transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pending Diplomatic Proposals (Incoming & Outgoing) */}
      {(incomingProposals.length > 0 || outgoingProposals.length > 0) && (
        <section className="space-y-3" aria-label="Pending Diplomatic Proposals">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold font-cinzel text-amber-300 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-amber-400" />
              Active Diplomatic Envoys ({diplomacy.proposals.length})
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              Review incoming offers or finalize outgoing dispatches
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {diplomacy.proposals.map((proposal) => {
              const target = clanById.get(proposal.targetClanId);
              const isIncoming = proposal.direction === 'incoming';
              const canResolve =
                proposal.proposalType === 'alliance'
                  ? authority.canManageAlliances
                  : authority.canManageNapAndPeace;

              return (
                <div
                  key={proposal.id}
                  data-testid={`diplomacy-proposal-${proposal.targetClanId}`}
                  className={`p-4 rounded-xl border space-y-3 ${
                    isIncoming
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-indigo-950/20 border-indigo-500/35'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {target && (
                        <div className="p-1.5 rounded-xl bg-slate-950/80 border border-slate-700/80 shrink-0">
                          <ClanEmblemView emblem={target.emblem} size="sm" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-bold text-white truncate">
                            [{proposal.targetClanTag}] {proposal.targetClanName}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase font-mono rounded-md border ${PROPOSAL_TYPE_BADGE[proposal.proposalType]}`}
                          >
                            {PROPOSAL_TYPE_LABEL[proposal.proposalType]}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span
                            className={
                              isIncoming
                                ? 'text-amber-300 font-semibold'
                                : 'text-indigo-300 font-semibold'
                            }
                          >
                            {isIncoming ? 'Incoming Envoy' : 'Outgoing Dispatch'}
                          </span>
                          <span>·</span>
                          <span>By {proposal.proposedBy}</span>
                          {proposal.durationDays ? (
                            <>
                              <span>·</span>
                              <span className="font-mono">{proposal.durationDays}d term</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {formatRelativeTime(proposal.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 italic">
                    &ldquo;{proposal.message}&rdquo;
                  </p>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {isIncoming ? (
                      <>
                        <button
                          type="button"
                          disabled={!canResolve}
                          data-testid={`proposal-decline-${proposal.targetClanId}`}
                          onClick={() => {
                            const res = onRespondProposal({
                              proposalId: proposal.id,
                              decision: 'decline',
                            });
                            handleActionResult(res);
                            if (res.ok) sound.playSwing();
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                            canResolve
                              ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200 cursor-pointer'
                              : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          Decline
                        </button>
                        <button
                          type="button"
                          disabled={!canResolve}
                          data-testid={`proposal-accept-${proposal.targetClanId}`}
                          onClick={() => {
                            const res = onRespondProposal({
                              proposalId: proposal.id,
                              decision: 'accept',
                            });
                            handleActionResult(res);
                            if (res.ok) sound.playLevelUp();
                          }}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                            canResolve
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/40 cursor-pointer'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept &amp; Ratify
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={!canResolve}
                          data-testid={`proposal-withdraw-${proposal.targetClanId}`}
                          onClick={() => {
                            const res = onRespondProposal({
                              proposalId: proposal.id,
                              decision: 'cancel',
                            });
                            handleActionResult(res);
                            if (res.ok) sound.playSwing();
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                            canResolve
                              ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-300 cursor-pointer'
                              : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          Withdraw
                        </button>
                        <button
                          type="button"
                          disabled={!canResolve}
                          data-testid={`proposal-ratify-${proposal.targetClanId}`}
                          onClick={() => {
                            const res = onRespondProposal({
                              proposalId: proposal.id,
                              decision: 'accept',
                            });
                            handleActionResult(res);
                            if (res.ok) sound.playLevelUp();
                          }}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                            canResolve
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Confirm Counter-Sign
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* World Clan Relations Directory */}
      <section className="space-y-3" aria-label="Realm Clan Diplomatic Directory">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: `All Clans (${externalClans.length})` },
                { id: 'allied', label: `Allied (${summary.alliedCount})` },
                { id: 'nap', label: `NAP (${summary.napCount})` },
                { id: 'neutral', label: `Neutral (${summary.neutralCount})` },
                { id: 'war', label: `At War (${summary.warCount})` },
              ] as { id: StanceFilter; label: string }[]
            ).map((filter) => {
              const active = stanceFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  data-testid={`diplomacy-filter-${filter.id}`}
                  onClick={() => setStanceFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    active
                      ? 'bg-blue-600/30 border-blue-400 text-blue-100'
                      : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clan, tag, or leader..."
              aria-label="Search world clans"
              data-testid="diplomacy-search-input"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700/80 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {filteredClans.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
            <Scale className="w-7 h-7 text-slate-500 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">
              No clans match the current diplomatic filter.
            </div>
            <button
              type="button"
              onClick={() => {
                setStanceFilter('all');
                setSearchQuery('');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-blue-300 font-semibold cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredClans.map(({ clan: targetClan, relation }) => {
              const style = STANCE_STYLE[relation.stance];
              const meta = DIPLOMATIC_STANCE_META[relation.stance];
              const remainingDays = formatRemainingDays(relation.treatyExpiresAt);
              const pendingForClan = diplomacy.proposals.filter(
                (p) => p.targetClanId === targetClan.id
              );
              const hasOutgoingAlliance = pendingForClan.some(
                (p) => p.direction === 'outgoing' && p.proposalType === 'alliance'
              );
              const hasOutgoingNap = pendingForClan.some(
                (p) => p.direction === 'outgoing' && p.proposalType === 'nap'
              );
              const hasOutgoingPeace = pendingForClan.some(
                (p) => p.direction === 'outgoing' && p.proposalType === 'peace'
              );

              return (
                <article
                  key={targetClan.id}
                  data-testid={`diplomacy-clan-card-${targetClan.id}`}
                  className={`p-4 rounded-2xl border ${style.border} ${style.cardAccent} flex flex-col justify-between gap-4 transition-colors`}
                >
                  {/* Top Row: Emblem + Identity + Stance */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1.5 rounded-xl bg-slate-950/90 border border-slate-700/80 shrink-0">
                          <ClanEmblemView emblem={targetClan.emblem} size="md" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700 text-[10px] font-mono font-bold text-amber-300">
                              [{targetClan.tag}]
                            </span>
                            <h5 className="text-sm font-bold text-white truncate">
                              {targetClan.name}
                            </h5>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span>Leader: {targetClan.leader}</span>
                            <span>·</span>
                            <span className="font-mono text-slate-300">Lv.{targetClan.level}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2.5">
                            <span>⚡ {formatBigInt(targetClan.totalPower)}</span>
                            <span>🏰 {targetClan.territoryOutposts} Outposts</span>
                            <span>⚔️ {targetClan.warsWon} Wins</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          data-testid={`diplomacy-stance-${targetClan.id}`}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase font-mono border ${style.badge}`}
                        >
                          {meta.shortLabel}
                        </span>
                        {remainingDays && (
                          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {remainingDays}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Trust Gauge & Treaty Terms */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Diplomatic Trust</span>
                        <span className="font-mono font-bold text-slate-200">
                          {relation.trustScore} / 100
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-950/90 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${style.bar} transition-all duration-300`}
                          style={{ width: `${relation.trustScore}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-300/90 pt-1">
                        {relation.pactTerms || meta.effectSummary}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Effect: {meta.effectSummary}
                      </div>
                    </div>
                  </div>

                  {/* Diplomatic Action Controls */}
                  <div className="pt-3 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {relation.stance === 'neutral' && (
                        <>
                          <button
                            type="button"
                            disabled={!authority.canManageAlliances || hasOutgoingAlliance}
                            data-testid={`action-propose-alliance-${targetClan.id}`}
                            onClick={() => openProposalComposer(targetClan, 'alliance')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                              authority.canManageAlliances && !hasOutgoingAlliance
                                ? 'bg-emerald-600/20 hover:bg-emerald-600/35 border-emerald-500/45 text-emerald-200 cursor-pointer'
                                : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {hasOutgoingAlliance ? 'Alliance Sent' : 'Propose Alliance'}
                          </button>

                          <button
                            type="button"
                            disabled={!authority.canManageNapAndPeace || hasOutgoingNap}
                            data-testid={`action-propose-nap-${targetClan.id}`}
                            onClick={() => openProposalComposer(targetClan, 'nap')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                              authority.canManageNapAndPeace && !hasOutgoingNap
                                ? 'bg-sky-600/20 hover:bg-sky-600/35 border-sky-500/45 text-sky-200 cursor-pointer'
                                : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <Handshake className="w-3.5 h-3.5" />
                            {hasOutgoingNap ? 'NAP Sent' : 'Propose NAP'}
                          </button>
                        </>
                      )}

                      {relation.stance === 'nap' && (
                        <>
                          <button
                            type="button"
                            disabled={!authority.canManageAlliances || hasOutgoingAlliance}
                            data-testid={`action-propose-alliance-${targetClan.id}`}
                            onClick={() => openProposalComposer(targetClan, 'alliance')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                              authority.canManageAlliances && !hasOutgoingAlliance
                                ? 'bg-emerald-600/20 hover:bg-emerald-600/35 border-emerald-500/45 text-emerald-200 cursor-pointer'
                                : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {hasOutgoingAlliance ? 'Alliance Sent' : 'Upgrade to Alliance'}
                          </button>

                          <button
                            type="button"
                            disabled={!authority.canManageNapAndPeace}
                            data-testid={`action-dissolve-${targetClan.id}`}
                            onClick={() => {
                              const res = onDissolvePact({
                                targetClanId: targetClan.id,
                                targetClanName: targetClan.name,
                                targetClanTag: targetClan.tag,
                              });
                              handleActionResult(res);
                              if (res.ok) sound.playSwing();
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                              authority.canManageNapAndPeace
                                ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200 cursor-pointer'
                                : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            End NAP
                          </button>
                        </>
                      )}

                      {relation.stance === 'allied' && (
                        <button
                          type="button"
                          disabled={!authority.canManageAlliances}
                          data-testid={`action-dissolve-${targetClan.id}`}
                          onClick={() => {
                            const res = onDissolvePact({
                              targetClanId: targetClan.id,
                              targetClanName: targetClan.name,
                              targetClanTag: targetClan.tag,
                            });
                            handleActionResult(res);
                            if (res.ok) sound.playSwing();
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                            authority.canManageAlliances
                              ? 'bg-amber-600/15 hover:bg-amber-600/30 border-amber-500/40 text-amber-200 cursor-pointer'
                              : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          Dissolve Alliance
                        </button>
                      )}

                      {relation.stance === 'war' && (
                        <>
                          <button
                            type="button"
                            disabled={!authority.canManageNapAndPeace || hasOutgoingPeace}
                            data-testid={`action-propose-peace-${targetClan.id}`}
                            onClick={() => openProposalComposer(targetClan, 'peace')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                              authority.canManageNapAndPeace && !hasOutgoingPeace
                                ? 'bg-amber-500/20 hover:bg-amber-500/35 border-amber-500/45 text-amber-200 cursor-pointer'
                                : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <Send className="w-3.5 h-3.5" />
                            {hasOutgoingPeace ? 'Peace Sent' : 'Propose Peace'}
                          </button>

                          <button
                            type="button"
                            disabled={!authority.canManageNapAndPeace}
                            data-testid={`action-ceasefire-${targetClan.id}`}
                            onClick={() => {
                              const res = onDissolvePact({
                                targetClanId: targetClan.id,
                                targetClanName: targetClan.name,
                                targetClanTag: targetClan.tag,
                              });
                              handleActionResult(res);
                              if (res.ok) sound.playLevelUp();
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                              authority.canManageNapAndPeace
                                ? 'bg-teal-600/20 hover:bg-teal-600/35 border-teal-500/45 text-teal-200 cursor-pointer'
                                : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <Shield className="w-3.5 h-3.5" />
                            Sign Ceasefire
                          </button>
                        </>
                      )}
                    </div>

                    {relation.stance !== 'war' && (
                      <button
                        type="button"
                        disabled={!authority.canDeclareWar}
                        data-testid={`action-declare-war-${targetClan.id}`}
                        onClick={() => openWarConfirmation(targetClan)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                          authority.canDeclareWar
                            ? 'bg-rose-600/20 hover:bg-rose-600/35 border-rose-500/50 text-rose-200 cursor-pointer'
                            : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5" />
                        Declare War
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Diplomatic Chronicle */}
      <section className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold font-cinzel text-slate-200 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            Diplomatic Chronicle ({diplomacy.history.length})
          </h4>
          <span className="text-[11px] font-mono text-slate-500">Signed as {playerName}</span>
        </div>

        <div
          className="space-y-2 max-h-52 overflow-y-auto pr-1"
          data-testid="diplomacy-history-list"
        >
          {diplomacy.history.map((entry) => {
            const actionMeta = getLogActionMeta(entry.action);
            return (
              <div
                key={entry.id}
                className="p-2.5 rounded-xl bg-slate-900/75 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold shrink-0 ${actionMeta.tone}`}
                  >
                    {actionMeta.label}
                  </span>
                  <span className="text-slate-200 truncate sm:whitespace-normal">
                    {entry.summary}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 shrink-0">
                  <span>{entry.actorName}</span>
                  <span>·</span>
                  <span>{formatRelativeTime(entry.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* War Declaration Confirmation Overlay */}
      {warTarget && warRisk && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="war-declaration-title"
          data-testid="diplomacy-war-confirm-dialog"
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-rose-500/50 shadow-2xl shadow-rose-950/60 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-rose-950/90 to-slate-900 border-b border-rose-500/35 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h4
                  id="war-declaration-title"
                  className="text-base font-bold font-cinzel text-white"
                >
                  Formal War Declaration
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setWarTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Cancel war declaration"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <ClanEmblemView emblem={warTarget.emblem} size="sm" />
                <div>
                  <div className="text-sm font-bold text-white">
                    [{warTarget.tag}] {warTarget.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    Leader: {warTarget.leader} · Power {formatBigInt(warTarget.totalPower)}
                  </div>
                </div>
              </div>

              <div
                data-testid="war-risk-warning"
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  warRisk.isTreatyBreach
                    ? 'bg-rose-950/60 border-rose-500/60 text-rose-200'
                    : 'bg-amber-950/40 border-amber-500/45 text-amber-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="space-y-1">
                  <div className="font-bold uppercase font-mono text-[11px]">
                    {warRisk.isTreatyBreach
                      ? `Treaty Breach Warning (-${warRisk.trustPenalty} Trust)`
                      : `Hostility Notice (-${warRisk.trustPenalty} Trust)`}
                  </div>
                  <p>{warRisk.warningText}</p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="war-reason-input"
                  className="block text-xs font-bold uppercase font-mono text-slate-300 mb-1.5"
                >
                  Casus Belli / War Decree (Optional)
                </label>
                <input
                  id="war-reason-input"
                  type="text"
                  maxLength={140}
                  value={warReason}
                  onChange={(e) => setWarReason(e.target.value)}
                  placeholder="e.g. Contested claim over Ashfall Citadel outposts"
                  data-testid="war-reason-input"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setWarTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
              >
                Stand Down
              </button>
              <button
                type="button"
                data-testid="confirm-war-declaration-btn"
                onClick={confirmWarDeclaration}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-rose-900/40 cursor-pointer"
              >
                <Swords className="w-3.5 h-3.5" />
                Confirm War Declaration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Treaty Proposal Composer Overlay */}
      {proposalDraft && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="proposal-composer-title"
          data-testid="diplomacy-proposal-dialog"
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onSubmit={submitProposalDraft}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-blue-500/45 shadow-2xl overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-r from-blue-950/90 to-slate-900 border-b border-blue-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400" />
                <h4
                  id="proposal-composer-title"
                  className="text-base font-bold font-cinzel text-white"
                >
                  Dispatch {PROPOSAL_TYPE_LABEL[proposalDraft.proposalType]}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setProposalDraft(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Cancel proposal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <ClanEmblemView emblem={proposalDraft.clan.emblem} size="sm" />
                <div>
                  <div className="text-sm font-bold text-white">
                    [{proposalDraft.clan.tag}] {proposalDraft.clan.name}
                  </div>
                  <div className="text-xs text-slate-400">Leader: {proposalDraft.clan.leader}</div>
                </div>
              </div>

              {proposalDraft.proposalType !== 'peace' && (
                <div>
                  <label className="block text-xs font-bold uppercase font-mono text-slate-300 mb-1.5">
                    Treaty Duration
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[7, 14, 30].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() =>
                          setProposalDraft((prev) =>
                            prev ? { ...prev, durationDays: days } : null
                          )
                        }
                        className={`py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                          proposalDraft.durationDays === days
                            ? 'bg-blue-600/30 border-blue-400 text-blue-100'
                            : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {days} Days
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="proposal-message-input"
                  className="block text-xs font-bold uppercase font-mono text-slate-300 mb-1.5"
                >
                  Envoy Dispatch Note
                </label>
                <textarea
                  id="proposal-message-input"
                  rows={3}
                  maxLength={220}
                  value={proposalDraft.message}
                  onChange={(e) =>
                    setProposalDraft((prev) => (prev ? { ...prev, message: e.target.value } : null))
                  }
                  data-testid="proposal-message-input"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-400 resize-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setProposalDraft(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="confirm-send-proposal-btn"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-blue-900/40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch Envoy
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
