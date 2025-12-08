# Patient and Claims Data Structure

## Overview
This document explains how patients and claims are structured and related in the InsureLink application.

## Data Files

### 1. patients.json
**Location:** `client/src/data/patients.json`

Contains comprehensive patient records (30 patients total):
- **Patients 1-20 (PAT-1001 to PAT-1020)**: Insured patients with employee records
  - Linked to `employees.json` via `employeeId`
  - Have corporate insurance coverage
  - Can submit insurance claims through their corporate plans
  
- **Patients 21-30 (PAT-1021 to PAT-1030)**: Non-insured/walk-in patients
  - `employeeId` is `null`
  - No corporate insurance
  - Pay out of pocket

### 2. employees.json
**Location:** `client/src/data/employees.json`

Contains employee records from various corporates. Each employee who visits a hospital as a patient has a corresponding entry in `patients.json`.

**Relationship:**
```
Patient.employeeId → Employee.id
```

### 3. claims.json
**Location:** `client/src/data/claims.json`

Contains insurance claim records. Claims reference patients through their employee IDs.

**Relationship:**
```
Claim.employeeId → Patient.employeeId → Employee.id
Claim.employeeName → Patient.name
```

## Patient Data Structure

```typescript
interface Patient {
  id: string;                    // Patient ID (PAT-XXXX)
  employeeId: string | null;     // Links to Employee ID (emp-XXX) or null
  name: string;
  age: number;
  gender: string;
  dateOfBirth: string;
  email: string;
  mobile: string;
  cnic: string;
  address: string;
  corporateId: string | null;    // Links to Corporate
  corporateName: string | null;
  planId: string | null;         // Links to Insurance Plan
  designation: string | null;
  department: string | null;
  coverageStart: string | null;
  coverageEnd: string | null;
  insured: boolean;              // Quick check for insurance status
  insurance: string;             // Insurance plan name or "None"
  status: "Active" | "Inactive";
  bloodGroup: string;
  emergencyContact: EmergencyContact;
  medicalHistory: string[];
  allergies: string[];
  lastVisit: string;
  lastVisitDate: string;
  registrationDate: string;
  hasActiveClaims: boolean;      // Quick flag for active claims
}
```

## Patients in Claims Records

The following patients currently have claims in `claims.json`:

1. **Ali Raza** (PAT-1001 / emp-001) - 3 claims
   - CLM-2025-0001 (Surgery, Pending)
   - CLM-2025-0001A (Consultation, Approved)
   - CLM-2025-0001B (Lab Tests, Approved)

2. **Sara Khan** (PAT-1002 / emp-002) - 1 claim
   - CLM-2025-0002 (Routine Checkup, Pending)

3. **Bilal Khan** (PAT-1005 / emp-005) - 1 claim
   - CLM-2025-0003 (Routine Checkup, Pending)

4. **Fahad Ahmed** (PAT-1009 / emp-009) - 1 claim
   - CLM-2025-0004 (Routine Checkup, Pending)

5. **Sana Rafi** (PAT-1010 / emp-010) - 1 claim
   - CLM-2025-0005 (Cardiology, Pending)

These patients have `hasActiveClaims: true` in their patient records.

## Usage Across Portals

### Hospital Portal
- **Patients Page:** Uses `patients.json` to display all patients (both insured and non-insured)
- **Submit Claim Form:** Uses `patients.json` filtered by `insured: true` to show only patients eligible for insurance claims
- **Claims Dashboard:** Links claims back to patients via `employeeId`

### Patient Portal
- Uses `employeeId` from auth context to filter claims from `claims.json`
- Patient dashboard shows claims history and statistics

### Insurer Portal
- Processes claims that reference patients via `employeeId` and `employeeName`
- Validates against employee/patient records

### Corporate Portal
- Views employees' claims data
- Employees are the same as insured patients

## Best Practices

1. **Adding a New Patient:**
   - Add to `patients.json` with a unique `id` (PAT-XXXX)
   - If insured, link to existing `employeeId` from `employees.json`
   - Set `insured: true` if they have coverage
   - Set `hasActiveClaims: false` initially

2. **Creating a Claim:**
   - Reference patient's `employeeId` (not patient `id`)
   - Use `employeeName` for display purposes
   - Claims can only be created for insured patients (`insured: true`)

3. **Consistency:**
   - Always keep `Patient.name` in sync with `Employee.name`
   - Update `hasActiveClaims` when claim status changes
   - Ensure `lastVisit` reflects the most recent hospital visit

## Migration Notes

Previously, the hospital patients page used hardcoded patient data. Now it uses the centralized `patients.json` file which ensures:
- Consistency across all portals
- Single source of truth for patient data
- Easier maintenance and updates
- Proper linking between patients, employees, and claims
