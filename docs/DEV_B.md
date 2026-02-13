# Plan: Dev B — Backend Module Implementation (7-8 Weeks)

**TL;DR:** You own 8 modules: `hospitals`, `insurers`, `claims`, `messaging`, `notifications`, `file-upload`, `analytics`, `audit`. Everything is scaffolded but empty — no route handlers, no service logic, no repository queries. The plan builds bottom-up: foundational modules first (hospitals, insurers), then the critical claims workflow, then messaging/notifications, and finally analytics/audit. You'll use `@Public()` decorator during weeks 1-2 while Dev A builds auth, then wire in guards once auth is ready.

---

## Phase 0 — Shared Setup (Days 1-2, coordinate with Dev A)

Both devs do this together once to avoid conflicts:

1. **Wire `app.module.ts`** — import all 14 feature modules. One dev does this, the other reviews. This file is the biggest conflict risk; touch it as rarely as possible after this.

2. **Bootstrap `main.ts`** — add global `ValidationPipe`, `HttpExceptionFilter`, `TransformInterceptor`, CORS config, Swagger setup. One dev commits this.

3. **Implement shared DTOs** in `server/src/shared/dtos/` — `PaginationDto` (page, limit, sortBy, order), `FilterDto`, `ResponseDto<T>` (data, message, statusCode). These are stubs today.

4. **Agree on auth contract with Dev A:**
   - JWT payload: `{ sub: string, role: UserRole, email: string, orgId?: string }`
   - Roles enum: `ADMIN`, `CORPORATE`, `HOSPITAL`, `INSURER`, `PATIENT`
   - `GET /auth/me` response shape

5. **Decide file storage:** pick Supabase Storage or local disk for now (can swap later since the provider is abstracted). Recommend starting with **local disk** and switching to Supabase when ready.

---

## Phase 1 — Hospitals + Insurers (Weeks 1-2)

These are standalone CRUD modules with no heavy cross-dependencies. Use `@Public()` on all endpoints while Dev A builds auth.

**Branch:** `feature/hospitals-crud`, `feature/insurers-crud`

### Hospitals Module (`server/src/modules/hospitals/`)

| Step | What to do |
|------|------------|
| 1 | Inject `PrismaService` into `hospitals.repository.ts` and implement `create`, `findById`, `findAll` (with pagination + city filter), `update` |
| 2 | Create missing files: `hospital-emergency-contacts.repository.ts`, `hospital-visits.repository.ts`, `hospital-visit.dto.ts`, `hospital-response.dto.ts` |
| 3 | Implement `hospitals.service.ts` — CRUD orchestration, call repository methods |
| 4 | Implement `hospitals.controller.ts` — 7 endpoints: `POST /hospitals`, `GET /hospitals/:id`, `PUT /hospitals/:id`, `GET /hospitals`, `POST /hospitals/:id/emergency-contacts`, `GET /hospitals/:id/visits`, `POST /hospitals/:id/visits` |
| 5 | Add `class-validator` decorators to all DTOs (`@IsString`, `@IsEnum(HospitalType)`, `@IsOptional`, etc.) |
| 6 | Wire `hospital-finder.service.ts` for geo-search (lat/lng filtering) |

### Insurers Module (`server/src/modules/insurers/`)

| Step | What to do |
|------|------------|
| 1 | Inject `PrismaService` into `insurers.repository.ts` |
| 2 | Create missing files: `plan.entity.ts`, `lab.entity.ts`, `plans.repository.ts`, `labs.repository.ts`, `create-insurer.dto.ts`, `create-plan.dto.ts`, `insurer-response.dto.ts` |
| 3 | Implement `insurers.service.ts` — insurer CRUD + plan CRUD + lab CRUD |
| 4 | Implement `insurers.controller.ts` — 10 endpoints: `POST /insurers`, `GET /insurers/:id`, `PUT /insurers/:id`, `GET/POST /insurers/:id/plans`, `PUT/DELETE /plans/:id`, `GET/POST /insurers/:id/labs`, `GET /labs/:id` |
| 5 | Validate DTOs: `sumInsured` as number, `coveredServices` as JSON, plan code uniqueness |

**End of Phase 1 deliverable:** Both modules fully working with Postman-testable endpoints (behind `@Public()`).

---

## Phase 2 — Claims Core (Weeks 3-4) — CRITICAL PATH

**Branch:** `feature/claims-core`

This is the biggest and most complex module. Build it in layers.

### Layer 1: Basic CRUD (Week 3, days 1-3)

| Step | What to do |
|------|------------|
| 1 | Inject `PrismaService` into `claims.repository.ts` |
| 2 | Create missing: `claim-events.repository.ts`, `claim-documents.repository.ts` |
| 3 | Implement `create` (auto-generate `claimNumber`), `findById` (with includes: hospitalVisit, plan, insurer, corporate, claimEvents), `findAll` (filtered by status, role, corporateId, insurerId — use Prisma `where` chaining) |
| 4 | Implement `approve-claim.dto.ts`, `claim-response.dto.ts`, `claim-event.dto.ts` with validators |
| 5 | Implement `claims.controller.ts` — `POST /claims`, `GET /claims/:id`, `GET /claims` |

### Layer 2: State Machine + Approval Workflow (Week 3, days 4-5)

| Step | What to do |
|------|------------|
| 1 | Create `status-transitions.ts` — define valid transitions map: `{ Pending: [Approved, Rejected, OnHold], OnHold: [Approved, Rejected], Approved: [Paid] }` — `Rejected` and `Paid` are terminal |
| 2 | Implement `PATCH /claims/:id/approve`, `PATCH /claims/:id/reject`, `PATCH /claims/:id/on-hold` — each validates transition legality, creates a `ClaimEvent`, updates status |
| 3 | Wire `claim-validation.service.ts` — check coverage limits, plan validity, duplicate claim detection |
| 4 | Wire `claim-processing.service.ts` — orchestrate approve/reject with event logging |

### Layer 3: Documents + Events API (Week 4)

| Step | What to do |
|------|------------|
| 1 | Implement `GET /claims/:id/events` — return claim event timeline |
| 2 | Implement `POST /claims/:id/documents` — upload claim documents (integrate with file-upload module) |
| 3 | Implement `GET /claims/:id/documents` — list claim documents |
| 4 | Wire `claim-audit.service.ts` — log every status change to audit trail |
| 5 | **Remove `@Public()` and add real guards** — by now Dev A should have auth ready. Add `@Roles('HOSPITAL', 'INSURER', 'CORPORATE')` to appropriate endpoints |

**End of Phase 2 deliverable:** Full claims lifecycle working — submit, approve, reject, hold, pay — with event trail and documents.

---

## Phase 3 — File Upload + Messaging (Weeks 5-6)

### File Upload Module (`server/src/modules/file-upload/`)

**Branch:** `feature/file-upload`

| Step | What to do |
|------|------------|
| 1 | **Fix `file-upload.module.ts`** — it doesn't register controller/service; add them |
| 2 | Implement local disk provider first (save to `uploads/` folder), abstract behind an interface so you can swap to Supabase later |
| 3 | Create `upload-response.dto.ts`, `file-metadata.dto.ts` |
| 4 | Implement `POST /upload` (multipart, use `@UseInterceptors(FileInterceptor)` from `@nestjs/platform-express`), `DELETE /upload/:fileId`, `GET /upload/:fileId/metadata` |
| 5 | `pdf-extraction.service.ts` already has PDF logic — integrate it into the upload flow for claim documents |

### Messaging Module (`server/src/modules/messaging/`)

**Branch:** `feature/messaging`

| Step | What to do |
|------|------------|
| 1 | **Fix `messaging.controller.ts`** — change route from `'claims'` to nest under claims: `@Controller('claims/:claimId/messages')` |
| 2 | Create all missing files: `chat-message.entity.ts`, `chat-message-attachment.entity.ts`, `chat-messages.repository.ts`, `chat-attachments.repository.ts`, `send-message.dto.ts`, `message-response.dto.ts` |
| 3 | Implement REST endpoints: `POST /claims/:id/messages`, `GET /claims/:id/messages` (paginated), `PUT`, `DELETE` |
| 4 | Create `messaging.gateway.ts` (WebSocket) — extend existing `websockets/gateway.ts` pattern. Events: `claim-message-new`, `claim-message-read`, `user-typing` |
| 5 | Integrate with file-upload for message attachments |

**End of Phase 3 deliverable:** File upload working, real-time claim-scoped chat functional.

---

## Phase 4 — Notifications + Audit + Analytics (Weeks 7-8)

These are supporting modules — important but lower risk.

### Notifications (`server/src/modules/notifications/`)

**Branch:** `feature/notifications`

| Step | What to do |
|------|------------|
| 1 | Implement `notifications.repository.ts` — inject PrismaService |
| 2 | Implement controller: `GET /notifications`, `PATCH /notifications/:id/read`, `DELETE /notifications/:id`, `GET /notifications/unread-count` |
| 3 | Wire `claim-notification.producer.ts` — emit notifications on claim status changes (use NestJS `EventEmitter2`) |
| 4 | Wire `in-app-notification.service.ts` for real-time push via WebSocket |

### Audit (`server/src/modules/audit/`)

**Branch:** `feature/audit`

| Step | What to do |
|------|------------|
| 1 | Implement `audit.service.ts` — `log(entityType, entityId, action, userId, changes)` |
| 2 | Implement `audit-log.interceptor.ts` — auto-log on `POST/PUT/PATCH/DELETE` for decorated endpoints |
| 3 | Create audit controller: `GET /audit/logs` (filtered), `GET /audit/entity/:type/:id` |
| 4 | Apply `@Auditable()` decorator to claims and insurer mutation endpoints |

### Analytics (`server/src/modules/analytics/`)

**Branch:** `feature/analytics`

| Step | What to do |
|------|------------|
| 1 | Implement `analytics.service.ts` — Prisma aggregate queries (`_count`, `_sum`, `groupBy`) |
| 2 | Implement controller: `GET /analytics/dashboard` (role-aware), `GET /analytics/claims`, `GET /analytics/coverage` |
| 3 | Wire `fraud-detection.service.ts` — flag duplicate claims, outlier amounts |
| 4 | Wire `trend-analysis.service.ts` — monthly claim volume, approval rate trends |

---

## Verification Checklist

| Check | How |
|-------|-----|
| Each module compiles | Run `npx nest build` after completing each module |
| Endpoints work | Test every endpoint in Postman / Thunder Client as you go |
| Claims state machine | Write a Postman collection: create claim → approve → pay (happy path) and create → reject (sad path) |
| WebSocket messaging | Use Postman WebSocket or a quick Socket.IO client to test `claim-message-new` events |
| No merge conflicts | Each PR only touches files inside your module folder; shared file changes go in a separate coordinated PR |
| Integration with auth | After week 2, remove `@Public()` from all endpoints, add `@Roles()`, test with JWT from Dev A's auth module |

---

## Key Decisions

- **Build order:** hospitals/insurers → claims → messaging/upload → notifications/audit/analytics (dependency-driven)
- **Auth bypass:** use `@Public()` for weeks 1-2, swap to real guards in week 3-4 when Dev A delivers auth
- **File storage:** start with local disk, abstract behind interface, swap to Supabase later
- **Messaging route:** nest under `/claims/:id/messages` (not standalone `/messaging`) since chat is claim-scoped
- **One branch per module** to keep PRs small and reviewable

---

## Relevant Prisma Models (Quick Reference)

### Enums

| Enum | Values |
|------|--------|
| `HospitalType` | `reimbursable`, `non_reimbursable` |
| `InsurerStatus` | `Active`, `Inactive`, `Suspended` |
| `ClaimStatus` | `Pending`, `Approved`, `Rejected`, `Paid`, `OnHold` |
| `ClaimEventStatus` | `Pending`, `Approved`, `Rejected`, `Paid`, `OnHold` |
| `Priority` | `Low`, `Normal`, `High` |
| `MessageType` | `text`, `system`, `document_upload` |
| `NotificationType` | `claim_status`, `policy_update`, `dependent_request`, `messaging_alert` |
| `Severity` | `info`, `warning`, `critical` |
| `AuditAction` | `CREATE`, `UPDATE`, `DELETE`, `RESTORE` |

### Models Owned by Dev B

- **Hospital** — `id`, `userId`, `hospitalName`, `licenseNumber`, `city`, `address`, `latitude?`, `longitude?`, `emergencyPhone`, `hospitalType`, `hasEmergencyUnit`, `isActive`
- **HospitalEmergencyContact** — `id`, `hospitalId`, `contactLevel`, `designation`, `name`, `contactNumber`, `isActive` (unique: `[hospitalId, contactLevel]`)
- **HospitalVisit** — `id`, `employeeId?`, `dependentId?`, `hospitalId`, `visitDate`, `dischargeDate?`
- **Insurer** — `id`, `userId`, `companyName`, `licenseNumber`, `address`, `city`, `province`, `maxCoverageLimit`, `networkHospitalCount`, `corporateClientCount`, `status`, `operatingSince`, `isActive`
- **Plan** — `id`, `planName`, `planCode`, `insurerId`, `sumInsured`, `coveredServices` (Json), `serviceLimits` (Json), `isActive`
- **Lab** — `id`, `insurerId`, `labName`, `city`, `address`, `licenseNumber`, `contactPhone`, `contactEmail`, `testCategories` (Json), `isActive`
- **Claim** — `id`, `claimNumber`, `hospitalVisitId`, `corporateId`, `planId`, `insurerId`, `claimStatus`, `amountClaimed`, `approvedAmount`, `treatmentCategory?`, `priority`, `notes?`
- **ClaimEvent** — `id`, `claimId`, `actorUserId`, `actorName`, `actorRole`, `action`, `statusFrom?`, `statusTo`, `eventNote?`, `timestamp`
- **ClaimDocument** — `id`, `claimId`, `originalFilename`, `filePath`, `fileUrl`, `fileSizeBytes`
- **ChatMessage** — `id`, `claimId`, `senderId`, `receiverId`, `messageText`, `isRead`, `timestamp`, `messageType`
- **ChatMessageAttachment** — `id`, `messageId`, `filename`, `filePath`, `fileUrl`, `fileSizeBytes`
- **Notification** — `id`, `userId`, `notificationType`, `title`, `message`, `severity`, `relatedEntityId?`, `relatedEntityType?`, `isRead`, `actionUrl?`, `category?`, `timestamp`
- **AuditLog** — `id`, `entityType`, `entityId`, `userId?`, `action`, `fieldName?`, `oldValue?`, `newValue?`, `changeReason?`, `timestamp`

---

## Existing Shared Infrastructure (Ready to Use)

| Component | Status |
|-----------|--------|
| `PrismaModule` / `PrismaService` | Working — inject into repositories |
| `JwtAuthGuard` | Working — apply after Dev A delivers auth |
| `RolesGuard` + `@Roles()` | Working |
| `@Public()` decorator | Working — use for weeks 1-2 |
| `@CurrentUser()` decorator | Working |
| `TransformInterceptor` | Working — wraps response in `{ data, message, statusCode }` |
| `ValidationPipe` | Working — uses class-validator |
| `HttpExceptionFilter` | Working |
| Shared DTOs (`PaginationDto`, etc.) | Stubs — need implementation in Phase 0 |
| `WebsocketsModule` / `AppGateway` | Minimal stub — extend for messaging |
