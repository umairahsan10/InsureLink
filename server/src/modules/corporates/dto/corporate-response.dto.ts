import { CorporateStatus } from '@prisma/client';

export class CorporateResponseDto {
  id: string;
  userId: string;
  name: string;
  address: string;
  city: string;
  province: string;
  employeeCount: number;
  dependentCount: number;
  insurerId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contractStartDate: Date;
  contractEndDate: Date;
  totalAmountUsed: string;
  status: CorporateStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class PaginatedCorporateResponseDto {
  items: CorporateResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export class CorporateStatsResponseDto {
  activeEmployees: number;
  activeDependents: number;
  totalCoverageAmount: string;
  usedCoverageAmount: string;
  remainingCoverageAmount: string;
  approvedClaimsCount: number;
  pendingClaimsCount: number;
  rejectedClaimsCount: number;
}
