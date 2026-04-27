import { apiFetch } from "./client";

// ---------------------------------------------------------------------------
// Types – Create user
// ---------------------------------------------------------------------------

export interface UserInfo {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone: string;
  dob?: string;
  gender?: "Male" | "Female" | "Other";
  cnic?: string;
  address?: string;
}

export interface HospitalProfile {
  hospitalName: string;
  licenseNumber: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  emergencyPhone: string;
  hospitalType?: "reimbursable" | "non_reimbursable";
  hasEmergencyUnit?: boolean;
  isActive?: boolean;
}

export interface InsurerProfile {
  companyName: string;
  licenseNumber: string;
  address: string;
  city: string;
  province: string;
  maxCoverageLimit: number;
  networkHospitalCount?: number;
  corporateClientCount?: number;
  status?: "Active" | "Inactive" | "Suspended";
  operatingSince: string;
  isActive?: boolean;
}

export interface CorporateProfile {
  name: string;
  address: string;
  city: string;
  province: string;
  employeeCount: number;
  dependentCount?: number;
  insurerId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contractStartDate: string;
  contractEndDate: string;
  status?: "Active" | "Inactive" | "Suspended";
}

export interface CreateUserWithProfilePayload {
  user: UserInfo;
  role: "admin" | "patient" | "corporate" | "hospital" | "insurer";
  hospitalProfile?: HospitalProfile;
  insurerProfile?: InsurerProfile;
  corporateProfile?: CorporateProfile;
}

export interface CreatedUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  role: string;
  profile: object | null;
  createdAt: string;
}

export interface InsurerOption {
  id: string;
  companyName: string;
}

// ---------------------------------------------------------------------------
// Types – List users
// ---------------------------------------------------------------------------

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string;
  userRole: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface PaginatedUsersResponse {
  users: UserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Types – User detail
// ---------------------------------------------------------------------------

export interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string;
  userRole: string;
  dob: string | null;
  gender: string | null;
  cnic: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  hospital?: Record<string, unknown> | null;
  insurer?: Record<string, unknown> | null;
  corporate?: Record<string, unknown> | null;
  employee?: Record<string, unknown> | null;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  cnic?: string;
  address?: string;
  hospitalProfile?: Partial<HospitalProfile>;
  insurerProfile?: Partial<InsurerProfile>;
  corporateProfile?: Partial<CorporateProfile>;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const adminApi = {
  // ── Create ──────────────────────────────────────────────────────────────
  createUserWithProfile: async (
    payload: CreateUserWithProfilePayload,
  ): Promise<CreatedUserResponse> => {
    const res = await apiFetch<CreatedUserResponse>("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  // ── List ────────────────────────────────────────────────────────────────
  getAllUsers: async (
    query: UserListQuery = {},
  ): Promise<PaginatedUsersResponse> => {
    const params = new URLSearchParams();
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    if (query.search) params.set("search", query.search);
    if (query.role) params.set("role", query.role);
    if (query.status) params.set("status", query.status);
    const qs = params.toString();
    const res = await apiFetch<PaginatedUsersResponse>(
      `/api/admin/users${qs ? `?${qs}` : ""}`,
    );
    return res.data;
  },

  // ── Insurers dropdown ──────────────────────────────────────────────────
  getInsurers: async (): Promise<InsurerOption[]> => {
    const res = await apiFetch<InsurerOption[]>("/api/admin/insurers");
    return res.data;
  },

  // ── Get single user ────────────────────────────────────────────────────
  getUserById: async (id: string): Promise<UserDetail> => {
    const res = await apiFetch<UserDetail>(`/api/admin/users/${id}`);
    return res.data;
  },

  // ── Update user ────────────────────────────────────────────────────────
  updateUser: async (
    id: string,
    payload: UpdateUserPayload,
  ): Promise<UserDetail> => {
    const res = await apiFetch<UserDetail>(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  // ── Toggle active ──────────────────────────────────────────────────────
  toggleUserActive: async (
    id: string,
  ): Promise<{ id: string; isActive: boolean }> => {
    const res = await apiFetch<{ id: string; isActive: boolean }>(
      `/api/admin/users/${id}/toggle-active`,
      { method: "PATCH" },
    );
    return res.data;
  },

  // ── Delete user ────────────────────────────────────────────────────────
  deleteUser: async (id: string): Promise<{ message: string }> => {
    const res = await apiFetch<{ message: string }>(
      `/api/admin/users/${id}`,
      { method: "DELETE" },
    );
    return res.data;
  },

  // ── Reset password ─────────────────────────────────────────────────────
  resetPassword: async (
    id: string,
    newPassword: string,
  ): Promise<{ message: string }> => {
    const res = await apiFetch<{ message: string }>(
      `/api/admin/users/${id}/reset-password`,
      { method: "PATCH", body: JSON.stringify({ newPassword }) },
    );
    return res.data;
  },

  // ── Bulk deactivate ────────────────────────────────────────────────────
  bulkDeactivate: async (
    userIds: string[],
  ): Promise<{ count: number }> => {
    const res = await apiFetch<{ count: number }>(
      "/api/admin/users/bulk/deactivate",
      { method: "PATCH", body: JSON.stringify({ userIds }) },
    );
    return res.data;
  },

  // ── Bulk delete ────────────────────────────────────────────────────────
  bulkDelete: async (userIds: string[]): Promise<{ count: number }> => {
    const res = await apiFetch<{ count: number }>(
      "/api/admin/users/bulk/delete",
      { method: "DELETE", body: JSON.stringify({ userIds }) },
    );
    return res.data;
  },
};
