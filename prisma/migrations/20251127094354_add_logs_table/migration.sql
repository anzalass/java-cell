/*
  Warnings:

  - You are about to drop the column `kategori` on the `Log` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Log" DROP COLUMN "kategori",
ADD COLUMN     "nominal" INTEGER;
