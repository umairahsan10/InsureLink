import { apiFetch } from "./client";

// ── Types ────────────────────────────────────────────────────────────────

export interface Insurer {
  id: string;
  userId: string;
  companyName: string;
  licenseNumber: string;
  address: string;
  city: string;
  province: string;
  maxCoverageLimit: number;
  networkHospitalCount: number;
  corporateClientCount: number;
  status: string;
  operatingSince: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  plans?: Plan[];
  labs?: Lab[];
}

export interface CreateInsurerRequest {
  companyName: string;
  licenseNumber: string;
  address: string;
  city: string;
  province: string;
  maxCoverageLimit: number;
  operatingSince: string;
  networkHospitalCount?: number;
  corporateClientCount?: number;
  status?: string;
  isActive?: boolean;
}

export interface UpdateInsurerRequest {
  companyName?: string;
  licenseNumber?: string;
  address?: string;
  city?: string;
  province?: string;
  maxCoverageLimit?: number;
  networkHospitalCount?: number;
  corporateClientCount?: number;
  status?: string;
  operatingSince?: string;
  isActive?: boolean;
}

export interface Plan {
  id: string;
  insurerId: string;
  planName: string;
  planCode: string;
  sumInsured: number;
  coveredServices: unknown;
  serviceLimits: unknown;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanRequest {
  planName: string;
  planCode: string;
  sumInsured: number;
  coveredServices: unknown;
  serviceLimits: unknown;
  isActive?: boolean;
}

export interface UpdatePlanRequest {
  planName?: string;
  sumInsured?: number;
  coveredServices?: unknown;
  serviceLimits?: unknown;
  isActive?: boolean;
}

export interface Lab {
  id: string;
  insurerId: string;
  labName: string;
  city: string;
  address: string;
  licenseNumber: string;
  contactPhone: string;
  contactEmail: string;
  testCategories: unknown;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabRequest {
  labName: string;
  city: string;
  address: string;
  licenseNumber: string;
  contactPhone: string;
  contactEmail: string;
  testCategories: unknown;
  isActive?: boolean;
}

export interface UpdateLabRequest {
  labName?: string;
  city?: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
  testCategories?: unknown;
  isActive?: boolean;
}

// ── API ──────────────────────────────────────────────────────────────────

const BASE = "/api/v1/insurers";

export const insurersApi = {
  // ── Insurer CRUD ─────────────────────────────────────────────────────

  async createInsurer(data: CreateInsurerRequest): Promise<Insurer> {
    const res = await apiFetch<Insurer>(BASE, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async getInsurers(params?: {
    page?: number;
    limit?: number;
    city?: string;
    status?: string;
    sortBy?: string;
    order?: "asc" | "desc";
  }): Promise<Insurer[]> {
    const q = new URLSearchParams();
    if (params?.page) q.append("page", String(params.page));
    if (params?.limit) q.append("limit", String(params.limit));
    if (params?.city) q.append("city", params.city);
    if (params?.status) q.append("status", params.status);
    if (params?.sortBy) q.append("sortBy", params.sortBy);
    if (params?.order) q.append("order", params.order);
    const qs = q.toString();
    const res = await apiFetch<Insurer[]>(`${BASE}${qs ? `?${qs}` : ""}`);
    return res.data;
  },

  async getInsurerById(id: string): Promise<Insurer> {
    const res = await apiFetch<Insurer>(`${BASE}/${id}`);
    return res.data;
  },

  async updateInsurer(id: string, data: UpdateInsurerRequest): Promise<Insurer> {
    const res = await apiFetch<Insurer>(`${BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  // ── Plans ────────────────────────────────────────────────────────────

  async createPlan(insurerId: string, data: CreatePlanRequest): Promise<Plan> {
    const res = await apiFetch<Plan>(`${BASE}/${insurerId}/plans`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async getPlans(insurerId: string, isActive?: boolean): Promise<Plan[]> {
    const q = new URLSearchParams();
    if (isActive !== undefined) q.append("isActive", String(isActive));
    const qs = q.toString();
    const res = await apiFetch<Plan[]>(
      `${BASE}/${insurerId}/plans${qs ? `?${qs}` : ""}`
    );
    return res.data;
  },

  async updatePlan(planId: string, data: UpdatePlanRequest): Promise<Plan> {
    const res = await apiFetch<Plan>(`${BASE}/plans/${planId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deletePlan(planId: string): Promise<void> {
    await apiFetch<void>(`${BASE}/plans/${planId}`, { method: "DELETE" });
  },

  // ── Labs ─────────────────────────────────────────────────────────────

  async createLab(insurerId: string, data: CreateLabRequest): Promise<Lab> {
    const res = await apiFetch<Lab>(`${BASE}/${insurerId}/labs`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async getLabs(insurerId: string, isActive?: boolean): Promise<Lab[]> {
    const q = new URLSearchParams();
    if (isActive !== undefined) q.append("isActive", String(isActive));
    const qs = q.toString();
    const res = await apiFetch<Lab[]>(
      `${BASE}/${insurerId}/labs${qs ? `?${qs}` : ""}`
    );
    return res.data;
  },

  async getLabById(labId: string): Promise<Lab> {
    const res = await apiFetch<Lab>(`${BASE}/labs/${labId}`);
    return res.data;
  },

  async updateLab(labId: string, data: UpdateLabRequest): Promise<Lab> {
    const res = await apiFetch<Lab>(`${BASE}/labs/${labId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteLab(labId: string): Promise<void> {
    await apiFetch<void>(`${BASE}/labs/${labId}`, { method: "DELETE" });
  },
};
