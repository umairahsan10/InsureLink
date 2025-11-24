'use client';

import { useState, useEffect } from 'react';
import BaseModal from './BaseModal';

interface EditableClaimData {
  id: string;
  amount?: string;
  treatment?: string;
}

interface ClaimEditForm {
  amount: string;
  treatment: string;
  description: string;
}

interface ClaimEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string;
  claimData?: EditableClaimData;
  onSave?: (updatedData: ClaimEditForm) => void;
}

export default function ClaimEditModal({ isOpen, onClose, claimId, claimData, onSave }: ClaimEditModalProps) {
  const [formData, setFormData] = useState<ClaimEditForm>({
    amount: '',
    treatment: '',
    description: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (claimData) {
      setFormData({
        amount: claimData.amount?.replace('$', '') || '',
        treatment: claimData.treatment || '',
        description: '',
      });
    }
  }, [claimData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // TODO: API call to update claim
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSave?.(formData);
      onClose();
    } catch (error) {
      console.error('Failed to update claim', error);
      alert('Failed to update claim. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Edit Claim" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-sm text-gray-500">
          Editing claim <span className="font-semibold text-gray-900">{claimId}</span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Treatment *</label>
          <input
            type="text"
            required
            value={formData.treatment}
            onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Additional details..."
          />
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
            disabled={isSaving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}



