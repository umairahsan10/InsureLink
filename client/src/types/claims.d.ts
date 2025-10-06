export type ClaimStatus = 'Approved' | 'Pending' | 'Rejected' | 'Under Review' | 'Processing';

export interface Claim {
  id: string;
  patientId: string;
  patientName: string;
  hospitalId: string;
  hospitalName: string;
  treatmentType: string;
  amount: number;
  date: string;
  status: ClaimStatus;
  insurerId: string;
  documents?: string[];
  description?: string;
}

export interface ClaimFormData {
  patientId: string;
  hospitalId: string;
  treatmentType: string;
  amount: number;
  date: string;
  documents: File[];
  description?: string;
}

export interface ClaimStatistics {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  totalAmount: number;
  approvalRate: number;
}

