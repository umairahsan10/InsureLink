"use client";

import { useMemo } from "react";
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
    <div className="p-4 sm:p-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Total Claims Card */}
        <Card className="relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total Claims
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {patientData.totalClaims}
              </p>
              <p className="text-sm text-gray-500 mt-1">This year</p>
            </div>
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
          </div>
        </Card>

        {/* Approved Claims Card */}
        <Card className="relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Approved Claims
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {patientData.approvedClaims}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {patientData.approvalRate}% approval rate
              </p>
            </div>
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
          </div>
        </Card>

        {/* Total Reimbursed Card */}
        <Card className="relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total Reimbursed
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {formatPKR(patientData.totalReimbursed)}
              </p>
              <p className="text-sm text-gray-500 mt-1">This year</p>
            </div>
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
          </div>
        </Card>

        {/* Pending Claims Card */}
        <Card className="relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Pending Claims
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {patientData.pendingClaims}
              </p>
              <p className="text-sm text-gray-500 mt-1">Awaiting review</p>
            </div>
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
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Claims Section */}
        <Card>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Recent Claims
            </h2>
            <p className="text-sm text-gray-600">
              Your latest claim submissions and their status
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {patientData.recentClaims.map((claim) => (
              <div
                key={claim.id}
                className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                      claim.status === "Approved"
                        ? "bg-green-100"
                        : claim.status === "Rejected"
                        ? "bg-red-100"
                        : "bg-yellow-100"
                    }`}
                  >
                    <span
                      className={`text-xs sm:text-sm font-medium ${
                        claim.status === "Approved"
                          ? "text-green-600"
                          : claim.status === "Rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {claim.icon}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {claim.name}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {claim.claimNumber}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between sm:flex-col sm:text-right sm:items-end">
                  <p className="text-sm font-medium text-gray-900">
                    {formatPKR(claim.amount)}
                  </p>
                  <ClaimStatusBadge status={claim.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Coverage Balance Section */}
        <Card>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Coverage Balance
            </h2>
            <p className="text-sm text-gray-600">
              Your remaining coverage for this year
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {patientData.coverageBalance.map((coverage) => (
              <div key={coverage.category}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 space-y-1 sm:space-y-0">
                  <span className="text-sm font-medium text-gray-700">
                    {coverage.category}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600">
                    Rs. {coverage.used.toLocaleString()} / Rs.{" "}
                    {coverage.total.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${coverage.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
