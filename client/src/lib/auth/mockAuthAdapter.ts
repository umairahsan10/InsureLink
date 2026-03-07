import { AuthAdapter, AuthSignInInput, AuthSignInResult } from "@/lib/auth/adapter";
import { SessionUser } from "@/lib/auth/session";

function buildMockToken(prefix: string): string {
  return `${prefix}_${Date.now()}`;
}

function buildMockUser(input: AuthSignInInput): SessionUser {
  const role = input.role ?? "patient";

  return {
    id: `mock_${role}_1`,
    role,
    email: input.email,
    name: "Demo User",
  };
}

export class MockAuthAdapter implements AuthAdapter {
  mode: "mock" = "mock";

  async signIn(input: AuthSignInInput): Promise<AuthSignInResult> {
    const user = buildMockUser(input);

    return {
      user,
      accessToken: buildMockToken("mock_access"),
      refreshToken: buildMockToken("mock_refresh"),
    };
  }

  async signOut(): Promise<void> {
    return;
  }
}
