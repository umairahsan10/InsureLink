import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ClaimStatus, UserRole } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(user: { id: string; role: string; email: string }) {
    if (user.role === UserRole.admin) {
      return this.getAdminStats();
    } else if (user.role === UserRole.insurer) {
        // Assuming insurer user is linked to an Insurer entity somehow, or we use user.orgId if available
        // For now, returning global stats or specific logic
        return this.getAdminStats(); // Placeholder
    } else if (user.role === UserRole.hospital) {
        return this.getHospitalStats(user.id);
    }
    return {};
  }

  private async getAdminStats() {
    const [
      totalClaims,
      pendingClaims,
      approvedClaims,
      rejectedClaims,
      totalPayout,
      activeHospitals,
      activePolicies,
    ] = await Promise.all([
      this.prisma.claim.count(),
      this.prisma.claim.count({ where: { claimStatus: ClaimStatus.Pending } }),
      this.prisma.claim.count({ where: { claimStatus: ClaimStatus.Approved } }),
      this.prisma.claim.count({ where: { claimStatus: ClaimStatus.Rejected } }),
      this.prisma.claim.aggregate({
        _sum: { approvedAmount: true },
        where: { claimStatus: { in: [ClaimStatus.Approved, ClaimStatus.Paid] } },
      }),
      this.prisma.hospital.count({ where: { isActive: true } }),
      this.prisma.plan.count({ where: { isActive: true } }),
    ]);

    return {
      totalClaims,
      pendingClaims,
      approvedClaims,
      rejectedClaims,
      totalPayout: totalPayout._sum.approvedAmount || 0,
      activeHospitals,
      activePolicies,
    };
  }

  private async getHospitalStats(userId: string) {
      // Find hospital by userId
      const hospital = await this.prisma.hospital.findUnique({ where: { userId } });
      if (!hospital) return {};

      const [
          totalClaims,
          pendingClaims,
          approvedClaims,
          rejectedClaims,
          totalPayout
      ] = await Promise.all([
          this.prisma.claim.count({ where: { hospitalVisit: { hospitalId: hospital.id } } }),
          this.prisma.claim.count({ where: { hospitalVisit: { hospitalId: hospital.id }, claimStatus: ClaimStatus.Pending } }),
          this.prisma.claim.count({ where: { hospitalVisit: { hospitalId: hospital.id }, claimStatus: ClaimStatus.Approved } }),
          this.prisma.claim.count({ where: { hospitalVisit: { hospitalId: hospital.id }, claimStatus: ClaimStatus.Rejected } }),
          this.prisma.claim.aggregate({
              _sum: { approvedAmount: true },
              where: { hospitalVisit: { hospitalId: hospital.id }, claimStatus: { in: [ClaimStatus.Approved, ClaimStatus.Paid] } }
          })
      ]);

      return {
          hospitalName: hospital.hospitalName,
          totalClaims,
          pendingClaims,
          approvedClaims,
          rejectedClaims,
          totalPayout: totalPayout._sum.approvedAmount || 0,
      };
  }

  async getClaimsAnalytics(query: any) {
    // Group by status
    const statusBreakdown = await this.prisma.claim.groupBy({
      by: ['claimStatus'],
      _count: { id: true },
    });

    // Transform to friendly format
    const breakdown = {};
    statusBreakdown.forEach(item => {
        breakdown[item.claimStatus] = item._count.id;
    });

    return {
        statusBreakdown: breakdown,
        // Add more analytics like daily trend if needed
    };
  }

  async getFinancialAnalytics() {
      const result = await this.prisma.claim.aggregate({
          _sum: { amountClaimed: true, approvedAmount: true },
          _avg: { approvedAmount: true },
          where: { claimStatus: { in: [ClaimStatus.Approved, ClaimStatus.Paid] } }
      });

      return {
          totalClaimedAmount: result._sum.amountClaimed || 0,
          totalApprovedAmount: result._sum.approvedAmount || 0,
          averageClaimCost: result._avg.approvedAmount || 0
      };
  }
}
