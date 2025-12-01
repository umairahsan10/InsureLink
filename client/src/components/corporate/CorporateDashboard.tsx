import KeyMetrics from "@/components/corporate/KeyMetrics";
import CoverageOverview from "@/components/corporate/CoverageOverview";
import EmployeeCoverageStatus from "@/components/corporate/EmployeeCoverageStatus";
import RecentClaimsOverview from "@/components/corporate/RecentClaimsOverview";
import QuickActions from "@/components/corporate/QuickActions";

// Sample data matching the image
const sampleEmployeeData = [
  {
    name: "Ahmed Khan",
    cnic: "42101-1234567-8",
    department: "Engineering",
    coverageUsed: 35,
    totalCoverage: "Rs. 200,000",
  },
  {
    name: "Sara Ahmed",
    cnic: "42101-9876543-2",
    department: "Marketing",
    coverageUsed: 68,
    totalCoverage: "Rs. 200,000",
  },
  {
    name: "Ali Hassan",
    cnic: "42101-5555555-5",
    department: "Finance",
    coverageUsed: 22,
    totalCoverage: "Rs. 200,000",
  },
];

const sampleClaimsData = [
  {
    employee: "Ahmed Khan",
    claimId: "CLM-301",
    amount: "Rs. 28,000",
    hospital: "City General Hospital",
    date: "2024-01-15",
    status: "Approved" as const,
  },
  {
    employee: "Sara Ahmed",
    claimId: "CLM-302",
    amount: "Rs. 45,000",
    hospital: "Metro Medical Center",
    date: "2024-01-14",
    status: "Pending" as const,
  },
  {
    employee: "Ali Hassan",
    claimId: "CLM-303",
    amount: "Rs. 15,000",
    hospital: "District Hospital",
    date: "2024-01-13",
    status: "Approved" as const,
  },
];

export default function CorporateDashboard() {
  return (
    <div className="p-5 md:p-6 lg:p-8">
      {/* Key Metrics Cards */}
      <KeyMetrics
        totalEmployees={248}
        activeClaims={15}
        totalClaimsCost="Rs. 1.2M"
        coverageUtilization={42}
      />

      {/* Company Coverage Overview */}
      <CoverageOverview
        totalCoveragePool="Rs. 49.6M"
        usedCoverage="Rs. 20.8M"
        availableCoverage="Rs. 28.8M"
        utilizationPercentage={41.9}
      />

      {/* Employee Coverage Status Table */}
      <EmployeeCoverageStatus employees={sampleEmployeeData} />

      {/* Recent Claims Overview Table */}
      <RecentClaimsOverview claims={sampleClaimsData} />

      {/* Quick Actions */}
      {/* <QuickActions /> */}
    </div>
  );
}
