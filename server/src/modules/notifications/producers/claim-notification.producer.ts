import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
// import { PrismaService } from '../../../common/prisma/prisma.service';
import { NotificationType, ClaimStatus } from '@prisma/client';

@Injectable()
export class ClaimNotificationProducer {
  private readonly logger = new Logger(ClaimNotificationProducer.name);

  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent('claim.status.changed')
  async handleClaimStatusChanged(payload: any) {
    const { claim, previousStatus } = payload;
    const currentStatus = claim.claimStatus;
    
    this.logger.log(`Processing notification for claim ${claim.id}: ${previousStatus} -> ${currentStatus}`);

    // Assuming payload has hospitalUserId or we can derive it.
    // Ideally the Claim object includes relations if fetched correctly in ClaimsService.
    const hospitalUserId = claim.hospitalVisit?.hospital?.userId;

    if (!hospitalUserId) {
        this.logger.warn(`Could not determine hospital userId for claim ${claim.id}`);
        return;
    }

    if (currentStatus === ClaimStatus.Approved) {
        await this.notificationsService.sendNotification({
            userId: hospitalUserId,
            notificationType: NotificationType.claim_status, // Ensure enum match
            title: 'Claim Approved',
            message: `Claim #${claim.claimNumber} has been approved.`,
            category: 'Claims',
            severity: 'info',
            relatedEntityId: claim.id,
            relatedEntityType: 'Claim',
            actionUrl: `/claims/${claim.id}`,
        } as any);
    } else if (currentStatus === ClaimStatus.Rejected) {
         await this.notificationsService.sendNotification({
            userId: hospitalUserId,
            notificationType: NotificationType.claim_status, // Ensure enum match
            title: 'Claim Rejected',
            message: `Claim #${claim.claimNumber} has been rejected.`,
            category: 'Claims',
            severity: 'warning',
            relatedEntityId: claim.id,
            relatedEntityType: 'Claim',
            actionUrl: `/claims/${claim.id}`,
        } as any);
    }
  }
}

