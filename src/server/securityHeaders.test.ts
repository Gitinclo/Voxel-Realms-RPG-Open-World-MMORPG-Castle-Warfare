/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildContentSecurityPolicy,
  isTrustProxyEnabled,
  resolveTrustProxySetting,
} from './securityHeaders';

test('production CSP removes unsafe-eval and restricts frame-ancestors by default', () => {
  const prodCsp = buildContentSecurityPolicy({ isProduction: true, allowPreviewIframe: false });
  assert.equal(prodCsp.includes("'unsafe-eval'"), false);
  assert.equal(prodCsp.includes("script-src 'self' https://apis.google.com"), true);
  assert.equal(prodCsp.includes("frame-ancestors 'self'"), true);
  assert.equal(prodCsp.includes('aistudio.google.com'), false);
});

test('development CSP permits Vite script transforms and preview iframe ancestors', () => {
  const devCsp = buildContentSecurityPolicy({ isProduction: false });
  assert.equal(devCsp.includes("'unsafe-eval'"), true);
  assert.equal(devCsp.includes('aistudio.google.com'), true);

  const prodPreviewCsp = buildContentSecurityPolicy({
    isProduction: true,
    allowPreviewIframe: true,
  });
  assert.equal(prodPreviewCsp.includes("'unsafe-eval'"), false);
  assert.equal(prodPreviewCsp.includes('aistudio.google.com'), true);
});

test('resolveTrustProxySetting defaults to loopback and parses explicit CIDR/hop overrides', () => {
  assert.equal(resolveTrustProxySetting(undefined), 'loopback');
  assert.equal(resolveTrustProxySetting('false'), false);
  assert.equal(isTrustProxyEnabled(resolveTrustProxySetting('0')), false);
  assert.equal(resolveTrustProxySetting('1'), 1);
  assert.equal(resolveTrustProxySetting('99'), 8);
  assert.deepEqual(resolveTrustProxySetting('127.0.0.1, 10.0.0.0/8'), ['127.0.0.1', '10.0.0.0/8']);
});
