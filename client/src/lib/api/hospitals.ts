import { apiFetch } from './client';

export interface Hospital {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  location?: string;
  specializations?: string;
  status?: string;
  [key: string]: any;
}

export interface AddHospitalRequest {
  name: string;
  address: string;
  phone: string;
  email?: string;
}

export const hospitalsApi = {
  async getHospital(hospitalId: string): Promise<Hospital> {
    const response = await apiFetch<Hospital>(`/api/hospitals/${hospitalId}`);
    return response.data;
  },

  async addHospital(request: AddHospitalRequest): Promise<Hospital> {
    const response = await apiFetch<Hospital>('/api/hospitals', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data;
  },

  async getHospitals(filters?: {
    search?: string;
    status?: string;
    location?: string;
  }): Promise<Hospital[]> {
    const queryParams = new URLSearchParams();
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.location) queryParams.append('location', filters.location);

    const response = await apiFetch<Hospital[]>(`/api/hospitals?${queryParams.toString()}`);
    return response.data;
  },
};



