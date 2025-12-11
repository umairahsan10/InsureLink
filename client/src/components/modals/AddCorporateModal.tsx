"use client";

import { useState } from "react";
import BaseModal from "./BaseModal";

interface CorporateFormData {
  id: string;
  name: string;
  industry: string;
  planType: string;
  premium: string;
  status: string;
  hrContact: {
    name: string;
    email: string;
    phone: string;
  };
  totalEmployees: number;
  plans: string[];
  contractStart: string;
  contractEnd: string;
}

interface AddCorporateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (corporate: CorporateFormData) => void;
}

export default function AddCorporateModal({
  isOpen,
  onClose,
  onSuccess,
}: AddCorporateModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    planType: "",
    premium: "",
    status: "Active",
    hrContactName: "",
    hrContactEmail: "",
    hrContactPhone: "",
    totalEmployees: 0,
    contractStart: "",
    contractEnd: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Corporate Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Corporate name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Corporate name must be at least 2 characters";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Corporate name cannot exceed 100 characters";
    }

    // Industry validation
    if (!formData.industry.trim()) {
      newErrors.industry = "Industry is required";
    } else if (formData.industry.trim().length < 2) {
      newErrors.industry = "Industry must be at least 2 characters";
    }

    // Plan Type validation
    if (!formData.planType) {
      newErrors.planType = "Plan type is required";
    }

    // Premium validation
    if (!formData.premium) {
      newErrors.premium = "Premium is required";
    } else {
      const premiumNum = parseInt(formData.premium);
      if (premiumNum < 1 || premiumNum > 99999999) {
        newErrors.premium = "Premium must be between 1 and 99,999,999";
      }
    }

    // Total Employees validation
    if (formData.totalEmployees < 1) {
      newErrors.totalEmployees = "Total employees must be at least 1";
    } else if (formData.totalEmployees > 99999999) {
      newErrors.totalEmployees = "Total employees cannot exceed 99,999,999";
    }

    // HR Contact Name validation
    if (!formData.hrContactName.trim()) {
      newErrors.hrContactName = "Contact name is required";
    } else if (formData.hrContactName.trim().length < 2) {
      newErrors.hrContactName = "Contact name must be at least 2 characters";
    }

    // HR Contact Email validation
    if (!formData.hrContactEmail.trim()) {
      newErrors.hrContactEmail = "Contact email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.hrContactEmail)) {
      newErrors.hrContactEmail = "Email format is invalid";
    }

    // HR Contact Phone validation
    if (!formData.hrContactPhone.trim()) {
      newErrors.hrContactPhone = "Contact phone is required";
    } else if (
      !/^\+?92[-\s]?\d{3}[-\s]?\d{7}$/.test(
        formData.hrContactPhone.replace(/\s/g, "")
      )
    ) {
      newErrors.hrContactPhone =
        "Phone must be a valid number (e.g., +92-300-1234567)";
    }

    // Contract Start Date validation
    if (!formData.contractStart) {
      newErrors.contractStart = "Start date is required";
    }

    // Contract End Date validation
    if (!formData.contractEnd) {
      newErrors.contractEnd = "End date is required";
    } else if (
      formData.contractStart &&
      new Date(formData.contractEnd) <= new Date(formData.contractStart)
    ) {
      newErrors.contractEnd = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate new ID
      const newId = `corp-${Date.now()}`;

      // Convert numeric premium to PKR format (e.g., 45 -> "Rs. 45,000")
      const premiumValue = parseInt(formData.premium) || 0;
      const premiumInPKR = `Rs. ${(premiumValue * 1000).toLocaleString(
        "en-PK"
      )}`;

      const newCorporate: CorporateFormData = {
        id: newId,
        name: formData.name,
        industry: formData.industry,
        planType: formData.planType,
        premium: premiumInPKR,
        status: formData.status as any,
        hrContact: {
          name: formData.hrContactName,
          email: formData.hrContactEmail,
          phone: formData.hrContactPhone,
        },
        totalEmployees: formData.totalEmployees,
        plans: [],
        contractStart: formData.contractStart,
        contractEnd: formData.contractEnd,
      };

      onSuccess?.(newCorporate);
      onClose();
      setFormData({
        name: "",
        industry: "",
        planType: "",
        premium: "",
        status: "Active",
        hrContactName: "",
        hrContactEmail: "",
        hrContactPhone: "",
        totalEmployees: 0,
        contractStart: "",
        contractEnd: "",
      });
      setErrors({});
    } catch (error) {
      console.error("Failed to add corporate", error);
      alert("Failed to add corporate. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Corporate Client"
      size="md"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-h-96 overflow-y-auto px-1"
      >
        {/* Corporate Information Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-600 rounded"></span>
            Corporate Information
          </h3>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Corporate Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., Acme Ltd"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Industry *
              </label>
              <input
                type="text"
                required
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.industry ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., Technology"
              />
              {errors.industry && (
                <p className="text-red-500 text-xs mt-1">{errors.industry}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Plan Type *
              </label>
              <select
                required
                value={formData.planType}
                onChange={(e) =>
                  setFormData({ ...formData, planType: e.target.value })
                }
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.planType ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select a plan</option>
                <option value="Comprehensive">Comprehensive</option>
                <option value="Premium">Premium</option>
                <option value="Basic">Basic</option>
              </select>
              {errors.planType && (
                <p className="text-red-500 text-xs mt-1">{errors.planType}</p>
              )}
            </div>
          </div>
        </div>

        {/* Coverage & Premium Section */}
        <div className="space-y-4 pt-2 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-4 bg-green-600 rounded"></span>
            Coverage & Premium
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Monthly Premium (K) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="99999999999"
                value={formData.premium}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^\d{1,11}$/.test(value)) {
                    setFormData({ ...formData, premium: value });
                  }
                }}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.premium ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., 45"
              />
              {errors.premium && (
                <p className="text-red-500 text-xs mt-1">{errors.premium}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Total Employees *
              </label>
              <input
                type="number"
                required
                min="1"
                max="99999999999"
                value={formData.totalEmployees}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^\d{1,11}$/.test(value)) {
                    setFormData({
                      ...formData,
                      totalEmployees: parseInt(value) || 0,
                    });
                  }
                }}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.totalEmployees ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., 8"
              />
              {errors.totalEmployees && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.totalEmployees}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* HR Contact Section */}
        <div className="space-y-4 pt-2 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-4 bg-purple-600 rounded"></span>
            HR Contact Details
          </h3>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contact Name *
            </label>
            <input
              type="text"
              required
              value={formData.hrContactName}
              onChange={(e) =>
                setFormData({ ...formData, hrContactName: e.target.value })
              }
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.hrContactName ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., Sara Ahmed"
            />
            {errors.hrContactName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.hrContactName}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.hrContactEmail}
                onChange={(e) =>
                  setFormData({ ...formData, hrContactEmail: e.target.value })
                }
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.hrContactEmail ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="sara@acme.com"
              />
              {errors.hrContactEmail && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.hrContactEmail}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                required
                value={formData.hrContactPhone}
                onChange={(e) =>
                  setFormData({ ...formData, hrContactPhone: e.target.value })
                }
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.hrContactPhone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="+92-300-1111111"
              />
              {errors.hrContactPhone && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.hrContactPhone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contract Period Section */}
        <div className="space-y-4 pt-2 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-4 bg-orange-600 rounded"></span>
            Contract Period
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.contractStart}
                onChange={(e) =>
                  setFormData({ ...formData, contractStart: e.target.value })
                }
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.contractStart ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.contractStart && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.contractStart}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                required
                value={formData.contractEnd}
                onChange={(e) =>
                  setFormData({ ...formData, contractEnd: e.target.value })
                }
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.contractEnd ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.contractEnd && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.contractEnd}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Adding..." : "Add Corporate"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
