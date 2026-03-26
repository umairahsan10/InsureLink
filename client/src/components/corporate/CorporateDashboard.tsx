"use client";

import { useEffect, useState } from "react";
import KeyMetrics from "@/components/corporate/KeyMetrics";
import CoverageOverview from "@/components/corporate/CoverageOverview";
import EmployeeCoverageStatus from "@/components/corporate/EmployeeCoverageStatus";
import RecentClaimsOverview from "@/components/corporate/RecentClaimsOverview";
import { analyticsApi } from "@/lib/api/analytics";
import { formatPKR, formatPKRShort } from "@/lib/format";

export default function CorporateDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    activeClaims: 0,
    totalClaimsCost: "PKR 0",
    coverageUtilization: 0,
  });
  const [coverage, setCoverage] = useState({
    totalCoveragePool: "PKR 0",
    usedCoverage: "PKR 0",
    availableCoverage: "PKR 0",
    utilizationPercentage: 0,
  });
  const [recentClaims, setRecentClaims] = useState<
    {
      employee: string;
      claimId: string;
      amount: string;
      hospital: string;
      date: string;
      status: "Approved" | "Pending" | "Rejected";
    }[]
  >([]);

  useEffect(() => {
    async function load() {
      try {
        const [dashboard, coverageData] = await Promise.all([
          analyticsApi.getDashboard(),
          analyticsApi.getCoverageAnalytics(),
        ]);

        const d = dashboard as any;
        const totalCost = d.totalClaimValue ?? d.totalPayout ?? 0;
        const poolNum = Math.round(totalCost * 3);
        const usedNum = totalCost;
        const availableNum = Math.max(0, poolNum - usedNum);
        const utilPct =
          poolNum > 0 ? Math.round((usedNum / poolNum) * 100) : 0;

        setMetrics({
          totalEmployees: coverageData.totalEmployees ?? d.totalEmployees ?? 0,
          activeClaims: d.claimsByStatus?.Pending ?? d.pendingClaims ?? 0,
          totalClaimsCost: formatPKRShort(totalCost),
          coverageUtilization: coverageData.utilizationRate ?? utilPct,
        });

        setCoverage({
          totalCoveragePool: formatPKR(coverageData.totalPool ?? poolNum),
          usedCoverage: formatPKR(coverageData.usedAmount ?? usedNum),
          availableCoverage: formatPKR(
            coverageData.availableAmount ?? availableNum
          ),
          utilizationPercentage: coverageData.utilizationRate ?? utilPct,
        });

        if (d.recentClaims) {
          setRecentClaims(
            d.recentClaims.slice(0, 5).map((c: any) => ({
              employee: c.employeeName || "—",
              claimId: c.claimNumber || c.id,
              amount: formatPKR(c.amountClaimed || 0),
              hospital: c.hospitalName || "—",
              date: c.createdAt || c.admissionDate || "",
              status: c.status as "Approved" | "Pending" | "Rejected",
            }))
          );
        }
      } catch {
        // leave defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-5 md:p-6 lg:p-8 space-y-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow p-6 h-32 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 lg:p-8">
      <KeyMetrics
        totalEmployees={metrics.totalEmployees}
        activeClaims={metrics.activeClaims}
        totalClaimsCost={metrics.totalClaimsCost}
        coverageUtilization={metrics.coverageUtilization}
      />

      <CoverageOverview
        totalCoveragePool={coverage.totalCoveragePool}
        usedCoverage={coverage.usedCoverage}
        availableCoverage={coverage.availableCoverage}
        utilizationPercentage={coverage.utilizationPercentage}
      />

      <EmployeeCoverageStatus employees={[]} />

      <RecentClaimsOverview claims={recentClaims} />
    </div>
  );
}
