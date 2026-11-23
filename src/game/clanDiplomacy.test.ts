/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_CLAN_LEADERBOARD } from './initialData';
import {
  MAX_ACTIVE_ALLIES,
  buildInitialDiplomacyState,
  declareClanWar,
  dissolveDiplomaticPact,
  evaluateDiplomacySummary,
  evaluateWarDeclarationRisk,
  getDiplomacyAuthority,
  getRelationForClan,
  respondToDiplomaticProposal,
  sendDiplomaticProposal,
} from './clanDiplomacy';

const NOW = 1_795_000_000_000;

test('buildInitialDiplomacyState seeds world clans with war, alliance, NAP, neutral & incoming NAP proposal', () => {
  const state = buildInitialDiplomacyState(INITIAL_CLAN_LEADERBOARD, 'clan_chronos', NOW);
  const summary = evaluateDiplomacySummary(state);

  assert.equal(summary.warCount, 1);
  assert.equal(summary.alliedCount, 1);
  assert.equal(summary.napCount, 1);
  assert.equal(summary.neutralCount, 1);
  assert.equal(summary.incomingProposalsCount, 1);
  assert.equal(summary.outgoingProposalsCount, 0);
  assert.equal(summary.totalRallyBonusPct, 10);
  assert.equal(summary.totalTradeBonusPct, 13);
  assert.equal(summary.totalWarHonorBonusPct, 15);
  assert.equal(getRelationForClan(state, 'clan_chronos').stance, 'war');
  assert.equal(getRelationForClan(state, 'clan_nova').stance, 'allied');
  assert.equal(getRelationForClan(state, 'clan_apex').stance, 'nap');
  assert.equal(getRelationForClan(state, 'clan_void').stance, 'neutral');
});

test('role authority gates war/alliance to Leader, NAP/peace to Leader & Elder, and read-only for lower ranks', () => {
  assert.deepEqual(getDiplomacyAuthority('Leader'), {
    canViewDiplomacy: true,
    canManageNapAndPeace: true,
    canManageAlliances: true,
    canDeclareWar: true,
  });
  assert.deepEqual(getDiplomacyAuthority('Elder'), {
    canViewDiplomacy: true,
    canManageNapAndPeace: true,
    canManageAlliances: false,
    canDeclareWar: false,
  });
  assert.deepEqual(getDiplomacyAuthority('Member'), {
    canViewDiplomacy: true,
    canManageNapAndPeace: false,
    canManageAlliances: false,
    canDeclareWar: false,
  });
});

test('accepting incoming NAP proposal transitions clan to NAP, increases trust, and records history', () => {
  const initial = buildInitialDiplomacyState(INITIAL_CLAN_LEADERBOARD, 'clan_chronos', NOW);
  const incoming = initial.proposals[0];
  assert.ok(incoming);

  const res = respondToDiplomaticProposal(initial, {
    proposalId: incoming.id,
    decision: 'accept',
    actorName: 'Aiden Skyrender',
    actorRole: 'Elder',
    now: NOW + 1000,
  });

  assert.equal(res.ok, true);
  assert.equal(res.chatTag, 'NAP PACT');
  assert.equal(getRelationForClan(res.nextState, 'clan_void').stance, 'nap');
  assert.ok(getRelationForClan(res.nextState, 'clan_void').trustScore > 46);
  assert.equal(res.nextState.proposals.length, 0);
  assert.equal(res.nextState.history[0].action, 'nap_signed');
});

test('declaring war on an Allied or NAP clan detects treaty breach, reduces trust, and blocks non-Leader roles', () => {
  const initial = buildInitialDiplomacyState(INITIAL_CLAN_LEADERBOARD, 'clan_chronos', NOW);

  const risk = evaluateWarDeclarationRisk(initial, 'clan_nova', 'Astral Dominion');
  assert.equal(risk.requiresConfirmation, true);
  assert.equal(risk.isTreatyBreach, true);
  assert.equal(risk.trustPenalty, 45);

  const elderDenied = declareClanWar(initial, {
    actorName: 'Elder Lyra',
    actorRole: 'Elder',
    targetClanId: 'clan_nova',
    targetClanName: 'Astral Dominion',
    targetClanTag: 'NOVA',
    now: NOW + 2000,
  });
  assert.equal(elderDenied.ok, false);

  const warRes = declareClanWar(initial, {
    actorName: 'Aiden Skyrender',
    actorRole: 'Leader',
    targetClanId: 'clan_nova',
    targetClanName: 'Astral Dominion',
    targetClanTag: 'NOVA',
    reason: 'Contested Azure Leyline Sanctum',
    now: NOW + 2000,
  });
  assert.equal(warRes.ok, true);
  assert.equal(warRes.chatTag, 'WAR DECLARED');
  assert.equal(getRelationForClan(warRes.nextState, 'clan_nova').stance, 'war');
  assert.equal(getRelationForClan(warRes.nextState, 'clan_nova').trustScore, 43);
  assert.equal(warRes.nextState.history[0].action, 'war_declared');
});

test('sending, cancelling, and ratifying outgoing Alliance & Peace proposals enforces state machine rules', () => {
  let state = buildInitialDiplomacyState(INITIAL_CLAN_LEADERBOARD, 'clan_chronos', NOW);

  // Cannot propose Alliance while at war
  const badAlly = sendDiplomaticProposal(state, {
    actorName: 'Aiden Skyrender',
    actorRole: 'Leader',
    targetClanId: 'clan_chronos',
    targetClanName: 'Chronos Imperium',
    targetClanTag: 'TITAN',
    proposalType: 'alliance',
    now: NOW + 3000,
  });
  assert.equal(badAlly.ok, false);

  // Can propose Peace while at war, then ratify it
  const peaceSend = sendDiplomaticProposal(state, {
    actorName: 'Aiden Skyrender',
    actorRole: 'Leader',
    targetClanId: 'clan_chronos',
    targetClanName: 'Chronos Imperium',
    targetClanTag: 'TITAN',
    proposalType: 'peace',
    now: NOW + 4000,
  });
  assert.equal(peaceSend.ok, true);
  state = peaceSend.nextState;

  // Duplicate outgoing proposal blocked
  const dup = sendDiplomaticProposal(state, {
    actorName: 'Aiden Skyrender',
    actorRole: 'Leader',
    targetClanId: 'clan_chronos',
    targetClanName: 'Chronos Imperium',
    targetClanTag: 'TITAN',
    proposalType: 'peace',
    now: NOW + 4500,
  });
  assert.equal(dup.ok, false);

  // Ratify peace -> transitions to neutral
  const peaceProp = state.proposals.find((p) => p.targetClanId === 'clan_chronos');
  assert.ok(peaceProp);
  const peaceAccept = respondToDiplomaticProposal(state, {
    proposalId: peaceProp.id,
    decision: 'accept',
    actorName: 'Aiden Skyrender',
    actorRole: 'Leader',
    now: NOW + 5000,
  });
  assert.equal(peaceAccept.ok, true);
  assert.equal(getRelationForClan(peaceAccept.nextState, 'clan_chronos').stance, 'neutral');

  // Dissolving active NAP resets stance to neutral
  const dissolveNap = dissolveDiplomaticPact(peaceAccept.nextState, {
    actorName: 'Aiden Skyrender',
    actorRole: 'Leader',
    targetClanId: 'clan_apex',
    targetClanName: 'Iron Vanguard',
    targetClanTag: 'APEX',
    now: NOW + 6000,
  });
  assert.equal(dissolveNap.ok, true);
  assert.equal(getRelationForClan(dissolveNap.nextState, 'clan_apex').stance, 'neutral');
  assert.equal(dissolveNap.nextState.history[0].action, 'nap_broken');
});

test('enforces MAX_ACTIVE_ALLIES ceiling when sending or ratifying new alliances', () => {
  const base = buildInitialDiplomacyState(INITIAL_CLAN_LEADERBOARD, 'clan_chronos', NOW);
  const saturated = {
    ...base,
    relations: [
      { clanId: 'a1', stance: 'allied' as const, sinceTimestamp: NOW, trustScore: 80 },
      { clanId: 'a2', stance: 'allied' as const, sinceTimestamp: NOW, trustScore: 80 },
      { clanId: 'a3', stance: 'allied' as const, sinceTimestamp: NOW, trustScore: 80 },
      { clanId: 'clan_void', stance: 'neutral' as const, sinceTimestamp: NOW, trustScore: 50 },
    ],
  };

  assert.equal(evaluateDiplomacySummary(saturated).alliedCount, MAX_ACTIVE_ALLIES);

  const blocked = sendDiplomaticProposal(saturated, {
    actorName: 'Aiden Skyrender',
    actorRole: 'Leader',
    targetClanId: 'clan_void',
    targetClanName: 'Eclipse Syndicate',
    targetClanTag: 'VOID',
    proposalType: 'alliance',
    now: NOW + 7000,
  });
  assert.equal(blocked.ok, false);
  assert.match(blocked.error || '', /Maximum/);
});
