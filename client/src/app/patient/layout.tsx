'use client';
import { ReactNode, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import NotificationPanel from '@/components/notifications/NotificationPanel';
import notificationsData from '@/data/patientNotifications.json';
import { AlertNotification } from '@/types';

const navigation = [
  { name: 'Dashboard Overview', href: '/patient/dashboard', icon: '🏠' },
  { name: 'Claim Submission', href: '/patient/claims', icon: '📤' },
  { name: 'Claim Status Tracking', href: '/patient/history', icon: '📊' },
  { name: 'Hospitals', href: '/patient/hospitals', icon: '🏥' },
  { name: 'Labs', href: '/patient/labs', icon: '🔬' },
  // { name: 'Notifications', href: '/patient/notifications', icon: '🔔' },
  { name: 'Profile Settings', href: '/patient/profile', icon: '👤' },
];

export default function PatientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<AlertNotification[]>(
    notificationsData as AlertNotification[]
  );

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const handleLogout = () => {
    // Clear auth token cookie
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    // Redirect to login page
    router.push('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleTogglePanel = () => {
    if (!isPanelOpen) {
      setNotifications((current) =>
        current.map((notification) =>
          notification.isRead ? notification : { ...notification, isRead: true }
        )
      );
    }
    setIsPanelOpen((prev) => !prev);
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  };

  const handleSelectNotification = (notification: AlertNotification) => {
    if (notification.category === 'claims') {
      router.push('/patient/claims');
    } else if (notification.category === 'benefits') {
      router.push('/patient/profile');
    }
    setIsPanelOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          <div className="p-6">
            <div className="flex items-center mb-8">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-xl font-bold text-gray-900">InsureLink</span>
            </div>
          </div>
          
          <nav className="flex-1 px-6 overflow-y-auto">
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeSidebar}
                    className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Logout Button */}
          <div className="p-6 border-t border-gray-200">
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col ml-0 lg:ml-64">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={toggleSidebar}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900 ml-2 lg:ml-0">Patient Portal</h1>
            </div>
            
            <div className="flex items-center">
              <div className="relative flex items-center space-x-2 sm:space-x-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleTogglePanel}
                    className="relative p-2 text-yellow-500 hover:text-yellow-600 rounded-full hover:bg-yellow-50 transition-colors"
                    aria-label="Toggle notifications"
                  >
                    <span className="text-xl">🔔</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <NotificationPanel
                    notifications={notifications}
                    isOpen={isPanelOpen}
                    onDismiss={handleDismissNotification}
                    onClose={() => setIsPanelOpen(false)}
                    onSelect={handleSelectNotification}
                  />
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">Ali Raza</p>
                    <p className="text-xs text-gray-500">Patient</p>
                  </div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                    A
                  </div>
                </div>
              </div>
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

