import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { NotificationType, Severity } from '@prisma/client';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
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
    return this.prisma.notification.create({
      data: {
        ...data,
        severity: data.severity ?? Severity.info,
        timestamp: new Date(),
      },
    });
  }

  async createMany(
    notifications: Array<{
      userId: string;
      notificationType: NotificationType;
      title: string;
      message: string;
      severity?: Severity;
      relatedEntityId?: string;
      relatedEntityType?: string;
      actionUrl?: string;
      category?: string;
    }>,
  ) {
    return this.prisma.notification.createMany({
      data: notifications.map((n) => ({
        ...n,
        severity: n.severity ?? Severity.info,
        timestamp: new Date(),
      })),
    });
  }

  async findByUserId(
    userId: string,
    filters: {
      notificationType?: NotificationType;
      isRead?: boolean;
      severity?: Severity;
    },
    page: number = 1,
    limit: number = 10,
  ) {
    const where: any = { userId };

    if (filters.notificationType) {
      where.notificationType = filters.notificationType;
    }
    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }
    if (filters.severity) {
      where.severity = filters.severity;
    }

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findById(id: string) {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async delete(id: string) {
    return this.prisma.notification.delete({ where: { id } });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}
