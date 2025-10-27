'use client';

import HospitalSidebar from '@/components/hospital/HospitalSidebar';

export default function HospitalProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <HospitalSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hospital Profile</h1>
              <p className="text-gray-600">Manage your hospital information and settings</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Dr. Sarah Ahmed</p>
                <p className="text-sm text-gray-500">Chief Medical Officer</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Hospital Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
                    <input type="text" disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-100 cursor-not-allowed" defaultValue="City General Hospital" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                      <input type="text" disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-100 cursor-not-allowed" defaultValue="HSP-2023-4567" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Accreditation</label>
                      <input type="text" disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-100 cursor-not-allowed" defaultValue="JCI Accredited" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea rows={3} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-100 cursor-not-allowed" defaultValue="456 Health Street, Medical District, City, State 12345" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent" defaultValue="+1 (555) 789-0123" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency</label>
                      <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent" defaultValue="+1 (555) 911-0000" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-100 cursor-not-allowed" defaultValue="info@citygeneralhospital.com" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Facilities & Specializations</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Departments</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Emergency', 'Cardiology', 'Orthopedics', 'Neurology', 'Pediatrics', 'Surgery', 'Radiology', 'ICU'].map((dept) => (
                        <label key={dept} className="flex items-center cursor-not-allowed">
                          <input type="checkbox" disabled defaultChecked className="rounded border-gray-300 text-blue-600 bg-gray-100" />
                          <span className="ml-2 text-sm text-gray-500">{dept}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bed Capacity</label>
                      <input type="number" disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-100 cursor-not-allowed" defaultValue="250" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ICU Beds</label>
                      <input type="number" disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-100 cursor-not-allowed" defaultValue="30" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Only phone numbers can be updated. Other fields are locked and cannot be modified.
                </p>
              </div>

              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Update Phone Numbers
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Network Status</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-semibold text-gray-900">March 2022</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Partnered Insurers</p>
                    <p className="font-semibold text-gray-900">12</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Stats</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Total Patients</p>
                    <p className="text-2xl font-bold text-blue-600">1,247</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Claims This Month</p>
                    <p className="text-2xl font-bold text-green-600">342</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg. Approval Time</p>
                    <p className="text-2xl font-bold text-purple-600">2.3d</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}