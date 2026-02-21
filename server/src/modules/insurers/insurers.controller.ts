import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InsurersService } from './insurers.service';
import { Public } from '../../common/decorators/public.decorator';
import { CreateInsurerDto } from './dto/create-insurer.dto';
import { UpdateInsurerDto } from './dto/update-insurer.dto';
import { CreatePlanDto, UpdatePlanDto } from './dto/create-plan.dto';
import { CreateLabDto, UpdateLabDto } from './dto/create-lab.dto';
import { PaginationDto } from '../../shared/dtos/pagination.dto';

@Controller({ path: 'insurers', version: '1' })
@UseInterceptors(ClassSerializerInterceptor)
export class InsurersController {
  constructor(private readonly insurersService: InsurersService) {}

  // ============== Insurer Endpoints ==============

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: CreateInsurerDto) {
    return this.insurersService.create(data.userId, data);
  }

  @Get()
  @Public()
  async findAll(@Query() pagination: PaginationDto) {
    return this.insurersService.findAll(
      pagination.page,
      pagination.limit,
      pagination.city,
      pagination.status,
      pagination.sortBy,
      pagination.order,
    );
  }

  // ============== Plan Endpoints (static routes before :id) ==============

  @Patch('plans/:planId')
  @Public()
  async updatePlan(
    @Param('planId') planId: string,
    @Body() data: UpdatePlanDto,
  ) {
    return this.insurersService.updatePlan(planId, data);
  }

  @Delete('plans/:planId')
  @Public()
  async deletePlan(@Param('planId') planId: string) {
    return this.insurersService.deletePlan(planId);
  }

  // ============== Lab Endpoints (static routes before :id) ==============

  @Get('labs/:labId')
  @Public()
  async getLabById(@Param('labId') labId: string) {
    return this.insurersService.getLabById(labId);
  }

  // ============== Parameterized :id Endpoints ==============

  @Get(':id')
  @Public()
  async findById(@Param('id') id: string) {
    return this.insurersService.findById(id);
  }

  @Patch(':id')
  @Public()
  async update(@Param('id') id: string, @Body() data: UpdateInsurerDto) {
    return this.insurersService.update(id, data);
  }

  @Post(':id/plans')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async createPlan(
    @Param('id') insurerId: string,
    @Body() data: CreatePlanDto,
  ) {
    return this.insurersService.createPlan(insurerId, data);
  }

  @Get(':id/plans')
  @Public()
  async getPlans(
    @Param('id') insurerId: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBool =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.insurersService.getPlans(insurerId, isActiveBool);
  }

  @Post(':id/labs')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async createLab(@Param('id') insurerId: string, @Body() data: CreateLabDto) {
    return this.insurersService.createLab(insurerId, data);
  }

  @Get(':id/labs')
  @Public()
  async getLabs(
    @Param('id') insurerId: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBool =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.insurersService.getLabs(insurerId, isActiveBool);
  }
}
