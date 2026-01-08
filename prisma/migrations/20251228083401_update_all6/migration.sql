/*
  Warnings:

  - You are about to drop the column `updateAt` on the `Aksesoris` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Downline` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `ItemsTransaksiAksesoris` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `ItemsTransaksiSparepart` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `ItemsTransaksiVoucherDownline` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `JualanHarian` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `KejadianTakTerduga` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `ServiceHP` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `SparePart` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `SparepartServiceHP` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `TransaksiAksesoris` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `TransaksiSparepat` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `TransaksiVoucherDownline` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `UangModal` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Voucher` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Aksesoris" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Downline" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ItemsTransaksiAksesoris" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ItemsTransaksiSparepart" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ItemsTransaksiVoucherDownline" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "JualanHarian" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "KejadianTakTerduga" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Log" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ServiceHP" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SparePart" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SparepartServiceHP" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TransaksiAksesoris" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TransaksiSparepat" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TransaksiVoucherDownline" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UangModal" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Voucher" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3);
