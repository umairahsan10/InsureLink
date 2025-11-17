# OCR-Driven Document Fraud Detection Plan

This document focuses on detecting forged hospital documents (bills, receipts, discharge summaries) uploaded through the InsureLink claim workflow. The goal is to wrap the OCR pipeline with authenticity checks so that extracted data can be trusted before it flows into claim processing.

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

- Use OCR services (Tesseract, AWS Textract, Google Vision, Azure Form Recognizer) to extract: bill number, patient info, dates, amounts, line items, signatures/stamps, and document sections.
- Normalize output into a structured JSON so every downstream rule/model reads the same schema.
- Store original files and OCR text for auditing.

---

## 2. Document Integrity Checks

### 2a. Template & Layout Matching
- **Rule-Based:**  
  - Maintain a per-hospital template profile describing expected header/footer positions, logo coordinates, table layouts, and required sections.  
  - Use OpenCV or similar libraries to detect layout features and compare them against the profile (allowing small tolerances).  

- **ML/DL Option:**  
  - Train a CNN (e.g., EfficientNet, ResNet) to classify documents by hospital template.  
  - Low confidence, mismatched labels, or unknown templates trigger alerts.  
  - Dataset: a few hundred authentic samples per hospital plus synthetic negatives.

### 2b. Metadata Validation
- Extract EXIF/PDF metadata with tools like `exiftool`, `pdfinfo`, or custom scripts.  
- Compare key fields with claim data: `CreateDate`, `ModifyDate`, `Author`, `Producer`, GPS info (if a phone photo).  
- Examples of actionable rules:  
  - File created before the claimed admission date → flag.  
  - `Producer=Adobe Photoshop` or `Software=Snapseed` on a supposed hospital PDF → suspicious.  
  - If source is a phone photo, capture device model and location for investigation.

### 2d. Image Forensics
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
- After OCR, run deterministic checks:  
  - Sum of line items must equal total (allow tolerance).  
  - Dates follow chronological order (admission ≤ discharge ≤ billing).  
  - Required fields (bill number, patient name, hospital name, doctor signature) must exist.  
  - Provide in-UI highlights for mismatched fields so reviewers can see issues quickly.

### 3b. Cost & Length-of-Stay Benchmarks
- Build reference tables from historical data: average cost per hospital, per treatment type (even without ICD/CPT codes, use high-level categories or hospital averages).  
- Compute ratios such as `claim_amount / avg_amount_for_hospital` and set thresholds (e.g., >2× typical cost).  
- Length-of-stay check: `discharge_date - admission_date`. Compare to typical stays for similar cases or the patient’s history; long or short deviations trigger warnings.  
- **ML option:** train regression models to predict expected cost or stay length, then flag claims with large residual errors.

### 3c. Cross-Claim Consistency
- Store metadata from every processed document (bill number, hospital, amount, hashed text).  
- When a new claim arrives, query for duplicates: same bill number, same amount/date combo, or same document hash under different patient IDs.  
- Maintain counts per hospital/corporate to spot unusual submission spikes.  
- **ML/Graph option:** build a patient–hospital–corporate graph and run community detection or Graph Neural Networks to identify collusion clusters.

### 3d. Duplicate & Near-Duplicate Detection
- Generate both cryptographic hashes (SHA-256) and perceptual hashes (pHash/dHash) for each uploaded image/PDF.  
- Cryptographic hash detects exact reuse; perceptual hash catches slight edits (brightness, scaling).  
- For heavy edits, use Siamese networks that learn document similarity.  
- Store hashes for quick lookup; any hit above a defined similarity threshold raises a flag.

---

## 4. Scoring & Case Management

- Assign weights to each signal (template match, metadata anomalies, OCR consistency, hash collisions, ML fraud probability).  
- Compute a `documentTrustScore` ∈ [0, 100].  
- Set thresholds to trigger:  
  - **Auto-approve** (high score)  
  - **Review required** (medium)  
  - **High-risk** (low score, send to SIU)  
- Present reviewers with a dashboard showing: original document, OCR text, highlighted anomalies, forensic heatmaps, and historical matches.

---

## 5. Learning Loop & ML/DL Opportunities

| Component | ML/DL Potential |
| --- | --- |
| Template matching | CNN classifier for hospital layouts |
| Metadata anomaly detection | Isolation Forest on metadata vectors |
| Image forensics | Deep forgery detectors, GAN discriminators |
| Field consistency | Isolation Forest / Autoencoders on numeric ratios |
| Cost & stay benchmarking | Regression or gradient boosting models |
| Cross-claim analysis | Graph Neural Networks for collusion detection |
| Duplicate detection | Siamese networks for “same document?” scoring |

- Log reviewer outcomes (authentic vs. forged) as labels.  
- Periodically retrain models and recalibrate thresholds.  
- Use SHAP/LIME to explain ML decisions, especially for document trust scoring.

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

## Next Steps

1. **Data collection:** Gather authentic document samples per hospital and a set of known forgeries (or synthetically edited docs) for training.  
2. **MVP rules:** Implement deterministic checks (field validation, hashing, basic metadata).  
3. **Template classifier:** Train a prototype CNN on hospital layouts.  
4. **Forensics pipeline:** Evaluate open-source forgery detectors; integrate best performers.  
5. **Scoring model:** Start with weighted rules; transition to ML-based scoring once enough labeled data exists.  
6. **Investigator UI:** Build a review console showing documents, OCR text, anomaly annotations, and decision logging.

This plan turns the OCR feature into a trustworthy ingestion pipeline that not only extracts data but also verifies document authenticity, leveraging both deterministic rules and machine learning.

