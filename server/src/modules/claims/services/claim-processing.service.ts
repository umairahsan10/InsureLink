import { Injectable, BadRequestException } from '@nestjs/common';
import { ClaimStatus, ClaimEventStatus } from '@prisma/client';
import { ClaimsRepository } from '../repositories/claims.repository';
import { ClaimEventsRepository } from '../repositories/claim-events.repository';
import {
  isValidTransition,
  isTerminalState,
  ClaimAction,
} from '../constants/status-transitions';
import { CurrentUserDto } from '../../auth/dto/current-user.dto';

@Injectable()
export class ClaimProcessingService {
  constructor(
    private readonly claimsRepository: ClaimsRepository,
    private readonly claimEventsRepository: ClaimEventsRepository,
  ) {}

  /**
   * Approve a claim
   */
  async approveClaim(
    claimId: string,
    approvedAmount: number,
    eventNote: string | undefined,
    user: CurrentUserDto,
  ) {
    // Get minimal claim data for validation
    const claim = await this.claimsRepository.findByIdMinimal(claimId);

    if (!claim) {
      throw new BadRequestException('Claim not found');
    }

    // Validate transition
    this.validateTransition(claim.claimStatus, ClaimStatus.Approved);

    // Validate approved amount
    const claimedAmount = Number(claim.amountClaimed);
    if (approvedAmount > claimedAmount) {
      throw new BadRequestException(
        `Approved amount (${approvedAmount}) cannot exceed claimed amount (${claimedAmount})`,
      );
    }

    // Get employee to validate and update coverage
    const employee = await this.claimsRepository.getEmployeeFromClaim(claimId);
    if (!employee) {
      throw new BadRequestException(
        'Cannot find employee associated with this claim',
      );
    }

    // Validate approved amount against remaining coverage
    const coverageAmount = Number(employee.coverageAmount);
    const usedAmount = Number(employee.usedAmount);
    const remainingCoverage = coverageAmount - usedAmount;

    if (approvedAmount > remainingCoverage) {
      throw new BadRequestException(
        `Approved amount (${approvedAmount}) exceeds remaining coverage (${remainingCoverage.toFixed(2)}). Total coverage: ${coverageAmount.toFixed(2)}, Already used: ${usedAmount.toFixed(2)}`,
      );
    }

    // Update claim status (lightweight)
    const updatedClaim = await this.claimsRepository.updateStatus(
      claimId,
      ClaimStatus.Approved,
      approvedAmount,
    );

    // Update employee's used amount
    await this.claimsRepository.updateEmployeeUsedAmount(
      employee.id,
      approvedAmount,
    );

    // Create event (async - don't wait)
    this.claimEventsRepository
      .create({
        claimId,
        actorUserId: user.id,
        actorName: user.email,
        actorRole: user.role,
        action: ClaimAction.CLAIM_APPROVED,
        statusFrom: claim.claimStatus as ClaimEventStatus,
        statusTo: ClaimEventStatus.Approved,
        eventNote:
          eventNote ||
          `Claim approved. Amount: ${approvedAmount}. Employee used coverage updated.`,
      })
      .catch((err) => console.error('Failed to create claim event:', err));

    return updatedClaim;
  }

  /**
   * Reject a claim
   */
  async rejectClaim(claimId: string, eventNote: string, user: CurrentUserDto) {
    const claim = await this.claimsRepository.findByIdMinimal(claimId);

    if (!claim) {
      throw new BadRequestException('Claim not found');
    }

    // Validate transition
    this.validateTransition(claim.claimStatus, ClaimStatus.Rejected);

    // Update claim status
    const updatedClaim = await this.claimsRepository.updateStatus(
      claimId,
      ClaimStatus.Rejected,
    );

    // Create event (async - don't wait)
    this.claimEventsRepository
      .create({
        claimId,
        actorUserId: user.id,
        actorName: user.email,
        actorRole: user.role,
        action: ClaimAction.CLAIM_REJECTED,
        statusFrom: claim.claimStatus as ClaimEventStatus,
        statusTo: ClaimEventStatus.Rejected,
        eventNote,
      })
      .catch((err) => console.error('Failed to create claim event:', err));

    return updatedClaim;
  }

  /**
   * Put claim on hold
   */
  async putOnHold(
    claimId: string,
    eventNote: string,
    user: CurrentUserDto,
    requiredDocuments?: string[],
  ) {
    const claim = await this.claimsRepository.findByIdMinimal(claimId);

    if (!claim) {
      throw new BadRequestException('Claim not found');
    }

    // Validate transition
    this.validateTransition(claim.claimStatus, ClaimStatus.OnHold);

    // Update claim status
    const updatedClaim = await this.claimsRepository.updateStatus(
      claimId,
      ClaimStatus.OnHold,
    );

    // Create event (async - don't wait)
    this.claimEventsRepository
      .create({
        claimId,
        actorUserId: user.id,
        actorName: user.email,
        actorRole: user.role,
        action: ClaimAction.CLAIM_ON_HOLD,
        statusFrom: claim.claimStatus as ClaimEventStatus,
        statusTo: ClaimEventStatus.OnHold,
        eventNote:
          requiredDocuments && requiredDocuments.length > 0
            ? `${eventNote}\nRequired Documents: ${requiredDocuments.join(', ')}`
            : eventNote,
      })
      .catch((err) => console.error('Failed to create claim event:', err));

    return updatedClaim;
  }

  /**
   * Mark claim as paid
   */
  async markAsPaid(
    claimId: string,
    paymentReference: string | undefined,
    eventNote: string | undefined,
    user: CurrentUserDto,
    paidAmount?: number,
    paymentMethod?: string,
  ) {
    const claim = await this.claimsRepository.findByIdMinimal(claimId);

    if (!claim) {
      throw new BadRequestException('Claim not found');
    }

    // Validate transition
    this.validateTransition(claim.claimStatus, ClaimStatus.Paid);

    // Update claim status
    const updatedClaim = await this.claimsRepository.updateStatus(
      claimId,
      ClaimStatus.Paid,
    );

    // Build event note
    let note = eventNote || 'Claim marked as paid';
    if (paymentReference) {
      note = `${note}. Payment Reference: ${paymentReference}`;
    }
    if (paymentMethod) {
      note = `${note}. Method: ${paymentMethod}`;
    }
    if (paidAmount !== undefined) {
      note = `${note}. Amount Paid: ${paidAmount}`;
    }

    // Create event (async - don't wait)
    this.claimEventsRepository
      .create({
        claimId,
        actorUserId: user.id,
        actorName: user.email,
        actorRole: user.role,
        action: ClaimAction.CLAIM_PAID,
        statusFrom: claim.claimStatus as ClaimEventStatus,
        statusTo: ClaimEventStatus.Paid,
        eventNote: note,
      })
      .catch((err) => console.error('Failed to create claim event:', err));

    return updatedClaim;
  }

  /**
   * Validate status transition
   */
  private validateTransition(fromStatus: ClaimStatus, toStatus: ClaimStatus) {
    if (isTerminalState(fromStatus)) {
      throw new BadRequestException(
        `Claim is in terminal state '${fromStatus}' and cannot be modified`,
      );
    }

    if (!isValidTransition(fromStatus, toStatus)) {
      throw new BadRequestException(
        `Invalid status transition: ${fromStatus} → ${toStatus}`,
      );
    }
  }
}
