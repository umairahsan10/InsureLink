export type HospitalType = 'reimbursable' | 'non-reimbursable';

export interface HospitalEntity {
  id: string;
  name: string;
  city: string;
  address: string;
  contact: string;
  type: HospitalType;
  specialties: string[];
  acceptedPlans: string[];
  lat?: number;
  lng?: number;
  locationHint?: string;
  hasEmergency?: boolean;
  is24Hours?: boolean;
}

export interface HospitalFormData {
  name: string;
  city: string;
  address: string;
  contact: string;
  type: HospitalType;
  specialties: string[];
  acceptedPlans: string[];
}

