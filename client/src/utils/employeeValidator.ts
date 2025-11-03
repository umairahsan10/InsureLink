import { Employee } from '@/types/employee';
import { ColumnMap, getRowValue } from './columnMapper';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ParsedEmployee {
  employeeNumber: string;
  name: string;
  email: string;
  mobile: string;
  cnic: string;
  planId: string;
  designation: string;
  department: string;
  coverageStart: string;
  coverageEnd: string;
}

const ALLOWED_DEPARTMENTS = [
  'R&D', 'Product', 'Finance', 'People', 'IT', 
  'Engineering', 'Sales', 'Logistics', 'Production', 
  'Design', 'Customer'
];

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Pakistan mobile number format
 * Accepts: +92-3XX-XXXXXXX or 03XX-XXXXXXX
 */
function isValidMobile(mobile: string): boolean {
  const mobileRegex = /^(\+92-3\d{2}-\d{7}|03\d{2}-\d{7})$/;
  return mobileRegex.test(mobile);
}

/**
 * Validate Pakistan CNIC format
 * Format: XXXXX-XXXXXXX-X (exactly 13 digits with 2 hyphens)
 * Example: 12345-1234567-1
 */
function isValidCNIC(cnic: string): boolean {
  const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
  return cnicRegex.test(cnic);
}

/**
 * Check if date is valid format (YYYY-MM-DD)
 */
// Try to normalize a variety of common date formats to ISO (YYYY-MM-DD)
function normalizeDateString(input: string): string | null {
  if (!input) return null;
  const str = String(input).trim();

  // Already ISO YYYY-MM-DD
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (iso.test(str)) return str;

  // DD/MM/YYYY or D/M/YYYY
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const dmyMatch = str.match(dmy);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    const isoCandidate = `${y}-${m}-${d}`;
    const dt = new Date(isoCandidate);
    if (!isNaN(dt.getTime())) return isoCandidate;
  }

  // MM/DD/YYYY or M/D/YYYY
  const mdy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const mdyMatch = str.match(mdy);
  if (mdyMatch) {
    const m = mdyMatch[1].padStart(2, '0');
    const d = mdyMatch[2].padStart(2, '0');
    const y = mdyMatch[3];
    const isoCandidate = `${y}-${m}-${d}`;
    const dt = new Date(isoCandidate);
    if (!isNaN(dt.getTime())) return isoCandidate;
  }

  // Excel serialized date number
  if (/^\d+$/.test(str)) {
    const serial = parseInt(str, 10);
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const ms = serial * 24 * 60 * 60 * 1000;
    const dt = new Date(excelEpoch.getTime() + ms);
    if (!isNaN(dt.getTime())) {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dt.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // Last resort: Date.parse on known patterns
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

function isValidDate(dateStr: string): boolean {
  return normalizeDateString(dateStr) !== null;
}

/**
 * Parse a row into an employee object using column map
 */
export function parseEmployeeRow(row: string[], columnMap: ColumnMap): ParsedEmployee {
  const coverageStartRaw = getRowValue(row, columnMap.coverageStart);
  const coverageEndRaw = getRowValue(row, columnMap.coverageEnd);
  const normalizedStart = normalizeDateString(coverageStartRaw) || coverageStartRaw;
  const normalizedEnd = normalizeDateString(coverageEndRaw) || coverageEndRaw;

  return {
    employeeNumber: getRowValue(row, columnMap.employeeNumber),
    name: getRowValue(row, columnMap.fullName),
    email: getRowValue(row, columnMap.email),
    mobile: getRowValue(row, columnMap.mobile),
    cnic: getRowValue(row, columnMap.cnic),
    planId: getRowValue(row, columnMap.planId),
    designation: getRowValue(row, columnMap.designation) || '',
    department: getRowValue(row, columnMap.department) || '',
    coverageStart: normalizedStart || '2025-01-01',
    coverageEnd: normalizedEnd || '2025-12-31',
  };
}

/**
 * Validate an employee row
 * @param row - Data row from parsed file
 * @param columnMap - Column mapping
 * @param existingEmployees - Existing employees to check for duplicates
 * @param importBatchEmployees - Other employees in current import batch (for duplicate detection)
 */
export function validateEmployeeRow(
  row: string[],
  columnMap: ColumnMap,
  existingEmployees: Employee[],
  importBatchEmployees: ParsedEmployee[] = [],
  currentIndex?: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const employee = parseEmployeeRow(row, columnMap);

  // Required field validation
  if (!employee.employeeNumber.trim()) {
    errors.push('Employee Number is required');
  }

  if (!employee.name.trim()) {
    errors.push('Full Name is required');
  }

  if (!employee.email.trim()) {
    errors.push('Email is required');
  } else if (!isValidEmail(employee.email)) {
    errors.push('Invalid email format');
  }

  if (!employee.mobile.trim()) {
    errors.push('Mobile is required');
  } else if (!isValidMobile(employee.mobile)) {
    errors.push('Invalid mobile format (expected: +92-3XX-XXXXXXX or 03XX-XXXXXXX)');
  }

  if (!employee.cnic.trim()) {
    errors.push('CNIC is required');
  } else if (!isValidCNIC(employee.cnic)) {
    errors.push('Invalid CNIC format (expected: XXXXX-XXXXXXX-X, e.g., 12345-1234567-1)');
  }

  if (!employee.planId.trim()) {
    errors.push('Plan ID is required');
  }

  // Optional field validation (if provided, validate format)
  if (employee.department && !ALLOWED_DEPARTMENTS.includes(employee.department)) {
    errors.push(`Department must be one of: ${ALLOWED_DEPARTMENTS.join(', ')}`);
  }

  if (employee.coverageStart && !isValidDate(employee.coverageStart)) {
    errors.push('Invalid Coverage Start Date format (expected: YYYY-MM-DD)');
  }

  if (employee.coverageEnd && !isValidDate(employee.coverageEnd)) {
    errors.push('Invalid Coverage End Date format (expected: YYYY-MM-DD)');
  }

  // Duplicate detection - check against existing employees
  if (employee.employeeNumber.trim()) {
    const duplicateEmp = existingEmployees.find(
      emp => emp.employeeNumber.toLowerCase() === employee.employeeNumber.toLowerCase()
    );
    if (duplicateEmp) {
      errors.push(`Duplicate Employee Number: already exists (${duplicateEmp.name})`);
    }
  }

  if (employee.email.trim()) {
    const duplicateEmail = existingEmployees.find(
      emp => emp.email.toLowerCase() === employee.email.toLowerCase()
    );
    if (duplicateEmail) {
      errors.push(`Duplicate Email: already exists (${duplicateEmail.name})`);
    }
  }

  // Duplicate detection - check against current import batch (exclude current index)
  if (employee.employeeNumber.trim()) {
    const hasBatchDuplicate = importBatchEmployees.some((emp, idx) =>
      idx !== currentIndex && emp.employeeNumber.toLowerCase() === employee.employeeNumber.toLowerCase()
    );
    if (hasBatchDuplicate) {
      errors.push('Duplicate Employee Number in upload file');
    }
  }

  if (employee.email.trim()) {
    const hasBatchDuplicateEmail = importBatchEmployees.some((emp, idx) =>
      idx !== currentIndex && emp.email.toLowerCase() === employee.email.toLowerCase()
    );
    if (hasBatchDuplicateEmail) {
      errors.push('Duplicate Email in upload file');
    }
  }

  // Optional field warnings
  if (!employee.designation) {
    warnings.push('Designation not provided');
  }

  if (!employee.department) {
    warnings.push('Department not provided');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Convert parsed employee to Employee format (adds required fields)
 */
export function toEmployee(
  parsedEmployee: ParsedEmployee,
  corporateId: string = 'corp-001',
  index: number = 0
): Employee {
  return {
    id: `emp-${Date.now()}-${index}`,
    employeeNumber: parsedEmployee.employeeNumber,
    name: parsedEmployee.name,
    email: parsedEmployee.email,
    mobile: parsedEmployee.mobile,
    corporateId,
    planId: parsedEmployee.planId,
    coverageStart: parsedEmployee.coverageStart || '2025-01-01',
    coverageEnd: parsedEmployee.coverageEnd || '2025-12-31',
    designation: parsedEmployee.designation || '',
    department: parsedEmployee.department || '',
  };
}

/**
 * Validate an employee object (not from CSV row), e.g., after editing invalid row
 */
export function validateEmployeeObject(
  employee: ParsedEmployee,
  existingEmployees: Employee[],
  importBatchEmployees: ParsedEmployee[] = []
): ValidationResult {
  // Reuse logic by mapping the object into row-less checks
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!employee.employeeNumber.trim()) {
    errors.push('Employee Number is required');
  }

  if (!employee.name.trim()) {
    errors.push('Full Name is required');
  }

  if (!employee.email.trim()) {
    errors.push('Email is required');
  } else if (!isValidEmail(employee.email)) {
    errors.push('Invalid email format');
  }

  if (!employee.mobile.trim()) {
    errors.push('Mobile is required');
  } else if (!isValidMobile(employee.mobile)) {
    errors.push('Invalid mobile format (expected: +92-3XX-XXXXXXX or 03XX-XXXXXXX)');
  }

  if (!employee.cnic.trim()) {
    errors.push('CNIC is required');
  } else if (!isValidCNIC(employee.cnic)) {
    errors.push('Invalid CNIC format (expected: XXXXX-XXXXXXX-X, e.g., 12345-1234567-1)');
  }

  if (!employee.planId.trim()) {
    errors.push('Plan ID is required');
  }

  if (employee.department && !ALLOWED_DEPARTMENTS.includes(employee.department)) {
    errors.push(`Department must be one of: ${ALLOWED_DEPARTMENTS.join(', ')}`);
  }

  if (employee.coverageStart && !isValidDate(employee.coverageStart)) {
    errors.push('Invalid Coverage Start Date format (expected: YYYY-MM-DD)');
  }

  if (employee.coverageEnd && !isValidDate(employee.coverageEnd)) {
    errors.push('Invalid Coverage End Date format (expected: YYYY-MM-DD)');
  }

  // Duplicate detection - check against existing employees
  if (employee.employeeNumber.trim()) {
    const duplicateEmp = existingEmployees.find(
      emp => emp.employeeNumber.toLowerCase() === employee.employeeNumber.toLowerCase()
    );
    if (duplicateEmp) {
      errors.push(`Duplicate Employee Number: already exists (${duplicateEmp.name})`);
    }
  }

  if (employee.email.trim()) {
    const duplicateEmail = existingEmployees.find(
      emp => emp.email.toLowerCase() === employee.email.toLowerCase()
    );
    if (duplicateEmail) {
      errors.push(`Duplicate Email: already exists (${duplicateEmail.name})`);
    }
  }

  // Duplicate detection - check against current edited batch (if any)
  if (employee.employeeNumber.trim()) {
    const batchDuplicate = importBatchEmployees.find(
      emp => emp.employeeNumber.toLowerCase() === employee.employeeNumber.toLowerCase() &&
             emp !== employee
    );
    if (batchDuplicate) {
      errors.push('Duplicate Employee Number in current edit session');
    }
  }

  if (employee.email.trim()) {
    const batchDuplicateEmail = importBatchEmployees.find(
      emp => emp.email.toLowerCase() === employee.email.toLowerCase() &&
             emp !== employee
    );
    if (batchDuplicateEmail) {
      errors.push('Duplicate Email in current edit session');
    }
  }

  if (!employee.designation) {
    warnings.push('Designation not provided');
  }

  if (!employee.department) {
    warnings.push('Department not provided');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

