'use client';
import { useCallback, useEffect, useState } from 'react';
import { AlertNotification } from '@/types';
import { notificationsApi } from '@/lib/api/notifications';
import { useAuth } from './useAuth';

interface UseNotificationsOptions {
  autoFetch?: boolean;
  limit?: number;
}

interface UseNotificationsReturn {
  notifications: AlertNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  markAllAsRead: () => void;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { autoFetch = true, limit = 20 } = options;
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [notifResult, countResult] = await Promise.all([
        notificationsApi.getAll({ limit }),
        notificationsApi.getUnreadCount(),
      ]);
      
      setNotifications(notifResult.notifications);
      setUnreadCount(countResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user, limit]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((current) =>
        current.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const dismiss = useCallback(async (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    
    try {
      await notificationsApi.dismiss(id);
      setNotifications((current) => current.filter((n) => n.id !== id));
      if (notification && !notification.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  }, [notifications]);

  const markAllAsRead = useCallback(() => {
    // Mark all as read locally (can be extended to batch API call if needed)
    setNotifications((current) =>
      current.map((n) => ({ ...n, isRead: true }))
    );
    setUnreadCount(0);
    
    // Fire API calls in background for each unread
    notifications
      .filter((n) => !n.isRead)
      .forEach((n) => {
        notificationsApi.markAsRead(n.id).catch(console.error);
      });
  }, [notifications]);

  useEffect(() => {
    if (autoFetch && user) {
      fetchNotifications();
    }
  }, [autoFetch, user, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    dismiss,
    markAllAsRead,
  };
}
