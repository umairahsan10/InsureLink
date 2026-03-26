# Module-by-Module Backend Integration Plan (Dev A)

**Version:** 1.0  
**Date:** March 15, 2026  
**Owner:** Aliyan (Dev A)  
**Context:** Frontend was initially built with mock/static data. Backend APIs now exist and are being integrated progressively.

---

## 1. Objective

Integrate backend APIs into frontend **module by module**, completing each module end-to-end (frontend + backend fixes) before moving to the next one.

This avoids scattered partial integrations and keeps testing focused and reliable.

---

## 2. Current Status

- Auth backend: implemented.
- Auth frontend integration: merged from main and working.
- Corporate and Patient (employee) auth UI checks: passed.
- Client build: passing.
- Server build: passing.
- Existing frontend contains many mock/local JSON/localStorage flows that now need real API wiring.

---

## 3. Agreed Approach

We will use a **vertical slice** strategy:

1. Pick one module.
2. List all frontend features/screens in that module.
3. Map each feature to existing backend endpoint(s).
4. Replace mock/static data with API integration.
5. Fix backend gaps found during UI testing.
6. Re-test module flows in UI.
7. Mark module complete and move to next module.

---

## 4. Execution Sequence

### Phase 0: Auth Stabilization (already in progress, mostly done)

- Confirm login/logout/refresh/me/protected route behavior.
- Keep this as baseline while integrating all other modules.

### Phase 1: Corporates

Why first:
- Corporate context is foundational for employees and dependents.
- Corporate-facing pages currently include static/mock behavior.

Primary targets:
- Corporate profile
- Corporate employees entry points
- Corporate dashboard cards/counts
- Corporate claims view (as applicable to available APIs)

### Phase 2: Employees

Why second:
- APIs are already tested from Postman.
- Employee flows are central to dependent and patient data.

Primary targets:
- Employee list/search/filter/pagination
- Create/update/delete employee
- Coverage view
- Bulk import validate/commit flow

### Phase 3: Dependents

Why third:
- Depends on employee identities and corporate workflows.

Primary targets:
- List dependents by employee
- Create dependent
- Approve/reject flow
- Dependent status updates in UI

### Phase 4: Patients

Why fourth:
- Patient pages consume outputs from employee/dependent/claims coverage relations.

Primary targets:
- Patient profile/coverage
- Patient claims linkage
- Patient history
- Eligibility-related views

### Phase 5: Cross-module polish

- Standardized error handling and loading states.
- Remove remaining mock references for completed modules.
- Final regression pass across all integrated modules.

---

## 5. Module Workflow (Playbook)

Use this exact checklist for every module.

### Step A: Inventory

- List frontend pages/components for the module.
- Mark each feature as `Mock`, `Partial API`, or `API-ready`.

### Step B: API Mapping

For each feature:
- Identify endpoint method + path.
- Confirm request payload shape.
- Confirm response shape used by UI.
- Note auth/role requirements.

### Step C: Integration

- Replace local JSON/localStorage mock reads with API calls.
- Use shared API layer (`client/src/lib/api/client.ts`) for consistency.
- Keep temporary adapters only if migration is incremental.

### Step D: UI State Hardening

- Add loading states for fetch actions.
- Add user-friendly empty states.
- Add clear error messages for 400/401/403/404/409/500.

### Step E: Backend Gap Fixes (if discovered)

- Add missing endpoint/field/filter only when needed by real UI.
- Keep changes minimal and testable.
- Rebuild and re-test impacted flow immediately.

### Step F: Done Gate for Module

A module is complete only when:
- All key flows run from UI with real backend.
- No mock dependency remains for completed features.
- Build passes (client + server).
- Smoke tests pass for role-specific user journeys.

---

## 6. Practical Guidelines

### 6.1 API Client Standard

- For new work, use the centralized client in `client/src/lib/api/client.ts`.
- Do not introduce new usage of legacy API wrappers.
- Migrate legacy usage gradually while touching related files.

### 6.2 Endpoint and DTO Discipline

- Do not assume request shapes; confirm controller DTOs first.
- Keep frontend payload keys exactly aligned with backend DTO validations.
- Prefer backend-driven enums/status values over frontend hardcoded strings.

### 6.3 Error Handling Rules

- Show readable messages to user.
- Log full technical error in console for debugging.
- Treat 401 as session issue; rely on refresh flow and redirect behavior.
- Surface 409 conflicts with field/value details when provided.

### 6.4 Testing Rules Per Feature

For each integrated feature, validate:
- Happy path.
- Validation failure path.
- Unauthorized/forbidden path.
- Empty data path.
- Refresh/retry path (if applicable).

### 6.5 Git/Delivery Rules

- Commit per feature group (small commits).
- Keep commit messages explicit (module + flow).
- Avoid mixing unrelated module work in one commit.

---

## 7. Suggested Milestones

### Milestone 1
- Auth stable baseline + Corporate core integration complete.

### Milestone 2
- Employees complete including bulk import validate/commit.

### Milestone 3
- Dependents complete with approval workflow integrated.

### Milestone 4
- Patients complete with real data wiring.

### Milestone 5
- Full module regression + cleanup of remaining mock artifacts.

---

## 8. Out-of-Scope for Now

- Deployment/render pipeline issues not caused by current integration work.
- Large refactors unrelated to module integration.
- Full dependency vulnerability hardening (can be planned separately).

---

## 9. Immediate Next Action

Start with **Corporate module inventory and API mapping**:

1. List corporate pages/features currently using mock data.
2. Map each to available backend endpoint.
3. Integrate one feature at a time and verify in UI.

This document is the operating guide for Dev A integration until all target modules are API-backed.
