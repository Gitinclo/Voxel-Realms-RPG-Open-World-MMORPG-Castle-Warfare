/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ClassifiedAuthError {
  code: string;
  userMessage: string;
  retryable: boolean;
  requiresReauth: boolean;
}

/** Proactive token refresh lead time (5 minutes before JWT `exp`). */
export const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

const FIREBASE_ERROR_MAP: Record<string, Omit<ClassifiedAuthError, 'code'>> = {
  'auth/popup-closed-by-user': {
    userMessage: 'Google sign-in popup was closed before completion. Try signing in again.',
    retryable: true,
    requiresReauth: false,
  },
  'auth/cancelled-popup-request': {
    userMessage: 'A previous sign-in window was cancelled. Please try again.',
    retryable: true,
    requiresReauth: false,
  },
  'auth/popup-blocked': {
    userMessage:
      'Your browser blocked the Google sign-in popup. Allow popups for this site and retry.',
    retryable: true,
    requiresReauth: false,
  },
  'auth/network-request-failed': {
    userMessage:
      'Network error while contacting authentication servers. Check your connection and retry.',
    retryable: true,
    requiresReauth: false,
  },
  'auth/too-many-requests': {
    userMessage:
      'Too many authentication attempts in a short period. Wait a moment before trying again.',
    retryable: true,
    requiresReauth: false,
  },
  'auth/user-disabled': {
    userMessage: 'This account has been disabled. Contact support if you believe this is an error.',
    retryable: false,
    requiresReauth: true,
  },
  'auth/user-token-expired': {
    userMessage: 'Your sign-in session expired. Please sign in with Google again.',
    retryable: false,
    requiresReauth: true,
  },
  'auth/invalid-user-token': {
    userMessage: 'Your authentication credentials are no longer valid. Please sign in again.',
    retryable: false,
    requiresReauth: true,
  },
  'auth/requires-recent-login': {
    userMessage: 'Please sign in again to verify your identity for this action.',
    retryable: false,
    requiresReauth: true,
  },
  'auth/unauthorized-domain': {
    userMessage: 'This domain is not authorized for Google Sign-In in the Firebase configuration.',
    retryable: false,
    requiresReauth: false,
  },
};

export function extractAuthErrorCode(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err && typeof err.code === 'string') {
    return err.code;
  }
  if (err instanceof Error) {
    const match = err.message.match(/\(?(auth\/[a-z0-9-]+)\)?/i);
    if (match) return match[1].toLowerCase();
  }
  return 'auth/unknown';
}

export function classifyFirebaseAuthError(err: unknown): ClassifiedAuthError {
  const code = extractAuthErrorCode(err);
  const mapped = FIREBASE_ERROR_MAP[code];
  if (mapped) {
    return { code, ...mapped };
  }
  const rawMessage = err instanceof Error && err.message ? err.message.trim() : '';
  return {
    code,
    userMessage: rawMessage || 'Authentication failed unexpectedly. Please try again.',
    retryable: true,
    requiresReauth: false,
  };
}

function decodeBase64UrlToUtf8(segment: string): string {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLen);
  if (typeof atob === 'function') {
    return atob(padded);
  }
  return Buffer.from(padded, 'base64').toString('utf8');
}

/**
 * Extracts JWT `exp` claim in milliseconds since epoch, or null if token is missing/malformed.
 */
export function parseJwtExpiryMs(token: string | null | undefined): number | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const payload = JSON.parse(decodeBase64UrlToUtf8(parts[1])) as { exp?: unknown };
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
      return null;
    }
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

/**
 * Returns true if the token is missing, unparseable, expired, or within `bufferMs` of expiring.
 */
export function isTokenExpiringSoon(
  token: string | null | undefined,
  nowMs: number = Date.now(),
  bufferMs: number = TOKEN_REFRESH_BUFFER_MS
): boolean {
  const expMs = parseJwtExpiryMs(token);
  if (expMs === null) return true;
  return expMs - nowMs <= bufferMs;
}

export function isTransientAuthStatus(status: number): boolean {
  return status === 408 || status === 429 || status === 502 || status === 503 || status === 504;
}
