export type UserRole = 'patient' | 'corporate' | 'hospital' | 'insurer' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth: string;
  address: string;
  policyNumber: string;
  insurerId: string;
  coverageAmount: number;
  usedAmount: number;
  policyStatus: 'Active' | 'Inactive' | 'Expired';
  policyExpiry: string;
}

export interface Corporate extends User {
  role: 'corporate';
  companyName: string;
  industry: string;
  companyAddress: string;
  employeeCount: number;
  activePolicies: number;
  monthlyPremiumTotal: number;
  insurerId: string;
  status: 'Active' | 'Inactive';
  memberSince: string;
}

export interface Hospital extends User {
  role: 'hospital';
  hospitalName: string;
  licenseNumber: string;
  accreditation: string;
  address: string;
  emergencyPhone: string;
  bedCapacity: number;
  icuBeds: number;
  departments: string[];
  networkStatus: 'Active' | 'Pending' | 'Inactive';
  partneredInsurers: string[];
}

export interface Insurer extends User {
  role: 'insurer';
  companyName: string;
  licenseNumber: string;
  registrationNumber: string;
  address: string;
  website?: string;
  availablePlans: string[];
  maxCoverageLimit: number;
  claimProcessingTime: string;
  networkHospitals: number;
  corporateClients: number;
  activePolicyholders: number;
  status: 'Active' | 'Inactive';
  operatingSince: string;
  licenseExpiry: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
}

