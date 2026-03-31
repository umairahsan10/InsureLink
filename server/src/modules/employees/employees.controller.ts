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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { EmployeesService } from './employees.service';
import { ValidateBulkImportDto, CommitBulkImportDto, BulkImportValidationResponseDto, UploadCsvDto, GetInvalidUploadsDto, ResubmitInvalidUploadDto, UpdateInvalidUploadDto } from './dto/bulk-import.dto';
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
  @Roles('corporate', 'admin')
  @Get('find-by-number')
  async getEmployeeByNumber(
    @Query('corporateId') corporateId: string,
    @Query('employeeNumber') employeeNumber: string,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.getEmployeeByNumber(corporateId, employeeNumber, actor);
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
  @Roles('corporate', 'admin', 'insurer')
  @Get()
  async listEmployees(
    @Query() query: ListEmployeesQueryDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<PaginatedEmployeesResponseDto> {
    return this.employeesService.listEmployees(query, actor);
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

  @Auth()
  @Roles('corporate', 'admin')
  @Post('bulk-import/upload-csv')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_req, file, callback) => {
        const allowed = [
          'text/csv',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ];

        const fileExt = file.originalname.toLowerCase().split('.').pop() || '';
        if (allowed.includes(file.mimetype) || ['csv', 'xlsx', 'xls'].includes(fileExt)) {
          callback(null, true);
        } else {
          callback(new Error('Only CSV and Excel files are allowed'), false);
        }
      },
    }),
  )
  async uploadCsv(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })], // 5MB
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadCsvDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<{ uploadId: string; validCount: number; invalidCount: number }> {
    return this.employeesService.uploadCsv(file, dto, actor);
  }

  @Auth()
  @Roles('corporate', 'admin')
  @Get('bulk-import/invalid')
  async getInvalidUploads(
    @Query() dto: GetInvalidUploadsDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<any[]> {
    return this.employeesService.getInvalidUploads(dto, actor);
  }

  @Auth()
  @Roles('corporate', 'admin')
  @Post('bulk-import/update-invalid')
  async updateInvalidUpload(
    @Body() dto: UpdateInvalidUploadDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.employeesService.updateInvalidUpload(dto, actor);
  }

  @Auth()
  @Roles('corporate', 'admin')
  @Post('bulk-import/resubmit-invalid')
  async resubmitInvalidUpload(
    @Body() dto: ResubmitInvalidUploadDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.employeesService.resubmitInvalidUpload(dto, actor);
  }

  @Auth()
  @Roles('corporate', 'admin')
  @Delete('bulk-import/delete-invalid')
  async deleteInvalidUpload(
    @Query('invalidUploadId') invalidUploadId: string,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.employeesService.deleteInvalidUpload(invalidUploadId, actor);
  }

  @Auth()
  @Roles('corporate', 'admin')
  @Delete('bulk-import/delete-all-invalid')
  async deleteAllInvalidUploads(
    @Query('corporateId') corporateId: string,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<{ success: boolean; message: string; deletedCount: number }> {
    return this.employeesService.deleteAllInvalidUploads(corporateId, actor);
  }
}
