/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  comparePngScreenshots,
  computeVisualVarianceRatio,
  decodePngBuffer,
  encodeRgbaPng,
} from './visualDiff';

function makeTestPng(
  width: number,
  height: number,
  fill: [number, number, number, number],
  patch?: { x: number; y: number; w: number; h: number; rgba: [number, number, number, number] }
): Buffer {
  const buf = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const inPatch =
        patch && x >= patch.x && x < patch.x + patch.w && y >= patch.y && y < patch.y + patch.h;
      const px = inPatch ? patch.rgba : fill;
      buf[idx] = px[0];
      buf[idx + 1] = px[1];
      buf[idx + 2] = px[2];
      buf[idx + 3] = px[3];
    }
  }
  return encodeRgbaPng(width, height, buf);
}

test('comparePngScreenshots passes identical PNGs and fails when visual diff exceeds maxDiffPixelRatio', () => {
  const baseline = makeTestPng(20, 20, [20, 30, 40, 255], {
    x: 2,
    y: 2,
    w: 6,
    h: 6,
    rgba: [220, 180, 60, 255],
  });
  const identical = Buffer.from(baseline);

  const exactRes = comparePngScreenshots(identical, baseline, { maxDiffPixelRatio: 0.03 });
  assert.equal(exactRes.passed, true);
  assert.equal(exactRes.diffPixels, 0);
  assert.equal(exactRes.diffPng, null);

  // Modify 100 out of 400 pixels (25% diff) -> must fail and output a valid diff PNG
  const changed = makeTestPng(20, 20, [20, 30, 40, 255], {
    x: 0,
    y: 0,
    w: 10,
    h: 10,
    rgba: [240, 40, 40, 255],
  });
  const failRes = comparePngScreenshots(changed, baseline, { maxDiffPixelRatio: 0.03 });
  assert.equal(failRes.passed, false);
  assert.ok(failRes.diffRatio > 0.2);
  assert.ok(failRes.diffPng);
  const decodedDiff = decodePngBuffer(failRes.diffPng);
  assert.equal(decodedDiff.width, 20);
  assert.equal(decodedDiff.height, 20);
});

test('comparePngScreenshots rejects dimension mismatches and computeVisualVarianceRatio catches blank frames', () => {
  const blank = decodePngBuffer(makeTestPng(10, 10, [10, 10, 10, 255]));
  assert.equal(computeVisualVarianceRatio(blank), 0);

  const varied = decodePngBuffer(
    makeTestPng(10, 10, [10, 10, 10, 255], { x: 0, y: 0, w: 5, h: 10, rgba: [200, 200, 200, 255] })
  );
  assert.equal(computeVisualVarianceRatio(varied), 0.5);

  const small = makeTestPng(10, 10, [10, 20, 30, 255]);
  const larger = makeTestPng(12, 10, [10, 20, 30, 255]);
  const mismatch = comparePngScreenshots(small, larger);
  assert.equal(mismatch.passed, false);
  assert.ok(mismatch.reason?.includes('dimensions changed'));

  // With explicit maxDimensionDeltaPx, minor 1px height jitter on a 100x100 frame passes within ratio
  const frameA = makeTestPng(100, 100, [10, 20, 30, 255]);
  const frameB = makeTestPng(100, 101, [10, 20, 30, 255]);
  const tolerated = comparePngScreenshots(frameA, frameB, {
    maxDimensionDeltaPx: 4,
    maxDiffPixelRatio: 0.05,
  });
  assert.equal(tolerated.passed, true);
  assert.equal(tolerated.diffPixels, 100);
});

test('comparePngScreenshots absorbs 1-2px subpixel font/stroke shifts while still rejecting real visual regressions', () => {
  // Create a 40x20 dark frame with thin vertical white glyph strokes
  const buildGlyphFrame = (dx: number, blockColor?: [number, number, number, number]) => {
    const w = 40;
    const h = 20;
    const rgba = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const isStroke = y >= 4 && y < 16 && (x === 8 + dx || x === 16 + dx || x === 24 + dx);
        const inColorBlock = blockColor && x >= 10 && x < 26 && y >= 4 && y < 16;
        const px: [number, number, number, number] = inColorBlock
          ? blockColor
          : isStroke
            ? [240, 240, 240, 255]
            : [15, 23, 42, 255];
        rgba[idx] = px[0];
        rgba[idx + 1] = px[1];
        rgba[idx + 2] = px[2];
        rgba[idx + 3] = px[3];
      }
    }
    return encodeRgbaPng(w, h, rgba);
  };

  const baseline = buildGlyphFrame(0);
  const shifted1px = buildGlyphFrame(1);

  // Strict exact-pixel comparison flags the 1px stroke shift (~9% diff)
  const strictRes = comparePngScreenshots(shifted1px, baseline, {
    channelTolerance: 36,
    maxDiffPixelRatio: 0.05,
  });
  assert.equal(strictRes.passed, false);

  // Bidirectional subpixel shift tolerance + AA edge filter absorbs the 1px glyph shift
  const perceptualRes = comparePngScreenshots(shifted1px, baseline, {
    channelTolerance: 36,
    maxDiffPixelRatio: 0.05,
    subpixelShiftRadiusPx: 2,
    ignoreAntialiased: true,
  });
  assert.equal(perceptualRes.passed, true);
  assert.equal(perceptualRes.diffPixels, 0);

  // Real regression (a red block replacing part of the modal) MUST STILL FAIL
  const realRegression = buildGlyphFrame(0, [220, 40, 40, 255]);
  const regressionRes = comparePngScreenshots(realRegression, baseline, {
    channelTolerance: 36,
    maxDiffPixelRatio: 0.05,
    subpixelShiftRadiusPx: 2,
    ignoreAntialiased: true,
  });
  assert.equal(regressionRes.passed, false);
  assert.ok(regressionRes.diffRatio > 0.2);
});
