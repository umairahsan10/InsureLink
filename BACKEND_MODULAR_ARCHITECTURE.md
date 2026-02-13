# InsureLink Backend - Modular Architecture Design

**Version:** 1.0  
**Date:** February 5, 2026  
**Purpose:** Enable parallel development with clear module boundaries and minimal conflicts

---

## Executive Summary

The backend will be organized into **10 core modules + 5 cross-cutting concerns** (shared infrastructure). This design allows different team members to work independently on:

- **User Management & Authentication**
- **Corporate Client Management**
- **Hospital Network Management**
- **Insurer Administration**
- **Claims Processing Workflow**
- **Patient/Dependent Management**
- **Messaging & Communication**
- **Notifications System**
- **Analytics & Reporting**
- **Audit & Compliance**

Each module has clear responsibilities, independent data models, and defined API contracts.

---

## Organizational Principles

### 1. **Domain-Driven Design (DDD)**
   - Each module represents a business domain
   - Module boundaries align with schema entities
   - Clear separation of concerns

### 2. **Independent Deployment**
   - Modules can be tested independently
   - Minimal cross-module dependencies
   - Teams can develop in parallel

### 3. **Shared Infrastructure**
   - Common utilities, guards, interceptors in `common/`
   - Shared DTOs and types in `shared/`
   - Database access layer abstraction

### 4. **Frontend-Backend Alignment**
   - Module structure mirrors frontend routes/features
   - Clear API endpoints per module
   - Easier API integration and testing

---

## Parallel Development Plan (2 Developers)

### Phase 0: Auth Contract (1-2 days)
- Agree on JWT payload fields (e.g., `sub`, `role`, `orgId`)
- Freeze roles/permissions enum
- Define `/auth/me` response shape

### Phase 1: Parallel Build (week 1)
- **Dev A:** implement `auth` + `users`
- **Dev B:** scaffold and build non-auth modules using a temporary `@Public()` or mock guard

### Phase 2: Integration (week 2)
- **Dev A:** finalize guards, roles, and policy decorators
- **Dev B:** wire guards into endpoints, remove mocks, add role checks

### Conflict Avoidance Rules
- One owner per module folder under `src/modules/`
- Changes to `common/`, `shared/`, `config/`, `websockets/` require both-dev review
- Only one dev edits `app.module.ts` per sprint; other dev queues module registrations

---

## Backend Module Structure

```
server/
├── src/
│   ├── main.ts
│   ├── app.module.ts (imports all feature modules)
│   │
│   ├── common/                          # Cross-cutting concerns
│   │   ├── decorators/                  # Custom decorators
│   │   ├── filters/                     # Exception filters
│   │   ├── guards/                      # Auth guards, role guards
│   │   ├── interceptors/                # Logging, error handling
│   │   ├── pipes/                       # Validation pipes
│   │   ├── utils/                       # Helper functions
│   │   ├── constants/                   # App-wide constants
│   │   ├── types/                       # Global types
│   │   └── index.ts
│   │
│   ├── config/                          # Configuration
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── env.validation.ts
│   │   └── index.ts
│   │
│   ├── modules/                         # Feature modules
│   │   │
│   │   ├── auth/                        # MODULE 1: Authentication & Authorization
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/              # JWT, Local strategies
│   │   │   ├── guards/                  # Auth guards
│   │   │   ├── decorators/              # @CurrentUser, @Roles
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   └── token-response.dto.ts
│   │   │   └── test/
│   │   │
│   │   ├── users/                       # MODULE 2: User Management
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   ├── repositories/
│   │   │   │   └── users.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   ├── update-user.dto.ts
│   │   │   │   └── user-response.dto.ts
│   │   │   └── test/
│   │   │
│   │   ├── corporates/                  # MODULE 3: Corporate Management
│   │   │   ├── corporates.module.ts
│   │   │   ├── corporates.controller.ts
│   │   │   ├── corporates.service.ts
│   │   │   ├── entities/
│   │   │   │   └── corporate.entity.ts
│   │   │   ├── repositories/
│   │   │   │   └── corporates.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-corporate.dto.ts
│   │   │   │   ├── update-corporate.dto.ts
│   │   │   │   └── corporate-response.dto.ts
│   │   │   ├── events/                  # Business events
│   │   │   │   ├── corporate-created.event.ts
│   │   │   │   └── corporate-updated.event.ts
│   │   │   └── test/
│   │   │
│   │   ├── employees/                   # MODULE 4: Employee Management
│   │   │   ├── employees.module.ts
│   │   │   ├── employees.controller.ts
│   │   │   ├── employees.service.ts
│   │   │   ├── entities/
│   │   │   │   └── employee.entity.ts
│   │   │   ├── repositories/
│   │   │   │   └── employees.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-employee.dto.ts
│   │   │   │   ├── update-employee.dto.ts
│   │   │   │   └── employee-response.dto.ts
│   │   │   ├── services/
│   │   │   │   └── coverage-calculator.service.ts
│   │   │   └── test/
│   │   │
│   │   ├── dependents/                  # MODULE 5: Dependent Management
│   │   │   ├── dependents.module.ts
│   │   │   ├── dependents.controller.ts
│   │   │   ├── dependents.service.ts
│   │   │   ├── entities/
│   │   │   │   └── dependent.entity.ts
│   │   │   ├── repositories/
│   │   │   │   └── dependents.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-dependent.dto.ts
│   │   │   │   ├── update-dependent.dto.ts
│   │   │   │   └── dependent-response.dto.ts
│   │   │   ├── workflows/              # Approval workflows
│   │   │   │   └── dependent-approval.workflow.ts
│   │   │   └── test/
│   │   │
│   │   ├── patients/                    # MODULE 6: Patient Management
│   │   │   ├── patients.module.ts
│   │   │   ├── patients.controller.ts
│   │   │   ├── patients.service.ts
│   │   │   ├── entities/
│   │   │   │   └── patient.entity.ts
│   │   │   ├── repositories/
│   │   │   │   └── patients.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── patient-profile.dto.ts
│   │   │   │   └── patient-coverage.dto.ts
│   │   │   └── test/
│   │   │
│   │   ├── hospitals/                   # MODULE 7: Hospital Network
│   │   │   ├── hospitals.module.ts
│   │   │   ├── hospitals.controller.ts
│   │   │   ├── hospitals.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── hospital.entity.ts
│   │   │   │   ├── hospital-emergency-contact.entity.ts
│   │   │   │   └── hospital-visit.entity.ts
│   │   │   ├── repositories/
│   │   │   │   ├── hospitals.repository.ts
│   │   │   │   ├── hospital-emergency-contacts.repository.ts
│   │   │   │   └── hospital-visits.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-hospital.dto.ts
│   │   │   │   ├── hospital-visit.dto.ts
│   │   │   │   └── hospital-response.dto.ts
│   │   │   ├── services/
│   │   │   │   └── hospital-finder.service.ts
│   │   │   └── test/
│   │   │
│   │   ├── insurers/                    # MODULE 8: Insurer Management
│   │   │   ├── insurers.module.ts
│   │   │   ├── insurers.controller.ts
│   │   │   ├── insurers.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── insurer.entity.ts
│   │   │   │   ├── plan.entity.ts
│   │   │   │   └── lab.entity.ts
│   │   │   ├── repositories/
│   │   │   │   ├── insurers.repository.ts
│   │   │   │   ├── plans.repository.ts
│   │   │   │   └── labs.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-insurer.dto.ts
│   │   │   │   ├── create-plan.dto.ts
│   │   │   │   └── insurer-response.dto.ts
│   │   │   └── test/
│   │   │
│   │   ├── claims/                      # MODULE 9: Claims Processing (CRITICAL)
│   │   │   ├── claims.module.ts
│   │   │   ├── claims.controller.ts
│   │   │   ├── claims.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── claim.entity.ts
│   │   │   │   ├── claim-event.entity.ts
│   │   │   │   └── claim-document.entity.ts
│   │   │   ├── repositories/
│   │   │   │   ├── claims.repository.ts
│   │   │   │   ├── claim-events.repository.ts
│   │   │   │   └── claim-documents.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-claim.dto.ts
│   │   │   │   ├── approve-claim.dto.ts
│   │   │   │   ├── claim-response.dto.ts
│   │   │   │   └── claim-event.dto.ts
│   │   │   ├── workflows/              # State machine & approval flows
│   │   │   │   ├── claim-workflow.ts
│   │   │   │   ├── claim-approval.workflow.ts
│   │   │   │   └── status-transitions.ts
│   │   │   ├── services/
│   │   │   │   ├── claim-validation.service.ts
│   │   │   │   ├── claim-processing.service.ts
│   │   │   │   └── claim-audit.service.ts
│   │   │   └── test/
│   │   │
│   │   ├── messaging/                   # MODULE 10: Messaging & Collaboration
│   │   │   ├── messaging.module.ts
│   │   │   ├── messaging.controller.ts
│   │   │   ├── messaging.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── chat-message.entity.ts
│   │   │   │   └── chat-message-attachment.entity.ts
│   │   │   ├── repositories/
│   │   │   │   ├── chat-messages.repository.ts
│   │   │   │   └── chat-attachments.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── send-message.dto.ts
│   │   │   │   └── message-response.dto.ts
│   │   │   ├── gateways/
│   │   │   │   └── messaging.gateway.ts (WebSocket)
│   │   │   └── test/
│   │   │
│   │   ├── notifications/               # MODULE 11: Notifications (Supporting)
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── entities/
│   │   │   │   └── notification.entity.ts
│   │   │   ├── repositories/
│   │   │   │   └── notifications.repository.ts
│   │   │   ├── dto/
│   │   │   │   └── notification-response.dto.ts
│   │   │   ├── producers/               # Notification triggers
│   │   │   │   ├── claim-notification.producer.ts
│   │   │   │   └── dependent-notification.producer.ts
│   │   │   └── test/
│   │   │
│   │   ├── file-upload/                 # MODULE 12: File Management
│   │   │   ├── file-upload.module.ts
│   │   │   ├── file-upload.controller.ts
│   │   │   ├── file-upload.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── upload-response.dto.ts
│   │   │   │   └── file-metadata.dto.ts
│   │   │   ├── providers/
│   │   │   │   └── supabase.provider.ts
│   │   │   └── test/
│   │   │
│   │   ├── analytics/                   # MODULE 13: Analytics & Reporting
│   │   │   ├── analytics.module.ts
│   │   │   ├── analytics.controller.ts
│   │   │   ├── analytics.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── dashboard-stats.dto.ts
│   │   │   │   ├── claims-analytics.dto.ts
│   │   │   │   └── coverage-analytics.dto.ts
│   │   │   └── test/
│   │   │
│   │   ├── audit/                       # MODULE 14: Audit & Compliance
│   │   │   ├── audit.module.ts
│   │   │   ├── audit.service.ts
│   │   │   ├── entities/
│   │   │   │   └── audit-log.entity.ts
│   │   │   ├── repositories/
│   │   │   │   └── audit-logs.repository.ts
│   │   │   ├── interceptors/
│   │   │   │   └── audit.interceptor.ts
│   │   │   └── test/
│   │   │
│   │   └── index.ts                    # Module exports
│   │
│   ├── shared/                          # Shared infrastructure
│   │   ├── dtos/                        # Common DTOs
│   │   │   ├── pagination.dto.ts
│   │   │   ├── filter.dto.ts
│   │   │   └── response.dto.ts
│   │   ├── entities/                    # Base entities
│   │   │   └── base.entity.ts
│   │   ├── interfaces/
│   │   │   ├── repository.interface.ts
│   │   │   └── service.interface.ts
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   └── common.types.ts
│   │   └── index.ts
│   │
│   └── websockets/                      # WebSocket configuration
│       ├── events.gateway.ts
│       └── websocket.module.ts
│
└── test/
    └── e2e tests for critical workflows
```

---

## Module Responsibilities & Dependencies

### 1. **Auth Module** (Foundation)
**Responsible For:**
- User login/logout
- JWT token generation and validation
- Password hashing and verification
- Role-based access control
- OAuth integration (future)

**API Endpoints:**
```
POST   /auth/login
POST   /auth/register
POST   /auth/refresh-token
POST   /auth/logout
GET    /auth/me
```

**Dependencies:** None (base module)  
**Dependents:** All other modules (auth guards)

**Team Assignment:** 1-2 developers
**Estimated Completion:** 1-2 weeks

---

### 2. **Users Module**
**Responsible For:**
- User profile management
- User role and permission updates
- User data CRUD operations
- User search and filtering

**API Endpoints:**
```
GET    /users/:id
PUT    /users/:id
GET    /users (paginated, filtered)
DELETE /users/:id
PUT    /users/:id/role
```

**Dependencies:** Auth  
**Dependents:** All role-specific modules

**Team Assignment:** 1 developer
**Estimated Completion:** 1 week

---

### 3. **Corporates Module**
**Responsible For:**
- Corporate account creation and management
- Corporate profile updates
- Contract management
- Employee count tracking
- Corporate dashboard data

**API Endpoints:**
```
POST   /corporates
GET    /corporates/:id
PUT    /corporates/:id
GET    /corporates (paginated)
GET    /corporates/:id/stats
GET    /corporates/:id/contracts
```

**Dependencies:** Auth, Users  
**Dependents:** Employees, Notifications, Analytics

**Team Assignment:** 1 developer
**Estimated Completion:** 1.5 weeks

**Special Notes:**
- Emits `corporate-created` event → Triggers welcome notification
- Updates corporate's `total_amount_used` via Claims module feedback

---

### 4. **Employees Module**
**Responsible For:**
- Employee records management
- Employee coverage tracking
- Coverage amount calculations
- Bulk employee imports
- Employee list filtering and search

**API Endpoints:**
```
POST   /employees
GET    /employees/:id
PUT    /employees/:id
GET    /employees (by corporate, paginated)
DELETE /employees/:id
GET    /employees/:id/coverage
POST   /employees/bulk-import
```

**Dependencies:** Auth, Users, Corporates  
**Dependents:** Patients, Dependents, Claims, Analytics

**Team Assignment:** 1 developer
**Estimated Completion:** 2 weeks

**Special Notes:**
- Validates coverage dates against corporate contract dates
- Calculates coverage summary (used/available)
- Triggers notifications on coverage changes

---

### 5. **Dependents Module**
**Responsible For:**
- Dependent record management
- Dependent approval workflow
- Dependent coverage tracking
- Family relationship validation

**API Endpoints:**
```
POST   /dependents
GET    /dependents/:id
PUT    /dependents/:id
GET    /dependents/employee/:empId (paginated)
PATCH  /dependents/:id/approve
PATCH  /dependents/:id/reject
```

**Dependencies:** Auth, Users, Employees  
**Dependents:** Patients, Notifications, Analytics

**Team Assignment:** 1 developer
**Estimated Completion:** 1.5 weeks

**Special Notes:**
- Implements approval workflow (Pending → Approved/Rejected)
- Inherits coverage dates from employee
- Triggers notifications on approval/rejection

---

### 6. **Patients Module**
**Responsible For:**
- Patient profile aggregation (Employee + Dependent views)
- Patient medical history (unified view)
- Patient coverage lookup
- Patient eligibility checks

**API Endpoints:**
```
GET    /patients/:id
GET    /patients/me (current user if patient)
GET    /patients/:id/coverage
GET    /patients/:id/claims (linked to claims module)
GET    /patients/:id/hospital-visits
```

**Dependencies:** Auth, Users, Employees, Dependents  
**Dependents:** Claims, Hospitals, Messaging, Analytics

**Team Assignment:** 1 developer
**Estimated Completion:** 1 week

**Special Notes:**
- Views read-only aggregation (no create/update)
- Performance-critical for dashboard queries
- Should implement caching for coverage lookups

---

### 7. **Hospitals Module**
**Responsible For:**
- Hospital network management
- Hospital visit recording
- Hospital emergency contact management
- Hospital search and filtering by location
- Hospital availability status

**API Endpoints:**
```
POST   /hospitals (insurer registration)
GET    /hospitals/:id
PUT    /hospitals/:id
GET    /hospitals (search, filter by city)
POST   /hospitals/:id/emergency-contacts
GET    /hospitals/:id/visits (paginated)
POST   /hospitals/:id/visits (record visit)
```

**Dependencies:** Auth, Users  
**Dependents:** Claims, Notifications, Analytics

**Team Assignment:** 1 developer
**Estimated Completion:** 1.5 weeks

**Special Notes:**
- Implements geo-location based search
- Links to Hospital Finder feature (smart search)
- Records hospital visits (critical for claims)
- Smart Hospital Finder uses this data for recommendations

---

### 8. **Insurers Module**
**Responsible For:**
- Insurer account management
- Plan management (CRUD)
- Lab management
- Insurer network overview
- Insurer dashboard data

**API Endpoints:**
```
POST   /insurers
GET    /insurers/:id
PUT    /insurers/:id
GET    /insurers/:id/plans
POST   /insurers/:id/plans
PUT    /plans/:id
DELETE /plans/:id
GET    /insurers/:id/labs
POST   /insurers/:id/labs
GET    /labs/:id
```

**Dependencies:** Auth, Users  
**Dependents:** Claims (plan validation), Analytics

**Team Assignment:** 1 developer
**Estimated Completion:** 1.5 weeks

**Special Notes:**
- Plan management critical for claim validation
- Labs tied to insurer for test ordering
- Plans include service limits and coverage details

---

### 9. **Claims Module** (CRITICAL/COMPLEX)
**Responsible For:**
- Claim creation and validation
- Claim status management (state machine)
- Claim approval/rejection workflow
- Claim event audit trail
- Claim amount calculations and approvals
- Document attachment management

**API Endpoints:**
```
POST   /claims (create claim from hospital visit)
GET    /claims/:id
GET    /claims (filtered by status, user role, corporate, etc.)
PATCH  /claims/:id/approve
PATCH  /claims/:id/reject
PATCH  /claims/:id/on-hold
PUT    /claims/:id (add notes, update details)
GET    /claims/:id/events (audit trail)
GET    /claims/:id/documents
POST   /claims/:id/documents (attach file)
```

**Dependencies:** Auth, Users, Patients, Hospitals, Corporates, Insurers, File-Upload  
**Dependents:** Messaging, Notifications, Analytics, Audit, Patients (coverage updates)

**Team Assignment:** 2 developers (most complex)
**Estimated Completion:** 3-4 weeks

**Special Notes:**
- **State Machine Enforcement:** Strict status transitions
  - Pending → {Approved, Rejected, OnHold}
  - Approved → {Paid, OnHold, Rejected}
  - Rejected, Paid → (terminal)
- **Validation Rules:**
  - Hospital visit exists and is in past
  - Patient has active coverage
  - Claimed amount ≤ plan limits
  - Claimed amount ≤ available coverage
- **Audit Trail:** Every status change creates immutable event
- **Amount Tracking:** Updates employee's `used_amount` on approval
- **Updates Corporates:** Corporate's `total_amount_used` changes on approval

---

### 10. **Messaging Module**
**Responsible For:**
- Claim discussion messages (real-time chat)
- Message persistence
- Message attachment handling
- WebSocket connections for real-time updates
- Message history retrieval

**API Endpoints:**
```
POST   /claims/:id/messages (send message)
GET    /claims/:id/messages (paginated history)
PUT    /claims/:id/messages/:msgId (edit message)
DELETE /claims/:id/messages/:msgId (soft delete)
POST   /claims/:id/messages/:msgId/attachments
```

**WebSocket Events:**
```
'claim-message-new'
'claim-message-deleted'
'claim-message-read'
'user-typing'
'user-online'
```

**Dependencies:** Auth, Users, Claims, File-Upload  
**Dependents:** Notifications (new message alerts)

**Team Assignment:** 1 developer (WebSocket experience helpful)
**Estimated Completion:** 2 weeks

**Special Notes:**
- Real-time communication critical for claims workflow
- Only parties involved in claim can access messages
- WebSocket gateway handles bidirectional updates
- Attachments trigger file-upload module

---

### 11. **Notifications Module**
**Responsible For:**
- Notification creation and delivery
- Notification type management
- Notification preferences (future)
- Push notifications (future)
- Email notifications (future)

**API Endpoints:**
```
GET    /notifications (user's notifications)
GET    /notifications/:id
PATCH  /notifications/:id/read
DELETE /notifications/:id
GET    /notifications/unread-count
```

**Event Listeners:**
- Claim status changed → notify involved parties
- Dependent approved/rejected → notify employee
- New message in claim chat → notify recipients
- Coverage expired soon → notify employee/corporate

**Dependencies:** Auth, Users  
**Dependents:** Claims, Messaging, Dependents, Corporates

**Team Assignment:** 1 developer
**Estimated Completion:** 2 weeks

**Special Notes:**
- Event-driven architecture
- Triggered by other modules (Claims, Messaging, etc.)
- Stores notifications in DB for history
- Real-time updates via WebSocket

---

### 12. **File-Upload Module**
**Responsible For:**
- File upload to Supabase storage
- File metadata management
- File size validation
- File type validation
- File URL generation (signed URLs)

**API Endpoints:**
```
POST   /upload (multipart form data)
DELETE /upload/:fileId
GET    /upload/:fileId/metadata
```

**Dependencies:** Auth, Users  
**Dependents:** Claims (claim documents), Messaging (message attachments)

**Team Assignment:** 1 developer
**Estimated Completion:** 1 week

**Special Notes:**
- Supabase integration critical
- Handles both claim documents and chat attachments
- Generates signed URLs for secure access
- Tracks file metadata in database

---

### 13. **Analytics Module**
**Responsible For:**
- Dashboard statistics calculation
- Claim analytics (approval rates, amounts)
- Coverage analytics (utilization)
- Corporate performance metrics
- Insurer performance metrics
- Hospital performance metrics
- Time-series data for charts

**API Endpoints:**
```
GET    /analytics/dashboard (role-specific)
GET    /analytics/claims (filters: date range, status, etc.)
GET    /analytics/coverage (employee utilization)
GET    /analytics/corporate/:id
GET    /analytics/insurer/:id
GET    /analytics/hospital/:id
```

**Dependencies:** Claims, Corporates, Employees, Dependents, Hospitals, Insurers  
**Dependents:** None (read-only)

**Team Assignment:** 1 developer
**Estimated Completion:** 2 weeks

**Special Notes:**
- Read-only module (no mutations)
- Performance-critical for dashboard loading
- Consider caching frequently accessed stats
- Dashboard-specific aggregations per role

---

### 14. **Audit Module**
**Responsible For:**
- Audit log creation and storage
- Compliance tracking
- Change history retrieval
- Audit report generation

**API Endpoints:**
```
GET    /audit/logs (filtered by entity, date, user)
GET    /audit/logs/:id
GET    /audit/entity/:type/:id (history of entity)
```

**Interceptor:** Auto-logs all sensitive mutations  
**Dependencies:** Auth  
**Dependents:** None (audit only)

**Team Assignment:** 1 developer (lower priority)
**Estimated Completion:** 1.5 weeks

**Special Notes:**
- Immutable audit logs (no updates/deletes)
- Triggered automatically on sensitive changes
- Critical for compliance and regulatory requirements
- Can be implemented last as it's non-blocking

---

## Module Dependencies Map

```
┌─────────────────────────────────────────────────┐
│                    AUTH MODULE                  │  ← Foundation (all depend on this)
└───────────────────────┬─────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    ┌───▼────┐     ┌────▼────┐    ┌───▼────┐
    │ USERS  │     │CORPORATES├────┤EMPLOYEES├──┐
    └───┬────┘     └────┬────┘    └────┬────┘  │
        │               │              │       │
        └───────────────┼──────────────┼───────┼──────┐
                        │              │       │      │
                    ┌───▼──────┐   ┌──▼──┐   │      │
                    │DEPENDENTS│   │PATIENTS◄─┘      │
                    └───┬──────┘   └──┬───┘          │
                        │            │               │
        ┌───────────────┬┴────────────┼───────────────┘
        │               │            │
    ┌───▼────┐  ┌──────▼─────┐  ┌──▼───────┐
    │HOSPITALS│  │CLAIMS      │  │INSURERS  │
    │         │  │(CRITICAL)  │  │          │
    └────┬────┘  └───┬───┬────┘  └────┬─────┘
         │           │   │            │
         │     ┌─────┘   │            │
         │     │         │            │
    ┌────▼─────▼─────────▼──────┐    │
    │    FILE-UPLOAD            │◄───┘
    └────┬───────────────────────┘
         │
    ┌────▼────────────┬──────────┬──────────┐
    │                 │          │          │
┌───▼────┐        ┌──▼──┐   ┌──▼──┐   ┌───▼────────┐
│MESSAGING│       │NOTIFICATIONS  │   │ANALYTICS   │
└───┬────┘        └──┬──┘   └──┬──┘   └────────────┘
    │                │       │
    │                │       │
    └────────┬───────┴──────┬┘
             │              │
         ┌───▼──────────────▼────┐
         │    AUDIT (Observer)   │
         └──────────────────────┘
```

**Legend:**
- `→` → Direct dependency (imports)
- `◄` → Reverse dependency (listened by)
- Modules on same level can be developed in parallel

---

## Parallel Development Strategy

### **Phase 1: Foundation (Weeks 1-2)**
**Start these in parallel:**
- **Auth Module** (2 devs) - Essential for everything
- **Users Module** (1 dev) - User management base
- **File-Upload Module** (1 dev) - Foundation for claims/messaging

**Why:** These have no dependencies, others can start once these are ready.

### **Phase 2: Core Entities (Weeks 2-4)**
**Start once Phase 1 is 80% done:**
- **Corporates Module** (1 dev)
- **Employees Module** (1 dev)
- **Hospitals Module** (1 dev)
- **Insurers Module** (1 dev)

**Why:** These depend on Auth/Users, can proceed in parallel.

### **Phase 3: Complex Workflows (Weeks 3-6)**
**Start once Phase 2 is 80% done:**
- **Claims Module** (2 devs) - Most complex, assign best engineers
- **Dependents Module** (1 dev) - Moderate complexity
- **Patients Module** (1 dev) - Read-only aggregation

**Why:** Claims depends on entities from Phase 2.

### **Phase 4: Communication & Notifications (Weeks 5-7)**
**Start once Phase 3 is 50% done:**
- **Messaging Module** (1 dev) - Depends on Claims, File-Upload
- **Notifications Module** (1 dev) - Depends on Auth

**Why:** Can start earlier, but Claims provides most events.

### **Phase 5: Analytics & Audit (Weeks 6-8)**
**Can start anytime (read-only, non-blocking):**
- **Analytics Module** (1 dev) - Read-only queries
- **Audit Module** (1 dev) - Non-critical for MVP

**Why:** These don't block other modules, implement last.

---

## Team Assignment Recommendation

**For a team of 8-10 developers:**

| **Phase 1 (Weeks 1-2)** |
|---|
| Dev 1-2: Auth Module |
| Dev 3: Users Module |
| Dev 4: File-Upload Module |

| **Phase 2 (Weeks 2-4)** |
|---|
| Dev 1: Corporates Module |
| Dev 2: Employees Module |
| Dev 3: Hospitals Module |
| Dev 4: Insurers Module |
| Dev 5: Continue Auth enhancements |

| **Phase 3 (Weeks 3-6)** |
|---|
| Dev 1-2: Claims Module (critical) |
| Dev 3: Dependents Module |
| Dev 4: Patients Module |
| Dev 5: File-Upload enhancements |

| **Phase 4 (Weeks 5-7)** |
|---|
| Dev 1: Messaging Module (WebSocket) |
| Dev 2: Notifications Module |
| Dev 3-4: Claims Module continuation |
| Dev 5: Testing & integration |

| **Phase 5 (Weeks 6-8)** |
|---|
| Dev 1: Analytics Module |
| Dev 2: Audit Module |
| Dev 3-5: Integration testing, bug fixes |

---

## Module Interaction Patterns

### 1. **Synchronous (REST API Calls)**
- **Corporates** → **Users** (get user details)
- **Employees** → **Corporates** (validate corporate exists)
- **Claims** → **Patients** (validate coverage)
- **Claims** → **Hospitals** (validate hospital network)

### 2. **Asynchronous (Event-Driven)**
- **Claims** → **Notifications** (claim status changed)
- **Dependents** → **Notifications** (approval status changed)
- **Messaging** → **Notifications** (new message)
- **Corporates** → **Notifications** (contract changes)

### 3. **Shared Resources (Repositories)**
- All modules use shared base repository interfaces
- Database connection pooling managed centrally
- Entity relationships defined in TypeORM

---

## API Response Standardization

All modules should follow this response format:

```typescript
// Success Response
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2026-02-05T10:30:00Z"
}

// Paginated Response
{
  "success": true,
  "statusCode": 200,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Error Response
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "timestamp": "2026-02-05T10:30:00Z"
}
```

**Implement in common/interceptors/response.interceptor.ts**

---

## Error Handling Strategy

### Global Exception Filter (common/filters/)
- **HttpException** → HTTP responses
- **DatabaseException** → 500 with sanitized message
- **ValidationException** → 400 with field errors
- **UnauthorizedException** → 401
- **ForbiddenException** → 403

All modules inherit these filters.

---

## Database Transaction Boundaries

| Operation | Isolation Level | Modules Involved |
|-----------|-----------------|------------------|
| Claim Approval | SERIALIZABLE | Claims, Employees |
| Payment Processing | SERIALIZABLE | Claims, Corporates |
| Dependent Approval | REPEATABLE READ | Dependents, Notifications |
| Employee Update | READ COMMITTED | Employees, Patients |
| Message Sending | READ COMMITTED | Messaging, Notifications |

**Implementation:** Module services handle transaction management via TypeORM QueryRunner.

---

## Testing Strategy

### Unit Tests (Per Module)
- Service logic (80%+ coverage)
- Repository methods
- DTO validation
- Business rule enforcement

### Integration Tests (Between Modules)
- Claims → Patients → Coverage validation
- Claims → Notifications → Event triggers
- Corporates → Employees → Coverage sync

### E2E Tests (Critical Workflows)
- Complete claim workflow: Create → Approve → Update coverage
- Dependent approval: Request → Approve → Grant coverage
- Hospital visit → Claim creation → Messaging

---

## Frontend-Backend Integration Points

### By Module:

| **Frontend Route** | **Backend Module** | **Key Endpoints** |
|---|---|---|
| /login | Auth | POST /auth/login |
| /patient/dashboard | Patients, Claims, Analytics | GET /patients/me, GET /analytics/dashboard |
| /patient/claims | Claims | GET /claims |
| /corporate/dashboard | Analytics, Corporates | GET /analytics/dashboard |
| /corporate/employees | Employees | GET /employees |
| /corporate/dependents | Dependents | GET /dependents |
| /hospital/visits | Hospitals | GET /hospitals/:id/visits |
| /hospital/claims | Claims | GET /claims |
| /insurer/dashboard | Analytics, Insurers | GET /analytics/dashboard |
| /insurer/plans | Insurers | GET /insurers/:id/plans |
| /explore/hospitals | Hospitals | GET /hospitals (search) |
| /claims/:id/chat | Messaging | GET /claims/:id/messages, POST /claims/:id/messages |

---

## Deployment & CI/CD Considerations

### Per-Module Testing in CI/CD
```yaml
- Test auth module
- Test users module (depends on auth)
- Test corporates module (depends on auth, users)
- Test claims module (depends on multiple)
- Build docker image only if all tests pass
```

### Independent Module Scaling (Future)
- Modules can be split into separate microservices later
- Current monolith allows fast parallel development
- Clear boundaries enable easy migration to microservices

---

## Implementation Checklist

### Before Development Starts:

- [ ] Set up shared database connection
- [ ] Define common exception filters
- [ ] Create shared DTOs (Pagination, Response wrapper)
- [ ] Set up TypeORM entity base class
- [ ] Create repository base class interface
- [ ] Set up authentication strategies
- [ ] Configure JWT secret in .env
- [ ] Set up Supabase credentials
- [ ] Create module templates (scaffolding)
- [ ] Set up linting rules across team

### During Development:

- [ ] Each module has independent test suite
- [ ] Module exports via index.ts for clean imports
- [ ] All modules imported in app.module.ts
- [ ] API documentation updated per endpoint
- [ ] Error responses consistent across modules
- [ ] Pagination implemented consistently
- [ ] Logging configured per module

### Before Integration:

- [ ] All modules tested independently
- [ ] API contracts validated with frontend
- [ ] Database migrations tested
- [ ] E2E tests for critical workflows
- [ ] Performance testing on heavy queries
- [ ] Security review of auth flows

---

## Development Guidelines

### Code Organization Within Each Module:

```
module/
├── module.controller.ts    # HTTP handlers
├── module.service.ts       # Business logic
├── module.module.ts        # Module config
├── entities/              # TypeORM entities
├── repositories/          # Data access
├── dto/                   # Input/output DTOs
├── workflows/             # Complex processes (if needed)
├── services/              # Sub-services (if needed)
├── guards/                # Custom guards (if needed)
├── pipes/                 # Custom pipes (if needed)
├── test/                  # Unit & integration tests
└── index.ts               # Public exports
```

### Import Guidelines:
- ✅ Import from other modules' `index.ts`
- ✅ Import from `common/` for shared utilities
- ❌ DO NOT directly import from `src/modules/other/internals`
- ✅ Use dependency injection for module coupling

### Naming Conventions:
- DTOs: `{Entity}{Action}.dto.ts` (e.g., `CreateClaimDto`)
- Entities: `{Entity}.entity.ts` (e.g., `claim.entity.ts`)
- Services: `{Entity}.service.ts` (e.g., `claims.service.ts`)
- Controllers: `{Entity}.controller.ts`
- Tests: `{Module}.spec.ts` or `{Module}.e2e.ts`

---

## Critical Success Factors

1. **Clear API Contracts First:** Define DTOs before implementation
2. **Mock External Dependencies:** Don't wait for other modules
3. **Regular Integration Points:** Weekly merges to prevent divergence
4. **Documentation:** Each module documents its API
5. **Consistent Error Handling:** Use shared exception filters
6. **Database Schema First:** All modules aligned with schema
7. **Testing Discipline:** High test coverage prevents regressions

---

## Next Steps

1. **Create module structure** in repository (scaffolding)
2. **Assign modules to developers**
3. **Kick off Phase 1** (Auth, Users, File-Upload)
4. **Define API contracts** with frontend team
5. **Set up CI/CD pipeline** with module-based testing
6. **Weekly sync meetings** to resolve cross-module issues
7. **Parallel frontend-backend** integration as modules complete

---

**Last Updated:** February 5, 2026  
**Architecture Lead:** [Your Name]
