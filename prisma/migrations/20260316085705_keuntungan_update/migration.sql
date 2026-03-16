/*
  Warnings:

  - A unique constraint covering the columns `[idToko,tanggal]` on the table `Keuntungan` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tanggal` to the `Keuntungan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Keuntungan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Keuntungan" ADD COLUMN     "tanggal" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "keuntunganTransaksi" SET DEFAULT 0,
ALTER COLUMN "keuntunganVoucherHarian" SET DEFAULT 0,
ALTER COLUMN "keuntunganAcc" SET DEFAULT 0,
ALTER COLUMN "keuntunganSparepart" SET DEFAULT 0,
ALTER COLUMN "keuntunganService" SET DEFAULT 0,
ALTER COLUMN "keuntunganGrosirVoucher" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Keuntungan_idToko_tanggal_key" ON "Keuntungan"("idToko", "tanggal");
