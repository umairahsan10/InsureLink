import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationType, Severity } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async createNotification(data: {
    userId: string;
    notificationType: NotificationType;
    title: string;
    message: string;
    severity?: Severity;
    relatedEntityId?: string;
    relatedEntityType?: string;
    actionUrl?: string;
    category?: string;
  }) {
    return this.notificationsRepository.create(data);
  }

  async createBulkNotifications(
    userIds: string[],
    data: {
      notificationType: NotificationType;
      title: string;
      message: string;
      severity?: Severity;
      relatedEntityId?: string;
      relatedEntityType?: string;
      actionUrl?: string;
      category?: string;
    },
  ) {
    const notifications = userIds.map((userId) => ({
      userId,
      ...data,
    }));
    return this.notificationsRepository.createMany(notifications);
  }

  async getUserNotifications(
    userId: string,
    filters: {
      notificationType?: NotificationType;
      isRead?: boolean;
      severity?: Severity;
    },
    page: number = 1,
    limit: number = 10,
  ) {
    return this.notificationsRepository.findByUserId(
      userId,
      filters,
      page,
      limit,
    );
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationsRepository.findById(id);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only mark your own notifications as read',
      );
    }
    return this.notificationsRepository.markAsRead(id);
  }

  async deleteNotification(id: string, userId: string) {
    const notification = await this.notificationsRepository.findById(id);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own notifications',
      );
    }
    return this.notificationsRepository.delete(id);
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationsRepository.getUnreadCount(userId);
    return { count };
  }
}
