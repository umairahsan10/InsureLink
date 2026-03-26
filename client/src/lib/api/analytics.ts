import { apiFetch } from './client';
import type {
  Analytics,
  ClaimsByStatus,
  MonthlyTrend,
  HospitalByAmount,
  ClaimsPerCorporate,
} from '@/types/analytics';

export interface ClaimsAnalyticsResponse {
  claimsByStatus: ClaimsByStatus & { OnHold: number; Paid: number };
  monthlyTrends: MonthlyTrend[];
  avgApprovalAmount: number;
  avgProcessingTimeHours: number;
  topHospitalsByAmount: HospitalByAmount[];
  claimsPerCorporate: ClaimsPerCorporate[];
}

export interface CoverageAnalyticsResponse {
  totalEmployees: number;
  activeEmployees: number;
  totalCoverageAmount: number;
  totalUsedAmount: number;
  utilizationRate: number;
  planDistribution: Array<{
    planId: string;
    planName: string;
    employeeCount: number;
    totalCoverage: number;
  }>;
  coverageByDepartment: Array<{
    department: string;
    employeeCount: number;
    totalCoverage: number;
    usedAmount: number;
  }>;
}

export const analyticsApi = {
  async getDashboard(): Promise<Analytics> {
    const response = await apiFetch<Analytics>('/api/v1/analytics/dashboard');
    return response.data;
  },

  async getClaimsAnalytics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ClaimsAnalyticsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    const query = queryParams.toString();
    const path = `/api/v1/analytics/claims${query ? `?${query}` : ''}`;
    const response = await apiFetch<ClaimsAnalyticsResponse>(path);
    return response.data;
  },

  async getCoverageAnalytics(): Promise<CoverageAnalyticsResponse> {
    const response = await apiFetch<CoverageAnalyticsResponse>('/api/v1/analytics/coverage');
    return response.data;
  },
};
