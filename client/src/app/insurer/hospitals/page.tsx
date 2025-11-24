'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import notificationsData from '@/data/insurerNotifications.json';
import { AlertNotification } from '@/types';
import HospitalInfoDrawer from '@/components/hospitals/HospitalInfoDrawer';

interface HospitalRow {
  id: string;
  name: string;
  location: string;
  specializations: string;
  claims: number;
  rating: number;
  status: string;
}

const initialHospitals: HospitalRow[] = [
    {
      id: 'HOSP-001',
      name: 'City General Hospital',
      location: 'Islamabad',
      specializations: 'Emergency, Cardiology, Orthopedics, General Surgery',
      claims: 342,
      rating: 4.8,
      status: 'Active'
    },
    {
      id: 'HOSP-002',
      name: 'National Hospital',
      location: 'Lahore',
      specializations: 'Oncology, Neurology, Pediatrics, Cardiology',
      claims: 289,
      rating: 4.7,
      status: 'Active'
    },
    {
      id: 'HOSP-003',
      name: 'Aga Khan University Hospital',
      location: 'Karachi',
      specializations: 'Multi-specialty, Advanced Surgery, Cancer Treatment, Maternity',
      claims: 412,
      rating: 4.9,
      status: 'Active'
    },
    {
      id: 'HOSP-004',
      name: 'Services Hospital',
      location: 'Lahore',
      specializations: 'Emergency, Surgery, Internal Medicine, Radiology',
      claims: 198,
      rating: 4.5,
      status: 'Pending'
    },
    {
      id: 'HOSP-005',
      name: 'Jinnah Hospital',
      location: 'Lahore',
      specializations: 'Emergency Care, Surgery, Cardiology, Orthopedics',
      claims: 156,
      rating: 4.4,
      status: 'Pending'
    }
  ];
  
export default function InsurerHospitalsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [selectedHospital, setSelectedHospital] = useState<HospitalRow | null>(null);
  const [hospitalData, setHospitalData] = useState<HospitalRow[]>(initialHospitals);
  const insurerNotifications = useMemo(
    () =>
      (notificationsData as AlertNotification[]).map((notification) => ({
        ...notification,
      })),
    []
  );
  
  const filteredHospitals = hospitalData.filter(h => {
    const matchesSearch = searchQuery === '' || h.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || h.status === statusFilter;
    const matchesLocation = locationFilter === 'All Locations' || h.location === locationFilter;
    return matchesSearch && matchesStatus && matchesLocation;
  });
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
        <h1 className="text-3xl font-bold text-gray-900">Network Hospitals</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Hospitals</p>
          <p className="text-2xl font-bold text-gray-900">85</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Active Partners</p>
          <p className="text-2xl font-bold text-green-600">82</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600">
            {hospitalData.filter((hospital) => hospital.status === 'Pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Claims</p>
          <p className="text-2xl font-bold text-blue-600">12.4K</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search hospitals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Pending</option>
              <option>Inactive</option>
            </select>
            <select 
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option>All Locations</option>
              <option>Islamabad</option>
              <option>Lahore</option>
              <option>Karachi</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hospital Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specializations</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claims/Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredHospitals.map((hospital) => (
                <tr key={hospital.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{hospital.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{hospital.location}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{hospital.specializations}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{hospital.claims > 0 ? hospital.claims : '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    {hospital.rating > 0 ? (
                      <span className="text-yellow-600">★ {hospital.rating}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      hospital.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : hospital.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {hospital.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button 
                      onClick={() => setSelectedHospital(hospital)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <HospitalInfoDrawer
        hospital={selectedHospital}
        isOpen={Boolean(selectedHospital)}
        onClose={() => setSelectedHospital(null)}
        onDecision={(hospitalId, action) => {
          setHospitalData((prev) =>
            prev.map((hospital) =>
              hospital.id === hospitalId
                ? { ...hospital, status: action === 'approve' ? 'Active' : 'Inactive' }
                : hospital
            )
          );
          setSelectedHospital((prev) =>
            prev
              ? {
                  ...prev,
                  status: action === 'approve' ? 'Active' : 'Inactive'
                }
              : prev
          );
        }}
      />
      </div>
    </DashboardLayout>
  );
}

