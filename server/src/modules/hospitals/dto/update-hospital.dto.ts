import { IsOptional, IsString, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { HospitalType } from '@prisma/client';

export class UpdateHospitalDto {
  @IsOptional()
  @IsString()
  hospitalName?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @IsOptional()
  @IsEnum(HospitalType)
  hospitalType?: HospitalType;

  @IsOptional()
  @IsBoolean()
  hasEmergencyUnit?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
