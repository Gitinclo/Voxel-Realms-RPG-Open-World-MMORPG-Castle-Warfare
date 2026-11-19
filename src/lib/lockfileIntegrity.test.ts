/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyLockfileIntegrity,
  verifyProjectLockfile,
} from '../../scripts/regenerate-lockfile.mjs';

test('verifyProjectLockfile confirms current package.json and package-lock.json are in sync', () => {
  const result = verifyProjectLockfile();
  assert.equal(result.ok, true, `Lockfile verification errors: ${result.errors.join('; ')}`);
  assert.ok(result.stats);
  assert.ok(result.stats.lightningcssEntries >= 12);
  assert.ok(result.stats.tsNativeEntries >= 20);
});

test('verifyLockfileIntegrity flags version drift, missing optional musl binary, and override mismatches', () => {
  const manifest = {
    name: 'demo-app',
    version: '1.0.0',
    dependencies: { express: '4.22.3' },
    devDependencies: { playwright: '1.65.1' },
    overrides: { esbuild: '0.28.2' },
  };

  const brokenLockfile = {
    name: 'demo-app',
    version: '1.0.0',
    lockfileVersion: 3,
    packages: {
      '': {
        dependencies: { express: '4.22.3' },
        devDependencies: { playwright: '1.50.0' },
      },
      'node_modules/express': {
        version: '4.22.3',
        resolved: 'https://registry.npmjs.org/express/-/express-4.22.3.tgz',
        integrity: 'sha512-abc',
      },
      'node_modules/esbuild': {
        version: '0.25.0',
      },
      'node_modules/lightningcss': {
        version: '1.33.0',
      },
    },
  };

  const result = verifyLockfileIntegrity(manifest, brokenLockfile);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e: string) => e.includes('devDependencies.playwright')));
  assert.ok(result.errors.some((e: string) => e.includes('node_modules/playwright')));
  assert.ok(result.errors.some((e: string) => e.includes('Override esbuild')));
  assert.ok(result.errors.some((e: string) => e.includes('lightningcss-linux-x64-musl')));
});
