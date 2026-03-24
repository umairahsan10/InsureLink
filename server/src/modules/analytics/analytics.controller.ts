import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';

@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: CurrentUserDto) {
    return this.analyticsService.getDashboard(user);
  }

  @Get('claims')
  @Roles('insurer', 'corporate', 'admin')
  async getClaimsAnalytics(
    @CurrentUser() user: CurrentUserDto,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getClaimsAnalytics(user, startDate, endDate);
  }

  @Get('coverage')
  @Roles('insurer', 'corporate', 'admin')
  async getCoverageAnalytics(@CurrentUser() user: CurrentUserDto) {
    return this.analyticsService.getCoverageAnalytics(user);
  }
}
