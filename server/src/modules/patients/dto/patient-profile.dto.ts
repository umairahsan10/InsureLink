export class PatientProfileDto {
  patientId: number;
  name: string;
  email: string;
}

export class UpdatePatientProfileDto {
  email?: string;
  mobile?: string;
}


