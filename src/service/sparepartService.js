import { PrismaClient } from "@prisma/client";
import { createLog } from "./logService.js";
const prisma = new PrismaClient();

// src/services/sparepart.service.js

// -------------------------
// GET ALL with filter & pagination
// -------------------------
export const getAllSpareParts = async (
  {
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
  },
  user
) => {
  try {
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const where = {};
    where.isActive = true;
    where.idToko = user.toko_id;

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

    if (!user) {
      throw new Error("Toko tidak ditemukan");
    }

    where.idToko = user.toko_id;

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
// GET ONE
// -------------------------
export const getSparePartById = async (id) => {
  const sparePart = await prisma.sparePart.findUnique({
    where: { id },
  });
  if (!sparePart) throw new Error("Sparepart tidak ditemukan");
  return sparePart;
};

export const createSparePart = async (data, user) => {
  try {
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

    if (
      !nama ||
      !brand ||
      stok == null ||
      hargaModal == null ||
      hargaJual == null
    ) {
      throw new Error("Field wajib tidak lengkap");
    }

    return await prisma.$transaction(async (tx) => {
      const sparePart = await tx.sparePart.create({
        data: {
          barcode,
          nama,
          kategori,
          brand,
          penempatan,
          stok: Number(stok),
          hargaModal: Number(hargaModal),
          hargaJual: Number(hargaJual),
          idToko: user.toko_id,
        },
      });

      await createLog(
        {
          kategori: "Sparepart",
          keterangan: `${user.nama} menambahkan sparepart ${nama}`,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return sparePart;
    });
  } catch (error) {
    console.error("Error createSparePart:", error);
    throw new Error("Gagal membuat sparepart");
  }
};

export const updateSparePart = async (id, data, user) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.sparePart.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("Sparepart tidak ditemukan");
      }

      const updated = await tx.sparePart.update({
        where: { id },
        data: {
          ...(data.barcode !== undefined && { barcode: data.barcode }),
          ...(data.nama !== undefined && { nama: data.nama }),
          ...(data.kategori !== undefined && { kategori: data.kategori }),
          ...(data.brand !== undefined && { brand: data.brand }),
          ...(data.stok !== undefined && { stok: Number(data.stok) }),
          ...(data.hargaModal !== undefined && {
            hargaModal: Number(data.hargaModal),
          }),
          ...(data.hargaJual !== undefined && {
            hargaJual: Number(data.hargaJual),
          }),
          updatedAt: new Date(),
        },
      });

      await createLog(
        {
          kategori: "Sparepart",
          keterangan: `${user.nama} mengupdate sparepart ${updated.nama}`,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return updated;
    });
  } catch (error) {
    console.error("Error updateSparePart:", error);
    throw new Error("Gagal mengupdate sparepart");
  }
};

export const deleteSparePart = async (id, user) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const sparePart = await tx.sparePart.findUnique({
        where: { id },
      });

      if (!sparePart) {
        throw new Error("Sparepart tidak ditemukan");
      }

      const deleted = await tx.sparePart.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      await createLog(
        {
          kategori: "Sparepart",
          keterangan: `${user.nama} menghapus sparepart ${deleted.nama}`,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return deleted;
    });
  } catch (error) {
    console.error("Error deleteSparePart:", error);
    throw new Error("Gagal menghapus sparepart");
  }
};

export const updateSparePartStok = async (id, { tipe, stok }, user) => {
  try {
    if (!["tambah", "kurang"].includes(tipe)) {
      throw new Error("Tipe harus 'tambah' atau 'kurang'");
    }

    if (!Number.isInteger(stok) || stok <= 0) {
      throw new Error("Stok harus angka positif");
    }

    return await prisma.$transaction(async (tx) => {
      const sparepart = await tx.sparePart.findUnique({
        where: { id },
      });

      if (!sparepart) {
        throw new Error("Sparepart tidak ditemukan");
      }

      if (tipe === "kurang" && sparepart.stok < stok) {
        throw new Error("Stok tidak mencukupi");
      }

      const updated = await tx.sparePart.update({
        where: { id },
        data: {
          stok: tipe === "tambah" ? { increment: stok } : { decrement: stok },
          updatedAt: new Date(),
        },
      });

      await createLog(
        {
          kategori: "Sparepart",
          keterangan: `${user.nama} ${tipe} stok ${updated.nama} sebanyak ${stok}`,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return updated;
    });
  } catch (error) {
    console.error("Error updateSparePartStok:", error);
    throw new Error("Gagal mengupdate stok sparepart");
  }
};

export const sparePartMaster = async (user) => {
  try {
    return await prisma.sparePart.findMany({
      where: {
        idToko: user.toko_id,
        isActive: true,
      },
    });
  } catch (error) {
    console.log(error);

    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};
