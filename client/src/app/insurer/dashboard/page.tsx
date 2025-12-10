"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import MessageButton from "@/components/messaging/MessageButton";
import { useClaimsMessaging } from "@/contexts/ClaimsMessagingContext";
import notificationsData from "@/data/insurerNotifications.json";
import { AlertNotification } from "@/types";
import ClaimActionDrawer, {
  ClaimRecord,
} from "@/components/claims/ClaimActionDrawer";
import {
  ClaimData,
  CLAIMS_STORAGE_KEY,
  CLAIMS_UPDATED_EVENT,
  defaultClaimData,
  loadStoredClaims,
  persistClaims,
} from "@/data/claimsData";
import { formatPKR } from "@/lib/format";
import { sortClaimsByDateDesc } from "@/lib/sort";

interface Claim extends ClaimData {
  claimNumber: string;
}

export default function InsurerDashboardPage() {
  const { hasUnreadAlert } = useClaimsMessaging();
  const insurerNotifications = useMemo(
    () =>
      (notificationsData as AlertNotification[]).map((notification) => ({
        ...notification,
      })),
    []
  );
  const router = useRouter();
  const toClaim = (data: ClaimData): Claim => ({
    ...data,
    claimNumber: data.id,
  });

  const toClaimData = (claim: Claim): ClaimData => {
    const { claimNumber, ...rest } = claim;
    void claimNumber;
    return rest;
  };

  const [claims, setClaims] = useState<Claim[]>(defaultClaimData.map(toClaim));
  const [selectedClaim, setSelectedClaim] = useState<ClaimRecord | null>(null);
  const [drawerMode, setDrawerMode] = useState<"view" | "review" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const applyStoredClaims = () => {
      const stored = loadStoredClaims();
      setClaims(stored.map(toClaim));
    };

    applyStoredClaims();

    const handleClaimsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<ClaimData[]>;
      if (customEvent.detail) {
        setClaims(customEvent.detail.map(toClaim));
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

  const formatCurrency = (value: number) => formatPKR(value);

  const stats = useMemo(() => {
    const parseAmount = (amount: string | number) => {
      if (typeof amount === "number") return amount;
      if (typeof amount === "string")
        return Number(amount.replace(/Rs\.?\s?/i, "").replace(/,/g, "")) || 0;
      return 0;
    };

    const totalValue = claims.reduce(
      (sum, claim) => sum + parseAmount(claim.amount),
      0
    );
    const pendingCount = claims.filter(
      (claim) => claim.status === "Pending"
    ).length;
    const approvedCount = claims.filter(
      (claim) => claim.status === "Approved"
    ).length;
    const rejectedCount = claims.filter(
      (claim) => claim.status === "Rejected"
    ).length;
    const paidClaims = claims.filter((claim) => claim.isPaid);
    const paidCount = paidClaims.length;
    const paidTotal = paidClaims.reduce(
      (sum, claim) => sum + parseAmount(claim.amount),
      0
    );
    const flaggedCount = claims.filter(
      (claim) => claim.priority === "High"
    ).length;
    const approvalRate =
      claims.length === 0
        ? 0
        : Math.round((approvedCount / claims.length) * 100);

    return {
      totalValue,
      pendingCount,
      approvedCount,
      rejectedCount,
      paidCount,
      paidTotal,
      flaggedCount,
      approvalRate,
    };
  }, [claims]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200";
      case "Medium":
      case "Normal":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-500";
      case "Medium":
      case "Normal":
        return "bg-yellow-500";
      case "Low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
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
      persistClaims(updated.map(toClaimData));
      return updated;
    });
  };

  const openDrawer = (claim: Claim) => {
    const claimRecord: ClaimRecord = {
      id: claim.id,
      patient: claim.patient,
      hospital: claim.hospital,
      date: claim.date,
      amount: claim.amount,
      priority: claim.priority,
      status: claim.status,
    };
    setSelectedClaim(claimRecord);
    setDrawerMode("review");
  };

  const handleCloseDrawer = () => {
    setDrawerMode(null);
    setSelectedClaim(null);
  };

  const handleDecision = (claimId: string, action: "approve" | "reject") => {
    updateClaimStatus(claimId, action === "approve" ? "Approved" : "Rejected");
  };

  const handleSaveNotes = (claimId: string, notes: string) => {
    console.log(`[Dashboard] SAVE notes for ${claimId}`, notes);
  };

  const handleExportReport = () => {
    const headers = [
      "Claim ID",
      "Patient",
      "Hospital",
      "Amount",
      "Date",
      "Priority",
      "Status",
    ];
    const rows = sortClaimsByDateDesc(claims)
      .slice(0, 3)
      .map((claim) => [
        claim.claimNumber,
        claim.patient,
        claim.hospital,
        typeof claim.amount === "number"
          ? formatPKR(claim.amount)
          : claim.amount,
        claim.date,
        claim.priority,
        claim.status,
      ]);

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "pending-claims.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Insurer Dashboard
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Welcome to your claims management portal
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-1">Pending Claims</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">
                  {stats.pendingCount}
                </p>
                <p className="text-xs md:text-sm text-gray-500">
                  Requires review
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-red-600"
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
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-1">Rejected Claims</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">
                  {stats.rejectedCount}
                </p>
                <p className="text-xs md:text-sm text-gray-500">Need review</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-1">Approved Claims</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">
                  {stats.approvedCount}
                </p>
                <p className="text-xs md:text-sm text-gray-500">
                  {formatCurrency(stats.paidTotal)}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-blue-600"
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
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-1">Flagged Claims</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">
                  {stats.flaggedCount}
                </p>
                <p className="text-xs md:text-sm text-gray-500">
                  High priority
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Claims Processing Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 md:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-xs md:text-sm mb-1">
                  Total Claims Value
                </p>
                <p className="text-2xl md:text-3xl font-bold">
                  {formatCurrency(stats.totalValue)}
                </p>
                <p className="text-red-100 text-xs md:text-sm">
                  Total Claims Value
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 md:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs md:text-sm mb-1">
                  Approval Rate
                </p>
                <p className="text-2xl md:text-3xl font-bold">
                  {stats.approvalRate}%
                </p>
                <p className="text-green-100 text-xs md:text-sm">
                  Approval Rate
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 md:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs md:text-sm mb-1">
                  Avg. Processing Time
                </p>
                <p className="text-2xl md:text-3xl font-bold">2.1 days</p>
                <p className="text-blue-100 text-xs md:text-sm">
                  Avg. Processing Time
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Claims Review */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-2 md:mb-2">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                Pending Claims Review
              </h2>
              <button
                onClick={handleExportReport}
                className="px-4 md:px-5 py-2.5 text-sm md:text-base font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-500 active:bg-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
              >
                Export Report
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs md:text-sm">
                <tr>
                  <th className="px-3 md:px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Claim ID
                  </th>
                  <th className="px-3 md:px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-3 md:px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Hospital
                  </th>
                  <th className="px-3 md:px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 md:px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 md:px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-3 md:px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Review
                  </th>
                  <th className="px-3 md:px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-xs md:text-sm">
                {sortClaimsByDateDesc(claims)
                  .slice(0, 3)
                  .map((claim) => {
                    const hasAlert = hasUnreadAlert(claim.id, "insurer");
                    return (
                      <tr
                        key={claim.id}
                        className={`hover:bg-gray-50 ${
                          hasAlert ? "border-l-4 border-red-500" : ""
                        }`}
                      >
                        <td className="px-3 md:px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                          {claim.claimNumber}
                        </td>
                        <td className="px-3 md:px-4 py-3 whitespace-nowrap text-gray-900">
                          {claim.patient}
                        </td>
                        <td className="px-3 md:px-4 py-3 whitespace-nowrap text-gray-900">
                          {claim.hospital}
                        </td>
                        <td className="px-3 md:px-4 py-3 whitespace-nowrap text-gray-900">
                          {typeof claim.amount === "number"
                            ? formatPKR(claim.amount)
                            : claim.amount}
                        </td>
                        <td className="px-3 md:px-4 py-3 whitespace-nowrap text-gray-500">
                          {claim.date}
                        </td>
                        <td className="px-3 md:px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 md:px-2.5 py-0.5 rounded-full text-[11px] md:text-xs font-medium border ${getPriorityColor(
                              claim.priority
                            )}`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full mr-1.5 ${getPriorityDot(
                                claim.priority
                              )}`}
                            ></span>
                            {claim.priority}
                          </span>
                        </td>
                        <td className="px-3 md:px-4 py-3 whitespace-nowrap font-medium">
                          {claim.status === "Pending" ? (
                            <button
                              onClick={() => openDrawer(claim)}
                              className="text-blue-600 hover:text-blue-800 font-semibold text-xs md:text-sm"
                            >
                              Review
                            </button>
                          ) : (
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs md:text-sm font-semibold ${
                                claim.status === "Approved"
                                  ? "bg-green-100 text-green-700 border border-green-200"
                                  : "bg-red-100 text-red-700 border border-red-200"
                              }`}
                            >
                              {claim.status}
                            </span>
                          )}
                        </td>
                        <td className="px-3 md:px-4 py-3 whitespace-nowrap font-medium">
                          <MessageButton
                            claimId={claim.id}
                            userRole="insurer"
                          />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        <ClaimActionDrawer
          isOpen={Boolean(selectedClaim && drawerMode)}
          mode={drawerMode ?? "view"}
          claim={selectedClaim}
          onClose={handleCloseDrawer}
          onDecision={handleDecision}
          onSaveNotes={handleSaveNotes}
        />
      </div>
    </DashboardLayout>
  );
}
