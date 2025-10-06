export interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  mobile: string;
  corporateId: string;
  planId: string;
  coverageStart: string;
  coverageEnd: string;
  designation: string;
  department: string;
}

export interface EmployeeFormData {
  employeeNumber: string;
  name: string;
  email: string;
  mobile: string;
  planId: string;
  coverageStart: string;
  coverageEnd: string;
  designation: string;
  department: string;
}

