export default function CorporateEmployeesPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Employees</p>
          <p className="text-2xl font-bold text-gray-900">250</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Active Policies</p>
          <p className="text-2xl font-bold text-green-600">248</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Pending Enrollment</p>
          <p className="text-2xl font-bold text-orange-600">2</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search employees..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>All Departments</option>
              <option>Engineering</option>
              <option>Sales</option>
              <option>HR</option>
              <option>Marketing</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Policy Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Join Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { name: 'Sarah Johnson', id: 'EMP-001', dept: 'Engineering', status: 'Active', date: '2023-01-15' },
                { name: 'Mike Davis', id: 'EMP-002', dept: 'Sales', status: 'Active', date: '2023-03-22' },
                { name: 'Emily Chen', id: 'EMP-003', dept: 'HR', status: 'Active', date: '2022-11-08' },
                { name: 'James Wilson', id: 'EMP-004', dept: 'Marketing', status: 'Pending', date: '2025-10-01' },
                { name: 'Lisa Anderson', id: 'EMP-005', dept: 'Engineering', status: 'Active', date: '2024-06-12' },
              ].map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{employee.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{employee.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{employee.dept}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{employee.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

