/*
  Warnings:

  - Added the required column `noHP` to the `ServiceHP` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ServiceHP" ADD COLUMN     "noHP" INTEGER NOT NULL;
