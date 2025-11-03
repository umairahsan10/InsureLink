'use client';

import { Dependent } from '@/types/dependent';
import { calculateAge } from '@/utils/dependentHelpers';

interface EmployeeDependentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  dependents: Dependent[];
}

export default function EmployeeDependentsModal({ 
  isOpen, 
  onClose, 
  employeeName, 
  dependents 
}: EmployeeDependentsModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-100 px-6 py-4 border-b border-gray-300 sticky top-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {employeeName}&apos;s Dependents
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {dependents.length} {dependents.length === 1 ? 'dependent' : 'dependents'} registered
              </p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {dependents.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No dependents</h3>
              <p className="mt-1 text-sm text-gray-500">This employee has no registered dependents</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dependents.map((dependent, index) => (
                <div key={dependent.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {index + 1}. {dependent.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {dependent.relationship} • Age {calculateAge(dependent.dateOfBirth)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                      dependent.status === 'Approved' 
                        ? 'bg-green-100 text-green-800' 
                        : dependent.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {dependent.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Gender</p>
                      <p className="font-medium text-gray-900">{dependent.gender}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">CNIC/ID</p>
                      <p className="font-medium text-gray-900">{dependent.cnic || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{dependent.phoneNumber || 'N/A'}</p>
                    </div>
                    {dependent.status === 'Approved' && (
                      <div>
                        <p className="text-gray-500">Coverage Start</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(dependent.coverageStartDate)}
                        </p>
                      </div>
                    )}
                  </div>

                  {dependent.status === 'Rejected' && dependent.rejectionReason && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-red-600">Rejection Reason</p>
                      <p className="text-sm text-gray-700 mt-1">{dependent.rejectionReason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

