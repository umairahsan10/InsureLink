"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import HospitalSidebar from "@/components/hospital/HospitalSidebar";
import SubmitClaimFormV2 from "@/components/hospital/SubmitClaimFormV2";
import SubmitClaimHeader from "@/components/hospital/SubmitClaimHeader";
import MessageButton from "@/components/messaging/MessageButton";
import { useClaimsMessaging } from "@/contexts/ClaimsMessagingContext";
import {
  DocumentVerificationResult,
  DocumentTemplateKey,
  ensureDemoHashSeeded,
  getTemplateOptions,
  markHashAsSuspicious,
  verifyDocumentLocally,
  seedDemoHashesFromImages,
  clearDocumentHashes,
} from "@/utils/documentVerification";
import ClaimDetailsModal from "@/components/modals/ClaimDetailsModal";
import ClaimEditModal from "@/components/modals/ClaimEditModal";
import { claimsApi } from "@/lib/api/claims";
import { formatPKR } from "@/lib/format";

// ── API response types ──────────────────────────────────────────────────────

interface ApiClaim {
  id: string;
  claimNumber: string;
  claimStatus: string;
  amountClaimed: string | number;
  approvedAmount: string | number;
  treatmentCategory?: string;
  priority: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  hospitalVisit: {
    id: string;
    visitDate: string;
    hospital: { id: string; hospitalName: string; city: string };
    employee?: {
      id: string;
      employeeNumber: string;
      user: { firstName: string; lastName: string; cnic?: string };
    } | null;
    dependent?: {
      id: string;
      firstName: string;
      lastName: string;
      relationship: string;
    } | null;
  };
  corporate: { id: string; name: string };
  plan: {
    id: string;
    planName: string;
    planCode: string;
    sumInsured: string | number;
  };
  insurer: { id: string; companyName: string };
}

function getPatientName(claim: ApiClaim): string {
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

export default function HospitalClaimsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [amountFilter, setAmountFilter] = useState("All Amounts");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // API state
  const [apiClaims, setApiClaims] = useState<ApiClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiMeta, setApiMeta] = useState({ total: 0, totalPages: 1 });
  const [stats, setStats] = useState({
    totalClaims: 0,
    totalApprovedClaims: 0,
    pendingClaims: 0,
  });

  // Document verification state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [hashMarked, setHashMarked] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<DocumentVerificationResult | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [formState, setFormState] = useState({
    file: null as File | null,
    totalAmount: "",
    lineItemsTotal: "",
    admissionDate: "",
    dischargeDate: "",
    templateKey: "" as DocumentTemplateKey | "",
    snippet: "",
    treatmentCategory: "" as string | "",
  });
  const [selectedClaimData, setSelectedClaimData] = useState<any>(null);
  const [isClaimDetailsOpen, setIsClaimDetailsOpen] = useState(false);
  const [editClaimId, setEditClaimId] = useState<string | null>(null);
  const [editClaimData, setEditClaimData] = useState<any>(null);
  const [deleteClaimId, setDeleteClaimId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const { hasUnreadAlert } = useClaimsMessaging();
  const templateOptions = useMemo(() => getTemplateOptions(), []);

  useEffect(() => {
    ensureDemoHashSeeded();
    seedDemoHashesFromImages();
  }, []);

  // Fetch summary stats (total, approved, pending counts)
  const fetchStats = useCallback(async () => {
    try {
      const [totalRes, approvedRes, pendingRes] = await Promise.all([
        claimsApi.getClaims({ limit: 1, page: 1 }),
        claimsApi.getClaims({ status: "Approved" as any, limit: 1, page: 1 }),
        claimsApi.getClaims({ status: "Pending" as any, limit: 1, page: 1 }),
      ]);
      setStats({
        totalClaims: totalRes.meta.total,
        totalApprovedClaims: approvedRes.meta.total,
        pendingClaims: pendingRes.meta.total,
      });
    } catch {
      // Stats are non-critical
    }
  }, []);

  // Fetch paginated claims from API
  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const filters: any = { page: currentPage, limit: itemsPerPage };
      if (statusFilter !== "All Status") {
        filters.status = statusFilter;
      }
      const res = await claimsApi.getClaims(filters);
      setApiClaims((res.data as unknown as ApiClaim[]) || []);
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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, amountFilter, searchQuery, itemsPerPage]);

  const handleClaimSubmitted = useCallback(
    (_claim?: unknown) => {
      setShowSubmitForm(false);
      fetchClaims();
      fetchStats();
    },
    [fetchClaims, fetchStats],
  );

  // Map API claims to display format, with client-side search + amount filter
  const filteredClaims = useMemo(() => {
    // Helper to safely convert to number
    const toNumber = (val: any): number => {
      if (val === null || val === undefined) return 0;
      if (typeof val === "number") return val;
      if (typeof val === "string") return parseFloat(val) || 0;
      // Handle Prisma Decimal or objects with toString
      if (val && typeof val.toString === "function") {
        const str = val.toString();
        return parseFloat(str) || 0;
      }
      return 0;
    };

    return apiClaims
      .map((claim) => {
        const amountNum = toNumber(claim.amountClaimed);
        const approvedNum = toNumber(claim.approvedAmount);

        return {
          id: claim.id,
          claimNumber: claim.claimNumber,
          patient: getPatientName(claim),
          treatment: claim.treatmentCategory || "Insurance Claim",
          date: claim.createdAt.split("T")[0],
          amount: formatPKR(amountNum),
          amountNum: amountNum,
          approvedAmount: approvedNum,
          approvedAmountDisplay: approvedNum > 0 ? formatPKR(approvedNum) : "-",
          status: claim.claimStatus,
          rawClaim: claim,
        };
      })
      .filter((claim) => {
        const matchesSearch =
          searchQuery === "" ||
          claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          claim.patient.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAmount =
          amountFilter === "All Amounts" ||
          (amountFilter === "Under 50K" && claim.amountNum < 50000) ||
          (amountFilter === "50K - 100K" &&
            claim.amountNum >= 50000 &&
            claim.amountNum <= 100000) ||
          (amountFilter === "100K - 500K" &&
            claim.amountNum > 100000 &&
            claim.amountNum <= 500000) ||
          (amountFilter === "Over 500K" && claim.amountNum > 500000);
        return matchesSearch && matchesAmount;
      });
  }, [apiClaims, searchQuery, amountFilter]);

  const totalPages = apiMeta.totalPages;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Left Sidebar */}
        <HospitalSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main Content */}
        <div className="ml-0 flex flex-col">
          {/* Top Header with Sidebar Toggle */}
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center gap-3 px-4 lg:px-6 py-4 lg:hidden">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1 className="text-lg font-bold text-gray-900">
                Claims Management
              </h1>
            </div>

            {/* Desktop Header with Title and Button */}
            <div className="hidden lg:block border-t border-gray-200">
              <SubmitClaimHeader onOpenModal={() => setShowSubmitForm(true)} />
            </div>

            {/* Mobile Header with Title and Button */}
            <div className="lg:hidden px-4 py-3 border-t border-gray-200">
              <button
                onClick={() => setShowSubmitForm(true)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                + Submit New Claim
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 lg:p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-sm text-gray-500">Total Claims</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalClaims}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-sm text-gray-500">Approved Claims</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalApprovedClaims}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pendingClaims}
                </p>
              </div>
            </div>

            {/* Claims Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-3 lg:p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
                  <input
                    type="text"
                    placeholder="Search by claim ID or patient name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm lg:text-base"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm lg:text-base"
                  >
                    <option>All Status</option>
                    <option>Pending</option>
                    <option>Approved</option>
                    <option>Rejected</option>
                    <option>OnHold</option>
                    <option>Paid</option>
                  </select>
                  <select
                    value={amountFilter}
                    onChange={(e) => setAmountFilter(e.target.value)}
                    className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm lg:text-base"
                  >
                    <option>All Amounts</option>
                    <option>Under 50K</option>
                    <option>50K - 100K</option>
                    <option>100K - 500K</option>
                    <option>Over 500K</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-160">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Claim #
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Patient
                      </th>
                      <th className="hidden md:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Treatment
                      </th>
                      <th className="hidden sm:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Claimed
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Approved
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center">
                          <div className="flex items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                            <span className="ml-3 text-gray-500">
                              Loading claims...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : apiError ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-8 text-center">
                          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 inline-block">
                            {apiError}
                            <button
                              onClick={fetchClaims}
                              className="ml-3 underline hover:no-underline"
                            >
                              Retry
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : filteredClaims.length === 0 ? (
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
                        const hasAlert = hasUnreadAlert(claim.id);
                        return (
                          <tr
                            key={claim.id}
                            className={`hover:bg-gray-50 ${
                              hasAlert ? "border-l-4 border-red-500" : ""
                            }`}
                          >
                            <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm font-medium text-gray-900">
                              {claim.claimNumber}
                            </td>
                            <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-900">
                              {claim.patient}
                            </td>
                            <td className="hidden md:table-cell px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-500">
                              {claim.treatment}
                            </td>
                            <td className="hidden sm:table-cell px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-500">
                              {claim.date}
                            </td>
                            <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-900">
                              {claim.amount}
                            </td>
                            <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm">
                              <span
                                className={`${claim.approvedAmount > 0 ? "text-green-600 font-semibold" : "text-gray-400"}`}
                              >
                                {claim.approvedAmountDisplay}
                              </span>
                            </td>
                            <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm">
                              <span
                                className={`inline-block px-2 py-1 text-xs rounded-full ${
                                  claim.status === "Approved"
                                    ? "bg-green-100 text-green-800"
                                    : claim.status === "Rejected"
                                      ? "bg-red-100 text-red-800"
                                      : claim.status === "OnHold"
                                        ? "bg-amber-100 text-amber-800"
                                        : claim.status === "Paid"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {claim.status}
                              </span>
                            </td>
                            <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm">
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
                                        setSelectedClaimData(claim.rawClaim);
                                        setIsClaimDetailsOpen(true);
                                        setOpenDropdownId(null);
                                      }}
                                      className="flex w-full px-4 py-2 text-blue-600 hover:bg-blue-50 first:rounded-t-lg items-center gap-2 justify-start"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      View Details
                                    </button>
                                    {claim.status === "Pending" && (
                                      <>
                                        <button
                                          onClick={() => {
                                            setEditClaimId(claim.id);
                                            setEditClaimData(claim.rawClaim);
                                            setOpenDropdownId(null);
                                          }}
                                          className="flex w-full px-4 py-2 text-amber-600 hover:bg-amber-50 items-center gap-2 justify-start"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                          </svg>
                                          Edit Claim
                                        </button>
                                        <button
                                          onClick={() => {
                                            setDeleteClaimId(claim.id);
                                            setOpenDropdownId(null);
                                          }}
                                          className="flex w-full px-4 py-2 text-red-600 hover:bg-red-50 last:rounded-b-lg items-center gap-2 justify-start"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                          Delete Claim
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm">
                              <MessageButton
                                claimId={claim.id}
                                userRole="hospital"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {/* Pagination Info */}
                {!isLoading && apiMeta.total > 0 && (
                  <div className="mt-6 bg-white rounded-xl border border-gray-100 px-6 py-3">
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3">
                      <div className="flex items-center space-x-4">
                        <p className="text-sm text-gray-700">
                          Showing{" "}
                          <span className="font-medium">
                            {(currentPage - 1) * itemsPerPage + 1}
                          </span>{" "}
                          to{" "}
                          <span className="font-medium">
                            {Math.min(
                              apiMeta.total,
                              currentPage * itemsPerPage,
                            )}
                          </span>{" "}
                          of{" "}
                          <span className="font-medium">{apiMeta.total}</span>{" "}
                          claims
                        </p>

                        <label className="text-sm text-gray-600">
                          Items per page:
                        </label>
                        <select
                          value={itemsPerPage}
                          onChange={(e) =>
                            setItemsPerPage(Number(e.target.value))
                          }
                          className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                          className={`px-3 py-1 text-sm rounded-md border ${
                            currentPage === 1
                              ? "text-gray-300 border-gray-200 bg-gray-50"
                              : "text-gray-500 border-gray-300 bg-white hover:bg-gray-50"
                          }`}
                        >
                          Previous
                        </button>

                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1,
                        ).map((p) => (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`px-3 py-1 text-sm rounded-md border ${
                              p === currentPage
                                ? "text-white bg-blue-600 border-blue-600"
                                : "text-gray-500 bg-white border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {p}
                          </button>
                        ))}

                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1 text-sm rounded-md border ${
                            currentPage === totalPages
                              ? "text-gray-300 border-gray-200 bg-gray-50"
                              : "text-gray-500 border-gray-300 bg-white hover:bg-gray-50"
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal for Submit Claim Form */}
            {showSubmitForm && (
              <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">
                      Submit New Claim
                    </h2>
                    <button
                      onClick={() => setShowSubmitForm(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="p-6">
                    <SubmitClaimFormV2
                      onCancel={() => setShowSubmitForm(false)}
                      onSuccess={handleClaimSubmitted}
                      onClaimSubmitted={handleClaimSubmitted}
                    />
                  </div>
                </div>
              </div>
            )}

            <ClaimDetailsModal
              isOpen={isClaimDetailsOpen && !!selectedClaimData}
              onClose={() => {
                setIsClaimDetailsOpen(false);
                setSelectedClaimData(null);
              }}
              claimId={selectedClaimData?.id || ""}
              claimData={selectedClaimData}
            />

            {/* Edit Claim Modal */}
            <ClaimEditModal
              isOpen={!!editClaimId}
              onClose={() => {
                setEditClaimId(null);
                setEditClaimData(null);
              }}
              claimId={editClaimId || ""}
              claimData={editClaimData}
              onSuccess={() => {
                setEditClaimId(null);
                setEditClaimData(null);
                fetchClaims();
                fetchStats();
              }}
            />

            {/* Delete Claim Confirmation */}
            {deleteClaimId && (
              <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Delete Claim
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Are you sure you want to delete this claim? This action
                    cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setDeleteClaimId(null)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        setIsDeleting(true);
                        try {
                          await claimsApi.deleteClaim(deleteClaimId);
                          setDeleteClaimId(null);
                          fetchClaims();
                          fetchStats();
                        } catch (err: any) {
                          alert(err?.message || "Failed to delete claim");
                        } finally {
                          setIsDeleting(false);
                        }
                      }}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Modal */}
            {uploadModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop px-4 py-6">
                <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Run Document Trust Checks
                      </h2>
                      <p className="text-sm text-gray-500">
                        Upload the hospital document and provide quick details
                        for validation.
                      </p>
                    </div>
                    <button
                      onClick={() => setUploadModalOpen(false)}
                      className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                      aria-label="Close upload modal"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="max-h-[80vh] overflow-y-auto px-6 py-4 space-y-6">
                    {formError && (
                      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                        {formError}
                      </p>
                    )}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">
                        Document File
                      </label>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(event) => {
                          const nextFile = event.target.files?.[0] ?? null;
                          setFormState((prev) => ({ ...prev, file: nextFile }));
                        }}
                        className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-green-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-green-700 hover:file:bg-green-200"
                      />
                      {formState.file && (
                        <div className="rounded-lg bg-gray-50 px-4 py-2 text-xs text-gray-600">
                          {formState.file.name} ·{" "}
                          {(formState.file.size / 1024).toFixed(1)} KB
                        </div>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Total Amount (PKR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formState.totalAmount}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              totalAmount: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          placeholder="e.g., 45000"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Sum of Line Items (PKR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formState.lineItemsTotal}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              lineItemsTotal: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          placeholder="e.g., 44980"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Admission Date
                        </label>
                        <input
                          type="date"
                          value={formState.admissionDate}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              admissionDate: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Discharge Date
                        </label>
                        <input
                          type="date"
                          value={formState.dischargeDate}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              dischargeDate: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Hospital Template
                      </label>
                      <select
                        value={formState.templateKey}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            templateKey: event.target.value as
                              | DocumentTemplateKey
                              | "",
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                      >
                        <option value="">Select hospital template</option>
                        {templateOptions.map((template) => (
                          <option key={template.key} value={template.key}>
                            {template.label}
                          </option>
                        ))}
                      </select>
                      {formState.templateKey && (
                        <p className="rounded-lg bg-gray-50 px-4 py-2 text-xs text-gray-600">
                          Expected keywords:{" "}
                          {templateOptions
                            .find(
                              (template) =>
                                template.key === formState.templateKey,
                            )
                            ?.keywords.join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Treatment Category{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formState.treatmentCategory}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            treatmentCategory: event.target.value,
                          }))
                        }
                        required
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                      >
                        <option value="">Select treatment category</option>
                        <option value="Surgery">Surgery</option>
                        <option value="Emergency Care">Emergency Care</option>
                        <option value="Routine Checkup">Routine Checkup</option>
                        <option value="Lab Test">Lab Test</option>
                        <option value="Maternity">Maternity</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Orthopedics">Orthopedics</option>
                        <option value="General Consultation">
                          General Consultation
                        </option>
                      </select>
                      <p className="text-xs text-gray-500">
                        System will validate your selection against the claim
                        amount
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Paste a text snippet from the document (used for
                        template check)
                      </label>
                      <textarea
                        rows={3}
                        value={formState.snippet}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            snippet: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        placeholder="Example: City General Hospital Billing Department..."
                      />
                    </div>
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-yellow-900">
                      Metadata checks are simulated in the UI until backend
                      integration is available.
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
                    <button
                      onClick={() => setUploadModalOpen(false)}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!formState.file) {
                          setFormError("Please attach a document file.");
                          return;
                        }
                        if (!formState.treatmentCategory) {
                          setFormError("Please select a treatment category.");
                          return;
                        }
                        setFormError(null);
                        setIsVerifying(true);
                        setHashMarked(false);
                        try {
                          const result = await verifyDocumentLocally({
                            file: formState.file,
                            totalAmount: formState.totalAmount
                              ? Number(formState.totalAmount)
                              : undefined,
                            lineItemsTotal: formState.lineItemsTotal
                              ? Number(formState.lineItemsTotal)
                              : undefined,
                            admissionDate: formState.admissionDate,
                            dischargeDate: formState.dischargeDate,
                            templateKey: formState.templateKey,
                            documentSnippet: formState.snippet,
                            treatmentCategory: formState.treatmentCategory,
                          });
                          setVerificationResult(result);
                          setUploadModalOpen(false);
                          setResultModalOpen(true);
                        } catch (error) {
                          console.error("Verification error", error);
                          setFormError(
                            "Unable to run verification in the browser.",
                          );
                        } finally {
                          setIsVerifying(false);
                        }
                      }}
                      disabled={isVerifying}
                      className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
                    >
                      {isVerifying ? "Processing…" : "Run Verification"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Result Modal */}
            {resultModalOpen && verificationResult && (
              <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop px-4 py-6">
                <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Verification Result
                      </h2>
                      <p className="text-sm text-gray-500">
                        Client-side checks completed successfully.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setResultModalOpen(false);
                        setVerificationResult(null);
                      }}
                      className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                      aria-label="Close result modal"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="px-6 py-5 space-y-5">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Trust Score
                          </p>
                          <p className="text-4xl font-bold text-gray-900">
                            {verificationResult.score}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${
                            verificationResult.score >= 80
                              ? "bg-green-100 text-green-800"
                              : verificationResult.score >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {verificationResult.score >= 80
                            ? "Auto Accept"
                            : verificationResult.score >= 50
                              ? "Needs Review"
                              : "High Risk"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-gray-600">
                        {verificationResult.metadataNote}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 px-4 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        Reasons & Insights
                      </p>
                      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
                        {verificationResult.reasons.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                    {verificationResult.nearDuplicateDetected && (
                      <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                        <p className="font-medium">
                          Near-duplicate document detected
                        </p>
                        <p className="mt-1 text-xs text-orange-700">
                          This document is similar to a previously uploaded
                          document (slightly edited version).
                        </p>
                      </div>
                    )}
                    {!verificationResult.nearDuplicateDetected &&
                      verificationResult.perceptualWarningSimilarity !==
                        undefined && (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                          <p className="font-medium">
                            Possible document reuse detected
                          </p>
                          <p className="mt-1 text-xs text-yellow-700">
                            This document is{" "}
                            {(
                              verificationResult.perceptualWarningSimilarity *
                              100
                            ).toFixed(1)}
                            % similar to a previous upload. Manual review is
                            recommended.
                          </p>
                        </div>
                      )}
                    <div className="rounded-xl border border-gray-200 px-4 py-4 space-y-2 text-sm text-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          SHA-256 Hash
                        </span>
                        <code className="break-all text-xs text-gray-500">
                          {verificationResult.sha256 ?? "Unavailable"}
                        </code>
                      </div>
                      {verificationResult.perceptualHash && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">
                            Perceptual Hash
                          </span>
                          <code className="break-all text-xs text-gray-500">
                            {verificationResult.perceptualHash}
                          </code>
                        </div>
                      )}
                      {verificationResult.templateLabel && (
                        <p>
                          Template evaluated:&nbsp;
                          <span className="font-medium text-gray-900">
                            {verificationResult.templateLabel}
                          </span>
                        </p>
                      )}
                    </div>
                    {verificationResult.sha256 &&
                      !verificationResult.duplicateDetected && (
                        <button
                          onClick={() => {
                            markHashAsSuspicious(verificationResult.sha256);
                            setHashMarked(true);
                          }}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {hashMarked
                            ? "✓ Flagged for future review"
                            : "Flag for future review"}
                        </button>
                      )}
                    {verificationResult.duplicateDetected && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        <p className="font-medium">
                          Duplicate document automatically flagged
                        </p>
                        <p className="mt-1 text-xs text-red-700">
                          This document hash has been added to the suspicious
                          list for future reference.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-end border-t px-6 py-4">
                    <button
                      onClick={() => {
                        setResultModalOpen(false);
                        setVerificationResult(null);
                      }}
                      className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop px-4 py-6">
                <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                  <div className="px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Clear Hash Database
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      This will clear all stored SHA-256 and perceptual hashes,
                      including demo seeds.
                    </p>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-sm text-gray-700">
                      This action cannot be undone. You will need to reload the
                      page to re-seed demo hashes.
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const cleared = clearDocumentHashes();
                        if (cleared) {
                          setShowResetConfirm(false);
                          // Reload page to re-seed demo hashes
                          window.location.reload();
                        }
                      }}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Clear & Reload
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
