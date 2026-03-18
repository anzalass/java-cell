// src/services/serviceHP.service.js
import { PrismaClient } from "@prisma/client";
import { prismaErrorHandler } from "../utils/errorHandlerPrisma.js";
import { createLog } from "./logService.js";
import { toUTCFromWIBRange } from "../utils/wibMiddleware.js";

const prisma = new PrismaClient();

/**
 * Buat transaksi service HP
 * @param {Object} data - { brandHP, keterangan, status, biayaJasa, sparePart }
 */
export const createServiceHP = async (data, user) => {
  try {
    const {
      brandHP,
      keterangan,
      status,
      biayaJasa,
      sparePart = [],
      idMember,
      noHP,
      namaPelanggan,
    } = data;

    if (!brandHP || !keterangan || !status || biayaJasa == null || !noHP) {
      throw new Error("Field wajib tidak lengkap");
    }

    const generateRandomCode = (length = 8) => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      return Array.from(
        { length },
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join("");
    };

    return await prisma.$transaction(async (tx) => {
      let totalHargaSparepart = 0;
      let totalKeuntunganSparepart = 0;
      const sparepartItems = [];

      for (const item of sparePart) {
        const { id, qty } = item;

        if (!id || !qty || qty <= 0) {
          throw new Error("Item sparepart tidak valid");
        }

        const sparepart = await tx.sparePart.findUnique({
          where: { id },
        });

        if (!sparepart) {
          throw new Error("Sparepart tidak ditemukan");
        }

        if (sparepart.stok < qty) {
          throw new Error(`Stok ${sparepart.nama} tidak cukup`);
        }

        const hargaTotal = sparepart.hargaJual * qty;
        const keuntungan = (sparepart.hargaJual - sparepart.hargaModal) * qty;

        totalHargaSparepart += hargaTotal;
        totalKeuntunganSparepart += keuntungan;

        sparepartItems.push({
          idSparepart: sparepart.id,
          quantity: qty,
        });
      }

      const totalKeuntungan = totalKeuntunganSparepart + Number(biayaJasa);

      const service = await tx.serviceHP.create({
        data: {
          brandHP,
          keterangan,
          status,
          tanggal: new Date(),
          noHP,
          Toko: {
            connect: { id: user.toko_id },
          },
          namaPelangan: namaPelanggan || generateRandomCode(),
          biayaJasa: Number(biayaJasa),
          hargaSparePart: totalHargaSparepart,
          keuntungan: totalKeuntungan,

          ...(idMember && {
            Member: {
              connect: { id: idMember },
            },
          }),

          Sparepart: {
            create: sparepartItems.map((item) => ({
              Sparepart: {
                connect: { id: item.idSparepart },
              },
              quantity: item.quantity,
              Toko: {
                connect: { id: user.toko_id },
              },
            })),
          },
        },
      });

      for (const item of sparepartItems) {
        await tx.sparePart.update({
          where: { id: item.idSparepart },
          data: {
            stok: { decrement: item.quantity },
          },
        });
      }

      await createLog(
        {
          kategori: "Service HP",
          keterangan: `${user.nama} menambah service HP`,
          nominal: service.keuntungan,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return service;
    });
  } catch (error) {
    console.error("Error createServiceHP:", error);
    throw new Error("Gagal membuat service HP");
  }
};
export const updateServiceHPStatus = async (id, status, user) => {
  try {
    const allowedStatus = ["Pending", "Selesai", "Proses", "Gagal", "Batal"];

    if (!allowedStatus.includes(status)) {
      throw new Error("Status tidak valid");
    }

    return await prisma.$transaction(async (tx) => {
      const service = await tx.serviceHP.findUnique({
        where: { id },
      });

      if (!service) {
        throw new Error("Service tidak ditemukan");
      }

      const updated = await tx.serviceHP.update({
        where: { id },
        data: { status },
      });

      await createLog(
        {
          kategori: "Service HP",
          keterangan: `${user.nama} mengubah status service ${service.keterangan} menjadi ${status}`,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return updated;
    });
  } catch (error) {
    console.error("Error updateServiceHPStatus:", error);
    throw new Error("Gagal update status service");
  }
};
export const deleteServiceHP = async (id, user) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const service = await tx.serviceHP.findUnique({
        where: { id },
        include: {
          Sparepart: true,
        },
      });

      if (!service) {
        throw new Error("Service tidak ditemukan");
      }

      for (const item of service.Sparepart) {
        await tx.sparePart.update({
          where: { id: item.idSparepart },
          data: {
            stok: { increment: item.quantity },
          },
        });
      }

      const now = new Date();

      await tx.sparepartServiceHP.updateMany({
        where: { idServiceHP: id },
        data: { deletedAt: now },
      });

      await tx.serviceHP.update({
        where: { id },
        data: { deletedAt: now },
      });

      await createLog(
        {
          kategori: "Service HP",
          keterangan: `${user.nama} menghapus service ${service.keterangan}`,
          nominal: service.keuntungan,
          nama: user.nama,
          idToko: user.toko_id,
        },
        tx
      );

      return { success: true };
    });
  } catch (error) {
    console.error("Error deleteServiceHP:", error);
    throw new Error("Gagal menghapus service HP");
  }
};
// ✅ GET ALL dengan filter & pagination
export const getAllServiceHP = async ({
  page = 1,
  pageSize = 10,
  search = "",
  status,
  startDate,
  endDate,
  idToko,
  deletedFilter = "active", // ✅ tambahan
}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const where = {};
  where.idToko = idToko;
  if (deletedFilter === "active") {
    where.deletedAt = null;
  } else if (deletedFilter === "deleted") {
    where.deletedAt = { not: null };
  }
  // Filter pencarian (namaPembeli = brandHP di model)
  if (search) {
    where.OR = [
      { brandHP: { contains: search, mode: "insensitive" } },
      { namaPelangan: { contains: search, mode: "insensitive" } },
      { keterangan: { contains: search, mode: "insensitive" } },
    ];
  }
  // Filter status
  if (status && status !== "all") {
    where.status = status;
  }

  if (startDate || endDate) {
    const range = toUTCFromWIBRange(startDate, endDate);

    where.tanggal = {
      ...(range.gte && { gte: range.gte }),
      ...(range.lte && { lte: range.lte }),
    };
  }

  const [data, total] = await prisma.$transaction([
    prisma.serviceHP.findMany({
      where,
      // skip,
      // take,
      orderBy: { tanggal: "desc" },
      include: {
        Sparepart: {
          include: {
            Sparepart: {
              select: { nama: true, hargaModal: true, hargaJual: true },
            },
          },
        },
        Member: {
          select: {
            nama: true,
            noTelp: true,
          },
        },
      },
    }),
    prisma.serviceHP.count({ where }),
  ]);

  // Format data ke frontend
  const formatted = data.map((svc) => {
    const totalKeuntunganSparepart = svc.Sparepart.reduce((sum, item) => {
      const modal = item.Sparepart.hargaModal || 0;
      const jual = item.Sparepart.hargaJual || 0;
      return sum + item.quantity * (jual - modal);
    }, 0);

    const totalKeuntungan = totalKeuntunganSparepart + svc.biayaJasa;

    return {
      id: svc.id,
      namaPembeli: svc.namaPelangan, // frontend: namaPembeli = brandHP
      keterangan: svc.keterangan,
      brandHP: svc.brandHP,
      biayaJasa: svc.biayaJasa,
      tanggal: svc.createdAt,
      status: svc.status,
      member: svc.Member,
      noHP: svc.noHP,
      keuntungan: totalKeuntungan,
      detail: {
        itemTransaksi: svc.Sparepart.map((item) => ({
          id: item.id,
          namaProduk: item.Sparepart.nama,
          qty: item.quantity,
          hargaPokok: item.Sparepart.hargaModal || 0,
          hargaJual: item.Sparepart.hargaJual || 0,
        })),
      },
    };
  });

  return {
    data: formatted,
    meta: {
      page: Number(page),
      pageSize: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

export const getDetailServiceHP = async (id, user) => {
  const transaksi = await prisma.serviceHP.findUnique({
    where: { id },
    include: {
      Member: true,
      Sparepart: {
        include: {
          Sparepart: true, // ambil detail nama & harga sparepart
        },
      },
    },
  });

  if (!transaksi) {
    throw new Error("Service tidak ditemukan");
  }

  const toko = await prisma.toko.findUnique({
    where: {
      id: user.toko_id,
    },
  });

  return {
    namaToko: toko.namaToko,
    logoToko: toko.logoToko,
    alamat: toko.alamat,
    noTelp: toko.noTelp,
    transaksi,
  };

  return data;
};
