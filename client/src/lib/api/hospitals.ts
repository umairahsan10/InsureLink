import { apiFetch } from "./client";

// ── Types ────────────────────────────────────────────────────────────────

export interface Hospital {
  id: string;
  userId: string;
  hospitalName: string;
  licenseNumber: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  emergencyPhone: string;
  hospitalType: string;
  hasEmergencyUnit: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHospitalRequest {
  hospitalName: string;
  licenseNumber: string;
  city: string;
  address: string;
  emergencyPhone: string;
  latitude?: number;
  longitude?: number;
  hospitalType?: string;
  hasEmergencyUnit?: boolean;
  isActive?: boolean;
}

export interface UpdateHospitalRequest {
  hospitalName?: string;
  licenseNumber?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  emergencyPhone?: string;
  hospitalType?: string;
  hasEmergencyUnit?: boolean;
  isActive?: boolean;
}

export interface EmergencyContact {
  id: string;
  hospitalId: string;
  contactLevel: number;
  designation: string;
  name: string;
  contactNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmergencyContactRequest {
  contactLevel: number;
  designation: string;
  name: string;
  contactNumber: string;
  isActive?: boolean;
}

export interface UpdateEmergencyContactRequest {
  contactLevel?: number;
  designation?: string;
  name?: string;
  contactNumber?: string;
  isActive?: boolean;
}

export interface HospitalVisit {
  id: string;
  employeeId?: string;
  dependentId?: string;
  hospitalId: string;
  visitDate: string;
  dischargeDate?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeNumber: string;
    [key: string]: any;
  };
  dependent?: {
    id: string;
    firstName: string;
    lastName: string;
    [key: string]: any;
  };
}

export interface CreateHospitalVisitRequest {
  employeeNumber: string;
  dependentId?: string;
  hospitalId: string;
  visitDate: string;
  dischargeDate?: string;
}

// ── Unclaimed Visits Response ────────────────────────────────────────────

export interface UnclaimedVisitEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  corporateId: string;
  planId: string;
  insurerId: string;
  coverageAmount: number;
  usedAmount: number;
  remainingCoverage: number;
}

export interface UnclaimedVisit {
  id: string;
  visitDate: string;
  dischargeDate?: string;
  status: "Pending" | "Claimed";
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  plan?: {
    id: string;
    planName: string;
    sumInsured: number;
  };
  corporate?: {
    id: string;
    name: string;
  };
}

export interface UnclaimedVisitsResponse {
  employee: UnclaimedVisitEmployee;
  visits: UnclaimedVisit[];
}

// ── API ──────────────────────────────────────────────────────────────────

const BASE = "/api/v1/hospitals";

export const hospitalsApi = {
  // ── Hospital CRUD ────────────────────────────────────────────────────

  /** Public endpoint — no auth required. Returns all active hospitals. */
  async getAllPublic(): Promise<Hospital[]> {
    const res = await apiFetch<Hospital[]>(`${BASE}/all`);
    return res.data;
  },

  async createHospital(data: CreateHospitalRequest): Promise<Hospital> {
    const res = await apiFetch<Hospital>(BASE, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async getHospitals(params?: {
    page?: number;
    limit?: number;
    city?: string;
    isActive?: boolean;
    sortBy?: string;
    order?: "asc" | "desc";
  }): Promise<Hospital[]> {
    const q = new URLSearchParams();
    if (params?.page) q.append("page", String(params.page));
    if (params?.limit) q.append("limit", String(Math.min(params.limit, 100)));
    if (params?.city) q.append("city", params.city);
    if (params?.isActive !== undefined)
      q.append("isActive", String(params.isActive));
    if (params?.sortBy) q.append("sortBy", params.sortBy);
    if (params?.order) q.append("order", params.order);
    const qs = q.toString();
    const res = await apiFetch<Hospital[]>(`${BASE}${qs ? `?${qs}` : ""}`);
    return res.data;
  },

  async getHospitalById(id: string): Promise<Hospital> {
    const res = await apiFetch<Hospital>(`${BASE}/${id}`);
    return res.data;
  },

  async updateHospital(
    id: string,
    data: UpdateHospitalRequest,
  ): Promise<Hospital> {
    const res = await apiFetch<Hospital>(`${BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async searchNearby(params: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
  }): Promise<Hospital[]> {
    const q = new URLSearchParams();
    q.append("latitude", String(params.latitude));
    q.append("longitude", String(params.longitude));
    if (params.radiusKm) q.append("radiusKm", String(params.radiusKm));
    const res = await apiFetch<Hospital[]>(
      `${BASE}/search/nearby?${q.toString()}`,
    );
    return res.data;
  },

  // ── Emergency Contacts ───────────────────────────────────────────────

  async getEmergencyContacts(hospitalId: string): Promise<EmergencyContact[]> {
    const res = await apiFetch<EmergencyContact[]>(
      `${BASE}/${hospitalId}/emergency-contacts`,
    );
    return res.data;
  },

  async getMyEmergencyContacts(): Promise<EmergencyContact[]> {
    const res = await apiFetch<EmergencyContact[]>(
      `${BASE}/emergency-contacts`,
    );
    return res.data;
  },

  async getEmergencyContactById(contactId: string): Promise<EmergencyContact> {
    const res = await apiFetch<EmergencyContact>(
      `${BASE}/emergency-contacts/${contactId}`,
    );
    return res.data;
  },

  async createEmergencyContact(
    hospitalId: string,
    data: CreateEmergencyContactRequest,
  ): Promise<EmergencyContact> {
    const res = await apiFetch<EmergencyContact>(
      `${BASE}/${hospitalId}/emergency-contacts`,
      { method: "POST", body: JSON.stringify(data) },
    );
    return res.data;
  },

  async createMyEmergencyContact(
    data: CreateEmergencyContactRequest,
  ): Promise<EmergencyContact> {
    const res = await apiFetch<EmergencyContact>(`${BASE}/emergency-contacts`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateEmergencyContact(
    contactId: string,
    data: UpdateEmergencyContactRequest,
  ): Promise<EmergencyContact> {
    const res = await apiFetch<EmergencyContact>(
      `${BASE}/emergency-contacts/${contactId}`,
      { method: "PATCH", body: JSON.stringify(data) },
    );
    return res.data;
  },

  async deleteEmergencyContact(contactId: string): Promise<void> {
    await apiFetch<void>(`${BASE}/emergency-contacts/${contactId}`, {
      method: "DELETE",
    });
  },

  // ── Visits ───────────────────────────────────────────────────────────

  async getVisits(hospitalId: string): Promise<HospitalVisit[]> {
    const res = await apiFetch<HospitalVisit[]>(`${BASE}/${hospitalId}/visits`);
    return res.data;
  },

  async createVisit(
    hospitalId: string,
    data: CreateHospitalVisitRequest,
  ): Promise<HospitalVisit> {
    const res = await apiFetch<HospitalVisit>(`${BASE}/${hospitalId}/visits`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  // ── Unclaimed Visits (for Claims) ────────────────────────────────────
  /**
   * Get all unclaimed hospital visits for an employee at the current hospital.
   * Used during claim creation workflow.
   */
  async getUnclaimedVisitsByEmployee(
    employeeNumber: string,
  ): Promise<UnclaimedVisitsResponse> {
    const q = new URLSearchParams();
    q.append("employeeNumber", employeeNumber);
    const res = await apiFetch<UnclaimedVisitsResponse>(
      `${BASE}/visits/unclaimed?${q.toString()}`,
    );
    return res.data;
  },
};
