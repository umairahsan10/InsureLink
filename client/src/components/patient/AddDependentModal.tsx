'use client';

import { useState, useEffect } from 'react';
import { DependentFormData, Relationship, Gender } from '@/types/dependent';
import { addDependentRequest, generateDependentId, calculateAge } from '@/utils/dependentHelpers';

interface AddDependentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  corporateId: string;
  onSuccess: () => void;
}

export default function AddDependentModal({ 
  isOpen, 
  onClose, 
  employeeId, 
  employeeName, 
  corporateId, 
  onSuccess 
}: AddDependentModalProps) {
  const [formData, setFormData] = useState<DependentFormData>({
    name: '',
    relationship: 'Spouse',
    dateOfBirth: '',
    gender: 'Male',
    cnic: '',
    phoneNumber: '',
    coverageStartDate: '',
    documents: []
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof DependentFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default coverage date
  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 15);
    setFormData(prev => ({
      ...prev,
      coverageStartDate: defaultDate.toISOString().split('T')[0]
    }));
  }, []);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof DependentFormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.length < 2 || formData.name.length > 50) {
      newErrors.name = 'Name must be between 2 and 50 characters';
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const age = calculateAge(formData.dateOfBirth);
      if (formData.relationship === 'Spouse' && age < 18) {
        newErrors.dateOfBirth = 'Spouse must be at least 18 years old';
      } else if ((formData.relationship === 'Son' || formData.relationship === 'Daughter') && age >= 25) {
        newErrors.dateOfBirth = 'Child must be under 25 years old';
      } else if ((formData.relationship === 'Father' || formData.relationship === 'Mother') && age < 45) {
        newErrors.dateOfBirth = 'Parent must be at least 45 years old';
      }
    }
    
    if (!formData.cnic.trim()) {
      newErrors.cnic = 'CNIC/ID number is required';
    } else if (!/^\d{5}-\d{7}-\d{1}$/.test(formData.cnic)) {
      newErrors.cnic = 'Invalid CNIC format (12345-6789012-3)';
    }
    
    if (!formData.coverageStartDate) {
      newErrors.coverageStartDate = 'Coverage start date is required';
    } else {
      const startDate = new Date(formData.coverageStartDate);
      const today = new Date();
      if (startDate <= today) {
        newErrors.coverageStartDate = 'Coverage start date must be in the future';
      }
    }
    
    if (formData.documents.length === 0) {
      newErrors.documents = 'At least one document is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof DependentFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file sizes and types
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
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
      alert('Maximum 3 documents allowed');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...validFiles]
    }));
    
    if (errors.documents) {
      setErrors(prev => ({ ...prev, documents: undefined }));
    }
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      const dependentId = generateDependentId();
      const documentNames = formData.documents.map(file => file.name);
      
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
        phoneNumber: formData.phoneNumber || '',
        status: 'Pending' as const,
        requestedAt: new Date().toISOString(),
        documents: documentNames,
        coverageStartDate: formData.coverageStartDate
      };
      
      addDependentRequest(newDependent);
      
      alert('Dependent request submitted successfully!');
      onSuccess();
      
      // Reset form
      setFormData({
        name: '',
        relationship: 'Spouse',
        dateOfBirth: '',
        gender: 'Male',
        cnic: '',
        phoneNumber: '',
        coverageStartDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        documents: []
      });
      
      onClose();
    } catch (error) {
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-100 px-6 py-4 border-b border-gray-300 sticky top-0">
          <h2 className="text-xl font-bold text-gray-900">Request to Add Dependent</h2>
          <p className="text-sm text-gray-600 mt-1">Add a family member to your insurance coverage</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="Enter dependent's full name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Relationship & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-2">
                Relationship *
              </label>
              <select
                id="relationship"
                name="relationship"
                value={formData.relationship}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Spouse">Spouse</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
              </select>
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth *
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'} rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
            {formData.dateOfBirth && !errors.dateOfBirth && (
              <p className="text-gray-600 text-sm mt-1">
                Age: {calculateAge(formData.dateOfBirth)} years
              </p>
            )}
          </div>

          {/* CNIC & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cnic" className="block text-sm font-medium text-gray-700 mb-2">
                CNIC/ID Number *
              </label>
              <input
                type="text"
                id="cnic"
                name="cnic"
                value={formData.cnic}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border ${errors.cnic ? 'border-red-500' : 'border-gray-300'} rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="12345-6789012-3"
                maxLength={17}
              />
              {errors.cnic && <p className="text-red-500 text-sm mt-1">{errors.cnic}</p>}
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+92-3XX-XXXXXXX"
              />
            </div>
          </div>

          {/* Coverage Start Date */}
          <div>
            <label htmlFor="coverageStartDate" className="block text-sm font-medium text-gray-700 mb-2">
              Coverage Start Date *
            </label>
            <input
              type="date"
              id="coverageStartDate"
              name="coverageStartDate"
              value={formData.coverageStartDate}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border ${errors.coverageStartDate ? 'border-red-500' : 'border-gray-300'} rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {errors.coverageStartDate && <p className="text-red-500 text-sm mt-1">{errors.coverageStartDate}</p>}
            <p className="text-gray-600 text-sm mt-1">Default: 15 days from today (processing time)</p>
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supporting Documents *
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
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 5MB each (max 3 files)</p>
              </label>
            </div>
            {errors.documents && <p className="text-red-500 text-sm mt-1">{errors.documents}</p>}
            
            {/* Uploaded Files */}
            {formData.documents.length > 0 && (
              <div className="mt-4 space-y-2">
                {formData.documents.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
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

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors font-medium"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

