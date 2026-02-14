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
  "employeeId": "uuid (optional)",
  "dependentId": "uuid (optional)",
  "visitDate": "ISO 8601 string (required)",
  "dischargeDate": "ISO 8601 string (optional)"
}
```

**Validation:** Must provide either `employeeId` OR `dependentId` (not both, not neither)

**Response:** `201 Created`

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

---

**Last Updated:** February 14, 2026  
**Phase:** 1 (Hospitals & Insurers CRUD)  
**Next Phase:** Claims Core (Weeks 3-4)
