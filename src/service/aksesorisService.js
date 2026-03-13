import { PrismaClient } from "@prisma/client";
import { createLog } from "./logService.js";
const prisma = new PrismaClient();

export const getAllAcc = async ({
  page = 1,
  pageSize = 10,
  search = "",
  penempatan = "",
  brand = "",
  filterBarcode = "all", // "all", "with", "without"
  createdStart,
  createdEnd,
  updatedStart,
  updatedEnd, // frontend kirim "updatedAt", kita map ke "updateAt"
  sortBy = "createdAt",
  sortOrder = "desc",
  idToko,
}) => {
  try {
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    // Build WHERE
    const where = {};
    if (!idToko) {
      throw new Error("Toko tidak ditemukan");
    }

    where.idToko = idToko;
    where.isActive = true;

    // Search di nama atau brand
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ];
    }

    if (brand) {
      where.brand = {
        contains: brand,
        mode: "insensitive",
      };
    }

    if (penempatan) {
      where.brand = {
        contains: penempatan,
        mode: "insensitive",
      };
    }

    // Filter barcode
    if (filterBarcode === "with") {
      where.barcode = { not: "" };
    } else if (filterBarcode === "without") {
      where.barcode = "";
    }

    // Filter createdAt (exact date)
    // CREATED RANGE
    if (createdStart || createdEnd) {
      where.createdAt = {};

      if (createdStart) {
        const start = new Date(createdStart);
        if (isNaN(start.getTime()))
          throw new Error("Format createdStart tidak valid");

        start.setHours(0, 0, 0, 0);
        where.createdAt.gte = start;
      }

      if (createdEnd) {
        const end = new Date(createdEnd);
        if (isNaN(end.getTime()))
          throw new Error("Format createdEnd tidak valid");

        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // UPDATED RANGE
    if (updatedStart || updatedEnd) {
      where.updatedAt = {};

      if (updatedStart) {
        const start = new Date(updatedStart);
        if (isNaN(start.getTime()))
          throw new Error("Format updatedStart tidak valid");

        start.setHours(0, 0, 0, 0);
        where.updatedAt.gte = start;
      }

      if (updatedEnd) {
        const end = new Date(updatedEnd);
        if (isNaN(end.getTime()))
          throw new Error("Format updatedEnd tidak valid");

        end.setHours(23, 59, 59, 999);
        where.updatedAt.lte = end;
      }
    }

    // Validasi sort field
    const allowedSort = [
      "barcode",
      "nama",
      "brand",
      "penempatan",
      "stok",
      "hargaModal",
      "hargaJual",
      "createdAt",
      "updatedAt",
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

export const getAccById = async (id) => {
  const Acc = await prisma.aksesoris.findUnique({
    where: { id, isActive: true },
  });
  if (!Acc) throw new Error("Acc tidak ditemukan");
  return Acc;
};

/* =========================
   CREATE AKSESORIS
========================= */
export const createAcc = async (data, user) => {
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
      const acc = await tx.aksesoris.create({
        data: {
          barcode,
          idToko: user.toko_id,
          nama,
          kategori,
          penempatan,
          brand,
          stok: Number(stok),
          hargaModal: Number(hargaModal),
          hargaJual: Number(hargaJual),
        },
      });

      await createLog(
        {
          kategori: "Aksesoris",
          keterangan: `${user.nama} Membuat Aksesoris Baru ${nama}`,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return acc;
    });
  } catch (error) {
    console.error("Error createAcc:", error);
    throw new Error("Gagal membuat aksesoris");
  }
};

/* =========================
   UPDATE AKSESORIS
========================= */
export const updateAcc = async (id, data, user) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const { barcode, nama, kategori, brand, stok, hargaModal, hargaJual } =
        data;

      const acc = await tx.aksesoris.update({
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

      await createLog(
        {
          kategori: "Aksesoris",
          keterangan: `${user.nama} Mengupdate Aksesoris menjadi ${acc.nama}`,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return acc;
    });
  } catch (error) {
    console.error("Error updateAcc:", error);
    throw new Error("Gagal mengupdate aksesoris");
  }
};

/* =========================
   DELETE AKSESORIS (SOFT DELETE)
========================= */
export const deleteAcc = async (id, user) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const acc = await tx.aksesoris.findUnique({
        where: { id },
      });

      if (!acc) {
        throw new Error("Aksesoris tidak ditemukan");
      }

      await tx.aksesoris.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      await createLog(
        {
          kategori: "Aksesoris",
          keterangan: `${user.nama} Menghapus Aksesoris ${acc.nama}`,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return true;
    });
  } catch (error) {
    console.error("Error deleteAcc:", error);
    throw new Error("Gagal menghapus aksesoris");
  }
};

/* =========================
   UPDATE STOK
========================= */
export const updateAccStok = async (id, { tipe, stok }, user) => {
  try {
    if (!["tambah", "kurang"].includes(tipe)) {
      throw new Error("Tipe harus 'tambah' atau 'kurang'");
    }

    if (typeof stok !== "number" || stok <= 0) {
      throw new Error("Stok harus angka positif");
    }

    return await prisma.$transaction(async (tx) => {
      const current = await tx.aksesoris.findUnique({
        where: { id },
        select: { stok: true, nama: true },
      });

      if (!current) {
        throw new Error("Aksesoris tidak ditemukan");
      }

      let newStok;

      if (tipe === "tambah") {
        newStok = current.stok + stok;
      } else {
        newStok = current.stok - stok;
        if (newStok < 0) {
          throw new Error("Stok tidak boleh minus");
        }
      }

      const updated = await tx.aksesoris.update({
        where: { id },
        data: {
          stok: newStok,
          updatedAt: new Date(),
        },
      });

      await createLog(
        {
          kategori: "Aksesoris",
          keterangan: `${user.nama} ${tipe} stok aksesoris ${current.nama} sebanyak ${stok} pcs`,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return updated;
    });
  } catch (error) {
    console.error("Error updateAccStok:", error);
    throw new Error("Gagal mengupdate stok aksesoris");
  }
};

export const aksesorisMaster = async (user) => {
  try {
    return await prisma.aksesoris.findMany({
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
