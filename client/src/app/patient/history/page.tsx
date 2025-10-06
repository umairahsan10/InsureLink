export default function PatientHistoryPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Claim History</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search claims..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>All Time</option>
              <option>This Year</option>
              <option>Last 6 Months</option>
              <option>Last 3 Months</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hospital</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { id: 'CLM-001', date: '2025-10-01', hospital: 'City General', amount: '$1,200', status: 'Approved' },
                { id: 'CLM-002', date: '2025-09-28', hospital: 'St. Mary&apos;s', amount: '$450', status: 'Processing' },
                { id: 'CLM-003', date: '2025-09-15', hospital: 'County Hospital', amount: '$2,800', status: 'Approved' },
                { id: 'CLM-004', date: '2025-08-22', hospital: 'Metro Clinic', amount: '$650', status: 'Approved' },
                { id: 'CLM-005', date: '2025-07-10', hospital: 'City General', amount: '$3,200', status: 'Approved' },
              ].map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{claim.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{claim.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{claim.hospital}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{claim.amount}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      claim.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {claim.status}
                    </span>
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

