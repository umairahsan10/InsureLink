export default function InsurerDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Insurer Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Claims This Month</p>
          <p className="text-3xl font-bold text-blue-600">1,247</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Pending Review</p>
          <p className="text-3xl font-bold text-yellow-600">83</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Approval Rate</p>
          <p className="text-3xl font-bold text-green-600">87%</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Total Payout</p>
          <p className="text-3xl font-bold text-purple-600">Rs. 2.8M</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">High Priority Claims</h2>
          <div className="space-y-3">
            {[
              { id: 'CLM-8921', patient: 'John Doe', amount: 'Rs. 5,200', hospital: 'City General' },
              { id: 'CLM-8920', patient: 'Mary Johnson', amount: 'Rs. 3,100', hospital: 'St. Mary\'s' },
              { id: 'CLM-8919', patient: 'Robert Smith', amount: 'Rs. 4,800', hospital: 'County Hospital' },
            ].map((claim) => (
              <div key={claim.id} className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="font-medium">{claim.id}</p>
                    <p className="text-sm text-gray-600">{claim.patient}</p>
                  </div>
                  <span className="font-semibold text-lg">{claim.amount}</span>
                </div>
                <p className="text-xs text-gray-500">{claim.hospital}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Network Summary</h2>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Partner Hospitals</span>
                <span className="text-2xl font-bold text-blue-600">85</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">3 pending approval</p>
            </div>
            
            <div className="p-3 bg-green-50 rounded">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Corporate Clients</span>
                <span className="text-2xl font-bold text-green-600">142</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">18,200 covered employees</p>
            </div>
            
            <div className="p-3 bg-purple-50 rounded">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Individual Policies</span>
                <span className="text-2xl font-bold text-purple-600">10.3K</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Active policyholders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

