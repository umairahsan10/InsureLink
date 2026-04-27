# Corporate Portal - Complete Module Documentation

> **InsureLink** - Health Insurance Claims Management System
>
> This document covers every feature, page, API endpoint, and workflow in the Corporate module. A new team member should be able to read this file and fully understand what the corporate portal does, how it works, and where the code lives.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Navigation & Sidebar](#3-navigation--sidebar)
4. [Pages & Features](#4-pages--features)
   - [Dashboard](#41-dashboard)
   - [Employees](#42-employees)
   - [Claims Overview](#43-claims-overview)
   - [Plans](#44-plans)
   - [Profile](#45-profile)
5. [Corporate Onboarding](#5-corporate-onboarding)
6. [Backend API Endpoints](#6-backend-api-endpoints)
7. [Data Models](#7-data-models)
8. [Key Workflows](#8-key-workflows)
9. [Bulk Employee Upload](#9-bulk-employee-upload)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [Notifications](#11-notifications)
12. [File Map](#12-file-map)

---

## 1. Overview

The **Corporate Portal** is used by company HR administrators to manage their employee health insurance program. Corporates are the bridge between employees (patients) and the insurer. They can:

- Onboard employees individually or via bulk CSV/Excel upload
- Assign insurance plans to employees with coverage dates
- Review and approve/reject dependent registration requests
- Monitor claims filed by employees and their dependents
- View insurance plans provided by their insurer
- Manage company profile and contract details

Corporates do **not** approve or reject claims -- that is the insurer's responsibility. Corporates manage the people and monitor the outcomes.

---

## 2. Tech Stack

| Layer     | Technology                                      |
| --------- | ----------------------------------------------- |
| Frontend  | Next.js 16 (App Router), React 19, TypeScript   |
| Styling   | Tailwind CSS 4                                  |
| State     | React Context (`AuthContext`)                   |
| File parse| XLSX library (Excel/CSV parsing for bulk upload) |
| Backend   | NestJS 11, Prisma 7 ORM, PostgreSQL             |

---

## 3. Navigation & Sidebar

The corporate sidebar uses a **purple** color scheme (accent: `#9333ea`). Menu items:

| #  | Label           | Route                    |
| -- | --------------- | ------------------------ |
| 1  | Dashboard       | `/corporate/dashboard`   |
| 2  | Employees       | `/corporate/employees`   |
| 3  | Claims Overview | `/corporate/claims`      |
| 4  | Plans           | `/corporate/plans`       |
| 5  | Profile         | `/corporate/profile`     |

---

## 4. Pages & Features

### 4.1 Dashboard

**Route:** `/corporate/dashboard`
**Files:** `client/src/app/corporate/dashboard/page.tsx`, `client/src/components/corporate/CorporateDashboard.tsx`

The landing page showing a high-level overview of the corporate's insurance program.

**Key Metrics (4 cards via `KeyMetrics.tsx`):**

| Metric              | Description                                    |
| ------------------- | ---------------------------------------------- |
| Total Employees     | Count of all registered employees               |
| Active Claims       | Claims currently in progress                    |
| Total Claims Cost   | Sum of all claimed amounts (PKR)                |
| Coverage Utilization | Percentage of total coverage pool used          |

**Coverage Overview (`CoverageOverview.tsx`):**
- Total coverage pool (sum of all employee coverages)
- Used coverage amount
- Available coverage remaining
- Visual progress bar (width = utilization %)

**Employee Coverage Status (`EmployeeCoverageStatus.tsx`):**
- Table of top 5 employees by coverage usage
- Columns: Employee Name, CNIC, Department, Coverage Used %, Total Coverage
- Progress bar per employee
- "View All" button links to full employees page

**Recent Claims:**
- 5 latest claims across all employees
- Shows claim ID, employee, amount, status, date

**Data sources:** `corporatesApi`, `claimsApi`, `employeesApi`

---

### 4.2 Employees

**Route:** `/corporate/employees`
**File:** `client/src/app/corporate/employees/page.tsx`

The most feature-rich page in the corporate portal. Has **three tabs**:

#### Tab 1: Employees

A paginated, searchable list of all employees.

**Statistics Cards:**
- Total Employees count
- Active Policies count
- Pending Dependent Requests count (also shown as badge on tab)

**Filters:**
- Search by name, email, employee number
- Department filter dropdown (R&D, Product, Finance, People, IT, Engineering, Sales, Logistics, Production, Design, Customer)
- Pagination (10 per page)

**Table Columns:** Employee Name, Employee Number, Email, Department, Designation, Plan, Status, Actions

**Actions per employee:**
- View dependents badge (shows count, opens `EmployeeDependentsModal`)
- Remove employee (enters remove mode with confirmation dialog)

**Top Action Buttons:**
- **+ Add Employee** -- opens `AddEmployeeModal`
- **Bulk Upload** -- opens `BulkUploadModal`
- **- Remove Employee** -- toggles remove mode

#### Tab 2: Dependent Requests

Shows pending dependent approval requests from employees.

**Uses:** `DependentRequestsTable.tsx` component

**Table Columns:** Dependent Name, Employee (parent), Relationship, Date of Birth, Status, Approval Date

**Review Action:** Click a row to open `DependentReviewModal` with:
- Full dependent info: Name, relationship, age, DOB, gender
- Contact info: CNIC, phone number
- Coverage info: requested start date
- **Approve** button (green) -- marks dependent as approved
- **Reject** button (red) -- requires rejection reason text

#### Tab 3: Invalid Employees

Shows failed records from bulk uploads that need correction.

**Uses:** `InvalidEmployeesTable.tsx` component

**Features:**
- List of employees with validation errors
- Expandable error details per record
- Inline edit mode to fix data and resubmit
- Plan dropdown with coverage date validation
- Duplicate detection (shows existing employee details if duplicate found)
- Delete single record or delete all invalid records
- Auto-revalidation after edits

---

### 4.3 Claims Overview

**Route:** `/corporate/claims`
**File:** `client/src/app/corporate/claims/page.tsx`

Read-only view of all claims filed by employees and their dependents.

**Statistics Cards:** Total Claims, Pending, Approved, Total Amount

**Filters:**
- Search by employee name or claim ID
- Status filter: Pending, Approved, OnHold, Paid, Rejected

**Table shows:** Claim Number, Employee Name, Date, Amount Claimed, Status Badge

**Important:** Corporates can only **view** claims. They cannot approve, reject, or modify claims.

---

### 4.4 Plans

**Route:** `/corporate/plans`
**File:** `client/src/app/corporate/plans/page.tsx`

Read-only view of insurance plans available to employees.

**Statistics Cards:** Active Plans, Covered Employees, Average Coverage

**Each plan card shows:**
- Plan name and plan code
- Active/Inactive status badge
- Coverage per person (sum insured in PKR)
- Number of enrolled employees
- Number of covered services
- "Managed By Insurer" button (disabled -- plans are read-only for corporates)

**Data flow:** Corporate profile -> get `insurerId` -> fetch plans from insurer API

---

### 4.5 Profile

**Route:** `/corporate/profile`
**File:** `client/src/app/corporate/profile/page.tsx`

Corporate profile management with multiple sections.

**Company Information (editable):**
- Company Name
- City
- Province
- Address
- Employee Count

**Primary Contact (editable):**
- Contact Name
- Contact Email
- Contact Phone

**Contract Window (editable with validation):**
- Contract Start Date
- Contract End Date
- Validation: end date must be after start date
- Warning: changes may invalidate employee coverage windows

**Account Status Panel (read-only):**
- Corporate ID
- Status badge (Active/Inactive/Suspended)
- Total Amount Used (PKR)

**Quick Stats Panel (read-only):**
- Active Employees count
- Active Dependents count
- Used Coverage amount

---

## 5. Corporate Onboarding

**Route:** `/onboard-corporate`
**File:** `client/src/app/onboard-corporate/page.tsx`

Registration form for new corporate accounts. Accessed after user registration with `corporate` role.

**Form Fields:**
- Company Name, Address, City, Province
- Contact Name, Contact Email, Contact Phone
- Contract Start Date, Contract End Date
- Insurer selection (dropdown of available insurers)

**Flow:** Fill form -> Submit -> Corporate profile created -> Redirected to `/corporate/dashboard`

---

## 6. Backend API Endpoints

### Corporate Controller (`server/src/modules/corporates/corporates.controller.ts`)

| Method | Endpoint                       | Auth   | Roles              | Description                     |
| ------ | ------------------------------ | ------ | ------------------- | ------------------------------- |
| POST   | `/api/corporates`              | Yes    | admin               | Create new corporate account     |
| GET    | `/api/corporates/:id`          | Yes    | Any                 | Get corporate by ID              |
| GET    | `/api/corporates/:id/stats`    | Yes    | Any                 | Get corporate statistics         |
| PATCH  | `/api/corporates/:id`          | Yes    | Any                 | Update corporate profile         |
| PATCH  | `/api/corporates/:id/status`   | Yes    | admin               | Update status (Active/etc.)      |
| GET    | `/api/corporates`              | Yes    | admin, insurer      | List all corporates              |

### Employee Controller (`server/src/modules/employees/employees.controller.ts`)

| Method | Endpoint                                    | Auth | Roles               | Description                    |
| ------ | ------------------------------------------- | ---- | -------------------- | ------------------------------ |
| POST   | `/api/employees`                            | Yes  | corporate, admin     | Create single employee          |
| GET    | `/api/employees`                            | Yes  | corporate, admin, insurer | List employees (paginated) |
| GET    | `/api/employees/find-by-number`             | Yes  | corporate, admin     | Find employee by number         |
| GET    | `/api/employees/:id`                        | Yes  | Any                  | Get employee by ID              |
| GET    | `/api/employees/:id/coverage`               | Yes  | Any                  | Get employee coverage           |
| PATCH  | `/api/employees/:id`                        | Yes  | corporate, admin     | Update employee                 |
| DELETE | `/api/employees/:id`                        | Yes  | corporate, admin     | Delete employee                 |
| POST   | `/api/employees/bulk-import/upload-csv`     | Yes  | corporate, admin     | Upload CSV/Excel (max 5 MB)     |
| POST   | `/api/employees/bulk-import/validate`       | Yes  | corporate, admin     | Validate imported rows          |
| POST   | `/api/employees/bulk-import/commit`         | Yes  | corporate, admin     | Commit valid rows               |
| GET    | `/api/employees/bulk-import/invalid`        | Yes  | corporate, admin     | Get invalid records             |
| POST   | `/api/employees/bulk-import/update-invalid` | Yes  | corporate, admin     | Fix invalid record              |
| POST   | `/api/employees/bulk-import/resubmit-invalid` | Yes | corporate, admin   | Resubmit fixed record           |
| DELETE | `/api/employees/bulk-import/delete-invalid` | Yes  | corporate, admin     | Delete one invalid record       |
| DELETE | `/api/employees/bulk-import/delete-all-invalid` | Yes | corporate, admin | Delete all invalid records      |

### Dependent Controller (`server/src/modules/dependents/dependents.controller.ts`)

| Method | Endpoint                                        | Auth   | Roles               | Description                     |
| ------ | ----------------------------------------------- | ------ | -------------------- | ------------------------------- |
| POST   | `/api/v1/dependents`                            | Yes    | patient, corporate, admin | Create dependent          |
| GET    | `/api/v1/dependents`                            | Yes    | Any                  | List dependents                  |
| GET    | `/api/v1/dependents/:id`                        | Yes    | Any                  | Get dependent by ID              |
| GET    | `/api/v1/dependents/by-employee/:employeeNumber` | Public | -                   | Get dependents by employee #     |
| GET    | `/api/v1/dependents/check-cnic/:cnic`           | Public | -                    | Check CNIC availability          |
| PATCH  | `/api/v1/dependents/:id`                        | Yes    | Any                  | Update dependent                 |
| PATCH  | `/api/v1/dependents/:id/approve`                | Yes    | corporate, admin     | Approve dependent                |
| PATCH  | `/api/v1/dependents/:id/reject`                 | Yes    | corporate, admin     | Reject dependent (reason req.)   |
| PATCH  | `/api/v1/dependents/:id/status`                 | Yes    | corporate, admin     | Update dependent status          |

---

## 7. Data Models

### Corporate

```
id                -- UUID primary key
userId            -- FK to User (1:1)
name              -- Company name (255 chars)
address           -- Company address (500 chars)
city, province    -- Location
employeeCount     -- Total employees (integer)
dependentCount    -- Total dependents (integer, default 0)
insurerId         -- FK to Insurer
contactName       -- Primary contact person (100 chars)
contactEmail      -- Contact email (255 chars)
contactPhone      -- Contact phone (20 chars)
contractStartDate -- Insurance contract start
contractEndDate   -- Insurance contract end
totalAmountUsed   -- Decimal (12,2) -- total coverage consumed
status            -- Active | Inactive | Suspended
createdAt, updatedAt
```

**Relations:** User, Insurer, Employees[], EmployeeUploads[], InvalidEmployeeUploads[], Claims[]

### Employee

```
id                -- UUID primary key
userId            -- FK to User (1:1)
corporateId       -- FK to Corporate
employeeNumber    -- Unique identifier (50 chars)
planId            -- FK to Plan (assigned insurance plan)
designation       -- Job title (100 chars)
department        -- Department (100 chars)
coverageStartDate -- When coverage begins
coverageEndDate   -- When coverage expires
coverageAmount    -- Decimal (12,2) -- from plan's sumInsured
usedAmount        -- Decimal (12,2, default 0) -- amount claimed so far
status            -- Active | Inactive | Suspended | Terminated
```

**Relations:** User, Corporate, Plan, Dependents[], HospitalVisits[]

### Dependent

```
id                -- UUID primary key
employeeId        -- FK to Employee
firstName, lastName -- Name
relationship      -- Spouse | Son | Daughter | Father | Mother
dateOfBirth       -- Date
gender            -- Male | Female | Other
cnic              -- National ID (15 chars, optional)
phoneNumber       -- Phone (20 chars, optional)
status            -- Pending | Approved | Rejected
requestDate       -- When dependent was requested
reviewedDate      -- When corporate reviewed
rejectionReason   -- Why rejected (500 chars, optional)
```

### Employee Upload (Bulk Import Tracking)

```
EmployeeUpload:
  id, corporateId, uploadedByUserId, filePath, originalFileName
  uploadedAt, status (pending | completed | failed)

InvalidEmployeeUpload:
  id, employeeUploadId, corporateId
  errorMessages[]
  All employee fields captured for correction
```

---

## 8. Key Workflows

### Workflow 1: Add Single Employee

```
1.  Corporate clicks "+ Add Employee" on Employees page
2.  AddEmployeeModal opens with EmployeeForm
3.  Fill in:
    - Personal: Name, Employee Number, Email, Mobile
    - Job: Designation, Department
    - Insurance: Plan (dropdown), Coverage Start Date, Coverage End Date
4.  Validations:
    - Email format check
    - Pakistan mobile: 03XXXXXXXXX (11 digits, starts with 03)
    - Coverage end > start
    - Coverage dates within corporate contract window
    - Coverage dates within plan validity period (if plan has validFrom/validUntil)
5.  Submit creates:
    - User account (with temporary password: {employeeNumber}@Temp123)
    - Employee record (status: Active)
6.  Employee can now log in as a patient
```

### Workflow 2: Bulk Employee Upload

```
1.  Corporate clicks "Bulk Upload" on Employees page
2.  BulkUploadModal opens
3.  (Optional) Download CSV or Excel template
4.  Upload file (CSV/XLSX/XLS, max 5 MB)
5.  Backend validates each row:
    - Email format, mobile format
    - Duplicate employee numbers within upload
    - Duplicate CNICs within upload
    - Employee number not already in database
    - Email not already in database
    - Coverage dates within corporate contract window
    - Plan validity dates
6.  Result displayed: X valid, Y invalid
7.  Valid employees are imported automatically
8.  Invalid employees appear in "Invalid Employees" tab
9.  Corporate can:
    - View error details per record
    - Edit inline to fix issues
    - Resubmit corrected records (auto-validates again)
    - Delete individual invalid records
    - Delete all invalid records at once
```

### Workflow 3: Review Dependent Requests

```
1.  Employee (patient) adds a dependent from their profile
2.  Dependent is created with status "Pending"
3.  Corporate sees pending count badge on "Dependent Requests" tab
4.  Corporate clicks to review
5.  DependentReviewModal shows:
    - Full dependent details (name, relationship, age, DOB, gender)
    - Contact info (CNIC, phone)
    - Requested coverage start date
6.  Corporate can:
    - Approve: dependent becomes Active, can submit claims under parent's coverage
    - Reject: must provide rejection reason, dependent cannot claim
```

### Workflow 4: Monitor Claims

```
1.  Navigate to /corporate/claims
2.  View all claims filed by employees and dependents
3.  Search by employee name or claim ID
4.  Filter by status
5.  See claim amounts and statuses
6.  NOTE: Corporate cannot approve/reject claims -- only the insurer can
```

---

## 9. Bulk Employee Upload

This is a major feature with its own dedicated workflow. Here's the detailed technical flow:

### Template Format

The CSV/Excel template includes these columns:
- firstName, lastName, email, phone, password, dob, gender, cnic
- employeeNumber, designation, department
- planId (or planCode), coverageStartDate, coverageEndDate

### Upload Pipeline

```
Client: File selected
  -> BulkUploadModal sends file via employeesApi.uploadCsv(corporateId, file)
  -> POST /api/employees/bulk-import/upload-csv (multipart, max 5 MB)
  -> Server parses CSV/Excel
  -> Validates each row
  -> Valid rows: committed as new employees
  -> Invalid rows: stored in InvalidEmployeeUpload table
  -> Response: { validCount, invalidCount }
```

### Invalid Record Correction

```
1. GET /api/employees/bulk-import/invalid -> returns all invalid records
2. Frontend displays in InvalidEmployeesTable with error messages
3. User clicks "Edit" on a record
4. Inline form appears with pre-filled data
5. User corrects the errors
6. POST /api/employees/bulk-import/update-invalid -> saves corrections
7. POST /api/employees/bulk-import/resubmit-invalid -> re-validates
8. If valid: employee is created
9. If still invalid: updated error messages shown
```

---

## 10. Authentication & Authorization

- **Role:** `corporate`
- **Route protection:** Next.js middleware checks `auth_token` cookie, redirects to `/login` if missing
- **Backend guards:** `@Auth()` + `@Roles('corporate')` on write endpoints
- **Scope:** Corporate endpoints verify user's `corporateId` matches the resource
- **Cross-corporate access prevented:** A corporate user cannot see another corporate's employees

**Current user context (from JWT):**
- id, email, firstName, lastName, userRole, corporateId

---

## 11. Notifications

Corporate users receive notifications for:
- New dependent approval requests from employees
- Claim status changes (for monitoring)

Notifications managed by `useNotifications()` hook. Displayed in top-right notification panel. Can be dismissed or clicked to navigate to the relevant page.

---

## 12. File Map

### Frontend Pages

| File                                                  | Purpose                       |
| ----------------------------------------------------- | ----------------------------- |
| `client/src/app/corporate/layout.tsx`                 | Layout wrapper + notifications |
| `client/src/app/corporate/dashboard/page.tsx`         | Dashboard page                 |
| `client/src/app/corporate/employees/page.tsx`         | Employee management (3 tabs)   |
| `client/src/app/corporate/claims/page.tsx`            | Claims overview (read-only)    |
| `client/src/app/corporate/plans/page.tsx`             | Plan viewer (read-only)        |
| `client/src/app/corporate/profile/page.tsx`           | Profile management             |
| `client/src/app/onboard-corporate/page.tsx`           | Onboarding registration        |

### Frontend Components

| File                                                                  | Purpose                            |
| --------------------------------------------------------------------- | ---------------------------------- |
| `client/src/components/corporate/CorporateDashboard.tsx`              | Dashboard rendering                 |
| `client/src/components/corporate/KeyMetrics.tsx`                      | 4-card metric display               |
| `client/src/components/corporate/CoverageOverview.tsx`                | Coverage pool breakdown              |
| `client/src/components/corporate/EmployeeCoverageStatus.tsx`          | Top 5 employees by usage             |
| `client/src/components/corporate/AddEmployeeModal.tsx`                | Single employee add modal            |
| `client/src/components/corporate/BulkUploadModal.tsx`                 | CSV/Excel upload modal               |
| `client/src/components/corporate/DependentReviewModal.tsx`            | Approve/reject dependent modal       |
| `client/src/components/corporate/EmployeeDependentsModal.tsx`         | View employee's dependents           |
| `client/src/components/corporate/InvalidEmployeesTable.tsx`           | Failed upload correction table       |
| `client/src/components/corporate/DependentRequestsTable.tsx`          | Pending dependent requests table     |
| `client/src/components/forms/EmployeeForm.tsx`                        | Reusable employee form               |

### Frontend API Clients

| File                                       | Purpose                          |
| ------------------------------------------ | -------------------------------- |
| `client/src/lib/api/corporates.ts`         | Corporate CRUD + stats            |
| `client/src/lib/api/employees.ts`          | Employee CRUD + bulk import        |
| `client/src/lib/api/dependents.ts`         | Dependent CRUD + approve/reject    |
| `client/src/lib/api/claims.ts`             | Claims listing + filters           |
| `client/src/lib/api/insurers.ts`           | Fetch plans from insurer           |

### Frontend Utilities

| File                                        | Purpose                          |
| ------------------------------------------- | -------------------------------- |
| `client/src/utils/employeeValidator.ts`     | Mobile, email, date validation    |
| `client/src/utils/dependentHelpers.ts`      | Age calculation, status helpers   |
| `client/src/lib/format.ts`                  | `formatPKR()`, `formatPKRShort()` |

### Backend

| File                                                              | Purpose                          |
| ----------------------------------------------------------------- | -------------------------------- |
| `server/src/modules/corporates/corporates.controller.ts`          | Corporate API endpoints           |
| `server/src/modules/corporates/corporates.service.ts`             | Corporate business logic          |
| `server/src/modules/employees/employees.controller.ts`            | Employee API + bulk import        |
| `server/src/modules/employees/employees.service.ts`               | Employee business logic           |
| `server/src/modules/dependents/dependents.controller.ts`          | Dependent API endpoints           |
| `server/src/modules/dependents/dependents.service.ts`             | Dependent business logic          |
