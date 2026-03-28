import { Gender, UserRole } from '@prisma/client';

export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  phone: string;
  userRole: UserRole;
  dob?: Date;
  gender?: Gender;
  cnic?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export class PaginatedUsersResponseDto {
  items: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
}
