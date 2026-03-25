import { apiFetch } from "./client";

export interface DashboardStats {
  totalClaims?: number;
  pendingClaims?: number;
  approvedClaims?: number;
  rejectedClaims?: number;
  totalPayout?: number;
  activeHospitals?: number;
  activePolicies?: number;
  claimsProcessed?: number;
  approvalRate?: number;
  averageProcessingTime?: number;
}

export interface ClaimsAnalytics {
  date: string;
  count: number;
  amount: number;
}

export const analyticsApi = {
  getDashboardStats: async () => {
    const response = await apiFetch<DashboardStats>('/api/analytics/dashboard');
    return response.data;
  },

  getClaimsAnalytics: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiFetch<ClaimsAnalytics[]>(`/api/analytics/claims?${params.toString()}`);
    return response.data;
  },
};
