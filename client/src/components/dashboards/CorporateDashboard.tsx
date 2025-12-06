import claims from '@/data/claims.json';
import type { Claim } from '@/types/claims';
import { formatPKRShort } from '@/lib/format';

export default function CorporateDashboard() {
  const allClaims = claims as Claim[];
  const totalEmployees = 250; // placeholder - corporate metadata not available here
  const activePolicies = 248; // placeholder
  const activeClaims = allClaims.filter((c) => c.status === 'Pending').length;
  const monthlyPremium = allClaims.reduce((s, c) => s + (c.amountClaimed || 0), 0) / 12;

  const recent = allClaims.slice(0, 3).map((c) => ({ employee: c.employeeName || c.claimNumber, amount: formatPKRShort(c.amountClaimed || 0), status: c.status }));

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Corporate Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Total Employees</p>
          <p className="text-3xl font-bold text-blue-600">{totalEmployees}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Active Policies</p>
          <p className="text-3xl font-bold text-green-600">{activePolicies}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Active Claims</p>
          <p className="text-3xl font-bold text-orange-600">{activeClaims}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Monthly Premium</p>
          <p className="text-3xl font-bold text-purple-600">{formatPKRShort(Math.round(monthlyPremium))}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Claims</h2>
          <div className="space-y-3">
            {recent.map((claim, idx) => (
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Plan Distribution</h2>
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

