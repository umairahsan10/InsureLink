import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { Prisma, AuditLog } from '@prisma/client';
import { PaginationDto } from '../../shared/dtos/pagination.dto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: CreateAuditLogDto): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        ...data,
        timestamp: new Date(),
      },
    });
  }

  async getLogs(params: {
    page?: number;
    limit?: number;
    entityType?: string;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: AuditLog[]; total: number }> {
    const { page = 1, limit = 20, entityType, action, userId, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      ...(entityType ? { entityType } : {}),
      ...(action ? { action: action as any } : {}),
      ...(userId ? { userId } : {}),
      ...(startDate && endDate
        ? {
            timestamp: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: +limit,
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { email: true, userRole: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total };
  }

  async getEntityHistory(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { timestamp: 'desc' },
        include: { user: { select: { email: true, userRole: true } } },
    });
  }
}

