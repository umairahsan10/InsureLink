import { ReactNode } from 'react';
import { AlertNotification } from '@/types';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface DashboardLayoutProps {
  children: ReactNode;
  userRole: 'patient' | 'corporate' | 'hospital' | 'insurer';
  userName?: string;
  notifications?: AlertNotification[];
  onNotificationSelect?: (notification: AlertNotification) => void;
  onNotificationDismiss?: (id: string) => void;
}

export default function DashboardLayout({
  children,
  userRole,
  userName,
  notifications,
  onNotificationSelect,
  onNotificationDismiss,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userRole={userRole} />
      
      <div className="md:ml-64 flex flex-col pt-12 md:pt-0">
        <Topbar
          userName={userName}
          userRole={userRole}
          notifications={notifications}
          onNotificationSelect={onNotificationSelect}
          onNotificationDismiss={onNotificationDismiss}
        />
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

