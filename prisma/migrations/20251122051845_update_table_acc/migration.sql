/*
  Warnings:

  - You are about to drop the column `harga` on the `Aksesoris` table. All the data in the column will be lost.
  - Added the required column `createdAt` to the `Aksesoris` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hargaJual` to the `Aksesoris` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hargaModal` to the `Aksesoris` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updateAt` to the `Aksesoris` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Aksesoris" DROP COLUMN "harga",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "hargaJual" INTEGER NOT NULL,
ADD COLUMN     "hargaModal" INTEGER NOT NULL,
ADD COLUMN     "updateAt" TIMESTAMP(3) NOT NULL;
