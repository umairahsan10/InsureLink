"use client";

import { useMemo } from "react";
import { ClaimRecord } from "./ClaimActionDrawer";
import { formatPKR } from "@/lib/format";

interface ClaimDetailsModalProps {
  claim: ClaimRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onDecision?: (claimId: string, action: "approve" | "reject") => void;
}

export default function ClaimDetailsModal({
  claim,
  isOpen,
  onClose,
  onDecision,
}: ClaimDetailsModalProps) {
  const statusChip = useMemo(() => {
    if (!claim) {
      return "bg-amber-50 text-amber-700 border border-amber-200";
    }
    switch (claim.status) {
      case "Approved":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "Rejected":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      case "Pending":
      default:
        return "bg-amber-50 text-amber-700 border border-amber-200";
    }
  }, [claim]);

  if (!isOpen || !claim) {
    return null;
  }

  console.log("ClaimDetailsModal - claim data:", claim);

  const detailRows = [
    { label: "Claim ID", value: claim.id },
    { label: "Patient", value: claim.patient },
    { label: "Hospital", value: claim.hospital },
    { label: "Date", value: claim.date },
    {
      label: "Amount",
      value:
        typeof claim.amount === "number"
          ? formatPKR(claim.amount)
          : claim.amount,
    },
    { label: "Priority", value: claim.priority },
    { label: "Status", value: claim.status },
    ...(claim.treatmentCategory
      ? [{ label: "Treatment Category", value: claim.treatmentCategory }]
      : []),
  ];

  const timeline = [
    { label: "Submitted", value: "Oct 05, 2025 · 09:42 AM" },
    { label: "Documents Uploaded", value: "Oct 05, 2025 · 01:10 PM" },
    { label: "Initial Review", value: "Oct 06, 2025 · 08:15 AM" },
  ];

  const quickStats = [
    {
      label: "Turnaround Target",
      value: "48 hrs",
      accent: "from-indigo-500/10 to-blue-500/10",
    },
    {
      label: "Audit Risk",
      value: "Low",
      accent: "from-emerald-500/10 to-green-500/10",
    },
    {
      label: "Docs Received",
      value: "4 of 4",
      accent: "from-amber-500/10 to-orange-500/10",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header with gradient background */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-8 py-8 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-100 mb-2">
                CLAIM DETAILS
              </p>
              <h3 className="text-3xl font-bold mb-4">{claim.id}</h3>
              <p className="text-blue-100">
                <span className="font-semibold">{claim.patient}</span> •{" "}
                {claim.hospital}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-blue-100 hover:bg-white/20 transition-colors"
            >
              <svg
                className="h-6 w-6"
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

          {/* Status badges */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white border border-white/30">
              {claim.priority} Priority
            </span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                claim.status === "Approved"
                  ? "bg-emerald-400/30 text-emerald-50 border border-emerald-300"
                  : claim.status === "Rejected"
                  ? "bg-rose-400/30 text-rose-50 border border-rose-300"
                  : "bg-amber-400/30 text-amber-50 border border-amber-300"
              }`}
            >
              {claim.status}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-blue-50">
              {typeof claim.amount === "number"
                ? formatPKR(claim.amount)
                : claim.amount}
            </span>
          </div>
        </div>

        <div className="px-8 py-8 space-y-8">
          {/* Main Details Grid */}
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-600 rounded-full" />
              Claim Information
            </h4>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {detailRows.map((row) => (
                <div
                  key={row.label}
                  className="relative rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-all hover:border-blue-300"
                >
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {row.label}
                  </p>
                  <p className="mt-2 text-base font-bold text-gray-900">
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-600 rounded-full" />
              Key Metrics
            </h4>
            <div className="grid gap-4 md:grid-cols-3">
              {quickStats.map((card) => (
                <div
                  key={card.label}
                  className={`rounded-xl border border-gray-200 bg-gradient-to-br ${card.accent} p-5 hover:shadow-md transition-all`}
                >
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {card.label}
                  </p>
                  <p className="mt-3 text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-600 rounded-full" />
              Timeline
            </h4>
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <ol className="space-y-4">
                {timeline.map((step, idx) => (
                  <li key={step.label} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <span className="h-3 w-3 rounded-full bg-blue-600" />
                      {idx < timeline.length - 1 && (
                        <span className="mt-1 h-8 w-0.5 bg-gray-300" />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className="font-semibold text-gray-900">
                        {step.label}
                      </p>
                      <p className="text-sm text-gray-600">{step.value}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-600 rounded-full" />
              Additional Notes
            </h4>
            <div className="rounded-xl border border-gray-200 bg-blue-50/50 p-6">
              <p className="text-sm leading-relaxed text-gray-700">
                {claim.notes
                  ? claim.notes
                  : "No additional notes provided for this claim."}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {claim.status === "Pending" && (
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm font-semibold text-gray-700 mb-4">
                Claim Action
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => onDecision?.(claim.id, "reject")}
                  className="flex-1 rounded-lg border-2 border-red-300 bg-red-50 px-6 py-3 text-sm font-bold text-red-700 hover:bg-red-100 hover:border-red-400 transition-all duration-200 hover:shadow-md"
                >
                  Reject Claim
                </button>
                <button
                  onClick={() => onDecision?.(claim.id, "approve")}
                  className="flex-1 rounded-lg border-2 border-emerald-600 bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 hover:border-emerald-700 transition-all duration-200 hover:shadow-md"
                >
                  Approve Claim
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
