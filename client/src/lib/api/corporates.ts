import { apiFetch } from "./client";

export type CorporateStatus = "Active" | "Inactive" | "Suspended";

export interface Corporate {
  id: string;
  userId: string;
  name: string;
  address: string;
  city: string;
  province: string;
  employeeCount: number;
  dependentCount: number;
  insurerId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contractStartDate: string;
  contractEndDate: string;
  totalAmountUsed: string;
  status: CorporateStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CorporateStats {
  activeEmployees: number;
  activeDependents: number;
  totalCoverageAmount: string;
  usedCoverageAmount: string;
  remainingCoverageAmount: string;
  approvedClaimsCount: number;
  pendingClaimsCount: number;
  rejectedClaimsCount: number;
}

export interface UpdateCorporateRequest {
  name?: string;
  address?: string;
  city?: string;
  province?: string;
  employeeCount?: number;
  insurerId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  status?: CorporateStatus;
}

export const corporatesApi = {
  async getCorporateById(corporateId: string): Promise<Corporate> {
    const response = await apiFetch<Corporate>(`/api/corporates/${corporateId}`);
    return response.data;
  },

  async updateCorporate(
    corporateId: string,
    payload: UpdateCorporateRequest,
  ): Promise<Corporate> {
    const response = await apiFetch<Corporate>(`/api/corporates/${corporateId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  async getCorporateStats(corporateId: string): Promise<CorporateStats> {
    const response = await apiFetch<CorporateStats>(`/api/corporates/${corporateId}/stats`);
    return response.data;
  },
};
