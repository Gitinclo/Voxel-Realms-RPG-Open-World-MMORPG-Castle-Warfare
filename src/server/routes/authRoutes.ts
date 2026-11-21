/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';
import type { Express } from 'express';
import {
  DEFAULT_OPERATOR_SESSION_TTL_MS,
  buildClearSessionCookieHeader,
  buildSessionSetCookieHeader,
  createAuditEntry,
  issueSessionTokenForOperator,
  issueSessionTokenForPlayer,
  issueSessionTokenFromVerifiedFirebaseUser,
} from '../../game/serverAuth';
import { verifyFirebaseBearerToken } from '../../middleware/auth.ts';
import { getOrCreateUser } from '../../db/users.ts';
import { isHttpsRequest } from '../securityHeaders';
import type { ServerContext } from '../types';

export function registerAuthRoutes(app: Express, ctx: ServerContext): void {
  app.get('/api/auth/session', (req, res) => {
    const session = ctx.resolveRequestSession(req);
    res.json({
      ok: true,
      authenticated: Boolean(session),
      session,
      securityMode: {
        isProduction: ctx.securityConfig.isProduction,
        operatorLoginConfigured: Boolean(ctx.securityConfig.adminPasskey),
        ephemeralDevPasskeyActive: ctx.securityConfig.ephemeralDevPasskeyGenerated,
      },
    });
  });

  app.post('/api/auth/firebase-exchange', async (req, res) => {
    const verified = await verifyFirebaseBearerToken(req.headers.authorization);
    if (!verified.ok) {
      ctx.appendAuditEntry(
        createAuditEntry({
          eventType: 'ADMIN_LOGIN_FAILED',
          actorEmail: 'anonymous',
          actorRole: 'anonymous',
          outcome: 'denied',
          detail: `Firebase ID token exchange rejected: ${verified.error}`,
        })
      );
      res.status(401).json({ ok: false, error: verified.error });
      return;
    }

    const decoded = verified.decoded;
    const result = issueSessionTokenFromVerifiedFirebaseUser({
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: Boolean(decoded.email_verified),
      displayName: typeof decoded.name === 'string' ? decoded.name : undefined,
      roster: ctx.store.moderatedPlayers,
      secret: ctx.securityConfig.sessionSecret,
      allowGodMode: ctx.securityConfig.allowProductionGodMode,
    });

    if (!result.ok) {
      ctx.appendAuditEntry(
        createAuditEntry({
          eventType: 'ADMIN_LOGIN_FAILED',
          actorEmail: (decoded.email || 'anonymous').toLowerCase(),
          actorRole: 'anonymous',
          outcome: 'denied',
          detail: result.error,
        })
      );
      ctx.persistStoreToDisk(ctx.store);
      res.status(result.statusCode).json({ ok: false, error: result.error });
      return;
    }

    if (process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_DB_NAME) {
      getOrCreateUser(decoded.uid, result.session.email, result.session.displayName).catch(
        (err) => {
          console.warn('Non-fatal PostgreSQL user sync warning during auth exchange:', err);
        }
      );
    }

    res.setHeader('Set-Cookie', buildSessionSetCookieHeader(result.token, isHttpsRequest(req)));

    ctx.appendAuditEntry(
      createAuditEntry({
        eventType: result.session.permissions.canAccessGmConsole
          ? 'ADMIN_LOGIN_SUCCESS'
          : 'PLAYER_SESSION_ISSUED',
        actorEmail: result.session.email,
        actorRole: result.session.role,
        outcome: 'allowed',
        detail: `Verified Firebase Google session exchanged for ${result.session.email} (Clearance Lv.${result.session.clearanceLevel})`,
      })
    );
    ctx.persistStoreToDisk(ctx.store);

    res.json({
      ok: true,
      authenticated: true,
      authSource: 'firebase_id_token',
      session: result.session,
    });
  });

  app.post('/api/auth/player-session', (req, res) => {
    const body = (req.body || {}) as {
      commanderId?: string;
      displayName?: string;
    };

    const issued = issueSessionTokenForPlayer({
      commanderId: body.commanderId || `guest-${crypto.randomUUID().slice(0, 8)}`,
      displayName: body.displayName || 'Guest Vanguard',
      secret: ctx.securityConfig.sessionSecret,
    });

    res.setHeader('Set-Cookie', buildSessionSetCookieHeader(issued.token, isHttpsRequest(req)));

    ctx.appendAuditEntry(
      createAuditEntry({
        eventType: 'PLAYER_SESSION_ISSUED',
        actorEmail: issued.session.email,
        actorRole: 'player',
        outcome: 'allowed',
        detail: `Issued scoped guest session (Clearance Lv.1) for ${issued.session.commanderId}`,
      })
    );
    ctx.persistStoreToDisk(ctx.store);

    res.json({
      ok: true,
      authenticated: true,
      session: issued.session,
    });
  });

  app.post('/api/auth/admin-login', (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const lockoutKey = `${clientIp}:admin-login`;
    const lockStatus = ctx.loginLockoutGuard.isLocked(lockoutKey);
    if (lockStatus.locked) {
      res.setHeader('Retry-After', String(lockStatus.retryAfterSec));
      res.status(429).json({
        ok: false,
        error: `Too many failed operator login attempts. Account locked for ${lockStatus.retryAfterSec}s.`,
      });
      return;
    }

    const body = (req.body || {}) as { email?: string; passkey?: string };
    const result = issueSessionTokenForOperator({
      email: body.email || '',
      passkey: body.passkey || '',
      configuredPasskey: ctx.securityConfig.adminPasskey,
      roster: ctx.store.moderatedPlayers,
      secret: ctx.securityConfig.sessionSecret,
      allowGodMode: ctx.securityConfig.allowProductionGodMode,
    });

    if (!result.ok) {
      if (result.statusCode === 401 || result.statusCode === 403) {
        const failInfo = ctx.loginLockoutGuard.recordFailure(lockoutKey);
        if (failInfo.lockedNow) {
          res.setHeader('Retry-After', String(failInfo.retryAfterSec));
        }
      }
      ctx.appendAuditEntry(
        createAuditEntry({
          eventType: 'ADMIN_LOGIN_FAILED',
          actorEmail: (body.email || 'anonymous').trim().toLowerCase() || 'anonymous',
          actorRole: 'anonymous',
          outcome: 'denied',
          detail: result.error,
        })
      );
      ctx.persistStoreToDisk(ctx.store);
      res.status(result.statusCode).json({
        ok: false,
        error: result.error,
      });
      return;
    }

    ctx.loginLockoutGuard.recordSuccess(lockoutKey);
    res.setHeader(
      'Set-Cookie',
      buildSessionSetCookieHeader(
        result.token,
        isHttpsRequest(req),
        Math.floor(DEFAULT_OPERATOR_SESSION_TTL_MS / 1000)
      )
    );

    ctx.appendAuditEntry(
      createAuditEntry({
        eventType: 'ADMIN_LOGIN_SUCCESS',
        actorEmail: result.session.email,
        actorRole: result.session.role,
        outcome: 'allowed',
        detail: `Operator session minted for ${result.session.email} (Clearance Lv.${result.session.clearanceLevel})`,
      })
    );
    ctx.persistStoreToDisk(ctx.store);

    res.json({
      ok: true,
      authenticated: true,
      session: result.session,
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const session = ctx.resolveRequestSession(req);
    res.setHeader('Set-Cookie', buildClearSessionCookieHeader(isHttpsRequest(req)));
    if (session) {
      ctx.appendAuditEntry(
        createAuditEntry({
          eventType: 'SESSION_LOGOUT',
          actorEmail: session.email,
          actorRole: session.role,
          outcome: 'allowed',
          detail: `Signed out verified session ${session.sessionId}`,
        })
      );
      ctx.persistStoreToDisk(ctx.store);
    }
    res.json({ ok: true, authenticated: false, session: null });
  });
}
