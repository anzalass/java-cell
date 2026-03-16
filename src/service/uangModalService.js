// src/services/uangModal.service.js
import { PrismaClient } from "@prisma/client";
import { createLog } from "./logService.js";
import { toUTCFromWIBRange } from "../utils/wibMiddleware.js";

const prisma = new PrismaClient();

// ✅ GET ALL with filter & pagination
export const getAllUangModal = async ({
  page = 1,
  pageSize = 10,
  search = "",
  startDate,
  endDate,
  user,
}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const where = {};
  where.idToko = user.toko_id;

  // Filter pencarian
  if (search) {
    where.keterangan = { contains: search, mode: "insensitive" };
  }

  // Filter tanggal
  const range = toUTCFromWIBRange(startDate, endDate);

  if (Object.keys(range).length) {
    where.tanggal = range;
  }

  const [data, total] = await prisma.$transaction([
    prisma.uangModal.findMany({
      where,
      skip,
      take,
      orderBy: { tanggal: "desc" },
    }),
    prisma.uangModal.count({ where }),
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

export const createUangModal = async (data) => {
  try {
    const { keterangan, tanggal, jumlah, idToko, user } = data;

    if (!keterangan || !tanggal || jumlah == null || !idToko) {
      throw new Error("Semua field wajib diisi");
    }

    if (Number(jumlah) <= 0) {
      throw new Error("Jumlah harus lebih dari 0");
    }

    return await prisma.$transaction(async (tx) => {
      const modal = await tx.uangModal.create({
        data: {
          keterangan,
          idToko,
          tanggal: new Date(),
          jumlah: Number(jumlah),
        },
      });

      await createLog(
        {
          kategori: "Uang Keluar",
          keterangan: `${user.nama} menambahkan catatan ${keterangan} uang keluar`,
          nominal: jumlah,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return modal;
    });
  } catch (error) {
    console.error("Error createUangModal:", error);

    throw new Error(
      error.message || "Terjadi kesalahan saat menambahkan uang modal"
    );
  }
};

export const updateUangModal = async (id, data, user) => {
  try {
    const { keterangan, tanggal, jumlah } = data;

    if (!keterangan || !tanggal || jumlah == null) {
      throw new Error("Semua field wajib diisi");
    }

    if (Number(jumlah) <= 0) {
      throw new Error("Jumlah harus lebih dari 0");
    }

    return await prisma.$transaction(async (tx) => {
      const existing = await tx.uangModal.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("Data uang modal tidak ditemukan");
      }

      const updated = await tx.uangModal.update({
        where: { id },
        data: {
          keterangan,
          tanggal: new Date(tanggal),
          jumlah: Number(jumlah),
        },
      });

      await createLog(
        {
          kategori: "Uang Keluar",
          keterangan: `${user.nama} mengupdate catatan ${keterangan} uang keluar`,
          nominal: jumlah,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return updated;
    });
  } catch (error) {
    console.error("Error updateUangModal:", error);

    throw new Error(
      error.message || "Terjadi kesalahan saat mengupdate uang modal"
    );
  }
};

export const deleteUangModal = async (id, user) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.uangModal.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("Data uang modal tidak ditemukan");
      }

      await createLog(
        {
          kategori: "Uang Keluar",
          keterangan: `${user.nama} menghapus catatan ${existing.keterangan} uang keluar`,
          nominal: existing.jumlah,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      await tx.uangModal.delete({
        where: { id },
      });

      return { success: true };
    });
  } catch (error) {
    console.error("Error deleteUangModal:", error);

    throw new Error(
      error.message || "Terjadi kesalahan saat menghapus uang modal"
    );
  }
};
