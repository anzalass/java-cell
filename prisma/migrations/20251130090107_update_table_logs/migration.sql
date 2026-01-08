/*
  Warnings:

  - Added the required column `kategori` to the `Log` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Log" ADD COLUMN     "kategori" TEXT NOT NULL;
