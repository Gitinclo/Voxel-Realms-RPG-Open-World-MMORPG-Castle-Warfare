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
import { auth, googleAuthProvider } from '../lib/firebase';

interface AuthContextValue {
  user: User | null;
  idToken: string | null;
  workspaceAccessToken: string | null;
  needsWorkspaceAuth: boolean;
  loading: boolean;
  isSigningIn: boolean;
  authError: string | null;
  clearAuthError: () => void;
  clearWorkspaceAccessToken: () => void;
  signInWithGoogle: () => Promise<{ user: User; accessToken: string | null } | null>;
  logout: () => Promise<void>;
  getFreshIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
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
        } catch (err) {
          console.error('Failed to retrieve auth token:', err);
          idTokenRef.current = null;
          setIdToken(null);
        }
        if (!workspaceTokenRef.current && !isSigningInRef.current) {
          setWorkspaceAccessToken(null);
        }
      } else {
        idTokenRef.current = null;
        workspaceTokenRef.current = null;
        setIdToken(null);
        setWorkspaceAccessToken(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<{
    user: User;
    accessToken: string | null;
  } | null> => {
    setAuthError(null);
    isSigningInRef.current = true;
    setIsSigningIn(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const oauthAccessToken = credential?.accessToken ?? null;

      idTokenRef.current = token;
      workspaceTokenRef.current = oauthAccessToken;
      setIdToken(token);
      setWorkspaceAccessToken(oauthAccessToken);
      setUser(result.user);

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
  }, []);

  const logout = useCallback(async () => {
    setAuthError(null);
    try {
      await signOut(auth);
      idTokenRef.current = null;
      workspaceTokenRef.current = null;
      setIdToken(null);
      setWorkspaceAccessToken(null);
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

  const clearAuthError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
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
