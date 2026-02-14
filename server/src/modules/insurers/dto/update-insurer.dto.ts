import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { InsurerStatus } from '@prisma/client';

export class UpdateInsurerDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsNumber()
  maxCoverageLimit?: number;

  @IsOptional()
  @IsNumber()
  networkHospitalCount?: number;

  @IsOptional()
  @IsNumber()
  corporateClientCount?: number;

  @IsOptional()
  @IsEnum(InsurerStatus)
  status?: InsurerStatus;

  @IsOptional()
  @IsDateString()
  operatingSince?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
