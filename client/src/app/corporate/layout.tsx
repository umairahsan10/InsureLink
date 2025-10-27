import { ReactNode } from 'react';
import CorporateSidebar from '@/components/corporate/CorporateSidebar';

export default function CorporateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <CorporateSidebar />
      
      {/* Main Content */}
      <div className="md:ml-64 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-12 md:px-6 py-3 md:py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-sm md:text-lg font-semibold text-gray-900 truncate">TechCorp Ltd. Corporate</h1>
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 text-gray-500 hover:text-gray-700">
                  🔔
                </button>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </div>
              {/* User Profile */}
              <button className="p-2 text-gray-500 hover:text-gray-700">
                👤
              </button>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

