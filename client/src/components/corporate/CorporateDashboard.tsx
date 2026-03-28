"use client";

import { useEffect, useMemo, useState } from "react";
import KeyMetrics from "@/components/corporate/KeyMetrics";
import CoverageOverview from "@/components/corporate/CoverageOverview";
import EmployeeCoverageStatus from "@/components/corporate/EmployeeCoverageStatus";
import RecentClaimsOverview from "@/components/corporate/RecentClaimsOverview";
import { useAuth } from "@/hooks/useAuth";
import { formatPKR, formatPKRShort } from "@/lib/format";
import { corporatesApi, type CorporateStats } from "@/lib/api/corporates";
import { claimsApi } from "@/lib/api/claims";
import { employeesApi } from "@/lib/api/employees";

type DashboardClaim = {
  employee: string;
  claimId: string;
  amount: string;
  hospital: string;
  date: string;
  status: "Approved" | "Pending" | "Rejected";
};

type DashboardEmployeeCoverage = {
  name: string;
  cnic: string;
  department: string;
  coverageUsed: number;
  totalCoverage: string;
};

const parseApiErrorMessage = (err: unknown, fallback: string): string => {
  if (!(err instanceof Error)) return fallback;

  try {
    const raw = JSON.parse(err.message) as {
      message?: string;
      errors?: string[];
    };
    if (Array.isArray(raw.errors) && raw.errors.length > 0) {
      return raw.errors.join(", ");
    }
    if (typeof raw.message === "string" && raw.message) {
      return raw.message;
    }
  } catch {
    // ignore JSON parse failures and use plain error message
  }

  return err.message || fallback;
};

const emptyStats: CorporateStats = {
  activeEmployees: 0,
  activeDependents: 0,
  totalCoverageAmount: "0",
  usedCoverageAmount: "0",
  remainingCoverageAmount: "0",
  approvedClaimsCount: 0,
  pendingClaimsCount: 0,
  rejectedClaimsCount: 0,
};

export default function CorporateDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CorporateStats>(emptyStats);
  const [recentClaims, setRecentClaims] = useState<DashboardClaim[]>([]);
  const [employeeCoverage, setEmployeeCoverage] = useState<
    DashboardEmployeeCoverage[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const corporateId = user?.corporateId;
    if (!corporateId) {
      setError("Corporate profile is not linked to this account.");
      setLoading(false);
      return;
    }

    let active = true;
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsResponse, claimsResponse, employeesResponse] =
          await Promise.all([
            corporatesApi.getCorporateStats(corporateId),
            claimsApi.getClaims({
              corporateId,
              page: 1,
              limit: 5,
              sortBy: "createdAt",
              order: "desc",
            }),
            employeesApi.list({
              corporateId,
              page: 1,
              limit: 5,
            }),
          ]);

        const mappedClaims: DashboardClaim[] = (claimsResponse.data || []).map(
          (claim) => {
            const employeeUser = claim.hospitalVisit?.employee?.user;
            const dependent = claim.hospitalVisit?.dependent;
            const employeeName = employeeUser
              ? `${employeeUser.firstName}${employeeUser.lastName ? ` ${employeeUser.lastName}` : ""}`
              : dependent
                ? `${dependent.firstName} ${dependent.lastName}`
                : "Unknown";

            const rawStatus = claim.claimStatus;
            const status: DashboardClaim["status"] =
              rawStatus === "Approved" || rawStatus === "Paid"
                ? "Approved"
                : rawStatus === "Rejected"
                  ? "Rejected"
                  : "Pending";

            return {
              employee: employeeName,
              claimId: claim.claimNumber,
              amount: formatPKR(Number(claim.amountClaimed || 0)),
              hospital:
                claim.hospitalVisit?.hospital?.hospitalName || "Unknown",
              date: new Date(claim.createdAt).toLocaleDateString(),
              status,
            };
          },
        );

        const mappedEmployees: DashboardEmployeeCoverage[] = (
          employeesResponse.items || []
        ).map((employee) => {
          const fullName = [employee.firstName, employee.lastName]
            .filter(Boolean)
            .join(" ")
            .trim();
          const used = Number(employee.usedAmount || 0);
          const total = Number(employee.coverageAmount || 0);
          const percentage =
            total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

          return {
            name: fullName || employee.email,
            cnic: "N/A",
            department: employee.department || "N/A",
            coverageUsed: percentage,
            totalCoverage: formatPKR(total),
          };
        });

        if (active) {
          setStats(statsResponse);
          setRecentClaims(mappedClaims);
          setEmployeeCoverage(mappedEmployees);
        }
      } catch (err) {
        if (active) {
          console.error("Failed to load corporate stats:", err);
          setError(
            parseApiErrorMessage(
              err,
              "Could not load corporate dashboard metrics.",
            ),
          );
          setStats(emptyStats);
          setRecentClaims([]);
          setEmployeeCoverage([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadStats();
    return () => {
      active = false;
    };
  }, [user?.corporateId]);

  const totals = useMemo(() => {
    const totalCoverage = Number(stats.totalCoverageAmount || 0);
    const usedCoverage = Number(stats.usedCoverageAmount || 0);
    const availableCoverage = Number(stats.remainingCoverageAmount || 0);

    return {
      totalCoverage,
      usedCoverage,
      availableCoverage,
      utilizationPercentage:
        totalCoverage > 0
          ? Math.round((usedCoverage / totalCoverage) * 100)
          : 0,
    };
  }, [stats]);

  if (loading) {
    return (
      <div className="p-5 md:p-6 lg:p-8 text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 lg:p-8">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Key Metrics Cards */}
      <KeyMetrics
        totalEmployees={stats.activeEmployees}
        activeClaims={stats.pendingClaimsCount}
        totalClaimsCost={formatPKRShort(totals.usedCoverage)}
        coverageUtilization={totals.utilizationPercentage}
      />

      <CoverageOverview
        totalCoveragePool={formatPKR(totals.totalCoverage)}
        usedCoverage={formatPKR(totals.usedCoverage)}
        availableCoverage={formatPKR(totals.availableCoverage)}
        utilizationPercentage={totals.utilizationPercentage}
      />

      {/* Employee Coverage Status Table (uses placeholder employees) */}
      <EmployeeCoverageStatus employees={employeeCoverage} />

      <RecentClaimsOverview claims={recentClaims} />
    </div>
  );
}
