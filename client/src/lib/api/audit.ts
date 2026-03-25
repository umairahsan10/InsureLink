import { apiFetch } from "./client";

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  changes: Record<string, { old: any; new: any }>;
  actor: {
    id: string;
    email: string;
  };
  timestamp: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  meta: {
    total: number;
    page: number;
  };
}

export const auditApi = {
  getLogs: async (
    page = 1,
    limit = 20,
    filters?: {
      entityType?: string;
      action?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
    }
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.action) params.append('action', filters.action);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
    }

    const response = await apiFetch<AuditLogsResponse>(`/api/audit/logs?${params.toString()}`);
    return response.data;
  },

  getEntityHistory: async (entityType: string, entityId: string) => {
    const response = await apiFetch<AuditLog[]>(`/api/audit/entity/${entityType}/${entityId}`);
    return response.data;
  },
};
