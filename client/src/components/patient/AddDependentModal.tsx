"use client";

import { useState, useEffect } from "react";
import { DependentFormData } from "@/types/dependent";
import {
  addDependentRequest,
  generateDependentId,
  calculateAge,
} from "@/utils/dependentHelpers";

interface AddDependentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  corporateId: string;
  onSuccess: () => void;
}

type FormStep = "personal" | "details" | "coverage" | "documents" | "review";

interface FormErrors {
  [key: string]: string;
}

export default function AddDependentModal({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  corporateId,
  onSuccess,
}: AddDependentModalProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>("personal");
  const [formData, setFormData] = useState<DependentFormData>({
    name: "",
    relationship: "Spouse",
    dateOfBirth: "",
    gender: "Male",
    cnic: "",
    phoneNumber: "",
    coverageStartDate: "",
    documents: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Set default coverage date
  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 15);
    setFormData((prev) => ({
      ...prev,
      coverageStartDate: defaultDate.toISOString().split("T")[0],
    }));
  }, []);

  // Load form from session storage
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const savedForm = sessionStorage.getItem(`dependent_form_${employeeId}`);
      if (savedForm) {
        try {
          const parsed = JSON.parse(savedForm);
          setFormData((prev) => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error("Failed to load saved form", e);
        }
      }
    }
  }, [isOpen, employeeId]);

  // Save form to session storage
  useEffect(() => {
    if (isDirty && typeof window !== "undefined") {
      sessionStorage.setItem(
        `dependent_form_${employeeId}`,
        JSON.stringify(formData)
      );
    }
  }, [formData, isDirty, employeeId]);

  const validateField = (fieldName: string, value: any): string | undefined => {
    switch (fieldName) {
      case "name":
        if (!value.trim()) return "Full name is required";
        if (value.length < 2) return "Name must be at least 2 characters";
        if (value.length > 50) return "Name must not exceed 50 characters";
        if (!/^[a-zA-Z\s'-]+$/.test(value))
          return "Name can only contain letters, spaces, hyphens, and apostrophes";
        break;

      case "dateOfBirth":
        if (!value) return "Date of birth is required";
        const age = calculateAge(value);
        if (formData.relationship === "Spouse" && age < 18) {
          return "Spouse must be at least 18 years old";
        } else if (
          (formData.relationship === "Son" ||
            formData.relationship === "Daughter") &&
          age >= 25
        ) {
          return "Child must be under 25 years old";
        } else if (
          (formData.relationship === "Father" ||
            formData.relationship === "Mother") &&
          age < 45
        ) {
          return "Parent must be at least 45 years old";
        }
        break;

      case "cnic":
        if (!value.trim()) return "CNIC/ID number is required";
        if (!/^\d{5}-\d{7}-\d{1}$/.test(value)) {
          return "Invalid CNIC format. Use: 12345-6789012-3";
        }
        break;

      case "phoneNumber":
        if (
          value &&
          !/^(\+92|0)?[3][0-9]{9}$/.test(value.replace(/[-\s]/g, ""))
        ) {
          return "Invalid phone number format";
        }
        break;

      case "coverageStartDate":
        if (!value) return "Coverage start date is required";
        const startDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate <= today) {
          return "Coverage start date must be in the future";
        }
        break;

      case "documents":
        if (formData.documents.length === 0)
          return "At least one document is required";
        break;
    }
    return undefined;
  };

  const validateStep = (step: FormStep): boolean => {
    const newErrors: FormErrors = {};

    switch (step) {
      case "personal":
        const nameError = validateField("name", formData.name);
        const dobError = validateField("dateOfBirth", formData.dateOfBirth);
        if (nameError) newErrors.name = nameError;
        if (dobError) newErrors.dateOfBirth = dobError;
        break;

      case "details":
        const cnicError = validateField("cnic", formData.cnic);
        if (cnicError) newErrors.cnic = cnicError;
        break;

      case "coverage":
        const coverageError = validateField(
          "coverageStartDate",
          formData.coverageStartDate
        );
        if (coverageError) newErrors.coverageStartDate = coverageError;
        break;

      case "documents":
        const docsError = validateField("documents", null);
        if (docsError) newErrors.documents = docsError;
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    const nameError = validateField("name", formData.name);
    const dobError = validateField("dateOfBirth", formData.dateOfBirth);
    const cnicError = validateField("cnic", formData.cnic);
    const coverageError = validateField(
      "coverageStartDate",
      formData.coverageStartDate
    );
    const docsError = validateField("documents", null);

    if (nameError) newErrors.name = nameError;
    if (dobError) newErrors.dateOfBirth = dobError;
    if (cnicError) newErrors.cnic = cnicError;
    if (coverageError) newErrors.coverageStartDate = coverageError;
    if (docsError) newErrors.documents = docsError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);

    // Mark field as touched
    setTouchedFields((prev) => new Set([...prev, name]));

    // Real-time validation
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setIsDirty(true);

    // Validate file sizes and types
    const validFiles = files.filter((file) => {
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        alert(`${file.name} is not a valid file type (PDF, JPG, PNG)`);
        return false;
      }
      if (file.size > maxSize) {
        alert(`${file.name} exceeds 5MB size limit`);
        return false;
      }
      return true;
    });

    if (formData.documents.length + validFiles.length > 3) {
      alert("Maximum 3 documents allowed");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, ...validFiles],
    }));

    if (errors.documents) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.documents;
        return newErrors;
      });
    }
  };

  const removeDocument = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
    setIsDirty(true);
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      const steps: FormStep[] = [
        "personal",
        "details",
        "coverage",
        "documents",
        "review",
      ];
      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1]);
      }
    }
  };

  const handlePrevStep = () => {
    const steps: FormStep[] = [
      "personal",
      "details",
      "coverage",
      "documents",
      "review",
    ];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const dependentId = generateDependentId();
      const documentNames = formData.documents.map((file) => file.name);

      const newDependent = {
        id: dependentId,
        employeeId,
        employeeName,
        corporateId,
        name: formData.name,
        relationship: formData.relationship,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        cnic: formData.cnic,
        phoneNumber: formData.phoneNumber || "",
        status: "Pending" as const,
        requestedAt: new Date().toISOString(),
        documents: documentNames,
        coverageStartDate: formData.coverageStartDate,
      };

      addDependentRequest(newDependent);

      // Clear saved form
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`dependent_form_${employeeId}`);
      }

      alert("Dependent request submitted successfully!");
      onSuccess();

      // Reset form
      setFormData({
        name: "",
        relationship: "Spouse",
        dateOfBirth: "",
        gender: "Male",
        cnic: "",
        phoneNumber: "",
        coverageStartDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        documents: [],
      });
      setCurrentStep("personal");
      setErrors({});
      setTouchedFields(new Set());
      setIsDirty(false);

      onClose();
    } catch {
      alert("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const steps: { id: FormStep; label: string; icon: string }[] = [
    { id: "personal", label: "Personal Info", icon: "👤" },
    { id: "details", label: "Details", icon: "📋" },
    { id: "coverage", label: "Coverage", icon: "📅" },
    { id: "documents", label: "Documents", icon: "📄" },
    { id: "review", label: "Review", icon: "✓" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

      {/* Full Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Full Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          onBlur={() => setTouchedFields((prev) => new Set([...prev, "name"]))}
          className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            touchedFields.has("name") && errors.name
              ? "border-red-500"
              : "border-gray-300"
          }`}
          placeholder="Enter dependent's full name"
        />
        {touchedFields.has("name") && errors.name && (
          <p className="text-red-500 text-sm mt-2 flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            {errors.name}
          </p>
        )}
      </div>

      {/* Relationship & Gender */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="relationship"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Relationship *
          </label>
          <select
            id="relationship"
            name="relationship"
            value={formData.relationship}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Spouse">Spouse</option>
            <option value="Son">Son</option>
            <option value="Daughter">Daughter</option>
            <option value="Father">Father</option>
            <option value="Mother">Mother</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="gender"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Gender *
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Date of Birth */}
      <div>
        <label
          htmlFor="dateOfBirth"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Date of Birth *
        </label>
        <input
          type="date"
          id="dateOfBirth"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={handleInputChange}
          onBlur={() =>
            setTouchedFields((prev) => new Set([...prev, "dateOfBirth"]))
          }
          className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            touchedFields.has("dateOfBirth") && errors.dateOfBirth
              ? "border-red-500"
              : "border-gray-300"
          }`}
        />
        {touchedFields.has("dateOfBirth") && errors.dateOfBirth && (
          <p className="text-red-500 text-sm mt-2 flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            {errors.dateOfBirth}
          </p>
        )}
        {formData.dateOfBirth && !errors.dateOfBirth && (
          <p className="text-green-600 text-sm mt-2 flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Age: {calculateAge(formData.dateOfBirth)} years
          </p>
        )}
      </div>
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Identification Details
      </h3>

      {/* CNIC & Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="cnic"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            CNIC/ID Number *
          </label>
          <input
            type="text"
            id="cnic"
            name="cnic"
            value={formData.cnic}
            onChange={handleInputChange}
            onBlur={() =>
              setTouchedFields((prev) => new Set([...prev, "cnic"]))
            }
            className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
              touchedFields.has("cnic") && errors.cnic
                ? "border-red-500"
                : "border-gray-300"
            }`}
            placeholder="12345-6789012-3"
            maxLength={17}
          />
          {touchedFields.has("cnic") && errors.cnic && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.cnic}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            onBlur={() =>
              setTouchedFields((prev) => new Set([...prev, "phoneNumber"]))
            }
            className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              touchedFields.has("phoneNumber") && errors.phoneNumber
                ? "border-red-500"
                : "border-gray-300"
            }`}
            placeholder="+92-3XX-XXXXXXX"
          />
          {touchedFields.has("phoneNumber") && errors.phoneNumber && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.phoneNumber}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderCoverage = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Coverage Information
      </h3>

      <div>
        <label
          htmlFor="coverageStartDate"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Coverage Start Date *
        </label>
        <input
          type="date"
          id="coverageStartDate"
          name="coverageStartDate"
          value={formData.coverageStartDate}
          onChange={handleInputChange}
          onBlur={() =>
            setTouchedFields((prev) => new Set([...prev, "coverageStartDate"]))
          }
          className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            touchedFields.has("coverageStartDate") && errors.coverageStartDate
              ? "border-red-500"
              : "border-gray-300"
          }`}
        />
        {touchedFields.has("coverageStartDate") && errors.coverageStartDate && (
          <p className="text-red-500 text-sm mt-2 flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            {errors.coverageStartDate}
          </p>
        )}
        <p className="text-gray-600 text-sm mt-2">
          <svg
            className="w-4 h-4 inline mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm3-7a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          Default: 15 days from today (processing time)
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Coverage will start from the selected date.
          Make sure to allow sufficient time for document processing and
          approval.
        </p>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Supporting Documents
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Documents *
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            id="documents"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="documents" className="cursor-pointer block">
            <div className="text-blue-500 mb-2">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, JPG, PNG up to 5MB each (max 3 files)
            </p>
          </label>
        </div>
        {errors.documents && (
          <p className="text-red-500 text-sm mt-2 flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            {errors.documents}
          </p>
        )}

        {/* Uploaded Files */}
        {formData.documents.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Uploaded Files ({formData.documents.length}/3)
            </h4>
            <div className="space-y-2">
              {formData.documents.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center flex-1">
                    <svg
                      className="w-5 h-5 text-blue-500 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Review Your Information
      </h3>

      <div className="space-y-4">
        {/* Personal Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">
            Personal Information
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Full Name</p>
              <p className="font-medium text-gray-900">{formData.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Relationship</p>
              <p className="font-medium text-gray-900">
                {formData.relationship}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Date of Birth</p>
              <p className="font-medium text-gray-900">
                {new Date(formData.dateOfBirth).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Age</p>
              <p className="font-medium text-gray-900">
                {calculateAge(formData.dateOfBirth)} years
              </p>
            </div>
            <div>
              <p className="text-gray-500">Gender</p>
              <p className="font-medium text-gray-900">{formData.gender}</p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">
            Contact & Identification
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">CNIC/ID Number</p>
              <p className="font-medium text-gray-900 font-mono">
                {formData.cnic}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Phone Number</p>
              <p className="font-medium text-gray-900">
                {formData.phoneNumber || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Coverage Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">
            Coverage Information
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Coverage Start Date</p>
              <p className="font-medium text-gray-900">
                {new Date(formData.coverageStartDate).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Documents Uploaded</p>
              <p className="font-medium text-green-700">
                {formData.documents.length} file(s)
              </p>
            </div>
          </div>
        </div>

        {/* Documents */}
        {formData.documents.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Uploaded Documents
            </h4>
            <ul className="space-y-2">
              {formData.documents.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center text-sm text-gray-700"
                >
                  <svg
                    className="w-4 h-4 text-blue-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800 flex items-start">
            <svg
              className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Please review all information carefully. Once submitted, the
              request will be sent to your organization for approval.
            </span>
          </p>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "personal":
        return renderPersonalInfo();
      case "details":
        return renderDetails();
      case "coverage":
        return renderCoverage();
      case "documents":
        return renderDocuments();
      case "review":
        return renderReview();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 border-b border-gray-300 sticky top-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">
                Request to Add Dependent
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Step {currentStepIndex + 1} of {steps.length}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg
                className="w-6 h-6"
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

          {/* Progress Bar */}
          <div className="w-full bg-blue-500 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => {
                    const stepIndex = steps.findIndex((s) => s.id === step.id);
                    if (stepIndex < currentStepIndex) {
                      setCurrentStep(step.id);
                    }
                  }}
                  disabled={index > currentStepIndex}
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors ${
                    index <= currentStepIndex
                      ? index === currentStepIndex
                        ? "bg-blue-600 text-white"
                        : "bg-green-500 text-white cursor-pointer hover:bg-green-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  title={step.label}
                >
                  {index < currentStepIndex ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      index < currentStepIndex ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {renderCurrentStep()}
        </form>

        {/* Footer */}
        <div className="flex justify-between space-x-4 p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
          <button
            type="button"
            onClick={currentStepIndex === 0 ? onClose : handlePrevStep}
            className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            {currentStepIndex === 0 ? "Cancel" : "Previous"}
          </button>

          {currentStep === "review" ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400 rounded-lg transition-colors font-medium flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Submit Request
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium flex items-center"
            >
              Next
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
