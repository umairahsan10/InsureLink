import { EmployeeStatus } from '@prisma/client';

export class EmployeeResponseDto {
  id: string;
  userId: string;
  corporateId: string;
  planId: string;
  employeeNumber: string;
  firstName: string;
  lastName?: string;
  cnic?: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  coverageStartDate: Date;
  coverageEndDate: Date;
  coverageAmount: string;
  usedAmount: string;
  availableAmount: string;
  status: EmployeeStatus;
  dependentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PaginatedEmployeesResponseDto {
  items: EmployeeResponseDto[];
  total: number;
  page: number;
  limit: number;
}
