import { apiFetch } from './client';
import { AlertNotification } from '@/types';

export interface NotificationResponse {
  id: string;
  userId: string;
  notificationType: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  relatedEntityId?: string;
  relatedEntityType?: string;
  isRead: boolean;
  actionUrl?: string;
  category?: string;
  timestamp: string;
  createdAt: string;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  notificationType?: string;
  isRead?: boolean;
  severity?: string;
}

export interface PaginatedNotifications {
  data: NotificationResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function mapToAlertNotification(notification: NotificationResponse): AlertNotification {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    severity: notification.severity,
    category: notification.category || notification.relatedEntityType || 'general',
    timestamp: notification.timestamp,
    isRead: notification.isRead,
  };
}

export const notificationsApi = {
  async getAll(params: GetNotificationsParams = {}): Promise<{ notifications: AlertNotification[]; total: number; totalPages: number }> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.notificationType) queryParams.set('notificationType', params.notificationType);
    if (params.isRead !== undefined) queryParams.set('isRead', params.isRead.toString());
    if (params.severity) queryParams.set('severity', params.severity);

    const query = queryParams.toString();
    const path = `/api/v1/notifications${query ? `?${query}` : ''}`;
    
    const response = await apiFetch<PaginatedNotifications>(path);
    
    return {
      notifications: response.data.data.map(mapToAlertNotification),
      total: response.data.total,
      totalPages: response.data.totalPages,
    };
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiFetch<{ count: number }>('/api/v1/notifications/unread-count');
    return response.data.count;
  },

  async markAsRead(id: string): Promise<void> {
    await apiFetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
  },

  async dismiss(id: string): Promise<void> {
    await apiFetch(`/api/v1/notifications/${id}`, { method: 'DELETE' });
  },
};
