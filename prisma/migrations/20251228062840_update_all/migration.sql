/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Voucher` table. All the data in the column will be lost.
  - Added the required column `idUser` to the `JualanHarian` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idUser` to the `KejadianTakTerduga` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idUser` to the `ServiceHP` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idUser` to the `TransaksiAksesoris` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idUser` to the `TransaksiSparepat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idUser` to the `TransaksiVoucherDownline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idUser` to the `UangModal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Aksesoris" ALTER COLUMN "createdAt" DROP NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updateAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Downline" ADD COLUMN     "updateAt" TIMESTAMP(3),
ALTER COLUMN "createdAt" DROP NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ItemsTransaksiAksesoris" ADD COLUMN     "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updateAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ItemsTransaksiSparepart" ADD COLUMN     "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updateAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ItemsTransaksiVoucherDownline" ADD COLUMN     "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updateAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "JualanHarian" ADD COLUMN     "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "idMember" TEXT,
ADD COLUMN     "idUser" TEXT NOT NULL,
ADD COLUMN     "updateAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "KejadianTakTerduga" ADD COLUMN     "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "idUser" TEXT NOT NULL,
ADD COLUMN     "updateAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Log" ADD COLUMN     "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updateAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ServiceHP" ADD COLUMN     "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "idMember" TEXT,
ADD COLUMN     "idUser" TEXT NOT NULL,
ADD COLUMN     "updateAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SparePart" ALTER COLUMN "createdAt" DROP NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updateAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SparepartServiceHP" ADD COLUMN     "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updateAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TransaksiAksesoris" ADD COLUMN     "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "idMember" TEXT,
ADD COLUMN     "idUser" TEXT NOT NULL,
ADD COLUMN     "updateAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TransaksiSparepat" ADD COLUMN     "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "idMember" TEXT,
ADD COLUMN     "idUser" TEXT NOT NULL,
ADD COLUMN     "updateAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TransaksiVoucherDownline" ADD COLUMN     "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "idUser" TEXT NOT NULL,
ADD COLUMN     "updateAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UangModal" ADD COLUMN     "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "idUser" TEXT NOT NULL,
ADD COLUMN     "updateAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updateAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Voucher" DROP COLUMN "updatedAt",
ADD COLUMN     "updateAt" TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "noTelp" TEXT,
    "totalTransaksi" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3),

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TransaksiSparepat" ADD CONSTRAINT "TransaksiSparepat_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaksiSparepat" ADD CONSTRAINT "TransaksiSparepat_idMember_fkey" FOREIGN KEY ("idMember") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaksiVoucherDownline" ADD CONSTRAINT "TransaksiVoucherDownline_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaksiAksesoris" ADD CONSTRAINT "TransaksiAksesoris_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaksiAksesoris" ADD CONSTRAINT "TransaksiAksesoris_idMember_fkey" FOREIGN KEY ("idMember") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UangModal" ADD CONSTRAINT "UangModal_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceHP" ADD CONSTRAINT "ServiceHP_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceHP" ADD CONSTRAINT "ServiceHP_idMember_fkey" FOREIGN KEY ("idMember") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JualanHarian" ADD CONSTRAINT "JualanHarian_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JualanHarian" ADD CONSTRAINT "JualanHarian_idMember_fkey" FOREIGN KEY ("idMember") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KejadianTakTerduga" ADD CONSTRAINT "KejadianTakTerduga_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
