import { AuthAdapter } from "@/lib/auth/adapter";
import { MockAuthAdapter } from "@/lib/auth/mockAuthAdapter";

const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE === "real" ? "real" : "mock";

class RealAuthAdapterPlaceholder implements AuthAdapter {
  mode: "real" = "real";

  async signIn(): Promise<never> {
    throw new Error("Real auth adapter is not wired yet. Use NEXT_PUBLIC_AUTH_MODE=mock for now.");
  }

  async signOut(): Promise<void> {
    return;
  }
}

export function createAuthAdapter(): AuthAdapter {
  if (AUTH_MODE === "real") {
    return new RealAuthAdapterPlaceholder();
  }

  return new MockAuthAdapter();
}
