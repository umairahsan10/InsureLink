import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole, EmployeeStatus, Gender } from '@prisma/client';
import { CurrentUserDto } from '../../auth/dto/current-user.dto';
import { EmployeesService } from '../employees.service';

describe('EmployeesService', () => {
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    employee: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    corporate: {
      findUnique: jest.fn(),
    },
    plan: {
      findUnique: jest.fn(),
    },
    dependent: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const actorAdmin: CurrentUserDto = {
    id: 'admin-1',
    email: 'admin@insurelink.com',
    role: UserRole.admin,
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

  const sampleCorporate = {
    id: 'corp-1',
    userId: actorCorporate.id,
    companyName: 'TechCorp',
    insurerId: 'insurer-1',
    contractStartDate: new Date('2026-01-01'),
    contractEndDate: new Date('2026-12-31'),
  };

  const samplePlan = {
    id: 'plan-1',
    planName: 'Gold Plan',
    insurerId: 'insurer-1',
    coverageAmount: {
      toFixed: () => '500000.00',
    },
  };

  const sampleEmployee = {
    id: 'emp-1',
    userId: 'emp-user-1',
    corporateId: 'corp-1',
    employeeNumber: 'EMP001',
    planId: 'plan-1',
    coverageStartDate: new Date('2026-01-01'),
    coverageEndDate: new Date('2026-12-31'),
    coverageAmount: {
      toFixed: () => '500000.00',
    },
    usedAmount: {
      toFixed: () => '0.00',
    },
    status: EmployeeStatus.Active,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'emp-user-1',
      email: 'employee@example.com',
      firstName: 'Ali',
      lastName: 'Raza',
      phone: '03001234567',
      userRole: UserRole.patient,
      dob: new Date('1990-01-01'),
      gender: Gender.Male,
      cnic: '1234567890123',
    },
    corporate: sampleCorporate,
    plan: samplePlan,
  };

  let service: EmployeesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EmployeesService(prismaMock as never);
  });

  describe('createEmployee', () => {
    it('creates employee for corporate user', async () => {
      const createDto = {
        email: 'newemp@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '03001234567',
        dob: '1990-01-01',
        gender: Gender.Male,
        cnic: '1234567890123',
        address: '123 Street',
        corporateId: 'corp-1',
        employeeNumber: 'EMP002',
        planId: 'plan-1',
        coverageStartDate: '2026-01-15',
        coverageEndDate: '2026-12-15',
      };

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.corporate.findUnique.mockResolvedValue(sampleCorporate);
      prismaMock.plan.findUnique.mockResolvedValue(samplePlan);
      prismaMock.$transaction.mockResolvedValue(sampleEmployee);

      const result = await service.createEmployee(createDto, actorCorporate);

      expect(result.employeeNumber).toBe(sampleEmployee.employeeNumber);
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('rejects employee for non-corporate/non-admin user', async () => {
      const createDto = {
        email: 'newemp@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '03001234567',
        dob: '1990-01-01',
        gender: Gender.Male,
        cnic: '1234567890123',
        address: '123 Street',
        corporateId: 'corp-1',
        employeeNumber: 'EMP002',
        planId: 'plan-1',
        coverageStartDate: '2026-01-15',
        coverageEndDate: '2026-12-15',
      };

      await expect(service.createEmployee(createDto, actorEmployee)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects duplicate email', async () => {
      const createDto = {
        email: 'existing@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '03001234567',
        dob: '1990-01-01',
        gender: Gender.Male,
        cnic: '1234567890123',
        address: '123 Street',
        corporateId: 'corp-1',
        employeeNumber: 'EMP002',
        planId: 'plan-1',
        coverageStartDate: '2026-01-15',
        coverageEndDate: '2026-12-15',
      };

      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing-user' });
      prismaMock.corporate.findUnique.mockResolvedValue(sampleCorporate);

      await expect(service.createEmployee(createDto, actorCorporate)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects coverage dates outside contract', async () => {
      const createDto = {
        email: 'newemp@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '03001234567',
        dob: '1990-01-01',
        gender: Gender.Male,
        cnic: '1234567890123',
        address: '123 Street',
        corporateId: 'corp-1',
        employeeNumber: 'EMP002',
        planId: 'plan-1',
        coverageStartDate: '2025-12-01',
        coverageEndDate: '2027-01-01',
      };

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.corporate.findUnique.mockResolvedValue(sampleCorporate);
      prismaMock.plan.findUnique.mockResolvedValue(samplePlan);

      await expect(service.createEmployee(createDto, actorCorporate)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects plan from different insurer', async () => {
      const createDto = {
        email: 'newemp@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '03001234567',
        dob: '1990-01-01',
        gender: Gender.Male,
        cnic: '1234567890123',
        address: '123 Street',
        corporateId: 'corp-1',
        employeeNumber: 'EMP002',
        planId: 'plan-1',
        coverageStartDate: '2026-01-15',
        coverageEndDate: '2026-12-15',
      };

      const wrongPlan = { ...samplePlan, insurerId: 'different-insurer' };

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.corporate.findUnique.mockResolvedValue(sampleCorporate);
      prismaMock.plan.findUnique.mockResolvedValue(wrongPlan);

      await expect(service.createEmployee(createDto, actorCorporate)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getEmployeeById', () => {
    it('returns employee for corporate', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(sampleEmployee);

      const result = await service.getEmployeeById('emp-1', actorCorporate);

      expect(result.id).toBe(sampleEmployee.id);
    });

    it('returns own employee record for patient', async () => {
      const empWithUser = { ...sampleEmployee, userId: actorEmployee.id };
      prismaMock.employee.findUnique.mockResolvedValue(empWithUser);

      const result = await service.getEmployeeById('emp-1', actorEmployee);

      expect(result.id).toBe(empWithUser.id);
    });

    it('throws not found for missing employee', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(null);

      await expect(service.getEmployeeById('missing-emp', actorAdmin)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects patient viewing another employee', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(sampleEmployee);

      await expect(service.getEmployeeById('emp-1', actorEmployee)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateEmployee', () => {
    it('updates employee for corporate', async () => {
      const updateDto = {
        firstName: 'Updated',
        planId: 'plan-2',
      };

      const newPlan = { ...samplePlan, id: 'plan-2', coverageAmount: { toFixed: () => '600000.00' } };

      prismaMock.employee.findUnique.mockResolvedValue(sampleEmployee);
      prismaMock.corporate.findUnique.mockResolvedValue(sampleCorporate);
      prismaMock.plan.findUnique.mockResolvedValue(newPlan);
      prismaMock.$transaction.mockResolvedValue({
        ...sampleEmployee,
        coverageAmount: { toFixed: () => '600000.00' },
      });

      const result = await service.updateEmployee('emp-1', updateDto, actorCorporate);

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('rejects unauthorized update', async () => {
      const updateDto = { firstName: 'Hacked' };

      prismaMock.employee.findUnique.mockResolvedValue(sampleEmployee);

      await expect(service.updateEmployee('emp-1', updateDto, actorEmployee)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('deleteEmployee', () => {
    it('deletes employee for admin', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(sampleEmployee);
      prismaMock.dependent.count.mockResolvedValue(0);
      prismaMock.employee.delete.mockResolvedValue(sampleEmployee);

      const result = await service.deleteEmployee('emp-1', actorAdmin);

      expect(result.success).toBe(true);
    });

    it('rejects delete with active dependents', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(sampleEmployee);
      prismaMock.dependent.count.mockResolvedValue(2);

      await expect(service.deleteEmployee('emp-1', actorAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects non-admin/non-corporate delete', async () => {
      await expect(service.deleteEmployee('emp-1', actorEmployee)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('listEmployees', () => {
    it('lists employees for corporate', async () => {
      prismaMock.$transaction.mockResolvedValue([[sampleEmployee], 1]);

      const result = await service.listEmployees({ page: 1, limit: 20 }, actorCorporate);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('filters by status', async () => {
      prismaMock.$transaction.mockResolvedValue([[sampleEmployee], 1]);

      await service.listEmployees(
        { page: 1, limit: 20, status: EmployeeStatus.Active },
        actorCorporate,
      );

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('rejects non-elevated users', async () => {
      await expect(
        service.listEmployees({ page: 1, limit: 20 }, actorEmployee),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getEmployeeCoverage', () => {
    it('returns coverage details', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(sampleEmployee);

      const result = await service.getEmployeeCoverage('emp-1', actorCorporate);

      expect(result.totalCoverage).toBe('500000');
      expect(result.usedAmount).toBe('0');
      expect(result.availableAmount).toBe('500000');
    });

    it('calculates coverage correctly', async () => {
      const empWithUsage = {
        ...sampleEmployee,
        usedAmount: {
          toFixed: () => '150000.00',
        },
      };

      prismaMock.employee.findUnique.mockResolvedValue(empWithUsage);

      const result = await service.getEmployeeCoverage('emp-1', actorCorporate);

      expect(result.usedAmount).toBe('150000');
      expect(result.availableAmount).toBe('350000');
    });
  });

  describe('validateBulkImport', () => {
    it('validates bulk import data', async () => {
      const data = [
        {
          email: 'emp1@example.com',
          password: 'Pass123',
          firstName: 'John',
          lastName: 'Doe',
          phone: '03001234567',
          dob: '1990-01-01',
          gender: 'Male',
          cnic: '1234567890123',
          employeeNumber: 'EMP001',
          planId: 'plan-1',
          coverageStartDate: '2026-01-01',
          coverageEndDate: '2026-12-31',
        },
      ];

      prismaMock.corporate.findUnique.mockResolvedValue(sampleCorporate);
      prismaMock.plan.findUnique.mockResolvedValue(samplePlan);
      prismaMock.employee.findMany.mockResolvedValue([]);
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.validateBulkImport('corp-1', data, actorCorporate);

      expect(result.validCount).toBe(1);
      expect(result.invalidCount).toBe(0);
      expect(result.importToken).toBeDefined();
    });

    it('detects duplicate employee numbers', async () => {
      const data = [
        {
          email: 'emp1@example.com',
          password: 'Pass123',
          firstName: 'John',
          lastName: 'Doe',
          phone: '03001234567',
          dob: '1990-01-01',
          gender: 'Male',
          cnic: '1234567890123',
          employeeNumber: 'EMP001',
          planId: 'plan-1',
          coverageStartDate: '2026-01-01',
          coverageEndDate: '2026-12-31',
        },
      ];

      prismaMock.corporate.findUnique.mockResolvedValue(sampleCorporate);
      prismaMock.plan.findUnique.mockResolvedValue(samplePlan);
      prismaMock.employee.findMany.mockResolvedValue([{ employeeNumber: 'EMP001' }]);

      const result = await service.validateBulkImport('corp-1', data, actorCorporate);

      expect(result.invalidCount).toBe(1);
      expect(result.errors[0]).toContain('duplicate employee number');
    });
  });

  describe('updateUsedAmount', () => {
    it('updates used amount for claim approval', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(sampleEmployee);
      prismaMock.employee.update.mockResolvedValue({
        ...sampleEmployee,
        usedAmount: { toFixed: () => '50000.00' },
      });

      await service.updateUsedAmount('emp-1', { toFixed: () => '50000.00' } as never);

      expect(prismaMock.employee.update).toHaveBeenCalled();
    });

    it('rejects amount exceeding coverage', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(sampleEmployee);

      await expect(service.updateUsedAmount('emp-1', { toFixed: () => '600000.00' } as never)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
