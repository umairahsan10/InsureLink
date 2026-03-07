"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { insurersApi, Insurer } from "@/lib/api/insurers";
import { useAuth } from "@/contexts/AuthContext";

export default function InsurerProfilePage() {
  const { user } = useAuth();
  const insurerId = user?.insurerId;

  const [insurer, setInsurer] = useState<Insurer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    companyName: "",
    licenseNumber: "",
    address: "",
    city: "",
    province: "",
    maxCoverageLimit: 0,
    operatingSince: "",
    networkHospitalCount: 0,
    corporateClientCount: 0,
    status: "",
  });

  const loadInsurer = useCallback(async () => {
    if (!insurerId) return;
    setLoading(true);
    setError("");
    try {
      const data = await insurersApi.getInsurerById(insurerId);
      setInsurer(data);
      setFormData({
        companyName: data.companyName || "",
        licenseNumber: data.licenseNumber || "",
        address: data.address || "",
        city: data.city || "",
        province: data.province || "",
        maxCoverageLimit: data.maxCoverageLimit || 0,
        operatingSince: data.operatingSince || "",
        networkHospitalCount: data.networkHospitalCount || 0,
        corporateClientCount: data.corporateClientCount || 0,
        status: data.status || "",
      });
    } catch {
      setError("Failed to load insurer profile.");
    } finally {
      setLoading(false);
    }
  }, [insurerId]);

  useEffect(() => {
    loadInsurer();
  }, [loadInsurer]);

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!insurerId) return;
    setSaving(true);
    setError("");
    try {
      const updated = await insurersApi.updateInsurer(insurerId, {
        companyName: formData.companyName,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        maxCoverageLimit: formData.maxCoverageLimit,
        operatingSince: formData.operatingSince,
        networkHospitalCount: formData.networkHospitalCount,
        corporateClientCount: formData.corporateClientCount,
        status: formData.status,
      });
      setInsurer(updated);
      setEditing(false);
      setSuccessMsg("Profile updated successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (insurer) {
      setFormData({
        companyName: insurer.companyName || "",
        licenseNumber: insurer.licenseNumber || "",
        address: insurer.address || "",
        city: insurer.city || "",
        province: insurer.province || "",
        maxCoverageLimit: insurer.maxCoverageLimit || 0,
        operatingSince: insurer.operatingSince || "",
        networkHospitalCount: insurer.networkHospitalCount || 0,
        corporateClientCount: insurer.corporateClientCount || 0,
        status: insurer.status || "",
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <DashboardLayout userRole="insurer">
        <div className="p-8 flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!insurerId || !insurer) {
    return (
      <DashboardLayout userRole="insurer">
        <div className="p-8">
          <p className="text-red-600">{error || "No insurer profile found."}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="insurer">
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Insurer Profile</h1>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Company Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-50"
                    value={formData.companyName}
                    onChange={(e) =>
                      handleInputChange("companyName", e.target.value)
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      License Number
                    </label>
                    <input
                      type="text"
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-gray-50"
                      value={formData.licenseNumber}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Status
                    </label>
                    <input
                      type="text"
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-50"
                      value={formData.status}
                      onChange={(e) =>
                        handleInputChange("status", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Address
                  </label>
                  <textarea
                    rows={3}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-50"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-50"
                      value={formData.city}
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Province
                    </label>
                    <input
                      type="text"
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-50"
                      value={formData.province}
                      onChange={(e) =>
                        handleInputChange("province", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Coverage Details
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Max Coverage Limit (PKR)
                    </label>
                    <input
                      type="number"
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-50"
                      value={formData.maxCoverageLimit}
                      onChange={(e) =>
                        handleInputChange(
                          "maxCoverageLimit",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Operating Since
                    </label>
                    <input
                      type="text"
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-50"
                      value={formData.operatingSince}
                      onChange={(e) =>
                        handleInputChange("operatingSince", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Network Hospital Count
                    </label>
                    <input
                      type="number"
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-50"
                      value={formData.networkHospitalCount}
                      onChange={(e) =>
                        handleInputChange(
                          "networkHospitalCount",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Corporate Client Count
                    </label>
                    <input
                      type="number"
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-50"
                      value={formData.corporateClientCount}
                      onChange={(e) =>
                        handleInputChange(
                          "corporateClientCount",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                </div>

                {insurer.plans && insurer.plans.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Active Plans
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {insurer.plans.map((plan) => (
                        <div
                          key={plan.id}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              plan.isActive ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                          <span className="text-sm text-gray-900">
                            {plan.planName}
                          </span>
                          <span className="text-xs text-gray-500 ml-auto">
                            PKR {plan.sumInsured?.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Account Status
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-900">Status</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full ${
                      insurer.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {insurer.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-900">Operating Since</p>
                  <p className="font-semibold">
                    {insurer.operatingSince || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-900">Member Since</p>
                  <p className="font-semibold">
                    {new Date(insurer.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Network Overview
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-900">Partner Hospitals</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {insurer.networkHospitalCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-900">Corporate Clients</p>
                  <p className="text-2xl font-bold text-green-600">
                    {insurer.corporateClientCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-900">Max Coverage</p>
                  <p className="text-2xl font-bold text-purple-600">
                    PKR {insurer.maxCoverageLimit?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Quick Links
              </h2>
              <div className="space-y-2">
                <a
                  href="/insurer/plans"
                  className="block text-sm text-red-600 hover:underline"
                >
                  Manage Plans →
                </a>
                <a
                  href="/insurer/labs"
                  className="block text-sm text-red-600 hover:underline"
                >
                  Manage Labs →
                </a>
                <a
                  href="/insurer/hospitals"
                  className="block text-sm text-red-600 hover:underline"
                >
                  View Hospitals →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
