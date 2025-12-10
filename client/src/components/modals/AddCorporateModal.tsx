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
    <BaseModal isOpen={isOpen} onClose={onClose} title="Add Corporate" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Corporate Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Acme Ltd"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
            <input
              type="text"
              required
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Technology"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type *</label>
            <input
              type="text"
              required
              value={formData.planType}
              onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Comprehensive"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Premium (in Thousands) *</label>
          <input
            type="number"
            required
            value={formData.premium}
            onChange={(e) => setFormData({ ...formData, premium: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 45"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Employees *</label>
          <input
            type="number"
            required
            value={formData.totalEmployees}
            onChange={(e) => setFormData({ ...formData, totalEmployees: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 8"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">HR Contact Name *</label>
          <input
            type="text"
            required
            value={formData.hrContactName}
            onChange={(e) => setFormData({ ...formData, hrContactName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Sara Ahmed"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HR Email *</label>
            <input
              type="email"
              required
              value={formData.hrContactEmail}
              onChange={(e) => setFormData({ ...formData, hrContactEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., sara@acme.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HR Phone *</label>
            <input
              type="tel"
              required
              value={formData.hrContactPhone}
              onChange={(e) => setFormData({ ...formData, hrContactPhone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., +92-300-1111111"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contract Start *</label>
            <input
              type="date"
              required
              value={formData.contractStart}
              onChange={(e) => setFormData({ ...formData, contractStart: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contract End *</label>
            <input
              type="date"
              required
              value={formData.contractEnd}
              onChange={(e) => setFormData({ ...formData, contractEnd: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add Corporate'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}



