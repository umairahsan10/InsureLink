// Patient model will be defined in Prisma schema
export interface Patient {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

