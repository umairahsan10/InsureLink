# Phase 1 API Testing Guide — JWT Protected Endpoints

**Date:** March 6, 2026  
**Base URL:** `http://localhost:3001/api/v1`

---

## Prerequisites

1. **Start the backend server:**
   ```bash
   cd server
   npm run start:dev
   ```

2. **Use Postman, Insomnia, or Thunder Client** (VS Code extension)

---

## Step 1: Register Users

### 1.1 Register a Hospital User

```http
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "hospital@test.com",
  "password": "Hospital123",
  "firstName": "Test",
  "lastName": "Hospital",
  "phone": "03001234567",
  "userRole": "hospital",
  "dob": "1990-01-15",
  "gender": "Male"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "email": "hospital@test.com",
    "firstName": "Test",
    "lastName": "Hospital",
    "role": "hospital",
    "createdAt": "2026-03-06T..."
  },
  "message": "User registered successfully"
}
```

### 1.2 Register an Insurer User

```http
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "insurer@test.com",
  "password": "Insurer123",
  "firstName": "Test",
  "lastName": "Insurer",
  "phone": "03009876543",
  "userRole": "insurer",
  "dob": "1985-05-20",
  "gender": "Female"
}
```

### 1.3 Register a Corporate User

```http
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "corporate@test.com",
  "password": "Corporate123",
  "firstName": "HR",
  "lastName": "Manager",
  "phone": "03005555555",
  "userRole": "corporate",
  "dob": "1988-08-10",
  "gender": "Male"
}
```

### 1.4 Register a Patient User

```http
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "patient@test.com",
  "password": "Patient123",
  "firstName": "Ali",
  "lastName": "Khan",
  "phone": "03007777777",
  "userRole": "patient",
  "dob": "1995-03-25",
  "gender": "Male",
  "cnic": "42101-1234567-1"
}
```

---

## Step 2: Login and Get JWT Token

### 2.1 Login as Hospital User

```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "hospital@test.com",
  "password": "Hospital123"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "email": "hospital@test.com",
      "firstName": "Test",
      "lastName": "Hospital",
      "role": "hospital"
    }
  },
  "message": "Login successful"
}
```

**💡 IMPORTANT:** Copy the `access_token` — you'll need it for all subsequent requests!

### 2.2 Login as Insurer User

```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "insurer@test.com",
  "password": "Insurer123"
}
```

---

## Step 3: Set Authorization Header

For all protected endpoints, add this header:

```
Authorization: Bearer <your-access-token>
```

**Postman Setup:**
1. Go to the **Headers** tab
2. Add header:
   - **Key:** `Authorization`
   - **Value:** `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   
**💡 TIP:** Create a Postman environment variable called `access_token` and use:
```
Authorization: Bearer {{access_token}}
```

---

## Phase 1 API Tests

---

## 🏥 Hospitals Module

### Test 1: Create Hospital (Requires: hospital or insurer role)

```http
POST http://localhost:3001/api/v1/hospitals
Authorization: Bearer <hospital-or-insurer-token>
Content-Type: application/json

{
  "hospitalName": "Shifa International Hospital",
  "licenseNumber": "SIH-2024-001",
  "city": "Islamabad",
  "address": "H-8/4, Pitras Bukhari Road, Islamabad",
  "latitude": 33.6844,
  "longitude": 73.0479,
  "emergencyPhone": "+92-51-8463000",
  "hospitalType": "reimbursable",
  "hasEmergencyUnit": true,
  "isActive": true
}
```

**Expected:** `201 Created` with hospital data

**Test Unauthorized:** Try without token → `401 Unauthorized`  
**Test Wrong Role:** Try with patient token → `403 Forbidden`

---

### Test 2: Get All Hospitals (Requires: JWT token, any role)

```http
GET http://localhost:3001/api/v1/hospitals?page=1&limit=10&city=Islamabad
Authorization: Bearer <any-valid-token>
```

**Expected:** `200 OK` with paginated hospitals

---

### Test 3: Get Hospital by ID (Requires: JWT token, any role)

```http
GET http://localhost:3001/api/v1/hospitals/<hospital-uuid>
Authorization: Bearer <any-valid-token>
```

---

### Test 4: Update Hospital (Requires: hospital or insurer role)

```http
PATCH http://localhost:3001/api/v1/hospitals/<hospital-uuid>
Authorization: Bearer <hospital-or-insurer-token>
Content-Type: application/json

{
  "emergencyPhone": "+92-51-8463001",
  "isActive": true
}
```

---

### Test 5: Add Emergency Contact (Requires: hospital or insurer role)

```http
POST http://localhost:3001/api/v1/hospitals/<hospital-uuid>/emergency-contacts
Authorization: Bearer <hospital-or-insurer-token>
Content-Type: application/json

{
  "contactLevel": 1,
  "designation": "Chief Medical Officer",
  "name": "Dr. Ahmed Khan",
  "contactNumber": "+92-300-1234567",
  "isActive": true
}
```

---

### Test 6: Get Emergency Contacts (Requires: JWT token, any role)

```http
GET http://localhost:3001/api/v1/hospitals/<hospital-uuid>/emergency-contacts
Authorization: Bearer <any-valid-token>
```

---

### Test 7: Update Emergency Contact (Requires: hospital or insurer role)

```http
PATCH http://localhost:3001/api/v1/hospitals/emergency-contacts/<contact-uuid>
Authorization: Bearer <hospital-or-insurer-token>
Content-Type: application/json

{
  "contactNumber": "+92-300-9999999",
  "isActive": true
}
```

---

### Test 8: Delete Emergency Contact (Requires: hospital or insurer role)

```http
DELETE http://localhost:3001/api/v1/hospitals/emergency-contacts/<contact-uuid>
Authorization: Bearer <hospital-or-insurer-token>
```

---

### Test 9: Create Hospital Visit (Requires: hospital role ONLY)

**First, you need an employee. Use seed data or create via Dev A's employee endpoints.**

```http
POST http://localhost:3001/api/v1/hospitals/<hospital-uuid>/visits
Authorization: Bearer <hospital-token>
Content-Type: application/json

{
  "employeeId": "<employee-uuid>",
  "visitDate": "2026-03-06T10:30:00Z",
  "dischargeDate": null
}
```

**For dependent visit:**
```json
{
  "employeeId": "<employee-uuid>",
  "dependentId": "<dependent-uuid>",
  "visitDate": "2026-03-06T10:30:00Z"
}
```

---

### Test 10: Get Hospital Visits (Requires: hospital or insurer role)

```http
GET http://localhost:3001/api/v1/hospitals/<hospital-uuid>/visits
Authorization: Bearer <hospital-or-insurer-token>
```

---

### Test 11: Find Nearby Hospitals (Public — NO AUTH REQUIRED)

```http
GET http://localhost:3001/api/v1/hospitals/search/nearby?latitude=33.6844&longitude=73.0479&radiusKm=50
```

**Expected:** `200 OK` with nearby hospitals sorted by distance

---

## 🛡️ Insurers Module

### Test 12: Create Insurer (Requires: insurer role)

```http
POST http://localhost:3001/api/v1/insurers
Authorization: Bearer <insurer-token>
Content-Type: application/json

{
  "companyName": "EFU Health Insurance",
  "licenseNumber": "EFU-2024-001",
  "address": "85-F, Block 6, P.E.C.H.S., Karachi",
  "city": "Karachi",
  "province": "Sindh",
  "maxCoverageLimit": 5000000,
  "networkHospitalCount": 120,
  "corporateClientCount": 45,
  "status": "Active",
  "operatingSince": "2010-05-15",
  "isActive": true
}
```

**Note:** `userId` is automatically extracted from JWT — do NOT send it in body!

---

### Test 13: Get All Insurers (Requires: JWT token, any role)

```http
GET http://localhost:3001/api/v1/insurers?page=1&limit=10&city=Karachi&status=Active
Authorization: Bearer <any-valid-token>
```

---

### Test 14: Get Insurer by ID (Requires: JWT token, any role)

```http
GET http://localhost:3001/api/v1/insurers/<insurer-uuid>
Authorization: Bearer <any-valid-token>
```

---

### Test 15: Update Insurer (Requires: insurer role)

```http
PATCH http://localhost:3001/api/v1/insurers/<insurer-uuid>
Authorization: Bearer <insurer-token>
Content-Type: application/json

{
  "networkHospitalCount": 125,
  "corporateClientCount": 50
}
```

---

### Test 16: Create Insurance Plan (Requires: insurer role)

```http
POST http://localhost:3001/api/v1/insurers/<insurer-uuid>/plans
Authorization: Bearer <insurer-token>
Content-Type: application/json

{
  "planName": "Gold Plan 2026",
  "planCode": "GOLD-2026-001",
  "sumInsured": 1000000,
  "coveredServices": {
    "outpatient": true,
    "inpatient": true,
    "emergency": true,
    "surgery": true,
    "maternity": true,
    "dental": false,
    "optical": false
  },
  "serviceLimits": {
    "outpatient_visits": 12,
    "inpatient_days": 30,
    "emergency_deductible": 500,
    "surgery_limit": 500000
  },
  "isActive": true
}
```

---

### Test 17: Get Plans for Insurer (Requires: JWT token, any role)

```http
GET http://localhost:3001/api/v1/insurers/<insurer-uuid>/plans?isActive=true
Authorization: Bearer <any-valid-token>
```

---

### Test 18: Update Plan (Requires: insurer role)

```http
PATCH http://localhost:3001/api/v1/insurers/plans/<plan-uuid>
Authorization: Bearer <insurer-token>
Content-Type: application/json

{
  "sumInsured": 1200000,
  "isActive": true
}
```

---

### Test 19: Delete Plan (Requires: insurer role)

```http
DELETE http://localhost:3001/api/v1/insurers/plans/<plan-uuid>
Authorization: Bearer <insurer-token>
```

---

### Test 20: Create Lab (Requires: insurer role)

```http
POST http://localhost:3001/api/v1/insurers/<insurer-uuid>/labs
Authorization: Bearer <insurer-token>
Content-Type: application/json

{
  "labName": "Chughtai Lab",
  "city": "Lahore",
  "address": "Main Boulevard, Gulberg III, Lahore",
  "licenseNumber": "CHUG-LAB-2024-001",
  "contactPhone": "+92-42-35714120",
  "contactEmail": "info@chughtailab.com",
  "testCategories": {
    "pathology": true,
    "radiology": true,
    "cardiology": false,
    "microbiology": true
  },
  "isActive": true
}
```

---

### Test 21: Get Labs for Insurer (Requires: JWT token, any role)

```http
GET http://localhost:3001/api/v1/insurers/<insurer-uuid>/labs?isActive=true
Authorization: Bearer <any-valid-token>
```

---

### Test 22: Get Lab by ID (Requires: JWT token, any role)

```http
GET http://localhost:3001/api/v1/insurers/labs/<lab-uuid>
Authorization: Bearer <any-valid-token>
```

---

## 🧪 Testing Scenarios

### Scenario 1: Unauthorized Access (No Token)

Try any protected endpoint WITHOUT the `Authorization` header:

```http
GET http://localhost:3001/api/v1/hospitals
```

**Expected:** `401 Unauthorized`
```json
{
  "message": "Invalid or missing JWT token",
  "statusCode": 401
}
```

---

### Scenario 2: Forbidden Access (Wrong Role)

Login as **patient**, then try to create a hospital:

```http
POST http://localhost:3001/api/v1/hospitals
Authorization: Bearer <patient-token>
Content-Type: application/json

{
  "hospitalName": "Test Hospital",
  "licenseNumber": "TEST-001",
  ...
}
```

**Expected:** `403 Forbidden`
```json
{
  "message": "User role 'patient' does not have access. Required roles: hospital, insurer",
  "statusCode": 403
}
```

---

### Scenario 3: Token Expiration

JWT tokens expire after **15 minutes**. If you get `401` after some time:

1. Use the `refresh_token` to get a new access token:

```http
POST http://localhost:3001/api/auth/refresh-token
Content-Type: application/json

{
  "refresh_token": "<your-refresh-token>"
}
```

2. Or just login again.

---

## 📋 Quick Reference: Role Access Matrix

| Endpoint | Public | Patient | Corporate | Hospital | Insurer |
|----------|:------:|:-------:|:---------:|:--------:|:-------:|
| **Hospitals** |
| `POST /hospitals` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `GET /hospitals` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `GET /hospitals/search/nearby` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `PATCH /hospitals/:id` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `POST/PATCH/DELETE` emergency contacts | ❌ | ❌ | ❌ | ✅ | ✅ |
| `GET` emergency contacts | ❌ | ✅ | ✅ | ✅ | ✅ |
| `POST /hospitals/:id/visits` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `GET /hospitals/:id/visits` | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Insurers** |
| `POST /insurers` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `GET /insurers` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `PATCH /insurers/:id` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `POST/PATCH/DELETE` plans | ❌ | ❌ | ❌ | ❌ | ✅ |
| `GET` plans | ❌ | ✅ | ✅ | ✅ | ✅ |
| `POST` labs | ❌ | ❌ | ❌ | ❌ | ✅ |
| `GET` labs | ❌ | ✅ | ✅ | ✅ | ✅ |

---

## 🐛 Common Issues

### Issue 1: "Invalid or missing JWT token"
- **Fix:** Add `Authorization: Bearer <token>` header
- Check token is not expired (15 min validity)

### Issue 2: "User role 'X' does not have access"
- **Fix:** Login with correct role (e.g., hospital for creating hospital visits)

### Issue 3: "Hospital with this license number already exists"
- **Fix:** Use unique `licenseNumber` for each hospital/insurer/lab

### Issue 4: Token expired
- **Fix:** Use `POST /auth/refresh-token` or login again

---

## 🎯 Complete Test Flow Example

```bash
# 1. Register hospital user
POST /auth/register (role: hospital) → Save user_id

# 2. Login
POST /auth/login → Copy access_token

# 3. Create hospital
POST /v1/hospitals (with Bearer token) → Save hospital_id

# 4. Add emergency contact
POST /v1/hospitals/{hospital_id}/emergency-contacts (with Bearer token)

# 5. Get all hospitals
GET /v1/hospitals (with Bearer token)

# 6. Test public endpoint (no token needed)
GET /v1/hospitals/search/nearby?latitude=33.6844&longitude=73.0479

# 7. Test wrong role (login as patient, try to create hospital)
POST /auth/login (role: patient) → access_token_patient
POST /v1/hospitals (with patient token) → Should get 403 Forbidden

# 8. Test insurer endpoints
POST /auth/register (role: insurer)
POST /auth/login (role: insurer) → access_token_insurer
POST /v1/insurers (with insurer token) → Save insurer_id
POST /v1/insurers/{insurer_id}/plans (with insurer token)
```

---

## 📝 Notes

- All IDs are UUIDs (auto-generated)
- Timestamps are ISO 8601 format
- Monetary amounts in PKR
- Token expiry: Access = 15 min, Refresh = 7 days
- Use `https://jwt.io` to decode and inspect your JWT tokens

---

**Happy Testing! 🚀**
