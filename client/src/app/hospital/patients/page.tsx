"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import PatientDetailsModal from "@/components/modals/PatientDetailsModal";
import { patientsApi, Patient } from "@/lib/api/patients";

export default function HospitalPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isPatientDetailsOpen, setIsPatientDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await patientsApi.getPatients({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
      setPatients(result.items);
      setTotalPatients(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load patients");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Debounce search - reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(totalPatients / itemsPerPage));

  // Analytics from loaded data
  const analytics = useMemo(() => {
    return {
      totalPatients,
      activePatients: patients.filter((p) => p.status === "Active").length,
      withClaims: patients.filter((p) => (p as any).hasActiveClaims).length,
    };
  }, [patients, totalPatients]);

  if (isLoading && patients.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Patient Records
          </h1>
          <p className="text-xs lg:text-sm text-gray-600">
            Manage patient information and records
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Patients</p>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.totalPatients}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Active Patients</p>
          <p className="text-2xl font-bold text-green-600">
            {analytics.activePatients}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">With Active Claims</p>
          <p className="text-2xl font-bold text-orange-600">
            {analytics.withClaims}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-3 lg:p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
            <input
              type="text"
              placeholder="Search by name, CNIC, or email..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="flex-1 px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm lg:text-base"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm lg:text-base"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Patient ID
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="hidden sm:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Age
                </th>
                <th className="hidden md:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Visit
                </th>
                <th className="hidden md:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Insurance
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {patients.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    {isLoading ? "Loading..." : "No patients match your current filters."}
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm font-medium text-gray-900">
                      {patient.id.substring(0, 8)}...
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-900">
                      {patient.name}
                    </td>
                    <td className="hidden sm:table-cell px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-500">
                      {patient.age}
                    </td>
                    <td className="hidden md:table-cell px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-500">
                      {patient.lastVisit || "—"}
                    </td>
                    <td className="hidden md:table-cell px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-500">
                      {patient.insurance || "—"}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                          patient.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm">
                      <button
                        onClick={() => {
                          setSelectedPatientId(patient.id);
                          setIsPatientDetailsOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Info */}
      {totalPatients > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-100 overflow-hidden border border-gray-200 px-6 py-3">
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {totalPatients === 0
                    ? 0
                    : (currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    totalPatients,
                    currentPage * itemsPerPage
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">{totalPatients}</span>{" "}
                patients
              </p>

              <label className="text-sm text-gray-600">Items per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 text-sm rounded-md border ${
                  currentPage === 1
                    ? "text-gray-300 border-gray-200 bg-gray-50"
                    : "text-gray-500 border-gray-300 bg-white hover:bg-gray-50"
                }`}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-3 py-1 text-sm rounded-md border ${
                    p === currentPage
                      ? "text-white bg-blue-600 border-blue-600"
                      : "text-gray-500 bg-white border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className={`px-3 py-1 text-sm rounded-md border ${
                  currentPage === totalPages
                    ? "text-gray-300 border-gray-200 bg-gray-50"
                    : "text-gray-500 border-gray-300 bg-white hover:bg-gray-50"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPatientId && (
        <PatientDetailsModal
          isOpen={isPatientDetailsOpen}
          onClose={() => {
            setIsPatientDetailsOpen(false);
            setSelectedPatientId(null);
          }}
          patientId={selectedPatientId}
          patientData={
            patients.find((p) => p.id === selectedPatientId) as any
          }
        />
      )}
    </div>
  );
}
