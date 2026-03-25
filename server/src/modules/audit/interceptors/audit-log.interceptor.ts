import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../audit.service';
import { AUDITABLE_KEY } from '../decorators/auditable.decorator';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditableAction = this.reflector.get<string>(
      AUDITABLE_KEY,
      context.getHandler(),
    );

    if (!auditableAction) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const body = request.body;
    const params = request.params;
    const method = request.method;

    return next.handle().pipe(
      tap(async (response) => {
        try {
          // Identify the entity ID based on route params or response
          // Often ID is in params.id or response.data.id
          let entityId = params.id;
          if (!entityId && response && response.data && response.data.id) {
            entityId = response.data.id;
          }

          // Identify entity type from URL
          const urlParts = request.url.split('/').filter((p) => p.length > 0);
          // e.g. /api/v1/claims/123 -> ['api', 'v1', 'claims', '123']
          // find resource name in known list
          const knownResources = [
            'claims',
            'hospitals',
            'insurers',
            'users',
            'corporates',
            'dependents',
            'patients',
            'plans',
            'policies',
            'notifications',
          ];
          const resource = urlParts.find((p) => knownResources.includes(p)) || 'Unknown';
          
          const entityType = resource.charAt(0).toUpperCase() + resource.slice(1, -1); // claims -> Claim

          // Skip if no valid entityId (must be UUID)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!entityId || !uuidRegex.test(entityId)) {
             // Try to find in body for POST
             if (request.method === 'POST' && response && response.data && response.data.id) {
                 entityId = response.data.id;
             }
             
             if (!entityId || !uuidRegex.test(entityId)) {
                 this.logger.warn(`Skipping audit log: invalid or missing entity ID for ${resource}`);
                 return;
             }
          }

          await this.auditService.log({
            userId: user ? user.sub : undefined,
            action: this.mapMethodToAction(method, auditableAction),
            entityType: entityType,
            entityId: entityId,
            newValue: method !== 'DELETE' ? JSON.stringify(body) : undefined,
            changeReason: 'API Request',
          });
        } catch (error) {
          this.logger.error(`Failed to log audit entry: ${error.message}`);
        }
      }),
    );
  }

  private mapMethodToAction(method: string, decoratedAction: string): AuditAction {
      if (decoratedAction) {
          // You might map specific strings to AuditAction enum
          if (decoratedAction === 'CREATE') return AuditAction.CREATE;
          if (decoratedAction === 'UPDATE') return AuditAction.UPDATE;
          if (decoratedAction === 'DELETE') return AuditAction.DELETE;
          if (decoratedAction === 'RESTORE') return AuditAction.RESTORE;
      }

      switch (method) {
          case 'POST': return AuditAction.CREATE;
          case 'PUT':
          case 'PATCH': return AuditAction.UPDATE;
          case 'DELETE': return AuditAction.DELETE;
          default: return AuditAction.UPDATE;
      }
  }
}

