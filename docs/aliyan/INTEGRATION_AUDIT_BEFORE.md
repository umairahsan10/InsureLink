# Frontend–Backend Integration Audit — BEFORE Report

**Date:** March 31, 2026  
**Auditor:** Dev A (Aliyan)  
**Scope:** Every frontend page, component, hook, and API service vs backend controllers and Prisma schema

---

## Executive Summary

The backend is fully built (17 modules, 20 Prisma models). The frontend has **14 API service files** under `client/src/lib/api/` that correctly call the NestJS backend. However, **7 files still import JSON data from `client/src/data/`**, and **7 Next.js API routes** serve mock data. Several of these are dead code (unused), and 3 are actively used pages that need fixing.

---

## Overall Status

| Category | Count | Status |
|----------|-------|--------|
| Backend modules (server/src/modules/) | 17 | ✅ All built and registered in app.module.ts |
| Frontend API services (lib/api/) | 14 | ✅ All call the NestJS backend correctly |
| Frontend pages (total) | ~40 | 34 ✅ API-integrated, 3 🔴 JSON-based, 1 🟡 partial, 2 static |
| JSON data files (client/src/data/) | 21 | ⚠️ Exist; still imported by 7 files |
| Next.js mock API routes (app/api/) | 7 | 🔴 All serve JSON, none call backend |
| Dead code files (unused components) | 3+ | ⚠️ Should be cleaned up |

---

## Module-by-Module Integration Status

### ✅ Fully Integrated Modules (No Action Needed)

| Module | Frontend Pages | API Service | Status |
|--------|---------------|-------------|--------|
| **Auth** | Login, middleware, AuthContext | `lib/api/auth.ts` | ✅ Full lifecycle: login→store→refresh→logout |
| **Users** | Admin create-user | `lib/api/admin.ts` | ✅ Admin can create users with profiles |
| **Corporates** | Corporate dashboard, profile, employees, plans, claims | `lib/api/corporates.ts` | ✅ All pages call backend |
| **Employees** | Corporate employees page, add/bulk upload | `lib/api/employees.ts` | ✅ Full CRUD + bulk import |
| **Dependents** | Patient profile (add dependent), corporate review | `lib/api/dependents.ts` | ✅ CRUD + approval workflow |
| **Hospitals** | Hospital dashboard, profile, claims, visits, emergency contacts, patient hospitals | `lib/api/hospitals.ts` | ✅ Full CRUD + visits + geo-search |
| **Insurers** | Insurer dashboard, profile, plans, labs, hospitals | `lib/api/insurers.ts` | ✅ Full CRUD for insurers, plans, and labs |
| **Claims** | All 4 role-based claims pages | `lib/api/claims.ts` | ✅ Full CRUD + approve/reject/hold/pay + documents |
| **Patient** | Patient dashboard, claims, profile, history, labs | `lib/api/patients.ts` + `lib/api/claims.ts` | ✅ Full patient lifecycle |
| **Messaging** | ClaimChatModal, MessageButton, UnreadBadge | `lib/api/messaging.ts` | ✅ REST + Socket.IO real-time |
| **Notifications** | NotificationPanel, useNotifications hook | `lib/api/notifications.ts` | ✅ REST + Socket.IO real-time push |
| **Analytics** | All 3 role dashboards | `lib/api/analytics.ts` | ✅ Dashboard, claims, coverage analytics |
| **Audit** | Admin audit-logs page | `lib/api/audit.ts` | ✅ Paginated log viewing with filters |
| **File Upload** | Claim documents, chat attachments, CSV upload | Used via claims + messaging APIs | ✅ Supabase storage |
| **Admin** | Admin dashboard, create-user | `lib/api/admin.ts` | ✅ User management |

### 🔴 Pages Still Using JSON Data (Active — Need Fixing)

| # | File | JSON Imports | Impact | Fix Action |
|---|------|-------------|--------|------------|
| 1 | `app/hospital/patients/page.tsx` | `patients.json` | Entire page is JSON-only. No backend calls. Patients are hardcoded demo data. | Rewrite to use `patientsApi.getPatients()` for search, and backend registration |
| 2 | `app/hospital/patient-details/page.tsx` | `employees.json`, `plans.json`, `corporates.json`, `claims.json` | Entire page is JSON-only. Search, plan lookup, corporate lookup, claims history — all from JSON. | Rewrite to use `patientsApi.verifyPatient()` search + `claimsApi.getClaims()` for claims history |
| 3 | `app/insurer/corporates/page.tsx` | `corporates.json`, `employees.json` | Lists corporates from JSON + localStorage. No backend calls. | Rewrite to use `corporatesApi` or new insurer-specific endpoint |

### 🟡 Partially Integrated (Functional but has JSON fallback)

| # | File | JSON Imports | Impact | Fix Action |
|---|------|-------------|--------|------------|
| 4 | `app/hospital/visits/page.tsx` | `employees.json`, `dependents.json` | Primary data from backend API ✅. JSON used as name-lookup fallback when API response doesn't include nested relations. | Remove JSON fallback — backend response already includes `employee.user` and `dependent` relations |

### 🟡 Non-Functional Page (No Backend Integration)

| # | File | Issue | Fix Action |
|---|------|-------|------------|
| 5 | `app/onboard-corporate/page.tsx` | Static HTML form with no `onSubmit` handler. Button does nothing. (Onboard-hospital and onboard-insurer work fine.) | Wire form to `authApi.register()` + `corporatesApi` or `adminApi.createUserWithProfile()` to match the other onboard pages |

### 🔴 Dead Code — Unused Components Still Importing JSON

| # | File | JSON Imports | Who Imports It? | Action |
|---|------|-------------|-----------------|--------|
| 6 | `components/dashboards/PatientDashboard.tsx` | `claims.json` | **Nobody** — `patient/dashboard/page.tsx` has its own API-integrated implementation | Delete or leave (dead code) |
| 7 | `components/hospital/SubmitClaimForm.tsx` | `patients.json`, `claimsData.ts` | **Nobody** — `hospital/claims/page.tsx` uses `SubmitClaimFormV2.tsx` (API-integrated) | Delete or leave (dead code) |
| 8 | `components/insurer/CorporateEmployeesModal.tsx` | `employees.json` | `app/insurer/corporates/page.tsx` (which is itself JSON-based) | Fix when fixing #3 |

### 🔴 Mock Next.js API Routes (Legacy — Should Be Removed or Proxied)

| # | Route | Serves | Used By? | Action |
|---|-------|--------|----------|--------|
| 1 | `app/api/auth/route.ts` | Mock login (any email/password returns "mock-jwt-token") | **Nobody** — AuthContext uses `lib/api/auth.ts` → NestJS | Delete |
| 2 | `app/api/claims/route.ts` | `claims.json` filtered in-memory | **Nobody** — all claim pages use `lib/api/claims.ts` | Delete |
| 3 | `app/api/corporates/route.ts` | `corporates.json` filtered in-memory | **Nobody** — corporate pages use `lib/api/corporates.ts` | Delete |
| 4 | `app/api/employees/route.ts` | `employees.json` + fake CRUD | **Nobody** — employee pages use `lib/api/employees.ts` | Delete |
| 5 | `app/api/hospitals/route.ts` | `hospitals.json` filtered in-memory | **Nobody** — hospital pages use `lib/api/hospitals.ts` | Delete |
| 6 | `app/api/plans/route.ts` | `plans.json` filtered in-memory | **Nobody** — plan pages use `lib/api/insurers.ts` | Delete |
| 7 | `app/api/analytics/route.ts` | `analytics.json` as-is | **Nobody** — dashboards use `lib/api/analytics.ts` | Delete |

### ⚠️ Utility Files Using JSON Data

| # | File | JSON Imports | Impact | Action |
|---|------|-------------|--------|--------|
| 1 | `utils/claimsSyncUtils.ts` | `data/claimsData.ts` | Syncs hospital claims to insurer localStorage — legacy bridge layer from frontend-only era | Check if used; if dead code, delete |
| 2 | `utils/costBenchmarking.ts` | `claims.json`, `hospitals.json` | Statistical benchmarking for fraud detection document verification | Keep — used by `documentVerification.ts` for offline analysis |
| 3 | `utils/documentVerification.ts` | `hospitals.json` | Fraud detection scoring engine — maps hospital IDs to templates | Keep — used for document verification feature |
| 4 | `data/claimsData.ts` | N/A (TypeScript data) | localStorage-based claims persistence from frontend-only era | Check if used; may be dead code |

---

## Cross-Cutting Concerns

### WebSocket Integration
- ✅ `useClaimSocket.ts` — connects to backend Socket.IO for real-time claim messages
- ✅ `useNotifications.ts` — connects to backend Socket.IO for real-time notifications  
- ✅ `useWebSocket.ts` — generic WebSocket wrapper
- ✅ `lib/websocket/client.ts` — creates connections to backend URL

### Auth Token Lifecycle
- ✅ `AuthContext.tsx` → `lib/api/auth.ts` → NestJS `/api/auth/*` endpoints
- ✅ `lib/auth/session.ts` — token storage in localStorage
- ✅ `lib/api/client.ts` — auto-attaches Bearer token, refreshes on 401
- ✅ `middleware.ts` — route protection checking `auth_token` cookie
- ⚠️ `lib/auth/mockAuthAdapter.ts` — exists but may not be used in production

### File Upload Flow
- ✅ Claims documents → `claimsApi.uploadDocument()` → NestJS file-upload module → Supabase
- ✅ Chat attachments → `messagingApi.uploadAttachment()` → NestJS file-upload module → Supabase
- ✅ Bulk CSV → `employeesApi.uploadCsv()` → NestJS employees module

---

## Action Plan

### Must Fix (Affects Production Functionality)

1. **`app/hospital/patients/page.tsx`** — Rewrite to fetch patients from backend via `patientsApi`
2. **`app/hospital/patient-details/page.tsx`** — Rewrite to search patients via backend API, fetch claims/coverage from backend
3. **`app/insurer/corporates/page.tsx`** — Rewrite to fetch corporates from backend API via insurer-scoped endpoint
4. **`components/insurer/CorporateEmployeesModal.tsx`** — Rewrite to fetch employees from backend API
5. **`app/hospital/visits/page.tsx`** — Remove JSON fallbacks (backend already provides the data)
6. **`app/onboard-corporate/page.tsx`** — Wire form submission to backend registration

### Should Do (Cleanup)

7. Delete 7 mock Next.js API routes under `app/api/`
8. Delete or deprecate dead code: `PatientDashboard.tsx`, `SubmitClaimForm.tsx`
9. Check if `claimsSyncUtils.ts` and `data/claimsData.ts` are still used — if not, delete

### Nice to Have (Low Priority)

10. Remove `mockAuthAdapter.ts` if not used
11. Consider migrating `costBenchmarking.ts` and `documentVerification.ts` to use backend data (these are fraud detection utilities that currently operate on local JSON for offline analysis — acceptable for now)

---

## Files That Will NOT Be Changed

The following are intentionally static/local and don't need backend integration:
- **Explore pages** (`/explore/*`) — Static marketing/landing pages
- **`costBenchmarking.ts`** / **`documentVerification.ts`** — Fraud detection utilities using local analysis
- **`client/src/data/*.json`** — Will remain as reference data but won't be imported by any page after fixes
