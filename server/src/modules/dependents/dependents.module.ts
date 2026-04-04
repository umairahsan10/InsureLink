import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DependentsController } from './dependents.controller';
import { DependentsService } from './dependents.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [DependentsController],
  providers: [DependentsService],
  exports: [DependentsService],
})
export class DependentsModule {}
