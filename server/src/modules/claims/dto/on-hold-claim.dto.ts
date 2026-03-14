import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OnHoldClaimDto {
  @IsString()
  @IsNotEmpty()
  eventNote: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredDocuments?: string[];
}
