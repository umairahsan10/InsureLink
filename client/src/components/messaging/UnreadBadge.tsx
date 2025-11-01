'use client';

interface UnreadBadgeProps {
  count: number;
  hasAlert?: boolean; // true if unread > 24 hours
  size?: 'sm' | 'md';
}

export default function UnreadBadge({ count, hasAlert = false, size = 'sm' }: UnreadBadgeProps) {
  if (count === 0) return null;

  const sizeClasses = {
    sm: 'text-xs w-5 h-5',
    md: 'text-sm w-6 h-6',
  };

  const alertClasses = hasAlert
    ? 'animate-pulse ring-2 ring-red-500 ring-offset-2'
    : '';

  return (
    <span
      className={`absolute -top-1 -right-1 bg-red-500 text-white rounded-full flex items-center justify-center font-semibold ${sizeClasses[size]} ${alertClasses}`}
      title={hasAlert ? 'Unread messages older than 24 hours' : `${count} unread messages`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

