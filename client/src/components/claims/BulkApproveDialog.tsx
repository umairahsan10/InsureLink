"use client";

import { useState } from "react";
import BaseModal from "@/components/modals/BaseModal";
import { claimsApi } from "@/lib/api/claims";

interface BulkApproveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClaimIds: string[];
  onComplete: () => void;
}

export default function BulkApproveDialog({
  isOpen,
  onClose,
  selectedClaimIds,
  onComplete,
}: BulkApproveDialogProps) {
  const [eventNote, setEventNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    success: string[];
    failed: { id: string; reason: string }[];
  } | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await claimsApi.bulkApprove({
        claimIds: selectedClaimIds,
        eventNote: eventNote || undefined,
      });
      setResult(res);
    } catch (err: any) {
      setResult({
        message: err?.message || "Bulk approve failed",
        success: [],
        failed: selectedClaimIds.map((id) => ({
          id,
          reason: err?.message || "Unknown error",
        })),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (result && result.success.length > 0) {
      onComplete();
    }
    setResult(null);
    setEventNote("");
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Approve Claims"
      size="lg"
    >
      {!result ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You are about to approve{" "}
            <span className="font-bold text-gray-900">
              {selectedClaimIds.length}
            </span>{" "}
            claim{selectedClaimIds.length !== 1 ? "s" : ""}. Each claim will be
            approved with its full claimed amount.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (optional)
            </label>
            <textarea
              rows={3}
              value={eventNote}
              onChange={(e) => setEventNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a note for this bulk approval..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? "Approving..."
                : `Approve ${selectedClaimIds.length} Claims`}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-900">{result.message}</p>

          {result.success.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-800">
                {result.success.length} claim
                {result.success.length !== 1 ? "s" : ""} approved successfully
              </p>
            </div>
          )}

          {result.failed.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800 mb-2">
                {result.failed.length} claim
                {result.failed.length !== 1 ? "s" : ""} failed
              </p>
              <ul className="text-xs text-red-700 space-y-1">
                {result.failed.map((f) => (
                  <li key={f.id}>
                    {f.id.slice(0, 8)}... — {f.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
