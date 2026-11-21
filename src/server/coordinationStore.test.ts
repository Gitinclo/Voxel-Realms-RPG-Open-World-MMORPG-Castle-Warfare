/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  InMemoryCoordinationStore,
  RedisRestCoordinationStore,
  createCoordinationStore,
} from './coordinationStore';

test('InMemoryCoordinationStore revokes sessions and sweeps expired entries', async () => {
  const store = new InMemoryCoordinationStore(100);
  assert.equal(store.backendKind, 'memory');
  assert.equal(store.isSessionRevoked('sess-1'), false);

  await store.revokeSession('sess-1', 5_000);
  assert.equal(store.isSessionRevoked('sess-1'), true);
  assert.equal(store.getRevokedCount(), 1);

  const removed = store.sweepExpired(Date.now() + 10_000);
  assert.equal(removed, 1);
  assert.equal(store.isSessionRevoked('sess-1'), false);
});

test('RedisRestCoordinationStore writes revocations to external REST endpoint and reads remotely', async () => {
  const calls: Array<{ url: string; method: string; body?: string }> = [];
  const mockFetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const urlStr = String(url);
    calls.push({ url: urlStr, method: init?.method || 'GET', body: String(init?.body ?? '') });
    if (urlStr.includes('/get/')) {
      return new Response(JSON.stringify({ result: '1' }), { status: 200 });
    }
    return new Response(JSON.stringify([{ result: 'OK' }]), { status: 200 });
  }) as typeof fetch;

  const redisStore = new RedisRestCoordinationStore({
    restUrl: 'https://redis.example.test',
    restToken: 'secret-token',
    fetchImpl: mockFetch,
  });

  await redisStore.revokeSession('sess-abc', 30_000);
  assert.equal(redisStore.isSessionRevoked('sess-abc'), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://redis.example.test/pipeline');

  const remoteRevoked = await redisStore.isSessionRevokedAsync('sess-other-pod');
  assert.equal(remoteRevoked, true);
  assert.equal(redisStore.isSessionRevoked('sess-other-pod'), true);
});

test('createCoordinationStore selects Redis REST only when both env vars are configured', () => {
  const mem = createCoordinationStore({});
  assert.equal(mem.backendKind, 'memory');

  const redis = createCoordinationStore({
    REDIS_REST_URL: 'https://redis.example.test',
    REDIS_REST_TOKEN: 'tok',
  });
  assert.equal(redis.backendKind, 'redis_rest');
});
