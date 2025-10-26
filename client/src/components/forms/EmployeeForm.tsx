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
}

interface EmployeeFormProps {
  initialData?: Partial<EmployeeFormData>;
  onSubmit: (data: EmployeeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function EmployeeForm({ 
  initialData = {}, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: EmployeeFormProps) {
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    mobile: '',
    employeeNumber: '',
    designation: '',
    department: '',
    corporateId: 'corp-001',
    planId: 'plan-acme-gold-2025',
    ...initialData,
  });

  const [errors, setErrors] = useState<Partial<EmployeeFormData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    if (!formData.employeeNumber.trim()) newErrors.employeeNumber = 'Employee number is required';
    if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
    if (!formData.department) newErrors.department = 'Department is required';

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
              className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.mobile ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="+92-300-XXXXXXX"
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
              <option value="R&D">R&D</option>
              <option value="Product">Product</option>
              <option value="Finance">Finance</option>
              <option value="People">Human Resources</option>
              <option value="IT">IT</option>
              <option value="Engineering">Engineering</option>
              <option value="Sales">Sales</option>
              <option value="Logistics">Logistics</option>
              <option value="Production">Production</option>
              <option value="Design">Design</option>
              <option value="Customer">Customer</option>
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
              <option value="plan-acme-gold-2025">Gold Plan</option>
              <option value="plan-acme-basic-2025">Basic Plan</option>
              <option value="plan-acme-premium-2025">Premium Plan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coverage Start Date
            </label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              defaultValue="2025-01-01"
            />
          </div>
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
