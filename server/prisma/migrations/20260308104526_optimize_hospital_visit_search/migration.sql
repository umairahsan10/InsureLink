-- CreateIndex
CREATE INDEX "hospital_visits_hospital_id_employee_id_status_idx" ON "hospital_visits"("hospital_id", "employee_id", "status");
