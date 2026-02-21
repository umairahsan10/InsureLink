import { Exclude } from 'class-transformer';
import { HospitalType } from '@prisma/client';

export class HospitalResponseDto {
  id: string;
  userId: string;
  hospitalName: string;
  licenseNumber: string;
  city: string;
  address: string;
  latitude: any;
  longitude: any;
  emergencyPhone: string;
  hospitalType: HospitalType;
  hasEmergencyUnit: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  emergencyContacts?: any;

  @Exclude()
  hospitalVisits?: any;
}
