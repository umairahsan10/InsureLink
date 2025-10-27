'use client';

import { useEffect } from 'react';
import type { Claim, ClaimEvent } from '@/types/claims';

interface ClaimDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: Claim | null;
}

export default function ClaimDetailsModal({ isOpen, onClose, claim }: ClaimDetailsModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }

    // Cleanup function
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  if (!isOpen || !claim) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-10 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Claim Details</h2>
            <p className="text-sm text-gray-500 mt-1">{claim.claimNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Overview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Claim Status</h3>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border mt-2 ${getStatusColor(claim.status)}`}>
                  {getStatusDisplayName(claim.status)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Fraud Risk Score</p>
                <p className="text-lg font-semibold text-gray-900">
                  {(claim.fraudRiskScore * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Claim Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Claim Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Claim Number:</span>
                  <span className="font-medium text-gray-900">{claim.claimNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Employee:</span>
                  <span className="font-medium text-gray-900">{claim.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Corporate:</span>
                  <span className="font-medium text-gray-900">{claim.corporateName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan ID:</span>
                  <span className="font-medium text-gray-900">{claim.planId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Priority:</span>
                  <span className={`font-medium ${
                    claim.priority === 'High' ? 'text-red-600' : 
                    claim.priority === 'Normal' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {claim.priority}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hospital Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hospital:</span>
                  <span className="font-medium text-gray-900">{claim.hospitalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hospital ID:</span>
                  <span className="font-medium text-gray-900">{claim.hospitalId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Admission Date:</span>
                  <span className="font-medium text-gray-900">{formatDate(claim.admissionDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discharge Date:</span>
                  <span className="font-medium text-gray-900">{formatDate(claim.dischargeDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Amount Claimed</p>
                  <p className="text-xl font-bold text-gray-900">{formatAmount(claim.amountClaimed)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Approved Amount</p>
                  <p className={`text-xl font-bold ${
                    claim.approvedAmount > 0 ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {claim.approvedAmount > 0 ? formatAmount(claim.approvedAmount) : 'Pending'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Documents</p>
                  <p className="text-xl font-bold text-blue-600">{claim.documents.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Claim Timeline</h3>
            <div className="space-y-4">
              {claim.events.map((event: ClaimEvent, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{event.action}</p>
                        <p className="text-sm text-gray-600">
                          {event.actorName} ({event.actorRole})
                        </p>
                        {event.note && (
                          <p className="text-sm text-gray-500 mt-1 italic">&ldquo;{event.note}&rdquo;</p>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(event.ts)}
                      </span>
                    </div>
                    {event.from && event.to && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {event.from}
                        </span>
                        <span className="mx-2">→</span>
                        <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                          {event.to}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Close
            </button>
            {claim.status === 'MoreInfoRequested' && (
              <button className="px-6 py-3 bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition-colors font-medium">
                Provide Additional Info
              </button>
            )}
            {claim.status === 'DocumentsUploaded' && (
              <button className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium">
                Track Progress
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
