"use client";

import { useState, useMemo } from "react";
import { formatPKR } from "@/lib/format";
import claimsDataRaw from "@/data/claims.json";
import type { Claim } from "@/types/claims";

interface SubmitClaimFormProps {
  onSuccess?: (claimId: string) => void;
  onCancel?: () => void;
}

const claimsData = claimsDataRaw as Claim[];

export default function SubmitClaimForm({
  onSuccess,
  onCancel,
}: SubmitClaimFormProps) {
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    amountClaimed: "",
    admissionDate: "",
    dischargeDate: "",
    treatmentCategory: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Get unique employees from claims data
  const employees = useMemo(() => {
    const uniqueEmployees = new Map<string, string>();
    claimsData.forEach((claim) => {
      if (!uniqueEmployees.has(claim.employeeId)) {
        uniqueEmployees.set(claim.employeeId, claim.employeeName);
      }
    });
    return Array.from(uniqueEmployees.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, []);

  const treatmentCategories = [
    "General Checkup",
    "Surgery",
    "Lab Test",
    "X-Ray",
    "Consultation",
    "Emergency Care",
    "Dental",
    "Physical Therapy",
    "Other",
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = "Please select an employee/patient";
    }
    if (!formData.amountClaimed.trim()) {
      newErrors.amountClaimed = "Amount claimed is required";
    } else if (isNaN(Number(formData.amountClaimed))) {
      newErrors.amountClaimed = "Amount must be a valid number";
    } else if (Number(formData.amountClaimed) <= 0) {
      newErrors.amountClaimed = "Amount must be greater than 0";
    }
    if (!formData.admissionDate.trim()) {
      newErrors.admissionDate = "Admission date is required";
    }
    if (!formData.dischargeDate.trim()) {
      newErrors.dischargeDate = "Discharge date is required";
    }
    if (formData.admissionDate && formData.dischargeDate) {
      if (new Date(formData.admissionDate) > new Date(formData.dischargeDate)) {
        newErrors.dischargeDate =
          "Discharge date must be after admission date";
      }
    }
    if (!formData.treatmentCategory.trim()) {
      newErrors.treatmentCategory = "Treatment category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedEmployee = employees.find((emp) => emp.id === selectedId);
    setFormData((prev) => ({
      ...prev,
      employeeId: selectedId,
      employeeName: selectedEmployee?.name || "",
    }));
    if (errors.employeeId) {
      setErrors((prev) => ({
        ...prev,
        employeeId: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generate new claim ID
      const newClaimId = `clm-${Date.now()}`;
      const claimNumber = `CLM-${new Date().getFullYear()}-${String(claimsData.length + 1).padStart(4, "0")}`;

      console.log("New claim submitted:", {
        id: newClaimId,
        claimNumber,
        ...formData,
      });

      setSuccessMessage(
        `Claim ${claimNumber} submitted successfully! Claim ID: ${newClaimId}`
      );

      // Reset form
      setFormData({
        employeeId: "",
        employeeName: "",
        amountClaimed: "",
        admissionDate: "",
        dischargeDate: "",
        treatmentCategory: "",
        notes: "",
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(newClaimId);
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch (error) {
      console.error("Error submitting claim:", error);
      setErrors({
        submit: "Failed to submit claim. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Submit New Claim
        </h2>
        <p className="text-gray-600">
          Fill in the details below to submit a new insurance claim for a
          patient
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">{errors.submit}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient/Employee Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patient/Employee <span className="text-red-600">*</span>
          </label>
          <select
            name="employeeId"
            value={formData.employeeId}
            onChange={handleEmployeeChange}
            className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.employeeId
                ? "border-red-500"
                : "border-gray-300"
            }`}
          >
            <option value="">Select a patient...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.id})
              </option>
            ))}
          </select>
          {errors.employeeId && (
            <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>
          )}
        </div>

        {/* Amount Claimed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount Claimed (PKR) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              name="amountClaimed"
              value={formData.amountClaimed}
              onChange={handleInputChange}
              placeholder="e.g., 50000"
              min="0"
              step="100"
              className={`w-full px-4 py-2 border rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.amountClaimed
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.amountClaimed && (
              <p className="mt-1 text-sm text-red-600">{errors.amountClaimed}</p>
            )}
            {formData.amountClaimed && !errors.amountClaimed && (
              <p className="mt-1 text-sm text-gray-600">
                {formatPKR(Number(formData.amountClaimed))}
              </p>
            )}
          </div>

          {/* Treatment Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Treatment Category <span className="text-red-600">*</span>
            </label>
            <select
              name="treatmentCategory"
              value={formData.treatmentCategory}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.treatmentCategory
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            >
              <option value="">Select treatment category...</option>
              {treatmentCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.treatmentCategory && (
              <p className="mt-1 text-sm text-red-600">
                {errors.treatmentCategory}
              </p>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admission Date <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              name="admissionDate"
              value={formData.admissionDate}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.admissionDate
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.admissionDate && (
              <p className="mt-1 text-sm text-red-600">{errors.admissionDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discharge Date <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              name="dischargeDate"
              value={formData.dischargeDate}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.dischargeDate
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.dischargeDate && (
              <p className="mt-1 text-sm text-red-600">{errors.dischargeDate}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Add any additional information about the claim..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Submitting..." : "Submit Claim"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
