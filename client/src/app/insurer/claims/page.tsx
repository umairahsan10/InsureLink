"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import MessageButton from "@/components/messaging/MessageButton";
import { useClaimsMessaging } from "@/contexts/ClaimsMessagingContext";
import { useNotifications } from "@/hooks/useNotifications";
import ClaimDetailsModal from "@/components/modals/ClaimDetailsModal";
import BulkApproveDialog from "@/components/claims/BulkApproveDialog";
import OnHoldDialog from "@/components/claims/OnHoldDialog";
import MarkAsPaidDialog from "@/components/claims/MarkAsPaidDialog";
import { claimsApi, type Claim } from "@/lib/api/claims";
import { formatPKR } from "@/lib/format";
import { toNumber, getPatientName, getHospitalName } from "@/lib/claimFormatters";

const statusBadge = (status: string) => {
  switch (status) {
    case "Approved":
      return "bg-green-100 text-green-800";
    case "Rejected":
      return "bg-red-100 text-red-800";
    case "OnHold":
      return "bg-amber-100 text-amber-800";
    case "Paid":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
};

export default function InsurerClaimsPage() {
  const router = useRouter();
  const { notifications: insurerNotifications, dismiss, markAsRead } = useNotifications();
  const { hasUnreadAlert } = useClaimsMessaging();

  // API state
  const [apiClaims, setApiClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiMeta, setApiMeta] = useState({ total: 0, totalPages: 1 });
  const [stats, setStats] = useState({
    totalClaims: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    onHoldCount: 0,
    paidCount: 0,
  });

  // Filters & pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [viewClaimId, setViewClaimId] = useState<string | null>(null);
  const [viewClaimData, setViewClaimData] = useState<any>(null);

  // Workflow dialogs
  const [approveClaimId, setApproveClaimId] = useState<string | null>(null);
  const [approveAmount, setApproveAmount] = useState("");
  const [approveNote, setApproveNote] = useState("");
  const [approving, setApproving] = useState(false);
  const [rejectClaimId, setRejectClaimId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [onHoldClaimId, setOnHoldClaimId] = useState<string | null>(null);
  const [onHoldClaimNumber, setOnHoldClaimNumber] = useState<string>("");
  const [paidClaimId, setPaidClaimId] = useState<string | null>(null);
  const [paidClaimNumber, setPaidClaimNumber] = useState<string>("");
  const [paidApprovedAmount, setPaidApprovedAmount] = useState(0);

  // Bulk approve
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkApprove, setShowBulkApprove] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Fetch stats via parallel getClaims calls
  const fetchStats = useCallback(async () => {
    try {
      const [totalRes, pendingRes, approvedRes, rejectedRes, onHoldRes, paidRes] =
        await Promise.all([
          claimsApi.getClaims({ limit: 1, page: 1 }),
          claimsApi.getClaims({ status: "Pending", limit: 1, page: 1 }),
          claimsApi.getClaims({ status: "Approved", limit: 1, page: 1 }),
          claimsApi.getClaims({ status: "Rejected", limit: 1, page: 1 }),
          claimsApi.getClaims({ status: "OnHold", limit: 1, page: 1 }),
          claimsApi.getClaims({ status: "Paid", limit: 1, page: 1 }),
        ]);
      setStats({
        totalClaims: totalRes.meta.total,
        pendingCount: pendingRes.meta.total,
        approvedCount: approvedRes.meta.total,
        rejectedCount: rejectedRes.meta.total,
        onHoldCount: onHoldRes.meta.total,
        paidCount: paidRes.meta.total,
      });
    } catch {
      // Stats are non-critical
    }
  }, []);

  // Fetch paginated claims
  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const filters: any = { page: currentPage, limit: itemsPerPage };
      if (statusFilter !== "All Status") {
        filters.status = statusFilter;
      }
      const res = await claimsApi.getClaims(filters);
      setApiClaims((res.data as Claim[]) || []);
      setApiMeta(res.meta);
    } catch (err: any) {
      setApiError(err?.message || "Failed to load claims");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, statusFilter]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, itemsPerPage]);

  const refreshAll = useCallback(() => {
    fetchClaims();
    fetchStats();
    setSelectedIds(new Set());
  }, [fetchClaims, fetchStats]);

  // Client-side search filter on already-fetched data
  const filteredClaims = useMemo(() => {
    return apiClaims
      .map((claim) => ({
        id: claim.id,
        claimNumber: claim.claimNumber,
        patient: getPatientName(claim),
        hospital: getHospitalName(claim),
        date: claim.createdAt?.split("T")[0] || "",
        amountClaimed: toNumber(claim.amountClaimed),
        approvedAmount: toNumber(claim.approvedAmount),
        priority: claim.priority,
        status: claim.claimStatus,
        rawClaim: claim,
      }))
      .filter((c) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          c.claimNumber.toLowerCase().includes(q) ||
          c.patient.toLowerCase().includes(q) ||
          c.hospital.toLowerCase().includes(q)
        );
      });
  }, [apiClaims, searchQuery]);

  // Checkbox helpers
  const pendingClaimIds = filteredClaims
    .filter((c) => c.status === "Pending")
    .map((c) => c.id);
  const allPendingSelected =
    pendingClaimIds.length > 0 && pendingClaimIds.every((id) => selectedIds.has(id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingClaimIds));
    }
  };

  // Approve single claim
  const handleApprove = async () => {
    if (!approveClaimId) return;
    setApproving(true);
    setActionError(null);
    try {
      const amt = parseFloat(approveAmount);
      await claimsApi.approveClaim({
        claimId: approveClaimId,
        approvedAmount: isNaN(amt) ? undefined : amt,
        eventNote: approveNote || undefined,
      });
      setApproveClaimId(null);
      setApproveAmount("");
      setApproveNote("");
      refreshAll();
    } catch (err: any) {
      setActionError(err?.message || "Failed to approve claim");
    } finally {
      setApproving(false);
    }
  };

  // Reject single claim
  const handleReject = async () => {
    if (!rejectClaimId || !rejectNote.trim()) return;
    setRejecting(true);
    setActionError(null);
    try {
      await claimsApi.rejectClaim({
        claimId: rejectClaimId,
        eventNote: rejectNote,
      });
      setRejectClaimId(null);
      setRejectNote("");
      refreshAll();
    } catch (err: any) {
      setActionError(err?.message || "Failed to reject claim");
    } finally {
      setRejecting(false);
    }
  };

  const totalPages = apiMeta.totalPages;

  return (
    <DashboardLayout
      userRole="insurer"
      userName="HealthGuard Insurance"
      notifications={insurerNotifications}
      onNotificationDismiss={(id) => dismiss(id)}
      onNotificationSelect={(notification) => {
        if (!notification.isRead) markAsRead(notification.id);
        if (notification.category === "messaging") {
          router.push("/insurer/claims");
        }
      }}
    >
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Claims Processing</h1>
          {selectedIds.size > 0 && (
            <button
              onClick={() => setShowBulkApprove(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
            >
              Bulk Approve ({selectedIds.size})
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalClaims}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">On Hold</p>
            <p className="text-2xl font-bold text-amber-600">{stats.onHoldCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approvedCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejectedCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Paid</p>
            <p className="text-2xl font-bold text-blue-600">{stats.paidCount}</p>
          </div>
        </div>

        {actionError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex justify-between">
            {actionError}
            <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700">
              &times;
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search by claim ID, patient, or hospital..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option>All Status</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
                <option>OnHold</option>
                <option>Paid</option>
              </select>
            </div>
          </div>

          {/* Claims Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allPendingSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                      title="Select all pending"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Claim #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hospital
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Claimed
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Approved
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                        <span className="ml-3 text-gray-500">Loading claims...</span>
                      </div>
                    </td>
                  </tr>
                ) : apiError ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-8 text-center">
                      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 inline-block">
                        {apiError}
                        <button onClick={fetchClaims} className="ml-3 underline hover:no-underline">
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                      No claims found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((claim) => {
                    const hasAlert = hasUnreadAlert(claim.id);
                    const isPending = claim.status === "Pending";
                    const isApproved = claim.status === "Approved";
                    return (
                      <tr
                        key={claim.id}
                        className={`hover:bg-gray-50 ${hasAlert ? "border-l-4 border-red-500" : ""}`}
                      >
                        <td className="px-4 py-4">
                          {isPending && (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(claim.id)}
                              onChange={() => toggleSelect(claim.id)}
                              className="rounded border-gray-300"
                            />
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {claim.claimNumber}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">{claim.patient}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">{claim.hospital}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">{claim.date}</td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {formatPKR(claim.amountClaimed)}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className={claim.approvedAmount > 0 ? "text-green-600 font-semibold" : "text-gray-400"}>
                            {claim.approvedAmount > 0 ? formatPKR(claim.approvedAmount) : "-"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${
                              claim.priority === "High"
                                ? "bg-red-100 text-red-800"
                                : claim.priority === "Low"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {claim.priority}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${statusBadge(claim.status)}`}>
                            {claim.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="relative">
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === claim.id ? null : claim.id)}
                              className="inline-flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.5 1.5H9.5V10H1.5V11H9.5V19.5H10.5V11H18.5V10H10.5V1.5Z" transform="translate(5, 5) rotate(90)" />
                              </svg>
                              Actions
                              <svg className={`w-4 h-4 transition-transform ${openDropdownId === claim.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                            </button>

                            {openDropdownId === claim.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                                <button
                                  onClick={() => {
                                    setViewClaimData(claim.rawClaim);
                                    setViewClaimId(claim.id);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 first:rounded-t-lg items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View Details
                                </button>
                                {(isPending || claim.status === "OnHold") && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setApproveClaimId(claim.id);
                                        setApproveAmount(String(claim.amountClaimed));
                                        setOpenDropdownId(null);
                                      }}
                                      className="flex w-full text-left px-4 py-2 text-green-600 hover:bg-green-50 items-center gap-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Approve Claim
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRejectClaimId(claim.id);
                                        setOpenDropdownId(null);
                                      }}
                                      className="flex w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 items-center gap-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      Reject Claim
                                    </button>
                                  </>
                                )}
                                {isPending && (
                                  <button
                                    onClick={() => {
                                      setOnHoldClaimId(claim.id);
                                      setOnHoldClaimNumber(claim.claimNumber);
                                      setOpenDropdownId(null);
                                    }}
                                    className="flex w-full text-left px-4 py-2 text-amber-600 hover:bg-amber-50 items-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Hold Claim
                                  </button>
                                )}
                                {isApproved && (
                                  <button
                                    onClick={() => {
                                      setPaidClaimId(claim.id);
                                      setPaidClaimNumber(claim.claimNumber);
                                      setPaidApprovedAmount(claim.approvedAmount);
                                      setOpenDropdownId(null);
                                    }}
                                    className="flex w-full text-left px-4 py-2 text-purple-600 hover:bg-purple-50 last:rounded-b-lg items-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Mark as Paid
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <MessageButton claimId={claim.id} userRole="insurer" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && apiMeta.total > 0 && (
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(apiMeta.total, currentPage * itemsPerPage)}</span> of{" "}
                    <span className="font-medium">{apiMeta.total}</span>
                  </p>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 text-sm rounded-md border ${currentPage === 1 ? "text-gray-300 border-gray-200 bg-gray-50" : "text-gray-500 border-gray-300 bg-white hover:bg-gray-50"}`}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`px-3 py-1 text-sm rounded-md border ${p === currentPage ? "text-white bg-blue-600 border-blue-600" : "text-gray-500 bg-white border-gray-300 hover:bg-gray-50"}`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 text-sm rounded-md border ${currentPage === totalPages ? "text-gray-300 border-gray-200 bg-gray-50" : "text-gray-500 border-gray-300 bg-white hover:bg-gray-50"}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Claim Details Modal (API-backed) */}
        <ClaimDetailsModal
          isOpen={!!viewClaimId}
          onClose={() => {
            setViewClaimId(null);
            setViewClaimData(null);
          }}
          claimId={viewClaimId || ""}
          claimData={viewClaimData}
        />

        {/* Approve Modal */}
        {approveClaimId && (
          <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-modal-content">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Approve Claim</h3>
              {actionError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-700 mb-3">
                  {actionError}
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approved Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={approveAmount}
                    onChange={(e) => setApproveAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={approveNote}
                    onChange={(e) => setApproveNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="Approval notes..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setApproveClaimId(null);
                    setActionError(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {approving ? "Approving..." : "Approve"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {rejectClaimId && (
          <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-modal-content">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Claim</h3>
              {actionError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-700 mb-3">
                  {actionError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="Reason for rejection..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setRejectClaimId(null);
                    setActionError(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejecting || !rejectNote.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {rejecting ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* On Hold Dialog */}
        <OnHoldDialog
          isOpen={!!onHoldClaimId}
          onClose={() => setOnHoldClaimId(null)}
          claimId={onHoldClaimId || ""}
          claimNumber={onHoldClaimNumber}
          onComplete={refreshAll}
        />

        {/* Mark as Paid Dialog */}
        <MarkAsPaidDialog
          isOpen={!!paidClaimId}
          onClose={() => setPaidClaimId(null)}
          claimId={paidClaimId || ""}
          claimNumber={paidClaimNumber}
          approvedAmount={paidApprovedAmount}
          onComplete={refreshAll}
        />

        {/* Bulk Approve Dialog */}
        <BulkApproveDialog
          isOpen={showBulkApprove}
          onClose={() => setShowBulkApprove(false)}
          selectedClaimIds={Array.from(selectedIds)}
          onComplete={refreshAll}
        />
      </div>
    </DashboardLayout>
  );
}
