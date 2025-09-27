// Corporate model will be defined in Prisma schema
export interface Corporate {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
