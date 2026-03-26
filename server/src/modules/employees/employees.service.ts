import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeStatus, Prisma, UserRole, UploadStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as XLSX from 'xlsx';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import {
  BulkImportEmployeeRowDto,
  BulkImportValidationResponseDto,
  CommitBulkImportDto,
  ValidateBulkImportDto,
  UploadCsvDto,
  GetInvalidUploadsDto,
  ResubmitInvalidUploadDto,
} from './dto/bulk-import.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeCoverageDto } from './dto/employee-coverage.dto';
import { EmployeeResponseDto, PaginatedEmployeesResponseDto } from './dto/employee-response.dto';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

interface PendingImport {
  actorId: string;
  corporateId: string;
  validRows: BulkImportEmployeeRowDto[];
  invalidRowsCount: number;
}

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);
  private readonly pendingImports = new Map<string, PendingImport>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async createEmployee(dto: CreateEmployeeDto, actor: CurrentUserDto): Promise<EmployeeResponseDto> {
    const corporate = await this.ensureCorporateAccess(dto.corporateId, actor);
    const plan = await this.ensureValidPlan(dto.planId, corporate.insurerId);
    await this.assertCreateUniqueFields(dto);

    const startDate = new Date(dto.coverageStartDate);
    const endDate = new Date(dto.coverageEndDate);
    this.ensureCoverageDateWithinContract(startDate, endDate, corporate.contractStartDate, corporate.contractEndDate);

    try {
      const passwordHash = await bcrypt.hash(dto.password, 10);

      const created = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            ...(dto.lastName ? { lastName: dto.lastName } : {}),
            phone: dto.phone,
            userRole: UserRole.patient,
            ...(dto.dob ? { dob: new Date(dto.dob) } : {}),
            ...(dto.gender ? { gender: dto.gender } : {}),
            ...(dto.cnic ? { cnic: dto.cnic } : {}),
            ...(dto.address ? { address: dto.address } : {}),
          },
        });

        const employee = await tx.employee.create({
          data: {
            userId: user.id,
            corporateId: dto.corporateId,
            employeeNumber: dto.employeeNumber,
            planId: dto.planId,
            designation: dto.designation,
            department: dto.department,
            coverageStartDate: startDate,
            coverageEndDate: endDate,
            coverageAmount: plan.sumInsured,
          },
          include: {
            user: true,
            dependents: { select: { id: true } },
          },
        });

        return employee;
      });

      return this.toEmployeeResponse(created);
    } catch (error: unknown) {
      this.handleConflictErrors(error, {
        action: 'createEmployee',
        fields: {
          email: dto.email,
          employeeNumber: dto.employeeNumber,
          cnic: dto.cnic,
        },
      });
      throw error;
    }
  }

  async getEmployeeById(id: string, actor: CurrentUserDto): Promise<EmployeeResponseDto> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true, dependents: { select: { id: true } } },
    });

    if (!employee) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Employee not found' });
    }

    this.ensureEmployeeAccess(employee, actor);
    return this.toEmployeeResponse(employee);
  }

  async getEmployeeByNumber(corporateId: string, employeeNumber: string, actor: CurrentUserDto): Promise<EmployeeResponseDto> {
    if (!corporateId || !employeeNumber) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', message: 'corporateId and employeeNumber are required' });
    }

    const employee = await this.prisma.employee.findFirst({
      where: {
        corporateId,
        employeeNumber: {
          equals: employeeNumber.trim(),
          mode: 'insensitive',
        },
      },
      include: { user: true, dependents: { select: { id: true } } },
    });

    if (!employee) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Employee not found' });
    }

    this.ensureEmployeeAccess(employee, actor);
    return this.toEmployeeResponse(employee);
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto, actor: CurrentUserDto): Promise<EmployeeResponseDto> {
    const existing = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Employee not found' });
    }

    this.ensureEmployeeManageAccess(existing.corporateId, actor);

    const planId = dto.planId ?? existing.planId;
    const plan = await this.ensureValidPlan(planId, undefined, existing.corporateId);

    const corporate = await this.prisma.corporate.findUnique({ where: { id: existing.corporateId } });
    if (!corporate) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Corporate not found' });
    }

    await this.assertUpdateUniqueFields(id, existing.userId, dto);

    const startDate = dto.coverageStartDate ? new Date(dto.coverageStartDate) : existing.coverageStartDate;
    const endDate = dto.coverageEndDate ? new Date(dto.coverageEndDate) : existing.coverageEndDate;
    this.ensureCoverageDateWithinContract(startDate, endDate, corporate.contractStartDate, corporate.contractEndDate);

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        if (
          dto.email !== undefined ||
          dto.password !== undefined ||
          dto.firstName !== undefined ||
          dto.lastName !== undefined ||
          dto.phone !== undefined ||
          dto.dob !== undefined ||
          dto.gender !== undefined ||
          dto.cnic !== undefined ||
          dto.address !== undefined
        ) {
          await tx.user.update({
            where: { id: existing.userId },
            data: {
              ...(dto.email !== undefined ? { email: dto.email } : {}),
              ...(dto.password !== undefined ? { passwordHash: await bcrypt.hash(dto.password, 10) } : {}),
              ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
              ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
              ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
              ...(dto.dob !== undefined ? { dob: new Date(dto.dob) } : {}),
              ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
              ...(dto.cnic !== undefined ? { cnic: dto.cnic } : {}),
              ...(dto.address !== undefined ? { address: dto.address } : {}),
            },
          });
        }

        return tx.employee.update({
          where: { id },
          data: {
            ...(dto.employeeNumber !== undefined ? { employeeNumber: dto.employeeNumber } : {}),
            ...(dto.planId !== undefined ? { planId: dto.planId } : {}),
            ...(dto.designation !== undefined ? { designation: dto.designation } : {}),
            ...(dto.department !== undefined ? { department: dto.department } : {}),
            ...(dto.coverageStartDate !== undefined ? { coverageStartDate: new Date(dto.coverageStartDate) } : {}),
            ...(dto.coverageEndDate !== undefined ? { coverageEndDate: new Date(dto.coverageEndDate) } : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            ...(dto.planId !== undefined ? { coverageAmount: plan.sumInsured } : {}),
          },
          include: { user: true, dependents: { select: { id: true } } },
        });
      });

      return this.toEmployeeResponse(updated);
    } catch (error: unknown) {
      this.handleConflictErrors(error, {
        action: 'updateEmployee',
        fields: {
          email: dto.email,
          employeeNumber: dto.employeeNumber,
          cnic: dto.cnic,
        },
      });
      throw error;
    }
  }

  async deleteEmployee(id: string, actor: CurrentUserDto): Promise<{ success: boolean }> {
    const existing = await this.prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Employee not found' });
    }

    this.ensureEmployeeManageAccess(existing.corporateId, actor);

    await this.prisma.employee.delete({ where: { id } });
    return { success: true };
  }

  async listEmployees(query: ListEmployeesQueryDto, actor: CurrentUserDto): Promise<PaginatedEmployeesResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const corporateId = query.corporateId ?? (await this.resolveCorporateIdForActor(actor));

    if (!corporateId) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', message: 'corporateId is required' });
    }

    this.ensureEmployeeManageAccess(corporateId, actor);

    const where: Prisma.EmployeeWhereInput = {
      corporateId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.department ? { department: { equals: query.department, mode: 'insensitive' } } : {}),
      ...(query.search
        ? {
            OR: [
              { employeeNumber: { contains: query.search, mode: 'insensitive' } },
              { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
              { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
              { user: { email: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: true, dependents: { select: { id: true } } },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toEmployeeResponse(item)),
      total,
      page,
      limit,
    };
  }

  async getEmployeeCoverage(id: string, actor: CurrentUserDto): Promise<EmployeeCoverageDto> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true, plan: true },
    });

    if (!employee) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Employee not found' });
    }

    this.ensureEmployeeAccess(employee, actor);

    return {
      employeeId: employee.id,
      fullName: `${employee.user.firstName}${employee.user.lastName ? ` ${employee.user.lastName}` : ''}`,
      planName: employee.plan.planName,
      totalCoverageAmount: employee.coverageAmount.toFixed(2),
      usedAmount: employee.usedAmount.toFixed(2),
      availableAmount: employee.coverageAmount.sub(employee.usedAmount).toFixed(2),
      coverageStartDate: employee.coverageStartDate,
      coverageEndDate: employee.coverageEndDate,
      status: employee.status,
    };
  }

  async validateBulkImport(dto: ValidateBulkImportDto, actor: CurrentUserDto): Promise<BulkImportValidationResponseDto> {
    await this.ensureCorporateAccess(dto.corporateId, actor);

    const results = await Promise.all(
      dto.rows.map(async (row, index) => this.validateImportRow(row, index + 2, dto.corporateId)),
    );

    const validRows = results.filter((item) => item.valid && item.normalized).map((item) => item.normalized as BulkImportEmployeeRowDto);
    const invalidCount = results.filter((item) => !item.valid).length;

    const importToken = randomUUID();
    this.pendingImports.set(importToken, {
      actorId: actor.id,
      corporateId: dto.corporateId,
      validRows,
      invalidRowsCount: invalidCount,
    });

    return {
      importToken,
      validCount: validRows.length,
      invalidCount,
      results,
    };
  }

  async commitBulkImport(dto: CommitBulkImportDto, actor: CurrentUserDto): Promise<{ importedCount: number; skippedCount: number }> {
    const pending = this.pendingImports.get(dto.importToken);
    if (!pending) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Bulk import token not found or expired' });
    }

    if (pending.actorId !== actor.id) {
      throw new ForbiddenException({ code: 'AUTH_FORBIDDEN', message: 'You are not allowed to commit this import' });
    }

    if (dto.mode === 'cancel') {
      this.pendingImports.delete(dto.importToken);
      return { importedCount: 0, skippedCount: pending.validRows.length + pending.invalidRowsCount };
    }

    if (dto.mode === 'all_or_nothing' && pending.invalidRowsCount > 0) {
      throw new BadRequestException({
        code: 'BULK_IMPORT_CONFIRMATION_REQUIRED',
        message: 'Invalid rows exist. Choose skip_invalid or cancel.',
      });
    }

    let importedCount = 0;
    for (const row of pending.validRows) {
      await this.createEmployee(
        {
          corporateId: pending.corporateId,
          planId: row.planId,
          employeeNumber: row.employeeNumber,
          email: row.email,
          password: row.password,
          firstName: row.firstName,
          ...(row.lastName ? { lastName: row.lastName } : {}),
          phone: row.phone,
          designation: row.designation,
          department: row.department,
          coverageStartDate: row.coverageStartDate,
          coverageEndDate: row.coverageEndDate,
          ...(row.dob ? { dob: row.dob } : {}),
          ...(row.cnic ? { cnic: row.cnic } : {}),
        },
        actor,
      );
      importedCount += 1;
    }

    this.pendingImports.delete(dto.importToken);
    return { importedCount, skippedCount: pending.invalidRowsCount };
  }

  async uploadCsv(
    file: Express.Multer.File,
    dto: UploadCsvDto,
    actor: CurrentUserDto,
  ): Promise<{ uploadId: string; validCount: number; invalidCount: number }> {
    this.logger.log(`Bulk import started by user=${actor.id}, corporate=${dto.corporateId}, file=${file?.originalname}`);

    await this.ensureCorporateAccess(dto.corporateId, actor);

    if (!file || !file.buffer || file.size === 0) {
      this.logger.warn(`Bulk import failed: no file provided. actor=${actor.id}`);
      throw new BadRequestException({ code: 'NO_FILE', message: 'No file provided' });
    }

    const fileExtension = file.originalname.toLowerCase().split('.').pop();
    this.logger.log(`Bulk import file info: extension=${fileExtension}, size=${file.size}`);

    let rows: BulkImportEmployeeRowDto[];
    try {
      if (fileExtension === 'csv') {
        const csvContent = file.buffer.toString('utf-8');
        rows = this.parseCsv(csvContent);
      } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
        rows = this.parseExcel(file.buffer);
      } else {
        this.logger.warn(`Bulk import unsupported file type: ${fileExtension}`);
        throw new BadRequestException({ code: 'INVALID_FILE_TYPE', message: 'Only CSV and Excel files are supported' });
      }

      this.logger.log(`Parsed ${rows.length} rows from uploaded file`);
    } catch (error) {
      this.logger.error('Bulk import parse error', error);
      throw new BadRequestException({ code: 'INVALID_FILE', message: 'Failed to parse upload file', details: error instanceof Error ? error.message : String(error) });
    }

    let uploadResult;
    try {
      uploadResult = await this.fileUploadService.uploadFile(file, 'csv-uploads');
    } catch (error) {
      this.logger.error('Supabase upload error inside bulk import', error);
      throw new InternalServerErrorException({
        code: 'SUPABASE_UPLOAD_FAILED',
        message: 'Failed to store uploaded file. Please try again.',
        details: error instanceof Error ? error.message : String(error),
      });
    }

    // Create employee upload record
    const employeeUpload = await this.prisma.employeeUpload.create({
      data: {
        corporateId: dto.corporateId,
        uploadedByUserId: actor.id,
        filePath: uploadResult.filePath,
        originalFileName: file.originalname,
        status: UploadStatus.pending,
      },
    });

    // Validate rows
    const validationResults = await Promise.all(
      rows.map(async (row, index) => this.validateImportRow(row, index + 2, dto.corporateId)),
    );

    const validRows = validationResults.filter((item) => item.valid && item.normalized).map((item) => item.normalized as BulkImportEmployeeRowDto);
    const invalidRows = validationResults.filter((item) => !item.valid);

    // Store invalid rows
    for (const invalid of invalidRows) {
      const rowData = invalid.normalized ?? invalid as unknown as BulkImportEmployeeRowDto;
      const rowPlanId = rowData.planId || '00000000-0000-0000-0000-000000000000';

      try {
        await this.prisma.invalidEmployeeUpload.create({
          data: {
            employeeUploadId: employeeUpload.id,
            corporateId: dto.corporateId,
            errorMessages: invalid.errors,
            // User fields
            email: rowData.email,
            firstName: rowData.firstName,
            lastName: rowData.lastName ?? null,
            phone: rowData.phone,
            userRole: UserRole.patient, // Default for employees
            dob: rowData.dob ? new Date(rowData.dob) : null,
            gender: null, // Not in CSV
            cnic: rowData.cnic ?? null,
            address: null, // Not in CSV
            // Employee fields
            employeeNumber: rowData.employeeNumber,
            planId: rowPlanId,
            designation: rowData.designation,
            department: rowData.department,
            coverageStartDate: new Date(rowData.coverageStartDate),
            coverageEndDate: new Date(rowData.coverageEndDate),
            coverageAmount: new Prisma.Decimal(0), // Will be set from plan
            usedAmount: new Prisma.Decimal(0),
            status: EmployeeStatus.Active,
          },
        });
      } catch (createInvalidErr) {
        this.logger.error(`Failed to persist invalid row for employeeNumber=${rowData.employeeNumber}`, createInvalidErr);
      }
    }

    // Create valid employees
    let validCount = 0;
    if (validRows.length > 0) {
      this.logger.log(`Attempting to create ${validRows.length} valid employee(s)
`);
    }
    for (const row of validRows) {
      try {
        await this.createEmployee(
          {
            corporateId: dto.corporateId,
            planId: row.planId,
            employeeNumber: row.employeeNumber,
            email: row.email,
            password: row.password,
            firstName: row.firstName,
            ...(row.lastName ? { lastName: row.lastName } : {}),
            phone: row.phone,
            designation: row.designation,
            department: row.department,
            coverageStartDate: row.coverageStartDate,
            coverageEndDate: row.coverageEndDate,
            ...(row.dob ? { dob: row.dob } : {}),
            ...(row.cnic ? { cnic: row.cnic } : {}),
          },
          actor,
        );
        validCount += 1;
        this.logger.log(`Created employee: ${row.email} (${row.employeeNumber})`);
      } catch (error) {
        this.logger.error(`Failed to create employee ${row.email}`, error);

        // Persist the row into invalid uploads so user can correct it
        try {
          await this.prisma.invalidEmployeeUpload.create({
            data: {
              employeeUploadId: employeeUpload.id,
              corporateId: dto.corporateId,
              errorMessages: [
                `Failed to create employee: ${error instanceof Error ? error.message : String(error)}`,
              ],
              email: row.email,
              firstName: row.firstName,
              lastName: row.lastName ?? null,
              phone: row.phone,
              userRole: UserRole.patient,
              dob: row.dob ? new Date(row.dob) : null,
              gender: null,
              cnic: row.cnic ?? null,
              address: null,
              employeeNumber: row.employeeNumber,
              planId: row.planId,
              designation: row.designation,
              department: row.department,
              coverageStartDate: new Date(row.coverageStartDate),
              coverageEndDate: new Date(row.coverageEndDate),
              coverageAmount: new Prisma.Decimal(0),
              usedAmount: new Prisma.Decimal(0),
              status: EmployeeStatus.Active,
            },
          });
        } catch (invalidPersistErr) {
          this.logger.error(`Failed to persist failed valid row for ${row.email}`, invalidPersistErr);
        }
      }
    }

    // Update upload status
    await this.prisma.employeeUpload.update({
      where: { id: employeeUpload.id },
      data: { status: UploadStatus.processed },
    });

    return {
      uploadId: employeeUpload.id,
      validCount,
      invalidCount: invalidRows.length,
    };
  }

  private parseCsv(content: string): BulkImportEmployeeRowDto[] {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new BadRequestException({ code: 'INVALID_CSV', message: 'CSV must have at least a header row and one data row' });
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const requiredHeaders = ['employeeNumber', 'firstName', 'email', 'phone', 'password', 'designation', 'department', 'planId', 'coverageStartDate', 'coverageEndDate'];

    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        throw new BadRequestException({ code: 'INVALID_CSV', message: `Missing required header: ${required}` });
      }
    }

    const rows: BulkImportEmployeeRowDto[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length !== headers.length) continue; // Skip malformed rows

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || undefined;
      });

      rows.push(row as BulkImportEmployeeRowDto);
    }

    return rows;
  }

  private parseExcel(buffer: Buffer): BulkImportEmployeeRowDto[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    if (!worksheet) {
      throw new BadRequestException({ code: 'INVALID_EXCEL', message: 'Excel file has no sheets' });
    }

    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    
    if (jsonData.length < 1) {
      throw new BadRequestException({ code: 'INVALID_EXCEL', message: 'Excel sheet must have at least one data row' });
    }

    const requiredHeaders = ['employeeNumber', 'firstName', 'email', 'phone', 'password', 'designation', 'department', 'planId', 'coverageStartDate', 'coverageEndDate'];
    const headers = Object.keys(jsonData[0] || {});

    for (const required of requiredHeaders) {
      if (!headers.some(h => h.toLowerCase() === required.toLowerCase())) {
        throw new BadRequestException({ code: 'INVALID_EXCEL', message: `Missing required header: ${required}` });
      }
    }

    // Convert Excel data to BulkImportEmployeeRowDto format, handling case-insensitive headers
    const rows: BulkImportEmployeeRowDto[] = jsonData.map((row: any) => {
      const normalizedRow: any = {};
      const headerMap: { [key: string]: string } = {};

      // Create a case-insensitive header map
      Object.keys(row).forEach(key => {
        headerMap[key.toLowerCase()] = key;
      });

      // Map data using case-insensitive headers
      requiredHeaders.forEach(field => {
        const mappedKey = headerMap[field.toLowerCase()];
        if (mappedKey) {
          normalizedRow[field] = row[mappedKey];
        }
      });

      // Also include optional fields if present
      Object.keys(row).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (!Object.values(headerMap).some(v => v.toLowerCase() === lowerKey)) {
          normalizedRow[key] = row[key];
        }
      });

      return normalizedRow as BulkImportEmployeeRowDto;
    });

    return rows;
  }

  async getInvalidUploads(dto: GetInvalidUploadsDto, actor: CurrentUserDto): Promise<any[]> {
    await this.ensureCorporateAccess(dto.corporateId, actor);

    const invalidUploads = await this.prisma.invalidEmployeeUpload.findMany({
      where: { corporateId: dto.corporateId },
      include: {
        employeeUpload: {
          select: {
            originalFileName: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invalidUploads.map(upload => ({
      id: upload.id,
      uploadId: upload.employeeUploadId,
      fileName: upload.employeeUpload.originalFileName,
      uploadedAt: upload.employeeUpload.uploadedAt,
      errors: upload.errorMessages,
      data: {
        employeeNumber: upload.employeeNumber,
        firstName: upload.firstName,
        lastName: upload.lastName,
        email: upload.email,
        phone: upload.phone,
        designation: upload.designation,
        department: upload.department,
        planId: upload.planId,
        coverageStartDate: upload.coverageStartDate.toISOString().split('T')[0],
        coverageEndDate: upload.coverageEndDate.toISOString().split('T')[0],
        dob: upload.dob?.toISOString().split('T')[0],
        cnic: upload.cnic,
      },
    }));
  }

  async resubmitInvalidUpload(dto: ResubmitInvalidUploadDto, actor: CurrentUserDto): Promise<{ success: boolean; message: string }> {
    const invalidUpload = await this.prisma.invalidEmployeeUpload.findUnique({
      where: { id: dto.invalidUploadId },
      include: { employeeUpload: true },
    });

    if (!invalidUpload) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Invalid upload record not found' });
    }

    await this.ensureCorporateAccess(invalidUpload.corporateId, actor);

    // Validate the data again (in case plan or corporate constraints changed)
    const validation = await this.validateImportRow({
      employeeNumber: invalidUpload.employeeNumber,
      firstName: invalidUpload.firstName,
      lastName: invalidUpload.lastName || undefined,
      email: invalidUpload.email,
      phone: invalidUpload.phone,
      password: 'temp-password', // Will be set by user
      designation: invalidUpload.designation,
      department: invalidUpload.department,
      planId: invalidUpload.planId,
      coverageStartDate: invalidUpload.coverageStartDate.toISOString().split('T')[0],
      coverageEndDate: invalidUpload.coverageEndDate.toISOString().split('T')[0],
      dob: invalidUpload.dob?.toISOString().split('T')[0],
      cnic: invalidUpload.cnic || undefined,
    }, 1, invalidUpload.corporateId);

    if (!validation.valid) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Data is still invalid',
        errors: validation.errors,
      });
    }

    // Create the employee
    await this.createEmployee(
      {
        corporateId: invalidUpload.corporateId,
        planId: invalidUpload.planId,
        employeeNumber: invalidUpload.employeeNumber,
        email: invalidUpload.email,
        password: 'temp-password', // TODO: Generate proper password or require user input
        firstName: invalidUpload.firstName,
        ...(invalidUpload.lastName ? { lastName: invalidUpload.lastName } : {}),
        phone: invalidUpload.phone,
        designation: invalidUpload.designation,
        department: invalidUpload.department,
        coverageStartDate: invalidUpload.coverageStartDate.toISOString().split('T')[0],
        coverageEndDate: invalidUpload.coverageEndDate.toISOString().split('T')[0],
        ...(invalidUpload.dob ? { dob: invalidUpload.dob.toISOString().split('T')[0] } : {}),
        ...(invalidUpload.cnic ? { cnic: invalidUpload.cnic } : {}),
      },
      actor,
    );

    // Delete the invalid upload record
    await this.prisma.invalidEmployeeUpload.delete({
      where: { id: dto.invalidUploadId },
    });

    return { success: true, message: 'Employee created successfully' };
  }

  async updateUsedAmount(employeeId: string, approvedAmount: Prisma.Decimal): Promise<void> {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Employee not found' });
    }

    const nextUsed = employee.usedAmount.add(approvedAmount);
    if (nextUsed.greaterThan(employee.coverageAmount)) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Approved amount exceeds employee coverage',
      });
    }

    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { usedAmount: nextUsed },
    });
  }

  private async validateImportRow(
    row: BulkImportEmployeeRowDto,
    rowIndex: number,
    corporateId: string,
  ): Promise<{ rowIndex: number; valid: boolean; errors: string[]; normalized: BulkImportEmployeeRowDto }> {
    const errors: string[] = [];

    const duplicateEmployeeNumber = await this.prisma.employee.findFirst({
      where: { corporateId, employeeNumber: row.employeeNumber },
      select: { id: true },
    });
    if (duplicateEmployeeNumber) {
      errors.push('Duplicate employeeNumber for this corporate');
    }

    const duplicateUser = await this.prisma.user.findUnique({ where: { email: row.email }, select: { id: true } });
    if (duplicateUser) {
      errors.push('Duplicate email already exists');
    }

    let planId = row.planId;
    let plan: { id: string } | null = null;
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (uuidRegex.test(row.planId)) {
        const planLookup = await this.prisma.plan.findUnique({ where: { id: row.planId }, select: { id: true } });
        plan = planLookup ? { id: planLookup.id } : null;
      } else {
        const planLookup = await this.prisma.plan.findUnique({ where: { planCode: row.planId }, select: { id: true } });
        plan = planLookup ? { id: planLookup.id } : null;
      }

      if (plan) {
        planId = plan.id; // rewrite to UUID for downstream createEmployee
      }

      if (!plan) {
        errors.push('Plan does not exist');
        planId = '00000000-0000-0000-0000-000000000000';
      }
    } catch (error) {
      errors.push('Error validating plan');
      this.logger.error(`Plan validation error for row ${rowIndex}`, error);
      planId = '00000000-0000-0000-0000-000000000000';
    }

    const normalized: BulkImportEmployeeRowDto = {
      ...row,
      planId,
    };

    return {
      rowIndex,
      valid: errors.length === 0,
      errors,
      normalized,
    };
  }

  private async ensureCorporateAccess(corporateId: string, actor: CurrentUserDto) {
    const corporate = await this.prisma.corporate.findUnique({ where: { id: corporateId } });
    if (!corporate) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Corporate not found' });
    }

    this.ensureEmployeeManageAccess(corporateId, actor, corporate.userId);
    return corporate;
  }

  private ensureEmployeeManageAccess(corporateId: string, actor: CurrentUserDto, corporateUserId?: string): void {
    const role = actor.role as unknown as string;
    if (role === 'admin') {
      return;
    }

    if (role !== 'corporate') {
      throw new ForbiddenException({ code: 'AUTH_FORBIDDEN', message: 'Insufficient role to manage employees' });
    }

    if (corporateUserId && corporateUserId !== actor.id) {
      throw new ForbiddenException({ code: 'AUTH_FORBIDDEN', message: 'You can only manage your own corporate employees' });
    }
  }

  private ensureEmployeeAccess(
    employee: { id: string; corporateId: string; userId: string },
    actor: CurrentUserDto,
  ): void {
    const role = actor.role as unknown as string;
    if (role === 'admin') {
      return;
    }

    if (employee.userId === actor.id) {
      return;
    }

    if (role === 'corporate') {
      return;
    }

    throw new ForbiddenException({ code: 'AUTH_FORBIDDEN', message: 'You are not allowed to access this employee' });
  }

  private async resolveCorporateIdForActor(actor: CurrentUserDto): Promise<string | undefined> {
    const role = actor.role as unknown as string;
    if (role !== 'corporate') {
      return undefined;
    }

    const corporate = await this.prisma.corporate.findUnique({
      where: { userId: actor.id },
      select: { id: true },
    });
    return corporate?.id;
  }

  private async ensureValidPlan(planId: string, insurerId?: string, corporateId?: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Plan not found' });
    }

    if (corporateId) {
      const corporate = await this.prisma.corporate.findUnique({ where: { id: corporateId }, select: { insurerId: true } });
      if (!corporate) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'Corporate not found' });
      }
      insurerId = corporate.insurerId;
    }

    if (insurerId && plan.insurerId !== insurerId) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Plan does not belong to corporate insurer',
      });
    }

    return plan;
  }

  private ensureCoverageDateWithinContract(
    coverageStart: Date,
    coverageEnd: Date,
    contractStart: Date,
    contractEnd: Date,
  ): void {
    if (coverageEnd <= coverageStart) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', message: 'coverageEndDate must be after coverageStartDate' });
    }

    if (coverageStart < contractStart || coverageEnd > contractEnd) {
      throw new BadRequestException({
        code: 'COVERAGE_DATE_OUT_OF_CONTRACT_RANGE',
        message: 'Employee coverage dates must be within corporate contract dates',
      });
    }
  }

  private toEmployeeResponse(employee: {
    id: string;
    userId: string;
    corporateId: string;
    planId: string;
    employeeNumber: string;
    designation: string;
    department: string;
    coverageStartDate: Date;
    coverageEndDate: Date;
    coverageAmount: Prisma.Decimal;
    usedAmount: Prisma.Decimal;
    status: EmployeeStatus;
    createdAt: Date;
    updatedAt: Date;
    user: {
      firstName: string;
      lastName: string | null;
      email: string;
      phone: string;
    };
    dependents: { id: string }[];
  }): EmployeeResponseDto {
    return {
      id: employee.id,
      userId: employee.userId,
      corporateId: employee.corporateId,
      planId: employee.planId,
      employeeNumber: employee.employeeNumber,
      firstName: employee.user.firstName,
      ...(employee.user.lastName ? { lastName: employee.user.lastName } : {}),
      email: employee.user.email,
      phone: employee.user.phone,
      designation: employee.designation,
      department: employee.department,
      coverageStartDate: employee.coverageStartDate,
      coverageEndDate: employee.coverageEndDate,
      coverageAmount: employee.coverageAmount.toFixed(2),
      usedAmount: employee.usedAmount.toFixed(2),
      availableAmount: employee.coverageAmount.sub(employee.usedAmount).toFixed(2),
      status: employee.status,
      dependentCount: employee.dependents.length,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }

  private handleConflictErrors(
    error: unknown,
    context?: {
      action: string;
      fields?: Partial<Record<'email' | 'employeeNumber' | 'cnic', string | undefined>>;
    },
  ): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const rawTargets = Array.isArray(error.meta?.target)
        ? error.meta.target.map((item) => String(item))
        : [];
      const targets = this.normalizeUniqueTargets(rawTargets);

      const duplicateFields = targets.map((field) => {
        const value = context?.fields?.[field];
        return {
          field,
          ...(value !== undefined ? { value } : {}),
        };
      });

      const message = duplicateFields.length
        ? `Duplicate value for ${duplicateFields
            .map((item) => (item.value !== undefined ? `${item.field} (${item.value})` : item.field))
            .join(', ')}`
        : 'Duplicate value for unique field';

      this.logger.warn(
        `${context?.action ?? 'employeeOperation'} conflict: ${JSON.stringify({
          code: error.code,
          rawTargets,
          duplicateFields,
        })}`,
      );

      throw new ConflictException({
        code: 'CONFLICT',
        message,
        ...(duplicateFields.length ? { duplicateFields } : {}),
      });
    }
    throw error;
  }

  private async assertCreateUniqueFields(dto: CreateEmployeeDto): Promise<void> {
    const [emailExists, employeeNumberExists, cnicExists] = await Promise.all([
      this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      }),
      this.prisma.employee.findUnique({
        where: { employeeNumber: dto.employeeNumber },
        select: { id: true },
      }),
      dto.cnic
        ? this.prisma.user.findUnique({
            where: { cnic: dto.cnic },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    const duplicates: Array<{ field: 'email' | 'employeeNumber' | 'cnic'; value?: string }> = [];

    if (emailExists) {
      duplicates.push({ field: 'email', value: dto.email });
    }

    if (employeeNumberExists) {
      duplicates.push({ field: 'employeeNumber', value: dto.employeeNumber });
    }

    if (cnicExists && dto.cnic) {
      duplicates.push({ field: 'cnic', value: dto.cnic });
    }

    if (duplicates.length > 0) {
      this.throwDuplicateConflict('createEmployee', duplicates);
    }
  }

  private async assertUpdateUniqueFields(
    employeeId: string,
    userId: string,
    dto: UpdateEmployeeDto,
  ): Promise<void> {
    const checks: Promise<{ field: 'email' | 'employeeNumber' | 'cnic'; conflict: boolean; value?: string }>[] = [];

    if (dto.email !== undefined) {
      checks.push(
        this.prisma.user
          .findFirst({
            where: {
              email: dto.email,
              id: { not: userId },
            },
            select: { id: true },
          })
          .then((row) => ({ field: 'email' as const, conflict: !!row, value: dto.email })),
      );
    }

    if (dto.employeeNumber !== undefined) {
      checks.push(
        this.prisma.employee
          .findFirst({
            where: {
              employeeNumber: dto.employeeNumber,
              id: { not: employeeId },
            },
            select: { id: true },
          })
          .then((row) => ({
            field: 'employeeNumber' as const,
            conflict: !!row,
            value: dto.employeeNumber,
          })),
      );
    }

    if (dto.cnic !== undefined) {
      checks.push(
        this.prisma.user
          .findFirst({
            where: {
              cnic: dto.cnic,
              id: { not: userId },
            },
            select: { id: true },
          })
          .then((row) => ({ field: 'cnic' as const, conflict: !!row, value: dto.cnic })),
      );
    }

    if (checks.length === 0) {
      return;
    }

    const results = await Promise.all(checks);
    const duplicates = results
      .filter((item) => item.conflict)
      .map((item) => ({ field: item.field, ...(item.value !== undefined ? { value: item.value } : {}) }));

    if (duplicates.length > 0) {
      this.throwDuplicateConflict('updateEmployee', duplicates);
    }
  }

  private throwDuplicateConflict(
    action: string,
    duplicateFields: Array<{ field: 'email' | 'employeeNumber' | 'cnic'; value?: string }>,
  ): never {
    this.logger.warn(
      `${action} conflict (pre-check): ${JSON.stringify({
        duplicateFields,
      })}`,
    );

    const message = `Duplicate value for ${duplicateFields
      .map((item) => (item.value !== undefined ? `${item.field} (${item.value})` : item.field))
      .join(', ')}`;

    throw new ConflictException({
      code: 'CONFLICT',
      message,
      duplicateFields,
    });
  }

  private normalizeUniqueTargets(rawTargets: string[]): Array<'email' | 'employeeNumber' | 'cnic'> {
    const normalized = new Set<'email' | 'employeeNumber' | 'cnic'>();

    for (const target of rawTargets) {
      const lower = target.toLowerCase();
      if (lower.includes('email')) {
        normalized.add('email');
      }
      if (lower.includes('employee') && lower.includes('number')) {
        normalized.add('employeeNumber');
      }
      if (lower.includes('cnic')) {
        normalized.add('cnic');
      }
    }

    return Array.from(normalized);
  }
}
