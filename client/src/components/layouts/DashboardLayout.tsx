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
    <div className="min-h-screen bg-gray-50">
      <Sidebar userRole={userRole} />
      
      <div className="md:ml-64 flex flex-col pt-12 md:pt-0">
        <Topbar userName={userName} userRole={userRole} />
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

