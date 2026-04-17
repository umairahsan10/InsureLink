# Patient Portal - Complete Module Documentation

> **InsureLink** - Health Insurance Claims Management System
>
> This document covers every feature, page, API endpoint, and workflow in the Patient module. A new team member should be able to read this file and fully understand what the patient portal does, how it works, and where the code lives.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Navigation & Sidebar](#3-navigation--sidebar)
4. [Pages & Features](#4-pages--features)
   - [Dashboard](#41-dashboard)
   - [Submit Claim](#42-submit-claim)
   - [Claim History](#43-claim-history)
   - [Hospitals Directory](#44-hospitals-directory)
   - [Labs / OPD Discount Centers](#45-labs--opd-discount-centers)
   - [Profile & Dependents](#46-profile--dependents)
5. [Backend API Endpoints](#5-backend-api-endpoints)
6. [Data Models](#6-data-models)
7. [Key Workflows](#7-key-workflows)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Notifications & Real-Time](#9-notifications--real-time)
10. [File Map](#10-file-map)

---

## 1. Overview

The **Patient Portal** is the interface used by **employees** (insured individuals) and their **dependents**. Patients can:

- View their insurance coverage balance and claim statistics
- Submit insurance claims for hospital visits
- Track claim history and status
- Browse the network of covered hospitals and labs
- Manage their profile and add dependents (spouse, children, parents)

Patients are created when a **Corporate** adds them as employees. They log in with credentials provided during onboarding and are automatically routed to `/patient/*` based on their `patient` role.

---

## 2. Tech Stack

| Layer     | Technology                                      |
| --------- | ----------------------------------------------- |
| Frontend  | Next.js 16 (App Router), React 19, TypeScript   |
| Styling   | Tailwind CSS 4                                  |
| State     | React Context (`AuthContext`)                   |
| API calls | Custom `apiFetch` wrapper over Fetch API        |
| Backend   | NestJS 11, Prisma 7 ORM, PostgreSQL             |
| Storage   | Supabase (claim document uploads)               |
| Real-time | Socket.io (notifications)                       |

---

## 3. Navigation & Sidebar

The patient sidebar (defined in `client/src/components/layouts/Sidebar.tsx`) shows the following menu items:

| #  | Label       | Route                | Icon         |
| -- | ----------- | -------------------- | ------------ |
| 1  | Dashboard   | `/patient/dashboard` | Dashboard    |
| 2  | My Claims   | `/patient/claims`    | Document     |
| 3  | History     | `/patient/history`   | Clock        |
| 4  | Hospitals   | `/patient/hospitals` | Hospital     |
| 5  | Labs        | `/patient/labs`      | Lab beaker   |
| 6  | Profile     | `/patient/profile`   | User avatar  |

The layout wrapper is at `client/src/app/patient/layout.tsx`. It uses the shared `DashboardLayout` component, displays the patient's name in the header, and renders a notification panel with smart routing (claim notifications go to `/patient/claims`, benefit notifications go to `/patient/profile`).

---

## 4. Pages & Features

### 4.1 Dashboard

**Route:** `/patient/dashboard`
**File:** `client/src/app/patient/dashboard/page.tsx`

The landing page after login. Provides a snapshot of the patient's insurance status.

**Metric Cards (top row):**

| Card              | Description                                    | Color  |
| ----------------- | ---------------------------------------------- | ------ |
| Total Claims      | Count of all claims ever submitted              | Blue   |
| Approved Claims   | Count + approval success rate percentage        | Green  |
| Total Reimbursed  | Sum of approved amounts in PKR                  | Emerald|
| Pending Claims    | Claims still awaiting insurer review            | Amber  |

**Recent Claims Section:**
- Shows the 3 most recent claims
- Each card shows: hospital name, claim number, amount claimed, status badge
- Status icons: checkmark (approved), cross (rejected), clock (pending)

**Coverage Balance Section:**
- Shows remaining insurance coverage as a percentage
- Color-coded progress bar: green (<50% used), amber (<75%), red (>75%)
- Displays used amount vs. total coverage amount

**API calls made:**
```
GET /api/v1/claims/my-claims?limit=100
GET /api/patients/me
GET /api/patients/{id}/coverage
```

---

### 4.2 Submit Claim

**Route:** `/patient/claims`
**File:** `client/src/app/patient/claims/page.tsx`

A multi-section form for patients to self-submit insurance claims.

**Form Sections:**

1. **Hospital Selection**
   - Dropdown populated from the hospitals API
   - Shows hospital name with city appended
   - Required field

2. **Treatment Dates**
   - Admission date (required)
   - Discharge date (required)
   - Validation: discharge date must be >= admission date

3. **Financial Information**
   - Amount Claimed in PKR (decimal input)
   - Minimum: 0.01 -- prevents zero or negative amounts

4. **Treatment Description**
   - Free-text textarea describing the treatment/condition
   - Required

5. **Supporting Documents**
   - Optional file upload (PDF, JPG, PNG)
   - Max 10 MB per file
   - Multiple files allowed
   - Drag-and-drop interface with file list and remove button

**Validation Rules:**
- Hospital must be selected
- Both dates required, discharge >= admission
- Amount > 0
- Description not empty

**API calls on submit:**
```
POST /api/v1/claims/patient-submit
  Body: { hospitalId, visitDate, dischargeDate, amountClaimed, notes }

POST /api/v1/claims/{claimId}/documents   (file upload, if files attached)
```

**Success flow:** Shows confirmation with the generated claim number, option to submit another claim, and support contact info (phone + email).

**Error handling:** Catches coverage-limit-exceeded and duplicate-visit errors with friendly messages.

---

### 4.3 Claim History

**Route:** `/patient/history`
**File:** `client/src/app/patient/history/page.tsx`

A filterable, paginated list of all claims the patient has ever submitted.

**Statistics Cards (top):**
- Total claims count
- Approved claims count
- Pending claims count
- Total amount claimed

**Filters:**
- Search by claim number or hospital name
- Status dropdown: All, Pending, Approved, Rejected, Paid, On Hold
- Date range: All Time, Last 30 Days, Last 90 Days, This Year

**Pagination:** 5, 10, 20, or 50 items per page

**Table columns:**
- Claim number + status badge
- Hospital name
- Submission date
- Amount claimed
- Approved amount (if applicable)
- "View Details" button (opens `ClaimDetailsModal`)

**API call:**
```
GET /api/v1/claims/my-claims?limit=100
```
Filtering and pagination are handled client-side.

---

### 4.4 Hospitals Directory

**Route:** `/patient/hospitals`
**Files:** `client/src/app/patient/hospitals/page.tsx`, `client/src/app/patient/hospitals/PatientHospitalsClient.tsx`

A dual-tab interface for finding network hospitals.

**Tab 1 -- Smart Finder:**
- Uses browser geolocation to sort hospitals by distance from the patient
- Displays nearest hospitals first
- API: `GET /v1/hospitals/search/sorted?latitude={}&longitude={}`

**Tab 2 -- Hospital Directory:**
- Category filters: All Hospitals, Reimbursable, Non-Reimbursable
- Search by hospital name, city, or specialty
- City filter dropdown

**Hospital card displays:**
- Hospital name
- Reimbursable (green border) or Non-Reimbursable (red border with warning text) badge
- City location
- Emergency contact phone
- Specialties (up to 3 shown, "+N more" for overflow)

**Important distinction:**
- **Reimbursable** hospitals: patients can get treatment costs reimbursed by the insurer
- **Non-Reimbursable** hospitals: services are NOT eligible for reimbursement (a prominent warning is displayed)

---

### 4.5 Labs / OPD Discount Centers

**Route:** `/patient/labs`
**File:** `client/src/app/patient/labs/page.tsx`

Lists diagnostic labs and laboratories covered under the patient's insurance plan.

**Features:**
- Search by lab name, address, or city
- City selector dropdown
- Statistics: total labs, cities covered, filtered count

**Each lab card shows:**
- Lab name
- Address
- Contact phone and email
- Notice: "Variable discounts available -- confirm rates at service time"

**API call:**
```
GET /api/insurers/{insurerId}/labs
```

---

### 4.6 Profile & Dependents

**Route:** `/patient/profile`
**File:** `client/src/app/patient/profile/page.tsx`

Two-column layout for managing personal info and viewing insurance details.

**Left Column -- Personal Information:**
- First Name (read-only)
- Last Name (read-only)
- Email (editable)
- Phone Number (editable)
- "Save Changes" button

**Right Column -- Insurance Details:**
- Plan name
- Corporate employer
- Account status (Active/Inactive)

**Dependent Management (employees only):**

Patients who are employees can add and manage dependents.

**Dependent list displays:**
- Dependent name and relationship
- Status: Active (approved), Pending, Rejected (with rejection reason)

**Add Dependent -- multi-step modal (`AddDependentModal`):**

| Step     | Fields                                                     |
| -------- | ---------------------------------------------------------- |
| Personal | Name, Relationship (Spouse/Son/Daughter/Father/Mother)     |
| Details  | Date of Birth, Gender, CNIC, Phone Number                  |
| Coverage | Coverage Start Date (defaults to +15 days from today)      |
| Review   | Summary of all entered data before submission              |

**Validations:**
- CNIC format validation
- Phone number format
- Date validations
- CNIC availability check (ensures no duplicate)

**API calls:**
```
GET  /api/patients/me
PATCH /api/patients/me  { email, mobile }
GET  /api/v1/dependents?employeeId={id}
POST /api/v1/dependents  { dependent data }
GET  /api/v1/dependents/check-cnic/{cnic}
```

**Dependent lifecycle:**
1. Employee adds dependent via profile page
2. Request goes to Corporate admin for review
3. Corporate approves or rejects (with reason)
4. If approved, dependent becomes Active and can submit claims using the parent employee's coverage limit

---

## 5. Backend API Endpoints

### Patients Controller (`server/src/modules/patients/patients.controller.ts`)

| Method | Endpoint                         | Auth     | Description                                    |
| ------ | -------------------------------- | -------- | ---------------------------------------------- |
| GET    | `/api/patients/me`               | Required | Current patient's profile with coverage         |
| PATCH  | `/api/patients/me`               | Required | Update email and phone                          |
| POST   | `/api/patients/verify`           | Public   | Verify a patient by CNIC                        |
| GET    | `/api/patients`                  | Required | List patients (role-aware filtering)            |
| GET    | `/api/patients/:id`              | Required | Get specific patient details                    |
| GET    | `/api/patients/:id/coverage`     | Required | Coverage eligibility and limits                 |
| GET    | `/api/patients/:id/claims`       | Required | All claims for a patient                        |
| GET    | `/api/patients/:id/hospital-visits` | Required | Hospital visit history                       |

### Claims Controller (patient-specific)

| Method | Endpoint                              | Auth     | Description                        |
| ------ | ------------------------------------- | -------- | ---------------------------------- |
| POST   | `/api/v1/claims/patient-submit`       | Required | Patient self-service claim submit   |
| GET    | `/api/v1/claims/my-claims`            | Required | All claims for current patient      |
| POST   | `/api/v1/claims/{id}/documents`       | Required | Upload claim documents              |

### Dependents Controller

| Method | Endpoint                                 | Auth     | Description                         |
| ------ | ---------------------------------------- | -------- | ----------------------------------- |
| POST   | `/api/v1/dependents`                     | Required | Create a new dependent request       |
| GET    | `/api/v1/dependents`                     | Required | List dependents (filtered by query)  |
| GET    | `/api/v1/dependents/:id`                 | Required | Get dependent by ID                  |
| GET    | `/api/v1/dependents/check-cnic/:cnic`    | Public   | Check if CNIC is already registered  |

---

## 6. Data Models

### Patient Types

Patients are not a standalone database entity. Instead, a patient is either:

1. **Employee** -- linked to a Corporate via the `Employee` table, has a `User` account with role `patient`
2. **Dependent** -- linked to an Employee via the `Dependent` table, may or may not have a `User` account

### Coverage Model

```
totalCoverageAmount  -- Annual coverage limit (PKR), from the assigned Plan's sumInsured
usedAmount           -- Amount already claimed/approved
availableAmount      -- Remaining coverage (total - used)
coverageStartDate    -- When coverage begins
coverageEndDate      -- When coverage expires
isEligible           -- Boolean: can this patient currently claim?
reason               -- Explanation if ineligible (expired, inactive, exhausted, etc.)
```

Eligibility is computed at query time based on:
- Employee/dependent active status
- Current date within coverage period
- Available balance > 0

### Claim Status Lifecycle

```
Pending  -->  Approved  -->  Paid
   |              |
   +--> Rejected  |
   |              |
   +--> OnHold ---+
```

**What patients can see:** claim status, amounts, history, timestamps
**What patients cannot do:** modify submitted claims, approve/reject, mark as paid

---

## 7. Key Workflows

### Workflow 1: Submit a Claim

```
1.  Navigate to /patient/claims
2.  Select hospital from dropdown
3.  Enter admission and discharge dates
4.  Enter amount claimed (PKR)
5.  Write treatment description
6.  (Optional) Upload supporting documents (PDF/JPG/PNG, max 10 MB)
7.  Submit
8.  System validates coverage availability
9.  Creates claim with status "Pending" and generates claim number
10. Patient receives confirmation with claim number
11. Track status in /patient/history
```

**Backend claim creation flow (`patientSubmitClaim`):**
1. Validates patient has an active employee record
2. Checks hospital exists
3. Creates a `HospitalVisit` record (links patient to hospital)
4. Validates coverage: employee active, dates current, remaining coverage >= claimed amount
5. Creates `Claim` record (status: Pending, auto-populated corporateId/planId/insurerId)
6. Returns claim with generated claim number

### Workflow 2: Add a Dependent

```
1.  Navigate to /patient/profile
2.  Click "Add Dependent"
3.  Step 1: Enter name, select relationship
4.  Step 2: Enter DOB, gender, CNIC, phone
5.  Step 3: Select coverage start date (defaults to +15 days)
6.  Step 4: Review all entered details
7.  Submit
8.  Dependent created with status "Pending"
9.  Corporate admin receives notification to review
10. Corporate approves or rejects
11. If approved, dependent becomes Active and can claim under parent's coverage
```

### Workflow 3: Check Coverage Balance

```
1.  Dashboard shows coverage balance with progress bar and percentage
2.  /patient/hospitals shows which hospitals are reimbursable vs. non-reimbursable
3.  /patient/profile shows detailed coverage amounts
4.  When submitting a claim, system automatically validates remaining coverage
5.  Claim is rejected if it would exceed remaining balance
```

---

## 8. Authentication & Authorization

- **Role:** `patient`
- **Login:** Email + password, returns JWT access token (15-min) and refresh token (7-day)
- **Token storage:** `localStorage` keys `insurelink_access_token`, `insurelink_refresh_token`
- **Route protection:** Next.js middleware redirects unauthenticated users to `/login`
- **Backend guards:** `@Auth()` decorator validates JWT, `@Roles('patient')` enforces role

**Patient permissions:**
- Can view own profile, claims, dependents, coverage
- Can submit claims for self (and dependents once approved)
- Can view hospitals and labs covered by their plan
- Can update own email and phone number
- **Cannot** view other patients' data
- **Cannot** modify claim status (approve/reject/pay)

---

## 9. Notifications & Real-Time

**Notification types patients receive:**
- Claim status updates (Approved, Rejected, OnHold, Paid)
- Dependent approval/rejection notifications
- Coverage alerts

**Delivery:**
- Backend creates `Notification` records via producer services
- Frontend polls via notifications API
- Real-time push via Socket.io (`useNotifications` hook)
- Notification panel in layout header shows recent alerts with unread count
- Click a notification to navigate to the relevant page
- Dismiss or mark-as-read actions available

---

## 10. File Map

### Frontend Pages

| File                                                        | Purpose                      |
| ----------------------------------------------------------- | ---------------------------- |
| `client/src/app/patient/layout.tsx`                         | Layout wrapper + notifications |
| `client/src/app/patient/dashboard/page.tsx`                 | Dashboard page                |
| `client/src/app/patient/claims/page.tsx`                    | Submit claim form             |
| `client/src/app/patient/history/page.tsx`                   | Claim history + filters       |
| `client/src/app/patient/hospitals/page.tsx`                 | Hospitals directory entry     |
| `client/src/app/patient/hospitals/PatientHospitalsClient.tsx` | Hospitals directory logic   |
| `client/src/app/patient/labs/page.tsx`                      | Labs directory                |
| `client/src/app/patient/profile/page.tsx`                   | Profile + dependents          |

### Frontend Components

| File                                                      | Purpose                      |
| --------------------------------------------------------- | ---------------------------- |
| `client/src/components/patient/DependentsList.tsx`        | Displays dependent list       |
| `client/src/components/patient/AddDependentModal.tsx`     | Multi-step add dependent form |
| `client/src/components/patient/ClaimDetailsModal.tsx`     | Full claim detail view        |
| `client/src/components/layouts/Sidebar.tsx`               | Navigation sidebar            |
| `client/src/components/layouts/DashboardLayout.tsx`       | Portal layout wrapper         |

### Frontend API Clients

| File                                        | Purpose                      |
| ------------------------------------------- | ---------------------------- |
| `client/src/lib/api/patients.ts`            | Patient CRUD operations       |
| `client/src/lib/api/claims.ts`              | Claims API                    |
| `client/src/lib/api/dependents.ts`          | Dependents API                |
| `client/src/lib/api/hospitals.ts`           | Hospitals API                 |
| `client/src/lib/api/insurers.ts`            | Insurers API (for labs)       |

### Frontend Types

| File                                        | Purpose                      |
| ------------------------------------------- | ---------------------------- |
| `client/src/types/patient.d.ts`             | Patient type definitions      |
| `client/src/types/dependent.d.ts`           | Dependent type definitions    |
| `client/src/types/claims.d.ts`              | Claim type definitions        |

### Backend

| File                                                           | Purpose                        |
| -------------------------------------------------------------- | ------------------------------ |
| `server/src/modules/patients/patients.controller.ts`           | Patient API endpoints           |
| `server/src/modules/patients/patients.service.ts`              | Patient business logic          |
| `server/src/modules/patients/repositories/patients.repository.ts` | Patient database queries     |
| `server/src/modules/claims/claims.controller.ts`               | Claims API (patient endpoints)  |
| `server/src/modules/claims/claims.service.ts`                  | Claim creation/validation logic |
| `server/src/modules/dependents/dependents.controller.ts`       | Dependents API                  |
