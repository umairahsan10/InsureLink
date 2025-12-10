# Claims Linking Quick Reference

## System Overview

- **Total Claims:** 12
- **Data Source:** `/client/src/data/claims.json`
- **Type Definitions:** `/client/src/types/claims.d.ts`

## Portal Access Patterns

### Insurer Portal (`/insurer/claims`)

```typescript
// Shows: ALL claims
// No filtering - complete view of system
const claimsToDisplay = allClaims; // All 12
```

### Corporate Portal (`/corporate/claims`)

```typescript
// Shows: Only claims for the logged-in corporate
const currentCorporateId = "corp-001"; // From auth context
const claimsToDisplay = allClaims.filter(
  (c) => c.corporateId === currentCorporateId
);
// Acme Ltd: 7 claims
// Beta Systems: 4 claims
// Noor Foods: 3 claims
```

### Patient/Employee Portal (`/patient/claims`, `/patient/history`)

```typescript
// Shows: Only claims submitted by the logged-in employee
const currentEmployeeId = "emp-001"; // From auth context
const claimsToDisplay = allClaims.filter(
  (c) => c.employeeId === currentEmployeeId
);
// Example: Ali Raza (emp-001): 3 claims
```

### Hospital Portal (`/hospital/claims`)

```typescript
// Shows: Only claims submitted to the hospital
const currentHospitalId = "hosp-001"; // From auth context
const claimsToDisplay = allClaims.filter(
  (c) => c.hospitalId === currentHospitalId
);
// City General: 3 claims
// Eastside Medical: 4 claims
// NorthCare: 2 claims
// Crescent Clinic: 3 claims
// Lakeside Hospital: 2 claims
```

## Claim Object Structure

```typescript
interface Claim {
  id: string; // "clm-0001"
  claimNumber: string; // "CLM-2025-0001"
  employeeId: string; // "emp-001" - Employee/Patient ID
  employeeName: string; // "Ali Raza" - Employee/Patient Name
  corporateId: string; // "corp-001" - Corporate ID
  corporateName: string; // "Acme Ltd"
  hospitalId: string; // "hosp-001" - Hospital ID
  hospitalName: string; // "City General Hospital"
  planId: string; // "plan-acme-gold-2025"
  status: string; // "Pending" | "Approved" | "Rejected"
  amountClaimed: number; // 125000
  approvedAmount: number; // Amount approved by insurer
  treatmentCategory: string; // "Surgery", "Lab Tests", etc.
  admissionDate: string; // "2025-10-02"
  dischargeDate: string; // "2025-10-04"
  documents: string[]; // Document IDs
  events: ClaimEvent[]; // Status change history
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  fraudRiskScore: number; // 0.0 - 1.0
  priority: string; // "Normal" | "High" | "Low"
}
```

## Key IDs Reference

### Corporates

- `corp-001`: Acme Ltd (7 claims)
- `corp-002`: Beta Systems (4 claims)
- `corp-003`: Noor Foods (3 claims)

### Employees/Patients

- `emp-001`: Ali Raza (3 claims) ⭐
- `emp-002`: Sara Khan (1 claim)
- `emp-003`: Omar Malik (1 claim)
- `emp-005`: Bilal Khan (1 claim)
- `emp-006`: Nadia Farooq (1 claim)
- `emp-007`: Imran Qureshi (1 claim)
- `emp-009`: Fahad Ahmed (1 claim)
- `emp-010`: Sana Rafi (1 claim)
- `emp-012`: Amna Iqbal (1 claim)
- `emp-014`: Zara Khan (1 claim)
- `emp-016`: Ayesha Mir (1 claim)
- `emp-020`: Zubair Ahmed (1 claim)

### Hospitals

- `hosp-001`: City General Hospital (3 claims)
- `hosp-002`: Eastside Medical Center (4 claims)
- `hosp-003`: NorthCare Hospital (2 claims)
- `hosp-004`: Crescent Clinic (3 claims)
- `hosp-005`: Lakeside Hospital (2 claims)

## Implementation Locations

| Portal          | File                             | Key Variables                            |
| --------------- | -------------------------------- | ---------------------------------------- |
| Insurer         | `/app/insurer/claims/page.tsx`   | `defaultClaimData`, `loadStoredClaims()` |
| Corporate       | `/app/corporate/claims/page.tsx` | `currentCorporateId = "corp-001"`        |
| Patient         | `/app/patient/claims/page.tsx`   | Form submission (not filtering)          |
| Patient History | `/app/patient/history/page.tsx`  | `const patientId = "emp-001"`            |
| Hospital        | `/app/hospital/claims/page.tsx`  | `currentHospitalId = "hosp-001"`         |

## For Future Development

### To Add Auth Context Integration:

Replace hardcoded IDs with context values:

```typescript
// Corporate Portal
const { user } = useAuth();
const corporateId = user?.corporateId; // Instead of "corp-001"

// Hospital Portal
const { user } = useAuth();
const hospitalId = user?.hospitalId; // Instead of "hosp-001"

// Patient Portal
const { user } = useAuth();
const employeeId = user?.id; // Instead of "emp-001"
```

### To Add Real-time Updates:

```typescript
// Listen to claim updates
useEffect(() => {
  const handleClaimsUpdate = (event: CustomEvent<ClaimData[]>) => {
    setClaims(event.detail);
  };

  window.addEventListener(CLAIMS_UPDATED_EVENT, handleClaimsUpdate);
  return () =>
    window.removeEventListener(CLAIMS_UPDATED_EVENT, handleClaimsUpdate);
}, []);
```

## Testing Checklist

- [ ] Insurer sees all 12 claims
- [ ] Corporate (corp-001) sees exactly 7 claims
- [ ] Corporate (corp-002) sees exactly 4 claims
- [ ] Corporate (corp-003) sees exactly 3 claims
- [ ] Patient (emp-001) sees exactly 3 claims
- [ ] Hospital (hosp-001) sees exactly 3 claims
- [ ] Claims counts match across portals
- [ ] Search filtering works per portal
- [ ] Status filtering works per portal
- [ ] Claim details display correctly
- [ ] Status updates reflect across portals

## Statistics

| Metric            | Value       |
| ----------------- | ----------- |
| Total Claims      | 12          |
| Total Amount      | 520,500 PKR |
| Pending Claims    | 8           |
| Approved Claims   | 3           |
| Rejected Claims   | 1           |
| High Priority     | 1           |
| Unique Corporates | 3           |
| Unique Employees  | 12          |
| Unique Hospitals  | 5           |

## Common Issues & Solutions

**Issue:** Claims showing across different corporates
**Solution:** Check `currentCorporateId` is being used in filter

**Issue:** Employee seeing claims from other employees
**Solution:** Check patient history page filters by `employeeId`

**Issue:** Hospital showing claims from other hospitals
**Solution:** Check `currentHospitalId` is being used in filter

**Issue:** Claim counts don't match
**Solution:** Verify filter conditions in useMemo hooks
