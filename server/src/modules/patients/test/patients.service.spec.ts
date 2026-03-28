import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole, EmployeeStatus, DependentStatus, Gender, ClaimStatus } from '@prisma/client';
import { CurrentUserDto } from '../../auth/dto/current-user.dto';
import { PatientsService } from '../patients.service';

describe('PatientsService', () => {
  const prismaMock = {
    employee: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    dependent: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    claim: {
      findMany: jest.fn(),
    },
    hospitalVisit: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const actorEmployee: CurrentUserDto = {
    id: 'emp-user-1',
    email: 'employee@example.com',
    role: UserRole.patient,
  };

  const actorHospital: CurrentUserDto = {
    id: 'hospital-user-1',
    email: 'hospital@example.com',
    role: UserRole.hospital,
  };

  const actorInsurer: CurrentUserDto = {
    id: 'insurer-user-1',
    email: 'insurer@example.com',
    role: UserRole.insurer,
  };

  const sampleEmployee = {
    id: 'emp-1',
    userId: actorEmployee.id,
    corporateId: 'corp-1',
    employeeNumber: 'EMP001',
    status: EmployeeStatus.Active,
    coverageStartDate: new Date('2026-01-01'),
    coverageEndDate: new Date('2026-12-31'),
    coverageAmount: {
      toFixed: () => '500000.00',
    },
    usedAmount: {
      toFixed: () => '50000.00',
    },
    user: {
      id: actorEmployee.id,
      email: 'employee@example.com',
      firstName: 'Ali',
      lastName: 'Raza',
      phone: '03001234567',
      dob: new Date('1990-01-01'),
      gender: Gender.Male,
      cnic: '1234567890123',
    },
    corporate: {
      id: 'corp-1',
      companyName: 'TechCorp',
    },
    plan: {
      id: 'plan-1',
      planName: 'Gold Plan',
    },
  };

  const sampleDependent = {
    id: 'dep-1',
    employeeId: 'emp-1',
    firstName: 'Sara',
    lastName: 'Raza',
    relationship: 'Spouse',
    dob: new Date('1992-05-15'),
    gender: Gender.Female,
    cnic: '9876543210123',
    status: DependentStatus.Approved,
    employee: {
      id: 'emp-1',
      userId: actorEmployee.id,
      coverageStartDate: new Date('2026-01-01'),
      coverageEndDate: new Date('2026-12-31'),
      coverageAmount: {
        toFixed: () => '500000.00',
      },
      usedAmount: {
        toFixed: () => '50000.00',
      },
      user: {
        firstName: 'Ali',
        lastName: 'Raza',
      },
      corporate: {
        companyName: 'TechCorp',
      },
      plan: {
        planName: 'Gold Plan',
      },
    },
  };

  const sampleClaim = {
    id: 'claim-1',
    employeeId: 'emp-1',
    dependentId: null,
    hospitalVisitId: 'visit-1',
    claimedAmount: {
      toFixed: () => '25000.00',
    },
    approvedAmount: {
      toFixed: () => '25000.00',
    },
    status: ClaimStatus.Approved,
    createdAt: new Date(),
  };

  const sampleVisit = {
    id: 'visit-1',
    employeeId: 'emp-1',
    dependentId: null,
    hospitalId: 'hospital-1',
    admissionDate: new Date('2026-02-01'),
    dischargeDate: new Date('2026-02-05'),
    diagnosis: 'Flu',
    hospital: {
      id: 'hospital-1',
      hospitalName: 'City Hospital',
      city: 'Karachi',
    },
  };

  let service: PatientsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PatientsService(prismaMock as never);
  });

  describe('getMe', () => {
    it('returns employee profile for patient', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(sampleEmployee);

      const result = await service.getMe(actorEmployee);

      expect(result.id).toBe(sampleEmployee.id);
      expect(result.patientType).toBe('employee');
    });

    it('returns message for non-patient user', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(null);

      const result = await service.getMe(actorEmployee);

      expect(result.message).toBe('User does not have an employee record.');
    });
  });

  describe('listPatients', () => {
    it('lists patients for hospital', async () => {
      prismaMock.$transaction.mockResolvedValue([
        [sampleEmployee],
        [sampleDependent],
        1,
        1,
      ]);

      const result = await service.listPatients({ page: 1, limit: 20 }, actorHospital);

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.total).toBe(2);
    });

    it('filters by corporate', async () => {
      prismaMock.$transaction.mockResolvedValue([[sampleEmployee], [], 1, 0]);

      await service.listPatients(
        { page: 1, limit: 20, corporateId: 'corp-1' },
        actorInsurer,
      );

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('searches by name', async () => {
      prismaMock.$transaction.mockResolvedValue([[sampleEmployee], [], 1, 0]);

      await service.listPatients({ page: 1, limit: 20, search: 'Ali' }, actorHospital);

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('rejects unauthorized role', async () => {
      const actorCorporate: CurrentUserDto = {
        id: 'corp-1',
        email: 'corp@example.com',
        role: UserRole.corporate,
      };

      await expect(service.listPatients({ page: 1, limit: 20 }, actorCorporate)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getPatientById', () => {
    it('returns employee patient details', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(sampleEmployee);

      const result = await service.getPatientById('emp-1', 'employee', actorHospital);

      expect(result.id).toBe(sampleEmployee.id);
      expect(result.patientType).toBe('employee');
    });

    it('returns dependent patient details', async () => {
      prismaMock.dependent.findUnique.mockResolvedValue(sampleDependent);

      const result = await service.getPatientById('dep-1', 'dependent', actorHospital);

      expect(result.id).toBe(sampleDependent.id);
      expect(result.patientType).toBe('dependent');
    });

    it('throws not found for missing patient', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(null);

      await expect(
        service.getPatientById('missing-emp', 'employee', actorHospital),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects unauthorized role', async () => {
      const actorCorporate: CurrentUserDto = {
        id: 'corp-1',
        email: 'corp@example.com',
        role: UserRole.corporate,
      };

      await expect(
        service.getPatientById('emp-1', 'employee', actorCorporate),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getPatientCoverage', () => {
    it('returns coverage for active employee', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(sampleEmployee);

      const result = await service.getPatientCoverage('emp-1', 'employee', actorHospital);

      expect(result.isEligible).toBe(true);
      expect(result.totalCoverage).toBe('500000');
      expect(result.usedAmount).toBe('50000');
      expect(result.availableAmount).toBe('450000');
    });

    it('marks inactive employee as ineligible', async () => {
      const inactiveEmployee = {
        ...sampleEmployee,
        status: EmployeeStatus.Inactive,
      };

      prismaMock.employee.findUnique.mockResolvedValue(inactiveEmployee);

      const result = await service.getPatientCoverage('emp-1', 'employee', actorHospital);

      expect(result.isEligible).toBe(false);
      expect(result.reason).toContain('Inactive');
    });

    it('marks employee outside coverage dates as ineligible', async () => {
      const expiredEmployee = {
        ...sampleEmployee,
        coverageEndDate: new Date('2025-12-31'),
      };

      prismaMock.employee.findUnique.mockResolvedValue(expiredEmployee);

      const result = await service.getPatientCoverage('emp-1', 'employee', actorHospital);

      expect(result.isEligible).toBe(false);
      expect(result.reason).toContain('outside coverage dates');
    });

    it('marks employee with no remaining coverage as ineligible', async () => {
      const maxedEmployee = {
        ...sampleEmployee,
        usedAmount: {
          toFixed: () => '500000.00',
        },
      };

      prismaMock.employee.findUnique.mockResolvedValue(maxedEmployee);

      const result = await service.getPatientCoverage('emp-1', 'employee', actorHospital);

      expect(result.isEligible).toBe(false);
      expect(result.reason).toContain('No remaining coverage');
    });

    it('returns coverage for approved dependent', async () => {
      prismaMock.dependent.findUnique.mockResolvedValue(sampleDependent);

      const result = await service.getPatientCoverage('dep-1', 'dependent', actorHospital);

      expect(result.isEligible).toBe(true);
      expect(result.totalCoverage).toBe('500000');
    });

    it('marks unapproved dependent as ineligible', async () => {
      const pendingDependent = {
        ...sampleDependent,
        status: DependentStatus.Pending,
      };

      prismaMock.dependent.findUnique.mockResolvedValue(pendingDependent);

      const result = await service.getPatientCoverage('dep-1', 'dependent', actorHospital);

      expect(result.isEligible).toBe(false);
      expect(result.reason).toContain('not approved');
    });
  });

  describe('getPatientClaims', () => {
    it('returns claims for employee', async () => {
      prismaMock.claim.findMany.mockResolvedValue([sampleClaim]);

      const result = await service.getPatientClaims('emp-1', 'employee', actorHospital);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(sampleClaim.id);
    });

    it('returns claims for dependent', async () => {
      const dependentClaim = {
        ...sampleClaim,
        employeeId: null,
        dependentId: 'dep-1',
      };

      prismaMock.claim.findMany.mockResolvedValue([dependentClaim]);

      const result = await service.getPatientClaims('dep-1', 'dependent', actorInsurer);

      expect(result).toHaveLength(1);
    });

    it('rejects unauthorized role', async () => {
      const actorCorporate: CurrentUserDto = {
        id: 'corp-1',
        email: 'corp@example.com',
        role: UserRole.corporate,
      };

      await expect(
        service.getPatientClaims('emp-1', 'employee', actorCorporate),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getPatientVisits', () => {
    it('returns visits for employee', async () => {
      prismaMock.hospitalVisit.findMany.mockResolvedValue([sampleVisit]);

      const result = await service.getPatientVisits('emp-1', 'employee', actorHospital);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(sampleVisit.id);
    });

    it('returns visits for dependent', async () => {
      const dependentVisit = {
        ...sampleVisit,
        employeeId: null,
        dependentId: 'dep-1',
      };

      prismaMock.hospitalVisit.findMany.mockResolvedValue([dependentVisit]);

      const result = await service.getPatientVisits('dep-1', 'dependent', actorHospital);

      expect(result).toHaveLength(1);
    });

    it('rejects unauthorized role', async () => {
      const actorCorporate: CurrentUserDto = {
        id: 'corp-1',
        email: 'corp@example.com',
        role: UserRole.corporate,
      };

      await expect(
        service.getPatientVisits('emp-1', 'employee', actorCorporate),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
