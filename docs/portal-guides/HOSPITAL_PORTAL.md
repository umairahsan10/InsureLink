# Hospital Portal - Complete Module Documentation

> **InsureLink** - Health Insurance Claims Management System
>
> This document covers every feature, page, API endpoint, and workflow in the Hospital module. A new team member should be able to read this file and fully understand what the hospital portal does, how it works, and where the code lives.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Navigation & Sidebar](#3-navigation--sidebar)
4. [Pages & Features](#4-pages--features)
   - [Dashboard](#41-dashboard)
   - [Claims Management](#42-claims-management)
   - [Patient Records](#43-patient-records)
   - [Patient Details Lookup](#44-patient-details-lookup)
   - [Hospital Visits](#45-hospital-visits)
   - [Emergency Contacts](#46-emergency-contacts)
   - [Profile](#47-profile)
5. [Hospital Onboarding](#5-hospital-onboarding)
6. [Backend API Endpoints](#6-backend-api-endpoints)
7. [Data Models](#7-data-models)
8. [Key Workflows](#8-key-workflows)
9. [Claim Submission Deep Dive](#9-claim-submission-deep-dive)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [Notifications & Messaging](#11-notifications--messaging)
12. [File Map](#12-file-map)

---

## 1. Overview

The **Hospital Portal** is used by healthcare providers (hospitals and clinics) to interact with the insurance system. Hospitals are a key actor in the claims pipeline -- they register patient visits, submit claims, and communicate with insurers. They can:

- Verify patient insurance coverage by CNIC
- Register hospital visits for insured employees and their dependents
- Submit insurance claims linked to hospital visits
- Track claim status and communicate with insurers via messaging
- Manage patient records
- Maintain emergency contact information
- Update hospital profile details

Hospitals **submit** claims but do **not** approve or reject them -- that is the insurer's role.

---

## 2. Tech Stack

| Layer     | Technology                                        |
| --------- | ------------------------------------------------- |
| Frontend  | Next.js 16 (App Router), React 19, TypeScript     |
| Styling   | Tailwind CSS 4                                    |
| State     | React Context (`AuthContext`, `ClaimsMessagingContext`) |
| Real-time | Socket.io (claim messaging + notifications)        |
| Backend   | NestJS 11, Prisma 7 ORM, PostgreSQL               |
| Storage   | Supabase (claim documents)                         |

---

## 3. Navigation & Sidebar

The hospital sidebar menu items:

| #  | Label               | Route                            |
| -- | ------------------- | -------------------------------- |
| 1  | Dashboard           | `/hospital/dashboard`            |
| 2  | Claims              | `/hospital/claims`               |
| 3  | Patient Records     | `/hospital/patients`             |
| 4  | Patient Details     | `/hospital/patient-details`      |
| 5  | Visits              | `/hospital/visits`               |
| 6  | Emergency Contacts  | `/hospital/emergency-contacts`   |
| 7  | Profile             | `/hospital/profile`              |

The layout wrapper (`client/src/app/hospital/layout.tsx`) uses `DashboardLayout`, displays the hospital name in the header, and renders a notification panel.

---

## 4. Pages & Features

### 4.1 Dashboard

**Route:** `/hospital/dashboard`
**File:** `client/src/app/hospital/dashboard/page.tsx`

The landing page after login with a quick overview and primary actions.

**Statistics Cards (top row):**

| Card             | Description                          |
| ---------------- | ------------------------------------ |
| Patients         | Total patient count                   |
| Claims Submitted | Total claims submitted by hospital    |
| Pending Approval | Claims awaiting insurer review        |
| Approved Today   | Claims approved today                 |

**Patient Verification Section:**
- CNIC input field
- "Verify Patient" button
- Calls `POST /api/patients/verify` with the entered CNIC
- Shows success message (patient found + basic info) or error (not found)
- Auto-clears result after 5 seconds

**Quick Actions Panel:**
- **Submit New Claim** -- navigates to `/hospital/claims?action=submit`
- **View All Claims** -- navigates to `/hospital/claims`
- **Patient Records** -- navigates to `/hospital/patients`

**Recent Claims Table:**
- Last 10 claims sorted by creation date (newest first)
- Columns: Claim ID, Patient Name, CNIC, Amount (PKR), Date, Status, Actions, Message
- **View** button opens claim details modal
- **Edit** button (only for pending claims) opens edit modal
- **Message** button opens claim messaging
- Red border indicator on claims with unread message alerts

**API calls:**
```
GET /api/v1/claims?limit=10&page=1&sortBy=createdAt&order=desc
GET /api/v1/claims/stats   -> { total, Pending, Approved }
POST /api/patients/verify  -> { cnic }
```

---

### 4.2 Claims Management

**Route:** `/hospital/claims`
**File:** `client/src/app/hospital/claims/page.tsx`

The primary claims interface -- submit new claims and manage existing ones.

**Statistics Cards:** Total Claims, Approved Claims, Pending Claims

**Filters:**
- Search by claim ID, patient name, or CNIC
- Status filter: All, Pending, Approved, Rejected, On Hold, Paid
- Amount range filter
- Pagination (10 per page, customizable)

**Claims Table Columns:**

| Column          | Description                              |
| --------------- | ---------------------------------------- |
| Claim Number    | Unique identifier                         |
| Patient Name    | Employee or dependent name                |
| CNIC            | National ID                               |
| Amount (PKR)    | Claimed amount                            |
| Date            | Submission date                           |
| Status          | Color-coded badge                         |
| Actions         | Dropdown menu                             |
| Message         | Opens claim messaging                     |

**Actions Dropdown:**
- **View Details** -- opens claim details modal
- **Edit** -- opens edit modal (pending claims only)
- **Message** -- opens messaging thread
- **Delete** -- deletes claim (if still pending)

**Submit Claim Button:** Opens the multi-step `SubmitClaimFormV2` (see [Section 9](#9-claim-submission-deep-dive) for full details).

---

### 4.3 Patient Records

**Route:** `/hospital/patients`
**File:** `client/src/app/hospital/patients/page.tsx`

A patient management dashboard for viewing insured individuals.

**Statistics Cards:**
- Total Patients
- Active Patients
- Patients with Active Claims

**Filters:**
- Search by name, CNIC, or email
- Status filter: All, Active, Inactive
- Pagination (10 per page)

**Table Columns:** Patient ID, Name, Age, Last Visit, Insurance Plan, Status, Actions

**Patient Details Modal:** Click a row to see:
- Full patient profile information
- Coverage details (total, used, remaining)
- Active claims

**API calls:**
```
GET /api/patients?search={}&status={}&page={}&limit={}
GET /api/patients/{id}/coverage
GET /api/patients/{id}/claims
```

---

### 4.4 Patient Details Lookup

**Route:** `/hospital/patient-details`
**File:** `client/src/app/hospital/patient-details/page.tsx`

A dedicated search interface for looking up specific patients.

**Search:** Enter CNIC, name, or email to find patients. Results appear as a clickable list.

**On selection, shows:**
- Full patient profile
- Coverage details and remaining balance
- Claims list: Claim ID, Status, Claimed Amount, Approved Amount, Date

**API calls:**
```
GET /api/patients?search={}&limit=20
GET /api/patients/{id}/coverage
GET /api/patients/{id}/claims
```

---

### 4.5 Hospital Visits

**Route:** `/hospital/visits`
**File:** `client/src/app/hospital/visits/page.tsx`

Register and manage hospital visit records. A visit must exist before a claim can be submitted against it.

**Add Visit Modal Fields:**

| Field             | Type             | Notes                                     |
| ----------------- | ---------------- | ----------------------------------------- |
| Employee Number   | Text (required)  | Press Enter to load dependents             |
| Dependent         | Dropdown         | Optional -- loaded based on employee       |
| Visit Date        | Date (required)  | ISO date string                            |
| Discharge Date    | Date (optional)  | When patient was discharged                |

**Visits Table Columns:** Employee Name, Dependent (if applicable), Visit Date, Discharge Date, Status

**Filters:** Search by employee number or patient name, pagination

**Actions:** Edit visit, Delete visit

**Visit Status:**
- **Pending** -- visit recorded, no claim submitted yet
- **Claimed** -- a claim has been filed against this visit

**API calls:**
```
GET /api/v1/dependents/by-employee/{employeeNumber}  (load dependents)
POST /api/v1/hospitals/{hospitalId}/visits            (create visit)
GET /api/v1/hospitals/{hospitalId}/visits              (list visits)
```

**Validation:**
- Employee must exist in the system
- If dependent selected, must belong to that employee
- Dependent must have Active/Approved status

---

### 4.6 Emergency Contacts

**Route:** `/hospital/emergency-contacts`
**File:** `client/src/app/hospital/emergency-contacts/page.tsx`

Manage the hospital's emergency contact hierarchy.

**Contact Levels:**

| Level | Label    | Badge Color | Description           |
| ----- | -------- | ----------- | --------------------- |
| 1     | Critical | Red         | Highest priority       |
| 2     | High     | Orange      | Second priority        |
| 3     | Normal   | Amber       | Standard priority      |

**One contact per level per hospital** (enforced by unique constraint).

**Add/Edit Contact Fields:**
- Contact Level (1-3, required)
- Designation/Title (required)
- Name (required)
- Contact Number (required)
- Active status toggle

**Contact Card Display:**
- Color-coded cards by priority level
- Name, designation, phone (clickable tel: link)
- Active/Inactive indicator
- Edit and Delete buttons

**API calls:**
```
GET /api/v1/hospitals/emergency-contacts           (current hospital's contacts)
POST /api/v1/hospitals/emergency-contacts          (create for current hospital)
PATCH /api/v1/hospitals/emergency-contacts/{id}    (update)
DELETE /api/v1/hospitals/emergency-contacts/{id}   (delete)
```

---

### 4.7 Profile

**Route:** `/hospital/profile`
**File:** `client/src/app/hospital/profile/page.tsx`

View and edit hospital profile information.

**Editable Fields:**
- Hospital Name
- Address
- City
- Emergency Phone
- Hospital Type: Reimbursable or Non-Reimbursable
- Has Emergency Unit (boolean toggle)

**Read-Only Field:**
- License Number (immutable after creation)

**Edit flow:** Click "Edit Profile" -> modify fields -> "Save Changes" or "Cancel"

**API calls:**
```
GET /api/v1/hospitals/{hospitalId}
PATCH /api/v1/hospitals/{hospitalId}
```

---

## 5. Hospital Onboarding

**Route:** `/onboard-hospital`
**File:** `client/src/app/onboard-hospital/page.tsx`

Registration form for new hospitals joining the network.

**Form Fields:**
- Hospital Name (required)
- License Number (required, must be unique)
- City, Address (required)
- Emergency Phone (required)
- Hospital Type: Reimbursable / Non-Reimbursable
- Has Emergency Unit (boolean)
- Latitude, Longitude (optional -- for geo-search)

**Flow:** Fill form -> Submit -> Hospital profile created -> Redirected to `/hospital/dashboard`

---

## 6. Backend API Endpoints

### Hospitals Controller (`server/src/modules/hospitals/hospitals.controller.ts`)

| Method | Endpoint                                      | Auth       | Description                          |
| ------ | --------------------------------------------- | ---------- | ------------------------------------ |
| POST   | `/api/v1/hospitals`                           | hospital, insurer | Create hospital profile        |
| GET    | `/api/v1/hospitals/all`                       | Public     | Get all active hospitals              |
| GET    | `/api/v1/hospitals/search/nearby`             | Public     | Find hospitals within radius (geo)    |
| GET    | `/api/v1/hospitals/search/sorted`             | Public     | All hospitals sorted by distance      |
| GET    | `/api/v1/hospitals`                           | Any        | Paginated hospital list with filters  |
| GET    | `/api/v1/hospitals/:id`                       | Any        | Get hospital by ID                    |
| PATCH  | `/api/v1/hospitals/:id`                       | hospital, insurer | Update hospital profile        |

### Hospital Visit Endpoints

| Method | Endpoint                                      | Auth       | Description                          |
| ------ | --------------------------------------------- | ---------- | ------------------------------------ |
| GET    | `/api/v1/hospitals/:id/visits`                | hospital, insurer | Get hospital visits            |
| POST   | `/api/v1/hospitals/:id/visits`                | hospital   | Create hospital visit                 |
| GET    | `/api/v1/hospitals/visits/unclaimed`          | hospital   | Get unclaimed visits for employee     |

### Emergency Contact Endpoints

| Method | Endpoint                                            | Auth             | Description                    |
| ------ | --------------------------------------------------- | ---------------- | ------------------------------ |
| POST   | `/api/v1/hospitals/:id/emergency-contacts`          | hospital, insurer | Add contact for hospital      |
| POST   | `/api/v1/hospitals/emergency-contacts`              | hospital         | Add contact for current hospital|
| GET    | `/api/v1/hospitals/:id/emergency-contacts`          | Any              | Get hospital's contacts         |
| GET    | `/api/v1/hospitals/emergency-contacts`              | hospital         | Get current hospital's contacts |
| GET    | `/api/v1/hospitals/emergency-contacts/:contactId`   | Any              | Get specific contact            |
| PATCH  | `/api/v1/hospitals/emergency-contacts/:contactId`   | hospital, insurer | Update contact               |
| DELETE | `/api/v1/hospitals/emergency-contacts/:contactId`   | hospital, insurer | Delete contact               |

### Claims Controller (Hospital Interactions)

| Method | Endpoint                      | Auth     | Description                          |
| ------ | ----------------------------- | -------- | ------------------------------------ |
| POST   | `/api/v1/claims`              | hospital | Submit new claim                      |
| GET    | `/api/v1/claims`              | Any      | List claims with filters              |
| GET    | `/api/v1/claims/:id`          | Any      | Get claim by ID                       |
| PATCH  | `/api/v1/claims/:id`          | hospital | Edit pending claim                    |
| DELETE | `/api/v1/claims/:id`          | hospital | Delete pending claim                  |
| GET    | `/api/v1/claims/stats`        | Any      | Claim counts by status                |
| POST   | `/api/v1/claims/:id/messages` | Any      | Send message on claim                 |
| GET    | `/api/v1/claims/:id/messages` | Any      | Get claim messages                    |

### Patients Controller (Hospital Uses)

| Method | Endpoint                            | Auth   | Description                    |
| ------ | ----------------------------------- | ------ | ------------------------------ |
| POST   | `/api/patients/verify`              | Public | Verify patient by CNIC          |
| GET    | `/api/patients`                     | Any    | List patients (searchable)      |
| GET    | `/api/patients/:id`                 | Any    | Get patient details             |
| GET    | `/api/patients/:id/coverage`        | Any    | Get insurance coverage          |
| GET    | `/api/patients/:id/claims`          | Any    | Get patient's claims            |
| GET    | `/api/patients/:id/hospital-visits` | Any    | Get patient's visit history     |

---

## 7. Data Models

### Hospital

```
id               -- UUID primary key
userId           -- FK to User (1:1)
hospitalName     -- Display name (255 chars)
licenseNumber    -- Unique license ID (100 chars, immutable)
city             -- City (100 chars)
address          -- Full address (500 chars)
latitude         -- Decimal (9,6) for geo-search
longitude        -- Decimal (9,6) for geo-search
emergencyPhone   -- Emergency phone number (20 chars)
hospitalType     -- reimbursable | non_reimbursable
hasEmergencyUnit -- Boolean (default: true)
isActive         -- Boolean (default: true)
createdAt, updatedAt
```

**Relations:** User, EmergencyContacts[], HospitalVisits[]

**Indices:** userId, licenseNumber, city, hospitalType, isActive, createdAt, composite (city + isActive)

### HospitalEmergencyContact

```
id               -- UUID primary key
hospitalId       -- FK to Hospital
contactLevel     -- Integer (1-3)
designation      -- Title/role (100 chars)
name             -- Contact name (100 chars)
contactNumber    -- Phone number (20 chars)
isActive         -- Boolean (default: true)
```

**Unique constraint:** (hospitalId, contactLevel) -- one contact per level per hospital

### HospitalVisit

```
id               -- UUID primary key
employeeId       -- FK to Employee (optional)
dependentId      -- FK to Dependent (optional)
hospitalId       -- FK to Hospital
visitDate        -- DateTime (when patient visited)
dischargeDate    -- DateTime (optional, when discharged)
status           -- Pending | Claimed
createdAt, updatedAt
```

**Relations:** Employee?, Dependent?, Hospital, Claims[]

**Indices:** Composite indices on (employeeId + visitDate DESC), (dependentId + visitDate DESC), (hospitalId + visitDate DESC)

### Claim (submitted by hospital)

```
id                -- UUID primary key
claimNumber       -- Auto-generated unique identifier
claimStatus       -- Pending | Approved | Rejected | OnHold | Paid
hospitalVisitId   -- FK to HospitalVisit
amountClaimed     -- Decimal (18,2) in PKR
approvedAmount    -- Decimal (18,2), nullable
treatmentCategory -- Optional category string
priority          -- Low | Normal | High
notes             -- Optional notes
corporateId       -- FK to Corporate (auto-populated from employee)
planId            -- FK to Plan (auto-populated)
insurerId         -- FK to Insurer (auto-populated)
createdAt, updatedAt
```

**Relations:** HospitalVisit, Corporate, Plan, Insurer, ClaimEvents[], ClaimDocuments[], ChatMessages[]

---

## 8. Key Workflows

### Workflow 1: Verify Patient Insurance

```
1.  Hospital staff enters patient CNIC on dashboard
2.  Clicks "Verify Patient"
3.  System calls POST /api/patients/verify with CNIC
4.  If found: shows patient name, status, and basic coverage info
5.  If not found: shows error message
6.  Result auto-clears after 5 seconds
```

### Workflow 2: Register a Hospital Visit

```
1.  Navigate to /hospital/visits
2.  Click "Add Visit" or "New Visit"
3.  Enter employee number and press Enter
4.  System loads dependents for that employee
5.  (Optional) Select a dependent from dropdown
6.  Enter visit date (required)
7.  (Optional) Enter discharge date
8.  Submit
9.  System validates:
    - Employee exists
    - Dependent (if selected) belongs to employee
    - Dependent status is Active/Approved
10. Creates HospitalVisit record with status "Pending"
11. Visit appears in list
```

### Workflow 3: Submit a Claim

See [Section 9](#9-claim-submission-deep-dive) for the detailed multi-step flow.

### Workflow 4: Track Claim Status

```
Hospital can monitor claims in three places:
1. Dashboard: 10 most recent claims with status badges
2. Claims page: full list with filters and pagination
3. Claim details modal: complete information including:
   - Patient details
   - Visit information
   - Claim amount and status
   - Claim events (audit trail of status changes)
   - Associated documents
   - Message thread with insurer/corporate
```

### Workflow 5: Manage Emergency Contacts

```
1.  Navigate to /hospital/emergency-contacts
2.  View contacts sorted by level (1=Critical, 2=High, 3=Normal)
3.  Add contact: select level, enter designation, name, phone
4.  Edit or delete existing contacts
5.  One contact per level (unique constraint enforced)
```

---

## 9. Claim Submission Deep Dive

**Component:** `SubmitClaimFormV2` (`client/src/components/hospital/SubmitClaimFormV2.tsx`)

This is a multi-step wizard for submitting insurance claims.

### Step 1: Search Employee

- Input: Employee number
- Action: Fetches unclaimed hospital visits for that employee at this hospital
- Error handling: shows error if employee not found
- API: `GET /api/v1/hospitals/visits/unclaimed?employeeNumber={}`

### Step 2: Select Visit

- Displays list of unclaimed (Pending status) visits at this hospital
- Each visit shows: visit date, discharge date, patient name
- User selects one visit to claim against

### Step 3: Claim Details

| Field              | Type                 | Notes                                        |
| ------------------ | -------------------- | -------------------------------------------- |
| Amount Claimed     | Number (PKR)         | Required, must be > 0                         |
| Treatment Category | Dropdown + custom    | General Checkup, Surgery, Lab Test, X-Ray, Consultation, Emergency Care, Dental, Physical Therapy, Other |
| Priority           | Select               | Low, Normal (default), High                   |
| Notes              | Textarea             | Optional additional information                |

### Step 4: Upload Documents

- Document verification system
- File upload for supporting documents (discharge summaries, bills, lab reports)
- Uses document verification utilities for authenticity checks

### Submission

```
POST /api/v1/claims
Body: {
  hospitalVisitId: string   // from Step 2
  amountClaimed: number     // from Step 3
  treatmentCategory: string // from Step 3
  priority: string          // from Step 3
  notes: string             // from Step 3
}
```

### Backend Processing on Submit

```
1. Fetches the hospital visit and its associated employee
2. Auto-populates: corporateId, planId, insurerId from employee data
3. Validates:
   - Visit exists and belongs to this hospital
   - Visit hasn't already been claimed
   - Claimed amount > 0
   - Claimed amount <= employee's remaining coverage
4. Creates Claim record with status "Pending"
5. Updates HospitalVisit status from "Pending" to "Claimed"
6. Returns claim with generated claim number
```

### Unclaimed Visits Response Format

```json
{
  "employee": {
    "id": "...",
    "firstName": "...",
    "lastName": "...",
    "employeeNumber": "...",
    "corporateId": "...",
    "planId": "...",
    "insurerId": "...",
    "coverageAmount": 500000,
    "usedAmount": 150000,
    "remainingCoverage": 350000
  },
  "visits": [
    {
      "id": "...",
      "visitDate": "2026-03-15",
      "dischargeDate": "2026-03-18",
      "status": "Pending",
      "employee": { "id": "...", "firstName": "...", "lastName": "..." },
      "plan": { "id": "...", "planName": "...", "sumInsured": 500000 },
      "corporate": { "id": "...", "name": "..." }
    }
  ]
}
```

---

## 10. Authentication & Authorization

- **Role:** `hospital`
- **Assigned on:** Hospital profile creation during onboarding
- **JWT payload includes:** `user.hospitalId`

**Hospital-only actions (requires `@Roles('hospital')`):**
- Create claims
- Edit/delete pending claims
- Create/manage hospital visits
- Add emergency contacts for own hospital
- Get unclaimed visits

**Hospital-readable endpoints:**
- View claims (their own)
- View patients
- View patient coverage and claims
- List hospitals (public)
- Search hospitals by distance (public)

**Access control:**
- Hospitals can only submit claims for visits at **their own** hospital
- Hospitals can only manage emergency contacts for **their own** hospital
- Hospitals **cannot** approve or reject claims (insurer only)
- Hospitals **cannot** modify approved/rejected/paid claims

---

## 11. Notifications & Messaging

### Claim Messaging

Every claim has an associated message thread. Hospital staff can communicate with insurers and corporates directly on claims.

**Components:**
- `MessageButton` -- inline button in claims table
- `ClaimsMessagingContext` -- React context for messaging state
- `useClaimSocket(claimId)` -- Socket.io hook for real-time chat

**Features:**
- Send text messages
- Upload document attachments
- Typing indicators (someone is typing...)
- Read receipts
- Unread message alerts (red border on claim row)

**Socket.io events:**
- `join-claim-room` / `leave-claim-room` -- manage chat rooms
- `send-message` -- send a message
- `claim-message-new` -- receive new message
- `claim-message-read` -- message marked as read
- `user-typing` -- typing indicator

### Notifications

Hospital users receive notifications for:
- Claim status changes (approved, rejected, on hold, paid)
- Insurer messages on claims
- Document requests

Delivered via `useNotifications()` hook with real-time Socket.io push.

---

## 12. File Map

### Frontend Pages

| File                                                     | Purpose                        |
| -------------------------------------------------------- | ------------------------------ |
| `client/src/app/hospital/layout.tsx`                     | Layout wrapper + notifications  |
| `client/src/app/hospital/dashboard/page.tsx`             | Dashboard + patient verification|
| `client/src/app/hospital/claims/page.tsx`                | Claims management + submission  |
| `client/src/app/hospital/patients/page.tsx`              | Patient records                  |
| `client/src/app/hospital/patient-details/page.tsx`       | Patient lookup                   |
| `client/src/app/hospital/visits/page.tsx`                | Hospital visit management        |
| `client/src/app/hospital/emergency-contacts/page.tsx`    | Emergency contacts               |
| `client/src/app/hospital/profile/page.tsx`               | Profile management               |
| `client/src/app/onboard-hospital/page.tsx`               | Onboarding registration          |

### Frontend Components

| File                                                       | Purpose                        |
| ---------------------------------------------------------- | ------------------------------ |
| `client/src/components/hospital/SubmitClaimFormV2.tsx`      | Multi-step claim submission     |
| `client/src/components/hospital/SubmitClaimHeader.tsx`      | Claim form step indicator       |
| `client/src/components/hospital/HospitalSidebar.tsx`        | Navigation sidebar              |

### Frontend API Clients

| File                                       | Purpose                          |
| ------------------------------------------ | -------------------------------- |
| `client/src/lib/api/hospitals.ts`          | Hospital CRUD + visits + contacts |
| `client/src/lib/api/claims.ts`             | Claims CRUD + messaging           |
| `client/src/lib/api/patients.ts`           | Patient lookup + coverage         |
| `client/src/lib/api/dependents.ts`         | Dependent lookup by employee      |

### Frontend Utilities

| File                                            | Purpose                          |
| ----------------------------------------------- | -------------------------------- |
| `client/src/utils/documentVerification.ts`      | Document authenticity verification|
| `client/src/lib/format.ts`                      | Currency formatting (PKR)         |
| `client/src/contexts/ClaimsMessagingContext.tsx` | Messaging state management        |
| `client/src/hooks/useClaimSocket.ts`            | Socket.io hook for claim chat     |

### Backend

| File                                                                        | Purpose                          |
| --------------------------------------------------------------------------- | -------------------------------- |
| `server/src/modules/hospitals/hospitals.controller.ts`                      | Hospital API endpoints            |
| `server/src/modules/hospitals/hospitals.service.ts`                         | Hospital business logic           |
| `server/src/modules/hospitals/repositories/hospitals.repository.ts`         | Hospital DB queries               |
| `server/src/modules/hospitals/repositories/hospital-emergency-contacts.repository.ts` | Emergency contact DB queries |
| `server/src/modules/hospitals/repositories/hospital-visits.repository.ts`   | Visit DB queries                  |
| `server/src/modules/claims/claims.controller.ts`                           | Claims API endpoints              |
| `server/src/modules/claims/claims.service.ts`                              | Claims processing logic           |
| `server/src/modules/patients/patients.controller.ts`                       | Patient lookup API                |

### Backend DTOs

| File                                                                  | Purpose                    |
| --------------------------------------------------------------------- | -------------------------- |
| `server/src/modules/hospitals/dto/create-hospital.dto.ts`             | Hospital creation schema    |
| `server/src/modules/hospitals/dto/update-hospital.dto.ts`             | Hospital update schema      |
| `server/src/modules/hospitals/dto/hospital-emergency-contact.dto.ts`  | Emergency contact schemas   |
| `server/src/modules/hospitals/dto/hospital-visit.dto.ts`              | Hospital visit schema       |
| `server/src/modules/claims/dto/create-claim.dto.ts`                  | Claim creation schema       |
| `server/src/modules/claims/dto/update-claim.dto.ts`                  | Claim update schema         |

---

## Appendix: Enumerations

| Enum                  | Values                                              |
| --------------------- | --------------------------------------------------- |
| HospitalType          | `reimbursable`, `non_reimbursable`                   |
| HospitalVisitStatus   | `Pending`, `Claimed`                                 |
| ClaimStatus           | `Pending`, `Approved`, `Rejected`, `OnHold`, `Paid`  |
| Priority              | `Low`, `Normal`, `High`                              |
| UserRole (for hospital) | `hospital`                                         |
