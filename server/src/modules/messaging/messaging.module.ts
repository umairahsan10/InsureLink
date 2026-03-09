import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging.gateway';
import { ChatMessagesRepository } from './repositories/chat-messages.repository';
import { ChatAttachmentsRepository } from './repositories/chat-attachments.repository';
import { FileUploadModule } from '../file-upload/file-upload.module';

@Module({
  imports: [FileUploadModule],
  controllers: [MessagingController],
  providers: [
    MessagingService,
    MessagingGateway,
    ChatMessagesRepository,
    ChatAttachmentsRepository,
  ],
  exports: [MessagingService, MessagingGateway],
})
export class MessagingModule {}
