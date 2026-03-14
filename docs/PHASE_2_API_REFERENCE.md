# Phase 2 API Reference — Claims Core Module

**Status:** Complete & Compiled  
**Base URL:** `http://localhost:3001/api/v1`  
**Authentication:** All endpoints require JWT — use `@Roles()` guards

---

## Overview

The Claims module handles the complete claims lifecycle:

- **Submit:** Hospitals create claims for patient visits
- **Review:** Insurers can approve, reject, or put claims on hold
- **Payment:** Approved claims can be marked as paid
- **Documents:** Supporting documents can be uploaded/managed
- **Events:** Full audit trail of all claim actions

---

## State Transition Diagram

```
┌─────────┐
│ Pending │───────────────────────────────┐
└────┬────┘                               │
     │                                    │
     ├──────────► Approved ──────────► Paid (terminal)
     │               ▲
     │               │
     ├──────────► OnHold ─────────────────┤
     │               │                    │
     │               └──────────► Rejected (terminal)
     │                                    ▲
     └────────────────────────────────────┘
```

**Valid Transitions:**

- `Pending` → `Approved`, `Rejected`, `OnHold`
- `OnHold` → `Approved`, `Rejected`
- `Approved` → `Paid`
- `Rejected` → (terminal, no transitions)
- `Paid` → (terminal, no transitions)

---

## Hospital Visit Workflow

Before creating a claim, hospitals must look up the employee and select from their unclaimed visits.

### 0. Get Unclaimed Visits by Employee

```
GET /v1/hospitals/visits/unclaimed?employeeNumber=EMP-001
Authorization: Bearer <token>
```

**Access:** `@Roles('hospital')` — Only hospitals can access

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `employeeNumber` | string | Yes | Employee number (e.g., EMP-001) |

**Response:** `200 OK`

```json
{
  "employee": {
    "id": "uuid",
    "firstName": "Ahmed",
    "lastName": "Khan",
    "employeeNumber": "EMP-001",
    "corporateId": "uuid",
    "planId": "uuid",
    "insurerId": "uuid",
    "sumInsured": "500000"
  },
  "visits": [
    {
      "id": "visit-uuid",
      "visitDate": "2025-03-01T10:00:00Z",
      "dischargeDate": "2025-03-05T14:00:00Z",
      "status": "Pending",
      "employee": { "id": "uuid", "firstName": "Ahmed", "lastName": "Khan" },
      "plan": { "id": "uuid", "planName": "Gold Plan", "sumInsured": "500000" },
      "corporate": { "id": "uuid", "name": "Tech Corp" }
    }
  ]
}
```

**Visit Status Values:**

- `Pending` — Visit ready for claim creation
- `Claimed` — Visit already has a claim (not returned by this endpoint)

---

## CRUD Endpoints

### 1. Create Claim (Submit)

```
POST /v1/claims
Content-Type: application/json
Authorization: Bearer <token>
```

**Access:** `@Roles('hospital')` — Only hospitals can submit claims

**Request Body (Simplified):**

```json
{
  "hospitalVisitId": "uuid (required)",
  "amountClaimed": "number (required, decimal(12,2), min: 0.01)",
  "treatmentCategory": "string (optional, e.g., 'Emergency', 'Surgery', 'Outpatient')",
  "priority": "Low | Normal | High (optional, default: Normal)",
  "notes": "string (optional)"
}
```

**Auto-populated from hospital visit:**

- `corporateId`: From employee's corporate
- `planId`: From employee's insurance plan
- `insurerId`: From employee's insurance plan

**Auto-generated:**

- `claimNumber`: Format `CLM-YYYYMMDD-XXXXX` (e.g., `CLM-20260307-00001`)
- `claimStatus`: Default `Pending`
- `approvedAmount`: Default `0`

**Automatic Actions:**

- Visit status is updated from `Pending` → `Claimed`

**Validation Rules:**

- `hospitalVisitId` must exist and have status `Pending`
- `amountClaimed` must be ≤ plan's `sumInsured` limit

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "claimNumber": "CLM-20260307-00001",
  "hospitalVisitId": "uuid",
  "corporateId": "uuid",
  "planId": "uuid",
  "insurerId": "uuid",
  "claimStatus": "Pending",
  "amountClaimed": "50000.00",
  "approvedAmount": "0.00",
  "treatmentCategory": "Emergency",
  "priority": "High",
  "notes": "Patient admitted via ER",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp",
  "hospitalVisit": { ... },
  "corporate": { ... },
  "plan": { ... },
  "insurer": { ... }
}
```

---

### 2. Get All Claims (List with Filters)

```
GET /v1/claims?page=1&limit=10&status=Pending&insurerId=uuid&corporateId=uuid&sortBy=createdAt&order=desc
Authorization: Bearer <token>
```

**Access:** `@Roles('hospital', 'insurer', 'corporate', 'admin')`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 10 | Records per page (max 100) |
| `sortBy` | string | createdAt | Field to sort by |
| `order` | asc \| desc | desc | Sort order |
| `status` | ClaimStatus | - | Filter by status (Pending/Approved/Rejected/Paid/OnHold) |
| `insurerId` | uuid | - | Filter by insurer |
| `corporateId` | uuid | - | Filter by corporate |
| `hospitalId` | uuid | - | Filter by hospital (via hospitalVisit) |
| `priority` | Priority | - | Filter by priority (Low/Normal/High) |
| `fromDate` | ISO date | - | Claims created after this date |
| `toDate` | ISO date | - | Claims created before this date |
| `claimNumber` | string | - | Search by claim number (partial match) |

**Role-based Filtering (automatic):**

- **Hospital:** Only sees claims from their hospital visits
- **Insurer:** Only sees claims assigned to their insurance company
- **Corporate:** Only sees claims for their employees
- **Admin:** Sees all claims

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "claimNumber": "CLM-20260307-00001",
      "claimStatus": "Pending",
      "amountClaimed": "50000.00",
      "approvedAmount": "0.00",
      "priority": "High",
      "createdAt": "ISO 8601 timestamp",
      "hospitalVisit": {
        "id": "uuid",
        "visitDate": "ISO 8601 timestamp",
        "hospital": {
          "id": "uuid",
          "hospitalName": "Aga Khan University Hospital"
        }
      },
      "corporate": {
        "id": "uuid",
        "name": "Tech Corp"
      },
      "plan": {
        "id": "uuid",
        "planName": "Gold Plan",
        "planCode": "GOLD-001"
      },
      "insurer": {
        "id": "uuid",
        "companyName": "Pak-Qatar Insurance"
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

---

### 3. Get Claim by ID (Detailed View)

```
GET /v1/claims/{claimId}
Authorization: Bearer <token>
```

**Access:** `@Roles('hospital', 'insurer', 'corporate', 'admin')` — Must have access to this claim

**Response:** `200 OK` (includes all relations, events, and documents)

```json
{
  "id": "uuid",
  "claimNumber": "CLM-20260307-00001",
  "claimStatus": "Pending",
  "amountClaimed": "50000.00",
  "approvedAmount": "0.00",
  "treatmentCategory": "Emergency",
  "priority": "High",
  "notes": "Patient admitted via ER",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp",
  "hospitalVisit": {
    "id": "uuid",
    "visitDate": "ISO 8601 timestamp",
    "dischargeDate": "ISO 8601 timestamp",
    "hospital": {
      "id": "uuid",
      "hospitalName": "Aga Khan University Hospital",
      "city": "Karachi"
    },
    "employee": {
      "id": "uuid",
      "firstName": "Ahmed",
      "lastName": "Khan",
      "cnic": "12345-6789012-3"
    },
    "dependent": null
  },
  "corporate": {
    "id": "uuid",
    "name": "Tech Corp"
  },
  "plan": {
    "id": "uuid",
    "planName": "Gold Plan",
    "planCode": "GOLD-001",
    "sumInsured": "500000",
    "coveredServices": { "emergency": true, "surgery": true }
  },
  "insurer": {
    "id": "uuid",
    "companyName": "Pak-Qatar Insurance"
  },
  "claimEvents": [
    {
      "id": "uuid",
      "action": "CLAIM_SUBMITTED",
      "statusFrom": null,
      "statusTo": "Pending",
      "actorName": "dr.ali@hospital.com",
      "actorRole": "hospital",
      "eventNote": "Claim submitted",
      "timestamp": "ISO 8601 timestamp"
    }
  ],
  "claimDocuments": [
    {
      "id": "uuid",
      "originalFilename": "discharge-summary.pdf",
      "fileUrl": "http://localhost:3001/uploads/claims/uuid.pdf",
      "fileSizeBytes": 245000,
      "createdAt": "ISO 8601 timestamp"
    }
  ]
}
```

---

### 4. Update Claim (Limited Fields)

```
PATCH /v1/claims/{claimId}
Content-Type: application/json
Authorization: Bearer <token>
```

**Access:** `@Roles('hospital')` — Only submitter can update, only while status is `Pending`

**Request Body (all optional):**

```json
{
  "amountClaimed": "number",
  "treatmentCategory": "string",
  "priority": "Low | Normal | High",
  "notes": "string"
}
```

**Constraints:**

- Only updatable when `claimStatus === 'Pending'`
- Cannot change `hospitalVisitId`, `corporateId`, `planId`, `insurerId`

**Response:** `200 OK`

---

## Workflow Endpoints (Insurer Only)

### 5. Approve Claim

```
PATCH /v1/claims/{claimId}/approve
Content-Type: application/json
Authorization: Bearer <token>
```

**Access:** `@Roles('insurer')` — Only insurers can approve

**Request Body:**

```json
{
  "approvedAmount": "number (required, must be ≤ amountClaimed)",
  "eventNote": "string (optional, reason for approval)"
}
```

**Valid Transitions:** `Pending → Approved`, `OnHold → Approved`

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "claimNumber": "CLM-20260307-00001",
  "claimStatus": "Approved",
  "amountClaimed": "50000.00",
  "approvedAmount": "45000.00",
  "updatedAt": "ISO 8601 timestamp",
  ...
}
```

---

### 6. Reject Claim

```
PATCH /v1/claims/{claimId}/reject
Content-Type: application/json
Authorization: Bearer <token>
```

**Access:** `@Roles('insurer')` — Only insurers can reject

**Request Body:**

```json
{
  "eventNote": "string (required, reason for rejection)"
}
```

**Valid Transitions:** `Pending → Rejected`, `OnHold → Rejected`

**Note:** `Rejected` is a terminal state — no further transitions allowed

**Response:** `200 OK`

---

### 7. Put Claim On Hold

```
PATCH /v1/claims/{claimId}/on-hold
Content-Type: application/json
Authorization: Bearer <token>
```

**Access:** `@Roles('insurer')` — Only insurers can put on hold

**Request Body:**

```json
{
  "eventNote": "string (required, reason for hold)"
}
```

**Valid Transitions:** `Pending → OnHold`

**Use Cases:**

- Missing documents
- Awaiting additional information
- Under investigation

**Response:** `200 OK`

---

### 8. Mark Claim as Paid

```
PATCH /v1/claims/{claimId}/paid
Content-Type: application/json
Authorization: Bearer <token>
```

**Access:** `@Roles('insurer')` — Only insurers can mark as paid

**Request Body:**

```json
{
  "paymentReference": "string (optional, e.g., transaction ID)",
  "eventNote": "string (optional)"
}
```

**Valid Transitions:** `Approved → Paid`

**Note:** `Paid` is a terminal state — no further transitions allowed

**Response:** `200 OK`

---

## Events Timeline

### 9. Get Claim Events

```
GET /v1/claims/{claimId}/events?page=1&limit=20
Authorization: Bearer <token>
```

**Access:** `@Roles('hospital', 'insurer', 'corporate', 'admin')` — Must have access to claim

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Records per page |

**Response:** `200 OK` (ordered by timestamp descending)

```json
{
  "data": [
    {
      "id": "uuid",
      "claimId": "uuid",
      "action": "CLAIM_APPROVED",
      "statusFrom": "Pending",
      "statusTo": "Approved",
      "actorUserId": "uuid",
      "actorName": "sarah@insurer.com",
      "actorRole": "insurer",
      "eventNote": "All documents verified",
      "timestamp": "ISO 8601 timestamp"
    },
    {
      "id": "uuid",
      "claimId": "uuid",
      "action": "CLAIM_SUBMITTED",
      "statusFrom": null,
      "statusTo": "Pending",
      "actorUserId": "uuid",
      "actorName": "dr.ali@hospital.com",
      "actorRole": "hospital",
      "eventNote": "Claim submitted",
      "timestamp": "ISO 8601 timestamp"
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

**Event Actions:**

- `CLAIM_SUBMITTED` — Initial claim creation
- `CLAIM_UPDATED` — Claim details modified
- `CLAIM_APPROVED` — Status changed to Approved
- `CLAIM_REJECTED` — Status changed to Rejected
- `CLAIM_ON_HOLD` — Status changed to OnHold
- `CLAIM_PAID` — Status changed to Paid
- `DOCUMENT_UPLOADED` — Document added
- `DOCUMENT_DELETED` — Document removed

---

## Documents

### 10. Upload Claim Document

```
POST /v1/claims/{claimId}/documents
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Access:** `@Roles('hospital', 'insurer')` — Both can upload supporting documents

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | PDF, JPG, PNG (max 10MB) |

**Accepted MIME Types:**

- `application/pdf`
- `image/jpeg`
- `image/png`

**Constraints:**

- Cannot upload to claims in terminal states (`Paid`, `Rejected`)

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "claimId": "uuid",
  "originalFilename": "discharge-summary.pdf",
  "filePath": "uploads/claims/abc123.pdf",
  "fileUrl": "http://localhost:3001/uploads/claims/abc123.pdf",
  "fileSizeBytes": 245000,
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

---

### 11. Get Claim Documents (List)

```
GET /v1/claims/{claimId}/documents
Authorization: Bearer <token>
```

**Access:** `@Roles('hospital', 'insurer', 'corporate', 'admin')` — Must have access to claim

**Response:** `200 OK` (ordered by createdAt descending)

```json
[
  {
    "id": "uuid",
    "claimId": "uuid",
    "originalFilename": "discharge-summary.pdf",
    "filePath": "uploads/claims/abc123.pdf",
    "fileUrl": "http://localhost:3001/uploads/claims/abc123.pdf",
    "fileSizeBytes": 245000,
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
]
```

---

### 12. Delete Claim Document

```
DELETE /v1/claims/{claimId}/documents/{documentId}
Authorization: Bearer <token>
```

**Access:** `@Roles('hospital', 'insurer')` — Uploader or insurer can delete

**Constraints:**

- Cannot delete if claim is in terminal state (`Paid`, `Rejected`)

**Response:** `200 OK`

---

## Error Responses

All errors follow this format:

```json
{
  "message": "Error description",
  "statusCode": 400 | 401 | 403 | 404 | 409 | 500,
  "error": "BadRequestException | UnauthorizedException | ForbiddenException | NotFoundException"
}
```

### Common Error Messages

| Status | Message                                                 | Scenario                              |
| ------ | ------------------------------------------------------- | ------------------------------------- |
| `400`  | `Employee number is required`                           | Missing employeeNumber param          |
| `400`  | `Hospital visit not found`                              | Invalid hospitalVisitId               |
| `400`  | `This visit already has a claim submitted`              | Visit status is already Claimed       |
| `400`  | `Amount claimed exceeds plan sum insured`               | amountClaimed > sumInsured            |
| `400`  | `Invalid status transition: Rejected → Approved`        | Invalid state machine transition      |
| `400`  | `Approved amount cannot exceed claimed amount`          | Validation failure                    |
| `400`  | `Claim can only be updated while in Pending status`     | Update attempted on non-pending claim |
| `400`  | `Cannot upload documents for claims in terminal status` | Upload to paid/rejected claim         |
| `401`  | `Unauthorized`                                          | Missing or invalid JWT                |
| `403`  | `You do not have access to this claim`                  | Role-based access denied              |
| `404`  | `Claim not found`                                       | Invalid claim ID                      |
| `404`  | `Document not found`                                    | Invalid document ID                   |
| `404`  | `Employee not found`                                    | Invalid employee number               |
| `404`  | `No unclaimed visits found for this employee`           | No visits with Pending status         |

---

## Testing with Postman

### Environment Variables

```
BASE_URL = http://localhost:3001/api/v1
AUTH_TOKEN = <jwt-from-login>
CLAIM_ID = <uuid-from-create>
DOCUMENT_ID = <uuid-from-upload>
EMPLOYEE_NUMBER = EMP-001
```

### Test Flow

#### Hospital Claim Submission Workflow

1. **Login as Hospital** → Get JWT
2. **GET /v1/hospitals/visits/unclaimed?employeeNumber=EMP-001** → Get employee info + unclaimed visits
3. **Select a visit** from the response (copy `id` from visits array)
4. **POST /v1/claims** with simplified body:
   ```json
   {
     "hospitalVisitId": "<visit-id-from-step-2>",
     "amountClaimed": 50000,
     "treatmentCategory": "Emergency",
     "notes": "Patient admitted via ER"
   }
   ```

   - `corporateId`, `planId`, `insurerId` are auto-populated
   - Visit status automatically updated to `Claimed`

#### Happy Path: Submit → Approve → Pay

1. **Login as Hospital** → Get JWT
2. **GET /v1/hospitals/visits/unclaimed?employeeNumber=EMP-001** → Get unclaimed visits
3. **POST /v1/claims** → Creates claim in `Pending` status
4. **Login as Insurer** → Get JWT
5. **PATCH /v1/claims/:id/approve** → Status becomes `Approved`
6. **PATCH /v1/claims/:id/paid** → Status becomes `Paid` (terminal)

#### Sad Path: Submit → On Hold → Reject

1. **POST /v1/claims** → Creates claim in `Pending` status
2. **PATCH /v1/claims/:id/on-hold** → Status becomes `OnHold`
3. **PATCH /v1/claims/:id/reject** → Status becomes `Rejected` (terminal)

#### Document Flow

1. **POST /v1/claims/:id/documents** → Upload PDF/image
2. **GET /v1/claims/:id/documents** → List all documents
3. **DELETE /v1/claims/:id/documents/:docId** → Remove document

---

## Files Created/Modified

### New Files

| File                                         | Description                      |
| -------------------------------------------- | -------------------------------- |
| `dto/create-claim.dto.ts`                    | Claim submission DTO             |
| `dto/update-claim.dto.ts`                    | Claim update DTO                 |
| `dto/claim-filter.dto.ts`                    | Query filter DTO with pagination |
| `dto/approve-claim.dto.ts`                   | Approval action DTO              |
| `dto/reject-claim.dto.ts`                    | Rejection action DTO             |
| `dto/on-hold-claim.dto.ts`                   | On-hold action DTO               |
| `dto/paid-claim.dto.ts`                      | Payment action DTO               |
| `dto/index.ts`                               | DTO exports                      |
| `constants/status-transitions.ts`            | State machine rules              |
| `repositories/claims.repository.ts`          | Full Prisma CRUD implementation  |
| `repositories/claim-events.repository.ts`    | Event tracking                   |
| `repositories/claim-documents.repository.ts` | Document management              |
| `services/claim-processing.service.ts`       | State machine workflow           |

### Modified Files

| File                   | Changes                  |
| ---------------------- | ------------------------ |
| `claims.controller.ts` | 12 endpoints implemented |
| `claims.service.ts`    | Full business logic      |
| `claims.module.ts`     | New providers registered |

---

## Endpoint Summary

| #   | Method | Endpoint                        | Role                                | Description            |
| --- | ------ | ------------------------------- | ----------------------------------- | ---------------------- |
| 0   | GET    | /v1/hospitals/visits/unclaimed  | hospital                            | Get unclaimed visits   |
| 1   | POST   | /v1/claims                      | hospital                            | Submit new claim       |
| 2   | GET    | /v1/claims                      | hospital, insurer, corporate, admin | List claims (filtered) |
| 3   | GET    | /v1/claims/:id                  | hospital, insurer, corporate, admin | Claim details          |
| 4   | PATCH  | /v1/claims/:id                  | hospital                            | Update pending claim   |
| 5   | PATCH  | /v1/claims/:id/approve          | insurer                             | Approve claim          |
| 6   | PATCH  | /v1/claims/:id/reject           | insurer                             | Reject claim           |
| 7   | PATCH  | /v1/claims/:id/on-hold          | insurer                             | Put on hold            |
| 8   | PATCH  | /v1/claims/:id/paid             | insurer                             | Mark as paid           |
| 9   | GET    | /v1/claims/:id/events           | hospital, insurer, corporate, admin | Event timeline         |
| 10  | POST   | /v1/claims/:id/documents        | hospital, insurer                   | Upload document        |
| 11  | GET    | /v1/claims/:id/documents        | hospital, insurer, corporate, admin | List documents         |
| 12  | DELETE | /v1/claims/:id/documents/:docId | hospital, insurer                   | Delete document        |
