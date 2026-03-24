import { Controller, Get, Param, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditAction } from '@prisma/client';

@Controller({ path: 'audit', version: '1' })
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles('insurer', 'corporate')
  async getLogs(
    @Query('entityType') entityType?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const filters: any = {};
    if (entityType) filters.entityType = entityType;
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    return this.auditService.getLogs(
      filters,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
  }

  @Get('entity/:type/:id')
  async getEntityHistory(
    @Param('type') type: string,
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.auditService.getEntityHistory(
      type,
      id,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
  }
}
