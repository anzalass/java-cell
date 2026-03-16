// src/services/log.service.js
import { PrismaClient } from "@prisma/client";
import { toUTCFromWIBRange } from "../utils/wibMiddleware.js";

const prisma = new PrismaClient();

/* =========================
   CREATE LOG
========================= */
export const createLog = async (
  { keterangan, nama, nominal, kategori, idToko },
  tx
) => {
  try {
    if (!keterangan || !nama || !kategori || !idToko) {
      throw new Error(
        "Field keterangan, nama, kategori, dan idToko wajib diisi"
      );
    }

    const db = tx ?? prisma;

    return await db.log.create({
      data: {
        keterangan,
        nama,
        kategori,
        idToko,
        nominal: nominal ? Number(nominal) : null,
      },
    });
  } catch (error) {
    console.error("Error createLog:", error);
    throw new Error(error.message || "Gagal membuat log");
  }
};
/* =========================
   GET ALL LOGS
========================= */
export const getAllLogs = async ({
  page = 1,
  pageSize = 10,
  search = "",
  kategori,
  nama,
  startDate,
  endDate,
  minNominal,
  maxNominal,
  idToko,
}) => {
  try {
    if (!idToko) {
      throw new Error("idToko wajib diisi");
    }

    const take = Math.max(1, Math.min(Number(pageSize), 100));
    const skip = (Math.max(1, Number(page)) - 1) * take;

    const where = {
      idToko,
    };

    /* =========================
       SEARCH GLOBAL
    ========================== */
    if (search) {
      where.OR = [
        { keterangan: { contains: search, mode: "insensitive" } },
        { nama: { contains: search, mode: "insensitive" } },
      ];
    }

    /* =========================
       FILTER KATEGORI
    ========================== */
    if (kategori) {
      where.kategori = {
        contains: kategori,
        mode: "insensitive",
      };
    }

    /* =========================
       FILTER NAMA
    ========================== */
    if (nama) {
      where.nama = {
        contains: nama,
        mode: "insensitive",
      };
    }

    /* =========================
       FILTER TANGGAL
    ========================== */
    // FILTER TANGGAL (WIB → UTC)
    if (startDate || endDate) {
      const range = toUTCFromWIBRange(startDate, endDate);

      where.createdAt = {};

      if (range.gte) where.createdAt.gte = range.gte;
      if (range.lte) where.createdAt.lte = range.lte;
    }

    /* =========================
       FILTER NOMINAL
    ========================== */
    if (minNominal != null || maxNominal != null) {
      where.nominal = {};
      if (minNominal != null) where.nominal.gte = Number(minNominal);
      if (maxNominal != null) where.nominal.lte = Number(maxNominal);
    }

    const [data, total] = await prisma.$transaction([
      prisma.log.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.log.count({ where }),
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
    console.error("Error getAllLogs:", error);
    throw new Error("Gagal mengambil data log");
  }
};
