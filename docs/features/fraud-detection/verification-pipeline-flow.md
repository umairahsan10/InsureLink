# Document Verification Pipeline Flow

This document describes the complete step-by-step flow of the fraud detection verification system, from user upload to final result display.

**Last Updated:** November 2025

---

## Overview

The verification pipeline runs multiple checks in sequence, each potentially modifying the trust score and adding reasons. The system starts with a score of 100 and deducts points for each issue found, resulting in a final score between 0-100.

**Score Thresholds:**
- **Auto Accept:** Score ≥ 80
- **Needs Review:** Score 50-79
- **High Risk:** Score < 50

---

## Phase 1: Initialization (On Page Load)

### Benchmark Calculation (`costBenchmarking.ts`)

**When:** Once when the page loads (cached in localStorage)

**Process:**
1. Load `claims.json` and `hospitals.json`
2. Group claims by dimensions:
   - **Primary:** Treatment Category + Hospital Tier (e.g., "Routine Checkup|Tier-2")
   - **Fallback 1:** Treatment Category only (e.g., "Routine Checkup")
   - **Fallback 2:** Hospital ID only (e.g., "hosp-001")
   - **Optional:** Corporate ID
3. Calculate statistics for each group:
   - Mean (average)
   - Standard deviation
   - Percentiles (75th, 90th, 95th)
   - Min/Max values
4. Cache results in localStorage for performance

**Output:** Multi-dimensional benchmark data structure ready for lookups

---

## Phase 2: User Action - "Run Verification"

When user clicks "Run Verification" button, the pipeline executes in the following order:

---

## Step 1: Document Hash Check

**Function:** `computeSha256()` → Duplicate Detection

**Process:**
```
File Upload
  ↓
Calculate SHA-256 hash of file (using Web Crypto API)
  ↓
Check hash against stored hashes (localStorage, last 25 hashes)
  ↓
Decision Point:
  ├─ Hash found in storage?
  │   ├─ YES → Duplicate Detected
  │   │   ├─ Set duplicateDetected = true
  │   │   ├─ Add reason: "Duplicate detected: matches a previously uploaded document hash"
  │   │   ├─ Deduct: -50 points
  │   │   └─ Auto-mark hash as suspicious (no manual step needed)
  │   │
  │   └─ NO → New Document
  │       └─ Store hash in localStorage for future checks
  │
  └─ Hash calculation failed?
      ├─ Add reason: "Unable to compute SHA-256 hash"
      └─ Deduct: -10 points
```

**Score Impact:**
- Duplicate: -50 points
- Hash calculation failure: -10 points
- New document: No deduction (stored for future)

---

## Step 2: Field Validation

**Function:** Amount Consistency Check

**Process:**
```
Extract: totalAmount, lineItemsTotal
  ↓
Both values provided?
  ├─ NO → Add reason: "Total or line items amount missing"
  │   └─ Deduct: -5 points
  │
  └─ YES → Calculate difference
      ├─ |totalAmount - lineItemsTotal| > 1 PKR?
      │   ├─ YES → Mismatch
      │   │   ├─ Add reason: "Total amount does not match the sum of line items"
      │   │   └─ Deduct: -20 points
      │   │
      │   └─ NO → Match
      │       └─ Bonus: +5 points
```

**Score Impact:**
- Mismatch: -20 points
- Missing data: -5 points
- Match: +5 points bonus

---

## Step 3: Date Validation

**Function:** Chronological Order Check

**Process:**
```
Extract: admissionDate, dischargeDate
  ↓
Both dates provided?
  ├─ NO → Add reason: "Admission or discharge date missing"
  │   └─ Deduct: -5 points
  │
  └─ YES → Compare dates
      ├─ dischargeDate < admissionDate?
      │   ├─ YES → Invalid order
      │   │   ├─ Add reason: "Discharge date occurs before admission date"
      │   │   └─ Deduct: -15 points
      │   │
      │   └─ NO → Valid order
      │       └─ Bonus: +5 points
```

**Score Impact:**
- Invalid order: -15 points
- Missing data: -5 points
- Valid order: +5 points bonus

---

## Step 4: Template Matching

**Function:** Hospital Template Keyword Verification

**Process:**
```
User selected hospital template?
  ├─ NO → Add reason: "No hospital template selected"
  │   └─ Deduct: -5 points
  │
  └─ YES → Check text snippet
      ├─ Snippet provided?
      │   ├─ NO → Add reason: "Template selected but no text snippet provided"
      │   │   └─ Deduct: -5 points
      │   │
      │   └─ YES → Search for required keywords
      │       ├─ All keywords found?
      │       │   ├─ YES → Match
      │       │   │   └─ Bonus: +10 points
      │       │   │
      │       │   └─ NO → Mismatch
      │       │       ├─ Add reason: "Template mismatch: missing keywords [list]"
      │       │       └─ Deduct: -25 points
```

**Score Impact:**
- Template mismatch: -25 points
- Missing snippet: -5 points
- No template: -5 points
- Match: +10 points bonus

**Note:** This is temporary until OCR integration. Once OCR is ready, text will be auto-extracted from the document.

---

## Step 5: Cost Benchmarking Checks

**Function:** Multi-dimensional Statistical Analysis

**Prerequisites:** `totalAmount > 0` AND `admissionDate` AND `dischargeDate` provided

### Step 5.1: Category & Hospital Identification

**Process:**
```
Treatment Category:
  ├─ User provided? → Use user selection (REQUIRED)
  └─ Not provided? → Validation error (form prevents submission)

Hospital ID:
  ├─ Provided in input? → Use input.hospitalId
  └─ Not provided? → Map from template key:
      ├─ city-general → hosp-001
      ├─ karachi-care → hosp-002
      └─ rehman-clinic → hosp-004

Hospital Tier:
  └─ Lookup from hospitals.json using hospitalId
      └─ Returns: Tier-1, Tier-2, or Tier-3
```

### Step 5.2: Benchmark Lookup (with Fallback Chain)

**Function:** `getBenchmarkForClaim(treatmentCategory, hospitalTier, hospitalId)`

**Process:**
```
Try in order (first match with sufficient data wins):

1. Primary: treatmentTier: "Routine Checkup|Tier-2"
   ├─ Found AND count >= 3? → Use this benchmark
   └─ Not found OR count < 3? → Try next

2. Fallback 1: treatment: "Routine Checkup"
   ├─ Found? → Use this benchmark
   └─ Not found? → Try next

3. Fallback 2: hospital: "hosp-001"
   ├─ Found? → Use this benchmark
   └─ Not found? → Skip cost checks (graceful degradation)
```

**Why Fallback?**
- Ensures checks run even with limited historical data
- New hospitals/treatments don't break the system
- More specific benchmarks preferred when available

### Step 5.3: Amount Comparison (if benchmark found)

**Process:**
```
Calculate ratio = claimAmount / benchmark.mean
  ↓
Ratio >= 3?
  ├─ YES → Critical flag
  │   ├─ Add reason: "Claim amount is 3.0× above average for [category] at [tier] hospitals (avg: Rs. X)"
  │   └─ Deduct: -50 points
  │
  └─ NO → Check ratio >= 2?
      ├─ YES → Suspicious flag
      │   ├─ Add reason: "Claim amount is 2.0× above average for [category] at [tier] hospitals (avg: Rs. X)"
      │   └─ Deduct: -30 points
      │
      └─ NO → Within normal range (no deduction)
```

**Score Impact:**
- 3×+ above average: -50 points
- 2-3× above average: -30 points
- Within range: No deduction

### Step 5.4: Statistical Analysis (if benchmark found)

**Process:**
```
Calculate Z-Score:
  zScore = (amount - mean) / stdDev
  ↓
zScore > 3?
  ├─ YES → Extreme outlier
  │   ├─ Add reason: "Statistical outlier: Claim amount is X standard deviations above mean (top 0.1% of claims)"
  │   └─ Deduct: -40 points
  │
  └─ NO → Check zScore > 2?
      ├─ YES → Significant outlier
      │   ├─ Add reason: "Statistical outlier: Claim amount is X standard deviations above mean (top 5% of claims)"
      │   └─ Deduct: -20 points
      │
      └─ NO → Within normal distribution

Check Percentile:
  amount > benchmark.percentile95?
  ├─ YES → High percentile
  │   ├─ Add reason: "Claim amount exceeds 95th percentile (Rs. X) for this category"
  │   └─ Deduct: -15 points
  │
  └─ NO → Within normal range
```

**Score Impact:**
- Z-score > 3: -40 points
- Z-score > 2: -20 points
- Above 95th percentile: -15 points

### Step 5.5: Category Mismatch Detection

**Process:**
```
Infer category from amount:
  > 100k → Surgery
  50k-100k → Cardiology
  10k-50k → Routine Checkup
  < 10k → Lab Test
  ↓
Compare: user selection vs inferred
  ↓
Mismatch?
  ├─ YES → Validation error
  │   ├─ Add reason: "Category mismatch: Selected '[selected]' but amount suggests '[inferred]'. Please verify the correct category."
  │   └─ Deduct: -25 points
  │
  └─ NO → Match (no deduction)
```

**Score Impact:**
- Mismatch: -25 points
- Match: No deduction

**Purpose:** Catches errors or intentional misclassification

### Step 5.6: Length of Stay Validation

**Process:**
```
Calculate lengthOfStay = dischargeDate - admissionDate (in days)
  ↓
Get typical range for treatment category:
  Surgery: 1-7 days
  Emergency Care: 1-3 days
  Routine Checkup: 1-2 days
  Lab Test: 1 day
  Maternity: 2-5 days
  Cardiology: 2-5 days
  Orthopedics: 1-5 days
  General Consultation: 1-2 days
  ↓
Stay outside typical range?
  ├─ YES → Abnormal
  │   ├─ Add reason: "Length of stay (X days) is outside typical range for [category] (min-max days)"
  │   └─ Deduct: -15 points
  │
  └─ NO → Normal (no deduction)
```

**Score Impact:**
- Outside range: -15 points
- Within range: No deduction

### Step 5.7: Cost Per Day Analysis

**Process:**
```
Calculate costPerDay = totalAmount / lengthOfStay
  ↓
Calculate avgCostPerDay = benchmark.mean / typicalAvgStay
  ↓
costPerDay > avgCostPerDay × 2?
  ├─ YES → Unusually high daily cost
  │   ├─ Add reason: "Cost per day (Rs. X) is unusually high for this treatment category"
  │   └─ Deduct: -10 points
  │
  └─ NO → Normal (no deduction)
```

**Score Impact:**
- Unusually high: -10 points
- Normal: No deduction

**Purpose:** Catches inflated daily charges even if total amount seems reasonable

---

## Phase 3: Final Score Calculation

**Process:**
```
Starting Score: 100
  ↓
Apply all deductions from Steps 1-5
  ↓
Apply all bonuses from Steps 2-4
  ↓
Clamp score: Math.max(0, Math.min(100, score))
  ↓
Determine Status:
  ├─ score >= 80 → "Auto Accept"
  ├─ score 50-79 → "Needs Review"
  └─ score < 50 → "High Risk"
```

**Important:** Score can never go below 0 or above 100

---

## Phase 4: Result Assembly

**Function:** `verifyDocumentLocally()` returns `DocumentVerificationResult`

**Output Structure:**
```typescript
{
  score: number,              // 0-100
  reasons: string[],          // All flags, warnings, and notes
  sha256?: string,            // Document hash
  duplicateDetected: boolean, // Whether duplicate was found
  templateLabel?: string,     // Hospital name from template
  metadataNote: string        // Placeholder for future metadata checks
}
```

---

## Phase 5: Result Display

**UI Component:** Result Modal (`hospital/claims/page.tsx`)

**Display:**
1. **Trust Score:** Large number (0-100) with color coding
2. **Status Badge:** Auto Accept / Needs Review / High Risk
3. **Reasons List:** All flags and warnings in bullet format
4. **Document Hash:** SHA-256 hash for reference
5. **Template Info:** Hospital name if template matched
6. **Actions:**
   - **If Duplicate:** Info message "Duplicate document automatically flagged"
   - **If Not Duplicate:** "Flag for future review" button (manual flagging)

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER CLICKS "RUN VERIFICATION"           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Document Hash Check                                │
│  • Calculate SHA-256                                         │
│  • Check for duplicates                                      │
│  • Auto-mark duplicates as suspicious                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Field Validation                                   │
│  • Total amount vs line items sum                            │
│  • Consistency check                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Date Validation                                     │
│  • Admission vs discharge date                               │
│  • Chronological order check                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Template Matching                                   │
│  • Hospital template selection                               │
│  • Keyword verification in text snippet                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Cost Benchmarking                                   │
│  ├─ 5.1: Category & Hospital ID                              │
│  ├─ 5.2: Benchmark Lookup (with fallback)                    │
│  ├─ 5.3: Amount Comparison (ratio check)                     │
│  ├─ 5.4: Statistical Analysis (z-score, percentile)          │
│  ├─ 5.5: Category Mismatch Detection                         │
│  ├─ 5.6: Length of Stay Validation                           │
│  └─ 5.7: Cost Per Day Analysis                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  FINAL: Score Calculation                                    │
│  • Aggregate all deductions and bonuses                     │
│  • Clamp to 0-100 range                                      │
│  • Determine status (Auto Accept / Review / High Risk)        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  RESULT: Display Modal                                       │
│  • Show score, reasons, hash                                 │
│  • Display appropriate actions                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Score Deduction Summary

| Check | Deduction | Bonus |
|-------|-----------|-------|
| Duplicate hash | -50 | - |
| Hash calculation failure | -10 | - |
| Amount mismatch | -20 | +5 (if match) |
| Missing amounts | -5 | - |
| Date order invalid | -15 | +5 (if valid) |
| Missing dates | -5 | - |
| Template mismatch | -25 | +10 (if match) |
| Missing template/snippet | -5 | - |
| Amount 3×+ above average | -50 | - |
| Amount 2-3× above average | -30 | - |
| Z-score > 3 | -40 | - |
| Z-score > 2 | -20 | - |
| Above 95th percentile | -15 | - |
| Category mismatch | -25 | - |
| Abnormal length of stay | -15 | - |
| Unusually high cost/day | -10 | - |

**Maximum possible deductions:** Can reduce score to 0 (but bonuses can add up to +20)

---

## Key Design Principles

1. **Sequential Execution:** Checks run in order; each can modify score
2. **Fallback Logic:** System tries specific benchmarks first, falls back to general ones
3. **Graceful Degradation:** Missing data skips checks rather than failing
4. **Cumulative Scoring:** Multiple flags compound to lower score
5. **Auto-Marking:** Duplicates automatically flagged (no manual step)
6. **Manual Override:** Non-duplicates can be manually flagged for review

---

## Future Enhancements

**Planned:**
- Perceptual hash for near-duplicate detection
- OCR integration (auto-extract text, remove manual snippet)
- Cross-claim consistency checks
- Metadata extraction (EXIF, PDF metadata)
- Image forensics (tamper detection)
- ML-based scoring models

**Current Limitations:**
- Client-side only (no backend persistence)
- Limited hash history (last 25 only)
- Manual text snippet input (until OCR ready)
- No cross-claim pattern detection yet

---

## Example Scenarios

### Scenario 1: Normal Claim
- **Input:** Routine checkup, Rs. 15,000, dates valid, template matches
- **Result:** Score 90+, Auto Accept
- **Reasons:** Only positive confirmations

### Scenario 2: Suspicious Amount
- **Input:** Routine checkup, Rs. 150,000, dates valid, template matches
- **Result:** Score 20-40, High Risk
- **Reasons:** 
  - "Claim amount is 10× above average"
  - "Statistical outlier: top 0.1%"
  - "Category mismatch: Selected Routine Checkup but amount suggests Surgery"

### Scenario 3: Duplicate Document
- **Input:** Same document uploaded twice
- **Result:** Score 50, High Risk
- **Reasons:**
  - "Duplicate detected: matches a previously uploaded document hash"
- **Action:** Automatically flagged, no manual button needed

---

This pipeline ensures comprehensive fraud detection while maintaining a simple, user-friendly interface that hides complexity from end users.

