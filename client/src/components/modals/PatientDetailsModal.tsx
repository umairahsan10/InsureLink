"use client";

import BaseModal from "./BaseModal";

interface PatientDetails {
  id: string;
  name?: string;
  age?: number;
  gender?: string;
  email?: string;
  mobile?: string;
  cnic?: string;
  address?: string;
  bloodGroup?: string;
  lastVisit?: string;
  lastVisitDate?: string;
  insurance?: string;
  status?: string;
  insured?: boolean;
  corporateName?: string | null;
  designation?: string;
  department?: string;
  coverageStart?: string;
  coverageEnd?: string;
  [key: string]: any;
}

interface PatientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientData?: PatientDetails;
}

export default function PatientDetailsModal({
  isOpen,
  onClose,
  patientId,
  patientData,
}: PatientDetailsModalProps) {
  // In a real app, you would fetch patient data based on patientId
  const patient = patientData || {
    id: patientId,
    name: "John Doe",
    age: 45,
    lastVisit: "2025-10-06",
    insurance: "HealthGuard",
    status: "Active",
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Patient Details"
      size="xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Patient ID */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              Patient ID
            </label>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              {patient.id}
            </p>
          </div>

          {/* Status */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Status
            </label>
            <p className="mt-2">
              <span
                className={`inline-block px-3 py-1 text-xs font-semibold rounded-md ${
                  patient.status === "Active"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {patient.status}
              </span>
            </p>
          </div>

          {/* Full Name */}
          {patient.name && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <label className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                Full Name
              </label>
              <p className="mt-2 text-sm text-gray-900">{patient.name}</p>
            </div>
          )}

          {/* CNIC */}
          {patient.cnic && (
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <label className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                CNIC
              </label>
              <p className="mt-2 text-sm font-mono text-gray-900">
                {patient.cnic}
              </p>
            </div>
          )}

          {/* Age */}
          {patient.age && (
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <label className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                Age
              </label>
              <p className="mt-2 text-sm text-gray-900">{patient.age} years</p>
            </div>
          )}

          {/* Phone */}
          {patient.mobile && (
            <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
              <label className="text-xs font-semibold text-cyan-700 uppercase tracking-wide">
                Phone
              </label>
              <p className="mt-2 text-sm font-mono text-gray-900">
                {patient.mobile}
              </p>
            </div>
          )}

          {/* Email */}
          {patient.email && (
            <div className="bg-rose-50 rounded-lg p-4 border border-rose-200 col-span-3">
              <label className="text-xs font-semibold text-rose-700 uppercase tracking-wide">
                Email
              </label>
              <p className="mt-2 text-sm text-gray-900 truncate">
                {patient.email}
              </p>
            </div>
          )}

          {/* Address */}
          {patient.address && (
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 col-span-3">
              <label className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                Address
              </label>
              <p className="mt-2 text-sm text-gray-900">{patient.address}</p>
            </div>
          )}

          {/* Gender */}
          {patient.gender && (
            <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
              <label className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
                Gender
              </label>
              <p className="mt-2 text-sm text-gray-900">{patient.gender}</p>
            </div>
          )}

          {/* Insurance Type */}
          {patient.insurance && (
            <div className="bg-sky-50 rounded-lg p-4 border border-sky-200">
              <label className="text-xs font-semibold text-sky-700 uppercase tracking-wide">
                Insurance
              </label>
              <p className="mt-2 text-sm text-gray-900">{patient.insurance}</p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
