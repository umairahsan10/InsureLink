import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { AppGateway } from '../../../websockets/gateway';
import { NotificationType, Severity } from '@prisma/client';

@Injectable()
export class InAppNotificationService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly appGateway: AppGateway,
  ) {}

  async send(
    userId: string,
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
    // Persist to database
    const notification = await this.notificationsRepository.create({
      userId,
      ...data,
    });

    console.log(`[Notification] Sending notification to user ${userId}:`, {
      id: notification.id,
      title: notification.title,
      message: notification.message,
    });

    // Push via WebSocket
    this.appGateway.sendToUser(userId, 'notification', {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      severity: notification.severity,
      category: data.category ?? this.mapTypeToCategory(data.notificationType),
      timestamp: notification.timestamp.toISOString(),
      isRead: false,
    });

    return notification;
  }

  private mapTypeToCategory(type: NotificationType): string {
    const map: Record<NotificationType, string> = {
      [NotificationType.claim_status]: 'claims',
      [NotificationType.policy_update]: 'policies',
      [NotificationType.dependent_request]: 'dependents',
      [NotificationType.messaging_alert]: 'messaging',
    };
    return map[type] ?? 'general';
  }
}
