import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class PaidClaimDto {
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  paidAmount?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  eventNote?: string;
}
