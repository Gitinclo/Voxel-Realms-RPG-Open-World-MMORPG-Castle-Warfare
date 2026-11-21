/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AuthoritativeGameplayActionType, LedgerResourceKey } from '../game/economyLedger';

export type AuthoritativeCommandResult<TData> =
  | { ok: true; status: number; data: TData }
  | { ok: false; status: number; code?: string; error: string };

export interface CastleUpgradeCommandRequest {
  idempotencyKey: string;
}

export interface CastleUpgradeCommandResponse {
  ok: true;
  backend?: 'postgres' | 'disk';
  replayed: boolean;
  eventId: string;
  previousLevel: number;
  newLevel: number;
  castleLevel: number;
  balances: Record<LedgerResourceKey, string>;
  version: number;
}

export interface PurchaseTroopsCommandRequest {
  idempotencyKey: string;
  branch: 'shieldbearers' | 'shooters' | 'bombers';
  tier: number;
  quantity: number;
}

export interface PurchaseTroopsCommandResponse {
  ok: true;
  backend?: 'postgres' | 'disk';
  replayed: boolean;
  eventId: string;
  branch: 'shieldbearers' | 'shooters' | 'bombers';
  tier: number;
  quantity: number;
  newBranchTierCount: number;
  balances: Record<LedgerResourceKey, string>;
  version: number;
}

export interface MarketTradeCommandRequest {
  idempotencyKey: string;
  fromResource: LedgerResourceKey;
  toResource: LedgerResourceKey;
  inputAmountWire: string;
}

export interface MarketTradeCommandResponse {
  ok: true;
  backend?: 'postgres' | 'disk';
  replayed: boolean;
  eventId: string;
  fromResource: LedgerResourceKey;
  toResource: LedgerResourceKey;
  netOutputWire: string;
  taxAmountWire: string;
  balances: Record<LedgerResourceKey, string>;
  version: number;
}

export interface ClaimActionCommandRequest {
  idempotencyKey: string;
  actionType: AuthoritativeGameplayActionType;
  sectorId?: string;
  entityId?: string;
  occurredAtMs?: number;
}

export interface ClaimActionCommandResponse {
  ok: true;
  backend?: 'postgres' | 'disk';
  replayed: boolean;
  balances: Record<LedgerResourceKey, string>;
}

export function createDeterministicEventId(prefix: string, entropy?: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || 'evt';
  const suffix =
    entropy?.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${cleanPrefix}-${suffix}`;
}

async function postAuthoritativeJson<TReq, TRes>(
  url: string,
  payload: TReq,
  fetchImpl: typeof fetch = fetch
): Promise<AuthoritativeCommandResult<TRes>> {
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const parsed = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      code?: string;
      error?: string;
    };
    if (!response.ok || parsed.ok === false) {
      return {
        ok: false,
        status: response.status,
        code: parsed.code,
        error: parsed.error || `Authoritative command failed with HTTP ${response.status}.`,
      };
    }
    return {
      ok: true,
      status: response.status,
      data: parsed as TRes,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : 'Network error executing authoritative command.',
    };
  }
}

export const authoritativeEconomyClient = {
  upgradeCastle(
    req: CastleUpgradeCommandRequest,
    fetchImpl?: typeof fetch
  ): Promise<AuthoritativeCommandResult<CastleUpgradeCommandResponse>> {
    return postAuthoritativeJson('/api/online/economy/castle-upgrade', req, fetchImpl);
  },

  purchaseTroops(
    req: PurchaseTroopsCommandRequest,
    fetchImpl?: typeof fetch
  ): Promise<AuthoritativeCommandResult<PurchaseTroopsCommandResponse>> {
    return postAuthoritativeJson('/api/online/economy/purchase-troops', req, fetchImpl);
  },

  marketTrade(
    req: MarketTradeCommandRequest,
    fetchImpl?: typeof fetch
  ): Promise<AuthoritativeCommandResult<MarketTradeCommandResponse>> {
    return postAuthoritativeJson('/api/online/economy/market-trade', req, fetchImpl);
  },

  claimGameplayAction(
    req: ClaimActionCommandRequest,
    fetchImpl?: typeof fetch
  ): Promise<AuthoritativeCommandResult<ClaimActionCommandResponse>> {
    return postAuthoritativeJson('/api/online/economy/claim-action', req, fetchImpl);
  },
};
