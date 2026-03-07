"use client";
import React, { createContext, useCallback, useMemo, useState } from "react";
import { AuthRole } from "@/lib/auth/adapter";
import { createAuthAdapter } from "@/lib/auth/authAdapterFactory";
import {
  Session,
  clearSessionUser,
  clearTokens,
  getInitialSession,
  setSessionUser,
  setTokens,
} from "@/lib/auth/session";

export type AuthContextValue = Session & {
  signIn: (email: string, password: string, role?: AuthRole) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
const authAdapter = createAuthAdapter();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(getInitialSession());

  const signIn = useCallback(async (email: string, password: string, role?: AuthRole) => {
    const result = await authAdapter.signIn({ email, password, role });

    setTokens(result.accessToken, result.refreshToken);
    setSessionUser(result.user);
    setSession({ user: result.user });
  }, []);

  const signOut = useCallback(async () => {
    await authAdapter.signOut();
    clearTokens();
    clearSessionUser();
    setSession({ user: null });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ ...session, signIn, signOut }), [session, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}




