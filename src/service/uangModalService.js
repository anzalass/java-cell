// src/services/uangModal.service.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ GET ALL with filter & pagination
export const getAllUangModal = async ({
  page = 1,
  pageSize = 10,
  search = "",
  startDate,
  endDate,
}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const where = {};

  // Filter pencarian
  if (search) {
    where.keterangan = { contains: search, mode: "insensitive" };
  }

  // Filter tanggal
  if (startDate || endDate) {
    where.tanggal = {};
    if (startDate) where.tanggal.gte = new Date(startDate);
    if (endDate) where.tanggal.lte = new Date(endDate);
  }

  const [data, total] = await prisma.$transaction([
    prisma.uangModal.findMany({
      where,
      skip,
      take,
      orderBy: { tanggal: "desc" },
    }),
    prisma.uangModal.count({ where }),
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

// ✅ CREATE
export const createUangModal = async (data) => {
  const { keterangan, tanggal, jumlah, penempatan, idUser } = data;

  if (!keterangan || !tanggal || jumlah == null) {
    throw new Error("Semua field wajib diisi");
  }

  // Validasi jumlah
  if (jumlah <= 0) {
    throw new Error("Jumlah harus lebih dari 0");
  }

  return await prisma.uangModal.create({
    data: {
      idUser: idUser,
      keterangan,
      penempatan: penempatan,
      tanggal: new Date(tanggal),
      jumlah: Number(jumlah),
    },
  });
};

// ✅ UPDATE
export const updateUangModal = async (id, data) => {
  const { keterangan, tanggal, jumlah } = data;

  if (!keterangan || !tanggal || jumlah == null) {
    throw new Error("Semua field wajib diisi");
  }

  if (jumlah <= 0) {
    throw new Error("Jumlah harus lebih dari 0");
  }

  const existing = await prisma.uangModal.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Data uang modal tidak ditemukan");
  }

  return await prisma.uangModal.update({
    where: { id },
    data: {
      keterangan,
      tanggal: new Date(tanggal),
      jumlah: Number(jumlah),
    },
  });
};

// ✅ DELETE
export const deleteUangModal = async (id) => {
  const existing = await prisma.uangModal.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Data uang modal tidak ditemukan");
  }

  await prisma.uangModal.delete({ where: { id } });
  return { success: true };
};
