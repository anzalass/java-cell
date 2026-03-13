-- CreateTable
CREATE TABLE "Keuntungan" (
    "id" TEXT NOT NULL,
    "idToko" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keuntunganTransaksi" BIGINT NOT NULL,
    "keuntunganVoucherHarian" BIGINT NOT NULL,
    "keuntunganAcc" BIGINT NOT NULL,
    "keuntunganSparepart" BIGINT NOT NULL,
    "keuntunganService" BIGINT NOT NULL,
    "keuntunganGrosirVoucher" BIGINT NOT NULL,

    CONSTRAINT "Keuntungan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Keuntungan" ADD CONSTRAINT "Keuntungan_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
