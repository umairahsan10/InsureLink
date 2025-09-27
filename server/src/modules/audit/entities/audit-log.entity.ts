// AuditLog model will be defined in Prisma schema
export interface AuditLog {
  id: number;
  action: string;
  entity: string;
  entityId: number;
  userId: number;
  timestamp: Date;
  changes: any;
}
