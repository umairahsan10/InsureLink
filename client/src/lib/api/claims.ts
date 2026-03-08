import { apiFetch } from "./client";

// Base path for claims API (v1 versioned)
const BASE = "/api/v1/claims";

export interface Claim {
  id: string;
  claimNumber: string;
  patientName?: string;
  hospital?: string;
  hospitalName?: string;
  amount?: string | number;
  billedAmount?: number;
  approvedAmount?: number;
  date?: string;
  status?: string;
  treatment?: string;
  diagnosis?: string;
  claimType?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApproveClaimRequest {
  claimId: string;
  approvedAmount?: number;
  notes?: string;
}

export interface RejectClaimRequest {
  claimId: string;
  reason: string;
}

export interface BulkApproveRequest {
  claimIds: string[];
  notes?: string;
}

export interface ClaimFilters {
  status?: string;
  hospital?: string;
  hospitalId?: string;
  insurerId?: string;
  claimType?: string;
  minAmount?: number;
  maxAmount?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ── Create Claim Request (Simplified) ────────────────────────────────────

export interface CreateClaimRequest {
  hospitalVisitId: string;
  amountClaimed: number;
  treatmentCategory?: string;
  priority?: "Low" | "Normal" | "High";
  notes?: string;
}

// Note: corporateId, planId, insurerId are auto-populated from the hospital visit

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const claimsApi = {
  /**
   * Create a new claim for a hospital visit.
   * corporateId, planId, insurerId are auto-populated from the visit's employee data.
   */
  async createClaim(request: CreateClaimRequest): Promise<Claim> {
    const response = await apiFetch<Claim>(BASE, {
      method: "POST",
      body: JSON.stringify(request),
    });
    return response.data;
  },

  async getClaim(claimId: string): Promise<Claim> {
    const response = await apiFetch<Claim>(`${BASE}/${claimId}`);
    return response.data;
  },

  async getClaimByNumber(claimNumber: string): Promise<Claim> {
    const response = await apiFetch<Claim>(`${BASE}/number/${claimNumber}`);
    return response.data;
  },

  async approveClaim(request: ApproveClaimRequest): Promise<Claim> {
    const response = await apiFetch<Claim>(
      `${BASE}/${request.claimId}/approve`,
      {
        method: "POST",
        body: JSON.stringify({
          approvedAmount: request.approvedAmount,
          notes: request.notes,
        }),
      },
    );
    return response.data;
  },

  async rejectClaim(request: RejectClaimRequest): Promise<Claim> {
    const response = await apiFetch<Claim>(
      `${BASE}/${request.claimId}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ reason: request.reason }),
      },
    );
    return response.data;
  },

  async putOnHold(
    claimId: string,
    reason: string,
    requiredDocuments?: string[],
  ): Promise<Claim> {
    const response = await apiFetch<Claim>(`${BASE}/${claimId}/on-hold`, {
      method: "PATCH",
      body: JSON.stringify({ reason, requiredDocuments }),
    });
    return response.data;
  },

  async markAsPaid(
    claimId: string,
    paymentReference: string,
    paidAmount: number,
    paymentMethod?: string,
  ): Promise<Claim> {
    const response = await apiFetch<Claim>(`${BASE}/${claimId}/paid`, {
      method: "PATCH",
      body: JSON.stringify({ paymentReference, paidAmount, paymentMethod }),
    });
    return response.data;
  },

  async bulkApprove(
    request: BulkApproveRequest,
  ): Promise<{ successful: Claim[]; failed: { id: string; error: string }[] }> {
    const response = await apiFetch<{
      successful: Claim[];
      failed: { id: string; error: string }[];
    }>(`${BASE}/bulk-approve`, {
      method: "POST",
      body: JSON.stringify(request),
    });
    return response.data;
  },

  async getClaims(filters?: ClaimFilters): Promise<PaginatedResponse<Claim>> {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append("status", filters.status);
    if (filters?.hospital) queryParams.append("hospitalId", filters.hospital);
    if (filters?.hospitalId)
      queryParams.append("hospitalId", filters.hospitalId);
    if (filters?.insurerId) queryParams.append("insurerId", filters.insurerId);
    if (filters?.claimType) queryParams.append("claimType", filters.claimType);
    if (filters?.minAmount)
      queryParams.append("minAmount", filters.minAmount.toString());
    if (filters?.maxAmount)
      queryParams.append("maxAmount", filters.maxAmount.toString());
    if (filters?.fromDate) queryParams.append("fromDate", filters.fromDate);
    if (filters?.toDate) queryParams.append("toDate", filters.toDate);
    if (filters?.page) queryParams.append("page", filters.page.toString());
    if (filters?.limit) queryParams.append("limit", filters.limit.toString());
    if (filters?.sortBy) queryParams.append("sortBy", filters.sortBy);
    if (filters?.sortOrder) queryParams.append("sortOrder", filters.sortOrder);

    const response = await apiFetch<PaginatedResponse<Claim>>(
      `${BASE}?${queryParams.toString()}`,
    );
    return response.data;
  },

  async getClaimEvents(
    claimId: string,
  ): Promise<
    { action: string; performedBy: string; timestamp: string; notes?: string }[]
  > {
    const response = await apiFetch<
      {
        action: string;
        performedBy: string;
        timestamp: string;
        notes?: string;
      }[]
    >(`${BASE}/${claimId}/events`);
    return response.data;
  },

  async getClaimDocuments(
    claimId: string,
  ): Promise<
    { id: string; fileName: string; documentType: string; uploadedAt: string }[]
  > {
    const response = await apiFetch<
      {
        id: string;
        fileName: string;
        documentType: string;
        uploadedAt: string;
      }[]
    >(`${BASE}/${claimId}/documents`);
    return response.data;
  },

  async uploadDocument(
    claimId: string,
    file: File,
    documentType: string,
    notes?: string,
  ): Promise<{ id: string; fileName: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    if (notes) formData.append("notes", notes);

    const response = await apiFetch<{ id: string; fileName: string }>(
      `${BASE}/${claimId}/documents`,
      {
        method: "POST",
        headers: {}, // Let browser set Content-Type for FormData
        body: formData as unknown as BodyInit,
      },
    );
    return response.data;
  },

  async deleteDocument(claimId: string, documentId: string): Promise<void> {
    await apiFetch(`${BASE}/${claimId}/documents/${documentId}`, {
      method: "DELETE",
    });
  },

  async getStats(filters?: {
    hospitalId?: string;
    insurerId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<{
    totalClaims: number;
    pendingClaims: number;
    approvedClaims: number;
    rejectedClaims: number;
    totalBilledAmount: number;
    totalApprovedAmount: number;
    totalPaidAmount: number;
  }> {
    const queryParams = new URLSearchParams();
    if (filters?.hospitalId)
      queryParams.append("hospitalId", filters.hospitalId);
    if (filters?.insurerId) queryParams.append("insurerId", filters.insurerId);
    if (filters?.fromDate) queryParams.append("fromDate", filters.fromDate);
    if (filters?.toDate) queryParams.append("toDate", filters.toDate);

    const response = await apiFetch<{
      totalClaims: number;
      pendingClaims: number;
      approvedClaims: number;
      rejectedClaims: number;
      totalBilledAmount: number;
      totalApprovedAmount: number;
      totalPaidAmount: number;
    }>(`${BASE}/stats?${queryParams.toString()}`);
    return response.data;
  },
};
