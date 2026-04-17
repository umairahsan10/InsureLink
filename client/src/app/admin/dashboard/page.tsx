"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { analyticsApi, CoverageAnalyticsResponse } from "@/lib/api/analytics";
import { adminApi, PaginatedUsersResponse } from "@/lib/api/admin";
import { auditApi, AuditLogEntry } from "@/lib/api/audit";
import { formatPKRShort } from "@/lib/format";
import type { Analytics, MonthlyTrend } from "@/types/analytics";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

const actionLabel = (action: string) => {
  switch (action) {
    case "CREATE":
      return { text: "Created", color: "bg-green-100 text-green-700" };
    case "UPDATE":
      return { text: "Updated", color: "bg-blue-100 text-blue-700" };
    case "DELETE":
      return { text: "Deleted", color: "bg-red-100 text-red-700" };
    default:
      return { text: action, color: "bg-gray-100 text-gray-700" };
  }
};

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// Simple bar for monthly trends (no chart library needed)
const TrendBar = ({ trends }: { trends: MonthlyTrend[] }) => {
  const maxVal = Math.max(...trends.map((t) => t.value), 1);
  const last6 = trends.slice(-6);
  return (
    <div className="flex items-end gap-1.5 h-24">
      {last6.map((t) => (
        <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-indigo-400 rounded-t-sm min-h-[2px] transition-all"
            style={{ height: `${(t.value / maxVal) * 100}%` }}
          />
          <span className="text-[10px] text-gray-400">
            {t.month.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [coverage, setCoverage] = useState<CoverageAnalyticsResponse | null>(null);
  const [userStats, setUserStats] = useState<PaginatedUsersResponse | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [analyticsRes, coverageRes, usersRes, logsRes] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getCoverageAnalytics(),
        adminApi.getAllUsers({ page: 1, limit: 1 }),
        auditApi.getLogs({ page: 1, limit: 8 }),
      ]);
      setAnalytics(analyticsRes);
      setCoverage(coverageRes);
      setUserStats(usersRes);
      setRecentLogs(logsRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-24 skeleton-shimmer rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 skeleton-shimmer rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 skeleton-shimmer rounded-xl" />
          <div className="h-64 skeleton-shimmer rounded-xl" />
        </div>
      </div>
    );
  }

  const a = analytics;
  const c = coverage;
  const totalUsers = userStats?.total ?? 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              System Overview
            </h1>
            <p className="text-gray-500">
              Real-time metrics across all portals
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/users"
              className="bg-white text-indigo-600 border border-indigo-200 px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-all font-semibold text-sm"
            >
              Manage Users
            </Link>
            <Link
              href="/admin/create-user"
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-semibold text-sm"
            >
              + Create User
            </Link>
          </div>
        </div>
      </div>

      {/* ─── KPI Cards Row 1: Claims ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Claims"
          value={String(a?.totalClaims ?? 0)}
          sub={`${formatPKRShort(a?.totalClaimValue ?? 0)} claimed`}
          color="indigo"
        />
        <KpiCard
          label="Pending"
          value={String(a?.claimsByStatus.Pending ?? 0)}
          sub="Awaiting review"
          color="amber"
        />
        <KpiCard
          label="Approved"
          value={String(a?.claimsByStatus.Approved ?? 0)}
          sub={`${formatPKRShort(a?.approvedValueTotal ?? 0)} approved`}
          color="green"
        />
        <KpiCard
          label="Rejected"
          value={String(a?.claimsByStatus.Rejected ?? 0)}
          sub={`${pct(a?.rejectionRate ?? 0)} rejection rate`}
          color="red"
        />
      </div>

      {/* ─── KPI Cards Row 2: Coverage + Users ────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Users"
          value={String(totalUsers)}
          sub="Across all roles"
          color="purple"
        />
        <KpiCard
          label="Active Employees"
          value={String(c?.activeEmployees ?? 0)}
          sub={`of ${c?.totalEmployees ?? 0} total`}
          color="blue"
        />
        <KpiCard
          label="Coverage Pool"
          value={formatPKRShort(c?.totalCoverageAmount ?? 0)}
          sub={`${formatPKRShort(c?.totalUsedAmount ?? 0)} used`}
          color="teal"
        />
        <KpiCard
          label="Utilization"
          value={pct(c?.utilizationRate ?? 0)}
          sub="Coverage consumed"
          color="orange"
        />
      </div>

      {/* ─── Middle Row: Trends + Processing ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Monthly Claims Trend */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Claims Trend (Last 6 Months)
          </h3>
          {a?.monthlyTrends && a.monthlyTrends.length > 0 ? (
            <>
              <TrendBar trends={a.monthlyTrends} />
              <div className="mt-3 flex justify-between text-xs text-gray-400">
                <span>
                  {a.monthlyTrends.reduce((s, t) => s + t.count, 0)} total
                  claims
                </span>
                <span>
                  {formatPKRShort(
                    a.monthlyTrends.reduce((s, t) => s + t.value, 0),
                  )}{" "}
                  total value
                </span>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm">No trend data yet</p>
          )}
        </div>

        {/* Processing Stats */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Processing
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {a?.avgProcessingTimeHours
                  ? `${a.avgProcessingTimeHours.toFixed(1)}h`
                  : "—"}
              </p>
              <p className="text-xs text-gray-500">Avg. processing time</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {pct(
                  a && a.totalClaims > 0
                    ? (a.claimsByStatus.Approved +
                        (a.totalClaims -
                          a.claimsByStatus.Pending -
                          a.claimsByStatus.Approved -
                          a.claimsByStatus.Rejected)) /
                        a.totalClaims
                    : 0,
                )}
              </p>
              <p className="text-xs text-gray-500">Approval rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Row: Top Hospitals + Coverage by Plan + Activity ─────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Top Hospitals */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Top Hospitals by Claims
          </h3>
          {a?.topHospitalsByAmount && a.topHospitalsByAmount.length > 0 ? (
            <div className="space-y-3">
              {a.topHospitalsByAmount.slice(0, 5).map((h, i) => (
                <div key={h.hospitalId} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {h.hospitalName}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {formatPKRShort(h.totalAmount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No data</p>
          )}
        </div>

        {/* Coverage by Plan */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Coverage by Plan
          </h3>
          {c?.planDistribution && c.planDistribution.length > 0 ? (
            <div className="space-y-3">
              {c.planDistribution.map((p) => (
                <div key={p.planId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-900 truncate">{p.planName}</span>
                    <span className="text-gray-500 ml-2">
                      {p.employeeCount} employees
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(100, (p.totalCoverage / (c.totalCoverageAmount || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatPKRShort(p.totalCoverage)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No plans yet</p>
          )}
        </div>

        {/* Claims per Corporate */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Claims by Corporate
          </h3>
          {a?.claimsPerCorporate && a.claimsPerCorporate.length > 0 ? (
            <div className="space-y-3">
              {a.claimsPerCorporate.slice(0, 5).map((corp) => (
                <div key={corp.corporateId} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {corp.corporateName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {corp.count} claim{corp.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {formatPKRShort(corp.value)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No data</p>
          )}
        </div>
      </div>

      {/* ─── Recent Activity Feed ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">
            Recent Activity
          </h3>
          <Link
            href="/admin/audit-logs"
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View All
          </Link>
        </div>
        {recentLogs.length > 0 ? (
          <div className="space-y-3">
            {recentLogs.map((log) => {
              const a = actionLabel(log.action);
              return (
                <div
                  key={log.id}
                  className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                >
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${a.color}`}
                  >
                    {a.text}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">
                        {log.user
                          ? `${log.user.firstName} ${log.user.lastName}`
                          : "System"}
                      </span>{" "}
                      <span className="text-gray-500">
                        {log.action.toLowerCase()}d
                      </span>{" "}
                      <span className="font-medium">{log.entityType}</span>
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {timeAgo(log.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No recent activity</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Card Component
// ---------------------------------------------------------------------------

const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", icon: "text-indigo-400" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", icon: "text-amber-400" },
  green: { bg: "bg-green-50", text: "text-green-700", icon: "text-green-400" },
  red: { bg: "bg-red-50", text: "text-red-700", icon: "text-red-400" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", icon: "text-purple-400" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-400" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", icon: "text-teal-400" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", icon: "text-orange-400" },
};

function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  const c = colorMap[color] || colorMap.indigo;
  return (
    <div className={`${c.bg} rounded-xl p-5 border border-gray-100`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}
