/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, basicGoogleAuthProvider, googleAuthProvider } from '../lib/firebase';
import type { ServerSessionInfo } from '../game/adminModeration';

export interface GoogleSignInOptions {
  includeGmailScopes?: boolean;
}

interface AuthContextValue {
  user: User | null;
  idToken: string | null;
  serverSession: ServerSessionInfo | null;
  workspaceAccessToken: string | null;
  needsWorkspaceAuth: boolean;
  loading: boolean;
  isSigningIn: boolean;
  authError: string | null;
  clearAuthError: () => void;
  clearWorkspaceAccessToken: () => void;
  signInWithGoogle: (
    options?: GoogleSignInOptions
  ) => Promise<{ user: User; accessToken: string | null } | null>;
  logout: () => Promise<void>;
  getFreshIdToken: () => Promise<string | null>;
  refreshServerSession: () => Promise<ServerSessionInfo | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function exchangeIdTokenForServerSession(idToken: string): Promise<ServerSessionInfo | null> {
  try {
    const res = await fetch('/api/auth/firebase-exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      credentials: 'same-origin',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      ok?: boolean;
      authenticated?: boolean;
      session?: ServerSessionInfo | null;
    };
    return data.ok && data.authenticated ? (data.session ?? null) : null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [serverSession, setServerSession] = useState<ServerSessionInfo | null>(null);
  const [workspaceAccessToken, setWorkspaceAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const idTokenRef = useRef<string | null>(null);
  const workspaceTokenRef = useRef<string | null>(null);
  const isSigningInRef = useRef<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          const token = await nextUser.getIdToken();
          idTokenRef.current = token;
          setIdToken(token);
          const exchanged = await exchangeIdTokenForServerSession(token);
          setServerSession(exchanged);
        } catch (err) {
          console.error('Failed to retrieve auth token:', err);
          idTokenRef.current = null;
          setIdToken(null);
          setServerSession(null);
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
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(
    async (
      options?: GoogleSignInOptions
    ): Promise<{
      user: User;
      accessToken: string | null;
    } | null> => {
      setAuthError(null);
      isSigningInRef.current = true;
      setIsSigningIn(true);
      try {
        const provider = options?.includeGmailScopes ? googleAuthProvider : basicGoogleAuthProvider;
        const result = await signInWithPopup(auth, provider);
        const token = await result.user.getIdToken();
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const oauthAccessToken = options?.includeGmailScopes
          ? (credential?.accessToken ?? null)
          : workspaceTokenRef.current;

        idTokenRef.current = token;
        workspaceTokenRef.current = oauthAccessToken;
        setIdToken(token);
        setWorkspaceAccessToken(oauthAccessToken);
        setUser(result.user);

        const exchanged = await exchangeIdTokenForServerSession(token);
        setServerSession(exchanged);

        return { user: result.user, accessToken: oauthAccessToken };
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Google sign-in was cancelled or blocked by your browser.';
        setAuthError(message);
        return null;
      } finally {
        isSigningInRef.current = false;
        setIsSigningIn(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setAuthError(null);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(
        () => {}
      );
      await signOut(auth);
      idTokenRef.current = null;
      workspaceTokenRef.current = null;
      setIdToken(null);
      setWorkspaceAccessToken(null);
      setServerSession(null);
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign out right now.';
      setAuthError(message);
    }
  }, []);

  const clearWorkspaceAccessToken = useCallback(() => {
    workspaceTokenRef.current = null;
    setWorkspaceAccessToken(null);
  }, []);

  const getFreshIdToken = useCallback(async (): Promise<string | null> => {
    if (!auth.currentUser) {
      idTokenRef.current = null;
      setIdToken(null);
      return null;
    }
    try {
      const token = await auth.currentUser.getIdToken();
      idTokenRef.current = token;
      setIdToken(token);
      return token;
    } catch {
      return idTokenRef.current;
    }
  }, []);

  const refreshServerSession = useCallback(async (): Promise<ServerSessionInfo | null> => {
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        const exchanged = await exchangeIdTokenForServerSession(token);
        if (exchanged) {
          setServerSession(exchanged);
          return exchanged;
        }
      }
      const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        authenticated?: boolean;
        session?: ServerSessionInfo | null;
      };
      const sess = data.authenticated ? (data.session ?? null) : null;
      setServerSession(sess);
      return sess;
    } catch {
      return null;
    }
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

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
        authError,
        clearAuthError,
        clearWorkspaceAccessToken,
        signInWithGoogle,
        logout,
        getFreshIdToken,
        refreshServerSession,
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
