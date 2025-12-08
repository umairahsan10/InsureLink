"use client";

import BaseModal from "./BaseModal";
import { formatPKR } from "@/lib/format";
import type { Claim } from "@/types/claims";

interface ClaimDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string;
  claimData?: Claim | any;
}

export default function ClaimDetailsModal({
  isOpen,
  onClose,
  claimId,
  claimData,
}: ClaimDetailsModalProps) {
  // Debug: log what we're receiving
  console.log(
    "ClaimDetailsModal - claimId:",
    claimId,
    "claimData:",
    claimData,
    "isOpen:",
    isOpen
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Claim Details"
      size="xl"
    >
      {!claimData ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            Loading claim details... (ID: {claimId})
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Claim ID
              </label>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {claimData.claimNumber || claimData.id}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Status
              </label>
              <p className="mt-1">
                <span
                  className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                    claimData.status === "Approved"
                      ? "bg-green-100 text-green-800"
                      : claimData.status === "Rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {claimData.status}
                </span>
              </p>
            </div>
          </div>

          {/* Patient & Hospital Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Patient Name
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {claimData.employeeName || claimData.patientName}
              </p>
            </div>
            {claimData.employeeId && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Employee ID
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {claimData.employeeId}
                </p>
              </div>
            )}
            {claimData.cnic && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  CNIC
                </label>
                <p className="mt-1 text-sm text-gray-900">{claimData.cnic}</p>
              </div>
            )}
            {claimData.hospitalName && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Hospital
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {claimData.hospitalName}
                </p>
              </div>
            )}
            {claimData.corporateName && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Corporate
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {claimData.corporateName}
                </p>
              </div>
            )}
          </div>

          {/* Financial Information */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-600">
                {claimData.amountClaimed !== undefined
                  ? "Amount Claimed"
                  : "Amount"}
              </label>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {typeof claimData.amountClaimed === "number"
                  ? formatPKR(claimData.amountClaimed)
                  : typeof claimData.amount === "number"
                  ? formatPKR(claimData.amount)
                  : claimData.amount || formatPKR(claimData.amountClaimed || 0)}
              </p>
            </div>
            {claimData.approvedAmount !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Approved Amount
                </label>
                <p className="mt-1 text-lg font-semibold text-green-600">
                  {claimData.approvedAmount > 0
                    ? formatPKR(claimData.approvedAmount)
                    : "Pending"}
                </p>
              </div>
            )}
          </div>

          {/* Dates */}
          {(claimData.admissionDate ||
            claimData.dischargeDate ||
            claimData.date ||
            claimData.createdAt) && (
            <div className="grid grid-cols-2 gap-4">
              {claimData.admissionDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Admission Date
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {claimData.admissionDate}
                  </p>
                </div>
              )}
              {claimData.dischargeDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Discharge Date
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {claimData.dischargeDate}
                  </p>
                </div>
              )}
              {(claimData.date || claimData.createdAt) && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {claimData.createdAt ? "Created Date" : "Date"}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {claimData.date ||
                      (claimData.createdAt
                        ? new Date(claimData.createdAt).toLocaleDateString()
                        : "")}
                  </p>
                </div>
              )}
              {claimData.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Updated Date
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(claimData.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Additional Information */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Plan ID
              </label>
              <p className="mt-1 text-sm text-gray-900">{claimData.planId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Priority
              </label>
              <p className="mt-1 text-sm">
                <span
                  className={`inline-block px-2 py-1 text-xs rounded ${
                    claimData.priority === "High"
                      ? "bg-red-100 text-red-800"
                      : claimData.priority === "Low"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {claimData.priority}
                </span>
              </p>
            </div>
          </div>

          {/* Documents */}
          {claimData.documents && claimData.documents.length > 0 && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-500">
                Documents ({claimData.documents.length})
              </label>
              <div className="mt-2 space-y-2">
                {claimData.documents.map((doc: any, idx: number) => (
                  <div key={idx} className="text-sm text-gray-600">
                    • {doc}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events/Timeline */}
          {claimData.events && claimData.events.length > 0 && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-500">
                Claim Timeline
              </label>
              <div className="mt-3 space-y-3">
                {claimData.events.map((event: any, idx: number) => (
                  <div key={idx} className="flex gap-3 text-sm">
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(event.ts).toLocaleDateString()}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">
                        <span className="font-medium">{event.action}</span> by{" "}
                        <span className="text-gray-600">{event.actorName}</span>
                      </p>
                      {event.note && (
                        <p className="text-gray-600 text-xs mt-1">
                          {event.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end gap-3 border-t pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
