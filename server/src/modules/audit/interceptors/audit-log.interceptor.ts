import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AUDITABLE_KEY } from '../decorators/auditable.decorator';
import { AuditService } from '../audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const entityType = this.reflector.get<string>(
      AUDITABLE_KEY,
      context.getHandler(),
    );

    if (!entityType) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const userId = request.user?.id;
    const entityId = request.params?.id;

    return next.handle().pipe(
      tap({
        next: (responseData) => {
          // Fire-and-forget audit logging
          this.processAudit(
            method,
            entityType,
            entityId,
            userId,
            responseData,
          ).catch((err) => console.error('Audit logging failed:', err));
        },
      }),
    );
  }

  private async processAudit(
    method: string,
    entityType: string,
    entityId: string | undefined,
    userId: string | undefined,
    responseData: any,
  ) {
    // Extract the actual data from the response (may be wrapped)
    const data = responseData?.data ?? responseData;
    const resultId = entityId ?? data?.id;

    if (!resultId) return;

    switch (method) {
      case 'POST':
        await this.auditService.logCreate(entityType, resultId, userId, data);
        break;

      case 'PUT':
      case 'PATCH':
        // Log the status change if detectable from the response data
        const changes = this.extractChanges(data);
        if (changes.length > 0) {
          await this.auditService.logUpdate(
            entityType,
            resultId,
            userId,
            changes,
          );
        } else {
          await this.auditService.log(
            entityType,
            resultId,
            AuditAction.UPDATE,
            userId,
          );
        }
        break;

      case 'DELETE':
        await this.auditService.logDelete(entityType, resultId, userId, data);
        break;
    }
  }

  private extractChanges(
    data: any,
  ): Array<{ fieldName: string; oldValue?: string; newValue?: string }> {
    if (!data) return [];

    const changes: Array<{
      fieldName: string;
      oldValue?: string;
      newValue?: string;
    }> = [];

    // If response contains claimStatus, log it as a change
    if (data.claimStatus) {
      changes.push({
        fieldName: 'claimStatus',
        newValue: String(data.claimStatus),
      });
    }

    if (data.approvedAmount !== undefined && data.approvedAmount !== null) {
      changes.push({
        fieldName: 'approvedAmount',
        newValue: String(data.approvedAmount),
      });
    }

    return changes;
  }
}
