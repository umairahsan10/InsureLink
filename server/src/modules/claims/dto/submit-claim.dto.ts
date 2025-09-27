import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class SubmitClaimDto {
  @IsString()
  @IsNotEmpty()
  claimNumber: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
