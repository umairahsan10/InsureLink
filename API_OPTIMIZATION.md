# API Optimization Notes

Date: 2026-04-16  
Branch: `u-optimize`

This document records every performance problem found in the InsureLink codebase and the fix applied for each one.

---

## 1. Insurer Dashboard — 7 API calls → 2

**File:** `client/src/app/insurer/dashboard/page.tsx`

### Problem
The dashboard fired **7 parallel `GET /api/v1/claims`** requests on every load, each with `limit: 1`, purely to read the `meta.total` field from the pagination envelope:

```
GET /api/v1/claims?limit=1                    → totalClaims
GET /api/v1/claims?status=Pending&limit=1     → pendingCount
GET /api/v1/claims?status=Approved&limit=1    → approvedCount
GET /api/v1/claims?status=Rejected&limit=1    → rejectedCount
GET /api/v1/claims?status=OnHold&limit=1      → onHoldCount
GET /api/v1/claims?status=Paid&limit=1        → paidCount
GET /api/v1/claims?priority=High&limit=1      → flaggedCount
```

Each of these hit the database independently — 7 separate `COUNT(*)` queries for a single page load.

### Fix
Replaced with **2 parallel requests**:

```
GET /api/v1/claims?status=Pending&limit=3   → actual claim rows for the table
GET /api/v1/claims/stats                    → all counts in one DB round-trip
```

---

## 2. Hospital Dashboard — 3 API calls → 2

**File:** `client/src/app/hospital/dashboard/page.tsx`

### Problem
Three parallel requests on load, two of which existed only to count:

```
GET /api/v1/claims?limit=10                   → claim rows for the table
GET /api/v1/claims?status=Pending&limit=1     → pendingApproval count
GET /api/v1/claims?status=Approved&limit=1    → approvedToday count
```

### Fix
Replaced with **2 parallel requests**:

```
GET /api/v1/claims?limit=10    → claim rows for the table
GET /api/v1/claims/stats       → all counts in one DB round-trip
```

---

## 3. New Endpoint — `GET /api/v1/claims/stats`

**Files:**
- `server/src/modules/claims/repositories/claims.repository.ts` — `getStats()`
- `server/src/modules/claims/claims.service.ts` — `getStats()`
- `server/src/modules/claims/claims.controller.ts` — `GET /claims/stats`
- `client/src/lib/api/claims.ts` — `claimsApi.getClaimStats()`

### What it returns

```json
{
  "total": 120,
  "Pending": 14,
  "Approved": 60,
  "Rejected": 20,
  "OnHold": 10,
  "Paid": 16,
  "highPriority": 8
}
```

### How it works
The repository runs **two parallel DB queries**:

1. `claim.groupBy({ by: ['claimStatus'], _count: { id: true } })` — all status counts in one SQL `GROUP BY`
2. `claim.count({ where: { priority: 'High' } })` — high-priority count

Role filtering is applied the same way as `findAll`, so each role only sees counts for their own organisation.

> **Note:** The route `GET /claims/stats` is declared *before* `GET /claims/:id` in the controller so that Express does not interpret the string `"stats"` as a claim ID.

---

## 4. Analytics — `getClaimsPerCorporate` (DB groupBy instead of in-memory loop)

**File:** `server/src/modules/analytics/analytics.service.ts`

### Problem
```typescript
// Before — fetches every claim row into Node.js memory
const claims = await prisma.claim.findMany({
  where,
  select: { amountClaimed: true, corporateId: true, corporate: { select: { name: true } } },
});
// then manually loops and sums
```

This loaded the full claims dataset for the scope (e.g. all claims for an insurer) into application memory and aggregated in JavaScript, including a `JOIN` to the `corporates` table on every row.

### Fix
```typescript
// After — COUNT and SUM happen in Postgres via GROUP BY
const grouped = await prisma.claim.groupBy({
  by: ['corporateId'],
  _count: { id: true },
  _sum: { amountClaimed: true },
  where,
  orderBy: { _sum: { amountClaimed: 'desc' } },
});

// One batch lookup for corporate names — no per-row JOIN
const corporates = await prisma.corporate.findMany({
  where: { id: { in: grouped.map(g => g.corporateId) } },
  select: { id: true, name: true },
});
```

**Result:** The aggregation is now done entirely in the database. Only the final summary rows are transferred to Node.js, not every individual claim row.

---

## 5. Analytics — `getAvgProcessingTime` (2 queries → 1 joined query)

**File:** `server/src/modules/analytics/analytics.service.ts`

### Problem
```typescript
// Query 1 — fetch resolved claims
const resolvedClaims = await prisma.claim.findMany({
  where: { ...where, claimStatus: { in: ['Approved', 'Rejected'] } },
  select: { id: true, createdAt: true },
});

// Query 2 — fetch events separately, then build a Map to correlate
const events = await prisma.claimEvent.findMany({
  where: { claimId: { in: claimIds }, action: { in: ['CLAIM_APPROVED', 'CLAIM_REJECTED'] } },
  ...
});
```

Two sequential database queries with application-level correlation via a `Map`.

### Fix
```typescript
// Single query — Postgres does the JOIN, take:1 limits to the first resolution event
const resolvedClaims = await prisma.claim.findMany({
  where: { ...where, claimStatus: { in: ['Approved', 'Rejected'] } },
  select: {
    createdAt: true,
    claimEvents: {
      where: { action: { in: ['CLAIM_APPROVED', 'CLAIM_REJECTED'] } },
      select: { timestamp: true },
      orderBy: { timestamp: 'asc' },
      take: 1,
    },
  },
});
```

**Result:** One round-trip instead of two. The event lookup and correlation happen inside Postgres.

---

## 6. Analytics — `getTopHospitals` (remove per-row hospital name JOIN)

**File:** `server/src/modules/analytics/analytics.service.ts`

### Problem
```typescript
// Before — hospital.hospitalName is eagerly joined on every claim row
const claims = await prisma.claim.findMany({
  where,
  select: {
    amountClaimed: true,
    hospitalVisit: {
      select: {
        hospitalId: true,
        hospital: { select: { hospitalName: true } },  // ← JOIN per row
      },
    },
  },
});
```

If 500 claims existed, Postgres executed 500 lookups into the `hospitals` table (or a large join producing 500 result rows with repeated hospital data).

### Fix
```typescript
// After — minimal select, no hospital name per row
const claims = await prisma.claim.findMany({
  where,
  select: {
    amountClaimed: true,
    hospitalVisit: { select: { hospitalId: true } },
  },
});

// Aggregate in memory (only hospitalId needed), then one batch fetch for names
const top10 = Array.from(hospitalTotals.entries()).sort(...).slice(0, 10);

const hospitals = await prisma.hospital.findMany({
  where: { id: { in: top10.map(([id]) => id) } },
  select: { id: true, hospitalName: true },
});
```

> **Why not use `groupBy` here?** `hospitalId` lives on `HospitalVisit`, not on `Claim`. Prisma's `groupBy` only works on direct scalar fields of the model being grouped, so a cross-relation groupBy is not possible without raw SQL. The batch-fetch pattern is the next-best option.

**Result:** The hospital name lookup is now one query for ≤ 10 rows instead of a JOIN multiplied across every claim row.

---

## Summary Table

| # | Location | Before | After | Saving |
|---|----------|--------|-------|--------|
| 1 | Insurer dashboard | 7 HTTP requests | 2 HTTP requests | −5 requests per load |
| 2 | Hospital dashboard | 3 HTTP requests | 2 HTTP requests | −1 request per load |
| 3 | `getClaimsPerCorporate` | `findMany` all claims + per-row JOIN + JS loop | `groupBy` in DB + 1 batch name lookup | Eliminates full-table scan into memory |
| 4 | `getAvgProcessingTime` | 2 sequential DB queries + JS Map correlation | 1 joined query | −1 DB round-trip per analytics call |
| 5 | `getTopHospitals` | Per-row hospital JOIN (N joins) | Minimal select + 1 batch name lookup | N joins → 1 query for ≤ 10 rows |

---

## Files Changed

### Server
| File | Change |
|------|--------|
| `server/src/modules/claims/repositories/claims.repository.ts` | Added `getStats()` |
| `server/src/modules/claims/claims.service.ts` | Added `getStats()` |
| `server/src/modules/claims/claims.controller.ts` | Added `GET /claims/stats` route |
| `server/src/modules/analytics/analytics.service.ts` | Optimised `getClaimsPerCorporate`, `getAvgProcessingTime`, `getTopHospitals` |

### Client
| File | Change |
|------|--------|
| `client/src/lib/api/claims.ts` | Added `claimsApi.getClaimStats()` |
| `client/src/app/insurer/dashboard/page.tsx` | `fetchData`: 7 calls → 2 |
| `client/src/app/hospital/dashboard/page.tsx` | `fetchClaims`: 3 calls → 2 |
