'use client';

import { useEffect, useMemo, useState } from 'react';
import NotificationPanel from '../notifications/NotificationPanel';
import { AlertNotification } from '@/types';

interface TopbarProps {
  userName?: string;
  userRole?: string;
  notifications?: AlertNotification[];
  onNotificationSelect?: (notification: AlertNotification) => void;
}

export default function Topbar({
  userName = 'User',
  userRole = 'Guest',
  notifications = [],
  onNotificationSelect,
}: TopbarProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertNotification[]>(notifications);

  useEffect(() => {
    setAlerts(notifications);
  }, [notifications]);

  const unreadCount = useMemo(
    () => alerts.filter((notification) => !notification.isRead).length,
    [alerts]
  );

  const handleTogglePanel = () => {
    if (!isPanelOpen) {
      setAlerts((current) =>
        current.map((notification) =>
          notification.isRead ? notification : { ...notification, isRead: true }
        )
      );
    }
    setIsPanelOpen((prev) => !prev);
  };

  const handleDismiss = (id: string) => {
    setAlerts((current) => current.filter((notification) => notification.id !== id));
  };

  const handleClose = () => {
    setIsPanelOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-12 md:px-6 py-3 md:py-4 flex justify-between items-center">
        <div>
          <h2 className="text-sm md:text-xl font-semibold text-gray-800 truncate">Welcome back, {userName}!</h2>
          <p className="text-xs md:text-sm text-gray-500 hidden sm:block">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="relative">
            <button
              type="button"
              onClick={handleTogglePanel}
              className="relative p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Toggle notifications"
            >
              <span className="text-xl md:text-2xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>

            <NotificationPanel
              notifications={alerts}
              isOpen={isPanelOpen}
              onDismiss={handleDismiss}
              onClose={handleClose}
              onSelect={(notification) => {
                onNotificationSelect?.(notification);
                if (notification.category === 'messaging') {
                  setIsPanelOpen(false);
                }
              }}
            />
          </div>

          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

