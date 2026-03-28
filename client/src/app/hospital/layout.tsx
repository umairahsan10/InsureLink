'use client';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useNotifications } from '@/hooks/useNotifications';
import { AlertNotification } from '@/types';

export default function HospitalLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { notifications, dismiss, markAsRead } = useNotifications();

  const handleSelectNotification = (notification: AlertNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.category === 'messaging') {
      router.push('/hospital/claims');
    }
  };

  const handleDismissNotification = (id: string) => {
    dismiss(id);
  };

  return (
    <DashboardLayout
      userRole="hospital"
      userName="City General Hospital"
      notifications={notifications}
      onNotificationSelect={handleSelectNotification}
      onNotificationDismiss={handleDismissNotification}
    >
      {children}
    </DashboardLayout>
  );
}

