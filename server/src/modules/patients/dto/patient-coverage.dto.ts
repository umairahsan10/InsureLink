export class PatientCoverageDto {
  patientId: string;
  patientType: 'employee' | 'dependent';
  isEligible: boolean;
  reason: string;
  totalCoverageAmount: string;
  usedAmount: string;
  availableAmount: string;
  coverageStartDate: Date;
  coverageEndDate: Date;
}
