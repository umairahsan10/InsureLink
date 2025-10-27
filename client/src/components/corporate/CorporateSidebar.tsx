'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationItems = [
  { name: 'Dashboard', href: '/corporate/dashboard', icon: '📊' },
  { name: 'Employees', href: '/corporate/employees', icon: '👥' },
  { name: 'Claims Overview', href: '/corporate/claims', icon: '📋' },
  { name: 'Settings', href: '/corporate/profile', icon: '⚙️' },
];

export default function CorporateSidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-purple-100 shadow-lg flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-purple-200">
        <h1 className="text-2xl font-bold text-purple-800">InsureLink</h1>
        <p className="text-sm text-purple-600">Corporate Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-purple-200 text-purple-800 font-medium'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-purple-200">
        <Link
          href="/login"
          className="flex items-center space-x-3 px-4 py-3 text-purple-700 hover:bg-purple-50 rounded-lg transition-colors w-full"
        >
          <span className="text-lg">🚪</span>
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
}
