import { apiFetch } from './client';

export interface Corporate {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  industry?: string;
  planType?: string;
  [key: string]: any;
}

export interface AddCorporateRequest {
  name: string;
  address: string;
  phone: string;
  email?: string;
  contactPerson: string;
}

export interface ExportReportRequest {
  format: 'csv' | 'pdf' | 'json';
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  };
}

export const insurerApi = {
  async addCorporate(request: AddCorporateRequest): Promise<Corporate> {
    const response = await apiFetch<Corporate>('/api/corporates', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data;
  },

  async exportReport(request: ExportReportRequest): Promise<Blob> {
    const queryParams = new URLSearchParams();
    queryParams.append('format', request.format);
    if (request.filters?.dateFrom) queryParams.append('dateFrom', request.filters.dateFrom);
    if (request.filters?.dateTo) queryParams.append('dateTo', request.filters.dateTo);
    if (request.filters?.status) queryParams.append('status', request.filters.status);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/reports/export?${queryParams.toString()}`,
      {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to export report');
    }
    
    return response.blob();
  },

  async generateAuditReport(filters?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo);

    const response = await apiFetch<any>(`/api/reports/audit?${queryParams.toString()}`);
    return response.data;
  },
};



