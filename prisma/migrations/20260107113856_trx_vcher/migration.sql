-- DropForeignKey
ALTER TABLE "TransaksiVoucherDownline" DROP CONSTRAINT "TransaksiVoucherDownline_idUser_fkey";

-- AlterTable
ALTER TABLE "JualanHarian" ALTER COLUMN "nominal" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TransaksiVoucherDownline" ALTER COLUMN "idUser" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "TransaksiVoucherDownline" ADD CONSTRAINT "TransaksiVoucherDownline_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
