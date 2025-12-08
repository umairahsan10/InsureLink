export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface Patient {
  id: string;
  employeeId: string | null;
  name: string;
  age: number;
  gender: string;
  dateOfBirth: string;
  email: string;
  mobile: string;
  cnic: string;
  address: string;
  corporateId: string | null;
  corporateName: string | null;
  planId: string | null;
  designation: string | null;
  department: string | null;
  coverageStart: string | null;
  coverageEnd: string | null;
  insured: boolean;
  insurance: string;
  status: "Active" | "Inactive";
  bloodGroup: string;
  emergencyContact: EmergencyContact;
  medicalHistory: string[];
  allergies: string[];
  lastVisit: string;
  lastVisitDate: string;
  registrationDate: string;
  hasActiveClaims: boolean;
}

export interface PatientDetails extends Patient {
  totalClaims?: number;
  approvedClaims?: number;
  pendingClaims?: number;
  totalReimbursed?: number;
}

export interface PatientSummary {
  id: string;
  name: string;
  age: number;
  insurance: string;
  lastVisit: string;
  status: string;
  hasActiveClaims: boolean;
}
