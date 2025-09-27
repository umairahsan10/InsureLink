// PolicyExclusions model will be defined in Prisma schema
export interface PolicyExclusions {
  id: number;
  policyId: number;
  exclusionType: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
