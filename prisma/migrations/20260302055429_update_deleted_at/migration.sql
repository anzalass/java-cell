-- AlterTable
ALTER TABLE "ServiceHP" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TransaksiAksesoris" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TransaksiSparepat" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TransaksiVoucherDownline" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TransaksiVoucherHarian" ADD COLUMN     "deletedAt" TIMESTAMP(3);
