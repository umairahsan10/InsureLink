export interface HospitalEntity {
  id: string;
  name: string;
  address: string;
  contact: string;
  panelStatus: 'Panel' | 'Non-Panel';
  specialties: string[];
  acceptedPlans: string[];
}

export interface HospitalFormData {
  name: string;
  address: string;
  contact: string;
  panelStatus: 'Panel' | 'Non-Panel';
  specialties: string[];
  acceptedPlans: string[];
}

