import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { NotificationType, Severity } from '@prisma/client';

export class CreateNotificationDto {
  @IsUUID()
  userId: string;

  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity;

  @IsUUID()
  @IsOptional()
  relatedEntityId?: string;

  @IsString()
  @IsOptional()
  relatedEntityType?: string;

  @IsString()
  @IsOptional()
  actionUrl?: string;

  @IsString()
  @IsOptional()
  category?: string;
}
