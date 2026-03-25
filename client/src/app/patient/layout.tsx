'use client';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { AlertNotification } from '@/types';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';

export default function PatientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, markAsRead } = useNotifications();

  const handleSelectNotification = (notification: AlertNotification) => {
    markAsRead(notification.id);
    
    if (notification.category === 'claims') {
      router.push('/patient/claims');
    } else if (notification.category === 'benefits') {
      router.push('/patient/profile');
    }
  };

  return (
    <DashboardLayout
      userRole="patient"
      userName={user?.name || 'Patient'}
      notifications={notifications}
      onNotificationSelect={handleSelectNotification}
    >
      {children}
    </DashboardLayout>
  );
}

