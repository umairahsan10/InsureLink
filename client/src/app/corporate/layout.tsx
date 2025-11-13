'use client';

import { ReactNode } from 'react';
import Sidebar from '@/components/layouts/Sidebar';
import Topbar from '@/components/layouts/Topbar';

export default function CorporateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userRole="corporate" />
      
      <div className="md:ml-64 flex flex-col pt-12 md:pt-0">
        <Topbar userRole="corporate" userName="TechCorp Ltd." />
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

