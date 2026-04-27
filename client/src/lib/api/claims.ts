import { apiFetch } from "./client";

// Base path for claims API (v1 versioned)
const BASE = "/api/v1/claims";

// ── Nested types matching backend response ──────────────────────────────

export interface ClaimHospitalVisit {
  id: string;
  visitDate: string;
  dischargeDate?: string | null;
  hospital: { id: string; hospitalName: string; city: string };
  employee?: {
    id: string;
    employeeNumber: string;
    user: { firstName: string; lastName: string; cnic?: string };
  } | null;
  dependent?: {
    id: string;
    firstName: string;
    lastName: string;
    relationship: string;
  } | null;
}

export interface ClaimEvent {
  id: string;
  claimId: string;
  actorUserId?: string;
  actorName: string;
  actorRole: string;
  action: string;
  statusFrom?: string | null;
  statusTo: string;
  eventNote?: string | null;
  timestamp: string;
  createdAt: string;
}

export interface ClaimDocument {
  id: string;
  claimId: string;
  originalFilename: string;
  filePath: string;
  fileUrl: string;
  fileSizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Claim {
  id: string;
  claimNumber: string;
  claimStatus: string;
  amountClaimed: string | number;
  approvedAmount: string | number;
  treatmentCategory?: string;
  priority: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  hospitalVisit: ClaimHospitalVisit;
  corporate: { id: string; name: string };
  plan: {
    id: string;
    planName: string;
    planCode: string;
    sumInsured: string | number;
  };
  insurer: { id: string; companyName: string };
  claimEvents?: ClaimEvent[];
  claimDocuments?: ClaimDocument[];
}

export interface ApproveClaimRequest {
  claimId: string;
  approvedAmount?: number;
  eventNote?: string;
}

export interface RejectClaimRequest {
  claimId: string;
  eventNote: string;
}

export interface BulkApproveRequest {
  claimIds: string[];
  eventNote?: string;
}

export interface UpdateClaimRequest {
  amountClaimed?: number;
  treatmentCategory?: string;
  priority?: "Low" | "Normal" | "High";
  notes?: string;
}

export interface ClaimFilters {
  status?: string;
  hospital?: string;
  hospitalId?: string;
  insurerId?: string;
  corporateId?: string;
  claimType?: string;
  priority?: string;
  claimNumber?: string;
  minAmount?: number;
  maxAmount?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
  // Backward-compatible alias used by some existing callers
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

export interface PatientSubmitClaimRequest {
  hospitalId: string;
  visitDate: string;
  dischargeDate?: string;
  amountClaimed: number;
  treatmentCategory?: string;
  priority?: "Low" | "Normal" | "High";
  notes?: string;
}

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

  async updateClaim(claimId: string, data: UpdateClaimRequest): Promise<Claim> {
    const response = await apiFetch<Claim>(`${BASE}/${claimId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async deleteClaim(claimId: string): Promise<void> {
    await apiFetch(`${BASE}/${claimId}`, { method: "DELETE" });
  },

  async approveClaim(request: ApproveClaimRequest): Promise<Claim> {
    const response = await apiFetch<Claim>(
      `${BASE}/${request.claimId}/approve`,
      {
        method: "PATCH",
        body: JSON.stringify({
          approvedAmount: request.approvedAmount,
          eventNote: request.eventNote,
        }),
      },
    );
    return response.data;
  },

  async rejectClaim(request: RejectClaimRequest): Promise<Claim> {
    const response = await apiFetch<Claim>(
      `${BASE}/${request.claimId}/reject`,
      {
        method: "PATCH",
        body: JSON.stringify({ eventNote: request.eventNote }),
      },
    );
    return response.data;
  },

  async putOnHold(
    claimId: string,
    eventNote: string,
    requiredDocuments?: string[],
  ): Promise<Claim> {
    const response = await apiFetch<Claim>(`${BASE}/${claimId}/on-hold`, {
      method: "PATCH",
      body: JSON.stringify({ eventNote, requiredDocuments }),
    });
    return response.data;
  },

  async markAsPaid(
    claimId: string,
    paymentReference: string,
    paidAmount: number,
    paymentMethod?: string,
    notes?: string,
  ): Promise<Claim> {
    const response = await apiFetch<Claim>(`${BASE}/${claimId}/paid`, {
      method: "PATCH",
      body: JSON.stringify({
        paymentReference,
        paidAmount,
        paymentMethod,
        notes,
      }),
    });
    return response.data;
  },

  async bulkApprove(request: BulkApproveRequest): Promise<{
    message: string;
    success: string[];
    failed: { id: string; reason: string }[];
  }> {
    const response = await apiFetch<{
      message: string;
      success: string[];
      failed: { id: string; reason: string }[];
    }>(`${BASE}/bulk-approve`, {
      method: "POST",
      body: JSON.stringify({
        claimIds: request.claimIds,
        eventNote: request.eventNote,
      }),
    });
    return response.data;
  },

  /**
   * Fetch all dashboard stats in one request instead of one request per status.
   *
   * The server uses Prisma groupBy so the entire count aggregation happens in the DB,
   * not in application memory. Role-scoped: each user only sees their own org's data.
   */
  async getClaimStats(): Promise<{
    total: number;
    Pending: number;
    Approved: number;
    Rejected: number;
    OnHold: number;
    Paid: number;
    highPriority: number;
  }> {
    const response = await apiFetch<{
      total: number;
      Pending: number;
      Approved: number;
      Rejected: number;
      OnHold: number;
      Paid: number;
      highPriority: number;
    }>(`${BASE}/stats`);
    return response.data;
  },

  async getClaims(filters?: ClaimFilters): Promise<PaginatedResponse<Claim>> {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append("status", filters.status);
    if (filters?.hospitalId)
      queryParams.append("hospitalId", filters.hospitalId);
    if (filters?.insurerId) queryParams.append("insurerId", filters.insurerId);
    if (filters?.corporateId)
      queryParams.append("corporateId", filters.corporateId);
    if (filters?.priority) queryParams.append("priority", filters.priority);
    if (filters?.claimNumber)
      queryParams.append("claimNumber", filters.claimNumber);
    if (filters?.minAmount)
      queryParams.append("minAmount", filters.minAmount.toString());
    if (filters?.maxAmount)
      queryParams.append("maxAmount", filters.maxAmount.toString());
    if (filters?.fromDate) queryParams.append("fromDate", filters.fromDate);
    if (filters?.toDate) queryParams.append("toDate", filters.toDate);
    if (filters?.page) queryParams.append("page", filters.page.toString());
    if (filters?.limit) queryParams.append("limit", filters.limit.toString());
    if (filters?.sortBy) queryParams.append("sortBy", filters.sortBy);
    if (filters?.order) queryParams.append("order", filters.order);

    const response = await apiFetch<PaginatedResponse<Claim>>(
      `${BASE}?${queryParams.toString()}`,
    );
    return response.data;
  },

  async getClaimEvents(claimId: string): Promise<ClaimEvent[]> {
    const response = await apiFetch<{ data: ClaimEvent[] }>(
      `${BASE}/${claimId}/events`,
    );
    // Backend may return paginated { data, meta } or a plain array
    const raw = response.data as any;
    return Array.isArray(raw) ? raw : (raw.data ?? []);
  },

  async getClaimDocuments(claimId: string): Promise<ClaimDocument[]> {
    const response = await apiFetch<ClaimDocument[]>(
      `${BASE}/${claimId}/documents`,
    );
    const raw = response.data as any;
    return Array.isArray(raw) ? raw : (raw.data ?? []);
  },

  async uploadDocument(claimId: string, file: File): Promise<ClaimDocument> {
    const formData = new FormData();
    formData.append("file", file);

    // Note: We need to manually handle this upload to avoid Content-Type override
    // Import getAccessToken dynamically to avoid circular dependencies
    const { getAccessToken } = await import("@/lib/auth/session");
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
    const token = getAccessToken();

    const response = await fetch(`${baseUrl}${BASE}/${claimId}/documents`, {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        // Do NOT set Content-Type - browser will set it with boundary for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Upload failed" }));
      throw new Error(error.message || "Failed to upload document");
    }

    const data = await response.json();
    return data.data || data;
  },

  async deleteDocument(claimId: string, documentId: string): Promise<void> {
    await apiFetch(`${BASE}/${claimId}/documents/${documentId}`, {
      method: "DELETE",
    });
  },

  // ── Patient self-service ──────────────────────────────────────────────

  async patientSubmitClaim(request: PatientSubmitClaimRequest): Promise<Claim> {
    const response = await apiFetch<Claim>(`${BASE}/patient-submit`, {
      method: "POST",
      body: JSON.stringify(request),
    });
    return response.data;
  },

  async getPatientClaims(
    filters?: Pick<ClaimFilters, "status" | "page" | "limit">,
  ): Promise<PaginatedResponse<Claim>> {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append("status", filters.status);
    if (filters?.page) queryParams.append("page", filters.page.toString());
    if (filters?.limit) queryParams.append("limit", filters.limit.toString());

    const response = await apiFetch<PaginatedResponse<Claim>>(
      `${BASE}/my-claims?${queryParams.toString()}`,
    );
    return response.data;
  },
};
