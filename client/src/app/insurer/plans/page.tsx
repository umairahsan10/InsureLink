"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  insurersApi,
  Plan,
  CreatePlanRequest,
  UpdatePlanRequest,
} from "@/lib/api/insurers";

export default function InsurerPlansPage() {
  const { user } = useAuth();
  const insurerId = user?.insurerId;

  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Detail drawer
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const [form, setForm] = useState({
    planName: "",
    planCode: "",
    sumInsured: "",
    coveredServices: "",
    serviceLimits: "",
    isActive: true,
  });

  const fetchPlans = useCallback(async () => {
    if (!insurerId) return;
    setIsLoading(true);
    try {
      const data = await insurersApi.getPlans(insurerId);
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plans");
    } finally {
      setIsLoading(false);
    }
  }, [insurerId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const filtered = useMemo(() => {
    return plans.filter((plan) => {
      const matchesSearch =
        !searchQuery ||
        plan.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.planCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && plan.isActive) ||
        (statusFilter === "Inactive" && !plan.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [plans, searchQuery, statusFilter]);

  const perPage = 10;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  function openCreate() {
    setEditingPlan(null);
    setForm({
      planName: "",
      planCode: "",
      sumInsured: "",
      coveredServices: "",
      serviceLimits: "",
      isActive: true,
    });
    setFormError("");
    setShowModal(true);
  }

  function openEdit(plan: Plan) {
    setEditingPlan(plan);
    setForm({
      planName: plan.planName,
      planCode: plan.planCode,
      sumInsured: String(plan.sumInsured),
      coveredServices:
        typeof plan.coveredServices === "string"
          ? plan.coveredServices
          : JSON.stringify(plan.coveredServices, null, 2),
      serviceLimits:
        typeof plan.serviceLimits === "string"
          ? plan.serviceLimits
          : JSON.stringify(plan.serviceLimits, null, 2),
      isActive: plan.isActive,
    });
    setFormError("");
    setShowModal(true);
  }

  function parseJsonOrArray(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  async function handleSave() {
    if (!insurerId) return;
    setIsSaving(true);
    setFormError("");

    const sumInsured = Number(form.sumInsured);
    if (isNaN(sumInsured) || sumInsured <= 0) {
      setFormError("Sum insured must be a positive number");
      setIsSaving(false);
      return;
    }

    try {
      if (editingPlan) {
        const payload: UpdatePlanRequest = {
          planName: form.planName,
          sumInsured,
          coveredServices: parseJsonOrArray(form.coveredServices),
          serviceLimits: parseJsonOrArray(form.serviceLimits),
          isActive: form.isActive,
        };
        await insurersApi.updatePlan(editingPlan.id, payload);
      } else {
        const payload: CreatePlanRequest = {
          planName: form.planName,
          planCode: form.planCode,
          sumInsured,
          coveredServices: parseJsonOrArray(form.coveredServices),
          serviceLimits: parseJsonOrArray(form.serviceLimits),
          isActive: form.isActive,
        };
        await insurersApi.createPlan(insurerId, payload);
      }
      setShowModal(false);
      fetchPlans();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save plan");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(planId: string) {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      await insurersApi.deletePlan(planId);
      fetchPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete plan");
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function renderJsonPreview(value: unknown) {
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object" && value !== null)
      return JSON.stringify(value);
    return String(value);
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
              Insurance Plans
            </h1>
            <p className="text-gray-600 mt-1">
              Create and manage insurance plan offerings
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            + New Plan
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
            <p className="text-sm text-gray-500">Total Plans</p>
            <p className="text-2xl font-bold text-gray-900">{plans.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Active Plans</p>
            <p className="text-2xl font-bold text-green-600">
              {plans.filter((p) => p.isActive).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Inactive Plans</p>
            <p className="text-2xl font-bold text-yellow-600">
              {plans.filter((p) => !p.isActive).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Avg. Sum Insured</p>
            <p className="text-2xl font-bold text-blue-600">
              {plans.length > 0
                ? formatCurrency(
                    plans.reduce((a, p) => a + p.sumInsured, 0) / plans.length,
                  )
                : "—"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search by plan name or code..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
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
                    Plan Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    Sum Insured
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    Covered Services
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
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      {plans.length === 0
                        ? 'No plans created yet. Click "+ New Plan" to get started.'
                        : "No plans match your filters."}
                    </td>
                  </tr>
                ) : (
                  paginated.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td
                        className="px-4 py-3 font-medium text-gray-900 cursor-pointer hover:text-red-600"
                        onClick={() => setSelectedPlan(plan)}
                      >
                        {plan.planName}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {plan.planCode}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {formatCurrency(plan.sumInsured)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                        {renderJsonPreview(plan.coveredServices)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${
                            plan.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {plan.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(plan)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(plan.id)}
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

        {/* Detail Drawer */}
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
            <div className="bg-white w-full max-w-md shadow-xl overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Plan Details
                  </h2>
                  <button
                    onClick={() => setSelectedPlan(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    &times;
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Plan Name</p>
                    <p className="font-medium">{selectedPlan.planName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Plan Code</p>
                    <p className="font-mono text-sm">{selectedPlan.planCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sum Insured</p>
                    <p className="font-medium text-lg">
                      {formatCurrency(selectedPlan.sumInsured)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        selectedPlan.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {selectedPlan.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Covered Services
                    </p>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                      {typeof selectedPlan.coveredServices === "string"
                        ? selectedPlan.coveredServices
                        : JSON.stringify(selectedPlan.coveredServices, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Service Limits</p>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                      {typeof selectedPlan.serviceLimits === "string"
                        ? selectedPlan.serviceLimits
                        : JSON.stringify(selectedPlan.serviceLimits, null, 2)}
                    </pre>
                  </div>
                  <div className="text-xs text-gray-400">
                    Created:{" "}
                    {new Date(selectedPlan.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setSelectedPlan(null);
                      openEdit(selectedPlan);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                  >
                    Edit Plan
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPlan(null);
                      handleDelete(selectedPlan.id);
                    }}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {editingPlan ? "Edit Plan" : "Create New Plan"}
                </h2>

                {formError && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                    {formError}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Plan Name *
                      </label>
                      <input
                        type="text"
                        value={form.planName}
                        onChange={(e) =>
                          setForm({ ...form, planName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Plan Code *
                      </label>
                      <input
                        type="text"
                        value={form.planCode}
                        onChange={(e) =>
                          setForm({ ...form, planCode: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        disabled={!!editingPlan}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sum Insured (PKR) *
                    </label>
                    <input
                      type="number"
                      value={form.sumInsured}
                      onChange={(e) =>
                        setForm({ ...form, sumInsured: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Covered Services *{" "}
                      <span className="text-gray-400 font-normal">
                        (comma-separated or JSON)
                      </span>
                    </label>
                    <textarea
                      value={form.coveredServices}
                      onChange={(e) =>
                        setForm({ ...form, coveredServices: e.target.value })
                      }
                      rows={3}
                      placeholder='OPD, IPD, Maternity, Dental or {"opd": true, "ipd": true}'
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Limits *{" "}
                      <span className="text-gray-400 font-normal">
                        (comma-separated or JSON)
                      </span>
                    </label>
                    <textarea
                      value={form.serviceLimits}
                      onChange={(e) =>
                        setForm({ ...form, serviceLimits: e.target.value })
                      }
                      rows={3}
                      placeholder='{"opd": 50000, "ipd": 500000, "maternity": 100000}'
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="planActive"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm({ ...form, isActive: e.target.checked })
                      }
                      className="rounded"
                    />
                    <label
                      htmlFor="planActive"
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
                      : editingPlan
                        ? "Update Plan"
                        : "Create Plan"}
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
