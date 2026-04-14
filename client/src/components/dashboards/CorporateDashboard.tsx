"use client";

import { useEffect, useState } from "react";
import { formatPKRShort } from "@/lib/format";
import { analyticsApi, type CoverageAnalyticsResponse } from "@/lib/api/analytics";
import type { Analytics } from "@/types/analytics";

import { StaggerContainer, StaggerItem } from "@/components/ui/PageTransition";

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
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Corporate Dashboard</h1>
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
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Corporate Dashboard
      </h1>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StaggerItem>
          <div className="bg-white rounded-xl border border-gray-100 p-6 card-hover">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Total Employees</p>
              <div className="w-10 h-10 rounded-lg stat-gradient-blue flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalEmployees}</p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="bg-white rounded-xl border border-gray-100 p-6 card-hover">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Active Employees</p>
              <div className="w-10 h-10 rounded-lg stat-gradient-green flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{activeEmployees}</p>
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
            <p className="text-3xl font-bold text-gray-900">{activeClaims}</p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="bg-white rounded-xl border border-gray-100 p-6 card-hover">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Coverage Utilization</p>
              <div className="w-10 h-10 rounded-lg stat-gradient-purple flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{utilizationPct}%</p>
          </div>
        </StaggerItem>
      </StaggerContainer>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
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
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <p className="font-medium">{item.label}</p>
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
            <div className="flex justify-between items-center p-3 rounded-lg stat-gradient-blue">
              <p className="font-medium">Total Claims</p>
              <p className="text-xl font-bold text-blue-600">{analytics.totalClaims}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
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
        <div className="bg-white rounded-xl border border-gray-100 p-6 mt-4">
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
