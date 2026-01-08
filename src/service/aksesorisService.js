import { PrismaClient } from "@prisma/client";
import { createLog } from "../utils/Log.js";
const prisma = new PrismaClient();

// src/services/Acc.service.js

// -------------------------
// GET ALL with filter & pagination
// -------------------------
export const getAllAcc = async ({
  page = 1,
  pageSize = 10,
  search = "",
  filterBarcode = "all", // "all", "with", "without"
  createdAt,
  updatedAt, // frontend kirim "updatedAt", kita map ke "updateAt"
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  try {
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    // Build WHERE
    const where = {};

    // Search di nama atau brand
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter barcode
    if (filterBarcode === "with") {
      where.barcode = { not: "" };
    } else if (filterBarcode === "without") {
      where.barcode = "";
    }

    // Filter createdAt (exact date)
    if (createdAt) {
      const date = new Date(createdAt);
      if (isNaN(date.getTime()))
        throw new Error("Format createdAt tidak valid");
      where.createdAt = {
        gte: new Date(date.setUTCHours(0, 0, 0, 0)),
        lte: new Date(date.setUTCHours(23, 59, 59, 999)),
      };
    }

    // Filter updatedAt → updateAt
    if (updatedAt) {
      const date = new Date(updatedAt);
      if (isNaN(date.getTime()))
        throw new Error("Format updatedAt tidak valid");
      where.updateAt = {
        gte: new Date(date.setUTCHours(0, 0, 0, 0)),
        lte: new Date(date.setUTCHours(23, 59, 59, 999)),
      };
    }

    // Validasi sort field
    const allowedSort = [
      "barcode",
      "nama",
      "brand",
      "stok",
      "hargaModal",
      "hargaJual",
      "createdAt",
      "updateAt",
    ];
    const sortField = allowedSort.includes(sortBy) ? sortBy : "createdAt";
    const sortDir = sortOrder === "asc" ? "asc" : "desc";

    const [data, total] = await prisma.$transaction([
      prisma.aksesoris.findMany({
        where,
        skip,
        take,
        orderBy: { [sortField]: sortDir },
        select: {
          id: true,
          barcode: true,
          nama: true,
          kategori: true,
          brand: true,
          stok: true,
          hargaModal: true,
          hargaJual: true,
          createdAt: true,
          updatedAt: true,
          penempatan: true,
        },
      }),
      prisma.aksesoris.count({ where }),
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
  } catch (error) {
    console.log(error);
  }
};

// -------------------------
// CREATE
// -------------------------
export const createAcc = async (data, user) => {
  const { barcode, nama, kategori, brand, stok, hargaModal, hargaJual } = data;

  // Validasi wajib
  if (
    !barcode ||
    !nama ||
    !brand ||
    stok == null ||
    hargaModal == null ||
    hargaJual == null
  ) {
    throw new Error("Field wajib tidak lengkap");
  }

  await prisma.aksesoris.create({
    data: {
      barcode,
      nama,
      kategori,
      penempatan: user.penempatan,
      brand,
      stok: Number(stok),
      hargaModal: Number(hargaModal),
      hargaJual: Number(hargaJual),
    },
  });

  await createLog({
    kategori: "Aksesoris",
    keterangan: "Membuat Aksesoris Baru",
    nama: user.nama,
  });
};

// -------------------------
// GET ONE
// -------------------------
export const getAccById = async (id) => {
  const Acc = await prisma.aksesoris.findUnique({
    where: { id },
  });
  if (!Acc) throw new Error("Acc tidak ditemukan");
  return Acc;
};

// -------------------------
// UPDATE
// -------------------------
export const updateAcc = async (id, data) => {
  const { barcode, nama, kategori, brand, stok, hargaModal, hargaJual } = data;

  return await prisma.aksesoris.update({
    where: { id },
    data: {
      ...(barcode !== undefined && { barcode }),
      ...(nama !== undefined && { nama }),
      ...(kategori !== undefined && { kategori }),
      ...(brand !== undefined && { brand }),
      ...(stok !== undefined && { stok: Number(stok) }),
      ...(hargaModal !== undefined && { hargaModal: Number(hargaModal) }),
      ...(hargaJual !== undefined && { hargaJual: Number(hargaJual) }),
      updatedAt: new Date(),
    },
  });
};

// -------------------------
// DELETE
// -------------------------
export const deleteAcc = async (id) => {
  return await prisma.aksesoris.delete({
    where: { id },
  });
};

export const updateAccStok = async (id, { tipe, stok }) => {
  // Validasi
  if (!["tambah", "kurang"].includes(tipe)) {
    console.log(tipe);

    throw new Error("Tipe harus 'tambah' atau 'kurang'");
  }
  if (typeof stok !== "number" || stok <= 0) {
    throw new Error("Stok harus angka positif");
  }

  return await prisma.$transaction(async (tx) => {
    // Ambil data saat ini
    const current = await tx.aksesoris.findUnique({
      where: { id },
      select: { stok: true },
    });
    if (!current) throw new Error("Acc tidak ditemukan");

    let newStok;
    if (tipe === "tambah") {
      newStok = current.stok + stok;
    } else {
      newStok = current.stok - stok;
      if (newStok < 0) {
        throw new Error("Stok tidak boleh minus");
      }
    }

    // Update stok dan updateAt
    const updated = await tx.aksesoris.update({
      where: { id },
      data: {
        stok: newStok,
        updatedAt: new Date(), // ⚠️ sesuai model: updateAt
      },
    });

    return updated;
  });
};

export const aksesorisMaster = async () => {
  try {
    return await prisma.aksesoris.findMany({});
  } catch (error) {
    console.log(error);

    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};
