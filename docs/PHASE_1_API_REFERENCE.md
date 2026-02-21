# Phase 1 API Reference — Hospitals & Insurers Module

**Status:** Complete & Compiled  
**Base URL:** `http://localhost:3001/api/v1`  
**Authentication:** All endpoints decorated with `@Public()` — no JWT required during development

---

## Hospitals Module

### 1. Create Hospital

```
POST /v1/hospitals
Content-Type: application/json
```

**Request Body:**

```json
{
  "hospitalName": "string (required)",
  "licenseNumber": "string (required, unique)",
  "city": "string (required)",
  "address": "string (required)",
  "latitude": "number (optional, decimal)",
  "longitude": "number (optional, decimal)",
  "emergencyPhone": "string (required)",
  "hospitalType": "reimbursable | non_reimbursable (optional, default: reimbursable)",
  "hasEmergencyUnit": "boolean (optional, default: true)",
  "isActive": "boolean (optional, default: true)"
}
```

**Response:** `201 Created`

```json
{
  "data": { Hospital object },
  "message": "Success",
  "statusCode": 201
}
```

---

### 2. Get All Hospitals

```
GET /v1/hospitals?page=1&limit=10&city=Karachi&isActive=true&sortBy=createdAt&order=desc
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 10 | Records per page (max 100) |
| `sortBy` | string | createdAt | Field to sort by |
| `order` | asc \| desc | desc | Sort order |
| `city` | string | - | Filter by city (case-insensitive) |
| `isActive` | boolean | - | Filter by active status |

**Response:** `200 OK`

```json
{
  "data": [ Hospital[], ... ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  },
  "message": "Success",
  "statusCode": 200
}
```

---

### 3. Get Hospital by ID

```
GET /v1/hospitals/{hospitalId}
```

**Response:** `200 OK` (includes emergency contacts & last 10 visits)

```json
{
  "data": { Hospital object with relations },
  "message": "Success",
  "statusCode": 200
}
```

---

### 4. Update Hospital

```
PATCH /v1/hospitals/{hospitalId}
Content-Type: application/json
```

**Request Body (all optional):**

```json
{
  "hospitalName": "string",
  "licenseNumber": "string",
  "city": "string",
  "address": "string",
  "latitude": "number",
  "longitude": "number",
  "emergencyPhone": "string",
  "hospitalType": "reimbursable | non_reimbursable",
  "hasEmergencyUnit": "boolean",
  "isActive": "boolean"
}
```

**Response:** `200 OK`

---

### 5. Add Emergency Contact

```
POST /v1/hospitals/{hospitalId}/emergency-contacts
Content-Type: application/json
```

**Request Body:**

```json
{
  "contactLevel": "integer (required, 1-5 recommended)",
  "designation": "string (required, e.g., 'Chief Medical Officer')",
  "name": "string (required)",
  "contactNumber": "string (required)",
  "isActive": "boolean (optional, default: true)"
}
```

**Constraint:** Only one contact per `contactLevel` per hospital

**Response:** `201 Created`

---

### 6. Get All Emergency Contacts

```
GET /v1/hospitals/{hospitalId}/emergency-contacts
```

**Response:** `200 OK` (ordered by contactLevel ascending)

```json
{
  "data": [
    {
      "id": "uuid",
      "hospitalId": "uuid",
      "contactLevel": 1,
      "designation": "Chief Medical Officer",
      "name": "Dr. Ahmed Khan",
      "contactNumber": "+92-300-1234567",
      "isActive": true,
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp"
    }
  ],
  "message": "Success",
  "statusCode": 200
}
```

---

### 7. Get Emergency Contact by ID

```
GET /v1/hospitals/emergency-contacts/{contactId}
```

**Response:** `200 OK`

```json
{
  "data": {
    "id": "uuid",
    "hospitalId": "uuid",
    "contactLevel": 1,
    "designation": "Chief Medical Officer",
    "name": "Dr. Ahmed Khan",
    "contactNumber": "+92-300-1234567",
    "isActive": true,
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  },
  "message": "Success",
  "statusCode": 200
}
```

---

### 8. Update Emergency Contact

```
PATCH /v1/hospitals/emergency-contacts/{contactId}
Content-Type: application/json
```

**Request Body (all optional):**

```json
{
  "contactLevel": "integer",
  "designation": "string",
  "name": "string",
  "contactNumber": "string",
  "isActive": "boolean"
}
```

**Response:** `200 OK`

---

### 9. Delete Emergency Contact

```
DELETE /v1/hospitals/emergency-contacts/{contactId}
```

**Response:** `200 OK`

```json
{
  "data": {
    "id": "uuid",
    "hospitalId": "uuid",
    "contactLevel": 1,
    "designation": "Chief Medical Officer",
    "name": "Dr. Ahmed Khan",
    "contactNumber": "+92-300-1234567",
    "isActive": true,
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  },
  "message": "Success",
  "statusCode": 200
}
```

---

### 10. Get Hospital Visits

```
GET /v1/hospitals/{hospitalId}/visits
```

**Response:** `200 OK` (ordered by visitDate descending)

```json
{
  "data": [
    {
      "id": "uuid",
      "employeeId": "uuid | null",
      "dependentId": "uuid | null",
      "hospitalId": "uuid",
      "visitDate": "ISO 8601 timestamp",
      "dischargeDate": "ISO 8601 timestamp | null",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp"
    }
  ],
  "message": "Success",
  "statusCode": 200
}
```

---

### 11. Create Hospital Visit

```
POST /v1/hospitals/{hospitalId}/visits
Content-Type: application/json
```

**Request Body:**

```json
{
  "employeeId": "uuid (required)",
  "dependentId": "uuid (optional)",
  "visitDate": "ISO 8601 string (required)",
  "dischargeDate": "ISO 8601 string (optional)"
}
```

**Validation:**

- `employeeId` is always required (obtained from CNIC search)
- `dependentId` is optional:
  - If provided, creates a visit for that dependent (dependent visit)
  - If omitted, creates a visit for the employee directly (employee visit)
  - Dependent status must be `Active`, otherwise returns `400 BadRequestException`
- `employeeId` and `dependentId` must belong to the same employee-dependent relationship

**Workflow:**

1. Hospital searches employee by CNIC (endpoint #13)
2. Frontend receives `employeeId` and list of active dependents
3. Hospital selects either employee or a dependent
4. POST request sent with `employeeId` (always) + `dependentId` (if dependent selected)

**Response:** `201 Created`

```json
{
  "data": {
    "id": "uuid",
    "employeeId": "uuid",
    "dependentId": "uuid | null",
    "hospitalId": "uuid",
    "visitDate": "ISO 8601 timestamp",
    "dischargeDate": "ISO 8601 timestamp | null",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  },
  "message": "Success",
  "statusCode": 201
}
```

---

### 12. Find Nearby Hospitals (Geo-Search)

```
GET /v1/hospitals/search/nearby?latitude=24.8607&longitude=67.0011&radiusKm=50
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `latitude` | number | Yes | Your latitude |
| `longitude` | number | Yes | Your longitude |
| `radiusKm` | number | No | Search radius in kilometers (default: 50) |

**Algorithm:** Haversine formula (great-circle distance)

**Response:** `200 OK` (ordered by distance)

---

### 13. Search Employee by CNIC

```
GET /v1/search-employee?cnic=12345-6789012-3
```

**Status:** 🔴 Dev A Responsibility (Employee & Dependent Core Module)

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `cnic` | string | Yes | Employee's CNIC number |

**Access:** Hospitals, Corporates (for their employees only)

**Response:** `200 OK`

```json
{
  "data": {
    "employee": {
      "id": "uuid",
      "cnic": "12345-6789012-3",
      "firstName": "Ahmed",
      "lastName": "Khan",
      "email": "ahmed@example.com",
      "phoneNumber": "+92-300-1234567",
      "dateOfBirth": "ISO 8601 date",
      "gender": "Male | Female",
      "status": "Active | InActive | Suspended"
    },
    "dependents": [
      {
        "id": "uuid",
        "firstName": "Fatima",
        "lastName": "Khan",
        "relationship": "Spouse | Son | Daughter | Parent",
        "dateOfBirth": "ISO 8601 date",
        "status": "Active | Pending | Rejected"
      }
    ]
  },
  "message": "Success",
  "statusCode": 200
}
```

**Notes:**

- Only returns dependents with status `Active`
- Used by Hospitals Module (POST `/v1/hospitals/{hospitaId}/visits`) to fetch employee + dependents before creating visit

---

## Insurers Module

### 1. Create Insurer

```
POST /v1/insurers
Content-Type: application/json
```

**Request Body:**

```json
{
  "companyName": "string (required)",
  "licenseNumber": "string (required, unique)",
  "address": "string (required)",
  "city": "string (required)",
  "province": "string (required)",
  "maxCoverageLimit": "number (required, in PKR)",
  "networkHospitalCount": "integer (optional, default: 0)",
  "corporateClientCount": "integer (optional, default: 0)",
  "status": "Active | Inactive | Suspended (optional, default: Active)",
  "operatingSince": "ISO 8601 date string (required)",
  "isActive": "boolean (optional, default: true)"
}
```

**Response:** `201 Created`

---

### 2. Get All Insurers

```
GET /v1/insurers?page=1&limit=10&city=Karachi&status=Active&sortBy=createdAt&order=desc
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Records per page |
| `sortBy` | string | createdAt | Sort field |
| `order` | asc \| desc | desc | Sort order |
| `city` | string | - | Filter by city |
| `status` | string | - | Filter by status (Active/Inactive/Suspended) |

**Response:** `200 OK` (includes `plans`, `labs`, `corporates` counts)

---

### 3. Get Insurer by ID

```
GET /v1/insurers/{insurerId}
```

**Response:** `200 OK` (includes active plans, active labs, recent corporates)

---

### 4. Update Insurer

```
PATCH /v1/insurers/{insurerId}
Content-Type: application/json
```

**Request Body (all optional):**

```json
{
  "companyName": "string",
  "licenseNumber": "string",
  "address": "string",
  "city": "string",
  "province": "string",
  "maxCoverageLimit": "number",
  "networkHospitalCount": "integer",
  "corporateClientCount": "integer",
  "status": "Active | Inactive | Suspended",
  "operatingSince": "ISO 8601 date string",
  "isActive": "boolean"
}
```

**Response:** `200 OK`

---

### 5. Create Insurance Plan

```
POST /v1/insurers/{insurerId}/plans
Content-Type: application/json
```

**Request Body:**

```json
{
  "planName": "string (required, e.g., 'Gold Plan')",
  "planCode": "string (required, unique, e.g., 'GOLD-001')",
  "sumInsured": "number (required, in PKR)",
  "coveredServices": "object (required, JSON structure)",
  "serviceLimits": "object (required, JSON structure)",
  "isActive": "boolean (optional, default: true)"
}
```

**Example `coveredServices`:**

```json
{
  "outpatient": true,
  "inpatient": true,
  "emergency": true,
  "surgery": true,
  "maternity": false,
  "dental": false,
  "optical": false
}
```

**Example `serviceLimits`:**

```json
{
  "outpatient_visits": 12,
  "inpatient_days": 30,
  "emergency_deductible": 500,
  "surgery_limit": 100000
}
```

**Response:** `201 Created`

---

### 6. Get Plans for Insurer

```
GET /v1/insurers/{insurerId}/plans?isActive=true
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `isActive` | boolean | Filter by active status |

**Response:** `200 OK` (ordered by createdAt descending)

---

### 7. Update Plan

```
PATCH /v1/insurers/plans/{planId}
Content-Type: application/json
```

**Request Body (all optional):**

```json
{
  "planName": "string",
  "sumInsured": "number",
  "coveredServices": "object",
  "serviceLimits": "object",
  "isActive": "boolean"
}
```

**Note:** `planCode` cannot be updated

**Response:** `200 OK`

---

### 8. Delete Plan

```
DELETE /v1/insurers/plans/{planId}
```

**Response:** `200 OK`

---

### 9. Create Lab (Network)

```
POST /v1/insurers/{insurerId}/labs
Content-Type: application/json
```

**Request Body:**

```json
{
  "labName": "string (required)",
  "city": "string (required)",
  "address": "string (required)",
  "licenseNumber": "string (required, unique)",
  "contactPhone": "string (required)",
  "contactEmail": "email (required)",
  "testCategories": "object (required, e.g., {\"pathology\": true, \"radiology\": true})",
  "isActive": "boolean (optional, default: true)"
}
```

**Response:** `201 Created`

---

### 10. Get Labs for Insurer

```
GET /v1/insurers/{insurerId}/labs?isActive=true
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `isActive` | boolean | Filter by active status |

**Response:** `200 OK` (ordered by createdAt descending)

---

### 11. Get Lab by ID

```
GET /v1/insurers/labs/{labId}
```

**Response:** `200 OK` (includes insurer relation)

---

## Error Responses

All errors follow this format:

```json
{
  "message": "Error description",
  "statusCode": 400 | 404 | 409 | 500,
  "error": "BadRequestException | NotFoundException | ConflictException"
}
```

### Common Status Codes

| Code  | Scenario                                |
| ----- | --------------------------------------- |
| `201` | Resource created successfully           |
| `200` | Success                                 |
| `400` | Validation failed or bad request        |
| `404` | Resource not found                      |
| `409` | Conflict (e.g., duplicate unique field) |
| `500` | Server error                            |

### Example Error

```json
{
  "message": "Hospital with this license number already exists",
  "statusCode": 400,
  "error": "BadRequestException"
}
```

---

## Testing with Postman

### Environment Variables (recommended)

```
BASE_URL = http://localhost:3001/api/v1
HOSPITAL_ID = <uuid-from-create>
INSURER_ID = <uuid-from-create>
PLAN_ID = <uuid-from-create>
LAB_ID = <uuid-from-create>
```

### Sample Request Flow (Happy Path)

1. **Create Hospital**

   ```
   POST {{BASE_URL}}/hospitals
   ```

2. **Get Hospital**

   ```
   GET {{BASE_URL}}/hospitals/{{HOSPITAL_ID}}
   ```

3. **Create Insurer**

   ```
   POST {{BASE_URL}}/insurers
   ```

4. **Add Plan to Insurer**

   ```
   POST {{BASE_URL}}/insurers/{{INSURER_ID}}/plans
   ```

5. **Get Plans**
   ```
   GET {{BASE_URL}}/insurers/{{INSURER_ID}}/plans
   ```

---

## Notes

- All timestamps are in ISO 8601 format with UTC timezone
- All IDs are UUIDs (v4)
- Pagination default: page=1, limit=10
- All monetary amounts are in PKR (Pakistani Rupee)
- Database constraints prevent licenseNumber duplication across hospitals, insurers, and labs
- Geo-search uses PostgreSQL `RADIANS()` and `ACOS()` for Haversine calculation
- Emergency contact levels are unique per hospital (implicit constraint in Prisma schema)
- CNIC search endpoint (`/v1/search-employee`) is role-based: Hospitals can search all employees, Corporates can search only their own employees
- Hospital visit workflow: Search employee by CNIC → Get `employeeId` → Select employee or dependent → POST with `employeeId` (always) + `dependentId` (if applicable)
- Only "Active" dependents can be used to create hospital visits

---

**Last Updated:** February 21, 2026  
**Phase:** 1 (Hospitals & Insurers CRUD)  
**Next Phase:** Claims Core (Weeks 3-4)

---

---

# Missing Backend APIs — Integration Audit (Feb 21, 2026)

> The frontend currently imports mock JSON from `client/src/data/`. Below are all the backend API endpoints that **need to exist** so the frontend can be wired to the real database. Endpoints already documented above (Hospitals & Insurers v1) are **not repeated**.
>
> All Prisma models for these resources already exist in the schema. The backend controllers are scaffolded but have **no route methods** — they need to be implemented.

---

## Coverage Matrix

| Mock Data File | Actively Used? | Backend API Exists? | Action Required |
|----------------|:-:|:-:|---|
| `claims.json` / `claimsData.ts` | ✅ 15+ files | ❌ Empty controller | **Build Claims CRUD** |
| `employees.json` | ✅ 7 files | ❌ Empty controller | **Build Employees CRUD** |
| `corporates.json` | ✅ 5 files | ❌ Empty controller | **Build Corporates CRUD** |
| `patients.json` | ✅ 3 files | ❌ Empty controller | **Build Patients CRUD** |
| `dependents.json` | ✅ 2 files | ❌ Empty controller | **Build Dependents CRUD** |
| `plans.json` | ✅ 2 files | ⚠️ Exists under insurers only | **Build standalone Plans read** |
| `labs.json` | ✅ 1 file | ⚠️ Exists under insurers only | **Build standalone Labs read** |
| `analytics.json` | ✅ 2 files | ❌ Empty controller | **Build Analytics endpoint** |
| `hospitalNotifications.json` | ✅ 1 file | ❌ Empty controller | **Build Notifications endpoint** |
| `insurerNotifications.json` | ✅ 5 files | ❌ Empty controller | **Build Notifications endpoint** |
| `patientNotifications.json` | ✅ 1 file | ❌ Empty controller | **Build Notifications endpoint** |
| `hospitalEmergencyContacts.json` | ✅ 1 file | ✅ Already in Hospitals v1 | None |
| `hospitals.json` | ✅ 7 files | ✅ Already in Hospitals v1 | None |
| `chats.json` | ❌ Unused | — | None |
| `corporateNotifications.json` | ❌ Unused | — | None |
| `demoDocEmbeddings.json` | ❌ Unused | — | None |
| `demoDocHashes.json` | ❌ Unused | — | None |
| `documents.json` | ❌ Unused | — | None |
| `hospitals.enriched.json` | ❌ Unused | — | None |
| `insurer.json` | ❌ Unused | — | None |
| `transactions.json` | ❌ Unused | — | None |

---

## 1. Claims Module

**Controller:** `server/src/modules/claims/claims.controller.ts` (empty)  
**Prisma Model:** `Claim`, `ClaimEvent`, `ClaimDocument`  
**Used by:** 15+ frontend files (patient, hospital, insurer, corporate dashboards & claim pages)

### 1.1 Get All Claims (Filtered)

```
GET /api/v1/claims?page=1&limit=10&status=Pending&employeeId=uuid&corporateId=uuid&hospitalId=uuid&sortBy=createdAt&order=desc
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Records per page |
| `sortBy` | string | createdAt | Sort field |
| `order` | asc \| desc | desc | Sort order |
| `status` | string | — | Filter by status (Pending, Approved, Rejected, Under Review) |
| `employeeId` | uuid | — | Filter by employee |
| `corporateId` | uuid | — | Filter by corporate |
| `hospitalId` | uuid | — | Filter by hospital |

**Response:** `200 OK`

```json
{
  "data": [ Claim[] ],
  "meta": { "total": 100, "page": 1, "limit": 10, "totalPages": 10 },
  "message": "Success",
  "statusCode": 200
}
```

---

### 1.2 Get Claim by ID

```
GET /api/v1/claims/{claimId}
```

**Response:** `200 OK` (includes ClaimEvents timeline + ClaimDocuments)

```json
{
  "data": {
    "id": "uuid",
    "claimNumber": "CLM-2025-0001",
    "employeeId": "uuid",
    "hospitalId": "uuid",
    "corporateId": "uuid",
    "amountClaimed": 50000,
    "approvedAmount": 0,
    "status": "Pending",
    "treatment": "string",
    "fraudRiskScore": 0,
    "priority": "Normal",
    "events": [ ClaimEvent[] ],
    "documents": [ ClaimDocument[] ],
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  },
  "message": "Success",
  "statusCode": 200
}
```

---

### 1.3 Submit New Claim

```
POST /api/v1/claims
Content-Type: application/json
```

**Request Body:**

```json
{
  "employeeId": "uuid (required)",
  "hospitalId": "uuid (required)",
  "corporateId": "uuid (required)",
  "amountClaimed": "number (required, PKR)",
  "treatment": "string (required)",
  "dependentId": "uuid (optional)"
}
```

**Response:** `201 Created` (auto-generates claimNumber, sets status to Pending)

---

### 1.4 Approve Claim

```
PATCH /api/v1/claims/{claimId}/approve
Content-Type: application/json
```

**Request Body:**

```json
{
  "approvedAmount": "number (required, PKR)",
  "notes": "string (optional)"
}
```

**Response:** `200 OK` (sets status to Approved, creates ClaimEvent)

---

### 1.5 Reject Claim

```
PATCH /api/v1/claims/{claimId}/reject
Content-Type: application/json
```

**Request Body:**

```json
{
  "reason": "string (required)"
}
```

**Response:** `200 OK` (sets status to Rejected, creates ClaimEvent)

---

### 1.6 Get Claim Statistics

```
GET /api/v1/claims/stats?corporateId=uuid&hospitalId=uuid&employeeId=uuid
```

**Purpose:** Dashboard aggregations (total claims, pending count, approved count, total amount, approval rate)

**Response:** `200 OK`

```json
{
  "data": {
    "totalClaims": 100,
    "pendingClaims": 30,
    "approvedClaims": 55,
    "rejectedClaims": 15,
    "totalAmountClaimed": 5000000,
    "totalAmountApproved": 3500000,
    "approvalRate": 78.6
  }
}
```

---

## 2. Employees Module

**Controller:** `server/src/modules/dependents/dependents.controller.ts` (empty — or create dedicated employees controller)  
**Prisma Model:** `Employee`  
**Used by:** 7 frontend files (corporate employees page, insurer corporates, hospital patient details, dashboards)

### 2.1 Get All Employees (Filtered)

```
GET /api/v1/employees?page=1&limit=10&corporateId=uuid&planId=uuid&search=Ahmed&sortBy=createdAt&order=desc
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Records per page |
| `sortBy` | string | createdAt | Sort field |
| `order` | asc \| desc | desc | Sort order |
| `corporateId` | uuid | — | Filter by corporate |
| `planId` | uuid | — | Filter by plan |
| `search` | string | — | Search by name, CNIC, email, employeeNumber |

**Response:** `200 OK`

```json
{
  "data": [ Employee[] ],
  "meta": { "total": 50, "page": 1, "limit": 10, "totalPages": 5 },
  "message": "Success",
  "statusCode": 200
}
```

---

### 2.2 Get Employee by ID

```
GET /api/v1/employees/{employeeId}
```

**Response:** `200 OK` (includes dependents, corporate, plan relations)

---

### 2.3 Create Employee

```
POST /api/v1/employees
Content-Type: application/json
```

**Request Body:**

```json
{
  "firstName": "string (required)",
  "lastName": "string (required)",
  "cnic": "string (required, unique, format: 12345-6789012-3)",
  "email": "string (required)",
  "phoneNumber": "string (required)",
  "dateOfBirth": "ISO 8601 date (required)",
  "gender": "Male | Female (required)",
  "corporateId": "uuid (required)",
  "planId": "uuid (required)",
  "department": "string (optional)",
  "designation": "string (optional)"
}
```

**Response:** `201 Created` (auto-generates employeeNumber)

---

### 2.4 Update Employee

```
PATCH /api/v1/employees/{employeeId}
Content-Type: application/json
```

**Request Body (all optional):**

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phoneNumber": "string",
  "department": "string",
  "designation": "string",
  "planId": "uuid",
  "status": "Active | InActive | Suspended"
}
```

**Response:** `200 OK`

---

### 2.5 Delete Employee

```
DELETE /api/v1/employees/{employeeId}
```

**Response:** `200 OK`

---

## 3. Corporates Module

**Controller:** `server/src/modules/corporates/corporates.controller.ts` (empty)  
**Prisma Model:** `Corporate`  
**Used by:** 5 frontend files (insurer corporates page, hospital patient details, dashboards)

### 3.1 Get All Corporates

```
GET /api/v1/corporates?page=1&limit=10&search=&industry=&sortBy=createdAt&order=desc
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Records per page |
| `search` | string | — | Search by company name |
| `industry` | string | — | Filter by industry |

**Response:** `200 OK`

```json
{
  "data": [ Corporate[] ],
  "meta": { "total": 20, "page": 1, "limit": 10, "totalPages": 2 },
  "message": "Success",
  "statusCode": 200
}
```

---

### 3.2 Get Corporate by ID

```
GET /api/v1/corporates/{corporateId}
```

**Response:** `200 OK` (includes employee count, plans, insurer relation)

---

### 3.3 Create Corporate

```
POST /api/v1/corporates
Content-Type: application/json
```

**Request Body:**

```json
{
  "companyName": "string (required)",
  "address": "string (required)",
  "city": "string (required)",
  "contactPerson": "string (required)",
  "contactPhone": "string (required)",
  "contactEmail": "string (required)",
  "industry": "string (optional)",
  "insurerId": "uuid (required)",
  "planId": "uuid (required)"
}
```

**Response:** `201 Created`

---

## 4. Patients Module

**Controller:** `server/src/modules/patients/patients.controller.ts` (empty)  
**Prisma Model:** Uses `Employee` + `Dependent` (patients are employees/dependents visiting hospitals)  
**Used by:** 3 frontend files (hospital patients page, patient profile, submit claim form)

### 4.1 Get All Patients (Hospital View)

```
GET /api/v1/patients?page=1&limit=10&search=&insurance=&sortBy=createdAt&order=desc
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Records per page |
| `search` | string | — | Search by name, CNIC |
| `insurance` | string | — | Filter by insurance type |

**Response:** `200 OK`

```json
{
  "data": [ Patient[] ],
  "meta": { "total": 30, "page": 1, "limit": 10, "totalPages": 3 },
  "message": "Success",
  "statusCode": 200
}
```

---

### 4.2 Get Patient by ID

```
GET /api/v1/patients/{patientId}
```

**Response:** `200 OK` (includes insurance details, dependents, visit history)

---

### 4.3 Verify Patient by CNIC

```
POST /api/v1/patients/verify
Content-Type: application/json
```

**Request Body:**

```json
{
  "cnic": "string (required, format: 12345-6789012-3)"
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "employee": { Employee object },
    "dependents": [ Dependent[] ],
    "corporate": { Corporate object },
    "plan": { Plan object }
  },
  "message": "Patient verified",
  "statusCode": 200
}
```

**Note:** This replaces the Phase 1 `GET /v1/search-employee?cnic=` endpoint with a hospital-focused patient view.

---

## 5. Dependents Module

**Controller:** `server/src/modules/dependents/dependents.controller.ts` (empty)  
**Prisma Model:** `Dependent`  
**Used by:** 2 frontend files (patient profile, corporate employees page)

### 5.1 Get Dependents for Employee

```
GET /api/v1/dependents?employeeId=uuid
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `employeeId` | uuid | Filter by employee (required) |
| `status` | string | Filter by status (Active, Pending, Rejected) |

**Response:** `200 OK`

```json
{
  "data": [ Dependent[] ],
  "message": "Success",
  "statusCode": 200
}
```

---

### 5.2 Add Dependent

```
POST /api/v1/dependents
Content-Type: application/json
```

**Request Body:**

```json
{
  "employeeId": "uuid (required)",
  "firstName": "string (required)",
  "lastName": "string (required)",
  "relationship": "Spouse | Son | Daughter | Parent (required)",
  "dateOfBirth": "ISO 8601 date (required)",
  "cnic": "string (optional)"
}
```

**Response:** `201 Created` (status defaults to Pending)

---

## 6. Plans Module (Standalone Read)

**Existing:** Plans CRUD already exists under `GET /v1/insurers/{insurerId}/plans` — but the frontend also needs **insurer-agnostic** plan lookup.  
**Prisma Model:** `Plan`  
**Used by:** 2 frontend files (Next.js mock route, hospital patient details)

### 6.1 Get Plan by ID

```
GET /api/v1/plans/{planId}
```

**Response:** `200 OK` (includes insurer relation, covered services, service limits)

---

### 6.2 Get Plans (Filtered)

```
GET /api/v1/plans?corporateId=uuid
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `corporateId` | uuid | Filter plans available to a corporate |

**Response:** `200 OK`

```json
{
  "data": [ Plan[] ],
  "message": "Success",
  "statusCode": 200
}
```

---

## 7. Labs Module (Standalone Read)

**Existing:** Labs CRUD already exists under `GET /v1/insurers/{insurerId}/labs` — but the frontend (patient labs page) needs **insurer-agnostic** lab listing.  
**Prisma Model:** `Lab`  
**Used by:** 1 frontend file (patient labs page)

### 7.1 Get All Labs (Filtered)

```
GET /api/v1/labs?city=Karachi&type=pathology
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `city` | string | Filter by city |
| `type` | string | Filter by test category type |
| `isActive` | boolean | Filter by active status |

**Response:** `200 OK`

```json
{
  "data": [ Lab[] ],
  "message": "Success",
  "statusCode": 200
}
```

---

## 8. Notifications Module

**Controller:** `server/src/modules/notifications/notifications.controller.ts` (empty)  
**Prisma Model:** `Notification`  
**Used by:** 7 frontend files (patient, hospital, insurer layouts & pages)

### 8.1 Get Notifications

```
GET /api/v1/notifications?role=hospital&unreadOnly=true
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `role` | string | Filter by recipient role (patient, hospital, insurer, corporate) |
| `userId` | uuid | Filter by specific user |
| `unreadOnly` | boolean | Only return unread notifications |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "message": "string",
      "type": "info | warning | success | error",
      "isRead": false,
      "createdAt": "ISO 8601"
    }
  ],
  "message": "Success",
  "statusCode": 200
}
```

---

## 9. Analytics Module

**Controller:** `server/src/modules/analytics/analytics.controller.ts` (empty)  
**Used by:** 2 frontend files (hospital dashboard, Next.js mock route)

### 9.1 Get Dashboard Analytics

```
GET /api/v1/analytics?role=hospital&entityId=uuid
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `role` | string | Dashboard context (patient, hospital, insurer, corporate) |
| `entityId` | uuid | The hospital/insurer/corporate/employee ID |

**Response:** `200 OK`

```json
{
  "data": {
    "totalClaims": 100,
    "pendingClaims": 30,
    "approvedClaims": 55,
    "totalAmount": 5000000,
    "monthlyTrend": [ { "month": "Jan", "claims": 12, "amount": 500000 } ],
    "topHospitals": [],
    "topTreatments": []
  },
  "message": "Success",
  "statusCode": 200
}
```

---

## Summary — Endpoints to Build Before Integration

| # | Module | Endpoint | Method | Priority |
|---|--------|----------|--------|----------|
| 1 | Claims | `/api/v1/claims` | GET | 🔴 High |
| 2 | Claims | `/api/v1/claims/{id}` | GET | 🔴 High |
| 3 | Claims | `/api/v1/claims` | POST | 🔴 High |
| 4 | Claims | `/api/v1/claims/{id}/approve` | PATCH | 🔴 High |
| 5 | Claims | `/api/v1/claims/{id}/reject` | PATCH | 🔴 High |
| 6 | Claims | `/api/v1/claims/stats` | GET | 🟡 Medium |
| 7 | Employees | `/api/v1/employees` | GET | 🔴 High |
| 8 | Employees | `/api/v1/employees/{id}` | GET | 🔴 High |
| 9 | Employees | `/api/v1/employees` | POST | 🔴 High |
| 10 | Employees | `/api/v1/employees/{id}` | PATCH | 🟡 Medium |
| 11 | Employees | `/api/v1/employees/{id}` | DELETE | 🟡 Medium |
| 12 | Corporates | `/api/v1/corporates` | GET | 🔴 High |
| 13 | Corporates | `/api/v1/corporates/{id}` | GET | 🔴 High |
| 14 | Corporates | `/api/v1/corporates` | POST | 🟡 Medium |
| 15 | Patients | `/api/v1/patients` | GET | 🔴 High |
| 16 | Patients | `/api/v1/patients/{id}` | GET | 🔴 High |
| 17 | Patients | `/api/v1/patients/verify` | POST | 🔴 High |
| 18 | Dependents | `/api/v1/dependents?employeeId=` | GET | 🟡 Medium |
| 19 | Dependents | `/api/v1/dependents` | POST | 🟡 Medium |
| 20 | Plans | `/api/v1/plans/{id}` | GET | 🟡 Medium |
| 21 | Plans | `/api/v1/plans?corporateId=` | GET | 🟡 Medium |
| 22 | Labs | `/api/v1/labs` | GET | 🟢 Low |
| 23 | Notifications | `/api/v1/notifications` | GET | 🟢 Low |
| 24 | Analytics | `/api/v1/analytics` | GET | 🟢 Low |

**Total: 24 new endpoints** across 9 modules to build before frontend integration.

**Already built (documented above): 23 endpoints** (Hospitals + Insurers v1)
