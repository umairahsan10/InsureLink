import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { MessageType, UserRole } from '@prisma/client';
import { ChatMessagesRepository } from './repositories/chat-messages.repository';
import { ChatAttachmentsRepository } from './repositories/chat-attachments.repository';
import { MessagingGateway } from './messaging.gateway';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { CurrentUserDto } from '../auth/dto/current-user.dto';

@Injectable()
export class MessagingService {
  /** Cache claim-access checks to avoid a DB join on every message send. */
  private readonly accessCache = new Map<string, true>();

  constructor(
    private readonly chatMessagesRepository: ChatMessagesRepository,
    private readonly chatAttachmentsRepository: ChatAttachmentsRepository,
    private readonly messagingGateway: MessagingGateway,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Send a message in a claim chat
   */
  async sendMessage(
    claimId: string,
    data: SendMessageDto,
    user: CurrentUserDto,
  ) {
    // Verify claim exists and user has access
    await this.verifyClaimAccess(claimId, user);

    const message = await this.chatMessagesRepository.create({
      claimId,
      senderId: user.id,
      receiverId: data.receiverId,
      messageText: data.messageText,
      messageType: data.messageType,
    });

    // Link pre-existing attachment records (by ID) if provided
    if (data.attachmentIds?.length) {
      for (const attachmentId of data.attachmentIds) {
        const attachment =
          await this.chatAttachmentsRepository.findById(attachmentId);
        if (attachment && !attachment.messageId) {
          await this.prisma.chatMessageAttachment.update({
            where: { id: attachmentId },
            data: { messageId: message.id },
          });
        }
      }
    }

    // Create attachment records from inline metadata (files uploaded by the client)
    if (data.attachments?.length) {
      await Promise.all(
        data.attachments.map((att) =>
          this.chatAttachmentsRepository.create({
            messageId: message.id,
            filename: att.filename,
            filePath: att.filePath,
            fileUrl: att.fileUrl,
            fileSizeBytes: att.fileSizeBytes,
          }),
        ),
      );
    }

    // Re-fetch to include all linked attachments
    if (data.attachmentIds?.length || data.attachments?.length) {
      const fullMessage = await this.chatMessagesRepository.findById(message.id);
      this.messagingGateway.emitNewMessage(claimId, fullMessage);
      return fullMessage;
    }

    // Emit WebSocket event
    this.messagingGateway.emitNewMessage(claimId, message);

    return message;
  }

  /**
   * Get paginated messages for a claim
   */
  async getMessages(
    claimId: string,
    page: number,
    limit: number,
    user: CurrentUserDto,
  ) {
    await this.verifyClaimAccess(claimId, user);

    // Run the read and the mark-as-read concurrently
    const [{ messages, total }, markedCount] = await Promise.all([
      this.chatMessagesRepository.findByClaimId(claimId, page, limit),
      this.chatMessagesRepository.markAsRead(claimId, user.id),
    ]);

    if (markedCount > 0) {
      this.messagingGateway.emitMessageRead(claimId, user.id, markedCount);
    }

    return {
      data: messages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      markedAsRead: markedCount,
    };
  }

  /**
   * Update (edit) a message — only sender can edit
   */
  async updateMessage(
    claimId: string,
    messageId: string,
    data: UpdateMessageDto,
    user: CurrentUserDto,
  ) {
    await this.verifyClaimAccess(claimId, user);

    const message = await this.chatMessagesRepository.findById(messageId);
    if (!message || message.claimId !== claimId) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== user.id) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (message.messageType === MessageType.system) {
      throw new BadRequestException('System messages cannot be edited');
    }

    return this.chatMessagesRepository.update(messageId, {
      messageText: data.messageText,
    });
  }

  /**
   * Delete a message — only sender can delete
   */
  async deleteMessage(
    claimId: string,
    messageId: string,
    user: CurrentUserDto,
  ) {
    await this.verifyClaimAccess(claimId, user);

    const message = await this.chatMessagesRepository.findById(messageId);
    if (!message || message.claimId !== claimId) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== user.id) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    if (message.messageType === MessageType.system) {
      throw new BadRequestException('System messages cannot be deleted');
    }

    await this.chatMessagesRepository.delete(messageId);

    return {
      message: 'Message deleted successfully',
      messageId,
    };
  }

  /**
   * Mark all unread messages as read
   */
  async markAsRead(claimId: string, user: CurrentUserDto) {
    await this.verifyClaimAccess(claimId, user);

    const markedCount = await this.chatMessagesRepository.markAsRead(
      claimId,
      user.id,
    );

    if (markedCount > 0) {
      this.messagingGateway.emitMessageRead(claimId, user.id, markedCount);
    }

    return { markedCount };
  }

  /**
   * Get unread message count for a claim
   */
  async getUnreadCount(claimId: string, user: CurrentUserDto) {
    await this.verifyClaimAccess(claimId, user);

    const unreadCount = await this.chatMessagesRepository.getUnreadCount(
      claimId,
      user.id,
    );

    return { unreadCount };
  }

  /**
   * Verify the claim exists and the user (hospital or insurer) has access
   */
  private async verifyClaimAccess(claimId: string, user: CurrentUserDto) {
    const cacheKey = `${user.id}:${claimId}`;
    if (this.accessCache.has(cacheKey)) return;

    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      select: {
        id: true,
        insurerId: true,
        corporateId: true,
        hospitalVisitId: true,
        hospitalVisit: {
          select: {
            hospital: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    switch (user.role) {
      case UserRole.admin:
        break; // Admin can access all
      case UserRole.insurer:
        if (claim.insurerId !== user.organizationId) {
          throw new ForbiddenException('You do not have access to this claim');
        }
        break;
      case UserRole.hospital:
        if (claim.hospitalVisit?.hospital?.userId !== user.id) {
          throw new ForbiddenException('You do not have access to this claim');
        }
        break;
      default:
        throw new ForbiddenException('You do not have access to this claim');
    }

    // Access confirmed — cache so subsequent requests skip the DB query
    this.accessCache.set(cacheKey, true);
  }
}
