/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  GoogleAuthProvider,
  User,
  onIdTokenChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, basicGoogleAuthProvider, googleAuthProvider } from '../lib/firebase';
import {
  classifyFirebaseAuthError,
  isTokenExpiringSoon,
  isTransientAuthStatus,
} from '../lib/authUtils';
import type { ServerSessionInfo } from '../game/adminModeration';

export interface GoogleSignInOptions {
  includeGmailScopes?: boolean;
}

interface SessionExchangeResult {
  session: ServerSessionInfo | null;
  error: string | null;
  statusCode: number | null;
}

interface AuthContextValue {
  user: User | null;
  idToken: string | null;
  serverSession: ServerSessionInfo | null;
  workspaceAccessToken: string | null;
  needsWorkspaceAuth: boolean;
  loading: boolean;
  isSigningIn: boolean;
  isRefreshingToken: boolean;
  authError: string | null;
  authErrorCode: string | null;
  clearAuthError: () => void;
  clearWorkspaceAccessToken: () => void;
  signInWithGoogle: (
    options?: GoogleSignInOptions
  ) => Promise<{ user: User; accessToken: string | null } | null>;
  logout: () => Promise<void>;
  getFreshIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  refreshServerSession: (forceTokenRefresh?: boolean) => Promise<ServerSessionInfo | null>;
  authorizedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MAX_EXCHANGE_ATTEMPTS = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function exchangeIdTokenForServerSession(idToken: string): Promise<SessionExchangeResult> {
  let lastError: string | null = null;
  let lastStatus: number | null = null;

  for (let attempt = 1; attempt <= MAX_EXCHANGE_ATTEMPTS; attempt++) {
    try {
      const res = await fetch('/api/auth/firebase-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        credentials: 'same-origin',
      });
      lastStatus = res.status;

      if (!res.ok) {
        const errPayload = (await res.json().catch(() => null)) as { error?: string } | null;
        lastError = errPayload?.error || `Server session exchange rejected (HTTP ${res.status}).`;
        if (isTransientAuthStatus(res.status) && attempt < MAX_EXCHANGE_ATTEMPTS) {
          await sleep(250 * attempt);
          continue;
        }
        return { session: null, error: lastError, statusCode: res.status };
      }

      const data = (await res.json()) as {
        ok?: boolean;
        authenticated?: boolean;
        session?: ServerSessionInfo | null;
        error?: string;
      };
      if (data.ok && data.authenticated && data.session) {
        return { session: data.session, error: null, statusCode: res.status };
      }
      return {
        session: null,
        error: data.error || 'Server session could not be established.',
        statusCode: res.status,
      };
    } catch (err) {
      lastError =
        err instanceof Error && err.message
          ? `Network error during server session sync: ${err.message}`
          : 'Network error while syncing server session.';
      if (attempt < MAX_EXCHANGE_ATTEMPTS) {
        await sleep(250 * attempt);
        continue;
      }
    }
  }

  return { session: null, error: lastError, statusCode: lastStatus };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [serverSession, setServerSession] = useState<ServerSessionInfo | null>(null);
  const [workspaceAccessToken, setWorkspaceAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);

  const idTokenRef = useRef<string | null>(null);
  const workspaceTokenRef = useRef<string | null>(null);
  const isSigningInRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  const inFlightTokenRefreshRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const recordAuthError = useCallback((code: string | null, message: string | null) => {
    if (!mountedRef.current) return;
    setAuthErrorCode(code);
    setAuthError(message);
  }, []);

  const clearAuthError = useCallback(() => {
    recordAuthError(null, null);
  }, [recordAuthError]);

  useEffect(() => {
    let activeSyncSeq = 0;
    const unsubscribe = onIdTokenChanged(auth, async (nextUser) => {
      const syncSeq = ++activeSyncSeq;
      if (!mountedRef.current) return;
      setUser(nextUser);

      if (nextUser) {
        try {
          const token = await nextUser.getIdToken();
          if (!mountedRef.current || syncSeq !== activeSyncSeq) return;
          idTokenRef.current = token;
          setIdToken(token);

          const exchanged = await exchangeIdTokenForServerSession(token);
          if (!mountedRef.current || syncSeq !== activeSyncSeq) return;
          setServerSession(exchanged.session);
          if (!exchanged.session && exchanged.error && exchanged.statusCode === 403) {
            recordAuthError('auth/server-session-denied', exchanged.error);
          }
        } catch (err) {
          if (!mountedRef.current || syncSeq !== activeSyncSeq) return;
          const classified = classifyFirebaseAuthError(err);
          idTokenRef.current = null;
          setIdToken(null);
          setServerSession(null);
          recordAuthError(classified.code, classified.userMessage);
        }
        if (!workspaceTokenRef.current && !isSigningInRef.current) {
          setWorkspaceAccessToken(null);
        }
      } else {
        idTokenRef.current = null;
        workspaceTokenRef.current = null;
        setIdToken(null);
        setWorkspaceAccessToken(null);
        setServerSession(null);
      }

      if (mountedRef.current && syncSeq === activeSyncSeq) {
        setLoading(false);
      }
    });
    return () => {
      activeSyncSeq += 1;
      unsubscribe();
    };
  }, [recordAuthError]);

  const getFreshIdToken = useCallback(
    async (forceRefresh: boolean = false): Promise<string | null> => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        idTokenRef.current = null;
        if (mountedRef.current) setIdToken(null);
        return null;
      }

      const cachedToken = idTokenRef.current;
      const shouldForceRefresh = forceRefresh || isTokenExpiringSoon(cachedToken);
      if (!shouldForceRefresh && cachedToken) {
        return cachedToken;
      }

      // Deduplicate concurrent token refresh calls triggered by parallel API requests.
      if (inFlightTokenRefreshRef.current) {
        return inFlightTokenRefreshRef.current;
      }

      const refreshTask = (async () => {
        if (mountedRef.current) setIsRefreshingToken(true);
        try {
          const token = await currentUser.getIdToken(shouldForceRefresh);
          idTokenRef.current = token;
          if (mountedRef.current) setIdToken(token);
          return token;
        } catch (err) {
          const classified = classifyFirebaseAuthError(err);
          recordAuthError(classified.code, classified.userMessage);
          if (classified.requiresReauth || isTokenExpiringSoon(idTokenRef.current, Date.now(), 0)) {
            idTokenRef.current = null;
            if (mountedRef.current) {
              setIdToken(null);
              setServerSession(null);
            }
            return null;
          }
          // Non-fatal transient network error while existing cached token is still unexpired.
          return idTokenRef.current;
        } finally {
          inFlightTokenRefreshRef.current = null;
          if (mountedRef.current) setIsRefreshingToken(false);
        }
      })();

      inFlightTokenRefreshRef.current = refreshTask;
      return refreshTask;
    },
    [recordAuthError]
  );

  const signInWithGoogle = useCallback(
    async (
      options?: GoogleSignInOptions
    ): Promise<{
      user: User;
      accessToken: string | null;
    } | null> => {
      clearAuthError();
      isSigningInRef.current = true;
      setIsSigningIn(true);
      try {
        const provider = options?.includeGmailScopes ? googleAuthProvider : basicGoogleAuthProvider;
        const result = await signInWithPopup(auth, provider);
        const token = await result.user.getIdToken(true);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const oauthAccessToken = options?.includeGmailScopes
          ? (credential?.accessToken ?? null)
          : workspaceTokenRef.current;

        idTokenRef.current = token;
        workspaceTokenRef.current = oauthAccessToken;
        if (mountedRef.current) {
          setIdToken(token);
          setWorkspaceAccessToken(oauthAccessToken);
          setUser(result.user);
        }

        const exchanged = await exchangeIdTokenForServerSession(token);
        if (mountedRef.current) {
          setServerSession(exchanged.session);
          if (!exchanged.session && exchanged.error) {
            recordAuthError(
              exchanged.statusCode === 403
                ? 'auth/server-session-denied'
                : 'auth/server-session-sync-failed',
              exchanged.error
            );
          }
        }

        return { user: result.user, accessToken: oauthAccessToken };
      } catch (err) {
        const classified = classifyFirebaseAuthError(err);
        recordAuthError(classified.code, classified.userMessage);
        return null;
      } finally {
        isSigningInRef.current = false;
        if (mountedRef.current) setIsSigningIn(false);
      }
    },
    [clearAuthError, recordAuthError]
  );

  const logout = useCallback(async () => {
    clearAuthError();
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(
        () => {}
      );
      await signOut(auth);
      idTokenRef.current = null;
      workspaceTokenRef.current = null;
      if (mountedRef.current) {
        setIdToken(null);
        setWorkspaceAccessToken(null);
        setServerSession(null);
        setUser(null);
      }
    } catch (err) {
      const classified = classifyFirebaseAuthError(err);
      recordAuthError(classified.code, classified.userMessage);
    }
  }, [clearAuthError, recordAuthError]);

  const clearWorkspaceAccessToken = useCallback(() => {
    workspaceTokenRef.current = null;
    setWorkspaceAccessToken(null);
  }, []);

  const refreshServerSession = useCallback(
    async (forceTokenRefresh: boolean = false): Promise<ServerSessionInfo | null> => {
      try {
        if (auth.currentUser) {
          const token = await getFreshIdToken(forceTokenRefresh);
          if (token) {
            const exchanged = await exchangeIdTokenForServerSession(token);
            if (exchanged.session) {
              if (mountedRef.current) setServerSession(exchanged.session);
              return exchanged.session;
            }
            if (exchanged.error && exchanged.statusCode === 403) {
              recordAuthError('auth/server-session-denied', exchanged.error);
              if (mountedRef.current) setServerSession(null);
              return null;
            }
          }
        }
        const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
        if (!res.ok) return null;
        const data = (await res.json()) as {
          authenticated?: boolean;
          session?: ServerSessionInfo | null;
        };
        const sess = data.authenticated ? (data.session ?? null) : null;
        if (mountedRef.current) setServerSession(sess);
        return sess;
      } catch (err) {
        const classified = classifyFirebaseAuthError(err);
        recordAuthError(classified.code, classified.userMessage);
        return null;
      }
    },
    [getFreshIdToken, recordAuthError]
  );

  const authorizedFetch = useCallback(
    async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
      const buildInitWithToken = (token: string | null): RequestInit => {
        const headers = new Headers(init.headers);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        return {
          ...init,
          headers,
          credentials: init.credentials ?? 'same-origin',
        };
      };

      const initialToken = await getFreshIdToken(false);
      const firstResponse = await fetch(input, buildInitWithToken(initialToken));
      if (firstResponse.status !== 401 || !auth.currentUser) {
        return firstResponse;
      }

      // Single automatic recovery on HTTP 401: force-refresh ID token, re-sync server session, retry once.
      const refreshedToken = await getFreshIdToken(true);
      if (!refreshedToken) {
        recordAuthError(
          'auth/user-token-expired',
          'Your authentication session expired. Please sign in again.'
        );
        return firstResponse;
      }

      const exchanged = await exchangeIdTokenForServerSession(refreshedToken);
      if (mountedRef.current && exchanged.session) {
        setServerSession(exchanged.session);
      }

      const retryResponse = await fetch(input, buildInitWithToken(refreshedToken));
      if (retryResponse.status === 401) {
        recordAuthError(
          'auth/session-unauthorized',
          'Your session could not be re-authorized. Please sign in with Google again.'
        );
      }
      return retryResponse;
    },
    [getFreshIdToken, recordAuthError]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        serverSession,
        workspaceAccessToken,
        needsWorkspaceAuth: !workspaceAccessToken,
        loading,
        isSigningIn,
        isRefreshingToken,
        authError,
        authErrorCode,
        clearAuthError,
        clearWorkspaceAccessToken,
        signInWithGoogle,
        logout,
        getFreshIdToken,
        refreshServerSession,
        authorizedFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
