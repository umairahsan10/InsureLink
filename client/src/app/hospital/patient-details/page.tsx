"use client";

import { useState } from "react";
import HospitalSidebar from "@/components/hospital/HospitalSidebar";
import { patientsApi, PatientCoverage } from "@/lib/api/patients";

interface PatientResult {
  id: string;
  patientType: string;
  name: string;
  email?: string;
  mobile?: string;
  cnic?: string;
  insurance?: string;
  corporateName?: string;
  status?: string;
  age?: number;
  gender?: string;
}

interface PatientClaim {
  id: string;
  claimNumber: string;
  status: string;
  amountClaimed: string;
  approvedAmount: string;
  createdAt: string;
}

export default function HospitalPatientDetailsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<PatientResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const [coverage, setCoverage] = useState<PatientCoverage | null>(null);
  const [claims, setClaims] = useState<PatientClaim[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const result = await patientsApi.getPatients({
        search: searchTerm,
        limit: 20,
      });
      setSearchResults(result.items as unknown as PatientResult[]);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPatient = async (patient: PatientResult) => {
    setSelectedPatient(patient);
    setIsLoadingDetails(true);

    try {
      const [coverageData, claimsData] = await Promise.all([
        patientsApi.getCoverage(patient.id).catch(() => null),
        patientsApi.getPatientClaims(patient.id).catch(() => ({ items: [], total: 0 })),
      ]);
      setCoverage(coverageData);
      setClaims(claimsData.items);
    } catch (err) {
      console.error("Failed to load patient details:", err);
    } finally {
      setIsLoadingDetails(false);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewSearch = () => {
    setSelectedPatient(null);
    setCoverage(null);
    setClaims([]);
    setSearchResults([]);
    setSearchTerm("");
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `Rs. ${num.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <HospitalSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="ml-0 lg:ml-64 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Patient Details
                </h1>
                <p className="text-xs lg:text-sm text-gray-600">
                  Search and view comprehensive patient information
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-4"></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {/* Search Section - Always Visible */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 lg:p-6 mb-4 lg:mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search by name, email, mobile, or employee number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {/* Patient Details View */}
          {selectedPatient && (
            <div className="space-y-6">
              {/* Back Button */}
              <button
                onClick={handleNewSearch}
                className="flex items-center text-gray-600 hover:text-gray-900"
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                New Search
              </button>

              {/* Personal Information */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg
                    className="w-6 h-6 mr-2 text-green-600"
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
                  Personal Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-semibold text-gray-900">
                      {selectedPatient.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Patient Type</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {selectedPatient.patientType}
                    </p>
                  </div>
                  {selectedPatient.email && (
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-semibold text-gray-900">
                        {selectedPatient.email}
                      </p>
                    </div>
                  )}
                  {selectedPatient.mobile && (
                    <div>
                      <p className="text-sm text-gray-500">Mobile</p>
                      <p className="font-semibold text-gray-900">
                        {selectedPatient.mobile}
                      </p>
                    </div>
                  )}
                  {selectedPatient.cnic && (
                    <div>
                      <p className="text-sm text-gray-500">CNIC</p>
                      <p className="font-semibold text-gray-900">
                        {selectedPatient.cnic}
                      </p>
                    </div>
                  )}
                  {selectedPatient.gender && (
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-semibold text-gray-900">
                        {selectedPatient.gender}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Insurance Coverage */}
              {coverage && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <svg
                      className="w-6 h-6 mr-2 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    Insurance Coverage
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Plan</p>
                      <p className="font-semibold text-gray-900">
                        {selectedPatient.insurance || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Corporate</p>
                      <p className="font-semibold text-gray-900">
                        {selectedPatient.corporateName || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Coverage</p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(coverage.totalCoverageAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Used Amount</p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(coverage.usedAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Available Amount</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(coverage.availableAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-semibold text-gray-900">
                        {coverage.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Coverage Start</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(coverage.coverageStartDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Coverage End</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(coverage.coverageEndDate)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isLoadingDetails && (
                <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto" />
                  <p className="text-gray-500 mt-2">Loading details...</p>
                </div>
              )}

              {/* Claims History */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg
                    className="w-6 h-6 mr-2 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Claims History ({claims.length})
                </h2>
                {claims.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No claims found for this patient.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Claim Number
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount Claimed
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Approved Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {claims.map((claim) => (
                          <tr key={claim.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {claim.claimNumber}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(claim.createdAt)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(claim.amountClaimed)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(claim.approvedAmount)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  claim.status === "Approved"
                                    ? "bg-green-100 text-green-800"
                                    : claim.status === "Rejected"
                                      ? "bg-red-100 text-red-800"
                                      : claim.status === "Pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {claim.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search Results */}
          {!selectedPatient && searchResults.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Search Results ({searchResults.length})
              </h2>
              <div className="space-y-3">
                {searchResults.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {patient.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {patient.email || ""}{patient.email && patient.mobile ? " • " : ""}{patient.mobile || ""}
                        </p>
                        <p className="text-sm text-gray-500">
                          {patient.corporateName || ""} • {patient.insurance || ""}
                        </p>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {!selectedPatient &&
            searchTerm &&
            searchResults.length === 0 &&
            !isSearching && (
              <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
                <svg
                  className="w-12 h-12 mx-auto text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-500">
                  No patients found. Try a different search term.
                </p>
              </div>
            )}
        </main>
      </div>
    </div>
  );
}
