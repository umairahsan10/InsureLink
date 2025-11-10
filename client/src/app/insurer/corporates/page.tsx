'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import CorporateEmployeesModal from '@/components/insurer/CorporateEmployeesModal';
import corporatesData from '@/data/corporates.json';
import notificationsData from '@/data/insurerNotifications.json';
import { AlertNotification } from '@/types';

export default function InsurerCorporatesPage() {
  const router = useRouter();
  const insurerNotifications = useMemo(
    () =>
      (notificationsData as AlertNotification[]).map((notification) => ({
        ...notification,
      })),
    []
  );
  const [selectedCorporate, setSelectedCorporate] = useState<{id: string, name: string} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const handleViewClick = (corporateId: string, corporateName: string) => {
    setSelectedCorporate({ id: corporateId, name: corporateName });
    setIsModalOpen(true);
    setOpenDropdownId(null);
  };

  const toggleDropdown = (corporateId: string) => {
    setOpenDropdownId(openDropdownId === corporateId ? null : corporateId);
  };

  return (
    <DashboardLayout
      userRole="insurer"
      userName="HealthGuard Insurance"
      notifications={insurerNotifications}
      onNotificationSelect={(notification) => {
        if (notification.category === 'messaging') {
          router.push('/insurer/claims');
        }
      }}
    >
      <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Corporate Clients</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Add Corporate
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Corporates</p>
          <p className="text-2xl font-bold text-gray-900">142</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Active Policies</p>
          <p className="text-2xl font-bold text-green-600">138</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Covered Employees</p>
          <p className="text-2xl font-bold text-blue-600">18.2K</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Monthly Premium</p>
          <p className="text-2xl font-bold text-purple-600">$1.8M</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search corporate clients..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>All Industries</option>
              <option>Technology</option>
              <option>Finance</option>
              <option>Healthcare</option>
              <option>Manufacturing</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>All Plans</option>
              <option>Basic</option>
              <option>Comprehensive</option>
              <option>Premium</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Industry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employees</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Premium</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {corporatesData.map((corporate) => (
                <tr key={corporate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{corporate.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Technology</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{corporate.totalEmployees}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Comprehensive</td>
                  <td className="px-6 py-4 text-sm text-gray-900">$45K</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm relative">
                    <div className="relative">
                      <button 
                        onClick={() => toggleDropdown(corporate.id)}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        Actions
                        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {openDropdownId === corporate.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenDropdownId(null)}
                          ></div>
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                            <button
                              onClick={() => handleViewClick(corporate.id, corporate.name)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              View Employees
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Corporate Employees Modal */}
      {selectedCorporate && (
        <CorporateEmployeesModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCorporate(null);
          }}
          corporateId={selectedCorporate.id}
          corporateName={selectedCorporate.name}
        />
      )}
    </DashboardLayout>
  );
}

