import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class BulkImportEmployeeRowDto {
  @IsString()
  @IsNotEmpty()
  employeeNumber: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  designation: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsDateString()
  coverageStartDate: string;

  @IsDateString()
  coverageEndDate: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  cnic?: string;
}

export class ValidateBulkImportDto {
  @IsString()
  @IsNotEmpty()
  corporateId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportEmployeeRowDto)
  rows: BulkImportEmployeeRowDto[];
}

export class CommitBulkImportDto {
  @IsString()
  @IsNotEmpty()
  importToken: string;

  @IsIn(['cancel', 'skip_invalid', 'all_or_nothing'])
  mode: 'cancel' | 'skip_invalid' | 'all_or_nothing';
}

export class BulkImportValidationRowResultDto {
  rowIndex: number;
  valid: boolean;
  errors: string[];
  normalized?: BulkImportEmployeeRowDto;
}

export class BulkImportValidationResponseDto {
  importToken: string;
  validCount: number;
  invalidCount: number;
  results: BulkImportValidationRowResultDto[];
}

export class UploadCsvDto {
  @IsString()
  @IsNotEmpty()
  corporateId: string;
}

export class GetInvalidUploadsDto {
  @IsString()
  @IsNotEmpty()
  corporateId: string;
}

export class ResubmitInvalidUploadDto {
  @IsString()
  @IsNotEmpty()
  invalidUploadId: string;
}

export class UpdateInvalidUploadDto {
  @IsString()
  @IsNotEmpty()
  invalidUploadId: string;

  @IsString()
  @IsNotEmpty()
  employeeNumber: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  designation: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsDateString()
  coverageStartDate: string;

  @IsDateString()
  coverageEndDate: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  cnic?: string;
}
