import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationsApi, Notification } from '@/lib/api/notifications';
import { AlertNotification } from '@/types';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/auth/session';

export function useNotifications() {
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const [notifsResponse, countResponse] = await Promise.all([
        notificationsApi.getMyNotifications(1, 10), // Fetch first page
        notificationsApi.getUnreadCount(),
      ]);

      const mappedNotifications = notifsResponse.data.map(mapNotification);
      setNotifications(mappedNotifications);
      setUnreadCount(countResponse.count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Socket connection
    const token = getAccessToken();
    if (token) {
      const socket = io(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001', {
        auth: { token },
      });
      socketRef.current = socket;

      socket.on('notification', (newNotification: Notification) => {
        setNotifications((prev) => [mapNotification(newNotification), ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
      
      return () => {
        socket.disconnect();
      };
    }
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
      try {
          await notificationsApi.markAllAsRead();
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
          setUnreadCount(0);
      } catch (error) {
          console.error('Failed to mark all as read:', error);
      }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}

function mapNotification(apiNotification: Notification): AlertNotification {
  return {
    id: apiNotification.id,
    title: apiNotification.title,
    message: apiNotification.message,
    severity: apiNotification.severity,
    category: mapCategory(apiNotification.notificationType), // dependent request -> dependents
    timestamp: apiNotification.createdAt,
    isRead: apiNotification.isRead,
  };
}

function mapCategory(type: string): string {
  switch (type) {
    case 'claim_status': return 'claims';
    case 'policy_update': return 'policies';
    case 'dependent_request': return 'dependents';
    case 'messaging_alert': return 'messaging';
    default: return 'system';
  }
}
