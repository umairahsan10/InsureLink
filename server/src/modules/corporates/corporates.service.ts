import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ClaimStatus, CorporateStatus, Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { CorporateResponseDto, CorporateStatsResponseDto, PaginatedCorporateResponseDto } from './dto/corporate-response.dto';
import { CreateCorporateDto } from './dto/create-corporate.dto';
import { ListCorporatesQueryDto } from './dto/list-corporates-query.dto';
import { UpdateCorporateStatusDto } from './dto/update-corporate-status.dto';
import { UpdateCorporateDto } from './dto/update-corporate.dto';

@Injectable()
export class CorporatesService {
  private readonly logger = new Logger(CorporatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createCorporate(dto: CreateCorporateDto, actor: CurrentUserDto): Promise<CorporateResponseDto> {
    this.ensureAdmin(actor);

    const startDate = new Date(dto.contractStartDate);
    const endDate = new Date(dto.contractEndDate);
    if (endDate <= startDate) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'contractEndDate must be after contractStartDate',
      });
    }

    const insurer = await this.prisma.insurer.findUnique({
      where: { id: dto.insurerId },
      select: { id: true },
    });

    if (!insurer) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Insurer not found' });
    }

    try {
      const passwordHash = await bcrypt.hash(dto.userPassword, 10);

      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: dto.userEmail,
            passwordHash,
            firstName: dto.userFirstName,
            ...(dto.userLastName ? { lastName: dto.userLastName } : {}),
            phone: dto.userPhone,
            ...(dto.userCnic ? { cnic: dto.userCnic } : {}),
            userRole: UserRole.corporate,
          },
        });

        const corporate = await tx.corporate.create({
          data: {
            userId: user.id,
            name: dto.name,
            address: dto.address,
            city: dto.city,
            province: dto.province,
            employeeCount: dto.employeeCount,
            insurerId: dto.insurerId,
            contactName: dto.contactName,
            contactEmail: dto.contactEmail,
            contactPhone: dto.contactPhone,
            contractStartDate: startDate,
            contractEndDate: endDate,
          },
        });

        return corporate;
      });

      this.logger.log(`createCorporate success actorId=${actor.id} corporateId=${result.id}`);
      return this.toCorporateResponse(result);
    } catch (error: unknown) {
      this.handleConflictErrors(error);
      throw error;
    }
  }

  async getCorporateById(id: string, actor: CurrentUserDto): Promise<CorporateResponseDto> {
    const corporate = await this.prisma.corporate.findUnique({ where: { id } });
    if (!corporate) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Corporate not found' });
    }

    if (!this.isAdmin(actor) && corporate.userId !== actor.id) {
      throw new ForbiddenException({ code: 'AUTH_FORBIDDEN', message: 'You cannot access this corporate' });
    }

    return this.toCorporateResponse(corporate);
  }

  async updateCorporate(id: string, dto: UpdateCorporateDto, actor: CurrentUserDto): Promise<CorporateResponseDto> {
    const corporate = await this.prisma.corporate.findUnique({ where: { id } });
    if (!corporate) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Corporate not found' });
    }

    if (!this.isAdmin(actor) && corporate.userId !== actor.id) {
      throw new ForbiddenException({ code: 'AUTH_FORBIDDEN', message: 'You cannot update this corporate' });
    }

    if (dto.insurerId) {
      const insurer = await this.prisma.insurer.findUnique({ where: { id: dto.insurerId }, select: { id: true } });
      if (!insurer) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'Insurer not found' });
      }
    }

    const nextStart = dto.contractStartDate ? new Date(dto.contractStartDate) : corporate.contractStartDate;
    const nextEnd = dto.contractEndDate ? new Date(dto.contractEndDate) : corporate.contractEndDate;
    if (nextEnd <= nextStart) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'contractEndDate must be after contractStartDate',
      });
    }

    try {
      const updated = await this.prisma.corporate.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.address !== undefined ? { address: dto.address } : {}),
          ...(dto.city !== undefined ? { city: dto.city } : {}),
          ...(dto.province !== undefined ? { province: dto.province } : {}),
          ...(dto.employeeCount !== undefined ? { employeeCount: dto.employeeCount } : {}),
          ...(dto.insurerId !== undefined ? { insurerId: dto.insurerId } : {}),
          ...(dto.contactName !== undefined ? { contactName: dto.contactName } : {}),
          ...(dto.contactEmail !== undefined ? { contactEmail: dto.contactEmail } : {}),
          ...(dto.contactPhone !== undefined ? { contactPhone: dto.contactPhone } : {}),
          ...(dto.contractStartDate !== undefined ? { contractStartDate: new Date(dto.contractStartDate) } : {}),
          ...(dto.contractEndDate !== undefined ? { contractEndDate: new Date(dto.contractEndDate) } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
      });

      return this.toCorporateResponse(updated);
    } catch (error: unknown) {
      this.handleConflictErrors(error);
      throw error;
    }
  }

  async updateCorporateStatus(id: string, dto: UpdateCorporateStatusDto, actor: CurrentUserDto): Promise<CorporateResponseDto> {
    this.ensureAdmin(actor);
    const corporate = await this.prisma.corporate.findUnique({ where: { id } });
    if (!corporate) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Corporate not found' });
    }

    const updated = await this.prisma.corporate.update({
      where: { id },
      data: { status: dto.status },
    });

    return this.toCorporateResponse(updated);
  }

  async listCorporates(query: ListCorporatesQueryDto, actor: CurrentUserDto): Promise<PaginatedCorporateResponseDto> {
    this.ensureAdmin(actor);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CorporateWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.city ? { city: { contains: query.city, mode: 'insensitive' } } : {}),
      ...(query.insurerId ? { insurerId: query.insurerId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { contactName: { contains: query.search, mode: 'insensitive' } },
              { contactEmail: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.corporate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.corporate.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toCorporateResponse(item)),
      total,
      page,
      limit,
    };
  }

  async getCorporateStats(id: string, actor: CurrentUserDto): Promise<CorporateStatsResponseDto> {
    const corporate = await this.prisma.corporate.findUnique({ where: { id } });
    if (!corporate) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Corporate not found' });
    }

    if (!this.isAdmin(actor) && corporate.userId !== actor.id) {
      throw new ForbiddenException({ code: 'AUTH_FORBIDDEN', message: 'You cannot access this corporate stats' });
    }

    const [
      activeEmployees,
      activeDependents,
      employeeSums,
      claimCounts,
    ] = await Promise.all([
      this.prisma.employee.count({
        where: { corporateId: id, status: 'Active' },
      }),
      this.prisma.dependent.count({
        where: { employee: { corporateId: id }, status: { in: ['Approved', 'Active'] } },
      }),
      this.prisma.employee.aggregate({
        where: { corporateId: id },
        _sum: {
          coverageAmount: true,
          usedAmount: true,
        },
      }),
      this.prisma.claim.groupBy({
        by: ['claimStatus'],
        where: { corporateId: id },
        _count: { _all: true },
      }),
    ]);

    const claimMap = new Map<ClaimStatus, number>();
    for (const row of claimCounts) {
      claimMap.set(row.claimStatus, row._count._all);
    }

    const totalCoverage = employeeSums._sum.coverageAmount ?? new Prisma.Decimal(0);
    const usedCoverage = employeeSums._sum.usedAmount ?? new Prisma.Decimal(0);

    return {
      activeEmployees,
      activeDependents,
      totalCoverageAmount: totalCoverage.toFixed(2),
      usedCoverageAmount: usedCoverage.toFixed(2),
      remainingCoverageAmount: totalCoverage.sub(usedCoverage).toFixed(2),
      approvedClaimsCount: claimMap.get(ClaimStatus.Approved) ?? 0,
      pendingClaimsCount: claimMap.get(ClaimStatus.Pending) ?? 0,
      rejectedClaimsCount: claimMap.get(ClaimStatus.Rejected) ?? 0,
    };
  }

  private toCorporateResponse(corporate: {
    id: string;
    userId: string;
    name: string;
    address: string;
    city: string;
    province: string;
    employeeCount: number;
    dependentCount: number;
    insurerId: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    contractStartDate: Date;
    contractEndDate: Date;
    totalAmountUsed: Prisma.Decimal;
    status: CorporateStatus;
    createdAt: Date;
    updatedAt: Date;
  }): CorporateResponseDto {
    return {
      id: corporate.id,
      userId: corporate.userId,
      name: corporate.name,
      address: corporate.address,
      city: corporate.city,
      province: corporate.province,
      employeeCount: corporate.employeeCount,
      dependentCount: corporate.dependentCount,
      insurerId: corporate.insurerId,
      contactName: corporate.contactName,
      contactEmail: corporate.contactEmail,
      contactPhone: corporate.contactPhone,
      contractStartDate: corporate.contractStartDate,
      contractEndDate: corporate.contractEndDate,
      totalAmountUsed: corporate.totalAmountUsed.toFixed(2),
      status: corporate.status,
      createdAt: corporate.createdAt,
      updatedAt: corporate.updatedAt,
    };
  }

  private ensureAdmin(actor: CurrentUserDto): void {
    const role = actor.role as unknown as string;
    if (role !== 'admin') {
      throw new ForbiddenException({
        code: 'AUTH_FORBIDDEN',
        message: 'Only admin can perform this operation',
      });
    }
  }

  private isAdmin(actor: CurrentUserDto): boolean {
    return (actor.role as unknown as string) === 'admin';
  }

  private handleConflictErrors(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : 'unique field';
      throw new ConflictException({ code: 'CONFLICT', message: `Duplicate value for ${target}` });
    }

    throw error;
  }
}
