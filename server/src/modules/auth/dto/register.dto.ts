import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  Matches,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { UserRole, Gender } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @IsOptional()
  @MinLength(2)
  lastName?: string;

  @IsNotEmpty()
  phone: string;

  @IsEnum(UserRole)
  userRole: UserRole;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}


