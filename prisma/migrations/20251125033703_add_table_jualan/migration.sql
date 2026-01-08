-- CreateTable
CREATE TABLE "JualanHarian" (
    "id" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "nominal" TEXT NOT NULL,
    "tanggal" TEXT NOT NULL,

    CONSTRAINT "JualanHarian_pkey" PRIMARY KEY ("id")
);
