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

// GET ONE
export const getDownlineById = async (id) => {
  const downline = await prisma.downline.findUnique({ where: { id } });
  if (!downline) throw new Error("Downline tidak ditemukan");
  return downline;
};

/* =========================
   CREATE DOWNLINE
========================= */
export const createDownline = async (data, user) => {
  try {
    const { kodeDownline, nama, noHp } = data;

    if (!kodeDownline || !nama || !noHp) {
      throw new Error("Kode downline, nama, dan noHp wajib diisi");
    }

    return await prisma.$transaction(async (tx) => {
      const downline = await tx.downline.create({
        data: {
          kodeDownline,
          noHp,
          nama,
          createdAt: new Date(),
          idToko: user.toko_id,
        },
      });

      await createLog(
        {
          kategori: "Downline",
          keterangan: `${user.nama} Menambah downline baru ${downline.nama}`,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return downline;
    });
  } catch (error) {
    console.error("Error createDownline:", error);
    throw new Error("Gagal membuat downline");
  }
};

/* =========================
   UPDATE DOWNLINE
========================= */
export const updateDownline = async (id, data, user) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const { kodeDownline, nama } = data;

      const oldDownline = await tx.downline.findUnique({
        where: { id },
      });

      if (!oldDownline) {
        throw new Error("Downline tidak ditemukan");
      }

      const downline = await tx.downline.update({
        where: { id },
        data: {
          ...(kodeDownline !== undefined && { kodeDownline }),
          ...(nama !== undefined && { nama }),
          updatedAt: new Date(),
        },
      });

      await createLog(
        {
          kategori: "Downline",
          keterangan: `${user.nama} Mengubah downline ${oldDownline.nama} → ${downline.nama}`,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return downline;
    });
  } catch (error) {
    console.error("Error updateDownline:", error);
    throw new Error("Gagal mengupdate downline");
  }
};

/* =========================
   DELETE DOWNLINE (SOFT DELETE)
========================= */
export const deleteDownline = async (id, user) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const oldDownline = await tx.downline.findUnique({
        where: { id },
      });

      if (!oldDownline) {
        throw new Error("Downline tidak ditemukan");
      }

      await tx.downline.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      await createLog(
        {
          kategori: "Downline",
          keterangan: `${user.nama} Menghapus downline ${oldDownline.nama}`,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return true;
    });
  } catch (error) {
    console.error("Error deleteDownline:", error);
    throw new Error("Gagal menghapus downline");
  }
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
