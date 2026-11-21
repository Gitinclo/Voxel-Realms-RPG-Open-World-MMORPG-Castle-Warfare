/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';
import type { Express } from 'express';
import {
  AdminPermissions,
  ContactCategory,
  ModerationActionType,
  applyModerationAction,
  createContactTicket,
  resolveContactTicket,
} from '../../game/adminModeration';
import { createAuditEntry } from '../../game/serverAuth';
import type { ServerContext, ServerDecreeRecord } from '../types';

export function registerAdminRoutes(app: Express, ctx: ServerContext): void {
  app.get('/api/admin/state', (req, res) => {
    const session = ctx.requireStaffPermission(req, res, 'canAccessGmConsole');
    if (!session) return;

    res.json({
      ok: true,
      session,
      roster: ctx.store.moderatedPlayers,
      tickets: ctx.store.supportTickets,
      auditLog: ctx.store.securityAuditLog,
      activeDecrees: ctx.store.activeDecrees,
      speciesSwitchGlobalApproved: ctx.store.speciesSwitchGlobalApproved,
    });
  });

  app.post('/api/admin/moderation', (req, res) => {
    const body = (req.body || {}) as {
      targetPlayerId?: string;
      action?: ModerationActionType;
      reason?: string;
    };

    const action = body.action;
    const isRoleAction =
      action === 'grant_moderator' ||
      action === 'grant_admin' ||
      action === 'grant_gm' ||
      action === 'revoke_staff';

    const requiredPermission: keyof AdminPermissions = isRoleAction
      ? 'canManageRoles'
      : 'canModeratePlayers';

    const session = ctx.requireStaffPermission(req, res, requiredPermission);
    if (!session) return;

    if (!body.targetPlayerId || !action) {
      res.status(400).json({ ok: false, error: 'Missing targetPlayerId or action.' });
      return;
    }

    const result = applyModerationAction({
      roster: ctx.store.moderatedPlayers,
      targetPlayerId: body.targetPlayerId,
      action,
      reason: body.reason || '',
      actorEmail: session.email,
    });

    ctx.appendAuditEntry(
      createAuditEntry({
        eventType: 'MODERATION_EXECUTED',
        actorEmail: session.email,
        actorRole: session.role,
        outcome: result.success ? 'allowed' : 'denied',
        detail: result.logMessage,
      })
    );

    if (!result.success) {
      ctx.persistStoreToDisk(ctx.store);
      res.status(403).json({
        ok: false,
        error: result.logMessage,
        roster: ctx.store.moderatedPlayers,
        auditLog: ctx.store.securityAuditLog,
      });
      return;
    }

    ctx.store.moderatedPlayers = result.updatedRoster;
    ctx.persistStoreToDisk(ctx.store);

    res.json({
      ok: true,
      logMessage: result.logMessage,
      roster: ctx.store.moderatedPlayers,
      auditLog: ctx.store.securityAuditLog,
    });
  });

  app.post('/api/admin/tickets', (req, res) => {
    const session = ctx.requireAuthenticatedSession(req, res);
    if (!session) return;

    const body = (req.body || {}) as {
      category?: ContactCategory;
      subject?: string;
      message?: string;
      priority?: 'low' | 'normal' | 'high' | 'critical';
    };

    const result = createContactTicket({
      tickets: ctx.store.supportTickets,
      category: body.category || 'administration',
      senderName: session.displayName,
      senderEmail: session.email,
      subject: body.subject || '',
      message: body.message || '',
      priority: body.priority || 'normal',
    });

    if (!result.success || !result.ticket) {
      res.status(400).json({ ok: false, error: result.error || 'Invalid ticket payload.' });
      return;
    }

    ctx.store.supportTickets = result.updatedTickets;
    ctx.appendAuditEntry(
      createAuditEntry({
        eventType: 'TICKET_CREATED',
        actorEmail: session.email,
        actorRole: session.role,
        outcome: 'allowed',
        detail: `Created ticket ${result.ticket.id} ("${result.ticket.subject}")`,
      })
    );
    ctx.persistStoreToDisk(ctx.store);

    res.json({
      ok: true,
      ticket: result.ticket,
      tickets: ctx.store.supportTickets,
    });
  });

  app.post('/api/admin/tickets/resolve', (req, res) => {
    const session = ctx.requireStaffPermission(req, res, 'canHandleSupportTickets');
    if (!session) return;

    const body = (req.body || {}) as {
      ticketId?: string;
      status?: 'investigating' | 'resolved';
      resolutionNote?: string;
    };

    if (!body.ticketId || (body.status !== 'investigating' && body.status !== 'resolved')) {
      res.status(400).json({ ok: false, error: 'Invalid ticketId or status.' });
      return;
    }

    const result = resolveContactTicket({
      tickets: ctx.store.supportTickets,
      ticketId: body.ticketId,
      status: body.status,
      resolutionNote: body.resolutionNote || '',
      actorEmail: session.email,
      roster: ctx.store.moderatedPlayers,
    });

    ctx.appendAuditEntry(
      createAuditEntry({
        eventType: 'TICKET_UPDATED',
        actorEmail: session.email,
        actorRole: session.role,
        outcome: result.success ? 'allowed' : 'denied',
        detail: result.logMessage,
      })
    );

    if (!result.success) {
      ctx.persistStoreToDisk(ctx.store);
      res.status(400).json({ ok: false, error: result.logMessage });
      return;
    }

    ctx.store.supportTickets = result.updatedTickets;
    ctx.persistStoreToDisk(ctx.store);

    res.json({
      ok: true,
      logMessage: result.logMessage,
      tickets: ctx.store.supportTickets,
      auditLog: ctx.store.securityAuditLog,
    });
  });

  app.post('/api/admin/decree', (req, res) => {
    const session = ctx.requireStaffPermission(req, res, 'canModerateChat');
    if (!session) return;

    const body = (req.body || {}) as { message?: string };
    const cleanMsg = (body.message || '').trim().slice(0, 280);
    if (!cleanMsg) {
      res.status(400).json({ ok: false, error: 'Decree message cannot be empty.' });
      return;
    }

    const decree: ServerDecreeRecord = {
      id: `dec_${crypto.randomUUID().slice(0, 8)}`,
      authorEmail: session.email,
      authorRole: session.role,
      message: cleanMsg,
      createdAtIso: new Date().toISOString(),
    };
    ctx.store.activeDecrees.unshift(decree);
    if (ctx.store.activeDecrees.length > 50) ctx.store.activeDecrees.length = 50;

    ctx.appendAuditEntry(
      createAuditEntry({
        eventType: 'MODERATION_EXECUTED',
        actorEmail: session.email,
        actorRole: session.role,
        outcome: 'allowed',
        detail: `Published official decree: "${cleanMsg}"`,
      })
    );
    ctx.persistStoreToDisk(ctx.store);

    res.json({
      ok: true,
      decree,
      activeDecrees: ctx.store.activeDecrees,
      auditLog: ctx.store.securityAuditLog,
    });
  });

  app.post('/api/admin/species-rebirth', (req, res) => {
    const session = ctx.requireStaffPermission(req, res, 'canManageRoles');
    if (!session) return;

    const body = (req.body || {}) as { approved?: boolean };
    ctx.store.speciesSwitchGlobalApproved = Boolean(body.approved);

    ctx.appendAuditEntry(
      createAuditEntry({
        eventType: 'MODERATION_EXECUTED',
        actorEmail: session.email,
        actorRole: session.role,
        outcome: 'allowed',
        detail: `Set server speciesSwitchGlobalApproved = ${ctx.store.speciesSwitchGlobalApproved}`,
      })
    );
    ctx.persistStoreToDisk(ctx.store);

    res.json({
      ok: true,
      speciesSwitchGlobalApproved: ctx.store.speciesSwitchGlobalApproved,
      auditLog: ctx.store.securityAuditLog,
    });
  });
}
