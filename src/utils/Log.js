import { PrismaClient } from "@prisma/client";
import { prismaErrorHandler } from "../utils/errorHandlerPrisma.js";
const prisma = new PrismaClient();

export const createLog = async ({ nama, keterangan, kategori }) => {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.log.create({
        data: {
          keterangan: keterangan,
          kategori: kategori,
          tanggal: new Date(),
          nama,
        },
      });
    });
  } catch (error) {
    console.error(error);
    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};
