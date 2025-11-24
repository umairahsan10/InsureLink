'use client';
import { ReactNode, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import notificationsData from '@/data/hospitalNotifications.json';
import { AlertNotification } from '@/types';

export default function HospitalLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AlertNotification[]>(
    notificationsData as AlertNotification[]
  );

  const handleSelectNotification = (notification: AlertNotification) => {
    if (notification.category === 'messaging') {
      router.push('/hospital/claims');
    }
  };

  return (
    <DashboardLayout
      userRole="hospital"
      userName="City General Hospital"
      notifications={notifications}
      onNotificationSelect={handleSelectNotification}
    >
      {children}
    </DashboardLayout>
  );
}

