/*
  Warnings:

  - You are about to alter the column `cnic` on the `invalid_employee_uploads` table. The data in that column could be lost. The data in that column will be cast from `VarChar(25)` to `VarChar(15)`.
  - You are about to alter the column `cnic` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(25)` to `VarChar(15)`.

*/
-- AlterTable
ALTER TABLE "invalid_employee_uploads" ALTER COLUMN "cnic" SET DATA TYPE VARCHAR(15);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "cnic" SET DATA TYPE VARCHAR(15);
