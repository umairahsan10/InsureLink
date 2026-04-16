import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { InAppNotificationService } from '../services/in-app-notification.service';
import { NotificationType, Severity } from '@prisma/client';
import { DependentApprovedTemplate } from '../templates/dependent-approved.template';
import { DependentRejectedTemplate } from '../templates/dependent-rejected.template';

export interface DependentApprovedEvent {
  dependentId: string;
  employeeId: string;
  dependentName: string;
  approverId: string;
  approverEmail: string;
}

export interface DependentRejectedEvent {
  dependentId: string;
  employeeId: string;
  dependentName: string;
  reason?: string;
}

@Injectable()
export class DependentNotificationProducer {
  private readonly logger = new Logger(DependentNotificationProducer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inAppNotificationService: InAppNotificationService,
  ) {}

  @OnEvent('dependent.approved')
  async handleDependentApproved(event: DependentApprovedEvent) {
    try {
      this.logger.debug(
        `dependent.approved received: dependentId=${event.dependentId} employeeId=${event.employeeId}`,
      );

      const [employee, approver] = await Promise.all([
        this.prisma.employee.findUnique({
          where: { id: event.employeeId },
          select: { userId: true },
        }),
        this.prisma.user.findUnique({
          where: { id: event.approverId },
          select: { firstName: true, lastName: true, email: true },
        }),
      ]);

      if (!employee?.userId) {
        this.logger.warn(
          `Employee not found for dependent approval: ${event.employeeId}`,
        );
        return;
      }

      const approverName = approver
        ? `${approver.firstName} ${approver.lastName}`.trim()
        : 'Administrator';

      await this.inAppNotificationService.send(employee.userId, {
        notificationType: NotificationType.dependent_request,
        title: 'Dependent Approved',
        message: DependentApprovedTemplate.generate({
          dependentName: event.dependentName,
          approverName,
        }),
        severity: Severity.info,
        relatedEntityId: event.dependentId,
        relatedEntityType: 'Dependent',
        actionUrl: '/patient/profile',
        category: 'dependents',
      });
    } catch (err) {
      this.logger.error(
        'Failed to process dependent approval notification',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  @OnEvent('dependent.rejected')
  async handleDependentRejected(event: DependentRejectedEvent) {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: event.employeeId },
        select: { userId: true },
      });

      if (!employee?.userId) return;

      await this.inAppNotificationService.send(employee.userId, {
        notificationType: NotificationType.dependent_request,
        title: 'Dependent Rejected',
        message: DependentRejectedTemplate.generate({
          dependentName: event.dependentName,
          reason: event.reason,
        }),
        severity: Severity.warning,
        relatedEntityId: event.dependentId,
        relatedEntityType: 'Dependent',
        actionUrl: '/patient/profile',
        category: 'dependents',
      });
    } catch (err) {
      this.logger.error(
        'Failed to process dependent rejection notification',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
