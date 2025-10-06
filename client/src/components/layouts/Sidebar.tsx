import Link from 'next/link';

interface SidebarProps {
  userRole: 'patient' | 'corporate' | 'hospital' | 'insurer';
}

const menuItems = {
  patient: [
    { name: 'Dashboard', href: '/patient/dashboard', icon: '📊' },
    { name: 'My Claims', href: '/patient/claims', icon: '📋' },
    { name: 'Profile', href: '/patient/profile', icon: '👤' },
    { name: 'History', href: '/patient/history', icon: '📜' },
  ],
  corporate: [
    { name: 'Dashboard', href: '/corporate/dashboard', icon: '📊' },
    { name: 'Claims', href: '/corporate/claims', icon: '📋' },
    { name: 'Employees', href: '/corporate/employees', icon: '👥' },
    { name: 'Plans', href: '/corporate/plans', icon: '📦' },
    { name: 'Profile', href: '/corporate/profile', icon: '🏢' },
  ],
  hospital: [
    { name: 'Dashboard', href: '/hospital/dashboard', icon: '📊' },
    { name: 'Claims', href: '/hospital/claims', icon: '📋' },
    { name: 'Patients', href: '/hospital/patients', icon: '🏥' },
    { name: 'Profile', href: '/hospital/profile', icon: '⚕️' },
  ],
  insurer: [
    { name: 'Dashboard', href: '/insurer/dashboard', icon: '📊' },
    { name: 'Claims', href: '/insurer/claims', icon: '📋' },
    { name: 'Hospitals', href: '/insurer/hospitals', icon: '🏥' },
    { name: 'Corporates', href: '/insurer/corporates', icon: '🏢' },
    { name: 'Profile', href: '/insurer/profile', icon: '🛡️' },
  ],
};

export default function Sidebar({ userRole }: SidebarProps) {
  const items = menuItems[userRole];

  return (
    <aside className="w-64 bg-white shadow-lg min-h-screen">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">InsureLink</h1>
        <p className="text-sm text-gray-500 capitalize">{userRole} Portal</p>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

