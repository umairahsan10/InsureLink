"use client";

import { useEffect, useState } from "react";
import { formatPKRShort, formatPKR } from "@/lib/format";
import { analyticsApi } from "@/lib/api/analytics";
import type { Analytics } from "@/types/analytics";

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
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Hospital Dashboard</h1>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Hospital Dashboard</h1>
        <p className="text-gray-500">Unable to load analytics data.</p>
      </div>
    );
  }

  const pending = analytics.claimsByStatus.Pending;
  const approved = analytics.claimsByStatus.Approved;
  const totalClaims = analytics.totalClaims;
  const totalValue = analytics.totalClaimValue;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Hospital Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Total Claims</p>
          <p className="text-3xl font-bold text-blue-600">{totalClaims}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Pending Claims</p>
          <p className="text-3xl font-bold text-yellow-600">{pending}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Approved</p>
          <p className="text-3xl font-bold text-green-600">{approved}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Revenue (total)</p>
          <p className="text-3xl font-bold text-purple-600">
            {formatPKRShort(totalValue)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Monthly Trends
          </h2>
          <div className="space-y-3">
            {analytics.monthlyTrends.length === 0 ? (
              <p className="text-gray-500 text-sm">No trend data available</p>
            ) : (
              analytics.monthlyTrends.map((trend) => (
                <div key={trend.month} className="p-3 bg-gray-50 rounded">
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

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Key Metrics
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
              <span className="text-gray-700">Avg Processing Time</span>
              <span className="text-xl font-bold text-blue-600">
                {analytics.avgProcessingTimeHours.toFixed(1)}h
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span className="text-gray-700">Approved Value</span>
              <span className="text-xl font-bold text-green-600">
                {formatPKRShort(analytics.approvedValueTotal)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-red-50 rounded">
              <span className="text-gray-700">Rejection Rate</span>
              <span className="text-xl font-bold text-red-600">
                {(analytics.rejectionRate * 100).toFixed(1)}%
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
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
