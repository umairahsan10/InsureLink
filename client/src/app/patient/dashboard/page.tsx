'use client';

import Card from '@/components/shared/Card';
import ClaimStatusBadge from '@/components/claims/ClaimStatusBadge';

// Mock data for a specific patient (employeeId: emp-001 - Ali Raza)
const patientData = {
  patientId: 'emp-001',
  patientName: 'Ali Raza',
  // Overview statistics
  totalClaims: 4,
  approvedClaims: 2,
  totalReimbursed: 450,
  pendingClaims: 1,
  approvalRate: 75,
  
  // Recent claims data mapped from existing claims
  recentClaims: [
    {
      id: 'clm-0001',
      claimNumber: 'CLM-2024-001',
      name: 'Dental Cleaning',
      amount: 150,
      status: 'Paid' as const,
      date: '2025-09-30',
      icon: '✓'
    },
    {
      id: 'clm-0006',
      claimNumber: 'CLM-2024-002', 
      name: 'Annual Physical',
      amount: 300,
      status: 'Approved' as const,
      date: '2025-09-05',
      icon: '✓'
    },
    {
      id: 'clm-0012',
      claimNumber: 'CLM-2024-003',
      name: 'Prescription Refill',
      amount: 45,
      status: 'Submitted' as const,
      date: '2025-10-04',
      icon: '⏰'
    }
  ],
  
  // Coverage balance data
  coverageBalance: [
    {
      category: 'Medical',
      used: 2500,
      total: 5000,
      percentage: 50
    },
    {
      category: 'Dental', 
      used: 850,
      total: 1500,
      percentage: 57
    },
    {
      category: 'Vision',
      used: 200,
      total: 500,
      percentage: 40
    }
  ]
};

export default function PatientDashboardPage() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Claims Card */}
        <Card className="relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Claims</p>
              <p className="text-3xl font-bold text-gray-900">{patientData.totalClaims}</p>
              <p className="text-sm text-gray-500 mt-1">This year</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Approved Claims Card */}
        <Card className="relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Approved Claims</p>
              <p className="text-3xl font-bold text-gray-900">{patientData.approvedClaims}</p>
              <p className="text-sm text-gray-500 mt-1">{patientData.approvalRate}% approval rate</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Total Reimbursed Card */}
        <Card className="relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Reimbursed</p>
              <p className="text-3xl font-bold text-gray-900">Rs. {patientData.totalReimbursed}</p>
              <p className="text-sm text-gray-500 mt-1">This year</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Pending Claims Card */}
        <Card className="relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Pending Claims</p>
              <p className="text-3xl font-bold text-gray-900">{patientData.pendingClaims}</p>
              <p className="text-sm text-gray-500 mt-1">Awaiting review</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Claims Section */}
        <Card>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Recent Claims</h2>
            <p className="text-sm text-gray-600">Your latest claim submissions and their status</p>
          </div>
          
          <div className="space-y-4">
            {patientData.recentClaims.map((claim) => (
              <div key={claim.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  claim.status === 'Paid' ? 'bg-green-100' :
                  claim.status === 'Approved' ? 'bg-blue-100' :
                  'bg-yellow-100'
                }`}>
                  <span className={`text-sm font-medium ${
                    claim.status === 'Paid' ? 'text-green-600' :
                    claim.status === 'Approved' ? 'text-blue-600' :
                    'text-yellow-600'
                  }`}>
                    {claim.icon}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{claim.name}</p>
                  <p className="text-sm text-gray-500">{claim.claimNumber}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Rs. {claim.amount}</p>
                  <ClaimStatusBadge status={claim.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Coverage Balance Section */}
        <Card>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Coverage Balance</h2>
            <p className="text-sm text-gray-600">Your remaining coverage for this year</p>
          </div>
          
          <div className="space-y-6">
            {patientData.coverageBalance.map((coverage) => (
              <div key={coverage.category}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">{coverage.category}</span>
                  <span className="text-sm text-gray-600">
                    Rs. {coverage.used.toLocaleString()} / Rs. {coverage.total.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${coverage.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}





