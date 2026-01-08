/*
  Warnings:

  - Added the required column `penempatan` to the `Aksesoris` table without a default value. This is not possible if the table is not empty.
  - Added the required column `penempatan` to the `JualanHarian` table without a default value. This is not possible if the table is not empty.
  - Added the required column `penempatan` to the `KejadianTakTerduga` table without a default value. This is not possible if the table is not empty.
  - Added the required column `penempatan` to the `ServiceHP` table without a default value. This is not possible if the table is not empty.
  - Added the required column `penempatan` to the `SparePart` table without a default value. This is not possible if the table is not empty.
  - Added the required column `penempatan` to the `TransaksiAksesoris` table without a default value. This is not possible if the table is not empty.
  - Added the required column `penempatan` to the `TransaksiSparepat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `penempatan` to the `TransaksiVoucherDownline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `penempatan` to the `UangModal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `penempatan` to the `Voucher` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Aksesoris" ADD COLUMN     "penempatan" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "JualanHarian" ADD COLUMN     "penempatan" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "KejadianTakTerduga" ADD COLUMN     "penempatan" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ServiceHP" ADD COLUMN     "penempatan" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SparePart" ADD COLUMN     "penempatan" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TransaksiAksesoris" ADD COLUMN     "penempatan" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TransaksiSparepat" ADD COLUMN     "penempatan" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TransaksiVoucherDownline" ADD COLUMN     "penempatan" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UangModal" ADD COLUMN     "penempatan" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Voucher" ADD COLUMN     "penempatan" TEXT NOT NULL;
