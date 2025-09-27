import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailNotificationService } from './services/email-notification.service';
import { PushNotificationService } from './services/push-notification.service';
import { InAppNotificationService } from './services/in-app-notification.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EmailNotificationService,
    PushNotificationService,
    InAppNotificationService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}



