# Claims Sync Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOSPITAL PORTAL                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Hospital Claims Page Component              │  │
│  └──────────────────────────────────────────────────────────┘  │
│           ↓                                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Load hardcoded claims from claims.json                │  │
│  │ 2. Call syncHardcodedClaimsToInsurer()                  │  │
│  │ 3. Convert to insurer format                            │  │
│  │ 4. Merge with existing insurer claims                   │  │
│  │ 5. Persist back to insurer localStorage                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│           ↓                                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Event Listeners (mounted)                               │  │
│  │ - CLAIMS_UPDATED_EVENT                                  │  │
│  │ - storage event (cross-tab sync)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│           ↓                                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ allClaimsData useMemo (dependency: localClaims)          │  │
│  │ - Combine hardcoded + new claims                        │  │
│  │ - Call syncAllClaimsWithInsurer()                       │  │
│  │ - Fetch latest from insurer localStorage                │  │
│  │ - Update statuses                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│           ↓                                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │       Display Claims with Updated Status                │  │
│  │  "Pending" → "Approved" ✓                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           ↕  (event sync)
┌─────────────────────────────────────────────────────────────────┐
│                        INSURER PORTAL                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Insurer Claims Page Component                │  │
│  └──────────────────────────────────────────────────────────┘  │
│           ↓                                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Load claims from localStorage (insurerClaimsData)     │  │
│  │ 2. Display to insurer (including synced hospital claims)│  │
│  │ 3. Show status and action buttons                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│           ↓                                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ User Actions                                            │  │
│  │ - Click Approve/Reject button                           │  │
│  │ - updateClaimStatus() called                            │  │
│  │ - persistClaims() called                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│           ↓                                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ persistClaims() Action                                  │  │
│  │ 1. Update claim status in array                         │  │
│  │ 2. Save to localStorage (insurerClaimsData)            │  │
│  │ 3. Dispatch CLAIMS_UPDATED_EVENT (custom event)        │  │
│  │ 4. Browser dispatches storage event                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Structure Flow

```
claims.json (Hospital Static Data)
├─ clm-0001
│  ├─ id: "clm-0001"
│  ├─ employeeName: "Ali Raza"
│  ├─ hospitalId: "hosp-001"
│  ├─ status: "Pending"
│  └─ amountClaimed: 125000
│
└─ clm-0008
   └─ ... (similar structure)

        ↓ syncHardcodedClaimsToInsurer()

convertClaimToClaimData()
├─ id: "clm-0001"
├─ patient: "Ali Raza"
├─ hospital: "City General Hospital"
├─ status: "Pending"
├─ amount: 125000
└─ priority: "Normal"

        ↓ Merge with existing insurer claims

insurerClaimsData (localStorage)
├─ CLM-2025-0001 (default insurer claim)
├─ clm-0001 (synced from hospital)
├─ clm-0008 (synced from hospital)
└─ ... other claims

        ↓ Insurer updates status

insurerClaimsData (localStorage) - UPDATED
├─ CLM-2025-0001
│  └─ status: "Approved"
├─ clm-0001
│  └─ status: "Approved" ← CHANGED
└─ ...

        ↓ CLAIMS_UPDATED_EVENT fired

Hospital Page Listener Detects Update
        ↓
syncAllClaimsWithInsurer()
        ↓
Hospital Claim Updated
├─ id: "clm-0001"
├─ status: "Approved" ← SYNCED
├─ approvedAmount: 125000
└─ updatedAt: "2025-12-11T..."

        ↓
Display in Hospital Portal
"clm-0001: Ali Raza - Approved ✓"
```

## Component Dependency Tree

```
HospitalClaimsPage
├─ useState: localClaims
├─ useState: isHydrated
├─ useState: ... (other UI states)
│
├─ useEffect 1: Load from localStorage + syncHardcodedClaimsToInsurer()
│  └─ Calls: syncHardcodedClaimsToInsurer(defaultClaims)
│
├─ useEffect 2: Save localClaims to localStorage
│
├─ useMemo: allClaimsData
│  ├─ Dependencies: [localClaims, isHydrated]
│  ├─ Calls: syncAllClaimsWithInsurer(uniqueClaims)
│  └─ Returns: Updated claims with insurer status
│
├─ useEffect 3: Event Listeners
│  ├─ Listen: CLAIMS_UPDATED_EVENT
│  │  └─ Calls: handleInsurerClaimsUpdate()
│  │     ├─ Updates: setLocalClaims()
│  │     └─ Triggers: allClaimsData re-run
│  │
│  └─ Listen: storage event
│     └─ Calls: handleStorage()
│        ├─ Calls: loadStoredClaims()
│        ├─ Updates: setLocalClaims()
│        └─ Triggers: allClaimsData re-run
│
└─ useMemo: allClaims (filtered, sorted, mapped)
   └─ Dependency: allClaimsData
      └─ Displayed to user
```

## State Update Flow

```
USER ACTION (Insurer approves claim)
    ↓
Insurer Portal: updateClaimStatus()
    ↓
persistClaims(updated)
    ↓
localStorage updated + CLAIMS_UPDATED_EVENT fired
    ↓
Hospital Page Listener: handleInsurerClaimsUpdate()
    ↓
setLocalClaims(updated)
    ↓
allClaimsData useMemo triggered (dependency: localClaims)
    ↓
syncAllClaimsWithInsurer(uniqueClaims)
    ├─ Fetches: loadStoredClaims() from insurer localStorage
    ├─ Finds: Matching claim by ID
    ├─ Updates: status + approvedAmount
    └─ Returns: Updated claims array
    ↓
Hospital View Re-renders
    ↓
USER SEES: Claim status is now "Approved" ✓
```

## Timeline of Events

```
T0: Hospital page loads
    ├─ Load hardcoded claims from claims.json
    ├─ syncHardcodedClaimsToInsurer() executed
    ├─ Insurer localStorage updated with hardcoded claims
    └─ Hospital shows claims (status from claims.json)

T1: User navigates to Insurer portal
    └─ See synced claims from hospital + default claims

T2: Insurer approves a hardcoded claim
    ├─ updateClaimStatus() called
    ├─ persistClaims() called
    ├─ localStorage updated
    ├─ CLAIMS_UPDATED_EVENT fired
    └─ storage event fired

T3: Hospital page listener detects change
    ├─ handleInsurerClaimsUpdate() or handleStorage()
    ├─ setLocalClaims() called
    └─ Triggers dependency chain

T4: allClaimsData useMemo re-runs
    ├─ syncAllClaimsWithInsurer() called
    ├─ Fetches latest from insurer localStorage
    ├─ Updates claim status
    └─ Returns updated claims

T5: Hospital view re-renders
    └─ User sees: claim status is now "Approved" ✓
```

## Error Prevention

```
Claim Sync Validation

1. ID Matching
   - Hospital: id (from claims.json)
   - Insurer: id (same value)
   - Match: Yes → Sync approved

2. Status Update
   - Only update if: insurerStatus !== hospitalStatus
   - Preserves: createdAt timestamp
   - Updates: updatedAt with new timestamp

3. Amount Handling
   - If approved: approvedAmount = amountClaimed
   - If not approved: approvedAmount = 0
   - Never override: amountClaimed

4. Type Safety
   - Status validated: "Pending" | "Approved" | "Rejected"
   - All fields properly typed
   - No undefined values in synced claims
```
