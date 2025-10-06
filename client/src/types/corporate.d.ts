export interface CorporateContact {
  name: string;
  email: string;
  phone: string;
}

export interface Corporate {
  id: string;
  name: string;
  hrContact: CorporateContact;
  totalEmployees: number;
  plans: string[];
  contractStart: string;
  contractEnd: string;
}

export interface Plan {
  id: string;
  name: string;
  corporateId: string;
  sumInsured: number;
  deductible: number;
  copayPercent: number;
  coveredServices: string[];
  limits: Record<string, number>;
  validFrom: string;
  validUntil: string;
}

