import { IsString, IsOptional } from 'class-validator';

export class UpdatePolicyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
