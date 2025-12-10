export type ClaimStatus = "Pending" | "Approved" | "Rejected";

export interface ClaimEvent {
  ts: string;
  actorName: string;
  actorRole: string;
  action: string;
  from: ClaimStatus | null;
  to: ClaimStatus;
  note?: string;
}

export interface Claim {
  id: string;
  claimNumber: string;
  employeeId: string;
  employeeName: string;
  corporateId: string;
  corporateName: string;
  hospitalId: string;
  hospitalName: string;
  planId: string;
  status: ClaimStatus;
  amountClaimed: number;
  approvedAmount: number;
  admissionDate: string;
  dischargeDate: string;
  documents: string[];
  events: ClaimEvent[];
  createdAt: string;
  updatedAt: string;
  fraudRiskScore: number;
  priority: "Normal" | "High" | "Low";
  treatmentCategory?: string;
  notes?: string;
}

export interface ClaimFormData {
  employeeId: string;
  hospitalId: string;
  planId: string;
  amountClaimed: number;
  admissionDate: string;
  dischargeDate: string;
  documents: File[];
  treatmentType?: string;
}

export interface ClaimStatistics {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  totalAmount: number;
  approvalRate: number;
}

export interface ClaimDocument {
  id: string;
  claimId: string;
  type: "discharge-summary" | "bill" | "lab-report" | "prescription" | "other";
  filename: string;
  url: string;
  uploadedByRole: string;
  uploadedAt: string;
  status: "Uploaded" | "Verified" | "Rejected";
}
