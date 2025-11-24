'use client';

import BaseModal from './BaseModal';

interface HospitalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalId: string;
  hospitalData?: {
    id: string;
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    [key: string]: any;
  };
}

export default function HospitalDetailsModal({ isOpen, onClose, hospitalId, hospitalData }: HospitalDetailsModalProps) {
  const hospital = hospitalData || {
    id: hospitalId,
    name: 'City General Hospital',
    address: '123 Main Street',
    phone: '+92-300-1234567',
    email: 'info@citygeneral.com',
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Hospital Details" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Hospital ID</label>
            <p className="mt-1 text-sm text-gray-900">{hospital.id}</p>
          </div>
          {hospital.name && (
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="mt-1 text-sm text-gray-900">{hospital.name}</p>
            </div>
          )}
          {hospital.address && (
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-500">Address</label>
              <p className="mt-1 text-sm text-gray-900">{hospital.address}</p>
            </div>
          )}
          {hospital.phone && (
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="mt-1 text-sm text-gray-900">{hospital.phone}</p>
            </div>
          )}
          {hospital.email && (
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="mt-1 text-sm text-gray-900">{hospital.email}</p>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </BaseModal>
  );
}



