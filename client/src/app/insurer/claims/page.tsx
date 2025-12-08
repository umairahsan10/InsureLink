"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import MessageButton from "@/components/messaging/MessageButton";
import { useClaimsMessaging } from "@/contexts/ClaimsMessagingContext";
import notificationsData from "@/data/insurerNotifications.json";
import { AlertNotification } from "@/types";
import { ClaimRecord } from "@/components/claims/ClaimActionDrawer";
import ClaimDetailsModal from "@/components/claims/ClaimDetailsModal";
import {
  ClaimData,
  CLAIMS_STORAGE_KEY,
  CLAIMS_UPDATED_EVENT,
  defaultClaimData,
  loadStoredClaims,
  persistClaims,
} from "@/data/claimsData";
import { formatPKR } from "@/lib/format";

export default function InsurerClaimsPage() {
  const router = useRouter();
  const insurerNotifications = useMemo(
    () =>
      (notificationsData as AlertNotification[]).map((notification) => ({
        ...notification,
      })),
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [hospitalFilter, setHospitalFilter] = useState("All Hospitals");
  const [viewClaim, setViewClaim] = useState<ClaimRecord | null>(null);
  const { hasUnreadAlert } = useClaimsMessaging();
  const [claims, setClaims] = useState<ClaimData[]>(defaultClaimData);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const applyStoredClaims = () => {
      const stored = loadStoredClaims();
      setClaims(stored);
    };

    applyStoredClaims();

    const handleClaimsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<ClaimData[]>;
      if (customEvent.detail) {
        setClaims(customEvent.detail);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === CLAIMS_STORAGE_KEY) {
        applyStoredClaims();
      }
    };

    const claimsListener = handleClaimsUpdate as EventListener;
    window.addEventListener(CLAIMS_UPDATED_EVENT, claimsListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(CLAIMS_UPDATED_EVENT, claimsListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const openClaimModal = (claim: ClaimRecord) => {
    setViewClaim(claim);
  };

  const closeClaimModal = () => {
    setViewClaim(null);
  };

  const updateClaimStatus = (
    claimId: string,
    status: "Approved" | "Rejected"
  ) => {
    setClaims((prevClaims) => {
      const updated = prevClaims.map((claim) =>
        claim.id === claimId
          ? { ...claim, status, isPaid: status === "Approved" }
          : claim
      );
      persistClaims(updated);
      const currentClaim = updated.find((c) => c.id === claimId);
      if (currentClaim) {
        setViewClaim({
          id: currentClaim.id,
          patient: currentClaim.patient,
          hospital: currentClaim.hospital,
          date: currentClaim.date,
          amount: currentClaim.amount,
          priority: currentClaim.priority,
          status: currentClaim.status,
        });
      }
      return updated;
    });
  };

  const handleClaimDecision = (
    claimId: string,
    action: "approve" | "reject"
  ) => {
    updateClaimStatus(claimId, action === "approve" ? "Approved" : "Rejected");
  };

  // Filter claims based on search and filters
  const filteredClaims = claims.filter((claim) => {
    // Search filter - matches claim ID, patient name, or hospital
    const matchesSearch =
      searchQuery === "" ||
      claim.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.hospital.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter (compare with canonical status values)
    const matchesStatus =
      statusFilter === "All Status" || claim.status === statusFilter;

    // Hospital filter
    const matchesHospital =
      hospitalFilter === "All Hospitals" || claim.hospital === hospitalFilter;

    return matchesSearch && matchesStatus && matchesHospital;
  });

  return (
    <DashboardLayout
      userRole="insurer"
      userName="HealthGuard Insurance"
      notifications={insurerNotifications}
      onNotificationSelect={(notification) => {
        if (notification.category === "messaging") {
          router.push("/insurer/claims");
        }
      }}
    >
      <div className="p-8 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Claims Processing
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Claims</p>
            <p className="text-2xl font-bold text-gray-900">1,247</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-600">83</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">1,089</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-2xl font-bold text-red-600">75</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Payout</p>
            <p className="text-2xl font-bold text-blue-600">Rs. 2.8M</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search by claim ID, patient, or hospital..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option>All Status</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
              <select
                value={hospitalFilter}
                onChange={(e) => setHospitalFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option>All Hospitals</option>
                <option>City General Hospital</option>
                <option>National Hospital</option>
                <option>Aga Khan University Hospital</option>
                <option>Services Hospital</option>
                <option>Jinnah Hospital</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Claim ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hospital
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClaims.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No claims found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((claim) => {
                    const hasAlert = hasUnreadAlert(claim.id, "insurer");
                    return (
                      <tr
                        key={claim.id}
                        className={`hover:bg-gray-50 ${
                          hasAlert ? "border-l-4 border-red-500" : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {claim.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {claim.patient}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {claim.hospital}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {claim.date}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {typeof claim.amount === "number"
                            ? formatPKR(claim.amount)
                            : claim.amount}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${
                              claim.priority === "High"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {claim.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${
                              claim.status === "Approved"
                                ? "bg-green-100 text-green-800"
                                : claim.status === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {claim.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => openClaimModal(claim)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            View
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <MessageButton
                            claimId={claim.id}
                            userRole="insurer"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ClaimDetailsModal
          claim={viewClaim}
          isOpen={Boolean(viewClaim)}
          onClose={closeClaimModal}
          onDecision={handleClaimDecision}
        />
      </div>
    </DashboardLayout>
  );
}
