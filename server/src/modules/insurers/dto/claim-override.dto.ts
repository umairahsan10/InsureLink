import { IsString, IsNotEmpty } from 'class-validator';

export class ClaimOverrideDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
