import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyPatientDto {
  @IsString()
  @IsNotEmpty()
  cnic: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
