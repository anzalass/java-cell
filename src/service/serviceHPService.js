// src/services/serviceHP.service.js
import { PrismaClient } from "@prisma/client";
import { prismaErrorHandler } from "../utils/errorHandlerPrisma.js";

const prisma = new PrismaClient();

/**
 * Buat transaksi service HP
 * @param {Object} data - { brandHP, keterangan, status, biayaJasa, sparePart }
 */
export const createServiceHP = async (data) => {
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
        where: { id: idSparepart },
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
    let memberId;

    if (idMember) {
      memberId = await tx.member.findUnique({
        where: {
          id: idMember,
        },
        select: {
          id: true,
        },
      });
    }

    // Hitung total keuntungan (jasa + sparepart)
    const totalKeuntungan = totalKeuntunganSparepart + Number(biayaJasa);

    // Buat transaksi service HP
    const service = await tx.serviceHP.create({
      data: {
        brandHP,
        keterangan,
        tanggal: new Date(),
        noHP,
        penempatan,
        idMember,
        idUser,
        namaPelangan: namaPelanggan ? namaPelanggan : namaRandom,
        status,
        hargaSparePart: totalHargaSparepart || null,
        biayaJasa: Number(biayaJasa),
        keuntungan: totalKeuntungan,
      },
    });

    const today = new Date();
    const tanggal = today.toISOString().split("T")[0];

    // Kurangi stok & buat relasi sparepart
    for (const item of sparepartItems) {
      // Kurangi stok
      await tx.sparePart.update({
        where: { id: item.idSparepart },
        data: { stok: { decrement: item.quantity } },
      });

      // Buat relasi
      await tx.sparepartServiceHP.create({
        data: {
          idServiceHP: service.id,
          idSparepart: item.idSparepart,
          quantity: item.quantity,
          tanggal: new Date(`${tanggal}T00:00:00Z`),
        },
      });
    }

    if (memberId) {
      await tx.member.update({
        where: {
          id: idMember, // pastikan `noTelp` unique!
        },
        data: {
          totalTransaksi: {
            increment: totalKeuntungan, // ✅ Tambahkan nilai ini
          },
        },
      });
    }

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
export const updateServiceHPStatus = async (id, status) => {
  const allowedStatus = ["Pending", "Selesai", "Proses", "Gagal", "Batal"];
  if (!allowedStatus.includes(status)) {
    throw new Error("Status tidak valid");
  }

  // Cek apakah service ada
  const service = await prisma.serviceHP.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!service) {
    throw new Error("Service tidak ditemukan");
  }

  return await prisma.serviceHP.update({
    where: { id },
    data: { status },
  });
};

// ✅ DELETE SERVICE (rollback stok)
export const deleteServiceHP = async (id) => {
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

    // Hapus relasi sparepart
    await tx.sparepartServiceHP.deleteMany({
      where: { idServiceHP: id },
    });

    // Hapus service utama
    await tx.serviceHP.delete({
      where: { id },
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
}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const where = {};

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
      namaPembeli: svc.brandHP, // frontend: namaPembeli = brandHP
      keterangan: svc.keterangan,
      brandHP: svc.brandHP,
      biayaJasa: svc.biayaJasa,
      tanggal: svc.tanggal.toISOString().split("T")[0],
      status: svc.status,
      member: svc.Member,
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
