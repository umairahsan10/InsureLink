"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  insurersApi,
  Lab,
  CreateLabRequest,
  UpdateLabRequest,
} from "@/lib/api/insurers";

export default function InsurerLabsPage() {
  const { user } = useAuth();
  const insurerId = user?.insurerId;

  const [labs, setLabs] = useState<Lab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Form fields
  const [form, setForm] = useState({
    labName: "",
    city: "",
    address: "",
    licenseNumber: "",
    contactPhone: "",
    contactEmail: "",
    testCategories: "" as string,
    isActive: true,
  });

  const fetchLabs = useCallback(async () => {
    if (!insurerId) return;
    setIsLoading(true);
    try {
      const data = await insurersApi.getLabs(insurerId);
      setLabs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load labs");
    } finally {
      setIsLoading(false);
    }
  }, [insurerId]);

  useEffect(() => {
    fetchLabs();
  }, [fetchLabs]);

  const cities = useMemo(() => {
    const unique = [...new Set(labs.map((l) => l.city))].sort();
    return ["All Cities", ...unique];
  }, [labs]);

  const filtered = useMemo(() => {
    return labs.filter((lab) => {
      const matchesSearch =
        !searchQuery ||
        lab.labName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lab.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lab.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity =
        cityFilter === "All Cities" || lab.city === cityFilter;
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && lab.isActive) ||
        (statusFilter === "Inactive" && !lab.isActive);
      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [labs, searchQuery, cityFilter, statusFilter]);

  const perPage = 10;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  function openCreate() {
    setEditingLab(null);
    setForm({
      labName: "",
      city: "",
      address: "",
      licenseNumber: "",
      contactPhone: "",
      contactEmail: "",
      testCategories: "",
      isActive: true,
    });
    setFormError("");
    setShowModal(true);
  }

  function openEdit(lab: Lab) {
    setEditingLab(lab);
    setForm({
      labName: lab.labName,
      city: lab.city,
      address: lab.address,
      licenseNumber: lab.licenseNumber,
      contactPhone: lab.contactPhone,
      contactEmail: lab.contactEmail,
      testCategories:
        typeof lab.testCategories === "string"
          ? lab.testCategories
          : JSON.stringify(lab.testCategories),
      isActive: lab.isActive,
    });
    setFormError("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!insurerId) return;
    setIsSaving(true);
    setFormError("");

    let parsedCategories: unknown;
    try {
      parsedCategories = JSON.parse(form.testCategories);
    } catch {
      parsedCategories = form.testCategories
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    try {
      if (editingLab) {
        const payload: UpdateLabRequest = {
          labName: form.labName,
          city: form.city,
          address: form.address,
          contactPhone: form.contactPhone,
          contactEmail: form.contactEmail,
          testCategories: parsedCategories,
          isActive: form.isActive,
        };
        await insurersApi.updateLab(editingLab.id, payload);
      } else {
        const payload: CreateLabRequest = {
          labName: form.labName,
          city: form.city,
          address: form.address,
          licenseNumber: form.licenseNumber,
          contactPhone: form.contactPhone,
          contactEmail: form.contactEmail,
          testCategories: parsedCategories,
          isActive: form.isActive,
        };
        await insurersApi.createLab(insurerId, payload);
      }
      setShowModal(false);
      fetchLabs();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save lab");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(labId: string) {
    if (!confirm("Are you sure you want to delete this lab?")) return;
    try {
      await insurersApi.deleteLab(labId);
      fetchLabs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete lab");
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole="insurer" notifications={[]}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="insurer" notifications={[]}>
      <div className="p-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Network Labs
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your network of diagnostic and pathology laboratories
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            + Add Lab
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Labs</p>
            <p className="text-2xl font-bold text-gray-900">{labs.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {labs.filter((l) => l.isActive).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Inactive</p>
            <p className="text-2xl font-bold text-yellow-600">
              {labs.filter((l) => !l.isActive).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Cities Covered</p>
            <p className="text-2xl font-bold text-blue-600">
              {new Set(labs.map((l) => l.city)).size}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search labs..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <select
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option>All</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    Lab Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    City
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    License #
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      {labs.length === 0
                        ? "No labs added yet. Click "+ Add Lab" to get started."
                        : "No labs match your filters."}
                    </td>
                  </tr>
                ) : (
                  paginated.map((lab) => (
                    <tr key={lab.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {lab.labName}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{lab.city}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {lab.licenseNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {lab.contactPhone}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {lab.contactEmail}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${
                            lab.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {lab.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(lab)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(lab.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
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
                          ? "bg-red-500 text-white border-red-500"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
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

        {/* Create / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {editingLab ? "Edit Lab" : "Add New Lab"}
                </h2>

                {formError && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                    {formError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lab Name *
                    </label>
                    <input
                      type="text"
                      value={form.labName}
                      onChange={(e) =>
                        setForm({ ...form, labName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) =>
                          setForm({ ...form, city: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        License Number *
                      </label>
                      <input
                        type="text"
                        value={form.licenseNumber}
                        onChange={(e) =>
                          setForm({ ...form, licenseNumber: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        disabled={!!editingLab}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Phone *
                      </label>
                      <input
                        type="text"
                        value={form.contactPhone}
                        onChange={(e) =>
                          setForm({ ...form, contactPhone: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Email *
                      </label>
                      <input
                        type="email"
                        value={form.contactEmail}
                        onChange={(e) =>
                          setForm({ ...form, contactEmail: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Categories *{" "}
                      <span className="text-gray-400 font-normal">
                        (comma-separated)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={form.testCategories}
                      onChange={(e) =>
                        setForm({ ...form, testCategories: e.target.value })
                      }
                      placeholder="Blood Tests, Radiology, Pathology"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="labActive"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm({ ...form, isActive: e.target.checked })
                      }
                      className="rounded"
                    />
                    <label
                      htmlFor="labActive"
                      className="text-sm text-gray-700"
                    >
                      Active
                    </label>
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
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {isSaving
                      ? "Saving..."
                      : editingLab
                      ? "Update Lab"
                      : "Create Lab"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
