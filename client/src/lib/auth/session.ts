export type SessionUser = {
  id: string;
  role: "patient" | "hospital" | "insurer" | "corporate" | "admin";
  email: string;
  name?: string;
  token?: string;
};

export type Session = {
  user: SessionUser | null;
};

const ACCESS_TOKEN_KEY = "insurelink_access_token";
const REFRESH_TOKEN_KEY = "insurelink_refresh_token";
const SESSION_USER_KEY = "insurelink_session_user";
const AUTH_COOKIE_KEY = "auth_token";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function safeParseSessionUser(raw: string | null): SessionUser | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function getInitialSession(): Session {
  return {
    user: getSessionUser(),
  };
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  // Keep middleware behavior consistent during mock mode.
  document.cookie = `${AUTH_COOKIE_KEY}=${accessToken}; path=/; max-age=86400`;
}

export function getAccessToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearTokens(): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  document.cookie = `${AUTH_COOKIE_KEY}=; path=/; max-age=0`;
}

export function setSessionUser(user: SessionUser): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function getSessionUser(): SessionUser | null {
  if (!isBrowser()) {
    return null;
  }

  return safeParseSessionUser(localStorage.getItem(SESSION_USER_KEY));
}

export function clearSessionUser(): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(SESSION_USER_KEY);
}








