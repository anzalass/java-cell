/*
  Warnings:

  - You are about to drop the column `penempatan` on the `KejadianTakTerduga` table. All the data in the column will be lost.
  - You are about to drop the column `penempatan` on the `ServiceHP` table. All the data in the column will be lost.
  - You are about to drop the column `penempatan` on the `TransaksiAksesoris` table. All the data in the column will be lost.
  - You are about to drop the column `penempatan` on the `TransaksiVoucherDownline` table. All the data in the column will be lost.
  - You are about to drop the column `penempatan` on the `UangModal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "KejadianTakTerduga" DROP COLUMN "penempatan";

-- AlterTable
ALTER TABLE "ServiceHP" DROP COLUMN "penempatan";

-- AlterTable
ALTER TABLE "TransaksiAksesoris" DROP COLUMN "penempatan";

-- AlterTable
ALTER TABLE "TransaksiVoucherDownline" DROP COLUMN "penempatan";

-- AlterTable
ALTER TABLE "UangModal" DROP COLUMN "penempatan";
