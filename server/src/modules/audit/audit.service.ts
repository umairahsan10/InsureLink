import { Injectable } from '@nestjs/common';
import { AuditLogsRepository } from './repositories/audit-logs.repository';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  async log(
    entityType: string,
    entityId: string,
    action: AuditAction,
    userId?: string,
    changes?: Array<{
      fieldName: string;
      oldValue?: string;
      newValue?: string;
    }>,
    changeReason?: string,
  ) {
    if (action === AuditAction.UPDATE && changes && changes.length > 0) {
      // One row per changed field
      const entries = changes.map((change) => ({
        entityType,
        entityId,
        userId,
        action,
        fieldName: change.fieldName,
        oldValue: change.oldValue,
        newValue: change.newValue,
        changeReason,
      }));
      return this.auditLogsRepository.createMany(entries);
    }

    // Single row for CREATE/DELETE/RESTORE
    return this.auditLogsRepository.create({
      entityType,
      entityId,
      userId,
      action,
      changeReason,
    });
  }

  async logCreate(
    entityType: string,
    entityId: string,
    userId?: string,
    newValue?: any,
  ) {
    return this.auditLogsRepository.create({
      entityType,
      entityId,
      userId,
      action: AuditAction.CREATE,
      newValue: newValue ? JSON.stringify(newValue) : undefined,
    });
  }

  async logUpdate(
    entityType: string,
    entityId: string,
    userId?: string,
    changes?: Array<{
      fieldName: string;
      oldValue?: string;
      newValue?: string;
    }>,
  ) {
    return this.log(entityType, entityId, AuditAction.UPDATE, userId, changes);
  }

  async logDelete(
    entityType: string,
    entityId: string,
    userId?: string,
    oldValue?: any,
  ) {
    return this.auditLogsRepository.create({
      entityType,
      entityId,
      userId,
      action: AuditAction.DELETE,
      oldValue: oldValue ? JSON.stringify(oldValue) : undefined,
    });
  }

  async getLogs(
    filters: {
      entityType?: string;
      userId?: string;
      action?: AuditAction;
      startDate?: Date;
      endDate?: Date;
    },
    page: number = 1,
    limit: number = 20,
  ) {
    return this.auditLogsRepository.findAll(filters, page, limit);
  }

  async getEntityHistory(
    entityType: string,
    entityId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    return this.auditLogsRepository.findByEntity(
      entityType,
      entityId,
      page,
      limit,
    );
  }
}
