/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { authoritativeEconomyClient, createDeterministicEventId } from './apiClient';

test('createDeterministicEventId sanitizes prefixes and produces stable idempotency keys', () => {
  const id = createDeterministicEventId('castle upgrade!@#', 'lvl-12_seq1');
  assert.equal(id, 'castleupgrade-lvl-12_seq1');
});

test('authoritativeEconomyClient forwards typed JSON commands and parses failure envelopes', async () => {
  let capturedUrl = '';
  let capturedBody = '';
  const mockFetch = (async (url: string | URL | Request, init?: RequestInit) => {
    capturedUrl = String(url);
    capturedBody = String(init?.body ?? '');
    return new Response(
      JSON.stringify({
        ok: true,
        replayed: false,
        eventId: 'castle-1',
        previousLevel: 1,
        newLevel: 2,
        castleLevel: 2,
        balances: { gold: '900' },
        version: 2,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }) as typeof fetch;

  const okRes = await authoritativeEconomyClient.upgradeCastle({ eventId: 'castle-1' }, mockFetch);
  assert.equal(capturedUrl, '/api/online/economy/castle-upgrade');
  assert.equal(capturedBody, JSON.stringify({ eventId: 'castle-1' }));
  assert.equal(okRes.ok, true);
  if (okRes.ok) {
    assert.equal(okRes.data.newLevel, 2);
  }

  const errFetch = (async () =>
    new Response(
      JSON.stringify({
        ok: false,
        code: 'TIER_LOCKED_BY_CASTLE_LEVEL',
        error: 'Castle level too low.',
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )) as typeof fetch;

  const errRes = await authoritativeEconomyClient.purchaseTroops(
    { eventId: 'troop-1', branch: 'shooters', tier: 10, quantity: 5 },
    errFetch
  );
  assert.equal(errRes.ok, false);
  if (!errRes.ok) {
    assert.equal(errRes.status, 403);
    assert.equal(errRes.code, 'TIER_LOCKED_BY_CASTLE_LEVEL');
  }
});
