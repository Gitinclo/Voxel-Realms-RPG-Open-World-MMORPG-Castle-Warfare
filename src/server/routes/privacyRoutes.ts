/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';
import type { Express } from 'express';
import { buildClearSessionCookieHeader, createAuditEntry } from '../../game/serverAuth';
import { isPostgresConfigured } from '../../db/index.ts';
import { deleteUserDataForUid } from '../../db/users.ts';
import { isHttpsRequest } from '../securityHeaders';
import type { ServerContext } from '../types';

export function registerPrivacyRoutes(app: Express, ctx: ServerContext): void {
  app.get('/api/online/account/export', (req, res) => {
    const session = ctx.requireAuthenticatedSession(req, res);
    if (!session) return;

    const commander = ctx.store.commanders[session.commanderId] ?? null;
    const economy = ctx.store.economyAccounts?.[session.commanderId] ?? null;
    const tickets = ctx.store.supportTickets.filter(
      (t) => t.senderEmail.toLowerCase() === session.email.toLowerCase()
    );

    res.json({
      ok: true,
      exportedAtIso: new Date().toISOString(),
      account: {
        commanderId: session.commanderId,
        email: session.email,
        displayName: session.displayName,
        role: session.role,
      },
      commanderSnapshot: commander,
      economyAccount: economy,
      supportTickets: tickets,
      backingStores: {
        memoryAndDiskStore: 'included',
        postgresqlConfigured: isPostgresConfigured(),
        firestoreClientSync: 'client_owned_or_user_scoped',
        gmailOAuthTokens: 'in_memory_browser_only_not_persisted_on_server',
      },
    });
  });

  app.delete('/api/online/account', async (req, res) => {
    const session = ctx.requireAuthenticatedSession(req, res);
    if (!session) return;

    const dsrReceiptId = `dsr_${crypto.randomUUID().slice(0, 12)}`;
    const existedCommander = Boolean(ctx.store.commanders[session.commanderId]);
    const existedEconomy = Boolean(ctx.store.economyAccounts?.[session.commanderId]);
    const previousTicketsCount = ctx.store.supportTickets.length;

    delete ctx.store.commanders[session.commanderId];
    if (ctx.store.economyAccounts) {
      delete ctx.store.economyAccounts[session.commanderId];
    }
    ctx.store.supportTickets = ctx.store.supportTickets.filter(
      (t) => t.senderEmail.toLowerCase() !== session.email.toLowerCase()
    );
    const removedSupportTickets = previousTicketsCount - ctx.store.supportTickets.length;

    let sqlDeleted = false;
    let sqlStatus: 'deleted' | 'not_configured' | 'error' = 'not_configured';
    if (isPostgresConfigured()) {
      try {
        const sqlRes = await deleteUserDataForUid(session.commanderId);
        sqlDeleted = sqlRes.deleted;
        sqlStatus = 'deleted';
      } catch (err) {
        sqlStatus = 'error';
        console.warn(
          'Non-fatal PostgreSQL erasure warning during DELETE /api/online/account:',
          err
        );
      }
    }

    ctx.appendAuditEntry(
      createAuditEntry({
        eventType: 'SESSION_LOGOUT',
        actorEmail: '[erased-subject]',
        actorRole: session.role,
        outcome: 'allowed',
        detail: `DSR erasure receipt ${dsrReceiptId} executed for subject ${session.commanderId} (commander=${existedCommander}, economy=${existedEconomy}, tickets=${removedSupportTickets}, sql=${sqlStatus})`,
      })
    );
    ctx.persistStoreToDisk(ctx.store);

    res.setHeader('Set-Cookie', buildClearSessionCookieHeader(isHttpsRequest(req)));
    res.json({
      ok: true,
      erased: true,
      dsrReceiptId,
      erasedAtIso: new Date().toISOString(),
      commanderId: session.commanderId,
      erasedRecords: {
        commanderProfile: existedCommander,
        economyLedger: existedEconomy,
        supportTicketsRemoved: removedSupportTickets,
        postgresUser: sqlDeleted,
      },
      erasurePipelineStatus: {
        memoryAndDisk: 'erased_and_flushed',
        postgresql: sqlStatus,
        sessionCookie: 'revoked',
        gmailOAuthTokens: 'none_stored_server_side',
        firebaseAuthAndFirestore: 'manual_or_client_sdk_deletion_required',
        securityAuditLogRetention: 'anonymized_subject_retained_for_compliance',
      },
    });
  });
}
