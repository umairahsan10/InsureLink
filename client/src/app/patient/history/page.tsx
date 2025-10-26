'use client';

import { useState, useMemo } from 'react';
import claimsData from '@/data/claims.json';
import ClaimDetailsModal from '@/components/patient/ClaimDetailsModal';

export default function PatientHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedDateRange, setSelectedDateRange] = useState('All Time');
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter claims based on search term, status, and date range
  const filteredClaims = useMemo(() => {
    let filtered = claimsData;

    // Filter by search term (claim ID or hospital name)
    if (searchTerm) {
      filtered = filtered.filter(claim =>
        claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.hospitalName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== 'All Status') {
      filtered = filtered.filter(claim => claim.status === selectedStatus);
    }

    // Filter by date range
    if (selectedDateRange !== 'All Time') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(claim => {
        const claimDate = new Date(claim.createdAt);
        switch (selectedDateRange) {
          case 'Last 30 Days':
            return claimDate >= thirtyDaysAgo;
          case 'Last 90 Days':
            return claimDate >= ninetyDaysAgo;
          case 'This Year':
            return claimDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [searchTerm, selectedStatus, selectedDateRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Paid':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'UnderReview':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'DocumentsUploaded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'MoreInfoRequested':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PendingApproval':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Submitted':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'UnderReview':
        return 'Under Review';
      case 'DocumentsUploaded':
        return 'Documents Uploaded';
      case 'MoreInfoRequested':
        return 'More Info Requested';
      case 'PendingApproval':
        return 'Pending Approval';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  const handleViewDetails = (claim: any) => {
    setSelectedClaim(claim);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClaim(null);
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Claim History</h1>
            <p className="text-gray-600">Track and manage all your insurance claims</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Claims</p>
            <p className="text-2xl font-bold text-gray-900">{claimsData.length}</p>
            </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Approved</p>
            <p className="text-2xl font-bold text-green-600">
              {claimsData.filter(claim => claim.status === 'Approved').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {claimsData.filter(claim => 
                ['UnderReview', 'DocumentsUploaded', 'MoreInfoRequested', 'PendingApproval'].includes(claim.status)
              ).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-blue-600">
              Rs. {Math.round(claimsData.reduce((sum, claim) => sum + claim.amountClaimed, 0) / 1000)}K
            </p>
        </div>
      </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Claims</label>
              <input
                type="text"
                placeholder="Search by claim ID or hospital..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>All Status</option>
                <option>Submitted</option>
                <option>DocumentsUploaded</option>
                <option>UnderReview</option>
                <option>MoreInfoRequested</option>
                <option>PendingApproval</option>
                <option>Approved</option>
                <option>Paid</option>
                <option>Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select 
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>All Time</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>This Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Claims List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredClaims.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredClaims.map((claim) => (
                <div key={claim.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
                    {/* Left Section - Claim Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                        <h3 className="text-lg font-semibold text-gray-900">{claim.claimNumber}</h3>
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(claim.status)}`}>
                          {getStatusDisplayName(claim.status)}
                        </span>
                  </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Hospital:</span> {claim.hospitalName}
                  </div>
                        <div>
                          <span className="font-medium">Date:</span> {formatDate(claim.createdAt)}
                  </div>
                        <div>
                          <span className="font-medium">Amount Claimed:</span> {formatAmount(claim.amountClaimed)}
                      </div>
                      <div>
                          <span className="font-medium">Approved Amount:</span> 
                          <span className={claim.approvedAmount > 0 ? 'text-green-600 font-medium' : 'text-gray-500'}>
                            {claim.approvedAmount > 0 ? formatAmount(claim.approvedAmount) : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 lg:ml-6">
                      <button 
                        onClick={() => handleViewDetails(claim)}
                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        View Details
                      </button>
                      {claim.status === 'MoreInfoRequested' && (
                        <button className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                          Provide Info
                        </button>
                      )}
                      {claim.status === 'DocumentsUploaded' && (
                        <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                          Track Progress
                        </button>
                      )}
                    </div>
                      </div>
                    </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No claims found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedStatus !== 'All Status' || selectedDateRange !== 'All Time'
                  ? 'No claims match your current filters.'
                  : 'You haven\'t submitted any claims yet.'
                }
              </p>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Submit Your First Claim
              </button>
            </div>
          )}
        </div>

        {/* Pagination Info */}
        {filteredClaims.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredClaims.length}</span> of{' '}
                <span className="font-medium">{filteredClaims.length}</span> claims
                {filteredClaims.length !== claimsData.length && (
                  <span className="text-gray-500"> (filtered from {claimsData.length} total)</span>
                )}
              </p>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  Previous
                </button>
                <button className="px-3 py-1 text-sm text-white bg-blue-600 border border-blue-600 rounded-md">
                  1
                </button>
                <button className="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Claim Details Modal */}
      <ClaimDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        claim={selectedClaim}
      />
    </div>
  );
}