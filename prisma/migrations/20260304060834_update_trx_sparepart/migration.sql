/*
  Warnings:

  - You are about to drop the column `totalTransaksi` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `penempatan` on the `TransaksiSparepat` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Member" DROP COLUMN "totalTransaksi";

-- AlterTable
ALTER TABLE "TransaksiSparepat" DROP COLUMN "penempatan";
