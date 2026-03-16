import { PrismaClient } from "@prisma/client";
import { prismaErrorHandler } from "../utils/errorHandlerPrisma.js";
import { createLog } from "./logService.js";
import { toUTCFromWIBRange } from "../utils/wibMiddleware.js";

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

// GET ALL with pagination, search, sort
// services/voucherService.js
export const getVouchers = async (
  {
    page = 1,
    pageSize = 10,
    search = "",
    brand = "all",
    sortBy = "createdAt",
    sortOrder = "desc",
    penempatan = "",
    createdStart,
    createdEnd,
    updatedStart,
    updatedEnd,
  },
  user
) => {
  try {
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    // ✅ Filter tanggal
    // ✅ Filter CREATED RANGE
    const createdRange = toUTCFromWIBRange(createdStart, createdEnd);
    const updatedRange = toUTCFromWIBRange(updatedStart, updatedEnd);

    const where = {
      ...(Object.keys(createdRange).length && { createdAt: createdRange }),
      ...(Object.keys(updatedRange).length && { updatedAt: updatedRange }),
      ...(brand &&
        brand !== "all" && {
          brand: { equals: brand, mode: "insensitive" },
        }),
      ...(penempatan && {
        penempatan: { contains: penempatan, mode: "insensitive" },
      }),
      ...(search && {
        OR: [
          { nama: { contains: search, mode: "insensitive" } },
          { brand: { contains: search, mode: "insensitive" } },
        ],
      }),
      idToko: user.toko_id,
      isActive: true,
    };
    // ✅ Validasi field sort (aman dari inject)
    const allowedSortFields = [
      "brand",
      "nama",
      "stok",
      "hargaPokok",
      "hargaJual",
      "hargaEceran",
      "penempatan",
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

export const createVoucher = async (data, user) => {
  try {
    const {
      nama,
      brand,
      stok,
      hargaPokok,
      hargaJual,
      hargaEceran,
      tanggal,
      penempatan,
    } = data;

    if (!nama || !brand || !tanggal) {
      throw new Error("Nama, brand, dan tanggal wajib diisi");
    }

    return await prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.create({
        data: {
          nama,
          penempatan,
          brand,
          idToko: user.toko_id,
          stok: parseInt(stok) || 0,
          hargaPokok: hargaPokok ? parseInt(hargaPokok) : null,
          hargaJual: hargaJual ? parseInt(hargaJual) : null,
          hargaEceran: hargaEceran ? parseInt(hargaEceran) : null,
          createdAt: new Date(`${tanggal}T00:00:00Z`),
          updatedAt: new Date(`${tanggal}T00:00:00Z`),
        },
      });

      await createLog(
        {
          kategori: "Voucher",
          keterangan: `${user.nama} menambahkan voucher ${nama}`,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return {
        message: "Voucher berhasil dibuat",
        data: voucher,
      };
    });
  } catch (error) {
    console.error("Error createVoucher:", error);

    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};

export const updateVoucher = async (id, data, user) => {
  try {
    const {
      nama,
      brand,
      stok,
      hargaPokok,
      hargaJual,
      hargaEceran,
      penempatan,
    } = data;

    return await prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.update({
        where: { id },
        data: {
          nama,
          penempatan,
          brand,
          stok: stok !== undefined ? parseInt(stok) : undefined,
          hargaPokok:
            hargaPokok !== undefined ? parseInt(hargaPokok) : undefined,
          hargaJual: hargaJual !== undefined ? parseInt(hargaJual) : undefined,
          hargaEceran: hargaEceran !== undefined ? parseInt(hargaEceran) : null,
        },
      });

      await createLog(
        {
          kategori: "Voucher",
          keterangan: `${user.nama} mengupdate voucher menjadi ${nama}`,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return {
        message: "Voucher berhasil diupdate",
        data: voucher,
      };
    });
  } catch (error) {
    console.error("Error updateVoucher:", error);

    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};

export const deleteVoucher = async (id, user) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      await createLog(
        {
          kategori: "Voucher",
          keterangan: `${user.nama} menghapus voucher ${voucher.nama}`,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return {
        message: "Voucher berhasil dihapus",
      };
    });
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
      const voucher = await tx.voucher.findUnique({
        where: { id },
        select: {
          stok: true,
          nama: true,
          brand: true,
        },
      });

      if (!voucher) {
        throw new Error("Voucher tidak ditemukan");
      }

      if (tipe === "tambah") {
        updatedStok = voucher.stok + qty;
      } else {
        updatedStok = voucher.stok - qty;

        if (updatedStok < 0) {
          throw new Error("Stok tidak boleh minus");
        }
      }

      await tx.voucher.update({
        where: { id },
        data: {
          stok: updatedStok,
        },
      });

      await createLog(
        {
          kategori: "Voucher",
          keterangan: `${user.nama} ${
            tipe === "tambah" ? "menambah" : "mengurangi"
          } stok voucher ${voucher.brand} ${voucher.nama} sebanyak ${qty} pcs`,
          nominal: qty,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );
    });

    return {
      message: `Stok berhasil ${tipe === "tambah" ? "ditambah" : "dikurangi"}`,
      stok: updatedStok,
    };
  } catch (error) {
    console.error("Error updateStokVoucher:", error);

    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};

export const voucherMaster = async (user) => {
  try {
    return await prisma.voucher.findMany({
      where: {
        idToko: user.toko_id,
        isActive: true,
      },
      orderBy: {
        hargaEceran: "asc",
      },
    });
  } catch (error) {
    console.log(error);
    const errorMessage = prismaErrorHandler(error);
    throw new Error(errorMessage);
  }
};
