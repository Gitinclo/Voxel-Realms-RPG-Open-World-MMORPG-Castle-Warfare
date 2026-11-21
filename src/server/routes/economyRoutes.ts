/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Express, Request, Response } from 'express';
import {
  GameplayEventValidationInput,
  LedgerResourceKey,
  LedgerTxDirection,
  LedgerTxReason,
  applyAuthoritativeCastleUpgrade,
  applyAuthoritativeEconomyTransaction,
  applyAuthoritativeMarketTrade,
  applyAuthoritativeTroopPurchase,
  validateAndApplyGameplayEvent,
  verifyEconomyLedgerIntegrity,
} from '../../game/economyLedger';
import { createAuditEntry } from '../../game/serverAuth';
import type { ServerContext } from '../types';

export function registerEconomyRoutes(app: Express, ctx: ServerContext): void {
  app.get('/api/online/economy/balance', (req, res) => {
    const session = ctx.requireAuthenticatedSession(req, res);
    if (!session) return;

    const account = ctx.getOrCreateEconomyAccount(session.commanderId);
    const integrity = verifyEconomyLedgerIntegrity(account);
    res.json({
      ok: true,
      commanderId: account.commanderId,
      castleLevel: account.castleLevel ?? 1,
      balances: account.balances,
      troops: account.troops ?? { shieldbearers: {}, shooters: {}, bombers: {} },
      totalTaxCollectedWire: account.totalTaxCollectedWire ?? '0',
      version: account.version ?? 1,
      recentEntries: account.ledger.slice(-25),
      integrity,
      updatedAtIso: account.updatedAtIso,
    });
  });

  app.post('/api/online/economy/transact', (req, res) => {
    const session = ctx.requireAuthenticatedSession(req, res);
    if (!session) return;

    const body = (req.body || {}) as {
      idempotencyKey?: string;
      resource?: LedgerResourceKey;
      direction?: LedgerTxDirection;
      amountWire?: string;
      reason?: LedgerTxReason;
    };

    const currentAccount = ctx.getOrCreateEconomyAccount(session.commanderId);
    const txResult = applyAuthoritativeEconomyTransaction(currentAccount, {
      idempotencyKey: body.idempotencyKey || '',
      resource: body.resource as LedgerResourceKey,
      direction: body.direction as LedgerTxDirection,
      amountWire: body.amountWire || '',
      reason: body.reason as LedgerTxReason,
      isPrivilegedStaff: session.permissions.canUseGodmodeAndCheats,
      serverAuthorizedCredit: false,
    });

    if (!txResult.ok) {
      if (
        txResult.code === 'CLIENT_SELF_CREDIT_FORBIDDEN' ||
        txResult.code === 'ADMIN_REASON_FORBIDDEN'
      ) {
        ctx.opsCounters.antiCheatRejections += 1;
        ctx.appendAuditEntry(
          createAuditEntry({
            eventType: 'ANTI_CHEAT_TRIGGERED',
            actorEmail: session.email,
            actorRole: session.role,
            outcome: 'denied',
            detail: `Economy ledger transaction rejected (${txResult.code}): ${txResult.error}`,
          })
        );
        ctx.persistStoreToDisk(ctx.store);
      }
      res.status(txResult.statusCode).json({
        ok: false,
        code: txResult.code,
        error: txResult.error,
      });
      return;
    }

    if (!txResult.replayed) {
      ctx.store.economyAccounts![session.commanderId] = txResult.account;
      ctx.persistStoreToDisk(ctx.store);
    }

    res.json({
      ok: true,
      replayed: txResult.replayed,
      entry: txResult.entry,
      balances: txResult.account.balances,
      integrity: verifyEconomyLedgerIntegrity(txResult.account),
    });
  });

  const handleValidatedGameplayEvent = (req: Request, res: Response) => {
    const session = ctx.requireAuthenticatedSession(req, res);
    if (!session) return;

    const rawPayload = (req.body || {}) as GameplayEventValidationInput;
    const currentAccount = ctx.getOrCreateEconomyAccount(session.commanderId);
    const eventResult = validateAndApplyGameplayEvent(currentAccount, rawPayload);

    if (!eventResult.ok) {
      if (eventResult.retryAfterSec) {
        res.setHeader('Retry-After', String(eventResult.retryAfterSec));
      }
      if (
        eventResult.code === 'CLIENT_PAYLOAD_OVERRIDE_FORBIDDEN' ||
        eventResult.code === 'ACTION_COOLDOWN_ACTIVE'
      ) {
        ctx.opsCounters.antiCheatRejections += 1;
        ctx.appendAuditEntry(
          createAuditEntry({
            eventType: 'ANTI_CHEAT_TRIGGERED',
            actorEmail: session.email,
            actorRole: session.role,
            outcome: 'denied',
            detail: `Gameplay reward event rejected (${eventResult.code}): ${eventResult.error}`,
          })
        );
        ctx.persistStoreToDisk(ctx.store);
      }
      res.status(eventResult.statusCode).json({
        ok: false,
        code: eventResult.code,
        retryAfterSec: eventResult.retryAfterSec,
        error: eventResult.error,
      });
      return;
    }

    if (!eventResult.replayed) {
      ctx.store.economyAccounts![session.commanderId] = eventResult.account;
      ctx.persistStoreToDisk(ctx.store);
    }

    res.json({
      ok: true,
      replayed: eventResult.replayed,
      entry: eventResult.entry,
      balances: eventResult.account.balances,
      integrity: verifyEconomyLedgerIntegrity(eventResult.account),
    });
  };

  app.post('/api/online/economy/events', handleValidatedGameplayEvent);
  app.post('/api/online/economy/claim-action', handleValidatedGameplayEvent);

  app.post('/api/online/economy/castle-upgrade', (req, res) => {
    const session = ctx.requireAuthenticatedSession(req, res);
    if (!session) return;

    const currentAccount = ctx.getOrCreateEconomyAccount(session.commanderId);
    const result = applyAuthoritativeCastleUpgrade(
      currentAccount,
      (req.body || {}) as Record<string, unknown>
    );

    if (!result.ok) {
      if (result.code === 'CLIENT_PAYLOAD_OVERRIDE_FORBIDDEN') {
        ctx.opsCounters.antiCheatRejections += 1;
        ctx.appendAuditEntry(
          createAuditEntry({
            eventType: 'ANTI_CHEAT_TRIGGERED',
            actorEmail: session.email,
            actorRole: session.role,
            outcome: 'denied',
            detail: `Castle upgrade rejected (${result.code}): ${result.error}`,
          })
        );
        ctx.persistStoreToDisk(ctx.store);
      }
      res.status(result.statusCode).json({
        ok: false,
        code: result.code,
        error: result.error,
      });
      return;
    }

    if (!result.replayed) {
      ctx.store.economyAccounts![session.commanderId] = result.account;
      ctx.persistStoreToDisk(ctx.store);
    }

    res.json({
      ok: true,
      replayed: result.replayed,
      eventId: result.eventId,
      previousLevel: result.previousLevel,
      newLevel: result.newLevel,
      costs: result.costs,
      entries: result.entries,
      castleLevel: result.account.castleLevel,
      balances: result.account.balances,
      version: result.account.version,
      integrity: verifyEconomyLedgerIntegrity(result.account),
    });
  });

  app.post('/api/online/economy/purchase-troops', (req, res) => {
    const session = ctx.requireAuthenticatedSession(req, res);
    if (!session) return;

    const currentAccount = ctx.getOrCreateEconomyAccount(session.commanderId);
    const result = applyAuthoritativeTroopPurchase(
      currentAccount,
      (req.body || {}) as Record<string, unknown>
    );

    if (!result.ok) {
      if (
        result.code === 'CLIENT_PAYLOAD_OVERRIDE_FORBIDDEN' ||
        result.code === 'TIER_LOCKED_BY_CASTLE_LEVEL'
      ) {
        ctx.opsCounters.antiCheatRejections += 1;
        ctx.appendAuditEntry(
          createAuditEntry({
            eventType: 'ANTI_CHEAT_TRIGGERED',
            actorEmail: session.email,
            actorRole: session.role,
            outcome: 'denied',
            detail: `Troop purchase rejected (${result.code}): ${result.error}`,
          })
        );
        ctx.persistStoreToDisk(ctx.store);
      }
      res.status(result.statusCode).json({
        ok: false,
        code: result.code,
        error: result.error,
      });
      return;
    }

    if (!result.replayed) {
      ctx.store.economyAccounts![session.commanderId] = result.account;
      ctx.persistStoreToDisk(ctx.store);
    }

    res.json({
      ok: true,
      replayed: result.replayed,
      eventId: result.eventId,
      branch: result.branch,
      tier: result.tier,
      quantity: result.quantity,
      newBranchTierCount: result.newBranchTierCount,
      costs: result.costs,
      entries: result.entries,
      troops: result.account.troops,
      balances: result.account.balances,
      version: result.account.version,
      integrity: verifyEconomyLedgerIntegrity(result.account),
    });
  });

  app.post('/api/online/economy/market-trade', (req, res) => {
    const session = ctx.requireAuthenticatedSession(req, res);
    if (!session) return;

    const currentAccount = ctx.getOrCreateEconomyAccount(session.commanderId);
    const result = applyAuthoritativeMarketTrade(
      currentAccount,
      (req.body || {}) as Record<string, unknown>
    );

    if (!result.ok) {
      if (result.code === 'CLIENT_PAYLOAD_OVERRIDE_FORBIDDEN') {
        ctx.opsCounters.antiCheatRejections += 1;
        ctx.appendAuditEntry(
          createAuditEntry({
            eventType: 'ANTI_CHEAT_TRIGGERED',
            actorEmail: session.email,
            actorRole: session.role,
            outcome: 'denied',
            detail: `Marketplace trade rejected (${result.code}): ${result.error}`,
          })
        );
        ctx.persistStoreToDisk(ctx.store);
      }
      res.status(result.statusCode).json({
        ok: false,
        code: result.code,
        error: result.error,
      });
      return;
    }

    if (!result.replayed) {
      ctx.store.economyAccounts![session.commanderId] = result.account;
      ctx.persistStoreToDisk(ctx.store);
    }

    res.json({
      ok: true,
      replayed: result.replayed,
      eventId: result.eventId,
      fromResource: result.fromResource,
      toResource: result.toResource,
      inputAmountWire: result.inputAmountWire,
      grossOutputWire: result.grossOutputWire,
      taxAmountWire: result.taxAmountWire,
      netOutputWire: result.netOutputWire,
      taxBps: result.taxBps,
      totalTaxCollectedWire: result.account.totalTaxCollectedWire,
      entries: result.entries,
      balances: result.account.balances,
      version: result.account.version,
      integrity: verifyEconomyLedgerIntegrity(result.account),
    });
  });
}
