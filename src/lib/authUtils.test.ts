/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOKEN_REFRESH_BUFFER_MS,
  classifyFirebaseAuthError,
  extractAuthErrorCode,
  isTokenExpiringSoon,
  isTransientAuthStatus,
  parseJwtExpiryMs,
} from './authUtils';

function makeFakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

test('classifyFirebaseAuthError maps known Firebase codes to actionable user messages and reauth flags', () => {
  const blocked = classifyFirebaseAuthError({ code: 'auth/popup-blocked', message: 'raw' });
  assert.equal(blocked.code, 'auth/popup-blocked');
  assert.equal(blocked.retryable, true);
  assert.equal(blocked.requiresReauth, false);
  assert.ok(blocked.userMessage.toLowerCase().includes('popup'));

  const expired = classifyFirebaseAuthError(
    new Error('Firebase: Error (auth/user-token-expired).')
  );
  assert.equal(expired.code, 'auth/user-token-expired');
  assert.equal(expired.retryable, false);
  assert.equal(expired.requiresReauth, true);

  const disabled = classifyFirebaseAuthError({ code: 'auth/user-disabled' });
  assert.equal(disabled.requiresReauth, true);
  assert.equal(disabled.retryable, false);

  const unknown = classifyFirebaseAuthError(new Error('Something unexpected'));
  assert.equal(unknown.code, 'auth/unknown');
  assert.equal(unknown.userMessage, 'Something unexpected');
  assert.equal(extractAuthErrorCode(null), 'auth/unknown');
});

test('parseJwtExpiryMs and isTokenExpiringSoon detect expired and near-expiry tokens accurately', () => {
  const nowMs = 1_800_000_000_000;
  const freshToken = makeFakeJwt({ exp: Math.floor((nowMs + 20 * 60 * 1000) / 1000) });
  const nearExpiryToken = makeFakeJwt({
    exp: Math.floor((nowMs + TOKEN_REFRESH_BUFFER_MS - 30_000) / 1000),
  });
  const expiredToken = makeFakeJwt({ exp: Math.floor((nowMs - 60_000) / 1000) });

  assert.equal(parseJwtExpiryMs(freshToken), Math.floor((nowMs + 20 * 60 * 1000) / 1000) * 1000);
  assert.equal(isTokenExpiringSoon(freshToken, nowMs), false);
  assert.equal(isTokenExpiringSoon(nearExpiryToken, nowMs), true);
  assert.equal(isTokenExpiringSoon(expiredToken, nowMs), true);
  assert.equal(isTokenExpiringSoon('not-a-jwt', nowMs), true);
  assert.equal(isTokenExpiringSoon(null, nowMs), true);
});

test('isTransientAuthStatus flags retryable gateway and rate-limit HTTP codes only', () => {
  assert.equal(isTransientAuthStatus(503), true);
  assert.equal(isTransientAuthStatus(429), true);
  assert.equal(isTransientAuthStatus(502), true);
  assert.equal(isTransientAuthStatus(401), false);
  assert.equal(isTransientAuthStatus(403), false);
  assert.equal(isTransientAuthStatus(400), false);
});
