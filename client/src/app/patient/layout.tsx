'use client';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useNotifications } from '@/hooks/useNotifications';
import { AlertNotification } from '@/types';

export default function PatientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { notifications, dismiss, markAsRead } = useNotifications();

  const handleSelectNotification = (notification: AlertNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.category === 'claims') {
      router.push('/patient/claims');
    } else if (notification.category === 'benefits') {
      router.push('/patient/profile');
    }
  };

  const handleDismissNotification = (id: string) => {
    dismiss(id);
  };

  return (
    <DashboardLayout
      userRole="patient"
      userName="Ali Raza"
      notifications={notifications}
      onNotificationSelect={handleSelectNotification}
      onNotificationDismiss={handleDismissNotification}
    >
      {children}
    </DashboardLayout>
  );
}

