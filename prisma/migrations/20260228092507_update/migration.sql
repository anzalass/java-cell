-- AlterTable
ALTER TABLE "Downline" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "TransaksiVoucherHarian" ADD COLUMN     "idMember" TEXT;

-- AddForeignKey
ALTER TABLE "TransaksiVoucherHarian" ADD CONSTRAINT "TransaksiVoucherHarian_idMember_fkey" FOREIGN KEY ("idMember") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
