// Policy model will be defined in Prisma schema
export interface Policy {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
