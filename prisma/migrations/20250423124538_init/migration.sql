-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Downline" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kodeDownline" TEXT NOT NULL,

    CONSTRAINT "Downline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kuota" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "stok" INTEGER NOT NULL,
    "harga" INTEGER NOT NULL,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aksesoris" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "stok" INTEGER NOT NULL,
    "harga" INTEGER NOT NULL,

    CONSTRAINT "Aksesoris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransaksiVoucherDownline" (
    "id" TEXT NOT NULL,
    "kodeDownline" TEXT NOT NULL,
    "totalHarga" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "TransaksiVoucherDownline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemsTransaksiVoucherDownline" (
    "id" TEXT NOT NULL,
    "idTransaksi" TEXT NOT NULL,
    "idVoucher" TEXT NOT NULL,

    CONSTRAINT "ItemsTransaksiVoucherDownline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransaksiAksesoris" (
    "id" TEXT NOT NULL,
    "totalHarga" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "TransaksiAksesoris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemsTransaksiAksesoris" (
    "id" TEXT NOT NULL,
    "idTransaksi" TEXT NOT NULL,
    "idAksesoris" TEXT NOT NULL,

    CONSTRAINT "ItemsTransaksiAksesoris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UangModal" (
    "id" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "jumlah" INTEGER NOT NULL,

    CONSTRAINT "UangModal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceHP" (
    "id" TEXT NOT NULL,
    "brandHP" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "namaSparePart" TEXT,
    "hargaSparePart" INTEGER,
    "biayaJasa" INTEGER NOT NULL,

    CONSTRAINT "ServiceHP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Downline_kodeDownline_key" ON "Downline"("kodeDownline");

-- AddForeignKey
ALTER TABLE "TransaksiVoucherDownline" ADD CONSTRAINT "TransaksiVoucherDownline_kodeDownline_fkey" FOREIGN KEY ("kodeDownline") REFERENCES "Downline"("kodeDownline") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemsTransaksiVoucherDownline" ADD CONSTRAINT "ItemsTransaksiVoucherDownline_idVoucher_fkey" FOREIGN KEY ("idVoucher") REFERENCES "Voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemsTransaksiVoucherDownline" ADD CONSTRAINT "ItemsTransaksiVoucherDownline_idTransaksi_fkey" FOREIGN KEY ("idTransaksi") REFERENCES "TransaksiVoucherDownline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemsTransaksiAksesoris" ADD CONSTRAINT "ItemsTransaksiAksesoris_idTransaksi_fkey" FOREIGN KEY ("idTransaksi") REFERENCES "TransaksiAksesoris"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemsTransaksiAksesoris" ADD CONSTRAINT "ItemsTransaksiAksesoris_idAksesoris_fkey" FOREIGN KEY ("idAksesoris") REFERENCES "Aksesoris"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
