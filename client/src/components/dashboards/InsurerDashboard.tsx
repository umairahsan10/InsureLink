"use client";

import { useEffect, useState } from "react";
import { formatPKRShort, formatPKR } from "@/lib/format";
import { analyticsApi } from "@/lib/api/analytics";
import type { Analytics } from "@/types/analytics";
import { StaggerContainer, StaggerItem } from "@/components/ui/PageTransition";

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
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Insurer Dashboard</h1>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="skeleton-shimmer h-3 w-24 rounded mb-3" />
                <div className="skeleton-shimmer h-8 w-32 rounded" />
              </div>
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
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Insurer Dashboard
      </h1>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StaggerItem>
          <div className="bg-white rounded-xl border border-gray-100 p-6 card-hover">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Claims Total</p>
              <div className="w-10 h-10 rounded-lg stat-gradient-blue flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalClaims.toLocaleString()}</p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="bg-white rounded-xl border border-gray-100 p-6 card-hover">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Pending Review</p>
              <div className="w-10 h-10 rounded-lg stat-gradient-amber flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{pending}</p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="bg-white rounded-xl border border-gray-100 p-6 card-hover">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Approval Rate</p>
              <div className="w-10 h-10 rounded-lg stat-gradient-green flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{approvalRate}%</p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="bg-white rounded-xl border border-gray-100 p-6 card-hover">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Total Payout</p>
              <div className="w-10 h-10 rounded-lg stat-gradient-purple flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatPKRShort(totalPayout)}</p>
          </div>
        </StaggerItem>
      </StaggerContainer>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top Hospitals by Amount
          </h2>
          <div className="space-y-3">
            {topHospitals.length === 0 ? (
              <p className="text-gray-500 text-sm">No data available</p>
            ) : (
              topHospitals.map((hospital) => (
                <div key={hospital.hospitalId} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Claims Per Corporate
          </h2>
          <div className="space-y-3">
            {analytics.claimsPerCorporate.length === 0 ? (
              <p className="text-gray-500 text-sm">No data available</p>
            ) : (
              analytics.claimsPerCorporate.slice(0, 5).map((corp) => (
                <div key={corp.corporateId} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="bg-white rounded-xl border border-gray-100 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Trends
          </h2>
          <div className="space-y-2">
            {analytics.monthlyTrends.length === 0 ? (
              <p className="text-gray-500 text-sm">No trend data available</p>
            ) : (
              analytics.monthlyTrends.map((trend) => (
                <div key={trend.month} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Key Metrics
          </h2>
          <div className="space-y-4">
            <div className="p-3 rounded-lg stat-gradient-blue">
              <p className="text-sm text-gray-600">Avg Processing Time</p>
              <p className="text-xl font-bold text-blue-600">
                {analytics.avgProcessingTimeHours.toFixed(1)}h
              </p>
            </div>
            <div className="p-3 rounded-lg stat-gradient-red">
              <p className="text-sm text-gray-600">Rejection Rate</p>
              <p className="text-xl font-bold text-red-600">
                {(analytics.rejectionRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 rounded-lg stat-gradient-green">
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
