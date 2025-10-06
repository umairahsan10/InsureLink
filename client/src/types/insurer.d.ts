export interface InsurerStaff {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface InsurerBranding {
  primaryColor: string;
  logoText: string;
}

export interface Insurer {
  id: string;
  name: string;
  address: string;
  staff: InsurerStaff[];
  slaHours: number;
  branding: InsurerBranding;
}

