"use client";
import React, { createContext, useCallback, useMemo, useState } from "react";
import { Session, SessionUser, getInitialSession } from "@/lib/auth/session";

export type AuthContextValue = Session & {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(getInitialSession());

  const signIn = useCallback(async (email: string, password: string) => {
    // password parameter reserved for future backend integration
    void password;
    // Placeholder: integrate with backend auth later
    const mockUser: SessionUser = {
      id: "u_1",
      role: "patient",
      email,
      name: "Demo User",
    };
    setSession({ user: mockUser });
  }, []);

  const signOut = useCallback(async () => {
    setSession({ user: null });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ ...session, signIn, signOut }), [session, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}




