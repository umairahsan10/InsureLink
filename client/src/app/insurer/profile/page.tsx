'use client';

import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function InsurerProfilePage() {
  return (
    <DashboardLayout userRole="insurer" userName="HealthGuard Insurance">
      <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Insurer Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Company Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Company Name</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" defaultValue="HealthGuard Insurance" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">License Number</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" defaultValue="INS-2020-8901" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Registration Number</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" defaultValue="REG-12345-HG" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Headquarters Address</label>
                <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" defaultValue="789 Insurance Plaza, Financial District, Metro City, MC 67890" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Phone</label>
                  <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" defaultValue="+1 (800) 555-1234" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Support Email</label>
                  <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" defaultValue="support@healthguard.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Website</label>
                <input type="url" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" defaultValue="https://www.healthguard.com" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Coverage & Plans</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Available Plans</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Basic Coverage', 'Comprehensive', 'Premium', 'Family Plans', 'Corporate Group', 'Senior Care'].map((plan) => (
                    <label key={plan} className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600" />
                      <span className="ml-2 text-sm text-gray-900">{plan}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Max Coverage Limit</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" defaultValue="$500,000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Claim Processing Time</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" defaultValue="2-3 business days" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Network Coverage Areas</label>
                <textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" defaultValue="Nationwide coverage with partner hospitals across 45 states" />
              </div>
            </div>
          </div>

          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Save Changes
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Account Status</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-900">Status</p>
                <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                  Active & Verified
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-900">Operating Since</p>
                <p className="font-semibold">January 2020</p>
              </div>
              <div>
                <p className="text-sm text-gray-900">License Expiry</p>
                <p className="font-semibold">December 2028</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Network Overview</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-900">Partner Hospitals</p>
                <p className="text-2xl font-bold text-blue-600">85</p>
              </div>
              <div>
                <p className="text-sm text-gray-900">Corporate Clients</p>
                <p className="text-2xl font-bold text-green-600">142</p>
              </div>
              <div>
                <p className="text-sm text-gray-900">Active Policyholders</p>
                <p className="text-2xl font-bold text-purple-600">28.5K</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Monthly Stats</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-900">Claims Processed</p>
                <p className="text-2xl font-bold text-blue-600">1,247</p>
              </div>
              <div>
                <p className="text-sm text-gray-900">Approval Rate</p>
                <p className="text-2xl font-bold text-green-600">87%</p>
              </div>
              <div>
                <p className="text-sm text-gray-900">Total Payout</p>
                <p className="text-2xl font-bold text-orange-600">$2.8M</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}

