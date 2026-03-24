-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('pending', 'processed', 'failed');

-- CreateTable
CREATE TABLE "employee_uploads" (
    "id" UUID NOT NULL,
    "corporate_id" UUID NOT NULL,
    "uploaded_by_user_id" UUID NOT NULL,
    "filePath" VARCHAR(500) NOT NULL,
    "original_file_name" VARCHAR(255) NOT NULL,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "UploadStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "employee_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invalid_employee_uploads" (
    "id" UUID NOT NULL,
    "employee_upload_id" UUID NOT NULL,
    "corporate_id" UUID NOT NULL,
    "error_messages" TEXT[],
    "email" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100),
    "phone" VARCHAR(20) NOT NULL,
    "user_role" "UserRole" NOT NULL,
    "dob" DATE,
    "gender" "Gender",
    "cnic" VARCHAR(15),
    "address" VARCHAR(500),
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

    CONSTRAINT "invalid_employee_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_uploads_corporate_id_idx" ON "employee_uploads"("corporate_id");

-- CreateIndex
CREATE INDEX "employee_uploads_uploaded_by_user_id_idx" ON "employee_uploads"("uploaded_by_user_id");

-- CreateIndex
CREATE INDEX "employee_uploads_status_idx" ON "employee_uploads"("status");

-- CreateIndex
CREATE INDEX "employee_uploads_uploaded_at_idx" ON "employee_uploads"("uploaded_at");

-- CreateIndex
CREATE INDEX "invalid_employee_uploads_employee_upload_id_idx" ON "invalid_employee_uploads"("employee_upload_id");

-- CreateIndex
CREATE INDEX "invalid_employee_uploads_corporate_id_idx" ON "invalid_employee_uploads"("corporate_id");

-- CreateIndex
CREATE INDEX "invalid_employee_uploads_created_at_idx" ON "invalid_employee_uploads"("created_at");

-- AddForeignKey
ALTER TABLE "employee_uploads" ADD CONSTRAINT "employee_uploads_corporate_id_fkey" FOREIGN KEY ("corporate_id") REFERENCES "corporates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_uploads" ADD CONSTRAINT "employee_uploads_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invalid_employee_uploads" ADD CONSTRAINT "invalid_employee_uploads_employee_upload_id_fkey" FOREIGN KEY ("employee_upload_id") REFERENCES "employee_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invalid_employee_uploads" ADD CONSTRAINT "invalid_employee_uploads_corporate_id_fkey" FOREIGN KEY ("corporate_id") REFERENCES "corporates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
