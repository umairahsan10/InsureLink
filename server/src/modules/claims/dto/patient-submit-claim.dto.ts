import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Priority } from '@prisma/client';

/**
 * DTO for patient self-service claim submission.
 * The patient provides hospital, visit dates, and claim details.
 * The backend creates a HospitalVisit and then a Claim in one transaction.
 */
export class PatientSubmitClaimDto {
  @IsUUID()
  @IsNotEmpty()
  hospitalId: string;

  @IsDateString()
  @IsNotEmpty()
  visitDate: string;

  @IsOptional()
  @IsDateString()
  dischargeDate?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amountClaimed: number;

  @IsOptional()
  @IsString()
  treatmentCategory?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  notes?: string;
}
