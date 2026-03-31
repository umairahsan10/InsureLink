import { apiFetch } from "./client";

export interface Patient extends Record<string, unknown> {
  id: string;
  name?: string;
  cnic?: string;
  age?: number;
  phone?: string;
  email?: string;
  address?: string;
  lastVisit?: string;
  insurance?: string;
  status?: string;
}

export interface PatientProfile {
  id: string;
  isPatient: boolean;
  patientType?: "employee" | "dependent";
  name?: string;
  email?: string;
  mobile?: string;
  insurance?: string;
  corporateName?: string;
  status?: "Active" | "Inactive";
  role?: string;
}

export interface VerifyPatientRequest {
  cnic: string;
}

export interface RegisterPatientRequest {
  name: string;
  cnic: string;
  age: number;
  phone: string;
  email?: string;
  address?: string;
}

export interface UpdatePatientProfileRequest {
  email?: string;
  mobile?: string;
}

export interface PatientCoverage {
  employeeId?: string;
  fullName?: string;
  planName: string;
  totalCoverageAmount: string | number;
  usedAmount: string | number;
  availableAmount: string | number;
  coverageStartDate: string;
  coverageEndDate: string;
  status: string;
}

export const patientsApi = {
  async getMe(): Promise<PatientProfile> {
    const response = await apiFetch<PatientProfile>("/api/patients/me");
    return response.data;
  },

  async getCoverage(patientId: string): Promise<PatientCoverage> {
    const response = await apiFetch<PatientCoverage>(
      `/api/patients/${patientId}/coverage`,
    );
    return response.data;
  },

  async updateProfile(
    request: UpdatePatientProfileRequest,
  ): Promise<PatientProfile> {
    const response = await apiFetch<PatientProfile>("/api/patients/me", {
      method: "PATCH",
      body: JSON.stringify(request),
    });
    return response.data;
  },

  async verifyPatient(request: VerifyPatientRequest): Promise<Patient> {
    const response = await apiFetch<Patient>("/api/patients/verify", {
      method: "POST",
      body: JSON.stringify(request),
    });
    return response.data;
  },

  async getPatient(patientId: string): Promise<Patient> {
    const response = await apiFetch<Patient>(`/api/patients/${patientId}`);
    return response.data;
  },

  async registerPatient(request: RegisterPatientRequest): Promise<Patient> {
    const response = await apiFetch<Patient>("/api/patients", {
      method: "POST",
      body: JSON.stringify(request),
    });
    return response.data;
  },

  async getPatients(filters?: {
    search?: string;
    status?: string;
    insurance?: string;
  }): Promise<Patient[]> {
    const queryParams = new URLSearchParams();
    if (filters?.search) queryParams.append("search", filters.search);
    if (filters?.status) queryParams.append("status", filters.status);
    if (filters?.insurance) queryParams.append("insurance", filters.insurance);

    const response = await apiFetch<Patient[]>(
      `/api/patients?${queryParams.toString()}`,
    );
    return response.data;
  },
};
