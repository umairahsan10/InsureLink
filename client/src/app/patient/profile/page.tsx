"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { patientsApi, type PatientProfile } from "@/lib/api/patients";
import { dependentsApi, type Dependent } from "@/lib/api/dependents";
import DependentsList from "@/components/patient/DependentsList";
import AddDependentModal from "@/components/patient/AddDependentModal";

export default function PatientProfilePage() {
  const { user } = useAuth();
  const [patientData, setPatientData] = useState<PatientProfile | null>(null);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", mobile: "" });

  // Fetch patient profile and dependents
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch patient profile
        const profile = await patientsApi.getMe();
        setPatientData(profile);

        // Initialize form with current data
        setFormData({
          email: profile.email || "",
          mobile: profile.mobile || "",
        });

        // Fetch dependents if it's an employee
        if (profile.patientType === "employee" && profile.id) {
          try {
            const depRes = await dependentsApi.list({
              employeeId: profile.id,
            });
            setDependents(depRes.items);
          } catch (err) {
            // Dependents might not be available, continue with patient data
            console.error("Failed to load dependents:", err);
          }
        }
      } catch (err) {
        console.error("Failed to load patient profile:", err);
        setError("Failed to load profile data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const handleSaveChanges = async () => {
    try {
      setSaveLoading(true);
      setError(null);

      await patientsApi.updateProfile({
        email: formData.email,
        mobile: formData.mobile,
      });

      // Update local state
      setPatientData((prev) =>
        prev
          ? {
              ...prev,
              email: formData.email,
              mobile: formData.mobile,
            }
          : null
      );

      // Show success message (you could use a toast here)
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to save profile:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddDependentSuccess = () => {
    setIsModalOpen(false);
    // Reload dependents
    const loadDependents = async () => {
      if (patientData?.id) {
        try {
          const depRes = await dependentsApi.list({
            employeeId: patientData.id,
          });
          setDependents(depRes.items);
        } catch (err) {
          console.error("Failed to reload dependents:", err);
        }
      }
    };
    loadDependents();
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full mb-2"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="p-4 text-center text-gray-500">
        Patient data not found
      </div>
    );
  }

  // Extract first and last names from full name
  const nameParts = (patientData.name || "").split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
        My Profile
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            Personal Information
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-gray-50 cursor-not-allowed"
                  value={firstName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-gray-50 cursor-not-allowed"
                  value={lastName}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                You can update your email address
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, mobile: e.target.value }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                You can update your phone number
              </p>
            </div>

            <button
              onClick={handleSaveChanges}
              disabled={saveLoading}
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            Insurance Details
          </h2>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Plan Name</p>
              <p className="font-semibold text-gray-900">
                {patientData.insurance || "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Corporate</p>
              <p className="font-semibold text-gray-900">
                {patientData.corporateName || "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                {patientData.status || "Active"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dependents Section - Only show for employees */}
      {patientData.patientType === "employee" && (
        <div className="mt-6">
          <DependentsList
            dependents={dependents}
            onRequestAdd={() => setIsModalOpen(true)}
          />
        </div>
      )}

      {/* Add Dependent Modal */}
      {patientData.patientType === "employee" && (
        <AddDependentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          employeeId={patientData.id}
          employeeName={patientData.name || ""}
          corporateId={patientData.id}
          onSuccess={handleAddDependentSuccess}
        />
      )}
    </div>
  );
}
