-- CreateTable
CREATE TABLE "KejadianTakTerduga" (
    "id" TEXT NOT NULL,
    "nominal" INTEGER NOT NULL,
    "no_transaksi" INTEGER NOT NULL,
    "keterangan" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KejadianTakTerduga_pkey" PRIMARY KEY ("id")
);
