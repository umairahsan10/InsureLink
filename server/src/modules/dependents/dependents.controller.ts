import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { DependentsService } from './dependents.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { CreateDependentDto } from './dto/create-dependent.dto';
import { DependentResponseDto, PaginatedDependentsResponseDto } from './dto/dependent-response.dto';
import { ListDependentsQueryDto } from './dto/list-dependents-query.dto';
import { RejectDependentDto, UpdateDependentStatusDto } from './dto/review-dependent.dto';
import { UpdateDependentDto } from './dto/update-dependent.dto';

@Controller('dependents')
export class DependentsController {
  constructor(private readonly dependentsService: DependentsService) {}

  @Auth()
  @Roles('patient', 'corporate', 'admin')
  @Post()
  async createDependent(
    @Body() dto: CreateDependentDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<DependentResponseDto> {
    return this.dependentsService.createDependent(dto, actor);
  }

  @Auth()
  @Get(':id')
  async getDependentById(
    @Param('id') id: string,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<DependentResponseDto> {
    return this.dependentsService.getDependentById(id, actor);
  }

  @Auth()
  @Patch(':id')
  async updateDependent(
    @Param('id') id: string,
    @Body() dto: UpdateDependentDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<DependentResponseDto> {
    return this.dependentsService.updateDependent(id, dto, actor);
  }

  @Auth()
  @Get()
  async listDependents(
    @Query() query: ListDependentsQueryDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<PaginatedDependentsResponseDto> {
    return this.dependentsService.listDependents(query, actor);
  }

  @Auth()
  @Roles('corporate', 'admin')
  @Patch(':id/approve')
  async approveDependent(
    @Param('id') id: string,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<DependentResponseDto> {
    return this.dependentsService.approveDependent(id, actor);
  }

  @Auth()
  @Roles('corporate', 'admin')
  @Patch(':id/reject')
  async rejectDependent(
    @Param('id') id: string,
    @Body() dto: RejectDependentDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<DependentResponseDto> {
    return this.dependentsService.rejectDependent(id, dto, actor);
  }

  @Auth()
  @Roles('corporate', 'admin')
  @Patch(':id/status')
  async updateDependentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDependentStatusDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<DependentResponseDto> {
    return this.dependentsService.updateDependentStatus(id, dto, actor);
  }
}
