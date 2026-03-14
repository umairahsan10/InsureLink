import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Claim, ClaimStatus, Prisma } from '@prisma/client';
import { CreateClaimDto } from '../dto/create-claim.dto';
import { UpdateClaimDto } from '../dto/update-claim.dto';
import { ClaimFilterDto } from '../dto/claim-filter.dto';

// Type for minimal claim response (workflow actions)
export type MinimalClaim = Pick<
  Claim,
  | 'id'
  | 'claimNumber'
  | 'claimStatus'
  | 'amountClaimed'
  | 'approvedAmount'
  | 'treatmentCategory'
  | 'priority'
  | 'notes'
  | 'createdAt'
  | 'updatedAt'
>;

// Type for claim validation (includes foreign keys)
export type ClaimForValidation = Pick<
  Claim,
  | 'id'
  | 'claimNumber'
  | 'claimStatus'
  | 'amountClaimed'
  | 'approvedAmount'
  | 'treatmentCategory'
  | 'priority'
  | 'notes'
  | 'hospitalVisitId'
  | 'corporateId'
  | 'planId'
  | 'insurerId'
  | 'createdAt'
  | 'updatedAt'
>;

@Injectable()
export class ClaimsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a unique claim number: CLM-YYYYMMDD-XXXXX
   * Optimized to use count instead of findFirst + orderBy
   */
  private async generateClaimNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `CLM-${dateStr}-`;

    // Get the start and end of today in UTC
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Count claims created today (much faster than findFirst + orderBy)
    const count = await this.prisma.claim.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const sequence = count + 1;
    return `${prefix}${sequence.toString().padStart(5, '0')}`;
  }

  /**
   * Create a new claim with auto-generated claim number
   * corporateId, planId, insurerId are auto-populated from the visit's employee data
   */
  async create(
    data: CreateClaimDto & {
      corporateId: string;
      planId: string;
      insurerId: string;
    },
  ): Promise<Claim> {
    const claimNumber = await this.generateClaimNumber();

    return this.prisma.claim.create({
      data: {
        claimNumber,
        hospitalVisitId: data.hospitalVisitId,
        corporateId: data.corporateId,
        planId: data.planId,
        insurerId: data.insurerId,
        amountClaimed: new Prisma.Decimal(data.amountClaimed),
        approvedAmount: new Prisma.Decimal(0),
        treatmentCategory: data.treatmentCategory,
        priority: data.priority || 'Normal',
        notes: data.notes,
        claimStatus: ClaimStatus.Pending,
      },
      include: this.getClaimIncludes(),
    });
  }

  /**
   * Find claim by ID with all relations
   */
  async findById(id: string): Promise<Claim | null> {
    return this.prisma.claim.findUnique({
      where: { id },
      include: this.getClaimIncludes(true),
    });
  }

  /**
   * Find claim by ID (minimal - for validation only)
   */
  async findByIdMinimal(id: string): Promise<ClaimForValidation | null> {
    return this.prisma.claim.findUnique({
      where: { id },
      select: {
        id: true,
        claimNumber: true,
        claimStatus: true,
        amountClaimed: true,
        approvedAmount: true,
        treatmentCategory: true,
        priority: true,
        notes: true,
        hospitalVisitId: true,
        corporateId: true,
        planId: true,
        insurerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Find claim by claim number
   */
  async findByClaimNumber(claimNumber: string): Promise<Claim | null> {
    return this.prisma.claim.findUnique({
      where: { claimNumber },
      include: this.getClaimIncludes(true),
    });
  }

  /**
   * Find all claims with filters and pagination
   */
  async findAll(
    filters: ClaimFilterDto,
    roleFilter?: {
      insurerId?: string;
      corporateId?: string;
      hospitalId?: string;
    },
  ): Promise<{ claims: Claim[]; total: number }> {
    const where = this.buildWhereClause(filters, roleFilter);

    const [claims, total] = await Promise.all([
      this.prisma.claim.findMany({
        where,
        skip: filters.skip,
        take: filters.limit ?? 10,
        orderBy: { [filters.sortBy || 'createdAt']: filters.order || 'desc' },
        include: this.getClaimListIncludes(),
      }),
      this.prisma.claim.count({ where }),
    ]);

    return { claims, total };
  }

  /**
   * Update claim
   */
  async update(id: string, data: UpdateClaimDto): Promise<Claim> {
    const updateData: Prisma.ClaimUpdateInput = {};

    if (data.amountClaimed !== undefined) {
      updateData.amountClaimed = new Prisma.Decimal(data.amountClaimed);
    }
    if (data.approvedAmount !== undefined) {
      updateData.approvedAmount = new Prisma.Decimal(data.approvedAmount);
    }
    if (data.treatmentCategory !== undefined) {
      updateData.treatmentCategory = data.treatmentCategory;
    }
    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    return this.prisma.claim.update({
      where: { id },
      data: updateData,
      include: this.getClaimIncludes(),
    });
  }

  /**
   * Update claim status and approved amount (lightweight - no includes)
   */
  async updateStatus(
    id: string,
    status: ClaimStatus,
    approvedAmount?: number,
  ): Promise<MinimalClaim> {
    const updateData: Prisma.ClaimUpdateInput = {
      claimStatus: status,
    };

    if (approvedAmount !== undefined) {
      updateData.approvedAmount = new Prisma.Decimal(approvedAmount);
    }

    return this.prisma.claim.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        claimNumber: true,
        claimStatus: true,
        amountClaimed: true,
        approvedAmount: true,
        treatmentCategory: true,
        priority: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Delete claim (cascade deletes events and documents)
   */
  async delete(id: string): Promise<void> {
    // Prisma handles cascade delete for related records (events, documents)
    await this.prisma.claim.delete({
      where: { id },
    });
  }

  /**
   * Check if hospital visit exists
   */
  async hospitalVisitExists(hospitalVisitId: string): Promise<boolean> {
    const visit = await this.prisma.hospitalVisit.findUnique({
      where: { id: hospitalVisitId },
    });
    return !!visit;
  }

  /**
   * Check if plan belongs to insurer
   */
  async planBelongsToInsurer(
    planId: string,
    insurerId: string,
  ): Promise<boolean> {
    const plan = await this.prisma.plan.findFirst({
      where: {
        id: planId,
        insurerId: insurerId,
      },
    });
    return !!plan;
  }

  /**
   * Get plan details for coverage validation
   */
  async getPlanDetails(planId: string) {
    return this.prisma.plan.findUnique({
      where: { id: planId },
      select: {
        id: true,
        planName: true,
        sumInsured: true,
        coveredServices: true,
        serviceLimits: true,
      },
    });
  }

  /**
   * Get hospital visit with hospital details
   */
  async getHospitalVisitWithHospital(hospitalVisitId: string) {
    return this.prisma.hospitalVisit.findUnique({
      where: { id: hospitalVisitId },
      include: {
        hospital: {
          select: {
            id: true,
            hospitalName: true,
            userId: true,
          },
        },
      },
    });
  }

  /**
   * Get hospital visit with full employee data for claim auto-population
   * Returns corporateId, planId, insurerId from the employee
   */
  async getHospitalVisitForClaimCreation(hospitalVisitId: string) {
    return this.prisma.hospitalVisit.findUnique({
      where: { id: hospitalVisitId },
      include: {
        hospital: {
          select: {
            id: true,
            hospitalName: true,
            userId: true,
          },
        },
        employee: {
          select: {
            id: true,
            corporateId: true,
            planId: true,
            coverageAmount: true,
            usedAmount: true,
            plan: {
              select: {
                id: true,
                planName: true,
                insurerId: true,
                sumInsured: true,
              },
            },
          },
        },
        dependent: {
          select: {
            id: true,
            employee: {
              select: {
                id: true,
                corporateId: true,
                planId: true,
                coverageAmount: true,
                usedAmount: true,
                plan: {
                  select: {
                    id: true,
                    planName: true,
                    insurerId: true,
                    sumInsured: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update hospital visit status (used when claim is created)
   */
  async updateHospitalVisitStatus(
    visitId: string,
    status: 'Pending' | 'Claimed',
  ) {
    return this.prisma.hospitalVisit.update({
      where: { id: visitId },
      data: { status },
    });
  }

  /**
   * Get employee coverage data only (lightweight - for validation)
   * Returns only coverageAmount and usedAmount
   */
  async getEmployeeCoverageData(hospitalVisitId: string): Promise<{
    coverageAmount: number;
    usedAmount: number;
  } | null> {
    const visit = await this.prisma.hospitalVisit.findUnique({
      where: { id: hospitalVisitId },
      select: {
        employee: {
          select: {
            coverageAmount: true,
            usedAmount: true,
          },
        },
        dependent: {
          select: {
            employee: {
              select: {
                coverageAmount: true,
                usedAmount: true,
              },
            },
          },
        },
      },
    });

    if (!visit) return null;

    const employeeData = visit.employee || visit.dependent?.employee;
    if (!employeeData) return null;

    return {
      coverageAmount: Number(employeeData.coverageAmount),
      usedAmount: Number(employeeData.usedAmount),
    };
  }

  /**
   * Build where clause for claim queries
   */
  private buildWhereClause(
    filters: ClaimFilterDto,
    roleFilter?: {
      insurerId?: string;
      corporateId?: string;
      hospitalId?: string;
    },
  ): Prisma.ClaimWhereInput {
    const where: Prisma.ClaimWhereInput = {};

    // Apply role-based filters
    if (roleFilter?.insurerId) {
      where.insurerId = roleFilter.insurerId;
    }
    if (roleFilter?.corporateId) {
      where.corporateId = roleFilter.corporateId;
    }
    if (roleFilter?.hospitalId) {
      where.hospitalVisit = {
        hospitalId: roleFilter.hospitalId,
      };
    }

    // Apply query filters
    if (filters.status) {
      where.claimStatus = filters.status;
    }
    if (filters.insurerId) {
      where.insurerId = filters.insurerId;
    }
    if (filters.corporateId) {
      where.corporateId = filters.corporateId;
    }
    if (filters.hospitalId) {
      where.hospitalVisit = {
        ...((where.hospitalVisit as object) || {}),
        hospitalId: filters.hospitalId,
      };
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }
    if (filters.claimNumber) {
      where.claimNumber = {
        contains: filters.claimNumber,
        mode: 'insensitive',
      };
    }
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) {
        where.createdAt.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.createdAt.lte = new Date(filters.toDate);
      }
    }

    return where;
  }

  /**
   * Get full includes for single claim query
   */
  private getClaimIncludes(includeEvents = false) {
    return {
      hospitalVisit: {
        include: {
          hospital: {
            select: {
              id: true,
              hospitalName: true,
              city: true,
            },
          },
          employee: {
            select: {
              id: true,
              employeeNumber: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  cnic: true,
                },
              },
            },
          },
          dependent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              relationship: true,
            },
          },
        },
      },
      corporate: {
        select: {
          id: true,
          name: true,
        },
      },
      plan: {
        select: {
          id: true,
          planName: true,
          planCode: true,
          sumInsured: true,
          coveredServices: true,
        },
      },
      insurer: {
        select: {
          id: true,
          companyName: true,
        },
      },
      ...(includeEvents && {
        claimEvents: {
          orderBy: { timestamp: 'desc' as const },
          take: 20,
        },
        claimDocuments: {
          orderBy: { createdAt: 'desc' as const },
        },
      }),
    };
  }

  /**
   * Get minimal includes for list query
   */
  private getClaimListIncludes() {
    return {
      hospitalVisit: {
        select: {
          id: true,
          visitDate: true,
          hospital: {
            select: {
              id: true,
              hospitalName: true,
            },
          },
          employee: {
            select: {
              id: true,
              employeeNumber: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          dependent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              relationship: true,
            },
          },
        },
      },
      corporate: {
        select: {
          id: true,
          name: true,
        },
      },
      plan: {
        select: {
          id: true,
          planName: true,
          planCode: true,
        },
      },
      insurer: {
        select: {
          id: true,
          companyName: true,
        },
      },
    };
  }

  /**
   * Get the sum of approved/paid claims for an employee
   * Used to calculate remaining claimable amount
   */
  async getApprovedClaimsSumForEmployee(employeeId: string): Promise<number> {
    const result = await this.prisma.claim.aggregate({
      where: {
        hospitalVisit: {
          employeeId: employeeId,
        },
        claimStatus: {
          in: ['Approved', 'Paid'],
        },
      },
      _sum: {
        approvedAmount: true,
      },
    });

    return Number(result._sum.approvedAmount || 0);
  }

  /**
   * Get employee data from a claim (via hospital visit)
   * Returns employee id, coverageAmount, usedAmount for coverage tracking
   */
  async getEmployeeFromClaim(claimId: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      select: {
        hospitalVisit: {
          select: {
            employee: {
              select: {
                id: true,
                coverageAmount: true,
                usedAmount: true,
              },
            },
            dependent: {
              select: {
                employee: {
                  select: {
                    id: true,
                    coverageAmount: true,
                    usedAmount: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!claim) return null;

    // Return employee data (either direct employee or dependent's employee)
    return (
      claim.hospitalVisit.employee || claim.hospitalVisit.dependent?.employee
    );
  }

  /**
   * Update employee's usedAmount after claim approval
   */
  async updateEmployeeUsedAmount(
    employeeId: string,
    amountToAdd: number,
  ): Promise<void> {
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        usedAmount: {
          increment: amountToAdd,
        },
      },
    });
  }
}
