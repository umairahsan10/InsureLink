'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import notificationsData from '@/data/insurerNotifications.json';
import hospitalsData from '@/data/hospitals.json';
import { AlertNotification } from '@/types';
import HospitalInfoDrawer from '@/components/hospitals/HospitalInfoDrawer';

interface HospitalRow {
  id: string;
  name: string;
  location: string;
  specializations: string;
  phone: string;
  address: string;
  status: 'Active' | 'Pending' | 'Rejected';
  city?: string;
  specialties?: string[];
  type?: string;
  tier?: string;
}

export default function InsurerHospitalsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [selectedHospital, setSelectedHospital] = useState<HospitalRow | null>(null);
  const [hospitalData, setHospitalData] = useState<HospitalRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  
  useEffect(() => {
    // Map the data from hospitals.json to match our HospitalRow interface
    const activeHospitals: HospitalRow[] = hospitalsData.map(hospital => {
      const hospitalId = hospital.id.toUpperCase();
      return {
        id: hospitalId,
        name: hospital.name,
        location: hospital.city,
        specializations: hospital.specialties?.join(', ') || 'General',
        phone: hospital.contact,
        address: hospital.address,
        status: 'Active' as const,
        city: hospital.city,
        specialties: hospital.specialties,
        type: hospital.type,
        tier: hospital.tier
      };
    });

    // Add some pending hospitals
    const pendingHospitals: HospitalRow[] = [
      {
        id: 'PEND-001',
        name: 'Al-Noor Specialized Hospital',
        location: 'Karachi',
        specializations: 'Cardiology, Neurology, General Surgery',
        phone: '+92-21-1234567',
        address: 'Main Boulevard, DHA Phase 5, Karachi',
        status: 'Pending' as const,
        city: 'Karachi',
        specialties: ['Cardiology', 'Neurology', 'General Surgery'],
        type: 'reimbursable',
        tier: 'Tier-2'
      },
      {
        id: 'PEND-002',
        name: 'Shaukat Khanum Cancer Hospital',
        location: 'Peshawar',
        specializations: 'Oncology, Radiotherapy, Hematology',
        phone: '+92-91-1234567',
        address: 'University Road, Peshawar Cantt',
        status: 'Pending' as const,
        city: 'Peshawar',
        specialties: ['Oncology', 'Radiotherapy', 'Hematology'],
        type: 'reimbursable',
        tier: 'Tier-1'
      },
      {
        id: 'PEND-003',
        name: 'Rawal General Hospital',
        location: 'Islamabad',
        specializations: 'General Medicine, Pediatrics, Gynecology',
        phone: '+92-51-1234567',
        address: 'Jinnah Avenue, Blue Area, Islamabad',
        status: 'Pending' as const,
        city: 'Islamabad',
        specialties: ['General Medicine', 'Pediatrics', 'Gynecology'],
        type: 'reimbursable',
        tier: 'Tier-2'
      }
    ];
    
    setHospitalData([...activeHospitals, ...pendingHospitals]);
    setIsLoading(false);
  }, []);

  const insurerNotifications = useMemo(
    () =>
      (notificationsData as AlertNotification[]).map((notification) => ({
        ...notification,
      })),
    []
  );

  const filteredHospitals = useMemo(() => {
    // Sort hospitals: Pending first, then Active
    const sortedHospitals = [...hospitalData].sort((a, b) => {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      return 0;
    });
    
    return sortedHospitals.filter(hospital => {
      const matchesSearch = searchQuery === '' || 
        hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (hospital.location && hospital.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (hospital.specializations && hospital.specializations.toLowerCase().includes(searchQuery.toLowerCase()));
        
      const matchesStatus = statusFilter === 'All Status' || hospital.status === statusFilter;
      const matchesLocation = locationFilter === 'All Locations' || 
        (hospital.location && hospital.location === locationFilter);
      
      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [hospitalData, searchQuery, statusFilter, locationFilter]);

  // Pagination
  const hospitalsPerPage = 10;
  const totalPages = Math.ceil(filteredHospitals.length / hospitalsPerPage);
  const paginatedHospitals = filteredHospitals.slice(
    (currentPage - 1) * hospitalsPerPage,
    currentPage * hospitalsPerPage
  );

  if (isLoading) {
    return (
      <DashboardLayout 
        userRole="insurer"
        userName="HealthGuard Insurance"
        notifications={[]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Network Hospitals</h1>
        <p className="text-lg text-gray-600">Manage and monitor your network of healthcare providers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Hospitals</p>
          <p className="text-2xl font-bold text-gray-900">{hospitalData.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Active Partners</p>
          <p className="text-2xl font-bold text-green-600">
            {hospitalData.filter((hospital) => hospital.status === 'Active').length}
          </p>
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
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase w-24">Hospital Name</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase w-12">Location</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase w-10">Specializations</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase w-16">Phone</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase w-12">Address</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase w-12">Status</th>
                <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase w-12">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {paginatedHospitals.map((hospital) => (
                <tr key={hospital.name} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-gray-900 w-24 break-words">{hospital.name}</td>
                  <td className="px-3 py-3 text-gray-500 w-12 break-words">{hospital.location}</td>
                  <td className="px-3 py-3 text-gray-500 w-10 break-words leading-tight">{hospital.specializations}</td>
                  <td className="px-3 py-3 text-gray-900 w-16 break-words">{hospital.phone}</td>
                  <td className="px-3 py-3 text-gray-500 w-12 break-words leading-tight">{hospital.address}</td>
                  <td className="px-3 py-3 text-sm w-12">
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
                  <td className="px-3 py-3 text-sm w-12">
                    <button 
                      onClick={() => setSelectedHospital(hospital)}
                      className="text-blue-600 hover:text-blue-800 text-[10px]"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * hospitalsPerPage) + 1} to {Math.min(currentPage * hospitalsPerPage, filteredHospitals.length)} of {filteredHospitals.length} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      currentPage === page
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <HospitalInfoDrawer
        hospital={selectedHospital}
        isOpen={Boolean(selectedHospital)}
        onClose={() => setSelectedHospital(null)}
        onDecision={(hospitalId, action) => {
          setHospitalData((prev) =>
            prev.map((hospital) =>
              hospital.id === hospitalId
                ? { ...hospital, status: action === 'approve' ? 'Active' : 'Rejected' }
                : hospital
            )
          );
          setSelectedHospital((prev) =>
            prev
              ? {
                  ...prev,
                  status: action === 'approve' ? 'Active' : 'Rejected'
                }
              : prev
          );
        }}
      />
      </div>
    </DashboardLayout>
  );
}

