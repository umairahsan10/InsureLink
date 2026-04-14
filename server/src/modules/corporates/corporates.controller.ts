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
import { CorporatesService } from './corporates.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import {
  CorporateResponseDto,
  CorporateStatsResponseDto,
  PaginatedCorporateResponseDto,
} from './dto/corporate-response.dto';
import { CreateCorporateDto } from './dto/create-corporate.dto';
import { ListCorporatesQueryDto } from './dto/list-corporates-query.dto';
import { UpdateCorporateStatusDto } from './dto/update-corporate-status.dto';
import { UpdateCorporateDto } from './dto/update-corporate.dto';

@Controller('corporates')
export class CorporatesController {
  constructor(private readonly corporatesService: CorporatesService) {}

  @Auth()
  @Roles('admin')
  @Post()
  async createCorporate(
    @Body() dto: CreateCorporateDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<CorporateResponseDto> {
    return this.corporatesService.createCorporate(dto, actor);
  }

  @Auth()
  @Get(':id')
  async getCorporateById(
    @Param('id') id: string,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<CorporateResponseDto> {
    return this.corporatesService.getCorporateById(id, actor);
  }

  @Auth()
  @Patch(':id')
  async updateCorporate(
    @Param('id') id: string,
    @Body() dto: UpdateCorporateDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<CorporateResponseDto> {
    return this.corporatesService.updateCorporate(id, dto, actor);
  }

  @Auth()
  @Roles('admin')
  @Patch(':id/status')
  async updateCorporateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCorporateStatusDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<CorporateResponseDto> {
    return this.corporatesService.updateCorporateStatus(id, dto, actor);
  }

  @Auth()
  @Roles('admin', 'insurer')
  @Get()
  async listCorporates(
    @Query() query: ListCorporatesQueryDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<PaginatedCorporateResponseDto> {
    return this.corporatesService.listCorporates(query, actor);
  }

  @Auth()
  @Get(':id/stats')
  async getCorporateStats(
    @Param('id') id: string,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<CorporateStatsResponseDto> {
    return this.corporatesService.getCorporateStats(id, actor);
  }
}
