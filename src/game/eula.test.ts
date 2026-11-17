/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EULA_ARTICLES,
  EULA_EFFECTIVE_DATE_DISPLAY,
  EULA_EFFECTIVE_DATE_ISO,
  EULA_LICENSOR_EMAIL,
  EULA_VERSION,
  LEGAL_DOCUMENT_STACK,
  LEGAL_QUICK_COMPARISON_MATRIX,
  acceptEulaVersion,
  computeEulaReceiptHash,
  createInitialEulaAcceptanceState,
  evaluateEulaCompliance,
  revokeEulaAcceptance,
  searchEulaArticles,
} from './eula';

test('1. EULA metadata and 10 canonical articles are anchored to 17/11/2026 and creatergame31@gmail.com', () => {
  assert.equal(EULA_VERSION, '1.5.0-2026-11-17');
  assert.equal(EULA_EFFECTIVE_DATE_DISPLAY, '17/11/2026');
  assert.equal(EULA_EFFECTIVE_DATE_ISO, '2026-11-17');
  assert.equal(EULA_LICENSOR_EMAIL, 'creatergame31@gmail.com');
  assert.equal(EULA_ARTICLES.length, 10);

  for (let i = 0; i < EULA_ARTICLES.length; i++) {
    const article = EULA_ARTICLES[i];
    assert.equal(article.articleNumber, i + 1);
    assert.ok(article.title.length > 10);
    assert.ok(article.summary.length > 15);
    assert.ok(article.clauses.length >= 2);
  }
});

test('2. Initial EULA acceptance state and acceptEulaVersion produce deterministic receipt hashes', () => {
  const initial = createInitialEulaAcceptanceState('creatergame31@gmail.com');
  assert.equal(initial.accepted, true);
  assert.equal(initial.acceptedVersion, EULA_VERSION);
  assert.equal(initial.acceptedByEmail, 'creatergame31@gmail.com');
  assert.ok(initial.receiptHash?.startsWith('EULA-ACK-'));

  const hashA = computeEulaReceiptHash(
    EULA_VERSION,
    'creatergame31@gmail.com',
    '2026-11-17T00:00:00.000Z'
  );
  const hashB = computeEulaReceiptHash(
    EULA_VERSION,
    'CREATERGAME31@GMAIL.COM',
    '2026-11-17T00:00:00.000Z'
  );
  assert.equal(hashA, hashB);

  const report = evaluateEulaCompliance(initial);
  assert.equal(report.isCompliant, true);
  assert.equal(report.requiresReacceptance, false);
});

test('3. Revoked or outdated EULA acceptance states require re-acceptance', () => {
  const revoked = revokeEulaAcceptance('creatergame31@gmail.com');
  assert.equal(revoked.accepted, false);
  assert.equal(revoked.receiptHash, null);
  const revokedReport = evaluateEulaCompliance(revoked);
  assert.equal(revokedReport.isCompliant, false);
  assert.equal(revokedReport.requiresReacceptance, true);

  const outdated = acceptEulaVersion(
    'creatergame31@gmail.com',
    '2026-03-10T00:00:00.000Z',
    '1.0.0-2026-03-10'
  );
  const outdatedReport = evaluateEulaCompliance(outdated);
  assert.equal(outdatedReport.isCompliant, false);
  assert.equal(outdatedReport.requiresReacceptance, true);
  assert.ok(outdatedReport.reason.includes('1.0.0-2026-03-10'));
});

test('4. searchEulaArticles filters by keyword and category accurately', () => {
  const all = searchEulaArticles('', 'all');
  assert.equal(all.length, 10);

  const antiCheatOnly = searchEulaArticles('', 'anti_cheat');
  assert.equal(antiCheatOnly.length, 1);
  assert.equal(antiCheatOnly[0].articleNumber, 3);

  const apacheQuery = searchEulaArticles('Apache-2.0', 'all');
  assert.ok(apacheQuery.some((a) => a.articleNumber === 1));

  const gmailQuery = searchEulaArticles('GMAIL_SCOPES', 'cloud_privacy');
  assert.equal(gmailQuery.length, 1);
  assert.equal(gmailQuery[0].articleNumber, 4);
});

test('5. LEGAL_DOCUMENT_STACK and LEGAL_QUICK_COMPARISON_MATRIX cover all 10 agreements across Core User, Software/Licensing, and Enterprise tiers', () => {
  assert.equal(LEGAL_DOCUMENT_STACK.length, 10);
  assert.equal(LEGAL_QUICK_COMPARISON_MATRIX.length, 10);

  const coreDocs = LEGAL_DOCUMENT_STACK.filter((d) => d.group === 'core_user_website');
  const licensingDocs = LEGAL_DOCUMENT_STACK.filter((d) => d.group === 'software_licensing');
  const enterpriseDocs = LEGAL_DOCUMENT_STACK.filter((d) => d.group === 'enterprise_service');

  assert.equal(coreDocs.length, 3); // ToS, Privacy, Cookies
  assert.equal(licensingDocs.length, 4); // EULA, SaaS, Apache-2.0, AUP
  assert.equal(enterpriseDocs.length, 3); // SLA, DPA, MSA

  assert.ok(LEGAL_DOCUMENT_STACK.some((d) => d.shortCode === 'SLA'));
  assert.ok(LEGAL_DOCUMENT_STACK.some((d) => d.shortCode === 'DPA'));
  assert.ok(LEGAL_DOCUMENT_STACK.some((d) => d.shortCode === 'MSA'));
  assert.ok(LEGAL_DOCUMENT_STACK.some((d) => d.name.includes('DPDP Act')));
});
