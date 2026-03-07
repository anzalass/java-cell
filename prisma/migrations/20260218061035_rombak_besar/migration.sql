/*
  Warnings:

  - You are about to drop the column `idUser` on the `JualanHarian` table. All the data in the column will be lost.
  - You are about to drop the column `idUser` on the `KejadianTakTerduga` table. All the data in the column will be lost.
  - You are about to drop the column `idUser` on the `ServiceHP` table. All the data in the column will be lost.
  - You are about to drop the column `idUser` on the `TransaksiAksesoris` table. All the data in the column will be lost.
  - You are about to drop the column `idUser` on the `TransaksiSparepat` table. All the data in the column will be lost.
  - You are about to drop the column `idUser` on the `TransaksiVoucherDownline` table. All the data in the column will be lost.
  - You are about to drop the column `idUser` on the `UangModal` table. All the data in the column will be lost.
  - Added the required column `idToko` to the `Aksesoris` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idToko` to the `Downline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idToko` to the `ItemsTransaksiAksesoris` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idToko` to the `ItemsTransaksiSparepart` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idToko` to the `ItemsTransaksiVoucherDownline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idToko` to the `JualanHarian` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idToko` to the `KejadianTakTerduga` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idToko` to the `Log` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idToko` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idToko` to the `ServiceHP` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idToko` to the `SparePart` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idToko` to the `SparepartServiceHP` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idToko` to the `TransaksiAksesoris` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idToko` to the `TransaksiSparepat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idToko` to the `TransaksiVoucherDownline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idToko` to the `TransaksiVoucherHarian` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idToko` to the `UangModal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idToko` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idToko` to the `Voucher` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "JualanHarian" DROP CONSTRAINT "JualanHarian_idUser_fkey";

-- DropForeignKey
ALTER TABLE "KejadianTakTerduga" DROP CONSTRAINT "KejadianTakTerduga_idUser_fkey";

-- DropForeignKey
ALTER TABLE "ServiceHP" DROP CONSTRAINT "ServiceHP_idUser_fkey";

-- DropForeignKey
ALTER TABLE "TransaksiAksesoris" DROP CONSTRAINT "TransaksiAksesoris_idUser_fkey";

-- DropForeignKey
ALTER TABLE "TransaksiSparepat" DROP CONSTRAINT "TransaksiSparepat_idUser_fkey";

-- DropForeignKey
ALTER TABLE "TransaksiVoucherDownline" DROP CONSTRAINT "TransaksiVoucherDownline_idUser_fkey";

-- DropForeignKey
ALTER TABLE "TransaksiVoucherDownline" DROP CONSTRAINT "TransaksiVoucherDownline_kodeDownline_fkey";

-- DropForeignKey
ALTER TABLE "UangModal" DROP CONSTRAINT "UangModal_idUser_fkey";

-- AlterTable
ALTER TABLE "Aksesoris" ADD COLUMN     "idToko" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Downline" ADD COLUMN     "idToko" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ItemsTransaksiAksesoris" ADD COLUMN     "idToko" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ItemsTransaksiSparepart" ADD COLUMN     "idToko" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ItemsTransaksiVoucherDownline" ADD COLUMN     "idToko" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "JualanHarian" DROP COLUMN "idUser",
ADD COLUMN     "idToko" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "KejadianTakTerduga" DROP COLUMN "idUser",
ADD COLUMN     "idToko" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Log" ADD COLUMN     "idToko" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "idToko" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ServiceHP" DROP COLUMN "idUser",
ADD COLUMN     "idToko" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SparePart" ADD COLUMN     "idToko" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "SparepartServiceHP" ADD COLUMN     "idToko" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TransaksiAksesoris" DROP COLUMN "idUser",
ADD COLUMN     "idToko" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TransaksiSparepat" DROP COLUMN "idUser",
ADD COLUMN     "idToko" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TransaksiVoucherDownline" DROP COLUMN "idUser",
ADD COLUMN     "idToko" TEXT NOT NULL,
ALTER COLUMN "kodeDownline" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TransaksiVoucherHarian" ADD COLUMN     "idToko" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UangModal" DROP COLUMN "idUser",
ADD COLUMN     "idToko" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "idToko" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Voucher" ADD COLUMN     "idToko" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Toko" (
    "id" TEXT NOT NULL,
    "namaToko" TEXT NOT NULL,
    "logoToko" TEXT,
    "logoTokoId" TEXT,
    "alamat" TEXT NOT NULL,
    "noTelp" TEXT NOT NULL,
    "SubscribeTime" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Toko_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Downline" ADD CONSTRAINT "Downline_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aksesoris" ADD CONSTRAINT "Aksesoris_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SparePart" ADD CONSTRAINT "SparePart_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaksiSparepat" ADD CONSTRAINT "TransaksiSparepat_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemsTransaksiSparepart" ADD CONSTRAINT "ItemsTransaksiSparepart_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaksiVoucherHarian" ADD CONSTRAINT "TransaksiVoucherHarian_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaksiVoucherDownline" ADD CONSTRAINT "TransaksiVoucherDownline_kodeDownline_fkey" FOREIGN KEY ("kodeDownline") REFERENCES "Downline"("kodeDownline") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaksiVoucherDownline" ADD CONSTRAINT "TransaksiVoucherDownline_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemsTransaksiVoucherDownline" ADD CONSTRAINT "ItemsTransaksiVoucherDownline_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaksiAksesoris" ADD CONSTRAINT "TransaksiAksesoris_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemsTransaksiAksesoris" ADD CONSTRAINT "ItemsTransaksiAksesoris_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UangModal" ADD CONSTRAINT "UangModal_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceHP" ADD CONSTRAINT "ServiceHP_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SparepartServiceHP" ADD CONSTRAINT "SparepartServiceHP_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JualanHarian" ADD CONSTRAINT "JualanHarian_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KejadianTakTerduga" ADD CONSTRAINT "KejadianTakTerduga_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
