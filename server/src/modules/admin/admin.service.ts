import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateUserWithProfileDto } from './dto/create-user-with-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
import { ClaimStatus } from '@prisma/client';

/** Prisma include for fetching a user with all role-specific profiles */
const USER_DETAIL_INCLUDE = {
  hospital: true,
  insurer: { include: { plans: { select: { id: true, planName: true, planCode: true, isActive: true } } } },
  corporate: { include: { insurer: { select: { id: true, companyName: true } } } },
  employee: {
    include: {
      corporate: { select: { id: true, name: true } },
      plan: { select: { id: true, planName: true, planCode: true } },
    },
  },
};

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // ---------------------------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------------------------

  async createUserWithProfile(dto: CreateUserWithProfileDto) {
    const { user, role, hospitalProfile, insurerProfile, corporateProfile } =
      dto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    if (user.cnic) {
      const existingCnic = await this.prisma.user.findUnique({
        where: { cnic: user.cnic },
      });
      if (existingCnic) {
        throw new ConflictException('CNIC already registered');
      }
    }

    if (role === 'hospital' && !hospitalProfile) {
      throw new BadRequestException('Hospital profile is required for hospital role');
    }
    if (role === 'insurer' && !insurerProfile) {
      throw new BadRequestException('Insurer profile is required for insurer role');
    }
    if (role === 'corporate' && !corporateProfile) {
      throw new BadRequestException('Corporate profile is required for corporate role');
    }

    if (hospitalProfile) {
      const existing = await this.prisma.hospital.findFirst({
        where: { licenseNumber: hospitalProfile.licenseNumber },
      });
      if (existing) throw new ConflictException('Hospital license number already exists');
    }

    if (insurerProfile) {
      const existing = await this.prisma.insurer.findFirst({
        where: { licenseNumber: insurerProfile.licenseNumber },
      });
      if (existing) throw new ConflictException('Insurer license number already exists');
    }

    const passwordHash = await bcrypt.hash(user.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: user.email,
          passwordHash,
          firstName: user.firstName,
          lastName: user.lastName || null,
          phone: user.phone,
          userRole: role,
          dob: user.dob ? new Date(user.dob) : null,
          gender: user.gender || null,
          cnic: user.cnic || null,
          address: user.address || null,
        },
      });

      let profile: object | null = null;

      if (role === 'hospital' && hospitalProfile) {
        profile = await tx.hospital.create({
          data: {
            userId: newUser.id,
            hospitalName: hospitalProfile.hospitalName,
            licenseNumber: hospitalProfile.licenseNumber,
            city: hospitalProfile.city,
            address: hospitalProfile.address,
            latitude: hospitalProfile.latitude || null,
            longitude: hospitalProfile.longitude || null,
            emergencyPhone: hospitalProfile.emergencyPhone,
            hospitalType: hospitalProfile.hospitalType || 'reimbursable',
            hasEmergencyUnit: hospitalProfile.hasEmergencyUnit ?? true,
            isActive: hospitalProfile.isActive ?? true,
          },
        });
      } else if (role === 'insurer' && insurerProfile) {
        profile = await tx.insurer.create({
          data: {
            userId: newUser.id,
            companyName: insurerProfile.companyName,
            licenseNumber: insurerProfile.licenseNumber,
            address: insurerProfile.address,
            city: insurerProfile.city,
            province: insurerProfile.province,
            maxCoverageLimit: insurerProfile.maxCoverageLimit,
            networkHospitalCount: insurerProfile.networkHospitalCount || 0,
            corporateClientCount: insurerProfile.corporateClientCount || 0,
            status: insurerProfile.status || 'Active',
            operatingSince: new Date(insurerProfile.operatingSince),
            isActive: insurerProfile.isActive ?? true,
          },
        });
      } else if (role === 'corporate' && corporateProfile) {
        const insurer = await tx.insurer.findUnique({
          where: { id: corporateProfile.insurerId },
        });
        if (!insurer) throw new BadRequestException('Invalid insurer ID');

        profile = await tx.corporate.create({
          data: {
            userId: newUser.id,
            name: corporateProfile.name,
            address: corporateProfile.address,
            city: corporateProfile.city,
            province: corporateProfile.province,
            employeeCount: corporateProfile.employeeCount,
            dependentCount: corporateProfile.dependentCount || 0,
            insurerId: corporateProfile.insurerId,
            contactName: corporateProfile.contactName,
            contactEmail: corporateProfile.contactEmail,
            contactPhone: corporateProfile.contactPhone,
            contractStartDate: new Date(corporateProfile.contractStartDate),
            contractEndDate: new Date(corporateProfile.contractEndDate),
            status: corporateProfile.status || 'Active',
          },
        });
      }

      return { user: newUser, profile };
    });

    return {
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      role: result.user.userRole,
      profile: result.profile,
      createdAt: result.user.createdAt,
    };
  }

  // ---------------------------------------------------------------------------
  // LIST
  // ---------------------------------------------------------------------------

  async getAllUsers(query: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const { page, limit, search, role, status } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (role) {
      where.userRole = role;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          userRole: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ---------------------------------------------------------------------------
  // GET BY ID
  // ---------------------------------------------------------------------------

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: USER_DETAIL_INCLUDE,
    });

    if (!user) throw new NotFoundException('User not found');

    // Strip passwordHash before returning
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const { hospitalProfile, insurerProfile, corporateProfile, ...userFields } = dto;

    // Build user update data, only including fields that are provided
    const userData: Record<string, unknown> = {};
    if (userFields.firstName !== undefined) userData.firstName = userFields.firstName;
    if (userFields.lastName !== undefined) userData.lastName = userFields.lastName;
    if (userFields.phone !== undefined) userData.phone = userFields.phone;
    if (userFields.dob !== undefined) userData.dob = userFields.dob ? new Date(userFields.dob) : null;
    if (userFields.gender !== undefined) userData.gender = userFields.gender || null;
    if (userFields.cnic !== undefined) userData.cnic = userFields.cnic || null;
    if (userFields.address !== undefined) userData.address = userFields.address || null;

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx.user.update({ where: { id }, data: userData });
      }

      if (hospitalProfile && user.userRole === 'hospital') {
        const { hospitalType, ...restHospital } = hospitalProfile;
        await tx.hospital.updateMany({
          where: { userId: id },
          data: {
            ...restHospital,
            ...(hospitalType !== undefined && { hospitalType }),
          },
        });
      }

      if (insurerProfile && user.userRole === 'insurer') {
        const { status, ...restInsurer } = insurerProfile;
        await tx.insurer.updateMany({
          where: { userId: id },
          data: {
            ...restInsurer,
            ...(status !== undefined && { status }),
          },
        });
      }

      if (corporateProfile && user.userRole === 'corporate') {
        const { status, ...restCorporate } = corporateProfile;
        await tx.corporate.updateMany({
          where: { userId: id },
          data: {
            ...restCorporate,
            ...(status !== undefined && { status }),
          },
        });
      }
    });

    return this.getUserById(id);
  }

  // ---------------------------------------------------------------------------
  // TOGGLE ACTIVE
  // ---------------------------------------------------------------------------

  async toggleUserActive(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, isActive: true },
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------

  async deleteUser(id: string, requestingUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (id === requestingUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }

  // ---------------------------------------------------------------------------
  // RESET PASSWORD
  // ---------------------------------------------------------------------------

  async resetPassword(id: string, dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { message: 'Password reset successfully' };
  }

  // ---------------------------------------------------------------------------
  // BULK OPERATIONS
  // ---------------------------------------------------------------------------

  async bulkDeactivate(userIds: string[]) {
    const result = await this.prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { isActive: false },
    });
    return { count: result.count };
  }

  async bulkDelete(userIds: string[]) {
    const result = await this.prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });
    return { count: result.count };
  }

  // ---------------------------------------------------------------------------
  // INSURERS DROPDOWN
  // ---------------------------------------------------------------------------

  async getInsurersForDropdown() {
    return this.prisma.insurer.findMany({
      where: { isActive: true },
      select: { id: true, companyName: true },
      orderBy: { companyName: 'asc' },
    });
  }

  // ---------------------------------------------------------------------------
  // BROADCAST NOTIFICATIONS
  // ---------------------------------------------------------------------------

  async broadcastNotification(dto: BroadcastNotificationDto) {
    const where: Record<string, unknown> = { isActive: true };
    if (dto.targetRoles && dto.targetRoles.length > 0) {
      where.userRole = { in: dto.targetRoles };
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });

    if (users.length === 0) {
      return { sent: 0 };
    }

    const userIds = users.map((u) => u.id);
    await this.notificationsService.createBulkNotifications(userIds, {
      notificationType: 'policy_update',
      title: dto.title,
      message: dto.message,
      severity: (dto.severity as 'info' | 'warning' | 'critical') || 'info',
      category: 'system',
    });

    return { sent: userIds.length };
  }

  // ---------------------------------------------------------------------------
  // FRAUD DETECTION
  // ---------------------------------------------------------------------------

  async getFraudAnalysis() {
    // 1. Duplicate amounts: claims with same amount from same employee in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentClaims = await this.prisma.claim.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: {
        id: true,
        claimNumber: true,
        amountClaimed: true,
        claimStatus: true,
        priority: true,
        createdAt: true,
        hospitalVisit: {
          select: {
            employeeId: true,
            hospital: { select: { hospitalName: true } },
            employee: { select: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
        corporate: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Detect duplicate amounts per employee
    const employeeAmountMap = new Map<string, typeof recentClaims>();
    for (const claim of recentClaims) {
      const key = `${claim.hospitalVisit.employeeId}-${Number(claim.amountClaimed)}`;
      if (!employeeAmountMap.has(key)) employeeAmountMap.set(key, []);
      employeeAmountMap.get(key)!.push(claim);
    }
    const duplicateAmountClaims = Array.from(employeeAmountMap.values())
      .filter((group) => group.length > 1)
      .flat();

    // 2. High-frequency claimers: employees with > 3 claims in 30 days
    const employeeClaimCount = new Map<string, number>();
    for (const claim of recentClaims) {
      const empId = claim.hospitalVisit.employeeId;
      if (empId) {
        employeeClaimCount.set(empId, (employeeClaimCount.get(empId) || 0) + 1);
      }
    }
    const highFrequencyEmployeeIds = Array.from(employeeClaimCount.entries())
      .filter(([, count]) => count > 3)
      .map(([id]) => id);

    const highFrequencyClaims = recentClaims.filter(
      (c) => c.hospitalVisit.employeeId && highFrequencyEmployeeIds.includes(c.hospitalVisit.employeeId),
    );

    // 3. High-value claims: top 10 by amount
    const highValueClaims = [...recentClaims]
      .sort((a, b) => Number(b.amountClaimed) - Number(a.amountClaimed))
      .slice(0, 10);

    // 4. Summary stats
    const totalFlagged = new Set([
      ...duplicateAmountClaims.map((c) => c.id),
      ...highFrequencyClaims.map((c) => c.id),
    ]).size;

    const formatClaim = (c: (typeof recentClaims)[0]) => ({
      id: c.id,
      claimNumber: c.claimNumber,
      amount: Number(c.amountClaimed),
      status: c.claimStatus,
      priority: c.priority,
      date: c.createdAt,
      hospital: c.hospitalVisit.hospital?.hospitalName || 'Unknown',
      patient: c.hospitalVisit.employee?.user
        ? `${c.hospitalVisit.employee.user.firstName} ${c.hospitalVisit.employee.user.lastName}`
        : 'Unknown',
      corporate: c.corporate?.name || 'Unknown',
    });

    return {
      summary: {
        totalClaimsAnalyzed: recentClaims.length,
        flaggedCount: totalFlagged,
        duplicateAmountCount: duplicateAmountClaims.length,
        highFrequencyCount: highFrequencyClaims.length,
        periodDays: 30,
      },
      duplicateAmountClaims: duplicateAmountClaims.map(formatClaim),
      highFrequencyClaims: highFrequencyClaims.map(formatClaim),
      highValueClaims: highValueClaims.map(formatClaim),
    };
  }
}
