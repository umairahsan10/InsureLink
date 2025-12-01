"use client";

import BaseModal from "./BaseModal";

interface ClaimDetails {
  id: string;
  patientName?: string;
  amount?: string;
  date?: string;
  status?: string;
  treatment?: string;
  hospital?: string;
}

interface ClaimDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string;
  claimData?: ClaimDetails;
}

export default function ClaimDetailsModal({
  isOpen,
  onClose,
  claimId,
  claimData,
}: ClaimDetailsModalProps) {
  // In a real app, you would fetch claim data based on claimId
  const claim = claimData || {
    id: claimId,
    patientName: "John Doe",
    amount: "$1,250",
    date: "2025-10-06",
    status: "Pending",
    treatment: "General Checkup",
    hospital: "City General Hospital",
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Claim Details"
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">
              Claim ID
            </label>
            <p className="mt-1 text-sm text-gray-900">{claim.id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <p className="mt-1 text-sm text-gray-900">
              <span
                className={`inline-block px-2 py-1 text-xs rounded-full ${
                  claim.status === "Approved"
                    ? "bg-green-100 text-green-800"
                    : claim.status === "Rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {claim.status}
              </span>
            </p>
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
          {claim.treatment && (
            <div>
              <label className="text-sm font-medium text-gray-500">
                Treatment
              </label>
              <p className="mt-1 text-sm text-gray-900">{claim.treatment}</p>
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
          {claim.date && (
            <div>
              <label className="text-sm font-medium text-gray-500">Date</label>
              <p className="mt-1 text-sm text-gray-900">{claim.date}</p>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
