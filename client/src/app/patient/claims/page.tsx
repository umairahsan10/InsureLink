"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { claimsApi } from "@/lib/api/claims";
import { hospitalsApi, type Hospital } from "@/lib/api/hospitals";

interface ClaimFormData {
  hospitalId: string;
  hospitalName: string;
  admissionDate: string;
  dischargeDate: string;
  amountClaimed: number;
  description: string;
  documents: File[];
}

const emptyForm: ClaimFormData = {
  hospitalId: "",
  hospitalName: "",
  admissionDate: "",
  dischargeDate: "",
  amountClaimed: 0,
  description: "",
  documents: [],
};

export default function PatientClaimsPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ClaimFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ClaimFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successClaimNumber, setSuccessClaimNumber] = useState<string | null>(null);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);

  useEffect(() => {
    hospitalsApi
      .getAllPublic()
      .then((data) => setHospitals(data))
      .catch(() => setHospitals([]))
      .finally(() => setHospitalsLoading(false));
  }, []);

  const validate = () => {
    const newErrors: Partial<Record<keyof ClaimFormData, string>> = {};
    if (!formData.hospitalId) newErrors.hospitalId = "Hospital selection is required";
    if (!formData.admissionDate) newErrors.admissionDate = "Admission date is required";
    if (!formData.dischargeDate) newErrors.dischargeDate = "Discharge date is required";
    if (formData.amountClaimed <= 0) newErrors.amountClaimed = "Amount claimed must be greater than 0";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (formData.admissionDate && formData.dischargeDate) {
      if (new Date(formData.dischargeDate) < new Date(formData.admissionDate)) {
        newErrors.dischargeDate = "Discharge date must be after admission date";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ClaimFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleHospitalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = hospitals.find((h) => h.id === e.target.value);
    setFormData((prev) => ({
      ...prev,
      hospitalId: selected?.id || "",
      hospitalName: selected?.hospitalName || "",
    }));
    if (errors.hospitalId) setErrors((prev) => ({ ...prev, hospitalId: undefined }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({ ...prev, documents: [...prev.documents, ...files] }));
  };

  const removeDocument = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const claim = await claimsApi.patientSubmitClaim({
        hospitalId: formData.hospitalId,
        visitDate: formData.admissionDate,
        dischargeDate: formData.dischargeDate || undefined,
        amountClaimed: Number(formData.amountClaimed),
        notes: formData.description || undefined,
      });

      // Upload documents if any
      if (formData.documents.length > 0) {
        await Promise.allSettled(
          formData.documents.map((file) => claimsApi.uploadDocument(claim.id, file))
        );
      }

      setSuccessClaimNumber(claim.claimNumber);
      setFormData(emptyForm);
    } catch (err: any) {
      // The API client throws the raw response body as the message; try to parse it
      let apiMessage: string | undefined;
      try {
        const parsed = JSON.parse(err?.message);
        apiMessage = parsed?.message;
      } catch {
        apiMessage = err?.message;
      }

      const friendlyMessages: Record<string, string> = {
        "No employee record found for your account. Please contact your HR.": 
          "Your account isn't linked to an insurance policy yet. Please ask your HR department to enroll you before submitting a claim.",
      };

      setSubmitError(
        (apiMessage && friendlyMessages[apiMessage]) ?
          friendlyMessages[apiMessage] :
          apiMessage?.includes("exceeds remaining coverage") ?
            `The amount you entered exceeds your remaining insurance coverage. Please enter a lower amount or contact support.` :
            apiMessage?.includes("already has a claim submitted") ?
              "A claim has already been submitted for this visit." :
              "Something went wrong while submitting your claim. Please try again or contact support."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successClaimNumber) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-green-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Claim Submitted Successfully</h2>
            <p className="text-gray-600 mb-2">Your claim has been received and is under review.</p>
            <p className="text-sm font-mono bg-gray-100 inline-block px-3 py-1 rounded text-gray-800 mb-6">
              {successClaimNumber}
            </p>
            <div>
              <button
                onClick={() => setSuccessClaimNumber(null)}
                className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium"
              >
                Submit Another Claim
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit New Claim</h1>
          <p className="text-gray-600">Fill out the form below to submit your insurance claim</p>
        </div>

        {submitError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {submitError}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Hospital Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Hospital Information</h2>
              <div>
                <label htmlFor="hospital" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Hospital *
                </label>
                <select
                  id="hospital"
                  value={formData.hospitalId}
                  onChange={handleHospitalChange}
                  disabled={hospitalsLoading}
                  className={`w-full px-4 py-3 border ${
                    errors.hospitalId ? "border-red-500" : "border-gray-300"
                  } rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">
                    {hospitalsLoading ? "Loading hospitals..." : "Choose a hospital..."}
                  </option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.hospitalName}{h.city ? ` — ${h.city}` : ""}
                    </option>
                  ))}
                </select>
                {errors.hospitalId && (
                  <p className="text-red-500 text-sm mt-1">{errors.hospitalId}</p>
                )}
              </div>
            </div>

            {/* Treatment Dates */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Treatment Dates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="admissionDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Admission Date *
                  </label>
                  <input
                    type="date"
                    id="admissionDate"
                    name="admissionDate"
                    value={formData.admissionDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border ${
                      errors.admissionDate ? "border-red-500" : "border-gray-300"
                    } rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  {errors.admissionDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.admissionDate}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="dischargeDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Discharge Date *
                  </label>
                  <input
                    type="date"
                    id="dischargeDate"
                    name="dischargeDate"
                    value={formData.dischargeDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border ${
                      errors.dischargeDate ? "border-red-500" : "border-gray-300"
                    } rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  {errors.dischargeDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.dischargeDate}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Information</h2>
              <div>
                <label htmlFor="amountClaimed" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Claimed (Rs.) *
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  id="amountClaimed"
                  name="amountClaimed"
                  value={formData.amountClaimed || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                      handleInputChange(e);
                    }
                  }}
                  className={`w-full px-4 py-3 border ${
                    errors.amountClaimed ? "border-red-500" : "border-gray-300"
                  } rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Enter the amount you're claiming"
                />
                {errors.amountClaimed && (
                  <p className="text-red-500 text-sm mt-1">{errors.amountClaimed}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Treatment Description</h2>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your treatment/condition *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-4 py-3 border ${
                    errors.description ? "border-red-500" : "border-gray-300"
                  } rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Please provide details about your medical treatment, diagnosis, and any relevant information..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>
            </div>

            {/* Document Upload */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Supporting Documents</h2>
              <div>
                <label htmlFor="documents" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Documents (Optional — PDF, JPG, PNG up to 10MB each)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="documents"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="documents" className="cursor-pointer">
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  </label>
                </div>

                {formData.documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.documents.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                      >
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                onClick={() => { setFormData(emptyForm); setErrors({}); setSubmitError(null); }}
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors font-medium"
              >
                {isSubmitting ? "Submitting..." : "Submit Claim"}
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
          <p className="text-blue-800 mb-4">
            If you have any questions about submitting your claim, please contact our support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-sm text-blue-800">+92-300-1234567</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-blue-800">support@insurelink.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
