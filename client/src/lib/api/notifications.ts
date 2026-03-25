import { apiFetch, ApiResponse } from "./client";

export interface Notification {
  id: string;
  userId: string;
  notificationType: 'claim_status' | 'policy_update' | 'dependent_request' | 'messaging_alert';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  data: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UnreadCountResponse {
  count: number;
}

export const notificationsApi = {
  getMyNotifications: async (page = 1, limit = 10, isRead?: boolean, type?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (isRead !== undefined) params.append('isRead', isRead.toString());
    if (type) params.append('type', type);

    const response = await apiFetch<NotificationsResponse>(`/api/notifications?${params.toString()}`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiFetch<UnreadCountResponse>('/api/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await apiFetch<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiFetch<{ success: boolean }>('/api/notifications/read-all', {
      method: 'PATCH',
    });
    return response.data;
  },

  deleteNotification: async (id: string) => {
    const response = await apiFetch<{ success: boolean }>(`/api/notifications/${id}`, {
      method: 'DELETE',
    });
    return response.data;
  },
};
