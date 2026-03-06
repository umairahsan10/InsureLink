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
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
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
  @Roles('insurer')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() data: CreateInsurerDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.insurersService.create(user.id, data);
  }

  @Get()
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
  @Roles('insurer')
  async updatePlan(
    @Param('planId') planId: string,
    @Body() data: UpdatePlanDto,
  ) {
    return this.insurersService.updatePlan(planId, data);
  }

  @Delete('plans/:planId')
  @Roles('insurer')
  async deletePlan(@Param('planId') planId: string) {
    return this.insurersService.deletePlan(planId);
  }

  // ============== Lab Endpoints (static routes before :id) ==============

  @Get('labs/:labId')
  async getLabById(@Param('labId') labId: string) {
    return this.insurersService.getLabById(labId);
  }

  @Patch('labs/:labId')
  @Roles('insurer')
  async updateLab(@Param('labId') labId: string, @Body() data: UpdateLabDto) {
    return this.insurersService.updateLab(labId, data);
  }

  @Delete('labs/:labId')
  @Roles('insurer')
  async deleteLab(@Param('labId') labId: string) {
    return this.insurersService.deleteLab(labId);
  }

  // ============== Parameterized :id Endpoints ==============

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.insurersService.findById(id);
  }

  @Patch(':id')
  @Roles('insurer')
  async update(@Param('id') id: string, @Body() data: UpdateInsurerDto) {
    return this.insurersService.update(id, data);
  }

  @Post(':id/plans')
  @Roles('insurer')
  @HttpCode(HttpStatus.CREATED)
  async createPlan(
    @Param('id') insurerId: string,
    @Body() data: CreatePlanDto,
  ) {
    return this.insurersService.createPlan(insurerId, data);
  }

  @Get(':id/plans')
  async getPlans(
    @Param('id') insurerId: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBool =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.insurersService.getPlans(insurerId, isActiveBool);
  }

  @Post(':id/labs')
  @Roles('insurer')
  @HttpCode(HttpStatus.CREATED)
  async createLab(@Param('id') insurerId: string, @Body() data: CreateLabDto) {
    return this.insurersService.createLab(insurerId, data);
  }

  @Get(':id/labs')
  async getLabs(
    @Param('id') insurerId: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBool =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.insurersService.getLabs(insurerId, isActiveBool);
  }
}
