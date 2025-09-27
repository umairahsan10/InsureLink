import { IsString, IsNotEmpty } from 'class-validator';

export class EmployeeCoverageDto {
  @IsString()
  @IsNotEmpty()
  coverageType: string;
}
