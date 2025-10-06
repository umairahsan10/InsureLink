export default function HospitalPatientsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Patient Records</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Register Patient
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Patients</p>
          <p className="text-2xl font-bold text-gray-900">1,247</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Today&apos;s Visits</p>
          <p className="text-2xl font-bold text-blue-600">42</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">With Insurance</p>
          <p className="text-2xl font-bold text-green-600">1,156</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Pending Verification</p>
          <p className="text-2xl font-bold text-orange-600">8</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search by name or patient ID..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>All Patients</option>
              <option>Today&apos;s Visits</option>
              <option>This Week</option>
              <option>Insured</option>
              <option>Uninsured</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Visit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Insurance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { id: 'PAT-1247', name: 'John Doe', age: 45, lastVisit: '2025-10-06', insurance: 'HealthGuard', status: 'Active' },
                { id: 'PAT-1246', name: 'Mary Johnson', age: 32, lastVisit: '2025-10-06', insurance: 'MediCare Plus', status: 'Active' },
                { id: 'PAT-1245', name: 'Robert Smith', age: 58, lastVisit: '2025-10-05', insurance: 'SecureHealth', status: 'Active' },
                { id: 'PAT-1244', name: 'Emily Davis', age: 29, lastVisit: '2025-10-05', insurance: 'HealthGuard', status: 'Active' },
                { id: 'PAT-1243', name: 'Michael Wilson', age: 67, lastVisit: '2025-10-04', insurance: 'None', status: 'Uninsured' },
              ].map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{patient.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{patient.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{patient.age}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{patient.lastVisit}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{patient.insurance}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      patient.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.status}
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

