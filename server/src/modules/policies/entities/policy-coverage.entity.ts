// PolicyCoverage model will be defined in Prisma schema
export interface PolicyCoverage {
  id: number;
  policyId: number;
  coverageType: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}
