'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const navigationItems = [
  { name: 'Dashboard', href: '/corporate/dashboard', icon: '📊' },
  { name: 'Employees', href: '/corporate/employees', icon: '👥' },
  { name: 'Claims Overview', href: '/corporate/claims', icon: '📋' },
  { name: 'Settings', href: '/corporate/profile', icon: '⚙️' },
];

export default function CorporateSidebar() {
  const pathname = usePathname();

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
        // Hide the hamburger button when sidebar is open
        sidebarToggle.style.display = 'none';
      }
    };

    const closeSidebar = () => {
      if (sidebar && sidebarOverlay && sidebarToggle) {
        sidebar.classList.add('-translate-x-full');
        sidebar.classList.remove('translate-x-0');
        sidebarOverlay.classList.add('hidden');
        // Show the hamburger button when sidebar is closed
        sidebarToggle.style.display = 'block';
      }
    };

    // Handle navigation link clicks to close sidebar on mobile
    const handleNavClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="/corporate/"]');
      if (link) {
        // Check if we're on mobile (check once, not per screen size change)
        const isMobile = window.innerWidth < 768;
        if (isMobile && sidebar && !sidebar.classList.contains('-translate-x-full')) {
          setTimeout(closeSidebar, 100);
        }
      }
    };

    // Close sidebar when route changes (mobile only)
    const handleRouteChange = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile && sidebar && !sidebar.classList.contains('-translate-x-full')) {
        closeSidebar();
      }
    };

    sidebarToggle?.addEventListener('click', openSidebar);
    sidebarClose?.addEventListener('click', closeSidebar);
    sidebarOverlay?.addEventListener('click', closeSidebar);
    
    // Add click listener to document for navigation links
    document.addEventListener('click', handleNavClick);
    
    // Close sidebar when pathname changes (mobile only)
    handleRouteChange();

    return () => {
      sidebarToggle?.removeEventListener('click', openSidebar);
      sidebarClose?.removeEventListener('click', closeSidebar);
      sidebarOverlay?.removeEventListener('click', closeSidebar);
      document.removeEventListener('click', handleNavClick);
    };
  }, [pathname]);

  return (
    <>
      {/* Mobile Overlay - visible only on mobile when sidebar is open */}
      <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 hidden" id="sidebar-overlay"></div>
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-64 bg-purple-100 shadow-lg flex flex-col transform -translate-x-full md:translate-x-0 transition-transform duration-300 z-50" id="sidebar">
        {/* Logo */}
        <div className="p-4 md:p-6 border-b border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl md:text-2xl font-bold text-purple-800">InsureLink</h1>
            <button className="md:hidden text-purple-800" id="sidebar-close">
              ✕
            </button>
          </div>
          <p className="text-xs md:text-sm text-purple-600">Corporate Portal</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 md:p-4 overflow-y-auto">
          <ul className="space-y-1 md:space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors text-sm md:text-base ${
                      isActive
                        ? 'bg-purple-200 text-purple-800 font-medium'
                        : 'text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <span className="text-base md:text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-2 md:p-4 border-t border-purple-200">
          <Link
            href="/login"
            className="flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 md:py-3 text-purple-700 hover:bg-purple-50 rounded-lg transition-colors w-full text-sm md:text-base"
          >
            <span className="text-base md:text-lg">🚪</span>
            <span>Logout</span>
          </Link>
        </div>
      </div>
      
      {/* Mobile Menu Button */}
      <button className="md:hidden fixed top-3 left-3 z-30 bg-purple-600 text-white p-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors" id="sidebar-toggle">
        <span className="text-lg font-bold">☰</span>
      </button>
    </>
  );
}
