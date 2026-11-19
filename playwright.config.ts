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
    baselineFile: '.playwright-cli/baselines/modal-eula.png',
    diffFile: '.playwright-cli/visual-diff/modal-eula-diff.png',
    minWidth: 600,
    minHeight: 400,
    maxDiffPixelRatio: 0.03,
  },
  {
    id: 'vip-modal',
    label: 'VIP Member Pass Modal',
    actualFile: '.playwright-cli/modal-vip.png',
    baselineFile: '.playwright-cli/baselines/modal-vip.png',
    diffFile: '.playwright-cli/visual-diff/modal-vip-diff.png',
    minWidth: 600,
    minHeight: 400,
    maxDiffPixelRatio: 0.03,
  },
  {
    id: 'character-creation-modal',
    label: 'Character Creation Centre Modal',
    actualFile: '.playwright-cli/modal-character-creation.png',
    baselineFile: '.playwright-cli/baselines/modal-character-creation.png',
    diffFile: '.playwright-cli/visual-diff/modal-character-creation-diff.png',
    minWidth: 600,
    minHeight: 400,
    maxDiffPixelRatio: 0.03,
  },
  {
    id: 'castle-modal',
    label: 'Castle Citadel Upgrade Modal',
    actualFile: '.playwright-cli/modal-castle.png',
    baselineFile: '.playwright-cli/baselines/modal-castle.png',
    diffFile: '.playwright-cli/visual-diff/modal-castle-diff.png',
    minWidth: 600,
    minHeight: 400,
    maxDiffPixelRatio: 0.03,
  },
  {
    id: 'troop-modal',
    label: 'Troop Barracks & Unit Upgrade Modal',
    actualFile: '.playwright-cli/modal-troop.png',
    baselineFile: '.playwright-cli/baselines/modal-troop.png',
    diffFile: '.playwright-cli/visual-diff/modal-troop-diff.png',
    minWidth: 600,
    minHeight: 400,
    maxDiffPixelRatio: 0.03,
  },
  {
    id: 'cultivation-modal',
    label: 'Four-Path Immortal Cultivation Modal',
    actualFile: '.playwright-cli/modal-cultivation.png',
    baselineFile: '.playwright-cli/baselines/modal-cultivation.png',
    diffFile: '.playwright-cli/visual-diff/modal-cultivation-diff.png',
    minWidth: 600,
    minHeight: 400,
    maxDiffPixelRatio: 0.03,
  },
] as const;

const playwrightConfig = {
  testDir: './scripts',
  outputDir: '.playwright-cli/visual-diff',
  snapshotDir: '.playwright-cli/baselines',
  snapshotPathTemplate: '{snapshotDir}/{arg}{ext}',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.03,
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
