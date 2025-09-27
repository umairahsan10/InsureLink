// Hospital model will be defined in Prisma schema
export interface Hospital {
  id: number;
  name: string;
  address: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
