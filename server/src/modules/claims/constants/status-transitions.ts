import { ClaimStatus } from '@prisma/client';

/**
 * Valid claim status transitions
 * - Pending: Initial state, can transition to Approved, Rejected, or OnHold
 * - OnHold: Can transition to Approved or Rejected
 * - Approved: Can only transition to Paid
 * - Rejected: Terminal state (no transitions allowed)
 * - Paid: Terminal state (no transitions allowed)
 */
export const STATUS_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  [ClaimStatus.Pending]: [
    ClaimStatus.Approved,
    ClaimStatus.Rejected,
    ClaimStatus.OnHold,
  ],
  [ClaimStatus.OnHold]: [ClaimStatus.Approved, ClaimStatus.Rejected],
  [ClaimStatus.Approved]: [ClaimStatus.Paid],
  [ClaimStatus.Rejected]: [], // Terminal state
  [ClaimStatus.Paid]: [], // Terminal state
};

/**
 * Terminal states that cannot transition to any other state
 */
export const TERMINAL_STATES: ClaimStatus[] = [
  ClaimStatus.Rejected,
  ClaimStatus.Paid,
];

/**
 * Check if a status transition is valid
 */
export function isValidTransition(from: ClaimStatus, to: ClaimStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Check if a status is a terminal state
 */
export function isTerminalState(status: ClaimStatus): boolean {
  return TERMINAL_STATES.includes(status);
}

/**
 * Claim action types for events
 */
export enum ClaimAction {
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  CLAIM_UPDATED = 'CLAIM_UPDATED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  CLAIM_REJECTED = 'CLAIM_REJECTED',
  CLAIM_ON_HOLD = 'CLAIM_ON_HOLD',
  CLAIM_PAID = 'CLAIM_PAID',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_DELETED = 'DOCUMENT_DELETED',
}
