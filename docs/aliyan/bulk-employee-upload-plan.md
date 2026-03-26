# Bulk Employee CSV Upload & Invalid Row Persistence: Implementation Plan

## Overview
This document outlines the step-by-step plan to implement robust bulk employee CSV upload with durable invalid row storage, minimal schema changes, and seamless frontend/backend integration for InsureLink.

---

## 1. Schema Changes (Prisma)
### 1.1. Add `employee_uploads` Table
- **Purpose:** Track each CSV upload (who, when, file path, corporate, status)
- **Fields:**
  - id (PK)
  - corporateId (FK)
  - uploadedByUserId (FK)
  - filePath (string)
  - originalFileName (string)
  - uploadedAt (datetime)
  - status (enum: pending, processed, failed)

### 1.2. Add `invalid_employee_uploads` Table
- **Purpose:** Store all invalid employee rows for later correction and resubmission
- **Fields:**
  - id (PK)
  - employeeUploadId (FK)
  - corporateId (FK)
  - errorMessages (string[])
  - All fields required for employee creation (except password, no rawRow)
    - email, firstName, lastName, phone, userRole, dob, gender, cnic, address
    - employeeNumber, planId, designation, department, coverageStartDate, coverageEndDate, coverageAmount, usedAmount, status
  - createdAt, updatedAt

---

## 2. Backend Changes
### 2.1. On CSV Upload
- Store file in Supabase (csv-uploads bucket)
- Create `employee_uploads` record
- Parse CSV, validate rows
- For each invalid row:
  - Insert into `invalid_employee_uploads` with error messages
- For each valid row:
  - Create employee (existing logic)

### 2.2. API Endpoints
- Fetch invalid rows for a corporate/upload
- Edit and resubmit invalid rows (update or create employee)
- Fetch upload history and status

---

## 3. Frontend Changes
### 3.1. Bulk Upload Flow
- Upload CSV → show progress/status
- Fetch invalid rows from backend (not local state)
- Display errors, allow editing, resubmit to backend
- Show upload history/status

---

## 4. Migration & Rollout
- Generate and run Prisma migration
- Test end-to-end: upload, error handling, correction, resubmission
- Update documentation and user guides

---

## 5. Notes
- No password is stored in invalid rows
- All fields required for employee creation are present in `invalid_employee_uploads`
- Minimal, robust, and extensible for future enhancements

---

## 6. Timeline & Responsibilities
- **Schema:** 1 day
- **Backend:** 2-3 days
- **Frontend:** 2 days
- **Testing & Docs:** 1 day

---

## 7. References
- [schema.prisma](../../server/prisma/schema.prisma)
- [Supabase provider](../../server/src/modules/file-upload/providers/supabase.provider.ts)
- [Bulk upload frontend](../../client/src/app/corporate/employees/page.tsx)

---

*Prepared by: Aliyan*
*Date: 2026-03-23*