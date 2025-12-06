import claims from '@/data/claims.json';
import type { Claim } from '@/types/claims';
import { formatPKRShort, formatPKR } from '@/lib/format';

export default function HospitalDashboard() {
  const allClaims = claims as Claim[];
  const revenueTodayNum = allClaims.reduce((s, c) => s + (c.amountClaimed || 0), 0);
  const pending = allClaims.filter((c) => c.status === 'Pending').length;
  const approvedToday = allClaims.filter((c) => c.status === 'Approved').length;

  const recent = allClaims.slice(0, 3).map((c) => ({ patient: c.employeeName || c.claimNumber, treatment: c.planId || '—', amount: formatPKR(c.amountClaimed || 0), status: c.status }));

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Hospital Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Patients Today</p>
          <p className="text-3xl font-bold text-blue-600">{(Math.floor(revenueTodayNum / 1000) % 100) + 20}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Pending Claims</p>
          <p className="text-3xl font-bold text-yellow-600">{pending}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Approved Today</p>
          <p className="text-3xl font-bold text-green-600">{approvedToday}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Revenue (total)</p>
          <p className="text-3xl font-bold text-purple-600">{formatPKRShort(revenueTodayNum)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Claims</h2>
          <div className="space-y-3">
            {recent.map((claim, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-medium">{claim.patient}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    claim.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {claim.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{claim.treatment}</span>
                  <span className="font-semibold">{claim.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Department Status</h2>
          <div className="space-y-3">
            {[
              { name: 'Emergency', patients: 12, status: 'busy' },
              { name: 'Cardiology', patients: 5, status: 'normal' },
              { name: 'Orthopedics', patients: 8, status: 'normal' },
              { name: 'Radiology', patients: 15, status: 'busy' },
            ].map((dept) => (
              <div key={dept.name} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{dept.name}</p>
                  <p className="text-sm text-gray-600">{dept.patients} patients</p>
                </div>
                <span className={`px-3 py-1 text-xs rounded-full ${
                  dept.status === 'busy' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {dept.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

