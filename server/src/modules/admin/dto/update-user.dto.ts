import {
  IsOptional,
  IsString,
  IsEmail,
  IsNumber,
  IsBoolean,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HospitalType, InsurerStatus, CorporateStatus } from '@prisma/client';

export class UpdateHospitalProfileDto {
  @IsOptional() @IsString() hospitalName?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() emergencyPhone?: string;
  @IsOptional() @IsEnum(HospitalType) hospitalType?: HospitalType;
  @IsOptional() @IsBoolean() hasEmergencyUnit?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateInsurerProfileDto {
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() province?: string;
  @IsOptional() @IsNumber() maxCoverageLimit?: number;
  @IsOptional() @IsNumber() networkHospitalCount?: number;
  @IsOptional() @IsNumber() corporateClientCount?: number;
  @IsOptional() @IsEnum(InsurerStatus) status?: InsurerStatus;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateCorporateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() province?: string;
  @IsOptional() @IsNumber() employeeCount?: number;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsEmail() contactEmail?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsEnum(CorporateStatus) status?: CorporateStatus;
}

export class UpdateUserDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() dob?: string;
  @IsOptional() @IsEnum(['Male', 'Female', 'Other']) gender?: string;
  @IsOptional() @IsString() cnic?: string;
  @IsOptional() @IsString() address?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateHospitalProfileDto)
  hospitalProfile?: UpdateHospitalProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateInsurerProfileDto)
  insurerProfile?: UpdateInsurerProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCorporateProfileDto)
  corporateProfile?: UpdateCorporateProfileDto;
}
