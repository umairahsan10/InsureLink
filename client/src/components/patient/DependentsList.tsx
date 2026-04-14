"use client";

import { Dependent } from "@/types/dependent";
import { calculateAge } from "@/utils/dependentHelpers";
import { useState } from "react";

interface DependentsListProps {
  dependents: Dependent[];
  onRequestAdd: () => void;
}

export default function DependentsList({
  dependents,
  onRequestAdd,
}: DependentsListProps) {
  const [selectedDependent, setSelectedDependent] = useState<Dependent | null>(
    null,
  );
  const approved = dependents.filter((d) => d.status === "Approved");
  const pending = dependents.filter((d) => d.status === "Pending");
  const rejected = dependents.filter((d) => d.status === "Rejected");

  const getStatusBadge = (status: Dependent["status"]) => {
    switch (status) {
      case "Approved":
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Active
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <svg
              className="w-3 h-3 mr-1 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Pending
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            <svg
              className="w-3 h-3 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Rejected
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDependentDisplayName = (dependent: Dependent) => {
    const trimmedName = dependent.name?.trim();
    if (trimmedName) {
      return trimmedName;
    }

    const dependentWithParts = dependent as Dependent & {
      firstName?: string;
      lastName?: string;
    };
    const firstName = dependentWithParts.firstName?.trim() || "";
    const lastName = dependentWithParts.lastName?.trim() || "";
    const combined = [firstName, lastName].filter(Boolean).join(" ");

    return combined || "Not provided";
  };

  const DependentCard = ({ dependent }: { dependent: Dependent }) => (
    <div
      onClick={() => setSelectedDependent(dependent)}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">
            {getDependentDisplayName(dependent)}
          </h3>
          <p className="text-sm text-gray-600">
            {dependent.relationship} • Age {calculateAge(dependent.dateOfBirth)}
          </p>
        </div>
        {getStatusBadge(dependent.status)}
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        {dependent.status === "Approved" && (
          <p>
            <span className="font-medium">Status:</span> Active
          </p>
        )}
        {dependent.status === "Pending" && (
          <p>
            <span className="font-medium">Requested:</span>{" "}
            {formatDate(dependent.requestedAt)}
          </p>
        )}
        {dependent.status === "Rejected" && dependent.rejectionReason && (
          <p className="text-red-600">
            <span className="font-medium">Reason:</span>{" "}
            {dependent.rejectionReason}
          </p>
        )}
      </div>
      <p className="text-xs text-blue-600 mt-3 font-medium">
        Click to view details →
      </p>
    </div>
  );

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            My Dependents & Family Coverage
          </h2>
          <button
            onClick={onRequestAdd}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Request to Add Dependent
          </button>
        </div>

        {/* Approved Dependents */}
        {approved.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Active Dependents ({approved.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approved.map((dependent) => (
                <DependentCard key={dependent.id} dependent={dependent} />
              ))}
            </div>
          </div>
        )}

        {/* Pending Requests */}
        {pending.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Pending Requests ({pending.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pending.map((dependent) => (
                <DependentCard key={dependent.id} dependent={dependent} />
              ))}
            </div>
          </div>
        )}

        {/* Rejected Requests */}
        {rejected.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Rejected Requests ({rejected.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rejected.map((dependent) => (
                <DependentCard key={dependent.id} dependent={dependent} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {approved.length === 0 &&
          pending.length === 0 &&
          rejected.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No dependents yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Add a family member to your coverage
              </p>
              <button
                onClick={onRequestAdd}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Request to Add Dependent
              </button>
            </div>
          )}
      </div>

      {/* Details Modal */}
      {selectedDependent && (
        <div className="fixed inset-0 modal-backdrop animate-modal-overlay z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto animate-modal-content">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Dependent Details
              </h2>
              <button
                onClick={() => setSelectedDependent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Name & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Full Name
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {getDependentDisplayName(selectedDependent)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </p>
                  <p className="mt-1">
                    {getStatusBadge(selectedDependent.status)}
                  </p>
                </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Relationship
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedDependent.relationship}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Date of Birth
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(selectedDependent.dateOfBirth)}
                  </p>
                </div>
              </div>

              {/* Gender & Age */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Gender
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedDependent.gender}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Age
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {calculateAge(selectedDependent.dateOfBirth)} years
                  </p>
                </div>
              </div>

              {/* CNIC & Phone */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    CNIC/ID
                  </p>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {selectedDependent.cnic || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Phone Number
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedDependent.phoneNumber || "Not provided"}
                  </p>
                </div>
              </div>

              {/* Request Date */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Requested Date
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(selectedDependent.requestedAt)}
                </p>
              </div>

              {/* Rejection Reason */}
              {selectedDependent.status === "Rejected" &&
                selectedDependent.rejectionReason && (
                  <div className="pt-4 border-t border-gray-100 bg-red-50 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-red-700 uppercase">
                      Rejection Reason
                    </p>
                    <p className="mt-1 text-sm text-red-900">
                      {selectedDependent.rejectionReason}
                    </p>
                  </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedDependent(null)}
                className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
