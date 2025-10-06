export default function PatientClaimsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Claims</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + Submit New Claim
          </button>
        </div>

        <div className="space-y-4">
          {[
            { id: 'CLM-001', date: '2025-10-01', amount: '$1,200', status: 'Approved', color: 'green' },
            { id: 'CLM-002', date: '2025-09-28', amount: '$450', status: 'Processing', color: 'yellow' },
            { id: 'CLM-003', date: '2025-09-15', amount: '$2,800', status: 'Under Review', color: 'orange' },
          ].map((claim) => (
            <div key={claim.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{claim.id}</p>
                  <p className="text-sm text-gray-500">{claim.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{claim.amount}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full bg-${claim.color}-100 text-${claim.color}-800`}>
                    {claim.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

