import {
  IsOptional,
  IsString,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';

export class CreateHospitalVisitDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsOptional()
  @IsString()
  dependentId?: string;

  @IsString()
  hospitalId: string;

  @IsDateString()
  visitDate: string;

  @IsOptional()
  @IsDateString()
  dischargeDate?: string;
}

export class HospitalVisitResponseDto {
  id: string;
  employeeId?: string;
  dependentId?: string;
  hospitalId: string;
  visitDate: Date;
  dischargeDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
