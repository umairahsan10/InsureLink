import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class CreateCorporateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
