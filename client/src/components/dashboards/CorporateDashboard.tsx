"use client";

import { useEffect, useState } from "react";
import { formatPKRShort } from "@/lib/format";
import { analyticsApi, type CoverageAnalyticsResponse } from "@/lib/api/analytics";
import type { Analytics } from "@/types/analytics";

export default function CorporateDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [coverage, setCoverage] = useState<CoverageAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.getDashboard(),
      analyticsApi.getCoverageAnalytics(),
    ])
      .then(([analyticsData, coverageData]) => {
        setAnalytics(analyticsData);
        setCoverage(coverageData);
      })
      .catch((err) => console.error("Failed to load analytics:", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Corporate Dashboard</h1>
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

  if (!analytics || !coverage) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Corporate Dashboard</h1>
        <p className="text-gray-500">Unable to load dashboard data.</p>
      </div>
    );
  }

  const totalEmployees = coverage.totalEmployees;
  const activeEmployees = coverage.activeEmployees;
  const activeClaims = analytics.claimsByStatus.Pending;
  const utilizationPct = (coverage.utilizationRate * 100).toFixed(1);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Corporate Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Total Employees</p>
          <p className="text-3xl font-bold text-blue-600">{totalEmployees}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Active Employees</p>
          <p className="text-3xl font-bold text-green-600">{activeEmployees}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Pending Claims</p>
          <p className="text-3xl font-bold text-orange-600">{activeClaims}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Coverage Utilization</p>
          <p className="text-3xl font-bold text-purple-600">{utilizationPct}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Claims Overview
          </h2>
          <div className="space-y-3">
            {[
              { label: "Pending", value: analytics.claimsByStatus.Pending, color: "text-yellow-600" },
              { label: "Approved", value: analytics.claimsByStatus.Approved, color: "text-green-600" },
              { label: "Rejected", value: analytics.claimsByStatus.Rejected, color: "text-red-600" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <p className="font-medium">{item.label}</p>
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
              <p className="font-medium">Total Claims</p>
              <p className="text-xl font-bold text-blue-600">{analytics.totalClaims}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Plan Distribution
          </h2>
          <div className="space-y-3">
            {coverage.planDistribution.length === 0 ? (
              <p className="text-gray-500 text-sm">No plan data available</p>
            ) : (
              coverage.planDistribution.map((plan) => {
                const pct =
                  totalEmployees > 0
                    ? Math.round((plan.employeeCount / totalEmployees) * 100)
                    : 0;
                return (
                  <div key={plan.planId}>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">{plan.planName}</span>
                      <span className="font-semibold">{plan.employeeCount} employees</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Coverage by Department */}
      {coverage.coverageByDepartment.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Coverage by Department
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Department</th>
                  <th className="pb-2">Employees</th>
                  <th className="pb-2">Total Coverage</th>
                  <th className="pb-2">Used</th>
                  <th className="pb-2">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {coverage.coverageByDepartment.map((dept) => {
                  const util =
                    dept.totalCoverage > 0
                      ? ((dept.usedAmount / dept.totalCoverage) * 100).toFixed(1)
                      : "0.0";
                  return (
                    <tr key={dept.department} className="border-b last:border-0">
                      <td className="py-2 font-medium">{dept.department}</td>
                      <td className="py-2">{dept.employeeCount}</td>
                      <td className="py-2">{formatPKRShort(dept.totalCoverage)}</td>
                      <td className="py-2">{formatPKRShort(dept.usedAmount)}</td>
                      <td className="py-2">{util}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
