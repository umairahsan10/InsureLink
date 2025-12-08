"use client";

import { useEffect, useMemo, useState } from "react";

import { formatPKR } from "@/lib/format";

export interface ClaimRecord {
  id: string;
  patient: string;
  hospital: string;
  date: string;
  amount: number | string;
  priority: string;
  status: string;
}

interface ClaimActionDrawerProps {
  isOpen: boolean;
  mode: "view" | "review";
  claim: ClaimRecord | null;
  onClose: () => void;
  onDecision?: (
    claimId: string,
    action: "approve" | "reject",
    notes?: string
  ) => void;
  onSaveNotes?: (claimId: string, notes: string) => void;
}

export default function ClaimActionDrawer({
  isOpen,
  mode,
  claim,
  onClose,
  onDecision,
  onSaveNotes,
}: ClaimActionDrawerProps) {
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [hasSavedNotes, setHasSavedNotes] = useState(false);
  const currentStatus = claim?.status ?? "Pending";
  const currentPriority = claim?.priority ?? "Normal";

  useEffect(() => {
    setReviewNotes("");
    setRejectionReason("");
    setHasSavedNotes(false);
    setIsSavingNotes(false);
  }, [claim?.id, mode]);

  const handleApprove = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (claim) {
      onDecision?.(claim.id, "approve", reviewNotes);
    }
    setReviewNotes("");
    setRejectionReason("");
    setIsProcessing(false);
    onClose();
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (claim) {
      onDecision?.(claim.id, "reject", rejectionReason);
    }
    setReviewNotes("");
    setRejectionReason("");
    setIsProcessing(false);
    onClose();
  };

  const handleSaveNotes = async () => {
    if (!reviewNotes.trim()) {
      alert("Add some review notes before saving.");
      return;
    }
    setIsSavingNotes(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (claim) {
      onSaveNotes?.(claim.id, reviewNotes);
    }
    setHasSavedNotes(true);
    setIsSavingNotes(false);
  };

  const statusStyles = useMemo(() => {
    switch (currentStatus) {
      case "Approved":
        return "bg-green-100 text-green-700 border border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-700 border border-red-200";
      case "Pending":
      default:
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    }
  }, [currentStatus]);

  const priorityStyles = useMemo(() => {
    switch (currentPriority) {
      case "High":
        return "bg-red-50 text-red-700 border-red-200";
      case "Normal":
      case "Medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  }, [currentPriority]);

  if (!isOpen || !claim) {
    return null;
  }

  const infoRows = [
    {
      label: "Patient",
      value: claim.patient,
      icon: (
        <svg
          className="h-4 w-4 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5.121 17.804A4.002 4.002 0 0112 15a4.002 4.002 0 016.879 2.804M15 11a3 3 0 10-6 0 3 3 0 006 0z"
          />
        </svg>
      ),
    },
    {
      label: "Hospital",
      value: claim.hospital,
      icon: (
        <svg
          className="h-4 w-4 text-emerald-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 22V12m0 0H2l10-9 10 9h-10z"
          />
        </svg>
      ),
    },
    {
      label: "Amount",
      value:
        typeof claim.amount === "number"
          ? formatPKR(claim.amount)
          : claim.amount,
      icon: (
        <svg
          className="h-4 w-4 text-indigo-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-2.21 0-4-1.343-4-3s1.79-3 4-3 4 1.343 4 3-1.79 3-4 3zM6 9h12v11H6z"
          />
        </svg>
      ),
    },
    {
      label: "Date",
      value: claim.date,
      icon: (
        <svg
          className="h-4 w-4 text-orange-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10m-11 8h12a2 2 0 002-2V7H5v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      label: "Priority",
      value: claim.priority,
      icon: (
        <svg
          className="h-4 w-4 text-rose-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3"
          />
        </svg>
      ),
    },
    {
      label: "Status",
      value: claim.status,
      icon: (
        <svg
          className="h-4 w-4 text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
    },
  ];

  const timeline = [
    { label: "Filed", value: claim.date },
    { label: "Last Updated", value: "2h ago" },
    { label: "Expected SLA", value: "48h" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full max-h-screen w-full max-w-md flex-col bg-white shadow-2xl animate-slide-in-right">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-slate-50 to-white">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Claim
            </p>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-gray-900">
                {claim.id}
              </h3>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyles}`}
              >
                {claim.status}
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

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 bg-slate-50">
          <div className="rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-900">
                Quick Facts
              </h4>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border ${priorityStyles}`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {claim.priority} Priority
              </span>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {infoRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-start gap-2 rounded-xl bg-gray-50/70 px-3 py-2"
                >
                  <div className="mt-0.5">{row.icon}</div>
                  <div className="text-sm">
                    <dt className="text-[12px] uppercase tracking-wide text-gray-500">
                      {row.label}
                    </dt>
                    <dd className="font-semibold text-gray-900">{row.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Timeline
            </h4>
            <ol className="space-y-3">
              {timeline.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-3 text-sm text-gray-700"
                >
                  <span className="h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      {item.label}
                    </p>
                    <p className="font-medium text-gray-900">{item.value}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {mode === "view" ? (
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-blue-900">
                Claim Summary
              </h4>
              <p className="mt-2 text-sm text-blue-900/80">
                Review the claim details and status. Switch to review mode from
                dashboards to provide a decision.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-900">
                    Review Notes
                  </label>
                  {hasSavedNotes && (
                    <span className="text-xs font-semibold text-green-600">
                      Notes saved
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Add observations, outstanding documents, or next steps..."
                />
                <p className="mt-2 text-xs text-gray-500">
                  Your notes are visible to other reviewers before a final
                  decision is made.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Rejection Reason
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                  placeholder="Only required if you choose to reject"
                />
              </div>
            </>
          )}
        </div>

        {mode === "review" ? (
          <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-gray-100 bg-white px-6 py-4">
            <button
              onClick={handleReject}
              disabled={isProcessing || isSavingNotes}
              className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isProcessing && !isSavingNotes ? "Processing..." : "Reject"}
            </button>
            <button
              onClick={handleSaveNotes}
              disabled={isProcessing || isSavingNotes}
              className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingNotes ? "Saving…" : "Save Notes"}
            </button>
            <button
              onClick={handleApprove}
              disabled={isProcessing || isSavingNotes}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isProcessing && !isSavingNotes ? "Processing..." : "Approve"}
            </button>
          </div>
        ) : (
          <div className="border-t border-gray-100 px-6 py-4 text-right">
            <button
              onClick={onClose}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
