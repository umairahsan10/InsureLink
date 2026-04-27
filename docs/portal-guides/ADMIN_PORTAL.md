# Admin (Superadmin) Portal - Complete Module Documentation

> **InsureLink** - Health Insurance Claims Management System
>
> This document covers every feature, page, API endpoint, and workflow in the Admin module. A new team member should be able to read this file and fully understand what the admin portal does, how it works, and where the code lives.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Navigation & Sidebar](#3-navigation--sidebar)
4. [Pages & Features](#4-pages--features)
   - [Dashboard](#41-dashboard)
   - [User Management](#42-user-management)
   - [User Detail](#43-user-detail)
   - [Create User](#44-create-user)
   - [Claims Oversight](#45-claims-oversight)
   - [Corporates](#46-corporates)
   - [Hospitals](#47-hospitals)
   - [Insurers](#48-insurers)
   - [Fraud Monitor](#49-fraud-monitor)
   - [System Settings](#410-system-settings)
   - [Audit Logs](#411-audit-logs)
5. [Backend API Endpoints](#5-backend-api-endpoints)
6. [Data Models](#6-data-models)
7. [Key Workflows](#7-key-workflows)
8. [Authentication & Security](#8-authentication--security)
9. [File Map](#9-file-map)

---

## 1. Overview

The **Admin Portal** is the superadmin control center for the entire InsureLink system. Admins have a bird's-eye view across all portals and can:

- View system-wide KPIs (claims, coverage, users, approval rates)
- Create, edit, deactivate, delete, and reset passwords for any user
- Manage organizations (corporates, hospitals, insurers) and their statuses
- View and filter ALL claims across all insurers, corporates, and hospitals
- Monitor fraud patterns (duplicate amounts, high-frequency claimers, high-value claims)
- Broadcast system-wide notifications to all users or specific roles
- View and export full audit trails of every action in the system
- Perform bulk operations (deactivate/delete multiple users at once)

The admin is the **only role** that can create users with profiles, toggle user active status, reset passwords, broadcast notifications, and access fraud detection.

---

## 2. Tech Stack

| Layer     | Technology                                      |
| --------- | ----------------------------------------------- |
| Frontend  | Next.js 16 (App Router), React 19, TypeScript   |
| Styling   | Tailwind CSS 4                                  |
| State     | React Context (`AuthContext`)                   |
| Backend   | NestJS 11, Prisma 7 ORM, PostgreSQL             |
| Auth      | JWT with `isActive` check on every request       |
| Theme     | Indigo color scheme                              |

---

## 3. Navigation & Sidebar

The admin sidebar uses an **indigo** color scheme (accent: `#4f46e5`). Menu items:

| #  | Label          | Route                  | Icon         |
| -- | -------------- | ---------------------- | ------------ |
| 1  | Dashboard      | `/admin/dashboard`     | Dashboard    |
| 2  | Users          | `/admin/users`         | Employees    |
| 3  | Claims         | `/admin/claims`        | Claims       |
| 4  | Corporates     | `/admin/corporates`    | Corporates   |
| 5  | Hospitals      | `/admin/hospitals`     | Hospital     |
| 6  | Insurers       | `/admin/insurers`      | Plans        |
| 7  | Fraud Monitor  | `/admin/fraud`         | Shield       |
| 8  | Settings       | `/admin/settings`      | Document     |
| 9  | Audit Logs     | `/admin/audit-logs`    | Audit        |
| 10 | Create User    | `/admin/create-user`   | UserPlus     |

The layout wrapper is at `client/src/app/admin/layout.tsx`. It uses the shared `DashboardLayout` component with `userRole="admin"`, displays the admin's name in the header, and renders a notification panel.

---

## 4. Pages & Features

### 4.1 Dashboard

**Route:** `/admin/dashboard`
**File:** `client/src/app/admin/dashboard/page.tsx`

The system command center. Aggregates data from 4 parallel API calls on load.

**KPI Cards (Row 1 -- Claims):**

| Card           | Value                         | Color  |
| -------------- | ----------------------------- | ------ |
| Total Claims   | Count + total claimed amount  | Indigo |
| Pending        | Count awaiting review         | Amber  |
| Approved       | Count + approved amount       | Green  |
| Rejected       | Count + rejection rate %      | Red    |

**KPI Cards (Row 2 -- Coverage & Users):**

| Card              | Value                            | Color  |
| ----------------- | -------------------------------- | ------ |
| Total Users       | Count across all roles           | Purple |
| Active Employees  | Active / total employees         | Blue   |
| Coverage Pool     | Total pool + used amount         | Teal   |
| Utilization       | Coverage consumed percentage     | Orange |

**Claims Trend (Last 6 Months):**
- Bar chart visualization (no external library -- pure CSS bars)
- Shows monthly claim count and total value
- Aggregated totals below the chart

**Processing Stats Panel:**
- Average processing time (hours from submission to decision)
- Approval rate percentage

**Top Hospitals by Claims:**
- Ranked list (top 5) with hospital name and total claim amount

**Coverage by Plan:**
- Each plan shown with employee count and progress bar showing pool share

**Claims by Corporate:**
- Corporate name, claim count, and total value

**Recent Activity Feed:**
- Last 8 audit log entries with action badges (Created/Updated/Deleted)
- User name, entity type, and relative timestamp ("2h ago")
- "View All" link to full audit logs page

**Data sources (loaded in parallel):**
```
GET /api/v1/analytics/dashboard    -- claims KPIs, trends, top hospitals
GET /api/v1/analytics/coverage     -- coverage pool, utilization, plan distribution
GET /api/admin/users?limit=1       -- total user count (from `total` field)
GET /api/v1/audit/logs?limit=8     -- recent activity
```

---

### 4.2 User Management

**Route:** `/admin/users`
**File:** `client/src/app/admin/users/page.tsx`

Paginated, searchable, filterable list of all users in the system.

**Filters:**
- Search by name or email (debounced 300ms)
- Role filter dropdown (Admin, Hospital, Insurer, Corporate, Patient)
- Status filter dropdown (Active, Inactive)
- Page size selector (10, 20, 50)

**Table Columns:**

| Column     | Description                                     |
| ---------- | ----------------------------------------------- |
| Checkbox   | For bulk selection                               |
| Name       | First + last name                                |
| Email      | User email                                       |
| Role       | Color-coded role badge                           |
| Status     | Green dot "Active" or red dot "Inactive"         |
| Created    | Registration date                                |
| Last Login | Last login date or "Never"                       |

**Clickable rows:** Click any user to navigate to `/admin/users/[id]` detail page.

**Bulk Actions Bar (appears when checkboxes selected):**
- Shows count of selected users
- "Deactivate Selected" button (amber)
- "Delete Selected" button (red) with inline confirmation ("Are you sure?" + Confirm/Cancel)

**Pagination:** Previous/Next buttons with page count

---

### 4.3 User Detail

**Route:** `/admin/users/[id]`
**File:** `client/src/app/admin/users/[id]/page.tsx`

Full user profile with all management actions.

**Header Actions:**
- **Edit** button -- toggles inline edit mode (fields become inputs)
- **Deactivate/Activate** toggle button
- **Reset Password** button -- opens modal with password input
- **Delete** button -- opens confirmation modal

**User Profile Card:**
- Avatar with initials
- Name, role badge, active status badge
- Email
- Editable fields: First Name, Last Name, Phone, Gender, CNIC, Date of Birth, Address
- Read-only: Email, Created, Last Updated, Last Login, User ID

**Role-Specific Profile Section (shown based on user role):**

**Hospital Profile:** Hospital Name, License Number, City, Address, Emergency Phone, Type, Emergency Unit, Active status

**Insurer Profile:** Company Name, License Number, City, Province, Address, Max Coverage Limit, Network Hospitals, Corporate Clients, Status, Operating Since. Also shows list of plans with name, code, sum insured, and active status.

**Corporate Profile:** Company Name, City, Province, Address, Employee Count, Contact Name/Email/Phone, Status, Contract Start/End, linked Insurer name

**Employee Profile (patient):** Employee Number, Designation, Department, Status, Corporate name, Plan name

**Reset Password Modal:**
- Text input for new password
- Validation: min 8 chars, must contain uppercase, lowercase, number
- Confirm/Cancel buttons

**Delete Confirmation Modal:**
- Warning text with user name
- "This action cannot be undone"
- Confirm Delete / Cancel buttons
- On success, redirects to `/admin/users`

---

### 4.4 Create User

**Route:** `/admin/create-user`
**File:** `client/src/app/admin/create-user/page.tsx`

Multi-step wizard (3 steps) for creating users with role-specific profiles.

**Step 1 -- User Information:**
- First Name, Last Name, Email, Password, Confirm Password
- Phone, Date of Birth, Gender, CNIC, Address
- Password validation: min 8 chars, uppercase + lowercase + number

**Step 2 -- Role Selection:**
- 5 clickable cards: Admin, Patient, Hospital, Insurer, Corporate
- Each card shows role icon and description

**Step 3 -- Profile Details (dynamic based on role):**

| Role       | Fields                                                                    |
| ---------- | ------------------------------------------------------------------------- |
| Hospital   | Hospital Name, License #, Address, City, Emergency Phone, Type, Emergency Unit |
| Insurer    | Company Name, License #, Address, City, Province, Operating Since, Max Coverage, Hospital Count, Corporate Count |
| Corporate  | Company Name, Insurer (dropdown), Address, City, Province, Employee Count, Contact Name/Email/Phone, Contract Start/End |
| Admin      | No profile needed -- "Ready to Create" confirmation                       |
| Patient    | No profile needed -- "Ready to Create" confirmation                       |

**Submit creates User + Profile atomically in a database transaction.**

---

### 4.5 Claims Oversight

**Route:** `/admin/claims`
**File:** `client/src/app/admin/claims/page.tsx`

System-wide view of ALL claims across all insurers, corporates, and hospitals.

**Status Statistics (7 cards):**
Total, Pending, Approved, Rejected, On Hold, Paid, High Priority

**Filters:**
- Search by claim number
- Status filter (Pending, Approved, Rejected, OnHold, Paid)
- Priority filter (Low, Normal, High)
- Date range (From / To date pickers)
- "Clear Filters" button

**Table Columns:** Claim #, Patient, Hospital, Corporate, Amount (PKR), Priority, Status, Date

**Claim Detail Drawer (click any row):**
- Claim number with status and priority badges
- Amount cards: Claimed vs. Approved
- Patient section: Name, Employee #, CNIC
- Dependent section (if applicable): Name, Relationship
- Hospital & Visit: Hospital name, city, visit date, discharge date
- Corporate & Insurance: Corporate name, insurer, plan name/code
- Notes
- Timestamps: Submitted, Last Updated

---

### 4.6 Corporates

**Route:** `/admin/corporates`
**File:** `client/src/app/admin/corporates/page.tsx`

List and manage all corporate clients.

**Filters:** Search by company name, status filter (Active/Inactive/Suspended)

**Table Columns:** Company, City, Employees, Contact, Contract dates, Status

**Detail Drawer (click any row):**
- Company info: name, city, province, contact details, dates, amount used
- **Status Controls:** Three buttons (Active/Inactive/Suspended) to change corporate status directly
- Coverage & Claims stats loaded from `/api/corporates/:id/stats`:
  - Active Employees, Active Dependents
  - Total Coverage, Used Coverage, Remaining Coverage
  - Approved Claims, Pending Claims, Rejected Claims

---

### 4.7 Hospitals

**Route:** `/admin/hospitals`
**File:** `client/src/app/admin/hospitals/page.tsx`

List all hospitals in the network.

**Filters:** Search by name/city, city dropdown, status filter (Active/Inactive)

**Table Columns:** Hospital, City, License, Type (Reimbursable badge), Emergency Phone, Status

**Detail Drawer:** Type badges, license, emergency phone, address, coordinates, registration date

---

### 4.8 Insurers

**Route:** `/admin/insurers`
**File:** `client/src/app/admin/insurers/page.tsx`

List all insurance companies.

**Table Columns:** Company, City, License, Max Coverage, Hospital Count, Corporate Count, Status

**Detail Drawer:**
- Full profile info
- **Plans section:** Lists all insurance plans with name, code, sum insured, and active status

---

### 4.9 Fraud Monitor

**Route:** `/admin/fraud`
**File:** `client/src/app/admin/fraud/page.tsx`

Automated anomaly detection dashboard analyzing the last 30 days of claims.

**Summary Cards:**
- Claims Analyzed (total recent claims)
- Flagged Claims (unique flagged count -- green if 0, red if > 0)
- Duplicate Amounts (amber if > 0)
- High Frequency (amber if > 0)

**Three Tabbed Views:**

| Tab               | Detection Rule                                                         |
| ----------------- | ---------------------------------------------------------------------- |
| Duplicate Amounts | Same employee + same claim amount within 30 days                       |
| High Frequency    | Employee with > 3 claims in 30 days                                    |
| High Value        | Top 10 highest-value claims in 30 days (for manual review)             |

Each tab shows a table with: Claim #, Patient, Hospital, Corporate, Amount, Status, Date

**Detection Rules Info Panel:** Explains what each rule detects at the bottom of the page.

**Backend logic:** `GET /api/admin/fraud` runs the analysis in real-time against the database. No cached results -- always fresh data.

---

### 4.10 System Settings

**Route:** `/admin/settings`
**File:** `client/src/app/admin/settings/page.tsx`

System configuration and broadcast messaging.

**Broadcast Notification Form:**
- Title (text input)
- Message (textarea)
- Severity selector: Info (blue), Warning (amber), Critical (red)
- Target Roles: Toggle buttons for Patients, Corporates, Hospitals, Insurers, Admins (empty = all users)
- "Send Broadcast" button
- Shows success message with count of users notified

**System Information Panel:**
- Platform version, backend stack, frontend stack, real-time technology

---

### 4.11 Audit Logs

**Route:** `/admin/audit-logs`
**File:** `client/src/app/admin/audit-logs/page.tsx`

Full audit trail of every CREATE, UPDATE, and DELETE in the system.

**Filters:**
- Entity Type dropdown (Claim, Insurer, Hospital, Corporate, User, Plan)
- Action dropdown (Create, Update, Delete)
- Date range (From / To date pickers)
- "Clear" button to reset all filters

**Table Columns:** Expand arrow, Timestamp, User, Action (color badge), Entity, Entity ID, Summary

**Expandable Rows:** Click the arrow to expand a row and see the full JSON diff of changes in a formatted `<pre>` block.

**Export to CSV:** Button in the header downloads the current page of logs as a CSV file with all fields.

**Pagination:** Previous/Next with page count

---

## 5. Backend API Endpoints

### Admin Controller (`server/src/modules/admin/admin.controller.ts`)

All endpoints require `@UseGuards(JwtAuthGuard)` + `@Roles('admin')`.

**User Management:**

| Method   | Endpoint                           | Description                              |
| -------- | ---------------------------------- | ---------------------------------------- |
| `POST`   | `/api/admin/users`                 | Create user with role-specific profile    |
| `GET`    | `/api/admin/users`                 | List users (paginated, search, role/status filter) |
| `GET`    | `/api/admin/users/:id`             | Get user with full profile               |
| `PATCH`  | `/api/admin/users/:id`             | Update user + profile fields             |
| `PATCH`  | `/api/admin/users/:id/toggle-active` | Toggle user active/inactive            |
| `PATCH`  | `/api/admin/users/:id/reset-password` | Set new password                      |
| `DELETE` | `/api/admin/users/:id`             | Delete user (blocks self-delete)         |
| `PATCH`  | `/api/admin/users/bulk/deactivate` | Bulk deactivate users                    |
| `DELETE` | `/api/admin/users/bulk/delete`     | Bulk delete users                        |

**Other:**

| Method   | Endpoint                   | Description                              |
| -------- | -------------------------- | ---------------------------------------- |
| `GET`    | `/api/admin/insurers`      | Active insurers for dropdown             |
| `POST`   | `/api/admin/broadcast`     | Broadcast notification to users by role  |
| `GET`    | `/api/admin/fraud`         | Run fraud detection analysis             |

**Query params for `GET /api/admin/users`:**
- `page` (default 1), `limit` (default 20)
- `search` -- case-insensitive match on firstName, lastName, email
- `role` -- filter by userRole
- `status` -- "active" or "inactive" (filters by `isActive`)

**Body for `POST /api/admin/broadcast`:**
```json
{
  "title": "Scheduled Maintenance",
  "message": "System will be down tonight 10pm-2am",
  "severity": "warning",
  "targetRoles": ["hospital", "insurer"]
}
```
`targetRoles` is optional -- omit to send to all active users.

**Response from `GET /api/admin/fraud`:**
```json
{
  "summary": {
    "totalClaimsAnalyzed": 150,
    "flaggedCount": 12,
    "duplicateAmountCount": 8,
    "highFrequencyCount": 6,
    "periodDays": 30
  },
  "duplicateAmountClaims": [...],
  "highFrequencyClaims": [...],
  "highValueClaims": [...]
}
```

### Analytics Endpoints (used by dashboard)

| Method | Endpoint                      | Description                    |
| ------ | ----------------------------- | ------------------------------ |
| `GET`  | `/api/v1/analytics/dashboard` | Claims KPIs, trends, rankings  |
| `GET`  | `/api/v1/analytics/claims`    | Detailed claims analytics      |
| `GET`  | `/api/v1/analytics/coverage`  | Coverage utilization stats     |

### Other Endpoints Admin Uses

| Method | Endpoint                         | Source Module | Description                    |
| ------ | -------------------------------- | ------------- | ------------------------------ |
| `GET`  | `/api/v1/audit/logs`             | Audit         | Paginated audit logs           |
| `GET`  | `/api/v1/claims`                 | Claims        | List all claims with filters   |
| `GET`  | `/api/v1/claims/stats`           | Claims        | Claim counts by status         |
| `GET`  | `/api/v1/claims/:id`            | Claims        | Single claim detail            |
| `GET`  | `/api/corporates`               | Corporates    | List corporates                |
| `GET`  | `/api/corporates/:id`           | Corporates    | Corporate detail               |
| `GET`  | `/api/corporates/:id/stats`     | Corporates    | Corporate stats                |
| `PATCH`| `/api/corporates/:id`           | Corporates    | Update corporate (status)      |
| `GET`  | `/api/v1/hospitals`             | Hospitals     | List hospitals                 |
| `GET`  | `/api/v1/hospitals/:id`         | Hospitals     | Hospital detail                |
| `GET`  | `/api/v1/insurers`              | Insurers      | List insurers                  |
| `GET`  | `/api/v1/insurers/:id`          | Insurers      | Insurer detail                 |
| `GET`  | `/api/v1/insurers/:id/plans`    | Insurers      | Insurer's plans                |

---

## 6. Data Models

### User (with `isActive` field)

```
id               -- UUID primary key
email            -- Unique email
passwordHash     -- Bcrypt hashed password
firstName        -- First name
lastName         -- Last name (optional)
phone            -- Phone number
userRole         -- admin | patient | corporate | hospital | insurer
dob              -- Date of birth (optional)
gender           -- Male | Female | Other (optional)
cnic             -- National ID (optional, unique)
address          -- Address (optional)
isActive         -- Boolean (default true) -- controls login access
createdAt        -- Timestamp
updatedAt        -- Timestamp
lastLoginAt      -- Timestamp (optional)
```

**`isActive` enforcement:** The JWT strategy (`server/src/modules/auth/strategies/jwt.strategy.ts`) checks `isActive` on every authenticated request. Deactivated users receive `401 Unauthorized` and cannot access any API.

### DTOs

**UpdateUserDto:** firstName, lastName, phone, dob, gender, cnic, address + nested hospitalProfile, insurerProfile, corporateProfile (all optional fields)

**ResetPasswordDto:** newPassword (min 8 chars, uppercase + lowercase + number required)

**BulkActionDto:** userIds (array of UUIDs, min 1)

**BroadcastNotificationDto:** title (required), message (required), severity (info/warning/critical), targetRoles (optional array of role strings)

---

## 7. Key Workflows

### Workflow 1: Create a User with Profile

```
1. Admin navigates to /admin/create-user
2. Step 1: Fills in user info (name, email, password, phone, etc.)
3. Step 2: Selects role (admin, patient, hospital, insurer, corporate)
4. Step 3: Fills role-specific profile (hospital details, insurer details, etc.)
5. Submit -> Backend creates User + Profile in a single transaction
6. On success: redirect to dashboard with confirmation
```

### Workflow 2: Deactivate a User

```
1. Admin navigates to /admin/users
2. Clicks a user row to open detail page
3. Clicks "Deactivate" button
4. Backend sets isActive = false
5. User can no longer log in (JWT strategy blocks them)
6. User appears as "Inactive" in the users list
```

### Workflow 3: Bulk Deactivate Users

```
1. Admin navigates to /admin/users
2. Checks multiple user checkboxes
3. Bulk action bar appears: "N users selected"
4. Clicks "Deactivate Selected"
5. All selected users set to isActive = false in one DB call
6. List refreshes
```

### Workflow 4: Reset a User's Password

```
1. Admin opens user detail page
2. Clicks "Reset Password"
3. Modal opens with password input
4. Enters new temporary password (validated: 8+ chars, uppercase, lowercase, number)
5. Submit -> Backend hashes and updates password
6. User must use new password on next login
```

### Workflow 5: Broadcast a Notification

```
1. Admin navigates to /admin/settings
2. Fills in broadcast form: title, message, severity
3. (Optional) Selects target roles (e.g., only hospitals and insurers)
4. Clicks "Send Broadcast"
5. Backend finds all active users matching the role filter
6. Creates a notification record for each user
7. Users see the notification in their notification panel in real-time
8. Admin sees "Notification sent to N users" confirmation
```

### Workflow 6: Review Fraud Flags

```
1. Admin navigates to /admin/fraud
2. Dashboard loads with summary cards (flagged count, duplicates, high frequency)
3. Click "Duplicate Amounts" tab to see claims with same amount from same employee
4. Click "High Frequency" tab to see employees with >3 claims in 30 days
5. Click "High Value" tab to see top 10 highest claims for manual review
6. Admin investigates flagged claims and takes action via insurer portal or user management
```

### Workflow 7: Export Audit Logs

```
1. Admin navigates to /admin/audit-logs
2. Applies filters (entity type, action, date range)
3. Clicks "Export CSV"
4. Browser downloads a CSV file with all visible log entries
5. File includes: Timestamp, User, Action, Entity Type, Entity ID, Changes, IP Address
```

### Workflow 8: Change Corporate Status

```
1. Admin navigates to /admin/corporates
2. Clicks a corporate row to open detail drawer
3. Sees current status and coverage/claims stats
4. Clicks "Suspended" button to suspend the corporate
5. Status updates immediately
6. Table refreshes to show new status
```

---

## 8. Authentication & Security

- **Role:** `admin`
- **Route protection:** Next.js middleware redirects unauthenticated users to `/login`
- **Backend guards:** `@UseGuards(JwtAuthGuard)` + `@Roles('admin')` on all admin endpoints
- **`@Roles` decorator** automatically applies `RolesGuard` which checks the JWT payload role
- **`isActive` enforcement:** JWT strategy queries the database on every request to check `isActive`. Deactivated users get `401 Unauthorized`.
- **Self-delete protection:** `deleteUser()` compares the target ID with the requesting user's ID and throws `BadRequestException` if they match
- **Rate limiting:** Global 100 req/min, login 10 req/min, register 5 req/min

**Admin permissions (what admin CAN do):**
- Create/edit/deactivate/delete any user
- Reset any user's password
- View all claims, corporates, hospitals, insurers
- Change corporate status (Active/Inactive/Suspended)
- Broadcast notifications
- Access fraud detection
- View and export audit logs
- Bulk operations on users

**What admin CANNOT do (by design):**
- Approve or reject claims (insurer role only)
- Submit claims (hospital/patient role only)
- Modify insurance plans or labs (insurer role only)
- Add employees to corporates (corporate role only)

---

## 9. File Map

### Frontend Pages

| File                                                     | Purpose                            |
| -------------------------------------------------------- | ---------------------------------- |
| `client/src/app/admin/layout.tsx`                        | Layout wrapper with sidebar + notifications |
| `client/src/app/admin/dashboard/page.tsx`                | System-wide KPI dashboard           |
| `client/src/app/admin/users/page.tsx`                    | User management (list + bulk)       |
| `client/src/app/admin/users/[id]/page.tsx`               | User detail (view/edit/actions)     |
| `client/src/app/admin/create-user/page.tsx`              | Multi-step user creation wizard     |
| `client/src/app/admin/claims/page.tsx`                   | Claims oversight (cross-portal)     |
| `client/src/app/admin/corporates/page.tsx`               | Corporates list + status mgmt       |
| `client/src/app/admin/hospitals/page.tsx`                | Hospitals list + detail             |
| `client/src/app/admin/insurers/page.tsx`                 | Insurers list + plans               |
| `client/src/app/admin/fraud/page.tsx`                    | Fraud monitor (3 detection tabs)    |
| `client/src/app/admin/settings/page.tsx`                 | Broadcast notifications + settings  |
| `client/src/app/admin/audit-logs/page.tsx`               | Audit logs (expandable + CSV export)|

### Frontend API Clients

| File                                       | Purpose                          |
| ------------------------------------------ | -------------------------------- |
| `client/src/lib/api/admin.ts`              | User CRUD, bulk ops, broadcast, fraud |
| `client/src/lib/api/analytics.ts`          | Dashboard + coverage analytics    |
| `client/src/lib/api/audit.ts`              | Audit log listing                 |
| `client/src/lib/api/claims.ts`             | Claims listing + filters          |
| `client/src/lib/api/corporates.ts`         | Corporate listing + stats         |
| `client/src/lib/api/hospitals.ts`          | Hospital listing                  |

### Frontend Layout

| File                                                      | Purpose                          |
| --------------------------------------------------------- | -------------------------------- |
| `client/src/components/layouts/Sidebar.tsx`               | Admin sidebar (10 items, indigo theme) |
| `client/src/components/layouts/DashboardLayout.tsx`       | Shared layout wrapper             |

### Backend

| File                                                           | Purpose                          |
| -------------------------------------------------------------- | -------------------------------- |
| `server/src/modules/admin/admin.module.ts`                     | Module definition (imports PrismaModule + NotificationsModule) |
| `server/src/modules/admin/admin.controller.ts`                 | 14 endpoints (user CRUD, bulk, broadcast, fraud) |
| `server/src/modules/admin/admin.service.ts`                    | All admin business logic          |
| `server/src/modules/admin/dto/create-user-with-profile.dto.ts` | User creation DTO                |
| `server/src/modules/admin/dto/update-user.dto.ts`              | User update DTO (with nested profile DTOs) |
| `server/src/modules/admin/dto/reset-password.dto.ts`           | Password reset DTO               |
| `server/src/modules/admin/dto/bulk-action.dto.ts`              | Bulk action DTO (UUID array)     |
| `server/src/modules/admin/dto/broadcast-notification.dto.ts`   | Broadcast notification DTO       |

### Auth (modified for isActive)

| File                                                           | Purpose                          |
| -------------------------------------------------------------- | -------------------------------- |
| `server/src/modules/auth/strategies/jwt.strategy.ts`           | Checks `isActive` on every request |

### Database

| File                                                           | Purpose                          |
| -------------------------------------------------------------- | -------------------------------- |
| `server/prisma/schema.prisma`                                  | User model has `isActive` field + index |
| `server/prisma/migrations/20260417..._add_is_active_to_user/`  | Migration adding `is_active` column |
