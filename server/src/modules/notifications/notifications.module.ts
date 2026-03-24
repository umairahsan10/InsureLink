import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './repositories/notifications.repository';
import { EmailNotificationService } from './services/email-notification.service';
import { PushNotificationService } from './services/push-notification.service';
import { InAppNotificationService } from './services/in-app-notification.service';
import { ClaimNotificationProducer } from './producers/claim-notification.producer';
import { DependentNotificationProducer } from './producers/dependent-notification.producer';
import { WebsocketsModule } from '../../websockets/websockets.module';

@Module({
  imports: [WebsocketsModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    EmailNotificationService,
    PushNotificationService,
    InAppNotificationService,
    ClaimNotificationProducer,
    DependentNotificationProducer,
  ],
  exports: [NotificationsService, InAppNotificationService],
})
export class NotificationsModule {}



