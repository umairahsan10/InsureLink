import { SessionUser } from "@/lib/auth/session";

export type AuthRole = SessionUser["role"];

export type AuthSignInInput = {
  email: string;
  password: string;
  role?: AuthRole;
};

export type AuthSignInResult = {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
};

export interface AuthAdapter {
  mode: "mock" | "real";
  signIn(input: AuthSignInInput): Promise<AuthSignInResult>;
  signOut(): Promise<void>;
}
