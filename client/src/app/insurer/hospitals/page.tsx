'use client';

import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function InsurerHospitalsPage() {
  return (
    <DashboardLayout userRole="insurer" userName="HealthGuard Insurance">
      <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Network Hospitals</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Add Hospital
        </button>
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
          <p className="text-2xl font-bold text-yellow-600">3</p>
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
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>All Status</option>
              <option>Active</option>
              <option>Pending</option>
              <option>Inactive</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>All Locations</option>
              <option>North Region</option>
              <option>South Region</option>
              <option>East Region</option>
              <option>West Region</option>
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
              {[
                { name: 'City General Hospital', location: 'Downtown', specializations: 'Multi-specialty', claims: 342, rating: 4.8, status: 'Active' },
                { name: 'St. Mary&apos;s Medical Center', location: 'Northside', specializations: 'Cardiology, Neurology', claims: 289, rating: 4.6, status: 'Active' },
                { name: 'County Hospital', location: 'Westside', specializations: 'Emergency, Surgery', claims: 412, rating: 4.5, status: 'Active' },
                { name: 'Metro Clinic', location: 'Eastside', specializations: 'Outpatient Care', claims: 156, rating: 4.3, status: 'Active' },
                { name: 'Regional Medical Center', location: 'Southside', specializations: 'Multi-specialty', claims: 0, rating: 0, status: 'Pending' },
              ].map((hospital) => (
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
                      hospital.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {hospital.status}
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
      </div>
    </DashboardLayout>
  );
}

