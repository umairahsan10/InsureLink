"use client";

import { useEffect, useState } from "react";
import BaseModal from "./BaseModal";
import { formatPKR } from "@/lib/format";
import { claimsApi } from "@/lib/api/claims";

interface ClaimDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string;
  claimData?: any; // Keep for backwards compatibility but won't use it
}

// API response type matching the backend
interface ApiClaim {
  id: string;
  claimNumber: string;
  claimStatus: string;
  amountClaimed: string | number;
  approvedAmount: string | number;
  treatmentCategory?: string;
  priority: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  claimEvents?: Array<{
    id: string;
    action: string;
    statusTo: string;
    eventNote?: string;
    actorName: string;
    actorRole: string;
    timestamp: string;
  }>;
  hospitalVisit: {
    id: string;
    visitDate: string;
    admissionDate?: string;
    dischargeDate?: string;
    hospital: { id: string; hospitalName: string; city: string };
    employee?: {
      id: string;
      employeeNumber: string;
      user: { firstName: string; lastName: string; cnic?: string };
    } | null;
    dependent?: {
      id: string;
      firstName: string;
      lastName: string;
      relationship: string;
    } | null;
  };
  corporate: { id: string; name: string };
  plan: {
    id: string;
    planName: string;
    planCode: string;
    sumInsured: string | number;
  };
  insurer: { id: string; companyName: string };
}

function transformApiClaim(claim: any) {
  const patient = claim.hospitalVisit?.dependent
    ? `${claim.hospitalVisit.dependent.firstName} ${claim.hospitalVisit.dependent.lastName}`
    : claim.hospitalVisit?.employee?.user
      ? `${claim.hospitalVisit.employee.user.firstName} ${claim.hospitalVisit.employee.user.lastName}`
      : "Unknown";

  // Helper function to safely convert values to numbers
  const toNumber = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === "number") return val;
    if (typeof val === "string") return parseFloat(val) || 0;
    // Handle Prisma Decimal or objects with toString
    if (val && typeof val.toString === "function") {
      const str = val.toString();
      return parseFloat(str) || 0;
    }
    return 0;
  };

  const amountValue = toNumber(claim.amountClaimed);
  const approvedValue = toNumber(claim.approvedAmount);

  console.log("Transform claim:", {
    rawAmountClaimed: claim.amountClaimed,
    rawApprovedAmount: claim.approvedAmount,
    amountValue,
    approvedValue,
  });

  // Extract claim events with notes (insurer decisions)
  const claimEvents =
    claim.claimEvents && Array.isArray(claim.claimEvents)
      ? claim.claimEvents.map((event: any) => ({
          id: event.id,
          action: event.action,
          status: event.statusTo,
          actorName: event.actorName,
          actorRole: event.actorRole,
          note: event.eventNote,
          timestamp: event.timestamp,
        }))
      : [];

  return {
    id: claim.id,
    claimNumber: claim.claimNumber,
    status: claim.claimStatus,
    employeeName: patient,
    patientName: patient,
    amountClaimed: amountValue,
    approvedAmount: approvedValue,
    treatmentCategory: claim.treatmentCategory,
    priority: claim.priority,
    notes: claim.notes,
    claimEvents: claimEvents,
    hospitalName: claim.hospitalVisit?.hospital?.hospitalName,
    corporateName: claim.corporate?.name,
    planName: claim.plan?.planName,
    planId: claim.plan?.id,
    employeeId: claim.hospitalVisit?.employee?.employeeNumber,
    cnic: claim.hospitalVisit?.employee?.user?.cnic,
    admissionDate: claim.hospitalVisit?.admissionDate,
    dischargeDate: claim.hospitalVisit?.dischargeDate,
    createdAt: claim.createdAt,
    updatedAt: claim.updatedAt,
  };
}

export default function ClaimDetailsModal({
  isOpen,
  onClose,
  claimId,
  claimData: initialData,
}: ClaimDetailsModalProps) {
  // Show initialData (from list) immediately; silently refresh in background
  const [claimData, setClaimData] = useState<any>(
    initialData ? transformApiClaim(initialData) : null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && claimId) {
      // Reset to new initialData when a different claim is opened
      setClaimData(initialData ? transformApiClaim(initialData) : null);
      setError(null);

      // Silently refresh in the background to pick up any latest changes
      claimsApi
        .getClaim(claimId)
        .then((response: any) => {
          setClaimData(transformApiClaim(response));
        })
        .catch((err) => {
          // Only show error if we have nothing to display
          if (!initialData) {
            setError(err?.message || "Failed to load claim details");
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, claimId]);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="" size="xl">
      {!claimData ? (
        <div className="text-center py-12">
          {error ? (
            <>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-red-600 font-medium mb-2">
                Error Loading Claim
              </p>
              <p className="text-gray-500 text-sm">{error}</p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                <svg
                  className="w-6 h-6 text-blue-600 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">
                Loading claim details...
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6 -mx-6 -mb-6">
          {/* Header Section with Gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white rounded-t-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-blue-100 text-sm font-medium">
                  CLAIM ID
                </label>
                <p className="mt-2 text-2xl font-bold">
                  {claimData.claimNumber || claimData.id}
                </p>
              </div>
              <div>
                <label className="text-blue-100 text-sm font-medium">
                  STATUS
                </label>
                <p className="mt-2">
                  <span
                    className={`inline-block px-4 py-1 text-sm font-bold rounded-full ${
                      claimData.status === "Approved"
                        ? "bg-emerald-400/30 text-emerald-50 border border-emerald-300"
                        : claimData.status === "Rejected"
                          ? "bg-rose-400/30 text-rose-50 border border-rose-300"
                          : "bg-amber-400/30 text-amber-50 border border-amber-300"
                    }`}
                  >
                    {claimData.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 space-y-6">
            {/* Patient & Hospital Information */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-600 rounded-full" />
                Patient Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 hover:border-blue-300 transition-colors">
                  <label className="text-xs font-semibold text-gray-600 uppercase">
                    Patient Name
                  </label>
                  <p className="mt-2 text-base font-bold text-gray-900">
                    {claimData.employeeName || claimData.patientName}
                  </p>
                </div>
                {claimData.employeeId && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 hover:border-blue-300 transition-colors">
                    <label className="text-xs font-semibold text-gray-600 uppercase">
                      Employee ID
                    </label>
                    <p className="mt-2 text-base font-bold text-gray-900">
                      {claimData.employeeId}
                    </p>
                  </div>
                )}
                {claimData.cnic && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 hover:border-blue-300 transition-colors">
                    <label className="text-xs font-semibold text-gray-600 uppercase">
                      CNIC
                    </label>
                    <p className="mt-2 text-base font-bold text-gray-900">
                      {claimData.cnic}
                    </p>
                  </div>
                )}
                {claimData.hospitalName && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 hover:border-blue-300 transition-colors">
                    <label className="text-xs font-semibold text-gray-600 uppercase">
                      Hospital
                    </label>
                    <p className="mt-2 text-base font-bold text-gray-900">
                      {claimData.hospitalName}
                    </p>
                  </div>
                )}
                {claimData.corporateName && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 hover:border-blue-300 transition-colors">
                    <label className="text-xs font-semibold text-gray-600 uppercase">
                      Corporate
                    </label>
                    <p className="mt-2 text-base font-bold text-gray-900">
                      {claimData.corporateName}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Information */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-600 rounded-full" />
                Financial Details
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <div>
                  <label className="text-xs font-semibold text-blue-900 uppercase">
                    {claimData.amountClaimed !== undefined
                      ? "Amount Claimed"
                      : "Amount"}
                  </label>
                  <p className="mt-2 text-2xl font-bold text-blue-900">
                    {typeof claimData.amountClaimed === "number"
                      ? formatPKR(claimData.amountClaimed)
                      : typeof claimData.amount === "number"
                        ? formatPKR(claimData.amount)
                        : claimData.amount ||
                          formatPKR(claimData.amountClaimed || 0)}
                  </p>
                </div>
                {claimData.approvedAmount !== undefined && (
                  <div>
                    <label className="text-xs font-semibold text-blue-900 uppercase">
                      Approved Amount
                    </label>
                    <p className="mt-2 text-2xl font-bold text-emerald-600">
                      {claimData.approvedAmount > 0
                        ? formatPKR(claimData.approvedAmount)
                        : "Pending"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            {(claimData.admissionDate ||
              claimData.dischargeDate ||
              claimData.date ||
              claimData.createdAt) && (
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded-full" />
                  Timeline
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {claimData.admissionDate && (
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <label className="text-xs font-semibold text-gray-600 uppercase">
                        Admission Date
                      </label>
                      <p className="mt-2 text-base font-bold text-gray-900">
                        {claimData.admissionDate}
                      </p>
                    </div>
                  )}
                  {claimData.dischargeDate && (
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <label className="text-xs font-semibold text-gray-600 uppercase">
                        Discharge Date
                      </label>
                      <p className="mt-2 text-base font-bold text-gray-900">
                        {claimData.dischargeDate}
                      </p>
                    </div>
                  )}
                  {(claimData.date || claimData.createdAt) && (
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <label className="text-xs font-semibold text-gray-600 uppercase">
                        {claimData.createdAt ? "Created Date" : "Date"}
                      </label>
                      <p className="mt-2 text-base font-bold text-gray-900">
                        {claimData.date ||
                          (claimData.createdAt
                            ? new Date(claimData.createdAt).toLocaleDateString()
                            : "")}
                      </p>
                    </div>
                  )}
                  {claimData.updatedAt && (
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <label className="text-xs font-semibold text-gray-600 uppercase">
                        Updated Date
                      </label>
                      <p className="mt-2 text-base font-bold text-gray-900">
                        {new Date(claimData.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-600 rounded-full" />
                Additional Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <label className="text-xs font-semibold text-gray-600 uppercase">
                    Plan ID
                  </label>
                  <p className="mt-2 text-base font-bold text-gray-900">
                    {claimData.planId || "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <label className="text-xs font-semibold text-gray-600 uppercase">
                    Priority
                  </label>
                  <p className="mt-2">
                    <span
                      className={`inline-block px-3 py-1 text-sm font-bold rounded-lg ${
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
                {claimData.treatmentCategory && (
                  <div className="rounded-lg border border-gray-200 bg-white p-4 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase">
                      Treatment Category
                    </label>
                    <p className="mt-2 text-base font-bold text-gray-900">
                      {claimData.treatmentCategory}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            {claimData.documents && claimData.documents.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded-full" />
                  Documents ({claimData.documents.length})
                </h4>
                <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {claimData.documents.map((doc: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 text-sm text-gray-700"
                    >
                      <svg
                        className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M4 4a2 2 0 012-2h6a1 1 0 00-1 1v12a1 1 0 102 0V4a2 2 0 00-2-2H6a1 1 0 00-1 1v12a1 1 0 102 0V4z" />
                      </svg>
                      <span className="font-medium">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hospital Notes */}
            {claimData.notes && (
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded-full" />
                  Hospital Notes
                </h4>
                <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm leading-relaxed text-gray-700">
                    {claimData.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Insurer Decision Notes */}
            {claimData.claimEvents && claimData.claimEvents.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded-full" />
                  Insurer Decision Timeline
                </h4>
                <div className="space-y-4">
                  {claimData.claimEvents.map((event: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-gray-50 rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {event.action}
                          </p>
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">
                              {event.actorName}
                            </span>
                            {event.actorRole && (
                              <span> • {event.actorRole}</span>
                            )}
                          </p>
                        </div>
                        <span
                          className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                            event.status === "Approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : event.status === "Rejected"
                                ? "bg-rose-100 text-rose-800"
                                : event.status === "OnHold"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {event.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                      {event.note && (
                        <div className="mt-3 p-3 bg-white border border-gray-200 rounded">
                          <p className="text-xs font-semibold text-gray-700 mb-1">
                            Note:
                          </p>
                          <p className="text-sm text-gray-700">{event.note}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Events/Timeline - Legacy */}
            {claimData.events && claimData.events.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded-full" />
                  Claim Timeline
                </h4>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="space-y-4">
                    {claimData.events.map((event: any, idx: number) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <span className="h-3 w-3 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                          {idx < claimData.events.length - 1 && (
                            <span className="mt-1 h-8 w-0.5 bg-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-semibold text-gray-900">
                            <span>{event.action}</span>
                            <span className="text-gray-600 font-normal">
                              {" "}
                              by {event.actorName}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(event.ts).toLocaleDateString()}
                          </p>
                          {event.note && (
                            <p className="text-gray-600 text-sm mt-2 bg-white p-2 rounded border border-gray-200">
                              {event.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </BaseModal>
  );
}
