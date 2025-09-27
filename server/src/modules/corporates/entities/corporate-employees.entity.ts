// CorporateEmployees model will be defined in Prisma schema
export interface CorporateEmployees {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  corporateId: number;
  createdAt: Date;
  updatedAt: Date;
}
