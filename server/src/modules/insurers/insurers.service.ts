import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InsurersRepository } from './repositories/insurers.repository';
import { PlansRepository } from './repositories/plans.repository';
import { LabsRepository } from './repositories/labs.repository';
import { CreateInsurerDto } from './dto/create-insurer.dto';
import { UpdateInsurerDto } from './dto/update-insurer.dto';
import { CreatePlanDto, UpdatePlanDto } from './dto/create-plan.dto';
import { CreateLabDto, UpdateLabDto } from './dto/create-lab.dto';

@Injectable()
export class InsurersService {
  constructor(
    private readonly insurersRepository: InsurersRepository,
    private readonly plansRepository: PlansRepository,
    private readonly labsRepository: LabsRepository,
  ) {}

  // Helper to convert Prisma Decimal to number
  private convertPlanDecimal(plan: any) {
    return {
      ...plan,
      sumInsured: plan.sumInsured
        ? parseFloat(String(plan.sumInsured))
        : plan.sumInsured,
    };
  }

  private convertPlansDecimal(plans: any[]) {
    return plans.map((plan) => this.convertPlanDecimal(plan));
  }

  // Helper to convert Insurer Decimal fields to numbers
  private convertInsurerDecimal(insurer: any) {
    return {
      ...insurer,
      maxCoverageLimit: insurer.maxCoverageLimit
        ? parseFloat(String(insurer.maxCoverageLimit))
        : insurer.maxCoverageLimit,
      plans: insurer.plans
        ? this.convertPlansDecimal(insurer.plans)
        : insurer.plans,
    };
  }

  // ============== Insurer CRUD ==============

  async create(userId: string, data: CreateInsurerDto) {
    const existingInsurer = await this.insurersRepository.findByLicenseNumber(
      data.licenseNumber,
    );
    if (existingInsurer) {
      throw new BadRequestException(
        'Insurer with this license number already exists',
      );
    }
    const created = await this.insurersRepository.create({ ...data, userId });
    return this.convertInsurerDecimal(created);
  }

  async findById(id: string) {
    const insurer = await this.insurersRepository.findById(id);
    if (!insurer) {
      throw new NotFoundException(`Insurer with id ${id} not found`);
    }
    return this.convertInsurerDecimal(insurer);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    city?: string,
    status?: string,
    sortBy: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ) {
    const result = await this.insurersRepository.findAll(
      page,
      limit,
      city,
      status,
      sortBy,
      order,
    );
    return {
      ...result,
      insurers: result.insurers.map((insurer) =>
        this.convertInsurerDecimal(insurer),
      ),
    };
  }

  async update(id: string, data: UpdateInsurerDto) {
    const insurer = await this.insurersRepository.findByIdSimple(id);
    if (!insurer) {
      throw new NotFoundException(`Insurer with id ${id} not found`);
    }

    const updated = await this.insurersRepository.update(id, data);
    return this.convertInsurerDecimal(updated);
  }

  // ============== Plan CRUD ==============

  async createPlan(insurerId: string, data: CreatePlanDto) {
    const insurer = await this.insurersRepository.findByIdSimple(insurerId);
    if (!insurer) {
      throw new NotFoundException(`Insurer with id ${insurerId} not found`);
    }

    // Check plan code uniqueness
    const existingPlan = await this.plansRepository.findByPlanCode(
      data.planCode,
    );
    if (existingPlan) {
      throw new BadRequestException(
        `Plan with code '${data.planCode}' already exists`,
      );
    }

    const plan = await this.plansRepository.create(insurerId, data);
    return this.convertPlanDecimal(plan);
  }

  async getPlans(insurerId: string, isActive?: boolean) {
    const insurer = await this.insurersRepository.findByIdSimple(insurerId);
    if (!insurer) {
      throw new NotFoundException(`Insurer with id ${insurerId} not found`);
    }
    const plans = await this.plansRepository.findByInsurerId(
      insurerId,
      isActive,
    );
    return this.convertPlansDecimal(plans);
  }

  async getPlanById(planId: string) {
    const plan = await this.plansRepository.findById(planId);
    if (!plan) {
      throw new NotFoundException(`Plan with id ${planId} not found`);
    }
    return this.convertPlanDecimal(plan);
  }

  async updatePlan(planId: string, data: UpdatePlanDto) {
    const plan = await this.plansRepository.findByIdSimple(planId);
    if (!plan) {
      throw new NotFoundException(`Plan with id ${planId} not found`);
    }
    const updated = await this.plansRepository.update(planId, data);
    return this.convertPlanDecimal(updated);
  }

  async deletePlan(planId: string) {
    const plan = await this.plansRepository.findByIdSimple(planId);
    if (!plan) {
      throw new NotFoundException(`Plan with id ${planId} not found`);
    }
    return this.plansRepository.delete(planId);
  }

  // ============== Lab CRUD ==============

  async createLab(insurerId: string, data: CreateLabDto) {
    const insurer = await this.insurersRepository.findByIdSimple(insurerId);
    if (!insurer) {
      throw new NotFoundException(`Insurer with id ${insurerId} not found`);
    }

    const existingLab = await this.labsRepository.findByLicenseNumber(
      data.licenseNumber,
    );
    if (existingLab) {
      throw new BadRequestException(
        'Lab with this license number already exists',
      );
    }

    return this.labsRepository.create(insurerId, data);
  }

  async getLabs(insurerId: string, isActive?: boolean) {
    const insurer = await this.insurersRepository.findByIdSimple(insurerId);
    if (!insurer) {
      throw new NotFoundException(`Insurer with id ${insurerId} not found`);
    }
    return this.labsRepository.findByInsurerId(insurerId, isActive);
  }

  async getLabById(labId: string) {
    const lab = await this.labsRepository.findById(labId);
    if (!lab) {
      throw new NotFoundException(`Lab with id ${labId} not found`);
    }
    return lab;
  }

  async updateLab(labId: string, data: UpdateLabDto) {
    const lab = await this.labsRepository.findByIdSimple(labId);
    if (!lab) {
      throw new NotFoundException(`Lab with id ${labId} not found`);
    }
    return this.labsRepository.update(labId, data);
  }

  async deleteLab(labId: string) {
    const lab = await this.labsRepository.findByIdSimple(labId);
    if (!lab) {
      throw new NotFoundException(`Lab with id ${labId} not found`);
    }
    return this.labsRepository.delete(labId);
  }
}
