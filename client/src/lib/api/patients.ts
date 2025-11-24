import { apiFetch } from './client';

export interface Patient {
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
  [key: string]: any;
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

export const patientsApi = {
  async verifyPatient(request: VerifyPatientRequest): Promise<Patient> {
    const response = await apiFetch<Patient>('/api/patients/verify', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data;
  },

  async getPatient(patientId: string): Promise<Patient> {
    const response = await apiFetch<Patient>(`/api/patients/${patientId}`);
    return response.data;
  },

  async registerPatient(request: RegisterPatientRequest): Promise<Patient> {
    const response = await apiFetch<Patient>('/api/patients', {
      method: 'POST',
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
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.insurance) queryParams.append('insurance', filters.insurance);

    const response = await apiFetch<Patient[]>(`/api/patients?${queryParams.toString()}`);
    return response.data;
  },
};



