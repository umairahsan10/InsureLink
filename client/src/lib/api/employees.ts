import { apiFetch } from "./client";

export interface Employee {
  id: string;
  userId: string;
  corporateId: string;
  planId: string;
  employeeNumber: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  coverageStartDate: string;
  coverageEndDate: string;
  coverageAmount: string;
  usedAmount: string;
  availableAmount: string;
  status: "Active" | "Inactive" | "Suspended" | "Terminated";
  dependentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedEmployees {
  items: Employee[];
  total: number;
  page: number;
  limit: number;
}

export interface ListEmployeesQuery {
  page?: number;
  limit?: number;
  corporateId?: string;
  status?: string;
  search?: string;
  department?: string;
}

export interface EmployeeCoverage {
  employeeId: string;
  fullName: string;
  planName: string;
  totalCoverageAmount: string;
  usedAmount: string;
  availableAmount: string;
  coverageStartDate: string;
  coverageEndDate: string;
  status: string;
}

export interface CreateEmployeeRequest {
  corporateId: string;
  planId: string;
  employeeNumber: string;
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone: string;
  coverageStartDate: string;
  coverageEndDate: string;
  designation: string;
  department: string;
  dob?: string;
  gender?: "Male" | "Female" | "Other";
  cnic?: string;
  address?: string;
}

export interface UpdateEmployeeRequest {
  planId?: string;
  employeeNumber?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  coverageStartDate?: string;
  coverageEndDate?: string;
  designation?: string;
  department?: string;
  dob?: string;
  gender?: "Male" | "Female" | "Other";
  cnic?: string;
  address?: string;
  status?: "Active" | "Inactive" | "Suspended" | "Terminated";
}

export interface BulkImportEmployeeRow {
  employeeNumber: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  password: string;
  designation: string;
  department: string;
  planId: string;
  coverageStartDate: string;
  coverageEndDate: string;
  dob?: string;
  cnic?: string;
}

export interface BulkImportValidationRowResult {
  rowIndex: number;
  valid: boolean;
  errors: string[];
  normalized?: BulkImportEmployeeRow;
}

export interface BulkImportValidationResponse {
  importToken: string;
  validCount: number;
  invalidCount: number;
  results: BulkImportValidationRowResult[];
}

export const employeesApi = {
  async list(query: ListEmployeesQuery = {}): Promise<PaginatedEmployees> {
    const params = new URLSearchParams();
    if (query.page) params.append("page", String(query.page));
    if (query.limit) params.append("limit", String(query.limit));
    if (query.corporateId) params.append("corporateId", query.corporateId);
    if (query.status) params.append("status", query.status);
    if (query.search) params.append("search", query.search);
    if (query.department) params.append("department", query.department);

    const qs = params.toString();
    const response = await apiFetch<PaginatedEmployees>(`/api/employees${qs ? `?${qs}` : ""}`);
    return response.data;
  },

  async getById(employeeId: string): Promise<Employee> {
    const response = await apiFetch<Employee>(`/api/employees/${employeeId}`);
    return response.data;
  },

  async create(payload: CreateEmployeeRequest): Promise<Employee> {
    const response = await apiFetch<Employee>("/api/employees", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  async update(employeeId: string, payload: UpdateEmployeeRequest): Promise<Employee> {
    const response = await apiFetch<Employee>(`/api/employees/${employeeId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  async remove(employeeId: string): Promise<{ success: boolean }> {
    const response = await apiFetch<{ success: boolean }>(`/api/employees/${employeeId}`, {
      method: "DELETE",
    });
    return response.data;
  },

  async getCoverage(employeeId: string): Promise<EmployeeCoverage> {
    const response = await apiFetch<EmployeeCoverage>(`/api/employees/${employeeId}/coverage`);
    return response.data;
  },

  async validateBulkImport(corporateId: string, rows: BulkImportEmployeeRow[]): Promise<BulkImportValidationResponse> {
    const response = await apiFetch<BulkImportValidationResponse>("/api/employees/bulk-import/validate", {
      method: "POST",
      body: JSON.stringify({ corporateId, rows }),
    });
    return response.data;
  },

  async commitBulkImport(importToken: string, mode: "cancel" | "skip_invalid" | "all_or_nothing"): Promise<{ importedCount: number; skippedCount: number }> {
    const response = await apiFetch<{ importedCount: number; skippedCount: number }>("/api/employees/bulk-import/commit", {
      method: "POST",
      body: JSON.stringify({ importToken, mode }),
    });
    return response.data;
  },

  async uploadCsv(corporateId: string, file: File): Promise<{ uploadId: string; validCount: number; invalidCount: number }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('corporateId', corporateId);

    const response = await apiFetch<{ uploadId: string; validCount: number; invalidCount: number }>("/api/employees/bulk-import/upload-csv", {
      method: "POST",
      body: formData,
    });
    return response.data;
  },

  async getInvalidUploads(corporateId: string): Promise<any[]> {
    const params = new URLSearchParams();
    params.append("corporateId", corporateId);
    const qs = params.toString();
    const response = await apiFetch<any[]>(`/api/employees/bulk-import/invalid${qs ? `?${qs}` : ""}`);
    return response.data;
  },

  async resubmitInvalidUpload(invalidUploadId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiFetch<{ success: boolean; message: string }>("/api/employees/bulk-import/resubmit-invalid", {
      method: "POST",
      body: JSON.stringify({ invalidUploadId }),
    });
    return response.data;
  },

  async updateInvalidUpload(invalidUploadId: string, data: {
    employeeNumber: string;
    firstName: string;
    lastName?: string;
    email: string;
    phone: string;
    password: string;
    designation: string;
    department: string;
    planId: string;
    coverageStartDate: string;
    coverageEndDate: string;
    dob?: string;
    cnic?: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiFetch<{ success: boolean; message: string }>("/api/employees/bulk-import/update-invalid", {
      method: "POST",
      body: JSON.stringify({ invalidUploadId, ...data }),
    });
    return response.data;
  },

  async deleteInvalidUpload(invalidUploadId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiFetch<{ success: boolean; message: string }>(`/api/employees/bulk-import/delete-invalid?invalidUploadId=${invalidUploadId}`, {
      method: "DELETE",
    });
    return response.data;
  },

  async findByEmployeeNumber(corporateId: string, employeeNumber: string): Promise<Employee | null> {
    const params = new URLSearchParams();
    if (corporateId) params.append('corporateId', corporateId);
    if (employeeNumber) params.append('employeeNumber', employeeNumber);
    const qs = params.toString();
    const response = await apiFetch<Employee | null>(`/api/employees/find-by-number${qs ? `?${qs}` : ''}`);
    return response.data;
  },
};
