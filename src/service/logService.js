// src/services/log.service.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ CREATE Log
export const createLog = async ({
  keterangan,
  nama,
  nominal,
  kategori,
  idToko,
}) => {
  // Validasi field wajib
  if (!keterangan || !nama || !kategori || !idToko) {
    throw new Error("Field keterangan, nama, dan tanggal wajib diisi");
  }

  return await prisma.log.create({
    data: {
      keterangan,
      nama,
      idToko,
      kategori,
      nominal: nominal ? Number(nominal) : null, // Opsional
    },
  });
};

// ✅ GET ALL dengan filter & pagination
export const getAllLogs = async ({
  page = 1,
  pageSize = 10,
  search = "",
  kategori,
  nama,
  startDate,
  endDate,
  minNominal,
  maxNominal,
  idToko,
}) => {
  if (!idToko) {
    throw new Error("idToko wajib diisi");
  }

  const take = Math.max(1, Math.min(Number(pageSize), 100));
  const skip = (Math.max(1, Number(page)) - 1) * take;

  const where = {
    idToko, // 🔥 penting untuk keamanan data
  };

  /* =========================
     SEARCH GLOBAL (keterangan / nama)
  ========================== */
  if (search) {
    where.OR = [
      { keterangan: { contains: search, mode: "insensitive" } },
      { nama: { contains: search, mode: "insensitive" } },
    ];
  }

  /* =========================
     FILTER SPESIFIK
  ========================== */

  if (kategori) {
    where.kategori = {
      contains: kategori,
      mode: "insensitive",
    };
  }

  if (nama) {
    where.nama = {
      contains: nama,
      mode: "insensitive",
    };
  }

  /* =========================
     FILTER TANGGAL
  ========================== */
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  /* =========================
     FILTER NOMINAL
  ========================== */
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
      orderBy: { createdAt: "desc" }, // 🔥 pakai createdAt (lebih konsisten)
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
