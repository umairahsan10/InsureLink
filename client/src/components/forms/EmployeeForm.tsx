'use client';

import { useState } from 'react';

export interface EmployeeFormData {
  name: string;
  email: string;
  mobile: string;
  employeeNumber: string;
  designation: string;
  department: string;
  corporateId: string;
  planId: string;
  coverageStartDate: string;
  coverageEndDate: string;
}

export interface EmployeePlanOption {
  id: string;
  label: string;
}

interface EmployeeFormProps {
  initialData?: Partial<EmployeeFormData>;
  onSubmit: (data: EmployeeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  submitError?: string | null;
  planOptions?: EmployeePlanOption[];
  departmentOptions?: string[];
  coverageMinDate?: string;
  coverageMaxDate?: string;
}

const defaultDepartmentOptions = [
  'R&D',
  'Product',
  'Finance',
  'People',
  'IT',
  'Engineering',
  'Sales',
  'Logistics',
  'Production',
  'Design',
  'Customer',
];

const PAK_MOBILE_REGEX = /^03\d{9}$/;

export default function EmployeeForm({ 
  initialData = {}, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  submitError = null,
  planOptions = [],
  departmentOptions = defaultDepartmentOptions,
  coverageMinDate,
  coverageMaxDate,
}: EmployeeFormProps) {
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    mobile: '',
    employeeNumber: '',
    designation: '',
    department: '',
    corporateId: 'corp-001',
    planId: '',
    coverageStartDate: '',
    coverageEndDate: '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Partial<EmployeeFormData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const normalizedValue =
      name === 'mobile'
        ? value.replace(/\D/g, '').slice(0, 11)
        : value;

    setFormData(prev => ({
      ...prev,
      [name]: normalizedValue
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof EmployeeFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<EmployeeFormData> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
    else if (!PAK_MOBILE_REGEX.test(formData.mobile.trim())) {
      newErrors.mobile = 'Use 03XXXXXXXXX format with exactly 11 digits';
    }
    if (!formData.employeeNumber.trim()) newErrors.employeeNumber = 'Employee number is required';
    if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.planId) newErrors.planId = 'Insurance plan is required';
    if (!formData.coverageStartDate) newErrors.coverageStartDate = 'Coverage start date is required';
    if (!formData.coverageEndDate) newErrors.coverageEndDate = 'Coverage end date is required';

    if (formData.coverageStartDate && formData.coverageEndDate) {
      if (formData.coverageStartDate > formData.coverageEndDate) {
        newErrors.coverageEndDate = 'Coverage end date must be after start date';
      }
    }

    if (coverageMinDate && formData.coverageStartDate && formData.coverageStartDate < coverageMinDate) {
      newErrors.coverageStartDate = `Coverage start cannot be before ${coverageMinDate}`;
    }

    if (coverageMaxDate && formData.coverageEndDate && formData.coverageEndDate > coverageMaxDate) {
      newErrors.coverageEndDate = `Coverage end cannot be after ${coverageMaxDate}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter full name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee Number *
            </label>
            <input
              type="text"
              name="employeeNumber"
              value={formData.employeeNumber}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.employeeNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="E-XXXX"
            />
            {errors.employeeNumber && <p className="text-red-500 text-sm mt-1">{errors.employeeNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="employee@company.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number *
            </label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
              maxLength={11}
              inputMode="numeric"
              className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.mobile ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="03XXXXXXXXX"
            />
            {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
          </div>
        </div>
      </div>

      {/* Job Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Designation *
            </label>
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.designation ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Software Engineer"
            />
            {errors.designation && <p className="text-red-500 text-sm mt-1">{errors.designation}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department *
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.department ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Department</option>
              {departmentOptions.map((department) => (
                <option key={department} value={department}>
                  {department === 'People' ? 'Human Resources' : department}
                </option>
              ))}
            </select>
            {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
          </div>
        </div>
      </div>

      {/* Insurance Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Insurance Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Insurance Plan
            </label>
            <select
              name="planId"
              value={formData.planId}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select Insurance Plan</option>
              {planOptions.length === 0 ? (
                <option value="">No plans available</option>
              ) : (
                planOptions.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.label}
                  </option>
                ))
              )}
            </select>
            {errors.planId && <p className="text-red-500 text-sm mt-1">{errors.planId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coverage Start Date
            </label>
            <input
              type="date"
              name="coverageStartDate"
              value={formData.coverageStartDate}
              onChange={handleInputChange}
              min={coverageMinDate}
              max={coverageMaxDate}
              className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.coverageStartDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.coverageStartDate && <p className="text-red-500 text-sm mt-1">{errors.coverageStartDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coverage End Date
            </label>
            <input
              type="date"
              name="coverageEndDate"
              value={formData.coverageEndDate}
              onChange={handleInputChange}
              min={coverageMinDate}
              max={coverageMaxDate}
              className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.coverageEndDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.coverageEndDate && <p className="text-red-500 text-sm mt-1">{errors.coverageEndDate}</p>}
          </div>

          {(coverageMinDate || coverageMaxDate) && (
            <div className="md:col-span-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Allowed coverage window: {coverageMinDate || 'N/A'} to {coverageMaxDate || 'N/A'}
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Adding Employee...' : 'Add Employee'}
        </button>
      </div>
    </form>
  );
}
