/*
  Warnings:

  - Added the required column `quantity` to the `SparepartServiceHP` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SparepartServiceHP" ADD COLUMN     "quantity" INTEGER NOT NULL;
