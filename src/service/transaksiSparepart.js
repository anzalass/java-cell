// src/services/transaksiAksesoris.service.js
import { PrismaClient } from "@prisma/client";
import { prismaErrorHandler } from "../utils/errorHandlerPrisma.js";

const prisma = new PrismaClient();

// CREATE
export const createTransaksiSparepart = async ({
  items,
  nama,
  keuntungan,
  status = "selesai",
  penempatan,
  idUser,
  idMember,
}) => {
  console.log(items);

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error("Item transaksi tidak boleh kosong");
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
    let totalHarga = 0;
    const itemsToCreate = [];

    for (const item of items) {
      const { idSparepart, quantity } = item;

      if (!idSparepart || !quantity || quantity <= 0) {
        throw new Error("Item tidak valid: idSparepart dan quantity wajib");
      }

      const sparePart = await tx.sparePart.findUnique({
        where: { id: idSparepart },
        select: { id: true, nama: true, stok: true, hargaJual: true },
      });

      if (!sparePart) {
        throw new Error(`sparePart dengan ID ${idSparepart} tidak ditemukan`);
      }
      if (sparePart.stok < quantity) {
        throw new Error(`Stok ${sparePart.nama} tidak mencukupi`);
      }

      totalHarga += sparePart.hargaJual * quantity;
      itemsToCreate.push({ idSparepart, quantity });
    }

    const today = new Date();
    const tanggal = today.toISOString().split("T")[0];

    const transaksi = await tx.transaksiSparepat.create({
      data: {
        totalHarga,
        namaPembeli: nama ? nama : namaRandom,
        penempatan,
        idUser,
        idMember,
        keuntungan: keuntungan,
        tanggal: new Date(`${tanggal}T00:00:00Z`),
      },
    });

    let memberId = null;

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

    for (const item of itemsToCreate) {
      await tx.sparePart.update({
        where: { id: item.idSparepart },
        data: { stok: { decrement: item.quantity } },
      });

      await tx.itemsTransaksiSparepart.create({
        data: {
          idTransaksi: transaksi.id,
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
            increment: keuntungan, // ✅ Tambahkan nilai ini
          },
        },
      });
    }

    return { id: transaksi.id, totalHarga };
  });
};

// ✅ GET ALL dengan filter & pagination
export const getAllTransaksiSparepart = async ({
  page = 1,
  pageSize = 10,
  search = "",
  startDate,
  endDate,
  status,
}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const where = {};

  // Filter pencarian (namaPembeli)
  if (search) {
    where.namaPembeli = { contains: search, mode: "insensitive" };
  }

  // Filter tanggal
  if (startDate || endDate) {
    where.tanggal = {};
    if (startDate) where.tanggal.gte = new Date(startDate);
    if (endDate) where.tanggal.lte = new Date(endDate);
  }

  // Filter status
  if (status) {
    where.status = status;
  }

  const [data, total] = await prisma.$transaction([
    prisma.transaksiSparepat.findMany({
      where,
      // skip,
      // take,
      orderBy: { tanggal: "desc" },
      include: {
        items: {
          include: {
            Sparepart: {
              select: { nama: true, hargaModal: true, hargaJual: true },
            },
          },
        },
      },
    }),
    prisma.transaksiSparepat.count({ where }),
  ]);

  // Format data untuk frontend
  const formatted = data.map((trx) => {
    const totalKeuntungan = trx.items.reduce((sum, item) => {
      const modal = item.Sparepart.hargaModal || 0;
      const jual = item.Sparepart.hargaJual || 0;
      return sum + item.quantity * (jual - modal);
    }, 0);

    return {
      id: trx.id,
      namaPembeli: trx.namaPembeli,
      totalHarga: trx.totalHarga,
      keuntungan: trx.keuntungan || totalKeuntungan,
      tanggal: trx.tanggal.toISOString().split("T")[0],
      detail: {
        itemTransaksi: trx.items.map((item) => ({
          id: item.id,
          namaProduk: item.Sparepart.nama,
          qty: item.quantity,
          hargaJual: item.Sparepart.hargaJual || 0,
          hargaModal: item.Sparepart.hargaModal || 0,
        })),
      },
    };
  });

  return {
    formatted,
    meta: {
      page: Number(page),
      pageSize: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

// ✅ DELETE (rollback stok)
export const deleteTransaksiSparepart = async (idTransaksi) => {
  return await prisma.$transaction(async (tx) => {
    // Cari transaksi
    const transaksi = await tx.transaksiSparepat.findUnique({
      where: { id: idTransaksi },
      include: { items: true },
    });

    if (!transaksi) {
      throw new Error("Transaksi tidak ditemukan");
    }

    // Kembalikan stok untuk setiap item
    for (const item of transaksi.items) {
      await tx.sparePart.update({
        where: { id: item.idSparepart },
        data: { stok: { increment: item.quantity } },
      });
    }

    // Hapus items terlebih dahulu
    await tx.itemsTransaksiSparepart.deleteMany({
      where: { idTransaksi },
    });

    // Hapus transaksi utama
    await tx.transaksiSparepat.delete({
      where: { id: idTransaksi },
    });

    return { success: true };
  });
};

const getDateRange = (period, startDate, endDate) => {
  const now = new Date();

  if (period === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "week") {
    const start = new Date(now);
    const day = now.getDay() || 7;
    start.setDate(now.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "custom" && startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  return { start: new Date("1970-01-01"), end: now };
};

export const getLaporanBarangKeluar = async ({
  page = 1,
  pageSize = 10,
  filterPeriod = "all",
  startDate,
  endDate,
  searchNama = "",
  sortQty = "none",
}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const { start, end } = getDateRange(filterPeriod, startDate, endDate);

  // ✅ 1. Ambil data dari ItemsTransaksiSparepart
  const whereSparepart = {
    tanggal: { gte: start, lte: end },
    ...(searchNama && {
      Sparepart: { nama: { contains: searchNama, mode: "insensitive" } },
    }),
  };

  const itemsSparepart = await prisma.itemsTransaksiSparepart.findMany({
    where: whereSparepart,
    include: {
      Sparepart: {
        select: { nama: true, brand: true, hargaModal: true, hargaJual: true },
      },
    },
  });

  // ✅ 2. Ambil data dari SparepartServiceHP
  const whereService = {
    tanggal: { gte: start, lte: end },
    ...(searchNama && {
      Sparepart: { nama: { contains: searchNama, mode: "insensitive" } },
    }),
  };

  const itemsService = await prisma.sparepartServiceHP.findMany({
    where: whereService,
    include: {
      Sparepart: {
        select: { nama: true, brand: true, hargaModal: true, hargaJual: true },
      },
    },
  });

  // ✅ 3. Gabungkan kedua data
  const allItems = [
    ...itemsSparepart.map((item) => ({
      ...item,
      sumber: "transaksi_sparepart",
    })),
    ...itemsService.map((item) => ({
      ...item,
      sumber: "service_hp",
    })),
  ];

  // ✅ 4. GROUP BY nama sparepart
  const groupedItems = allItems.reduce((acc, item) => {
    const key = item.Sparepart.nama;

    if (!acc[key]) {
      acc[key] = {
        id: key,
        namaBarang: item.Sparepart.nama,
        merk: item.Sparepart.brand,
        hargaModal: item.Sparepart.hargaModal,
        hargaJual: item.Sparepart.hargaJual,
        qty: 0,
        sumber: [], // Lacak sumber data
      };
    }

    acc[key].qty += item.quantity;
    acc[key].sumber.push(item.sumber);

    return acc;
  }, {});

  // ✅ 5. Sort berdasarkan qty atau tanggal
  let resultArray = Object.values(groupedItems);

  if (sortQty === "desc") {
    resultArray.sort((a, b) => b.qty - a.qty);
  } else if (sortQty === "asc") {
    resultArray.sort((a, b) => a.qty - b.qty);
  } else {
    // Default: urutkan berdasarkan nama
    resultArray.sort((a, b) => a.namaBarang.localeCompare(b.namaBarang));
  }

  // ✅ 6. Pagination
  const totalCount = resultArray.length;
  const paginatedData = resultArray;

  return {
    paginatedData,
    meta: {
      page: Number(page),
      pageSize: take,
      total: totalCount,
      totalPages: Math.ceil(totalCount / take),
    },
  };
};
