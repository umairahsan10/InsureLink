-- CreateEnum
CREATE TYPE "HospitalVisitStatus" AS ENUM ('Pending', 'Claimed');

-- AlterTable
ALTER TABLE "hospital_visits" ADD COLUMN     "status" "HospitalVisitStatus" NOT NULL DEFAULT 'Pending';

-- CreateIndex
CREATE INDEX "hospital_visits_status_idx" ON "hospital_visits"("status");

-- CreateIndex
CREATE INDEX "hospital_visits_hospital_id_status_idx" ON "hospital_visits"("hospital_id", "status");
