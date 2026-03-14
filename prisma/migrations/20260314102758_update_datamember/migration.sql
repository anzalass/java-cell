-- DropForeignKey
ALTER TABLE "DataMember" DROP CONSTRAINT "DataMember_idMember_fkey";

-- AlterTable
ALTER TABLE "DataMember" ALTER COLUMN "idMember" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "DataMember" ADD CONSTRAINT "DataMember_idMember_fkey" FOREIGN KEY ("idMember") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
