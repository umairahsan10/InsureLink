import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class AuditEntryDto {
  @IsString()
  @IsNotEmpty()
  action: string;

  @IsString()
  @IsNotEmpty()
  entity: string;

  @IsNumber()
  @IsNotEmpty()
  entityId: number;

  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
