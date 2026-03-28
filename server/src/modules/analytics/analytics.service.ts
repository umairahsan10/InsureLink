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
    // Group claims by hospitalVisit → hospitalId
    const claims = await this.prisma.claim.findMany({
      where,
      select: {
        amountClaimed: true,
        hospitalVisit: {
          select: {
            hospitalId: true,
            hospital: { select: { hospitalName: true } },
          },
        },
      },
    });

    const hospitalMap = new Map<
      string,
      { hospitalName: string; totalAmount: number }
    >();
    for (const claim of claims) {
      const hospId = claim.hospitalVisit.hospitalId;
      const existing = hospitalMap.get(hospId) || {
        hospitalName: claim.hospitalVisit.hospital.hospitalName,
        totalAmount: 0,
      };
      existing.totalAmount += Number(claim.amountClaimed);
      hospitalMap.set(hospId, existing);
    }

    return Array.from(hospitalMap.entries())
      .map(([hospitalId, data]) => ({ hospitalId, ...data }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
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
    const claims = await this.prisma.claim.findMany({
      where,
      select: {
        amountClaimed: true,
        corporateId: true,
        corporate: { select: { name: true } },
      },
    });

    const corpMap = new Map<
      string,
      { corporateName: string; count: number; value: number }
    >();
    for (const claim of claims) {
      const existing = corpMap.get(claim.corporateId) || {
        corporateName: claim.corporate.name,
        count: 0,
        value: 0,
      };
      existing.count += 1;
      existing.value += Number(claim.amountClaimed);
      corpMap.set(claim.corporateId, existing);
    }

    return Array.from(corpMap.entries())
      .map(([corporateId, data]) => ({ corporateId, ...data }))
      .sort((a, b) => b.value - a.value);
  }

  private async getAvgProcessingTime(
    where: Record<string, any>,
  ): Promise<number> {
    // Find claims that have been resolved (Approved or Rejected)
    const resolvedClaims = await this.prisma.claim.findMany({
      where: {
        ...where,
        claimStatus: {
          in: [ClaimStatus.Approved, ClaimStatus.Rejected],
        },
      },
      select: { id: true, createdAt: true },
    });

    if (resolvedClaims.length === 0) return 0;

    const claimIds = resolvedClaims.map((c) => c.id);
    const events = await this.prisma.claimEvent.findMany({
      where: {
        claimId: { in: claimIds },
        action: { in: ['CLAIM_APPROVED', 'CLAIM_REJECTED'] },
      },
      select: { claimId: true, timestamp: true },
      orderBy: { timestamp: 'asc' },
    });

    const eventMap = new Map<string, Date>();
    for (const event of events) {
      if (!eventMap.has(event.claimId)) {
        eventMap.set(event.claimId, event.timestamp);
      }
    }

    let totalHours = 0;
    let count = 0;
    for (const claim of resolvedClaims) {
      const resolvedAt = eventMap.get(claim.id);
      if (resolvedAt) {
        const diffMs = resolvedAt.getTime() - claim.createdAt.getTime();
        totalHours += diffMs / (1000 * 60 * 60);
        count++;
      }
    }

    return count > 0 ? Math.round((totalHours / count) * 100) / 100 : 0;
  }
}
