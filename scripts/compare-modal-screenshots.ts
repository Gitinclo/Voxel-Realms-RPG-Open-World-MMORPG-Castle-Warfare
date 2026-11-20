/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import playwrightConfig from '../playwright.config';
import {
  comparePngScreenshots,
  computeVisualVarianceRatio,
  decodePngBuffer,
} from '../src/lib/visualDiff';

const IS_CI = process.env.CI === 'true';
const UPDATE_BASELINES = process.env.E2E_UPDATE_BASELINES === '1' && !IS_CI;
const DIFF_DIR = path.resolve(playwrightConfig.outputDir);
const BASELINE_DIR = path.resolve(playwrightConfig.snapshotDir);

fs.mkdirSync(DIFF_DIR, { recursive: true });
fs.mkdirSync(BASELINE_DIR, { recursive: true });

interface ModalComparisonReportEntry {
  id: string;
  label: string;
  status: 'matched' | 'baseline-seeded' | 'failed';
  width: number;
  height: number;
  varianceRatio: number;
  diffRatio: number;
  maxDiffPixelRatio: number;
  diffPixels: number;
  actualFile: string;
  baselineFile: string;
  diffFile: string | null;
  reason: string | null;
}

const MODAL_THRESHOLD_ENV_KEYS: Record<string, string> = {
  'eula-modal': 'E2E_MAX_DIFF_RATIO_EULA',
  'vip-modal': 'E2E_MAX_DIFF_RATIO_VIP',
};

function resolveEffectiveMaxDiffRatio(specId: string, defaultRatio: number): number {
  const envKey = MODAL_THRESHOLD_ENV_KEYS[specId];
  const raw = envKey ? process.env[envKey] : undefined;
  if (!raw) return defaultRatio;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 1) return defaultRatio;
  return parsed;
}

const report: ModalComparisonReportEntry[] = [];
const seenHashes = new Map<string, string>();
let hasFailure = false;

for (const spec of playwrightConfig.keyModalSnapshots) {
  const actualPath = path.resolve(spec.actualFile);
  const baselinePath = path.resolve(spec.baselineFile);
  const diffPath = path.resolve(spec.diffFile);
  const effectiveMaxDiffRatio = resolveEffectiveMaxDiffRatio(spec.id, spec.maxDiffPixelRatio);

  if (!fs.existsSync(actualPath)) {
    hasFailure = true;
    report.push({
      id: spec.id,
      label: spec.label,
      status: 'failed',
      width: 0,
      height: 0,
      varianceRatio: 0,
      diffRatio: 1,
      maxDiffPixelRatio: effectiveMaxDiffRatio,
      diffPixels: 0,
      actualFile: spec.actualFile,
      baselineFile: spec.baselineFile,
      diffFile: null,
      reason: `Missing captured modal screenshot at ${spec.actualFile}`,
    });
    continue;
  }

  const actualBuf = fs.readFileSync(actualPath);
  const decoded = decodePngBuffer(actualBuf);
  const varianceRatio = computeVisualVarianceRatio(decoded);

  // Copy actual screenshot into visual-diff directory for CI artifact inspection
  fs.copyFileSync(actualPath, path.join(DIFF_DIR, `${spec.id}-actual.png`));

  if (decoded.width < spec.minWidth || decoded.height < spec.minHeight) {
    hasFailure = true;
    report.push({
      id: spec.id,
      label: spec.label,
      status: 'failed',
      width: decoded.width,
      height: decoded.height,
      varianceRatio,
      diffRatio: 1,
      maxDiffPixelRatio: effectiveMaxDiffRatio,
      diffPixels: decoded.width * decoded.height,
      actualFile: spec.actualFile,
      baselineFile: spec.baselineFile,
      diffFile: null,
      reason: `Unexpected modal capture size ${decoded.width}x${decoded.height} (minimum ${spec.minWidth}x${spec.minHeight}).`,
    });
    continue;
  }

  if (varianceRatio < 0.05) {
    hasFailure = true;
    report.push({
      id: spec.id,
      label: spec.label,
      status: 'failed',
      width: decoded.width,
      height: decoded.height,
      varianceRatio,
      diffRatio: 1,
      maxDiffPixelRatio: effectiveMaxDiffRatio,
      diffPixels: decoded.width * decoded.height,
      actualFile: spec.actualFile,
      baselineFile: spec.baselineFile,
      diffFile: null,
      reason: `Captured modal frame appears blank/monochrome (varianceRatio=${varianceRatio.toFixed(4)}).`,
    });
    continue;
  }

  const duplicateOf = seenHashes.get(decoded.sha256);
  if (duplicateOf) {
    hasFailure = true;
    report.push({
      id: spec.id,
      label: spec.label,
      status: 'failed',
      width: decoded.width,
      height: decoded.height,
      varianceRatio,
      diffRatio: 1,
      maxDiffPixelRatio: effectiveMaxDiffRatio,
      diffPixels: 0,
      actualFile: spec.actualFile,
      baselineFile: spec.baselineFile,
      diffFile: null,
      reason: `Modal screenshot is byte-identical to "${duplicateOf}", indicating the modal failed to open or switch.`,
    });
    continue;
  }
  seenHashes.set(decoded.sha256, spec.id);

  if (UPDATE_BASELINES) {
    fs.copyFileSync(actualPath, baselinePath);
    fs.copyFileSync(baselinePath, path.join(DIFF_DIR, `${spec.id}-expected.png`));
    report.push({
      id: spec.id,
      label: spec.label,
      status: 'baseline-seeded',
      width: decoded.width,
      height: decoded.height,
      varianceRatio,
      diffRatio: 0,
      maxDiffPixelRatio: effectiveMaxDiffRatio,
      diffPixels: 0,
      actualFile: spec.actualFile,
      baselineFile: spec.baselineFile,
      diffFile: null,
      reason: null,
    });
    continue;
  }

  if (!fs.existsSync(baselinePath)) {
    hasFailure = true;
    report.push({
      id: spec.id,
      label: spec.label,
      status: 'failed',
      width: decoded.width,
      height: decoded.height,
      varianceRatio,
      diffRatio: 1,
      maxDiffPixelRatio: effectiveMaxDiffRatio,
      diffPixels: decoded.width * decoded.height,
      actualFile: spec.actualFile,
      baselineFile: spec.baselineFile,
      diffFile: null,
      reason: `Missing versioned visual baseline at ${spec.baselineFile}. Run "E2E_UPDATE_BASELINES=1 npm run verify:e2e" locally and commit ${spec.baselineFile}.`,
    });
    continue;
  }

  const baselineBuf = fs.readFileSync(baselinePath);
  const diff = comparePngScreenshots(actualBuf, baselineBuf, {
    channelTolerance: 36,
    maxDimensionDeltaPx: 16,
    maxDiffPixelRatio: effectiveMaxDiffRatio,
    subpixelShiftRadiusPx: 2,
    ignoreAntialiased: true,
  });

  fs.copyFileSync(baselinePath, path.join(DIFF_DIR, `${spec.id}-expected.png`));
  if (diff.diffPng) {
    fs.writeFileSync(diffPath, diff.diffPng);
  }

  if (!diff.passed) {
    hasFailure = true;
  }

  report.push({
    id: spec.id,
    label: spec.label,
    status: diff.passed ? 'matched' : 'failed',
    width: diff.width,
    height: diff.height,
    varianceRatio,
    diffRatio: diff.diffRatio,
    maxDiffPixelRatio: effectiveMaxDiffRatio,
    diffPixels: diff.diffPixels,
    actualFile: spec.actualFile,
    baselineFile: spec.baselineFile,
    diffFile: diff.diffPng ? spec.diffFile : null,
    reason: diff.reason,
  });
}

const reportPath = path.join(DIFF_DIR, 'report.json');
fs.writeFileSync(
  reportPath,
  JSON.stringify(
    {
      generatedAtIso: new Date().toISOString(),
      maxDiffPixelRatio: playwrightConfig.expect.toHaveScreenshot.maxDiffPixelRatio,
      passed: !hasFailure,
      modals: report,
    },
    null,
    2
  )
);

for (const entry of report) {
  console.log(
    `[ModalVisualDiff] ${entry.id}: ${entry.status.toUpperCase()} (${entry.width}x${entry.height}, diff=${(entry.diffRatio * 100).toFixed(2)}%, limit=${(entry.maxDiffPixelRatio * 100).toFixed(0)}%, variance=${(entry.varianceRatio * 100).toFixed(1)}%)${entry.reason ? ` — ${entry.reason}` : ''}`
  );
}

if (hasFailure) {
  console.error(
    `[ModalVisualDiff] FAIL: One or more key modal visual comparisons failed. See ${reportPath}`
  );
  process.exit(1);
}

console.log(
  `[ModalVisualDiff] OK: All ${report.length} key modal screenshots verified (${reportPath}).`
);
