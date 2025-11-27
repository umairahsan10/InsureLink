'use client';
import { ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import notificationsData from '@/data/patientNotifications.json';
import { AlertNotification } from '@/types';

export default function PatientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const notifications = useMemo(
    () => notificationsData as AlertNotification[],
    []
  );

  const handleSelectNotification = (notification: AlertNotification) => {
    if (notification.category === 'claims') {
      router.push('/patient/claims');
    } else if (notification.category === 'benefits') {
      router.push('/patient/profile');
    }
  };

  return (
    <DashboardLayout
      userRole="patient"
      userName="Ali Raza"
      notifications={notifications}
      onNotificationSelect={handleSelectNotification}
    >
      {children}
    </DashboardLayout>
  );
}

