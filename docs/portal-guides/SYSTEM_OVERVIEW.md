# InsureLink - System Overview & Cross-Portal Flows

> This document ties all 4 portals together. It explains who does what, how data flows between portals, the full claim lifecycle, onboarding, messaging, notifications, analytics, and audit -- with diagrams throughout.
>
> Read this first, then dive into the individual portal docs for page-level detail.

---

## Table of Contents

1. [What Is InsureLink?](#1-what-is-insurelink)
2. [The Four Portals at a Glance](#2-the-four-portals-at-a-glance)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Onboarding & Setup Flow](#5-onboarding--setup-flow)
6. [The Claim Lifecycle (End-to-End)](#6-the-claim-lifecycle-end-to-end)
7. [Coverage & Financial Flow](#7-coverage--financial-flow)
8. [Dependent Management Flow](#8-dependent-management-flow)
9. [Real-Time Messaging](#9-real-time-messaging)
10. [Notification System](#10-notification-system)
11. [Analytics & Dashboards](#11-analytics--dashboards)
12. [Audit Trail](#12-audit-trail)
13. [Authentication & Security](#13-authentication--security)
14. [Data Model Relationships](#14-data-model-relationships)
15. [Cross-Portal Permission Matrix](#15-cross-portal-permission-matrix)

---

## 1. What Is InsureLink?

InsureLink is a **health insurance claims management system** that connects four stakeholders:

- **Insurers** (insurance companies) who provide coverage and process claims
- **Corporates** (employers) who buy group insurance plans for their employees
- **Hospitals** (healthcare providers) who treat patients and submit claims
- **Patients** (employees & dependents) who receive treatment and track coverage

The system digitizes the entire lifecycle: from employee onboarding and plan assignment, through hospital visits and claim submission, to insurer approval and payment.

---

## 2. The Four Portals at a Glance

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INSURELINK SYSTEM                          │
├──────────────┬──────────────┬──────────────┬────────────────────────┤
│   INSURER    │  CORPORATE   │   HOSPITAL   │       PATIENT          │
│              │              │              │                        │
│ • Manage     │ • Onboard    │ • Register   │ • View coverage        │
│   plans      │   employees  │   visits     │ • Submit claims        │
│ • Approve/   │ • Bulk CSV   │ • Submit     │ • Track status         │
│   reject     │   upload     │   claims     │ • Add dependents       │
│   claims     │ • Approve    │ • Verify     │ • Browse hospitals     │
│ • Mark paid  │   dependents │   patients   │   & labs               │
│ • Manage     │ • Monitor    │ • Message    │ • Manage profile       │
│   hospitals  │   claims     │   insurers   │                        │
│   & labs     │ • View plans │ • Manage     │                        │
│ • View       │ • Manage     │   emergency  │                        │
│   corporates │   profile    │   contacts   │                        │
│ • Extract    │              │              │                        │
│   documents  │              │              │                        │
└──────────────┴──────────────┴──────────────┴────────────────────────┘
```

**Who depends on whom:**

```
Insurer  ◄─── defines plans for ───  Corporate
Corporate ◄─── employs ─────────── Patient (Employee)
Patient   ◄─── has dependents ──── Dependent
Hospital  ◄─── treats ─────────── Patient
Hospital  ───  submits claims to ──► Insurer
Patient   ───  submits claims to ──► Insurer
```

---

## 3. Tech Stack

```
┌────────────────────────────────────────────────────┐
│                    FRONTEND                        │
│  Next.js 16  •  React 19  •  TypeScript            │
│  Tailwind CSS 4  •  Socket.io Client               │
│  Leaflet (maps)  •  XLSX (Excel parse)             │
│  Framer Motion (animations)  •  PDFjs (PDF view)   │
├────────────────────────────────────────────────────┤
│                    BACKEND                         │
│  NestJS 11  •  Express  •  TypeScript              │
│  Prisma 7 ORM  •  PostgreSQL                       │
│  Socket.io (WebSocket)  •  Passport + JWT          │
│  Supabase (file storage)  •  EventEmitter2         │
│  class-validator (DTOs)  •  bcrypt (passwords)     │
├────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE                    │
│  PostgreSQL (database)                             │
│  Supabase Storage (claim documents, attachments)   │
│  JWT tokens (access: 15min, refresh: 7 days)       │
└────────────────────────────────────────────────────┘
```

---

## 4. System Architecture

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Patient  │  │Corporate │  │ Hospital │  │ Insurer  │
│ Browser  │  │ Browser  │  │ Browser  │  │ Browser  │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │             │
     └──────┬──────┴──────┬──────┴──────┬──────┘
            │             │             │
     ┌──────▼─────────────▼─────────────▼──────┐
     │         Next.js Frontend (port 3000)     │
     │  ┌─────────┐ ┌──────────┐ ┌───────────┐ │
     │  │ AuthCtx │ │ MsgCtx   │ │ Notif Hook│ │
     │  └─────────┘ └──────────┘ └───────────┘ │
     └─────────────────┬───────────────────────┘
                       │ HTTP (REST) + WebSocket
     ┌─────────────────▼───────────────────────┐
     │        NestJS Backend (port 3001)        │
     │                                          │
     │  ┌────────┐  ┌────────┐  ┌────────────┐ │
     │  │  Auth  │  │ Claims │  │ Messaging  │ │
     │  │ Module │  │ Module │  │  Gateway   │ │
     │  └────────┘  └────────┘  └────────────┘ │
     │  ┌────────┐  ┌────────┐  ┌────────────┐ │
     │  │Patients│  │Hospital│  │ Employees  │ │
     │  │ Module │  │ Module │  │  Module    │ │
     │  └────────┘  └────────┘  └────────────┘ │
     │  ┌────────┐  ┌────────┐  ┌────────────┐ │
     │  │Insurers│  │Corporat│  │Dependents  │ │
     │  │ Module │  │ Module │  │  Module    │ │
     │  └────────┘  └────────┘  └────────────┘ │
     │  ┌────────┐  ┌────────┐  ┌────────────┐ │
     │  │ Audit  │  │Notific.│  │ Analytics  │ │
     │  │ Module │  │ Module │  │  Module    │ │
     │  └────────┘  └────────┘  └────────────┘ │
     │  ┌────────┐  ┌────────────────────────┐ │
     │  │  File  │  │ EventEmitter2 (events) │ │
     │  │ Upload │  └────────────────────────┘ │
     │  └────────┘                              │
     └─────────────────┬───────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
     ┌────▼────┐  ┌────▼────┐  ┌───▼──────┐
     │PostgreSQL│  │Supabase │  │ Socket.io│
     │ Database │  │ Storage │  │  Server  │
     └─────────┘  └─────────┘  └──────────┘
```

**Request flow:** Browser -> Next.js (SSR + client) -> REST API (NestJS) -> Prisma -> PostgreSQL
**Real-time flow:** Browser <-> Socket.io <-> Messaging Gateway -> Database

---

## 5. Onboarding & Setup Flow

This is how the system gets populated from scratch.

```
                    ┌─────────────┐
                    │   ADMIN     │
                    │ creates the │
                    │   insurer   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   INSURER   │
                    │ onboards &  │
                    │ creates     │
                    │ plans       │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │                         │
       ┌──────▼──────┐          ┌──────▼──────┐
       │  CORPORATE  │          │  HOSPITAL   │
       │ onboards &  │          │ onboards &  │
       │ links to    │          │ joins the   │
       │ insurer     │          │ network     │
       └──────┬──────┘          └─────────────┘
              │
       ┌──────▼──────┐
       │  Adds       │
       │  EMPLOYEES  │
       │ (patients)  │
       └──────┬──────┘
              │
       ┌──────▼──────┐
       │  Employees  │
       │  add        │
       │ DEPENDENTS  │
       └─────────────┘
```

### Step-by-step:

**1. Admin creates Insurer**
- `POST /api/v1/admin/create-user-with-profile` (role: insurer)
- Creates `User` + `Insurer` record atomically in a single transaction
- Insurer profile: company name, license number, address, city, province, max coverage limit

**2. Insurer creates Plans**
- `POST /api/v1/insurers/:id/plans`
- Each plan defines: plan name, plan code (unique), sum insured (coverage per person), covered services, per-service limits

**3. Insurer manages Labs** (optional)
- `POST /api/v1/insurers/:id/labs`
- Diagnostic labs available to patients for discounted services

**4. Admin creates Corporate (linked to Insurer)**
- `POST /api/v1/admin/create-user-with-profile` (role: corporate)
- Corporate must reference an existing `insurerId`
- Contract window: start date to end date

**5. Hospital onboards**
- Hospital user registers -> fills onboarding form at `/onboard-hospital`
- `POST /api/v1/hospitals` creates hospital profile
- Insurer reviews and approves the hospital (Pending -> Active)

**6. Corporate adds Employees**
- Single: `POST /api/employees` (creates User + Employee)
- Bulk: CSV/Excel upload -> validate -> commit valid rows
- Each employee is assigned a plan, coverage dates, and becomes a "patient"
- Default password: `{employeeNumber}@Temp123`

**7. Employees add Dependents**
- Employee (patient) submits dependent request from their profile
- Corporate reviews and approves/rejects
- Approved dependents can claim under the parent employee's coverage

---

## 6. The Claim Lifecycle (End-to-End)

This is the core business flow that touches all 4 portals.

### Status Transition Diagram

```
                    ┌─────────────────┐
                    │    SUBMITTED    │
                    │    (Pending)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───────┐ ┌───▼────┐ ┌──────▼───────┐
     │   APPROVED     │ │ON HOLD │ │   REJECTED   │
     │ (approvedAmt   │ │(needs  │ │  (terminal)  │
     │  set by        │ │ more   │ │              │
     │  insurer)      │ │ docs)  │ └──────────────┘
     └────────┬───────┘ └───┬────┘
              │             │
              │     ┌───────┴───────┐
              │     │               │
              │  ┌──▼──────┐  ┌────▼──────┐
              │  │APPROVED │  │ REJECTED  │
              │  └────┬────┘  │ (terminal)│
              │       │       └───────────┘
     ┌────────▼───────▼┐
     │      PAID       │
     │   (terminal)    │
     │  payment ref,   │
     │  method, amount │
     └─────────────────┘
```

### Valid Transitions

| From     | To                          | Who triggers    |
| -------- | --------------------------- | --------------- |
| Pending  | Approved, Rejected, OnHold  | Insurer         |
| OnHold   | Approved, Rejected          | Insurer         |
| Approved | Paid                        | Insurer         |
| Rejected | *(terminal -- no further)*  | --              |
| Paid     | *(terminal -- no further)*  | --              |

### End-to-End Flow (Hospital-Submitted Claim)

```
 HOSPITAL                    SYSTEM                      INSURER
 ────────                    ──────                      ───────

 1. Register visit
    (employee number,
     visit date)
         │
         ▼
 2. Submit claim             3. Validates:
    (select unclaimed           - visit exists
     visit, enter               - visit not already claimed
     amount, category,          - amount ≤ remaining coverage
     priority)                  - auto-populates corporate,
         │                        plan, insurer IDs
         │                   4. Creates Claim (Pending)
         │                   5. Updates visit → "Claimed"
         │                   6. Emits CLAIM_SUBMITTED event
         │                   7. Sends notification ──────────► Sees new claim
         │                      to insurer                     in dashboard
         │                                                         │
         │                                                    8. Reviews claim
         │                                                       details, docs
         │                                                         │
         │                                              ┌──────────┼──────────┐
         │                                              │          │          │
         │                                         9a. Approve  9b. Hold  9c. Reject
         │                                          (set amt)  (need docs) (reason)
         │                                              │          │          │
         │                   10. Updates status          │          │          │
         │                   11. If approved: updates    │          │          │
  ◄──────┼────────────────── 12. Emits event ◄──────────┴──────────┴──────────┘
  Gets   │                   13. Notifies: patient,
  notif  │                       corporate, hospital
         │
         │                                              14. (If approved)
         │                                                  Mark as Paid
         │                                                  (payment ref,
         │                                                   method, amount)
         │                   15. Updates status → Paid
  ◄──────┼────────────────── 16. Notifies all parties
  Gets
  notif
```

### End-to-End Flow (Patient-Submitted Claim)

```
 PATIENT                     SYSTEM                      INSURER
 ───────                     ──────                      ───────

 1. Fill claim form
    (select hospital,
     dates, amount,
     description)
         │
         ▼
                             2. Creates HospitalVisit
                             3. Validates coverage
                             4. Creates Claim (Pending)
                             5. Emits CLAIM_SUBMITTED
                             6. Notifies insurer ──────────► Sees claim
         │                                                       │
         │                                                  Reviews & decides
         │                                                       │
  ◄──────┼────────────────── Notifications flow same as above ◄──┘
```

### Bulk Approve Flow

```
 INSURER selects multiple pending claims
         │
         ▼
 POST /api/v1/claims/bulk/approve
 Body: { claimIds: [...], approvedAmount?, eventNote? }
         │
         ▼
 System processes each claim:
   - Validates transition (Pending → Approved)
   - Sets approved amount
   - Updates employee usedAmount
   - Creates ClaimEvent
   - Emits notification per claim
```

---

## 7. Coverage & Financial Flow

```
 INSURER creates Plan
   sumInsured: 500,000 PKR
         │
         ▼
 CORPORATE assigns Plan to Employee
   coverageAmount: 500,000
   usedAmount: 0
         │
         ▼
 PATIENT visits hospital
 HOSPITAL submits claim: 75,000 PKR
         │
         ▼
 INSURER approves: 70,000 PKR
         │
         ▼
 SYSTEM updates Employee:
   usedAmount: 0 → 70,000
   remaining: 500,000 → 430,000
         │
         ▼
 Next claim validated against remaining: 430,000
 If claim > 430,000 → REJECTED (exceeds coverage)
```

**Coverage rules:**
- Each employee has a coverage pool = plan's `sumInsured`
- `usedAmount` increments when claims are **approved** (not when submitted)
- Dependents share the parent employee's coverage pool
- Coverage is bounded by `coverageStartDate` and `coverageEndDate`
- System checks eligibility: employee active + dates valid + balance > 0

**Coverage visibility:**
- **Patient** sees: total, used, remaining on dashboard (progress bar)
- **Corporate** sees: per-employee usage, total pool utilization %
- **Insurer** sees: coverage analytics across all corporates

---

## 8. Dependent Management Flow

```
 PATIENT (Employee)          CORPORATE                   SYSTEM
 ──────────────────          ─────────                   ──────

 1. Adds dependent
    from profile page
    (name, relationship,
     DOB, gender, CNIC,
     phone, coverage
     start date)
         │
         ▼
                             ◄──── 2. Notification:
                                      "New dependent
                                       request"
                                          │
                                     3. Reviews in
                                        Dependent
                                        Requests tab
                                          │
                              ┌────────────┼────────────┐
                              │                         │
                         4a. APPROVE                4b. REJECT
                              │                    (reason required)
                              │                         │
                              ▼                         ▼
                         Status →               Status →
                         Approved               Rejected
                              │                         │
 ◄──────────────────── 5. Notification ──────────────────┘
                          to patient

 If APPROVED:
   - Dependent becomes Active
   - Can submit claims under parent's coverage
   - Hospital can register visits for dependent
   - Claims deduct from parent employee's coverage pool

 If REJECTED:
   - Dependent remains Rejected
   - Rejection reason visible to employee
   - Cannot submit claims
```

---

## 9. Real-Time Messaging

Claim-scoped chat allows hospitals, insurers, corporates, and patients to communicate about specific claims.

### Architecture

```
 ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
 │ Hospital │    │ Insurer  │    │Corporate │    │ Patient  │
 │ Browser  │    │ Browser  │    │ Browser  │    │ Browser  │
 └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
      │               │               │               │
      └───────┬───────┴───────┬───────┴───────┬───────┘
              │               │               │
              ▼               ▼               ▼
     ┌─────────────────────────────────────────────┐
     │           Socket.io Server                   │
     │                                              │
     │   Room: claim-{claimId}                      │
     │   ┌─────────────────────────────────────┐    │
     │   │ All participants of this claim      │    │
     │   │ join the same room                  │    │
     │   └─────────────────────────────────────┘    │
     │                                              │
     │   Events:                                    │
     │   • join-claim-room     (client → server)    │
     │   • leave-claim-room    (client → server)    │
     │   • send-message        (client → server)    │
     │   • claim-message-new   (server → room)      │
     │   • claim-message-read  (server → room)      │
     │   • user-typing         (server → room)      │
     └─────────────────────────────────────────────┘
```

### Message Flow

```
 HOSPITAL types message about Claim #CLM-0042
         │
    ┌────▼─────────────────────────────┐
    │ 1. POST /api/v1/messages         │
    │    { claimId, messageText }      │
    │ 2. Validates claim access        │
    │ 3. Stores in ChatMessage table   │
    │ 4. Gateway emits to room:        │
    │    claim-message-new             │
    └────┬─────────────────────────────┘
         │
    ┌────▼──────────────────┐
    │ All users in room     │
    │ receive message       │
    │ instantly              │
    │ (insurer, corporate,  │
    │  patient)             │
    └───────────────────────┘
```

**Message types:**
- `text` -- regular user messages
- `system` -- auto-generated (cannot be edited/deleted)

**Attachments:** Files can be uploaded and linked to messages. Stored in Supabase.

**Access control:**
- Insurer: verified via `claim.insurerId`
- Hospital: verified via `claim.hospitalVisit.hospital.userId`
- Corporate: verified via `claim.corporateId`
- Patient: verified via employee/dependent ownership
- Access cached in-memory to avoid repeated DB lookups

---

## 10. Notification System

### Event-Driven Architecture

```
 Claims Service
 (status change)
       │
       ▼
 EventEmitter2
 emit('claim.status_changed')
       │
       ▼
 ClaimNotificationProducer
 @OnEvent('claim.status_changed')
       │
       ▼
 InAppNotificationService
       │
       ├──► PostgreSQL (persist notification)
       │
       └──► WebSocket Gateway
            sendToUser(userId)
                 │
                 ▼
            Browser receives
            real-time alert
```

### Who Gets Notified

| Event              | Insurer | Corporate | Hospital | Patient |
| ------------------ | ------- | --------- | -------- | ------- |
| Claim Submitted    | Yes     | --        | --       | --      |
| Claim Approved     | --      | Yes       | Yes      | Yes     |
| Claim Rejected     | --      | Yes       | Yes      | Yes     |
| Claim On Hold      | --      | Yes       | Yes      | Yes     |
| Claim Paid         | --      | Yes       | Yes      | Yes     |
| Dependent Request  | --      | Yes       | --       | --      |
| Dependent Approved | --      | --        | --       | Yes     |
| Dependent Rejected | --      | --        | --       | Yes     |
| New Message        | *room*  | *room*    | *room*   | *room*  |

**Notification properties:**
- `type`: claim_status, policy_update, dependent_request, messaging_alert
- `severity`: info, warning
- `isRead`: boolean (starts false)
- `actionUrl`: deep link to relevant page
- `category`: claims, policies, dependents, messaging

**Frontend:** `useNotifications()` hook polls + listens via Socket.io. Notification bell in topbar shows unread count.

---

## 11. Analytics & Dashboards

### Role-Based Analytics

The analytics module (`GET /api/v1/analytics/dashboard`) returns different data depending on the caller's role:

```
┌──────────────────────────────────────────────────────────┐
│                   ANALYTICS DATA                         │
├──────────────┬───────────────────────────────────────────┤
│              │ Claims  Coverage  Hospitals  Corporates   │
│              │ Stats   Util.     Ranking    Breakdown    │
├──────────────┼───────────────────────────────────────────┤
│ Admin        │   All     All       All         All       │
│ Insurer      │  Their   Their     Their       Their      │
│ Corporate    │  Their   Their      --          --        │
│ Hospital     │  Their    --        --          --        │
│ Patient      │   --      --        --          --        │
└──────────────┴───────────────────────────────────────────┘
```

### Metrics Available

**Claims Analytics:**
- Claims by status (Pending, Approved, Rejected counts)
- Total claims count and total claim value
- Approved value total
- Monthly trends (12-month chart data: count + value per month)
- Average processing time (hours from submission to decision)
- Rejection rate

**Coverage Analytics (Corporate/Insurer/Admin):**
- Total employees, active employees
- Total coverage pool, total used, utilization rate %
- Plan distribution (employees per plan, coverage per plan)
- Coverage breakdown by department

**Top Rankings:**
- Top 10 hospitals by claim amount
- Claims per corporate (count + value)

**Fraud Detection:** Currently stubbed (returns `fraudFlaggedCount: 0`), ready for expansion.

---

## 12. Audit Trail

Every create, update, and delete operation is logged with full detail.

```
 User performs action
 (e.g., Insurer approves claim)
         │
         ▼
 @Auditable('Claim') decorator
 activates AuditLogInterceptor
         │
         ▼
 Interceptor captures:
 • entityType: "Claim"
 • entityId: claim UUID
 • userId: insurer's user ID
 • action: "UPDATE"
 • fieldName: "claimStatus"
 • oldValue: "Pending"
 • newValue: "Approved"
 • timestamp: auto
         │
         ▼
 Stored in AuditLog table
 (fire-and-forget, non-blocking)
```

**Actions logged:** CREATE, UPDATE, DELETE, RESTORE

**For updates:** Field-level diffs are captured (fieldName, oldValue, newValue)

**Querying audits:**
- `GET /api/v1/admin/audit-logs` -- filter by entityType, userId, action, date range
- `GET /api/v1/admin/audit-logs/:entityId` -- full history of a single entity

---

## 13. Authentication & Security

### Login Flow

```
 User enters email + password
         │
         ▼
 POST /api/v1/auth/login
         │
         ▼
 Backend validates credentials (bcrypt)
         │
         ▼
 Returns:
 • Access Token (JWT, 15-min expiry)
 • Refresh Token (7-day expiry)
 • User profile (id, role, name, orgId)
         │
         ▼
 Frontend stores in localStorage:
 • insurelink_access_token
 • insurelink_refresh_token
 • insurelink_session (user data)
```

### Route Protection

```
 Browser requests /corporate/employees
         │
         ▼
 Next.js middleware checks auth_token cookie
         │
    ┌────┴────┐
    │ Missing │──► Redirect to /login
    └────┬────┘
         │ Present
         ▼
 Backend validates JWT on every API call
         │
    ┌────┴────┐
    │ Expired │──► Auto-refresh via refresh token
    └────┬────┘
         │ Valid
         ▼
 RolesGuard checks user role matches route
         │
    ┌────┴────┐
    │  Wrong  │──► 403 Forbidden
    │  role   │
    └────┬────┘
         │ Correct
         ▼
 Request proceeds
```

### Rate Limiting

| Endpoint          | Limit            |
| ----------------- | ---------------- |
| Global            | 100 req/min      |
| POST /auth/login  | 10 req/min       |
| POST /auth/register | 5 req/min      |

### Protected Route Prefixes

```
/admin/*      → requires admin role
/corporate/*  → requires corporate role
/hospital/*   → requires hospital role
/insurer/*    → requires insurer role
/patient/*    → requires patient role
```

### Public Routes

```
/login, /explore/*, /onboard-*
GET /api/v1/hospitals/all
GET /api/v1/hospitals/search/nearby
GET /api/v1/hospitals/search/sorted
POST /api/patients/verify
GET /api/v1/dependents/check-cnic/:cnic
```

---

## 14. Data Model Relationships

```
┌─────────┐       ┌──────────┐       ┌──────────┐
│  USER   │──1:1──│ INSURER  │──1:N──│   PLAN   │
│         │       │          │       │          │
│ id      │       │ id       │       │ id       │
│ email   │       │ company  │       │ planName │
│ role    │       │ license# │       │ planCode │
│ password│       │ maxCov   │       │ sumInsur │
└────┬────┘       └────┬─────┘       └────┬─────┘
     │                 │                   │
     │            ┌────┴─────┐             │
     │            │          │             │
     │       ┌────▼────┐     │             │
     │──1:1──│CORPORATE│─────┘             │
     │       │         │ insurerId         │
     │       │ name    │                   │
     │       │ contract│                   │
     │       └────┬────┘                   │
     │            │ 1:N                    │
     │       ┌────▼────┐                   │
     │──1:1──│EMPLOYEE │───────────────────┘
     │       │         │ planId
     │       │ empNum  │
     │       │ coverage│
     │       │ used    │
     │       └────┬────┘
     │            │ 1:N
     │       ┌────▼─────┐
     │       │DEPENDENT │
     │       │          │
     │       │ name     │
     │       │ relation │
     │       │ status   │
     │       └────┬─────┘
     │            │
     │            │ (employee or dependent)
     │       ┌────▼──────────┐
     │──1:1──│   HOSPITAL    │──1:N──┐
     │       │               │       │
     │       │ hospitalName  │  ┌────▼─────────────┐
     │       │ license#      │  │ EMERGENCY CONTACT│
     │       │ type          │  │ level (1-3)      │
     │       │ lat/lng       │  │ name, phone      │
     │       └───────┬───────┘  └──────────────────┘
     │               │
     │          ┌────▼──────────┐
     │          │HOSPITAL VISIT │
     │          │               │
     │          │ employeeId    │
     │          │ dependentId?  │
     │          │ visitDate     │
     │          │ status        │
     │          └───────┬───────┘
     │                  │ 1:N
     │             ┌────▼────┐
     │             │  CLAIM  │──1:N──┐
     │             │         │       │
     │             │ number  │  ┌────▼──────────┐
     │             │ status  │  │ CLAIM EVENT   │
     │             │ amount  │  │ (audit trail) │
     │             │ approved│  │ statusFrom/To │
     │             └────┬────┘  │ actor, note   │
     │                  │       └───────────────┘
     │                  │
     │             ┌────┴────────────┐
     │             │                 │
     │        ┌────▼─────────┐ ┌────▼──────────┐
     │        │CLAIM DOCUMENT│ │ CHAT MESSAGE  │
     │        │ filename     │ │ sender/recvr  │
     │        │ fileUrl      │ │ text, isRead  │
     │        └──────────────┘ │ attachments[] │
     │                         └───────────────┘
     │
     │        ┌──────────────┐     ┌──────────┐
     │──1:N──│ NOTIFICATION │     │AUDIT LOG │
     │        │ type, title  │     │ entity   │
     │        │ message      │     │ action   │
     │        │ severity     │     │ old/new  │
     │        │ isRead       │     │ userId   │
     │        └──────────────┘     └──────────┘
     │
     │        ┌──────────────┐
     └──1:N──│   LAB        │
              │ insurerId    │
              │ labName      │
              │ license#     │
              │ testCategs   │
              └──────────────┘
```

---

## 15. Cross-Portal Permission Matrix

What each role can **do** (not just see):

| Action                          | Patient | Corporate | Hospital | Insurer | Admin |
| ------------------------------- | ------- | --------- | -------- | ------- | ----- |
| Submit claim                    | Yes     | --        | Yes      | --      | --    |
| Edit pending claim              | Yes     | --        | Yes      | --      | --    |
| Approve/reject claim            | --      | --        | --       | Yes     | --    |
| Mark claim as paid              | --      | --        | --       | Yes     | --    |
| Bulk approve claims             | --      | --        | --       | Yes     | --    |
| Add employee                    | --      | Yes       | --       | --      | Yes   |
| Bulk upload employees           | --      | Yes       | --       | --      | Yes   |
| Remove employee                 | --      | Yes       | --       | --      | Yes   |
| Add dependent                   | Yes     | Yes       | --       | --      | Yes   |
| Approve/reject dependent        | --      | Yes       | --       | --      | Yes   |
| Create/edit plan                | --      | --        | --       | Yes     | --    |
| Create/edit lab                 | --      | --        | --       | Yes     | --    |
| Register hospital visit         | --      | --        | Yes      | --      | --    |
| Verify patient (CNIC)           | --      | --        | Yes      | --      | --    |
| Manage emergency contacts       | --      | --        | Yes      | --      | --    |
| Approve hospital into network   | --      | --        | --       | Yes     | --    |
| Send claim messages             | Yes     | Yes       | Yes      | Yes     | Yes   |
| View analytics                  | --      | Yes       | Yes      | Yes     | Yes   |
| View audit logs                 | --      | --        | --       | --      | Yes   |
| Create organizations            | --      | --        | --       | --      | Yes   |

**Data isolation:** Each role can only see data belonging to their organization. A corporate cannot see another corporate's employees. A hospital cannot see another hospital's claims. Enforced at the service layer with `ForbiddenException`.

---

## Quick Reference: File Structure

```
client/src/
├── app/
│   ├── patient/        → 6 pages (dashboard, claims, history, hospitals, labs, profile)
│   ├── corporate/      → 5 pages (dashboard, employees, claims, plans, profile)
│   ├── hospital/       → 7 pages (dashboard, claims, patients, patient-details, visits, emergency-contacts, profile)
│   ├── insurer/        → 8 pages (dashboard, claims, plans, hospitals, corporates, labs, document-extract, profile)
│   ├── admin/          → 3 pages (dashboard, create-user, audit-logs)
│   ├── onboard-*/      → 3 onboarding pages (corporate, hospital, insurer)
│   └── login/          → Login page
├── components/
│   ├── patient/        → DependentsList, AddDependentModal, ClaimDetailsModal
│   ├── corporate/      → CorporateDashboard, KeyMetrics, CoverageOverview, BulkUploadModal, etc.
│   ├── hospital/       → SubmitClaimFormV2, SubmitClaimHeader
│   ├── insurer/        → DocumentExtractor, CorporateEmployeesModal
│   └── layouts/        → DashboardLayout, Sidebar, Topbar
├── contexts/           → AuthContext, ClaimsMessagingContext
├── hooks/              → useAuth, useNotifications, useClaimSocket, useGeolocation
├── lib/api/            → API clients (claims, patients, employees, hospitals, insurers, etc.)
└── lib/auth/           → Token management (session.ts)

server/src/
├── modules/
│   ├── auth/           → Login, register, JWT strategy, refresh tokens
│   ├── claims/         → Claim CRUD, status transitions, bulk approve, events
│   ├── patients/       → Patient lookup, coverage calculation, verification
│   ├── employees/      → Employee CRUD, bulk import pipeline
│   ├── dependents/     → Dependent CRUD, approve/reject
│   ├── corporates/     → Corporate CRUD, stats
│   ├── hospitals/      → Hospital CRUD, visits, emergency contacts, geo-search
│   ├── insurers/       → Insurer CRUD, plans, labs
│   ├── messaging/      → WebSocket gateway, chat messages, attachments
│   ├── notifications/  → Event listener, in-app notification service
│   ├── analytics/      → Role-based dashboard metrics, coverage analytics
│   ├── audit/          → Audit log interceptor and service
│   ├── file-upload/    → Supabase storage provider
│   └── admin/          → User+profile creation, audit log queries
└── common/             → Guards, interceptors, filters, decorators
```

---

*For page-level detail on each portal, see the companion docs:*
- [PATIENT_PORTAL.md](PATIENT_PORTAL.md)
- [CORPORATE_PORTAL.md](CORPORATE_PORTAL.md)
- [HOSPITAL_PORTAL.md](HOSPITAL_PORTAL.md)
- [INSURER_PORTAL.md](INSURER_PORTAL.md)
