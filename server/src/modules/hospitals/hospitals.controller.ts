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
import { HospitalsService } from './hospitals.service';
import { HospitalFinderService } from './services/hospital-finder.service';
import { Public } from '../../common/decorators/public.decorator';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { CreateHospitalEmergencyContactDto, UpdateHospitalEmergencyContactDto } from './dto/hospital-emergency-contact.dto';
import { CreateHospitalVisitDto } from './dto/hospital-visit.dto';
import { PaginationDto } from '../../shared/dtos/pagination.dto';

@Controller({ path: 'hospitals', version: '1' })
@UseInterceptors(ClassSerializerInterceptor)
export class HospitalsController {
  constructor(
    private readonly hospitalsService: HospitalsService,
    private readonly hospitalFinderService: HospitalFinderService,
  ) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: CreateHospitalDto) {
    // TODO: Get userId from JWT once auth is ready
    const userId = 'placeholder-user-id';
    return this.hospitalsService.create(userId, data);
  }

  @Get('search/nearby')
  @Public()
  async findNearby(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radiusKm') radiusKm?: string,
  ) {
    return this.hospitalFinderService.findNearby(
      parseFloat(latitude),
      parseFloat(longitude),
      radiusKm ? parseFloat(radiusKm) : 50,
    );
  }

  @Get()
  @Public()
  async findAll(@Query() pagination: PaginationDto) {
    return this.hospitalsService.findAll(
      pagination.page,
      pagination.limit,
      pagination.city,
      pagination.isActive,
      pagination.sortBy,
      pagination.order,
    );
  }

  @Get(':id')
  @Public()
  async findById(@Param('id') id: string) {
    return this.hospitalsService.findById(id);
  }

  @Patch(':id')
  @Public()
  async update(@Param('id') id: string, @Body() data: UpdateHospitalDto) {
    return this.hospitalsService.update(id, data);
  }

  @Post(':id/emergency-contacts')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async addEmergencyContact(
    @Param('id') id: string,
    @Body() data: CreateHospitalEmergencyContactDto,
  ) {
    return this.hospitalsService.addEmergencyContact(id, data);
  }

  @Get(':id/emergency-contacts')
  @Public()
  async getEmergencyContacts(@Param('id') id: string) {
    return this.hospitalsService.getEmergencyContacts(id);
  }

  @Get('emergency-contacts/:contactId')
  @Public()
  async getEmergencyContactById(@Param('contactId') contactId: string) {
    return this.hospitalsService.getEmergencyContactById(contactId);
  }

  @Patch('emergency-contacts/:contactId')
  @Public()
  async updateEmergencyContact(
    @Param('contactId') contactId: string,
    @Body() data: UpdateHospitalEmergencyContactDto,
  ) {
    return this.hospitalsService.updateEmergencyContact(contactId, data);
  }

  @Delete('emergency-contacts/:contactId')
  @Public()
  async deleteEmergencyContact(@Param('contactId') contactId: string) {
    return this.hospitalsService.deleteEmergencyContact(contactId);
  }

  @Get(':id/visits')
  @Public()
  async getHospitalVisits(@Param('id') id: string) {
    return this.hospitalsService.getHospitalVisits(id);
  }

  @Post(':id/visits')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async createHospitalVisit(
    @Param('id') id: string,
    @Body() data: CreateHospitalVisitDto,
  ) {
    return this.hospitalsService.createHospitalVisit({
      ...data,
      hospitalId: id,
    });
  }
}
