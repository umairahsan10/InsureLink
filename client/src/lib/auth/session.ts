export type SessionUser = {
  id: string;
  role: "patient" | "hospital" | "insurer" | "corporate" | "admin";
  email: string;
  name?: string;
  token?: string;
  hospitalId?: string;
  insurerId?: string;
  corporateId?: string;
};

export type Session = {
  user: SessionUser | null;
};

const SESSION_KEY = "insurelink_session";
const TOKEN_KEY = "insurelink_access_token";
const REFRESH_TOKEN_KEY = "insurelink_refresh_token";

export function getInitialSession(): Session {
  if (typeof window === "undefined") return { user: null };
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore parse errors
  }
  return { user: null };
}

export function persistSession(session: Session): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}








