// src/services/uangModal.service.js
import { PrismaClient } from "@prisma/client";
import { createLog } from "./logService.js";

const prisma = new PrismaClient();

// ✅ GET ALL with filter & pagination
export const getAllUangModal = async ({
  page = 1,
  pageSize = 10,
  search = "",
  startDate,
  endDate,
  user,
}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const where = {};
  where.idToko = user.toko_id;

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
  const { keterangan, tanggal, jumlah, penempatan, idUser, idToko, user } =
    data;

  if (!keterangan || !tanggal || jumlah == null || !idToko) {
    throw new Error("Semua field wajib diisi");
  }

  // Validasi jumlah
  if (jumlah <= 0) {
    throw new Error("Jumlah harus lebih dari 0");
  }

  await prisma.uangModal.create({
    data: {
      keterangan,
      idToko: idToko,
      tanggal: new Date(tanggal),
      jumlah: Number(jumlah),
    },
  });

  await createLog({
    kategori: "Uang Keluar",
    keterangan: `${user.nama} Menambahkan Catatan ${keterangan} Uang Keluar`,
    nominal: jumlah,
    nama: user.nama,
    idToko: user.toko_id,
  });
};

// ✅ UPDATE
export const updateUangModal = async (id, data, user) => {
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

  await prisma.uangModal.update({
    where: { id },
    data: {
      keterangan,
      tanggal: new Date(tanggal),
      jumlah: Number(jumlah),
    },
  });

  await createLog({
    kategori: "Uang Keluar",
    keterangan: `${user.nama} Mengupdate Catatan ${keterangan} Uang Keluar`,
    nominal: jumlah,
    nama: user.nama,
    idToko: user.toko_id,
  });
};

// ✅ DELETE
export const deleteUangModal = async (id, user) => {
  const existing = await prisma.uangModal.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Data uang modal tidak ditemukan");
  }

  await createLog({
    kategori: "Uang Keluar",
    keterangan: `${user.nama} Menghapus Catatan ${existing.keterangan} Uang Keluar`,
    nominal: existing.jumlah,
    nama: user.nama,
    idToko: user.toko_id,
  });

  await prisma.uangModal.delete({ where: { id } });

  return { success: true };
};
