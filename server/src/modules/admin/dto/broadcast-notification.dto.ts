import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export class BroadcastNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(['info', 'warning', 'critical'])
  severity?: 'info' | 'warning' | 'critical';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetRoles?: string[];
}
