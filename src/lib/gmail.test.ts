/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMimeRaw,
  decodeBase64UrlUtf8,
  encodeBase64UrlUtf8,
  extractPlainTextFromPayload,
  sanitizeHeaderValue,
  stripHtmlTags,
} from './gmail';

test('1. Base64URL UTF-8 encoding and decoding round-trips multibyte CJK & emoji text safely', () => {
  const original = 'War Dispatch — 太古龙族 Citadel Lv.100 🐉⚔️';
  const encoded = encodeBase64UrlUtf8(original);
  assert.equal(encoded.includes('+'), false);
  assert.equal(encoded.includes('/'), false);
  assert.equal(encoded.includes('='), false);
  assert.equal(decodeBase64UrlUtf8(encoded), original);
});

test('2. sanitizeHeaderValue & buildMimeRaw neutralize CRLF header injection attempts', () => {
  const dirtyTo = 'ally@example.com\r\nBcc: attacker@evil.example';
  const dirtySubject = 'Rally Order\nX-Injected: true';
  assert.equal(sanitizeHeaderValue(dirtyTo), 'ally@example.com Bcc: attacker@evil.example');
  assert.equal(sanitizeHeaderValue(dirtySubject), 'Rally Order X-Injected: true');

  const raw = buildMimeRaw(dirtyTo, dirtySubject, 'Advance to Sector B2.');
  const decoded = decodeBase64UrlUtf8(raw);
  const lines = decoded.split('\r\n');
  assert.equal(lines[0], 'To: ally@example.com Bcc: attacker@evil.example');
  assert.equal(lines[1], 'Subject: Rally Order X-Injected: true');
  assert.ok(lines.includes('MIME-Version: 1.0'));
  assert.ok(decoded.endsWith('\r\n\r\nAdvance to Sector B2.'));
});

test('3. stripHtmlTags & extractPlainTextFromPayload strip scripts/styles and prefer text/plain', () => {
  const html =
    '<style>.a{color:red}</style><p>Citadel <b>Alert</b></p><script>alert(1)</script><div>Sector C3</div>';
  assert.equal(stripHtmlTags(html), 'Citadel Alert Sector C3');

  const multipartPlain = extractPlainTextFromPayload({
    mimeType: 'multipart/alternative',
    parts: [
      { mimeType: 'text/html', body: { data: encodeBase64UrlUtf8('<p>HTML fallback</p>') } },
      { mimeType: 'text/plain', body: { data: encodeBase64UrlUtf8('Preferred plain text') } },
    ],
  });
  assert.equal(multipartPlain, 'Preferred plain text');

  const nestedHtmlOnly = extractPlainTextFromPayload({
    mimeType: 'multipart/mixed',
    parts: [
      {
        mimeType: 'multipart/alternative',
        parts: [
          { mimeType: 'text/html', body: { data: encodeBase64UrlUtf8('<h1>Nested HTML</h1>') } },
        ],
      },
    ],
  });
  assert.equal(nestedHtmlOnly, 'Nested HTML');
});
