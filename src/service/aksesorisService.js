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

// -------------------------
// CREATE
// -------------------------
export const createAcc = async (data, user) => {
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

  await prisma.aksesoris.create({
    data: {
      barcode,
      nama,
      kategori,
      penempatan,
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
export const updateAcc = async (id, data, user) => {
  const { barcode, nama, kategori, brand, stok, hargaModal, hargaJual } = data;

  const acc = await prisma.aksesoris.update({
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

  await createLog({
    kategori: "Aksesoris",
    keterangan: `Mengupdate Aksesoris ${nama} menjadi ${acc.nama}  `,
    nama: user.nama,
  });
};

// -------------------------
// DELETE
// -------------------------
export const deleteAcc = async (id, user) => {
  const acc = await prisma.aksesoris.findUnique({
    where: { id },
  });

  if (!acc) {
    throw new Error("Aksesoris tidak ditemukan");
  }
  await prisma.aksesoris.delete({
    where: { id },
  });
  await createLog({
    kategori: "Aksesoris",
    keterangan: `Menghapus Aksesoris ${acc.nama}  `,
    nama: user.nama,
  });
};

export const updateAccStok = async (id, { tipe, stok }, user) => {
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

    await createLog({
      kategori: "Aksesoris",
      keterangan: ` Stok Aksesoris ${updated.nama} telah di ${tipe} ${stok} pcs `,
      nama: user.nama,
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
