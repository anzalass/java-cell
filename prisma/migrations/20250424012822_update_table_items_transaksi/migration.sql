/*
  Warnings:

  - Added the required column `quantity` to the `ItemsTransaksiVoucherDownline` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ItemsTransaksiVoucherDownline" ADD COLUMN     "quantity" INTEGER NOT NULL;
