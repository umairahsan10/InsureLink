import { IsString, IsInt, IsBoolean, IsOptional } from 'class-validator';

export class CreateHospitalEmergencyContactDto {
  @IsInt()
  contactLevel: number;

  @IsString()
  designation: string;

  @IsString()
  name: string;

  @IsString()
  contactNumber: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateHospitalEmergencyContactDto {
  @IsOptional()
  @IsInt()
  contactLevel?: number;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class HospitalEmergencyContactResponseDto {
  id: string;
  hospitalId: string;
  contactLevel: number;
  designation: string;
  name: string;
  contactNumber: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
