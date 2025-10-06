export interface ClaimsByStatus {
  Submitted: number;
  DocumentsUploaded: number;
  UnderReview: number;
  MoreInfoRequested: number;
  PendingApproval: number;
  Approved: number;
  Rejected: number;
  Paid: number;
}

export interface MonthlyTrend {
  month: string;
  count: number;
  value: number;
}

export interface HospitalByAmount {
  hospitalId: string;
  hospitalName: string;
  totalAmount: number;
}

export interface ClaimsPerCorporate {
  corporateId: string;
  corporateName: string;
  count: number;
  value: number;
}

export interface Analytics {
  claimsByStatus: ClaimsByStatus;
  totalClaims: number;
  totalClaimValue: number;
  approvedValueTotal: number;
  monthlyTrends: MonthlyTrend[];
  avgProcessingTimeHours: number;
  topHospitalsByAmount: HospitalByAmount[];
  claimsPerCorporate: ClaimsPerCorporate[];
  rejectionRate: number;
  fraudFlaggedCount: number;
}

