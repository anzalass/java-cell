/*
  Warnings:

  - You are about to drop the column `createrdAt` on the `Voucher` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Voucher" DROP COLUMN "createrdAt",
ADD COLUMN     "createdAt" TIMESTAMP(3);
