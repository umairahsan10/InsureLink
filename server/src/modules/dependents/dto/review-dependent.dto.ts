import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectDependentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  rejectionReason: string;
}

export class UpdateDependentStatusDto {
  @IsString()
  @IsNotEmpty()
  status: 'Active' | 'Inactive';
}
