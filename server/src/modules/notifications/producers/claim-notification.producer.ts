import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { InAppNotificationService } from '../services/in-app-notification.service';
import { NotificationType, Severity, ClaimStatus } from '@prisma/client';
import { ClaimApprovedTemplate } from '../templates/claim-approved.template';
import { ClaimRejectedTemplate } from '../templates/claim-rejected.template';
import { ClaimOnHoldTemplate } from '../templates/claim-on-hold.template';
import { ClaimSubmittedTemplate } from '../templates/claim-submitted.template';
import { PaymentProcessedTemplate } from '../templates/payment-processed.template';

export interface ClaimStatusChangedEvent {
  claimId: string;
  claimNumber: string;
  statusFrom: ClaimStatus;
  statusTo: ClaimStatus;
  actorUserId: string;
  actorRole: string;
  approvedAmount?: number;
  eventNote?: string;
}

@Injectable()
export class ClaimNotificationProducer {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inAppNotificationService: InAppNotificationService,
  ) {}

  @OnEvent('claim.status_changed')
  async handleClaimStatusChanged(event: ClaimStatusChangedEvent) {
    try {
      // Look up claim relations to find recipient users
      const claim = await this.prisma.claim.findUnique({
        where: { id: event.claimId },
        select: {
          id: true,
          claimNumber: true,
          amountClaimed: true,
          approvedAmount: true,
          corporateId: true,
          insurerId: true,
          hospitalVisit: {
            select: {
              hospital: {
                select: { userId: true },
              },
            },
          },
          corporate: {
            select: { userId: true },
          },
          insurer: {
            select: { userId: true },
          },
        },
      });

      if (!claim) return;

      const { title, message, severity, recipientUserIds } =
        this.buildNotificationData(event, claim);

      // Send notification to each recipient
      for (const userId of recipientUserIds) {
        if (!userId || userId === event.actorUserId) continue;
        await this.inAppNotificationService.send(userId, {
          notificationType: NotificationType.claim_status,
          title,
          message,
          severity,
          relatedEntityId: event.claimId,
          relatedEntityType: 'Claim',
          actionUrl: `/claims/${event.claimId}`,
          category: 'claims',
        });
      }
    } catch (err) {
      console.error('Failed to process claim notification:', err);
    }
  }

  private buildNotificationData(
    event: ClaimStatusChangedEvent,
    claim: any,
  ): {
    title: string;
    message: string;
    severity: Severity;
    recipientUserIds: string[];
  } {
    const corporateUserId = claim.corporate?.userId;
    const insurerUserId = claim.insurer?.userId;
    const hospitalUserId = claim.hospitalVisit?.hospital?.userId;

    switch (event.statusTo) {
      case ClaimStatus.Approved:
        return {
          title: 'Claim Approved',
          message: ClaimApprovedTemplate.generate({
            claimNumber: event.claimNumber,
            amount: event.approvedAmount ?? Number(claim.approvedAmount),
          }),
          severity: Severity.info,
          recipientUserIds: [corporateUserId, hospitalUserId],
        };

      case ClaimStatus.Rejected:
        return {
          title: 'Claim Rejected',
          message: ClaimRejectedTemplate.generate({
            claimNumber: event.claimNumber,
            reason: event.eventNote,
          }),
          severity: Severity.warning,
          recipientUserIds: [corporateUserId, hospitalUserId],
        };

      case ClaimStatus.OnHold:
        return {
          title: 'Claim On Hold',
          message: ClaimOnHoldTemplate.generate({
            claimNumber: event.claimNumber,
            reason: event.eventNote,
          }),
          severity: Severity.warning,
          recipientUserIds: [corporateUserId, hospitalUserId],
        };

      case ClaimStatus.Paid:
        return {
          title: 'Payment Processed',
          message: PaymentProcessedTemplate.generate({
            amount: event.approvedAmount ?? Number(claim.approvedAmount),
          }),
          severity: Severity.info,
          recipientUserIds: [corporateUserId, hospitalUserId],
        };

      case ClaimStatus.Pending:
        return {
          title: 'New Claim Submitted',
          message: ClaimSubmittedTemplate.generate({
            claimNumber: event.claimNumber,
            amount: Number(claim.amountClaimed),
          }),
          severity: Severity.info,
          recipientUserIds: [insurerUserId],
        };

      default:
        return {
          title: 'Claim Updated',
          message: `Claim ${event.claimNumber} status changed to ${event.statusTo}`,
          severity: Severity.info,
          recipientUserIds: [corporateUserId, insurerUserId, hospitalUserId],
        };
    }
  }
}
