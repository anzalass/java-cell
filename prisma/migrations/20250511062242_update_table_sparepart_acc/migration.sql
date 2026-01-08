/*
  Warnings:

  - A unique constraint covering the columns `[barcode]` on the table `Aksesoris` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[barcode]` on the table `SparePart` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `barcode` to the `SparePart` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SparePart" ADD COLUMN     "barcode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Aksesoris_barcode_key" ON "Aksesoris"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "SparePart_barcode_key" ON "SparePart"("barcode");
