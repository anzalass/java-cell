/*
  Warnings:

  - Added the required column `createdAt` to the `SparePart` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updateAt` to the `SparePart` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SparePart" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updateAt" TIMESTAMP(3) NOT NULL;
