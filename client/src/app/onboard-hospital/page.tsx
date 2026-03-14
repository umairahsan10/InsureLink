"use client";

import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthContext } from "@/contexts/AuthContext";
import { hospitalsApi } from "@/lib/api/hospitals";

export default function OnboardHospitalPage() {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    hospitalName: "",
    licenseNumber: "",
    city: "",
    address: "",
    emergencyPhone: "",
    hospitalType: "reimbursable",
    hasEmergencyUnit: true,
    latitude: "",
    longitude: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const target = e.target;
    const value =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;
    setForm((prev) => ({ ...prev, [target.id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await hospitalsApi.createHospital({
        hospitalName: form.hospitalName,
        licenseNumber: form.licenseNumber,
        city: form.city,
        address: form.address,
        emergencyPhone: form.emergencyPhone,
        hospitalType: form.hospitalType,
        hasEmergencyUnit: form.hasEmergencyUnit,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        isActive: true,
      });

      // Refresh user session so hospitalId is populated
      await auth!.refreshUser();
      router.push("/hospital/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to create hospital profile";
      try {
        const parsed = JSON.parse(message);
        const serverMessage = Array.isArray(parsed.message)
          ? parsed.message.join(". ")
          : parsed.message;
        setError(serverMessage || "Failed to create hospital profile");
      } catch {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hospital Onboarding
          </h1>
          <p className="text-gray-600 mb-8">
            Register your hospital on InsureLink to start processing insurance
            claims
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Hospital Information
              </h2>

              <div>
                <label
                  htmlFor="hospitalName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Hospital Name *
                </label>
                <input
                  type="text"
                  id="hospitalName"
                  required
                  value={form.hospitalName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="Shifa International Hospital"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="SIH-2024-001"
                  />
                </div>

                <div>
                  <label
                    htmlFor="hospitalType"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Hospital Type *
                  </label>
                  <select
                    id="hospitalType"
                    required
                    value={form.hospitalType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  >
                    <option value="reimbursable">Reimbursable</option>
                    <option value="cashless">Cashless</option>
                    <option value="both">Both</option>
                  </select>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="H-8/4, Pitras Bukhari Road, Islamabad"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="Islamabad"
                  />
                </div>

                <div>
                  <label
                    htmlFor="emergencyPhone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Emergency Phone *
                  </label>
                  <input
                    type="text"
                    id="emergencyPhone"
                    required
                    value={form.emergencyPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="+92-51-8463000"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Location & Facilities
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="latitude"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    id="latitude"
                    value={form.latitude}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="33.6844"
                  />
                </div>

                <div>
                  <label
                    htmlFor="longitude"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    id="longitude"
                    value={form.longitude}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="73.0479"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hasEmergencyUnit"
                  checked={form.hasEmergencyUnit as unknown as boolean}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 rounded border-gray-300"
                />
                <label
                  htmlFor="hasEmergencyUnit"
                  className="text-sm font-medium text-gray-700"
                >
                  Has Emergency Unit
                </label>
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
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
