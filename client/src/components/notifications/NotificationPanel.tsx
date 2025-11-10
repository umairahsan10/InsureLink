import { AlertNotification, NotificationSeverity } from '@/types';
import { Fragment, type ReactElement } from 'react';

interface NotificationPanelProps {
  notifications: AlertNotification[];
  isOpen: boolean;
  onDismiss: (id: string) => void;
  onClose: () => void;
  onSelect?: (notification: AlertNotification) => void;
}

const severityConfig: Record<
  NotificationSeverity,
  { icon: ReactElement; bannerClass: string; accentClass: string }
> = {
  info: {
    icon: (
      <svg
        className="w-5 h-5 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    bannerClass: 'border-blue-200 bg-blue-50',
    accentClass: 'bg-blue-500',
  },
  warning: {
    icon: (
      <svg
        className="w-5 h-5 text-yellow-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 5c-.77-1.333-2.694-1.333-3.464 0L4.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    bannerClass: 'border-yellow-200 bg-yellow-50',
    accentClass: 'bg-yellow-500',
  },
  critical: {
    icon: (
      <svg
        className="w-5 h-5 text-red-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 5c-.77-1.333-2.694-1.333-3.464 0L4.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    bannerClass: 'border-red-200 bg-red-50',
    accentClass: 'bg-red-500',
  },
};

function formatRelativeTime(timestamp: string) {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = now.getTime() - then.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return 'Just now';
  }
  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  const days = Math.floor(diff / day);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function NotificationPanel({
  notifications,
  isOpen,
  onDismiss,
  onClose,
  onSelect,
}: NotificationPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute right-0 mt-3 w-96 max-w-[90vw] z-50">
      <div className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            <p className="text-xs text-gray-500">
              {notifications.length
                ? `You have ${notifications.filter((n) => !n.isRead).length} unread alert${
                    notifications.filter((n) => !n.isRead).length === 1 ? '' : 's'
                  }`
                : 'All caught up'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="Close notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">No notifications</div>
          ) : (
            notifications.map((notification) => {
              const { icon, bannerClass, accentClass } = severityConfig[notification.severity];
              return (
                <Fragment key={notification.id}>
                  <div
                    className={`p-4 flex gap-3 ${bannerClass} cursor-pointer transition-colors hover:bg-opacity-80`}
                    onClick={() => onSelect?.(notification)}
                  >
                    <div className={`mt-0.5 w-1 rounded-full ${accentClass}`} aria-hidden />
                    <div className="flex-shrink-0">{icon}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                          <p className="text-xs text-gray-500 capitalize">{notification.category}</p>
                        </div>
                        <p className="text-xs text-gray-400 whitespace-nowrap">
                          {formatRelativeTime(notification.timestamp)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700 leading-snug">{notification.message}</p>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDismiss(notification.id);
                          }}
                          className="text-xs font-medium text-gray-500 hover:text-gray-700 hover:underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

