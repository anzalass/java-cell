-- CreateTable
CREATE TABLE "DataMember" (
    "id" TEXT NOT NULL,
    "idToko" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "nomor" TEXT NOT NULL,
    "idMember" TEXT NOT NULL,

    CONSTRAINT "DataMember_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DataMember" ADD CONSTRAINT "DataMember_idMember_fkey" FOREIGN KEY ("idMember") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataMember" ADD CONSTRAINT "DataMember_idToko_fkey" FOREIGN KEY ("idToko") REFERENCES "Toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
