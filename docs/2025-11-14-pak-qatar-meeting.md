# Meeting Summary & Insights – PakQatar

**Health Division (Elaaj App & Corporate Web Portal Review)**

**Date:** 14 November 2025

## Participants

- **PakQatar:** Mr. Junaid Asghar & Technology Team
- **InsureLink:** Mr. Usama Antuley (Supervisor), Umair A. (Team)

---

## 1. Overview of Meeting

The meeting focused on understanding the existing PakQatar digital solutions—specifically the Elaaj mobile application (deployed) and their under-development Corporate Web Portal. The InsureLink team showcased the middleware solution being developed and gathered insights to validate features, identify gaps, and understand PakQatar's operational pain points.

---

## 2. Evaluation of the Elaaj Mobile Application

### 2.1. Key Features

1. Emergency contact displayed directly on the login page.
2. Login using CNIC as the username.
3. Digital Health Card accessible for patients.
4. App Sections:
   - Dashboard
   - Customer Support
   - Claims
   - Panel Hospitals
5. Bottom-up notification drawer for actions like feedback/complaints.
6. Minimal claim submission form capturing:
   - Family member
   - Claim type
   - Hospital name
   - Claim amount
   - Attachments
7. Automated email notifications for every claim status update.
8. App currently integrates only between patient ↔ PakQatar, with no direct corporate or hospital connectivity.
9. Users can view claim history of each family member.

### 2.2. Claims Submission Types

#### a) Early Submissions
- For pre-planned medical procedures.
- Can be filed up to 24 hours before the hospital visit.
- Insurance approval may occur before the patient arrives at the hospital.

#### b) Emergency Submissions
1. Immediate claim/card submission upon arrival at the hospital.
2. Patient can be treated privately and later submit bills for reimbursement.

#### c) High-Value Claim (Physical Submission)
- Claims above Rs. 25,000 must be submitted physically.
- Reason: Online claims can be forged using AI. Physical documents allow verification of paper quality and the hospital's unique printing/ink.

---

## 3. PakQatar Operational Pain Points

### 3.1. Manual Query Handling (Major Pain Point)

- An 8-member team processes 200+ email-based queries daily.
- Queries come in multiple formats, requiring manual structuring and data extraction.
- Processing time: 1–2 full working days.
- PakQatar wants to automate the entire process so one person can manage the workload.

**Required Solution:**
- Intelligent OCR system capable of:
  - Reading multi-format forms
  - Detecting field names regardless of document layout variations
  - Extracting corresponding data accurately
  - Auto-inserting into structured database fields
- Main difficulty: Different hospitals follow drastically different invoice layouts.

### 3.2. Billing & Reconciliation Issues

- Insurance receives numerous claim intimation requests, but not all patients actually avail treatment.
- Insurers initially assume financial liability until hospitals verify the finalized dues after ~6 months.
- Hospitals do not consistently update data by June 30.
- This delays reconciliation and leads to perceived temporary losses in their books.

### 3.3. Why Hospitals Are Not Yet Digitalized

PakQatar has:
- Patient Portal
- Insurance (Internal) Portal
- Corporate Portal (under development)

But no dedicated hospital portal.

**Reason:**
- Hospital staff would need to enter data into their own ERP and additionally into multiple insurance portals for different companies.
- This duplication of work is operationally heavy.
- Hence, hospitals avoid adopting such systems, making digitization difficult.

---

## 4. Features Observed in the Corporate Web App

1. Corporate clients can download employee bills in PDF format.
2. Past claim history available for download in PDF.
3. All corporate member records downloadable in Excel and PDF formats.
4. Disclaimer pop-ups outlining claim rules and guidelines.
5. Corporates can submit claims on behalf of employees (designed for non-technical users).
6. Analytics dashboard highlighting:
   - Top 5 hospitals
   - Monthly claim submission amounts
   - Anomaly detection indicators
7. Employee information downloadable in PDF format.
8. "Remaining Documents" page where users upload pending files for a claim, categorized under structured fields.

---

## 5. Additional Digitalization Opportunities Discussed

### 5.1. OCR-Driven Claim Automation
- To automatically scan hospital documents and map extracted data into structured claim formats.

### 5.2. RoboCalling Integration
- Part of InsureLink's ongoing project.
- AI-powered automated verification calls:
  - Verify patient identity
  - Provide remaining claim amount
  - Answer basic coverage questions
- Aims to reduce call center pressure and speed up verification cycles.

### 5.3. WhatsApp Menu-Based Automation
- Similar to Meezan Bank's WhatsApp service.
- Menu-driven conversational interface for:
  - Claim status
  - Policy coverage
  - Hospital panel list
  - Submitting basic information
- Should handle verification and automate routine support interactions.

---

## 6. Information Requested from PakQatar

To improve alignment between systems and ensure technical compatibility, the following were requested:

1. User Manuals of:
   - Elaaj Mobile App
   - Corporate Web App
2. Dummy User Credentials for both platforms.
3. NDA Signing before accessing systems.
4. Permission to explore features thoroughly to:
   - Identify gaps
   - Suggest improvements
   - Align InsureLink middleware with PakQatar's workflow
   - Understand their architecture to avoid redundant development

