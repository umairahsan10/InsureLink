import { Controller, Get, Patch, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getMyNotifications(@Req() req: Request, @Query() query: any) {
    const userId = (req as any).user['sub'];
    return this.notificationsService.getUserNotifications(userId, query);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: Request) {
    const userId = (req as any).user['sub'];
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: Request) {
    const userId = (req as any).user['sub'];
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user['sub'];
    return this.notificationsService.markAsRead(id, userId);
  }

  @Delete(':id')
  async deleteNotification(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user['sub'];
    return this.notificationsService.delete(id, userId);
  }
}

