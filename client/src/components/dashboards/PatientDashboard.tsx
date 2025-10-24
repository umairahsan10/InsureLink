export default function PatientDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Patient Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Active Claims</p>
          <p className="text-3xl font-bold text-blue-600">3</p>
          <p className="text-sm text-gray-600 mt-2">2 approved, 1 pending</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Total Coverage</p>
          <p className="text-3xl font-bold text-green-600">Rs. 50,000</p>
          <p className="text-sm text-gray-600 mt-2">Available this year</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Used This Year</p>
          <p className="text-3xl font-bold text-purple-600">Rs. 12,450</p>
          <p className="text-sm text-gray-600 mt-2">75% remaining</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Claims</h2>
          <div className="space-y-3">
            {[
              { id: 'CLM-001', date: '2025-10-01', amount: 'Rs. 1,200', status: 'Approved' },
              { id: 'CLM-002', date: '2025-09-28', amount: 'Rs. 450', status: 'Processing' },
            ].map((claim) => (
              <div key={claim.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{claim.id}</p>
                  <p className="text-sm text-gray-500">{claim.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{claim.amount}</p>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    {claim.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Policy Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Policy Number</span>
              <span className="font-semibold">POL-2024-001234</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type</span>
              <span className="font-semibold">Comprehensive</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Renewal Date</span>
              <span className="font-semibold">Dec 31, 2025</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

