#!/usr/bin/env node
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Voxel Realms RPG — Release Build & Offline WebGL Packager
 *
 * 1. Compiles a clean Release Vite WebGL build (`--mode production --base=./`) so `index.html`
 *    and all companion assets run cleanly from an extracted local directory.
 * 2. Packages `index.html`, `assets/*`, and `PLAY_OFFLINE.txt` into the root of
 *    `release-assets/VoxelRealmsRPG-v<SemVer>-WebGL.zip` using zero external zip binaries.
 * 3. Enforces the strict `< 2 GB` GitHub Release asset size ceiling.
 * 4. Generates player-facing release notes (`release-assets/RELEASE_NOTES_PLAYER.md`) and
 *    `release-assets/SHA256SUMS.txt`, and prints the exact `gh release create` publish command.
 */

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const GITHUB_RELEASE_ASSET_LIMIT_BYTES = 2 * 1024 * 1024 * 1024; // 2 GiB
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'release-assets');
const WEBGL_STAGE_DIR = path.join(OUT_DIR, '.webgl-stage');

// Standard IEEE 802.3 CRC32 table for pure-Node ZIP archives
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC32_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function collectFilesRecursively(baseDir, currentDir = baseDir) {
  const results = [];
  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    const absPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFilesRecursively(baseDir, absPath));
    } else if (entry.isFile()) {
      const relPosix = path.relative(baseDir, absPath).split(path.sep).join('/');
      results.push({ absPath, relPosix });
    }
  }
  results.sort((a, b) => a.relPosix.localeCompare(b.relPosix));
  return results;
}

/**
 * Creates a standard PKZIP 2.0 (DEFLATE) archive with all entries placed at archive root.
 */
function createZipFromDirectory(sourceDir, zipFilePath) {
  const files = collectFilesRecursively(sourceDir);
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const raw = fs.readFileSync(file.absPath);
    const compressed = zlib.deflateRawSync(raw, { level: 9 });
    const nameBuf = Buffer.from(file.relPosix, 'utf8');
    const checksum = crc32(raw);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local file header signature
    localHeader.writeUInt16LE(20, 4); // Version needed to extract (2.0)
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 filename flag
    localHeader.writeUInt16LE(8, 8); // Compression method: DEFLATE
    localHeader.writeUInt16LE(0, 10); // Mod time
    localHeader.writeUInt16LE(0x5421, 12); // Deterministic DOS date
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(raw.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // Extra field length

    localParts.push(localHeader, nameBuf, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // Central directory header signature
    centralHeader.writeUInt16LE(20, 4); // Version made by
    centralHeader.writeUInt16LE(20, 6); // Version needed to extract
    centralHeader.writeUInt16LE(0x0800, 8); // UTF-8 flag
    centralHeader.writeUInt16LE(8, 10); // DEFLATE
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x5421, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(raw.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30); // Extra length
    centralHeader.writeUInt16LE(0, 32); // Comment length
    centralHeader.writeUInt16LE(0, 34); // Disk number start
    centralHeader.writeUInt16LE(0, 36); // Internal attrs
    centralHeader.writeUInt32LE(0, 38); // External attrs
    centralHeader.writeUInt32LE(offset, 42); // Relative offset of local header

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralDirBuf = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // End of central directory signature
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralDirBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  fs.writeFileSync(zipFilePath, Buffer.concat([...localParts, centralDirBuf, eocd]));
  return files.length;
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function buildPlayerReleaseNotes({ tag, isPrerelease, webglZipName, linuxBundleName }) {
  return [
    `# Voxel Realms RPG ${tag}${isPrerelease ? ' (Pre-Release Playtest)' : ''}`,
    '',
    'Welcome, Commanders! This release packages the playable **3D Open-World Voxel MMORPG & Castle Warfare** Release build for instant browser play and offline local WebGL execution.',
    '',
    '## Play Immediately',
    '- **Play in Browser (GitHub Pages):** https://gitinclo.github.io/Voxel-Realms-RPG-Open-World-MMORPG-Castle-Warfare/',
    `- **Offline WebGL Package:** Download \`${webglZipName}\`, extract the archive, and run a local static server (\`npx serve .\` or \`python3 -m http.server 8080\`) to open \`index.html\`.`,
    `- **Dedicated Self-Hosted Server Bundle (Linux / Node 22+):** \`${linuxBundleName}\` (see \`DEPLOYMENT.md\` for Docker and Kubernetes instructions).`,
    '',
    '## Highlights & Gameplay Features',
    '- **Open-World 3D Voxel Biomes:** Explore dynamic day/night cycles, volumetric weather fronts, harvestable resource veins, and roaming World Boss Titan rallies.',
    '- **Castle Warfare & 1,000-Trillion Army Progression:** Upgrade your Citadel from Lv. 0 to Lv. 100 and muster T1–T20 siege legions.',
    '- **Four-Path Immortal Cultivation & Daily Missions:** Advance through Mortal, Immortal Sage, Chaos Dao, and Ultimate Origin eras with repeatable 5-task cultivation mission boards and milestone chests.',
    '- **Character Creation & 10 Playable Species:** Customize commander appearance, clan banners, and species traits before entering the realm.',
    '- **Commodity Exchange & Liquidity Matrix:** Track real-time NPC trade volume and bulk liquidity ratings across commodities.',
    '- **Mobile & Desktop Adaptive HUD:** Automatically adapts typography, icon sizing, and touch targets between Desktop Precision and Mobile Readability modes.',
    '',
    '## Controls',
    '- **Desktop:** `W / A / S / D` or `Arrow Keys` to move, `Mouse Drag` to rotate camera, `Space` to interact, and quick-access HUD hotbars for Castle, Barracks, Cultivation, Missions, and Marketplace.',
    '- **Mobile / Tablet:** On-screen touch D-pad, collapsible minimap, and single-tap Command Hub.',
    '',
    '## Verification & Release Integrity',
    '- Verify downloaded assets against `SHA256SUMS.txt` (`sha256sum -c SHA256SUMS.txt`).',
    '- Full public MMO launch roadmap target: **30/03/2030**.',
    '',
  ].join('\n');
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const rawTag = (process.env.RELEASE_TAG || `v${pkg.version}`).trim();
  const semver = rawTag.replace(/^v/i, '');
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(semver)) {
    throw new Error(`Invalid SemVer tag: "${rawTag}"`);
  }
  const tag = `v${semver}`;
  const isPrerelease = semver.includes('-');
  const webglZipName = `VoxelRealmsRPG-${tag}-WebGL.zip`;
  const linuxBundleName = `VoxelRealmsRPG-${tag}-Linux.tar.gz`;
  const webglZipPath = path.join(OUT_DIR, webglZipName);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.rmSync(WEBGL_STAGE_DIR, { recursive: true, force: true });

  console.log(`[ReleasePackager] Building Release WebGL bundle (base=./) for ${tag}...`);
  const viteBin = path.join(ROOT, 'node_modules', '.bin', 'vite');
  execFileSync(
    viteBin,
    ['build', '--mode', 'production', '--base=./', '--outDir', WEBGL_STAGE_DIR],
    {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production', VITE_BASE_PATH: './' },
    }
  );

  if (!fs.existsSync(path.join(WEBGL_STAGE_DIR, 'index.html'))) {
    throw new Error('Release build failed: index.html missing from WebGL stage directory.');
  }

  fs.writeFileSync(
    path.join(WEBGL_STAGE_DIR, 'PLAY_OFFLINE.txt'),
    [
      `Voxel Realms RPG ${tag} — Offline WebGL Package`,
      '================================================',
      '',
      'Modern browsers restrict ES modules loaded over file:// URLs.',
      'To play locally with full WebGL2, audio, and local save persistence:',
      '',
      '  Option 1 (Node.js): npx serve .',
      '  Option 2 (Python 3): python3 -m http.server 8080',
      '',
      'Then open http://localhost:8080 in Chrome, Edge, Firefox, or Safari.',
      '',
    ].join('\n')
  );

  const fileCount = createZipFromDirectory(WEBGL_STAGE_DIR, webglZipPath);
  fs.rmSync(WEBGL_STAGE_DIR, { recursive: true, force: true });

  const zipStat = fs.statSync(webglZipPath);
  if (zipStat.size <= 0 || zipStat.size >= GITHUB_RELEASE_ASSET_LIMIT_BYTES) {
    throw new Error(
      `Artifact ${webglZipName} (${zipStat.size} bytes) violates GitHub Release < 2 GB size limit.`
    );
  }

  const notesPath = path.join(OUT_DIR, 'RELEASE_NOTES_PLAYER.md');
  fs.writeFileSync(
    notesPath,
    buildPlayerReleaseNotes({ tag, isPrerelease, webglZipName, linuxBundleName })
  );

  const checksumLine = `${sha256File(webglZipPath)}  ${webglZipName}\n`;
  fs.writeFileSync(path.join(OUT_DIR, 'SHA256SUMS.txt'), checksumLine);

  const sizeMb = (zipStat.size / (1024 * 1024)).toFixed(2);
  console.log(
    `[ReleasePackager] Packaged ${webglZipName} (${fileCount} files, ${sizeMb} MiB, strictly < 2 GB).`
  );
  console.log(
    `[ReleasePackager] Generated player-facing notes: release-assets/RELEASE_NOTES_PLAYER.md`
  );
  console.log(
    `[ReleasePackager] Ready to publish via GitHub CLI:\n  gh release create ${tag} ./release-assets/${webglZipName} ./release-assets/SHA256SUMS.txt --title "${tag}" --notes-file ./release-assets/RELEASE_NOTES_PLAYER.md${isPrerelease ? ' --prerelease' : ''}`
  );
}

main();
