/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ANDROID_OPEN_SOURCE_LIBRARIES,
  isApache2CompatibleLicense,
  validateAndroidDependencyCatalog,
} from './androidDependencies';

const ROOT = process.cwd();

function readText(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

const REQUIRED_ANDROID_LIBRARIES = [
  'AppAuth-Android',
  'Apollo GraphQL Client',
  'Coil',
  'android-gif-drawable',
  'AndroidSVG',
  'jsoup: Java HTML Parser',
  'PdfViewPager',
  'Lingver',
  'OkHttp',
  'Android Open Source Project',
] as const;

test('ANDROID_OPEN_SOURCE_LIBRARIES includes all 10 required Android libraries with Apache-2.0 compatible licenses', () => {
  const validation = validateAndroidDependencyCatalog(ANDROID_OPEN_SOURCE_LIBRARIES);
  assert.equal(validation.ok, true, `Catalog validation errors: ${validation.errors.join('; ')}`);

  const names = new Set(ANDROID_OPEN_SOURCE_LIBRARIES.map((lib) => lib.name));
  for (const required of REQUIRED_ANDROID_LIBRARIES) {
    assert.ok(
      names.has(required),
      `Missing required Android library "${required}" in ANDROID_OPEN_SOURCE_LIBRARIES`
    );
  }
  assert.equal(ANDROID_OPEN_SOURCE_LIBRARIES.length, REQUIRED_ANDROID_LIBRARIES.length);

  assert.equal(isApache2CompatibleLicense('Apache-2.0'), true);
  assert.equal(isApache2CompatibleLicense('MIT'), true);
  assert.equal(isApache2CompatibleLicense('GPL-3.0-only'), false);
});

test('validateAndroidDependencyCatalog rejects duplicate coordinates, non-HTTPS URLs, and copyleft licenses', () => {
  const badResult = validateAndroidDependencyCatalog([
    {
      ...ANDROID_OPEN_SOURCE_LIBRARIES[0],
      upstreamUrl: 'http://insecure.example.com',
      license: 'GPL-3.0-only' as unknown as 'Apache-2.0',
    },
    ANDROID_OPEN_SOURCE_LIBRARIES[0],
  ]);

  assert.equal(badResult.ok, false);
  assert.ok(badResult.errors.some((e) => e.includes('Duplicate Android library id')));
  assert.ok(badResult.errors.some((e) => e.includes('non-permissive license')));
  assert.ok(badResult.errors.some((e) => e.includes('must use https://')));
});

test('Android Gradle Version Catalog and repository docs stay synchronized across all 10 Android open-source libraries', () => {
  const toml = readText('android/gradle/libs.versions.toml');
  const androidDoc = readText('android.md');
  const noticesDoc = readText('THIRD_PARTY_NOTICES.md');
  const licensesDoc = readText('OPEN_SOURCE_LICENSES.md');
  const dependencyDoc = readText('dependency.md');
  const rootNotice = readText('NOTICE');
  const sbomDoc = readText('SBOM.md');

  assert.match(rootNotice, /android\/gradle\/libs\.versions\.toml/);
  assert.match(rootNotice, /THIRD_PARTY_NOTICES\.md/);
  assert.match(sbomDoc, /android\/gradle\/libs\.versions\.toml/);

  for (const lib of ANDROID_OPEN_SOURCE_LIBRARIES) {
    const [group, artifact] = lib.coordinate.split(':');
    assert.match(
      toml,
      new RegExp(
        `${lib.tomlAlias}\\s*=\\s*\\{\\s*group\\s*=\\s*"${group.replace(/\./g, '\\.')}",\\s*name\\s*=\\s*"${artifact}"`
      ),
      `android/gradle/libs.versions.toml is missing Gradle alias "${lib.tomlAlias}" (${lib.coordinate})`
    );
    assert.ok(androidDoc.includes(lib.name), `android.md is missing "${lib.name}"`);
    assert.ok(noticesDoc.includes(lib.name), `THIRD_PARTY_NOTICES.md is missing "${lib.name}"`);
    assert.ok(licensesDoc.includes(lib.name), `OPEN_SOURCE_LICENSES.md is missing "${lib.name}"`);
    assert.ok(dependencyDoc.includes(lib.name), `dependency.md is missing "${lib.name}"`);
    assert.ok(
      dependencyDoc.includes(lib.coordinate),
      `dependency.md is missing Maven coordinate "${lib.coordinate}"`
    );
  }
});
