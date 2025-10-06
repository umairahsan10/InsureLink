export default function InsurerCorporatesPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Corporate Clients</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Add Corporate
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Corporates</p>
          <p className="text-2xl font-bold text-gray-900">142</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Active Policies</p>
          <p className="text-2xl font-bold text-green-600">138</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Covered Employees</p>
          <p className="text-2xl font-bold text-blue-600">18.2K</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Monthly Premium</p>
          <p className="text-2xl font-bold text-purple-600">$1.8M</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search corporate clients..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>All Industries</option>
              <option>Technology</option>
              <option>Finance</option>
              <option>Healthcare</option>
              <option>Manufacturing</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>All Plans</option>
              <option>Basic</option>
              <option>Comprehensive</option>
              <option>Premium</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Industry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employees</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Premium</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { name: 'Acme Corporation', industry: 'Technology', employees: 250, plan: 'Comprehensive', premium: '$45K', status: 'Active' },
                { name: 'TechStart Inc.', industry: 'Technology', employees: 120, plan: 'Premium', premium: '$38K', status: 'Active' },
                { name: 'Finance Global LLC', industry: 'Finance', employees: 480, plan: 'Premium', premium: '$125K', status: 'Active' },
                { name: 'HealthCare Solutions', industry: 'Healthcare', employees: 340, plan: 'Comprehensive', premium: '$68K', status: 'Active' },
                { name: 'Manufacturing Co.', industry: 'Manufacturing', employees: 580, plan: 'Basic', premium: '$85K', status: 'Renewal Due' },
              ].map((corporate) => (
                <tr key={corporate.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{corporate.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{corporate.industry}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{corporate.employees}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{corporate.plan}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{corporate.premium}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      corporate.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {corporate.status}
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

