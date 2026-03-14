# Dev A Implementation Plan - Identity + Corporate Domain

**Version:** 1.0  
**Date:** February 14, 2026  
**Developer:** Dev A  
**Scope:** Auth, Users, Corporates, Employees, Dependents, Patients modules  
**Timeline:** 3 weeks (Weeks 1-3)

---

## Table of Contents

1. [Overview](#overview)
2. [Module Breakdown](#module-breakdown)
3. [Timeline & Phases](#timeline--phases)
4. [Database Schema Reference](#database-schema-reference)
5. [Module Specifications](#module-specifications)
6. [API Endpoints](#api-endpoints)
7. [Guard & Decorator System](#guard--decorator-system)
8. [Integration with Dev B](#integration-with-dev-b)
9. [Code Structure](#code-structure)
10. [Implementation Checklist](#implementation-checklist)

---

## Overview

### Modules Under Dev A

| Module | Purpose | Complexity | Week |
|--------|---------|-----------|------|
| **Auth** | JWT-based authentication, login/register, guards | High | 1 |
| **Users** | User profile management, roles, permissions | Medium | 1 |
| **Corporates** | Corporate accounts, contracts, billing | Medium | 2 |
| **Employees** | Employee records, coverage tracking | Medium | 2-3 |
| **Dependents** | Dependents management, approval workflow | Medium | 2-3 |
| **Patients** | Read-only aggregation view | Low | 3 |

### What "Identity + Corporate Domain" Means

- **Identity:** Auth + Users (who are users, what roles they have)
- **Corporate:** Corporates + Employees + Dependents (corporate structure and their people)
- **Aggregation:** Patients (unified view for claim submission)

### Key Responsibility

You control how claims are validated against coverage. Dev B's Claims module will:
1. **Read** from your modules: employee exists, has coverage, coverage is active
2. **Write back** to your modules: update `used_amount` on Employee when claim approved

---

## Module Breakdown

### 1. Auth Module (Week 1, Days 1-5)

**Purpose:** Foundation for entire system. All endpoints depend on auth guards.

**Responsibilities:**
- User login with email + password
- User registration (initial user creation)
- JWT token generation and refresh
- Password validation and hashing (bcrypt)
- Provide guards and decorators for role-based access
- Supply `/auth/me` endpoint for client to get current user

**Key Concepts:**
- **JWT Payload:** `{ sub (user ID), email, role, organizationId, iat, exp }`
- **Roles:** `patient`, `corporate`, `hospital`, `insurer`
- **Guards:** `JwtAuthGuard`, `RolesGuard`
- **Decorators:** `@Auth()`, `@Roles()`, `@CurrentUser()`

**Database Tables Used:**
- `users` (read/write during login/register)

**Must Deliver:**
- ✅ Login endpoint (POST /auth/login)
- ✅ Register endpoint (POST /auth/register)
- ✅ Token refresh (POST /auth/refresh-token)
- ✅ Current user endpoint (GET /auth/me)
- ✅ JwtAuthGuard (protects all endpoints by default)
- ✅ RolesGuard (restricts by role)
- ✅ @CurrentUser() decorator (injects current user into controller)

**FrontEnd Integration:**
- Client stores JWT in localStorage
- Sends in Authorization header: `Bearer {token}`
- Can call GET /auth/me to validate session

---

### 2. Users Module (Week 1, Days 3-7)

**Purpose:** User profile and role management after authentication.

**Responsibilities:**
- User CRUD (Create, Read, Update, Delete)
- User search and filtering
- Role assignment and updates
- User status management (active/inactive)
- Pagination for user lists

**Database Tables Used:**
- `users` (all CRUD operations)

**Depends On:**
- Auth (JWT validation, guards)

**Must Deliver:**
- ✅ Get user by ID (GET /users/:id)
- ✅ Update user profile (PUT /users/:id)
- ✅ List users with filters (GET /users) - paginated
- ✅ Delete user (DELETE /users/:id)
- ✅ Update user role (PUT /users/:id/role)
- ✅ User repository with database queries

**Key Fields in Response:**
```typescript
{
  id: string
  email: string
  firstName: string
  lastName?: string
  phone: string
  userRole: 'patient' | 'corporate' | 'hospital' | 'insurer'
  dob?: Date
  gender?: string
  cnic?: string
  address?: string
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}
```

---

### 3. Corporates Module (Week 2, Days 1-4)

**Purpose:** Manage corporate client accounts and their contracts.

**Responsibilities:**
- Create/update corporate accounts
- Manage corporate contract periods (start/end dates)
- Track total amount used (updated by Claims module)
- Provide corporate statistics and dashboard data
- Link corporate to insurer (which insurance company they use)
- Emit events when corporate is created

**Database Tables Used:**
- `corporates` (CRUD)
- `users` (FK relation)
- `insurers` (FK relation - which insurer this corporate uses)

**Depends On:**
- Auth (JWT validation)
- Users (user lookup)

**Dependents:**
- Employees (corporates have employees)
- Notifications (corporate-created event triggers welcome notification)
- Claims (claims update corporates' total_amount_used)

**Must Deliver:**
- ✅ Create corporate (POST /corporates)
- ✅ Get corporate by ID (GET /corporates/:id)
- ✅ Update corporate (PUT /corporates/:id)
- ✅ List corporates (GET /corporates) - paginated, filtered
- ✅ Get corporate statistics (GET /corporates/:id/stats)
- ✅ Emit `corporate-created` event (Dev B's Notifications listens)
- ✅ Track total_amount_used field

**Key Fields:**
```typescript
{
  id: string
  userId: string (FK to User)
  name: string
  address: string
  city: string
  province: string
  employeeCount: number
  dependentCount: number
  insurerId: string (FK to Insurer)
  contactName: string
  contactEmail: string
  contactPhone: string
  contractStartDate: Date (critical for coverage validation)
  contractEndDate: Date (critical for coverage validation)
  totalAmountUsed: Decimal (updated by Claims module)
  status: 'Active' | 'Inactive' | 'Suspended'
  createdAt: Date
  updatedAt: Date
}
```

**Statistics Endpoint Response:**
```typescript
{
  activeEmployees: number
  activeDependents: number
  totalCoverageAmount: Decimal
  usedCoverageAmount: Decimal
  remainingCoverageAmount: Decimal
  approvedClaimsCount: number
  pendingClaimsCount: number
  rejectedClaimsCount: number
}
```

---

### 4. Employees Module (Week 2-3, Days 5-10)

**Purpose:** Manage employee records and their coverage. Critical for claim validation.

**Responsibilities:**
- Employee CRUD operations
- Coverage amount management (from Plan)
- Coverage date validation (must be within corporate contract dates)
- Track used_amount (updated when claims are approved)
- Bulk import from CSV file
- Calculate available coverage (sum_insured - used_amount)
- Link to corporate and insurance plan

**Database Tables Used:**
- `employees` (main CRUD)
- `users` (FK - employee has user account)
- `corporates` (FK - which corporate they work for)
- `plans` (FK - which insurance plan they're under)

**Depends On:**
- Auth (JWT validation)
- Users (user lookup)
- Corporates (corporate validation, contract dates)

**Dependents:**
- Dependents (employees have dependents)
- Patients (read for patient aggregation)
- Claims (claims validate coverage, update used_amount)
- Analytics (used for reporting)

**Must Deliver:**
- ✅ Create employee (POST /employees)
- ✅ Get employee by ID (GET /employees/:id)
- ✅ Update employee (PUT /employees/:id)
- ✅ Delete employee (DELETE /employees/:id)
- ✅ List employees by corporate (GET /employees?corporateId=...) - paginated
- ✅ Get employee coverage (GET /employees/:id/coverage)
- ✅ Bulk import CSV (POST /employees/bulk-import)
- ✅ Update used_amount (callable by Claims module)
- ✅ Validate coverage dates against corporate contract

**Key Fields:**
```typescript
{
  id: string
  userId: string (FK to User)
  corporateId: string (FK to Corporate)
  employeeNumber: string (unique identifier at corporate)
  planId: string (FK to Plan)
  designation: string
  department: string
  coverageStartDate: Date (must be >= corporate.contractStartDate)
  coverageEndDate: Date (must be <= corporate.contractEndDate)
  coverageAmount: Decimal (from Plan.sumInsured)
  usedAmount: Decimal (updated when claims approved)
  status: 'Active' | 'Inactive' | 'Suspended' | 'Terminated'
  createdAt: Date
  updatedAt: Date
}
```

**Coverage Endpoint Response:**
```typescript
{
  employeeId: string
  fullName: string
  planName: string
  totalCoverageAmount: Decimal
  usedAmount: Decimal
  availableAmount: Decimal
  coverageStartDate: Date
  coverageEndDate: Date
  status: string
}
```

**Bulk Import CSV Format:**
```csv
employeeNumber,firstName,lastName,email,phone,designation,department,planCode,dob,gender
EMP001,John,Doe,john@company.com,03001234567,Manager,Finance,PLAN001,1990-01-15,Male
EMP002,Jane,Smith,jane@company.com,03001234568,Developer,IT,PLAN001,1992-03-20,Female
```

**Important Validation:**
- Coverage dates must be within corporate contract dates
- Employee email must be unique
- Employee number must be unique within corporate
- Plan must exist and belong to corporate's insurer

---

### 5. Dependents Module (Week 2-3, Days 7-10)

**Purpose:** Manage family members of employees with approval workflow.

**Responsibilities:**
- Create/update dependent records
- Manage dependent approval workflow (Pending → Approved/Rejected)
- Inherit coverage from employee
- Validate relationships (spouse, son, daughter, parent)
- Trigger notifications on approval/rejection
- Link dependents to employees

**Database Tables Used:**
- `dependents` (main CRUD)
- `employees` (FK - which employee this dependent belongs to)

**Depends On:**
- Auth (JWT validation)
- Users (indirectly through employee)
- Employees (dependent belongs to employee)

**Dependents:**
- Patients (read for patient aggregation)
- Notifications (approval/rejection triggers notifications)
- Claims (dependents can have claims)
- Analytics (used for reporting)

**Must Deliver:**
- ✅ Create dependent (POST /dependents)
- ✅ Get dependent by ID (GET /dependents/:id)
- ✅ Update dependent (PUT /dependents/:id)
- ✅ List dependents by employee (GET /dependents?employeeId=...) - paginated
- ✅ Approve dependent (PATCH /dependents/:id/approve)
- ✅ Reject dependent (PATCH /dependents/:id/reject)
- ✅ Emit notification events on approval/rejection
- ✅ Validate relationship types

**Key Fields:**
```typescript
{
  id: string
  employeeId: string (FK to Employee)
  firstName: string
  lastName: string
  relationship: 'Spouse' | 'Son' | 'Daughter' | 'Father' | 'Mother'
  dateOfBirth: Date
  gender: 'Male' | 'Female' | 'Other'
  cnic?: string
  phoneNumber?: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Active' | 'Inactive'
  requestDate: Date (when dependent was added)
  reviewedDate?: Date (when approved/rejected)
  rejectionReason?: string (if rejected)
  createdAt: Date
  updatedAt: Date
}
```

**Approval Rules:**
- Only Pending dependents can be approved/rejected
- Once approved, status changes to Active
- Once rejected, status changes to Rejected (terminal)
- Rejected dependents cannot be reactivated (must create new record)
- Only corporates or insurers can approve dependents

**Notification on Approval:**
- Send notification to employee: "Dependent {name} approved by {approver}"

**Notification on Rejection:**
- Send notification to employee: "Dependent {name} rejected: {reason}"

---

### 6. Patients Module (Week 3, Days 1-5)

**Purpose:** Read-only aggregation view showing a person's coverage and claims status.

**Responsibilities:**
- Aggregate employee and dependent data into patient view
- Show current coverage availability
- Link to claims associated with this person
- Link to hospital visits
- Provide eligibility checking interface
- Performance-optimized queries (can implement caching)

**Database Tables Used:**
- `employees` (read only)
- `dependents` (read only)
- `users` (read only)
- `claims` (read only - linked)
- `hospital_visits` (read only - linked)
- `plans` (read only - for coverage details)

**Depends On:**
- Auth (JWT validation)
- Users (user lookup)
- Employees (read employee data)
- Dependents (read dependent data)

**Dependents:**
- Claims (patients view their claims)
- Hospitals (patients view hospital visits)
- Messaging (patients participate in claim discussions)
- Analytics (patient metrics)

**Must Deliver:**
- ✅ Get patient by ID (GET /patients/:id)
- ✅ Get current user as patient (GET /patients/me)
- ✅ Get patient coverage details (GET /patients/:id/coverage)
- ✅ Link to patient claims (GET /patients/:id/claims) - delegated to Dev B's Claims
- ✅ Link to hospital visits (GET /patients/:id/hospital-visits)
- ✅ Check if person is eligible for claims

**Key Response Fields:**
```typescript
{
  id: string (employee or dependent ID)
  type: 'employee' | 'dependent'
  firstName: string
  lastName: string
  email: string
  dob: Date
  gender: string
  cnic?: string
  
  // Coverage info
  planName: string
  insurerName: string
  totalCoverageAmount: Decimal
  usedAmount: Decimal
  availableAmount: Decimal
  coverageStartDate: Date
  coverageEndDate: Date
  isCoverageActive: boolean
  
  // If dependent
  relationship?: string
  parentEmployee?: {
    id: string
    firstName: string
    lastName: string
  }
  
  // Stats
  claimsCount: number
  approvedClaimsAmount: Decimal
  hospitalVisitsCount: number
}
```

**Coverage Check Response:**
```typescript
{
  isEligible: boolean
  reason: string // "Coverage active", "Coverage expired", etc
  availableCoverage: Decimal
  coverageEndDate: Date
}
```

---

## Timeline & Phases

### Phase 0: Auth Contract (Days 1-2) ⚠️ BLOCKING

**Goal:** Lock down authentication specification before any coding

**Deliverables:**
- [ ] JWT payload structure finalized
- [ ] Role enum locked
- [ ] Guard usage patterns documented
- [ ] Decorator usage patterns documented
- [ ] /auth/me response structure locked
- [ ] Sent to Dev B for confirmation

**File:** `docs/AUTH_CONTRACT.md` (create together with Dev B)

**Example Content:**
```markdown
# Auth Contract

## JWT Payload (Sub Object)
{
  sub: string (user ID)
  email: string
  role: 'patient' | 'corporate' | 'hospital' | 'insurer'
  organizationId?: string (corporate/hospital/insurer ID, only for non-patient)
  iat: number
  exp: number
}

## Guard Usage
@Auth() - requires JWT, any role
@Roles('corporate') - requires corporate role
@Roles('corporate', 'patient') - requires one of these roles

## /auth/me Response
{
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  userRole: string
  createdAt: Date
  ... additional fields based on role
}
```

---

### Phase 1: Auth + Users (Week 1)

**Days 1-5: Auth Module**

- [ ] Setup NestJS auth module structure
- [ ] Implement JWT strategy (passport-jwt)
- [ ] Create JwtAuthGuard
- [ ] Create RolesGuard
- [ ] Create @Auth() decorator
- [ ] Create @Roles() decorator
- [ ] Create @CurrentUser() decorator
- [ ] POST /auth/login endpoint
- [ ] POST /auth/register endpoint
- [ ] POST /auth/refresh-token endpoint
- [ ] GET /auth/me endpoint
- [ ] Add bcrypt for password hashing
- [ ] Add environment variables (JWT_SECRET, JWT_EXPIRY)
- [ ] Unit tests for auth service
- [ ] Test with Postman/Insomnia

**Days 3-7: Users Module (parallel with Auth final touches)**

- [ ] Setup NestJS users module structure
- [ ] Create User entity (from Prisma schema)
- [ ] Create UsersRepository
- [ ] Create UsersService
- [ ] Create UsersController
- [ ] GET /users/:id endpoint
- [ ] PUT /users/:id endpoint
- [ ] GET /users endpoint (with filters, pagination)
- [ ] DELETE /users/:id endpoint
- [ ] PUT /users/:id/role endpoint
- [ ] Add @Auth() guard to all endpoints
- [ ] Add role checking where needed
- [ ] Unit tests for users service
- [ ] Integration tests (auth → users workflow)

**Checkpoint:** Both Auth and Users modules fully working, all endpoints tested

---

### Phase 2: Corporates + Employees + Dependents (Week 2-3)

**Days 5-9: Corporates Module**

- [ ] Setup NestJS corporates module structure
- [ ] Create Corporate entity
- [ ] Create CorporatesRepository
- [ ] Create CorporatesService
- [ ] Create CorporatesController
- [ ] POST /corporates endpoint
- [ ] GET /corporates/:id endpoint
- [ ] PUT /corporates/:id endpoint
- [ ] GET /corporates endpoint (with filters, pagination)
- [ ] GET /corporates/:id/stats endpoint
- [ ] Implement corporate-created event emitter
- [ ] Add @Auth() and @Roles() guards
- [ ] Validate contract dates
- [ ] Unit tests for corporates service

**Days 8-13: Employees Module**

- [ ] Setup NestJS employees module structure
- [ ] Create Employee entity
- [ ] Create EmployeesRepository
- [ ] Create EmployeesService
- [ ] Create EmployeesController
- [ ] POST /employees endpoint
- [ ] GET /employees/:id endpoint
- [ ] PUT /employees/:id endpoint
- [ ] DELETE /employees/:id endpoint
- [ ] GET /employees endpoint (with corporate filter, pagination)
- [ ] GET /employees/:id/coverage endpoint
- [ ] POST /employees/bulk-import endpoint (CSV parsing)
- [ ] Implement updateUsedAmount() method (for Claims to call)
- [ ] Validate coverage dates against corporate contract
- [ ] Add @Auth() and @Roles() guards
- [ ] Unit tests for employees service
- [ ] Test bulk import with sample CSV

**Days 10-14: Dependents Module**

- [ ] Setup NestJS dependents module structure
- [ ] Create Dependent entity
- [ ] Create DependentsRepository
- [ ] Create DependentsService
- [ ] Create DependentsController
- [ ] POST /dependents endpoint
- [ ] GET /dependents/:id endpoint
- [ ] PUT /dependents/:id endpoint
- [ ] GET /dependents endpoint (with employee filter, pagination)
- [ ] PATCH /dependents/:id/approve endpoint
- [ ] PATCH /dependents/:id/reject endpoint
- [ ] Implement approval workflow state machine
- [ ] Emit notification events on approve/reject
- [ ] Add @Auth() and @Roles() guards
- [ ] Unit tests for dependents service
- [ ] Test approval workflow

**Integration Tests (Days 12-14):**
- [ ] Corporate creation → Employees can be added
- [ ] Employee creation → Dependents can be added
- [ ] Dependent approval triggers notification
- [ ] Coverage calculations are correct

---

### Phase 3: Patients Module (Week 3)

**Days 1-5: Patients Module**

- [ ] Setup NestJS patients module structure
- [ ] Create PatientsService (read-only queries)
- [ ] Create PatientsController
- [ ] GET /patients/:id endpoint
- [ ] GET /patients/me endpoint
- [ ] GET /patients/:id/coverage endpoint
- [ ] GET /patients/:id/claims endpoint (check Dev B's claims module)
- [ ] GET /patients/:id/hospital-visits endpoint
- [ ] Implement eligibility checking logic
- [ ] Add @Auth() guards
- [ ] Implement caching (optional but recommended)
- [ ] Unit tests for patients service

**Integration with Dev B:**
- [ ] Coordinate with Claims module for claims linking
- [ ] Coordinate with Hospitals module for visit linking

**Checkpoint:** All 6 modules complete and integrated

---

## Database Schema Reference

### Tables You Directly Manage

```sql
-- Users Table (shared with Auth/Users modules)
users {
  id UUID PRIMARY KEY
  email VARCHAR(255) UNIQUE
  password_hash VARCHAR(255)
  first_name VARCHAR(100)
  last_name VARCHAR(100)
  phone VARCHAR(20)
  user_role ENUM(patient, corporate, hospital, insurer)
  dob DATE
  gender ENUM(Male, Female, Other)
  cnic VARCHAR(15) UNIQUE
  address VARCHAR(500)
  created_at TIMESTAMPTZ DEFAULT now()
  updated_at TIMESTAMPTZ DEFAULT now()
  last_login_at TIMESTAMPTZ
}

-- Corporates Table
corporates {
  id UUID PRIMARY KEY
  user_id UUID FK users(id) UNIQUE
  name VARCHAR(255)
  address VARCHAR(500)
  city VARCHAR(100)
  province VARCHAR(100)
  employee_count INT
  dependent_count INT DEFAULT 0
  insurer_id UUID FK insurers(id)
  contact_name VARCHAR(100)
  contact_email VARCHAR(255)
  contact_phone VARCHAR(20)
  contract_start_date DATE -- CRITICAL FOR VALIDATION
  contract_end_date DATE -- CRITICAL FOR VALIDATION
  total_amount_used DECIMAL(12,2) DEFAULT 0 -- Updated by Claims
  status ENUM(Active, Inactive, Suspended)
  created_at TIMESTAMPTZ DEFAULT now()
  updated_at TIMESTAMPTZ DEFAULT now()
}

-- Employees Table
employees {
  id UUID PRIMARY KEY
  user_id UUID FK users(id) UNIQUE
  corporate_id UUID FK corporates(id)
  employee_number VARCHAR(50) UNIQUE
  plan_id UUID FK plans(id)
  designation VARCHAR(100)
  department VARCHAR(100)
  coverage_start_date DATE -- Must be >= corporate.contract_start_date
  coverage_end_date DATE -- Must be <= corporate.contract_end_date
  coverage_amount DECIMAL(12,2) -- From Plan.sum_insured
  used_amount DECIMAL(12,2) DEFAULT 0 -- Updated when claims approved
  status ENUM(Active, Inactive, Suspended, Terminated)
  created_at TIMESTAMPTZ DEFAULT now()
  updated_at TIMESTAMPTZ DEFAULT now()
}

-- Dependents Table
dependents {
  id UUID PRIMARY KEY
  employee_id UUID FK employees(id)
  first_name VARCHAR(100)
  last_name VARCHAR(100)
  relationship ENUM(Spouse, Son, Daughter, Father, Mother)
  date_of_birth DATE
  gender ENUM(Male, Female, Other)
  cnic VARCHAR(15)
  phone_number VARCHAR(20)
  status ENUM(Pending, Approved, Rejected, Active, Inactive)
  request_date TIMESTAMPTZ
  reviewed_date TIMESTAMPTZ
  rejection_reason VARCHAR(500)
  created_at TIMESTAMPTZ DEFAULT now()
  updated_at TIMESTAMPTZ DEFAULT now()
}
```

### Related Tables (Read in Your Modules)

```sql
-- Insurers Table (FK from Corporates)
insurers {
  id UUID PRIMARY KEY
  -- ... (managed by Dev B)
}

-- Plans Table (FK from Employees)
plans {
  id UUID PRIMARY KEY
  plan_code VARCHAR(50) UNIQUE
  insurer_id UUID FK insurers(id)
  sum_insured DECIMAL(12,2) -- Employee coverage amount
  -- ... (managed by Dev B)
}
```

---

## Module Specifications

### Auth Module Details

**Directory Structure:**
```
src/modules/auth/
├── auth.controller.ts      # REST endpoints
├── auth.service.ts         # Business logic
├── auth.module.ts          # Module definition
├── strategies/
│   └── jwt.strategy.ts     # Passport JWT strategy
├── guards/
│   ├── jwt-auth.guard.ts   # Protect with JWT
│   └── roles.guard.ts      # Check user role
├── decorators/
│   ├── current-user.decorator.ts  # Inject current user
│   └── roles.decorator.ts         # Mark required roles
├── dto/
│   ├── login.dto.ts
│   ├── register.dto.ts
│   └── token-response.dto.ts
└── test/
    └── auth.service.spec.ts
```

**Key Dependencies (package.json additions needed):**
```json
{
  "@nestjs/passport": "^10.0.0",
  "@nestjs/jwt": "^10.0.0",
  "passport": "^0.6.0",
  "passport-jwt": "^4.0.0",
  "bcrypt": "^5.1.0"
}
```

**JWT Token Example:**
```typescript
// After login, return:
{
  access_token: "eyJhbGc..." (expires in 15 min)
  refresh_token: "eyJhbGc..." (expires in 7 days)
  user: {
    id: "uuid",
    email: "user@example.com",
    role: "corporate",
    organizationId: "corp-id"
  }
}
```

---

### Users Module Details

**Directory Structure:**
```
src/modules/users/
├── users.controller.ts
├── users.service.ts
├── users.module.ts
├── entities/
│   └── user.entity.ts
├── repositories/
│   └── users.repository.ts
├── dto/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   └── user-response.dto.ts
└── test/
    └── users.service.spec.ts
```

**Validation (class-validator):**
```typescript
// CreateUserDto
export class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number'
  })
  password: string;

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName?: string;

  @IsPhoneNumber('PK')
  phone: string;

  @IsEnum(UserRole)
  userRole: UserRole;

  @IsOptional()
  @IsDate()
  dob?: Date;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}
```

---

### Corporates Module Details

**Directory Structure:**
```
src/modules/corporates/
├── corporates.controller.ts
├── corporates.service.ts
├── corporates.module.ts
├── entities/
│   └── corporate.entity.ts
├── repositories/
│   └── corporates.repository.ts
├── dto/
│   ├── create-corporate.dto.ts
│   ├── update-corporate.dto.ts
│   ├── corporate-response.dto.ts
│   └── corporate-stats.dto.ts
├── events/
│   └── corporate-created.event.ts
└── test/
    └── corporates.service.spec.ts
```

**Event Emission:**
```typescript
// In CorporatesService.create():
this.eventEmitter.emit(
  'corporate.created',
  new CorporateCreatedEvent(corporate.id, corporate.userId)
);

// Dev B's Notifications module listens:
@OnEvent('corporate.created')
async handleCorporateCreated(event: CorporateCreatedEvent) {
  // Send welcome notification
}
```

---

### Employees Module Details

**Directory Structure:**
```
src/modules/employees/
├── employees.controller.ts
├── employees.service.ts
├── employees.module.ts
├── entities/
│   └── employee.entity.ts
├── repositories/
│   └── employees.repository.ts
├── dto/
│   ├── create-employee.dto.ts
│   ├── update-employee.dto.ts
│   ├── employee-response.dto.ts
│   ├── employee-coverage.dto.ts
│   └── bulk-import.dto.ts
├── services/
│   └── coverage-calculator.service.ts
└── test/
    └── employees.service.spec.ts
```

**CSV Bulk Import:**
```typescript
// POST /employees/bulk-import
async bulkImport(file: Express.Multer.File, corporateId: string) {
  const records = await parseCsv(file);
  const results = [];
  
  for (const record of records) {
    try {
      const employee = await this.create({
        employeeNumber: record.employeeNumber,
        firstName: record.firstName,
        // ... validate and create
      });
      results.push({ success: true, employeeNumber: record.employeeNumber });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }
  
  return results;
}
```

**updateUsedAmount() Method (for Dev B's Claims):**
```typescript
// Public method that Claims module can call
async updateUsedAmount(employeeId: string, approvedAmount: Decimal) {
  const employee = await this.findById(employeeId);
  employee.usedAmount = employee.usedAmount.add(approvedAmount);
  await this.employeesRepository.update(employeeId, employee);
  return employee;
}
```

---

### Dependents Module Details

**Directory Structure:**
```
src/modules/dependents/
├── dependents.controller.ts
├── dependents.service.ts
├── dependents.module.ts
├── entities/
│   └── dependent.entity.ts
├── repositories/
│   └── dependents.repository.ts
├── dto/
│   ├── create-dependent.dto.ts
│   ├── update-dependent.dto.ts
│   ├── dependent-response.dto.ts
│   └── approve-dependent.dto.ts
├── workflows/
│   └── dependent-approval.workflow.ts
└── test/
    └── dependents.service.spec.ts
```

**Approval Workflow State Machine:**
```typescript
// DependentApprovalWorkflow
enum DependentStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Active = 'Active',
  Inactive = 'Inactive'
}

const transitions = {
  [DependentStatus.Pending]: [DependentStatus.Approved, DependentStatus.Rejected],
  [DependentStatus.Approved]: [DependentStatus.Active],
  [DependentStatus.Rejected]: [], // Terminal
  [DependentStatus.Active]: [DependentStatus.Inactive],
  [DependentStatus.Inactive]: [] // Terminal
}

// Validate transition before allowing
validateTransition(from: DependentStatus, to: DependentStatus) {
  if (!transitions[from]?.includes(to)) {
    throw new InvalidTransitionError(`Cannot transition from ${from} to ${to}`);
  }
}
```

---

### Patients Module Details

**Directory Structure:**
```
src/modules/patients/
├── patients.controller.ts
├── patients.service.ts
├── patients.module.ts
├── dto/
│   ├── patient-profile.dto.ts
│   ├── patient-coverage.dto.ts
│   └── patient-eligibility.dto.ts
└── test/
    └── patients.service.spec.ts
```

**Caching (optional but recommended):**
```typescript
// Use @CacheKey and @CacheTTL decorators
@Get(':id/coverage')
@CacheKey(`patient_coverage_${id}`)
@CacheTTL(3600) // Cache for 1 hour
async getCoverage(@Param('id') id: string) {
  // Heavy calculation
}
```

---

## API Endpoints

### Complete Endpoint Checklist

### Auth Endpoints

```
POST   /auth/login
  Body: { email, password }
  Response: { access_token, refresh_token, user }
  Guard: @Public()

POST   /auth/register
  Body: { email, password, firstName, lastName, phone, userRole }
  Response: { id, email, firstName, userRole, createdAt }
  Guard: @Public()

POST   /auth/refresh-token
  Body: { refresh_token }
  Response: { access_token, refresh_token }
  Guard: @Public()

GET    /auth/me
  Response: { id, email, firstName, lastName, userRole, ... }
  Guard: @Auth()
```

### Users Endpoints

```
GET    /users/:id
  Response: UserResponseDto
  Guard: @Auth(), @Roles('corporate', 'hospital', 'insurer')

PUT    /users/:id
  Body: UpdateUserDto
  Response: UserResponseDto
  Guard: @Auth()

GET    /users
  Query: { page, limit, role, status, search }
  Response: { items: UserResponseDto[], total, page, limit }
  Guard: @Auth(), @Roles('corporate', 'hospital', 'insurer')

DELETE /users/:id
  Response: { success: boolean }
  Guard: @Auth(), @Roles('corporate', 'hospital', 'insurer')

PUT    /users/:id/role
  Body: { role: UserRole }
  Response: UserResponseDto
  Guard: @Auth(), @Roles('hospital', 'insurer')
```

### Corporates Endpoints

```
POST   /corporates
  Body: CreateCorporateDto
  Response: CorporateResponseDto
  Guard: @Auth(), @Roles('corporate', 'insurer')

GET    /corporates/:id
  Response: CorporateResponseDto
  Guard: @Auth()

PUT    /corporates/:id
  Body: UpdateCorporateDto
  Response: CorporateResponseDto
  Guard: @Auth(), @Roles('corporate')

GET    /corporates
  Query: { page, limit, status, city, insurerId }
  Response: { items: CorporateResponseDto[], total, page, limit }
  Guard: @Auth()

GET    /corporates/:id/stats
  Response: CorporateStatsDto
  Guard: @Auth(), @Roles('corporate', 'insurer')
```

### Employees Endpoints

```
POST   /employees
  Body: CreateEmployeeDto
  Response: EmployeeResponseDto
  Guard: @Auth(), @Roles('corporate')

GET    /employees/:id
  Response: EmployeeResponseDto
  Guard: @Auth()

PUT    /employees/:id
  Body: UpdateEmployeeDto
  Response: EmployeeResponseDto
  Guard: @Auth(), @Roles('corporate')

DELETE /employees/:id
  Response: { success: boolean }
  Guard: @Auth(), @Roles('corporate')

GET    /employees
  Query: { corporateId, page, limit, status, employeeNumber }
  Response: { items: EmployeeResponseDto[], total, page, limit }
  Guard: @Auth(), @Roles('corporate')

GET    /employees/:id/coverage
  Response: EmployeeCoverageDto
  Guard: @Auth()

POST   /employees/bulk-import
  Body: FormData { file: CSV }
  Response: { results: { employeeNumber, success, error }[] }
  Guard: @Auth(), @Roles('corporate')
```

### Dependents Endpoints

```
POST   /dependents
  Body: CreateDependentDto
  Response: DependentResponseDto
  Guard: @Auth(), @Roles('patient', 'corporate')

GET    /dependents/:id
  Response: DependentResponseDto
  Guard: @Auth()

PUT    /dependents/:id
  Body: UpdateDependentDto
  Response: DependentResponseDto
  Guard: @Auth()

GET    /dependents
  Query: { employeeId, page, limit, status }
  Response: { items: DependentResponseDto[], total, page, limit }
  Guard: @Auth(),@Roles('corporate')

PATCH  /dependents/:id/approve
  Body: { approvedBy, approverRole }
  Response: DependentResponseDto
  Guard: @Auth(), @Roles('corporate', 'insurer')

PATCH  /dependents/:id/reject
  Body: { rejectionReason, rejectedBy, rejectorRole }
  Response: DependentResponseDto
  Guard: @Auth(), @Roles('corporate', 'insurer')
```

### Patients Endpoints

```
GET    /patients/:id
  Response: PatientProfileDto
  Guard: @Auth()

GET    /patients/me
  Response: PatientProfileDto
  Guard: @Auth()

GET    /patients/:id/coverage
  Response: PatientCoverageDto
  Guard: @Auth()

GET    /patients/:id/claims
  Response: { items: ClaimSummaryDto[], total }
  Guard: @Auth()
  Note: Delegates to Dev B's Claims module

GET    /patients/:id/hospital-visits
  Response: { items: HospitalVisitDto[], total }
  Guard: @Auth()
  Note: Retrieves from database, may contact Dev B's Hospitals module
```

---

## Guard & Decorator System

### Guard Hierarchy

```
@Public() → Bypass all guards
   ↓
@Auth() → Require JWT (JwtAuthGuard)
   ↓
@Roles('corporate') → Also check role (RolesGuard)
```

### Implementation Pattern

**In app.module.ts (global setup):**
```typescript
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

**In controller with guards:**
```typescript
@Controller('users')
export class UsersController {
  
  @Get(':id')
  @Roles('corporate', 'hospital')
  getUser(@Param('id') id: string) {
    // Only corporate and hospital users can call this
  }

  @Post()
  @Public()
  publicEndpoint() {
    // Accessible without JWT
  }
}
```

**Using @CurrentUser() decorator:**
```typescript
@Get('me')
getCurrentUser(@CurrentUser() user: CurrentUserDto) {
  // user is automatically injected from JWT payload
  return user;
}
```

---

## Integration with Dev B

### Module Boundaries

```
Dev A (You)                         Dev B
┌─────────────────┐               ┌──────────────────┐
│  Auth           │               │  Hospitals       │
│  Users          │ ←─────────→   │  Claims ← reads  │
│  Corporates     │               │  Messaging       │
│  Employees ───→ │ ← Claims      │  Notifications   │
│  Dependents     │   updates     │  File-Upload     │
│  Patients       │   used_amount │  Analytics       │
└─────────────────┘               │  Audit           │
                                  └──────────────────┘
```

### Synchronous Integration Points

#### 1. Claims reads Employee coverage
**When:** Dev B's Claims service validates a claim  
**What:** Claims needs to know if employee has coverage available  
**How:** Claims imports EmployeesService and calls:
```typescript
const employee = await this.employeesService.findById(employeeId);
const availableCoverage = employee.coverageAmount - employee.usedAmount;
```

#### 2. Claims updates Employee used_amount
**When:** Claim is approved by insurer  
**What:** Employee's used_amount increases  
**How:** Claims calls your public method:
```typescript
await this.employeesService.updateUsedAmount(employeeId, approvedAmount);
```

#### 3. Claims reads Patient eligibility
**When:** Patient submits claim  
**What:** Verify patient (employee/dependent) is eligible  
**How:** Claims calls your Patients service:
```typescript
const patient = await this.patientsService.getById(patientId);
const isEligible = patient.isCoverageActive;
```

### Asynchronous Integration Points (Events)

#### 1. Corporate-Created Event
**You emit:** In Corporates service when corporate is created  
**Dev B receives:** Notifications module listens and sends welcome notification  
```typescript
this.eventEmitter.emit('corporate.created', { corporateId, userId });
```

#### 2. Dependent-Approved Event
**You emit:** In Dependents service when dependent approved  
**Dev B receives:** Notifications module sends notification to employee  
```typescript
this.eventEmitter.emit('dependent.approved', { dependentId, employeeId });
```

#### 3. Claim-Status-Changed Event
**Dev B emits:** In Claims service when claim status changes  
**You receive:** (Optional) Update employee stats if needed  
```typescript
this.eventEmitter.emit('claim.status_changed', { claimId, status });
```

### Database Transaction Coordination

**Isolation levels for critical operations:**

| Operation | Isolation | Dev A | Dev B |
|-----------|-----------|-------|-------|
| Employee creation | READ COMMITTED | ✓ | - |
| Dependent approval | REPEATABLE READ | ✓ | - |
| Claim approval | SERIALIZABLE | - | ✓ (impacts your Employee.usedAmount) |
| Coverage calculation | READ COMMITTED | ✓ | - |

**For Claim Approval (affects you):**
- Dev B must use transactions when approving claims
- Must call your `updateUsedAmount()` within same transaction
- Use `@Transactional()` decorator or repository transaction methods

---

## Code Structure

### Module Folder Organization

```
src/
├── main.ts
├── app.module.ts                  # Main module (imports all modules)
├── app.controller.ts              # (optional root controller)
├── app.service.ts                 # (optional root service)
│
├── common/                        # Shared across all modules
│   ├── decorators/
│   │   ├── auth.decorator.ts      # @Auth() marker
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── filters/
│   │   ├── http-exception.filter.ts
│   │   └── database-exception.filter.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   └── public.guard.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   ├── response.interceptor.ts
│   │   └── error.interceptor.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   ├── utils/
│   │   ├── generators.ts
│   │   └── validators.ts
│   ├── constants/
│   │   ├── errors.ts
│   │   └── messages.ts
│   ├── types/
│   │   ├── index.ts
│   │   └── request.types.ts
│   └── index.ts
│
├── config/                        # Configuration
│   ├── database.config.ts
│   ├── jwt.config.ts
│   ├── env.validation.ts
│   └── index.ts
│
├── modules/                       # Feature modules (YOUR DOMAIN)
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   ├── register.dto.ts
│   │   │   └── token-response.dto.ts
│   │   └── test/
│   │       └── auth.service.spec.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── repositories/
│   │   │   └── users.repository.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user.dto.ts
│   │   │   └── user-response.dto.ts
│   │   └── test/
│   │       └── users.service.spec.ts
│   │
│   ├── corporates/
│   │   ├── corporates.module.ts
│   │   ├── corporates.controller.ts
│   │   ├── corporates.service.ts
│   │   ├── entities/
│   │   │   └── corporate.entity.ts
│   │   ├── repositories/
│   │   │   └── corporates.repository.ts
│   │   ├── dto/
│   │   │   ├── create-corporate.dto.ts
│   │   │   ├── update-corporate.dto.ts
│   │   │   ├── corporate-response.dto.ts
│   │   │   └── corporate-stats.dto.ts
│   │   ├── events/
│   │   │   └── corporate-created.event.ts
│   │   └── test/
│   │       └── corporates.service.spec.ts
│   │
│   ├── employees/
│   │   ├── employees.module.ts
│   │   ├── employees.controller.ts
│   │   ├── employees.service.ts
│   │   ├── entities/
│   │   │   └── employee.entity.ts
│   │   ├── repositories/
│   │   │   └── employees.repository.ts
│   │   ├── dto/
│   │   │   ├── create-employee.dto.ts
│   │   │   ├── update-employee.dto.ts
│   │   │   ├── employee-response.dto.ts
│   │   │   ├── employee-coverage.dto.ts
│   │   │   └── bulk-import.dto.ts
│   │   ├── services/
│   │   │   └── coverage-calculator.service.ts
│   │   └── test/
│   │       └── employees.service.spec.ts
│   │
│   ├── dependents/
│   │   ├── dependents.module.ts
│   │   ├── dependents.controller.ts
│   │   ├── dependents.service.ts
│   │   ├── entities/
│   │   │   └── dependent.entity.ts
│   │   ├── repositories/
│   │   │   └── dependents.repository.ts
│   │   ├── dto/
│   │   │   ├── create-dependent.dto.ts
│   │   │   ├── update-dependent.dto.ts
│   │   │   ├── dependent-response.dto.ts
│   │   │   └── approve-dependent.dto.ts
│   │   ├── workflows/
│   │   │   └── dependent-approval.workflow.ts
│   │   └── test/
│   │       └── dependents.service.spec.ts
│   │
│   ├── patients/
│   │   ├── patients.module.ts
│   │   ├── patients.controller.ts
│   │   ├── patients.service.ts
│   │   ├── dto/
│   │   │   ├── patient-profile.dto.ts
│   │   │   ├── patient-coverage.dto.ts
│   │   │   └── patient-eligibility.dto.ts
│   │   └── test/
│   │       └── patients.service.spec.ts
│   │
│   └── index.ts                   # Module exports
│
├── shared/                        # Shared models, interfaces
│   ├── dtos/
│   │   ├── pagination.dto.ts
│   │   ├── filter.dto.ts
│   │   └── response.dto.ts
│   ├── entities/
│   │   └── base.entity.ts
│   ├── interfaces/
│   │   ├── repository.interface.ts
│   │   └── service.interface.ts
│   ├── types/
│   │   ├── index.ts
│   │   └── common.types.ts
│   └── index.ts
│
└── websockets/                    # (Managed by Dev B)
    ├── events.gateway.ts
    └── websocket.module.ts

test/
├── app.e2e-spec.ts
└── jest-e2e.json
```

---

## Implementation Checklist

### Preparation Phase
- [ ] Create `docs/AUTH_CONTRACT.md` (with Dev B)
- [ ] Review Prisma schema
- [ ] Install auth packages (@nestjs/passport, @nestjs/jwt, bcrypt, passport-jwt)
- [ ] Setup Prisma client in project
- [ ] Create environment variables file (.env.example)
- [ ] Add TypeORM package (if not using Prisma directly)

### Week 1: Auth + Users

#### Auth Module
- [ ] Generate module structure with `nest generate`
- [ ] Create JWT strategy (passport-jwt)
- [ ] Implement JwtAuthGuard
- [ ] Implement RolesGuard
- [ ] Create @Auth() and @Roles() decorators
- [ ] Create @CurrentUser() decorator
- [ ] Implement login endpoint
- [ ] Implement register endpoint with password hashing
- [ ] Implement refresh-token endpoint
- [ ] Implement /auth/me endpoint
- [ ] Add password validation rules
- [ ] Add email validation
- [ ] Write unit tests for auth service
- [ ] Test all endpoints with Postman

#### Users Module
- [ ] Generate module structure
- [ ] Create User entity
- [ ] Create UsersRepository
- [ ] Create UsersService
- [ ] Create UsersController
- [ ] Implement GET /users/:id
- [ ] Implement PUT /users/:id
- [ ] Implement GET /users (with pagination)
- [ ] Implement DELETE /users/:id
- [ ] Implement PUT /users/:id/role
- [ ] Add validation DTOs
- [ ] Write unit tests for users service
- [ ] Integration test: register → query user → works

### Week 2: Corporates + Employees + Dependents

#### Corporates Module
- [ ] Generate module structure
- [ ] Create Corporate entity
- [ ] Create CorporatesRepository
- [ ] Create CorporatesService
- [ ] Create CorporatesController
- [ ] Implement POST /corporates
- [ ] Implement GET /corporates/:id
- [ ] Implement PUT /corporates/:id
- [ ] Implement GET /corporates (paginated)
- [ ] Implement GET /corporates/:id/stats
- [ ] Add contract date validation
- [ ] Implement corporate-created event
- [ ] Write unit tests
- [ ] Test with Postman

#### Employees Module
- [ ] Generate module structure
- [ ] Create Employee entity
- [ ] Create EmployeesRepository
- [ ] Create EmployeesService
- [ ] Create EmployeesController
- [ ] Implement POST /employees
- [ ] Implement GET /employees/:id
- [ ] Implement PUT /employees/:id
- [ ] Implement DELETE /employees/:id
- [ ] Implement GET /employees (with filters)
- [ ] Implement GET /employees/:id/coverage
- [ ] Implement coverage date validation
- [ ] Implement POST /employees/bulk-import
- [ ] Create CoverageCalculatorService
- [ ] Implement updateUsedAmount() method (for Dev B)
- [ ] Write unit tests
- [ ] Test with sample CSV

#### Dependents Module
- [ ] Generate module structure
- [ ] Create Dependent entity
- [ ] Create DependentsRepository
- [ ] Create DependentsService
- [ ] Create DependentsController
- [ ] Implement POST /dependents
- [ ] Implement GET /dependents/:id
- [ ] Implement PUT /dependents/:id
- [ ] Implement GET /dependents (with filters)
- [ ] Implement PATCH /dependents/:id/approve
- [ ] Implement PATCH /dependents/:id/reject
- [ ] Create approval workflow state machine
- [ ] Implement notification events
- [ ] Write unit tests
- [ ] Test approval workflow

### Week 3: Patients + Integration

#### Patients Module
- [ ] Generate module structure
- [ ] Create PatientsService (read-only)
- [ ] Create PatientsController
- [ ] Implement GET /patients/:id
- [ ] Implement GET /patients/me
- [ ] Implement GET /patients/:id/coverage
- [ ] Implement GET /patients/:id/claims (integrate with Dev B)
- [ ] Implement GET /patients/:id/hospital-visits (integrate with Dev B)
- [ ] Implement eligibility checking
- [ ] Write unit tests
- [ ] Consider caching implementation

#### Integration Testing
- [ ] Corporate creation → welcome event emitted ✓
- [ ] Employee creation → coverage validation ✓
- [ ] Dependent approval → notification event ✓
- [ ] Patient query → aggregates employee + dependent ✓
- [ ] Claims readiness → coordinate with Dev B ✓

#### Documentation
- [ ] Update API documentation
- [ ] Create deployment guide
- [ ] Document database migrations
- [ ] Create troubleshooting guide

---

## Key Validation Rules

### Auth Module
- Password must be 8+ chars, contain uppercase, lowercase, number
- Email must be valid format and unique
- All users get a role: patient, corporate, hospital, or insurer
- JWT expires in 15 minutes, refresh token in 7 days

### Users Module
- Email unique across all users
- Phone number must be valid Pakistan format (optional)
- First name required, minimum 2 characters
- Role cannot be changed arbitrarily (only by authorized users)

### Corporates Module
- Contract dates must be valid (start < end)
- Employee count must be positive
- Contact email must be valid
- Insurer must exist
- Only insurers and corporate admins can create/edit

### Employees Module
- Coverage dates must be within corporate contract dates
- Employee number must be unique within corporate
- Coverage amount must be positive
- Email must be unique
- Plan must exist and belong to corporate's insurer
- Bulk import CSV must have required columns

### Dependents Module
- Relationship must be valid enum value
- Birth date must be reasonable (not future)
- Can only approve pending dependents
- Can only reject pending dependents
- Rejection reason required for rejection
- Can have max 10 dependents per employee (business rule)

### Patients Module
- Only show coverage if currently active
- Hide sensitive fields based on user role
- Validate existence before returning

---

## Communication Checklist

### With Dev B

- [ ] Week 1: Lock Auth contract (JWT payload, guards, decorators)
- [ ] Week 1: Agree on event names and payloads
- [ ] Week 2: Provide Employee entity structure
- [ ] Week 2: Provide Dependents entity structure
- [ ] Week 2: Explain coverage validation logic
- [ ] Week 3: Coordinate on Patients endpoints (claims linking)
- [ ] Week 3: Coordinate on Hospital visits linking
- [ ] Week 3: Review Claims' updateUsedAmount calls

### With Team Lead

- [ ] Daily: Brief status update
- [ ] Weekly: Demo working features
- [ ] Weekly: Flag blockers
- [ ] End of week: Deliverables checklist

---

## Common Pitfalls to Avoid

1. **Auth not locked down early** → Dev B can't start. Prioritize this.
2. **Missing validation on coverage dates** → Will cause claim validation failures. Test thoroughly.
3. **Forgetting `@Roles()` guards** → Security risk. Check every endpoint.
4. **Not implementing updateUsedAmount()** → Claims module can't function. Make it public and well-tested.
5. **Bulk import without error handling** → Will fail with large CSVs. Add transaction rollback.
6. **Not testing cross-module integration** → Find bugs early with Dev B.
7. **Hardcoded magic numbers** → Use constants file for all enums and defaults.
8. **Missing pagination on list endpoints** → Performance issues. Always paginate.

---

## Testing Strategy

### Unit Tests (Per Module)
```typescript
// Example: employeess.service.spec.ts
describe('EmployeesService', () => {
  describe('create', () => {
    it('should create employee with valid input', async () => { ... });
    it('should validate coverage dates', async () => { ... });
    it('should link to correct plan', async () => { ... });
  });
  
  describe('updateUsedAmount', () => {
    it('should increase used_amount', async () => { ... });
    it('should not exceed coverage_amount', async () => { ... });
  });
});
```

### Integration Tests (Cross-Module)
```typescript
// Example: e2e/corporate-employee-workflow.spec.ts
describe('Corporate-Employee Workflow', () => {
  it('should:
    1. Create corporate
    2. Create employee within contract dates
    3. Get employee coverage
    4. Validate availability', async () => { ... });
});
```

### Manual Testing (Postman)
- [ ] Login → get JWT
- [ ] Use JWT in Authorization header
- [ ] Verify @Roles guards work
- [ ] Test pagination
- [ ] Test validation errors
- [ ] Test large CSV import

---

## Success Metrics (Definition of Done)

### Week 1
✅ All Auth endpoints working  
✅ All Users endpoints working  
✅ Guards protecting endpoints  
✅ JWT-based authentication complete  
✅ Password hashing implemented  

### Week 2
✅ Corporates module complete  
✅ Employees module complete with coverage validation  
✅ Dependents module complete with approval workflow  
✅ Integration tests passing  
✅ Event emission working  

### Week 3
✅ Patients module complete  
✅ All endpoints tested with Postman  
✅ Documentation updated  
✅ Ready for Dev B integration  
✅ Caching implemented (optional)  

---

## Notes for Future Reference

**Important DB Dependencies:**
- Changes to Prisma schema must be migrated: `npx prisma migrate dev --name <description>`
- Always run `npx prisma generate` after schema changes
- Keep TypeORM entities in sync with Prisma schema

**Performance Considerations:**
- Add indexes on frequently filtered columns (done in Prisma schema ✓)
- Consider caching for patient coverage queries
- Paginate all list endpoints (default 20 items)
- Use select/joins efficiently to avoid N+1 queries

**Security Notes:**
- All passwords hashed with bcrypt (min 10 rounds)
- JWTs include organizationId for multi-tenant isolation (future)
- Never return password_hash in API responses
- Audit sensitive operations (handled by Dev B's Audit module)

---

This document is your single source of truth for Dev A's work. Refer back to this for module specifications, endpoint details, and integration points. Update it as requirements change.

Good luck! 🚀
