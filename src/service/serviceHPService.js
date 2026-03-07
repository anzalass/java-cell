// src/services/serviceHP.service.js
import { PrismaClient } from "@prisma/client";
import { prismaErrorHandler } from "../utils/errorHandlerPrisma.js";
import { createLog } from "./logService.js";

const prisma = new PrismaClient();

/**
 * Buat transaksi service HP
 * @param {Object} data - { brandHP, keterangan, status, biayaJasa, sparePart }
 */
export const createServiceHP = async (data, user) => {
  const {
    brandHP,
    keterangan,
    status,
    biayaJasa,
    sparePart,
    idMember,
    idUser,
    noHP,
    penempatan,
    namaPelanggan,
    idToko,
  } = data;

  // Validasi wajib
  if (!brandHP || !keterangan || !status || biayaJasa == null || !noHP) {
    throw new Error("Field wajib tidak lengkap");
  }

  const generateRandomCode = (length = 8) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const namaRandom = generateRandomCode();

  return await prisma.$transaction(async (tx) => {
    // Hitung total harga sparepart & keuntungan
    let totalHargaSparepart = 0;
    let totalKeuntunganSparepart = 0;
    const sparepartItems = [];

    for (const item of sparePart) {
      const { id: idSparepart, qty: quantity } = item;

      if (!idSparepart || !quantity || quantity <= 0) {
        throw new Error("Item sparepart tidak valid");
      }

      // Ambil data sparepart
      const sparepart = await tx.sparePart.findUnique({
        where: { id: idSparepart, idToko: idToko },
        select: {
          id: true,
          nama: true,

          stok: true,
          hargaModal: true,
          hargaJual: true,
        },
      });

      if (!sparepart) {
        throw new Error(`Sparepart dengan ID ${idSparepart} tidak ditemukan`);
      }

      if (sparepart.stok < quantity) {
        throw new Error(`Stok ${sparepart.nama} tidak mencukupi`);
      }

      const hargaTotal = sparepart.hargaJual * quantity;
      const keuntungan =
        (sparepart.hargaJual - sparepart.hargaModal) * quantity;

      totalHargaSparepart += hargaTotal;
      totalKeuntunganSparepart += keuntungan;

      sparepartItems.push({
        idSparepart: sparepart.id,
        quantity,
      });
    }

    // Hitung total keuntungan (jasa + sparepart)
    const totalKeuntungan = totalKeuntunganSparepart + Number(biayaJasa);

    const today = new Date();
    const tanggal = today.toISOString().split("T")[0];

    const service = await tx.serviceHP.create({
      data: {
        brandHP,
        keterangan,
        tanggal: new Date(),
        noHP,
        Toko: {
          connect: { id: user.toko_id },
        },
        namaPelangan: namaPelanggan ? namaPelanggan : namaRandom,
        status,
        hargaSparePart: totalHargaSparepart || null,
        biayaJasa: Number(biayaJasa),
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
            tanggal: new Date(`${tanggal}T00:00:00Z`),
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
    await createLog({
      kategori: "Service HP",
      keterangan: `${user.nama} telah menambah Service HP`,
      nominal: service.keuntungan,
      nama: user.nama,
      idToko: user.toko_id,
    });

    return {
      id: service.id,
      brandHP: service.brandHP,
      keterangan: service.keterangan,
      status: service.status,
      biayaJasa: service.biayaJasa,
      keuntungan: service.keuntungan,
      hargaSparePart: service.hargaSparePart,
    };
  });
};

// ✅ UPDATE STATUS
export const updateServiceHPStatus = async (id, status, user) => {
  const allowedStatus = ["Pending", "Selesai", "Proses", "Gagal", "Batal"];
  if (!allowedStatus.includes(status)) {
    throw new Error("Status tidak valid");
  }

  // Cek apakah service ada
  const service = await prisma.serviceHP.findUnique({
    where: { id },
    select: {
      id: true,
      keterangan: true,
    },
  });
  if (!service) {
    throw new Error("Service tidak ditemukan");
  }

  await prisma.serviceHP.update({
    where: { id },
    data: { status },
  });

  await createLog({
    kategori: "Service HP",
    keterangan: `${user.nama} telah mengupdate status Service HP ${service.keterangan}`,
    nama: user.nama,
    idToko: user.toko_id,
  });
};

// ✅ DELETE SERVICE (rollback stok)
export const deleteServiceHP = async (id, user) => {
  return await prisma.$transaction(async (tx) => {
    // Cari service beserta sparepart-nya
    const service = await tx.serviceHP.findUnique({
      where: { id },
      include: {
        Sparepart: {
          include: {
            Sparepart: {
              select: { id: true, nama: true, stok: true },
            },
          },
        },
      },
    });

    if (!service) {
      throw new Error("Service tidak ditemukan");
    }

    // Kembalikan stok untuk setiap sparepart
    for (const item of service.Sparepart) {
      await tx.sparePart.update({
        where: { id: item.Sparepart.id },
        data: { stok: { increment: item.quantity } },
      });
    }
    const now = new Date();
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    // Hapus relasi sparepart
    await tx.sparepartServiceHP.updateMany({
      where: { idServiceHP: id },
      data: {
        deletedAt: wib,
      },
    });

    // Hapus service utama
    await tx.serviceHP.update({
      where: { id },
      data: {
        deletedAt: wib,
      },
    });

    await createLog({
      kategori: "Service HP",
      keterangan: `${user.nama} telah menghapus Service HP ${service.keterangan}`,
      nominal: service.keuntungan,
      nama: user.nama,
      idToko: user.toko_id,
    });

    return { success: true };
  });
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
    where.brandHP = { contains: search, mode: "insensitive" };
  }

  // Filter status
  if (status && status !== "all") {
    where.status = status;
  }

  // Filter tanggal
  if (startDate || endDate) {
    where.tanggal = {};
    if (startDate) where.tanggal.gte = new Date(startDate);
    if (endDate) where.tanggal.lte = new Date(endDate);
  }

  const [data, total] = await prisma.$transaction([
    prisma.serviceHP.findMany({
      where,
      skip,
      take,
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

export const getDetailServiceHP = async (id) => {
  const data = await prisma.serviceHP.findUnique({
    where: { id },
    include: {
      Member: true,
      User: true,
      Sparepart: {
        include: {
          Sparepart: true, // ambil detail nama & harga sparepart
        },
      },
    },
  });

  if (!data) {
    throw new Error("Service tidak ditemukan");
  }

  return data;
};
