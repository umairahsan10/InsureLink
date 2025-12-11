"use client";

import { useMemo, useState } from "react";
import Card from "@/components/shared/Card";
import ClaimStatusBadge from "@/components/claims/ClaimStatusBadge";
import type { ClaimStatus } from "@/types/claims";
import type { Claim } from "@/types/claims";
import { formatPKR } from "@/lib/format";
import claimsDataRaw from "@/data/claims.json";
import { sortClaimsByDateDesc } from "@/lib/sort";

const claimsData = claimsDataRaw as Claim[];

export default function PatientDashboardPage() {
  // Get claims for patient emp-001 (Ali Raza)
  const patientId = "emp-001";
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const patientClaims = useMemo(() => {
    return claimsData.filter((claim) => claim.employeeId === patientId);
  }, []);

  // Get the latest 3 claims sorted by date
  const recentClaims = useMemo(() => {
    return sortClaimsByDateDesc(patientClaims)
      .slice(0, 3)
      .map((claim) => ({
        id: claim.id,
        claimNumber: claim.claimNumber,
        name: claim.hospitalName,
        amount: claim.amountClaimed,
        status: claim.status as ClaimStatus,
        date: claim.createdAt,
        icon:
          claim.status === "Approved"
            ? "✓"
            : claim.status === "Rejected"
            ? "✕"
            : "⏰",
      }));
  }, [patientClaims]);

  // Calculate statistics based on actual claims data
  const patientData = useMemo(() => {
    const approvedClaims = patientClaims.filter(
      (claim) => claim.status === "Approved"
    ).length;
    const totalReimbursed = patientClaims
      .filter((claim) => claim.status === "Approved")
      .reduce((sum, claim) => sum + (claim.approvedAmount || 0), 0);
    const pendingClaims = patientClaims.filter(
      (claim) => claim.status === "Pending"
    ).length;
    const approvalRate =
      patientClaims.length > 0
        ? Math.round((approvedClaims / patientClaims.length) * 100)
        : 0;

    return {
      patientId,
      patientName: "Ali Raza",
      totalClaims: patientClaims.length,
      approvedClaims,
      totalReimbursed,
      pendingClaims,
      approvalRate,
      recentClaims,
      coverageBalance: [
        {
          category: "Medical",
          used: 2_500,
          total: 5_000,
          percentage: 50,
        },
        {
          category: "Dental",
          used: 850,
          total: 1_500,
          percentage: 57,
        },
        {
          category: "Vision",
          used: 200,
          total: 500,
          percentage: 40,
        },
      ],
    };
  }, [patientClaims, recentClaims]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 sm:p-5">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Dashboard
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm">
          Welcome back, {patientData.patientName}. Here's your health insurance
          overview.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Total Claims Card */}
        <div
          className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
          onMouseEnter={() => setHoveredCard("total")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-4 sm:p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="flex flex-col">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Total Claims
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {patientData.totalClaims}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
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
            <p className="text-xs text-gray-500">This year</p>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-blue-600" />
        </div>

        {/* Approved Claims Card */}
        <div
          className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
          onMouseEnter={() => setHoveredCard("approved")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-4 sm:p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="flex flex-col">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Approved Claims
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {patientData.approvedClaims}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-green-600"
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
            </div>
            <p className="text-xs text-gray-500">
              {patientData.approvalRate}% success rate
            </p>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-green-500 to-green-600" />
        </div>

        {/* Total Reimbursed Card */}
        <div
          className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
          onMouseEnter={() => setHoveredCard("reimbursed")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-4 sm:p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="flex flex-col">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Total Reimbursed
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatPKR(patientData.totalReimbursed)}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500">This year</p>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-600" />
        </div>

        {/* Pending Claims Card */}
        <div
          className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
          onMouseEnter={() => setHoveredCard("pending")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-4 sm:p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="flex flex-col">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Pending Claims
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {patientData.pendingClaims}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600"
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
            <p className="text-xs text-gray-500">Awaiting review</p>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-amber-600" />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Claims Section - Larger Width */}
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-blue-600"
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
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Recent Claims
                </h2>
              </div>
              <p className="text-xs text-gray-600 ml-9">
                Your latest submissions and their status
              </p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {patientData.recentClaims.length > 0 ? (
                patientData.recentClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="group flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-25 rounded-lg hover:from-blue-50 hover:to-blue-25 border border-gray-100 hover:border-blue-200 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-base transform group-hover:scale-110 transition-transform ${
                          claim.status === "Approved"
                            ? "bg-green-100 text-green-600"
                            : claim.status === "Rejected"
                            ? "bg-red-100 text-red-600"
                            : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        {claim.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                          {claim.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {claim.claimNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between sm:flex-col sm:text-right sm:items-end gap-3">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900">
                        {formatPKR(claim.amount)}
                      </p>
                      <ClaimStatusBadge status={claim.status} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No recent claims</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Coverage Balance Section */}
        <div>
          <Card>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Coverage Balance
                </h2>
              </div>
              <p className="text-xs text-gray-600 ml-9">
                Remaining coverage this year
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {patientData.coverageBalance.map((coverage) => (
                <div key={coverage.category} className="group">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                      {coverage.category}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {coverage.percentage}%
                    </span>
                  </div>
                  <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden shadow-sm">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        coverage.percentage < 50
                          ? "bg-gradient-to-r from-green-500 to-emerald-500"
                          : coverage.percentage < 75
                          ? "bg-gradient-to-r from-amber-500 to-orange-500"
                          : "bg-gradient-to-r from-red-500 to-rose-500"
                      }`}
                      style={{ width: `${coverage.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>Rs. {coverage.used.toLocaleString()}</span>
                    <span>Rs. {coverage.total.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
