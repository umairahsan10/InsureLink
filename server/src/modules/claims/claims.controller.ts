import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ClaimsService } from './claims.service';
import { Auditable } from '../audit/decorators/auditable.decorator';
import { AuditLogInterceptor } from '../audit/interceptors/audit-log.interceptor';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { ClaimFilterDto } from './dto/claim-filter.dto';
import { ApproveClaimDto } from './dto/approve-claim.dto';
import { RejectClaimDto } from './dto/reject-claim.dto';
import { OnHoldClaimDto } from './dto/on-hold-claim.dto';
import { PaidClaimDto } from './dto/paid-claim.dto';
import { BulkApproveClaimDto } from './dto/bulk-approve-claim.dto';
import { PatientSubmitClaimDto } from './dto/patient-submit-claim.dto';

// Use memory storage for Supabase upload
const claimDocumentStorage = memoryStorage();

// File filter to accept only PDF, JPEG, and PNG
const claimDocumentFileFilter = (req, file, callback) => {
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new Error(
        `Invalid file type. Only PDF, JPEG, and PNG files are allowed. Received: ${file.mimetype}`,
      ),
      false,
    );
  }
};

@Controller({ path: 'claims', version: '1' })
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  // ============================================
  // CRUD Operations
  // ============================================

  /**
   * Submit a new claim (Hospital only)
   */
  @Post()
  @Roles('hospital')
  @HttpCode(HttpStatus.CREATED)
  @Auditable('Claim')
  @UseInterceptors(AuditLogInterceptor)
  async create(
    @Body() data: CreateClaimDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.claimsService.create(data, user);
  }

  /**
   * Patient self-service claim submission
   */
  @Post('patient-submit')
  @Roles('patient')
  @HttpCode(HttpStatus.CREATED)
  async patientSubmit(
    @Body() data: PatientSubmitClaimDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.claimsService.patientSubmitClaim(data, user);
  }

  /**
   * Patient retrieves their own claims
   */
  @Get('my-claims')
  @Roles('patient')
  async getMyClaimsAsPatient(
    @Query() filters: ClaimFilterDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.claimsService.getPatientClaims(filters, user);
  }

  /**
   * Get all claims with filters (role-aware)
   */
  @Get()
  @Roles('hospital', 'insurer', 'corporate', 'admin')
  async findAll(
    @Query() filters: ClaimFilterDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.claimsService.findAll(filters, user);
  }

  /**
   * Get claim by ID with full details
   */
  @Get(':id')
  @Roles('hospital', 'insurer', 'corporate', 'admin', 'patient')
  async findById(@Param('id') id: string, @CurrentUser() user: CurrentUserDto) {
    return this.claimsService.findById(id, user);
  }

  /**
   * Update claim (Hospital: Pending claims only, Insurer: Can update approvedAmount)
   */
  @Patch(':id')
  @Roles('hospital', 'insurer')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateClaimDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.claimsService.update(id, data, user);
  }

  /**
   * Delete claim (Hospital only, only when Pending)
   */
  @Delete(':id')
  @Roles('hospital', 'admin')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserDto) {
    return this.claimsService.delete(id, user);
  }

  // ============================================
  // Workflow Operations (Insurer only)
  // ============================================

  /**
   * Bulk approve claims
   */
  @Post('bulk-approve')
  @Roles('insurer')
  async bulkApprove(
    @Body() data: BulkApproveClaimDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.claimsService.bulkApprove(data, user);
  }

  /**
   * Approve a claim
   */
  @Patch(':id/approve')
  @Roles('insurer')
  @Auditable('Claim')
  @UseInterceptors(AuditLogInterceptor)
  async approve(
    @Param('id') id: string,
    @Body() data: ApproveClaimDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.claimsService.approve(id, data, user);
  }

  /**
   * Reject a claim
   */
  @Patch(':id/reject')
  @Roles('insurer')
  @Auditable('Claim')
  @UseInterceptors(AuditLogInterceptor)
  async reject(
    @Param('id') id: string,
    @Body() data: RejectClaimDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.claimsService.reject(id, data, user);
  }

  /**
   * Put claim on hold
   */
  @Patch(':id/on-hold')
  @Roles('insurer')
  @Auditable('Claim')
  @UseInterceptors(AuditLogInterceptor)
  async onHold(
    @Param('id') id: string,
    @Body() data: OnHoldClaimDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.claimsService.onHold(id, data, user);
  }

  /**
   * Mark claim as paid
   */
  @Patch(':id/paid')
  @Roles('insurer')
  @Auditable('Claim')
  @UseInterceptors(AuditLogInterceptor)
  async markPaid(
    @Param('id') id: string,
    @Body() data: PaidClaimDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.claimsService.markPaid(id, data, user);
  }

  // ============================================
  // Events Timeline
  // ============================================

  /**
   * Get claim events timeline
   */
  @Get(':id/events')
  @Roles('hospital', 'insurer', 'corporate', 'admin', 'patient')
  async getEvents(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.claimsService.getEvents(
      id,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
      user,
    );
  }

  // ============================================
  // Documents
  // ============================================

  /**
   * Upload a claim document
   */
  @Post(':id/documents')
  @Roles('hospital', 'insurer', 'patient')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: claimDocumentStorage,
      fileFilter: claimDocumentFileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadDocument(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.claimsService.uploadDocument(id, file, user);
  }

  /**
   * Get all documents for a claim
   */
  @Get(':id/documents')
  @Roles('hospital', 'insurer', 'corporate', 'admin')
  async getDocuments(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.claimsService.getDocuments(id, user);
  }

  /**
   * Delete a claim document
   */
  @Delete(':id/documents/:documentId')
  @Roles('hospital', 'insurer')
  async deleteDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.claimsService.deleteDocument(id, documentId, user);
  }
}
