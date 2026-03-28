/*
  Warnings:

  - Added the required column `password` to the `invalid_employee_uploads` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "invalid_employee_uploads" ADD COLUMN     "password" VARCHAR(255) NOT NULL;
