"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Session,
  SessionUser,
  getInitialSession,
  persistSession,
  clearSession,
  setTokens,
  getAccessToken,
} from "@/lib/auth/session";
import { authApi, type RegisterRequest } from "@/lib/api/auth";

export type AuthContextValue = Session & {
  signIn: (email: string, password: string) => Promise<SessionUser>;
  signUp: (request: RegisterRequest) => Promise<SessionUser>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Start with null to match server-side rendering (avoid hydration mismatch)
  const [session, setSession] = useState<Session>({ user: null });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from storage only on client mount
  useEffect(() => {
    const initial = getInitialSession();
    if (initial.user) {
      setSession(initial);
    }
    setIsLoading(false);
  }, []);

  // Rehydrate session on mount — verify token is still valid
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = getAccessToken();
    if (token && !session.user) {
      setIsLoading(true);
      authApi
        .getCurrentUser()
        .then((apiUser) => {
          const user: SessionUser = {
            id: apiUser.id,
            role: apiUser.role as SessionUser["role"],
            email: apiUser.email,
            name: [apiUser.firstName, apiUser.lastName]
              .filter(Boolean)
              .join(" "),
            hospitalId: apiUser.hospitalId,
            insurerId: apiUser.insurerId,
            corporateId: apiUser.corporateId,
          };
          const newSession = { user };
          setSession(newSession);
          persistSession(newSession);
        })
        .catch(() => {
          clearSession();
          setSession({ user: null });
        })
        .finally(() => setIsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<SessionUser> => {
      setIsLoading(true);
      try {
        const tokenRes = await authApi.login({ email, password });
        setTokens(tokenRes.access_token, tokenRes.refresh_token);

        // Set auth cookie for middleware
        document.cookie = `auth_token=${tokenRes.access_token}; path=/; max-age=86400`;

        const apiUser = tokenRes.user ?? (await authApi.getCurrentUser());
        const user: SessionUser = {
          id: apiUser.id,
          role: apiUser.role as SessionUser["role"],
          email: apiUser.email,
          name: [apiUser.firstName, apiUser.lastName].filter(Boolean).join(" "),
          hospitalId: apiUser.hospitalId,
          insurerId: apiUser.insurerId,
          corporateId: apiUser.corporateId,
        };
        const newSession = { user };
        setSession(newSession);
        persistSession(newSession);
        return user;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const signUp = useCallback(
    async (request: RegisterRequest): Promise<SessionUser> => {
      setIsLoading(true);
      try {
        const tokenRes = await authApi.register(request);
        setTokens(tokenRes.access_token, tokenRes.refresh_token);

        document.cookie = `auth_token=${tokenRes.access_token}; path=/; max-age=86400`;

        const apiUser = tokenRes.user ?? (await authApi.getCurrentUser());
        const user: SessionUser = {
          id: apiUser.id,
          role: apiUser.role as SessionUser["role"],
          email: apiUser.email,
          name: [apiUser.firstName, apiUser.lastName].filter(Boolean).join(" "),
          hospitalId: apiUser.hospitalId,
          insurerId: apiUser.insurerId,
          corporateId: apiUser.corporateId,
        };
        const newSession = { user };
        setSession(newSession);
        persistSession(newSession);
        return user;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    clearSession();
    document.cookie =
      "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setSession({ user: null });
  }, []);

  const refreshUser = useCallback(async () => {
    const apiUser = await authApi.getCurrentUser();
    const user: SessionUser = {
      id: apiUser.id,
      role: apiUser.role as SessionUser["role"],
      email: apiUser.email,
      name: [apiUser.firstName, apiUser.lastName].filter(Boolean).join(" "),
      hospitalId: apiUser.hospitalId,
      insurerId: apiUser.insurerId,
      corporateId: apiUser.corporateId,
    };
    const newSession = { user };
    setSession(newSession);
    persistSession(newSession);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...session, signIn, signUp, signOut, refreshUser, isLoading }),
    [session, signIn, signUp, signOut, refreshUser, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
