import { apiFetch } from './client';

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface AuditLogsResponse {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  entityType?: string;
  action?: string;
  userId?: string;
}

export const auditApi = {
  async getLogs(params: GetAuditLogsParams = {}): Promise<AuditLogsResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.entityType) queryParams.set('entityType', params.entityType);
    if (params.action) queryParams.set('action', params.action);
    if (params.userId) queryParams.set('userId', params.userId);

    const query = queryParams.toString();
    const path = `/api/v1/audit/logs${query ? `?${query}` : ''}`;
    const response = await apiFetch<AuditLogsResponse>(path);
    return response.data;
  },

  async getEntityHistory(entityType: string, entityId: string): Promise<AuditLogsResponse> {
    const response = await apiFetch<AuditLogsResponse>(
      `/api/v1/audit/entity/${entityType}/${entityId}`
    );
    return response.data;
  },
};
