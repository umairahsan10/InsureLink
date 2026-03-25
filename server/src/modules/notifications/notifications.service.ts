import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from './repositories/notifications.repository';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { InAppNotificationService } from './services/in-app-notification.service';
import { NotificationType } from '@prisma/client';

import { PaginationDto } from '../../shared/dtos/pagination.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly inAppNotificationService: InAppNotificationService,
  ) {}

  async sendNotification(data: CreateNotificationDto) {
    // 1. Save to DB
    const notification = await this.notificationsRepository.create({
      user: { connect: { id: data.userId } },
      notificationType: data.notificationType,
      title: data.title,
      message: data.message,
      severity: data.severity || 'info',
      relatedEntityId: data.relatedEntityId,
      relatedEntityType: data.relatedEntityType,
      actionUrl: data.actionUrl,
      category: data.category,
      isRead: false,
      timestamp: new Date(),
    });

    // 2. Emit Real-time
    this.inAppNotificationService.emitNotification(data.userId, notification);

    return notification;
  }

  async getUserNotifications(userId: string, query: any) {
    const { page, limit, isRead, type } = query;
    const pagination = new PaginationDto();
    pagination.page = Number(page) || 1;
    pagination.limit = Number(limit) || 10;
    
    return this.notificationsRepository.findAll(userId, pagination, isRead, type);
  }

  async getUnreadCount(userId: string) {
    return { count: await this.notificationsRepository.countUnread(userId) };
  }

  async markAsRead(id: string, userId: string) {
    try {
      return await this.notificationsRepository.markAsRead(id, userId);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  async markAllAsRead(userId: string) {
    return this.notificationsRepository.markAllAsRead(userId);
  }

  async delete(id: string, userId: string) {
     try {
      return await this.notificationsRepository.delete(id, userId);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
}

