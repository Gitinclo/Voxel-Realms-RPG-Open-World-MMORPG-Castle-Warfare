/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ModalSnapshotSpec {
  id: string;
  label: string;
  actualFile: string;
  baselineFile: string;
  diffFile: string;
  minWidth: number;
  minHeight: number;
  maxDiffPixelRatio: number;
}

export const KEY_MODAL_SNAPSHOTS: readonly ModalSnapshotSpec[] = [
  {
    id: 'eula-modal',
    label: 'Legal & EULA Agreement Modal',
    actualFile: '.playwright-cli/modal-eula.png',
    baselineFile: 'e2e/baselines/modal-eula.png',
    diffFile: '.playwright-cli/visual-diff/modal-eula-diff.png',
    minWidth: 600,
    minHeight: 400,
    maxDiffPixelRatio: 0.08,
  },
  {
    id: 'vip-modal',
    label: 'VIP Member Pass Modal',
    actualFile: '.playwright-cli/modal-vip.png',
    baselineFile: 'e2e/baselines/modal-vip.png',
    diffFile: '.playwright-cli/visual-diff/modal-vip-diff.png',
    minWidth: 600,
    minHeight: 400,
    maxDiffPixelRatio: 0.08,
  },
  {
    id: 'character-creation-modal',
    label: 'Character Creation Centre Modal',
    actualFile: '.playwright-cli/modal-character-creation.png',
    baselineFile: 'e2e/baselines/modal-character-creation.png',
    diffFile: '.playwright-cli/visual-diff/modal-character-creation-diff.png',
    minWidth: 600,
    minHeight: 400,
    maxDiffPixelRatio: 0.08,
  },
  {
    id: 'castle-modal',
    label: 'Castle Citadel Upgrade Modal',
    actualFile: '.playwright-cli/modal-castle.png',
    baselineFile: 'e2e/baselines/modal-castle.png',
    diffFile: '.playwright-cli/visual-diff/modal-castle-diff.png',
    minWidth: 600,
    minHeight: 400,
    maxDiffPixelRatio: 0.08,
  },
  {
    id: 'troop-modal',
    label: 'Troop Barracks & Unit Upgrade Modal',
    actualFile: '.playwright-cli/modal-troop.png',
    baselineFile: 'e2e/baselines/modal-troop.png',
    diffFile: '.playwright-cli/visual-diff/modal-troop-diff.png',
    minWidth: 600,
    minHeight: 400,
    maxDiffPixelRatio: 0.08,
  },
  {
    id: 'cultivation-modal',
    label: 'Four-Path Immortal Cultivation Modal',
    actualFile: '.playwright-cli/modal-cultivation.png',
    baselineFile: 'e2e/baselines/modal-cultivation.png',
    diffFile: '.playwright-cli/visual-diff/modal-cultivation-diff.png',
    minWidth: 600,
    minHeight: 400,
    maxDiffPixelRatio: 0.08,
  },
] as const;

const playwrightConfig = {
  testDir: './scripts',
  outputDir: '.playwright-cli/visual-diff',
  snapshotDir: 'e2e/baselines',
  snapshotPathTemplate: '{snapshotDir}/{arg}{ext}',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.08,
      threshold: 0.2,
      animations: 'disabled' as const,
    },
  },
  use: {
    browserName: 'chromium' as const,
    channel: 'chrome-for-testing' as const,
    headless: true,
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure' as const,
    trace: 'retain-on-failure' as const,
  },
  keyModalSnapshots: KEY_MODAL_SNAPSHOTS,
};

export default playwrightConfig;
