import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface DashboardLayoutProps {
  children: ReactNode;
  userRole: 'patient' | 'corporate' | 'hospital' | 'insurer';
  userName?: string;
}

export default function DashboardLayout({ children, userRole, userName }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userRole={userRole} />
      
      <div className="flex-1 flex flex-col">
        <Topbar userName={userName} userRole={userRole} />
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

