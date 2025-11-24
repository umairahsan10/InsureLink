import { apiFetch } from './client';

export interface Claim {
  id: string;
  claimNumber: string;
  patientName?: string;
  hospital?: string;
  amount?: string | number;
  date?: string;
  status?: string;
  treatment?: string;
  [key: string]: any;
}

export interface ApproveClaimRequest {
  claimId: string;
  notes?: string;
}

export interface RejectClaimRequest {
  claimId: string;
  reason: string;
}

export interface BulkApproveRequest {
  claimIds: string[];
}

export const claimsApi = {
  async getClaim(claimId: string): Promise<Claim> {
    const response = await apiFetch<Claim>(`/api/claims/${claimId}`);
    return response.data;
  },

  async approveClaim(request: ApproveClaimRequest): Promise<void> {
    await apiFetch(`/api/claims/${request.claimId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes: request.notes }),
    });
  },

  async rejectClaim(request: RejectClaimRequest): Promise<void> {
    await apiFetch(`/api/claims/${request.claimId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: request.reason }),
    });
  },

  async bulkApprove(request: BulkApproveRequest): Promise<void> {
    await apiFetch('/api/claims/bulk-approve', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async getClaims(filters?: {
    status?: string;
    hospital?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Claim[]> {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.hospital) queryParams.append('hospital', filters.hospital);
    if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo);

    const response = await apiFetch<Claim[]>(`/api/claims?${queryParams.toString()}`);
    return response.data;
  },
};



