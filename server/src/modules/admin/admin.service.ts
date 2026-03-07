import {
  Injectable,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserWithProfileDto } from './dto/create-user-with-profile.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a user with their role-specific profile in a single transaction.
   * Only admins can call this.
   */
  async createUserWithProfile(adminId: string, dto: CreateUserWithProfileDto) {
    // Verify the caller is an admin
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.userRole !== 'admin') {
      throw new ForbiddenException('Only admins can create users');
    }

    const { user, role, hospitalProfile, insurerProfile, corporateProfile } =
      dto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Check if CNIC already exists (if provided)
    if (user.cnic) {
      const existingCnic = await this.prisma.user.findUnique({
        where: { cnic: user.cnic },
      });
      if (existingCnic) {
        throw new ConflictException('CNIC already registered');
      }
    }

    // Validate that role-specific profile is provided for non-admin, non-patient roles
    if (role === 'hospital' && !hospitalProfile) {
      throw new BadRequestException(
        'Hospital profile is required for hospital role',
      );
    }
    if (role === 'insurer' && !insurerProfile) {
      throw new BadRequestException(
        'Insurer profile is required for insurer role',
      );
    }
    if (role === 'corporate' && !corporateProfile) {
      throw new BadRequestException(
        'Corporate profile is required for corporate role',
      );
    }

    // Check license number uniqueness for hospital
    if (hospitalProfile) {
      const existingHospital = await this.prisma.hospital.findFirst({
        where: { licenseNumber: hospitalProfile.licenseNumber },
      });
      if (existingHospital) {
        throw new ConflictException('Hospital license number already exists');
      }
    }

    // Check license number uniqueness for insurer
    if (insurerProfile) {
      const existingInsurer = await this.prisma.insurer.findFirst({
        where: { licenseNumber: insurerProfile.licenseNumber },
      });
      if (existingInsurer) {
        throw new ConflictException('Insurer license number already exists');
      }
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(user.password, 10);

    // Create user and profile in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the user
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

      // Create role-specific profile
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
        // Verify that the insurer exists
        const insurer = await tx.insurer.findUnique({
          where: { id: corporateProfile.insurerId },
        });
        if (!insurer) {
          throw new BadRequestException('Invalid insurer ID');
        }

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

  /**
   * Get all users (for admin listing)
   */
  async getAllUsers(adminId: string) {
    // Verify the caller is an admin
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.userRole !== 'admin') {
      throw new ForbiddenException('Only admins can list users');
    }

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        userRole: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  /**
   * Get all insurers (for dropdown when creating corporate)
   */
  async getInsurersForDropdown(adminId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.userRole !== 'admin') {
      throw new ForbiddenException('Only admins can access this');
    }

    return this.prisma.insurer.findMany({
      where: { isActive: true },
      select: {
        id: true,
        companyName: true,
      },
      orderBy: { companyName: 'asc' },
    });
  }
}
