export class AuditQueryDto {
  entity?: string;
  userId?: number;
  startDate?: Date;
  endDate?: Date;
  action?: string;
}
