"use client";

import { useState } from "react";
import { Dependent } from "@/types/dependent";
import { calculateAge } from "@/utils/dependentHelpers";

interface DependentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dependent: Dependent | null;
  onSuccess: () => void;
  onApprove?: (dependentId: string) => Promise<void>;
  onReject?: (dependentId: string, rejectionReason: string) => Promise<void>;
}

export default function DependentReviewModal({
  isOpen,
  onClose,
  dependent,
  onSuccess,
  onApprove,
  onReject,
}: DependentReviewModalProps) {
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      if (dependent) {
        if (onApprove) {
          await onApprove(dependent.id);
        }
        setToast({
          message: "Dependent request approved successfully!",
          type: "success",
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setToast({
        message: "Please provide a reason for rejection",
        type: "error",
      });
      return;
    }

    setIsProcessing(true);
    try {
      if (dependent) {
        if (onReject) {
          await onReject(dependent.id, rejectionReason);
        }
        setToast({
          message: "Dependent request rejected",
          type: "success",
        });
        setTimeout(() => {
          onSuccess();
          onClose();
          setRejectionReason("");
          setAction(null);
        }, 1500);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !dependent) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center modal-backdrop animate-modal-overlay z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-100 px-6 py-4 border-b border-gray-300 sticky top-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Review Dependent Request
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Submitted by {dependent.employeeName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium text-gray-900">{dependent.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Relationship</p>
                <p className="font-medium text-gray-900">
                  {dependent.relationship}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium text-gray-900">
                  {new Date(dependent.dateOfBirth).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  (Age {calculateAge(dependent.dateOfBirth)})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium text-gray-900">{dependent.gender}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">CNIC/ID Number</p>
                <p className="font-medium text-gray-900">
                  {dependent.cnic || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-medium text-gray-900">
                  {dependent.phoneNumber || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Coverage Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Coverage Details
            </h3>
            <div>
              <p className="text-sm text-gray-500">Requested Start Date</p>
              <p className="font-medium text-gray-900">
                {new Date(dependent.coverageStartDate).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </p>
            </div>
          </div>

          {/* Rejection Reason Input */}
          {action === "reject" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Please provide a reason for rejecting this request..."
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>

            {action === null ? (
              <>
                <button
                  onClick={() => setAction("approve")}
                  className="px-6 py-3 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium"
                >
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Approve
                  </span>
                </button>
                <button
                  onClick={() => setAction("reject")}
                  className="px-6 py-3 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium"
                >
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Reject
                  </span>
                </button>
              </>
            ) : action === "approve" ? (
              <div className="flex space-x-2">
                <button
                  onClick={() => setAction(null)}
                  className="px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400 rounded-lg transition-colors font-medium"
                >
                  {isProcessing ? "Processing..." : "Confirm Approval"}
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setAction(null);
                    setRejectionReason("");
                  }}
                  className="px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing || !rejectionReason.trim()}
                  className="px-6 py-3 bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 rounded-lg transition-colors font-medium"
                >
                  {isProcessing ? "Processing..." : "Confirm Rejection"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
          style={{
            backgroundColor: toast.type === "success" ? "#dcfce7" : "#fee2e2",
          }}
        >
          <div className="flex-1">
            <p
              style={{
                color: toast.type === "success" ? "#166534" : "#991b1b",
              }}
              className="text-sm font-medium"
            >
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
