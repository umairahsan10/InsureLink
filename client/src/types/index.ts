export type Role = "patient" | "hospital" | "insurer" | "corporate" | "admin";

export type ApiError = {
  message: string;
  status?: number;
  code?: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};




