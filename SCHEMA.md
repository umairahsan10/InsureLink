# InsureLink Database Schema - UPDATED & NORMALIZED

**Version:** 3.0 (Schema Simplification & Restructuring)  
**Last Updated:** February 5, 2026

---

## SCHEMA IMPROVEMENTS APPLIED ✅

This version incorporates major simplification and restructuring based on comprehensive schema review:

### Changes Applied:

| Change                                 | Details                                                                                           | Impact                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **✅ Simplified Users Table**          | Removed `profile_picture_url`, `is_active`; Added `user_role`, `dob`, `gender`, `cnic`, `address` | Consolidated user information              |
| **✅ Simplified Patients Table**       | Removed redundant fields (coverage, policy, personal info) - now references employees/users       | Cleaner data model, single source of truth |
| **✅ Added Medicine Table**            | New `medicines` table with pricing information                                                    | Support for medication tracking            |
| **✅ Restructured Employee-Dependent** | One-to-many relationship; coverage amounts moved to employees                                     | Proper relationship modeling               |
| **✅ Simplified Corporates**           | Removed prefixes, renamed `monthly_premium_total_pkr` to `total_amount_used`                      | Cleaner naming conventions                 |
| **✅ Simplified Hospitals**            | Removed `accreditation`, `location_hint`, `bed_capacity`, etc.                                    | Essential fields only                      |
| **✅ Simplified Claims**               | Removed `paid_amount`, `claim_initiated_by_user_id`                                               | Streamlined claim workflow                 |
| **✅ Removed Unnecessary Tables**      | Removed `transactions`, `user_role_profiles`, and normalized tables                               | Simplified schema                          |
| **✅ Simplified Labs**                 | Replaced `user_id` with `insurer_id`; removed `lab_code`, `turnaround_time_hours`                 | Insurer-managed labs                       |

---

## Executive Summary

Comprehensive relational database schema for InsureLink insurance management platform. Supports corporate employee health insurance with claim processing, dependent coverage, multi-lab diagnostics, and real-time messaging. All monetary amounts in PKR; timestamps in ISO 8601 UTC format.

**Key Entities:** 18 tables, unified user management with role-based access, claim event audit trail, document metadata storage with Supabase integration, notifications, medicine tracking, and full audit logging.

---

## 1. USER ENTITY

**Table:** `users`

| Field         | Type             | Constraints                         | Description                                   |
| ------------- | ---------------- | ----------------------------------- | --------------------------------------------- |
| id            | UUID PRIMARY KEY | NOT NULL                            | Unique user identifier                        |
| email         | VARCHAR(255)     | UNIQUE, NOT NULL                    | Email address for login                       |
| password_hash | VARCHAR(255)     | NOT NULL                            | Hashed password                               |
| first_name    | VARCHAR(100)     | NOT NULL                            | User's first name                             |
| last_name     | VARCHAR(100)     | NULLABLE                            | User's last name                              |
| phone         | VARCHAR(20)      | NOT NULL                            | Contact phone number                          |
| user_role     | ENUM             | NOT NULL                            | Values: patient, corporate, hospital, insurer |
| dob           | DATE             | NULLABLE                            | Date of birth (YYYY-MM-DD)                    |
| gender        | ENUM             | NULLABLE                            | Values: Male, Female, Other                   |
| cnic          | VARCHAR(15)      | UNIQUE NULLABLE                     | Pakistan CNIC/ID number                       |
| address       | VARCHAR(500)     | NULLABLE                            | Residential address                           |
| created_at    | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP, NOT NULL | ISO 8601 format                               |
| updated_at    | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP           | ISO 8601 format                               |
| last_login_at | TIMESTAMP        | NULLABLE                            | ISO 8601 format                               |

**Constraints:**

- PRIMARY KEY: id
- UNIQUE: email
- UNIQUE: cnic (where not null)
- FOREIGN KEY: None (base table)

**Indexes:**

- email (UNIQUE)
- cnic (UNIQUE)
- user_role
- created_at

**Validation Rules:**

- Email must be valid format (RFC 5322)
- Password minimum 8 characters, includes uppercase, lowercase, digit, special character
- Phone format: Pakistan format (+92XXXXXXXXXXX or 03XXXXXXXXX)
- CNIC format: 15 digits with hyphens (XXXXX-XXXXXXXXX-X)
- Role must be one of defined enum values

---

## 3. CORPORATE ENTITY

**Table:** `corporates`

| Field               | Type             | Constraints                 | Description                         |
| ------------------- | ---------------- | --------------------------- | ----------------------------------- |
| id                  | UUID PRIMARY KEY | NOT NULL                    | Unique corporate identifier         |
| user_id             | UUID             | FOREIGN KEY UNIQUE NOT NULL | Represents HR login                 |
| name                | VARCHAR(255)     | NOT NULL                    | Legal company name                  |
| address             | VARCHAR(500)     | NOT NULL                    | Business address                    |
| city                | VARCHAR(100)     | NOT NULL                    | City location                       |
| province            | VARCHAR(100)     | NOT NULL                    | Province location                   |
| employee_count      | INTEGER          | NOT NULL                    | Current employee count              |
| dependent_count     | INTEGER          | DEFAULT 0                   | Dependents with active coverage     |
| insurer_id          | UUID             | FOREIGN KEY NOT NULL        | References insurers.id              |
| contact_name        | VARCHAR(100)     | NOT NULL                    | Contact person name                 |
| contact_email       | VARCHAR(255)     | NOT NULL                    | Contact email                       |
| contact_phone       | VARCHAR(20)      | NOT NULL                    | Contact phone                       |
| contract_start_date | DATE             | NOT NULL                    | Contract commencement date          |
| contract_end_date   | DATE             | NOT NULL                    | Contract expiration date            |
| total_amount_used   | DECIMAL(12,2)    | DEFAULT 0                   | Total amount used annually in PKR   |
| status              | ENUM             | DEFAULT 'Active'            | Values: Active, Inactive, Suspended |
| created_at          | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP   | ISO 8601 format                     |
| updated_at          | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP   | ISO 8601 format                     |

**Constraints:**

- PRIMARY KEY: id
- FOREIGN KEY: user_id REFERENCES users(id) ON DELETE CASCADE
- FOREIGN KEY: insurer_id REFERENCES insurers(id) ON DELETE RESTRICT
- UNIQUE: user_id
- CHECK: employee_count > 0
- CHECK: total_amount_used >= 0
- CHECK: contract_end_date > contract_start_date

**Indexes:**

- insurer_id
- status
- contract_start_date
- contract_end_date
- created_at
- (insurer_id, status)

**Validation Rules:**

- Company name must be 3-255 characters
- Employee count must match actual employees in system eventually
- Contract dates must not overlap with previous contracts for same corporate

---

## 4. EMPLOYEE ENTITY

**Table:** `employees`

| Field               | Type             | Constraints                 | Description                                     |
| ------------------- | ---------------- | --------------------------- | ----------------------------------------------- |
| id                  | UUID PRIMARY KEY | NOT NULL                    | Unique employee identifier                      |
| user_id             | UUID             | FOREIGN KEY UNIQUE NOT NULL | References users.id                             |
| corporate_id        | UUID             | FOREIGN KEY NOT NULL        | References corporates.id                        |
| employee_number     | VARCHAR(50)      | UNIQUE NOT NULL             | Unique employee ID from corporate               |
| plan_id             | UUID             | FOREIGN KEY NOT NULL        | References plans.id                             |
| designation         | VARCHAR(100)     | NOT NULL                    | Job title                                       |
| department          | VARCHAR(100)     | NOT NULL                    | Department name                                 |
| coverage_start_date | DATE             | NOT NULL                    | Insurance coverage start                        |
| coverage_end_date   | DATE             | NOT NULL                    | Insurance coverage end                          |
| coverage_amount     | DECIMAL(12,2)    | NOT NULL                    | Total coverage in PKR                           |
| used_amount         | DECIMAL(12,2)    | DEFAULT 0                   | Amount claimed to date in PKR                   |
| status              | ENUM             | DEFAULT 'Active'            | Values: Active, Inactive, Suspended, Terminated |
| created_at          | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP   | ISO 8601 format                                 |
| updated_at          | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP   | ISO 8601 format                                 |

**Constraints:**

- PRIMARY KEY: id
- FOREIGN KEY: user_id REFERENCES users(id) ON DELETE CASCADE
- FOREIGN KEY: corporate_id REFERENCES corporates(id) ON DELETE CASCADE
- FOREIGN KEY: plan_id REFERENCES plans(id) ON DELETE RESTRICT
- UNIQUE: user_id
- UNIQUE: employee_number (within corporate scope)
- CHECK: coverage_end_date > coverage_start_date
- CHECK: coverage_amount > 0
- CHECK: used_amount >= 0 AND used_amount <= coverage_amount

**Indexes:**

- user_id (UNIQUE)
- corporate_id
- employee_number
- plan_id
- status
- created_at
- (corporate_id, employee_number)
- (corporate_id, status)

**Validation Rules:**

- Employee number format: alphanumeric, 3-50 characters
- Designation must be 2-100 characters
- Department must exist in corporate's department list
- Coverage dates must align with corporate contract dates
- Used amount cannot exceed coverage amount

---

## 5. DEPENDENT ENTITY

**Table:** `dependents`

| Field            | Type             | Constraints               | Description                                           |
| ---------------- | ---------------- | ------------------------- | ----------------------------------------------------- |
| id               | UUID PRIMARY KEY | NOT NULL                  | Unique dependent identifier                           |
| employee_id      | UUID             | FOREIGN KEY NOT NULL      | References employees.id                               |
| first_name       | VARCHAR(100)     | NOT NULL                  | Dependent first name                                  |
| last_name        | VARCHAR(100)     | NOT NULL                  | Dependent last name                                   |
| relationship     | ENUM             | NOT NULL                  | Values: Spouse, Son, Daughter, Father, Mother         |
| date_of_birth    | DATE             | NOT NULL                  | YYYY-MM-DD format                                     |
| gender           | ENUM             | NOT NULL                  | Values: Male, Female, Other                           |
| cnic             | VARCHAR(15)      | NULLABLE                  | Pakistan CNIC (if available)                          |
| phone_number     | VARCHAR(20)      | NULLABLE                  | Contact phone                                         |
| status           | ENUM             | DEFAULT 'Pending'         | Values: Pending, Approved, Rejected, Active, Inactive |
| request_date     | TIMESTAMP        | NOT NULL                  | ISO 8601 format                                       |
| reviewed_date    | TIMESTAMP        | NULLABLE                  | ISO 8601 format                                       |
| rejection_reason | VARCHAR(500)     | NULLABLE                  | Reason for rejection                                  |
| created_at       | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format                                       |
| updated_at       | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format                                       |

**Constraints:**

- PRIMARY KEY: id
- FOREIGN KEY: employee_id REFERENCES employees(id) ON DELETE CASCADE
- CHECK: age >= 0 (derived from date_of_birth)

**Indexes:**

- employee_id
- status
- created_at
- (employee_id, status)

**Validation Rules:**

- CNIC format: 15 digits with hyphens or null
- Relationship must be from predefined list
- Age must be >= 18 for Spouse, >= 0 for others
- Coverage is inherited from employee's coverage dates

---

## 6. HOSPITAL ENTITY

**Table:** `hospitals`

| Field              | Type             | Constraints                 | Description                            |
| ------------------ | ---------------- | --------------------------- | -------------------------------------- |
| id                 | UUID PRIMARY KEY | NOT NULL                    | Unique hospital identifier             |
| user_id            | UUID             | FOREIGN KEY UNIQUE NOT NULL | References users.id                    |
| hospital_name      | VARCHAR(255)     | NOT NULL                    | Official hospital name                 |
| license_number     | VARCHAR(100)     | UNIQUE NOT NULL             | Government license                     |
| city               | VARCHAR(100)     | NOT NULL                    | City location                          |
| address            | VARCHAR(500)     | NOT NULL                    | Complete address                       |
| latitude           | DECIMAL(9,6)     | NULLABLE                    | Geographic latitude                    |
| longitude          | DECIMAL(9,6)     | NULLABLE                    | Geographic longitude                   |
| emergency_phone    | VARCHAR(20)      | NOT NULL                    | 24/7 emergency contact                 |
| hospital_type      | ENUM             | DEFAULT 'reimbursable'      | Values: reimbursable, non-reimbursable |
| has_emergency_unit | BOOLEAN          | DEFAULT true                | Emergency services available           |
| is_active          | BOOLEAN          | DEFAULT true                | Status flag                            |
| created_at         | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP   | ISO 8601 format                        |
| updated_at         | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP   | ISO 8601 format                        |

**Constraints:**

- PRIMARY KEY: id
- FOREIGN KEY: user_id REFERENCES users(id) ON DELETE CASCADE
- UNIQUE: user_id
- UNIQUE: license_number
- CHECK: emergency_phone is valid

**Indexes:**

- user_id (UNIQUE)
- license_number (UNIQUE)
- city
- hospital_type
- is_active
- created_at
- (city, is_active)

**Validation Rules:**

- Hospital name: 3-255 characters
- License number: alphanumeric, unique
- City must be valid Pakistan city
- Coordinates must be within Pakistan bounds if provided
- Emergency phone format: Pakistan format

---

## 7. HOSPITAL_EMERGENCY_CONTACT ENTITY

**Table:** `hospital_emergency_contacts`

| Field          | Type             | Constraints               | Description             |
| -------------- | ---------------- | ------------------------- | ----------------------- |
| id             | UUID PRIMARY KEY | NOT NULL                  | Unique identifier       |
| hospital_id    | UUID             | FOREIGN KEY NOT NULL      | References hospitals.id |
| contact_level  | INTEGER          | NOT NULL                  | Priority level (1-5)    |
| designation    | VARCHAR(100)     | NOT NULL                  | Job title               |
| name           | VARCHAR(100)     | NOT NULL                  | Contact person name     |
| contact_number | VARCHAR(20)      | NOT NULL                  | Direct phone number     |
| is_active      | BOOLEAN          | DEFAULT true              | Contact availability    |
| created_at     | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format         |
| updated_at     | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format         |

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

## 7.1 HOSPITAL_VISITS ENTITY

**Table:** `hospital_visits`

| Field          | Type             | Constraints               | Description                               |
| -------------- | ---------------- | ------------------------- | ----------------------------------------- |
| id             | UUID PRIMARY KEY | NOT NULL                  | Unique visit identifier                   |
| employee_id    | UUID             | FOREIGN KEY NULLABLE      | References employees.id                   |
| dependent_id   | UUID             | FOREIGN KEY NULLABLE      | References dependents.id                  |
| hospital_id    | UUID             | FOREIGN KEY NOT NULL      | References hospitals.id                   |
| visit_date     | TIMESTAMP        | NOT NULL                  | Hospital visit date (ISO 8601 format)     |
| discharge_date | TIMESTAMP        | NULLABLE                  | Hospital discharge date (ISO 8601 format) |
| created_at     | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format                           |
| updated_at     | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format                           |

**Constraints:**

- PRIMARY KEY: id
- FOREIGN KEY: employee_id REFERENCES employees(id) ON DELETE CASCADE
- FOREIGN KEY: dependent_id REFERENCES dependents(id) ON DELETE CASCADE
- FOREIGN KEY: hospital_id REFERENCES hospitals(id) ON DELETE RESTRICT
- CHECK: Either employee_id OR dependent_id is NOT NULL
- CHECK: discharge_date IS NULL OR discharge_date >= visit_date

**Indexes:**

- employee_id
- dependent_id
- hospital_id
- visit_date
- created_at
- (employee_id, visit_date DESC)
- (dependent_id, visit_date DESC)
- (hospital_id, visit_date DESC)

**Validation Rules:**

- Either employee_id or dependent_id must be provided (XOR logic)
- visit_date must be in ISO 8601 format
- discharge_date (if provided) must be after or equal to visit_date
- Hospital must exist and be active
- Tracks hospital visits for both employees and dependents

---

## 8. INSURER ENTITY

**Table:** `insurers`

| Field                  | Type             | Constraints                 | Description                         |
| ---------------------- | ---------------- | --------------------------- | ----------------------------------- |
| id                     | UUID PRIMARY KEY | NOT NULL                    | Unique insurer identifier           |
| user_id                | UUID             | FOREIGN KEY UNIQUE NOT NULL | References users.id                 |
| company_name           | VARCHAR(255)     | NOT NULL                    | Official company name               |
| license_number         | VARCHAR(100)     | UNIQUE NOT NULL             | Insurance license number            |
| address                | VARCHAR(500)     | NOT NULL                    | Office address                      |
| city                   | VARCHAR(100)     | NOT NULL                    | City location                       |
| province               | VARCHAR(100)     | NOT NULL                    | Province location                   |
| max_coverage_limit     | DECIMAL(12,2)    | NOT NULL                    | Maximum coverage per policy in PKR  |
| network_hospital_count | INTEGER          | DEFAULT 0                   | Number of partner hospitals         |
| corporate_client_count | INTEGER          | DEFAULT 0                   | Number of corporate clients         |
| status                 | ENUM             | DEFAULT 'Active'            | Values: Active, Inactive, Suspended |
| operating_since        | DATE             | NOT NULL                    | Company start date                  |
| is_active              | BOOLEAN          | DEFAULT true                | Account status                      |
| created_at             | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP   | ISO 8601 format                     |
| updated_at             | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP   | ISO 8601 format                     |

**Constraints:**

- PRIMARY KEY: id
- FOREIGN KEY: user_id REFERENCES users(id) ON DELETE CASCADE
- UNIQUE: user_id
- UNIQUE: license_number
- CHECK: max_coverage_limit > 0

**Indexes:**

- user_id (UNIQUE)
- license_number (UNIQUE)
- status
- city
- is_active
- created_at

**Validation Rules:**

- Company name: 3-255 characters
- License number: alphanumeric, unique
- Address: 10-500 characters
- City/Province: valid Pakistan locations

---

## 9. PLAN ENTITY

**Table:** `plans`

| Field            | Type             | Constraints               | Description                    |
| ---------------- | ---------------- | ------------------------- | ------------------------------ |
| id               | UUID PRIMARY KEY | NOT NULL                  | Unique plan identifier         |
| plan_name        | VARCHAR(255)     | NOT NULL                  | Plan display name              |
| plan_code        | VARCHAR(50)      | UNIQUE NOT NULL           | Plan internal code             |
| insurer_id       | UUID             | FOREIGN KEY NOT NULL      | References insurers.id         |
| sum_insured      | DECIMAL(12,2)    | NOT NULL                  | Total coverage in PKR          |
| covered_services | JSON             | NOT NULL                  | Array of covered service types |
| service_limits   | JSON             | NOT NULL                  | Service-specific limits in PKR |
| is_active        | BOOLEAN          | DEFAULT true              | Plan availability              |
| created_at       | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format                |
| updated_at       | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format                |

**Constraints:**

- PRIMARY KEY: id
- FOREIGN KEY: insurer_id REFERENCES insurers.id ON DELETE CASCADE
- UNIQUE: plan_code
- CHECK: sum_insured > 0

**Indexes:**

- plan_code (UNIQUE)
- insurer_id
- is_active
- created_at
- (insurer_id, is_active)

**Validation Rules:**

- Plan name: 3-255 characters
- Plan code: alphanumeric, 3-50 characters
- Sum insured must be positive
- Covered services must not be empty
- Service limits must sum to <= sum insured

---

## 10. CLAIM ENTITY

**Table:** `claims`

| Field              | Type             | Constraints               | Description                                       |
| ------------------ | ---------------- | ------------------------- | ------------------------------------------------- |
| id                 | UUID PRIMARY KEY | NOT NULL                  | Unique claim identifier                           |
| claim_number       | VARCHAR(50)      | UNIQUE NOT NULL           | Sequential claim number                           |
| hospital_visit_id  | UUID             | FOREIGN KEY NOT NULL      | References hospital_visits.id                     |
| corporate_id       | UUID             | FOREIGN KEY NOT NULL      | References corporates.id                          |
| plan_id            | UUID             | FOREIGN KEY NOT NULL      | References plans.id                               |
| insurer_id         | UUID             | FOREIGN KEY NOT NULL      | References insurers.id                            |
| claim_status       | ENUM             | DEFAULT 'Pending'         | Values: Pending, Approved, Rejected, Paid, OnHold |
| amount_claimed     | DECIMAL(12,2)    | NOT NULL                  | Total claimed amount in PKR                       |
| approved_amount    | DECIMAL(12,2)    | DEFAULT 0                 | Approved amount in PKR                            |
| treatment_category | VARCHAR(100)     | NULLABLE                  | Type of treatment                                 |
| priority           | ENUM             | DEFAULT 'Normal'          | Values: Low, Normal, High                         |
| notes              | VARCHAR(1000)    | NULLABLE                  | Claims notes                                      |
| created_at         | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format                                   |
| updated_at         | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format                                   |

**Constraints:**

- PRIMARY KEY: id
- FOREIGN KEY: hospital_visit_id REFERENCES hospital_visits.id ON DELETE RESTRICT
- FOREIGN KEY: corporate_id REFERENCES corporates.id ON DELETE RESTRICT
- FOREIGN KEY: plan_id REFERENCES plans.id ON DELETE RESTRICT
- FOREIGN KEY: insurer_id REFERENCES insurers.id ON DELETE RESTRICT
- UNIQUE: claim_number
- CHECK: amount_claimed > 0
- CHECK: approved_amount <= amount_claimed

**Indexes:**

- claim_number (UNIQUE)
- hospital_visit_id
- corporate_id
- plan_id
- insurer_id
- claim_status
- priority
- created_at
- (hospital_visit_id, created_at)
- (corporate_id, claim_status)
- (claim_status, created_at)

**Validation Rules:**

- Claim number: auto-generated, format CLM-YYYY-XXXXXX
- Amount claimed: must be positive
- Approved amount: cannot exceed claimed amount
- Hospital visit must exist and be completed (visit_date in past)
- Treatment category from predefined list if provided
- Corporate must match hospital_visit's employee's corporate

---

## 11. CLAIM_EVENT ENTITY

**Table:** `claim_events`

| Field         | Type             | Constraints               | Description                       |
| ------------- | ---------------- | ------------------------- | --------------------------------- |
| id            | UUID PRIMARY KEY | NOT NULL                  | Unique event identifier           |
| claim_id      | UUID             | FOREIGN KEY NOT NULL      | References claims.id              |
| actor_user_id | UUID             | FOREIGN KEY NOT NULL      | References users.id               |
| actor_name    | VARCHAR(200)     | NOT NULL                  | Full name of actor (denormalized) |
| actor_role    | VARCHAR(100)     | NOT NULL                  | Role of actor at event time       |
| action        | VARCHAR(255)     | NOT NULL                  | Action description                |
| status_from   | ENUM             | NULLABLE                  | Previous claim status             |
| status_to     | ENUM             | NOT NULL                  | New claim status                  |
| event_note    | VARCHAR(1000)    | NULLABLE                  | Event details                     |
| timestamp     | TIMESTAMP        | NOT NULL                  | ISO 8601 format                   |
| created_at    | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format                   |

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

## 12. CLAIM_DOCUMENT ENTITY

**Table:** `claim_documents`

| Field             | Type             | Constraints               | Description                |
| ----------------- | ---------------- | ------------------------- | -------------------------- |
| id                | UUID PRIMARY KEY | NOT NULL                  | Unique document identifier |
| claim_id          | UUID             | FOREIGN KEY NOT NULL      | References claims.id       |
| original_filename | VARCHAR(255)     | NOT NULL                  | Original file name         |
| file_path         | VARCHAR(500)     | NOT NULL                  | Supabase storage path      |
| file_url          | VARCHAR(500)     | NOT NULL                  | Public/signed URL          |
| file_size_bytes   | INTEGER          | NOT NULL                  | File size in bytes         |
| created_at        | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format            |
| updated_at        | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format            |

**Constraints:**

- PRIMARY KEY: id
- FOREIGN KEY: claim_id REFERENCES claims.id ON DELETE CASCADE
- CHECK: file_size_bytes > 0
- CHECK: file_size_bytes <= 52428800 (50MB max)

**Indexes:**

- claim_id
- created_at

**Validation Rules:**

- Original filename: non-empty, 1-255 characters
- File path: must be valid Supabase path
- File size: max 50MB

---

## 13. CHAT_MESSAGE ENTITY

**Table:** `chat_messages`

| Field        | Type             | Constraints               | Description                           |
| ------------ | ---------------- | ------------------------- | ------------------------------------- |
| id           | UUID PRIMARY KEY | NOT NULL                  | Unique message identifier             |
| claim_id     | UUID             | FOREIGN KEY NOT NULL      | References claims.id                  |
| sender_id    | UUID             | FOREIGN KEY NOT NULL      | References users.id                   |
| receiver_id  | UUID             | FOREIGN KEY NOT NULL      | References users.id                   |
| message_text | TEXT             | NOT NULL                  | Message content                       |
| is_read      | BOOLEAN          | DEFAULT false             | Read status                           |
| timestamp    | TIMESTAMP        | NOT NULL                  | ISO 8601 format                       |
| message_type | ENUM             | DEFAULT 'text'            | Values: text, system, document-upload |
| created_at   | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format                       |

**Constraints:**

- PRIMARY KEY: id
- FOREIGN KEY: claim_id REFERENCES claims.id ON DELETE CASCADE
- FOREIGN KEY: sender_id REFERENCES users.id ON DELETE SET NULL
- FOREIGN KEY: receiver_id REFERENCES users.id ON DELETE SET NULL
- CHECK: message_text IS NOT NULL AND LENGTH(message_text) > 0
- CHECK: sender_id <> receiver_id

**Indexes:**

- claim_id
- sender_id
- receiver_id
- timestamp
- is_read
- (claim_id, timestamp DESC)
- (sender_id, timestamp DESC)

**Validation Rules:**

- Message text: 1-5000 characters
- Sender and receiver must be different users
- Timestamp: ISO 8601 format

---

## 14. CHAT_MESSAGE_ATTACHMENT ENTITY

**Table:** `chat_message_attachments`

| Field           | Type             | Constraints               | Description                  |
| --------------- | ---------------- | ------------------------- | ---------------------------- |
| id              | UUID PRIMARY KEY | NOT NULL                  | Unique attachment identifier |
| message_id      | UUID             | FOREIGN KEY NOT NULL      | References chat_messages.id  |
| filename        | VARCHAR(255)     | NOT NULL                  | Original filename            |
| file_path       | VARCHAR(500)     | NOT NULL                  | Supabase storage path        |
| file_url        | VARCHAR(500)     | NOT NULL                  | Public/signed URL            |
| file_size_bytes | INTEGER          | NOT NULL                  | File size in bytes           |
| created_at      | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format              |

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

| Field               | Type             | Constraints               | Description                                                             |
| ------------------- | ---------------- | ------------------------- | ----------------------------------------------------------------------- |
| id                  | UUID PRIMARY KEY | NOT NULL                  | Unique notification identifier                                          |
| user_id             | UUID             | FOREIGN KEY NOT NULL      | References users.id                                                     |
| notification_type   | ENUM             | NOT NULL                  | Values: claim-status, policy-update, dependent-request, messaging-alert |
| title               | VARCHAR(255)     | NOT NULL                  | Notification title                                                      |
| message             | TEXT             | NOT NULL                  | Notification message                                                    |
| severity            | ENUM             | DEFAULT 'info'            | Values: info, warning, critical                                         |
| related_entity_id   | UUID             | NULLABLE                  | References entity (claim_id, dependent_id, etc.)                        |
| related_entity_type | VARCHAR(50)      | NULLABLE                  | Entity type (claim, dependent, etc.)                                    |
| is_read             | BOOLEAN          | DEFAULT false             | Read status                                                             |
| action_url          | VARCHAR(500)     | NULLABLE                  | URL to related entity                                                   |
| category            | VARCHAR(100)     | NULLABLE                  | Category tag                                                            |
| timestamp           | TIMESTAMP        | NOT NULL                  | ISO 8601 format                                                         |
| created_at          | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format                                                         |

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

| Type              | Severity              | Content                                   |
| ----------------- | --------------------- | ----------------------------------------- |
| claim-status      | info/warning/critical | Claim status changed, approval, rejection |
| policy-update     | info                  | Coverage changes, renewals, expirations   |
| dependent-request | warning               | New dependent added, approval status      |
| messaging-alert   | info                  | New messages in claim discussion          |

**Validation Rules:**

- Title: 3-255 characters
- Message: 1-2000 characters
- Severity from predefined list
- Type from predefined list
- Timestamp: ISO 8601 format
- Action URL: valid HTTP/HTTPS if provided

---

## 16. LAB ENTITY

**Table:** `labs`

| Field           | Type             | Constraints               | Description                 |
| --------------- | ---------------- | ------------------------- | --------------------------- |
| id              | UUID PRIMARY KEY | NOT NULL                  | Unique lab identifier       |
| insurer_id      | UUID             | FOREIGN KEY NOT NULL      | References insurers.id      |
| lab_name        | VARCHAR(255)     | NOT NULL                  | Official lab name           |
| city            | VARCHAR(100)     | NOT NULL                  | City location               |
| address         | VARCHAR(500)     | NOT NULL                  | Lab address                 |
| license_number  | VARCHAR(100)     | UNIQUE NOT NULL           | Government license          |
| contact_phone   | VARCHAR(20)      | NOT NULL                  | Primary contact number      |
| contact_email   | VARCHAR(255)     | NOT NULL                  | Contact email               |
| test_categories | JSON             | NOT NULL                  | Array of test types offered |
| is_active       | BOOLEAN          | DEFAULT true              | Lab status                  |
| created_at      | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format             |
| updated_at      | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format             |

**Constraints:**

- PRIMARY KEY: id
- FOREIGN KEY: insurer_id REFERENCES insurers(id) ON DELETE CASCADE
- UNIQUE: license_number

**Indexes:**

- insurer_id
- license_number (UNIQUE)
- city
- is_active
- (city, is_active)
- (insurer_id, is_active)

**Validation Rules:**

- Lab name: 3-255 characters
- License number: alphanumeric, unique
- Contact phone: Pakistan format
- Email: valid RFC 5322
- Test categories: non-empty array from predefined list

---

## 18. AUDIT_LOG ENTITY (FOR COMPLIANCE & TRACKING)

**Table:** `audit_logs`

| Field         | Type             | Constraints               | Description                             |
| ------------- | ---------------- | ------------------------- | --------------------------------------- |
| id            | UUID PRIMARY KEY | NOT NULL                  | Unique audit entry identifier           |
| entity_type   | VARCHAR(100)     | NOT NULL                  | Table name (e.g., claims, employees)    |
| entity_id     | UUID             | NOT NULL                  | ID of changed record                    |
| user_id       | UUID             | FOREIGN KEY NULLABLE      | References users.id who made change     |
| action        | ENUM             | NOT NULL                  | Values: CREATE, UPDATE, DELETE, RESTORE |
| field_name    | VARCHAR(100)     | NULLABLE                  | Field that changed (for updates)        |
| old_value     | TEXT             | NULLABLE                  | Previous value                          |
| new_value     | TEXT             | NULLABLE                  | New value                               |
| change_reason | VARCHAR(500)     | NULLABLE                  | Why change was made                     |
| timestamp     | TIMESTAMP        | NOT NULL                  | When change occurred (ISO 8601)         |
| created_at    | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP | ISO 8601 format                         |

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
- Triggered automatically on changes to sensitive tables: patients, claims, dependents
- Useful for compliance, debugging, and historical tracking
- Examples: Patient coverage changes, claim status updates

---

## RELATIONSHIP DIAGRAM

```
┌─────────────┐
│    USERS    │◄────────────────────────────────────────┐
├─────────────┤                                          │
│ id (PK)     │                                          │
│ email (U)   │                                          │
│ user_role   │                                          │
│ dob, gender │                                          │
│ cnic, addr  │                                          │
└─────────────┘                                          │
      ▲                                                  │
      │ 1:1 (user_id FK)                                 │
      │                                                  │
      ├──────────────────┬──────────────┬────────────┐   │
      │                  │              │            │   │
      ▼                  ▼              ▼            ▼   │
┌──────────────┐  ┌──────────────┐ ┌──────────┐  ┌──────────────┐
│  PATIENTS    │  │  EMPLOYEES   │ │HOSPITALS │  │  INSURERS    │
├──────────────┤  ├──────────────┤ ├──────────┤  ├──────────────┤
│ id (PK)      │  │ id (PK)      │ │ id (PK)  │  │ id (PK)      │
│ user_id (FK) │  │ user_id (FK) │ │ user_id  │  │ user_id (FK) │
│ emp_id (FK)  │◄─│ corp_id (FK) │ │ (FK)     │  └──────────────┘
│ blood_group  │  │ plan_id (FK) │ └──────────┘         ▲
└──────────────┘  │ coverage_amt │        │             │
                  │ used_amount  │        │             │
                  └──────────────┘        │             │
                        │                 │             │
                        │ 1:N             │             │
                        ▼                 │             │
                  ┌──────────────┐        │             │
                  │ DEPENDENTS   │        │             │
                  ├──────────────┤        │             │
                  │ id (PK)      │        │             │
                  │ emp_id (FK)  │        │             │
                  │ relationship │        │             │
                  └──────────────┘        │             │
                                          │             │
┌──────────────┐                          │             │
│ CORPORATES   │◄─────────────────────────┘             │
├──────────────┤                                        │
│ id (PK)      │                                        │
│ insurer_id   │────────────────────────────────────────┘
│ name, addr   │
│ total_used   │
└──────────────┘
      ▲
      │ 1:N (corp_id FK)
      │
┌──────────────┐
│  EMPLOYEES   │
└──────────────┘


┌──────────────────────┐
│  HOSPITAL_VISITS     │
├──────────────────────┤
│ id (PK)              │
│ employee_id (FK)     │
│ dependent_id (FK)    │
│ hospital_id (FK)     │
│ visit_date           │
│ discharge_date       │
└──────────────────────┘
      ▲
      │ 1:N (hospital_visit_id FK)
      │
┌──────────────┐
│   CLAIMS     │◄─────────────────────┐
├──────────────┤                       │
│ id (PK)      │                       │
│ patient_id   │─┐ 1:N                 │
│ visit_id(FK) │ │   ┌──────────────┐  │
│ corp_id (FK) │ │   │CLAIM_EVENTS  │  │
│ plan_id (FK) │ │   ├──────────────┤  │
│ insurer_id   │ │   │ id (PK)      │  │
│ amount       │ │   │ claim_id(FK) │─┘ 1:N
│ ...          │ │   │ actor_id(FK) │
└──────────────┘ │   └──────────────┘
      │ 1:N      │
      │          │
      ▼          │
┌──────────────┐ │
│CLAIM_DOCUMENTS│◄┘
├──────────────┤
│ id (PK)      │
│ claim_id(FK) │
└──────────────┘


┌──────────────┐      ┌─────────────────────┐
│ CHAT_MESSAGES│      │ CHAT_MSG_ATTACHMENTS│
├──────────────┤      ├─────────────────────┤
│ id (PK)      │◄────►│ id (PK)             │
│ claim_id(FK) │      │ message_id (FK)     │
│ sender_id    │      └─────────────────────┘
│ receiver_id  │
└──────────────┘


┌──────────────┐      ┌──────────────┐
│NOTIFICATIONS │      │  MEDICINES   │
├──────────────┤      ├──────────────┤
│ id (PK)      │      │ id (PK)      │
│ user_id (FK) │      │ name         │
│ title, msg   │      │ unit_price   │
│ severity     │      │ pack_price   │
└──────────────┘      └──────────────┘


┌──────────────┐      ┌──────────────┐
│    LABS      │      │  AUDIT_LOGS  │
├──────────────┤      ├──────────────┤
│ id (PK)      │      │ id (PK)      │
│ insurer_id   │      │ entity_type  │
│ (FK)         │      │ entity_id    │
│ ...          │      │ user_id (FK) │
└──────────────┘      │ action       │
                      └──────────────┘


┌──────────────┐      ┌──────────────┐
│    PLANS     │      │HOSPITAL_EMRG │
├──────────────┤      │_CONTACTS     │
│ id (PK)      │      ├──────────────┤
│ insurer_id   │      │ id (PK)      │
│ (FK)         │      │ hospital_id  │
│ sum_insured  │      │ (FK)         │
└──────────────┘      └──────────────┘
```

---

## VALIDATION RULES & BUSINESS LOGIC

### User Management

1. **Email Uniqueness:** Each user email must be globally unique
2. **Role Assignment:** User role determines access level and feature set
3. **Password Policy:** Minimum 8 characters, must include uppercase, lowercase, digit, special character
4. **Active Status:** Only active users can authenticate and access system

### Corporate Management

1. **Contract Integrity:** Corporate contract dates cannot overlap with previous contracts
2. **Employee Sync:** Employee count must match actual employees eventually
3. **Total Amount Tracking:** `total_amount_used` tracks annual usage in PKR
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

2. **Sensitive Data:**
   - Path/URL encryption if needed
   - Access control via bucket policies
   - Audit log of access

### Notification System

1. **Notifications:**
   - Severity levels: info, warning, critical
   - Related entity tracking via `related_entity_id`

2. **Recipient Rules:**
   - Patient notified of their claims
   - Corporate contact notified of policy updates
   - Hospital notified of new claims
   - Insurer staff notified of documents

### Lab Integration

1. **Lab Management:**
   - Labs are managed by insurers (insurer_id FK)
   - Can offer tests to their corporate clients
   - Test categories stored as JSON array

### Messaging Constraints

1. **Claim Messages:**
   - Only parties involved in claim can message
   - sender_id and receiver_id reference users
   - Messages tied to specific claim

2. **Attachments:**
   - Max 50MB per attachment
   - Type restrictions (no executables)
   - Stored in Supabase
   - Automatic deletion on message deletion

### Medicine Tracking

1. **Medicine Records:**
   - Unit and pack pricing in PKR
   - Category classification
   - Prescription requirement flag

---

## INDEXING STRATEGY (TIER-BASED APPROACH)

Optimized for read-heavy queries with minimal write overhead.

### TIER 1: ESSENTIAL INDEXES (All must have)

**Foreign Key Indexes** (Referential integrity):

```sql
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_corporate_id ON employees(corporate_id);
CREATE INDEX idx_claims_hospital_visit_id ON claims(hospital_visit_id);
CREATE INDEX idx_claims_insurer_id ON claims(insurer_id);
CREATE INDEX idx_labs_insurer_id ON labs(insurer_id);
-- ... [All FK columns required]
```

**Uniqueness Enforcement** (Automatically indexed):

```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_cnic ON users(cnic);
CREATE UNIQUE INDEX idx_employees_employee_number ON employees(employee_number);
-- ... [All UNIQUE constraints]
```

### TIER 2: HIGH-TRAFFIC INDEXES (Strong recommendations)

**Employee Lookups** (Frequent UI queries):

```sql
CREATE INDEX idx_employees_corporate_status ON employees(
  corporate_id, status
);

CREATE INDEX idx_employees_coverage ON employees(
  coverage_start_date, coverage_end_date
);
```

**Claim Queries** (Critical path - Most important):

```sql
CREATE INDEX idx_claims_visit_date ON claims(
  hospital_visit_id, created_at DESC
);

CREATE INDEX idx_claims_insurer_status ON claims(
  insurer_id, claim_status, created_at DESC
);

CREATE INDEX idx_claims_corporate_status ON claims(
  corporate_id, claim_status, created_at DESC
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

| Operation                | Isolation Level | Reason                                                  | Impact                   |
| ------------------------ | --------------- | ------------------------------------------------------- | ------------------------ |
| **Claim Approval**       | SERIALIZABLE    | Cannot have conflicting approvals (critical state)      | Heavy locking - expected |
| **Payment Processing**   | SERIALIZABLE    | Double-payment protection (financial safety)            | Heavy locking - required |
| **Claim Creation**       | REPEATABLE READ | Prevent concurrent updates; optimistic locking fallback | Moderate                 |
| **Coverage Checks**      | READ COMMITTED  | Reading limits is safe (retry if limit depleted)        | Minimal                  |
| **Patient Data Updates** | READ COMMITTED  | Address/phone changes independent (audit logged)        | Minimal                  |
| **Chat/Messaging**       | READ COMMITTED  | Message ordering managed separately (timestamp-based)   | Minimal                  |

### Implementation Pattern (NestJS):

```javascript
// High-risk: SERIALIZABLE for claim approval
const approveClaimWithSerializable = async (claimId) => {
  const connection = getConnection();
  const queryRunner = connection.createQueryRunner();
  await queryRunner.startTransaction("SERIALIZABLE");

  try {
    const claim = await queryRunner.manager.findOne(
      Claim,
      { id: claimId },
      {
        lock: { mode: "pessimistic_write" },
      },
    );

    // Update claim atomically
    claim.approval_status = "approved";
    await queryRunner.manager.save(claim);

    // Create audit log
    await queryRunner.manager.insert(AuditLog, {
      entity_type: "claims",
      entity_id: claimId,
      action: "UPDATE",
      old_values: { approval_status: "pending" },
      new_values: { approval_status: "approved" },
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
   - Document history maintained

2. **Data Retention:**
   - Claims: 7 years minimum
   - Documents: 7 years minimum
   - Chat messages: 2 years minimum
   - Notifications: 1 year minimum

3. **PII Compliance:**
   - User CNIC stored in users table
   - Password hashes (never plain text)
   - Document access logged

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
Database: 2026-02-05T10:30:00Z (UTC)
Pakistan (PKT): 2026-02-05T15:30:00+05:00 (UTC+5)
API Response: Send ISO 8601, client converts to local time
```

---

## SUMMARY STATISTICS

| Metric             | Value |
| ------------------ | ----- |
| Total Entities     | 18    |
| Total Tables       | 18    |
| Total Fields       | 195+  |
| Primary Keys       | 18    |
| Foreign Keys       | 40+   |
| Unique Constraints | 15+   |
| Check Constraints  | 25+   |
| Composite Indexes  | 10+   |
| Simple Indexes     | 33+   |

**Tables:**

1. users
2. corporates
3. employees
4. dependents
5. hospitals
6. hospital_emergency_contacts
7. hospital_visits
8. insurers
9. plans
10. claims
11. claim_events
12. claim_documents
13. chat_messages
14. chat_message_attachments
15. notifications
16. labs
17. medicines
18. audit_logs

**Sample Volumes:**

- Corporates: 5-50
- Employees: 10 per corporate = 50-500
- Dependents: 2 per employee = 100-1000
- Patients: Employees + Dependents = 150-1500
- Claims: 3-5 per patient per year = 450-7500/year
- Claim Events: 5-10 per claim = 2250-75000/year
- Claim Documents: 3-5 per claim = 1350-37500/year
- Audit Log Entries: 5-20 per day per active user (varies by activity)
