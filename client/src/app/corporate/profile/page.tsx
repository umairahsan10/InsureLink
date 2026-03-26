"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { corporatesApi, type Corporate, type CorporateStats } from "@/lib/api/corporates";
import { formatPKR } from "@/lib/format";

type ProfileForm = {
  name: string;
  address: string;
  city: string;
  province: string;
  employeeCount: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contractStartDate: string;
  contractEndDate: string;
};

function toDateInput(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default function CorporateProfilePage() {
  const { user } = useAuth();
  const corporateId = user?.corporateId;

  const [profile, setProfile] = useState<Corporate | null>(null);
  const [stats, setStats] = useState<CorporateStats | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCorporateData = useCallback(async () => {
    if (!corporateId) {
      setError("Corporate profile is not linked to this account.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const [corporate, corporateStats] = await Promise.all([
        corporatesApi.getCorporateById(corporateId),
        corporatesApi.getCorporateStats(corporateId),
      ]);

      setProfile(corporate);
      setStats(corporateStats);
      setForm({
        name: corporate.name,
        address: corporate.address,
        city: corporate.city,
        province: corporate.province,
        employeeCount: corporate.employeeCount,
        contactName: corporate.contactName,
        contactEmail: corporate.contactEmail,
        contactPhone: corporate.contactPhone,
        contractStartDate: toDateInput(corporate.contractStartDate),
        contractEndDate: toDateInput(corporate.contractEndDate),
      });
    } catch (err) {
      console.error("Failed to load corporate profile:", err);
      setError("Could not load corporate profile.");
    } finally {
      setLoading(false);
    }
  }, [corporateId]);

  useEffect(() => {
    loadCorporateData();
  }, [loadCorporateData]);

  const onChange = (field: keyof ProfileForm, value: string) => {
    if (!form) return;
    setForm({
      ...form,
      [field]: field === "employeeCount" ? Number(value || 0) : value,
    });
  };

  const quickStats = useMemo(() => {
    if (!stats) {
      return {
        activeEmployees: 0,
        activeDependents: 0,
        usedCoverage: "Rs. 0",
      };
    }

    return {
      activeEmployees: stats.activeEmployees,
      activeDependents: stats.activeDependents,
      usedCoverage: formatPKR(Number(stats.usedCoverageAmount || 0)),
    };
  }, [stats]);

  const handleSave = async () => {
    if (!corporateId || !form) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const updated = await corporatesApi.updateCorporate(corporateId, {
        name: form.name,
        address: form.address,
        city: form.city,
        province: form.province,
        employeeCount: form.employeeCount,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        contractStartDate: form.contractStartDate,
        contractEndDate: form.contractEndDate,
      });

      setProfile(updated);
      setMessage("Corporate profile updated successfully.");
    } catch (err) {
      console.error("Failed to update corporate profile:", err);
      setError("Could not save changes. Please verify inputs and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return <div className="p-8 text-gray-600">Loading corporate profile...</div>;
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Company Profile</h1>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold text-gray-900">Company Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Company Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => onChange("name", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => onChange("city", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Province</label>
                    <input
                      type="text"
                      value={form.province}
                      onChange={(e) => onChange("province", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    rows={3}
                    value={form.address}
                    onChange={(e) => onChange("address", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Employee Count</label>
                  <input
                    type="number"
                    min={1}
                    value={form.employeeCount}
                    onChange={(e) => onChange("employeeCount", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold text-gray-900">Primary Contact</h2>
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Contact Name</label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => onChange("contactName", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Contact Email</label>
                    <input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => onChange("contactEmail", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Contact Phone</label>
                    <input
                      type="tel"
                      value={form.contactPhone}
                      onChange={(e) => onChange("contactPhone", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold text-gray-900">Contract Window</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Contract Start Date</label>
                  <input
                    type="date"
                    value={form.contractStartDate}
                    onChange={(e) => onChange("contractStartDate", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Contract End Date</label>
                  <input
                    type="date"
                    value={form.contractEndDate}
                    onChange={(e) => onChange("contractEndDate", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-purple-600 px-8 py-3 font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold text-gray-900">Account Status</h2>
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-sm text-gray-500">Corporate ID</p>
                  <p className="font-semibold text-gray-900">{profile?.id || "—"}</p>
                </div>
                <div>
                  <p className="mb-1 text-sm text-gray-500">Status</p>
                  <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                    {profile?.status || "Active"}
                  </span>
                </div>
                <div>
                  <p className="mb-1 text-sm text-gray-500">Total Amount Used</p>
                  <p className="font-semibold text-gray-900">{formatPKR(Number(profile?.totalAmountUsed || 0))}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold text-gray-900">Quick Stats</h2>
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-sm text-gray-500">Active Employees</p>
                  <p className="text-2xl font-bold text-purple-600">{quickStats.activeEmployees}</p>
                </div>
                <div>
                  <p className="mb-1 text-sm text-gray-500">Active Dependents</p>
                  <p className="text-2xl font-bold text-green-600">{quickStats.activeDependents}</p>
                </div>
                <div>
                  <p className="mb-1 text-sm text-gray-500">Used Coverage</p>
                  <p className="text-2xl font-bold text-orange-600">{quickStats.usedCoverage}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
