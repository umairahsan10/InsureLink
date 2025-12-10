"use client";

import { useEffect, useMemo, useState } from "react";
import HospitalSidebar from "@/components/hospital/HospitalSidebar";
import SubmitClaimForm from "@/components/hospital/SubmitClaimForm";
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
import claimsDataRaw from "@/data/claims.json";
import {
  CLAIMS_STORAGE_KEY as INSURER_CLAIMS_STORAGE_KEY,
  CLAIMS_UPDATED_EVENT,
  loadStoredClaims,
  type ClaimData,
} from "@/data/claimsData";
import { formatPKR } from "@/lib/format";
import type { Claim } from "@/types/claims";

const claimsData = claimsDataRaw as Claim[];

export default function HospitalClaimsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [insurerFilter, setInsurerFilter] = useState("All Insurers");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isHydrated, setIsHydrated] = useState(false);
  const [localClaims, setLocalClaims] = useState<Claim[]>([]);
  const currentHospitalId = "hosp-001"; // This would come from auth context in production

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

  // Combine default claims with locally saved claims
  const allClaimsData = useMemo(() => {
    const defaultClaims = claimsData.filter(
      (claim) => claim.hospitalId === currentHospitalId
    );
    // Add locally saved claims that aren't in default data
    const combined = [...defaultClaims, ...localClaims];
    // Remove duplicates by ID
    const uniqueClaims = Array.from(
      new Map(combined.map((claim) => [claim.id, claim])).values()
    );
    return uniqueClaims;
  }, [localClaims, isHydrated]);
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
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isClaimDetailsOpen, setIsClaimDetailsOpen] = useState(false);
  const { hasUnreadAlert } = useClaimsMessaging();
  const templateOptions = useMemo(() => getTemplateOptions(), []);

  useEffect(() => {
    ensureDemoHashSeeded();
    seedDemoHashesFromImages();
  }, []);

  // Listen for insurer claim updates and sync status back to hospital storage
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleInsurerClaimsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<ClaimData[]>;
      if (customEvent.detail) {
        const insurerClaims = customEvent.detail;

        // Update local claims with status changes from insurer
        setLocalClaims((prevClaims) => {
          const updated = prevClaims.map((claim) => {
            const insurerClaim = insurerClaims.find((ic) => ic.id === claim.id);
            if (insurerClaim && insurerClaim.status !== claim.status) {
              // Update the claim status from insurer
              return {
                ...claim,
                status: insurerClaim.status as
                  | "Pending"
                  | "Approved"
                  | "Rejected",
                updatedAt: new Date().toISOString(),
              };
            }
            return claim;
          });
          return updated;
        });
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === INSURER_CLAIMS_STORAGE_KEY) {
        // Re-sync from insurer storage when it changes
        const stored = loadStoredClaims();
        setLocalClaims((prevClaims) => {
          const updated = prevClaims.map((claim) => {
            const insurerClaim = stored.find((ic) => ic.id === claim.id);
            if (insurerClaim && insurerClaim.status !== claim.status) {
              return {
                ...claim,
                status: insurerClaim.status as
                  | "Pending"
                  | "Approved"
                  | "Rejected",
                updatedAt: new Date().toISOString(),
              };
            }
            return claim;
          });
          return updated;
        });
      }
    };

    window.addEventListener(CLAIMS_UPDATED_EVENT, handleInsurerClaimsUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        CLAIMS_UPDATED_EVENT,
        handleInsurerClaimsUpdate
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const handleClaimSubmitted = (newClaim: Claim) => {
    // Add new claim to local claims
    setLocalClaims((prevClaims) => [...prevClaims, newClaim]);
    // Close modal
    setShowSubmitForm(false);
  };

  const allClaims = allClaimsData
    .map((claim) => ({
      id: claim.id,
      patient: claim.employeeName,
      treatment: "Insurance Claim",
      date: claim.createdAt.split("T")[0],
      amount: formatPKR(claim.amountClaimed),
      status: claim.status,
      createdAt: claim.createdAt,
    }))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .map(({ createdAt, ...claim }) => claim);

  // Calculate statistics
  const claimsStats = useMemo(() => {
    const hospitalClaims = allClaimsData;
    const totalClaims = hospitalClaims.length;

    const totalApprovedClaims = hospitalClaims.filter(
      (claim) => claim.status === "Approved"
    ).length;

    const pendingClaims = hospitalClaims.filter(
      (claim) => claim.status === "Pending"
    ).length;

    const totalAmount = hospitalClaims.reduce(
      (sum, claim) => sum + claim.amountClaimed,
      0
    );

    return {
      totalClaims,
      totalApprovedClaims,
      pendingClaims,
      totalAmount: Math.round(totalAmount / 1000),
    };
  }, [allClaimsData]);

  // Filter claims based on search and filters
  const filteredClaims = allClaims.filter((claim) => {
    // Search filter - matches claim ID or patient name
    const matchesSearch =
      searchQuery === "" ||
      claim.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.patient.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter (compare with canonical status values)
    const matchesStatus =
      statusFilter === "All Status" || claim.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Reset page when filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, itemsPerPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredClaims.length / itemsPerPage)
  );

  const displayedClaims = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClaims.slice(start, start + itemsPerPage);
  }, [filteredClaims, currentPage, itemsPerPage]);

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Total Claims</p>
                <p className="text-2xl font-bold text-gray-900">
                  {claimsStats.totalClaims}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Approved Claims</p>
                <p className="text-2xl font-bold text-green-600">
                  {claimsStats.totalApprovedClaims}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {claimsStats.pendingClaims}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  Rs. {claimsStats.totalAmount}K
                </p>
              </div>
            </div>

            {/* Claims Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  </select>
                  <select
                    value={insurerFilter}
                    onChange={(e) => setInsurerFilter(e.target.value)}
                    className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm lg:text-base"
                  >
                    <option>All Insurers</option>
                    <option>HealthGuard Insurance</option>
                    <option>MediCare Plus</option>
                    <option>SecureHealth</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Claim ID
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
                        Amount
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
                    {filteredClaims.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No claims found matching your search criteria.
                        </td>
                      </tr>
                    ) : (
                      displayedClaims.map((claim) => {
                        const hasAlert = hasUnreadAlert(claim.id, "hospital");
                        return (
                          <tr
                            key={claim.id}
                            className={`hover:bg-gray-50 ${
                              hasAlert ? "border-l-4 border-red-500" : ""
                            }`}
                          >
                            <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm font-medium text-gray-900">
                              {claim.id}
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
                            <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm">
                              <button
                                onClick={() => {
                                  console.log(
                                    "Clicking View for claim:",
                                    claim.id,
                                    "Full claim data:",
                                    claim
                                  );
                                  const foundClaim = claimsData.find(
                                    (c) => c.id === claim.id
                                  );
                                  console.log(
                                    "Found in claimsData:",
                                    foundClaim
                                  );
                                  setSidebarOpen(false);
                                  setSelectedClaimId(claim.id);
                                  setIsClaimDetailsOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                View
                              </button>
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
                {filteredClaims.length > 0 && (
                  <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-3">
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3">
                      <div className="flex items-center space-x-4">
                        <p className="text-sm text-gray-700">
                          Showing{" "}
                          <span className="font-medium">
                            {filteredClaims.length === 0
                              ? 0
                              : (currentPage - 1) * itemsPerPage + 1}
                          </span>{" "}
                          to{" "}
                          <span className="font-medium">
                            {Math.min(
                              filteredClaims.length,
                              currentPage * itemsPerPage
                            )}
                          </span>{" "}
                          of{" "}
                          <span className="font-medium">
                            {filteredClaims.length}
                          </span>{" "}
                          claims
                          {filteredClaims.length !== allClaims.length && (
                            <span className="text-gray-500">
                              {" "}
                              (filtered from {allClaims.length} total)
                            </span>
                          )}
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
                          (_, i) => i + 1
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
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                    <SubmitClaimForm
                      onCancel={() => setShowSubmitForm(false)}
                      onSuccess={() => {
                        setShowSubmitForm(false);
                      }}
                      onClaimSubmitted={handleClaimSubmitted}
                    />
                  </div>
                </div>
              </div>
            )}

            <ClaimDetailsModal
              isOpen={isClaimDetailsOpen && !!selectedClaimId}
              onClose={() => {
                setIsClaimDetailsOpen(false);
                setSelectedClaimId(null);
              }}
              claimId={selectedClaimId || ""}
              claimData={
                selectedClaimId
                  ? allClaimsData.find((c) => c.id === selectedClaimId)
                  : undefined
              }
            />

            {/* Upload Modal */}
            {uploadModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
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
                                template.key === formState.templateKey
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
                            "Unable to run verification in the browser."
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
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
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
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
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
