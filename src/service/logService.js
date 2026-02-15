// src/services/log.service.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ CREATE Log
export const createLog = async ({ keterangan, nama, nominal, kategori }) => {
  // Validasi field wajib
  if (!keterangan || !nama || !kategori) {
    throw new Error("Field keterangan, nama, dan tanggal wajib diisi");
  }

  return await prisma.log.create({
    data: {
      keterangan,
      nama,
      kategori,
      nominal: nominal ? Number(nominal) : null, // Opsional
    },
  });
};

// ✅ GET ALL dengan filter & pagination
export const getAllLogs = async ({
  page = 1,
  pageSize = 10,
  search = "", // Cari di keterangan atau nama
  startDate,
  endDate,
  minNominal,
  maxNominal,
}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const where = {};

  // Filter pencarian (keterangan atau nama)
  if (search) {
    where.OR = [
      { keterangan: { contains: search, mode: "insensitive" } },
      { nama: { contains: search, mode: "insensitive" } },
    ];
  }

  // Filter tanggal
  if (startDate || endDate) {
    where.tanggal = {};
    if (startDate) where.tanggal.gte = new Date(startDate);
    if (endDate) where.tanggal.lte = new Date(endDate);
  }

  // Filter nominal (hanya jika nominal tidak null)
  if (minNominal != null || maxNominal != null) {
    where.nominal = {};
    if (minNominal != null) where.nominal.gte = Number(minNominal);
    if (maxNominal != null) where.nominal.lte = Number(maxNominal);
  }

  const [data, total] = await prisma.$transaction([
    prisma.log.findMany({
      where,
      skip,
      take,
      orderBy: { tanggal: "desc" }, // Terbaru dulu
    }),
    prisma.log.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: Number(page),
      pageSize: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};
