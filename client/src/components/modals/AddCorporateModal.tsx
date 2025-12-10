'use client';

import { useState } from 'react';
import BaseModal from './BaseModal';

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

export default function AddCorporateModal({ isOpen, onClose, onSuccess }: AddCorporateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    planType: '',
    premium: '',
    status: 'Active',
    hrContactName: '',
    hrContactEmail: '',
    hrContactPhone: '',
    totalEmployees: 0,
    contractStart: '',
    contractEnd: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Generate new ID
      const newId = `corp-${Date.now()}`;
      
      // Convert numeric premium to PKR format (e.g., 45 -> "Rs. 45,000")
      const premiumValue = parseInt(formData.premium) || 0;
      const premiumInPKR = `Rs. ${(premiumValue * 1000).toLocaleString('en-PK')}`;
      
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
        name: '',
        industry: '',
        planType: '',
        premium: '',
        status: 'Active',
        hrContactName: '',
        hrContactEmail: '',
        hrContactPhone: '',
        totalEmployees: 0,
        contractStart: '',
        contractEnd: '',
      });
    } catch (error) {
      console.error('Failed to add corporate', error);
      alert('Failed to add corporate. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Add New Corporate Client" size="md">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-96 overflow-y-auto px-1">
        {/* Corporate Information Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-600 rounded"></span>
            Corporate Information
          </h3>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Corporate Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g., Acme Ltd"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Industry *</label>
              <input
                type="text"
                required
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., Technology"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Type *</label>
              <select
                required
                value={formData.planType}
                onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select a plan</option>
                <option value="Comprehensive">Comprehensive</option>
                <option value="Premium">Premium</option>
                <option value="Basic">Basic</option>
              </select>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Monthly Premium (K) *</label>
              <input
                type="number"
                required
                min="1"
                max="99999999999"
                value={formData.premium}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d{1,11}$/.test(value)) {
                    setFormData({ ...formData, premium: value });
                  }
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., 45"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Total Employees *</label>
              <input
                type="number"
                required
                min="1"
                max="99999999999"
                value={formData.totalEmployees}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d{1,11}$/.test(value)) {
                    setFormData({ ...formData, totalEmployees: parseInt(value) || 0 });
                  }
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., 8"
              />
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Name *</label>
            <input
              type="text"
              required
              value={formData.hrContactName}
              onChange={(e) => setFormData({ ...formData, hrContactName: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g., Sara Ahmed"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                required
                value={formData.hrContactEmail}
                onChange={(e) => setFormData({ ...formData, hrContactEmail: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="sara@acme.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
              <input
                type="tel"
                required
                value={formData.hrContactPhone}
                onChange={(e) => setFormData({ ...formData, hrContactPhone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="+92-300-1111111"
              />
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
              <input
                type="date"
                required
                value={formData.contractStart}
                onChange={(e) => setFormData({ ...formData, contractStart: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
              <input
                type="date"
                required
                value={formData.contractEnd}
                onChange={(e) => setFormData({ ...formData, contractEnd: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
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
            {isSubmitting ? 'Adding...' : 'Add Corporate'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}



