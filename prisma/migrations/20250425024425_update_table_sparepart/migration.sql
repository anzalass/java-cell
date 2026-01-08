/*
  Warnings:

  - You are about to drop the column `harga` on the `SparePart` table. All the data in the column will be lost.
  - Added the required column `hargaJual` to the `SparePart` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hargaModal` to the `SparePart` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SparePart" DROP COLUMN "harga",
ADD COLUMN     "hargaJual" INTEGER NOT NULL,
ADD COLUMN     "hargaModal" INTEGER NOT NULL;
