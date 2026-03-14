"use client";

import { useState, useEffect } from "react";
import BaseModal from "./BaseModal";
import { claimsApi } from "@/lib/api/claims";
import ClaimDocumentsSection from "@/components/claims/ClaimDocumentsSection";

interface EditableClaimData {
  id: string;
  amount?: string | number;
  amountClaimed?: string | number;
  treatment?: string;
  treatmentCategory?: string;
  notes?: string;
  claimStatus?: string;
  status?: string;
}

interface ClaimEditForm {
  amount: string;
  treatment: string;
  description: string;
}

interface ClaimEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string;
  claimData?: EditableClaimData;
  onSave?: (updatedData: ClaimEditForm) => void;
  onSuccess?: () => void;
}

export default function ClaimEditModal({
  isOpen,
  onClose,
  claimId,
  claimData,
  onSave,
  onSuccess,
}: ClaimEditModalProps) {
  const [formData, setFormData] = useState<ClaimEditForm>({
    amount: "",
    treatment: "",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const claimStatus = claimData?.claimStatus || claimData?.status || "Pending";

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Treatment validation
    if (!formData.treatment.trim()) {
      newErrors.treatment = "Treatment is required";
    } else if (formData.treatment.trim().length < 2) {
      newErrors.treatment = "Treatment must be at least 2 characters";
    } else if (formData.treatment.length > 200) {
      newErrors.treatment = "Treatment cannot exceed 200 characters";
    }

    // Amount validation
    if (!formData.amount) {
      newErrors.amount = "Amount is required";
    } else {
      const amountNum = parseFloat(formData.amount);
      if (isNaN(amountNum) || amountNum < 0) {
        newErrors.amount = "Amount must be a positive number";
      } else if (amountNum > 99999999) {
        newErrors.amount = "Amount cannot exceed 99,999,999";
      }
    }

    // Description validation (optional but if provided, check length)
    if (formData.description.length > 1000) {
      newErrors.description = "Description cannot exceed 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (claimData) {
      const rawAmount = claimData.amountClaimed ?? claimData.amount;
      setFormData({
        amount: (typeof rawAmount === "number"
          ? String(rawAmount)
          : String(rawAmount || "")
        ).replace("$", ""),
        treatment: claimData.treatmentCategory || claimData.treatment || "",
        description: claimData.notes || "",
      });
    }
  }, [claimData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      await claimsApi.updateClaim(claimId, {
        amountClaimed: parseFloat(formData.amount),
        treatmentCategory: formData.treatment,
        notes: formData.description || undefined,
      });
      onSave?.(formData);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Failed to update claim", error);
      alert(error?.message || "Failed to update claim. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Edit Claim" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-sm text-gray-500">
          Editing claim{" "}
          <span className="font-semibold text-gray-900">{claimId}</span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Treatment *
          </label>
          <input
            type="text"
            required
            value={formData.treatment}
            onChange={(e) =>
              setFormData({ ...formData, treatment: e.target.value })
            }
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.treatment ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.treatment && (
            <p className="text-red-500 text-xs mt-1">{errors.treatment}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount *
          </label>
          <input
            type="number"
            required
            min="0"
            step="any"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.amount ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.description ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Additional details..."
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">{errors.description}</p>
          )}
        </div>

        {/* Documents Section */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <ClaimDocumentsSection claimId={claimId} claimStatus={claimStatus} />
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
