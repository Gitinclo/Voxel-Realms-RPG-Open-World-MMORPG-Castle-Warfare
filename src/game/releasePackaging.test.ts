/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GITHUB_RELEASE_ASSET_LIMIT_BYTES,
  assertArtifactWithinGitHubLimit,
  buildPlayerFacingReleaseNotes,
  formatGameReleaseArtifactName,
  isPrereleaseSemVer,
  normalizeSemVer,
} from './releasePackaging';

test('formatGameReleaseArtifactName enforces <GameName>-v<SemVer>-<Platform>.<ext> across all platforms', () => {
  assert.equal(
    formatGameReleaseArtifactName({ semver: 'v1.5.0', platform: 'WebGL', ext: 'zip' }),
    'VoxelRealmsRPG-v1.5.0-WebGL.zip'
  );
  assert.equal(
    formatGameReleaseArtifactName({
      gameName: 'MyGame',
      semver: '0.1.0',
      platform: 'Windows',
      ext: 'zip',
    }),
    'MyGame-v0.1.0-Windows.zip'
  );
  assert.equal(
    formatGameReleaseArtifactName({
      gameName: 'MyGame',
      semver: '0.1.0',
      platform: 'macOS',
      ext: 'zip',
    }),
    'MyGame-v0.1.0-macOS.zip'
  );
  assert.equal(
    formatGameReleaseArtifactName({
      gameName: 'MyGame',
      semver: '0.1.0',
      platform: 'Linux',
      ext: 'zip',
    }),
    'MyGame-v0.1.0-Linux.zip'
  );
  assert.equal(
    formatGameReleaseArtifactName({
      gameName: 'MyGame',
      semver: '0.1.0',
      platform: 'Android',
      ext: 'apk',
    }),
    'MyGame-v0.1.0-Android.apk'
  );

  assert.throws(() => normalizeSemVer('not-a-semver'));
  assert.throws(() =>
    formatGameReleaseArtifactName({
      gameName: '../evil',
      semver: '1.0.0',
      platform: 'Linux',
      ext: 'zip',
    })
  );
});

test('isPrereleaseSemVer distinguishes prerelease builds from stable releases', () => {
  assert.equal(isPrereleaseSemVer('0.1.0-alpha.1'), true);
  assert.equal(isPrereleaseSemVer('v1.5.0-beta.2'), true);
  assert.equal(isPrereleaseSemVer('1.5.0-rc.1'), true);
  assert.equal(isPrereleaseSemVer('v1.5.0'), false);
  assert.equal(isPrereleaseSemVer('1.0.0'), false);
});

test('assertArtifactWithinGitHubLimit rejects empty and >= 2 GB artifacts', () => {
  const ok = assertArtifactWithinGitHubLimit('VoxelRealmsRPG-v1.5.0-WebGL.zip', 5 * 1024 * 1024);
  assert.equal(ok.ok, true);
  assert.equal(ok.sizeMb, 5);

  assert.throws(() => assertArtifactWithinGitHubLimit('empty.zip', 0));
  assert.throws(() =>
    assertArtifactWithinGitHubLimit('huge.zip', GITHUB_RELEASE_ASSET_LIMIT_BYTES)
  );
});

test('buildPlayerFacingReleaseNotes emits gameplay/controls summary without raw git hashes', () => {
  const notes = buildPlayerFacingReleaseNotes({
    version: '1.5.0-beta.1',
    webglZipName: 'VoxelRealmsRPG-v1.5.0-beta.1-WebGL.zip',
    linuxServerBundleName: 'VoxelRealmsRPG-v1.5.0-beta.1-Linux.tar.gz',
  });

  assert.match(notes, /Voxel Realms RPG v1\.5\.0-beta\.1 \(Pre-Release Playtest\)/);
  assert.match(notes, /VoxelRealmsRPG-v1\.5\.0-beta\.1-WebGL\.zip/);
  assert.match(notes, /Play in Browser \(GitHub Pages\)/);
  assert.match(notes, /Controls/);
  assert.equal(/\b[0-9a-f]{40}\b/.test(notes), false, 'Must not include raw 40-char git hashes');
});
