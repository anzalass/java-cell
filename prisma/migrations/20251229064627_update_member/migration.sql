/*
  Warnings:

  - A unique constraint covering the columns `[noTelp]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - Made the column `noTelp` on table `Member` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Member" ALTER COLUMN "noTelp" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Member_noTelp_key" ON "Member"("noTelp");
