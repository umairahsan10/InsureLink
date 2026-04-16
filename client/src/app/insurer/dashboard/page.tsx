"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import MessageButton from "@/components/messaging/MessageButton";
import { useClaimsMessaging } from "@/contexts/ClaimsMessagingContext";
import { useNotifications } from "@/hooks/useNotifications";
import { AlertNotification } from "@/types";
import ClaimActionDrawer, {
  ClaimRecord,
} from "@/components/claims/ClaimActionDrawer";
import { claimsApi, type Claim } from "@/lib/api/claims";
import { formatPKR } from "@/lib/format";

// Helper to safely convert Prisma Decimal values to number
function toNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val) || 0;
  if (val && typeof val.toString === "function")
    return parseFloat(val.toString()) || 0;
  return 0;
}

function getPatientName(claim: Claim): string {
  if (claim.hospitalVisit?.dependent) {
    const d = claim.hospitalVisit.dependent;
    return `${d.firstName} ${d.lastName}`;
  }
  if (claim.hospitalVisit?.employee?.user) {
    const u = claim.hospitalVisit.employee.user;
    return `${u.firstName} ${u.lastName}`;
  }
  return "Unknown";
}

function getHospitalName(claim: Claim): string {
  return claim.hospitalVisit?.hospital?.hospitalName || "Unknown";
}

export default function InsurerDashboardPage() {
  const { hasUnreadAlert } = useClaimsMessaging();
  const { notifications, dismiss, markAsRead } = useNotifications();
  const router = useRouter();

  // API state
  const [pendingClaims, setPendingClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<ClaimRecord | null>(null);
  const [drawerMode, setDrawerMode] = useState<"view" | "review" | null>(null);
  const [stats, setStats] = useState({
    totalClaims: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    onHoldCount: 0,
    paidCount: 0,
    flaggedCount: 0,
  });

  // Two parallel requests instead of the previous seven:
  //  1. getClaims  — the 3 most-recent Pending claims shown in the table
  //  2. getClaimStats — all status counts + high-priority count in one DB round-trip
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pendingRes, statsRes] = await Promise.all([
        claimsApi.getClaims({
          status: "Pending",
          limit: 3,
          page: 1,
          sortBy: "createdAt",
          order: "desc",
        }),
        claimsApi.getClaimStats(),
      ]);
      setPendingClaims((pendingRes.data as Claim[]) || []);
      setStats({
        totalClaims: statsRes.total,
        pendingCount: statsRes.Pending,
        approvedCount: statsRes.Approved,
        rejectedCount: statsRes.Rejected,
        onHoldCount: statsRes.OnHold,
        paidCount: statsRes.Paid,
        flaggedCount: statsRes.highPriority,
      });
    } catch {
      // Non-critical dashboard load
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value: number) => formatPKR(value);

  const approvalRate =
    stats.totalClaims === 0
      ? 0
      : Math.round((stats.approvedCount / stats.totalClaims) * 100);

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

  // Map API Claim to drawer ClaimRecord
  const toClaimRecord = (claim: Claim): ClaimRecord => ({
    id: claim.id,
    patient: getPatientName(claim),
    hospital: getHospitalName(claim),
    date: claim.createdAt?.split("T")[0] || "",
    amount: toNumber(claim.amountClaimed),
    priority: claim.priority,
    status: claim.claimStatus,
  });

  const displayClaims = pendingClaims.map((c) => ({
    ...toClaimRecord(c),
    claimNumber: c.claimNumber,
    rawClaim: c,
  }));

  const openDrawer = (claim: (typeof displayClaims)[number]) => {
    setSelectedClaim(claim);
    setDrawerMode("review");
  };

  const handleCloseDrawer = () => {
    setDrawerMode(null);
    setSelectedClaim(null);
  };

  const handleDecision = async (
    claimId: string,
    action: "approve" | "reject",
    notes?: string,
  ) => {
    try {
      if (action === "approve") {
        await claimsApi.approveClaim({ claimId, eventNote: notes });
      } else {
        await claimsApi.rejectClaim({
          claimId,
          eventNote: notes || "Rejected",
        });
      }
      fetchData();
    } catch (err: any) {
      console.error("Decision failed:", err?.message);
    }
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
    const rows = displayClaims.map((claim) => [
      claim.claimNumber,
      claim.patient,
      claim.hospital,
      typeof claim.amount === "number"
        ? formatPKR(claim.amount)
        : String(claim.amount),
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
      notifications={notifications}
      onNotificationSelect={(notification) => {
        if (!notification.isRead) {
          markAsRead(notification.id);
        }
        if (notification.category === "messaging" || notification.category === "claims") {
          router.push("/insurer/claims");
        }
      }}
      onNotificationDismiss={(id) => dismiss(id)}
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
          <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-100">
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
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
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

          <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-1">Rejected Claims</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">
                  {stats.rejectedCount}
                </p>
                <p className="text-xs md:text-sm text-gray-500">Need review</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
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

          <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-1">Approved Claims</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">
                  {stats.approvedCount}
                </p>
                <p className="text-xs md:text-sm text-gray-500">
                  {stats.paidCount} paid
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
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

          <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-100">
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
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
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
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 md:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-xs md:text-sm mb-1">
                  Total Claims
                </p>
                <p className="text-2xl md:text-3xl font-bold">
                  {stats.totalClaims}
                </p>
                <p className="text-red-100 text-xs md:text-sm">
                  All claims in system
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 md:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs md:text-sm mb-1">
                  Approval Rate
                </p>
                <p className="text-2xl md:text-3xl font-bold">
                  {approvalRate}%
                </p>
                <p className="text-green-100 text-xs md:text-sm">
                  Approval Rate
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 md:p-6 text-white">
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
        <div className="bg-white rounded-xl border border-gray-100 mb-2 md:mb-2">
          <div className="p-4 md:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                Pending Claims Review
              </h2>
              <button
                onClick={handleExportReport}
                className="px-4 md:px-5 py-2.5 text-sm md:text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md shadow-indigo-200 whitespace-nowrap"
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
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                        <span className="ml-3 text-gray-500">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayClaims.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No pending claims to review.
                    </td>
                  </tr>
                ) : (
                  displayClaims.map((claim) => {
                    const hasAlert = hasUnreadAlert(claim.id);
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
                              claim.priority,
                            )}`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full mr-1.5 ${getPriorityDot(
                                claim.priority,
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
                  })
                )}
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
