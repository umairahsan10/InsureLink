# OCR-Driven Document Fraud Detection Plan

This document focuses on detecting forged hospital documents (bills, receipts, discharge summaries) uploaded through the InsureLink claim workflow. The goal is to wrap the OCR pipeline with authenticity checks so that extracted data can be trusted before it flows into claim processing.

---

## Implementation Status

**Last Updated:** November 2025

### Quick Status Overview
- ✅ **Completed:** Frontend MVP with basic document trust checks
- 🚧 **In Progress:** None currently
- 📋 **Planned Phase 1:** Perceptual hash, cross-claim detection
- ✅ **Completed:** Cost benchmarking (multi-dimensional statistical analysis)
- 📋 **Planned Phase 2:** Pre-trained ML models integration
- 📋 **Planned Phase 3:** Advanced features (OCR integration, image forensics)

### Current Implementation Details

**Location:** `client/src/app/hospital/claims/page.tsx` and `client/src/utils/documentVerification.ts`

**What's Working:**
- ✅ Document upload modal with file input
- ✅ SHA-256 hash calculation (browser-based, using Web Crypto API)
- ✅ Duplicate detection (localStorage-based hash storage)
- ✅ Manual field validation (total amount vs. line items sum, date ordering)
- ✅ Template matching (3 hospital templates with keyword-based checks)
- ✅ Trust score calculation (0-100 with weighted deductions)
- ✅ Result modal displaying score, reasons, and hash
- ✅ "Mark as suspicious" functionality (stores hash for future flagging)
- ✅ Demo hash seeding for testing duplicate detection
- ✅ **Cost benchmarking:** Multi-dimensional statistical analysis (treatment+tier, z-scores, percentiles, length of stay, cost per day)
- ✅ **Category validation:** Auto-inference for mismatch detection (treatment category now required)
- ✅ **Auto-flagging:** Duplicates automatically marked as suspicious

**Technical Notes:**
- All checks run client-side (no backend required)
- Uses `localStorage` for hash persistence (stores last 25 hashes)
- Template matching uses simple keyword search (manual text snippet input)
- Metadata extraction is simulated (placeholder for future backend integration)

---

## Layered Defense Overview

1. **OCR Extraction (Base Layer)**  
   Convert scanned images/PDFs into structured text. All downstream checks depend on reliable OCR output.

2. **Document Integrity Checks**  
   - Template & layout matching  
   - Metadata validation  
   - Image forensics / tamper detection  

3. **Content Consistency Checks**  
   - Field-level validation (totals, dates, required sections)  
   - Cost / length-of-stay benchmarking  
   - Cross-claim comparisons  
   - Duplicate detection via hashing  

4. **Scoring & Case Management**  
   Aggregate signals into a trust score, surface reasons to reviewers, and route high-risk documents for manual verification.

5. **Learning Loop**  
   Investigator feedback becomes training data for ML/DL components (template classifiers, forgery detectors, anomaly models).

---

## 1. OCR Extraction

**Status:** 📋 Planned (Teammate's work)

- Use OCR services (Tesseract, AWS Textract, Google Vision, Azure Form Recognizer) to extract: bill number, patient info, dates, amounts, line items, signatures/stamps, and document sections.
- Normalize output into a structured JSON so every downstream rule/model reads the same schema.
- Store original files and OCR text for auditing.

---

## 2. Document Integrity Checks

### 2a. Template & Layout Matching

**Status:** ✅ Partially Completed (Basic keyword matching) | 📋 Planned (ML/DL classification)

- **Rule-Based:** ✅ **Implemented**
  - Maintain a per-hospital template profile describing expected header/footer positions, logo coordinates, table layouts, and required sections.  
  - **Current:** 3 hospital templates with keyword-based matching (City General Hospital, Karachi Care Medical Complex, Rehman Clinic & Labs)
  - **Current:** Manual text snippet input for keyword verification
  - Use OpenCV or similar libraries to detect layout features and compare them against the profile (allowing small tolerances). **📋 Planned**

- **ML/DL Option:** 📋 **Planned**
  - Train a CNN (e.g., EfficientNet, ResNet) to classify documents by hospital template.  
  - Low confidence, mismatched labels, or unknown templates trigger alerts.  
  - Dataset: a few hundred authentic samples per hospital plus synthetic negatives.

### 2b. Metadata Validation

**Status:** 📋 Planned (Requires backend or PDF.js integration)

- Extract EXIF/PDF metadata with tools like `exiftool`, `pdfinfo`, or custom scripts.  
- **Current:** Placeholder message shown in UI ("Metadata check pending backend integration")
- Compare key fields with claim data: `CreateDate`, `ModifyDate`, `Author`, `Producer`, GPS info (if a phone photo).  
- Examples of actionable rules:  
  - File created before the claimed admission date → flag.  
  - `Producer=Adobe Photoshop` or `Software=Snapseed` on a supposed hospital PDF → suspicious.  
  - If source is a phone photo, capture device model and location for investigation.

### 2d. Image Forensics

**Status:** 📋 Planned (Phase 2 or 3)

- **Classical forensics:**  
  - Error Level Analysis (ELA) to highlight regions edited separately.  
  - Copy-move detection to find duplicated signatures/stamps.  
  - Noise variance analysis to spot pasted content.  

- **DL-based forgery detection:**  
  - Apply models trained on tampered documents (datasets: CASIA, DeepFakeDocs, etc.).  
  - Use GAN-forgery detectors to catch AI-generated stamps, signatures, or textures.  
  - Output heatmaps or probabilities indicating tampering regions.

---

## 3. Content Consistency Checks

### 3a. Field Validation

**Status:** ✅ Completed

- After OCR, run deterministic checks:  
  - ✅ Sum of line items must equal total (allow tolerance). **Implemented with ±1 tolerance**
  - ✅ Dates follow chronological order (admission ≤ discharge ≤ billing). **Implemented**
  - Required fields (bill number, patient name, hospital name, doctor signature) must exist. **📋 Planned (requires OCR)**
  - Provide in-UI highlights for mismatched fields so reviewers can see issues quickly. **✅ Implemented (reasons list in result modal)**

### 3b. Cost & Length-of-Stay Benchmarks

**Status:** ✅ Completed

- Build reference tables from historical data: average cost per hospital, per treatment type (even without ICD/CPT codes, use high-level categories or hospital averages).  
- Compute ratios such as `claim_amount / avg_amount_for_hospital` and set thresholds (e.g., >2× typical cost).  
- Length-of-stay check: `discharge_date - admission_date`. Compare to typical stays for similar cases or the patient's history; long or short deviations trigger warnings.  
- **ML option:** train regression models to predict expected cost or stay length, then flag claims with large residual errors. **📋 Planned (Phase 2)**

### 3c. Cross-Claim Consistency

**Status:** 📋 Planned (Phase 1 - Quick Win)

- Store metadata from every processed document (bill number, hospital, amount, hashed text).  
- When a new claim arrives, query for duplicates: same bill number, same amount/date combo, or same document hash under different patient IDs.  
- Maintain counts per hospital/corporate to spot unusual submission spikes.  
- **ML/Graph option:** build a patient–hospital–corporate graph and run community detection or Graph Neural Networks to identify collusion clusters. **📋 Planned (Phase 3)**

### 3d. Duplicate & Near-Duplicate Detection

**Status:** ✅ Partially Completed (SHA-256 only) | 📋 Planned (Perceptual hash)

- Generate both cryptographic hashes (SHA-256) and perceptual hashes (pHash/dHash) for each uploaded image/PDF.  
  - ✅ **Cryptographic hash (SHA-256):** Implemented using Web Crypto API, detects exact duplicates
  - 📋 **Perceptual hash (pHash/dHash):** Planned for Phase 1 to catch slight edits (brightness, scaling)
- For heavy edits, use Siamese networks that learn document similarity. **📋 Planned (Phase 2 - TensorFlow.js MobileNet)**
- Store hashes for quick lookup; any hit above a defined similarity threshold raises a flag. **✅ Implemented (localStorage-based, stores last 25 hashes)**

---

## 4. Scoring & Case Management

**Status:** ✅ Completed (Basic scoring) | 📋 Planned (Enhanced dashboard)

- ✅ Assign weights to each signal (template match, metadata anomalies, OCR consistency, hash collisions, ML fraud probability). **Implemented with weighted deductions:**
  - Duplicate hash: -50 points
  - Template mismatch: -25 points
  - Amount mismatch: -20 points
  - Date inconsistency: -15 points
  - Missing fields: -5 to -20 points
- ✅ Compute a `documentTrustScore` ∈ [0, 100]. **Implemented**
- ✅ Set thresholds to trigger:  
  - **Auto-approve** (score ≥ 80)  
  - **Review required** (score 50-79)  
  - **High-risk** (score < 50)  
- ✅ Present reviewers with a dashboard showing: original document, OCR text, highlighted anomalies, forensic heatmaps, and historical matches. **Basic implementation:**
  - Result modal shows score, reasons list, SHA-256 hash
  - Status badge (Auto Accept / Needs Review / High Risk)
  - "Mark as suspicious" button for future duplicate detection
  - 📋 **Planned:** Enhanced dashboard with forensic heatmaps, historical matches, OCR text display

---

## 5. Learning Loop & ML/DL Opportunities

**Status:** 📋 Planned (Phase 2 & 3)

| Component | ML/DL Potential | Status |
| --- | --- | --- |
| Template matching | CNN classifier for hospital layouts | 📋 Phase 2 |
| Metadata anomaly detection | Isolation Forest on metadata vectors | 📋 Phase 2 |
| Image forensics | Deep forgery detectors, GAN discriminators | 📋 Phase 3 |
| Field consistency | Isolation Forest / Autoencoders on numeric ratios | 📋 Phase 2 |
| Cost & stay benchmarking | Regression or gradient boosting models | 📋 Phase 2 |
| Cross-claim analysis | Graph Neural Networks for collusion detection | 📋 Phase 3 |
| Duplicate detection | Siamese networks for "same document?" scoring | 📋 Phase 2 (TensorFlow.js MobileNet) |

- Log reviewer outcomes (authentic vs. forged) as labels. **📋 Planned**
- Periodically retrain models and recalibrate thresholds. **📋 Planned**
- Use SHAP/LIME to explain ML decisions, especially for document trust scoring. **📋 Planned**

---

## High-Level Workflow

```
Upload document
   ↓
OCR extraction → Structured JSON
   ↓
Template/layout check + metadata validation + image forensics
   ↓
Field consistency + cost/LOS comparison + cross-claim lookup + duplicate hashing
   ↓
Aggregate trust score + reasons
   ↓
Auto-approve / Manual review / SIU escalation
   ↓
Reviewer decision logged → feedback into ML training datasets
```

---

## Phased Implementation Roadmap

### Phase 1: Quick Wins (Frontend-Only, ~6-8 hours)
**Goal:** Enhance current MVP with doable features for industry demo

1. **Perceptual Hash (2 hours)**
   - Add blockhash.js or similar library
   - Detect near-duplicates (slightly edited documents)
   - Combine with existing SHA-256 for comprehensive duplicate detection

2. **Cost Benchmarking** ✅ **COMPLETED**
   - ✅ Calculate averages from existing `claims.json` data
   - ✅ Compare new claims against hospital/treatment averages
   - ✅ Flag claims 2×+ above typical amounts
   - ✅ Add length-of-stay comparison
   - ✅ Statistical analysis (z-scores, percentiles)
   - ✅ Category mismatch detection
   - ✅ Cost per day analysis

3. **Cross-Claim Detection (2 hours)**
   - Store bill numbers, amounts, dates in IndexedDB (better than localStorage)
   - Query for duplicates: same bill number, same amount/date combo
   - Track submission patterns per hospital/corporate

4. **Enhanced Visualization (1 hour)**
   - Add charts/visual indicators in result modal
   - Improve UI presentation for demo

### Phase 2: Pre-trained Models Integration (~10-12 hours)
**Goal:** Add ML capabilities using pre-trained models (no training required)

1. **TensorFlow.js MobileNet (4 hours)**
   - Integrate for image similarity detection
   - Use pre-trained embeddings for near-duplicate detection
   - More robust than simple perceptual hash

2. **PDF.js Metadata Extraction (2 hours)**
   - Extract creation dates, software used from PDFs
   - Compare against claim dates
   - Flag suspicious metadata (Photoshop, etc.)

3. **Isolation Forest Anomaly Detection (4 hours)**
   - Use Pyodide or API for Isolation Forest
   - Flag outliers in cost/stay patterns
   - No training needed - runs on your data

4. **Template Classification (4 hours)**
   - Use MobileNet embeddings for template matching
   - Fine-tune on hospital templates (if time permits)
   - Or use distance matching with known templates

### Phase 3: Advanced Features (Future)
**Goal:** Full production-ready system

1. OCR integration (when teammate is ready)
2. Image forensics (ELA, copy-move detection)
3. Graph-based collusion detection
4. ML model training on labeled data
5. Real-time batch processing
6. Enhanced investigator dashboard

---

## Next Steps

### ✅ Completed
1. ✅ **MVP rules:** Implemented deterministic checks (field validation, SHA-256 hashing, basic template matching)
2. ✅ **Investigator UI:** Built basic review modal showing documents, trust score, reasons, and hash
3. ✅ **Cost Benchmarking:** Multi-dimensional statistical analysis with fallback logic, z-scores, percentiles, length of stay validation, and cost per day analysis

### 📋 Phase 1: Quick Wins (Next 1-2 weeks)
1. **Perceptual hash:** Add blockhash.js or similar for near-duplicate detection (catches slightly edited documents)
2. ✅ **Cost benchmarking:** ✅ COMPLETED - Multi-dimensional statistical analysis with fallback logic
3. **Cross-claim detection:** Store bill numbers/amounts in IndexedDB, detect same document used for multiple patients
4. **Enhanced visualization:** Add charts/visual indicators in result modal

### 📋 Phase 2: Pre-trained Models (2-3 weeks)
1. **TensorFlow.js MobileNet:** Integrate for image similarity detection (near-duplicate detection)
2. **PDF.js metadata extraction:** Extract creation dates, software used from PDFs in browser
3. **Isolation Forest:** Add anomaly detection (via Pyodide or API) for cost/stay outliers
4. **Template classification:** Use MobileNet embeddings for template matching

### 📋 Phase 3: Advanced Features (Future)
1. **Data collection:** Gather authentic document samples per hospital and a set of known forgeries (or synthetically edited docs) for training
2. **Template classifier:** Train a prototype CNN on hospital layouts
3. **Forensics pipeline:** Evaluate open-source forgery detectors; integrate best performers
4. **Scoring model:** Transition to ML-based scoring once enough labeled data exists
5. **OCR integration:** Integrate with teammate's OCR work to auto-extract fields
6. **Graph analysis:** Build patient–hospital–corporate networks for collusion detection

---

This plan turns the OCR feature into a trustworthy ingestion pipeline that not only extracts data but also verifies document authenticity, leveraging both deterministic rules and machine learning.

