import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    entityType: string;
    entityId: string;
    userId?: string;
    action: AuditAction;
    fieldName?: string;
    oldValue?: string;
    newValue?: string;
    changeReason?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        ...data,
        timestamp: new Date(),
      },
    });
  }

  async createMany(
    entries: Array<{
      entityType: string;
      entityId: string;
      userId?: string;
      action: AuditAction;
      fieldName?: string;
      oldValue?: string;
      newValue?: string;
      changeReason?: string;
    }>,
  ) {
    return this.prisma.auditLog.createMany({
      data: entries.map((entry) => ({
        ...entry,
        timestamp: new Date(),
      })),
    });
  }

  async findAll(
    filters: {
      entityType?: string;
      entityId?: string;
      userId?: string;
      action?: AuditAction;
      startDate?: Date;
      endDate?: Date;
    },
    page: number = 1,
    limit: number = 20,
  ) {
    const where: any = {};

    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { data, total, page, limit, totalPages };
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const where = { entityType, entityId };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { data, total, page, limit, totalPages };
  }
}
