-- AlterTable
ALTER TABLE "ItemsTransaksiAksesoris" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ItemsTransaksiSparepart" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ItemsTransaksiVoucherDownline" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SparepartServiceHP" ADD COLUMN     "deletedAt" TIMESTAMP(3);
