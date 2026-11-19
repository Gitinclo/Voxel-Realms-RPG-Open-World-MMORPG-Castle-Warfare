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
  expectedWidth: number;
  expectedHeight: number;
  maxDiffPixelRatio: number;
}

export const KEY_MODAL_SNAPSHOTS: readonly ModalSnapshotSpec[] = [
  {
    id: 'eula-modal',
    label: 'Legal & EULA Agreement Modal',
    actualFile: '.playwright-cli/modal-eula.png',
    baselineFile: '.playwright-cli/baselines/modal-eula.png',
    diffFile: '.playwright-cli/visual-diff/modal-eula-diff.png',
    expectedWidth: 1440,
    expectedHeight: 900,
    maxDiffPixelRatio: 0.03,
  },
  {
    id: 'vip-modal',
    label: 'VIP Member Pass Modal',
    actualFile: '.playwright-cli/modal-vip.png',
    baselineFile: '.playwright-cli/baselines/modal-vip.png',
    diffFile: '.playwright-cli/visual-diff/modal-vip-diff.png',
    expectedWidth: 1440,
    expectedHeight: 900,
    maxDiffPixelRatio: 0.03,
  },
  {
    id: 'character-creation-modal',
    label: 'Character Creation Centre Modal',
    actualFile: '.playwright-cli/modal-character-creation.png',
    baselineFile: '.playwright-cli/baselines/modal-character-creation.png',
    diffFile: '.playwright-cli/visual-diff/modal-character-creation-diff.png',
    expectedWidth: 1440,
    expectedHeight: 900,
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
