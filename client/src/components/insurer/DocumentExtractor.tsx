"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ClaimFormData {
  // Claimant Information
  claimantName: string;
  employeeId: string;
  employeeCNIC: string;
  participantEmployerName: string;
  planNumber: string;

  // Patient Information
  patientName: string;
  patientGender: string;
  patientTakafulCertificateNumber: string;
  patientDateOfBirth: string;
  patientCNIC: string;
  patientRelationship: string;
  mobile: string;

  // Claim Type
  claimTypeOPD: string;
  claimTypeHospitalization: string;
  claimTypePrePostHospitalization: string;
  claimTypeMaternity: string;
  claimTypePrePostNatal: string;

  // Medical Condition
  natureOfMedicalCondition: string;
  symptomsOrCause: string;

  // Hospital/Treatment Details
  hospitalClinicName: string;
  dateOfAdmission: string;
  dateOfDischarge: string;

  // Claim Amount
  totalClaimAmount: string;
  totalNumberOfDays: string;
  titleOfCheque: string;
  payableTo: string;
}

const INITIAL_FORM_DATA: ClaimFormData = {
  claimantName: "",
  employeeId: "",
  employeeCNIC: "",
  participantEmployerName: "",
  planNumber: "",
  patientName: "",
  patientGender: "",
  patientTakafulCertificateNumber: "",
  patientDateOfBirth: "",
  patientCNIC: "",
  patientRelationship: "",
  mobile: "",
  claimTypeOPD: "",
  claimTypeHospitalization: "",
  claimTypePrePostHospitalization: "",
  claimTypeMaternity: "",
  claimTypePrePostNatal: "",
  natureOfMedicalCondition: "",
  symptomsOrCause: "",
  hospitalClinicName: "",
  dateOfAdmission: "",
  dateOfDischarge: "",
  totalClaimAmount: "",
  totalNumberOfDays: "",
  titleOfCheque: "",
  payableTo: "",
};

const FIELD_MAPPING: Record<string, keyof ClaimFormData> = {
  "claimant name": "claimantName",
  "employee id": "employeeId",
  "employee cnic": "employeeCNIC",
  "participant (employer) name": "participantEmployerName",
  "plan number": "planNumber",
  "patient's name": "patientName",
  "patient's gender": "patientGender",
  "patient's takaful certificate number": "patientTakafulCertificateNumber",
  "patient's date of birth": "patientDateOfBirth",
  "patient's cnic": "patientCNIC",
  "patient's relationship": "patientRelationship",
  mobile: "mobile",
  "claim type – opd": "claimTypeOPD",
  "claim type – hospitalization": "claimTypeHospitalization",
  "claim type – pre/post hospitalization": "claimTypePrePostHospitalization",
  "claim type – maternity": "claimTypeMaternity",
  "claim type – pre/post natal": "claimTypePrePostNatal",
  "nature of medical condition / accident / illness":
    "natureOfMedicalCondition",
  "symptoms / cause / duration": "symptomsOrCause",
  "name of hospital / clinic / treatment availed": "hospitalClinicName",
  "date of admission": "dateOfAdmission",
  "date of discharge": "dateOfDischarge",
  "total claim amount (pkr)": "totalClaimAmount",
  "total number of days": "totalNumberOfDays",
  "title of cheque": "titleOfCheque",
  "payable to (employee / employer)": "payableTo",
};

export default function DocumentExtractor() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<ClaimFormData>(INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExtracted, setHasExtracted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [extractionTime, setExtractionTime] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number | null>(null);

  const extractTextFromImage = async (
    file: File
  ): Promise<Record<string, string>> => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Send image to external OCR endpoint
      const response = await fetch(
        "https://unperfidious-clemmie-unfractiously.ngrok-free.dev/ocr",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`OCR extraction failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Log the raw response
      console.log("OCR Raw Response:", data);

      // Extract the JSON from the text field
      if (!data.text) {
        throw new Error("No text field in OCR response");
      }

      // Find the JSON block within the text (wrapped in ```json ... ```)
      const jsonMatch = data.text.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch || !jsonMatch[1]) {
        throw new Error("Could not extract JSON from OCR response");
      }

      const extractedJson = JSON.parse(jsonMatch[1]);
      console.log("Parsed JSON:", extractedJson);

      // Map snake_case keys to camelCase for form fields
      const mappedData: Record<string, string> = {};

      const snakeToCamelMapping: Record<string, keyof ClaimFormData> = {
        claimant_name: "claimantName",
        employee_id: "employeeId",
        employee_cnic: "employeeCNIC",
        participant_employer_name: "participantEmployerName",
        plan_number: "planNumber",
        patient_name: "patientName",
        patient_gender: "patientGender",
        patient_takaful_certificate_number: "patientTakafulCertificateNumber",
        patient_date_of_birth: "patientDateOfBirth",
        patient_cnic: "patientCNIC",
        patient_relationship: "patientRelationship",
        mobile: "mobile",
        claim_type_opd: "claimTypeOPD",
        claim_type_hospitalization: "claimTypeHospitalization",
        claim_type_pre_post_hospitalization: "claimTypePrePostHospitalization",
        claim_type_maternity: "claimTypeMaternity",
        claim_type_pre_post_natal: "claimTypePrePostNatal",
        nature_of_medical_condition: "natureOfMedicalCondition",
        symptoms_cause_duration: "symptomsOrCause",
        hospital_or_clinic_name: "hospitalClinicName",
        date_of_admission: "dateOfAdmission",
        date_of_discharge: "dateOfDischarge",
        total_number_of_days: "totalNumberOfDays",
        total_claim_amount_pkr: "totalClaimAmount",
        title_of_cheque: "titleOfCheque",
        payable_to: "payableTo",
      };

      Object.entries(extractedJson).forEach(([key, value]) => {
        const camelCaseKey =
          snakeToCamelMapping[key as keyof typeof snakeToCamelMapping];
        if (camelCaseKey) {
          mappedData[camelCaseKey] = String(value);
        }
      });

      console.log("Mapped Form Data:", mappedData);
      return mappedData;
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to extract text");
    } finally {
      setIsLoading(false);
    }
  };

  const mapExtractedDataToForm = (extractedData: Record<string, string>) => {
    const newFormData = { ...INITIAL_FORM_DATA };

    // Direct mapping since extractTextFromImage already returns camelCase keys
    Object.entries(extractedData).forEach(([key, value]) => {
      if (key in INITIAL_FORM_DATA) {
        let formattedValue = String(value);

        // Convert date format from DD-MM-YYYY to YYYY-MM-DD for date input
        if (key === "patientDateOfBirth" && value) {
          const dateParts = value.split("-");
          if (dateParts.length === 3) {
            // Assuming format is DD-MM-YYYY
            const [day, month, year] = dateParts;
            formattedValue = `${year}-${month}-${day}`;
          }
        }

        // Validate patient takaful certificate number - should be exactly 3 digits
        if (key === "patientTakafulCertificateNumber" && value) {
          const digitsOnly = value.replace(/\D/g, "");
          if (digitsOnly.length > 3) {
            formattedValue = "";
          } else {
            formattedValue = digitsOnly;
          }
        }

        newFormData[key as keyof ClaimFormData] = formattedValue;
      }
    });

    console.log("Form Data After Mapping:", newFormData);
    setFormData(newFormData);
    setHasExtracted(true);
  };

  const handleImageSelect = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      input.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      input.value = "";
      return;
    }

    // Store the file for later processing
    setSelectedFile(file);
    setError(null);
    setHasExtracted(false);
    setExtractionTime(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProcessImage = async () => {
    if (!selectedFile) return;

    // Record start time
    startTimeRef.current = Date.now();
    setExtractionTime(null);

    try {
      const extractedData = await extractTextFromImage(selectedFile);

      // Calculate elapsed time
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        setExtractionTime(elapsed);
      }

      mapExtractedDataToForm(extractedData);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to extract text from image"
      );
      setFormData(INITIAL_FORM_DATA);
      setHasExtracted(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFormChange = (field: keyof ClaimFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleReset = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setFormData(INITIAL_FORM_DATA);
    setError(null);
    setHasExtracted(false);
    setIsEditMode(false);
    setExtractionTime(null);
    startTimeRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleUpload = async () => {
    console.log("Uploading form data to DB:", formData);
    // TODO: Add API call to save the claim to database
    setIsEditMode(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 sm:p-4 md:p-8">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 md:mb-10">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-10 sm:w-12 h-10 sm:h-12 flex-shrink-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="w-5 sm:w-6 h-5 sm:h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3v3m-6-1v-5a1 1 0 011-1h12a1 1 0 011 1v5m-13 0h13a2 2 0 002-2V5a2 2 0 00-2-2H3a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-red-700 to-orange-600 bg-clip-text text-transparent break-words">
                Insurance Claim Form
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm mt-1 hidden sm:block">
                AI-powered document extraction for claim processing
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm animate-slideDown">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Extraction Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Image Upload Section */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 sm:p-6 text-white">
                <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                  </svg>
                  Upload Document
                </h2>
              </div>

              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div>
                  <div
                    className="relative border-2 border-dashed border-gray-300 rounded-lg sm:rounded-2xl p-4 sm:p-6 md:p-8 text-center cursor-pointer hover:border-red-400 hover:bg-red-50 transition-all duration-300 group"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        fileInputRef.current?.click();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    {selectedImage ? (
                      <div className="space-y-2">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                          <svg
                            className="w-6 h-6 text-green-600 animate-pulse"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-bold text-green-600">
                          Image Ready
                        </p>
                        <p className="text-xs text-gray-500">Click to change</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-red-100 transition-colors">
                          <svg
                            className="w-6 h-6 text-gray-400 group-hover:text-red-500 transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            Click to upload
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, JPEG • Max 5MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={isLoading}
                  />
                </div>

                {selectedImage && (
                  <div className="mt-4 space-y-2 animate-fadeIn">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Preview
                    </p>
                    <div className="relative w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden border border-gray-200 shadow-md">
                      <Image
                        src={selectedImage}
                        alt="Document preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl text-center border border-blue-200 animate-pulse">
                    <div className="inline-block">
                      <div className="inline-block h-5 w-5 animate-spin rounded-full border-3 border-blue-300 border-r-blue-600"></div>
                    </div>
                    <p className="text-sm text-blue-700 mt-2 font-medium">
                      Extracting text...
                    </p>
                  </div>
                )}

                {selectedImage && !isLoading && (
                  <div className="mt-4 space-y-2 animate-fadeIn">
                    {!hasExtracted ? (
                      <>
                        <button
                          onClick={handleProcessImage}
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                          Extract Information
                        </button>
                        <button
                          onClick={handleReset}
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-red-100 to-orange-100 text-red-700 rounded-xl hover:from-red-200 hover:to-orange-200 transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md"
                        >
                          Reset
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleReset}
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-red-100 to-orange-100 text-red-700 rounded-xl hover:from-red-200 hover:to-orange-200 transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md"
                        >
                          Reset
                        </button>

                        {extractionTime !== null && (
                          <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 animate-fadeIn">
                            <div className="flex items-center gap-2 justify-center">
                              <svg
                                className="w-5 h-5 text-green-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <div className="text-sm font-semibold text-green-700">
                                Extraction completed in{" "}
                                <span className="font-bold text-green-900">
                                  {(extractionTime / 1000).toFixed(2)}s
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Claim Form */}
          <div>
            {hasExtracted || selectedImage ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Claim Details
                      </h2>
                      <p className="text-blue-100 text-sm">
                        {isEditMode
                          ? "Editing..."
                          : hasExtracted
                          ? "Extracted"
                          : "Ready to edit"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleEditMode}
                      className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition-all duration-200 font-semibold shadow-sm hover:shadow-md flex items-center justify-center sm:justify-start gap-2 ${
                        isEditMode
                          ? "bg-orange-500 text-white hover:bg-orange-600"
                          : "bg-white text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      {isEditMode ? "Done Editing" : "Edit"}
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={!isEditMode}
                      className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition-all duration-200 font-semibold shadow-sm hover:shadow-md flex items-center justify-center sm:justify-start gap-2 ${
                        isEditMode
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-gray-300 text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                        />
                      </svg>
                      Upload
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6 md:p-8">
                  <form className="space-y-6 sm:space-y-8">
                    {/* Claimant Information */}
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 sm:mb-4 pb-2 border-b-2 border-red-500">
                        🧑 Claimant Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                        <FormField
                          label="Claimant Name"
                          value={formData.claimantName}
                          onChange={(val) =>
                            handleFormChange("claimantName", val)
                          }
                          disabled={!isEditMode}
                        />
                        <FormField
                          label="Employee ID"
                          value={formData.employeeId}
                          onChange={(val) =>
                            handleFormChange("employeeId", val)
                          }
                          disabled={!isEditMode}
                        />
                        <FormField
                          label="Employee CNIC"
                          value={formData.employeeCNIC}
                          onChange={(val) =>
                            handleFormChange("employeeCNIC", val)
                          }
                          disabled={!isEditMode}
                        />
                        <FormField
                          label="Participant (Employer) Name"
                          value={formData.participantEmployerName}
                          onChange={(val) =>
                            handleFormChange("participantEmployerName", val)
                          }
                          disabled={!isEditMode}
                        />
                        <FormField
                          label="Plan Number"
                          value={formData.planNumber}
                          onChange={(val) =>
                            handleFormChange("planNumber", val)
                          }
                          disabled={!isEditMode}
                        />
                      </div>
                    </div>

                    {/* Patient Information */}
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 sm:mb-4 pb-2 border-b-2 border-blue-500">
                        👤 Patient Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                        <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                          <FormField
                            label="Patient's Name"
                            value={formData.patientName}
                            onChange={(val) =>
                              handleFormChange("patientName", val)
                            }
                            disabled={!isEditMode}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                            Patient's Gender
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <FormCheckbox
                              label="Male"
                              value={
                                formData.patientGender === "Male" ? "Male" : ""
                              }
                              onChange={() =>
                                handleFormChange(
                                  "patientGender",
                                  formData.patientGender === "Male"
                                    ? ""
                                    : "Male"
                                )
                              }
                              disabled={!isEditMode}
                            />
                            <FormCheckbox
                              label="Female"
                              value={
                                formData.patientGender === "Female"
                                  ? "Female"
                                  : ""
                              }
                              onChange={() =>
                                handleFormChange(
                                  "patientGender",
                                  formData.patientGender === "Female"
                                    ? ""
                                    : "Female"
                                )
                              }
                              disabled={!isEditMode}
                            />
                          </div>
                        </div>
                        <FormField
                          label="Patient's Takaful Certificate Number"
                          value={formData.patientTakafulCertificateNumber}
                          onChange={(val) =>
                            handleFormChange(
                              "patientTakafulCertificateNumber",
                              val
                            )
                          }
                          disabled={!isEditMode}
                        />
                        <FormField
                          label="Patient's Date of Birth"
                          type="date"
                          value={formData.patientDateOfBirth}
                          onChange={(val) =>
                            handleFormChange("patientDateOfBirth", val)
                          }
                          disabled={!isEditMode}
                        />
                        <div />
                        <FormField
                          label="Patient's CNIC"
                          value={formData.patientCNIC}
                          onChange={(val) =>
                            handleFormChange("patientCNIC", val)
                          }
                          disabled={!isEditMode}
                        />
                        <FormField
                          label="Patient's Relationship"
                          value={formData.patientRelationship}
                          onChange={(val) =>
                            handleFormChange("patientRelationship", val)
                          }
                          disabled={!isEditMode}
                        />
                        <FormField
                          label="Mobile"
                          value={formData.mobile}
                          onChange={(val) => handleFormChange("mobile", val)}
                          disabled={!isEditMode}
                        />
                      </div>
                    </div>

                    {/* Claim Type */}
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 sm:mb-4 pb-2 border-b-2 border-purple-500">
                        📋 Claim Type
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                        <FormCheckbox
                          label="OPD"
                          value={formData.claimTypeOPD}
                          onChange={(val) =>
                            handleFormChange("claimTypeOPD", val)
                          }
                          disabled={!isEditMode}
                        />
                        <FormCheckbox
                          label="Hospitalization"
                          value={formData.claimTypeHospitalization}
                          onChange={(val) =>
                            handleFormChange("claimTypeHospitalization", val)
                          }
                          disabled={!isEditMode}
                        />
                        <FormCheckbox
                          label="Pre/Post Hospitalization"
                          value={formData.claimTypePrePostHospitalization}
                          onChange={(val) =>
                            handleFormChange(
                              "claimTypePrePostHospitalization",
                              val
                            )
                          }
                          disabled={!isEditMode}
                        />
                        <FormCheckbox
                          label="Maternity"
                          value={formData.claimTypeMaternity}
                          onChange={(val) =>
                            handleFormChange("claimTypeMaternity", val)
                          }
                          disabled={!isEditMode}
                        />
                        <FormCheckbox
                          label="Pre/Post Natal"
                          value={formData.claimTypePrePostNatal}
                          onChange={(val) =>
                            handleFormChange("claimTypePrePostNatal", val)
                          }
                          disabled={!isEditMode}
                        />
                      </div>
                    </div>

                    {/* Medical Condition */}
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 sm:mb-4 pb-2 border-b-2 border-green-500">
                        🏥 Medical Condition
                      </h3>
                      <div className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4">
                        <FormField
                          label="Nature of Medical Condition / Accident / Illness"
                          value={formData.natureOfMedicalCondition}
                          onChange={(val) =>
                            handleFormChange("natureOfMedicalCondition", val)
                          }
                          isTextarea
                          disabled={!isEditMode}
                        />
                        <FormField
                          label="Symptoms / Cause / Duration"
                          value={formData.symptomsOrCause}
                          onChange={(val) =>
                            handleFormChange("symptomsOrCause", val)
                          }
                          isTextarea
                          disabled={!isEditMode}
                        />
                      </div>
                    </div>

                    {/* Hospital/Treatment Details */}
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 sm:mb-4 pb-2 border-b-2 border-orange-500">
                        🏨 Hospital/Treatment Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                        <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                          <FormField
                            label="Name of Hospital / Clinic / Treatment Availed"
                            value={formData.hospitalClinicName}
                            onChange={(val) =>
                              handleFormChange("hospitalClinicName", val)
                            }
                            disabled={!isEditMode}
                          />
                        </div>
                        <FormField
                          label="Date of Admission"
                          type="date"
                          value={formData.dateOfAdmission}
                          onChange={(val) =>
                            handleFormChange("dateOfAdmission", val)
                          }
                          disabled={!isEditMode}
                        />
                        <FormField
                          label="Date of Discharge"
                          type="date"
                          value={formData.dateOfDischarge}
                          onChange={(val) =>
                            handleFormChange("dateOfDischarge", val)
                          }
                          disabled={!isEditMode}
                        />
                        <FormField
                          label="Total Number of Days"
                          value={formData.totalNumberOfDays}
                          onChange={(val) =>
                            handleFormChange("totalNumberOfDays", val)
                          }
                          disabled={!isEditMode}
                        />
                      </div>
                    </div>

                    {/* Claim Amount */}
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 sm:mb-4 pb-2 border-b-2 border-yellow-500">
                        💰 Claim Amount
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                        <FormField
                          label="Total Claim Amount (PKR)"
                          value={formData.totalClaimAmount}
                          onChange={(val) =>
                            handleFormChange("totalClaimAmount", val)
                          }
                          disabled={!isEditMode}
                        />
                        <FormField
                          label="Title of Cheque"
                          value={formData.titleOfCheque}
                          onChange={(val) =>
                            handleFormChange("titleOfCheque", val)
                          }
                          disabled={!isEditMode}
                        />
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                            Payable To
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <FormCheckbox
                              label="Employee"
                              value={
                                formData.payableTo === "Employee"
                                  ? "Employee"
                                  : ""
                              }
                              onChange={() =>
                                handleFormChange(
                                  "payableTo",
                                  formData.payableTo === "Employee"
                                    ? ""
                                    : "Employee"
                                )
                              }
                              disabled={!isEditMode}
                            />
                            <FormCheckbox
                              label="Employer"
                              value={
                                formData.payableTo === "Employer"
                                  ? "Employer"
                                  : ""
                              }
                              onChange={() =>
                                handleFormChange(
                                  "payableTo",
                                  formData.payableTo === "Employer"
                                    ? ""
                                    : "Employer"
                                )
                              }
                              disabled={!isEditMode}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">
                  Upload a document to get started
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Select an image to extract claim information
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Form Field Component
interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  isTextarea?: boolean;
  disabled?: boolean;
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  isTextarea = false,
  disabled = false,
}: FormFieldProps) {
  // Format date display from YYYY-MM-DD to DD-MM-YYYY for date type
  const displayValue =
    type === "date" && value ? value.split("-").reverse().join("-") : value;

  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
        {label}
      </label>
      {isTextarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full px-4 py-3 text-sm border rounded-lg resize-none transition-all duration-200 ${
            disabled
              ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
              : "bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          }`}
          rows={3}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      ) : type === "date" ? (
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            const inputValue = e.target.value;
            // Convert DD-MM-YYYY back to YYYY-MM-DD
            const parts = inputValue.split("-");
            if (parts.length === 3) {
              const [day, month, year] = parts;
              onChange(`${year}-${month}-${day}`);
            } else {
              onChange(inputValue);
            }
          }}
          disabled={disabled}
          className={`w-full px-4 py-3 text-sm border rounded-lg transition-all duration-200 ${
            disabled
              ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
              : "bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          }`}
          placeholder="DD-MM-YYYY"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full px-4 py-3 text-sm border rounded-lg transition-all duration-200 ${
            disabled
              ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
              : "bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          }`}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      )}
    </div>
  );
}

// Form Checkbox Component
interface FormCheckboxProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function FormCheckbox({
  label,
  value,
  onChange,
  disabled = false,
}: FormCheckboxProps) {
  const isChecked =
    value?.toLowerCase() === "yes" ||
    value?.toLowerCase() === "true" ||
    value?.toLowerCase() === label.toLowerCase();

  return (
    <div
      className={`p-3 border rounded-lg transition-all duration-200 ${
        disabled
          ? "bg-gray-100 border-gray-200 cursor-not-allowed"
          : "border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
      }`}
      onClick={() => {
        if (!disabled) {
          onChange(isChecked ? "" : "Yes");
        }
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
            isChecked
              ? "bg-blue-500 border-blue-500"
              : disabled
              ? "border-gray-300"
              : "border-gray-300 hover:border-blue-400"
          }`}
        >
          {isChecked && (
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <label
          className={`text-sm font-semibold ${
            disabled
              ? "text-gray-500 cursor-not-allowed"
              : "text-gray-700 cursor-pointer"
          }`}
        >
          {label}
        </label>
      </div>
    </div>
  );
}
