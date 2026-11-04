/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRIMARY_ADMIN_EMAIL,
  INITIAL_MODERATED_PLAYERS,
  INITIAL_SUPPORT_TICKETS,
  OFFICIAL_CONTACT_DIRECTORY,
  normalizeAccountEmail,
  isPrimaryAdminAccount,
  verifyAccountPrivileges,
  applyModerationAction,
  createContactTicket,
  resolveContactTicket,
  buildMailtoHref,
} from './adminModeration';

test('creatergame31@gmail.com is recognized as Root Administration, GM, Admin, Moderator & Official Contact', () => {
  assert.equal(PRIMARY_ADMIN_EMAIL, 'creatergame31@gmail.com');
  assert.equal(isPrimaryAdminAccount('creatergame31@gmail.com'), true);
  assert.equal(isPrimaryAdminAccount('  CreaterGame31@GMAIL.com '), true);
  assert.equal(isPrimaryAdminAccount('random.user@example.com'), false);

  const profile = verifyAccountPrivileges('  CREATERGAME31@GMAIL.COM ');
  assert.equal(profile.email, 'creatergame31@gmail.com');
  assert.equal(profile.isRootOwner, true);
  assert.equal(profile.primaryRole, 'owner_admin');
  assert.equal(profile.clearanceLevel, 999);
  assert.equal(profile.contactEmail, 'creatergame31@gmail.com');
  assert.deepEqual(profile.assignedRoles, [
    'Administration',
    'Game Master (GM)',
    'Admin',
    'Moderator',
    'Official Contact',
  ]);
  assert.equal(profile.permissions.canAccessGmConsole, true);
  assert.equal(profile.permissions.canUseGodmodeAndCheats, true);
  assert.equal(profile.permissions.canSpawnTroopsAndResources, true);
  assert.equal(profile.permissions.canControlWorldTimeAndWeather, true);
  assert.equal(profile.permissions.canModeratePlayers, true);
  assert.equal(profile.permissions.canModerateChat, true);
  assert.equal(profile.permissions.canManageRoles, true);
  assert.equal(profile.permissions.canHandleSupportTickets, true);
  assert.equal(profile.permissions.isOfficialContact, true);
});

test('non-admin player accounts receive standard player permissions', () => {
  const playerProfile = verifyAccountPrivileges('regular.player@example.com');
  assert.equal(playerProfile.isRootOwner, false);
  assert.equal(playerProfile.primaryRole, 'player');
  assert.equal(playerProfile.clearanceLevel, 1);
  assert.equal(playerProfile.permissions.canModeratePlayers, false);
  assert.equal(playerProfile.permissions.canManageRoles, false);
  assert.equal(playerProfile.contactEmail, 'creatergame31@gmail.com');
});

test('creatergame31@gmail.com can warn, mute, ban, restore, and grant moderator/admin roles', () => {
  const warnResult = applyModerationAction({
    roster: INITIAL_MODERATED_PLAYERS,
    targetPlayerId: 'usr_chronos',
    action: 'warn',
    reason: 'Violation of territory truce protocol',
    actorEmail: 'creatergame31@gmail.com',
    now: 1793800000000,
  });
  assert.equal(warnResult.success, true);
  const warnedChronos = warnResult.updatedRoster.find((p) => p.id === 'usr_chronos');
  assert.equal(warnedChronos?.status, 'warned');
  assert.equal(warnedChronos?.warningsCount, 2);

  const banResult = applyModerationAction({
    roster: warnResult.updatedRoster,
    targetPlayerId: 'usr_chronos',
    action: 'temp_ban',
    reason: '24h temporary suspension',
    actorEmail: 'creatergame31@gmail.com',
    now: 1793800050000,
  });
  assert.equal(banResult.success, true);
  assert.equal(banResult.updatedRoster.find((p) => p.id === 'usr_chronos')?.status, 'temp_banned');

  const promoteResult = applyModerationAction({
    roster: banResult.updatedRoster,
    targetPlayerId: 'usr_shadowfang',
    action: 'grant_moderator',
    reason: 'Promoted to Community Moderator',
    actorEmail: 'creatergame31@gmail.com',
    now: 1793800100000,
  });
  assert.equal(promoteResult.success, true);
  assert.equal(
    promoteResult.updatedRoster.find((p) => p.id === 'usr_shadowfang')?.role,
    'moderator'
  );
});

test('root account creatergame31@gmail.com is protected from sanctions or demotion', () => {
  const attemptBanRoot = applyModerationAction({
    roster: INITIAL_MODERATED_PLAYERS,
    targetPlayerId: 'usr_root_creator',
    action: 'perm_ban',
    reason: 'Attempted hostile takeover',
    actorEmail: 'creatergame31@gmail.com',
  });
  assert.equal(attemptBanRoot.success, false);
  assert.match(attemptBanRoot.logMessage, /PROTECTED/);
  const rootRecord = attemptBanRoot.updatedRoster.find((p) => p.id === 'usr_root_creator');
  assert.equal(rootRecord?.status, 'active');
  assert.equal(rootRecord?.role, 'owner_admin');
});

test('unauthorized player cannot execute moderation actions', () => {
  const unauthorizedAttempt = applyModerationAction({
    roster: INITIAL_MODERATED_PLAYERS,
    targetPlayerId: 'usr_chronos',
    action: 'mute',
    reason: 'Unauthorized mute attempt',
    actorEmail: 'random.guest@example.com',
  });
  assert.equal(unauthorizedAttempt.success, false);
  assert.match(unauthorizedAttempt.logMessage, /DENIED/);
});

test('official contact directory and support ticket dispatch route to creatergame31@gmail.com', () => {
  assert.ok(OFFICIAL_CONTACT_DIRECTORY.length >= 5);
  for (const channel of OFFICIAL_CONTACT_DIRECTORY) {
    assert.equal(channel.email, 'creatergame31@gmail.com');
    const href = buildMailtoHref(channel, 'Test Subject', 'Test Body');
    assert.ok(href.startsWith('mailto:creatergame31@gmail.com?subject='));
  }

  // Empty fields rejected
  const invalidTicket = createContactTicket({
    tickets: INITIAL_SUPPORT_TICKETS,
    category: 'administration',
    senderName: 'Tester',
    senderEmail: 'tester@example.com',
    subject: '   ',
    message: '',
  });
  assert.equal(invalidTicket.success, false);

  // Valid ticket created and assigned to creatergame31@gmail.com
  const validTicket = createContactTicket({
    tickets: INITIAL_SUPPORT_TICKETS,
    category: 'gm_intervention',
    senderName: 'Kaelen Sunstride',
    senderEmail: 'kaelen@example.com',
    subject: 'Requesting GM Citadel Inspection',
    message: 'Need GM assistance with Era V gate sync.',
    priority: 'high',
    now: 1793900000000,
  });
  assert.equal(validTicket.success, true);
  assert.equal(validTicket.ticket?.assignedToEmail, 'creatergame31@gmail.com');
  assert.equal(validTicket.updatedTickets.length, INITIAL_SUPPORT_TICKETS.length + 1);

  // Resolve ticket as creatergame31@gmail.com
  const resolved = resolveContactTicket({
    tickets: validTicket.updatedTickets,
    ticketId: validTicket.ticket!.id,
    status: 'resolved',
    resolutionNote: 'Citadel sync verified and resolved by Creator GM.',
    actorEmail: normalizeAccountEmail('creatergame31@gmail.com'),
  });
  assert.equal(resolved.success, true);
  const updated = resolved.updatedTickets.find((t) => t.id === validTicket.ticket!.id);
  assert.equal(updated?.status, 'resolved');
  assert.equal(updated?.resolvedByEmail, 'creatergame31@gmail.com');
});
