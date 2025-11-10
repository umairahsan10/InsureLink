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

export function getInitialSession(): Session {
  return { user: null };
}








