import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { HospitalsRepository } from './repositories/hospitals.repository';
import { HospitalEmergencyContactsRepository } from './repositories/hospital-emergency-contacts.repository';
import { HospitalVisitsRepository } from './repositories/hospital-visits.repository';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import {
  CreateHospitalEmergencyContactDto,
  UpdateHospitalEmergencyContactDto,
} from './dto/hospital-emergency-contact.dto';
import { CreateHospitalVisitDto } from './dto/hospital-visit.dto';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class HospitalsService {
  constructor(
    private readonly hospitalsRepository: HospitalsRepository,
    private readonly emergencyContactsRepository: HospitalEmergencyContactsRepository,
    private readonly hospitalVisitsRepository: HospitalVisitsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, data: CreateHospitalDto) {
    // Check if this user already has a hospital profile
    const existingUserHospital =
      await this.hospitalsRepository.findByUserId(userId);
    if (existingUserHospital) {
      throw new BadRequestException(
        'A hospital profile is already registered for this account',
      );
    }

    // Check if hospital with same license number already exists
    const existingHospital = await this.hospitalsRepository.findByLicenseNumber(
      data.licenseNumber,
    );
    if (existingHospital) {
      throw new BadRequestException(
        'Hospital with this license number already exists',
      );
    }

    return this.hospitalsRepository.create({ ...data, userId });
  }

  async findById(id: string) {
    const hospital = await this.hospitalsRepository.findById(id);
    if (!hospital) {
      throw new NotFoundException(`Hospital with id ${id} not found`);
    }
    return hospital;
  }

  async findAllPublic() {
    return await this.hospitalsRepository.findAllPublic();
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    city?: string,
    isActive?: boolean,
    sortBy: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ) {
    return this.hospitalsRepository.findAll(
      page,
      limit,
      city,
      isActive,
      sortBy,
      order,
    );
  }

  async update(id: string, data: UpdateHospitalDto) {
    const hospital = await this.hospitalsRepository.findById(id);
    if (!hospital) {
      throw new NotFoundException(`Hospital with id ${id} not found`);
    }

    // If updating license number, check uniqueness
    if (data.licenseNumber && data.licenseNumber !== hospital.licenseNumber) {
      const existingHospital =
        await this.hospitalsRepository.findByLicenseNumber(data.licenseNumber);
      if (existingHospital) {
        throw new BadRequestException(
          'Hospital with this license number already exists',
        );
      }
    }

    return this.hospitalsRepository.update(id, data);
  }

  async delete(id: string) {
    const hospital = await this.hospitalsRepository.findById(id);
    if (!hospital) {
      throw new NotFoundException(`Hospital with id ${id} not found`);
    }
    return this.hospitalsRepository.delete(id);
  }

  async findByCity(city: string, isActive?: boolean) {
    return this.hospitalsRepository.findByCity(city, isActive);
  }

  async findNear(latitude: number, longitude: number, radiusKm: number = 50) {
    if (!latitude || !longitude) {
      throw new BadRequestException('Latitude and longitude are required');
    }
    return this.hospitalsRepository.findNear(latitude, longitude, radiusKm);
  }

  async findAllOrderedByDistance(latitude: number, longitude: number) {
    if (!latitude || !longitude) {
      throw new BadRequestException('Latitude and longitude are required');
    }
    return await this.hospitalsRepository.findAllOrderedByDistance(
      latitude,
      longitude,
    );
  }

  // Emergency Contacts
  async addEmergencyContact(
    hospitalId: string,
    data: CreateHospitalEmergencyContactDto,
  ) {
    const hospital = await this.hospitalsRepository.findById(hospitalId);
    if (!hospital) {
      throw new NotFoundException(`Hospital with id ${hospitalId} not found`);
    }
    return this.emergencyContactsRepository.create(hospitalId, data);
  }

  async addEmergencyContactForUser(
    userId: string,
    data: CreateHospitalEmergencyContactDto,
  ) {
    const hospital = await this.hospitalsRepository.findByUserId(userId);
    if (!hospital) {
      throw new NotFoundException('Hospital not found for this user');
    }
    return this.emergencyContactsRepository.create(hospital.id, data);
  }

  async getEmergencyContacts(hospitalId: string) {
    const hospital = await this.hospitalsRepository.findById(hospitalId);
    if (!hospital) {
      throw new NotFoundException(`Hospital with id ${hospitalId} not found`);
    }
    return this.emergencyContactsRepository.findByHospitalId(hospitalId);
  }

  async getEmergencyContactsForUser(userId: string) {
    const hospital = await this.hospitalsRepository.findByUserId(userId);
    if (!hospital) {
      throw new NotFoundException('Hospital not found for this user');
    }
    return this.emergencyContactsRepository.findByHospitalId(hospital.id);
  }

  async getEmergencyContactById(contactId: string) {
    const contact = await this.emergencyContactsRepository.findById(contactId);
    if (!contact) {
      throw new NotFoundException(
        `Emergency contact with id ${contactId} not found`,
      );
    }
    return contact;
  }

  async updateEmergencyContact(
    contactId: string,
    data: UpdateHospitalEmergencyContactDto,
  ) {
    const contact = await this.emergencyContactsRepository.findById(contactId);
    if (!contact) {
      throw new NotFoundException(
        `Emergency contact with id ${contactId} not found`,
      );
    }
    return this.emergencyContactsRepository.update(contactId, data);
  }

  async deleteEmergencyContact(contactId: string) {
    const contact = await this.emergencyContactsRepository.findById(contactId);
    if (!contact) {
      throw new NotFoundException(
        `Emergency contact with id ${contactId} not found`,
      );
    }
    return this.emergencyContactsRepository.delete(contactId);
  }

  // Hospital Visits
  async createHospitalVisit(data: CreateHospitalVisitDto) {
    const hospital = await this.hospitalsRepository.findById(data.hospitalId);
    if (!hospital) {
      throw new NotFoundException(
        `Hospital with id ${data.hospitalId} not found`,
      );
    }

    // Validate employee exists by employee number
    const employee = await this.prisma.employee.findUnique({
      where: { employeeNumber: data.employeeNumber },
    });
    if (!employee) {
      throw new NotFoundException(
        `Employee with number ${data.employeeNumber} not found`,
      );
    }

    // If dependentId is provided, validate it's a real database dependent
    let validatedDependentId: string | undefined = undefined;

    if (data.dependentId) {
      // Check if dependentId is a valid UUID
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isValidUUID = uuidRegex.test(data.dependentId);

      if (!isValidUUID) {
        throw new BadRequestException(
          `Invalid dependent ID format. Dependent ID must be a valid UUID.`,
        );
      }

      // Query database for dependent
      const dependent = await this.prisma.dependent.findUnique({
        where: { id: data.dependentId },
        include: { employee: true },
      });

      if (!dependent) {
        throw new NotFoundException(
          `Dependent with ID ${data.dependentId} not found`,
        );
      }

      // Validate dependent belongs to the employee
      if (dependent.employeeId !== employee.id) {
        throw new BadRequestException(
          `Dependent does not belong to employee ${data.employeeNumber}`,
        );
      }

      // Validate dependent status is Active or Approved
      if (dependent.status !== 'Active' && dependent.status !== 'Approved') {
        throw new BadRequestException(
          `Dependent must have 'Active' or 'Approved' status to create a visit. Current status: ${dependent.status}`,
        );
      }

      validatedDependentId = dependent.id;
    }

    return this.hospitalVisitsRepository.create({
      ...data,
      employeeId: employee.id,
      dependentId: validatedDependentId,
    });
  }

  async getHospitalVisits(hospitalId: string) {
    const hospital = await this.hospitalsRepository.findById(hospitalId);
    if (!hospital) {
      throw new NotFoundException(`Hospital with id ${hospitalId} not found`);
    }
    return this.hospitalVisitsRepository.findByHospitalId(hospitalId);
  }

  async getVisitById(visitId: string) {
    const visit = await this.hospitalVisitsRepository.findById(visitId);
    if (!visit) {
      throw new NotFoundException(
        `Hospital visit with id ${visitId} not found`,
      );
    }
    return visit;
  }

  /**
   * Get unclaimed visits for an employee at the hospital's own hospital
   * Used by hospitals to select a visit when creating a claim
   * Optimized: Minimal includes, parallel queries
   */
  async getUnclaimedVisitsByEmployeeNumber(
    employeeNumber: string,
    userId: string,
  ) {
    // Get the hospital for this user
    const hospital = await this.hospitalsRepository.findByUserId(userId);
    if (!hospital) {
      throw new NotFoundException('Hospital not found for this user');
    }

    // Find the employee by employee number (optimized: only essential fields)
    const employee = await this.prisma.employee.findUnique({
      where: { employeeNumber },
      select: {
        id: true,
        employeeNumber: true,
        designation: true,
        department: true,
        corporateId: true,
        planId: true,
        coverageAmount: true,
        usedAmount: true,
        corporate: {
          select: {
            name: true,
          },
        },
        plan: {
          select: {
            planName: true,
            planCode: true,
            insurerId: true,
            sumInsured: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            cnic: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(
        `Employee with number ${employeeNumber} not found`,
      );
    }

    // Get unclaimed visits for this employee at this hospital
    const visits =
      await this.hospitalVisitsRepository.findUnclaimedByEmployeeAndHospitalLightweight(
        employee.id,
        hospital.id,
      );

    // Calculate remaining coverage from employee's coverage tracking
    const coverageAmount = Number(employee.coverageAmount);
    const usedAmount = Number(employee.usedAmount);
    const remainingCoverage = Math.max(0, coverageAmount - usedAmount);

    return {
      employee: {
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        firstName: employee.user.firstName,
        lastName: employee.user.lastName,
        cnic: employee.user.cnic,
        designation: employee.designation,
        department: employee.department,
        corporateId: employee.corporateId,
        corporateName: employee.corporate.name,
        planId: employee.planId,
        planName: employee.plan.planName,
        planCode: employee.plan.planCode,
        insurerId: employee.plan.insurerId,
        coverageAmount: coverageAmount,
        usedAmount: usedAmount,
        remainingCoverage: remainingCoverage,
      },
      visits: visits.map((visit) => {
        // Type assertion for included relations
        const visitWithRelations = visit as typeof visit & {
          dependent?: {
            id: string;
            firstName: string;
            lastName: string;
            relationship: string;
          } | null;
        };
        return {
          id: visitWithRelations.id,
          visitDate: visitWithRelations.visitDate,
          dischargeDate: visitWithRelations.dischargeDate,
          status: visitWithRelations.status,
          dependent: visitWithRelations.dependent
            ? {
                id: visitWithRelations.dependent.id,
                firstName: visitWithRelations.dependent.firstName,
                lastName: visitWithRelations.dependent.lastName,
                relationship: visitWithRelations.dependent.relationship,
              }
            : null,
        };
      }),
    };
  }
}
