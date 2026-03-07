import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { EmployeesService } from './employees.service';
import { ValidateBulkImportDto, CommitBulkImportDto, BulkImportValidationResponseDto } from './dto/bulk-import.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeCoverageDto } from './dto/employee-coverage.dto';
import { EmployeeResponseDto, PaginatedEmployeesResponseDto } from './dto/employee-response.dto';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Auth()
  @Roles('corporate', 'admin')
  @Post()
  async createEmployee(
    @Body() dto: CreateEmployeeDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.createEmployee(dto, actor);
  }

  @Auth()
  @Get(':id')
  async getEmployeeById(
    @Param('id') id: string,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.getEmployeeById(id, actor);
  }

  @Auth()
  @Roles('corporate', 'admin')
  @Patch(':id')
  async updateEmployee(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.updateEmployee(id, dto, actor);
  }

  @Auth()
  @Roles('corporate', 'admin')
  @Delete(':id')
  async deleteEmployee(
    @Param('id') id: string,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<{ success: boolean }> {
    return this.employeesService.deleteEmployee(id, actor);
  }

  @Auth()
  @Roles('corporate', 'admin')
  @Get()
  async listEmployees(
    @Query() query: ListEmployeesQueryDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<PaginatedEmployeesResponseDto> {
    return this.employeesService.listEmployees(query, actor);
  }

  @Auth()
  @Get(':id/coverage')
  async getEmployeeCoverage(
    @Param('id') id: string,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<EmployeeCoverageDto> {
    return this.employeesService.getEmployeeCoverage(id, actor);
  }

  @Auth()
  @Roles('corporate', 'admin')
  @Post('bulk-import/validate')
  async validateBulkImport(
    @Body() dto: ValidateBulkImportDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<BulkImportValidationResponseDto> {
    return this.employeesService.validateBulkImport(dto, actor);
  }

  @Auth()
  @Roles('corporate', 'admin')
  @Post('bulk-import/commit')
  async commitBulkImport(
    @Body() dto: CommitBulkImportDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<{ importedCount: number; skippedCount: number }> {
    return this.employeesService.commitBulkImport(dto, actor);
  }
}
