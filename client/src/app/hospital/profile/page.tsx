"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  hospitalsApi,
  Hospital,
  UpdateHospitalRequest,
} from "@/lib/api/hospitals";

export default function HospitalProfilePage() {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId;

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    hospitalName: "",
    licenseNumber: "",
    address: "",
    city: "",
    emergencyPhone: "",
    hospitalType: "",
    hasEmergencyUnit: false,
  });

  const fetchHospital = useCallback(async () => {
    if (!hospitalId) return;
    setIsLoading(true);
    try {
      const data = await hospitalsApi.getHospitalById(hospitalId);
      setHospital(data);
      setForm({
        hospitalName: data.hospitalName,
        licenseNumber: data.licenseNumber,
        address: data.address,
        city: data.city,
        emergencyPhone: data.emergencyPhone,
        hospitalType: data.hospitalType,
        hasEmergencyUnit: data.hasEmergencyUnit,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load hospital profile",
      );
    } finally {
      setIsLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    fetchHospital();
  }, [fetchHospital]);

  async function handleSave() {
    if (!hospitalId) return;
    setIsSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const payload: UpdateHospitalRequest = {
        hospitalName: form.hospitalName,
        address: form.address,
        city: form.city,
        emergencyPhone: form.emergencyPhone,
        hospitalType: form.hospitalType,
        hasEmergencyUnit: form.hasEmergencyUnit,
      };
      const updated = await hospitalsApi.updateHospital(hospitalId, payload);
      setHospital(updated);
      setIsEditing(false);
      setSuccessMsg("Profile updated successfully");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error || "Hospital profile not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Hospital Profile
          </h1>
          <p className="text-sm text-gray-600">
            Manage your hospital information and settings
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setForm({
                  hospitalName: hospital.hospitalName,
                  licenseNumber: hospital.licenseNumber,
                  address: hospital.address,
                  city: hospital.city,
                  emergencyPhone: hospital.emergencyPhone,
                  hospitalType: hospital.hospitalType,
                  hasEmergencyUnit: hospital.hasEmergencyUnit,
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <div className="bg-white rounded-lg shadow p-4 lg:p-6">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
              Hospital Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital Name
                </label>
                <input
                  type="text"
                  value={form.hospitalName}
                  onChange={(e) =>
                    setForm({ ...form, hospitalName: e.target.value })
                  }
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                    isEditing
                      ? "text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      : "text-gray-500 bg-gray-100 cursor-not-allowed"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number
                  </label>
                  <input
                    type="text"
                    value={form.licenseNumber}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hospital Type
                  </label>
                  <input
                    type="text"
                    value={form.hospitalType}
                    onChange={(e) =>
                      setForm({ ...form, hospitalType: e.target.value })
                    }
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                      isEditing
                        ? "text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        : "text-gray-500 bg-gray-100 cursor-not-allowed"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                    isEditing
                      ? "text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      : "text-gray-500 bg-gray-100 cursor-not-allowed"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                      isEditing
                        ? "text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        : "text-gray-500 bg-gray-100 cursor-not-allowed"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    value={form.emergencyPhone}
                    onChange={(e) =>
                      setForm({ ...form, emergencyPhone: e.target.value })
                    }
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                      isEditing
                        ? "text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        : "text-gray-500 bg-gray-100 cursor-not-allowed"
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="emergencyUnit"
                  checked={form.hasEmergencyUnit}
                  onChange={(e) =>
                    setForm({ ...form, hasEmergencyUnit: e.target.checked })
                  }
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-green-600"
                />
                <label
                  htmlFor="emergencyUnit"
                  className="text-sm text-gray-700"
                >
                  Has Emergency Unit
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Status</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <span
                  className={`inline-block px-2 py-1 text-xs rounded-full ${
                    hospital.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {hospital.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-semibold text-gray-900">
                  {new Date(hospital.createdAt).toLocaleDateString("en-PK", {
                    year: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
              {hospital.latitude && hospital.longitude && (
                <div>
                  <p className="text-sm text-gray-500">Coordinates</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {hospital.latitude}, {hospital.longitude}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
