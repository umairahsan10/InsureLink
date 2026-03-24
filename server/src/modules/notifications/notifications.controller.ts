import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { NotificationType, Severity } from '@prisma/client';

@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: CurrentUserDto,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('notificationType') notificationType?: NotificationType,
    @Query('isRead') isRead?: string,
    @Query('severity') severity?: Severity,
  ) {
    const filters: any = {};
    if (notificationType) filters.notificationType = notificationType;
    if (isRead !== undefined) filters.isRead = isRead === 'true';
    if (severity) filters.severity = severity;

    return this.notificationsService.getUserNotifications(
      user.id,
      filters,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 10,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: CurrentUserDto) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    await this.notificationsService.deleteNotification(id, user.id);
    return { success: true };
  }
}
