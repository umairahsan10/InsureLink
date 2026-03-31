"use client";

import { useContext, useEffect, useState, useMemo, useCallback } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import {
  hospitalsApi,
  HospitalVisit,
  CreateHospitalVisitRequest,
} from "@/lib/api/hospitals";
import { dependentsApi, Dependent } from "@/lib/api/dependents";

// Helper function to get patient name (employee or dependent)
const getPatientName = (visit: HospitalVisit): string => {
  if (visit.dependent) {
    return `${visit.dependent.firstName} ${visit.dependent.lastName}`;
  }
  if (visit.employee?.user) {
    return `${visit.employee.user.firstName} ${visit.employee.user.lastName}`;
  }
  return "Unknown Patient";
};

// Helper function to get dependent name
const getDependentName = (visit: HospitalVisit): string => {
  if (visit.dependent) {
    return `${visit.dependent.firstName} ${visit.dependent.lastName}`;
  }
  return "—";
};

export default function HospitalVisitsPage() {
  const auth = useContext(AuthContext);
  const hospitalId = auth?.user?.hospitalId;

  const [visits, setVisits] = useState<HospitalVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Create modal
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    employeeNumber: "",
    dependentId: "",
    visitDate: "",
    dischargeDate: "",
  });
  const [availableDependents, setAvailableDependents] = useState<Dependent[]>(
    [],
  );

  // Load dependents when user presses Enter on employee number field
  const handleLoadDependents = async () => {
    if (!form.employeeNumber) {
      setAvailableDependents([]);
      return;
    }

    try {
      const deps = await dependentsApi.getDependentsByEmployeeNumber(
        form.employeeNumber,
      );
      setAvailableDependents(deps);
    } catch (err) {
      console.error("Failed to load dependents:", err);
      setAvailableDependents([]);
    }
  };

  const handleEmployeeNumberKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      handleLoadDependents();
    }
  };

  const fetchVisits = useCallback(async () => {
    if (!hospitalId) return;
    setIsLoading(true);
    try {
      const data = await hospitalsApi.getVisits(hospitalId);
      setVisits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load visits");
    } finally {
      setIsLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const filtered = useMemo(() => {
    if (!searchQuery) return visits;
    const q = searchQuery.toLowerCase();
    return visits.filter(
      (v) =>
        getPatientName(v).toLowerCase().includes(q) ||
        v.employee?.employeeNumber?.toLowerCase().includes(q) ||
        v.employeeId?.toLowerCase().includes(q) ||
        v.dependentId?.toLowerCase().includes(q) ||
        v.dependent?.firstName?.toLowerCase().includes(q) ||
        v.dependent?.lastName?.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q),
    );
  }, [visits, searchQuery]);

  const perPage = 10;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  // Stats
  const today = new Date().toISOString().split("T")[0];
  const todayVisits = visits.filter(
    (v) => v.visitDate.split("T")[0] === today,
  ).length;
  const activeVisits = visits.filter((v) => !v.dischargeDate).length;

  function openCreate() {
    setForm({
      employeeNumber: "",
      dependentId: "",
      visitDate: new Date().toISOString().split("T")[0],
      dischargeDate: "",
    });
    setAvailableDependents([]);
    setFormError("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!hospitalId) return;
    setIsSaving(true);
    setFormError("");

    try {
      const payload: CreateHospitalVisitRequest = {
        employeeNumber: form.employeeNumber,
        hospitalId,
        visitDate: form.visitDate,
      };
      if (form.dependentId) payload.dependentId = form.dependentId;
      if (form.dischargeDate) payload.dischargeDate = form.dischargeDate;

      await hospitalsApi.createVisit(hospitalId, payload);
      setShowModal(false);
      fetchVisits();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to record visit",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function formatDate(dateStr: string | undefined) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (isLoading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hospital Visits</h1>
          <p className="text-gray-600 mt-1">
            Track and manage patient visits to your hospital
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          + Record Visit
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Visits</p>
          <p className="text-2xl font-bold text-gray-900">{visits.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Today&apos;s Visits</p>
          <p className="text-2xl font-bold text-green-600">{todayVisits}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Currently Admitted</p>
          <p className="text-2xl font-bold text-blue-600">{activeVisits}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Discharged</p>
          <p className="text-2xl font-bold text-gray-400">
            {visits.length - activeVisits}
          </p>
        </div>
      </div>

      {/* Filter + Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search by patient name, employee number, or dependent name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                  Patient Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                  Employee Number
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                  Dependent
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                  Visit Date
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                  Discharge Date
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {visits.length === 0
                      ? 'No visits recorded yet. Click "+ Record Visit" to get started.'
                      : "No visits match your search."}
                  </td>
                </tr>
              ) : (
                paginated.map((visit) => (
                  <tr key={visit.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {getPatientName(visit)}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {visit.employee?.employeeNumber ||
                        visit.employeeId ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {getDependentName(visit)}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {formatDate(visit.visitDate)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(visit.dischargeDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          visit.dischargeDate
                            ? "bg-gray-100 text-gray-600"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {visit.dischargeDate ? "Discharged" : "Admitted"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * perPage + 1} to{" "}
              {Math.min(currentPage * perPage, filtered.length)} of{" "}
              {filtered.length} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      currentPage === page
                        ? "bg-green-500 text-white border-green-500"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Visit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Record New Visit
              </h2>

              {formError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Number *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.employeeNumber}
                      onChange={(e) =>
                        setForm({ ...form, employeeNumber: e.target.value })
                      }
                      onKeyPress={handleEmployeeNumberKeyPress}
                      placeholder="Enter employee number"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleLoadDependents}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
                      disabled={!form.employeeNumber}
                    >
                      Load
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dependent{" "}
                    <span className="text-gray-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  {availableDependents.length > 0 ? (
                    <select
                      value={form.dependentId}
                      onChange={(e) =>
                        setForm({ ...form, dependentId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="">
                        Select a dependent (or leave empty)
                      </option>
                      {availableDependents.map((dep) => (
                        <option key={dep.id} value={dep.id}>
                          {dep.name} ({dep.relationship})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                      {form.employeeNumber
                        ? "No dependents found for this employee"
                        : "Enter employee number first"}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Visit Date *
                    </label>
                    <input
                      type="date"
                      value={form.visitDate}
                      onChange={(e) =>
                        setForm({ ...form, visitDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discharge Date
                    </label>
                    <input
                      type="date"
                      value={form.dischargeDate}
                      onChange={(e) =>
                        setForm({ ...form, dischargeDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Record Visit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
