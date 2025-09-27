import { IsEmail, IsNotEmpty } from 'class-validator';

export class StaffLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
