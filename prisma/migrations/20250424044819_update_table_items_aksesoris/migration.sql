/*
  Warnings:

  - Added the required column `quantity` to the `ItemsTransaksiAksesoris` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ItemsTransaksiVoucherDownline" DROP CONSTRAINT "ItemsTransaksiVoucherDownline_idVoucher_fkey";

-- AlterTable
ALTER TABLE "ItemsTransaksiAksesoris" ADD COLUMN     "quantity" INTEGER NOT NULL;
