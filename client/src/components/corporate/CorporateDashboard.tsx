import KeyMetrics from "@/components/corporate/KeyMetrics";
import CoverageOverview from "@/components/corporate/CoverageOverview";
import EmployeeCoverageStatus from "@/components/corporate/EmployeeCoverageStatus";
import RecentClaimsOverview from "@/components/corporate/RecentClaimsOverview";
import claims from '@/data/claims.json';
import corporates from '@/data/corporates.json';
import { formatPKR, formatPKRShort } from '@/lib/format';

import type { Claim } from '@/types/claims';

interface CorporateRecord {
  id: string;
  name: string;
  totalEmployees?: number;
}

// Use the first corporate as the default sample (Acme Ltd)
const corporatesData = corporates as CorporateRecord[];
const corp = corporatesData[0];
const corpClaims = (claims as Claim[]).filter((c) => c.corporateId === corp.id);
const totalEmployees = corp?.totalEmployees ?? 0;
const activeClaims = corpClaims.filter((c) => c.status === 'Pending').length;
const totalClaimsCostNum = corpClaims.reduce((s, c) => s + (c.amountClaimed || 0), 0);
const totalClaimsCost = formatPKRShort(totalClaimsCostNum);

// Derive a simple coverage overview from corp totals (used=claims total, pool=3x claims total)
const totalCoveragePoolNum = Math.round(totalClaimsCostNum * 3);
const usedCoverageNum = totalClaimsCostNum;
const availableCoverageNum = Math.max(0, totalCoveragePoolNum - usedCoverageNum);
const utilizationPercentage = totalCoveragePoolNum > 0 ? Math.round((usedCoverageNum / totalCoveragePoolNum) * 100) : 0;

const recentClaims = corpClaims
  .slice()
  .sort((a, b) => (new Date(b.createdAt || b.admissionDate).getTime() - new Date(a.createdAt || a.admissionDate).getTime()))
  .slice(0, 5)
  .map((c) => ({
    employee: c.employeeName || '—',
    claimId: c.claimNumber || c.id,
    amount: formatPKR(c.amountClaimed || 0),
    hospital: c.hospitalName || '—',
    date: c.createdAt || c.admissionDate,
    status: c.status,
  }));

export default function CorporateDashboard() {
  return (
    <div className="p-5 md:p-6 lg:p-8">
      {/* Key Metrics Cards */}
      <KeyMetrics
        totalEmployees={totalEmployees}
        activeClaims={activeClaims}
        totalClaimsCost={totalClaimsCost}
        coverageUtilization={utilizationPercentage}
      />

      {/* Company Coverage Overview */}
      <CoverageOverview
        totalCoveragePool={formatPKR(totalCoveragePoolNum)}
        usedCoverage={formatPKR(usedCoverageNum)}
        availableCoverage={formatPKR(availableCoverageNum)}
        utilizationPercentage={utilizationPercentage}
      />

      {/* Employee Coverage Status Table (uses placeholder employees) */}
      <EmployeeCoverageStatus employees={[]} />

      {/* Recent Claims Overview Table */}
      <RecentClaimsOverview claims={recentClaims} />

      {/* Quick Actions */}
      {/* <QuickActions /> */}
    </div>
  );
}
