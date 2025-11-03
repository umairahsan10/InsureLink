export type DependentStatus = 'Pending' | 'Approved' | 'Rejected';
export type Relationship = 'Spouse' | 'Son' | 'Daughter' | 'Father' | 'Mother';
export type Gender = 'Male' | 'Female' | 'Other';

export interface Dependent {
  id: string;
  employeeId: string;
  employeeName: string;
  corporateId: string;
  name: string;
  relationship: Relationship;
  dateOfBirth: string;
  gender: Gender;
  cnic: string;
  phoneNumber?: string;
  status: DependentStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  documents: string[];
  coverageStartDate: string;
}

export interface DependentFormData {
  name: string;
  relationship: Relationship;
  dateOfBirth: string;
  gender: Gender;
  cnic: string;
  phoneNumber: string;
  coverageStartDate: string;
  documents: File[];
}

