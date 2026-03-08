import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ClaimEvent, ClaimEventStatus } from '@prisma/client';
import { ClaimAction } from '../constants/status-transitions';

export interface CreateClaimEventData {
  claimId: string;
  actorUserId?: string;
  actorName: string;
  actorRole: string;
  action: ClaimAction;
  statusFrom?: ClaimEventStatus;
  statusTo: ClaimEventStatus;
  eventNote?: string;
}

@Injectable()
export class ClaimEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new claim event
   */
  async create(data: CreateClaimEventData): Promise<ClaimEvent> {
    return this.prisma.claimEvent.create({
      data: {
        claimId: data.claimId,
        actorUserId: data.actorUserId,
        actorName: data.actorName,
        actorRole: data.actorRole,
        action: data.action,
        statusFrom: data.statusFrom,
        statusTo: data.statusTo,
        eventNote: data.eventNote,
        timestamp: new Date(),
      },
    });
  }

  /**
   * Find all events for a claim
   */
  async findByClaimId(
    claimId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ events: ClaimEvent[]; total: number }> {
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      this.prisma.claimEvent.findMany({
        where: { claimId },
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.claimEvent.count({ where: { claimId } }),
    ]);

    return { events, total };
  }

  /**
   * Find latest event for a claim
   */
  async findLatestByClaimId(claimId: string): Promise<ClaimEvent | null> {
    return this.prisma.claimEvent.findFirst({
      where: { claimId },
      orderBy: { timestamp: 'desc' },
    });
  }
}
