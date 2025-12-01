"use client";

import { useMemo } from "react";
import { ClaimRecord } from "./ClaimActionDrawer";

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
  }, [claim?.status]);

  if (!isOpen || !claim) {
    return null;
  }

  const detailRows = [
    { label: "Claim ID", value: claim.id },
    { label: "Patient", value: claim.patient },
    { label: "Hospital", value: claim.hospital },
    { label: "Date", value: claim.date },
    { label: "Amount", value: claim.amount },
    { label: "Priority", value: claim.priority },
    { label: "Status", value: claim.status },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-fade-in">
        <div className="relative overflow-hidden border-b border-gray-100 px-8 py-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-transparent to-purple-50 pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-gray-500">
                Claim Overview
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-semibold text-gray-900">
                  {claim.id}
                </h3>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
                  {claim.amount}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {claim.patient} · {claim.hospital}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <svg
                className="h-5 w-5"
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
          <div className="relative mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {claim.priority} Priority
            </span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusChip}`}
            >
              {claim.status}
            </span>
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white/70 px-3 py-1 text-xs font-semibold text-gray-700">
              Submitted {claim.date}
            </span>
          </div>
        </div>

        <div className="max-h-[75vh] overflow-y-auto bg-slate-50 px-8 py-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {detailRows.map((row) => (
              <div
                key={row.label}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <p className="text-[11px] uppercase text-gray-500">
                  {row.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {row.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {quickStats.map((card) => (
              <div
                key={card.label}
                className={`rounded-2xl border border-white/70 bg-gradient-to-br ${card.accent} p-4 shadow-sm`}
              >
                <p className="text-[11px] uppercase text-gray-600">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-[11px] uppercase text-gray-500">Timeline</p>
            <ol className="mt-3 space-y-3 text-sm text-gray-700">
              {timeline.map((step) => (
                <li key={step.label} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="font-semibold text-gray-900">{step.label}</p>
                    <p className="text-gray-500">{step.value}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-[11px] uppercase text-gray-500">Notes</p>
            <p className="mt-2 text-sm text-gray-700">
              This is a simulated claim detail view. Integrate actual narrative,
              document links, or audit history from the backend to enrich this
              space.
            </p>
          </div>

          {claim.status === "Pending" && (
            <div className="sticky bottom-0 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-[11px] uppercase text-gray-500">Decision</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onDecision?.(claim.id, "reject")}
                  className="flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition"
                >
                  Reject Claim
                </button>
                <button
                  onClick={() => onDecision?.(claim.id, "approve")}
                  className="flex-1 rounded-xl border border-emerald-200 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
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
