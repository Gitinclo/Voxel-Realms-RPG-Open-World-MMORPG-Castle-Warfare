/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Express } from 'express';
import { sanitizeCloudProfilePatch } from '../../game/antiCheat';
import { createAuditEntry } from '../../game/serverAuth';
import { AuthRequest, requireAuth } from '../../middleware/auth.ts';
import {
  createSupportTicketForUid,
  getCommanderProfileForUid,
  getOrCreateUser,
  getRealmSaveForUid,
  listSupportTicketsForUid,
  upsertCommanderProfileForUid,
  upsertRealmSaveForUid,
} from '../../db/users.ts';
import type { ServerContext } from '../types';

function isSqlConnectionUnavailable(error: unknown): boolean {
  if (!process.env.SQL_HOST) return true;
  const msg = error instanceof Error ? error.message : String(error);
  return /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EAI_AGAIN|Connection terminated/i.test(msg);
}

function isPrivilegedCloudRole(role: string | undefined, claimRole: unknown): boolean {
  const normalizedRole = (role ?? '').trim().toLowerCase();
  const normalizedClaim = typeof claimRole === 'string' ? claimRole.trim().toLowerCase() : '';
  return (
    normalizedRole === 'owner_admin' ||
    normalizedRole === 'admin' ||
    normalizedClaim === 'owner_admin' ||
    normalizedClaim === 'admin'
  );
}

export function registerDbRoutes(app: Express, ctx: ServerContext): void {
  app.get('/api/db/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@voxelrealms.local`;
      const displayName =
        typeof req.user!.name === 'string' && req.user!.name.trim()
          ? req.user!.name.trim()
          : 'Sovereign Vanguard';

      const user = await getOrCreateUser(uid, email, displayName);
      const profileRecord = await getCommanderProfileForUid(uid);
      const realmSave = await getRealmSaveForUid(uid);

      res.json({
        ok: true,
        user: {
          id: user.id,
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
        profile: profileRecord?.profile ?? null,
        hasRealmSave: Boolean(realmSave),
        realmSaveUpdatedAt: realmSave?.updatedAt ?? null,
      });
    } catch (error) {
      if (isSqlConnectionUnavailable(error)) {
        res.status(503).json({
          ok: false,
          error: 'Persistent storage service temporarily unavailable.',
        });
        return;
      }
      console.error('Failed to fetch authenticated commander profile:', error);
      res.status(500).json({
        ok: false,
        error: 'Unable to load commander profile.',
      });
    }
  });

  app.put('/api/db/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@voxelrealms.local`;
      const displayName =
        typeof req.user!.name === 'string' && req.user!.name.trim()
          ? req.user!.name.trim()
          : undefined;
      const body = (req.body || {}) as Record<string, unknown>;
      const existingRecord = await getCommanderProfileForUid(uid);
      const isPrivilegedStaff = isPrivilegedCloudRole(
        existingRecord?.user?.role,
        (req.user as Record<string, unknown> | undefined)?.role
      );

      const sanitized = sanitizeCloudProfilePatch({
        existingProfile: existingRecord?.profile ?? null,
        incoming: body,
        isPrivilegedStaff,
      });

      if (sanitized.flaggedViolations.length > 0) {
        ctx.opsCounters.antiCheatSanitizedWrites += 1;
        ctx.appendAuditEntry(
          createAuditEntry({
            eventType: 'ANTI_CHEAT_TRIGGERED',
            actorEmail: email,
            actorRole: isPrivilegedStaff ? 'owner_admin' : 'player',
            outcome: 'clamped',
            detail: `Sanitized cloud profile tamper attempt on PUT /api/db/profile: [${sanitized.flaggedViolations.join(', ')}]`,
          })
        );
        ctx.persistStoreToDisk(ctx.store);
      }

      const saved = await upsertCommanderProfileForUid(uid, email, displayName, sanitized.patch);

      res.json({
        ok: true,
        sanitizedFields: sanitized.flaggedViolations,
        user: saved.user,
        profile: saved.profile,
      });
    } catch (error) {
      if (isSqlConnectionUnavailable(error)) {
        res.status(503).json({
          ok: false,
          error: 'Persistent storage service temporarily unavailable.',
        });
        return;
      }
      console.error('Failed to save authenticated commander profile:', error);
      res.status(500).json({
        ok: false,
        error: 'Unable to save commander profile.',
      });
    }
  });

  app.get('/api/db/save', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const save = await getRealmSaveForUid(uid);
      if (!save) {
        res.json({ ok: true, exists: false, snapshot: null, version: 0, updatedAt: null });
        return;
      }
      res.json({
        ok: true,
        exists: true,
        snapshot: JSON.parse(save.snapshotJson),
        version: save.version,
        updatedAt: save.updatedAt,
      });
    } catch (error) {
      if (isSqlConnectionUnavailable(error)) {
        res.status(503).json({
          ok: false,
          error: 'Persistent storage service temporarily unavailable.',
        });
        return;
      }
      console.error('Failed to load realm save:', error);
      res.status(500).json({
        ok: false,
        error: 'Unable to load realm save.',
      });
    }
  });

  app.put('/api/db/save', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@voxelrealms.local`;
      const displayName =
        typeof req.user!.name === 'string' && req.user!.name.trim()
          ? req.user!.name.trim()
          : undefined;
      const body = (req.body || {}) as { snapshot?: unknown; version?: number };
      if (!body.snapshot || typeof body.snapshot !== 'object') {
        res.status(400).json({ ok: false, error: 'Invalid realm snapshot payload.' });
        return;
      }

      const existingRecord = await getCommanderProfileForUid(uid);
      const isPrivilegedStaff = isPrivilegedCloudRole(
        existingRecord?.user?.role,
        (req.user as Record<string, unknown> | undefined)?.role
      );
      const snapshotObj = body.snapshot as Record<string, unknown>;
      const sanitized = sanitizeCloudProfilePatch({
        existingProfile: existingRecord?.profile ?? null,
        incoming: snapshotObj,
        isPrivilegedStaff,
      });

      let safeSnapshot: Record<string, unknown> = snapshotObj;
      if (sanitized.flaggedViolations.length > 0) {
        ctx.opsCounters.antiCheatSanitizedWrites += 1;
        ctx.appendAuditEntry(
          createAuditEntry({
            eventType: 'ANTI_CHEAT_TRIGGERED',
            actorEmail: email,
            actorRole: isPrivilegedStaff ? 'owner_admin' : 'player',
            outcome: 'clamped',
            detail: `Sanitized cloud save tamper attempt on PUT /api/db/save: [${sanitized.flaggedViolations.join(', ')}]`,
          })
        );
        ctx.persistStoreToDisk(ctx.store);
        safeSnapshot = {
          ...snapshotObj,
          ...(sanitized.patch.castleLevel !== undefined
            ? { castleLevel: sanitized.patch.castleLevel }
            : {}),
          ...(sanitized.patch.cultivationRealmIndex !== undefined
            ? { cultivationRealmIndex: sanitized.patch.cultivationRealmIndex }
            : {}),
          ...(sanitized.patch.vipTier !== undefined ? { vipTier: sanitized.patch.vipTier } : {}),
          ...(sanitized.patch.garrisonTroopsWire !== undefined
            ? { garrisonTroopsWire: sanitized.patch.garrisonTroopsWire }
            : {}),
        };
      }

      const serialized = JSON.stringify(safeSnapshot);
      if (serialized.length > 262_144) {
        res.status(413).json({ ok: false, error: 'Realm snapshot exceeds 256 KB limit.' });
        return;
      }

      const save = await upsertRealmSaveForUid(
        uid,
        email,
        displayName,
        serialized,
        typeof body.version === 'number' ? body.version : 1
      );

      res.json({
        ok: true,
        sanitizedFields: sanitized.flaggedViolations,
        version: save.version,
        updatedAt: save.updatedAt,
      });
    } catch (error) {
      if (isSqlConnectionUnavailable(error)) {
        res.status(503).json({
          ok: false,
          error: 'Persistent storage service temporarily unavailable.',
        });
        return;
      }
      console.error('Failed to persist realm save:', error);
      res.status(500).json({
        ok: false,
        error: 'Unable to save realm progress.',
      });
    }
  });

  app.get('/api/db/tickets', requireAuth, async (req: AuthRequest, res) => {
    try {
      const tickets = await listSupportTicketsForUid(req.user!.uid);
      res.json({ ok: true, tickets });
    } catch (error) {
      if (isSqlConnectionUnavailable(error)) {
        res.status(503).json({
          ok: false,
          error: 'Persistent storage service temporarily unavailable.',
        });
        return;
      }
      console.error('Failed to list support tickets:', error);
      res.status(500).json({
        ok: false,
        error: 'Unable to load support tickets.',
      });
    }
  });

  app.post('/api/db/tickets', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@voxelrealms.local`;
      const displayName =
        typeof req.user!.name === 'string' && req.user!.name.trim()
          ? req.user!.name.trim()
          : undefined;
      const body = (req.body || {}) as { category?: string; subject?: string; message?: string };
      if (!body.subject?.trim() || !body.message?.trim()) {
        res.status(400).json({ ok: false, error: 'Subject and message are required.' });
        return;
      }

      const ticket = await createSupportTicketForUid(uid, email, displayName, {
        category: body.category || 'general',
        subject: body.subject,
        message: body.message,
      });
      res.status(201).json({ ok: true, ticket });
    } catch (error) {
      if (isSqlConnectionUnavailable(error)) {
        res.status(503).json({
          ok: false,
          error: 'Persistent storage service temporarily unavailable.',
        });
        return;
      }
      console.error('Failed to create support ticket:', error);
      res.status(500).json({
        ok: false,
        error: 'Unable to submit support ticket.',
      });
    }
  });
}
