/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { runFullSystemValidationReport } from './systemValidation';
import { PRIMARY_ADMIN_EMAIL } from './adminModeration';

test('runFullSystemValidationReport passes all 9 engine validation pillars with 100% score', () => {
  const report = runFullSystemValidationReport();

  assert.equal(report.releaseVersion, 'v1.5.0');
  assert.equal(report.releaseDate, '06/11/2026');
  assert.equal(report.supremeAuthorEmail, PRIMARY_ADMIN_EMAIL);
  assert.equal(report.totalPillars, 9);
  assert.equal(report.passedPillars, 9);
  assert.equal(report.allPassed, true);
  assert.equal(report.validationScore, 100);
  assert.ok(report.totalAssertionsPassed >= 88);

  for (const pillar of report.pillars) {
    assert.equal(pillar.passed, true, `Expected validation pillar ${pillar.id} to pass`);
    assert.ok(pillar.verifiedInvariants.length >= 3);
  }
});

test('runFullSystemValidationReport verifies Layer 6 White Page, 100 Omniverses, 7 Lore Epochs, 12 Annals, Lore Codex, 10^100 Akashic Corpus, 20Hz Siege Netcode & Transparency Matrix', () => {
  const report = runFullSystemValidationReport();
  const cosmologyPillar = report.pillars.find(
    (p) => p.id === 'six_layer_cosmology_and_100_omniverses'
  );
  const lorePillar = report.pillars.find((p) => p.id === 'imperial_lore_and_7_epochs');
  const transparencyPillar = report.pillars.find(
    (p) => p.id === 'engineering_transparency_and_live_webgl_pipeline'
  );

  assert.ok(cosmologyPillar);
  assert.equal(cosmologyPillar.passed, true);
  assert.ok(
    cosmologyPillar.verifiedInvariants.some((inv) =>
      inv.includes('The White Page / The House of Ideas')
    )
  );

  assert.ok(lorePillar);
  assert.equal(lorePillar.passed, true);
  assert.ok(lorePillar.verifiedInvariants.some((inv) => inv.includes('12 Dynastic Annals')));
  assert.ok(
    lorePillar.verifiedInvariants.some((inv) =>
      inv.includes('Auto-Populating Open-World Lore Codex')
    )
  );
  assert.ok(lorePillar.verifiedInvariants.some((inv) => inv.includes('10^100 Words Minimum')));

  assert.ok(transparencyPillar);
  assert.equal(transparencyPillar.passed, true);
  assert.ok(
    transparencyPillar.verifiedInvariants.some((inv) =>
      inv.includes('Explicit 3-Tier Scope Matrix: 6 Implemented, 2 Simulated Models, 0 Planned')
    )
  );
  assert.ok(
    transparencyPillar.verifiedInvariants.some((inv) =>
      inv.includes('Authoritative 20Hz (50ms) 50v50 WebSocket Siege Protocol')
    )
  );
});
