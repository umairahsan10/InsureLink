"use client";

import { useEffect, useState } from "react";
import { claimsApi, type Claim, type ClaimEvent } from "@/lib/api/claims";

interface ClaimDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: Claim | null;
}

export default function ClaimDetailsModal({
  isOpen,
  onClose,
  claim,
}: ClaimDetailsModalProps) {
  const [fullClaim, setFullClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch full claim detail (includes events + documents) when modal opens
  useEffect(() => {
    if (!isOpen || !claim) {
      setFullClaim(null);
      return;
    }
    setIsLoading(true);
    claimsApi
      .getClaim(claim.id)
      .then((data) => setFullClaim(data))
      .catch(() => setFullClaim(claim))
      .finally(() => setIsLoading(false));
  }, [isOpen, claim]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [isOpen]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "Paid":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "OnHold":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Pending":
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getStatusDisplayName = (status: string) => {
    if (status === "OnHold") return "On Hold";
    return status;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "\u2014";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: string | number | undefined | null) => {
    if (amount === undefined || amount === null) return "\u2014";
    return `Rs. ${Number(amount).toLocaleString()}`;
  };

  if (!isOpen || !claim) return null;

  const displayClaim = fullClaim ?? claim;
  const employeeName = [
    displayClaim.hospitalVisit?.employee?.user?.firstName,
    displayClaim.hospitalVisit?.employee?.user?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-10 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Claim Details</h2>
            <p className="text-sm text-gray-500 mt-1">{displayClaim.claimNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="text-2xl">x</span>
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading claim details...</div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Claim Status</h3>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border mt-2 ${getStatusColor(displayClaim.claimStatus)}`}>
                    {getStatusDisplayName(displayClaim.claimStatus)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Priority</p>
                  <p className={`text-lg font-semibold ${displayClaim.priority === "High" ? "text-red-600" : displayClaim.priority === "Normal" ? "text-green-600" : "text-gray-600"}`}>
                    {displayClaim.priority}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Claim Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Claim Number:</span>
                    <span className="font-medium text-gray-900">{displayClaim.claimNumber}</span>
                  </div>
                  {employeeName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Employee:</span>
                      <span className="font-medium text-gray-900">{employeeName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Corporate:</span>
                    <span className="font-medium text-gray-900">{displayClaim.corporate?.name ?? "\u2014"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-medium text-gray-900">{displayClaim.plan?.planName ?? "\u2014"}</span>
                  </div>
                  {displayClaim.treatmentCategory && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium text-gray-900">{displayClaim.treatmentCategory}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hospital Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hospital:</span>
                    <span className="font-medium text-gray-900">{displayClaim.hospitalVisit?.hospital?.hospitalName ?? "\u2014"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">City:</span>
                    <span className="font-medium text-gray-900">{displayClaim.hospitalVisit?.hospital?.city ?? "\u2014"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Visit Date:</span>
                    <span className="font-medium text-gray-900">{formatDate(displayClaim.hospitalVisit?.visitDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discharge Date:</span>
                    <span className="font-medium text-gray-900">{formatDate(displayClaim.hospitalVisit?.dischargeDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">Amount Claimed</p>
                    <p className="text-xl font-bold text-gray-900">{formatAmount(displayClaim.amountClaimed)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">Approved Amount</p>
                    <p className={`text-xl font-bold ${Number(displayClaim.approvedAmount) > 0 ? "text-green-600" : "text-gray-500"}`}>
                      {Number(displayClaim.approvedAmount) > 0 ? formatAmount(displayClaim.approvedAmount) : "Pending"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">Documents</p>
                    <p className="text-xl font-bold text-blue-600">{displayClaim.claimDocuments?.length ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Claim Timeline</h3>
              {displayClaim.claimEvents && displayClaim.claimEvents.length > 0 ? (
                <div className="space-y-4">
                  {displayClaim.claimEvents.map((event: ClaimEvent, index: number) => (
                    <div key={event.id ?? index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{event.action}</p>
                            <p className="text-sm text-gray-600">{event.actorName} ({event.actorRole})</p>
                            {event.eventNote && (
                              <p className="text-sm text-gray-500 mt-1 italic">&ldquo;{event.eventNote}&rdquo;</p>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">{formatDate(event.timestamp)}</span>
                        </div>
                        {event.statusFrom && event.statusTo && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">{event.statusFrom}</span>
                            <span className="mx-2">&rarr;</span>
                            <span className="px-2 py-1 bg-blue-100 rounded text-xs">{event.statusTo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No timeline events yet.</p>
              )}
            </div>

            {displayClaim.notes && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4">{displayClaim.notes}</p>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button onClick={onClose} className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
