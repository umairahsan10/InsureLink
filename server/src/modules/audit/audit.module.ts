import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditLogsRepository } from './repositories/audit-logs.repository';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';

@Module({
  controllers: [AuditController],
  providers: [AuditService, AuditLogsRepository, AuditLogInterceptor],
  exports: [AuditService, AuditLogInterceptor],
})
export class AuditModule {}



