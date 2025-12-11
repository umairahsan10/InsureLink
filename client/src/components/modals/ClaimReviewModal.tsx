"use client";

import { useState } from "react";
import BaseModal from "./BaseModal";

interface ReviewClaimData {
  id: string;
  patientName?: string;
  amount?: string;
  hospital?: string;
}

interface ClaimReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string;
  claimData?: ReviewClaimData;
  onApprove?: (claimId: string) => void;
  onReject?: (claimId: string, reason: string) => void;
}

export default function ClaimReviewModal({
  isOpen,
  onClose,
  claimId,
  claimData,
  onApprove,
  onReject,
}: ClaimReviewModalProps) {
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Rejection Reason validation - required when rejecting
    if (rejectionReason && rejectionReason.length < 5) {
      newErrors.rejectionReason =
        "Rejection reason must be at least 5 characters";
    } else if (rejectionReason && rejectionReason.length > 500) {
      newErrors.rejectionReason =
        "Rejection reason cannot exceed 500 characters";
    }

    // Review Notes validation - optional but if provided, check length
    if (reviewNotes && reviewNotes.length < 3) {
      newErrors.reviewNotes = "Review notes must be at least 3 characters";
    } else if (reviewNotes && reviewNotes.length > 1000) {
      newErrors.reviewNotes = "Review notes cannot exceed 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      // TODO: API call to approve claim
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onApprove?.(claimId);
      onClose();
      setReviewNotes("");
    } catch (error) {
      console.error("Failed to approve claim", error);
      alert("Failed to approve claim. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setErrors({ rejectionReason: "Rejection reason is required" });
      return;
    }
    if (!validateForm()) {
      return;
    }
    setIsProcessing(true);
    try {
      // TODO: API call to reject claim
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onReject?.(claimId, rejectionReason);
      onClose();
      setRejectionReason("");
      setReviewNotes("");
      setErrors({});
    } catch (error) {
      console.error("Failed to reject claim", error);
      alert("Failed to reject claim. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const claim = claimData || {
    id: claimId,
    patientName: "John Doe",
    amount: "$1,250",
    hospital: "City General Hospital",
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Review Claim" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">
              Claim ID
            </label>
            <p className="mt-1 text-sm text-gray-900">{claim.id}</p>
          </div>
          {claim.patientName && (
            <div>
              <label className="text-sm font-medium text-gray-500">
                Patient
              </label>
              <p className="mt-1 text-sm text-gray-900">{claim.patientName}</p>
            </div>
          )}
          {claim.hospital && (
            <div>
              <label className="text-sm font-medium text-gray-500">
                Hospital
              </label>
              <p className="mt-1 text-sm text-gray-900">{claim.hospital}</p>
            </div>
          )}
          {claim.amount && (
            <div>
              <label className="text-sm font-medium text-gray-500">
                Amount
              </label>
              <p className="mt-1 text-sm text-gray-900">{claim.amount}</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Review Notes
          </label>
          <textarea
            rows={3}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
              errors.reviewNotes ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Add review notes..."
          />
          {errors.reviewNotes && (
            <p className="text-red-500 text-xs mt-1">{errors.reviewNotes}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rejection Reason (if rejecting)
          </label>
          <textarea
            rows={2}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
              errors.rejectionReason ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Reason for rejection..."
          />
          {errors.rejectionReason && (
            <p className="text-red-500 text-xs mt-1">
              {errors.rejectionReason}
            </p>
          )}
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
            {isProcessing ? "Processing..." : "Reject"}
          </button>
          <button
            onClick={handleApprove}
            disabled={isProcessing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Approve"}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
