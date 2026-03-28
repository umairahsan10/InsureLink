import { DependentStatus, Gender, Relationship } from '@prisma/client';

export class DependentResponseDto {
  id: string;
  employeeId: string;
  corporateId: string;
  firstName: string;
  lastName: string;
  relationship: Relationship;
  dateOfBirth: Date;
  gender: Gender;
  cnic?: string;
  phoneNumber?: string;
  status: DependentStatus;
  requestDate: Date;
  reviewedDate?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PaginatedDependentsResponseDto {
  items: DependentResponseDto[];
  total: number;
  page: number;
  limit: number;
}
