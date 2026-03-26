"use client";

import { useEffect, useState } from "react";
import { formatPKRShort, formatPKR } from "@/lib/format";
import { analyticsApi } from "@/lib/api/analytics";
import type { Analytics } from "@/types/analytics";

export default function InsurerDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    analyticsApi
      .getDashboard()
      .then(setAnalytics)
      .catch((err) => console.error("Failed to load analytics:", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Insurer Dashboard</h1>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Insurer Dashboard</h1>
        <p className="text-gray-500">Unable to load analytics data.</p>
      </div>
    );
  }

  const totalClaims = analytics.totalClaims;
  const pending = analytics.claimsByStatus.Pending;
  const approved = analytics.claimsByStatus.Approved;
  const approvalRate =
    totalClaims === 0 ? 0 : Math.round((approved / totalClaims) * 100);
  const totalPayout = analytics.approvedValueTotal;

  const topHospitals = analytics.topHospitalsByAmount.slice(0, 3);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Insurer Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Claims Total</p>
          <p className="text-3xl font-bold text-blue-600">
            {totalClaims.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Pending Review</p>
          <p className="text-3xl font-bold text-yellow-600">{pending}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Approval Rate</p>
          <p className="text-3xl font-bold text-green-600">{approvalRate}%</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Total Payout</p>
          <p className="text-3xl font-bold text-purple-600">
            {formatPKRShort(totalPayout)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Top Hospitals by Amount
          </h2>
          <div className="space-y-3">
            {topHospitals.length === 0 ? (
              <p className="text-gray-500 text-sm">No data available</p>
            ) : (
              topHospitals.map((hospital) => (
                <div key={hospital.hospitalId} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium">{hospital.hospitalName}</p>
                    <span className="font-semibold text-lg">
                      {formatPKR(hospital.totalAmount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Claims Per Corporate
          </h2>
          <div className="space-y-3">
            {analytics.claimsPerCorporate.length === 0 ? (
              <p className="text-gray-500 text-sm">No data available</p>
            ) : (
              analytics.claimsPerCorporate.slice(0, 5).map((corp) => (
                <div key={corp.corporateId} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{corp.corporateName}</p>
                      <p className="text-sm text-gray-600">{corp.count} claims</p>
                    </div>
                    <span className="font-semibold">{formatPKR(corp.value)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Monthly Trends + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Monthly Trends
          </h2>
          <div className="space-y-2">
            {analytics.monthlyTrends.length === 0 ? (
              <p className="text-gray-500 text-sm">No trend data available</p>
            ) : (
              analytics.monthlyTrends.map((trend) => (
                <div key={trend.month} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-700">{trend.month}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{trend.count} claims</span>
                    <span className="text-sm font-semibold">{formatPKRShort(trend.value)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Key Metrics
          </h2>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-sm text-gray-600">Avg Processing Time</p>
              <p className="text-xl font-bold text-blue-600">
                {analytics.avgProcessingTimeHours.toFixed(1)}h
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded">
              <p className="text-sm text-gray-600">Rejection Rate</p>
              <p className="text-xl font-bold text-red-600">
                {(analytics.rejectionRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <p className="text-sm text-gray-600">Total Claim Value</p>
              <p className="text-xl font-bold text-green-600">
                {formatPKRShort(analytics.totalClaimValue)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
