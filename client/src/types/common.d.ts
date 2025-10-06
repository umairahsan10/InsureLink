export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterOptions {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

export type Status = 'Active' | 'Inactive' | 'Pending' | 'Expired';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface Policy {
  id: string;
  policyNumber: string;
  policyHolderId: string;
  insurerId: string;
  planType: string;
  coverageAmount: number;
  premium: number;
  startDate: string;
  endDate: string;
  status: Status;
  beneficiaries?: string[];
}


