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
      const dr = Math.abs(actual.rgba[aIdx] - baseline.rgba[bIdx]);
      const dg = Math.abs(actual.rgba[aIdx + 1] - baseline.rgba[bIdx + 1]);
      const db = Math.abs(actual.rgba[aIdx + 2] - baseline.rgba[bIdx + 2]);
      const da = Math.abs(actual.rgba[aIdx + 3] - baseline.rgba[bIdx + 3]);

      if (
        dr > channelTolerance ||
        dg > channelTolerance ||
        db > channelTolerance ||
        da > channelTolerance
      ) {
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
