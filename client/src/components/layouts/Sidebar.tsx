'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface SidebarProps {
  userRole: 'patient' | 'corporate' | 'hospital' | 'insurer';
}

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

// SVG Icons
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
  </svg>
);

const ClaimsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const HistoryIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EmployeesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const PlansIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const HospitalIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const PatientsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const CorporatesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const menuItems: Record<string, MenuItem[]> = {
  patient: [
    { name: 'Dashboard', href: '/patient/dashboard', icon: <DashboardIcon /> },
    { name: 'My Claims', href: '/patient/claims', icon: <ClaimsIcon /> },
    { name: 'Profile', href: '/patient/profile', icon: <ProfileIcon /> },
    { name: 'History', href: '/patient/history', icon: <HistoryIcon /> },
  ],
  corporate: [
    { name: 'Dashboard', href: '/corporate/dashboard', icon: <DashboardIcon /> },
    { name: 'Employees', href: '/corporate/employees', icon: <EmployeesIcon /> },
    { name: 'Claims Overview', href: '/corporate/claims', icon: <ClaimsIcon /> },
    { name: 'Plans', href: '/corporate/plans', icon: <PlansIcon /> },
    { name: 'Profile', href: '/corporate/profile', icon: <ProfileIcon /> },
  ],
  hospital: [
    { name: 'Dashboard', href: '/hospital/dashboard', icon: <DashboardIcon /> },
    { name: 'Claims', href: '/hospital/claims', icon: <ClaimsIcon /> },
    { name: 'Patients', href: '/hospital/patients', icon: <PatientsIcon /> },
    { name: 'Profile', href: '/hospital/profile', icon: <ProfileIcon /> },
  ],
  insurer: [
    { name: 'Dashboard', href: '/insurer/dashboard', icon: <DashboardIcon /> },
    { name: 'Claims Review', href: '/insurer/claims', icon: <ClaimsIcon /> },
    { name: 'Hospitals', href: '/insurer/hospitals', icon: <HospitalIcon /> },
    { name: 'Corporates', href: '/insurer/corporates', icon: <CorporatesIcon /> },
    { name: 'Profile', href: '/insurer/profile', icon: <ShieldIcon /> },
  ],
};

// Theme configurations for different roles
const themes = {
  patient: {
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    logoColor: 'text-blue-600',
    textColor: 'text-gray-500',
    itemTextColor: 'text-gray-700',
    hoverBg: 'hover:bg-blue-50',
    hoverText: 'hover:text-blue-600',
    activeBg: 'bg-blue-100',
    activeText: 'text-blue-700',
  },
  corporate: {
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    logoColor: 'text-purple-600',
    textColor: 'text-gray-500',
    itemTextColor: 'text-gray-700',
    hoverBg: 'hover:bg-purple-50',
    hoverText: 'hover:text-purple-600',
    activeBg: 'bg-purple-100',
    activeText: 'text-purple-700',
  },
  hospital: {
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    logoColor: 'text-green-600',
    textColor: 'text-gray-500',
    itemTextColor: 'text-gray-700',
    hoverBg: 'hover:bg-green-50',
    hoverText: 'hover:text-green-600',
    activeBg: 'bg-green-100',
    activeText: 'text-green-700',
  },
  insurer: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-100',
    logoColor: 'text-red-500',
    textColor: 'text-red-400',
    itemTextColor: 'text-red-500',
    hoverBg: 'hover:bg-red-50',
    hoverText: 'hover:text-red-600',
    activeBg: 'bg-red-100',
    activeText: 'text-red-700',
  },
};

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const items = menuItems[userRole];
  const theme = themes[userRole];

  useEffect(() => {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarClose = document.getElementById('sidebar-close');

    const openSidebar = () => {
      if (sidebar && sidebarOverlay && sidebarToggle) {
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
        sidebarOverlay.classList.remove('hidden');
        sidebarToggle.style.display = 'none';
      }
    };

    const closeSidebar = () => {
      if (sidebar && sidebarOverlay && sidebarToggle) {
        sidebar.classList.add('-translate-x-full');
        sidebar.classList.remove('translate-x-0');
        sidebarOverlay.classList.add('hidden');
        sidebarToggle.style.display = 'block';
      }
    };

    const handleNavClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="/corporate/"]');
      if (link) {
        const isMobile = window.innerWidth < 768;
        if (isMobile && sidebar && !sidebar.classList.contains('-translate-x-full')) {
          // Don't prevent default - let Next.js handle navigation
          setTimeout(closeSidebar, 100);
        }
      }
    };

    sidebarToggle?.addEventListener('click', openSidebar);
    sidebarClose?.addEventListener('click', closeSidebar);
    sidebarOverlay?.addEventListener('click', closeSidebar);
    document.addEventListener('click', handleNavClick);

    return () => {
      sidebarToggle?.removeEventListener('click', openSidebar);
      sidebarClose?.removeEventListener('click', closeSidebar);
      sidebarOverlay?.removeEventListener('click', closeSidebar);
      document.removeEventListener('click', handleNavClick);
    };
  }, [pathname]);

  return (
    <>
      <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 hidden" id="sidebar-overlay"></div>
      
      <aside id="sidebar" className={`fixed left-0 top-0 h-screen w-64 ${userRole === 'insurer' ? 'bg-red-50' : theme.bgColor} shadow-lg flex flex-col transform -translate-x-full md:translate-x-0 transition-transform duration-300 z-50`}>
        <div className={`p-4 md:p-6 border-b ${theme.borderColor}`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className={`text-xl md:text-2xl font-bold ${theme.logoColor}`}>InsureLink</h1>
              <p className={`text-xs md:text-sm ${theme.textColor} capitalize`}>{userRole} Portal</p>
            </div>
            <button className="md:hidden text-gray-700 hover:text-gray-900 text-2xl font-bold" id="sidebar-close">✕</button>
          </div>
        </div>

        <nav className="p-2 md:p-4 flex-1">
          <ul className="space-y-1 md:space-y-2">
            {items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors text-sm md:text-base ${
                      isActive
                        ? `${theme.activeBg} ${theme.activeText}`
                        : `${theme.itemTextColor} ${theme.hoverBg} ${theme.hoverText}`
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Link */}
        <div className="p-2 md:p-4 border-t border-gray-200">
          <Link
            href="/login"
            className={`flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors text-sm md:text-base ${theme.itemTextColor} ${theme.hoverBg} ${theme.hoverText}`}
          >
            <svg className="w-4 md:w-5 h-4 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </Link>
        </div>
      </aside>
      
      <button 
        className={`md:hidden fixed top-3 left-3 z-50 text-white p-2 rounded-lg shadow-lg transition-colors ${
          userRole === 'insurer' 
            ? 'bg-red-600 hover:bg-red-700' 
            : userRole === 'corporate'
            ? 'bg-purple-600 hover:bg-purple-700'
            : userRole === 'hospital'
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        id="sidebar-toggle"
      >
        <span className="text-lg font-bold">☰</span>
      </button>
    </>
  );
}

