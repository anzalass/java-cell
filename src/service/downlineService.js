import { PrismaClient } from "@prisma/client";
import { prismaErrorHandler } from "../utils/errorHandlerPrisma.js";
import { createLog } from "../utils/Log.js";
const prisma = new PrismaClient();

// CREATE
// src/services/downline.service.js

// GET ALL with filter & pagination
export const getAllDownlines = async ({
  page = 1,
  pageSize = 10,
  search = "", // untuk nama atau kode
  createdAt,
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  // Build WHERE
  const where = {};

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
export const createDownline = async (data) => {
  const { kodeDownline, nama } = data;
  if (!kodeDownline || !nama) {
    throw new Error("Kode downline dan nama wajib diisi");
  }

  return await prisma.downline.create({
    data: {
      kodeDownline,
      nama,
      createdAt: new Date(),
    },
  });
};

// GET ONE
export const getDownlineById = async (id) => {
  const downline = await prisma.downline.findUnique({ where: { id } });
  if (!downline) throw new Error("Downline tidak ditemukan");
  return downline;
};

// UPDATE
export const updateDownline = async (id, data) => {
  const { kodeDownline, nama } = data;
  return await prisma.downline.update({
    where: { id },
    data: {
      ...(kodeDownline && { kodeDownline }),
      ...(nama && { nama }),
    },
  });
};

// DELETE
export const deleteDownline = async (id) => {
  // Opsional: cek relasi transaksiVoucherDownline jika perlu
  return await prisma.downline.delete({ where: { id } });
};

export const masterDownlines = async () => {
  try {
    return await prisma.downline.findMany({});
  } catch (error) {
    console.log(error);
  }
};
