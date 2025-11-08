'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import MessageButton from '@/components/messaging/MessageButton';
import { useClaimsMessaging } from '@/contexts/ClaimsMessagingContext';
import notificationsData from '@/data/insurerNotifications.json';
import { AlertNotification } from '@/types';

interface Claim {
  id: string;
  claimNumber: string;
  patient: string;
  hospital: string;
  amount: string;
  date: string;
  priority: 'High' | 'Medium' | 'Low';
  status: string;
}

export default function InsurerDashboardPage() {
  const { hasUnreadAlert } = useClaimsMessaging();
  const insurerNotifications = useMemo(
    () => notificationsData as AlertNotification[],
    []
  );
  const router = useRouter();
  const [claims] = useState<Claim[]>([
    {
      id: 'CLM-8921',
      claimNumber: 'CLM-8921',
      patient: 'John Doe',
      hospital: 'City General',
      amount: '$1,250',
      date: '2025-10-06',
      priority: 'High',
      status: 'Pending'
    },
    {
      id: 'CLM-8920',
      claimNumber: 'CLM-8920',
      patient: 'Mary Johnson',
      hospital: 'St. Mary\'s',
      amount: '$450',
      date: '2025-10-06',
      priority: 'Medium',
      status: 'Pending'
    },
    {
      id: 'CLM-8919',
      claimNumber: 'CLM-8919',
      patient: 'Robert Smith',
      hospital: 'County Hospital',
      amount: '$5,200',
      date: '2025-10-05',
      priority: 'High',
      status: 'Pending'
    }
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-500';
      case 'Medium':
        return 'bg-yellow-500';
      case 'Low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleApprove = (claimId: string) => {
    console.log('Approving claim:', claimId);
    // Add approval logic here
  };

  const handleReject = (claimId: string) => {
    console.log('Rejecting claim:', claimId);
    // Add rejection logic here
  };

  return (
    <DashboardLayout
      userRole="insurer"
      userName="HealthGuard Insurance"
      notifications={insurerNotifications}
      onNotificationSelect={(notification) => {
        if (notification.category === 'messaging') {
          router.push('/insurer/claims');
        }
      }}
    >
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Insurer Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600">Welcome to your claims management portal</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-1">Pending Claims</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">5</p>
                <p className="text-xs md:text-sm text-gray-500">Requires review</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-1">Approved Claims</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">12</p>
                <p className="text-xs md:text-sm text-gray-500">This week</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-1">Paid Claims</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">7</p>
                <p className="text-xs md:text-sm text-gray-500">Rs. 285,000</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-1">Flagged Claims</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">1</p>
                <p className="text-xs md:text-sm text-gray-500">High priority</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Claims Processing Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 md:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-xs md:text-sm mb-1">Total Claims Value</p>
                <p className="text-2xl md:text-3xl font-bold">Rs. 2.4M</p>
                <p className="text-red-100 text-xs md:text-sm">Total Claims Value</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 md:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs md:text-sm mb-1">Approval Rate</p>
                <p className="text-2xl md:text-3xl font-bold">92%</p>
                <p className="text-green-100 text-xs md:text-sm">Approval Rate</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 md:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs md:text-sm mb-1">Avg. Processing Time</p>
                <p className="text-2xl md:text-3xl font-bold">2.1 days</p>
                <p className="text-blue-100 text-xs md:text-sm">Avg. Processing Time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Claims Review */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-8">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Pending Claims Review</h2>
              <button className="px-3 md:px-4 py-2 text-sm md:text-base bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap">
                Export Report
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Claim ID</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Hospital</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Message</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {claims.map((claim) => {
                  const hasAlert = hasUnreadAlert(claim.id, 'insurer');
                  return (
                    <tr
                      key={claim.id}
                      className={`hover:bg-gray-50 ${hasAlert ? 'border-l-4 border-red-500' : ''}`}
                    >
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {claim.claimNumber}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {claim.patient}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {claim.hospital}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {claim.amount}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {claim.date}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 md:px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(claim.priority)}`}>
                          <span className={`w-2 h-2 rounded-full mr-1.5 ${getPriorityDot(claim.priority)}`}></span>
                          {claim.priority}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-1 md:space-x-2">
                          <button
                            onClick={() => handleApprove(claim.id)}
                            className="px-2 md:px-3 py-1 text-xs md:text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(claim.id)}
                            className="px-2 md:px-3 py-1 text-xs md:text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <MessageButton claimId={claim.id} userRole="insurer" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <button className="flex items-center justify-center px-4 md:px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm md:text-base">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-center">Review Flagged Claims</span>
          </button>
          
          <button className="flex items-center justify-center px-4 md:px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm md:text-base">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-center">Bulk Approve Claims</span>
          </button>
          
          <button className="flex items-center justify-center px-4 md:px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm md:text-base">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-center">Generate Audit Report</span>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}





