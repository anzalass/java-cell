import { PrismaClient } from "@prisma/client";
import { prismaErrorHandler } from "../utils/errorHandlerPrisma.js";

const prisma = new PrismaClient();

// Helper: validasi dan parse sort
const parseSort = (sortField, sortOrder = "asc") => {
  const validFields = [
    "nama",
    "brand",
    "stok",
    "hargaPokok",
    "hargaJual",
    "createdAt",
    "updatedAt",
  ];
  const direction = sortOrder === "desc" ? "desc" : "asc";

  if (!validFields.includes(sortField)) {
    return { field: "createdAt", direction: "desc" }; // default
  }
  return { field: sortField, direction };
};

// CREATE
export const createVoucher = async (data, user) => {
  const { nama, brand, stok, hargaPokok, hargaJual, hargaEceran, tanggal } =
    data;

  try {
    await prisma.$transaction(async (tx) => {
      const now = new Date();

      await tx.voucher.create({
        data: {
          // 👈 tambahkan "data:"
          nama,
          penempatan: user.penempatan,
          brand,
          stok: parseInt(stok) || 0,
          hargaPokok: hargaPokok ? parseInt(hargaPokok) : null,
          hargaJual: hargaJual ? parseInt(hargaJual) : null,
          hargaEceran: hargaEceran ? parseInt(hargaEceran) : null,
          createdAt: new Date(`${tanggal}T00:00:00Z`),
          updatedAt: new Date(`${tanggal}T00:00:00Z`),
        },
      });
    });

    return { message: "Voucher berhasil dibuat" };
  } catch (error) {
    console.error("Error createVoucher:", error);
    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};

// GET ALL with pagination, search, sort
// services/voucherService.js
export const getVouchers = async ({
  page = 1,
  pageSize = 10,
  search = "",
  brand = "all",
  sortBy = "createdAt",
  sortOrder = "desc",
  createdAt, // format: "2025-11-22"
}) => {
  try {
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    // ✅ Filter tanggal
    const dateFilter = createdAt
      ? {
          createdAt: {
            gte: new Date(`${createdAt}T00:00:00`),
            lt: new Date(`${createdAt}T23:59:59.999`),
          },
        }
      : {};

    const brandFilter =
      brand && brand !== "all"
        ? {
            brand: {
              equals: brand,
              mode: "insensitive",
            },
          }
        : {};

    // ✅ Filter pencarian
    const searchFilter = search
      ? {
          OR: [
            { nama: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    // ✅ Gabungkan semua filter
    const where = {
      ...dateFilter,
      ...brandFilter,
      ...(search ? searchFilter : {}),
    };

    // ✅ Validasi field sort (aman dari inject)
    const allowedSortFields = [
      "brand",
      "nama",
      "stok",
      "hargaPokok",
      "hargaJual",
      "createdAt",
      "updatedAt",
    ];
    const validSortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";
    const validSortOrder = sortOrder === "asc" ? "asc" : "desc";

    const [vouchers, total] = await prisma.$transaction([
      prisma.voucher.findMany({
        where,
        skip,
        take,
        orderBy: {
          [validSortField]: validSortOrder,
        },
        select: {
          id: true,
          nama: true,
          brand: true,
          stok: true,
          hargaPokok: true,
          hargaJual: true,
          hargaEceran: true,
          createdAt: true,
          penempatan: true,
          updatedAt: true,
        },
      }),
      prisma.voucher.count({ where }),
    ]);

    return {
      data: vouchers,
      meta: {
        page: parseInt(page),
        pageSize: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  } catch (error) {
    console.error("Error getVouchers:", error);
    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};

// handlers/voucherHandler.js

// GET BY ID
export const getVoucherById = async (id) => {
  try {
    const voucher = await prisma.voucher.findUnique({
      where: { id },
      select: {
        id: true,
        nama: true,
        brand: true,
        stok: true,
        hargaPokok: true,
        hargaJual: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!voucher) {
      throw new Error("Voucher tidak ditemukan");
    }
    return voucher;
  } catch (error) {
    console.error("Error getVoucherById:", error);
    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};

// UPDATE
export const updateVoucher = async (id, data, user) => {
  try {
    const { nama, brand, stok, hargaPokok, hargaJual, hargaEceran } = data;

    await prisma.$transaction(async (tx) => {
      await tx.voucher.update({
        where: { id },
        data: {
          nama,
          brand,
          stok: stok ? parseInt(stok) : undefined,
          hargaPokok: hargaPokok ? parseInt(hargaPokok) : undefined,
          hargaJual: hargaJual ? parseInt(hargaJual) : undefined,
          hargaEceran: hargaEceran ? parseInt(hargaEceran) : null,
        },
      });
    });

    return { message: "Voucher berhasil diupdate" };
  } catch (error) {
    console.error("Error updateVoucher:", error);
    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};

// DELETE
export const deleteVoucher = async (id, user) => {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.voucher.delete({
        where: { id },
      });
    });
    return { message: "Voucher berhasil dihapus" };
  } catch (error) {
    console.error("Error deleteVoucher:", error);
    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};

// UPDATE STOK (tambah / kurang)
export const updateStokVoucher = async (id, { tipe, stok }, user) => {
  try {
    const qty = parseInt(stok);
    if (isNaN(qty) || qty <= 0) {
      throw new Error("Jumlah stok harus angka positif");
    }

    if (tipe !== "tambah" && tipe !== "kurang") {
      throw new Error("Tipe harus 'tambah' atau 'kurang'");
    }

    let updatedStok;
    await prisma.$transaction(async (tx) => {
      // Ambil stok saat ini
      const voucher = await tx.voucher.findUnique({
        where: { id },
        select: { stok: true, nama: true, brand: true },
      });

      if (!voucher) {
        throw new Error("Voucher tidak ditemukan");
      }

      // Hitung stok baru
      if (tipe === "tambah") {
        updatedStok = voucher.stok + qty;
      } else {
        updatedStok = voucher.stok - qty;
        if (updatedStok < 0) {
          throw new Error("Stok tidak boleh minus");
        }
      }

      // Update stok
      await tx.voucher.update({
        where: { id },
        data: { stok: updatedStok },
      });

      // Log aktivitas
    });

    return {
      message: `Stok berhasil di${tipe === "tambah" ? "tambah" : "kurang"}`,
      stok: updatedStok,
    };
  } catch (error) {
    console.error("Error updateStokVoucher:", error);
    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};

export const voucherMaster = async () => {
  try {
    return await prisma.voucher.findMany({});
  } catch (error) {
    console.log(error);
    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};
