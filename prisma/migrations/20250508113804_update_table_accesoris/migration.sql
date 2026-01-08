/*
  Warnings:

  - You are about to drop the column `namaSparePart` on the `ServiceHP` table. All the data in the column will be lost.
  - Added the required column `barcode` to the `Aksesoris` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Aksesoris" ADD COLUMN     "barcode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ServiceHP" DROP COLUMN "namaSparePart";

-- CreateTable
CREATE TABLE "TransaksiSparepat" (
    "id" TEXT NOT NULL,
    "totalHarga" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "TransaksiSparepat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemsTransaksiSparepart" (
    "id" TEXT NOT NULL,
    "idTransaksi" TEXT NOT NULL,
    "idSparepart" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ItemsTransaksiSparepart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SparepartServiceHP" (
    "id" TEXT NOT NULL,
    "idServiceHP" TEXT NOT NULL,
    "idSparepart" TEXT NOT NULL,

    CONSTRAINT "SparepartServiceHP_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ItemsTransaksiSparepart" ADD CONSTRAINT "ItemsTransaksiSparepart_idTransaksi_fkey" FOREIGN KEY ("idTransaksi") REFERENCES "TransaksiSparepat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemsTransaksiSparepart" ADD CONSTRAINT "ItemsTransaksiSparepart_idSparepart_fkey" FOREIGN KEY ("idSparepart") REFERENCES "SparePart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SparepartServiceHP" ADD CONSTRAINT "SparepartServiceHP_idServiceHP_fkey" FOREIGN KEY ("idServiceHP") REFERENCES "ServiceHP"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SparepartServiceHP" ADD CONSTRAINT "SparepartServiceHP_idSparepart_fkey" FOREIGN KEY ("idSparepart") REFERENCES "SparePart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
