import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  planName: string;

  @IsString()
  @IsNotEmpty()
  planCode: string;

  @Type(() => Number)
  @IsNumber()
  sumInsured: number;

  @IsObject()
  coveredServices: any;

  @IsObject()
  serviceLimits: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  planName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sumInsured?: number;

  @IsOptional()
  @IsObject()
  coveredServices?: any;

  @IsOptional()
  @IsObject()
  serviceLimits?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
