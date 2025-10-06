export default function HospitalClaimsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Claims Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Submit New Claim
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Today&apos;s Claims</p>
          <p className="text-2xl font-bold text-gray-900">12</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-600">15</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Approved Today</p>
          <p className="text-2xl font-bold text-green-600">28</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-blue-600">$45.2K</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search by claim ID or patient name..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>All Status</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>All Insurers</option>
              <option>HealthGuard Insurance</option>
              <option>MediCare Plus</option>
              <option>SecureHealth</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Treatment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { id: 'HCL-892', patient: 'John Doe', treatment: 'General Checkup', date: '2025-10-06', amount: '$250', status: 'Approved' },
                { id: 'HCL-891', patient: 'Mary Johnson', treatment: 'X-Ray Scan', date: '2025-10-06', amount: '$450', status: 'Pending' },
                { id: 'HCL-890', patient: 'Robert Smith', treatment: 'Blood Test', date: '2025-10-05', amount: '$120', status: 'Approved' },
                { id: 'HCL-889', patient: 'Emily Davis', treatment: 'Surgery', date: '2025-10-05', amount: '$5,200', status: 'Pending' },
              ].map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{claim.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{claim.patient}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{claim.treatment}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{claim.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{claim.amount}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      claim.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {claim.status}
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
  );
}

