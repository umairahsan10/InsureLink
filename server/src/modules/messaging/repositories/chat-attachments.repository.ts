import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class ChatAttachmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    messageId: string;
    filename: string;
    filePath: string;
    fileUrl: string;
    fileSizeBytes: number;
  }) {
    return this.prisma.chatMessageAttachment.create({
      data,
    });
  }

  async findById(id: string) {
    return this.prisma.chatMessageAttachment.findUnique({
      where: { id },
    });
  }

  async findByMessageId(messageId: string) {
    return this.prisma.chatMessageAttachment.findMany({
      where: { messageId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async delete(id: string) {
    return this.prisma.chatMessageAttachment.delete({
      where: { id },
    });
  }

  async deleteByMessageId(messageId: string) {
    return this.prisma.chatMessageAttachment.deleteMany({
      where: { messageId },
    });
  }
}
