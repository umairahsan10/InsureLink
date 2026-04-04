import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DependentStatus, Gender, Prisma, Relationship } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { CreateDependentDto } from './dto/create-dependent.dto';
import {
  DependentResponseDto,
  PaginatedDependentsResponseDto,
} from './dto/dependent-response.dto';
import { ListDependentsQueryDto } from './dto/list-dependents-query.dto';
import {
  RejectDependentDto,
  UpdateDependentStatusDto,
} from './dto/review-dependent.dto';
import { UpdateDependentDto } from './dto/update-dependent.dto';

@Injectable()
export class DependentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getDependentsByEmployeeNumber(employeeNumber: string) {
    // Find employee by employee number
    const employee = await this.prisma.employee.findUnique({
      where: { employeeNumber },
    });

    if (!employee) {
      throw new NotFoundException(
        `Employee with number ${employeeNumber} not found`,
      );
    }

    // Fetch approved/active dependents for this employee
    const dependents = await this.prisma.dependent.findMany({
      where: {
        employeeId: employee.id,
        status: {
          in: ['Active', 'Approved'],
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        relationship: true,
      },
    });

    return dependents;
  }

  async createDependent(
    dto: CreateDependentDto,
    actor: CurrentUserDto,
  ): Promise<DependentResponseDto> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
      include: { corporate: true, user: true },
    });

    if (!employee) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Employee not found',
      });
    }

    this.ensureCanRequestDependent(employee, actor);
    this.validateRelationshipAge(dto.relationship, dto.dateOfBirth);

    // Validate CNIC
    if (!dto.cnic || !dto.cnic.trim()) {
      throw new BadRequestException({
        code: 'INVALID_CNIC',
        message: 'CNIC/ID number is required',
      });
    }

    // Check if CNIC already exists for another dependent
    const existingDependent = await this.prisma.dependent.findFirst({
      where: {
        cnic: dto.cnic,
        NOT: { employeeId: dto.employeeId },
      },
    });

    if (existingDependent) {
      throw new BadRequestException({
        code: 'CNIC_ALREADY_EXISTS',
        message:
          'This CNIC/ID number is already registered for another dependent',
      });
    }

    // Check if CNIC already exists in User table
    const existingUser = await this.prisma.user.findFirst({
      where: { cnic: dto.cnic },
    });

    if (existingUser) {
      throw new BadRequestException({
        code: 'CNIC_ALREADY_EXISTS',
        message: 'This CNIC/ID number is already registered in the system',
      });
    }

    const created = await this.prisma.dependent.create({
      data: {
        employeeId: dto.employeeId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        relationship: dto.relationship,
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender,
        cnic: dto.cnic,
        ...(dto.phoneNumber ? { phoneNumber: dto.phoneNumber } : {}),
        status: DependentStatus.Pending,
        requestDate: new Date(),
      },
      include: {
        employee: { select: { corporateId: true } },
      },
    });

    return this.toDependentResponse(created);
  }

  async getDependentById(
    id: string,
    actor: CurrentUserDto,
  ): Promise<DependentResponseDto> {
    const dependent = await this.prisma.dependent.findUnique({
      where: { id },
      include: {
        employee: {
          include: { corporate: true, user: true },
        },
      },
    });

    if (!dependent) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Dependent not found',
      });
    }

    this.ensureDependentAccess(dependent, actor);
    return this.toDependentResponse(dependent);
  }

  async updateDependent(
    id: string,
    dto: UpdateDependentDto,
    actor: CurrentUserDto,
  ): Promise<DependentResponseDto> {
    const existing = await this.prisma.dependent.findUnique({
      where: { id },
      include: {
        employee: {
          include: { corporate: true, user: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Dependent not found',
      });
    }

    this.ensureCanRequestDependent(existing.employee, actor);

    if (dto.relationship && dto.dateOfBirth) {
      this.validateRelationshipAge(dto.relationship, dto.dateOfBirth);
    }

    const updated = await this.prisma.dependent.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.relationship !== undefined
          ? { relationship: dto.relationship }
          : {}),
        ...(dto.dateOfBirth !== undefined
          ? { dateOfBirth: new Date(dto.dateOfBirth) }
          : {}),
        ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
        ...(dto.cnic !== undefined ? { cnic: dto.cnic } : {}),
        ...(dto.phoneNumber !== undefined
          ? { phoneNumber: dto.phoneNumber }
          : {}),
      },
      include: {
        employee: { select: { corporateId: true } },
      },
    });

    return this.toDependentResponse(updated);
  }

  async listDependents(
    query: ListDependentsQueryDto,
    actor: CurrentUserDto,
  ): Promise<PaginatedDependentsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const role = actor.role as unknown as string;

    const where: Prisma.DependentWhereInput = {
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    if (role === 'corporate') {
      const corporate = await this.prisma.corporate.findUnique({
        where: { userId: actor.id },
        select: { id: true },
      });
      if (!corporate) {
        throw new ForbiddenException({
          code: 'AUTH_FORBIDDEN',
          message: 'Corporate profile not found',
        });
      }
      where.employee = { corporateId: corporate.id };
    }

    if (role === 'insurer') {
      where.status = { in: ['Approved', 'Active'] };
    }

    if (role === 'patient') {
      const employee = await this.prisma.employee.findUnique({
        where: { userId: actor.id },
        select: { id: true },
      });
      if (!employee) {
        throw new ForbiddenException({
          code: 'AUTH_FORBIDDEN',
          message: 'Employee profile not found',
        });
      }
      where.employeeId = employee.id;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.dependent.findMany({
        where,
        skip,
        take: limit,
        include: { employee: { select: { corporateId: true } } },
        orderBy: { requestDate: 'desc' },
      }),
      this.prisma.dependent.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toDependentResponse(item)),
      total,
      page,
      limit,
    };
  }

  async approveDependent(
    id: string,
    actor: CurrentUserDto,
  ): Promise<DependentResponseDto> {
    const dependent = await this.prisma.dependent.findUnique({
      where: { id },
      include: { employee: { include: { corporate: true, user: true } } },
    });

    if (!dependent) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Dependent not found',
      });
    }

    this.ensureCorporateReviewAccess(
      dependent.employee.corporate.userId,
      actor,
    );

    if (dependent.status !== DependentStatus.Pending) {
      throw new BadRequestException({
        code: 'DEPENDENT_NOT_PENDING',
        message: 'Only pending dependents can be approved',
      });
    }

    const approved = await this.prisma.dependent.update({
      where: { id },
      data: {
        status: DependentStatus.Approved,
        reviewedDate: new Date(),
      },
      include: { employee: { select: { corporateId: true } } },
    });

    // Emit event to trigger notification
    this.eventEmitter.emit('dependent.approved', {
      dependentId: dependent.id,
      employeeId: dependent.employeeId,
      dependentName: `${dependent.firstName} ${dependent.lastName}`,
      approverId: actor.id,
      approverEmail: actor.email,
    });

    return this.toDependentResponse(approved);
  }

  async rejectDependent(
    id: string,
    dto: RejectDependentDto,
    actor: CurrentUserDto,
  ): Promise<DependentResponseDto> {
    const dependent = await this.prisma.dependent.findUnique({
      where: { id },
      include: { employee: { include: { corporate: true, user: true } } },
    });

    if (!dependent) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Dependent not found',
      });
    }

    this.ensureCorporateReviewAccess(
      dependent.employee.corporate.userId,
      actor,
    );

    if (dependent.status !== DependentStatus.Pending) {
      throw new BadRequestException({
        code: 'DEPENDENT_NOT_PENDING',
        message: 'Only pending dependents can be rejected',
      });
    }

    if (!dto.rejectionReason.trim()) {
      throw new BadRequestException({
        code: 'DEPENDENT_REJECTION_REASON_REQUIRED',
        message: 'Rejection reason is required',
      });
    }

    const rejected = await this.prisma.dependent.update({
      where: { id },
      data: {
        status: DependentStatus.Rejected,
        reviewedDate: new Date(),
        rejectionReason: dto.rejectionReason,
      },
      include: { employee: { select: { corporateId: true } } },
    });

    // Emit event to trigger notification
    this.eventEmitter.emit('dependent.rejected', {
      dependentId: dependent.id,
      employeeId: dependent.employeeId,
      dependentName: `${dependent.firstName} ${dependent.lastName}`,
      reason: dto.rejectionReason,
    });

    return this.toDependentResponse(rejected);
  }

  async updateDependentStatus(
    id: string,
    dto: UpdateDependentStatusDto,
    actor: CurrentUserDto,
  ): Promise<DependentResponseDto> {
    const dependent = await this.prisma.dependent.findUnique({
      where: { id },
      include: { employee: { include: { corporate: true } } },
    });

    if (!dependent) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Dependent not found',
      });
    }

    this.ensureCorporateReviewAccess(
      dependent.employee.corporate.userId,
      actor,
    );

    if (
      dependent.status !== DependentStatus.Approved &&
      dependent.status !== DependentStatus.Active &&
      dependent.status !== DependentStatus.Inactive
    ) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Only approved/active dependents can toggle active status',
      });
    }

    const nextStatus =
      dto.status === 'Active'
        ? DependentStatus.Active
        : DependentStatus.Inactive;
    const updated = await this.prisma.dependent.update({
      where: { id },
      data: { status: nextStatus },
      include: { employee: { select: { corporateId: true } } },
    });

    return this.toDependentResponse(updated);
  }

  private ensureCanRequestDependent(
    employee: { userId: string; corporate: { userId: string } },
    actor: CurrentUserDto,
  ): void {
    const role = actor.role as unknown as string;

    if (role === 'admin') {
      return;
    }

    if (role === 'corporate' && employee.corporate.userId === actor.id) {
      return;
    }

    if (role === 'patient' && employee.userId === actor.id) {
      return;
    }

    throw new ForbiddenException({
      code: 'AUTH_FORBIDDEN',
      message: 'You cannot request dependents for this employee',
    });
  }

  private ensureCorporateReviewAccess(
    corporateUserId: string,
    actor: CurrentUserDto,
  ): void {
    const role = actor.role as unknown as string;
    if (role === 'admin') {
      return;
    }
    if (role === 'corporate' && corporateUserId === actor.id) {
      return;
    }
    throw new ForbiddenException({
      code: 'AUTH_FORBIDDEN',
      message: 'Only owning corporate can review dependent requests',
    });
  }

  private ensureDependentAccess(
    dependent: {
      status: DependentStatus;
      employee: { userId: string; corporate: { userId: string } };
    },
    actor: CurrentUserDto,
  ): void {
    const role = actor.role as unknown as string;

    if (role === 'admin') {
      return;
    }

    if (
      role === 'corporate' &&
      dependent.employee.corporate.userId === actor.id
    ) {
      return;
    }

    if (role === 'patient' && dependent.employee.userId === actor.id) {
      return;
    }

    if (
      role === 'insurer' &&
      (dependent.status === DependentStatus.Approved ||
        dependent.status === DependentStatus.Active)
    ) {
      return;
    }

    throw new ForbiddenException({
      code: 'AUTH_FORBIDDEN',
      message: 'You are not allowed to view this dependent',
    });
  }

  private validateRelationshipAge(
    relationship: string,
    dateOfBirth: string,
  ): void {
    const dob = new Date(dateOfBirth);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthDelta = now.getMonth() - dob.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) {
      age -= 1;
    }

    if (relationship === 'Spouse' && age < 18) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Spouse must be at least 18 years old',
      });
    }

    if ((relationship === 'Son' || relationship === 'Daughter') && age >= 25) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Child must be under 25 years old',
      });
    }

    if ((relationship === 'Father' || relationship === 'Mother') && age < 45) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Parent must be at least 45 years old',
      });
    }
  }

  async checkCnicAvailability(cnic: string): Promise<{ available: boolean }> {
    // Check if CNIC exists in dependents table
    const existingDependent = await this.prisma.dependent.findFirst({
      where: { cnic },
    });

    if (existingDependent) {
      return { available: false };
    }

    // Check if CNIC exists in users table
    const existingUser = await this.prisma.user.findFirst({
      where: { cnic },
    });

    if (existingUser) {
      return { available: false };
    }

    return { available: true };
  }

  private toDependentResponse(dependent: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    relationship: Relationship;
    dateOfBirth: Date;
    gender: Gender;
    cnic: string | null;
    phoneNumber: string | null;
    status: DependentStatus;
    requestDate: Date;
    reviewedDate: Date | null;
    rejectionReason: string | null;
    createdAt: Date;
    updatedAt: Date;
    employee: { corporateId: string };
  }): DependentResponseDto {
    return {
      id: dependent.id,
      employeeId: dependent.employeeId,
      corporateId: dependent.employee.corporateId,
      firstName: dependent.firstName,
      lastName: dependent.lastName,
      relationship: dependent.relationship,
      dateOfBirth: dependent.dateOfBirth,
      gender: dependent.gender,
      ...(dependent.cnic ? { cnic: dependent.cnic } : {}),
      ...(dependent.phoneNumber ? { phoneNumber: dependent.phoneNumber } : {}),
      status: dependent.status,
      requestDate: dependent.requestDate,
      ...(dependent.reviewedDate
        ? { reviewedDate: dependent.reviewedDate }
        : {}),
      ...(dependent.rejectionReason
        ? { rejectionReason: dependent.rejectionReason }
        : {}),
      createdAt: dependent.createdAt,
      updatedAt: dependent.updatedAt,
    };
  }
}
