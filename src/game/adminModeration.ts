/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const PRIMARY_ADMIN_EMAIL = 'creatergame31@gmail.com';
export const ADMIN_MODERATION_STORAGE_KEY = 'voxel_realms_admin_moderation_v1';

export type StaffRole = 'owner_admin' | 'game_master' | 'administrator' | 'moderator' | 'player';

export type SanctionStatus = 'active' | 'warned' | 'muted' | 'temp_banned' | 'perm_banned';

export type ModerationActionType =
  | 'warn'
  | 'mute'
  | 'temp_ban'
  | 'perm_ban'
  | 'restore_active'
  | 'grant_moderator'
  | 'grant_admin'
  | 'grant_gm'
  | 'revoke_staff';

export type ContactCategory =
  'administration' | 'gm_intervention' | 'moderation_report' | 'ban_appeal' | 'security_disclosure';

export type SecurityTrustBoundary = 'UNTRUSTED_CLIENT_PREVIEW' | 'VERIFIED_SERVER_SESSION';

export interface AdminPermissions {
  canAccessGmConsole: boolean;
  canUseGodmodeAndCheats: boolean;
  canSpawnTroopsAndResources: boolean;
  canControlWorldTimeAndWeather: boolean;
  canModeratePlayers: boolean;
  canModerateChat: boolean;
  canManageRoles: boolean;
  canHandleSupportTickets: boolean;
  isOfficialContact: boolean;
}

export interface AccountPrivilegeProfile {
  email: string;
  normalizedEmail: string;
  displayName: string;
  primaryRole: StaffRole;
  assignedRoles: string[];
  clearanceLevel: number;
  isRootOwner: boolean;
  contactEmail: string;
  trustBoundary: SecurityTrustBoundary;
  permissions: AdminPermissions;
}

export interface ServerSessionInfo {
  sessionId: string;
  commanderId: string;
  displayName: string;
  email: string;
  role: StaffRole;
  clearanceLevel: number;
  isRootOwner: boolean;
  permissions: AdminPermissions;
  issuedAtIso: string;
  expiresAtIso: string;
}

export interface SecurityAuditEntry {
  id: string;
  timestampIso: string;
  eventType:
    | 'PLAYER_SESSION_ISSUED'
    | 'ADMIN_LOGIN_SUCCESS'
    | 'ADMIN_LOGIN_FAILED'
    | 'SESSION_LOGOUT'
    | 'AUTHZ_DENIED'
    | 'MODERATION_EXECUTED'
    | 'TICKET_CREATED'
    | 'TICKET_UPDATED'
    | 'SYNC_SANITIZED'
    | 'WS_COMMAND_REJECTED';
  actorEmail: string;
  actorRole: StaffRole | 'anonymous';
  outcome: 'allowed' | 'denied' | 'clamped';
  detail: string;
}

export interface ModeratedPlayerRecord {
  id: string;
  name: string;
  email: string;
  clanTag: string;
  role: StaffRole;
  status: SanctionStatus;
  warningsCount: number;
  sanctionReason: string;
  lastActionBy: string;
  lastActionTimestamp: number;
  castleLevel: number;
}

export interface ContactChannelInfo {
  id: ContactCategory;
  title: string;
  roleLabel: string;
  email: string;
  subjectPrefix: string;
  slaText: string;
  description: string;
}

export interface SupportTicket {
  id: string;
  category: ContactCategory;
  senderName: string;
  senderEmail: string;
  assignedToEmail: string;
  subject: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  resolutionNote?: string;
  resolvedByEmail?: string;
  createdAt: number;
}

export const OFFICIAL_CONTACT_DIRECTORY: ContactChannelInfo[] = [
  {
    id: 'administration',
    title: 'Supreme Administration & Executive Control',
    roleLabel: 'Administration / Owner',
    email: PRIMARY_ADMIN_EMAIL,
    subjectPrefix: '[ADMINISTRATION] Voxel Realms RPG',
    slaText: '24h Executive Priority',
    description:
      'Governance, server configuration, account ownership, billing escalations, and partnership inquiries.',
  },
  {
    id: 'gm_intervention',
    title: 'Game Master (GM) Live World Operations',
    roleLabel: 'Game Master (GM)',
    email: PRIMARY_ADMIN_EMAIL,
    subjectPrefix: '[GM CONTROL] Voxel Realms RPG',
    slaText: '12h Live-Ops Triage',
    description:
      'World boss anomalies, stuck realm breakthroughs, citadel progression recovery, and live event directives.',
  },
  {
    id: 'moderation_report',
    title: 'Community Moderator & Conduct Enforcement',
    roleLabel: 'Admin / Moderator',
    email: PRIMARY_ADMIN_EMAIL,
    subjectPrefix: '[MODERATOR] Voxel Realms RPG',
    slaText: '4h Moderation Queue',
    description:
      'Report harassment, chat violations, clan emblem abuse, griefing, or Code of Conduct infractions.',
  },
  {
    id: 'ban_appeal',
    title: 'Account Sanction & Ban Appeals Desk',
    roleLabel: 'Admin / Appeals',
    email: PRIMARY_ADMIN_EMAIL,
    subjectPrefix: '[APPEAL] Voxel Realms RPG',
    slaText: '48h Review Window',
    description:
      'Appeal temporary suspensions, chat mutes, or permanent account bans issued by the moderation system.',
  },
  {
    id: 'security_disclosure',
    title: 'Security Vulnerability & Privacy Officer',
    roleLabel: 'Security & GDPR Contact',
    email: PRIMARY_ADMIN_EMAIL,
    subjectPrefix: '[SECURITY] Voxel Realms RPG',
    slaText: '48h Acknowledge / 72h Triage',
    description:
      'Responsible disclosure of security vulnerabilities, exploit reports, and GDPR/CCPA data deletion requests.',
  },
];

export const INITIAL_MODERATED_PLAYERS: ModeratedPlayerRecord[] = [
  {
    id: 'usr_root_creator',
    name: 'Aiden Skyrender (Creator GM)',
    email: PRIMARY_ADMIN_EMAIL,
    clanTag: 'VALOR',
    role: 'owner_admin',
    status: 'active',
    warningsCount: 0,
    sanctionReason: 'Verified Root Administration, GM, Admin & Moderator Account',
    lastActionBy: PRIMARY_ADMIN_EMAIL,
    lastActionTimestamp: 1793760000000,
    castleLevel: 100,
  },
  {
    id: 'usr_chronos',
    name: 'Lord Chronos',
    email: 'chronos.titan@voxelrealms.example',
    clanTag: 'TITAN',
    role: 'player',
    status: 'active',
    warningsCount: 1,
    sanctionReason: 'Prior warning for world chat spam during Dragon Spire siege',
    lastActionBy: PRIMARY_ADMIN_EMAIL,
    lastActionTimestamp: 1793750000000,
    castleLevel: 98,
  },
  {
    id: 'usr_seraphina',
    name: 'Queen Seraphina',
    email: 'seraphina.nova@voxelrealms.example',
    clanTag: 'NOVA',
    role: 'moderator',
    status: 'active',
    warningsCount: 0,
    sanctionReason: 'Appointed Realm Chat Moderator by creatergame31@gmail.com',
    lastActionBy: PRIMARY_ADMIN_EMAIL,
    lastActionTimestamp: 1793740000000,
    castleLevel: 95,
  },
  {
    id: 'usr_darth_vex',
    name: 'Darth Vex',
    email: 'vex.void@voxelrealms.example',
    clanTag: 'VOID',
    role: 'player',
    status: 'muted',
    warningsCount: 2,
    sanctionReason: 'Muted in Global/Clan chat for abusive language (Code of Conduct §2)',
    lastActionBy: PRIMARY_ADMIN_EMAIL,
    lastActionTimestamp: 1793755000000,
    castleLevel: 92,
  },
  {
    id: 'usr_shadowfang',
    name: 'ShadowFang',
    email: 'shadowfang.apex@voxelrealms.example',
    clanTag: 'APEX',
    role: 'player',
    status: 'warned',
    warningsCount: 1,
    sanctionReason: 'Unsportsmanlike outpost griefing report under investigation',
    lastActionBy: PRIMARY_ADMIN_EMAIL,
    lastActionTimestamp: 1793758000000,
    castleLevel: 11,
  },
];

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tkt_1001',
    category: 'moderation_report',
    senderName: 'Ragnar Ironjaw',
    senderEmail: 'ragnar.valor@voxelrealms.example',
    assignedToEmail: PRIMARY_ADMIN_EMAIL,
    subject: 'World Chat Harassment near Sunken Obelisk',
    message:
      'Reporting player Darth Vex for repeated toxic messages in world rally chat during outpost war.',
    priority: 'high',
    status: 'investigating',
    createdAt: 1793752000000,
  },
  {
    id: 'tkt_1002',
    category: 'gm_intervention',
    senderName: 'Selene Moonblade',
    senderEmail: 'selene.valor@voxelrealms.example',
    assignedToEmail: PRIMARY_ADMIN_EMAIL,
    subject: 'World Boss Loot Chest Sync Verification',
    message: 'Requesting GM verification on 50% milestone Void Leviathan co-op chest distribution.',
    priority: 'normal',
    status: 'open',
    createdAt: 1793756000000,
  },
  {
    id: 'tkt_1003',
    category: 'administration',
    senderName: 'System Security Monitor',
    senderEmail: PRIMARY_ADMIN_EMAIL,
    assignedToEmail: PRIMARY_ADMIN_EMAIL,
    subject: 'Root Admin & Moderator Privileges Bound',
    message:
      'Account creatergame31@gmail.com verified with full Administration, GM, Admin, Moderator control and official contact routing.',
    priority: 'critical',
    status: 'resolved',
    resolutionNote: 'All root RBAC permissions and contact endpoints active.',
    resolvedByEmail: PRIMARY_ADMIN_EMAIL,
    createdAt: 1793760000000,
  },
];

export function normalizeAccountEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

export function isPrimaryAdminAccount(email: string): boolean {
  return normalizeAccountEmail(email) === PRIMARY_ADMIN_EMAIL;
}

export function getPermissionsForRole(role: StaffRole, isRoot: boolean = false): AdminPermissions {
  if (isRoot || role === 'owner_admin') {
    return {
      canAccessGmConsole: true,
      canUseGodmodeAndCheats: true,
      canSpawnTroopsAndResources: true,
      canControlWorldTimeAndWeather: true,
      canModeratePlayers: true,
      canModerateChat: true,
      canManageRoles: true,
      canHandleSupportTickets: true,
      isOfficialContact: true,
    };
  }

  switch (role) {
    case 'game_master':
      return {
        canAccessGmConsole: true,
        canUseGodmodeAndCheats: true,
        canSpawnTroopsAndResources: true,
        canControlWorldTimeAndWeather: true,
        canModeratePlayers: true,
        canModerateChat: true,
        canManageRoles: false,
        canHandleSupportTickets: true,
        isOfficialContact: false,
      };
    case 'administrator':
      return {
        canAccessGmConsole: true,
        canUseGodmodeAndCheats: false,
        canSpawnTroopsAndResources: false,
        canControlWorldTimeAndWeather: true,
        canModeratePlayers: true,
        canModerateChat: true,
        canManageRoles: true,
        canHandleSupportTickets: true,
        isOfficialContact: false,
      };
    case 'moderator':
      return {
        canAccessGmConsole: true,
        canUseGodmodeAndCheats: false,
        canSpawnTroopsAndResources: false,
        canControlWorldTimeAndWeather: false,
        canModeratePlayers: true,
        canModerateChat: true,
        canManageRoles: false,
        canHandleSupportTickets: true,
        isOfficialContact: false,
      };
    default:
      return {
        canAccessGmConsole: false,
        canUseGodmodeAndCheats: false,
        canSpawnTroopsAndResources: false,
        canControlWorldTimeAndWeather: false,
        canModeratePlayers: false,
        canModerateChat: false,
        canManageRoles: false,
        canHandleSupportTickets: false,
        isOfficialContact: false,
      };
  }
}

/**
 * Resolves UI permission flags from an email string against a moderation roster.
 *
 * SECURITY BOUNDARY NOTICE:
 * When invoked in the browser (`trustBoundary = 'UNTRUSTED_CLIENT_PREVIEW'`), this result
 * is strictly for local UI previews / offline single-player sandbox controls and MUST NOT be
 * treated as authoritative security enforcement. Authoritative server routes in `server.ts`
 * enforce HMAC-SHA256 signed sessions via `src/game/serverAuth.ts`.
 */
export function verifyAccountPrivileges(
  email: string,
  roster: ModeratedPlayerRecord[] = INITIAL_MODERATED_PLAYERS,
  trustBoundary: SecurityTrustBoundary = 'UNTRUSTED_CLIENT_PREVIEW'
): AccountPrivilegeProfile {
  const normalized = normalizeAccountEmail(email);

  if (normalized === PRIMARY_ADMIN_EMAIL) {
    return {
      email: PRIMARY_ADMIN_EMAIL,
      normalizedEmail: PRIMARY_ADMIN_EMAIL,
      displayName: 'Creator GM & Supreme Administrator',
      primaryRole: 'owner_admin',
      assignedRoles: [
        'Administration',
        'Game Master (GM)',
        'Admin',
        'Moderator',
        'Official Contact',
      ],
      clearanceLevel: 999,
      isRootOwner: true,
      contactEmail: PRIMARY_ADMIN_EMAIL,
      trustBoundary,
      permissions: getPermissionsForRole('owner_admin', true),
    };
  }

  const matchedRecord = roster.find((r) => normalizeAccountEmail(r.email) === normalized);
  const role: StaffRole = matchedRecord ? matchedRecord.role : 'player';

  const roleLabels: Record<StaffRole, string[]> = {
    owner_admin: ['Administration', 'Game Master (GM)', 'Admin', 'Moderator'],
    game_master: ['Game Master (GM)', 'Moderator'],
    administrator: ['Admin', 'Moderator'],
    moderator: ['Moderator'],
    player: ['Player'],
  };

  const clearanceMap: Record<StaffRole, number> = {
    owner_admin: 999,
    game_master: 800,
    administrator: 600,
    moderator: 300,
    player: 1,
  };

  return {
    email: email.trim() || 'guest@voxelrealms.example',
    normalizedEmail: normalized || 'guest@voxelrealms.example',
    displayName: matchedRecord ? matchedRecord.name : 'Realm Sovereign',
    primaryRole: role,
    assignedRoles: roleLabels[role],
    clearanceLevel: clearanceMap[role],
    isRootOwner: false,
    contactEmail: PRIMARY_ADMIN_EMAIL,
    trustBoundary,
    permissions: getPermissionsForRole(role, false),
  };
}

export function applyModerationAction(params: {
  roster: ModeratedPlayerRecord[];
  targetPlayerId: string;
  action: ModerationActionType;
  reason: string;
  actorEmail: string;
  now?: number;
}): {
  success: boolean;
  updatedRoster: ModeratedPlayerRecord[];
  logMessage: string;
} {
  const { roster, targetPlayerId, action, reason, actorEmail, now = Date.now() } = params;

  const actorProfile = verifyAccountPrivileges(actorEmail, roster);
  if (!actorProfile.permissions.canModeratePlayers) {
    return {
      success: false,
      updatedRoster: roster,
      logMessage: `DENIED: Account ${actorEmail} lacks Moderator/Admin privileges.`,
    };
  }

  const target = roster.find((p) => p.id === targetPlayerId);
  if (!target) {
    return {
      success: false,
      updatedRoster: roster,
      logMessage: `ERROR: Target player ${targetPlayerId} not found in roster.`,
    };
  }

  const isTargetRoot = isPrimaryAdminAccount(target.email);
  const isSanctionAction =
    action === 'warn' ||
    action === 'mute' ||
    action === 'temp_ban' ||
    action === 'perm_ban' ||
    action === 'revoke_staff';

  if (isTargetRoot && isSanctionAction) {
    return {
      success: false,
      updatedRoster: roster,
      logMessage: `PROTECTED: Root Administration account (${PRIMARY_ADMIN_EMAIL}) cannot be sanctioned or demoted.`,
    };
  }

  const isRoleAction =
    action === 'grant_moderator' ||
    action === 'grant_admin' ||
    action === 'grant_gm' ||
    action === 'revoke_staff';

  if (isRoleAction && !actorProfile.permissions.canManageRoles) {
    return {
      success: false,
      updatedRoster: roster,
      logMessage: `DENIED: Account ${actorEmail} lacks Role Management clearance.`,
    };
  }

  const cleanReason =
    reason.trim() || `Action [${action.toUpperCase()}] executed by ${actorProfile.email}`;

  const updatedRoster = roster.map((player) => {
    if (player.id !== targetPlayerId) return player;

    switch (action) {
      case 'warn':
        return {
          ...player,
          status: 'warned' as const,
          warningsCount: player.warningsCount + 1,
          sanctionReason: cleanReason,
          lastActionBy: actorProfile.email,
          lastActionTimestamp: now,
        };
      case 'mute':
        return {
          ...player,
          status: 'muted' as const,
          sanctionReason: cleanReason,
          lastActionBy: actorProfile.email,
          lastActionTimestamp: now,
        };
      case 'temp_ban':
        return {
          ...player,
          status: 'temp_banned' as const,
          sanctionReason: cleanReason,
          lastActionBy: actorProfile.email,
          lastActionTimestamp: now,
        };
      case 'perm_ban':
        return {
          ...player,
          status: 'perm_banned' as const,
          sanctionReason: cleanReason,
          lastActionBy: actorProfile.email,
          lastActionTimestamp: now,
        };
      case 'restore_active':
        return {
          ...player,
          status: 'active' as const,
          sanctionReason: cleanReason,
          lastActionBy: actorProfile.email,
          lastActionTimestamp: now,
        };
      case 'grant_moderator':
        return {
          ...player,
          role: 'moderator' as const,
          sanctionReason: cleanReason,
          lastActionBy: actorProfile.email,
          lastActionTimestamp: now,
        };
      case 'grant_admin':
        return {
          ...player,
          role: 'administrator' as const,
          sanctionReason: cleanReason,
          lastActionBy: actorProfile.email,
          lastActionTimestamp: now,
        };
      case 'grant_gm':
        return {
          ...player,
          role: 'game_master' as const,
          sanctionReason: cleanReason,
          lastActionBy: actorProfile.email,
          lastActionTimestamp: now,
        };
      case 'revoke_staff':
        return {
          ...player,
          role: 'player' as const,
          sanctionReason: cleanReason,
          lastActionBy: actorProfile.email,
          lastActionTimestamp: now,
        };
    }
  });

  return {
    success: true,
    updatedRoster,
    logMessage: `[MODERATION] ${actorProfile.email} executed ${action.toUpperCase()} on ${target.name} (${target.email}) — Reason: ${cleanReason}`,
  };
}

export function createContactTicket(params: {
  tickets: SupportTicket[];
  category: ContactCategory;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  now?: number;
}): {
  success: boolean;
  ticket?: SupportTicket;
  updatedTickets: SupportTicket[];
  error?: string;
} {
  const {
    tickets,
    category,
    senderName,
    senderEmail,
    subject,
    message,
    priority = 'normal',
    now = Date.now(),
  } = params;

  const trimmedSubject = subject.trim();
  const trimmedMessage = message.trim();
  const trimmedEmail = normalizeAccountEmail(senderEmail) || PRIMARY_ADMIN_EMAIL;

  if (!trimmedSubject || !trimmedMessage) {
    return {
      success: false,
      updatedTickets: tickets,
      error:
        'Both subject and message are required to dispatch a ticket to creatergame31@gmail.com.',
    };
  }

  const newTicket: SupportTicket = {
    id: `tkt_${now}_${Math.floor(now % 1000)}`,
    category,
    senderName: senderName.trim() || 'Realm Lord',
    senderEmail: trimmedEmail,
    assignedToEmail: PRIMARY_ADMIN_EMAIL,
    subject: trimmedSubject,
    message: trimmedMessage,
    priority,
    status: 'open',
    createdAt: now,
  };

  return {
    success: true,
    ticket: newTicket,
    updatedTickets: [newTicket, ...tickets],
  };
}

export function resolveContactTicket(params: {
  tickets: SupportTicket[];
  ticketId: string;
  status: 'investigating' | 'resolved';
  resolutionNote: string;
  actorEmail: string;
  roster?: ModeratedPlayerRecord[];
}): {
  success: boolean;
  updatedTickets: SupportTicket[];
  logMessage: string;
} {
  const {
    tickets,
    ticketId,
    status,
    resolutionNote,
    actorEmail,
    roster = INITIAL_MODERATED_PLAYERS,
  } = params;

  const profile = verifyAccountPrivileges(actorEmail, roster);
  if (!profile.permissions.canHandleSupportTickets) {
    return {
      success: false,
      updatedTickets: tickets,
      logMessage: `DENIED: ${actorEmail} is not authorized to manage support/moderation tickets.`,
    };
  }

  const target = tickets.find((t) => t.id === ticketId);
  if (!target) {
    return {
      success: false,
      updatedTickets: tickets,
      logMessage: `ERROR: Ticket ${ticketId} not found.`,
    };
  }

  const note =
    resolutionNote.trim() ||
    `Marked ${status.toUpperCase()} by ${profile.email} (Administration/GM/Moderator).`;

  const updatedTickets = tickets.map((t) =>
    t.id === ticketId
      ? {
          ...t,
          status,
          resolutionNote: note,
          resolvedByEmail: profile.email,
        }
      : t
  );

  return {
    success: true,
    updatedTickets,
    logMessage: `[TICKET ${status.toUpperCase()}] ${target.id} ("${target.subject}") updated by ${profile.email}.`,
  };
}

export function buildMailtoHref(
  channel: ContactChannelInfo,
  customSubject?: string,
  customBody?: string
): string {
  const subject = customSubject?.trim()
    ? `${channel.subjectPrefix} - ${customSubject.trim()}`
    : `${channel.subjectPrefix} - Official Inquiry`;
  const body =
    customBody?.trim() ||
    `Hello Voxel Realms Administration / GM / Moderator Team (${channel.email}),\n\nCategory: ${channel.title}\n\nDetails:\n`;
  return `mailto:${channel.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
