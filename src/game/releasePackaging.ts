/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const GITHUB_RELEASE_ASSET_LIMIT_BYTES = 2 * 1024 * 1024 * 1024; // 2 GiB GitHub Release asset limit
export const CANONICAL_GAME_ARTIFACT_PREFIX = 'VoxelRealmsRPG';

export type ReleasePlatformName = 'WebGL' | 'Windows' | 'macOS' | 'Linux' | 'Android';
export type ReleaseArchiveExtension = 'zip' | 'tar.gz' | 'apk';

export interface ArtifactNamingParams {
  gameName?: string;
  semver: string;
  platform: ReleasePlatformName;
  ext: ReleaseArchiveExtension;
}

const SEMVER_REGEX = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const GAME_NAME_REGEX = /^[A-Za-z0-9]+$/;

/**
 * Strips an optional leading `v` and validates Semantic Versioning (`X.Y.Z` with optional prerelease/build).
 */
export function normalizeSemVer(rawVersion: string): string {
  const cleaned = rawVersion.trim().replace(/^v/i, '');
  if (!SEMVER_REGEX.test(cleaned)) {
    throw new Error(`Invalid Semantic Version: "${rawVersion}"`);
  }
  return cleaned;
}

/**
 * Returns true if the version carries a SemVer prerelease identifier (e.g. `0.1.0-alpha.1`, `1.5.0-beta.2`, `1.5.0-rc.1`).
 */
export function isPrereleaseSemVer(rawVersion: string): boolean {
  const normalized = normalizeSemVer(rawVersion);
  return normalized.includes('-');
}

/**
 * Formats a release artifact strictly following `<GameName>-v<SemVer>-<Platform>.<ext>`.
 */
export function formatGameReleaseArtifactName(params: ArtifactNamingParams): string {
  const gameName = (params.gameName ?? CANONICAL_GAME_ARTIFACT_PREFIX).trim();
  if (!GAME_NAME_REGEX.test(gameName)) {
    throw new Error(`Invalid alphanumeric game artifact name: "${gameName}"`);
  }
  const semver = normalizeSemVer(params.semver);
  return `${gameName}-v${semver}-${params.platform}.${params.ext}`;
}

/**
 * Enforces GitHub Releases' strict `< 2 GB` single-asset size ceiling and rejects empty artifacts.
 */
export function assertArtifactWithinGitHubLimit(
  fileName: string,
  byteSize: number
): { ok: true; sizeMb: number } {
  if (!Number.isFinite(byteSize) || byteSize <= 0) {
    throw new Error(`Release artifact "${fileName}" is empty or unreadable (${byteSize} bytes).`);
  }
  if (byteSize >= GITHUB_RELEASE_ASSET_LIMIT_BYTES) {
    throw new Error(
      `Release artifact "${fileName}" (${byteSize} bytes) exceeds the strict 2 GB GitHub Release asset limit.`
    );
  }
  return { ok: true, sizeMb: Number((byteSize / (1024 * 1024)).toFixed(2)) };
}

export interface PlayerReleaseNotesParams {
  version: string;
  webglZipName: string;
  linuxServerBundleName?: string;
  playablePagesUrl?: string;
  launchTargetDisplay?: string;
}

/**
 * Generates clean, player-facing GitHub Release notes summarizing gameplay, world systems,
 * controls, offline WebGL play instructions, and browser play link.
 * Intentionally omits raw Git commit hashes and internal refactors.
 */
export function buildPlayerFacingReleaseNotes(params: PlayerReleaseNotesParams): string {
  const semver = normalizeSemVer(params.version);
  const tag = `v${semver}`;
  const isPre = isPrereleaseSemVer(semver);
  const pagesUrl =
    params.playablePagesUrl ??
    'https://gitinclo.github.io/Voxel-Realms-RPG-Open-World-MMORPG-Castle-Warfare/';
  const launchTarget = params.launchTargetDisplay ?? '30/03/2030';

  const lines = [
    `# Voxel Realms RPG ${tag}${isPre ? ' (Pre-Release Playtest)' : ''}`,
    '',
    'Welcome, Commanders! This release packages the playable **3D Open-World Voxel MMORPG & Castle Warfare** Release build for instant browser play and offline local WebGL execution.',
    '',
    '## Play Immediately',
    `- **Play in Browser (GitHub Pages):** ${pagesUrl}`,
    `- **Offline WebGL Package:** Download \`${params.webglZipName}\`, extract the archive, and serve the folder locally (e.g. \`npx serve .\` or \`python3 -m http.server 8080\`) to launch \`index.html\`.`,
  ];

  if (params.linuxServerBundleName) {
    lines.push(
      `- **Dedicated Self-Hosted Server Bundle (Linux / Node 22+):** \`${params.linuxServerBundleName}\` (see \`DEPLOYMENT.md\` for Docker and Kubernetes setup).`
    );
  }

  lines.push(
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
    `- Full public MMO launch roadmap target: **${launchTarget}**.`
  );

  return `${lines.join('\n')}\n`;
}
