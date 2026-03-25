import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin) // Only admins can view audit logs
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async getLogs(@Query() query: any) {
    return this.auditService.getLogs(query);
  }

  @Get('entity/:type/:id')
  async getEntityHistory(@Param('type') type: string, @Param('id') id: string) {
    return this.auditService.getEntityHistory(type, id);
  }
}
