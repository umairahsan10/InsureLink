import { Injectable } from '@nestjs/common';
import { AppGateway } from '../../../websockets/gateway';
import { Notification } from '@prisma/client';

@Injectable()
export class InAppNotificationService {
  constructor(private readonly gateway: AppGateway) {}

  emitNotification(userId: string, notification: Notification) {
    // In a real app, we'd map userId to socketId
    // For now, we'll just emit to a room named after the userId
    this.gateway.server.to(`user:${userId}`).emit('notification', notification);
  }
}

