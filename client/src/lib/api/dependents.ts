import { apiFetch } from "./client";
import type { Relationship, Gender, DependentStatus } from "@/types/dependent";

export interface Dependent {
  id: string;
  employeeId: string;
  employeeName: string;
  corporateId: string;
  name: string;
  relationship: Relationship;
  dateOfBirth: string;
  gender: Gender;
  cnic: string;
  phoneNumber?: string;
  status: DependentStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  documents: string[];
  coverageStartDate: string;
}

export interface PaginatedDependents {
  items: Dependent[];
  total: number;
  page: number;
  limit: number;
}

export interface ListDependentsQuery {
  page?: number;
  limit?: number;
  employeeId?: string;
  status?: string;
  corporateId?: string;
}

const BASE = "/api/v1/dependents";

export interface CreateDependentInput {
  employeeId: string;
  firstName: string;
  lastName: string;
  relationship: string;
  dateOfBirth: string;
  gender: string;
  cnic?: string;
  phoneNumber?: string;
}

export const dependentsApi = {
  async create(data: CreateDependentInput): Promise<Dependent> {
    const res = await apiFetch<Dependent>(`${BASE}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async list(query: ListDependentsQuery = {}): Promise<PaginatedDependents> {
    const params = new URLSearchParams();
    if (query.page) params.append("page", String(query.page));
    if (query.limit) params.append("limit", String(query.limit));
    if (query.employeeId) params.append("employeeId", query.employeeId);
    if (query.status) params.append("status", query.status);
    if (query.corporateId) params.append("corporateId", query.corporateId);

    const qs = params.toString();
    const res = await apiFetch<PaginatedDependents>(
      `${BASE}${qs ? `?${qs}` : ""}`,
    );
    return res.data;
  },

  async getDependentsByEmployeeNumber(
    employeeNumber: string,
  ): Promise<Dependent[]> {
    const res = await apiFetch<Dependent[]>(
      `${BASE}/by-employee/${employeeNumber}`,
    );
    return res.data;
  },

  async approve(dependentId: string): Promise<Dependent> {
    const res = await apiFetch<Dependent>(`${BASE}/${dependentId}/approve`, {
      method: "PATCH",
    });
    return res.data;
  },

  async reject(
    dependentId: string,
    rejectionReason: string,
  ): Promise<Dependent> {
    const res = await apiFetch<Dependent>(`${BASE}/${dependentId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ rejectionReason }),
    });
    return res.data;
  },

  async checkCnicAvailability(cnic: string): Promise<{ available: boolean }> {
    const res = await apiFetch<{ available: boolean }>(
      `${BASE}/check-cnic/${cnic}`,
    );
    return res.data;
  },
};
