'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function HospitalSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleLogout = () => {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  };

  return (
    <div className="w-64 bg-green-600 shadow-lg relative">
      <div className="p-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-white">InsureLink</h1>
            <p className="text-green-100 text-sm">Hospital Portal</p>
          </div>
        </div>
      </div>

      <nav className="mt-8">
        <div className="px-6">
          <button
            onClick={() => router.push('/hospital/dashboard')}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors mb-2 ${
              isActive('/hospital/dashboard')
                ? 'bg-green-700 text-white'
                : 'text-green-100 hover:bg-green-700 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            Dashboard
          </button>
          
          <button
            onClick={() => router.push('/hospital/patient-details')}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors mb-2 ${
              isActive('/hospital/patient-details')
                ? 'bg-green-700 text-white'
                : 'text-green-100 hover:bg-green-700 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Patient Details
          </button>

          <button
            onClick={() => router.push('/hospital/claims')}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors mb-2 ${
              isActive('/hospital/claims')
                ? 'bg-green-700 text-white'
                : 'text-green-100 hover:bg-green-700 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Claims
          </button>

          <button
            onClick={() => router.push('/hospital/patients')}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors mb-2 ${
              isActive('/hospital/patients')
                ? 'bg-green-700 text-white'
                : 'text-green-100 hover:bg-green-700 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Patients
          </button>

          <button
            onClick={() => router.push('/hospital/profile')}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors mb-2 ${
              isActive('/hospital/profile')
                ? 'bg-green-700 text-white'
                : 'text-green-100 hover:bg-green-700 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </button>
        </div>
      </nav>

      <div className="absolute bottom-6 left-6 right-6 z-10">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-green-100 hover:bg-red-600 hover:text-white rounded-lg transition-colors bg-opacity-0 hover:bg-opacity-100"
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}
