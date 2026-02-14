import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Plan } from '@prisma/client';
import { CreatePlanDto, UpdatePlanDto } from '../dto/create-plan.dto';

@Injectable()
export class PlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(insurerId: string, data: CreatePlanDto): Promise<Plan> {
    return this.prisma.plan.create({
      data: {
        insurerId,
        planName: data.planName,
        planCode: data.planCode,
        sumInsured: data.sumInsured,
        coveredServices: data.coveredServices,
        serviceLimits: data.serviceLimits,
        isActive: data.isActive ?? true,
      },
    });
  }

  async findById(id: string): Promise<Plan | null> {
    return this.prisma.plan.findUnique({
      where: { id },
      include: {
        insurer: true,
        _count: {
          select: {
            employees: true,
            claims: true,
          },
        },
      },
    });
  }

  async findByInsurerId(
    insurerId: string,
    isActive?: boolean,
  ): Promise<Plan[]> {
    return this.prisma.plan.findMany({
      where: {
        insurerId,
        ...(typeof isActive !== 'undefined' && { isActive }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            employees: true,
            claims: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdatePlanDto): Promise<Plan> {
    return this.prisma.plan.update({
      where: { id },
      data: {
        ...(data.planName && { planName: data.planName }),
        ...(data.sumInsured && { sumInsured: data.sumInsured }),
        ...(data.coveredServices && { coveredServices: data.coveredServices }),
        ...(data.serviceLimits && { serviceLimits: data.serviceLimits }),
        ...(typeof data.isActive !== 'undefined' && {
          isActive: data.isActive,
        }),
      },
    });
  }

  async delete(id: string): Promise<Plan> {
    return this.prisma.plan.delete({
      where: { id },
    });
  }

  async findByPlanCode(planCode: string): Promise<Plan | null> {
    return this.prisma.plan.findUnique({
      where: { planCode },
    });
  }
}
