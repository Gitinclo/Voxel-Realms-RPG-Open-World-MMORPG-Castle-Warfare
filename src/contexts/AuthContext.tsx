/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';

interface AuthContextValue {
  user: User | null;
  idToken: string | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;
  getFreshIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          const token = await nextUser.getIdToken();
          tokenRef.current = token;
          setIdToken(token);
        } catch (err) {
          console.error('Failed to retrieve auth token:', err);
          tokenRef.current = null;
          setIdToken(null);
        }
      } else {
        tokenRef.current = null;
        setIdToken(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    setAuthError(null);
    try {
      const credential = await signInWithPopup(auth, googleAuthProvider);
      const token = await credential.user.getIdToken();
      tokenRef.current = token;
      setIdToken(token);
      setUser(credential.user);
      return credential.user;
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Google sign-in was cancelled or blocked by your browser.';
      setAuthError(message);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthError(null);
    try {
      await signOut(auth);
      tokenRef.current = null;
      setIdToken(null);
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign out right now.';
      setAuthError(message);
    }
  }, []);

  const getFreshIdToken = useCallback(async (): Promise<string | null> => {
    if (!auth.currentUser) {
      tokenRef.current = null;
      setIdToken(null);
      return null;
    }
    try {
      const token = await auth.currentUser.getIdToken();
      tokenRef.current = token;
      setIdToken(token);
      return token;
    } catch {
      return tokenRef.current;
    }
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        loading,
        authError,
        clearAuthError,
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
