import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class PatientProfileDto {
  patientId: number;
  name: string;
  email: string;
}

export class UpdatePatientProfileDto {
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, { message: 'Invalid mobile number' })
  mobile?: string;
}
