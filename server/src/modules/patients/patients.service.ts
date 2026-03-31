import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DependentStatus, EmployeeStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { ListPatientsQueryDto } from './dto/list-patients-query.dto';
import { PatientCoverageDto } from './dto/patient-coverage.dto';
import { PaginatedPatientsDto, PatientClaimsDto, PatientSummaryDto, PatientVisitsDto } from './dto/patient-response.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(actor: CurrentUserDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId: actor.id },
      include: {
        user: true,
        corporate: true,
        plan: true,
      },
    });

    if (!employee) {
      return {
        id: actor.id,
        isPatient: false,
        role: actor.role,
      };
    }

    return {
      id: employee.id,
      isPatient: true,
      patientType: 'employee',
      name: `${employee.user.firstName}${employee.user.lastName ? ` ${employee.user.lastName}` : ''}`,
      email: employee.user.email,
      mobile: employee.user.phone,
      insurance: employee.plan.planName,
      corporateName: employee.corporate.name,
      status: employee.status === 'Active' ? 'Active' : 'Inactive',
    };
  }

  async updateMe(actor: CurrentUserDto, dto: any) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId: actor.id },
      include: {
        user: true,
        corporate: true,
        plan: true,
      },
    });

    if (!employee) {
      throw new ForbiddenException('Patient not found');
    }

    // Update user data
    const updatedUser = await this.prisma.user.update({
      where: { id: actor.id },
      data: {
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.mobile !== undefined ? { phone: dto.mobile } : {}),
      },
    });

    return {
      id: employee.id,
      isPatient: true,
      patientType: 'employee',
      name: `${employee.user.firstName}${employee.user.lastName ? ` ${employee.user.lastName}` : ''}`,
      email: updatedUser.email,
      mobile: updatedUser.phone,
      insurance: employee.plan.planName,
      corporateName: employee.corporate.name,
      status: employee.status === 'Active' ? 'Active' : 'Inactive',
    };
  }

  async listPatients(query: ListPatientsQueryDto, actor: CurrentUserDto): Promise<PaginatedPatientsDto> {
    this.ensurePatientsReadAccess(actor);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const employeeWhere: Prisma.EmployeeWhereInput = {
      ...(query.search
        ? {
            OR: [
              { user: { firstName: { contains: query.search, mode: 'insensitive' as const } } },
              { user: { lastName: { contains: query.search, mode: 'insensitive' as const } } },
              { user: { email: { contains: query.search, mode: 'insensitive' as const } } },
              { employeeNumber: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(query.insurance
        ? { plan: { planName: { equals: query.insurance, mode: 'insensitive' as const } } }
        : {}),
      ...(query.status
        ? {
            status:
              query.status === 'Active'
                ? EmployeeStatus.Active
                : { not: EmployeeStatus.Active },
          }
        : {}),
    };

    const dependentWhere: Prisma.DependentWhereInput = {
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' as const } },
              { lastName: { contains: query.search, mode: 'insensitive' as const } },
              { cnic: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(query.status
        ? {
            status:
              query.status === 'Active'
                ? { in: [DependentStatus.Approved, DependentStatus.Active] }
                : { in: [DependentStatus.Pending, DependentStatus.Rejected, DependentStatus.Inactive] },
          }
        : {}),
      ...(query.insurance
        ? { employee: { plan: { planName: { equals: query.insurance, mode: 'insensitive' as const } } } }
        : {}),
    };

    const [employees, dependents] = await Promise.all([
      this.prisma.employee.findMany({
        where: employeeWhere,
        include: {
          user: true,
          corporate: true,
          plan: true,
          hospitalVisits: { orderBy: { visitDate: 'desc' }, take: 1 },
          _count: { select: { dependents: true } },
        },
      }),
      this.prisma.dependent.findMany({
        where: dependentWhere,
        include: {
          employee: {
            include: {
              user: true,
              corporate: true,
              plan: true,
            },
          },
          hospitalVisits: { orderBy: { visitDate: 'desc' }, take: 1 },
        },
      }),
    ]);

    const employeeItems: PatientSummaryDto[] = employees.map((item) => ({
      id: item.id,
      patientType: 'employee',
      name: `${item.user.firstName}${item.user.lastName ? ` ${item.user.lastName}` : ''}`,
      age: this.getAge(item.user.dob ?? new Date()),
      gender: item.user.gender ?? 'Other',
      email: item.user.email,
      mobile: item.user.phone,
      ...(item.user.cnic ? { cnic: item.user.cnic } : {}),
      corporateName: item.corporate.name,
      insurance: item.plan.planName,
      status: item.status === 'Active' ? 'Active' : 'Inactive',
      ...(item.hospitalVisits[0] ? { lastVisit: item.hospitalVisits[0].visitDate.toISOString() } : {}),
      hasActiveClaims: false,
    }));

    const dependentItems: PatientSummaryDto[] = dependents.map((item) => ({
      id: item.id,
      patientType: 'dependent',
      name: `${item.firstName} ${item.lastName}`,
      age: this.getAge(item.dateOfBirth),
      gender: item.gender,
      ...(item.cnic ? { cnic: item.cnic } : {}),
      ...(item.phoneNumber ? { mobile: item.phoneNumber } : {}),
      corporateName: item.employee.corporate.name,
      insurance: item.employee.plan.planName,
      status:
        item.status === DependentStatus.Approved || item.status === DependentStatus.Active
          ? 'Active'
          : 'Inactive',
      ...(item.hospitalVisits[0] ? { lastVisit: item.hospitalVisits[0].visitDate.toISOString() } : {}),
      hasActiveClaims: false,
    }));

    const allItems = [...employeeItems, ...dependentItems];
    const total = allItems.length;
    const start = (page - 1) * limit;

    return {
      items: allItems.slice(start, start + limit),
      total,
      page,
      limit,
    };
  }

  async getPatientById(id: string, actor: CurrentUserDto) {
    this.ensurePatientsReadAccess(actor);

    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
        corporate: true,
        plan: true,
      },
    });

    if (employee) {
      return {
        id: employee.id,
        patientType: 'employee',
        name: `${employee.user.firstName}${employee.user.lastName ? ` ${employee.user.lastName}` : ''}`,
        email: employee.user.email,
        mobile: employee.user.phone,
        ...(employee.user.cnic ? { cnic: employee.user.cnic } : {}),
        insurance: employee.plan.planName,
        corporateName: employee.corporate.name,
        status: employee.status,
      };
    }

    const dependent = await this.prisma.dependent.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: true,
            corporate: true,
            plan: true,
          },
        },
      },
    });

    if (!dependent) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Patient not found' });
    }

    return {
      id: dependent.id,
      patientType: 'dependent',
      name: `${dependent.firstName} ${dependent.lastName}`,
      ...(dependent.cnic ? { cnic: dependent.cnic } : {}),
      ...(dependent.phoneNumber ? { mobile: dependent.phoneNumber } : {}),
      insurance: dependent.employee.plan.planName,
      corporateName: dependent.employee.corporate.name,
      status: dependent.status,
      relationship: dependent.relationship,
      parentEmployee: {
        id: dependent.employee.id,
        name: `${dependent.employee.user.firstName}${dependent.employee.user.lastName ? ` ${dependent.employee.user.lastName}` : ''}`,
      },
    };
  }

  async getPatientCoverage(id: string, actor: CurrentUserDto): Promise<PatientCoverageDto> {
    this.ensurePatientsReadAccess(actor);

    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (employee) {
      const now = new Date();
      const isActive = employee.status === 'Active' && now >= employee.coverageStartDate && now <= employee.coverageEndDate;
      const available = employee.coverageAmount.sub(employee.usedAmount);
      const hasAvailable = available.greaterThan(0);
      const isEligible = isActive && hasAvailable;

      return {
        patientId: employee.id,
        patientType: 'employee',
        isEligible,
        reason: isEligible ? 'Coverage active' : hasAvailable ? 'Coverage inactive or expired' : 'Coverage limit exhausted',
        totalCoverageAmount: employee.coverageAmount.toFixed(2),
        usedAmount: employee.usedAmount.toFixed(2),
        availableAmount: available.toFixed(2),
        coverageStartDate: employee.coverageStartDate,
        coverageEndDate: employee.coverageEndDate,
      };
    }

    const dependent = await this.prisma.dependent.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!dependent) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Patient not found' });
    }

    const now = new Date();
    const isDependentActive = ['Approved', 'Active'].includes(dependent.status);
    const isEmployeeCoverageActive = dependent.employee.status === 'Active' && now >= dependent.employee.coverageStartDate && now <= dependent.employee.coverageEndDate;
    const available = dependent.employee.coverageAmount.sub(dependent.employee.usedAmount);
    const isEligible = isDependentActive && isEmployeeCoverageActive && available.greaterThan(0);

    return {
      patientId: dependent.id,
      patientType: 'dependent',
      isEligible,
      reason: isEligible ? 'Coverage active' : available.greaterThan(0) ? 'Dependent inactive or coverage expired' : 'Coverage limit exhausted',
      totalCoverageAmount: dependent.employee.coverageAmount.toFixed(2),
      usedAmount: dependent.employee.usedAmount.toFixed(2),
      availableAmount: available.toFixed(2),
      coverageStartDate: dependent.employee.coverageStartDate,
      coverageEndDate: dependent.employee.coverageEndDate,
    };
  }

  async getPatientClaims(id: string, actor: CurrentUserDto): Promise<PatientClaimsDto> {
    this.ensurePatientsReadAccess(actor);

    const claims = await this.prisma.claim.findMany({
      where: {
        hospitalVisit: {
          OR: [{ employeeId: id }, { dependentId: id }],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: claims.map((claim) => ({
        id: claim.id,
        claimNumber: claim.claimNumber,
        status: claim.claimStatus,
        amountClaimed: claim.amountClaimed.toFixed(2),
        approvedAmount: claim.approvedAmount.toFixed(2),
        createdAt: claim.createdAt,
      })),
      total: claims.length,
    };
  }

  async getPatientVisits(id: string, actor: CurrentUserDto): Promise<PatientVisitsDto> {
    this.ensurePatientsReadAccess(actor);

    const visits = await this.prisma.hospitalVisit.findMany({
      where: {
        OR: [{ employeeId: id }, { dependentId: id }],
      },
      include: {
        hospital: {
          select: {
            id: true,
            hospitalName: true,
            city: true,
          },
        },
      },
      orderBy: { visitDate: 'desc' },
    });

    return {
      items: visits.map((visit) => ({
        id: visit.id,
        visitDate: visit.visitDate,
        dischargeDate: visit.dischargeDate,
        hospital: visit.hospital,
      })),
      total: visits.length,
    };
  }

  private ensurePatientsReadAccess(actor: CurrentUserDto): void {
    const role = actor.role as unknown as string;
    if (!['admin', 'corporate', 'hospital', 'insurer', 'patient'].includes(role)) {
      throw new ForbiddenException({ code: 'AUTH_FORBIDDEN', message: 'Insufficient role for patient access' });
    }
  }

  private getAge(dob: Date): number {
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
      age -= 1;
    }
    return age;
  }
}

