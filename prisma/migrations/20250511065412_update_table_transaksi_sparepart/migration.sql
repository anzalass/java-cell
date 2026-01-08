/*
  Warnings:

  - Added the required column `keuntungan` to the `TransaksiSparepat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TransaksiSparepat" ADD COLUMN     "keuntungan" INTEGER NOT NULL;
