import { apiFetch } from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone: string;
  userRole: "patient" | "hospital" | "insurer" | "corporate";
  dob?: string;
  gender?: string;
  cnic?: string;
  address?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  role: string;
  hospitalId?: string;
  insurerId?: string;
  corporateId?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  user?: AuthUser;
}

export const authApi = {
  async login(request: LoginRequest): Promise<TokenResponse> {
    const response = await apiFetch<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(request),
    });
    return response.data;
  },

  async register(request: RegisterRequest): Promise<TokenResponse> {
    const response = await apiFetch<TokenResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(request),
    });
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await apiFetch<TokenResponse>("/api/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return response.data;
  },

  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiFetch<AuthUser>("/api/auth/me");
    return response.data;
  },
};
