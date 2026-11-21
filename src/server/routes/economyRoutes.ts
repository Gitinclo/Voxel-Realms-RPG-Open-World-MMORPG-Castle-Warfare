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
import { extractNewLedgerEntries } from '../economyService';
import type { ServerContext } from '../types';

export function registerEconomyRoutes(app: Express, ctx: ServerContext): void {
  app.get('/api/online/economy/balance', async (req, res) => {
    const session = ctx.requireAuthenticatedSession(req, res);
    if (!session) return;

    try {
      const account = await ctx.economyService.getAccount(session.commanderId);
      const integrity = verifyEconomyLedgerIntegrity(account);
      res.json({
        ok: true,
        backend: ctx.economyService.backendKind,
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
    } catch (error) {
      console.error('Failed to load authoritative economy balance:', error);
      res.status(503).json({
        ok: false,
        code: 'ECONOMY_BACKEND_UNAVAILABLE',
        error: 'Authoritative economy store temporarily unavailable.',
      });
    }
  });

  app.post('/api/online/economy/transact', async (req, res) => {
    const session = ctx.requireAuthenticatedSession(req, res);
    if (!session) return;

    const body = (req.body || {}) as {
      idempotencyKey?: string;
      resource?: LedgerResourceKey;
      direction?: LedgerTxDirection;
      amountWire?: string;
      reason?: LedgerTxReason;
    };

    try {
      const tx = await ctx.economyService.mutateAccount({
        commanderId: session.commanderId,
        mutate: (currentAccount) => {
          const prevLen = currentAccount.ledger.length;
          const txResult = applyAuthoritativeEconomyTransaction(currentAccount, {
            idempotencyKey: body.idempotencyKey || '',
            resource: body.resource as LedgerResourceKey,
            direction: body.direction as LedgerTxDirection,
            amountWire: body.amountWire || '',
            reason: body.reason as LedgerTxReason,
            isPrivilegedStaff: session.permissions.canUseGodmodeAndCheats,
            serverAuthorizedCredit: false,
          });
          return {
            ok: txResult.ok,
            replayed: txResult.ok ? txResult.replayed : false,
            account: txResult.ok ? txResult.account : undefined,
            newEntries: txResult.ok ? extractNewLedgerEntries(prevLen, txResult.account) : [],
            result: txResult,
          };
        },
      });

      const txResult = tx.result;
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

      res.json({
        ok: true,
        backend: tx.backend,
        replayed: txResult.replayed,
        entry: txResult.entry,
        balances: txResult.account.balances,
        integrity: verifyEconomyLedgerIntegrity(txResult.account),
      });
    } catch (error) {
      console.error('Failed to execute authoritative economy transaction:', error);
      res.status(503).json({
        ok: false,
        code: 'ECONOMY_BACKEND_UNAVAILABLE',
        error: 'Authoritative economy store temporarily unavailable.',
      });
    }
  });

  const handleValidatedGameplayEvent = async (req: Request, res: Response) => {
    const session = ctx.requireAuthenticatedSession(req, res);
    if (!session) return;

    const rawPayload = (req.body || {}) as GameplayEventValidationInput;
    try {
      const tx = await ctx.economyService.mutateAccount({
        commanderId: session.commanderId,
        mutate: (currentAccount) => {
          const prevLen = currentAccount.ledger.length;
          const eventResult = validateAndApplyGameplayEvent(currentAccount, rawPayload);
          return {
            ok: eventResult.ok,
            replayed: eventResult.ok ? eventResult.replayed : false,
            account: eventResult.ok ? eventResult.account : undefined,
            newEntries: eventResult.ok ? extractNewLedgerEntries(prevLen, eventResult.account) : [],
            result: eventResult,
          };
        },
      });

      const eventResult = tx.result;
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

      res.json({
        ok: true,
        backend: tx.backend,
        replayed: eventResult.replayed,
        entry: eventResult.entry,
        balances: eventResult.account.balances,
        integrity: verifyEconomyLedgerIntegrity(eventResult.account),
      });
    } catch (error) {
      console.error('Failed to process authoritative gameplay event:', error);
      res.status(503).json({
        ok: false,
        code: 'ECONOMY_BACKEND_UNAVAILABLE',
        error: 'Authoritative economy store temporarily unavailable.',
      });
    }
  };

  app.post('/api/online/economy/events', handleValidatedGameplayEvent);
  app.post('/api/online/economy/claim-action', handleValidatedGameplayEvent);

  app.post('/api/online/economy/castle-upgrade', async (req, res) => {
    const session = ctx.requireAuthenticatedSession(req, res);
    if (!session) return;

    try {
      const tx = await ctx.economyService.mutateAccount({
        commanderId: session.commanderId,
        mutate: (currentAccount) => {
          const prevLen = currentAccount.ledger.length;
          const result = applyAuthoritativeCastleUpgrade(
            currentAccount,
            (req.body || {}) as Record<string, unknown>
          );
          return {
            ok: result.ok,
            replayed: result.ok ? result.replayed : false,
            account: result.ok ? result.account : undefined,
            newEntries: result.ok ? extractNewLedgerEntries(prevLen, result.account) : [],
            result,
          };
        },
      });

      const result = tx.result;
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

      res.json({
        ok: true,
        backend: tx.backend,
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
    } catch (error) {
      console.error('Failed to process authoritative castle upgrade:', error);
      res.status(503).json({
        ok: false,
        code: 'ECONOMY_BACKEND_UNAVAILABLE',
        error: 'Authoritative economy store temporarily unavailable.',
      });
    }
  });

  app.post('/api/online/economy/purchase-troops', async (req, res) => {
    const session = ctx.requireAuthenticatedSession(req, res);
    if (!session) return;

    try {
      const tx = await ctx.economyService.mutateAccount({
        commanderId: session.commanderId,
        mutate: (currentAccount) => {
          const prevLen = currentAccount.ledger.length;
          const result = applyAuthoritativeTroopPurchase(
            currentAccount,
            (req.body || {}) as Record<string, unknown>
          );
          return {
            ok: result.ok,
            replayed: result.ok ? result.replayed : false,
            account: result.ok ? result.account : undefined,
            newEntries: result.ok ? extractNewLedgerEntries(prevLen, result.account) : [],
            result,
          };
        },
      });

      const result = tx.result;
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

      res.json({
        ok: true,
        backend: tx.backend,
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
    } catch (error) {
      console.error('Failed to process authoritative troop purchase:', error);
      res.status(503).json({
        ok: false,
        code: 'ECONOMY_BACKEND_UNAVAILABLE',
        error: 'Authoritative economy store temporarily unavailable.',
      });
    }
  });

  app.post('/api/online/economy/market-trade', async (req, res) => {
    const session = ctx.requireAuthenticatedSession(req, res);
    if (!session) return;

    try {
      const tx = await ctx.economyService.mutateAccount({
        commanderId: session.commanderId,
        mutate: (currentAccount) => {
          const prevLen = currentAccount.ledger.length;
          const result = applyAuthoritativeMarketTrade(
            currentAccount,
            (req.body || {}) as Record<string, unknown>
          );
          return {
            ok: result.ok,
            replayed: result.ok ? result.replayed : false,
            account: result.ok ? result.account : undefined,
            newEntries: result.ok ? extractNewLedgerEntries(prevLen, result.account) : [],
            result,
          };
        },
      });

      const result = tx.result;
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

      res.json({
        ok: true,
        backend: tx.backend,
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
    } catch (error) {
      console.error('Failed to process authoritative market trade:', error);
      res.status(503).json({
        ok: false,
        code: 'ECONOMY_BACKEND_UNAVAILABLE',
        error: 'Authoritative economy store temporarily unavailable.',
      });
    }
  });
}
