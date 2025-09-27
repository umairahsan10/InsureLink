// ClaimHistory model will be defined in Prisma schema
export interface ClaimHistory {
  id: number;
  claimId: number;
  status: string;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}
