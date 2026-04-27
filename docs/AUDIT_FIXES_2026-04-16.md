# Audit Pass — 2026-04-16

Summary of the codebase audit and fixes applied in one sitting. Groups by what was changed, what was deleted, and what remains open.

---

## 1. Environment templates (new)

Added `.env.example` files for developer onboarding. Both carry placeholder values for every variable used in the real `.env`. `.env` files themselves remain git-ignored.

- `server/.env.example` — Supabase, database, JWT, CORS, port
- `client/.env.example` — API base URL, Supabase public keys

> ⚠️ The real `server/.env` / `client/.env` were already committed to git history before this pass and contain live credentials. They must be **rotated in the Supabase dashboard** — scrubbing git history is a separate destructive action and was deferred.

---

## 2. Logging — `console.*` replaced with NestJS `Logger`

Every `console.log / warn / error` in the server source was replaced with a scoped `Logger` instance. Verbose debug dumps of user/claim payloads were either demoted to `logger.debug` (off in production by default) or trimmed to non-sensitive fields. Error paths now log with stack traces via `logger.error(msg, stack)`.

Files touched:

| File | Change |
|------|--------|
| `server/src/websockets/gateway.ts` | `logger.debug` for per-event sends; dropped full payload from log |
| `server/src/modules/claims/claims.service.ts` | three debug prints (`GET EVENTS`, `INSURER ACCESS CHECK`) consolidated into two `logger.debug` calls |
| `server/src/modules/claims/services/claim-processing.service.ts` | four `.catch(console.error)` → `logger.error` with stack |
| `server/src/modules/notifications/producers/dependent-notification.producer.ts` | verbose event + employee dumps removed; warn/error routed through logger |
| `server/src/modules/notifications/producers/claim-notification.producer.ts` | `catch` error path routed through logger with claim ID |
| `server/src/modules/notifications/services/in-app-notification.service.ts` | notification-sent log moved to `logger.debug`, trimmed to `{ id, userId, type }` |
| `server/src/modules/audit/interceptors/audit-log.interceptor.ts` | fire-and-forget audit failures routed through logger |

Grep for `console\.` in `server/src` returns zero matches.

---

## 3. Dead code deletions

### PDF extraction (server)

Tracing confirmed the server's PDF extraction was never reached. The real, working flow runs in the browser via `pdfjs-dist` in `client/src/components/insurer/DocumentExtractor.tsx`. Deleted:

- `POST /extract-pdf-image` route + `FileInterceptor` import in `server/src/app.controller.ts`
- `extractFirstImageFromPDF` method + pdfjs-dist TODO comments in `server/src/app.service.ts`
- The entire file `server/src/modules/file-upload/pdf-extraction.service.ts`

### Dead filter + guard (server)

- `server/src/common/filters/database-exception.filter.ts` — `DatabaseExceptionFilter` was exported but never registered. `main.ts` only wires `HttpExceptionFilter`.
- `server/src/common/guards/throttler.guard.ts` — `CustomThrottlerGuard` was exported but never referenced (not in `app.module` providers, not in any `@UseGuards`).

Corresponding re-export lines were removed from `server/src/common/filters/index.ts` and `server/src/common/guards/index.ts`.

### Orphaned ML util (client)

- `client/src/utils/mobilenetEmbedding.ts` — `getMobilenetEmbedding` / `cosineSimilarity` were exported but nothing imported them.
- `client/src/types/tensorflow-modules.d.ts` — type declarations for the two packages.
- `client/src/data/demoDocEmbeddings.json` — demo data referenced only by the orphaned util.

---

## 4. Unused dependency removal

### Client

- `@tensorflow/tfjs` — ~1 MB+ gzipped, used only by orphaned util above.
- `@tensorflow-models/mobilenet` — same.

### Server

- `@nestjs/typeorm` — zero usages anywhere.
- `typeorm` — only `QueryFailedError` imported by the dead `DatabaseExceptionFilter`.
- `@nestjs/throttler` — only imported by the dead `CustomThrottlerGuard`.

`pg` was kept (required peer of `@prisma/adapter-pg`).

---

## 5. Vulnerability audit

Ran `npm audit fix` on both sides. Stale `@ts-expect-error` in `client/src/components/hospitals/HospitalMap.tsx:56` was removed after Next.js upgraded past 16.1.7 (Leaflet types now resolve correctly without the hint).

| Side | Before | After |
|------|--------|-------|
| Client | 10 (8 high, 2 moderate) | **1 high** (`xlsx` — no fix available) |
| Server | 43 (1 critical, 24 high, 16 moderate, 2 low) | **5** (1 high `xlsx`, 4 moderate in Prisma dev-server chain) |

Key fixed CVEs:

- Next.js 16.0.7 → 16.1.7+ — 6 CVEs (request smuggling, Server Actions CSRF bypass, DoS via next/image, etc.)
- `socket.io-parser` — unbounded binary-attachment DoS
- `@nestjs/core` → `path-to-regexp` — injection
- `body-parser` — DoS via URL encoding

Critical finding **unchanged**: `handlebars` (transitive of `ts-jest`) is dev-only and never loaded in production runtime. Acceptable to leave.

### Remaining open vulns

- **`xlsx` (SheetJS)** — prototype pollution + ReDoS, 2 high CVEs. No fix exists on npm; upstream moved to a paid distribution. Used in `server/src/modules/employees/employees.service.ts` for Excel import/export. Replacement path is `exceljs`, which touches a live feature — deferred pending explicit buy-in.
- **Prisma dev-server chain** (`@prisma/dev`, `hono`, `@hono/node-server`, `brace-expansion`) — dev-only; used for `prisma migrate` / `prisma studio`. Not in production runtime. `npm audit fix --force` would require a breaking Prisma bump — deferred.

---

## 6. Build status

Both projects build cleanly at the end of this pass:

- `server` — `npm run build` ✓
- `client` — `npm run build` ✓ (after clearing `.next` cache, which held stale artifacts)

An unrelated pre-existing issue was noticed: `xlsx` was listed in `server/package.json` but missing from `node_modules` at the start, blocking the build on a clean clone. `npm install xlsx` restored it.

---

## 7. Open items deferred in this pass

These were discussed and explicitly deferred — documented here for future sessions.

### a) Fake-API modals investigation
Three UI spots flagged as "fake setTimeout instead of real API":

1. `client/src/components/modals/ClaimReviewModal.tsx:64,87` — **orphaned**, no imports anywhere. Real insurer approve/reject flow lives at `client/src/app/insurer/claims/page.tsx:226` and `client/src/app/insurer/dashboard/page.tsx:178`, using the real `claimsApi.approveClaim`.
2. `client/src/components/modals/AddHospitalModal.tsx:79` — **orphaned**, no imports.
3. `client/src/components/insurer/DocumentExtractor.tsx:437` (`handleUpload`) — **live**, mounted at `/insurer/document-extract`. Button only logs + toggles edit mode; no persistence. Product decision needed on whether it should create/update a claim.

Action later: confirm intent of the upload button and either delete the two orphan modals or wire all three to real endpoints.

### b) File upload MIME validation
Server currently validates uploads by MIME header only (`server/src/modules/file-upload/file-upload.controller.ts`), which is trivially spoofable. A magic-byte (file signature) check is the stronger alternative. Deferred because the upload flow is live and working — will revisit with a non-invasive approach (shadow-mode validation, tests first, feature flag).

### c) Auth tokens in `localStorage`
`client/src/lib/auth/session.ts` stores JWTs in `localStorage`, which is XSS-reachable. Moving to `HttpOnly` + `Secure` + `SameSite` cookies is the right fix but touches server auth + every client fetch. Deferred until a dedicated session.

### d) Other items from the audit not touched in this pass

- **Credential rotation** — `server/.env` contents are already in git history. Rotate Supabase service key, DB password, publishable key, JWT secrets through the Supabase dashboard. Git history scrubbing (BFG Repo-Cleaner) is destructive and deferred.
- **God-object files** — `server/src/modules/employees/employees.service.ts` (1761 lines), `client/src/admin/create-user/page.tsx` (1274), `client/src/components/insurer/DocumentExtractor.tsx` (1268), `client/src/app/hospital/claims/page.tsx` (1228). Structural refactor.
- **`any` types + strict TypeScript** — scattered `any` in controllers, gateway, analytics service. Enable `"strict": true` and remove incrementally.
- **Tests** — 6 server `.spec.ts`, **zero** client tests. Vitest + React Testing Library are already installed client-side.
- **CI/CD** — no `.github/workflows` present. Add lint + typecheck + test + audit on PRs.
- **READMEs** — both `server/README.md` and `client/README.md` are framework scaffolding boilerplate.

---

## File change summary

### Added
- `server/.env.example`
- `client/.env.example`
- `docs/AUDIT_FIXES_2026-04-16.md` (this file)

### Modified
- `server/src/websockets/gateway.ts`
- `server/src/modules/claims/claims.service.ts`
- `server/src/modules/claims/services/claim-processing.service.ts`
- `server/src/modules/notifications/producers/dependent-notification.producer.ts`
- `server/src/modules/notifications/producers/claim-notification.producer.ts`
- `server/src/modules/notifications/services/in-app-notification.service.ts`
- `server/src/modules/audit/interceptors/audit-log.interceptor.ts`
- `server/src/app.controller.ts` — removed dead PDF route
- `server/src/app.service.ts` — removed dead PDF method
- `server/src/common/filters/index.ts` — removed dead re-export
- `server/src/common/guards/index.ts` — removed dead re-export
- `server/package.json`, `server/package-lock.json` — removed `@nestjs/typeorm`, `typeorm`, `@nestjs/throttler`; `npm audit fix` patches
- `client/src/components/hospitals/HospitalMap.tsx` — removed unused `@ts-expect-error` after Next.js upgrade
- `client/package.json`, `client/package-lock.json` — removed `@tensorflow/tfjs`, `@tensorflow-models/mobilenet`; `npm audit fix` patches (including Next.js 16.0.7 → 16.1.7+)

### Deleted
- `server/src/modules/file-upload/pdf-extraction.service.ts`
- `server/src/common/filters/database-exception.filter.ts`
- `server/src/common/guards/throttler.guard.ts`
- `client/src/utils/mobilenetEmbedding.ts`
- `client/src/types/tensorflow-modules.d.ts`
- `client/src/data/demoDocEmbeddings.json`
