import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { AuditAction } from '@prisma/client';

export class CreateAuditLogDto {
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @IsUUID()
  @IsNotEmpty()
  entityId: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsEnum(AuditAction)
  action: AuditAction;

  @IsString()
  @IsOptional()
  fieldName?: string;

  @IsString()
  @IsOptional()
  oldValue?: string;

  @IsString()
  @IsOptional()
  newValue?: string;

  @IsString()
  @IsOptional()
  changeReason?: string;
}
