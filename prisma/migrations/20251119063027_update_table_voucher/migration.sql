/*
  Warnings:

  - You are about to drop the column `harga` on the `Voucher` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Voucher" DROP COLUMN "harga",
ADD COLUMN     "hargaJual" INTEGER,
ADD COLUMN     "hargaPokok" INTEGER;
