import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { ListPatientsQueryDto } from './dto/list-patients-query.dto';
import { PatientCoverageDto } from './dto/patient-coverage.dto';
import { UpdatePatientProfileDto } from './dto/patient-profile.dto';
import {
  PaginatedPatientsDto,
  PatientClaimsDto,
  PatientVisitsDto,
} from './dto/patient-response.dto';
import { VerifyPatientDto } from './dto/verify-patient.dto';
import { VerifyPatientResponseDto } from './dto/verify-patient-response.dto';
import { PatientsService } from './patients.service';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Auth()
  @Get('me')
  async getMe(@CurrentUser() actor: CurrentUserDto) {
    return this.patientsService.getMe(actor);
  }

  @Post('verify')
  async verifyPatient(
    @Body() dto: VerifyPatientDto,
  ): Promise<VerifyPatientResponseDto> {
    return this.patientsService.verifyPatient(dto);
  }

  @Auth()
  @Patch('me')
  async updateMe(
    @Body() dto: UpdatePatientProfileDto,
    @CurrentUser() actor: CurrentUserDto,
  ) {
    return this.patientsService.updateMe(actor, dto);
  }

  @Auth()
  @Get()
  async listPatients(
    @Query() query: ListPatientsQueryDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<PaginatedPatientsDto> {
    return this.patientsService.listPatients(query, actor);
  }

  @Auth()
  @Get(':id')
  async getPatientById(
    @Param('id') id: string,
    @CurrentUser() actor: CurrentUserDto,
  ) {
    return this.patientsService.getPatientById(id, actor);
  }

  @Auth()
  @Get(':id/coverage')
  async getPatientCoverage(
    @Param('id') id: string,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<PatientCoverageDto> {
    return this.patientsService.getPatientCoverage(id, actor);
  }

  @Auth()
  @Get(':id/claims')
  async getPatientClaims(
    @Param('id') id: string,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<PatientClaimsDto> {
    return this.patientsService.getPatientClaims(id, actor);
  }

  @Auth()
  @Get(':id/hospital-visits')
  async getPatientVisits(
    @Param('id') id: string,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<PatientVisitsDto> {
    return this.patientsService.getPatientVisits(id, actor);
  }
}
