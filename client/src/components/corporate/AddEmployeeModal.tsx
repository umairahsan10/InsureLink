'use client';

import { useEffect, useState } from 'react';
import EmployeeForm, { EmployeeFormData, EmployeePlanOption } from '@/components/forms/EmployeeForm';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployee: (employeeData: EmployeeFormData) => Promise<void>;
  planOptions?: EmployeePlanOption[];
  departmentOptions?: string[];
  coverageMinDate?: string;
  coverageMaxDate?: string;
}

export default function AddEmployeeModal({
  isOpen,
  onClose,
  onAddEmployee,
  planOptions = [],
  departmentOptions = [],
  coverageMinDate,
  coverageMaxDate,
}: AddEmployeeModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      // Save current scroll position
      const scrollY = window.scrollY;
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }

    // Cleanup function
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  const handleAddEmployee = async (employeeData: EmployeeFormData) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await onAddEmployee(employeeData);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to add employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 modal-backdrop animate-modal-overlay flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add New Employee</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <EmployeeForm
            onSubmit={handleAddEmployee}
            onCancel={onClose}
            isLoading={isSubmitting}
            submitError={submitError}
            planOptions={planOptions}
            departmentOptions={departmentOptions}
            coverageMinDate={coverageMinDate}
            coverageMaxDate={coverageMaxDate}
          />
        </div>
      </div>
    </div>
  );
}