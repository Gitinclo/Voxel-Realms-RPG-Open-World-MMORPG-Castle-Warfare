/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

export function encodeWsTextFrame(jsonText: string): Buffer {
  const payload = Buffer.from(jsonText, 'utf8');
  const len = payload.byteLength;
  if (len < 126) {
    const header = Buffer.from([0x81, len]);
    return Buffer.concat([header, payload]);
  }
  if (len < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
    return Buffer.concat([header, payload]);
  }
  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(len), 2);
  return Buffer.concat([header, payload]);
}

export function encodeWsCloseFrame(code: number, reason: string = ''): Buffer {
  const reasonBuf = Buffer.from(reason.slice(0, 64), 'utf8');
  const payload = Buffer.alloc(2 + reasonBuf.length);
  payload.writeUInt16BE(code, 0);
  reasonBuf.copy(payload, 2);
  return Buffer.concat([Buffer.from([0x88, payload.length]), payload]);
}
