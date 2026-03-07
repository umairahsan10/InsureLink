import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCorporateDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  userEmail: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  userPassword: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  userFirstName: string;

  @IsString()
  @MaxLength(100)
  userLastName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  userPhone: string;

  @IsString()
  @MaxLength(15)
  userCnic?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  province: string;

  @IsInt()
  @Min(1)
  employeeCount: number;

  @IsString()
  @IsNotEmpty()
  insurerId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  contactName: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  contactEmail: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  contactPhone: string;

  @IsDateString()
  contractStartDate: string;

  @IsDateString()
  contractEndDate: string;
}
