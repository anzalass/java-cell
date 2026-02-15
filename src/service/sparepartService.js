import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// src/services/sparepart.service.js

// -------------------------
// GET ALL with filter & pagination
// -------------------------
export const getAllSpareParts = async ({
  page = 1,
  pageSize = 10,
  search = "",
  brand = "",
  penempatan = "",
  createdStart,
  createdEnd,
  updatedStart,
  updatedEnd,
  filterBarcode = "all",
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  try {
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const where = {};

    // ✅ CREATED RANGE
    if (createdStart || createdEnd) {
      where.createdAt = {
        ...(createdStart && {
          gte: new Date(new Date(createdStart).setHours(0, 0, 0, 0)),
        }),
        ...(createdEnd && {
          lte: new Date(new Date(createdEnd).setHours(23, 59, 59, 999)),
        }),
      };
    }

    // ✅ UPDATED RANGE
    if (updatedStart || updatedEnd) {
      where.updatedAt = {
        ...(updatedStart && {
          gte: new Date(new Date(updatedStart).setHours(0, 0, 0, 0)),
        }),
        ...(updatedEnd && {
          lte: new Date(new Date(updatedEnd).setHours(23, 59, 59, 999)),
        }),
      };
    }

    // ✅ SEARCH
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ];
    }

    // ✅ BRAND FILTER
    if (brand) {
      where.brand = {
        contains: brand,
        mode: "insensitive",
      };
    }

    // ✅ PENEMPATAN FILTER (FIXED)
    if (penempatan) {
      where.penempatan = {
        contains: penempatan,
        mode: "insensitive",
      };
    }

    // ✅ FILTER BARCODE
    if (filterBarcode === "with") {
      where.barcode = { not: "" };
    } else if (filterBarcode === "without") {
      where.barcode = "";
    }

    // ✅ SORT VALIDATION
    const allowedSort = [
      "barcode",
      "nama",
      "brand",
      "stok",
      "hargaModal",
      "hargaJual",
      "createdAt",
      "updatedAt",
    ];

    const sortField = allowedSort.includes(sortBy) ? sortBy : "createdAt";

    const sortDir = sortOrder === "asc" ? "asc" : "desc";

    const [data, total] = await prisma.$transaction([
      prisma.sparePart.findMany({
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
      prisma.sparePart.count({ where }),
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
    console.error("Error getAllSpareParts:", error);
    throw error;
  }
};

// -------------------------
// CREATE
// -------------------------
export const createSparePart = async (data, user) => {
  const {
    barcode,
    nama,
    kategori,
    brand,
    stok,
    hargaModal,
    hargaJual,
    penempatan,
  } = data;

  // Validasi wajib
  if (
    !nama ||
    !brand ||
    stok == null ||
    hargaModal == null ||
    hargaJual == null
  ) {
    throw new Error("Field wajib tidak lengkap");
  }

  return await prisma.sparePart.create({
    data: {
      barcode,
      nama,
      kategori,
      brand,
      penempatan,
      stok: Number(stok),
      hargaModal: Number(hargaModal),
      hargaJual: Number(hargaJual),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
};

// -------------------------
// GET ONE
// -------------------------
export const getSparePartById = async (id) => {
  const sparePart = await prisma.sparePart.findUnique({
    where: { id },
  });
  if (!sparePart) throw new Error("Sparepart tidak ditemukan");
  return sparePart;
};

// -------------------------
// UPDATE
// -------------------------
export const updateSparePart = async (id, data) => {
  const { barcode, nama, kategori, brand, stok, hargaModal, hargaJual } = data;

  return await prisma.sparePart.update({
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
export const deleteSparePart = async (id) => {
  return await prisma.sparePart.delete({
    where: { id },
  });
};

export const updateSparePartStok = async (id, { tipe, stok }) => {
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
    const current = await tx.sparePart.findUnique({
      where: { id },
      select: { stok: true },
    });
    if (!current) throw new Error("Sparepart tidak ditemukan");

    let newStok;
    if (tipe === "tambah") {
      newStok = current.stok + stok;
    } else {
      newStok = current.stok - stok;
      if (newStok < 0) {
        throw new Error("Stok tidak boleh minus");
      }
    }

    // Update stok dan updatedAt
    const updated = await tx.sparePart.update({
      where: { id },
      data: {
        stok: newStok,
        updatedAt: new Date(), // ⚠️ sesuai model: updatedAt
      },
    });

    return updated;
  });
};

export const sparePartMaster = async () => {
  try {
    return await prisma.sparePart.findMany({});
  } catch (error) {
    console.log(error);

    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};
