-- AlterTable
ALTER TABLE "Voucher" ADD COLUMN     "hargaEceran" INTEGER;

-- CreateTable
CREATE TABLE "TransaksiVoucherHarian" (
    "id" TEXT NOT NULL,
    "idVoucher" TEXT NOT NULL,
    "keuntungan" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "TransaksiVoucherHarian_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TransaksiVoucherHarian" ADD CONSTRAINT "TransaksiVoucherHarian_idVoucher_fkey" FOREIGN KEY ("idVoucher") REFERENCES "Voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
