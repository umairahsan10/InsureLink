import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Priority } from '@prisma/client';

/**
 * DTO for creating a new claim
 * Only hospitalVisitId and amountClaimed are required
 * corporateId, planId, and insurerId are auto-populated from the visit's employee data
 */
export class CreateClaimDto {
  @IsUUID()
  @IsNotEmpty()
  hospitalVisitId: string;

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
