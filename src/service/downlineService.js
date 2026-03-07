import { PrismaClient } from "@prisma/client";
import { prismaErrorHandler } from "../utils/errorHandlerPrisma.js";
import { createLog } from "./logService.js";
const prisma = new PrismaClient();

export const getAllDownlines = async ({
  page = 1,
  pageSize = 10,
  search = "", // untuk nama atau kode
  createdAt,
  sortBy = "createdAt",
  sortOrder = "desc",
  idToko,
}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  // Build WHERE
  const where = {};
  where.idToko = idToko;

  if (search) {
    where.OR = [
      { nama: { contains: search, mode: "insensitive" } },
      { kodeDownline: { contains: search, mode: "insensitive" } },
    ];
  }

  if (createdAt) {
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) throw new Error("Format tanggal tidak valid");
    where.createdAt = {
      gte: new Date(date.setUTCHours(0, 0, 0, 0)),
      lte: new Date(date.setUTCHours(23, 59, 59, 999)),
    };
  }

  const allowedSort = ["kodeDownline", "nama", "createdAt"];
  const sortField = allowedSort.includes(sortBy) ? sortBy : "createdAt";
  const sortDir = sortOrder === "asc" ? "asc" : "desc";

  const [data, total] = await prisma.$transaction([
    prisma.downline.findMany({
      where,
      skip,
      take,
      orderBy: { [sortField]: sortDir },
      select: {
        id: true,
        kodeDownline: true,
        noHp: true,
        nama: true,
        createdAt: true,
      },
    }),
    prisma.downline.count({ where }),
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

// CREATE
export const createDownline = async (data, user) => {
  const { kodeDownline, nama, noHp } = data;
  console.log(noHp);

  if (!kodeDownline || !nama || !noHp) {
    throw new Error("Kode downline dan nama wajib diisi");
  }

  const downline = await prisma.downline.create({
    data: {
      kodeDownline,
      noHp,
      nama,
      createdAt: new Date(),
      idToko: user.toko_id,
    },
  });

  await createLog({
    kategori: "Downline",
    keterangan: `Menambah downline baru ${downline.nama}  `,
    nama: user.nama,
    idToko: user.toko_id,
  });
};

// GET ONE
export const getDownlineById = async (id) => {
  const downline = await prisma.downline.findUnique({ where: { id } });
  if (!downline) throw new Error("Downline tidak ditemukan");
  return downline;
};

// UPDATE
export const updateDownline = async (id, data, user) => {
  const { kodeDownline, nama } = data;
  const oldDownline = await prisma.downline.findUnique({
    where: {
      id,
    },
  });

  if (!oldDownline) {
    throw new Error("Downline tidak ditemukan");
  }
  const downline = await prisma.downline.update({
    where: { id },
    data: {
      ...(kodeDownline && { kodeDownline }),
      ...(nama && { nama }),
    },
  });
  await createLog({
    kategori: "Downline",
    keterangan: `Mengubah downline ${oldDownline.nama} - ${downline.nama}  `,
    nama: user.nama,
    idToko: user.toko_id,
  });
};

// DELETE
export const deleteDownline = async (id, user) => {
  const oldDownline = await prisma.downline.findUnique({
    where: {
      id,
    },
  });

  if (!oldDownline) {
    throw new Error("Downline tidak ditemukan");
  }
  // Opsional: cek relasi transaksiVoucherDownline jika perlu
  await prisma.downline.update({
    where: { id },
    data: {
      isActive: false,
    },
  });

  await createLog({
    kategori: "Downline",
    keterangan: `Menghapus downline ${oldDownline.nama} `,
    nama: user.nama,
    idToko: user.toko_id,
  });
};

export const masterDownlines = async (user) => {
  try {
    return await prisma.downline.findMany({
      where: {
        idToko: user.toko_id,
        isActive: true,
      },
    });
  } catch (error) {
    console.log(error);
  }
};
