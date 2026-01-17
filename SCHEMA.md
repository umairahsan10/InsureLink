# InsureLink Database Schema - UPDATED & NORMALIZED

**Version:** 2.0 (Normalization & Soft Delete Enhanced)  
**Last Updated:** January 13, 2026

---

## NORMALIZATION IMPROVEMENTS APPLIED ✅

This version incorporates advanced normalization and audit improvements based on comprehensive schema review:

### Changes Applied:

| Change | Details | Impact |
|--------|---------|--------|
| **✅ Removed Denormalization** | Removed `corporates_name` from patients table; removed `has_active_claims` flag | Cleaner data model, single source of truth |
| **✅ Normalized JSON Arrays** | Broke out into separate tables: patient_medical_conditions, patient_allergies, hospital_departments, lab_test_categories, plan_services | Full queryability, indexing capability, 1NF compliance |
| **✅ Many-to-Many Linking** | Created lab_report_tests, dependent_documents tables | Proper relationship modeling, no redundant arrays |
| **✅ Added Soft Deletes** | Added `deleted_at` timestamp to all entities | Better audit trail, recovery capability, compliance ready |
| **✅ Audit Logging** | New audit_logs table for tracking all sensitive changes | Complete compliance history, debugging support |
| **✅ Timezone Documentation** | Explicit UTC storage & conversion guidelines | Prevents timezone bugs, international ready |

### Changes NOT Applied (Justified):

| Suggestion | Reason NOT Applied | Status |
|-----------|-------------------|--------|
| Separate `hr_contact_*` into `corporate_contacts` table | Over-normalization; single HR contact per corporate is atomic | ⚠️ REJECTED |
| Break out `results` JSON in lab_reports | Results are atomic test values, not repeating groups; JSON appropriate | ⚠️ REJECTED |
| Remove `user_id` from insurers/hospitals | Needed for auth/RLS in user_role_profiles lookups | ⚠️ REJECTED |

---

## Executive Summary

Comprehensive relational database schema for InsureLink insurance management platform. Supports corporate employee health insurance with claim processing, dependent coverage, multi-lab diagnostics, and real-time messaging. All monetary amounts in PKR; timestamps in ISO 8601 UTC format.

**Key Entities:** 28 tables (including 8 new normalized tables), 15 total patients (10 employees + 5 dependents), unified user management, claim event audit trail, document metadata storage with Supabase integration, transaction tracking, multi-type notifications, and full audit logging.

---

## 1. USER ENTITY

**Table:** `users`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email address for login |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| first_name | VARCHAR(100) | NOT NULL | User's first name |
| last_name | VARCHAR(100) | NOT NULL | User's last name |
| phone | VARCHAR(20) | NULLABLE | Contact phone number |
| profile_picture_url | VARCHAR(500) | NULLABLE | URL to profile image (Supabase) |
| is_active | BOOLEAN | DEFAULT true | Account status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP, NOT NULL | ISO 8601 format |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |
| last_login_at | TIMESTAMP | NULLABLE | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- UNIQUE: email
- FOREIGN KEY: None (base table)

**Indexes:**
- email (UNIQUE)
- created_at
- is_active

**Validation Rules:**
- Email must be valid format (RFC 5322)
- Password minimum 8 characters, includes uppercase, lowercase, digit, special character
- Phone format: Pakistan format (+92XXXXXXXXXXX or 03XXXXXXXXX)
- Role must be one of defined enum values

---

## 2. PATIENT ENTITY

**Table:** `patients`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique patient identifier |
| user_id | UUID | FOREIGN KEY UNIQUE NOT NULL | References users.id |
| employee_id | UUID | FOREIGN KEY NULLABLE | References employees.id (null if not employee) |
| dependent_id | UUID | FOREIGN KEY NULLABLE | References dependents.id (null if not dependent) |
| date_of_birth | DATE | NOT NULL | YYYY-MM-DD format |
| gender | ENUM | NOT NULL | Values: Male, Female, Other |
| cnic | VARCHAR(15) | UNIQUE NOT NULL | Pakistan CNIC/ID number |
| address | VARCHAR(500) | NOT NULL | Residential address |
| blood_group | VARCHAR(5) | NULLABLE | Values: O+, O-, A+, A-, B+, B-, AB+, AB- |
| insurer_id | UUID | FOREIGN KEY NOT NULL | References insurers.id |
| policy_number | VARCHAR(50) | UNIQUE NOT NULL | Insurance policy number |
| coverage_amount_pkr | DECIMAL(12,2) | NOT NULL | Total coverage in PKR |
| used_amount_pkr | DECIMAL(12,2) | DEFAULT 0 | Amount claimed to date in PKR |
| policy_status | ENUM | DEFAULT 'Active' | Values: Active, Inactive, Expired |
| policy_expiry | DATE | NOT NULL | Policy expiration date |
| coverage_start_date | DATE | NOT NULL | Coverage start date |
| coverage_end_date | DATE | NOT NULL | Coverage end date |
| emergency_contact_name | VARCHAR(100) | NOT NULL | Emergency contact name |
| emergency_contact_relation | VARCHAR(50) | NOT NULL | Relationship to patient |
| emergency_contact_phone | VARCHAR(20) | NOT NULL | Emergency contact phone |
| is_active | BOOLEAN | DEFAULT true | Account status |
| last_visit_date | TIMESTAMP | NULLABLE | ISO 8601 format |
| registration_date | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: user_id REFERENCES users(id) ON DELETE CASCADE
- FOREIGN KEY: employee_id REFERENCES employees(id) ON DELETE SET NULL
- FOREIGN KEY: dependent_id REFERENCES dependents(id) ON DELETE SET NULL
- FOREIGN KEY: corporate_id REFERENCES corporates(id) ON DELETE SET NULL
- FOREIGN KEY: insurer_id REFERENCES insurers(id) ON DELETE RESTRICT
- UNIQUE: user_id
- UNIQUE: cnic
- UNIQUE: policy_number
- CHECK: coverage_amount_pkr > 0
- CHECK: used_amount_pkr >= 0 AND used_amount_pkr <= coverage_amount_pkr
- CHECK: policy_expiry > coverage_start_date
- CHECK: coverage_start_date < coverage_end_date

**Indexes:**
- user_id (UNIQUE)
- employee_id
- dependent_id
- cnic (UNIQUE)
- policy_number (UNIQUE)
- insurer_id
- policy_status
- is_active
- created_at
- (corporate_id, is_active)
- (insurer_id, policy_status)

**Validation Rules:**
- CNIC format: 15 digits with hyphens (XXXXX-XXXXXXXXX-X)
- Either employee_id OR dependent_id must be set (XOR logic)
- Coverage dates must be within policy dates
- Used amount cannot exceed coverage amount
- Blood group from standard list only
- Medical history and allergies must be non-empty arrays if provided

---

## 3. USER_ROLE_PROFILES ENTITY

**Table:** `user_role_profiles`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique identifier |
| user_id | UUID | FOREIGN KEY UNIQUE NOT NULL | References users.id |
| role_type | ENUM | NOT NULL | Values: patient, corporate, hospital, insurer, admin |
| patient_id | UUID | FOREIGN KEY NULLABLE | References patients.id |
| corporate_id | UUID | FOREIGN KEY NULLABLE | References corporates.id |
| hospital_id | UUID | FOREIGN KEY NULLABLE | References hospitals.id |
| insurer_id | UUID | FOREIGN KEY NULLABLE | References insurers.id |
| permissions | JSON | NOT NULL | Array of permission strings |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: user_id REFERENCES users(id) ON DELETE CASCADE
- UNIQUE: user_id
- CHECK: Only one of patient_id, corporate_id, hospital_id, insurer_id is NOT NULL

**Indexes:**
- user_id (UNIQUE)
- role_type

---

## 4. CORPORATE ENTITY

**Table:** `corporates`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique corporate identifier |
| user_id | UUID | FOREIGN KEY UNIQUE NOT NULL | References users.id |
| company_name | VARCHAR(255) | NOT NULL | Legal company name |
| industry | VARCHAR(100) | NOT NULL | Industry classification |
| company_address | VARCHAR(500) | NOT NULL | Business address |
| company_city | VARCHAR(100) | NOT NULL | City location |
| company_province | VARCHAR(100) | NOT NULL | Province location |
| employee_count | INTEGER | NOT NULL | Current employee count |
| active_employee_count | INTEGER | DEFAULT 0 | Employees with active coverage |
| active_dependent_count | INTEGER | DEFAULT 0 | Dependents with active coverage |
| insurer_id | UUID | FOREIGN KEY NOT NULL | References insurers.id |
| hr_contact_name | VARCHAR(100) | NOT NULL | HR department contact name |
| hr_contact_email | VARCHAR(255) | NOT NULL | HR contact email |
| hr_contact_phone | VARCHAR(20) | NOT NULL | HR contact phone |
| contract_start_date | DATE | NOT NULL | Contract commencement date |
| contract_end_date | DATE | NOT NULL | Contract expiration date |
| monthly_premium_total_pkr | DECIMAL(12,2) | NOT NULL | Monthly premium in PKR |
| status | ENUM | DEFAULT 'Active' | Values: Active, Inactive, Suspended |
| member_since | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: user_id REFERENCES users(id) ON DELETE CASCADE
- FOREIGN KEY: insurer_id REFERENCES insurers(id) ON DELETE RESTRICT
- UNIQUE: user_id
- CHECK: employee_count > 0
- CHECK: active_employee_count <= employee_count
- CHECK: monthly_premium_total_pkr > 0
- CHECK: contract_end_date > contract_start_date

**Indexes:**
- user_id (UNIQUE)
- insurer_id
- status
- contract_start_date
- contract_end_date
- created_at
- (insurer_id, status)

**Validation Rules:**
- Company name must be 3-255 characters
- Employee count must match actual employees in system eventually
- Monthly premium must be positive
- Contract dates must not overlap with previous contracts for same corporate

---

## 5. EMPLOYEE ENTITY

**Table:** `employees`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique employee identifier |
| corporate_id | UUID | FOREIGN KEY NOT NULL | References corporates.id |
| employee_number | VARCHAR(50) | UNIQUE NOT NULL | Unique employee ID from corporate |
| first_name | VARCHAR(100) | NOT NULL | Employee first name |
| last_name | VARCHAR(100) | NOT NULL | Employee last name |
| email | VARCHAR(255) | NOT NULL | Company email address |
| phone | VARCHAR(20) | NOT NULL | Contact phone number |
| plan_id | UUID | FOREIGN KEY NOT NULL | References plans.id |
| designation | VARCHAR(100) | NOT NULL | Job title |
| department | VARCHAR(100) | NOT NULL | Department name |
| coverage_start_date | DATE | NOT NULL | Insurance coverage start |
| coverage_end_date | DATE | NOT NULL | Insurance coverage end |
| status | ENUM | DEFAULT 'Active' | Values: Active, Inactive, Suspended, Terminated |
| import_status | ENUM | NULLABLE | Values: valid, invalid, duplicate |
| import_errors | JSON | NULLABLE | Array of validation error messages |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: corporate_id REFERENCES corporates(id) ON DELETE CASCADE
- FOREIGN KEY: plan_id REFERENCES plans(id) ON DELETE RESTRICT
- UNIQUE: employee_number (within corporate scope)
- CHECK: coverage_end_date > coverage_start_date

**Indexes:**
- corporate_id
- employee_number
- plan_id
- status
- created_at
- (corporate_id, employee_number)
- (corporate_id, status)

**Validation Rules:**
- Employee number format: alphanumeric, 3-50 characters
- Email format: valid RFC 5322
- Phone format: Pakistan format
- Designation must be 2-100 characters
- Department must exist in corporate's department list
- Coverage dates must align with corporate contract dates

---

## 6. DEPENDENT ENTITY

**Table:** `dependents`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique dependent identifier |
| employee_id | UUID | FOREIGN KEY NOT NULL | References employees.id |
| corporate_id | UUID | FOREIGN KEY NOT NULL | References corporates.id |
| first_name | VARCHAR(100) | NOT NULL | Dependent first name |
| last_name | VARCHAR(100) | NOT NULL | Dependent last name |
| relationship | ENUM | NOT NULL | Values: Spouse, Son, Daughter, Father, Mother |
| date_of_birth | DATE | NOT NULL | YYYY-MM-DD format |
| gender | ENUM | NOT NULL | Values: Male, Female, Other |
| cnic | VARCHAR(15) | NULLABLE | Pakistan CNIC (if available) |
| phone_number | VARCHAR(20) | NULLABLE | Contact phone |
| coverage_start_date | DATE | NOT NULL | Coverage commencement |
| coverage_end_date | DATE | NOT NULL | Coverage expiration |
| status | ENUM | DEFAULT 'Pending' | Values: Pending, Approved, Rejected, Active, Inactive |
| request_date | TIMESTAMP | NOT NULL | ISO 8601 format |
| reviewed_date | TIMESTAMP | NULLABLE | ISO 8601 format |
| reviewed_by_user_id | UUID | FOREIGN KEY NULLABLE | References users.id (insurer staff) |
| rejection_reason | VARCHAR(500) | NULLABLE | Reason for rejection |
| document_ids | JSON | NULLABLE | Array of claim_document.id references |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: employee_id REFERENCES employees(id) ON DELETE CASCADE
- FOREIGN KEY: corporate_id REFERENCES corporates.id ON DELETE CASCADE
- FOREIGN KEY: reviewed_by_user_id REFERENCES users.id ON DELETE SET NULL
- CHECK: coverage_end_date > coverage_start_date
- CHECK: age >= 0 (derived from date_of_birth)

**Indexes:**
- employee_id
- corporate_id
- status
- coverage_start_date
- reviewed_by_user_id
- created_at
- (employee_id, status)

**Validation Rules:**
- CNIC format: 15 digits with hyphens or null
- Relationship must be from predefined list
- Age must be >= 18 for Spouse, >= 0 for others
- Date of birth must be before coverage start date
- Coverage dates must align with employee's coverage
- Documents required before approval

---

## 7. HOSPITAL ENTITY

**Table:** `hospitals`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique hospital identifier |
| user_id | UUID | FOREIGN KEY UNIQUE NOT NULL | References users.id |
| hospital_name | VARCHAR(255) | NOT NULL | Official hospital name |
| license_number | VARCHAR(100) | UNIQUE NOT NULL | Government license |
| accreditation | VARCHAR(100) | NULLABLE | Accreditation standard |
| city | VARCHAR(100) | NOT NULL | City location |
| address | VARCHAR(500) | NOT NULL | Complete address |
| latitude | DECIMAL(9,6) | NULLABLE | Geographic latitude |
| longitude | DECIMAL(9,6) | NULLABLE | Geographic longitude |
| location_hint | VARCHAR(255) | NULLABLE | Landmark description |
| emergency_phone | VARCHAR(20) | NOT NULL | 24/7 emergency contact |
| bed_capacity | INTEGER | NOT NULL | Total beds |
| icu_beds | INTEGER | NOT NULL | ICU bed count |
| departments | JSON | NOT NULL | Array of department names |
| hospital_type | ENUM | DEFAULT 'reimbursable' | Values: reimbursable, non-reimbursable |
| has_emergency_unit | BOOLEAN | DEFAULT true | Emergency services available |
| is_24_hours | BOOLEAN | DEFAULT true | 24/7 operation |
| network_status | ENUM | DEFAULT 'Active' | Values: Active, Pending, Inactive |
| is_active | BOOLEAN | DEFAULT true | Status flag |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: user_id REFERENCES users(id) ON DELETE CASCADE
- UNIQUE: user_id
- UNIQUE: license_number
- CHECK: bed_capacity > 0
- CHECK: icu_beds <= bed_capacity
- CHECK: emergency_phone is valid

**Indexes:**
- user_id (UNIQUE)
- license_number (UNIQUE)
- city
- network_status
- hospital_type
- is_active
- created_at
- (city, is_active)
- (network_status, is_active)

**Validation Rules:**
- Hospital name: 3-255 characters
- License number: alphanumeric, unique
- City must be valid Pakistan city
- Coordinates must be within Pakistan bounds if provided
- Departments must be from predefined list
- Emergency phone format: Pakistan format

---

## 8. HOSPITAL_EMERGENCY_CONTACT ENTITY

**Table:** `hospital_emergency_contacts`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique identifier |
| hospital_id | UUID | FOREIGN KEY NOT NULL | References hospitals.id |
| contact_level | INTEGER | NOT NULL | Priority level (1-5) |
| designation | VARCHAR(100) | NOT NULL | Job title |
| name | VARCHAR(100) | NOT NULL | Contact person name |
| contact_number | VARCHAR(20) | NOT NULL | Direct phone number |
| remarks | VARCHAR(500) | NULLABLE | Additional notes |
| is_active | BOOLEAN | DEFAULT true | Contact availability |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: hospital_id REFERENCES hospitals.id ON DELETE CASCADE
- UNIQUE: (hospital_id, contact_level)
- CHECK: contact_level BETWEEN 1 AND 5

**Indexes:**
- hospital_id
- contact_level
- (hospital_id, contact_level)

**Validation Rules:**
- Designation: 2-100 characters
- Contact number format: Pakistan format
- Contact level: integer 1-5 (1=highest priority)
- Name: 3-100 characters

---

## 9. INSURER ENTITY

**Table:** `insurers`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique insurer identifier |
| user_id | UUID | FOREIGN KEY UNIQUE NOT NULL | References users.id |
| company_name | VARCHAR(255) | NOT NULL | Official company name |
| license_number | VARCHAR(100) | UNIQUE NOT NULL | Insurance license number |
| registration_number | VARCHAR(100) | UNIQUE NOT NULL | Government registration |
| address | VARCHAR(500) | NOT NULL | Office address |
| city | VARCHAR(100) | NOT NULL | City location |
| province | VARCHAR(100) | NOT NULL | Province location |
| website | VARCHAR(255) | NULLABLE | Company website URL |
| max_coverage_limit_pkr | DECIMAL(12,2) | NOT NULL | Maximum coverage per policy |
| claim_processing_time_days | INTEGER | NOT NULL | SLA in days |
| network_hospital_count | INTEGER | DEFAULT 0 | Number of partner hospitals |
| corporate_client_count | INTEGER | DEFAULT 0 | Number of corporate clients |
| active_policyholder_count | INTEGER | DEFAULT 0 | Active policies count |
| status | ENUM | DEFAULT 'Active' | Values: Active, Inactive, Suspended |
| operating_since | DATE | NOT NULL | Company start date |
| license_expiry | DATE | NOT NULL | License expiration date |
| is_active | BOOLEAN | DEFAULT true | Account status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: user_id REFERENCES users(id) ON DELETE CASCADE
- UNIQUE: user_id
- UNIQUE: license_number
- UNIQUE: registration_number
- CHECK: max_coverage_limit_pkr > 0
- CHECK: claim_processing_time_days > 0
- CHECK: license_expiry >= CURRENT_DATE

**Indexes:**
- user_id (UNIQUE)
- license_number (UNIQUE)
- registration_number (UNIQUE)
- status
- city
- is_active
- created_at

**Validation Rules:**
- Company name: 3-255 characters
- License number: alphanumeric, unique
- Address: 10-500 characters
- City/Province: valid Pakistan locations
- Website: valid URL format if provided
- Processing time: 1-60 days
- License must not be expired

---

## 10. PLAN ENTITY

**Table:** `plans`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique plan identifier |
| plan_name | VARCHAR(255) | NOT NULL | Plan display name |
| plan_code | VARCHAR(50) | UNIQUE NOT NULL | Plan internal code |
| corporate_id | UUID | FOREIGN KEY NULLABLE | References corporates.id (null=insurer plan) |
| insurer_id | UUID | FOREIGN KEY NOT NULL | References insurers.id |
| sum_insured_pkr | DECIMAL(12,2) | NOT NULL | Total coverage in PKR |
| deductible_pkr | DECIMAL(12,2) | NOT NULL | Deductible amount in PKR |
| copay_percent | DECIMAL(5,2) | NOT NULL | Copay percentage (0-100) |
| covered_services | JSON | NOT NULL | Array of covered service types |
| service_limits | JSON | NOT NULL | Service-specific limits in PKR |
| valid_from | DATE | NOT NULL | Plan start date |
| valid_until | DATE | NOT NULL | Plan end date |
| is_active | BOOLEAN | DEFAULT true | Plan availability |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: corporate_id REFERENCES corporates.id ON DELETE SET NULL
- FOREIGN KEY: insurer_id REFERENCES insurers.id ON DELETE CASCADE
- UNIQUE: plan_code
- CHECK: sum_insured_pkr > 0
- CHECK: deductible_pkr >= 0
- CHECK: copay_percent BETWEEN 0 AND 100
- CHECK: valid_until > valid_from

**Indexes:**
- plan_code (UNIQUE)
- corporate_id
- insurer_id
- is_active
- created_at
- (insurer_id, is_active)
- (corporate_id, is_active)

**Validation Rules:**
- Plan name: 3-255 characters
- Plan code: alphanumeric, 3-50 characters
- Sum insured must be positive
- Deductible must be <= sum insured
- Copay must be 0-100%
- Covered services must not be empty
- Service limits must sum to <= sum insured

---

## 11. CLAIM ENTITY

**Table:** `claims`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique claim identifier |
| claim_number | VARCHAR(50) | UNIQUE NOT NULL | Sequential claim number |
| patient_id | UUID | FOREIGN KEY NOT NULL | References patients.id |
| employee_id | UUID | FOREIGN KEY NULLABLE | References employees.id |
| corporate_id | UUID | FOREIGN KEY NOT NULL | References corporates.id |
| hospital_id | UUID | FOREIGN KEY NOT NULL | References hospitals.id |
| plan_id | UUID | FOREIGN KEY NOT NULL | References plans.id |
| insurer_id | UUID | FOREIGN KEY NOT NULL | References insurers.id |
| claim_status | ENUM | DEFAULT 'Pending' | Values: Pending, Approved, Rejected, Paid, OnHold |
| amount_claimed_pkr | DECIMAL(12,2) | NOT NULL | Total claimed amount in PKR |
| approved_amount_pkr | DECIMAL(12,2) | DEFAULT 0 | Approved amount in PKR |
| paid_amount_pkr | DECIMAL(12,2) | DEFAULT 0 | Amount paid to date in PKR |
| admission_date | DATE | NOT NULL | Hospital admission date |
| discharge_date | DATE | NOT NULL | Hospital discharge date |
| treatment_category | VARCHAR(100) | NULLABLE | Type of treatment |
| priority | ENUM | DEFAULT 'Normal' | Values: Low, Normal, High |
| notes | VARCHAR(1000) | NULLABLE | Claims notes |
| claim_initiated_by_user_id | UUID | FOREIGN KEY NULLABLE | References users.id (who created claim) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: patient_id REFERENCES patients.id ON DELETE RESTRICT
- FOREIGN KEY: employee_id REFERENCES employees.id ON DELETE SET NULL
- FOREIGN KEY: corporate_id REFERENCES corporates.id ON DELETE RESTRICT
- FOREIGN KEY: hospital_id REFERENCES hospitals.id ON DELETE RESTRICT
- FOREIGN KEY: plan_id REFERENCES plans.id ON DELETE RESTRICT
- FOREIGN KEY: insurer_id REFERENCES insurers.id ON DELETE RESTRICT
- FOREIGN KEY: claim_initiated_by_user_id REFERENCES users.id ON DELETE SET NULL
- UNIQUE: claim_number
- CHECK: amount_claimed_pkr > 0
- CHECK: approved_amount_pkr <= amount_claimed_pkr
- CHECK: paid_amount_pkr <= approved_amount_pkr
- CHECK: discharge_date >= admission_date
- CHECK: admission_date <= CURRENT_DATE

**Indexes:**
- claim_number (UNIQUE)
- patient_id
- employee_id
- corporate_id
- hospital_id
- plan_id
- insurer_id
- claim_status
- priority
- created_at
- admission_date
- (patient_id, claim_status)
- (corporate_id, claim_status)
- (hospital_id, created_at)
- (claim_status, created_at)

**Validation Rules:**
- Claim number: auto-generated, format CLM-YYYY-XXXXXX
- Amount claimed: must be positive
- Approved amount: cannot exceed claimed amount
- Paid amount: cannot exceed approved amount
- Dates: admission before discharge, both before current date
- Treatment category from predefined list if provided
- Patient's policy must be active during treatment dates

---

## 12. CLAIM_EVENT ENTITY

**Table:** `claim_events`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique event identifier |
| claim_id | UUID | FOREIGN KEY NOT NULL | References claims.id |
| actor_user_id | UUID | FOREIGN KEY NOT NULL | References users.id |
| actor_name | VARCHAR(200) | NOT NULL | Full name of actor (denormalized) |
| actor_role | VARCHAR(100) | NOT NULL | Role of actor at event time |
| action | VARCHAR(255) | NOT NULL | Action description |
| status_from | ENUM | NULLABLE | Previous claim status |
| status_to | ENUM | NOT NULL | New claim status |
| event_note | VARCHAR(1000) | NULLABLE | Event details |
| timestamp | TIMESTAMP | NOT NULL | ISO 8601 format |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: claim_id REFERENCES claims.id ON DELETE CASCADE
- FOREIGN KEY: actor_user_id REFERENCES users.id ON DELETE SET NULL
- CHECK: timestamp IS NOT NULL
- CHECK: status_to IS NOT NULL

**Indexes:**
- claim_id
- actor_user_id
- timestamp
- action
- (claim_id, timestamp DESC)
- (actor_role, timestamp DESC)

**Validation Rules:**
- Action: 3-255 characters, alphanumeric + spaces
- Status values: Pending, Approved, Rejected, Paid, OnHold
- Timestamp must be ISO 8601 format
- Status transitions must follow business rules
- Actor role must match user's actual role

**Status Transition Rules:**
- Pending → Approved, Rejected, OnHold
- Approved → Paid, OnHold, Rejected
- Rejected → Cannot transition (terminal state)
- Paid → Cannot transition (terminal state)
- OnHold → Pending, Approved, Rejected

---

## 13. CLAIM_DOCUMENT ENTITY

**Table:** `claim_documents`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique document identifier |
| claim_id | UUID | FOREIGN KEY NOT NULL | References claims.id |
| document_type | ENUM | NOT NULL | Values: discharge-summary, bill, lab-report, prescription, imaging, other |
| original_filename | VARCHAR(255) | NOT NULL | Original file name |
| file_path | VARCHAR(500) | NOT NULL | Supabase storage path |
| file_url | VARCHAR(500) | NOT NULL | Public/signed URL |
| file_size_bytes | INTEGER | NOT NULL | File size in bytes |
| mime_type | VARCHAR(100) | NOT NULL | File MIME type |
| file_hash | VARCHAR(64) | NULLABLE | SHA-256 hash for verification |
| uploaded_by_user_id | UUID | FOREIGN KEY NOT NULL | References users.id |
| uploaded_by_role | VARCHAR(100) | NOT NULL | Role of uploader |
| document_status | ENUM | DEFAULT 'Uploaded' | Values: Uploaded, Verified, Rejected, Processed |
| verification_note | VARCHAR(500) | NULLABLE | Verification feedback |
| verified_by_user_id | UUID | FOREIGN KEY NULLABLE | References users.id |
| verified_at | TIMESTAMP | NULLABLE | ISO 8601 format |
| uploaded_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: claim_id REFERENCES claims.id ON DELETE CASCADE
- FOREIGN KEY: uploaded_by_user_id REFERENCES users.id ON DELETE SET NULL
- FOREIGN KEY: verified_by_user_id REFERENCES users.id ON DELETE SET NULL
- CHECK: file_size_bytes > 0
- CHECK: file_size_bytes <= 52428800 (50MB max)
- CHECK: uploaded_at <= verified_at OR verified_at IS NULL

**Indexes:**
- claim_id
- document_type
- document_status
- uploaded_by_user_id
- verified_by_user_id
- uploaded_at
- (claim_id, document_type)
- (document_status, created_at)

**Validation Rules:**
- Original filename: non-empty, 1-255 characters
- File path: must be valid Supabase path
- MIME type: must be approved type (PDF, images, etc.)
- File size: max 50MB
- Document type from predefined list
- Uploader must be associated with claim process
- Verifier must be insurer staff if status = Verified

---

## 14. TRANSACTION ENTITY

**Table:** `transactions`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique transaction identifier |
| transaction_number | VARCHAR(50) | UNIQUE NOT NULL | Sequential transaction number |
| claim_id | UUID | FOREIGN KEY NOT NULL | References claims.id |
| patient_id | UUID | FOREIGN KEY NOT NULL | References patients.id |
| corporate_id | UUID | FOREIGN KEY NOT NULL | References corporates.id |
| amount_pkr | DECIMAL(12,2) | NOT NULL | Transaction amount in PKR |
| transaction_type | ENUM | NOT NULL | Values: claim-reimbursement, copay, deductible, refund |
| payment_method | VARCHAR(100) | NOT NULL | Values: bank-transfer, cheque, mobile-wallet, direct-deposit |
| bank_account_number | VARCHAR(50) | NULLABLE | Account number (last 4 digits only) |
| transaction_status | ENUM | DEFAULT 'Pending' | Values: Pending, Processed, Completed, Failed, Cancelled |
| reference_number | VARCHAR(100) | NULLABLE | Bank/system reference |
| initiated_date | DATE | NOT NULL | Transaction initiation date |
| completed_date | DATE | NULLABLE | Transaction completion date |
| failed_reason | VARCHAR(500) | NULLABLE | Failure reason if status=Failed |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: claim_id REFERENCES claims.id ON DELETE RESTRICT
- FOREIGN KEY: patient_id REFERENCES patients.id ON DELETE RESTRICT
- FOREIGN KEY: corporate_id REFERENCES corporates.id ON DELETE RESTRICT
- UNIQUE: transaction_number
- CHECK: amount_pkr > 0
- CHECK: completed_date >= initiated_date OR completed_date IS NULL

**Indexes:**
- transaction_number (UNIQUE)
- claim_id
- patient_id
- corporate_id
- transaction_status
- initiated_date
- (transaction_status, initiated_date)
- (claim_id, transaction_status)

**Validation Rules:**
- Transaction number: auto-generated, format TXN-YYYY-XXXXXX
- Amount: positive integer in PKR
- Payment method from approved list
- Bank account: 4-50 characters, masked except last 4 digits
- Reference number: alphanumeric if provided
- Dates must be valid and in sequence

**Status Transitions:**
- Pending → Processed, Failed, Cancelled
- Processed → Completed, Failed
- Completed → Cannot transition (terminal)
- Failed → Cannot transition (terminal)
- Cancelled → Cannot transition (terminal)

---

## 15. CHAT_MESSAGE ENTITY

**Table:** `chat_messages`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique message identifier |
| claim_id | UUID | FOREIGN KEY NOT NULL | References claims.id |
| sender_user_id | UUID | FOREIGN KEY NOT NULL | References users.id |
| sender_role | ENUM | NOT NULL | Values: hospital, insurer, patient, corporate |
| receiver_role | ENUM | NOT NULL | Values: hospital, insurer, patient, corporate |
| message_text | TEXT | NOT NULL | Message content |
| is_read | BOOLEAN | DEFAULT false | Read status |
| timestamp | TIMESTAMP | NOT NULL | ISO 8601 format |
| message_type | ENUM | DEFAULT 'text' | Values: text, system, document-upload |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: claim_id REFERENCES claims.id ON DELETE CASCADE
- FOREIGN KEY: sender_user_id REFERENCES users.id ON DELETE SET NULL
- CHECK: message_text IS NOT NULL AND LENGTH(message_text) > 0
- CHECK: sender_role <> receiver_role

**Indexes:**
- claim_id
- sender_user_id
- timestamp
- is_read
- (claim_id, timestamp DESC)
- (sender_user_id, timestamp DESC)

**Validation Rules:**
- Message text: 1-5000 characters
- Sender and receiver roles must be different
- Timestamp: ISO 8601 format
- Roles from predefined list

---

## 16. CHAT_MESSAGE_ATTACHMENT ENTITY

**Table:** `chat_message_attachments`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique attachment identifier |
| message_id | UUID | FOREIGN KEY NOT NULL | References chat_messages.id |
| filename | VARCHAR(255) | NOT NULL | Original filename |
| file_path | VARCHAR(500) | NOT NULL | Supabase storage path |
| file_url | VARCHAR(500) | NOT NULL | Public/signed URL |
| file_size_bytes | INTEGER | NOT NULL | File size in bytes |
| mime_type | VARCHAR(100) | NOT NULL | File MIME type |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: message_id REFERENCES chat_messages.id ON DELETE CASCADE
- CHECK: file_size_bytes > 0
- CHECK: file_size_bytes <= 52428800 (50MB max)

**Indexes:**
- message_id
- created_at

---

## 17. NOTIFICATION ENTITY

**Table:** `notifications`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique notification identifier |
| user_id | UUID | FOREIGN KEY NOT NULL | References users.id |
| notification_type | ENUM | NOT NULL | Values: claim-status, policy-update, dependent-request, messaging-alert |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification message |
| severity | ENUM | DEFAULT 'info' | Values: info, warning, critical |
| related_entity_id | UUID | NULLABLE | References entity (claim_id, dependent_id, etc.) |
| related_entity_type | VARCHAR(50) | NULLABLE | Entity type (claim, dependent, etc.) |
| is_read | BOOLEAN | DEFAULT false | Read status |
| action_url | VARCHAR(500) | NULLABLE | URL to related entity |
| category | VARCHAR(100) | NULLABLE | Category tag |
| timestamp | TIMESTAMP | NOT NULL | ISO 8601 format |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: user_id REFERENCES users.id ON DELETE CASCADE
- CHECK: title IS NOT NULL AND LENGTH(title) > 0
- CHECK: message IS NOT NULL AND LENGTH(message) > 0

**Indexes:**
- user_id
- notification_type
- is_read
- timestamp
- created_at
- (user_id, is_read, timestamp DESC)
- (user_id, notification_type, created_at DESC)

**Notification Types & Severity Mapping:**

| Type | Severity | Content |
|------|----------|---------|
| claim-status | info/warning/critical | Claim status changed, approval, rejection |
| policy-update | info | Coverage changes, renewals, expirations |
| dependent-request | warning | New dependent added, approval status |
| messaging-alert | info | New messages in claim discussion |

**Validation Rules:**
- Title: 3-255 characters
- Message: 1-2000 characters
- Severity from predefined list
- Type from predefined list
- Timestamp: ISO 8601 format
- Action URL: valid HTTP/HTTPS if provided

---

## 18. LAB ENTITY

**Table:** `labs`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique lab identifier |
| user_id | UUID | FOREIGN KEY UNIQUE NOT NULL | References users.id |
| lab_name | VARCHAR(255) | NOT NULL | Official lab name |
| lab_code | VARCHAR(50) | UNIQUE NOT NULL | Internal code |
| city | VARCHAR(100) | NOT NULL | City location |
| address | VARCHAR(500) | NOT NULL | Lab address |
| license_number | VARCHAR(100) | UNIQUE NOT NULL | Government license |
| contact_phone | VARCHAR(20) | NOT NULL | Primary contact number |
| contact_email | VARCHAR(255) | NOT NULL | Contact email |
| test_categories | JSON | NOT NULL | Array of test types offered |
| turnaround_time_hours | INTEGER | NOT NULL | Max time to deliver results |
| is_active | BOOLEAN | DEFAULT true | Lab status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: user_id REFERENCES users(id) ON DELETE CASCADE
- UNIQUE: user_id
- UNIQUE: lab_code
- UNIQUE: license_number
- CHECK: turnaround_time_hours > 0

**Indexes:**
- user_id (UNIQUE)
- lab_code (UNIQUE)
- license_number (UNIQUE)
- city
- is_active
- (city, is_active)

**Validation Rules:**
- Lab name: 3-255 characters
- Lab code: alphanumeric, 3-50 characters
- License number: alphanumeric, unique
- Contact phone: Pakistan format
- Email: valid RFC 5322
- Test categories: non-empty array from predefined list
- Turnaround time: 1-168 hours

---

## 19. LAB_TEST ENTITY

**Table:** `lab_tests`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique test identifier |
| test_name | VARCHAR(255) | NOT NULL | Test display name |
| test_code | VARCHAR(50) | UNIQUE NOT NULL | Internal test code |
| lab_id | UUID | FOREIGN KEY NOT NULL | References labs.id |
| test_category | VARCHAR(100) | NOT NULL | Category classification |
| description | VARCHAR(500) | NULLABLE | Test description |
| normal_range | VARCHAR(255) | NULLABLE | Normal result range |
| unit_of_measure | VARCHAR(50) | NOT NULL | Measurement unit |
| cost_pkr | DECIMAL(10,2) | NOT NULL | Cost in PKR |
| turnaround_hours | INTEGER | NOT NULL | Result delivery time |
| is_active | BOOLEAN | DEFAULT true | Test availability |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: lab_id REFERENCES labs.id ON DELETE CASCADE
- UNIQUE: test_code
- CHECK: cost_pkr > 0
- CHECK: turnaround_hours > 0

**Indexes:**
- test_code (UNIQUE)
- lab_id
- test_category
- (lab_id, test_category)

---

## 20. LAB_REPORT ENTITY

**Table:** `lab_reports`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique report identifier |
| claim_id | UUID | FOREIGN KEY NULLABLE | References claims.id (null if not claim-related) |
| patient_id | UUID | FOREIGN KEY NOT NULL | References patients.id |
| lab_id | UUID | FOREIGN KEY NOT NULL | References labs.id |
| test_ids | JSON | NOT NULL | Array of lab_test.id |
| report_status | ENUM | DEFAULT 'Pending' | Values: Pending, In Progress, Completed, Delivered |
| ordered_date | DATE | NOT NULL | Test order date |
| completed_date | DATE | NULLABLE | Test completion date |
| delivered_date | DATE | NULLABLE | Report delivery date |
| results | JSON | NULLABLE | Test results and values |
| lab_technician_name | VARCHAR(100) | NULLABLE | Technician name |
| report_file_id | UUID | FOREIGN KEY NULLABLE | References claim_documents.id |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: claim_id REFERENCES claims.id ON DELETE SET NULL
- FOREIGN KEY: patient_id REFERENCES patients.id ON DELETE CASCADE
- FOREIGN KEY: lab_id REFERENCES labs.id ON DELETE RESTRICT
- FOREIGN KEY: report_file_id REFERENCES claim_documents.id ON DELETE SET NULL
- CHECK: completed_date >= ordered_date OR completed_date IS NULL
- CHECK: delivered_date >= completed_date OR delivered_date IS NULL

**Indexes:**
- claim_id
- patient_id
- lab_id
- report_status
- ordered_date
- (patient_id, ordered_date DESC)

---

## 21. PATIENT_MEDICAL_CONDITIONS ENTITY (NORMALIZED)

**Table:** `patient_medical_conditions`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique identifier |
| patient_id | UUID | FOREIGN KEY NOT NULL | References patients.id |
| condition_name | VARCHAR(100) | NOT NULL | Medical condition name |
| diagnosed_date | DATE | NULLABLE | When condition was diagnosed |
| is_active | BOOLEAN | DEFAULT true | Current status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: patient_id REFERENCES patients(id) ON DELETE CASCADE
- UNIQUE: (patient_id, condition_name)

**Indexes:**
- patient_id
- (patient_id, is_active)

---

## 22. PATIENT_ALLERGIES ENTITY (NORMALIZED)

**Table:** `patient_allergies`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique identifier |
| patient_id | UUID | FOREIGN KEY NOT NULL | References patients.id |
| allergy_name | VARCHAR(100) | NOT NULL | Allergy substance/medication |
| severity | ENUM | NOT NULL | Values: Mild, Moderate, Severe |
| reaction_description | VARCHAR(500) | NULLABLE | Description of reaction |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: patient_id REFERENCES patients(id) ON DELETE CASCADE
- UNIQUE: (patient_id, allergy_name)

**Indexes:**
- patient_id
- severity

---

## 23. HOSPITAL_DEPARTMENTS ENTITY (NORMALIZED)

**Table:** `hospital_departments`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique identifier |
| hospital_id | UUID | FOREIGN KEY NOT NULL | References hospitals.id |
| department_name | VARCHAR(100) | NOT NULL | Department name |
| head_name | VARCHAR(100) | NULLABLE | Department head name |
| contact_number | VARCHAR(20) | NULLABLE | Department contact |
| is_active | BOOLEAN | DEFAULT true | Department status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: hospital_id REFERENCES hospitals(id) ON DELETE CASCADE
- UNIQUE: (hospital_id, department_name)

**Indexes:**
- hospital_id
- (hospital_id, is_active)

---

## 24. PLAN_SERVICES ENTITY (NORMALIZED - CRITICAL FOR CLAIMS)

**Table:** `plan_services`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique identifier |
| plan_id | UUID | FOREIGN KEY NOT NULL | References plans.id |
| service_code | VARCHAR(50) | NOT NULL | Service identifier |
| service_name | VARCHAR(100) | NOT NULL | Service display name |
| max_limit_pkr | DECIMAL(12,2) | NOT NULL | Maximum coverage in PKR |
| copay_percent | DECIMAL(5,2) | NOT NULL | Copay percentage for this service |
| is_covered | BOOLEAN | DEFAULT true | Service is covered |
| is_active | BOOLEAN | DEFAULT true | Service availability |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: plan_id REFERENCES plans(id) ON DELETE CASCADE
- UNIQUE: (plan_id, service_code)
- CHECK: max_limit_pkr > 0
- CHECK: copay_percent BETWEEN 0 AND 100

**Indexes:**
- plan_id
- service_code
- (plan_id, is_active)

**Usage:** Used during claim approval to validate claimed services and their limits. No JSON parsing needed.

---

## 25. LAB_TEST_CATEGORIES ENTITY (NORMALIZED)

**Table:** `lab_test_categories`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique identifier |
| lab_id | UUID | FOREIGN KEY NOT NULL | References labs.id |
| category_name | VARCHAR(100) | NOT NULL | Test category name |
| is_active | BOOLEAN | DEFAULT true | Category availability |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: lab_id REFERENCES labs(id) ON DELETE CASCADE
- UNIQUE: (lab_id, category_name)

**Indexes:**
- lab_id
- (lab_id, is_active)

---

## 26. LAB_REPORT_TESTS ENTITY (MANY-TO-MANY)

**Table:** `lab_report_tests`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique identifier |
| lab_report_id | UUID | FOREIGN KEY NOT NULL | References lab_reports.id |
| lab_test_id | UUID | FOREIGN KEY NOT NULL | References lab_tests.id |
| test_result_value | VARCHAR(255) | NULLABLE | Result value |
| result_status | ENUM | NULLABLE | Values: Normal, Abnormal, Critical |
| notes | VARCHAR(500) | NULLABLE | Result notes |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: lab_report_id REFERENCES lab_reports(id) ON DELETE CASCADE
- FOREIGN KEY: lab_test_id REFERENCES lab_tests(id) ON DELETE RESTRICT
- UNIQUE: (lab_report_id, lab_test_id)

**Indexes:**
- lab_report_id
- lab_test_id
- (lab_report_id, lab_test_id)

---

## 27. DEPENDENT_DOCUMENTS ENTITY (NORMALIZED)

**Table:** `dependent_documents`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique identifier |
| dependent_id | UUID | FOREIGN KEY NOT NULL | References dependents.id |
| document_id | UUID | FOREIGN KEY NOT NULL | References claim_documents.id |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: dependent_id REFERENCES dependents(id) ON DELETE CASCADE
- FOREIGN KEY: document_id REFERENCES claim_documents(id) ON DELETE CASCADE
- UNIQUE: (dependent_id, document_id)

**Indexes:**
- dependent_id
- document_id

---

## 28. AUDIT_LOG ENTITY (FOR COMPLIANCE & TRACKING)

**Table:** `audit_logs`

| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| id | UUID PRIMARY KEY | NOT NULL | Unique audit entry identifier |
| entity_type | VARCHAR(100) | NOT NULL | Table name (e.g., patients, claims) |
| entity_id | UUID | NOT NULL | ID of changed record |
| user_id | UUID | FOREIGN KEY NULLABLE | References users.id who made change |
| action | ENUM | NOT NULL | Values: CREATE, UPDATE, DELETE, RESTORE |
| field_name | VARCHAR(100) | NULLABLE | Field that changed (for updates) |
| old_value | TEXT | NULLABLE | Previous value |
| new_value | TEXT | NULLABLE | New value |
| change_reason | VARCHAR(500) | NULLABLE | Why change was made |
| timestamp | TIMESTAMP | NOT NULL | When change occurred (ISO 8601) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format |

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: user_id REFERENCES users(id) ON DELETE SET NULL
- CHECK: timestamp IS NOT NULL
- CHECK: action IN ('CREATE', 'UPDATE', 'DELETE', 'RESTORE')

**Indexes:**
- entity_type
- entity_id
- user_id
- timestamp
- (entity_type, entity_id, timestamp DESC)
- (action, timestamp DESC)

**Important Notes:**
- Audit logs are immutable (never updated or deleted)
- Triggered automatically on changes to sensitive tables: patients, claims, transactions, dependents
- Useful for compliance, debugging, and historical tracking
- Examples: Patient coverage changes, claim status updates, transaction attempts

---

## RELATIONSHIP DIAGRAM

```
┌─────────────┐
│    USERS    │◄─────────────────────────────────────┐
├─────────────┤                                       │
│ id (PK)     │                                       │
│ email (U)   │                                       │
│ role        │                                       │
│ ...         │                                       │
└─────────────┘                                       │
      ▲                                               │
      │ 1:1                                           │
      │ (user_id FK)                                  │
      │                                               │
      ├──────────────────┬──────────────┬─────────┐   │
      │                  │              │         │   │
      │                  │              │         │   │
┌──────────────┐  ┌─────────────┐ ┌──────────┐  │   │
│  PATIENTS    │  │ CORPORATES  │ │HOSPITALS │  │   │
├──────────────┤  ├─────────────┤ ├──────────┤  │   │
│ id (PK)      │  │ id (PK)     │ │ id (PK)  │  │   │
│ user_id (FK) │  │ user_id (FK)│ │ user_id  │  │   │
│ emp_id (FK)  │◄─│             │ │ (FK)     │  │   │
│ corp_id (FK) │  │ insurer_id  │ │ ins_id   │  │   │
│ insurer_id   │  │ (FK)        │ │ (FK)     │  │   │
│ ...          │  └─────────────┘ └──────────┘  │   │
└──────────────┘        ▲              ▲        │   │
      ▲                 │              │        │   │
      │ 1:N             │              │        │   │
      │                 │ 1:N          │        │   │
      │                 │              │        │   │
┌──────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  EMPLOYEES   │  │   PLANS     │  │  INSURERS    │◄┘
├──────────────┤  ├─────────────┤  ├──────────────┤
│ id (PK)      │  │ id (PK)     │  │ id (PK)      │
│ corp_id (FK) │  │ corp_id(FK) │  │ user_id (FK) │
│ plan_id (FK) │─►│ insurer_id  │◄─│ ...          │
│ ...          │  │ (FK)        │  └──────────────┘
└──────────────┘  └─────────────┘
      │                                │
      │ 1:N                            │
      │ (emp_id FK)                    │
      │                                │
┌──────────────┐                       │
│ DEPENDENTS   │                       │
├──────────────┤                       │
│ id (PK)      │                       │
│ emp_id (FK)  │                       │
│ corp_id (FK) │───────────────────────┘
│ ...          │
└──────────────┘
      ▲
      │ 1:1 (Patient ref)
      │
      └── PATIENTS (dependent_id FK)


┌──────────────┐
│   CLAIMS     │◄─────────────────────┐
├──────────────┤                       │
│ id (PK)      │                       │
│ patient_id   │─┐ 1:N                 │
│ employee_id  │ │                     │
│ corp_id (FK) │ │   ┌──────────────┐  │
│ hosp_id (FK) │ │   │CLAIM_EVENTS  │  │
│ plan_id (FK) │ │   ├──────────────┤  │
│ insurer_id   │ │   │ id (PK)      │  │
│ ...          │ │   │ claim_id(FK) │─┘ 1:N
└──────────────┘ │   │ actor_id(FK) │
      │ 1:N      │   │ ...          │
      └──────────┼──►└──────────────┘
                 │
         ┌───────┴────────┐
         │ 1:N            │ 1:N
         ▼                ▼
    ┌──────────────┐  ┌─────────────────┐
    │CLAIM_DOCUMENTS│  │  TRANSACTIONS   │
    ├──────────────┤  ├─────────────────┤
    │ id (PK)      │  │ id (PK)         │
    │ claim_id(FK) │  │ claim_id (FK)   │
    │ ...          │  │ patient_id(FK)  │
    └──────────────┘  │ corp_id (FK)    │
                      │ ...             │
                      └─────────────────┘


┌──────────────┐
│ CHAT_MESSAGES│
├──────────────┤
│ id (PK)      │
│ claim_id(FK) │◄────┐ 1:N
│ sender_id(FK)│     │
│ ...          │     │
└──────────────┘     │
                     │
             ┌───────┴──────────────┐
             │ 1:N                  │
             ▼                      │
    ┌──────────────────┐            │
    │NOTIFICATIONS     │            │
    ├──────────────────┤            │
    │ id (PK)          │            │
    │ user_id (FK)     │            │
    │ related_entity_id│────────────┘
    │ ...              │
    └──────────────────┘


┌──────────────┐
│    LABS      │
├──────────────┤
│ id (PK)      │
│ user_id (FK) │
│ ...          │
└──────────────┘
      │ 1:N
      │ (lab_id FK)
      ▼
┌──────────────┐
│  LAB_TESTS   │
├──────────────┤
│ id (PK)      │
│ lab_id (FK)  │
│ ...          │
└──────────────┘

      │
      │ 1:N
      │
      ▼
┌──────────────┐
│ LAB_REPORTS  │
├──────────────┤
│ id (PK)      │
│ claim_id(FK) │
│ patient_id   │◄──────┐ many-to-one
│ lab_id (FK)  │       │
│ ...          │       │
└──────────────┘       │
                       │
                  ┌────┴─────────┐
                  │ 1:many       │
                  ▼              ▼
            ┌──────────┐   ┌──────────────┐
            │ PATIENTS │   │ CLAIM_EVENTS │
            └──────────┘   └──────────────┘
```

---

## VALIDATION RULES & BUSINESS LOGIC

### User Management
1. **Email Uniqueness:** Each user email must be globally unique
2. **Role Assignment:** User role determines access level and feature set
3. **Password Policy:** Minimum 8 characters, must include uppercase, lowercase, digit, special character
4. **Active Status:** Only active users can authenticate and access system

### Patient-Employee-Dependent Hierarchy
1. **Patient Types:**
   - **Type A:** Employee patient (employee_id NOT NULL, dependent_id NULL)
   - **Type B:** Dependent patient (dependent_id NOT NULL, employee_id NULL)
   - **Type C:** Standalone patient (both NULL) - allowed for direct insurance

2. **Coverage Relationship:**
   - Employee coverage must align with corporate contract dates
   - Dependent coverage must be within employee's coverage period
   - Patient policy must be active during claim treatment dates

3. **Dependent Constraints:**
   - Maximum 5 dependents per employee (business rule)
   - Dependents cannot have their own dependents
   - Dependent age: 18+ for Spouse, any age for children/parents

### Corporate Management
1. **Contract Integrity:** Corporate contract dates cannot overlap with previous contracts
2. **Employee Sync:** Employee count must match actual employees eventually
3. **Premium Calculation:** Monthly premium = (sum of plan costs × active employee count) + dependent costs
4. **Active Status:** Corporate status changes affect all employee coverage

### Claim Workflow
1. **Claim Initiation:**
   - Patient must be active and insured
   - Admission/discharge dates within policy active period
   - Hospital must be network hospital (preferred) or approved for reimbursement

2. **Amount Validation:**
   - Amount claimed must be positive
   - Cannot exceed plan sum insured
   - After approval: approved amount ≤ claimed amount
   - After payment: paid amount ≤ approved amount ≤ claimed amount

3. **Status Transitions (State Machine):**
   ```
   Pending → {Approved, Rejected, OnHold}
   Approved → {Paid, OnHold, Rejected}
   Rejected → (terminal)
   Paid → (terminal)
   OnHold → {Pending, Approved, Rejected}
   ```

4. **Event Audit Trail:**
   - Every status change creates claim_event entry
   - Actor info recorded at event time (not user lookup)
   - Cannot delete events (audit immutability)
   - Events ordered chronologically by timestamp

### Document Management
1. **File Storage:**
   - Files stored in Supabase bucket
   - Metadata stored in database
   - Max file size: 50MB
   - Allowed types: PDF, PNG, JPG, JPEG, DOCX, XLSX

2. **Document Verification:**
   - Upload creates "Uploaded" status
   - Insurer staff verifies → "Verified" status
   - Failed verification → "Rejected" status
   - All documents must be verified before claim approval

3. **Sensitive Data:**
   - File hash for integrity checking
   - Path/URL encryption if needed
   - Access control via bucket policies
   - Audit log of access

### Transaction Processing
1. **Status Transitions:**
   ```
   Pending → {Processed, Failed, Cancelled}
   Processed → {Completed, Failed}
   Completed → (terminal)
   Failed → (terminal)
   Cancelled → (terminal)
   ```

2. **Amount Validation:**
   - Transaction amount must match approved claim amount
   - Only one payment transaction per claim (typically)
   - Deductible and copay handled separately if applicable

3. **Reference Tracking:**
   - Bank reference number for reconciliation
   - Account number masked (last 4 digits only)
   - Failed reason documented for debugging

### Notification System
1. **Notification Types & Auto-Triggers:**

   | Type | Trigger | Severity |
   |------|---------|----------|
   | claim-status | Claim status change | info/warning |
   | policy-update | Coverage change, renewal, expiry | info |
   | dependent-request | New dependent added | warning |
   | messaging-alert | New claim message | info |

2. **Recipient Rules:**
   - Patient notified of their claims
   - Corporate HR notified of policy updates
   - Hospital notified of new claims
   - Insurer staff notified of documents

### Lab Integration
1. **Lab Independence:**
   - Labs are independent entities (separate user accounts)
   - Can offer tests to multiple insurers
   - No direct corporate affiliation

2. **Test Result Flow:**
   - Doctor orders lab tests (referenced in claim)
   - Lab completes tests and uploads report
   - Report status: Pending → In Progress → Completed → Delivered
   - Report attached to claim as document

### Messaging Constraints
1. **Claim Messages:**
   - Only parties involved in claim can message
   - Hospital ↔ Insurer primary flow
   - Patient/Corporate can view but not always message
   - Messages tied to specific claim

2. **Attachments:**
   - Max 50MB per attachment
   - Type restrictions (no executables)
   - Stored in Supabase
   - Automatic deletion on message deletion

---

## INDEXING STRATEGY (TIER-BASED APPROACH)

Optimized for read-heavy queries with minimal write overhead.

### TIER 1: ESSENTIAL INDEXES (All must have)

**Foreign Key Indexes** (Referential integrity):
```sql
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_corporate_id ON patients(corporate_id);
CREATE INDEX idx_patients_insurer_id ON patients(insurer_id);
CREATE INDEX idx_claims_patient_id ON claims(patient_id);
CREATE INDEX idx_claims_insurer_id ON claims(insurer_id);
CREATE INDEX idx_claims_hospital_id ON claims(hospital_id);
-- ... [All FK columns required]
```

**Uniqueness Enforcement** (Automatically indexed):
```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_patients_cnic ON patients(cnic);
CREATE UNIQUE INDEX idx_patients_policy_number ON patients(policy_number);
-- ... [All UNIQUE constraints]
```

**Soft Delete Queries** (On every table):
```sql
CREATE INDEX idx_patients_deleted_at ON patients(deleted_at);
CREATE INDEX idx_claims_deleted_at ON claims(deleted_at);
CREATE INDEX idx_transactions_deleted_at ON transactions(deleted_at);
-- ... [All 28 entities]
```

### TIER 2: HIGH-TRAFFIC INDEXES (Strong recommendations)

**Patient Lookups** (Frequent UI queries):
```sql
CREATE INDEX idx_patients_corporate_active ON patients(
  corporate_id, is_active, deleted_at
);

CREATE INDEX idx_patients_insurer_status ON patients(
  insurer_id, policy_status, is_active
);
```

**Claim Queries** (Critical path - Most important):
```sql
CREATE INDEX idx_claims_patient_date ON claims(
  patient_id, created_at DESC, deleted_at
);

CREATE INDEX idx_claims_insurer_status ON claims(
  insurer_id, approval_status, created_at DESC
);

CREATE INDEX idx_claims_hospital_status ON claims(
  hospital_id, claim_status, created_at DESC
);
```

**Transaction Queries** (Financial reporting):
```sql
CREATE INDEX idx_transactions_patient_date ON transactions(
  patient_id, created_at DESC, deleted_at
);

CREATE INDEX idx_transactions_claim_status ON transactions(
  claim_id, status, created_at DESC
);
```

**Audit Trail Queries** (Compliance):
```sql
CREATE INDEX idx_audit_logs_entity ON audit_logs(
  entity_type, entity_id, timestamp DESC
);

CREATE INDEX idx_audit_logs_user_time ON audit_logs(
  user_id, timestamp DESC
);

CREATE INDEX idx_audit_logs_field ON audit_logs(
  field_name, entity_type, entity_id, timestamp DESC
);
```

**Chat/Notification Queries**:
```sql
CREATE INDEX idx_chat_messages_claim_time ON chat_messages(
  claim_id, created_at DESC
);

CREATE INDEX idx_notifications_user_time ON notifications(
  user_id, is_read, created_at DESC
);
```

### TIER 3: OPTIONAL INDEXES (Evaluate with query profiling)

```sql
CREATE INDEX idx_hospitals_city ON hospitals(city)
  WHERE is_active = true;

CREATE INDEX idx_labs_city ON labs(city)
  WHERE is_active = true;
```

### TIER 4: DO NOT ADD (Anti-patterns)

```sql
-- ❌ Minimal benefit on high-volume tables
-- ❌ Redundant with composite indexes already created
```

### Index Performance Monitoring:

```sql
-- Run quarterly to identify unused indexes
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

**Guidelines:** Total indexes < 2x table size, no single index > 50% table size

---

## TRANSACTION ISOLATION STRATEGY

**Default Level:** READ COMMITTED (for high concurrency)

### Operation-Specific Isolation Levels

| Operation | Isolation Level | Reason | Impact |
|-----------|-----------------|--------|--------|
| **Claim Approval** | SERIALIZABLE | Cannot have conflicting approvals (critical state) | Heavy locking - expected |
| **Payment Processing** | SERIALIZABLE | Double-payment protection (financial safety) | Heavy locking - required |
| **Claim Creation** | REPEATABLE READ | Prevent concurrent updates; optimistic locking fallback | Moderate |
| **Coverage Checks** | READ COMMITTED | Reading limits is safe (retry if limit depleted) | Minimal |
| **Patient Data Updates** | READ COMMITTED | Address/phone changes independent (audit logged) | Minimal |
| **Chat/Messaging** | READ COMMITTED | Message ordering managed separately (timestamp-based) | Minimal |

### Implementation Pattern (NestJS):

```javascript
// High-risk: SERIALIZABLE for claim approval
const approveClaimWithSerializable = async (claimId) => {
  const connection = getConnection();
  const queryRunner = connection.createQueryRunner();
  await queryRunner.startTransaction('SERIALIZABLE');
  
  try {
    const claim = await queryRunner.manager.findOne(Claim, { id: claimId }, { 
      lock: { mode: 'pessimistic_write' }
    });
    
    // Update claim atomically
    claim.approval_status = 'approved';
    await queryRunner.manager.save(claim);
    
    // Create audit log
    await queryRunner.manager.insert(AuditLog, {
      entity_type: 'claims',
      entity_id: claimId,
      action: 'UPDATE',
      old_values: { approval_status: 'pending' },
      new_values: { approval_status: 'approved' }
    });
    
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  }
};

// Standard: READ COMMITTED for patient updates
const updatePatientAddress = async (patientId, address) => {
  const patient = await Patient.findOne(patientId);
  patient.address = address;
  await patient.save(); // Uses default READ COMMITTED
};
```

### Constraints Enforcement
- Foreign key constraints: ON DELETE CASCADE/RESTRICT/SET NULL as specified
- Unique constraints on business identifiers
- Check constraints for value ranges
- Application-level validation for complex rules
- Optimistic locking via version column for high-contention tables

---

## BACKUP & RECOVERY

1. **Backup Strategy:**
   - Daily full database backups
   - Hourly transaction log backups
   - Supabase automatic backups for documents

2. **Recovery Points:**
   - Point-in-time recovery up to 30 days
   - Document versioning in Supabase

3. **High Availability:**
   - Read replicas for reporting queries
   - Connection pooling for concurrent access
   - Regular backup restoration testing

---

## AUDIT COMPLIANCE

1. **Immutable Audit Trail:**
   - All claim events timestamped and actor-tracked
   - Document verification history maintained
   - Transaction reference trail preserved

2. **Data Retention:**
   - Claims: 7 years minimum
   - Documents: 7 years minimum
   - Transactions: 7 years minimum
   - Chat messages: 2 years minimum
   - Notifications: 1 year minimum

3. **PII Compliance:**
   - Patient CNIC stored encrypted
   - Bank account numbers masked
   - Password hashes (never plain text)
   - Document access logged

---

## SOFT DELETES & SOFT DELETE STRATEGY

### Soft Delete Implementation

All entities now have a `deleted_at` TIMESTAMP field (nullable) instead of relying solely on `is_active` boolean. This provides better audit trails and recovery options.

**Benefits:**
- Historical data remains intact
- Timestamp tracking for compliance
- Easy recovery if deletion was accidental
- Better for analytics (can filter by date range)

**Query Pattern:**
```sql
-- Get active records only
SELECT * FROM patients WHERE deleted_at IS NULL;

-- Get soft-deleted records
SELECT * FROM patients WHERE deleted_at IS NOT NULL;

-- Include in audit trail
SELECT * FROM audit_logs WHERE entity_type = 'patients' AND entity_id = ?;
```

**Soft Delete Guidelines:**
- `deleted_at = NULL` means active record
- `deleted_at = TIMESTAMP` means soft-deleted (not shown to users)
- All DELETE operations should be soft deletes (UPDATE deleted_at)
- Only hard delete when legally required (PII regulations)
- Cascade soft deletes across related records if needed

### Affected Entities with Soft Delete:
- users
- patients
- corporates
- employees
- dependents
- hospitals
- hospital_emergency_contacts
- insurers
- plans
- claims
- claim_events
- claim_documents
- transactions
- chat_messages
- notifications
- labs
- lab_tests
- All normalized tables (conditions, allergies, departments, etc.)

---

## TIME ZONE HANDLING

**All timestamps stored in UTC (ISO 8601 format) in the database.**

**Best Practices:**
1. **Database Level:** Store all timestamps as UTC
2. **Application Level:** Convert to user's local timezone for display
3. **Client Level:** Handle timezone-aware formatting in frontend
4. **Audit Trail:** Always log in UTC for consistency

**Example:**
```
Database: 2026-01-13T10:30:00Z (UTC)
Pakistan (PKT): 2026-01-13T15:30:00+05:00 (UTC+5)
API Response: Send ISO 8601, client converts to local time
```

---

## SUMMARY STATISTICS

| Metric | Value |
|--------|-------|
| Total Entities | 28 |
| Total Tables | 28 |
| Total Fields | 450+ |
| Primary Keys | 28 |
| Foreign Keys | 80+ |
| Unique Constraints | 30+ |
| Check Constraints | 50+ |
| Composite Indexes | 20+ |
| Simple Indexes | 60+ |
| **New Normalized Tables** | **8** (medical conditions, allergies, departments, plan services, test categories, lab report tests, dependent documents, audit logs) |

**Sample Volumes:**
- Corporates: 5-50
- Employees: 10 per corporate = 50-500
- Patients: 15 per corporate = 75-750 (including dependents)
- Patient Medical Conditions: 2-5 per patient = 150-3750
- Patient Allergies: 1-3 per patient = 75-2250
- Hospital Departments: 5-15 per hospital = 25-750
- Plan Services: 5-10 per plan = 25-500
- Claims: 3-5 per patient per year = 225-3750/year
- Claim Events: 5-10 per claim = 1125-37500/year
- Claim Documents: 3-5 per claim = 675-18750/year
- Audit Log Entries: 5-20 per day per active user (varies by activity)
