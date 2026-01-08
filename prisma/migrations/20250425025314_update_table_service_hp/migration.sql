/*
  Warnings:

  - Added the required column `keuntungan` to the `ServiceHP` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ServiceHP" ADD COLUMN     "keuntungan" INTEGER NOT NULL;
