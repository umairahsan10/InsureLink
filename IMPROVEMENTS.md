# Codebase Improvements

Date: 2026-04-16  
Branch: `u-optimize`

This document records every improvement found during the codebase audit and the fix applied for each one. Findings are grouped by category and ordered by severity.

---

## Security

### 1. JWT Secret Fallback Removed

**File:** `server/src/modules/auth/strategies/jwt.strategy.ts`  
**Severity:** High

**Problem**  
The JWT strategy fell back to a hardcoded `'default-secret'` when `JWT_SECRET` was not set in the environment:

```typescript
// Before — insecure fallback
secretOrKey: configService.get<string>('jwt.secret') || 'default-secret',
```

Any attacker who knew the default string could forge valid tokens.

**Fix**  
Throw a hard error at startup if the secret is missing:

```typescript
// After — server refuses to start without a real secret
const secret = configService.get<string>('jwt.secret');
if (!secret) {
  throw new Error('JWT_SECRET environment variable is not set.');
}
super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), secretOrKey: secret });
```

---

### 2. Rate Limiting Added

**Files:** `server/src/app.module.ts`, `server/src/modules/auth/auth.controller.ts`  
**Severity:** High

**Problem**  
`ThrottlerModule` was not registered, so no rate limits were enforced on any endpoint. Login and register endpoints had no brute-force protection.

**Fix**  
Registered `ThrottlerGuard` globally (100 req/min per IP) and applied tighter per-route limits on auth endpoints:

```typescript
// app.module.ts — global default
ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])

// auth.controller.ts — tighter limits on sensitive routes
@Throttle({ default: { ttl: 60_000, limit: 10 } })   // login
@Throttle({ default: { ttl: 60_000, limit: 5 } })    // register
```

---

## Code Duplication

### 3. Shared Claim Formatter Utilities Extracted

**Files:**
- Created: `client/src/lib/claimFormatters.ts`
- Updated: `client/src/app/insurer/dashboard/page.tsx`
- Updated: `client/src/app/insurer/claims/page.tsx`

**Severity:** Medium

**Problem**  
Three helper functions were copy-pasted identically across multiple page files:

```typescript
// Duplicated in dashboard/page.tsx AND claims/page.tsx
function toNumber(val: any): number { ... }
function getPatientName(claim: Claim): string { ... }
function getHospitalName(claim: Claim): string { ... }
```

**Fix**  
Extracted to `client/src/lib/claimFormatters.ts` and replaced all inline copies with a single import:

```typescript
import { toNumber, getPatientName, getHospitalName } from "@/lib/claimFormatters";
```

---

## Type Safety

### 4. Socket Event Handlers Typed (no more `any`)

**File:** `client/src/hooks/useNotifications.ts`  
**Severity:** Medium

**Problem**  
Socket.io event callbacks used `any` for both the notification payload and the error object:

```typescript
socket.on("notification", (notification: any) => { ... });
socket.on("connect_error", (error: any) => { ... });
```

No TypeScript enforcement on the shape of incoming socket events.

**Fix**  
Replaced with explicit inline types that match the actual event shape:

```typescript
socket.on(
  "notification",
  (notification: {
    id: string;
    title: string;
    message: string;
    severity?: AlertNotification["severity"];
    category?: AlertNotification["category"];
    isRead?: boolean;
    timestamp?: string;
  }) => { ... }
);
socket.on("connect_error", (_err: Error) => setIsConnected(false));
```

---

### 5. `SubmitClaimFormV2` Callback Prop Typed

**File:** `client/src/components/hospital/SubmitClaimFormV2.tsx`  
**Severity:** Low

**Problem**  
The `onClaimSubmitted` prop accepted `any`, losing all type safety on the returned claim object:

```typescript
onClaimSubmitted?: (claim: any) => void;
```

**Fix**  
Typed with the existing `Claim` interface:

```typescript
import { claimsApi, type CreateClaimRequest, type Claim } from "@/lib/api/claims";

onClaimSubmitted?: (claim: Claim) => void;
```

---

## Dead Code

### 6. Debug `console.log/warn/error` Statements Removed

**File:** `client/src/hooks/useNotifications.ts`  
**Severity:** Low

**Problem**  
Six debug logging statements were left in the socket connection lifecycle, leaking internal implementation details to the browser console in production:

```typescript
console.warn("[useNotifications] No auth token found");
console.log("[useNotifications] Connecting to socket.io at", baseUrl);
console.log("[useNotifications] Socket connected");
console.log("[useNotifications] Socket disconnected");
console.error("[useNotifications] Socket connection error:", error);
console.log("[useNotifications] Received notification:", notification);
console.log("[useNotifications] Cleaning up socket connection");
```

**Fix**  
All removed. Connection state changes are tracked via React state (`isConnected`) which is already exposed from the hook.

---

### 7. Unused Import Removed

**File:** `client/src/app/insurer/claims/page.tsx`  
**Severity:** Low

**Problem**  
`AlertNotification` was imported but never referenced in the file.

**Fix**  
Import line removed.

---

## Remaining Findings (Not Yet Implemented)

These were identified during the audit but require more design work or carry higher risk:

| Finding | Severity | Notes |
|---------|----------|-------|
| Cookie `HttpOnly`/`Secure` flags missing | High | Requires server-side session handler; client cannot set these safely |
| Cross-organization ownership guards | High | Needs a new NestJS guard that does a DB lookup per request |
| Patient ownership not validated on claims | High | Same guard pattern as above |
| Document fraud scoring is client-side | Medium | Should be a server-side service; currently in `documentVerification.ts` |
| Audit log query endpoint missing | Medium | `AuditModule` exists but has no controller to query logs |
| Missing empty/error states on several pages | Medium | UX improvement; no functional impact |
| `statusBadge()` function duplicated across claim components | Low | Extract alongside `claimFormatters.ts` |
| `LoginForm` component exists but is unused | Low | Login page reimplements the form inline |

---

## Files Changed

### Server
| File | Change |
|------|--------|
| `server/src/modules/auth/strategies/jwt.strategy.ts` | Throw on missing `JWT_SECRET` |
| `server/src/modules/auth/auth.controller.ts` | Add `@Throttle` on login and register |
| `server/src/app.module.ts` | Register `ThrottlerModule` and `ThrottlerGuard` globally |
| `server/package.json` | Added `@nestjs/throttler` dependency |

### Client
| File | Change |
|------|--------|
| `client/src/lib/claimFormatters.ts` | **New file** — shared `toNumber`, `getPatientName`, `getHospitalName` |
| `client/src/app/insurer/dashboard/page.tsx` | Replace inline helpers with import from `claimFormatters` |
| `client/src/app/insurer/claims/page.tsx` | Replace inline helpers with import; remove unused `AlertNotification` |
| `client/src/hooks/useNotifications.ts` | Type socket events; remove all `console.*` statements |
| `client/src/components/hospital/SubmitClaimFormV2.tsx` | Type `onClaimSubmitted` as `(claim: Claim) => void` |
