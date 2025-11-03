/**
 * Column mapping utilities for flexible header matching with synonyms
 */

// Synonyms map for each field (case-insensitive matching)
const FIELD_SYNONYMS: Record<string, string[]> = {
  employeeNumber: ['employee number', 'emp no', 'employee id', 'id', 'emp number', 'emp id'],
  fullName: ['full name', 'name', 'employee name', 'emp name', 'fullname'],
  email: ['email', 'email address', 'e-mail', 'e-mail address', 'email id'],
  mobile: ['mobile', 'phone', 'mobile number', 'phone number', 'contact number', 'contact', 'mobile no', 'phone no'],
  cnic: ['cnic', 'cnic number', 'id number', 'national id', 'identity number', 'national identity', 'cnic no'],
  planId: ['plan id', 'plan', 'insurance plan', 'plan code', 'insurance', 'policy plan'],
  designation: ['designation', 'job title', 'position', 'role', 'job', 'title'],
  department: ['department', 'dept', 'division', 'dept name'],
  coverageStart: ['coverage start', 'start date', 'effective date', 'coverage start date', 'coverage begins'],
  coverageEnd: ['coverage end', 'end date', 'expiry date', 'coverage end date', 'coverage expires'],
};

export interface ColumnMap {
  employeeNumber: number | null;
  fullName: number | null;
  email: number | null;
  mobile: number | null;
  cnic: number | null;
  planId: number | null;
  designation: number | null;
  department: number | null;
  coverageStart: number | null;
  coverageEnd: number | null;
}

export interface MappingResult {
  columnMap: ColumnMap;
  unmappedRequired: string[];
  unmappedOptional: string[];
}

/**
 * Normalize a string for comparison (lowercase, trim, normalize spaces)
 */
function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Find column index for a field using synonyms
 */
function findColumnIndex(headers: string[], synonyms: string[]): number | null {
  for (let i = 0; i < headers.length; i++) {
    const normalizedHeader = normalizeString(headers[i]);
    for (const synonym of synonyms) {
      if (normalizedHeader === normalizeString(synonym)) {
        return i;
      }
    }
  }
  return null;
}

/**
 * Auto-map headers to column indices using synonyms
 * @param headers - Array of header strings from the uploaded file
 * @returns Mapping result with column indices and unmapped fields
 */
export function mapHeaders(headers: string[]): MappingResult {
  const columnMap: ColumnMap = {
    employeeNumber: findColumnIndex(headers, FIELD_SYNONYMS.employeeNumber),
    fullName: findColumnIndex(headers, FIELD_SYNONYMS.fullName),
    email: findColumnIndex(headers, FIELD_SYNONYMS.email),
    mobile: findColumnIndex(headers, FIELD_SYNONYMS.mobile),
    cnic: findColumnIndex(headers, FIELD_SYNONYMS.cnic),
    planId: findColumnIndex(headers, FIELD_SYNONYMS.planId),
    designation: findColumnIndex(headers, FIELD_SYNONYMS.designation),
    department: findColumnIndex(headers, FIELD_SYNONYMS.department),
    coverageStart: findColumnIndex(headers, FIELD_SYNONYMS.coverageStart),
    coverageEnd: findColumnIndex(headers, FIELD_SYNONYMS.coverageEnd),
  };

  const requiredFields = ['employeeNumber', 'fullName', 'email', 'mobile', 'cnic', 'planId'];
  const optionalFields = ['designation', 'department', 'coverageStart', 'coverageEnd'];

  const unmappedRequired = requiredFields.filter(field => columnMap[field as keyof ColumnMap] === null);
  const unmappedOptional = optionalFields.filter(field => columnMap[field as keyof ColumnMap] === null);

  return {
    columnMap,
    unmappedRequired,
    unmappedOptional,
  };
}

/**
 * Create a manual column map from user selections
 * @param headers - Array of header strings
 * @param manualMapping - Object with field names as keys and selected header indices as values
 */
export function createManualColumnMap(
  headers: string[],
  manualMapping: Partial<Record<keyof ColumnMap, number>>
): ColumnMap {
  const columnMap: ColumnMap = {
    employeeNumber: manualMapping.employeeNumber ?? null,
    fullName: manualMapping.fullName ?? null,
    email: manualMapping.email ?? null,
    mobile: manualMapping.mobile ?? null,
    cnic: manualMapping.cnic ?? null,
    planId: manualMapping.planId ?? null,
    designation: manualMapping.designation ?? null,
    department: manualMapping.department ?? null,
    coverageStart: manualMapping.coverageStart ?? null,
    coverageEnd: manualMapping.coverageEnd ?? null,
  };

  return columnMap;
}

/**
 * Get field display name for UI
 */
export function getFieldDisplayName(field: keyof ColumnMap): string {
  const displayNames: Record<keyof ColumnMap, string> = {
    employeeNumber: 'Employee Number',
    fullName: 'Full Name',
    email: 'Email',
    mobile: 'Mobile',
    cnic: 'CNIC',
    planId: 'Plan ID',
    designation: 'Designation',
    department: 'Department',
    coverageStart: 'Coverage Start Date',
    coverageEnd: 'Coverage End Date',
  };
  return displayNames[field];
}

/**
 * Extract value from row using column map
 */
export function getRowValue(row: string[], columnIndex: number | null): string {
  if (columnIndex === null || columnIndex >= row.length) {
    return '';
  }
  return (row[columnIndex] || '').toString().trim();
}

