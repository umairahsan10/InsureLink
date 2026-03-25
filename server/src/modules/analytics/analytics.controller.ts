import { Controller, Get, Req, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboard(@Req() req: Request) {
    const user = (req as any).user;
    return this.analyticsService.getDashboardStats(user);
  }

  @Get('claims')
  async getClaimsAnalytics(@Query() query: any) {
    return this.analyticsService.getClaimsAnalytics(query);
  }

  @Get('financial')
  async getFinancialAnalytics() {
    return this.analyticsService.getFinancialAnalytics();
  }
}
