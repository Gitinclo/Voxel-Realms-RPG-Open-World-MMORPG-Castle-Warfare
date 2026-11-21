/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request } from 'express';

export interface ContentSecurityPolicyOptions {
  isProduction: boolean;
  allowPreviewIframe?: boolean;
  extraConnectSrc?: string[];
}

/**
 * Builds environment-appropriate Content-Security-Policy header values.
 * Production mode strictly removes `'unsafe-eval'` from `script-src` and tightens `frame-ancestors`
 * unless preview iframe embedding is explicitly opted in via `ALLOW_PREVIEW_IFRAME=true`.
 */
export function buildContentSecurityPolicy(options: ContentSecurityPolicyOptions): string {
  const scriptSrc = options.isProduction
    ? "script-src 'self' https://apis.google.com https://www.gstatic.com"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com";

  const connectTokens = ["'self'", 'ws:', 'wss:', 'https:'];
  if (options.extraConnectSrc && options.extraConnectSrc.length > 0) {
    for (const token of options.extraConnectSrc) {
      const clean = token.trim();
      if (clean && !connectTokens.includes(clean)) {
        connectTokens.push(clean);
      }
    }
  }

  const frameAncestors =
    options.isProduction && !options.allowPreviewIframe
      ? "frame-ancestors 'self'"
      : "frame-ancestors 'self' https://*.google.com https://*.googleusercontent.com https://aistudio.google.com";

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    `connect-src ${connectTokens.join(' ')}`,
    "worker-src 'self' blob:",
    "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
    frameAncestors,
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ');
}

/**
 * Resolves Express `trust proxy` configuration from `VOXEL_TRUST_PROXY`.
 * Supports:
 * - `'false'` / `'0'` -> `false` (no proxy headers trusted)
 * - `'loopback'` / `'linklocal'` / `'uniquelocal'` -> Express built-in subnet name
 * - Positive integer string (e.g. `'1'`, `'2'`) -> hop count
 * - Comma-separated CIDRs/IPs (e.g. `'127.0.0.1,10.0.0.0/8'`) -> string[]
 * Defaults to `'loopback'` when unset so untrusted public proxies cannot spoof X-Forwarded-For,
 * while local reverse proxies (Nginx/Cloud Run sidecars on loopback) continue to work.
 */
export function resolveTrustProxySetting(
  rawValue: string | undefined
): boolean | number | string | string[] {
  const trimmed = (rawValue ?? '').trim();
  if (!trimmed) {
    return 'loopback';
  }
  const lower = trimmed.toLowerCase();
  if (lower === 'false' || lower === '0' || lower === 'none') {
    return false;
  }
  if (lower === 'loopback' || lower === 'linklocal' || lower === 'uniquelocal') {
    return lower;
  }
  if (/^\d+$/.test(trimmed)) {
    const hops = Number.parseInt(trimmed, 10);
    return hops > 0 ? Math.min(hops, 8) : false;
  }
  const parts = trimmed
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length === 1 ? parts[0] : parts;
}

export function isTrustProxyEnabled(setting: boolean | number | string | string[]): boolean {
  return setting !== false && setting !== 0;
}

export function isHttpsRequest(req: Request): boolean {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protoStr = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  return Boolean(req.secure || protoStr?.split(',')[0]?.trim().toLowerCase() === 'https');
}
