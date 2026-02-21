import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsObject,
} from 'class-validator';

export class CreateLabDto {
  @IsString()
  @IsNotEmpty()
  labName: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @IsEmail()
  contactEmail: string;

  @IsObject()
  testCategories: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateLabDto {
  @IsOptional()
  @IsString()
  labName?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsObject()
  testCategories?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
