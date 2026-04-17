# Insurer Portal - Complete Module Documentation

> **InsureLink** - Health Insurance Claims Management System
>
> This document covers every feature, page, API endpoint, and workflow in the Insurer module. A new team member should be able to read this file and fully understand what the insurer portal does, how it works, and where the code lives.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Navigation & Sidebar](#3-navigation--sidebar)
4. [Pages & Features](#4-pages--features)
   - [Dashboard](#41-dashboard)
   - [Claims Processing](#42-claims-processing)
   - [Insurance Plans](#43-insurance-plans)
   - [Network Hospitals](#44-network-hospitals)
   - [Corporate Clients](#45-corporate-clients)
   - [Network Labs](#46-network-labs)
   - [Document Extraction](#47-document-extraction)
   - [Profile](#48-profile)
5. [Insurer Onboarding](#5-insurer-onboarding)
6. [Backend API Endpoints](#6-backend-api-endpoints)
7. [Data Models](#7-data-models)
8. [Claims Processing Workflow](#8-claims-processing-workflow)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Messaging & Notifications](#10-messaging--notifications)
11. [File Map](#11-file-map)

---

## 1. Overview

The **Insurer Portal** is the control center for insurance companies. Insurers are the core decision-makers in the claims pipeline. They can:

- Review, approve, reject, hold, and mark claims as paid
- Manage insurance plans with coverage limits and service definitions
- Manage the network of partner hospitals and diagnostic labs
- Monitor corporate clients and their employees
- Extract data from claim documents using OCR/PDF processing
- Communicate with hospitals and corporates via real-time messaging on claims

The insurer is the **only role** that can approve or reject claims.

---

## 2. Tech Stack

| Layer     | Technology                                      |
| --------- | ----------------------------------------------- |
| Frontend  | Next.js 16 (App Router), React 19, TypeScript   |
| Styling   | Tailwind CSS 4                                  |
| State     | React Context (`AuthContext`, `ClaimsMessagingContext`) |
| Real-time | Socket.io (claim messaging + notifications)      |
| Backend   | NestJS 11, Prisma 7 ORM, PostgreSQL             |
| Storage   | Supabase (claim documents)                       |

---

## 3. Navigation & Sidebar

The insurer sidebar uses a red/purple color scheme. Menu items:

| #  | Label              | Route                        |
| -- | ------------------ | ---------------------------- |
| 1  | Dashboard          | `/insurer/dashboard`         |
| 2  | Claims             | `/insurer/claims`            |
| 3  | Plans              | `/insurer/plans`             |
| 4  | Hospitals          | `/insurer/hospitals`         |
| 5  | Corporates         | `/insurer/corporates`        |
| 6  | Labs               | `/insurer/labs`              |
| 7  | Document Extract   | `/insurer/document-extract`  |
| 8  | Profile            | `/insurer/profile`           |

---

## 4. Pages & Features

### 4.1 Dashboard

**Route:** `/insurer/dashboard`
**File:** `client/src/app/insurer/dashboard/page.tsx`

The main command center showing real-time claims KPIs and pending work.

**Summary Cards:**

| Card             | Description                                        | Color  |
| ---------------- | -------------------------------------------------- | ------ |
| Pending Claims   | Claims requiring review (most urgent)               | Red    |
| Rejected Claims  | Claims that were rejected (for re-review reference)  | Green  |
| Approved Claims  | Approved claims with paid sub-count                  | Blue   |
| Flagged Claims   | High-priority claims needing attention               | Orange |

**Processing Overview Panel:**
- Total claims processed
- Approval rate percentage
- Average processing time (displayed as 2.1 days)

**Pending Claims Table:**
- Shows the 3 most recent pending claims
- Columns: Claim ID, Patient, Hospital, Amount, Date, Status
- "Review" button opens inline claim action drawer

**Quick Actions:**
- Review pending claims
- Export pending claims as CSV report
- Send messages to hospitals/corporates on specific claims

**Claim Detail Drawer:**
- Slide-out panel for inline claim review
- Shows full claim details
- Action buttons: Approve, Reject

**Data fetching:** Uses `Promise.all()` for parallel requests to claims and stats endpoints.

---

### 4.2 Claims Processing

**Route:** `/insurer/claims`
**File:** `client/src/app/insurer/claims/page.tsx`

The primary claims management interface -- the most complex page in the insurer portal.

**Statistics Cards:**
- Total Claims, Pending, Approved, Rejected, On Hold, Paid counts

**Filters:**
- Search by claim ID, patient name, or hospital name
- Status filter: All, Pending, Approved, Rejected, OnHold, Paid
- Pagination: 5 / 10 / 20 / 50 items per page

**Claims Table Columns:**

| Column           | Description                                    |
| ---------------- | ---------------------------------------------- |
| Checkbox         | For bulk selection (pending claims only)        |
| Claim Number     | Unique claim identifier                         |
| Patient Name     | Employee or dependent name                      |
| Hospital Name    | Where treatment occurred                        |
| Date             | Submission date                                 |
| Claimed Amount   | Amount requested (PKR)                          |
| Approved Amount  | Amount approved (green if > 0)                  |
| Priority         | High (red) / Medium (amber) / Low (gray) badge  |
| Status           | Color-coded status badge                        |
| Actions          | Dropdown menu                                   |
| Message          | Opens messaging for this claim                  |

**Actions Dropdown (per claim):**

| Action          | Available When        | Opens                              |
| --------------- | --------------------- | ---------------------------------- |
| View Details    | Always                | Claim details modal                 |
| Approve Claim   | Pending / OnHold      | Approval dialog (amount + notes)    |
| Reject Claim    | Pending / OnHold      | Rejection dialog (reason required)  |
| Hold Claim      | Pending only          | On-hold confirmation dialog         |
| Mark as Paid    | Approved only         | Payment dialog (reference, method)  |

**Bulk Approve:**
- Select multiple pending claims via checkboxes
- "Bulk Approve" button opens dialog
- Approves all selected claims in a single API call

**Approval Dialog Fields:**
- Approved amount (number, required, > 0)
- Notes (optional)

**Rejection Dialog Fields:**
- Rejection reason (textarea, required)

**Mark as Paid Dialog Fields:**
- Payment reference
- Paid amount
- Payment method
- Notes

---

### 4.3 Insurance Plans

**Route:** `/insurer/plans`
**File:** `client/src/app/insurer/plans/page.tsx`

Full CRUD management for insurance plans that corporates assign to employees.

**Statistics Cards:**
- Total Plans, Active Plans, Inactive Plans, Average Sum Insured

**Filters:** Search by name/code, filter by status (Active/Inactive), pagination (10/page)

**Table Columns:** Plan Name, Code (monospace), Sum Insured (PKR), Covered Services (preview), Status badge, Actions (Edit/Delete)

**Create/Edit Modal Fields:**

| Field            | Type                  | Notes                                    |
| ---------------- | --------------------- | ---------------------------------------- |
| Plan Name        | Text                  | Required                                  |
| Plan Code        | Text                  | Required, unique, immutable after creation |
| Sum Insured      | Number (PKR)          | Required -- coverage per person            |
| Covered Services | Tag chips             | Quick-add presets: OPD, IPD, Maternity, Dental, Vision, Emergency, Surgery, Physiotherapy. Also supports custom input. |
| Service Limits   | Table (service + PKR) | Per-service coverage caps. Add/remove rows. |
| Active           | Checkbox              | Toggle plan active status                  |

**Detail Drawer:**
- Right-side slide-out showing all plan info in read-only format
- JSON preview for complex fields (coveredServices, serviceLimits)
- Edit and Delete buttons

---

### 4.4 Network Hospitals

**Route:** `/insurer/hospitals`
**File:** `client/src/app/insurer/hospitals/page.tsx`

Manage the network of partner hospitals.

**Statistics Cards:** Total Hospitals, Active Partners, Pending Approval, Cities Covered

**Filters:** Search by name/location/specialization, status filter (All/Active/Pending), city dropdown, pagination (10/page)

**Table Columns:** Hospital Name, Location, Specializations, Phone, Address, Status (Active/Pending/Rejected), Actions (View)

**Hospital Approval Workflow:**
- Hospitals register and appear with "Pending" status
- Insurer opens the detail drawer
- Can **Approve** (status -> Active) or **Reject** (status -> Rejected)
- Active hospitals appear in the patient's hospital directory

---

### 4.5 Corporate Clients

**Route:** `/insurer/corporates`
**File:** `client/src/app/insurer/corporates/page.tsx`

View and monitor all corporate clients insured by this insurer.

**Statistics Cards:** Total Corporates, Active Policies, Covered Employees (sum across all corporates)

**Filters:** Search by company name, status filter (Active/Inactive/Suspended), pagination (20/page)

**Table Columns:** Company Name, City, Employee Count, Contact Person, Status, Actions (View)

**Corporate Employees Modal:**
- Opens when clicking "View" on a corporate
- Shows all employees of that corporate in a table
- Columns: Name, Email, Phone, Designation, Status
- Click an employee to see their dependents
- Dependent details: Name, Relationship, Dependent ID, Status

---

### 4.6 Network Labs

**Route:** `/insurer/labs`
**File:** `client/src/app/insurer/labs/page.tsx`

Full CRUD for diagnostic and pathology labs in the insurer's network.

**Statistics Cards:** Total Labs, Active, Inactive, Cities Covered

**Filters:** Search by name/city/email, city dropdown, status filter, pagination (10/page)

**Table Columns:** Lab Name, City, License #, Phone, Email, Status, Actions (Edit/Delete)

**Create/Edit Modal Fields:**

| Field           | Type              | Notes                                         |
| --------------- | ----------------- | --------------------------------------------- |
| Lab Name        | Text              | Required                                       |
| City            | Text              | Required                                       |
| Address         | Text              | Required                                       |
| License Number  | Text              | Required, unique, immutable after creation      |
| Contact Phone   | Text              | Required                                       |
| Contact Email   | Text              | Required                                       |
| Test Categories | Tag chips         | Presets: Blood Tests, Pathology, Radiology, Ultrasound, ECG, X-Ray, CT Scan, MRI. Custom input supported. |
| Active          | Checkbox          | Toggle status                                  |

---

### 4.7 Document Extraction

**Route:** `/insurer/document-extract`
**File:** `client/src/app/insurer/document-extract/page.tsx`

Automated PDF document extraction and processing for claim forms.

**Component:** `DocumentExtractor` (from insurer components)

**Capabilities:**
- Upload and process insurance claim PDFs
- OCR text extraction from scanned documents
- Automatic field mapping to claim data structure

**Extracted Fields:**

| Category            | Fields                                                                  |
| ------------------- | ----------------------------------------------------------------------- |
| Claimant Info       | Name, Employee ID, CNIC, Employer Name, Plan Number                      |
| Patient Info        | Name, Gender, Takaful Certificate #, DOB, CNIC, Relationship, Mobile    |
| Claim Type          | OPD, Hospitalization, Pre/Post Hospitalization, Maternity, Pre/Post Natal |
| Medical Condition   | Nature of condition, Symptoms/Cause                                      |
| Hospital/Treatment  | Hospital/Clinic Name, Admission Date, Discharge Date                     |
| Claim Amount        | Total claimed, Days, Cheque title, Payable to employee/employer toggle   |

---

### 4.8 Profile

**Route:** `/insurer/profile`
**File:** `client/src/app/insurer/profile/page.tsx`

View and edit the insurer's company profile.

**Editable Fields:**
- Company Name, Address, City, Province, Status
- Max Coverage Limit (PKR)
- Operating Since date
- Network Hospital Count, Corporate Client Count

**Read-Only Fields:**
- License Number (immutable after creation)
- Active Plans list with sum insured and status

**Sidebar Panels:**
- Account Status (Active/Inactive badge, operating since, member since)
- Network Overview (hospital count, corporate count, max coverage)
- Quick Links (Manage Plans, Manage Labs, View Hospitals)

**Edit flow:** Click "Edit Profile" -> modify fields -> "Save Changes" or "Cancel"

---

## 5. Insurer Onboarding

**Route:** `/onboard-insurer`
**File:** `client/src/app/onboard-insurer/page.tsx`

Registration page for new insurance companies. This is accessed after initial user registration when the user has role `insurer` but no insurer profile yet.

**Form Fields:**
- Company Name (required)
- License Number (required)
- Operating Since (date, required)
- Address (required)
- City, Province (required)
- Max Coverage Limit in PKR (required)
- Network Hospital Count (optional)
- Corporate Client Count (optional)

**Flow:** Fill form -> Submit -> Session refreshed to populate insurerId -> Redirect to `/insurer/dashboard`

---

## 6. Backend API Endpoints

### Insurer Management

| Method | Endpoint                       | Auth     | Description                        |
| ------ | ------------------------------ | -------- | ---------------------------------- |
| POST   | `/api/v1/insurers`             | insurer  | Create insurer profile              |
| GET    | `/api/v1/insurers`             | Any      | List insurers (paginated)           |
| GET    | `/api/v1/insurers/:id`         | Any      | Get insurer by ID (with plans)      |
| PATCH  | `/api/v1/insurers/:id`         | insurer  | Update insurer profile              |

**List query params:** page, limit, city, status, sortBy, order

### Plan Management

| Method | Endpoint                          | Auth    | Description                |
| ------ | --------------------------------- | ------- | -------------------------- |
| POST   | `/api/v1/insurers/:id/plans`      | insurer | Create plan                 |
| GET    | `/api/v1/insurers/:id/plans`      | Any     | List plans for insurer      |
| PATCH  | `/api/v1/insurers/plans/:planId`  | insurer | Update plan                 |
| DELETE | `/api/v1/insurers/plans/:planId`  | insurer | Delete plan                 |

### Lab Management

| Method | Endpoint                          | Auth    | Description                |
| ------ | --------------------------------- | ------- | -------------------------- |
| POST   | `/api/v1/insurers/:id/labs`       | insurer | Create lab                  |
| GET    | `/api/v1/insurers/:id/labs`       | Any     | List labs for insurer       |
| GET    | `/api/v1/insurers/labs/:labId`    | Any     | Get lab by ID               |
| PATCH  | `/api/v1/insurers/labs/:labId`    | insurer | Update lab                  |
| DELETE | `/api/v1/insurers/labs/:labId`    | insurer | Delete lab                  |

### Claims Processing

| Method | Endpoint                            | Auth    | Description                        |
| ------ | ----------------------------------- | ------- | ---------------------------------- |
| POST   | `/api/v1/claims/:id/approve`        | insurer | Approve claim (amount + notes)      |
| POST   | `/api/v1/claims/:id/reject`         | insurer | Reject claim (reason required)      |
| POST   | `/api/v1/claims/:id/on-hold`        | insurer | Place claim on hold                 |
| POST   | `/api/v1/claims/:id/paid`           | insurer | Mark claim as paid                  |
| POST   | `/api/v1/claims/bulk/approve`       | insurer | Bulk approve multiple claims        |
| GET    | `/api/v1/claims`                    | Any     | List claims (filtered by role)      |
| GET    | `/api/v1/claims/:id`               | Any     | Get claim details                   |
| GET    | `/api/v1/claims/stats`             | Any     | Claim count statistics              |

---

## 7. Data Models

### Insurer Entity

```
id                   -- UUID primary key
userId               -- FK to User (1:1)
companyName          -- Company name
licenseNumber        -- Unique license identifier (immutable)
address, city, province -- Location
maxCoverageLimit     -- Maximum coverage amount (Decimal)
networkHospitalCount -- Number of partner hospitals
corporateClientCount -- Number of corporate clients
status               -- ACTIVE | PENDING | SUSPENDED | INACTIVE
operatingSince       -- Date company started operations
isActive             -- Boolean
createdAt, updatedAt -- Timestamps
```

**Relations:** plans[], labs[], corporates[], claims[]

### Plan Entity

```
id                   -- UUID primary key
insurerId            -- FK to Insurer
planName             -- Display name
planCode             -- Unique code (immutable)
sumInsured           -- Coverage per person (Decimal)
coveredServices      -- JSON: { "OPD": true, "IPD": true, ... }
serviceLimits        -- JSON: { "OPD": 50000, "IPD": 200000, ... }
isActive             -- Boolean
```

### Lab Entity

```
id                   -- UUID primary key
insurerId            -- FK to Insurer
labName              -- Display name
city, address        -- Location
licenseNumber        -- Unique (immutable)
contactPhone, contactEmail -- Contact info
testCategories       -- JSON: { "Blood Tests": true, "X-Ray": true, ... }
isActive             -- Boolean
```

---

## 8. Claims Processing Workflow

### Status Flow

```
Pending  --approve-->  Approved  --mark paid-->  Paid
   |                      |
   +---reject--->  Rejected
   |
   +---on-hold-->  OnHold  --approve-->  Approved
                      |
                      +---reject--->  Rejected
```

### Approve Claim

```
POST /api/v1/claims/:id/approve
Body: { approvedAmount: number, eventNote?: string }
```
- Updates status to "Approved"
- Records approved amount
- Creates ClaimEvent audit record
- Triggers notification to hospital and corporate

### Reject Claim

```
POST /api/v1/claims/:id/reject
Body: { eventNote: string }  // rejection reason required
```
- Updates status to "Rejected"
- Stores rejection reason in claim events
- Triggers notification to hospital and patient

### Place On Hold

```
POST /api/v1/claims/:id/on-hold
Body: { reason?: string, eventNote?: string }
```
- Updates status to "OnHold"
- Used when additional documentation or information is needed

### Mark as Paid

```
POST /api/v1/claims/:id/paid
Body: { paymentReference?: string, paidAmount?: number, paymentMethod?: string, notes?: string }
```
- Updates status to "Paid"
- Records payment details (reference number, method, amount)
- Final state in the claim lifecycle

### Bulk Approve

```
POST /api/v1/claims/bulk/approve
Body: { claimIds: string[], approvedAmount?: number, eventNote?: string }
```
- Approves multiple claims in a single operation
- If `approvedAmount` provided, applies to all claims

---

## 9. Authentication & Authorization

- **Role:** `insurer`
- **Guards:** `@Auth()` + `@Roles('insurer')` on write endpoints
- **Scope:** Insurers can only manage their own data (filtered by `insurerId` from JWT)
- **Uniqueness enforced:** License number (insurer), plan code (plans), lab license number (labs)
- **Audit:** `@Auditable()` decorator logs all insurer actions

---

## 10. Messaging & Notifications

**Claims Messaging:**
- `ClaimsMessagingContext` provides real-time messaging on claims
- `MessageButton` component in claims table rows
- Insurers can message hospitals and corporates about specific claims
- Socket.io rooms per claim for live chat

**Notification types:**
- New claim submitted (from hospital or patient)
- Claim requires review
- Message received on a claim

**Hook:** `useNotifications()` provides real-time notification listening

---

## 11. File Map

### Frontend Pages

| File                                                   | Purpose                       |
| ------------------------------------------------------ | ----------------------------- |
| `client/src/app/insurer/dashboard/page.tsx`            | Dashboard + KPIs               |
| `client/src/app/insurer/claims/page.tsx`               | Claims processing              |
| `client/src/app/insurer/plans/page.tsx`                | Plan CRUD                      |
| `client/src/app/insurer/hospitals/page.tsx`            | Network hospitals              |
| `client/src/app/insurer/corporates/page.tsx`           | Corporate clients              |
| `client/src/app/insurer/labs/page.tsx`                 | Lab CRUD                       |
| `client/src/app/insurer/document-extract/page.tsx`     | Document extraction            |
| `client/src/app/insurer/profile/page.tsx`              | Profile management             |
| `client/src/app/onboard-insurer/page.tsx`              | Onboarding registration        |

### Frontend Components

| File                                                             | Purpose                      |
| ---------------------------------------------------------------- | ---------------------------- |
| `client/src/components/insurer/DocumentExtractor.tsx`            | PDF extraction component      |
| `client/src/components/insurer/CorporateEmployeesModal.tsx`      | View corporate employees      |

### Frontend API Clients

| File                                       | Purpose                          |
| ------------------------------------------ | -------------------------------- |
| `client/src/lib/api/insurers.ts`           | Insurer + plan + lab CRUD         |
| `client/src/lib/api/claims.ts`             | Claims processing operations      |
| `client/src/lib/api/corporates.ts`         | Corporate client access            |
| `client/src/lib/api/hospitals.ts`          | Hospital network access            |
| `client/src/lib/api/employees.ts`          | Employee information               |
| `client/src/lib/api/dependents.ts`         | Dependent information              |

### Backend

| File                                                          | Purpose                          |
| ------------------------------------------------------------- | -------------------------------- |
| `server/src/modules/insurers/insurers.controller.ts`          | Insurer API endpoints             |
| `server/src/modules/insurers/insurers.service.ts`             | Insurer business logic            |
| `server/src/modules/insurers/repositories/insurers.repository.ts` | Insurer database queries     |
| `server/src/modules/claims/claims.controller.ts`              | Claims API (approve/reject/etc.)  |
| `server/src/modules/claims/claims.service.ts`                 | Claims processing logic           |
