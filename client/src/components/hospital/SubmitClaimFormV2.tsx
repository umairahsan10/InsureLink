"use client";

import { useState, useCallback } from "react";
import { formatPKR } from "@/lib/format";
import {
  hospitalsApi,
  type UnclaimedVisit,
  type UnclaimedVisitEmployee,
} from "@/lib/api/hospitals";
import { claimsApi, type CreateClaimRequest } from "@/lib/api/claims";

// ── Types ────────────────────────────────────────────────────────────────

interface SubmitClaimFormV2Props {
  onSuccess?: (claimId: string) => void;
  onCancel?: () => void;
  onClaimSubmitted?: (claim: any) => void;
}

type FormStep = "search" | "select-visit" | "claim-details";

// ── Component ────────────────────────────────────────────────────────────

export default function SubmitClaimFormV2({
  onSuccess,
  onCancel,
  onClaimSubmitted,
}: SubmitClaimFormV2Props) {
  // Step tracking
  const [currentStep, setCurrentStep] = useState<FormStep>("search");

  // Employee search
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Employee & visits data
  const [employee, setEmployee] = useState<UnclaimedVisitEmployee | null>(null);
  const [visits, setVisits] = useState<UnclaimedVisit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<UnclaimedVisit | null>(
    null,
  );

  // Claim form
  const [formData, setFormData] = useState({
    amountClaimed: "",
    treatmentCategory: "",
    priority: "Normal" as "Low" | "Normal" | "High",
    notes: "",
  });
  const [customTreatmentCategory, setCustomTreatmentCategory] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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

  // ── Step 1: Search employee ────────────────────────────────────────────

  const handleSearchEmployee = useCallback(async () => {
    if (!employeeNumber.trim()) {
      setSearchError("Please enter an employee number");
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const result = await hospitalsApi.getUnclaimedVisitsByEmployee(
        employeeNumber.trim(),
      );

      if (!result.visits || result.visits.length === 0) {
        setSearchError(
          "No unclaimed visits found for this employee at your hospital",
        );
        return;
      }

      setEmployee(result.employee);
      setVisits(result.visits);
      setCurrentStep("select-visit");
    } catch (error: any) {
      console.error("Error fetching unclaimed visits:", error);
      if (error?.response?.status === 404) {
        setSearchError("Employee not found with this number");
      } else {
        setSearchError(
          error?.message ||
            "Failed to fetch employee visits. Please try again.",
        );
      }
    } finally {
      setIsSearching(false);
    }
  }, [employeeNumber]);

  // ── Step 2: Select visit ───────────────────────────────────────────────

  const handleSelectVisit = (visit: UnclaimedVisit) => {
    setSelectedVisit(visit);
    setCurrentStep("claim-details");
  };

  // ── Step 3: Submit claim ───────────────────────────────────────────────

  const validateClaimForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amountClaimed.trim()) {
      newErrors.amountClaimed = "Amount claimed is required";
    } else if (isNaN(Number(formData.amountClaimed))) {
      newErrors.amountClaimed = "Amount must be a valid number";
    } else if (Number(formData.amountClaimed) <= 0) {
      newErrors.amountClaimed = "Amount must be greater than 0";
    }

    if (!formData.treatmentCategory.trim()) {
      newErrors.treatmentCategory = "Treatment category is required";
    }

    if (
      formData.treatmentCategory === "Other" &&
      !customTreatmentCategory.trim()
    ) {
      newErrors.customTreatmentCategory =
        "Please specify the treatment category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateClaimForm() || !selectedVisit) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const finalTreatmentCategory =
        formData.treatmentCategory === "Other"
          ? customTreatmentCategory
          : formData.treatmentCategory;

      const request: CreateClaimRequest = {
        hospitalVisitId: selectedVisit.id,
        amountClaimed: Number(formData.amountClaimed),
        treatmentCategory: finalTreatmentCategory || undefined,
        priority: formData.priority,
        notes: formData.notes || undefined,
      };

      const newClaim = await claimsApi.createClaim(request);

      setSuccessMessage(
        `Claim ${newClaim.claimNumber} submitted successfully!`,
      );

      // Notify parent
      if (onClaimSubmitted) {
        onClaimSubmitted(newClaim);
      }

      if (onSuccess) {
        onSuccess(newClaim.id);
      }

      // Reset form after a delay
      setTimeout(() => {
        resetForm();
      }, 3000);
    } catch (error: any) {
      console.error("Error submitting claim:", error);

      // Parse backend error message for better display
      let errorMessage = "Failed to submit claim. Please try again.";

      if (error?.message) {
        // Check if it's a coverage limit error
        if (error.message.includes("exceeds remaining coverage")) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }

      setErrors({
        submit: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────

  const resetForm = () => {
    setCurrentStep("search");
    setEmployeeNumber("");
    setEmployee(null);
    setVisits([]);
    setSelectedVisit(null);
    setFormData({
      amountClaimed: "",
      treatmentCategory: "",
      priority: "Normal",
      notes: "",
    });
    setCustomTreatmentCategory("");
    setErrors({});
    setSuccessMessage("");
    setSearchError(null);
  };

  const goBack = () => {
    if (currentStep === "claim-details") {
      setSelectedVisit(null);
      setCurrentStep("select-visit");
    } else if (currentStep === "select-visit") {
      setEmployee(null);
      setVisits([]);
      setCurrentStep("search");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Submit New Claim
        </h2>
        <p className="text-gray-600">
          {currentStep === "search" &&
            "Enter the employee number to find their unclaimed hospital visits"}
          {currentStep === "select-visit" &&
            "Select a hospital visit to create a claim for"}
          {currentStep === "claim-details" &&
            "Enter the claim details and submit"}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === "search"
                ? "bg-blue-600 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            1
          </div>
          <span className="ml-2 text-sm font-medium text-gray-700">
            Find Employee
          </span>
        </div>
        <div className="w-12 h-0.5 mx-2 bg-gray-300" />
        <div className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === "select-visit"
                ? "bg-blue-600 text-white"
                : currentStep === "claim-details"
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-gray-600"
            }`}
          >
            2
          </div>
          <span className="ml-2 text-sm font-medium text-gray-700">
            Select Visit
          </span>
        </div>
        <div className="w-12 h-0.5 mx-2 bg-gray-300" />
        <div className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === "claim-details"
                ? "bg-blue-600 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            3
          </div>
          <span className="ml-2 text-sm font-medium text-gray-700">
            Claim Details
          </span>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Error Messages */}
      {(searchError || errors.submit) && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-red-800 font-medium">
                {searchError || errors.submit}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Search Employee */}
      {currentStep === "search" && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee Number <span className="text-red-600">*</span>
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchEmployee()}
                placeholder="e.g., EMP-001"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleSearchEmployee}
                disabled={isSearching}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Enter the employee&apos;s ID number to find their unclaimed visits
              at your hospital
            </p>
          </div>

          {onCancel && (
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Visit */}
      {currentStep === "select-visit" && employee && (
        <div className="space-y-6">
          {/* Employee Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              Employee Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Name:</span>{" "}
                <span className="font-medium text-blue-900">
                  {employee.firstName} {employee.lastName}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Employee #:</span>{" "}
                <span className="font-medium text-blue-900">
                  {employee.employeeNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Visits List */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Unclaimed Visits ({visits.length})
            </h3>
            <div className="space-y-3">
              {visits.map((visit) => (
                <button
                  key={visit.id}
                  type="button"
                  onClick={() => handleSelectVisit(visit)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        Visit Date: {formatDate(visit.visitDate)}
                      </p>
                      {visit.dischargeDate && (
                        <p className="text-sm text-gray-600">
                          Discharged: {formatDate(visit.dischargeDate)}
                        </p>
                      )}
                      {visit.plan && (
                        <p className="text-sm text-gray-600 mt-1">
                          Plan: {visit.plan.planName} (
                          {formatPKR(visit.plan.sumInsured)})
                        </p>
                      )}
                      {visit.corporate && (
                        <p className="text-sm text-gray-500">
                          Corporate: {visit.corporate.name}
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {visit.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={goBack}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Claim Details */}
      {currentStep === "claim-details" && selectedVisit && employee && (
        <form onSubmit={handleSubmitClaim} className="space-y-6">
          {/* Coverage Info Card */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">
              Coverage Information
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-green-700">Total Coverage:</span>{" "}
                <span className="font-medium text-green-900">
                  {formatPKR(employee.coverageAmount)}
                </span>
              </div>
              <div>
                <span className="text-green-700">Used Amount:</span>{" "}
                <span className="font-medium text-green-900">
                  {formatPKR(employee.usedAmount)}
                </span>
              </div>
              <div>
                <span className="text-green-700">Remaining:</span>{" "}
                <span className="font-bold text-green-900">
                  {formatPKR(employee.remainingCoverage)}
                </span>
              </div>
            </div>
          </div>

          {/* Visit Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Selected Visit</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Patient:</span>{" "}
                <span className="font-medium text-gray-900">
                  {employee.firstName} {employee.lastName}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Visit Date:</span>{" "}
                <span className="font-medium text-gray-900">
                  {formatDate(selectedVisit.visitDate)}
                </span>
              </div>
              {selectedVisit.dischargeDate && (
                <div>
                  <span className="text-gray-600">Discharge Date:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {formatDate(selectedVisit.dischargeDate)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Amount & Treatment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Claimed (PKR) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                value={formData.amountClaimed}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    amountClaimed: e.target.value,
                  }))
                }
                placeholder="e.g., 50000"
                min="0"
                step="100"
                className={`w-full px-4 py-2 border rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.amountClaimed ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.amountClaimed && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.amountClaimed}
                </p>
              )}
              {formData.amountClaimed && !errors.amountClaimed && (
                <>
                  <p className="mt-1 text-sm text-gray-600">
                    {formatPKR(Number(formData.amountClaimed))}
                  </p>
                  {Number(formData.amountClaimed) >
                    employee.remainingCoverage && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Amount exceeds remaining coverage of{" "}
                      {formatPKR(employee.remainingCoverage)}
                    </p>
                  )}
                  {Number(formData.amountClaimed) <=
                    employee.remainingCoverage &&
                    Number(formData.amountClaimed) >
                      employee.remainingCoverage * 0.8 && (
                      <p className="mt-1 text-sm text-amber-600 flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Using{" "}
                        {Math.round(
                          (Number(formData.amountClaimed) /
                            employee.remainingCoverage) *
                            100,
                        )}
                        % of remaining coverage
                      </p>
                    )}
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Treatment Category <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.treatmentCategory}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    treatmentCategory: e.target.value,
                  }))
                }
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

          {/* Custom Treatment Category */}
          {formData.treatmentCategory === "Other" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please Specify Treatment Category{" "}
                <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={customTreatmentCategory}
                onChange={(e) => setCustomTreatmentCategory(e.target.value)}
                placeholder="e.g., Orthodontics, Physiotherapy, etc."
                className={`w-full px-4 py-2 border rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.customTreatmentCategory
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.customTreatmentCategory && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.customTreatmentCategory}
                </p>
              )}
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="flex gap-4">
              {(["Low", "Normal", "High"] as const).map((priority) => (
                <label key={priority} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="priority"
                    value={priority}
                    checked={formData.priority === priority}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        priority: e.target.value as "Low" | "Normal" | "High",
                      }))
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span
                    className={`text-sm ${
                      priority === "High"
                        ? "text-red-600 font-medium"
                        : priority === "Low"
                          ? "text-gray-500"
                          : "text-gray-700"
                    }`}
                  >
                    {priority}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Add any additional information about the claim..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={goBack}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
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
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
