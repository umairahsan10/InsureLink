"use client";

import { useState } from "react";
import BaseModal from "@/components/modals/BaseModal";
import { claimsApi } from "@/lib/api/claims";

interface OnHoldDialogProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string;
  claimNumber?: string;
  onComplete: () => void;
}

export default function OnHoldDialog({
  isOpen,
  onClose,
  claimId,
  claimNumber,
  onComplete,
}: OnHoldDialogProps) {
  const [eventNote, setEventNote] = useState("");
  const [requiredDocs, setRequiredDocs] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventNote.trim()) {
      setError("A reason is required to put a claim on hold.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const docs = requiredDocs
        .split("\n")
        .map((d) => d.trim())
        .filter(Boolean);
      await claimsApi.putOnHold(
        claimId,
        eventNote,
        docs.length > 0 ? docs : undefined,
      );
      onComplete();
      handleClose();
    } catch (err: any) {
      setError(err?.message || "Failed to put claim on hold");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEventNote("");
    setRequiredDocs("");
    setError(null);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Put Claim On Hold"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {claimNumber && (
          <p className="text-sm text-gray-500">
            Claim:{" "}
            <span className="font-semibold text-gray-900">{claimNumber}</span>
          </p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason *
          </label>
          <textarea
            rows={3}
            required
            value={eventNote}
            onChange={(e) => setEventNote(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Explain why this claim needs to be put on hold..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Required Documents (one per line, optional)
          </label>
          <textarea
            rows={3}
            value={requiredDocs}
            onChange={(e) => setRequiredDocs(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder={
              "Hospital Discharge Summary\nPathology Reports\nPrescription"
            }
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
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Put On Hold"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
