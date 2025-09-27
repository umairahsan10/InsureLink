// ClaimDocuments model will be defined in Prisma schema (Future)
export interface ClaimDocuments {
  id: number;
  claimId: number;
  documentType: string;
  filePath: string;
  createdAt: Date;
  updatedAt: Date;
}
