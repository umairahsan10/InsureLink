// Claim model will be defined in Prisma schema
export interface Claim {
  id: number;
  claimNumber: string;
  status: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}
