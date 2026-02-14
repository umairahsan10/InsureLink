import { InsurerStatus } from '@prisma/client';

export class InsurerResponseDto {
  id: string;
  userId: string;
  companyName: string;
  licenseNumber: string;
  address: string;
  city: string;
  province: string;
  maxCoverageLimit: any;
  networkHospitalCount: number;
  corporateClientCount: number;
  status: InsurerStatus;
  operatingSince: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  plans?: any[];
  labs?: any[];
}
