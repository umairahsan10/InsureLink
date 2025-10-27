'use client';

import HospitalSidebar from '@/components/hospital/HospitalSidebar';

export default function HospitalPatientsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <HospitalSidebar />

      {/* Main Content */}
      <div className="ml-64 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Records</h1>
              <p className="text-gray-600">Manage patient information and records</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                + Register Patient
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Dr. Sarah Ahmed</p>
                <p className="text-sm text-gray-500">Chief Medical Officer</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search by name or patient ID..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <select className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option>All Patients</option>
              <option>Today&apos;s Visits</option>
              <option>This Week</option>
              <option>Insured</option>
              <option>Uninsured</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Visit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Insurance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { id: 'PAT-1247', name: 'John Doe', age: 45, lastVisit: '2025-10-06', insurance: 'HealthGuard', status: 'Active' },
                { id: 'PAT-1246', name: 'Mary Johnson', age: 32, lastVisit: '2025-10-06', insurance: 'MediCare Plus', status: 'Active' },
                { id: 'PAT-1245', name: 'Robert Smith', age: 58, lastVisit: '2025-10-05', insurance: 'SecureHealth', status: 'Active' },
                { id: 'PAT-1244', name: 'Emily Davis', age: 29, lastVisit: '2025-10-05', insurance: 'HealthGuard', status: 'Active' },
                { id: 'PAT-1243', name: 'Michael Wilson', age: 67, lastVisit: '2025-10-04', insurance: 'None', status: 'Uninsured' },
              ].map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{patient.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{patient.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{patient.age}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{patient.lastVisit}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{patient.insurance}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      patient.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-blue-600 hover:text-blue-800">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </main>
      </div>
    </div>
  );
}

