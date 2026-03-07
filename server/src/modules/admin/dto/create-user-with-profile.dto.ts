import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  Matches,
  IsEnum,
  IsOptional,
  IsDateString,
  IsString,
  ValidateNested,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  UserRole,
  Gender,
  HospitalType,
  InsurerStatus,
  CorporateStatus,
} from '@prisma/client';

// User basic info (common for all roles)
export class UserInfoDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @IsOptional()
  @MinLength(2)
  lastName?: string;

  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  cnic?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

// Hospital profile data
export class HospitalProfileDto {
  @IsString()
  @IsNotEmpty()
  hospitalName: string;

  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsString()
  @IsNotEmpty()
  emergencyPhone: string;

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

// Insurer profile data
export class InsurerProfileDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  province: string;

  @IsNumber()
  maxCoverageLimit: number;

  @IsOptional()
  @IsNumber()
  networkHospitalCount?: number;

  @IsOptional()
  @IsNumber()
  corporateClientCount?: number;

  @IsOptional()
  @IsEnum(InsurerStatus)
  status?: InsurerStatus;

  @IsDateString()
  operatingSince: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Corporate profile data
export class CorporateProfileDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  province: string;

  @IsNumber()
  employeeCount: number;

  @IsOptional()
  @IsNumber()
  dependentCount?: number;

  @IsString()
  @IsNotEmpty()
  insurerId: string;

  @IsString()
  @IsNotEmpty()
  contactName: string;

  @IsEmail()
  @IsNotEmpty()
  contactEmail: string;

  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @IsDateString()
  contractStartDate: string;

  @IsDateString()
  contractEndDate: string;

  @IsOptional()
  @IsEnum(CorporateStatus)
  status?: CorporateStatus;
}

// Main DTO for creating user with profile
export class CreateUserWithProfileDto {
  @ValidateNested()
  @Type(() => UserInfoDto)
  user: UserInfoDto;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @ValidateNested()
  @Type(() => HospitalProfileDto)
  hospitalProfile?: HospitalProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => InsurerProfileDto)
  insurerProfile?: InsurerProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CorporateProfileDto)
  corporateProfile?: CorporateProfileDto;
}
