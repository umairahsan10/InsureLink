import { apiFetch } from "./client";

export interface Dependent {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
}

const BASE = "/api/v1/dependents";

export const dependentsApi = {
  async getDependentsByEmployeeNumber(
    employeeNumber: string,
  ): Promise<Dependent[]> {
    const res = await apiFetch<Dependent[]>(
      `${BASE}/by-employee/${employeeNumber}`,
    );
    return res.data;
  },
};
