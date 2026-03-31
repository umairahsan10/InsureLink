"use client";

import { useEffect, useState } from "react";
import { formatPKRShort, formatPKR } from "@/lib/format";
import { analyticsApi } from "@/lib/api/analytics";
import type { Analytics } from "@/types/analytics";
import { StaggerContainer, StaggerItem } from "@/components/ui/PageTransition";

export default function HospitalDashboard() {
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Hospital Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="skeleton-shimmer h-3 w-24 rounded mb-3" />
              <div className="skeleton-shimmer h-8 w-32 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Hospital Dashboard</h1>
        <p className="text-gray-500">Unable to load analytics data.</p>
      </div>
    );
  }

  const pending = analytics.claimsByStatus.Pending;
  const approved = analytics.claimsByStatus.Approved;
  const totalClaims = analytics.totalClaims;
  const totalValue = analytics.totalClaimValue;

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Hospital Dashboard
      </h1>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StaggerItem>
          <div className="bg-white rounded-xl border border-gray-100 p-6 card-hover">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Total Claims</p>
              <div className="w-10 h-10 rounded-lg stat-gradient-blue flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalClaims}</p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="bg-white rounded-xl border border-gray-100 p-6 card-hover">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Pending Claims</p>
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
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <div className="w-10 h-10 rounded-lg stat-gradient-green flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{approved}</p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="bg-white rounded-xl border border-gray-100 p-6 card-hover">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Revenue (total)</p>
              <div className="w-10 h-10 rounded-lg stat-gradient-purple flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatPKRShort(totalValue)}</p>
          </div>
        </StaggerItem>
      </StaggerContainer>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Trends
          </h2>
          <div className="space-y-3">
            {analytics.monthlyTrends.length === 0 ? (
              <p className="text-gray-500 text-sm">No trend data available</p>
            ) : (
              analytics.monthlyTrends.map((trend) => (
                <div key={trend.month} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium">{trend.month}</p>
                    <span
                      className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800"
                    >
                      {trend.count} claims
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Claim value</span>
                    <span className="font-semibold">{formatPKR(trend.value)}</span>
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
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg stat-gradient-blue">
              <span className="text-gray-700">Avg Processing Time</span>
              <span className="text-xl font-bold text-blue-600">
                {analytics.avgProcessingTimeHours.toFixed(1)}h
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg stat-gradient-green">
              <span className="text-gray-700">Approved Value</span>
              <span className="text-xl font-bold text-green-600">
                {formatPKRShort(analytics.approvedValueTotal)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg stat-gradient-red">
              <span className="text-gray-700">Rejection Rate</span>
              <span className="text-xl font-bold text-red-600">
                {(analytics.rejectionRate * 100).toFixed(1)}%
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg stat-gradient-purple">
              <span className="text-gray-700">Total Claim Value</span>
              <span className="text-xl font-bold text-purple-600">
                {formatPKRShort(analytics.totalClaimValue)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
