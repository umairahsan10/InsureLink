import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole, DependentStatus, Relationship, Gender } from '@prisma/client';
import { CurrentUserDto } from '../../auth/dto/current-user.dto';
import { DependentsService } from '../dependents.service';

describe('DependentsService', () => {
  const prismaMock = {
    dependent: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    employee: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const actorCorporate: CurrentUserDto = {
    id: 'corp-user-1',
    email: 'corp@example.com',
    role: UserRole.corporate,
  };

  const actorEmployee: CurrentUserDto = {
    id: 'emp-user-1',
    email: 'employee@example.com',
    role: UserRole.patient,
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
    corporate: {
      id: 'corp-1',
      userId: actorCorporate.id,
      companyName: 'TechCorp',
    },
  };

  const sampleDependent = {
    id: 'dep-1',
    employeeId: 'emp-1',
    firstName: 'Sara',
    lastName: 'Raza',
    relationship: Relationship.Spouse,
    dob: new Date('1992-05-15'),
    gender: Gender.Female,
    cnic: '9876543210123',
    status: DependentStatus.Pending,
    requestedDate: new Date(),
    reviewedDate: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    employee: sampleEmployee,
  };

  let service: DependentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DependentsService(prismaMock as never);
  });

  describe('createDependent', () => {
    it('creates dependent for employee', async () => {
      const createDto = {
        employeeId: 'emp-1',
        firstName: 'Sara',
        lastName: 'Raza',
        relationship: Relationship.Spouse,
        dob: '1992-05-15',
        gender: Gender.Female,
        cnic: '9876543210123',
      };

      prismaMock.employee.findUnique.mockResolvedValue(sampleEmployee);
      prismaMock.dependent.create.mockResolvedValue(sampleDependent);

      const result = await service.createDependent(createDto, actorEmployee);

      expect(result.firstName).toBe(sampleDependent.firstName);
      expect(result.status).toBe(DependentStatus.Pending);
    });

    it('rejects spouse under 18', async () => {
      const createDto = {
        employeeId: 'emp-1',
        firstName: 'Sara',
        lastName: 'Raza',
        relationship: Relationship.Spouse,
        dob: '2010-01-01',
        gender: Gender.Female,
        cnic: '9876543210123',
      };

      prismaMock.employee.findUnique.mockResolvedValue(sampleEmployee);

      await expect(service.createDependent(createDto, actorEmployee)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects child over 25', async () => {
      const createDto = {
        employeeId: 'emp-1',
        firstName: 'Ahmed',
        lastName: 'Raza',
        relationship: Relationship.Son,
        dob: '1995-01-01',
        gender: Gender.Male,
        cnic: '9876543210123',
      };

      prismaMock.employee.findUnique.mockResolvedValue(sampleEmployee);

      await expect(service.createDependent(createDto, actorEmployee)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects parent under 45', async () => {
      const createDto = {
        employeeId: 'emp-1',
        firstName: 'Khalid',
        lastName: 'Raza',
        relationship: Relationship.Father,
        dob: '1990-01-01',
        gender: Gender.Male,
        cnic: '9876543210123',
      };

      prismaMock.employee.findUnique.mockResolvedValue(sampleEmployee);

      await expect(service.createDependent(createDto, actorEmployee)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects unauthorized user', async () => {
      const createDto = {
        employeeId: 'emp-1',
        firstName: 'Sara',
        lastName: 'Raza',
        relationship: Relationship.Spouse,
        dob: '1992-05-15',
        gender: Gender.Female,
        cnic: '9876543210123',
      };

      const otherEmployee: CurrentUserDto = {
        id: 'other-user',
        email: 'other@example.com',
        role: UserRole.patient,
      };

      prismaMock.employee.findUnique.mockResolvedValue(sampleEmployee);

      await expect(service.createDependent(createDto, otherEmployee)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getDependentById', () => {
    it('returns dependent for employee', async () => {
      prismaMock.dependent.findUnique.mockResolvedValue(sampleDependent);

      const result = await service.getDependentById('dep-1', actorEmployee);

      expect(result.id).toBe(sampleDependent.id);
    });

    it('returns dependent for corporate', async () => {
      prismaMock.dependent.findUnique.mockResolvedValue(sampleDependent);

      const result = await service.getDependentById('dep-1', actorCorporate);

      expect(result.id).toBe(sampleDependent.id);
    });

    it('throws not found for missing dependent', async () => {
      prismaMock.dependent.findUnique.mockResolvedValue(null);

      await expect(service.getDependentById('missing-dep', actorEmployee)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects unauthorized patient', async () => {
      const otherEmployee: CurrentUserDto = {
        id: 'other-user',
        email: 'other@example.com',
        role: UserRole.patient,
      };

      prismaMock.dependent.findUnique.mockResolvedValue(sampleDependent);

      await expect(service.getDependentById('dep-1', otherEmployee)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateDependent', () => {
    it('updates dependent for employee', async () => {
      const updateDto = {
        firstName: 'Updated Sara',
        phone: '03009876543',
      };

      prismaMock.dependent.findUnique.mockResolvedValue(sampleDependent);
      prismaMock.dependent.update.mockResolvedValue({
        ...sampleDependent,
        ...updateDto,
      });

      const result = await service.updateDependent('dep-1', updateDto, actorEmployee);

      expect(result.firstName).toBe(updateDto.firstName);
    });

    it('validates age-relationship on update', async () => {
      const updateDto = {
        dob: '2010-01-01', // Too young for spouse
      };

      prismaMock.dependent.findUnique.mockResolvedValue(sampleDependent);

      await expect(service.updateDependent('dep-1', updateDto, actorEmployee)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects unauthorized update', async () => {
      const updateDto = { firstName: 'Hacked' };

      const otherEmployee: CurrentUserDto = {
        id: 'other-user',
        email: 'other@example.com',
        role: UserRole.patient,
      };

      prismaMock.dependent.findUnique.mockResolvedValue(sampleDependent);

      await expect(service.updateDependent('dep-1', updateDto, otherEmployee)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('listDependents', () => {
    it('lists dependents for corporate', async () => {
      prismaMock.$transaction.mockResolvedValue([[sampleDependent], 1]);

      const result = await service.listDependents({ page: 1, limit: 20 }, actorCorporate);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('filters by employee for patient', async () => {
      prismaMock.$transaction.mockResolvedValue([[sampleDependent], 1]);

      const result = await service.listDependents(
        { page: 1, limit: 20, employeeId: 'emp-1' },
        actorEmployee,
      );

      expect(result.items).toHaveLength(1);
    });

    it('filters by status', async () => {
      prismaMock.$transaction.mockResolvedValue([[], 0]);

      await service.listDependents(
        { page: 1, limit: 20, status: DependentStatus.Approved },
        actorCorporate,
      );

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('rejects unauthorized role', async () => {
      const actorHospital: CurrentUserDto = {
        id: 'hospital-1',
        email: 'hospital@example.com',
        role: UserRole.hospital,
      };

      await expect(
        service.listDependents({ page: 1, limit: 20 }, actorHospital),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('approveDependent', () => {
    it('approves pending dependent', async () => {
      prismaMock.dependent.findUnique.mockResolvedValue(sampleDependent);
      prismaMock.dependent.update.mockResolvedValue({
        ...sampleDependent,
        status: DependentStatus.Approved,
        reviewedDate: new Date(),
      });

      const result = await service.approveDependent('dep-1', actorCorporate);

      expect(result.status).toBe(DependentStatus.Approved);
    });

    it('rejects non-corporate approval', async () => {
      await expect(service.approveDependent('dep-1', actorEmployee)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects approval of non-pending dependent', async () => {
      const approvedDependent = {
        ...sampleDependent,
        status: DependentStatus.Approved,
      };

      prismaMock.dependent.findUnique.mockResolvedValue(approvedDependent);

      await expect(service.approveDependent('dep-1', actorCorporate)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects approval by different corporate', async () => {
      const otherCorporate: CurrentUserDto = {
        id: 'other-corp',
        email: 'othercorp@example.com',
        role: UserRole.corporate,
      };

      prismaMock.dependent.findUnique.mockResolvedValue(sampleDependent);

      await expect(service.approveDependent('dep-1', otherCorporate)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('rejectDependent', () => {
    it('rejects pending dependent with reason', async () => {
      const rejectDto = {
        rejectionReason: 'Documentation incomplete',
      };

      prismaMock.dependent.findUnique.mockResolvedValue(sampleDependent);
      prismaMock.dependent.update.mockResolvedValue({
        ...sampleDependent,
        status: DependentStatus.Rejected,
        rejectionReason: rejectDto.rejectionReason,
        reviewedDate: new Date(),
      });

      const result = await service.rejectDependent('dep-1', rejectDto, actorCorporate);

      expect(result.status).toBe(DependentStatus.Rejected);
      expect(result.rejectionReason).toBe(rejectDto.rejectionReason);
    });

    it('rejects non-corporate rejection', async () => {
      const rejectDto = { rejectionReason: 'Invalid' };

      await expect(service.rejectDependent('dep-1', rejectDto, actorEmployee)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects rejection of non-pending dependent', async () => {
      const rejectedDependent = {
        ...sampleDependent,
        status: DependentStatus.Rejected,
      };

      const rejectDto = { rejectionReason: 'Invalid' };

      prismaMock.dependent.findUnique.mockResolvedValue(rejectedDependent);

      await expect(service.rejectDependent('dep-1', rejectDto, actorCorporate)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateDependentStatus', () => {
    it('toggles status for corporate', async () => {
      const approvedDependent = {
        ...sampleDependent,
        status: DependentStatus.Approved,
      };

      prismaMock.dependent.findUnique.mockResolvedValue(approvedDependent);
      prismaMock.dependent.update.mockResolvedValue({
        ...approvedDependent,
        status: DependentStatus.Inactive,
      });

      const result = await service.updateDependentStatus(
        'dep-1',
        { status: DependentStatus.Inactive },
        actorCorporate,
      );

      expect(prismaMock.dependent.update).toHaveBeenCalled();
    });

    it('rejects status change on pending dependent', async () => {
      prismaMock.dependent.findUnique.mockResolvedValue(sampleDependent);

      await expect(
        service.updateDependentStatus('dep-1', { status: DependentStatus.Inactive }, actorCorporate),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects non-corporate status change', async () => {
      await expect(
        service.updateDependentStatus('dep-1', { status: DependentStatus.Inactive }, actorEmployee),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
