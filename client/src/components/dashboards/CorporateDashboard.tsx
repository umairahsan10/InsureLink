export default function CorporateDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Corporate Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Total Employees</p>
          <p className="text-3xl font-bold text-blue-600">250</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Active Policies</p>
          <p className="text-3xl font-bold text-green-600">248</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Active Claims</p>
          <p className="text-3xl font-bold text-orange-600">18</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Monthly Premium</p>
          <p className="text-3xl font-bold text-purple-600">Rs. 45K</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Claims</h2>
          <div className="space-y-3">
            {[
              { employee: 'Sarah Johnson', amount: 'Rs. 1,800', status: 'Approved' },
              { employee: 'Mike Davis', amount: 'Rs. 920', status: 'Pending' },
              { employee: 'Emily Chen', amount: 'Rs. 2,400', status: 'Approved' },
            ].map((claim, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <p className="font-medium">{claim.employee}</p>
                <div className="text-right">
                  <p className="font-semibold">{claim.amount}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    claim.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {claim.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Plan Distribution</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Basic Plan</span>
              <span className="font-semibold">50 employees</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{width: '20%'}}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Comprehensive</span>
              <span className="font-semibold">150 employees</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{width: '60%'}}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Premium Plan</span>
              <span className="font-semibold">50 employees</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{width: '20%'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

