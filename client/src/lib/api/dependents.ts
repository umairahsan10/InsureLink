import { apiFetch } from "./client";

export interface Dependent {
  id: string;
  employeeId: string;
  corporateId: string;
  firstName: string;
  lastName: string;
  relationship: string;
  dateOfBirth: string;
  gender: string;
  cnic?: string;
  phoneNumber?: string;
  status: string;
  requestDate: string;
  reviewedDate?: string;
  rejectionReason?: string;
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

export const dependentsApi = {
  async list(query: ListDependentsQuery = {}): Promise<PaginatedDependents> {
    const params = new URLSearchParams();
    if (query.page) params.append("page", String(query.page));
    if (query.limit) params.append("limit", String(query.limit));
    if (query.employeeId) params.append("employeeId", query.employeeId);
    if (query.status) params.append("status", query.status);
    if (query.corporateId) params.append("corporateId", query.corporateId);

    const qs = params.toString();
    const res = await apiFetch<PaginatedDependents>(`${BASE}${qs ? `?${qs}` : ""}`);
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

  async reject(dependentId: string, rejectionReason: string): Promise<Dependent> {
    const res = await apiFetch<Dependent>(`${BASE}/${dependentId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ rejectionReason }),
    });
    return res.data;
  },
};
