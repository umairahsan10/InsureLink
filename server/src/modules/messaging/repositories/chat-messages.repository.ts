import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { MessageType } from '@prisma/client';

@Injectable()
export class ChatMessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    claimId: string;
    senderId: string;
    receiverId?: string;
    messageText: string;
    messageType?: MessageType;
  }) {
    return this.prisma.chatMessage.create({
      data: {
        claimId: data.claimId,
        senderId: data.senderId,
        receiverId: data.receiverId ?? null,
        messageText: data.messageText,
        messageType: data.messageType ?? MessageType.text,
        timestamp: new Date(),
      },
      include: {
        sender: {
          select: { id: true, email: true, userRole: true },
        },
        attachments: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.chatMessage.findUnique({
      where: { id },
      include: {
        sender: {
          select: { id: true, email: true, userRole: true },
        },
        attachments: true,
      },
    });
  }

  async findByClaimId(claimId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { claimId },
        include: {
          sender: {
            select: { id: true, email: true, userRole: true },
          },
          attachments: true,
        },
        orderBy: { timestamp: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.chatMessage.count({ where: { claimId } }),
    ]);

    return { messages, total };
  }

  async update(id: string, data: { messageText: string }) {
    return this.prisma.chatMessage.update({
      where: { id },
      data: {
        messageText: data.messageText,
      },
      include: {
        sender: {
          select: { id: true, email: true, userRole: true },
        },
        attachments: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.chatMessage.delete({
      where: { id },
    });
  }

  /**
   * Mark all unread messages from others as read for a specific user in a claim
   */
  async markAsRead(claimId: string, readerId: string) {
    // Fast check first — skip the write entirely when nothing is unread
    const unreadCount = await this.prisma.chatMessage.count({
      where: { claimId, isRead: false, senderId: { not: readerId } },
    });
    if (unreadCount === 0) return 0;

    const result = await this.prisma.chatMessage.updateMany({
      where: {
        claimId,
        isRead: false,
        senderId: { not: readerId },
      },
      data: { isRead: true },
    });

    return result.count;
  }

  /**
   * Get count of unread messages for a user in a claim
   */
  async getUnreadCount(claimId: string, userId: string) {
    return this.prisma.chatMessage.count({
      where: {
        claimId,
        isRead: false,
        senderId: { not: userId },
      },
    });
  }
}
