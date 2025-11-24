'use client';

import { useMemo, useState } from 'react';
import PatientDetailsModal from '@/components/modals/PatientDetailsModal';
import PatientRegistrationModal from '@/components/modals/PatientRegistrationModal';

export default function HospitalPatientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframeFilter, setTimeframeFilter] = useState('All Patients');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isPatientDetailsOpen, setIsPatientDetailsOpen] = useState(false);

  const patients = useMemo(
    () => [
      { id: 'PAT-1247', name: 'John Doe', age: 45, lastVisit: '2025-10-06', insurance: 'HealthGuard', status: 'Active', insured: true, lastVisitDate: new Date('2025-10-06') },
      { id: 'PAT-1246', name: 'Mary Johnson', age: 32, lastVisit: '2025-10-06', insurance: 'MediCare Plus', status: 'Active', insured: true, lastVisitDate: new Date('2025-10-06') },
      { id: 'PAT-1245', name: 'Robert Smith', age: 58, lastVisit: '2025-10-05', insurance: 'SecureHealth', status: 'Active', insured: true, lastVisitDate: new Date('2025-10-05') },
      { id: 'PAT-1244', name: 'Emily Davis', age: 29, lastVisit: '2025-10-05', insurance: 'HealthGuard', status: 'Active', insured: true, lastVisitDate: new Date('2025-10-05') },
      { id: 'PAT-1243', name: 'Michael Wilson', age: 67, lastVisit: '2025-10-04', insurance: 'None', status: 'Uninsured', insured: false, lastVisitDate: new Date('2025-10-04') }
    ],
    []
  );

  const filteredPatients = useMemo(() => {
    const today = new Date('2025-10-06');
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    return patients.filter((patient) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        timeframeFilter === 'All Patients' ||
        (timeframeFilter === "Today's Visits" &&
          patient.lastVisitDate.toDateString() === today.toDateString()) ||
        (timeframeFilter === 'This Week' &&
          patient.lastVisitDate >= sevenDaysAgo &&
          patient.lastVisitDate <= today) ||
        (timeframeFilter === 'Insured' && patient.insured) ||
        (timeframeFilter === 'Uninsured' && !patient.insured);

      return matchesSearch && matchesFilter;
    });
  }, [patients, searchQuery, timeframeFilter]);
  
  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Patient Records</h1>
          <p className="text-xs lg:text-sm text-gray-600">Manage patient information and records</p>
        </div>
        <button 
          onClick={() => setIsRegisterModalOpen(true)}
          className="bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-blue-700 text-sm lg:text-base"
        >
          + Register Patient
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Patients</p>
          <p className="text-2xl font-bold text-gray-900">1,247</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Today&apos;s Visits</p>
          <p className="text-2xl font-bold text-blue-600">42</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">With Insurance</p>
          <p className="text-2xl font-bold text-green-600">1,156</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Pending Verification</p>
          <p className="text-2xl font-bold text-orange-600">8</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-3 lg:p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
            <input
              type="text"
              placeholder="Search by name or patient ID..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="flex-1 px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm lg:text-base"
            />
            <select
              value={timeframeFilter}
              onChange={(event) => setTimeframeFilter(event.target.value)}
              className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm lg:text-base"
            >
              <option>All Patients</option>
              <option>Today&apos;s Visits</option>
              <option>This Week</option>
              <option>Insured</option>
              <option>Uninsured</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient ID</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="hidden sm:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                <th className="hidden md:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Visit</th>
                <th className="hidden md:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Insurance</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    No patients match your current filters.
                  </td>
                </tr>
              ) : (
              filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm font-medium text-gray-900">{patient.id}</td>
                  <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-900">{patient.name}</td>
                  <td className="hidden sm:table-cell px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-500">{patient.age}</td>
                  <td className="hidden md:table-cell px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-500">{patient.lastVisit}</td>
                  <td className="hidden md:table-cell px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-500">{patient.insurance}</td>
                  <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      patient.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm">
                    <button 
                      onClick={() => {
                        setSelectedPatientId(patient.id);
                        setIsPatientDetailsOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
      
      <PatientRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
      
      {selectedPatientId && (
        <PatientDetailsModal
          isOpen={isPatientDetailsOpen}
          onClose={() => {
            setIsPatientDetailsOpen(false);
            setSelectedPatientId(null);
          }}
          patientId={selectedPatientId}
          patientData={patients.find(p => p.id === selectedPatientId)}
        />
      )}
    </div>
  );
}

