import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ApproveClaimDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  approvedAmount: number;

  @IsOptional()
  @IsString()
  eventNote?: string;
}
