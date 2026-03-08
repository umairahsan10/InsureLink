"use client";

import { useState } from "react";
import BaseModal from "@/components/modals/BaseModal";
import { claimsApi } from "@/lib/api/claims";
import { formatPKR } from "@/lib/format";

interface MarkAsPaidDialogProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string;
  claimNumber?: string;
  approvedAmount: number;
  onComplete: () => void;
}

export default function MarkAsPaidDialog({
  isOpen,
  onClose,
  claimId,
  claimNumber,
  approvedAmount,
  onComplete,
}: MarkAsPaidDialogProps) {
  const [paymentReference, setPaymentReference] = useState("");
  const [paidAmount, setPaidAmount] = useState(String(approvedAmount || ""));
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(paidAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      await claimsApi.markAsPaid(
        claimId,
        paymentReference,
        amount,
        paymentMethod || undefined,
        notes || undefined,
      );
      onComplete();
      handleClose();
    } catch (err: any) {
      setError(err?.message || "Failed to mark claim as paid");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPaymentReference("");
    setPaidAmount(String(approvedAmount || ""));
    setPaymentMethod("Bank Transfer");
    setNotes("");
    setError(null);
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Mark Claim as Paid" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {claimNumber && (
          <p className="text-sm text-gray-500">
            Claim: <span className="font-semibold text-gray-900">{claimNumber}</span>
            {approvedAmount > 0 && (
              <span className="ml-2 text-green-700">
                (Approved: {formatPKR(approvedAmount)})
              </span>
            )}
          </p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paid Amount *
            </label>
            <input
              type="number"
              required
              min="0"
              step="any"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>Bank Transfer</option>
              <option>Cheque</option>
              <option>Online Transfer</option>
              <option>Cash</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Reference
          </label>
          <input
            type="text"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., BANK-TXN-123456"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Additional payment notes..."
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Mark as Paid"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
