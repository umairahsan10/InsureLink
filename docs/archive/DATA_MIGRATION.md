# Data Migration & Updates

## Overview

All mock data files and related code have been updated to support the new comprehensive insurance data structure with 3 corporates, 20 employees, 5 hospitals, 6 plans, and 12 detailed claims.

---

## ✅ Updated Files

### 📊 Mock Data Files (`src/data/`)

| File | Status | Description |
|------|--------|-------------|
| `insurer.json` | ✅ Updated | InsureLink Insurance with 3 staff members |
| `corporates.json` | ✅ Replaced | 3 corporates (Acme Ltd, Beta Systems, Noor Foods) |
| `claims.json` | ✅ Updated | 12 claims with full lifecycle events |
| `plans.json` | ✅ Created | 6 insurance plans (2 per corporate) |
| `hospitals.json` | ✅ Created | 5 hospitals with specialties |
| `employees.json` | ✅ Created | 20 employees across corporates |
| `documents.json` | ✅ Created | 15 document records |
| `transactions.json` | ✅ Created | 2 payment transactions |
| `chats.json` | ✅ Created | 3 chat threads |
| `analytics.json` | ✅ Created | Aggregated statistics |
| `patients.json` | ❌ Deleted | Replaced by `employees.json` |
| `corporate.json` | ❌ Old | Replaced by `corporates.json` |

---

### 📝 Type Definitions (`src/types/`)

| File | Status | Description |
|------|--------|-------------|
| `claims.d.ts` | ✅ Updated | New claim statuses, events, and structure |
| `employee.d.ts` | ✅ Created | Employee interface |
| `corporate.d.ts` | ✅ Created | Corporate and Plan interfaces |
| `hospital.d.ts` | ✅ Created | Hospital interface |
| `insurer.d.ts` | ✅ Created | Insurer staff and branding |
| `analytics.d.ts` | ✅ Created | Analytics data structure |
| `chat.d.ts` | ✅ Created | Chat message structure |
| `transaction.d.ts` | ✅ Created | Transaction interface |
| `common.d.ts` | ✅ Updated | Removed duplicate Plan interface |
| `index.ts` | ✅ Updated | Exports all new types |

---

### 🔌 API Routes (`src/app/api/`)

| File | Status | Description |
|------|--------|-------------|
| `claims/route.ts` | ✅ Updated | Filters by employee/corporate/hospital/status |
| `employees/route.ts` | ✅ Created | CRUD for employees |
| `corporates/route.ts` | ✅ Created | GET corporates |
| `hospitals/route.ts` | ✅ Created | GET hospitals with plan filtering |
| `plans/route.ts` | ✅ Created | GET plans by corporate |
| `analytics/route.ts` | ✅ Created | GET analytics data |
| `users/route.ts` | ❌ Deleted | Replaced by `employees/route.ts` |
| `auth/route.ts` | ✅ Unchanged | Still works as before |

---

### 🪝 Custom Hooks (`src/lib/hooks/`)

| File | Status | Description |
|------|--------|-------------|
| `useFetchClaims.ts` | ✅ Updated | New filter options (employee, corporate, hospital, status) |
| `useFetchEmployees.ts` | ✅ Created | Fetch employees by corporate or plan |

---

## 🔄 Key Changes

### 1. **Data Structure Changes**

**Before:**
- `patientId`, `patientName` → Claims referenced patients

**After:**
- `employeeId`, `employeeName`, `corporateId`, `corporateName` → Claims now reference employees and corporates

### 2. **New Claim Statuses**

Old: `Approved | Pending | Rejected | Under Review | Processing`

New: `Submitted | DocumentsUploaded | UnderReview | MoreInfoRequested | PendingApproval | Approved | Rejected | Paid`

### 3. **Claim Events Timeline**

Each claim now includes an `events` array for lifecycle visualization:

```typescript
{
  ts: string;
  actorName: string;
  actorRole: string;
  action: string;
  from: ClaimStatus | null;
  to: ClaimStatus;
  note?: string;
}
```

### 4. **New Entities**

- **Plans**: Insurance plan details with coverage, deductibles, copay
- **Hospitals**: Panel status, specialties, accepted plans
- **Employees**: Corporate employees with plan assignments
- **Documents**: Claim documents (bills, discharge summaries, lab reports)
- **Transactions**: Payment records
- **Chats**: Employee-insurer communication threads
- **Analytics**: Pre-computed statistics and trends

---

## 🎯 API Endpoints

### Claims
```
GET  /api/claims?employeeId=emp-001
GET  /api/claims?corporateId=corp-001
GET  /api/claims?hospitalId=hosp-001
GET  /api/claims?status=Approved
POST /api/claims
```

### Employees
```
GET  /api/employees?id=emp-001
GET  /api/employees?corporateId=corp-001
GET  /api/employees?planId=plan-acme-gold-2025
POST /api/employees
PUT  /api/employees
```

### Corporates
```
GET /api/corporates
GET /api/corporates?id=corp-001
```

### Hospitals
```
GET /api/hospitals
GET /api/hospitals?id=hosp-001
GET /api/hospitals?planId=plan-acme-gold-2025
```

### Plans
```
GET /api/plans
GET /api/plans?id=plan-acme-gold-2025
GET /api/plans?corporateId=corp-001
```

### Analytics
```
GET /api/analytics
```

---

## 🔗 Data Relationships

```
Insurer (1)
  └── Corporates (3)
        ├── Plans (6) - 2 per corporate
        └── Employees (20)
              └── Claims (12)
                    ├── Documents (15)
                    ├── Transactions (2)
                    └── Chat Threads (3)

Hospitals (5)
  └── Accept Plans (multiple)
```

---

## 📦 Usage Examples

### Fetch Claims for an Employee
```typescript
import { useFetchClaims } from '@/lib/hooks/useFetchClaims';

const { claims, loading, error } = useFetchClaims({ 
  employeeId: 'emp-001' 
});
```

### Fetch Employees for a Corporate
```typescript
import { useFetchEmployees } from '@/lib/hooks/useFetchEmployees';

const { employees, loading, error } = useFetchEmployees({ 
  corporateId: 'corp-001' 
});
```

### Import Data Directly
```typescript
import claimsData from '@/data/claims.json';
import employeesData from '@/data/employees.json';
import analyticsData from '@/data/analytics.json';
```

---

## 🚀 Next Steps

1. **Update Dashboard Components** to use new data structure
2. **Build Lifecycle Visualizer** using claim events
3. **Create Analytics Charts** using analytics.json
4. **Implement Chat Feature** with chats.json
5. **Document Management** with documents.json
6. **Payment Tracking** with transactions.json

---

## ⚠️ Breaking Changes

### For Developers

If you have existing code using the old data structure:

1. **Replace `patientId` with `employeeId`** in all claims-related code
2. **Update API calls** to use new endpoints (`/api/employees` instead of `/api/users`)
3. **Update imports** from `@/types` - all new types are re-exported
4. **Update claim status checks** to use new status values
5. **Update hook calls** to use new options structure

### Migration Example

**Before:**
```typescript
const { claims } = useFetchClaims('patient-123');
```

**After:**
```typescript
const { claims } = useFetchClaims({ employeeId: 'emp-001' });
```

---

## 📝 Notes

- All IDs are consistent across files for easy cross-referencing
- Timestamps are in ISO format (2025 dates)
- Fraud risk scores are included (0-1 scale)
- Analytics data is pre-computed for faster dashboards
- Mock data is production-ready and can be easily replaced with real API calls

---

**Last Updated:** October 6, 2025  
**Version:** 2.0  
**Status:** ✅ Complete

