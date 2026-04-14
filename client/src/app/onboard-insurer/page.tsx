"use client";

import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthContext } from "@/contexts/AuthContext";
import { insurersApi } from "@/lib/api/insurers";

export default function OnboardInsurerPage() {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    companyName: "",
    licenseNumber: "",
    address: "",
    city: "",
    province: "",
    maxCoverageLimit: "",
    networkHospitalCount: "",
    corporateClientCount: "",
    operatingSince: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await insurersApi.createInsurer({
        companyName: form.companyName,
        licenseNumber: form.licenseNumber,
        address: form.address,
        city: form.city,
        province: form.province,
        maxCoverageLimit: Number(form.maxCoverageLimit),
        networkHospitalCount: form.networkHospitalCount
          ? Number(form.networkHospitalCount)
          : undefined,
        corporateClientCount: form.corporateClientCount
          ? Number(form.corporateClientCount)
          : undefined,
        operatingSince: form.operatingSince,
        isActive: true,
      });

      // Refresh user session so insurerId is populated
      await auth!.refreshUser();
      router.push("/insurer/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create insurer profile";
      try {
        const parsed = JSON.parse(message);
        setError(parsed.message || message);
      } catch {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Insurer Onboarding
          </h1>
          <p className="text-gray-600 mb-8">
            Set up your insurance company profile on InsureLink
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Company Information
              </h2>

              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Company Name *
                </label>
                <input
                  type="text"
                  id="companyName"
                  required
                  value={form.companyName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  placeholder="EFU Health Insurance"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="licenseNumber"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    License Number *
                  </label>
                  <input
                    type="text"
                    id="licenseNumber"
                    required
                    value={form.licenseNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                    placeholder="EFU-2024-001"
                  />
                </div>

                <div>
                  <label
                    htmlFor="operatingSince"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Operating Since *
                  </label>
                  <input
                    type="date"
                    id="operatingSince"
                    required
                    value={form.operatingSince}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Address *
                </label>
                <textarea
                  id="address"
                  rows={2}
                  required
                  value={form.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  placeholder="85-F, Block 6, P.E.C.H.S., Karachi"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    required
                    value={form.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                    placeholder="Karachi"
                  />
                </div>

                <div>
                  <label
                    htmlFor="province"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Province *
                  </label>
                  <select
                    id="province"
                    required
                    value={form.province}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Select province</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="KPK">Khyber Pakhtunkhwa</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="ICT">Islamabad Capital Territory</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Coverage Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="maxCoverageLimit"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Max Coverage Limit (PKR) *
                  </label>
                  <input
                    type="number"
                    id="maxCoverageLimit"
                    required
                    value={form.maxCoverageLimit}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                    placeholder="5000000"
                  />
                </div>

                <div>
                  <label
                    htmlFor="networkHospitalCount"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Network Hospitals
                  </label>
                  <input
                    type="number"
                    id="networkHospitalCount"
                    value={form.networkHospitalCount}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                    placeholder="120"
                  />
                </div>

                <div>
                  <label
                    htmlFor="corporateClientCount"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Corporate Clients
                  </label>
                  <input
                    type="number"
                    id="corporateClientCount"
                    value={form.corporateClientCount}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                    placeholder="45"
                  />
                </div>
              </div>
            </section>

            <div className="flex items-center justify-between pt-4">
              <Link
                href="/login"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to Login
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Setting up..." : "Complete Setup"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
