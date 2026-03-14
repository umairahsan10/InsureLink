import { apiFetch } from "./client";

export interface UserInfo {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone: string;
  dob?: string;
  gender?: "Male" | "Female" | "Other";
  cnic?: string;
  address?: string;
}

export interface HospitalProfile {
  hospitalName: string;
  licenseNumber: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  emergencyPhone: string;
  hospitalType?: "reimbursable" | "non_reimbursable";
  hasEmergencyUnit?: boolean;
  isActive?: boolean;
}

export interface InsurerProfile {
  companyName: string;
  licenseNumber: string;
  address: string;
  city: string;
  province: string;
  maxCoverageLimit: number;
  networkHospitalCount?: number;
  corporateClientCount?: number;
  status?: "Active" | "Inactive" | "Suspended";
  operatingSince: string;
  isActive?: boolean;
}

export interface CorporateProfile {
  name: string;
  address: string;
  city: string;
  province: string;
  employeeCount: number;
  dependentCount?: number;
  insurerId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contractStartDate: string;
  contractEndDate: string;
  status?: "Active" | "Inactive" | "Suspended";
}

export interface CreateUserWithProfilePayload {
  user: UserInfo;
  role: "admin" | "patient" | "corporate" | "hospital" | "insurer";
  hospitalProfile?: HospitalProfile;
  insurerProfile?: InsurerProfile;
  corporateProfile?: CorporateProfile;
}

export interface CreatedUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  role: string;
  profile: object | null;
  createdAt: string;
}

export interface InsurerOption {
  id: string;
  companyName: string;
}

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string;
  userRole: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export const adminApi = {
  /**
   * Create a user with their role-specific profile
   */
  createUserWithProfile: async (
    payload: CreateUserWithProfilePayload,
  ): Promise<CreatedUserResponse> => {
    const response = await apiFetch<CreatedUserResponse>("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  /**
   * Get all users
   */
  getAllUsers: async (): Promise<UserListItem[]> => {
    const response = await apiFetch<UserListItem[]>("/api/admin/users");
    return response.data;
  },

  /**
   * Get all insurers for dropdown
   */
  getInsurers: async (): Promise<InsurerOption[]> => {
    const response = await apiFetch<InsurerOption[]>("/api/admin/insurers");
    return response.data;
  },
};
