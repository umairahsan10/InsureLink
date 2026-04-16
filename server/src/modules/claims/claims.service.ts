import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  ClaimStatus,
  ClaimEventStatus,
  UserRole,
  HospitalVisitStatus,
} from '@prisma/client';
import { ClaimsRepository } from './repositories/claims.repository';
import { ClaimEventsRepository } from './repositories/claim-events.repository';
import { ClaimDocumentsRepository } from './repositories/claim-documents.repository';
import { ClaimProcessingService } from './services/claim-processing.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { ClaimFilterDto } from './dto/claim-filter.dto';
import { ApproveClaimDto } from './dto/approve-claim.dto';
import { RejectClaimDto } from './dto/reject-claim.dto';
import { OnHoldClaimDto } from './dto/on-hold-claim.dto';
import { PaidClaimDto } from './dto/paid-claim.dto';
import { BulkApproveClaimDto } from './dto/bulk-approve-claim.dto';
import { PatientSubmitClaimDto } from './dto/patient-submit-claim.dto';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { ClaimAction } from './constants/status-transitions';

@Injectable()
export class ClaimsService {
  private readonly logger = new Logger(ClaimsService.name);

  constructor(
    private readonly claimsRepository: ClaimsRepository,
    private readonly claimEventsRepository: ClaimEventsRepository,
    private readonly claimDocumentsRepository: ClaimDocumentsRepository,
    private readonly claimProcessingService: ClaimProcessingService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  /**
   * Create a new claim (submit)
   * Auto-populates corporateId, planId, insurerId from the hospital visit's employee data
   */
  async create(data: CreateClaimDto, user: CurrentUserDto) {
    // Get the hospital visit with full employee data
    const visit = await this.claimsRepository.getHospitalVisitForClaimCreation(
      data.hospitalVisitId,
    );

    if (!visit) {
      throw new BadRequestException('Hospital visit not found');
    }

    // Check if visit is already claimed
    if (visit.status === HospitalVisitStatus.Claimed) {
      throw new BadRequestException(
        'This hospital visit already has a claim submitted',
      );
    }

    // Get employee data (either from employee or dependent's employee)
    const employeeData = visit.employee || visit.dependent?.employee;
    if (!employeeData) {
      throw new BadRequestException(
        'Hospital visit must be associated with an employee or dependent',
      );
    }

    // Auto-populate from employee data
    const corporateId = employeeData.corporateId;
    const planId = employeeData.planId;
    const insurerId = employeeData.plan.insurerId;

    // Get employee's coverage limits
    const coverageAmount = Number(employeeData.coverageAmount);
    const usedAmount = Number(employeeData.usedAmount);
    const remainingCoverage = Math.max(0, coverageAmount - usedAmount);

    // Validate amount against remaining coverage
    if (data.amountClaimed > remainingCoverage) {
      throw new BadRequestException(
        `Claimed amount (${data.amountClaimed}) exceeds remaining coverage (${remainingCoverage.toFixed(2)}). Total coverage: ${coverageAmount.toFixed(2)}, Already used: ${usedAmount.toFixed(2)}`,
      );
    }

    // Create the claim with auto-populated data
    const claim = await this.claimsRepository.create({
      ...data,
      corporateId,
      planId,
      insurerId,
    });

    // Update visit status to Claimed
    await this.claimsRepository.updateHospitalVisitStatus(
      data.hospitalVisitId,
      'Claimed',
    );

    // Create initial event
    await this.claimEventsRepository.create({
      claimId: claim.id,
      actorUserId: user.id,
      actorName: user.email,
      actorRole: user.role,
      action: ClaimAction.CLAIM_SUBMITTED,
      statusTo: ClaimEventStatus.Pending,
      eventNote: 'Claim submitted',
    });

    return claim;
  }

  /**
   * Get claim by ID
   */
  async findById(id: string, user: CurrentUserDto) {
    const claim = await this.claimsRepository.findById(id);
    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    // Check access based on role
    await this.checkClaimAccess(claim, user);

    return claim;
  }

  /**
   * Get all claims with filters (role-aware)
   */
  async findAll(filters: ClaimFilterDto, user: CurrentUserDto) {
    const roleFilter = this.getRoleFilter(user);

    const { claims, total } = await this.claimsRepository.findAll(
      filters,
      roleFilter,
    );

    return {
      data: claims,
      meta: {
        total,
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
        totalPages: Math.ceil(total / (filters.limit ?? 10)),
      },
    };
  }

  /**
   * Update claim (only while Pending)
   */
  async update(id: string, data: UpdateClaimDto, user: CurrentUserDto) {
    // Use minimal query for validation (much faster)
    const claim = await this.claimsRepository.findByIdMinimal(id);
    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    // Check access
    await this.checkClaimAccess(claim, user);

    // Role-based update restrictions
    if (user.role === 'hospital') {
      // Hospitals can only update Pending claims
      if (claim.claimStatus !== ClaimStatus.Pending) {
        throw new BadRequestException(
          'Hospitals can only update claims in Pending status',
        );
      }

      // Hospitals cannot update approvedAmount
      if (data.approvedAmount !== undefined) {
        throw new BadRequestException(
          'Hospitals cannot update approved amount. This field is set by insurers during approval.',
        );
      }
    } else if (user.role === 'insurer') {
      // Insurers can only update approvedAmount on Approved/Paid claims
      if (data.approvedAmount !== undefined) {
        if (
          claim.claimStatus !== ClaimStatus.Approved &&
          claim.claimStatus !== ClaimStatus.Paid
        ) {
          throw new BadRequestException(
            'Approved amount can only be updated for claims in Approved or Paid status',
          );
        }

        // Validate approvedAmount doesn't exceed claimedAmount
        const claimedAmount = data.amountClaimed ?? Number(claim.amountClaimed);
        if (data.approvedAmount > claimedAmount) {
          throw new BadRequestException(
            `Approved amount (${data.approvedAmount}) cannot exceed claimed amount (${claimedAmount})`,
          );
        }
      }

      // Insurers cannot update other fields (except approvedAmount)
      if (
        data.amountClaimed ||
        data.treatmentCategory ||
        data.priority ||
        data.notes
      ) {
        throw new BadRequestException(
          'Insurers can only update the approved amount',
        );
      }
    }

    // Validate new claimed amount if provided (Hospital updating Pending claim)
    if (data.amountClaimed !== undefined) {
      // Get employee coverage data only (lightweight query)
      const coverageData =
        await this.claimsRepository.getEmployeeCoverageData(
          claim.hospitalVisitId,
        );

      if (coverageData) {
        // Validate against employee's remaining coverage
        const { coverageAmount, usedAmount } = coverageData;
        const remainingCoverage = Math.max(0, coverageAmount - usedAmount);

        if (data.amountClaimed > remainingCoverage) {
          throw new BadRequestException(
            `Claimed amount (${data.amountClaimed}) exceeds remaining coverage (${remainingCoverage.toFixed(2)}). Total coverage: ${coverageAmount.toFixed(2)}, Already used: ${usedAmount.toFixed(2)}`,
          );
        }
      }
    }

    const updatedClaim = await this.claimsRepository.update(id, data);

    // Log update event
    const eventNote = data.approvedAmount
      ? `Approved amount adjusted to ${data.approvedAmount}`
      : 'Claim details updated';

    await this.claimEventsRepository.create({
      claimId: id,
      actorUserId: user.id,
      actorName: user.email,
      actorRole: user.role,
      action: ClaimAction.CLAIM_UPDATED,
      statusFrom: claim.claimStatus as ClaimEventStatus,
      statusTo: claim.claimStatus as ClaimEventStatus,
      eventNote,
    });

    return updatedClaim;
  }

  /**
   * Delete claim (only Pending claims)
   */
  async delete(id: string, user: CurrentUserDto) {
    const claim = await this.claimsRepository.findById(id);
    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    // Only allow deletion of Pending claims
    if (claim.claimStatus !== ClaimStatus.Pending) {
      throw new BadRequestException(
        `Cannot delete claim with status ${claim.claimStatus}. Only Pending claims can be deleted.`,
      );
    }

    // Check access: hospital can only delete their own claims, admin can delete any
    if (user.role !== 'admin') {
      await this.checkClaimAccess(claim, user);
    }

    // Delete claim and related records (events, documents)
    await this.claimsRepository.delete(id);

    return {
      message: 'Claim deleted successfully',
      claimId: id,
    };
  }

  /**
   * Approve claim
   */
  async approve(id: string, data: ApproveClaimDto, user: CurrentUserDto) {
    return this.claimProcessingService.approveClaim(
      id,
      data.approvedAmount,
      data.eventNote,
      user,
    );
  }

  /**
   * Reject claim
   */
  async reject(id: string, data: RejectClaimDto, user: CurrentUserDto) {
    return this.claimProcessingService.rejectClaim(id, data.eventNote, user);
  }

  /**
   * Bulk approve claims
   */
  async bulkApprove(data: BulkApproveClaimDto, user: CurrentUserDto) {
    const results: {
      success: string[];
      failed: { id: string; reason: string }[];
    } = {
      success: [],
      failed: [],
    };

    for (const claimId of data.claimIds) {
      try {
        const claim = await this.claimsRepository.findById(claimId);
        if (!claim) {
          results.failed.push({ id: claimId, reason: 'Claim not found' });
          continue;
        }

        // Auto-approve with full claimed amount
        const approvedAmount = Number(claim.amountClaimed);
        await this.claimProcessingService.approveClaim(
          claimId,
          approvedAmount,
          data.eventNote || 'Bulk approved',
          user,
        );
        results.success.push(claimId);
      } catch (error) {
        results.failed.push({
          id: claimId,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      message: `Bulk approve completed: ${results.success.length} succeeded, ${results.failed.length} failed`,
      ...results,
    };
  }

  /**
   * Put claim on hold
   */
  async onHold(id: string, data: OnHoldClaimDto, user: CurrentUserDto) {
    return this.claimProcessingService.putOnHold(
      id,
      data.eventNote,
      user,
      data.requiredDocuments,
    );
  }

  /**
   * Mark claim as paid
   */
  async markPaid(id: string, data: PaidClaimDto, user: CurrentUserDto) {
    return this.claimProcessingService.markAsPaid(
      id,
      data.paymentReference,
      data.eventNote ?? data.notes,
      user,
      data.paidAmount,
      data.paymentMethod,
    );
  }

  /**
   * Get claim events timeline
   */
  async getEvents(
    claimId: string,
    page: number,
    limit: number,
    user: CurrentUserDto,
  ) {
    // Verify claim access
    const claim = await this.claimsRepository.findById(claimId);
    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    this.logger.debug(
      `getEvents: claimId=${claim.id} userRole=${user.role} userOrgId=${user.organizationId}`,
    );

    await this.checkClaimAccess(claim, user);

    const { events, total } = await this.claimEventsRepository.findByClaimId(
      claimId,
      page,
      limit,
    );

    return {
      data: events,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Upload claim document to Supabase Storage
   */
  async uploadDocument(
    claimId: string,
    file: Express.Multer.File,
    user: CurrentUserDto,
  ) {
    // Verify claim exists
    const claim = await this.claimsRepository.findById(claimId);
    if (!claim) {
      throw new NotFoundException('Claim not found');
    }
    await this.checkClaimAccess(claim, user);

    // Don't allow uploads for terminal states
    if (
      claim.claimStatus === ClaimStatus.Paid ||
      claim.claimStatus === ClaimStatus.Rejected
    ) {
      throw new BadRequestException(
        'Cannot upload documents for claims in terminal status',
      );
    }

    // Upload to Supabase
    const uploadResult = await this.fileUploadService.uploadFile(
      file,
      'claims',
    );

    // Create document record
    const document = await this.claimDocumentsRepository.create({
      claimId,
      originalFilename: file.originalname,
      filePath: uploadResult.filePath,
      fileUrl: uploadResult.publicUrl,
      fileSizeBytes: uploadResult.fileSize,
    });

    // Log event
    await this.claimEventsRepository.create({
      claimId,
      actorUserId: user.id,
      actorName: user.email,
      actorRole: user.role,
      action: ClaimAction.DOCUMENT_UPLOADED,
      statusFrom: claim.claimStatus as ClaimEventStatus,
      statusTo: claim.claimStatus as ClaimEventStatus,
      eventNote: `Document uploaded: ${file.originalname}`,
    });

    return document;
  }

  /**
   * Get claim documents
   */
  async getDocuments(claimId: string, user: CurrentUserDto) {
    // Verify claim access
    const claim = await this.claimsRepository.findById(claimId);
    if (!claim) {
      throw new NotFoundException('Claim not found');
    }
    await this.checkClaimAccess(claim, user);

    return this.claimDocumentsRepository.findByClaimId(claimId);
  }

  /**
   * Delete claim document from Supabase Storage
   */
  async deleteDocument(
    claimId: string,
    documentId: string,
    user: CurrentUserDto,
  ) {
    // Verify claim access
    const claim = await this.claimsRepository.findById(claimId);
    if (!claim) {
      throw new NotFoundException('Claim not found');
    }
    await this.checkClaimAccess(claim, user);

    // Don't allow deletes for terminal states
    if (
      claim.claimStatus === ClaimStatus.Paid ||
      claim.claimStatus === ClaimStatus.Rejected
    ) {
      throw new BadRequestException(
        'Cannot delete documents for claims in terminal status',
      );
    }

    // Verify document belongs to claim
    const document = await this.claimDocumentsRepository.findById(documentId);
    if (!document || document.claimId !== claimId) {
      throw new NotFoundException('Document not found');
    }

    // Delete from Supabase Storage
    await this.fileUploadService.deleteFile(document.filePath);

    // Delete database record
    const deleted = await this.claimDocumentsRepository.delete(documentId);

    // Log event
    await this.claimEventsRepository.create({
      claimId,
      actorUserId: user.id,
      actorName: user.email,
      actorRole: user.role,
      action: ClaimAction.DOCUMENT_DELETED,
      statusFrom: claim.claimStatus as ClaimEventStatus,
      statusTo: claim.claimStatus as ClaimEventStatus,
      eventNote: `Document deleted: ${document.originalFilename}`,
    });

    return deleted;
  }

  /**
   * Get role-based filter for claims query
   */
  private getRoleFilter(user: CurrentUserDto): {
    insurerId?: string;
    corporateId?: string;
    hospitalId?: string;
  } {
    switch (user.role) {
      case UserRole.insurer:
        return { insurerId: user.organizationId };
      case UserRole.corporate:
        return { corporateId: user.organizationId };
      case UserRole.hospital:
        return { hospitalId: user.organizationId };
      case UserRole.admin:
        return {}; // Admin sees all
      default:
        return {};
    }
  }

  /**
   * Check if user has access to claim
   */
  private async checkClaimAccess(claim: any, user: CurrentUserDto) {
    switch (user.role) {
      case UserRole.admin:
        return; // Admin has access to all
      case UserRole.insurer:
        // Check using relation object or foreign key field
        const insurerId = claim.insurer?.id || claim.insurerId;
        this.logger.debug(
          `insurer access check: claimInsurerId=${insurerId} userOrgId=${user.organizationId}`,
        );
        if (insurerId !== user.organizationId) {
          throw new ForbiddenException('You do not have access to this claim');
        }
        break;
      case UserRole.corporate:
        // Check using relation object or foreign key field
        const corporateId = claim.corporate?.id || claim.corporateId;
        if (corporateId !== user.organizationId) {
          throw new ForbiddenException('You do not have access to this claim');
        }
        break;
      case UserRole.hospital:
        const visit = await this.claimsRepository.getHospitalVisitWithHospital(
          claim.hospitalVisitId,
        );
        if (visit?.hospital?.userId !== user.id) {
          throw new ForbiddenException('You do not have access to this claim');
        }
        break;
      case UserRole.patient: {
        const employee =
          await this.claimsRepository.findEmployeeByUserId(user.id);
        if (!employee) {
          throw new ForbiddenException('You do not have access to this claim');
        }
        const patientVisit =
          await this.claimsRepository.getHospitalVisitWithHospital(
            claim.hospitalVisitId,
          );
        if (patientVisit?.employeeId !== employee.id) {
          throw new ForbiddenException('You do not have access to this claim');
        }
        break;
      }
      default:
        throw new ForbiddenException('You do not have access to this claim');
    }
  }

  // ── Patient self-service ──────────────────────────────────────────────

  /**
   * Patient submits a claim directly.
   * Creates a HospitalVisit and a Claim in one transaction.
   */
  async patientSubmitClaim(data: PatientSubmitClaimDto, user: CurrentUserDto) {
    const employee = await this.claimsRepository.findEmployeeByUserId(user.id);

    if (!employee) {
      throw new BadRequestException(
        'No employee record found for your account. Please contact your HR.',
      );
    }

    const coverageAmount = Number(employee.coverageAmount);
    const usedAmount = Number(employee.usedAmount);
    const remainingCoverage = Math.max(0, coverageAmount - usedAmount);

    if (data.amountClaimed > remainingCoverage) {
      throw new BadRequestException(
        `Claimed amount (${data.amountClaimed}) exceeds remaining coverage (${remainingCoverage.toFixed(2)}). Total coverage: ${coverageAmount.toFixed(2)}, Already used: ${usedAmount.toFixed(2)}`,
      );
    }

    const claim = await this.claimsRepository.createVisitAndClaim({
      employeeId: employee.id,
      hospitalId: data.hospitalId,
      visitDate: data.visitDate,
      dischargeDate: data.dischargeDate,
      corporateId: employee.corporateId,
      planId: employee.planId,
      insurerId: employee.plan.insurerId,
      amountClaimed: data.amountClaimed,
      treatmentCategory: data.treatmentCategory,
      priority: data.priority,
      notes: data.notes,
    });

    await this.claimEventsRepository.create({
      claimId: claim.id,
      actorUserId: user.id,
      actorName: user.email,
      actorRole: user.role,
      action: ClaimAction.CLAIM_SUBMITTED,
      statusTo: ClaimEventStatus.Pending,
      eventNote: 'Claim submitted by patient',
    });

    return claim;
  }

  /**
   * Patient retrieves their own claims.
   */
  async getPatientClaims(filters: ClaimFilterDto, user: CurrentUserDto) {
    const { claims, total } =
      await this.claimsRepository.findClaimsByEmployeeUserId(user.id, {
        status: filters.status,
        page: filters.page,
        limit: filters.limit,
      });

    return {
      data: claims,
      meta: {
        total,
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
        totalPages: Math.ceil(total / (filters.limit ?? 10)),
      },
    };
  }
}
