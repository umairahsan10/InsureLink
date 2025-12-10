"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ClaimStatusBadge from "@/components/claims/ClaimStatusBadge";
import { formatPKR } from "@/lib/format";
import MessageButton from "@/components/messaging/MessageButton";
import { useClaimsMessaging } from "@/contexts/ClaimsMessagingContext";
import { apiFetch } from "@/lib/api/client";
import ClaimDetailsModal from "@/components/modals/ClaimDetailsModal";
import ClaimEditModal from "@/components/modals/ClaimEditModal";

// Import data
import analyticsData from "@/data/analytics.json";
import claims from "@/data/claims.json";
import type { Claim } from "@/types/claims";
import { sortClaimsByDateDesc } from "@/lib/sort";

export default function HospitalDashboardPage() {
  const [cnicNumber, setCnicNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isClaimDetailsOpen, setIsClaimDetailsOpen] = useState(false);
  const [isClaimEditOpen, setIsClaimEditOpen] = useState(false);
  const [localClaims, setLocalClaims] = useState<Claim[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const { hasUnreadAlert } = useClaimsMessaging();
  const router = useRouter();
  const currentHospitalId = "hosp-001"; // City General Hospital

  // Load claims from localStorage on mount
  useEffect(() => {
    const CLAIMS_STORAGE_KEY = "hospital_claims_hosp-001";
    const savedClaims = localStorage.getItem(CLAIMS_STORAGE_KEY);
    if (savedClaims) {
      try {
        setLocalClaims(JSON.parse(savedClaims));
      } catch (e) {
        console.error("Failed to parse saved claims", e);
      }
    }
    setIsHydrated(true);
  }, []);

  // Save claims to localStorage whenever they change
  useEffect(() => {
    if (isHydrated && localClaims.length > 0) {
      const CLAIMS_STORAGE_KEY = "hospital_claims_hosp-001";
      localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(localClaims));
    }
  }, [localClaims, isHydrated]);

  const handleVerifyPatient = async () => {
    if (!cnicNumber.trim()) return;

    setIsVerifying(true);
    try {
      // API call to verify patient
      await apiFetch("/api/patients/verify", {
        method: "POST",
        body: JSON.stringify({ cnic: cnicNumber }),
      });
      // Handle success - could show a toast or update UI
      alert("Patient verified successfully");
      setCnicNumber("");
    } catch (error) {
      console.error("Failed to verify patient", error);
      alert("Failed to verify patient. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Filter claims by hospital ID
  const defaultClaims = (claims as Claim[]).filter(
    (claim) => claim.hospitalId === currentHospitalId
  );

  // Combine default claims with locally saved claims
  const allClaims = [...defaultClaims, ...localClaims];

  // Remove duplicates by ID
  const uniqueClaims = Array.from(
    new Map(allClaims.map((claim) => [claim.id, claim])).values()
  );

  // Calculate hospital-specific statistics from filtered claims
  const pendingClaims = uniqueClaims.filter((c) => c.status === "Pending");
  const approvedClaims = uniqueClaims.filter((c) => c.status === "Approved");

  const hospitalStats = {
    patientsToday: uniqueClaims.length, // Number of unique patients with claims
    claimsSubmitted: uniqueClaims.length,
    pendingApproval: pendingClaims.length,
    approvedToday: approvedClaims.length,
  };

  // Recent claims for hospital - sorted newest-first
  const recentClaims = sortClaimsByDateDesc(uniqueClaims)
    .slice(0, 4)
    .map((c) => ({
      id: c.id,
      patientName: c.employeeName || c.claimNumber || "—",
      cnic: "—",
      amount: c.amountClaimed || 0,
      date: c.admissionDate ?? c.createdAt ?? "—",
      status: c.status,
    }));

  return (
    <div className="p-4 lg:p-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Patients Today
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {hospitalStats.patientsToday}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Claims Submitted
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {hospitalStats.claimsSubmitted}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Pending Approval
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {hospitalStats.pendingApproval}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Approved Today
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {hospitalStats.approvedToday}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {/* Patient Verification */}
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <div className="flex items-center mb-4">
            <svg
              className="w-5 h-5 text-gray-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h2 className="text-base lg:text-lg font-semibold text-gray-900">
              Patient Verification
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient CNIC Number
              </label>
              <input
                type="text"
                value={cnicNumber}
                onChange={(e) => setCnicNumber(e.target.value)}
                placeholder="Enter CNIC (e.g., 42401-1234567-8)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              />
            </div>
            <button
              onClick={handleVerifyPatient}
              disabled={isVerifying || !cnicNumber.trim()}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? "Verifying..." : "Verify Patient"}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/hospital/claims?action=submit")}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Submit New Claim
            </button>
            <button
              onClick={() => router.push("/hospital/claims")}
              className="w-full bg-white text-gray-700 py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              View All Claims
            </button>
            <button
              onClick={() => router.push("/hospital/patients")}
              className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Patient Records
            </button>
          </div>
        </div>
      </div>

      {/* Recent Claims Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900">
              Recent Claims
            </h2>
            <button
              onClick={() => router.push("/hospital/claims")}
              className="text-xs lg:text-sm text-gray-500 hover:text-gray-700"
            >
              View All
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Claim ID
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="hidden md:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CNIC
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="hidden sm:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentClaims.map((claim) => {
                const hasAlert = hasUnreadAlert(claim.id, "hospital");
                return (
                  <tr
                    key={claim.id}
                    className={`hover:bg-gray-50 ${
                      hasAlert ? "border-l-4 border-red-500" : ""
                    }`}
                  >
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm font-medium text-gray-900">
                      {claim.id}
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900">
                      {claim.patientName}
                    </td>
                    <td className="hidden md:table-cell px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">
                      {claim.cnic}
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900">
                      {formatPKR(claim.amount as number)}
                    </td>
                    <td className="hidden sm:table-cell px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">
                      {claim.date}
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm">
                      <ClaimStatusBadge
                        status={
                          claim.status === "Approved"
                            ? "Approved"
                            : claim.status === "Rejected"
                            ? "Rejected"
                            : "Pending"
                        }
                      />
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm font-medium">
                      <div className="flex space-x-1 lg:space-x-2">
                        <button
                          onClick={() => {
                            setSelectedClaimId(claim.id);
                            setIsClaimDetailsOpen(true);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          View
                        </button>
                        {claim.status === "Pending" && (
                          <button
                            onClick={() => {
                              setSelectedClaimId(claim.id);
                              setIsClaimEditOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm font-medium">
                      <MessageButton claimId={claim.id} userRole="hospital" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedClaimId && (
        <>
          <ClaimDetailsModal
            isOpen={isClaimDetailsOpen}
            onClose={() => {
              setIsClaimDetailsOpen(false);
              setSelectedClaimId(null);
            }}
            claimId={selectedClaimId}
            claimData={recentClaims.find((c) => c.id === selectedClaimId)}
          />
          <ClaimEditModal
            isOpen={isClaimEditOpen}
            onClose={() => {
              setIsClaimEditOpen(false);
              setSelectedClaimId(null);
            }}
            claimId={selectedClaimId}
            claimData={recentClaims.find((c) => c.id === selectedClaimId)}
          />
        </>
      )}
    </div>
  );
}
