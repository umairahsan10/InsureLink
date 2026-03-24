# Phase 4 Implementation Plan - Notifications + Audit + Analytics

**Version:** 1.0  
**Date:** March 24, 2026  
**Developer:** Dev B  
**Scope:** Notifications, Audit, Analytics modules  
**Timeline:** 2 weeks (Weeks 7-8)

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Module Breakdown](#module-breakdown)
4. [Timeline & Phases](#timeline--phases)
5. [Database Schema Reference](#database-schema-reference)
6. [API Endpoints](#api-endpoints)
7. [Event System Design](#event-system-design)
8. [WebSocket Integration](#websocket-integration)
9. [Frontend Integration](#frontend-integration)
10. [Code Structure](#code-structure)
11. [Implementation Checklist](#implementation-checklist)

---

## Overview

### Modules Under Phase 4

| Module | Purpose | Complexity | Week |
|--------|---------|-----------|------|
| **Notifications** | In-app + real-time push notifications on claim/dependent events | High | 7 |
| **Audit** | Auto-log mutations on claims/insurers, query audit history | Medium | 7-8 |
| **Analytics** | Role-aware dashboards, claims aggregation, coverage stats | Medium | 8 |

### What Phase 4 Delivers

- **Notifications:** Users receive real-time in-app notifications when claim status changes, dependents are approved/rejected, or policy updates occur. Persisted in DB and pushed via WebSocket.
- **Audit:** Every mutation on claims and insurer endpoints is automatically logged with before/after values. Queryable audit trail for compliance.
- **Analytics:** Role-aware dashboard API endpoints returning aggregated claim statistics, monthly trends, top hospitals, coverage utilization — shaped to match existing frontend dashboard components.

### Dependencies on Other Modules

| Dependency | Direction | What |
|-----------|-----------|------|
| **Claims** (Phase 2) | Notifications ← Claims | Claims emits `claim.status_changed` event; Notifications listens |
| **Dependents** (Dev A) | Notifications ← Dependents | Dependents emits `dependent.approved`/`dependent.rejected`; Notifications listens |
| **Auth** (Dev A) | All modules ← Auth | JWT guards, `@CurrentUser()`, `@Roles()` decorators |
| **WebSockets** (Phase 3) | Notifications → WebSockets | Notifications pushes real-time events via WebSocket gateway |
| **Claims** (Phase 2) | Analytics ← Claims | Analytics reads Claim, ClaimEvent tables for aggregation |
| **Employees** (Dev A) | Analytics ← Employees | Analytics reads Employee table for coverage stats |
| **Corporates** (Dev A) | Analytics ← Corporates | Analytics reads Corporate table for per-corporate metrics |
| **Hospitals** (Phase 1) | Analytics ← Hospitals | Analytics reads Hospital table for top hospitals |

### Key Responsibility

You control how the system **reacts** to domain events and **reports** on historical data. This phase ties together all prior work into a feedback loop:
1. **Claims/Dependents change** → event emitted → **Notifications** creates alert → **WebSocket** pushes to user
2. **Any mutation** on audited endpoints → **Audit** interceptor logs before/after → queryable history
3. **Dashboard requests** → **Analytics** aggregates Claims, Employees, Hospitals data → role-shaped response

---

## Prerequisites

### 1. Install `@nestjs/event-emitter`

This is the foundation for decoupled event flow. Claims and Dependents modules emit events; Notifications module listens.

```bash
cd server
npm install @nestjs/event-emitter
```

### 2. Register EventEmitterModule in AppModule

```typescript
// server/src/app.module.ts
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    // ... existing modules
  ],
})
export class AppModule {}
```

### 3. Verify Existing Scaffolding

Before starting, confirm these files exist (all should be scaffolded but empty):

| File | Status |
|------|--------|
| `notifications/notifications.service.ts` | Empty class |
| `notifications/repositories/notifications.repository.ts` | Stub |
| `notifications/producers/claim-notification.producer.ts` | Comment-only |
| `notifications/producers/dependent-notification.producer.ts` | Comment-only |
| `notifications/services/in-app-notification.service.ts` | Empty class |
| `audit/audit.service.ts` | Empty class |
| `audit/repositories/audit-logs.repository.ts` | Stub |
| `audit/interceptors/audit-log.interceptor.ts` | Passthrough interceptor |
| `audit/decorators/auditable.decorator.ts` | Working decorator with `AUDITABLE_KEY` |
| `analytics/analytics.service.ts` | Empty class |
| `analytics/services/fraud-detection.service.ts` | Empty class |
| `analytics/services/trend-analysis.service.ts` | Empty class |

### 4. Verify Prisma Models

Both `Notification` and `AuditLog` models must exist in `server/prisma/schema.prisma`. They are already defined — no migration needed.

---

## Module Breakdown

### 1. Notifications Module (Week 7, Days 1-7)

**Purpose:** Create, store, and deliver notifications to users in real-time when domain events occur.

**Responsibilities:**
- Persist notifications in database (Notification table)
- Listen for domain events (`claim.status_changed`, `dependent.approved`, `dependent.rejected`)
- Generate notification content from templates
- Push real-time notifications via WebSocket to connected users
- Provide REST API for querying, marking read, and deleting notifications
- Support bulk notification creation

**Database Tables Used:**
- `notifications` (CRUD — owned by this module)
- `users` (FK relation — read only)

**Depends On:**
- Auth (JWT validation, `@CurrentUser()`)
- Claims (emits `claim.status_changed` event)
- Dependents (emits `dependent.approved`, `dependent.rejected` events)
- WebSockets (push real-time events)

**Must Deliver:**
- ✅ GET /notifications — paginated, filtered by type/severity/read status
- ✅ PATCH /notifications/:id/read — mark single notification as read
- ✅ DELETE /notifications/:id — delete a notification
- ✅ GET /notifications/unread-count — returns unread count for current user
- ✅ `claim-notification.producer.ts` — listens for claim events, creates notifications
- ✅ `dependent-notification.producer.ts` — listens for dependent events, creates notifications
- ✅ `in-app-notification.service.ts` — persists and pushes via WebSocket
- ✅ WebSocket room-based push (`user:{userId}`)

**Key Fields in Response:**
```typescript
{
  id: string
  userId: string
  notificationType: 'claim_status' | 'policy_update' | 'dependent_request' | 'messaging_alert'
  title: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  relatedEntityId?: string
  relatedEntityType?: string
  isRead: boolean
  actionUrl?: string
  category?: string
  timestamp: Date
  createdAt: Date
}
```

**Notification Templates (Already Exist):**
- `ClaimApprovedTemplate.generate(data)` → "Your claim {claimNumber} has been approved for amount {amount}"
- `PaymentProcessedTemplate.generate(data)` → Payment confirmation message
- `PolicyUpdatedTemplate.generate(data)` → Policy update message

**New Templates Needed:**
- `ClaimRejectedTemplate.generate(data)` → "Your claim {claimNumber} has been rejected: {reason}"
- `ClaimOnHoldTemplate.generate(data)` → "Your claim {claimNumber} has been put on hold: {reason}"
- `ClaimSubmittedTemplate.generate(data)` → "Claim {claimNumber} submitted for review"
- `DependentApprovedTemplate.generate(data)` → "Dependent {name} has been approved"
- `DependentRejectedTemplate.generate(data)` → "Dependent {name} has been rejected: {reason}"

**Event → Notification Mapping:**

| Event | NotificationType | Severity | Recipients | Template |
|-------|-----------------|----------|-----------|----------|
| `claim.status_changed` (→ Approved) | `claim_status` | `info` | Patient (employee/dependent user), Corporate user | `ClaimApprovedTemplate` |
| `claim.status_changed` (→ Rejected) | `claim_status` | `warning` | Patient, Corporate user | `ClaimRejectedTemplate` |
| `claim.status_changed` (→ OnHold) | `claim_status` | `warning` | Patient, Corporate user | `ClaimOnHoldTemplate` |
| `claim.status_changed` (→ Paid) | `claim_status` | `info` | Patient, Corporate user | `PaymentProcessedTemplate` |
| `claim.status_changed` (→ Pending) | `claim_status` | `info` | Insurer user, Hospital user | `ClaimSubmittedTemplate` |
| `dependent.approved` | `dependent_request` | `info` | Employee user | `DependentApprovedTemplate` |
| `dependent.rejected` | `dependent_request` | `warning` | Employee user | `DependentRejectedTemplate` |

---

### 2. Audit Module (Week 7-8, Days 5-10)

**Purpose:** Automatically log all mutations on decorated endpoints with before/after values for compliance and traceability.

**Responsibilities:**
- Log CREATE, UPDATE, DELETE operations automatically via interceptor
- Store per-field changes (old value → new value)
- Provide queryable audit trail (filtered by entity, user, action, date range)
- Provide entity-specific history view
- Expose `AuditService.log()` for manual audit entries from other modules

**Database Tables Used:**
- `audit_logs` (CRUD — owned by this module)
- `users` (FK relation — read only)

**Depends On:**
- Auth (JWT validation, `@CurrentUser()`)

**Dependents:**
- Claims (decorated with `@Auditable()`)
- Insurers (decorated with `@Auditable()`)

**Must Deliver:**
- ✅ `AuditService.log()` — public method callable by any module
- ✅ `AuditLogInterceptor` — auto-log mutations on `@Auditable()` endpoints
- ✅ GET /audit/logs — filtered, paginated audit log query
- ✅ GET /audit/entity/:type/:id — full history of a specific entity
- ✅ `@Auditable()` decorator applied to claims and insurer mutation endpoints

**Key Fields in Response:**
```typescript
{
  id: string
  entityType: string       // 'Claim', 'Insurer', 'Plan', etc.
  entityId: string         // UUID of the entity
  userId?: string          // Who made the change
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE'
  fieldName?: string       // Which field changed
  oldValue?: string        // Previous value (stringified)
  newValue?: string        // New value (stringified)
  changeReason?: string    // Optional reason
  timestamp: Date
  createdAt: Date
}
```

**Audit Log Granularity:**
- One `AuditLog` row **per changed field** for UPDATE operations
- One `AuditLog` row for CREATE (no old value, new value = JSON of created entity)
- One `AuditLog` row for DELETE (old value = JSON of deleted entity, no new value)
- This matches the Prisma model's `fieldName`, `oldValue`, `newValue` columns

**Example: Claim Approval Audit Trail**
```
| entityType | entityId | action | fieldName      | oldValue  | newValue  |
|-----------|----------|--------|----------------|-----------|-----------|
| Claim     | clm-123  | UPDATE | claimStatus    | Pending   | Approved  |
| Claim     | clm-123  | UPDATE | approvedAmount | null      | 50000     |
```

**Endpoints to Decorate with `@Auditable()`:**

| Module | Endpoint | Action |
|--------|----------|--------|
| Claims | `PATCH /claims/:id/approve` | UPDATE |
| Claims | `PATCH /claims/:id/reject` | UPDATE |
| Claims | `PATCH /claims/:id/on-hold` | UPDATE |
| Claims | `PATCH /claims/:id/paid` | UPDATE |
| Claims | `POST /claims` | CREATE |
| Insurers | `POST /insurers` | CREATE |
| Insurers | `PUT /insurers/:id` | UPDATE |
| Insurers | `POST /insurers/:id/plans` | CREATE |
| Insurers | `PUT /plans/:id` | UPDATE |
| Insurers | `DELETE /plans/:id` | DELETE |

---

### 3. Analytics Module (Week 8, Days 1-7)

**Purpose:** Provide role-aware aggregated statistics for dashboards. Read-only queries across Claims, Employees, Hospitals, and Corporates tables.

**Responsibilities:**
- Aggregate claim data by status, monthly trends, per-corporate breakdown
- Calculate coverage utilization metrics
- Provide role-aware dashboard endpoint (insurer sees all, corporate sees own, hospital sees own)
- Return data shaped to match existing frontend `Analytics` TypeScript interface

**Database Tables Used (all read-only):**
- `claims` — status counts, amount sums, monthly grouping
- `claim_events` — processing time calculation
- `employees` — coverage utilization
- `corporates` — per-corporate metrics
- `hospitals` — top hospitals by claim amount
- `plans` — plan distribution
- `hospital_visits` — visit counts

**Depends On:**
- Auth (JWT validation, `@CurrentUser()`)
- Claims (read claim data)
- Employees (read coverage data)
- Corporates (read corporate data)
- Hospitals (read hospital data)

**Must Deliver:**
- ✅ GET /analytics/dashboard — role-aware dashboard stats
- ✅ GET /analytics/claims — detailed claims analytics with date range
- ✅ GET /analytics/coverage — coverage utilization stats
- ✅ `FraudDetectionService` — left as stub (deferred)
- ✅ `TrendAnalysisService` — left as stub (trends computed in main service via Prisma groupBy)

**Dashboard Response (matches frontend `Analytics` interface):**
```typescript
{
  // Core counts
  claimsByStatus: {
    Pending: number
    Approved: number
    Rejected: number
  }
  totalClaims: number
  totalClaimValue: number        // sum of amountClaimed
  approvedValueTotal: number     // sum of approvedAmount where status = Approved|Paid

  // Trends
  monthlyTrends: Array<{
    month: string                // "2026-01", "2026-02", ...
    count: number                // claims submitted that month
    value: number                // total amountClaimed that month
  }>

  // Performance
  avgProcessingTimeHours: number // avg time from Pending → Approved/Rejected

  // Breakdowns
  topHospitalsByAmount: Array<{
    hospitalId: string
    hospitalName: string
    totalAmount: number
  }>
  claimsPerCorporate: Array<{
    corporateId: string
    corporateName: string
    count: number
    value: number
  }>

  // Rates
  rejectionRate: number          // rejected / total (0.0 - 1.0)
  fraudFlaggedCount: number      // 0 (stub — fraud detection deferred)
}
```

**Role-Based Data Scoping:**

| Role | Scope | Filter |
|------|-------|--------|
| `insurer` | All claims across all corporates/hospitals under this insurer | `WHERE insurerId = user.organizationId` |
| `corporate` | Only this corporate's claims | `WHERE corporateId = user.organizationId` |
| `hospital` | Only claims at this hospital | `WHERE hospitalVisit.hospitalId = user.organizationId` |
| `admin` | All data, no filter | No WHERE clause |
| `patient` | Not applicable | Return 403 or empty |

**Claims Analytics Response (GET /analytics/claims):**
```typescript
{
  claimsByStatus: {
    Pending: number
    Approved: number
    Rejected: number
    OnHold: number
    Paid: number
  }
  monthlyTrends: Array<{
    month: string
    count: number
    value: number
  }>
  avgApprovalAmount: number
  avgProcessingTimeHours: number
  topHospitalsByAmount: Array<{
    hospitalId: string
    hospitalName: string
    totalAmount: number
  }>
  claimsPerCorporate: Array<{
    corporateId: string
    corporateName: string
    count: number
    value: number
  }>
}
```

**Coverage Analytics Response (GET /analytics/coverage):**
```typescript
{
  totalEmployees: number
  activeEmployees: number
  totalCoverageAmount: number      // sum of all coverageAmount
  totalUsedAmount: number          // sum of all usedAmount
  utilizationRate: number          // usedAmount / coverageAmount (0.0 - 1.0)
  planDistribution: Array<{
    planId: string
    planName: string
    employeeCount: number
    totalCoverage: number
  }>
  coverageByDepartment: Array<{
    department: string
    employeeCount: number
    totalCoverage: number
    usedAmount: number
  }>
}
```

**Prisma Aggregate Query Examples:**
```typescript
// Claims by status
const claimsByStatus = await this.prisma.claim.groupBy({
  by: ['claimStatus'],
  _count: { id: true },
  where: { insurerId },
});

// Monthly trends (last 12 months)
const monthlyTrends = await this.prisma.claim.groupBy({
  by: [/* raw SQL for month extraction */],
  _count: { id: true },
  _sum: { amountClaimed: true },
  where: {
    createdAt: { gte: twelveMonthsAgo },
    insurerId,
  },
});

// Top hospitals
const topHospitals = await this.prisma.claim.groupBy({
  by: ['hospitalVisitId'],
  _sum: { amountClaimed: true },
  orderBy: { _sum: { amountClaimed: 'desc' } },
  take: 10,
});

// Avg processing time
const events = await this.prisma.claimEvent.findMany({
  where: {
    action: { in: ['CLAIM_APPROVED', 'CLAIM_REJECTED'] },
  },
  select: { claimId: true, timestamp: true },
});
// Compare with claim.createdAt for each
```

---

## Timeline & Phases

### Phase 4A: Notifications Module (Week 7, Days 1-5)

**Days 1-2: Repository + Service**

- [ ] Install `@nestjs/event-emitter` and register in `AppModule`
- [ ] Implement `notifications.repository.ts` — inject PrismaService
  - [ ] `create(data)` — create notification record
  - [ ] `findByUserId(userId, filters, pagination)` — paginated, sorted by timestamp desc
  - [ ] `findById(id)` — get single notification
  - [ ] `markAsRead(id)` — set `isRead = true`
  - [ ] `delete(id)` — hard delete
  - [ ] `getUnreadCount(userId)` — count where `isRead = false`
  - [ ] `createMany(data[])` — bulk insert
- [ ] Implement `notifications.service.ts`
  - [ ] `createNotification(data)` — validate + repository create
  - [ ] `getUserNotifications(userId, filters, pagination)` — call repository
  - [ ] `markAsRead(id, userId)` — verify ownership + mark read
  - [ ] `deleteNotification(id, userId)` — verify ownership + delete
  - [ ] `getUnreadCount(userId)` — call repository
  - [ ] `createBulkNotifications(userIds[], data)` — create same notification for multiple users

**Days 2-3: Controller**

- [ ] Implement `notifications.controller.ts`
  - [ ] `GET /notifications` — `@Auth()`, extract userId from `@CurrentUser()`, pass filters (notificationType, isRead, severity) + pagination
  - [ ] `PATCH /notifications/:id/read` — `@Auth()`, verify user owns notification
  - [ ] `DELETE /notifications/:id` — `@Auth()`, verify user owns notification
  - [ ] `GET /notifications/unread-count` — `@Auth()`, returns `{ count: number }`
- [ ] Add `class-validator` decorators to `CreateNotificationDto` and `BulkNotificationDto` (verify existing DTOs have proper validation)

**Days 3-4: Event Producers**

- [ ] Create new notification templates:
  - [ ] `ClaimRejectedTemplate`
  - [ ] `ClaimOnHoldTemplate`
  - [ ] `ClaimSubmittedTemplate`
  - [ ] `DependentApprovedTemplate`
  - [ ] `DependentRejectedTemplate`
- [ ] Implement `claim-notification.producer.ts`
  - [ ] `@OnEvent('claim.status_changed')` handler
  - [ ] Map claim status to template + severity + recipients
  - [ ] Look up related users (patient, corporate, hospital, insurer) from claim relations
  - [ ] Call `notificationsService.createBulkNotifications()` for all recipients
- [ ] Implement `dependent-notification.producer.ts`
  - [ ] `@OnEvent('dependent.approved')` handler
  - [ ] `@OnEvent('dependent.rejected')` handler
  - [ ] Look up employee userId from dependent relation
  - [ ] Call `notificationsService.createNotification()` for employee user

**Days 4-5: WebSocket Integration + Module Wiring**

- [ ] Extend `AppGateway` in `server/src/websockets/gateway.ts`
  - [ ] `handleConnection(client)` — extract JWT from handshake auth, join `user:{userId}` room
  - [ ] `handleDisconnect(client)` — leave room
  - [ ] Expose `sendToUser(userId, event, payload)` method
- [ ] Implement `in-app-notification.service.ts`
  - [ ] Inject `NotificationsRepository` + `AppGateway`
  - [ ] `send(userId, notification)` — save to DB via repository, then push via `gateway.sendToUser()`
- [ ] Update `notifications.module.ts`
  - [ ] Import `PrismaModule`
  - [ ] Register `NotificationsRepository` as provider
  - [ ] Register `ClaimNotificationProducer` and `DependentNotificationProducer` as providers
  - [ ] Import WebSockets module for gateway access
- [ ] Update `WebsocketsModule` — register `AppGateway` as provider and export it

**Checkpoint:** Notifications fully working — event emitted → notification persisted → WebSocket push

---

### Phase 4B: Audit Module (Week 7-8, Days 5-10)

**Days 5-7: Repository + Service + Interceptor**

- [ ] Implement `audit-logs.repository.ts` — inject PrismaService
  - [ ] `create(data)` — create audit log entry
  - [ ] `createMany(data[])` — bulk create (for multi-field updates)
  - [ ] `findAll(filters, pagination)` — filtered by entityType, entityId, userId, action, date range
  - [ ] `findByEntity(entityType, entityId, pagination)` — history of single entity, sorted by timestamp desc
- [ ] Implement `audit.service.ts`
  - [ ] `log(entityType, entityId, action, userId, changes?)` — public method
    - For `CREATE`: single row, `newValue` = JSON.stringify(entity)
    - For `UPDATE`: one row per changed field, `fieldName` + `oldValue` + `newValue`
    - For `DELETE`: single row, `oldValue` = JSON.stringify(entity)
  - [ ] `getLogs(filters, pagination)` — call repository with filters
  - [ ] `getEntityHistory(entityType, entityId, pagination)` — call repository
- [ ] Implement `audit-log.interceptor.ts` — full NestJS interceptor
  - [ ] Check for `@Auditable()` metadata via `Reflector`
  - [ ] On request: if `PUT/PATCH`, fetch current entity state (old values)
  - [ ] On response (in `tap` operator): compare old vs new, call `auditService.log()`
  - [ ] On `POST`: log CREATE with response body as new values
  - [ ] On `DELETE`: log DELETE with previously fetched entity as old values
  - [ ] Extract `userId` from `request.user`

**Days 7-8: Controller + Decorator Application**

- [ ] Implement audit controller (create new file or add to existing)
  - [ ] `GET /audit/logs` — `@Auth()`, `@Roles('insurer', 'corporate')`, query params: entityType, userId, action, startDate, endDate, page, limit
  - [ ] `GET /audit/entity/:type/:id` — `@Auth()`, paginated history of one entity
- [ ] Apply `@Auditable()` decorator to claims mutation endpoints:
  - [ ] `POST /claims` (CREATE)
  - [ ] `PATCH /claims/:id/approve` (UPDATE)
  - [ ] `PATCH /claims/:id/reject` (UPDATE)
  - [ ] `PATCH /claims/:id/on-hold` (UPDATE)
  - [ ] `PATCH /claims/:id/paid` (UPDATE)
- [ ] Apply `@Auditable()` decorator to insurer mutation endpoints:
  - [ ] `POST /insurers` (CREATE)
  - [ ] `PUT /insurers/:id` (UPDATE)
  - [ ] `POST /insurers/:id/plans` (CREATE)
  - [ ] `PUT /plans/:id` (UPDATE)
  - [ ] `DELETE /plans/:id` (DELETE)
- [ ] Update `audit.module.ts`
  - [ ] Import `PrismaModule`
  - [ ] Register `AuditLogsRepository` as provider
  - [ ] Register `AuditLogInterceptor` as provider
  - [ ] Export `AuditService` and `AuditLogInterceptor`

**Checkpoint:** Approve a claim → audit log entry with old/new status appears in GET /audit/logs

---

### Phase 4C: Analytics Module (Week 8, Days 1-5)

**Days 1-3: Service Implementation**

- [ ] Implement `analytics.service.ts` — inject PrismaService
  - [ ] `getDashboard(role, organizationId)` — role-aware aggregate
    - [ ] Claims by status (`groupBy claimStatus`)
    - [ ] Total claims count and value
    - [ ] Approved value total
    - [ ] Monthly trends (last 12 months, `groupBy` month from `createdAt`)
    - [ ] Avg processing time (diff between `claim.createdAt` and approval/rejection `ClaimEvent.timestamp`)
    - [ ] Top hospitals by claim amount (join via `hospitalVisit`)
    - [ ] Claims per corporate
    - [ ] Rejection rate
    - [ ] `fraudFlaggedCount: 0` (stub)
  - [ ] `getClaimsAnalytics(role, organizationId, filters)` — detailed claims breakdown
    - [ ] Same aggregations as dashboard but with date range filter
    - [ ] Include OnHold and Paid in status breakdown
    - [ ] Avg approval amount
  - [ ] `getCoverageAnalytics(role, organizationId)` — coverage utilization
    - [ ] Total/active employees
    - [ ] Total coverage vs used amounts
    - [ ] Utilization rate
    - [ ] Plan distribution (employees per plan)
    - [ ] Coverage by department

**Days 3-4: Controller**

- [ ] Implement `analytics.controller.ts`
  - [ ] `GET /analytics/dashboard` — `@Auth()`, extract role + organizationId from `@CurrentUser()`, call `getDashboard()`
  - [ ] `GET /analytics/claims` — `@Auth()`, `@Roles('insurer', 'corporate')`, query params: startDate, endDate
  - [ ] `GET /analytics/coverage` — `@Auth()`, `@Roles('insurer', 'corporate')`
- [ ] Update `analytics.module.ts`
  - [ ] Import `PrismaModule`
  - [ ] Keep `FraudDetectionService` and `TrendAnalysisService` as empty stubs
  - [ ] Remove `ReportGeneratorService` if not needed, or keep as stub

**Day 5: Stubs**

- [ ] `fraud-detection.service.ts` — add TODO comment, leave as empty class
- [ ] `trend-analysis.service.ts` — add TODO comment, leave as empty class
- [ ] `report-generator.service.ts` — add TODO comment, leave as empty class

**Checkpoint:** GET /analytics/dashboard returns Analytics-shaped JSON per role

---

### Phase 4D: Integration & Wiring (Days 8-10, parallel with Analytics)

**Emit Events from Claims Module**

- [ ] Inject `EventEmitter2` into `ClaimProcessingService`
- [ ] After each status transition, emit event:
  ```typescript
  this.eventEmitter.emit('claim.status_changed', {
    claimId,
    claimNumber: claim.claimNumber,
    statusFrom: previousStatus,
    statusTo: newStatus,
    actorUserId: user.id,
    actorRole: user.role,
    approvedAmount,     // if applicable
    eventNote,          // if applicable
  });
  ```
- [ ] Emit in: `approveClaim()`, `rejectClaim()`, `putOnHold()`, `markAsPaid()`
- [ ] Emit `claim.status_changed` with `statusTo: Pending` in `createClaim()` (new submission)

**Emit Events from Dependents Module (Coordinate with Dev A)**

- [ ] Verify Dev A emits `dependent.approved` with `{ dependentId, employeeId, dependentName }`
- [ ] Verify Dev A emits `dependent.rejected` with `{ dependentId, employeeId, dependentName, reason }`
- [ ] If Dev A hasn't added events yet, provide the event contract specification

**Dependent Event Contract (for Dev A):**
```typescript
// In DependentsService.approve():
this.eventEmitter.emit('dependent.approved', {
  dependentId: dependent.id,
  employeeId: dependent.employeeId,
  dependentName: `${dependent.firstName} ${dependent.lastName}`,
  approverName: user.email,
});

// In DependentsService.reject():
this.eventEmitter.emit('dependent.rejected', {
  dependentId: dependent.id,
  employeeId: dependent.employeeId,
  dependentName: `${dependent.firstName} ${dependent.lastName}`,
  reason: rejectionReason,
});
```

---

### Phase 4E: Testing & Verification (Days 9-10)

- [ ] Run `npx nest build` — all 3 modules compile
- [ ] Test notification flow:
  - [ ] Create claim → `claim.status_changed` event emitted → notification created for insurer/hospital users
  - [ ] Approve claim → notification created for patient and corporate users
  - [ ] `GET /notifications` returns created notifications
  - [ ] `PATCH /notifications/:id/read` marks as read
  - [ ] `GET /notifications/unread-count` returns correct count
  - [ ] DELETE notification works
- [ ] Test WebSocket:
  - [ ] Connect Socket.IO client with JWT → joins `user:{userId}` room
  - [ ] Approve claim → `notification` event received in client
- [ ] Test audit:
  - [ ] `PATCH /claims/:id/approve` → audit log entry for claimStatus change
  - [ ] `GET /audit/logs?entityType=Claim` returns entries
  - [ ] `GET /audit/entity/Claim/:id` returns full history
  - [ ] `POST /insurers` → audit log entry for CREATE
- [ ] Test analytics:
  - [ ] `GET /analytics/dashboard` as insurer → full analytics
  - [ ] `GET /analytics/dashboard` as corporate → scoped to own corporate
  - [ ] `GET /analytics/claims?startDate=...&endDate=...` works
  - [ ] `GET /analytics/coverage` returns coverage stats
  - [ ] Verify response shape matches frontend `Analytics` interface

---

## Database Schema Reference

### Tables You Directly Manage

```sql
-- Notifications Table
notifications {
  id              UUID PRIMARY KEY DEFAULT uuid()
  user_id         UUID FK users(id) ON DELETE CASCADE
  notification_type ENUM(claim_status, policy_update, dependent_request, messaging_alert)
  title           VARCHAR(255)
  message         TEXT
  severity        ENUM(info, warning, critical) DEFAULT info
  related_entity_id   UUID?         -- FK to claim, dependent, etc.
  related_entity_type VARCHAR(50)?  -- 'Claim', 'Dependent', etc.
  is_read         BOOLEAN DEFAULT false
  action_url      VARCHAR(500)?    -- Frontend route to navigate to
  category        VARCHAR(100)?    -- Grouping category
  timestamp       TIMESTAMPTZ      -- When the event occurred
  created_at      TIMESTAMPTZ DEFAULT now()
}

-- Indexes on notifications:
-- (user_id)
-- (notification_type)
-- (is_read)
-- (timestamp)
-- (user_id, is_read, timestamp DESC)
-- (user_id, notification_type, created_at DESC)

-- Audit Logs Table
audit_logs {
  id              UUID PRIMARY KEY DEFAULT uuid()
  entity_type     VARCHAR(100)     -- 'Claim', 'Insurer', 'Plan', etc.
  entity_id       UUID             -- ID of the entity
  user_id         UUID? FK users(id) ON DELETE SET NULL
  action          ENUM(CREATE, UPDATE, DELETE, RESTORE)
  field_name      VARCHAR(100)?    -- Which field changed (for UPDATE)
  old_value       TEXT?            -- Previous value (stringified)
  new_value       TEXT?            -- New value (stringified)
  change_reason   VARCHAR(500)?    -- Optional reason for the change
  timestamp       TIMESTAMPTZ      -- When the change occurred
  created_at      TIMESTAMPTZ DEFAULT now()
}

-- Indexes on audit_logs:
-- (entity_type)
-- (entity_id)
-- (user_id)
-- (timestamp)
-- (entity_type, entity_id, timestamp DESC)
-- (action, timestamp DESC)
```

### Related Tables (Read Only in Analytics)

```sql
-- Claims Table (owned by Claims module)
claims {
  id               UUID PRIMARY KEY
  claim_number     VARCHAR(20) UNIQUE
  hospital_visit_id UUID FK hospital_visits(id)
  corporate_id     UUID FK corporates(id)
  plan_id          UUID FK plans(id)
  insurer_id       UUID FK insurers(id)
  claim_status     ENUM(Pending, Approved, Rejected, Paid, OnHold)
  amount_claimed   DECIMAL(12,2)
  approved_amount  DECIMAL(12,2)?
  treatment_category VARCHAR(100)?
  priority         ENUM(Low, Normal, High)
  notes            TEXT?
  created_at       TIMESTAMPTZ
  updated_at       TIMESTAMPTZ
}

-- Claim Events Table (owned by Claims module)
claim_events {
  id              UUID PRIMARY KEY
  claim_id        UUID FK claims(id)
  actor_user_id   UUID? FK users(id)
  actor_name      VARCHAR(100)
  actor_role      VARCHAR(50)
  action          VARCHAR(50)  -- ClaimAction enum value
  status_from     ENUM?
  status_to       ENUM
  event_note      TEXT?
  timestamp       TIMESTAMPTZ
}

-- Employees Table (owned by Dev A)
employees {
  id               UUID PRIMARY KEY
  corporate_id     UUID FK corporates(id)
  plan_id          UUID FK plans(id)
  designation      VARCHAR(100)
  department       VARCHAR(100)
  coverage_amount  DECIMAL(12,2)
  used_amount      DECIMAL(12,2) DEFAULT 0
  status           ENUM(Active, Inactive, Suspended, Terminated)
}

-- Corporates Table (owned by Dev A)
corporates {
  id               UUID PRIMARY KEY
  name             VARCHAR(255)
  insurer_id       UUID FK insurers(id)
  employee_count   INT
  total_amount_used DECIMAL(12,2) DEFAULT 0
  status           ENUM(Active, Inactive, Suspended)
}

-- Hospitals Table (owned by Phase 1)
hospitals {
  id               UUID PRIMARY KEY
  hospital_name    VARCHAR(255)
  city             VARCHAR(100)
}
```

---

## API Endpoints

### Complete Endpoint Checklist

### Notifications Endpoints

```
GET    /notifications
  Query: { page, limit, notificationType?, isRead?, severity? }
  Response: { items: NotificationDto[], total, page, limit }
  Guard: @Auth()
  Notes: Returns only current user's notifications. Sorted by timestamp DESC.

PATCH  /notifications/:id/read
  Response: NotificationDto
  Guard: @Auth()
  Notes: Verifies notification belongs to current user before marking read.

DELETE /notifications/:id
  Response: { success: boolean }
  Guard: @Auth()
  Notes: Verifies notification belongs to current user before deleting.

GET    /notifications/unread-count
  Response: { count: number }
  Guard: @Auth()
  Notes: Count of isRead=false for current user.
```

### Audit Endpoints

```
GET    /audit/logs
  Query: { entityType?, userId?, action?, startDate?, endDate?, page, limit }
  Response: { items: AuditLogDto[], total, page, limit }
  Guard: @Auth(), @Roles('insurer', 'corporate')
  Notes: Insurer sees all. Corporate sees only own entities.

GET    /audit/entity/:type/:id
  Response: { items: AuditLogDto[], total, page, limit }
  Guard: @Auth()
  Notes: Full change history for a specific entity. Sorted by timestamp DESC.
```

### Analytics Endpoints

```
GET    /analytics/dashboard
  Response: AnalyticsDashboardDto (matches frontend Analytics interface)
  Guard: @Auth()
  Notes: Role-aware. Insurer sees all under their umbrella.
         Corporate sees own data. Hospital sees own data.

GET    /analytics/claims
  Query: { startDate?, endDate? }
  Response: ClaimsAnalyticsDto
  Guard: @Auth(), @Roles('insurer', 'corporate')
  Notes: Detailed claims breakdown with optional date range filter.

GET    /analytics/coverage
  Response: CoverageAnalyticsDto
  Guard: @Auth(), @Roles('insurer', 'corporate')
  Notes: Coverage utilization across employees and plans.
```

---

## Event System Design

### Architecture

```
┌──────────────┐     EventEmitter2      ┌─────────────────────────────┐
│  Claims      │ ─── claim.status ───→  │  ClaimNotificationProducer  │
│  Module      │     _changed           │  (listener)                 │
└──────────────┘                        └──────────┬──────────────────┘
                                                   │
┌──────────────┐     EventEmitter2      ┌──────────▼──────────────────┐
│  Dependents  │ ── dependent.approved  │  NotificationsService       │
│  Module      │ ── dependent.rejected  │  .createNotification()      │
│  (Dev A)     │         │              └──────────┬──────────────────┘
└──────────────┘         │                         │
                         ▼                         ▼
               ┌─────────────────────┐  ┌──────────────────────────┐
               │ DependentNotif.     │  │ InAppNotificationService │
               │ Producer (listener) │  │ .send(userId, notif)     │
               └─────────────────────┘  └──────────┬───────────────┘
                                                   │
                                        ┌──────────▼───────────────┐
                                        │  AppGateway (WebSocket)  │
                                        │  .sendToUser(userId,     │
                                        │   'notification', data)  │
                                        └──────────────────────────┘
```

### Event Payloads

**`claim.status_changed` Event:**
```typescript
interface ClaimStatusChangedEvent {
  claimId: string;
  claimNumber: string;
  statusFrom: ClaimStatus;
  statusTo: ClaimStatus;
  actorUserId: string;
  actorRole: string;
  approvedAmount?: number;
  eventNote?: string;
  // Populated by producer via DB lookup:
  // corporateId, insurerId, hospitalVisitId → used to find recipient userIds
}
```

**`dependent.approved` Event:**
```typescript
interface DependentApprovedEvent {
  dependentId: string;
  employeeId: string;
  dependentName: string;
  approverName: string;
}
```

**`dependent.rejected` Event:**
```typescript
interface DependentRejectedEvent {
  dependentId: string;
  employeeId: string;
  dependentName: string;
  reason: string;
}
```

### Adding Events to Claims Module

In `server/src/modules/claims/services/claim-processing.service.ts`, after each status transition:

```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ClaimProcessingService {
  constructor(
    // ... existing deps
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async approveClaim(claimId, data, user) {
    // ... existing approval logic ...
    
    // After successful status update:
    this.eventEmitter.emit('claim.status_changed', {
      claimId,
      claimNumber: claim.claimNumber,
      statusFrom: claim.claimStatus,
      statusTo: 'Approved',
      actorUserId: user.id,
      actorRole: user.role,
      approvedAmount: data.approvedAmount,
      eventNote: data.eventNote,
    });
  }

  // Same pattern for rejectClaim(), putOnHold(), markAsPaid()
}
```

---

## WebSocket Integration

### Current State

The existing `AppGateway` in `server/src/websockets/gateway.ts` is minimal:
- Has `@WebSocketServer() server`
- Handles basic `message` event
- No user authentication or room management

### Required Changes

```typescript
// server/src/websockets/gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' } })
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token 
        || client.handshake.headers?.authorization?.replace('Bearer ', '');
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      client.join(`user:${userId}`);
      client.data.userId = userId;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Room cleanup is automatic in Socket.IO
  }

  // Public method for other services to call
  sendToUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }
}
```

### Client-Side Integration

```typescript
// Frontend Socket.IO connection
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: localStorage.getItem('access_token') },
});

socket.on('notification', (notification) => {
  // Add to notification panel, show toast, update unread count
});
```

---

## Frontend Integration

### Notification Panel Mapping

The existing `NotificationPanel.tsx` component expects `AlertNotification[]`:

```typescript
// Frontend type (client/src/types/notification.d.ts)
interface AlertNotification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'claims' | 'policies' | 'dependents' | 'messaging' | string;
  timestamp: string;
  isRead: boolean;
}
```

**Backend → Frontend mapping:**

| Backend Prisma Field | Frontend Field | Transform |
|---------------------|---------------|-----------|
| `id` | `id` | Direct |
| `title` | `title` | Direct |
| `message` | `message` | Direct |
| `severity` | `severity` | Direct (same enum values) |
| `notificationType` | `category` | Map: `claim_status` → `claims`, `policy_update` → `policies`, `dependent_request` → `dependents`, `messaging_alert` → `messaging` |
| `timestamp` | `timestamp` | ISO string |
| `isRead` | `isRead` | Direct |

### Dashboard Data Mapping

The existing frontend dashboards use hardcoded JSON. The `GET /analytics/dashboard` response is shaped to match:

**Frontend type (client/src/types/analytics.d.ts):**
```typescript
interface Analytics {
  claimsByStatus: ClaimsByStatus;      // { Pending, Approved, Rejected }
  totalClaims: number;
  totalClaimValue: number;
  approvedValueTotal: number;
  monthlyTrends: MonthlyTrend[];       // { month, count, value }[]
  avgProcessingTimeHours: number;
  topHospitalsByAmount: HospitalByAmount[];  // { hospitalId, hospitalName, totalAmount }[]
  claimsPerCorporate: ClaimsPerCorporate[];  // { corporateId, corporateName, count, value }[]
  rejectionRate: number;
  fraudFlaggedCount: number;           // 0 (stub)
}
```

**No frontend changes needed** — the API response shape matches the existing types. The frontend just needs to replace hardcoded JSON imports with API calls to `GET /analytics/dashboard`.

---

## Code Structure

### Notifications Module Directory

```
src/modules/notifications/
├── notifications.module.ts           # Module definition
├── notifications.controller.ts       # REST endpoints
├── notifications.service.ts          # Business logic orchestration
├── repositories/
│   └── notifications.repository.ts   # Prisma data access
├── dto/
│   ├── create-notification.dto.ts    # (exists) Title, message, type
│   ├── bulk-notification.dto.ts      # (exists) UserIds[], title, message, type
│   └── notification-preferences.dto.ts # (exists)
├── entities/
│   └── notification.entity.ts        # (exists) Interface
├── producers/
│   ├── claim-notification.producer.ts     # @OnEvent('claim.status_changed')
│   └── dependent-notification.producer.ts # @OnEvent('dependent.approved/rejected')
├── services/
│   ├── email-notification.service.ts      # (stub — future)
│   ├── push-notification.service.ts       # (stub — future)
│   └── in-app-notification.service.ts     # Persist + WebSocket push
└── templates/
    ├── claim-approved.template.ts         # (exists)
    ├── claim-rejected.template.ts         # NEW
    ├── claim-on-hold.template.ts          # NEW
    ├── claim-submitted.template.ts        # NEW
    ├── payment-processed.template.ts      # (exists)
    ├── policy-updated.template.ts         # (exists)
    ├── dependent-approved.template.ts     # NEW
    └── dependent-rejected.template.ts     # NEW
```

### Audit Module Directory

```
src/modules/audit/
├── audit.module.ts                   # Module definition
├── audit.controller.ts               # NEW — REST endpoints
├── audit.service.ts                  # Business logic
├── decorators/
│   └── auditable.decorator.ts        # (exists) @Auditable(entityType)
├── dto/
│   ├── audit-entry.dto.ts            # (exists)
│   └── audit-query.dto.ts            # (exists)
├── entities/
│   └── audit-log.entity.ts           # (exists) Interface
├── interceptors/
│   ├── audit-log.interceptor.ts      # Full interceptor implementation
│   └── audit.interceptor.ts          # (can be removed or merged)
└── repositories/
    └── audit-logs.repository.ts      # Prisma data access
```

### Analytics Module Directory

```
src/modules/analytics/
├── analytics.module.ts               # Module definition
├── analytics.controller.ts           # REST endpoints
├── analytics.service.ts              # Prisma aggregate queries
├── dto/
│   ├── analytics-report.dto.ts       # (exists)
│   ├── analytics-dashboard.dto.ts    # NEW — matches frontend Analytics type
│   ├── claims-analytics.dto.ts       # NEW
│   ├── coverage-analytics.dto.ts     # NEW
│   ├── fraud-detection.dto.ts        # (exists)
│   └── trend-analysis.dto.ts         # (exists)
├── services/
│   ├── fraud-detection.service.ts    # STUB (deferred)
│   ├── report-generator.service.ts   # STUB (deferred)
│   └── trend-analysis.service.ts     # STUB (deferred)
└── utils/
    └── data-aggregation.util.ts      # (exists) Basic utility
```

---

## Implementation Checklist

### Prerequisites
- [ ] Install `@nestjs/event-emitter` in server
- [ ] Register `EventEmitterModule.forRoot()` in `AppModule`
- [ ] Verify Prisma models for Notification and AuditLog exist
- [ ] Verify all scaffolded files are present

### Week 7: Notifications + Audit Start

#### Notifications Module
- [ ] Implement `notifications.repository.ts` (create, findByUserId, markAsRead, delete, getUnreadCount, createMany)
- [ ] Implement `notifications.service.ts` (createNotification, getUserNotifications, markAsRead, deleteNotification, getUnreadCount, createBulkNotifications)
- [ ] Implement `notifications.controller.ts` (GET /notifications, PATCH /:id/read, DELETE /:id, GET /unread-count)
- [ ] Create new templates (ClaimRejected, ClaimOnHold, ClaimSubmitted, DependentApproved, DependentRejected)
- [ ] Implement `claim-notification.producer.ts` (@OnEvent listener)
- [ ] Implement `dependent-notification.producer.ts` (@OnEvent listener)
- [ ] Extend `AppGateway` with JWT room management and `sendToUser()`
- [ ] Implement `in-app-notification.service.ts` (persist + WebSocket push)
- [ ] Update `notifications.module.ts` (imports, providers, exports)
- [ ] Update `WebsocketsModule` (register and export gateway)
- [ ] Add event emissions to `ClaimProcessingService`
- [ ] Coordinate with Dev A for dependent event emissions
- [ ] Test: create claim → notification appears for insurer user
- [ ] Test: approve claim → notification appears for patient
- [ ] Test: WebSocket receives real-time notification

#### Audit Module
- [ ] Implement `audit-logs.repository.ts` (create, createMany, findAll, findByEntity)
- [ ] Implement `audit.service.ts` (log, getLogs, getEntityHistory)
- [ ] Implement `audit-log.interceptor.ts` (full interceptor with old/new comparison)
- [ ] Create `audit.controller.ts` (GET /audit/logs, GET /audit/entity/:type/:id)
- [ ] Update `audit.module.ts` (imports, providers, exports)
- [ ] Apply `@Auditable()` to claims mutation endpoints
- [ ] Apply `@Auditable()` to insurer mutation endpoints
- [ ] Test: approve claim → audit log entry exists
- [ ] Test: GET /audit/logs returns filtered results
- [ ] Test: GET /audit/entity/Claim/:id returns history

### Week 8: Analytics + Integration

#### Analytics Module
- [ ] Create `analytics-dashboard.dto.ts` (matches frontend Analytics interface)
- [ ] Create `claims-analytics.dto.ts`
- [ ] Create `coverage-analytics.dto.ts`
- [ ] Implement `analytics.service.ts` (getDashboard, getClaimsAnalytics, getCoverageAnalytics)
- [ ] Implement `analytics.controller.ts` (GET /dashboard, GET /claims, GET /coverage)
- [ ] Update `analytics.module.ts` (imports, providers)
- [ ] Add TODO stubs to fraud-detection.service.ts
- [ ] Add TODO stubs to trend-analysis.service.ts
- [ ] Test: GET /analytics/dashboard as insurer → full Analytics response
- [ ] Test: GET /analytics/dashboard as corporate → scoped response
- [ ] Test: GET /analytics/claims with date range
- [ ] Test: GET /analytics/coverage returns utilization stats
- [ ] Verify response matches frontend `Analytics` type exactly

#### Final Integration
- [ ] Run `npx nest build` — all modules compile
- [ ] End-to-end test: submit claim → notification + audit log + analytics update
- [ ] Test WebSocket connection with JWT auth
- [ ] Verify all endpoints with Postman
- [ ] Remove any remaining `@Public()` decorators
- [ ] Verify role-based access on all endpoints

---

## Key Validation Rules

### Notifications Module
- Only the notification owner can mark as read or delete
- `notificationType` must be a valid enum value
- `severity` must be a valid enum value
- `userId` is extracted from JWT — users cannot see others' notifications
- Bulk notifications require valid user IDs

### Audit Module
- Audit logs are append-only — no update or delete endpoints
- `entityType` should match a known model name (Claim, Insurer, Plan, etc.)
- Date range filters use ISO 8601 format
- Only `insurer` and `corporate` roles can query audit logs
- All users can view entity-specific history (for entities they have access to)

### Analytics Module
- Data is always scoped by the requesting user's role and organization
- Date ranges default to last 12 months if not specified
- `fraudFlaggedCount` always returns 0 (deferred)
- Empty datasets return zero values, not errors
- Decimal amounts are serialized as numbers (handled by `TransformInterceptor`)

---

## Verification Checklist

| Check | How |
|-------|-----|
| All modules compile | `npx nest build` after completing each module |
| Notifications persist | Create claim → check `GET /notifications` for insurer user |
| WebSocket push works | Connect Socket.IO client → approve claim → receive `notification` event |
| Audit logs capture changes | Approve claim → `GET /audit/logs?entityType=Claim` shows status change |
| Audit per-field tracking | Approve claim → audit shows `fieldName=claimStatus`, `oldValue=Pending`, `newValue=Approved` |
| Analytics role scoping | Same endpoint returns different data for insurer vs corporate |
| Analytics shape matches frontend | Compare `GET /analytics/dashboard` JSON with `client/src/types/analytics.d.ts` |
| No merge conflicts | Each PR only touches files inside module folder; shared file changes in separate coordinated PR |
| Event system works | Add `console.log` in producer to verify events are received |
| Guards work | Test unauthenticated request → 401; wrong role → 403 |
