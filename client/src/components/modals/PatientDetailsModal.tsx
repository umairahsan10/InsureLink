'use client';

import BaseModal from './BaseModal';

interface PatientDetails {
  id: string;
  name?: string;
  age?: number;
  lastVisit?: string;
  insurance?: string;
  status?: string;
}

interface PatientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientData?: PatientDetails;
}

export default function PatientDetailsModal({ isOpen, onClose, patientId, patientData }: PatientDetailsModalProps) {
  // In a real app, you would fetch patient data based on patientId
  const patient = patientData || {
    id: patientId,
    name: 'John Doe',
    age: 45,
    lastVisit: '2025-10-06',
    insurance: 'HealthGuard',
    status: 'Active',
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Patient Details" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Patient ID</label>
            <p className="mt-1 text-sm text-gray-900">{patient.id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <p className="mt-1 text-sm text-gray-900">
              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                patient.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {patient.status}
              </span>
            </p>
          </div>
          {patient.name && (
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="mt-1 text-sm text-gray-900">{patient.name}</p>
            </div>
          )}
          {patient.age && (
            <div>
              <label className="text-sm font-medium text-gray-500">Age</label>
              <p className="mt-1 text-sm text-gray-900">{patient.age}</p>
            </div>
          )}
          {patient.lastVisit && (
            <div>
              <label className="text-sm font-medium text-gray-500">Last Visit</label>
              <p className="mt-1 text-sm text-gray-900">{patient.lastVisit}</p>
            </div>
          )}
          {patient.insurance && (
            <div>
              <label className="text-sm font-medium text-gray-500">Insurance</label>
              <p className="mt-1 text-sm text-gray-900">{patient.insurance}</p>
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



