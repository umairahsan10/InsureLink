import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { ClaimStatus, EmployeeStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /analytics/dashboard — role-aware, returns Analytics-shaped response
   */
  async getDashboard(user: CurrentUserDto) {
    const where = this.buildClaimWhere(user);

    const [
      claimsByStatusRaw,
      totalAgg,
      approvedAgg,
      monthlyTrendsRaw,
      topHospitalsRaw,
      claimsPerCorporateRaw,
    ] = await Promise.all([
      this.prisma.claim.groupBy({
        by: ['claimStatus'],
        _count: { id: true },
        where,
      }),
      this.prisma.claim.aggregate({
        _count: { id: true },
        _sum: { amountClaimed: true },
        where,
      }),
      this.prisma.claim.aggregate({
        _sum: { approvedAmount: true },
        where: {
          ...where,
          claimStatus: { in: [ClaimStatus.Approved, ClaimStatus.Paid] },
        },
      }),
      this.getMonthlyTrends(where),
      this.getTopHospitals(where),
      this.getClaimsPerCorporate(where),
    ]);

    const statusMap: Record<string, number> = {};
    for (const row of claimsByStatusRaw) {
      statusMap[row.claimStatus] = row._count.id;
    }

    const totalClaims = totalAgg._count.id;
    const rejectedCount = statusMap['Rejected'] || 0;

    const avgProcessingTimeHours = await this.getAvgProcessingTime(where);

    return {
      claimsByStatus: {
        Pending: statusMap['Pending'] || 0,
        Approved: statusMap['Approved'] || 0,
        Rejected: rejectedCount,
      },
      totalClaims,
      totalClaimValue: Number(totalAgg._sum.amountClaimed || 0),
      approvedValueTotal: Number(approvedAgg._sum.approvedAmount || 0),
      monthlyTrends: monthlyTrendsRaw,
      avgProcessingTimeHours,
      topHospitalsByAmount: topHospitalsRaw,
      claimsPerCorporate: claimsPerCorporateRaw,
      rejectionRate: totalClaims > 0 ? rejectedCount / totalClaims : 0,
      fraudFlaggedCount: 0, // stub — fraud detection deferred
    };
  }

  /**
   * GET /analytics/claims — detailed claims analytics with date range
   */
  async getClaimsAnalytics(
    user: CurrentUserDto,
    startDate?: string,
    endDate?: string,
  ) {
    const baseWhere = this.buildClaimWhere(user);
    const where = {
      ...baseWhere,
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    const [
      claimsByStatusRaw,
      approvedAgg,
      monthlyTrendsRaw,
      topHospitalsRaw,
      claimsPerCorporateRaw,
    ] = await Promise.all([
      this.prisma.claim.groupBy({
        by: ['claimStatus'],
        _count: { id: true },
        where,
      }),
      this.prisma.claim.aggregate({
        _avg: { approvedAmount: true },
        where: {
          ...where,
          claimStatus: { in: [ClaimStatus.Approved, ClaimStatus.Paid] },
        },
      }),
      this.getMonthlyTrends(where),
      this.getTopHospitals(where),
      this.getClaimsPerCorporate(where),
    ]);

    const statusMap: Record<string, number> = {};
    for (const row of claimsByStatusRaw) {
      statusMap[row.claimStatus] = row._count.id;
    }

    const avgProcessingTimeHours = await this.getAvgProcessingTime(where);

    return {
      claimsByStatus: {
        Pending: statusMap['Pending'] || 0,
        Approved: statusMap['Approved'] || 0,
        Rejected: statusMap['Rejected'] || 0,
        OnHold: statusMap['OnHold'] || 0,
        Paid: statusMap['Paid'] || 0,
      },
      monthlyTrends: monthlyTrendsRaw,
      avgApprovalAmount: Number(approvedAgg._avg.approvedAmount || 0),
      avgProcessingTimeHours,
      topHospitalsByAmount: topHospitalsRaw,
      claimsPerCorporate: claimsPerCorporateRaw,
    };
  }

  /**
   * GET /analytics/coverage — coverage utilization stats
   */
  async getCoverageAnalytics(user: CurrentUserDto) {
    const employeeWhere = this.buildEmployeeWhere(user);

    const [employeeAgg, activeEmployeeCount, planDistRaw, deptDistRaw] =
      await Promise.all([
        this.prisma.employee.aggregate({
          _count: { id: true },
          _sum: { coverageAmount: true, usedAmount: true },
          where: employeeWhere,
        }),
        this.prisma.employee.count({
          where: { ...employeeWhere, status: EmployeeStatus.Active },
        }),
        this.prisma.employee.groupBy({
          by: ['planId'],
          _count: { id: true },
          _sum: { coverageAmount: true },
          where: employeeWhere,
        }),
        this.prisma.employee.groupBy({
          by: ['department'],
          _count: { id: true },
          _sum: { coverageAmount: true, usedAmount: true },
          where: employeeWhere,
        }),
      ]);

    // Fetch plan names for plan distribution
    const planIds = planDistRaw.map((p) => p.planId);
    const plans =
      planIds.length > 0
        ? await this.prisma.plan.findMany({
            where: { id: { in: planIds } },
            select: { id: true, planName: true },
          })
        : [];
    const planNameMap = new Map(plans.map((p) => [p.id, p.planName]));

    const totalCoverage = Number(employeeAgg._sum.coverageAmount || 0);
    const totalUsed = Number(employeeAgg._sum.usedAmount || 0);

    return {
      totalEmployees: employeeAgg._count.id,
      activeEmployees: activeEmployeeCount,
      totalCoverageAmount: totalCoverage,
      totalUsedAmount: totalUsed,
      utilizationRate: totalCoverage > 0 ? totalUsed / totalCoverage : 0,
      planDistribution: planDistRaw.map((p) => ({
        planId: p.planId,
        planName: planNameMap.get(p.planId) || 'Unknown',
        employeeCount: p._count.id,
        totalCoverage: Number(p._sum.coverageAmount || 0),
      })),
      coverageByDepartment: deptDistRaw.map((d) => ({
        department: d.department,
        employeeCount: d._count.id,
        totalCoverage: Number(d._sum.coverageAmount || 0),
        usedAmount: Number(d._sum.usedAmount || 0),
      })),
    };
  }

  // ─── Private Helpers ─────────────────────────────────────────

  private buildClaimWhere(user: CurrentUserDto): Record<string, any> {
    switch (user.role) {
      case 'insurer':
        return { insurerId: user.organizationId };
      case 'corporate':
        return { corporateId: user.organizationId };
      case 'hospital':
        return {
          hospitalVisit: { hospitalId: user.organizationId },
        };
      case 'admin':
        return {};
      default:
        throw new ForbiddenException(
          'Analytics not available for this role',
        );
    }
  }

  private buildEmployeeWhere(user: CurrentUserDto): Record<string, any> {
    switch (user.role) {
      case 'insurer':
        return { corporate: { insurerId: user.organizationId } };
      case 'corporate':
        return { corporateId: user.organizationId };
      case 'admin':
        return {};
      default:
        throw new ForbiddenException(
          'Coverage analytics not available for this role',
        );
    }
  }

  private async getMonthlyTrends(
    where: Record<string, any>,
  ): Promise<Array<{ month: string; count: number; value: number }>> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const claims = await this.prisma.claim.findMany({
      where: { ...where, createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true, amountClaimed: true },
    });

    const monthMap = new Map<string, { count: number; value: number }>();
    for (const claim of claims) {
      const month = claim.createdAt.toISOString().slice(0, 7); // "YYYY-MM"
      const existing = monthMap.get(month) || { count: 0, value: 0 };
      existing.count += 1;
      existing.value += Number(claim.amountClaimed);
      monthMap.set(month, existing);
    }

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private async getTopHospitals(
    where: Record<string, any>,
  ): Promise<
    Array<{ hospitalId: string; hospitalName: string; totalAmount: number }>
  > {
    // hospitalId lives on HospitalVisit, not Claim, so we can't use a simple groupBy here.
    // Previously: each claim row eagerly loaded hospitalVisit.hospital.hospitalName — an
    // implicit JOIN on every row. Now: minimal select (just hospitalId), aggregate totals
    // in memory, then one batch lookup for up to 10 hospital names.
    const claims = await this.prisma.claim.findMany({
      where,
      select: {
        amountClaimed: true,
        hospitalVisit: { select: { hospitalId: true } },
      },
    });

    const hospitalTotals = new Map<string, number>();
    for (const claim of claims) {
      const hospId = claim.hospitalVisit.hospitalId;
      hospitalTotals.set(
        hospId,
        (hospitalTotals.get(hospId) || 0) + Number(claim.amountClaimed),
      );
    }

    const top10 = Array.from(hospitalTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (top10.length === 0) return [];

    // Batch-fetch hospital names in a single query instead of per-row JOIN
    const hospitalIds = top10.map(([id]) => id);
    const hospitals = await this.prisma.hospital.findMany({
      where: { id: { in: hospitalIds } },
      select: { id: true, hospitalName: true },
    });
    const nameMap = new Map(hospitals.map((h) => [h.id, h.hospitalName]));

    return top10.map(([hospitalId, totalAmount]) => ({
      hospitalId,
      hospitalName: nameMap.get(hospitalId) || 'Unknown',
      totalAmount,
    }));
  }

  private async getClaimsPerCorporate(
    where: Record<string, any>,
  ): Promise<
    Array<{
      corporateId: string;
      corporateName: string;
      count: number;
      value: number;
    }>
  > {
    // DB-level aggregation via groupBy instead of fetching all claim rows into memory.
    // Previously: findMany (all claims + corporate relation) → in-memory loop to sum.
    // Now: groupBy pushes COUNT/SUM to Postgres, then one batch lookup for names.
    const grouped = await this.prisma.claim.groupBy({
      by: ['corporateId'],
      _count: { id: true },
      _sum: { amountClaimed: true },
      where,
      orderBy: { _sum: { amountClaimed: 'desc' } },
    });

    if (grouped.length === 0) return [];

    // Batch-fetch corporate names in a single query instead of a per-row JOIN
    const corpIds = grouped.map((g) => g.corporateId);
    const corporates = await this.prisma.corporate.findMany({
      where: { id: { in: corpIds } },
      select: { id: true, name: true },
    });
    const corpNameMap = new Map(corporates.map((c) => [c.id, c.name]));

    return grouped.map((g) => ({
      corporateId: g.corporateId,
      corporateName: corpNameMap.get(g.corporateId) || 'Unknown',
      count: g._count.id,
      value: Number(g._sum.amountClaimed || 0),
    }));
  }

  private async getAvgProcessingTime(
    where: Record<string, any>,
  ): Promise<number> {
    // Previously: two separate queries — (1) fetch resolved claims, (2) fetch all their
    // events and build a Map to correlate. Now: one query with claimEvents included via
    // nested filter + take:1, so Postgres does the JOIN and we never issue a second round-trip.
    const resolvedClaims = await this.prisma.claim.findMany({
      where: {
        ...where,
        claimStatus: { in: [ClaimStatus.Approved, ClaimStatus.Rejected] },
      },
      select: {
        createdAt: true,
        claimEvents: {
          where: { action: { in: ['CLAIM_APPROVED', 'CLAIM_REJECTED'] } },
          select: { timestamp: true },
          orderBy: { timestamp: 'asc' },
          take: 1,
        },
      },
    });

    if (resolvedClaims.length === 0) return 0;

    let totalHours = 0;
    let count = 0;
    for (const claim of resolvedClaims) {
      const resolvedEvent = claim.claimEvents[0];
      if (resolvedEvent) {
        const diffMs =
          resolvedEvent.timestamp.getTime() - claim.createdAt.getTime();
        totalHours += diffMs / (1000 * 60 * 60);
        count++;
      }
    }

    return count > 0 ? Math.round((totalHours / count) * 100) / 100 : 0;
  }
}
