-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);
