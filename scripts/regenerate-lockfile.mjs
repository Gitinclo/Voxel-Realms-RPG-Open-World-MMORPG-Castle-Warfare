#!/usr/bin/env node
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..');

/**
 * Pure verifier: compares package.json against package-lock.json to catch
 * missing dependencies, version spec drift, missing integrity digests, or
 * stripped cross-platform optional binaries (such as linux-musl lightningcss
 * needed by node:26-alpine Docker `npm ci`).
 */
export function verifyLockfileIntegrity(manifest, lockfile) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object') {
    return { ok: false, errors: ['package.json is missing or invalid JSON.'], stats: null };
  }
  if (!lockfile || typeof lockfile !== 'object') {
    return { ok: false, errors: ['package-lock.json is missing or invalid JSON.'], stats: null };
  }

  if (typeof lockfile.lockfileVersion !== 'number' || lockfile.lockfileVersion < 3) {
    errors.push(`Expected lockfileVersion >= 3, found ${String(lockfile.lockfileVersion)}.`);
  }

  if (lockfile.name !== manifest.name) {
    errors.push(`Lockfile name "${lockfile.name}" does not match manifest "${manifest.name}".`);
  }
  if (lockfile.version !== manifest.version) {
    errors.push(
      `Lockfile version "${lockfile.version}" does not match manifest "${manifest.version}".`
    );
  }

  const packages = lockfile.packages;
  if (!packages || typeof packages !== 'object' || !packages['']) {
    errors.push('Lockfile is missing root packages[""] entry.');
    return { ok: false, errors, stats: null };
  }

  const rootPkg = packages[''];
  const compareRecord = (sectionName) => {
    const manifestRec = manifest[sectionName] || {};
    const lockRec = rootPkg[sectionName] || {};

    for (const [dep, spec] of Object.entries(manifestRec)) {
      if (lockRec[dep] !== spec) {
        errors.push(
          `Manifest ${sectionName}.${dep} ("${spec}") differs from lockfile ("${String(lockRec[dep])}").`
        );
      }
      if (sectionName === 'dependencies' || sectionName === 'devDependencies') {
        const resolvedEntry = packages[`node_modules/${dep}`];
        if (!resolvedEntry) {
          errors.push(`Resolved package entry "node_modules/${dep}" is missing from lockfile.`);
        } else {
          if (!resolvedEntry.version) {
            errors.push(`Resolved entry "node_modules/${dep}" is missing a version.`);
          }
          if (!resolvedEntry.resolved || !resolvedEntry.integrity) {
            errors.push(
              `Resolved entry "node_modules/${dep}" is missing resolved URL or integrity hash.`
            );
          }
        }
      }
    }

    for (const dep of Object.keys(lockRec)) {
      if (!(dep in manifestRec)) {
        errors.push(
          `Stale ${sectionName}.${dep} present in lockfile root but removed from package.json.`
        );
      }
    }
  };

  compareRecord('dependencies');
  compareRecord('devDependencies');

  // Verify pinned overrides in package.json are reflected in resolved lockfile entries
  const manifestOverrides = manifest.overrides || {};
  for (const [dep, overrideSpec] of Object.entries(manifestOverrides)) {
    if (typeof overrideSpec !== 'string') continue;
    const resolvedEntry = packages[`node_modules/${dep}`];
    if (!resolvedEntry) continue;
    if (/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(overrideSpec) && resolvedEntry.version !== overrideSpec) {
      errors.push(
        `Override ${dep} ("${overrideSpec}") does not match resolved lockfile version ("${resolvedEntry.version}").`
      );
    }
  }

  // Verify cross-platform optional native binaries required for Alpine Linux (Docker node:26-alpine)
  const packageKeys = Object.keys(packages);
  const lightningcssEntries = packageKeys.filter((k) => k.includes('lightningcss'));
  const hasLinuxMuslLightning = packageKeys.some((k) =>
    k.endsWith('node_modules/lightningcss-linux-x64-musl')
  );
  if (lightningcssEntries.length > 0 && !hasLinuxMuslLightning) {
    errors.push(
      'Lockfile is missing cross-platform optional binary "node_modules/lightningcss-linux-x64-musl" required by node:26-alpine Docker npm ci.'
    );
  }

  const tsNativeEntries = packageKeys.filter((k) => k.includes('@typescript/typescript-'));
  const hasLinuxTsNative = packageKeys.some(
    (k) =>
      k.includes('@typescript/typescript-linux-x64') ||
      k.includes('@typescript/typescript-linux-arm64')
  );
  if (packages['node_modules/typescript']?.version?.startsWith('7.') && !hasLinuxTsNative) {
    errors.push(
      'Lockfile is missing cross-platform optional TypeScript 7 native binary entries (@typescript/typescript-linux-*).'
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    stats: {
      totalPackages: packageKeys.length,
      dependencies: Object.keys(manifest.dependencies || {}).length,
      devDependencies: Object.keys(manifest.devDependencies || {}).length,
      lightningcssEntries: lightningcssEntries.length,
      tsNativeEntries: tsNativeEntries.length,
    },
  };
}

export function verifyProjectLockfile(rootDir = DEFAULT_ROOT) {
  const pkgPath = path.join(rootDir, 'package.json');
  const lockPath = path.join(rootDir, 'package-lock.json');

  if (!fs.existsSync(pkgPath)) {
    return { ok: false, errors: [`Missing package.json at ${pkgPath}`], stats: null };
  }
  if (!fs.existsSync(lockPath)) {
    return { ok: false, errors: [`Missing package-lock.json at ${lockPath}`], stats: null };
  }

  const manifest = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const lockfile = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  return verifyLockfileIntegrity(manifest, lockfile);
}

export function regenerateProjectLockfile(rootDir = DEFAULT_ROOT) {
  const pkgPath = path.join(rootDir, 'package.json');
  const lockPath = path.join(rootDir, 'package-lock.json');

  if (!fs.existsSync(pkgPath)) {
    throw new Error(`package.json not found at ${pkgPath}`);
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vr-lockfile-regen-'));
  try {
    fs.copyFileSync(pkgPath, path.join(tmpDir, 'package.json'));

    // Generate a clean, full cross-platform package-lock.json without stale partial platform caches
    execFileSync(
      'npm',
      ['install', '--package-lock-only', '--no-audit', '--no-fund', '--ignore-scripts'],
      {
        cwd: tmpDir,
        stdio: 'inherit',
        env: {
          ...process.env,
          PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',
        },
      }
    );

    const generatedLockPath = path.join(tmpDir, 'package-lock.json');
    if (!fs.existsSync(generatedLockPath)) {
      throw new Error('npm did not produce package-lock.json in temp directory.');
    }

    const manifest = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const generatedLock = JSON.parse(fs.readFileSync(generatedLockPath, 'utf8'));
    const check = verifyLockfileIntegrity(manifest, generatedLock);
    if (!check.ok) {
      throw new Error(`Regenerated lockfile failed verification:\n- ${check.errors.join('\n- ')}`);
    }

    const tmpTarget = `${lockPath}.tmp.${process.pid}`;
    fs.copyFileSync(generatedLockPath, tmpTarget);
    fs.renameSync(tmpTarget, lockPath);

    return check;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectExecution) {
  const args = new Set(process.argv.slice(2));
  const verifyOnly = args.has('--verify') || args.has('--check');

  try {
    if (verifyOnly) {
      const result = verifyProjectLockfile(DEFAULT_ROOT);
      if (!result.ok) {
        console.error('[LockfileVerify] FAIL: package-lock.json is out of sync with package.json:');
        for (const err of result.errors) {
          console.error(`  - ${err}`);
        }
        console.error('[LockfileVerify] Run "npm run lockfile:regenerate" to repair.');
        process.exit(1);
      }
      console.log(
        `[LockfileVerify] OK: package-lock.json matches package.json (${result.stats.dependencies} deps, ${result.stats.devDependencies} devDeps, ${result.stats.totalPackages} resolved entries, ${result.stats.lightningcssEntries} lightningcss, ${result.stats.tsNativeEntries} ts-native).`
      );
      process.exit(0);
    }

    console.log(
      '[LockfileRegen] Regenerating cross-platform package-lock.json from package.json...'
    );
    const result = regenerateProjectLockfile(DEFAULT_ROOT);
    console.log(
      `[LockfileRegen] OK: Regenerated & verified package-lock.json (${result.stats.dependencies} deps, ${result.stats.devDependencies} devDeps, ${result.stats.totalPackages} resolved entries, ${result.stats.lightningcssEntries} lightningcss, ${result.stats.tsNativeEntries} ts-native).`
    );
  } catch (err) {
    console.error('[LockfileRegen] ERROR:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
