-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('patient', 'corporate', 'hospital', 'insurer');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female', 'Other');

-- CreateEnum
CREATE TYPE "CorporateStatus" AS ENUM ('Active', 'Inactive', 'Suspended');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('Active', 'Inactive', 'Suspended', 'Terminated');

-- CreateEnum
CREATE TYPE "Relationship" AS ENUM ('Spouse', 'Son', 'Daughter', 'Father', 'Mother');

-- CreateEnum
CREATE TYPE "DependentStatus" AS ENUM ('Pending', 'Approved', 'Rejected', 'Active', 'Inactive');

-- CreateEnum
CREATE TYPE "HospitalType" AS ENUM ('reimbursable', 'non_reimbursable');

-- CreateEnum
CREATE TYPE "InsurerStatus" AS ENUM ('Active', 'Inactive', 'Suspended');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('Pending', 'Approved', 'Rejected', 'Paid', 'OnHold');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('Low', 'Normal', 'High');

-- CreateEnum
CREATE TYPE "ClaimEventStatus" AS ENUM ('Pending', 'Approved', 'Rejected', 'Paid', 'OnHold');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'system', 'document_upload');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('claim_status', 'policy_update', 'dependent_request', 'messaging_alert');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('info', 'warning', 'critical');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100),
    "phone" VARCHAR(20) NOT NULL,
    "user_role" "UserRole" NOT NULL,
    "dob" DATE,
    "gender" "Gender",
    "cnic" VARCHAR(15),
    "address" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporates" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "province" VARCHAR(100) NOT NULL,
    "employee_count" INTEGER NOT NULL,
    "dependent_count" INTEGER NOT NULL DEFAULT 0,
    "insurer_id" UUID NOT NULL,
    "contact_name" VARCHAR(100) NOT NULL,
    "contact_email" VARCHAR(255) NOT NULL,
    "contact_phone" VARCHAR(20) NOT NULL,
    "contract_start_date" DATE NOT NULL,
    "contract_end_date" DATE NOT NULL,
    "total_amount_used" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "CorporateStatus" NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "corporates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "corporate_id" UUID NOT NULL,
    "employee_number" VARCHAR(50) NOT NULL,
    "plan_id" UUID NOT NULL,
    "designation" VARCHAR(100) NOT NULL,
    "department" VARCHAR(100) NOT NULL,
    "coverage_start_date" DATE NOT NULL,
    "coverage_end_date" DATE NOT NULL,
    "coverage_amount" DECIMAL(12,2) NOT NULL,
    "used_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dependents" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "relationship" "Relationship" NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "cnic" VARCHAR(15),
    "phone_number" VARCHAR(20),
    "status" "DependentStatus" NOT NULL DEFAULT 'Pending',
    "request_date" TIMESTAMPTZ(6) NOT NULL,
    "reviewed_date" TIMESTAMPTZ(6),
    "rejection_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dependents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "hospital_name" VARCHAR(255) NOT NULL,
    "license_number" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "emergency_phone" VARCHAR(20) NOT NULL,
    "hospital_type" "HospitalType" NOT NULL DEFAULT 'reimbursable',
    "has_emergency_unit" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_emergency_contacts" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "contact_level" INTEGER NOT NULL,
    "designation" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "contact_number" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hospital_emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_visits" (
    "id" UUID NOT NULL,
    "employee_id" UUID,
    "dependent_id" UUID,
    "hospital_id" UUID NOT NULL,
    "visit_date" TIMESTAMPTZ(6) NOT NULL,
    "discharge_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hospital_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "license_number" VARCHAR(100) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "province" VARCHAR(100) NOT NULL,
    "max_coverage_limit" DECIMAL(12,2) NOT NULL,
    "network_hospital_count" INTEGER NOT NULL DEFAULT 0,
    "corporate_client_count" INTEGER NOT NULL DEFAULT 0,
    "status" "InsurerStatus" NOT NULL DEFAULT 'Active',
    "operating_since" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "plan_name" VARCHAR(255) NOT NULL,
    "plan_code" VARCHAR(50) NOT NULL,
    "insurer_id" UUID NOT NULL,
    "sum_insured" DECIMAL(12,2) NOT NULL,
    "covered_services" JSONB NOT NULL,
    "service_limits" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claims" (
    "id" UUID NOT NULL,
    "claim_number" VARCHAR(50) NOT NULL,
    "hospital_visit_id" UUID NOT NULL,
    "corporate_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "insurer_id" UUID NOT NULL,
    "claim_status" "ClaimStatus" NOT NULL DEFAULT 'Pending',
    "amount_claimed" DECIMAL(12,2) NOT NULL,
    "approved_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "treatment_category" VARCHAR(100),
    "priority" "Priority" NOT NULL DEFAULT 'Normal',
    "notes" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_events" (
    "id" UUID NOT NULL,
    "claim_id" UUID NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "actor_name" VARCHAR(200) NOT NULL,
    "actor_role" VARCHAR(100) NOT NULL,
    "action" VARCHAR(255) NOT NULL,
    "status_from" "ClaimEventStatus",
    "status_to" "ClaimEventStatus" NOT NULL,
    "event_note" VARCHAR(1000),
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_documents" (
    "id" UUID NOT NULL,
    "claim_id" UUID NOT NULL,
    "original_filename" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "claim_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "message_text" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "message_type" "MessageType" NOT NULL DEFAULT 'text',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_message_attachments" (
    "id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'info',
    "related_entity_id" UUID,
    "related_entity_type" VARCHAR(50),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "action_url" VARCHAR(500),
    "category" VARCHAR(100),
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labs" (
    "id" UUID NOT NULL,
    "insurer_id" UUID NOT NULL,
    "lab_name" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "license_number" VARCHAR(100) NOT NULL,
    "contact_phone" VARCHAR(20) NOT NULL,
    "contact_email" VARCHAR(255) NOT NULL,
    "test_categories" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "labs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicines" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "pack_price" DECIMAL(10,2) NOT NULL,
    "manufacturer" VARCHAR(255) NOT NULL,
    "requires_prescription" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" UUID NOT NULL,
    "user_id" UUID,
    "action" "AuditAction" NOT NULL,
    "field_name" VARCHAR(100),
    "old_value" TEXT,
    "new_value" TEXT,
    "change_reason" VARCHAR(500),
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_cnic_key" ON "users"("cnic");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_cnic_idx" ON "users"("cnic");

-- CreateIndex
CREATE INDEX "users_user_role_idx" ON "users"("user_role");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "corporates_user_id_key" ON "corporates"("user_id");

-- CreateIndex
CREATE INDEX "corporates_insurer_id_idx" ON "corporates"("insurer_id");

-- CreateIndex
CREATE INDEX "corporates_status_idx" ON "corporates"("status");

-- CreateIndex
CREATE INDEX "corporates_contract_start_date_idx" ON "corporates"("contract_start_date");

-- CreateIndex
CREATE INDEX "corporates_contract_end_date_idx" ON "corporates"("contract_end_date");

-- CreateIndex
CREATE INDEX "corporates_created_at_idx" ON "corporates"("created_at");

-- CreateIndex
CREATE INDEX "corporates_insurer_id_status_idx" ON "corporates"("insurer_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_number_key" ON "employees"("employee_number");

-- CreateIndex
CREATE INDEX "employees_user_id_idx" ON "employees"("user_id");

-- CreateIndex
CREATE INDEX "employees_corporate_id_idx" ON "employees"("corporate_id");

-- CreateIndex
CREATE INDEX "employees_employee_number_idx" ON "employees"("employee_number");

-- CreateIndex
CREATE INDEX "employees_plan_id_idx" ON "employees"("plan_id");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- CreateIndex
CREATE INDEX "employees_created_at_idx" ON "employees"("created_at");

-- CreateIndex
CREATE INDEX "employees_corporate_id_employee_number_idx" ON "employees"("corporate_id", "employee_number");

-- CreateIndex
CREATE INDEX "employees_corporate_id_status_idx" ON "employees"("corporate_id", "status");

-- CreateIndex
CREATE INDEX "dependents_employee_id_idx" ON "dependents"("employee_id");

-- CreateIndex
CREATE INDEX "dependents_status_idx" ON "dependents"("status");

-- CreateIndex
CREATE INDEX "dependents_created_at_idx" ON "dependents"("created_at");

-- CreateIndex
CREATE INDEX "dependents_employee_id_status_idx" ON "dependents"("employee_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hospitals_user_id_key" ON "hospitals"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "hospitals_license_number_key" ON "hospitals"("license_number");

-- CreateIndex
CREATE INDEX "hospitals_user_id_idx" ON "hospitals"("user_id");

-- CreateIndex
CREATE INDEX "hospitals_license_number_idx" ON "hospitals"("license_number");

-- CreateIndex
CREATE INDEX "hospitals_city_idx" ON "hospitals"("city");

-- CreateIndex
CREATE INDEX "hospitals_hospital_type_idx" ON "hospitals"("hospital_type");

-- CreateIndex
CREATE INDEX "hospitals_is_active_idx" ON "hospitals"("is_active");

-- CreateIndex
CREATE INDEX "hospitals_created_at_idx" ON "hospitals"("created_at");

-- CreateIndex
CREATE INDEX "hospitals_city_is_active_idx" ON "hospitals"("city", "is_active");

-- CreateIndex
CREATE INDEX "hospital_emergency_contacts_hospital_id_idx" ON "hospital_emergency_contacts"("hospital_id");

-- CreateIndex
CREATE INDEX "hospital_emergency_contacts_contact_level_idx" ON "hospital_emergency_contacts"("contact_level");

-- CreateIndex
CREATE INDEX "hospital_emergency_contacts_hospital_id_contact_level_idx" ON "hospital_emergency_contacts"("hospital_id", "contact_level");

-- CreateIndex
CREATE UNIQUE INDEX "hospital_emergency_contacts_hospital_id_contact_level_key" ON "hospital_emergency_contacts"("hospital_id", "contact_level");

-- CreateIndex
CREATE INDEX "hospital_visits_employee_id_idx" ON "hospital_visits"("employee_id");

-- CreateIndex
CREATE INDEX "hospital_visits_dependent_id_idx" ON "hospital_visits"("dependent_id");

-- CreateIndex
CREATE INDEX "hospital_visits_hospital_id_idx" ON "hospital_visits"("hospital_id");

-- CreateIndex
CREATE INDEX "hospital_visits_visit_date_idx" ON "hospital_visits"("visit_date");

-- CreateIndex
CREATE INDEX "hospital_visits_created_at_idx" ON "hospital_visits"("created_at");

-- CreateIndex
CREATE INDEX "hospital_visits_employee_id_visit_date_idx" ON "hospital_visits"("employee_id", "visit_date" DESC);

-- CreateIndex
CREATE INDEX "hospital_visits_dependent_id_visit_date_idx" ON "hospital_visits"("dependent_id", "visit_date" DESC);

-- CreateIndex
CREATE INDEX "hospital_visits_hospital_id_visit_date_idx" ON "hospital_visits"("hospital_id", "visit_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "insurers_user_id_key" ON "insurers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "insurers_license_number_key" ON "insurers"("license_number");

-- CreateIndex
CREATE INDEX "insurers_user_id_idx" ON "insurers"("user_id");

-- CreateIndex
CREATE INDEX "insurers_license_number_idx" ON "insurers"("license_number");

-- CreateIndex
CREATE INDEX "insurers_status_idx" ON "insurers"("status");

-- CreateIndex
CREATE INDEX "insurers_city_idx" ON "insurers"("city");

-- CreateIndex
CREATE INDEX "insurers_is_active_idx" ON "insurers"("is_active");

-- CreateIndex
CREATE INDEX "insurers_created_at_idx" ON "insurers"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "plans_plan_code_key" ON "plans"("plan_code");

-- CreateIndex
CREATE INDEX "plans_plan_code_idx" ON "plans"("plan_code");

-- CreateIndex
CREATE INDEX "plans_insurer_id_idx" ON "plans"("insurer_id");

-- CreateIndex
CREATE INDEX "plans_is_active_idx" ON "plans"("is_active");

-- CreateIndex
CREATE INDEX "plans_created_at_idx" ON "plans"("created_at");

-- CreateIndex
CREATE INDEX "plans_insurer_id_is_active_idx" ON "plans"("insurer_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "claims_claim_number_key" ON "claims"("claim_number");

-- CreateIndex
CREATE INDEX "claims_claim_number_idx" ON "claims"("claim_number");

-- CreateIndex
CREATE INDEX "claims_hospital_visit_id_idx" ON "claims"("hospital_visit_id");

-- CreateIndex
CREATE INDEX "claims_corporate_id_idx" ON "claims"("corporate_id");

-- CreateIndex
CREATE INDEX "claims_plan_id_idx" ON "claims"("plan_id");

-- CreateIndex
CREATE INDEX "claims_insurer_id_idx" ON "claims"("insurer_id");

-- CreateIndex
CREATE INDEX "claims_claim_status_idx" ON "claims"("claim_status");

-- CreateIndex
CREATE INDEX "claims_priority_idx" ON "claims"("priority");

-- CreateIndex
CREATE INDEX "claims_created_at_idx" ON "claims"("created_at");

-- CreateIndex
CREATE INDEX "claims_hospital_visit_id_created_at_idx" ON "claims"("hospital_visit_id", "created_at");

-- CreateIndex
CREATE INDEX "claims_corporate_id_claim_status_idx" ON "claims"("corporate_id", "claim_status");

-- CreateIndex
CREATE INDEX "claims_claim_status_created_at_idx" ON "claims"("claim_status", "created_at");

-- CreateIndex
CREATE INDEX "claim_events_claim_id_idx" ON "claim_events"("claim_id");

-- CreateIndex
CREATE INDEX "claim_events_actor_user_id_idx" ON "claim_events"("actor_user_id");

-- CreateIndex
CREATE INDEX "claim_events_timestamp_idx" ON "claim_events"("timestamp");

-- CreateIndex
CREATE INDEX "claim_events_action_idx" ON "claim_events"("action");

-- CreateIndex
CREATE INDEX "claim_events_claim_id_timestamp_idx" ON "claim_events"("claim_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "claim_events_actor_role_timestamp_idx" ON "claim_events"("actor_role", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "claim_documents_claim_id_idx" ON "claim_documents"("claim_id");

-- CreateIndex
CREATE INDEX "claim_documents_created_at_idx" ON "claim_documents"("created_at");

-- CreateIndex
CREATE INDEX "chat_messages_claim_id_idx" ON "chat_messages"("claim_id");

-- CreateIndex
CREATE INDEX "chat_messages_sender_id_idx" ON "chat_messages"("sender_id");

-- CreateIndex
CREATE INDEX "chat_messages_receiver_id_idx" ON "chat_messages"("receiver_id");

-- CreateIndex
CREATE INDEX "chat_messages_timestamp_idx" ON "chat_messages"("timestamp");

-- CreateIndex
CREATE INDEX "chat_messages_is_read_idx" ON "chat_messages"("is_read");

-- CreateIndex
CREATE INDEX "chat_messages_claim_id_timestamp_idx" ON "chat_messages"("claim_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "chat_messages_sender_id_timestamp_idx" ON "chat_messages"("sender_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "chat_message_attachments_message_id_idx" ON "chat_message_attachments"("message_id");

-- CreateIndex
CREATE INDEX "chat_message_attachments_created_at_idx" ON "chat_message_attachments"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_notification_type_idx" ON "notifications"("notification_type");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_timestamp_idx" ON "notifications"("timestamp");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_timestamp_idx" ON "notifications"("user_id", "is_read", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "notifications_user_id_notification_type_created_at_idx" ON "notifications"("user_id", "notification_type", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "labs_license_number_key" ON "labs"("license_number");

-- CreateIndex
CREATE INDEX "labs_insurer_id_idx" ON "labs"("insurer_id");

-- CreateIndex
CREATE INDEX "labs_license_number_idx" ON "labs"("license_number");

-- CreateIndex
CREATE INDEX "labs_city_idx" ON "labs"("city");

-- CreateIndex
CREATE INDEX "labs_is_active_idx" ON "labs"("is_active");

-- CreateIndex
CREATE INDEX "labs_city_is_active_idx" ON "labs"("city", "is_active");

-- CreateIndex
CREATE INDEX "labs_insurer_id_is_active_idx" ON "labs"("insurer_id", "is_active");

-- CreateIndex
CREATE INDEX "medicines_category_idx" ON "medicines"("category");

-- CreateIndex
CREATE INDEX "medicines_name_idx" ON "medicines"("name");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_idx" ON "audit_logs"("entity_type");

-- CreateIndex
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs"("entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_timestamp_idx" ON "audit_logs"("entity_type", "entity_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_action_timestamp_idx" ON "audit_logs"("action", "timestamp" DESC);

-- AddForeignKey
ALTER TABLE "corporates" ADD CONSTRAINT "corporates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corporates" ADD CONSTRAINT "corporates_insurer_id_fkey" FOREIGN KEY ("insurer_id") REFERENCES "insurers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_corporate_id_fkey" FOREIGN KEY ("corporate_id") REFERENCES "corporates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependents" ADD CONSTRAINT "dependents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitals" ADD CONSTRAINT "hospitals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_emergency_contacts" ADD CONSTRAINT "hospital_emergency_contacts_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_visits" ADD CONSTRAINT "hospital_visits_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_visits" ADD CONSTRAINT "hospital_visits_dependent_id_fkey" FOREIGN KEY ("dependent_id") REFERENCES "dependents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_visits" ADD CONSTRAINT "hospital_visits_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurers" ADD CONSTRAINT "insurers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_insurer_id_fkey" FOREIGN KEY ("insurer_id") REFERENCES "insurers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_hospital_visit_id_fkey" FOREIGN KEY ("hospital_visit_id") REFERENCES "hospital_visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_corporate_id_fkey" FOREIGN KEY ("corporate_id") REFERENCES "corporates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_insurer_id_fkey" FOREIGN KEY ("insurer_id") REFERENCES "insurers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_events" ADD CONSTRAINT "claim_events_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_events" ADD CONSTRAINT "claim_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_documents" ADD CONSTRAINT "claim_documents_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message_attachments" ADD CONSTRAINT "chat_message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labs" ADD CONSTRAINT "labs_insurer_id_fkey" FOREIGN KEY ("insurer_id") REFERENCES "insurers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
