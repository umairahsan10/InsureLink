// HospitalStaff model will be defined in Prisma schema
export interface HospitalStaff {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  hospitalId: number;
  createdAt: Date;
  updatedAt: Date;
}
