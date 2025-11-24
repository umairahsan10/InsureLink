'use client';

import { useState } from 'react';
import BaseModal from './BaseModal';

interface ClaimReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string;
  claimData?: {
    id: string;
    patientName?: string;
    amount?: string;
    hospital?: string;
    [key: string]: any;
  };
  onApprove?: (claimId: string) => void;
  onReject?: (claimId: string, reason: string) => void;
}

export default function ClaimReviewModal({ 
  isOpen, 
  onClose, 
  claimId, 
  claimData,
  onApprove,
  onReject 
}: ClaimReviewModalProps) {
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      // TODO: API call to approve claim
      await new Promise(resolve => setTimeout(resolve, 1000));
      onApprove?.(claimId);
      onClose();
      setReviewNotes('');
    } catch (error) {
      alert('Failed to approve claim. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    setIsProcessing(true);
    try {
      // TODO: API call to reject claim
      await new Promise(resolve => setTimeout(resolve, 1000));
      onReject?.(claimId, rejectionReason);
      onClose();
      setRejectionReason('');
      setReviewNotes('');
    } catch (error) {
      alert('Failed to reject claim. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const claim = claimData || {
    id: claimId,
    patientName: 'John Doe',
    amount: '$1,250',
    hospital: 'City General Hospital',
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Review Claim" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Claim ID</label>
            <p className="mt-1 text-sm text-gray-900">{claim.id}</p>
          </div>
          {claim.patientName && (
            <div>
              <label className="text-sm font-medium text-gray-500">Patient</label>
              <p className="mt-1 text-sm text-gray-900">{claim.patientName}</p>
            </div>
          )}
          {claim.hospital && (
            <div>
              <label className="text-sm font-medium text-gray-500">Hospital</label>
              <p className="mt-1 text-sm text-gray-900">{claim.hospital}</p>
            </div>
          )}
          {claim.amount && (
            <div>
              <label className="text-sm font-medium text-gray-500">Amount</label>
              <p className="mt-1 text-sm text-gray-900">{claim.amount}</p>
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Review Notes</label>
          <textarea
            rows={3}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Add review notes..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (if rejecting)</label>
          <textarea
            rows={2}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Reason for rejection..."
          />
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Reject'}
          </button>
          <button
            onClick={handleApprove}
            disabled={isProcessing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Approve'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}



