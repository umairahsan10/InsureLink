import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';

@Module({
  providers: [AuditService, AuditLogInterceptor],
  exports: [AuditService, AuditLogInterceptor],
})
export class AuditModule {}



