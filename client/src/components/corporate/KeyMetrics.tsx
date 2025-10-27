import MetricCard from './MetricCard';

interface KeyMetricsProps {
  totalEmployees: number;
  activeClaims: number;
  totalClaimsCost: string;
  coverageUtilization: number;
}

export default function KeyMetrics({
  totalEmployees,
  activeClaims,
  totalClaimsCost,
  coverageUtilization,
}: KeyMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="Total Employees"
        value={totalEmployees.toString()}
        subtitle="12 new hires"
        icon="👥"
      />
      <MetricCard
        title="Active Claims"
        value={activeClaims.toString()}
        subtitle="3 pending review"
        icon="📋"
      />
      <MetricCard
        title="Total Claims Cost"
        value={totalClaimsCost}
        subtitle="This fiscal year"
        icon="💰"
      />
      <MetricCard
        title="Coverage Utilization"
        value={`${coverageUtilization}%`}
        subtitle="Average per employee"
        icon="📊"
      />
    </div>
  );
}
