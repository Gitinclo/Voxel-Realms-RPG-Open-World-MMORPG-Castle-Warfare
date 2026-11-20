/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';
import zlib from 'node:zlib';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export interface DecodedPng {
  width: number;
  height: number;
  rgba: Uint8Array;
  sha256: string;
}

export interface VisualDiffOptions {
  /** Per-channel delta (0..255) above which a pixel counts as visually changed. Default: 18. */
  channelTolerance?: number;
  /** Maximum fraction (0..1) of differing pixels allowed before failing. Default: 0.03. */
  maxDiffPixelRatio?: number;
  /**
   * Optional maximum width/height delta (in CSS pixels) tolerated across OS font renderers.
   * When > 0 and both width/height deltas are within this limit, the overlapping region is compared
   * and non-overlapping edge pixels are counted as diffs. Default: 0 (exact dimensions required).
   */
  maxDimensionDeltaPx?: number;
  /**
   * Optional bidirectional pixel-shift radius (in CSS pixels, e.g. 1 or 2) to absorb subpixel
   * FreeType/Skia font hinting and kerning shifts across OS/Chromium versions.
   * A differing pixel (x, y) is treated as subpixel drift ONLY when BOTH:
   *  - actual(x, y) matches a baseline pixel within [-r, +r], AND
   *  - baseline(x, y) matches an actual pixel within [-r, +r].
   * Real color changes, missing cards, blank frames, or large layout shifts still fail. Default: 0.
   */
  subpixelShiftRadiusPx?: number;
  /**
   * When true, skips single-pixel anti-aliased glyph/border edge halos (following Vysniauskas /
   * pixelmatch edge criteria) so cross-OS subpixel font smoothing does not cause false failures.
   * Default: false.
   */
  ignoreAntialiased?: boolean;
}

export interface VisualDiffResult {
  passed: boolean;
  reason: string | null;
  width: number;
  height: number;
  baselineWidth: number;
  baselineHeight: number;
  totalPixels: number;
  diffPixels: number;
  diffRatio: number;
  actualSha256: string;
  baselineSha256: string;
  diffPng: Buffer | null;
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

export function decodePngBuffer(buffer: Buffer): DecodedPng {
  if (buffer.length < 33 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('Invalid PNG signature.');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks: Buffer[] = [];

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const chunkType = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > buffer.length) {
      throw new Error(`Truncated PNG chunk: ${chunkType}`);
    }

    if (chunkType === 'IHDR') {
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
      bitDepth = buffer[dataStart + 8];
      colorType = buffer[dataStart + 9];
    } else if (chunkType === 'IDAT') {
      idatChunks.push(buffer.subarray(dataStart, dataEnd));
    } else if (chunkType === 'IEND') {
      break;
    }

    offset = dataEnd + 4;
  }

  if (width <= 0 || height <= 0) {
    throw new Error('PNG missing valid IHDR dimensions.');
  }
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(`Unsupported PNG format: bitDepth=${bitDepth}, colorType=${colorType}`);
  }

  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const expectedLength = height * (stride + 1);
  if (raw.length < expectedLength) {
    throw new Error(`Decompressed PNG data too short (${raw.length} < ${expectedLength}).`);
  }

  const unfiltered = new Uint8Array(height * stride);
  for (let y = 0; y < height; y++) {
    const filterType = raw[y * (stride + 1)];
    const rowStart = y * (stride + 1) + 1;
    const dstStart = y * stride;
    for (let x = 0; x < stride; x++) {
      const filt = raw[rowStart + x];
      const a = x >= bpp ? unfiltered[dstStart + x - bpp] : 0;
      const b = y > 0 ? unfiltered[dstStart - stride + x] : 0;
      const c = x >= bpp && y > 0 ? unfiltered[dstStart - stride + x - bpp] : 0;

      let recon = filt;
      if (filterType === 1) {
        recon = (filt + a) & 0xff;
      } else if (filterType === 2) {
        recon = (filt + b) & 0xff;
      } else if (filterType === 3) {
        recon = (filt + ((a + b) >> 1)) & 0xff;
      } else if (filterType === 4) {
        recon = (filt + paethPredictor(a, b, c)) & 0xff;
      } else if (filterType !== 0) {
        throw new Error(`Unsupported PNG scanline filter type: ${filterType}`);
      }
      unfiltered[dstStart + x] = recon;
    }
  }

  const rgba = new Uint8Array(width * height * 4);
  if (bpp === 4) {
    rgba.set(unfiltered);
  } else {
    for (let i = 0, j = 0; i < unfiltered.length; i += 3, j += 4) {
      rgba[j] = unfiltered[i];
      rgba[j + 1] = unfiltered[i + 1];
      rgba[j + 2] = unfiltered[i + 2];
      rgba[j + 3] = 255;
    }
  }

  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  return { width, height, rgba, sha256 };
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makePngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

export function encodeRgbaPng(width: number, height: number, rgba: Uint8Array): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter None
    raw.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 6 });

  return Buffer.concat([
    PNG_SIGNATURE,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', idat),
    makePngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Checks whether a decoded PNG has meaningful visual variance (not a single flat color frame).
 */
export function computeVisualVarianceRatio(decoded: DecodedPng): number {
  const { rgba, width, height } = decoded;
  const totalPixels = width * height;
  if (totalPixels <= 1) return 0;

  const r0 = rgba[0];
  const g0 = rgba[1];
  const b0 = rgba[2];
  let nonMatching = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    if (
      Math.abs(rgba[i] - r0) > 8 ||
      Math.abs(rgba[i + 1] - g0) > 8 ||
      Math.abs(rgba[i + 2] - b0) > 8
    ) {
      nonMatching++;
    }
  }
  return nonMatching / totalPixels;
}

function pixelsMatchWithinTolerance(
  rgbaA: Uint8Array,
  idxA: number,
  rgbaB: Uint8Array,
  idxB: number,
  tol: number
): boolean {
  return (
    Math.abs(rgbaA[idxA] - rgbaB[idxB]) <= tol &&
    Math.abs(rgbaA[idxA + 1] - rgbaB[idxB + 1]) <= tol &&
    Math.abs(rgbaA[idxA + 2] - rgbaB[idxB + 2]) <= tol &&
    Math.abs(rgbaA[idxA + 3] - rgbaB[idxB + 3]) <= tol
  );
}

function hasMatchingPixelInNeighborhood(
  srcRgba: Uint8Array,
  srcIdx: number,
  target: DecodedPng,
  x: number,
  y: number,
  radius: number,
  tol: number
): boolean {
  const minY = Math.max(0, y - radius);
  const maxY = Math.min(target.height - 1, y + radius);
  const minX = Math.max(0, x - radius);
  const maxX = Math.min(target.width - 1, x + radius);
  for (let ny = minY; ny <= maxY; ny++) {
    const rowOffset = ny * target.width;
    for (let nx = minX; nx <= maxX; nx++) {
      if (nx === x && ny === y) continue;
      if (pixelsMatchWithinTolerance(srcRgba, srcIdx, target.rgba, (rowOffset + nx) * 4, tol)) {
        return true;
      }
    }
  }
  return false;
}

function lumaAt(rgba: Uint8Array, idx: number): number {
  return rgba[idx] * 0.299 + rgba[idx + 1] * 0.587 + rgba[idx + 2] * 0.114;
}

function hasManySiblings(img: DecodedPng, x: number, y: number): boolean {
  const minX = Math.max(0, x - 1);
  const maxX = Math.min(img.width - 1, x + 1);
  const minY = Math.max(0, y - 1);
  const maxY = Math.min(img.height - 1, y + 1);
  const centerIdx = (y * img.width + x) * 4;
  let zeroes = x === minX || x === maxX || y === minY || y === maxY ? 1 : 0;

  for (let ny = minY; ny <= maxY; ny++) {
    for (let nx = minX; nx <= maxX; nx++) {
      if (nx === x && ny === y) continue;
      const idx = (ny * img.width + nx) * 4;
      if (
        img.rgba[idx] === img.rgba[centerIdx] &&
        img.rgba[idx + 1] === img.rgba[centerIdx + 1] &&
        img.rgba[idx + 2] === img.rgba[centerIdx + 2] &&
        img.rgba[idx + 3] === img.rgba[centerIdx + 3]
      ) {
        zeroes++;
        if (zeroes > 2) return true;
      }
    }
  }
  return false;
}

/**
 * Detects anti-aliased edge pixels (Vysniauskas 2009 / pixelmatch heuristic):
 * returns true if (x, y) sits on a 1px high-contrast glyph/stroke edge in imgA
 * whose darkest or brightest 3x3 neighbor is part of a solid region in both images.
 */
function isAntialiasedEdgePixel(imgA: DecodedPng, x: number, y: number, imgB: DecodedPng): boolean {
  const minX = Math.max(0, x - 1);
  const maxX = Math.min(imgA.width - 1, x + 1);
  const minY = Math.max(0, y - 1);
  const maxY = Math.min(imgA.height - 1, y + 1);
  const centerIdx = (y * imgA.width + x) * 4;
  const centerLuma = lumaAt(imgA.rgba, centerIdx);

  let zeroes = x === minX || x === maxX || y === minY || y === maxY ? 1 : 0;
  let minDelta = 0;
  let maxDelta = 0;
  let minXPos = x;
  let minYPos = y;
  let maxXPos = x;
  let maxYPos = y;

  for (let ny = minY; ny <= maxY; ny++) {
    for (let nx = minX; nx <= maxX; nx++) {
      if (nx === x && ny === y) continue;
      const idx = (ny * imgA.width + nx) * 4;
      const delta = lumaAt(imgA.rgba, idx) - centerLuma;
      if (Math.abs(delta) < 1) {
        zeroes++;
        if (zeroes > 2) return false;
      } else if (delta < minDelta) {
        minDelta = delta;
        minXPos = nx;
        minYPos = ny;
      } else if (delta > maxDelta) {
        maxDelta = delta;
        maxXPos = nx;
        maxYPos = ny;
      }
    }
  }

  if (minDelta === 0 || maxDelta === 0) return false;

  const minInBoundsB = minXPos < imgB.width && minYPos < imgB.height;
  const maxInBoundsB = maxXPos < imgB.width && maxYPos < imgB.height;

  return (
    (minInBoundsB &&
      hasManySiblings(imgA, minXPos, minYPos) &&
      hasManySiblings(imgB, minXPos, minYPos)) ||
    (maxInBoundsB &&
      hasManySiblings(imgA, maxXPos, maxYPos) &&
      hasManySiblings(imgB, maxXPos, maxYPos))
  );
}

/**
 * Compares two PNG screenshot buffers pixel-by-pixel and returns a diff PNG highlighting
 * changed pixels in high-contrast magenta whenever differences exist.
 */
export function comparePngScreenshots(
  actualBuffer: Buffer,
  baselineBuffer: Buffer,
  options: VisualDiffOptions = {}
): VisualDiffResult {
  const channelTolerance = options.channelTolerance ?? 18;
  const maxDiffPixelRatio = options.maxDiffPixelRatio ?? 0.03;
  const maxDimensionDeltaPx = Math.max(0, options.maxDimensionDeltaPx ?? 0);
  const subpixelShiftRadiusPx = Math.max(0, Math.floor(options.subpixelShiftRadiusPx ?? 0));
  const ignoreAntialiased = options.ignoreAntialiased === true;

  const actual = decodePngBuffer(actualBuffer);
  const baseline = decodePngBuffer(baselineBuffer);
  const widthDelta = Math.abs(actual.width - baseline.width);
  const heightDelta = Math.abs(actual.height - baseline.height);
  const maxWidth = Math.max(actual.width, baseline.width);
  const maxHeight = Math.max(actual.height, baseline.height);
  const totalPixels = maxWidth * maxHeight;

  if (widthDelta > maxDimensionDeltaPx || heightDelta > maxDimensionDeltaPx) {
    return {
      passed: false,
      reason: `Screenshot dimensions changed: actual ${actual.width}x${actual.height} vs baseline ${baseline.width}x${baseline.height}.`,
      width: actual.width,
      height: actual.height,
      baselineWidth: baseline.width,
      baselineHeight: baseline.height,
      totalPixels,
      diffPixels: totalPixels,
      diffRatio: 1,
      actualSha256: actual.sha256,
      baselineSha256: baseline.sha256,
      diffPng: null,
    };
  }

  let diffPixels = 0;
  const diffRgba = new Uint8Array(maxWidth * maxHeight * 4);

  for (let y = 0; y < maxHeight; y++) {
    for (let x = 0; x < maxWidth; x++) {
      const dstIdx = (y * maxWidth + x) * 4;
      const inActual = x < actual.width && y < actual.height;
      const inBaseline = x < baseline.width && y < baseline.height;

      if (!inActual || !inBaseline) {
        diffPixels++;
        diffRgba[dstIdx] = 255;
        diffRgba[dstIdx + 1] = 0;
        diffRgba[dstIdx + 2] = 136;
        diffRgba[dstIdx + 3] = 255;
        continue;
      }

      const aIdx = (y * actual.width + x) * 4;
      const bIdx = (y * baseline.width + x) * 4;
      let isDifferent = !pixelsMatchWithinTolerance(
        actual.rgba,
        aIdx,
        baseline.rgba,
        bIdx,
        channelTolerance
      );

      if (isDifferent && subpixelShiftRadiusPx > 0) {
        const shiftedMatch =
          hasMatchingPixelInNeighborhood(
            actual.rgba,
            aIdx,
            baseline,
            x,
            y,
            subpixelShiftRadiusPx,
            channelTolerance
          ) &&
          hasMatchingPixelInNeighborhood(
            baseline.rgba,
            bIdx,
            actual,
            x,
            y,
            subpixelShiftRadiusPx,
            channelTolerance
          );
        if (shiftedMatch) {
          isDifferent = false;
        }
      }

      if (isDifferent && ignoreAntialiased) {
        if (
          isAntialiasedEdgePixel(actual, x, y, baseline) ||
          isAntialiasedEdgePixel(baseline, x, y, actual)
        ) {
          isDifferent = false;
        }
      }

      if (isDifferent) {
        diffPixels++;
        diffRgba[dstIdx] = 255;
        diffRgba[dstIdx + 1] = 0;
        diffRgba[dstIdx + 2] = 136;
        diffRgba[dstIdx + 3] = 255;
      } else {
        const luma = Math.round(
          (actual.rgba[aIdx] * 0.299 +
            actual.rgba[aIdx + 1] * 0.587 +
            actual.rgba[aIdx + 2] * 0.114) *
            0.45
        );
        diffRgba[dstIdx] = luma;
        diffRgba[dstIdx + 1] = luma;
        diffRgba[dstIdx + 2] = luma;
        diffRgba[dstIdx + 3] = 255;
      }
    }
  }

  const diffRatio = totalPixels > 0 ? diffPixels / totalPixels : 0;
  const passed = diffRatio <= maxDiffPixelRatio;
  const diffPng = diffPixels > 0 ? encodeRgbaPng(maxWidth, maxHeight, diffRgba) : null;

  return {
    passed,
    reason: passed
      ? null
      : `Visual diff ratio ${(diffRatio * 100).toFixed(2)}% exceeded maxDiffPixelRatio ${(maxDiffPixelRatio * 100).toFixed(2)}% (${diffPixels}/${totalPixels} pixels).`,
    width: actual.width,
    height: actual.height,
    baselineWidth: baseline.width,
    baselineHeight: baseline.height,
    totalPixels,
    diffPixels,
    diffRatio,
    actualSha256: actual.sha256,
    baselineSha256: baseline.sha256,
    diffPng,
  };
}
