'use client';

import { useState } from 'react';
import HospitalSidebar from '@/components/hospital/HospitalSidebar';

export default function HospitalClaimsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <HospitalSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="ml-0 lg:ml-64 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Claims Management</h1>
                  <p className="text-xs lg:text-sm text-gray-600">Manage and track insurance claims</p>
                </div>
              </div>
              <div className="hidden lg:flex items-center space-x-2 lg:space-x-4">
                <button className="bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-blue-700 text-sm lg:text-base">
                  + Submit New Claim
                </button>
              </div>
            </div>
          </div>
          {/* Mobile button */}
          <div className="lg:hidden px-4 pt-2 pb-3">
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
              + Submit New Claim
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Today&apos;s Claims</p>
          <p className="text-2xl font-bold text-gray-900">12</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-600">15</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Approved Today</p>
          <p className="text-2xl font-bold text-green-600">28</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-blue-600">Rs. 45.2K</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-3 lg:p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
            <input
              type="text"
              placeholder="Search by claim ID or patient name..."
              className="flex-1 px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm lg:text-base"
            />
            <select className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm lg:text-base">
              <option>All Status</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
            <select className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm lg:text-base">
              <option>All Insurers</option>
              <option>HealthGuard Insurance</option>
              <option>MediCare Plus</option>
              <option>SecureHealth</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim ID</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="hidden md:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Treatment</th>
                <th className="hidden sm:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { id: 'HCL-892', patient: 'John Doe', treatment: 'General Checkup', date: '2025-10-06', amount: 'Rs. 250', status: 'Approved' },
                { id: 'HCL-891', patient: 'Mary Johnson', treatment: 'X-Ray Scan', date: '2025-10-06', amount: 'Rs. 450', status: 'Pending' },
                { id: 'HCL-890', patient: 'Robert Smith', treatment: 'Blood Test', date: '2025-10-05', amount: 'Rs. 120', status: 'Approved' },
                { id: 'HCL-889', patient: 'Emily Davis', treatment: 'Surgery', date: '2025-10-05', amount: 'Rs. 5,200', status: 'Pending' },
              ].map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50">
                  <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm font-medium text-gray-900">{claim.id}</td>
                  <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-900">{claim.patient}</td>
                  <td className="hidden md:table-cell px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-500">{claim.treatment}</td>
                  <td className="hidden sm:table-cell px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-500">{claim.date}</td>
                  <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-900">{claim.amount}</td>
                  <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      claim.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm">
                    <button className="text-blue-600 hover:text-blue-800">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </main>
      </div>
    </div>
  );
}

