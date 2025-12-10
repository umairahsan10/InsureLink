"use client";

import { useState, useMemo } from "react";
import { formatPKR } from "@/lib/format";
import patientsDataRaw from "@/data/patients.json";
import type { Patient } from "@/types/patient";

interface SubmitClaimFormProps {
  onSuccess?: (claimId: string) => void;
  onCancel?: () => void;
  onClaimSubmitted?: (claim: any) => void;
}

const patientsData = patientsDataRaw as Patient[];

export default function SubmitClaimForm({
  onSuccess,
  onCancel,
  onClaimSubmitted,
}: SubmitClaimFormProps) {
  const [formData, setFormData] = useState({
    patientId: "",
    employeeId: "",
    employeeName: "",
    amountClaimed: "",
    admissionDate: "",
    dischargeDate: "",
    treatmentCategory: "",
    notes: "",
  });

  const [patientSearchInput, setPatientSearchInput] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [customTreatmentCategory, setCustomTreatmentCategory] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Get patients who are insured (have employee records)
  const insuredPatients = useMemo(() => {
    return patientsData
      .filter((patient) => patient.insured && patient.employeeId)
      .map((patient) => ({
        id: patient.id,
        employeeId: patient.employeeId!,
        name: patient.name,
        corporateId: patient.corporateId,
        corporateName: patient.corporateName,
        planId: patient.planId,
      }));
  }, []);

  // Filter patients based on search input
  const filteredPatients = useMemo(() => {
    if (!patientSearchInput.trim()) {
      return insuredPatients;
    }
    const lowerSearch = patientSearchInput.toLowerCase();
    return insuredPatients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(lowerSearch) ||
        (patient.corporateName?.toLowerCase().includes(lowerSearch) ?? false) ||
        patient.id.toLowerCase().includes(lowerSearch)
    );
  }, [patientSearchInput, insuredPatients]);

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

    if (!formData.patientId.trim()) {
      newErrors.patientId = "Please select a patient";
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
        newErrors.dischargeDate = "Discharge date must be after admission date";
      }
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

  const handleCustomTreatmentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCustomTreatmentCategory(e.target.value);
    if (errors.customTreatmentCategory) {
      setErrors((prev) => ({
        ...prev,
        customTreatmentCategory: "",
      }));
    }
  };

  const handlePatientChange = (
    selectedPatient: (typeof insuredPatients)[0]
  ) => {
    setFormData((prev) => ({
      ...prev,
      patientId: selectedPatient.id,
      employeeId: selectedPatient.employeeId || "",
      employeeName: selectedPatient.name || "",
    }));
    setPatientSearchInput(selectedPatient.name);
    setShowPatientDropdown(false);
    if (errors.patientId) {
      setErrors((prev) => ({
        ...prev,
        patientId: "",
      }));
    }
  };

  const handlePatientSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPatientSearchInput(e.target.value);
    setShowPatientDropdown(true);
    if (errors.patientId) {
      setErrors((prev) => ({
        ...prev,
        patientId: "",
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

      // Generate new claim ID - using 3-digit ID
      const randomNum = Math.floor(Math.random() * 900) + 100; // 100-999
      const newClaimId = `clm-${randomNum}`;
      const claimNumber = `CLM-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 9999) + 1
      ).padStart(4, "0")}`;

      const finalTreatmentCategory =
        formData.treatmentCategory === "Other"
          ? customTreatmentCategory
          : formData.treatmentCategory;

      // Create new claim object
      const newClaim = {
        id: newClaimId,
        claimNumber,
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        corporateId: "", // Will be set from patient data
        corporateName: "", // Will be set from patient data
        hospitalId: "hosp-001", // Current hospital
        hospitalName: "City General Hospital", // Current hospital
        planId: "",
        status: "Pending",
        amountClaimed: Number(formData.amountClaimed),
        approvedAmount: 0,
        treatmentCategory: finalTreatmentCategory,
        admissionDate: formData.admissionDate,
        dischargeDate: formData.dischargeDate,
        documents: [],
        events: [
          {
            ts: new Date().toISOString(),
            actorName: "City General Hospital",
            actorRole: "Hospital",
            action: "Submitted claim",
            from: null,
            to: "Pending",
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fraudRiskScore: 0.05,
        priority: "Normal",
        notes: formData.notes,
      };

      console.log("New claim submitted:", newClaim);

      setSuccessMessage(
        `Claim ${claimNumber} submitted successfully! Claim ID: ${newClaimId}`
      );

      // Call onClaimSubmitted callback to save to localStorage
      if (onClaimSubmitted) {
        onClaimSubmitted(newClaim);
      }

      // Reset form
      setFormData({
        patientId: "",
        employeeId: "",
        employeeName: "",
        amountClaimed: "",
        admissionDate: "",
        dischargeDate: "",
        treatmentCategory: "",
        notes: "",
      });
      setCustomTreatmentCategory("");
      setPatientSearchInput("");

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
        {/* Patient Selection */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patient (Insured) <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            placeholder="Search patient by name, corporate, or ID..."
            value={patientSearchInput}
            onChange={handlePatientSearchChange}
            onFocus={() => setShowPatientDropdown(true)}
            className={`w-full px-4 py-2 border rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.patientId ? "border-red-500" : "border-gray-300"
            }`}
          />

          {/* Patient Dropdown */}
          {showPatientDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <div className="px-4 py-3 text-gray-500 text-sm">
                  No patients found matching your search
                </div>
              ) : (
                filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => handlePatientChange(patient)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="font-medium text-gray-900">
                      {patient.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {patient.corporateName} ({patient.id})
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {errors.patientId && (
            <p className="mt-1 text-sm text-red-600">{errors.patientId}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Only showing insured patients with active corporate coverage
          </p>
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
                errors.amountClaimed ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.amountClaimed && (
              <p className="mt-1 text-sm text-red-600">
                {errors.amountClaimed}
              </p>
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
                errors.treatmentCategory ? "border-red-500" : "border-gray-300"
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

        {/* Custom Treatment Category (if "Other" is selected) */}
        {formData.treatmentCategory === "Other" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Please Specify Treatment Category{" "}
              <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={customTreatmentCategory}
              onChange={handleCustomTreatmentChange}
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
                errors.admissionDate ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.admissionDate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.admissionDate}
              </p>
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
                errors.dischargeDate ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.dischargeDate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.dischargeDate}
              </p>
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
