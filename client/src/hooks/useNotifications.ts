"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { AlertNotification } from "@/types";
import { notificationsApi } from "@/lib/api/notifications";
import { useAuth } from "./useAuth";
import { getAccessToken } from "@/lib/auth/session";

interface UseNotificationsOptions {
  autoFetch?: boolean;
  limit?: number;
  listenForRealtime?: boolean;
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
  isConnected: boolean;
}

export function useNotifications(
  options: UseNotificationsOptions = {},
): UseNotificationsReturn {
  const { autoFetch = true, limit = 20, listenForRealtime = true } = options;
  const { user } = useAuth();

  const socketRef = useRef<Socket | null>(null);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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
      setError(
        err instanceof Error ? err.message : "Failed to fetch notifications",
      );
    } finally {
      setIsLoading(false);
    }
  }, [user, limit]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((current) =>
        current.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  const dismiss = useCallback(
    async (id: string) => {
      const notification = notifications.find((n) => n.id === id);

      try {
        await notificationsApi.dismiss(id);
        setNotifications((current) => current.filter((n) => n.id !== id));
        if (notification && !notification.isRead) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
      } catch (err) {
        console.error("Failed to dismiss notification:", err);
      }
    },
    [notifications],
  );

  const markAllAsRead = useCallback(() => {
    // Mark all as read locally (can be extended to batch API call if needed)
    setNotifications((current) => current.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    // Fire API calls in background for each unread
    notifications
      .filter((n) => !n.isRead)
      .forEach((n) => {
        notificationsApi.markAsRead(n.id).catch(console.error);
      });
  }, [notifications]);

  // Setup WebSocket listener for real-time notifications
  useEffect(() => {
    if (!listenForRealtime || !user) return;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
    const token = getAccessToken();

    if (!token) {
      console.warn("[useNotifications] No auth token found");
      return;
    }

    console.log("[useNotifications] Connecting to socket.io at", baseUrl);
    const socket = io(baseUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[useNotifications] Socket connected");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("[useNotifications] Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error: any) => {
      console.error("[useNotifications] Socket connection error:", error);
    });

    // Listen for real-time notification events
    socket.on("notification", (notification: any) => {
      console.log("[useNotifications] Received notification:", notification);
      const newNotification: AlertNotification = {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        severity: notification.severity || "info",
        category: notification.category || "general",
        isRead: notification.isRead || false,
        timestamp: notification.timestamp || new Date().toISOString(),
      };

      // Add new notification to the top of the list
      setNotifications((current) => [newNotification, ...current]);
      // Increment unread count
      setUnreadCount((count) => count + 1);
    });

    return () => {
      console.log("[useNotifications] Cleaning up socket connection");
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user, listenForRealtime]);

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
    isConnected,
  };
}
