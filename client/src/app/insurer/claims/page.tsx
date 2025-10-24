'use client';

import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function InsurerClaimsPage() {
  return (
    <DashboardLayout userRole="insurer" userName="HealthGuard Insurance">
      <div className="p-8 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Claims Processing</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Claims</p>
          <p className="text-2xl font-bold text-gray-900">1,247</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-600">83</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-bold text-green-600">1,089</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-2xl font-bold text-red-600">75</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Payout</p>
          <p className="text-2xl font-bold text-blue-600">$2.8M</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search by claim ID, patient, or hospital..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>All Status</option>
              <option>Pending</option>
              <option>Under Review</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>All Hospitals</option>
              <option>City General</option>
              <option>St. Mary&apos;s</option>
              <option>County Hospital</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>This Month</option>
              <option>Today</option>
              <option>This Week</option>
              <option>Last 3 Months</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hospital</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { id: 'CLM-8921', patient: 'John Doe', hospital: 'City General', date: '2025-10-06', amount: '$1,250', priority: 'High', status: 'Pending' },
                { id: 'CLM-8920', patient: 'Mary Johnson', hospital: 'St. Mary&apos;s', date: '2025-10-06', amount: '$450', priority: 'Normal', status: 'Under Review' },
                { id: 'CLM-8919', patient: 'Robert Smith', hospital: 'County Hospital', date: '2025-10-05', amount: '$5,200', priority: 'High', status: 'Approved' },
                { id: 'CLM-8918', patient: 'Emily Davis', hospital: 'City General', date: '2025-10-05', amount: '$820', priority: 'Normal', status: 'Approved' },
                { id: 'CLM-8917', patient: 'Michael Wilson', hospital: 'Metro Clinic', date: '2025-10-04', amount: '$3,100', priority: 'Normal', status: 'Rejected' },
              ].map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{claim.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{claim.patient}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{claim.hospital}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{claim.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{claim.amount}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      claim.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {claim.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      claim.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      claim.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      claim.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-blue-600 hover:text-blue-800 mr-2">Review</button>
                    <button className="text-gray-600 hover:text-gray-800">View</button>
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

