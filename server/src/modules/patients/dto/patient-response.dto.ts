export class PatientSummaryDto {
  id: string;
  patientType: 'employee' | 'dependent';
  name: string;
  age: number;
  gender: string;
  email?: string;
  mobile?: string;
  cnic?: string;
  corporateName?: string;
  insurance?: string;
  status: 'Active' | 'Inactive';
  lastVisit?: string;
  hasActiveClaims: boolean;
}

export class PaginatedPatientsDto {
  items: PatientSummaryDto[];
  total: number;
  page: number;
  limit: number;
}

export class PatientClaimsDto {
  items: Array<Record<string, unknown>>;
  total: number;
}

export class PatientVisitsDto {
  items: Array<Record<string, unknown>>;
  total: number;
}
