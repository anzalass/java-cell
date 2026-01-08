-- AlterTable
ALTER TABLE "ItemsTransaksiAksesoris" ADD COLUMN     "tanggal" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ItemsTransaksiSparepart" ADD COLUMN     "tanggal" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ItemsTransaksiVoucherDownline" ADD COLUMN     "tanggal" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TransaksiAksesoris" ADD COLUMN     "namaPembeli" TEXT;

-- AlterTable
ALTER TABLE "TransaksiSparepat" ADD COLUMN     "namaPembeli" TEXT;
