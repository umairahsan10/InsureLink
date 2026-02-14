import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { InsurerStatus } from '@prisma/client';

export class CreateInsurerDto {
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
