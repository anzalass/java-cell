// src/services/transaksiAksesoris.service.js
import { PrismaClient } from "@prisma/client";
import { prismaErrorHandler } from "../utils/errorHandlerPrisma.js";

const prisma = new PrismaClient();

// CREATE
export const createTransaksiAksesoris = async ({
  items,
  nama,
  keuntungan,
  status = "selesai",
  idMember,
  penempatan,
  idUser,
}) => {
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
      const { idAksesoris, quantity } = item;

      if (!idAksesoris || !quantity || quantity <= 0) {
        throw new Error("Item tidak valid: idAksesoris dan quantity wajib");
      }

      const aksesoris = await tx.aksesoris.findUnique({
        where: { id: idAksesoris },
        select: { id: true, nama: true, stok: true, hargaJual: true },
      });

      if (!aksesoris) {
        throw new Error(`Aksesoris dengan ID ${idAksesoris} tidak ditemukan`);
      }
      if (aksesoris.stok < quantity) {
        throw new Error(`Stok ${aksesoris.nama} tidak mencukupi`);
      }

      totalHarga += aksesoris.hargaJual * quantity;
      itemsToCreate.push({ idAksesoris, quantity });
    }

    const today = new Date();
    const tanggal = today.toISOString().split("T")[0];
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

    const transaksi = await tx.transaksiAksesoris.create({
      data: {
        totalHarga,
        namaPembeli: nama ? nama : namaRandom,
        keuntungan: keuntungan,
        idMember: idMember,
        penempatan,
        idUser,
        tanggal: new Date(`${tanggal}T00:00:00Z`),
        status,
      },
    });

    for (const item of itemsToCreate) {
      await tx.aksesoris.update({
        where: { id: item.idAksesoris },
        data: { stok: { decrement: item.quantity } },
      });

      await tx.itemsTransaksiAksesoris.create({
        data: {
          idTransaksi: transaksi.id,
          idAksesoris: item.idAksesoris,
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
export const getAllTransaksiAksesoris = async ({
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
    prisma.transaksiAksesoris.findMany({
      where,
      // skip,
      // take,
      orderBy: { tanggal: "desc" },
      include: {
        items: {
          include: {
            Aksesoris: {
              select: { nama: true, hargaModal: true, hargaJual: true },
            },
          },
        },
      },
    }),
    prisma.transaksiAksesoris.count({ where }),
  ]);

  // Format data untuk frontend
  const formatted = data.map((trx) => {
    const totalKeuntungan = trx.items.reduce((sum, item) => {
      const modal = item.Aksesoris.hargaModal || 0;
      const jual = item.Aksesoris.hargaJual || 0;
      return sum + item.quantity * (jual - modal);
    }, 0);

    return {
      id: trx.id,
      namaPembeli: trx.namaPembeli,
      totalHarga: trx.totalHarga,
      keuntungan: trx.keuntungan || totalKeuntungan,
      tanggal: trx.tanggal.toISOString().split("T")[0],
      status: trx.status,
      detail: {
        itemTransaksi: trx.items.map((item) => ({
          id: item.id,
          namaProduk: item.Aksesoris.nama,
          qty: item.quantity,
          hargaJual: item.Aksesoris.hargaJual || 0,
          hargaModal: item.Aksesoris.hargaModal || 0,
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
export const deleteTransaksiAksesoris = async (idTransaksi) => {
  return await prisma.$transaction(async (tx) => {
    // Cari transaksi
    const transaksi = await tx.transaksiAksesoris.findUnique({
      where: { id: idTransaksi },
      include: { items: true },
    });

    if (!transaksi) {
      throw new Error("Transaksi tidak ditemukan");
    }

    // Kembalikan stok untuk setiap item
    for (const item of transaksi.items) {
      await tx.aksesoris.update({
        where: { id: item.idAksesoris },
        data: { stok: { increment: item.quantity } },
      });
    }

    // Hapus items terlebih dahulu
    await tx.itemsTransaksiAksesoris.deleteMany({
      where: { idTransaksi },
    });

    // Hapus transaksi utama
    await tx.transaksiAksesoris.delete({
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
  sortQty = "none", // "asc", "desc", "none"
}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  // Tentukan rentang tanggal
  const { start, end } = getDateRange(filterPeriod, startDate, endDate);

  // Ambil SEMUA data yang sesuai filter (tanpa pagination dulu)
  const whereItems = {
    tanggal: {
      gte: start,
      lte: end,
    },
    ...(searchNama && {
      Aksesoris: {
        nama: { contains: searchNama, mode: "insensitive" },
      },
    }),
  };

  const allItems = await prisma.itemsTransaksiAksesoris.findMany({
    where: whereItems,
    orderBy: { tanggal: "desc" },
    include: {
      Aksesoris: {
        select: {
          nama: true,
          brand: true,
          hargaModal: true,
          hargaJual: true,
        },
      },
      TransaksiAksesoris: {
        select: { tanggal: true },
      },
    },
  });

  // ✅ GROUP BY nama barang & hitung total qty
  const groupedItems = allItems.reduce((acc, item) => {
    const key = item.Aksesoris.nama; // group by nama

    if (!acc[key]) {
      acc[key] = {
        id: key,
        namaBarang: item.Aksesoris.nama,
        merk: item.Aksesoris.brand,
        hargaModal: item.Aksesoris.hargaModal,
        hargaJual: item.Aksesoris.hargaJual,
        qty: 0,
        tanggalTerakhir: item.tanggal || item.TransaksiAksesoris?.tanggal,
      };
    }

    acc[key].qty += item.quantity;
    acc[key].hargaModal = item.quantity * item.Aksesoris.hargaModal;
    acc[key].hargaJual = item.quantity * item.Aksesoris.hargaJual;

    // Update tanggal terakhir jika lebih baru
    const itemDate = item.tanggal || item.TransaksiAksesoris?.tanggal;
    if (itemDate > acc[key].tanggalTerakhir) {
      acc[key].tanggalTerakhir = itemDate;
    }

    return acc;
  }, {});

  // Konversi ke array dan urutkan berdasarkan tanggal terakhir
  let resultArray = Object.values(groupedItems).sort(
    (a, b) => new Date(b.tanggalTerakhir) - new Date(a.tanggalTerakhir)
  );

  resultArray = Object.values(groupedItems);

  // ✅ SORT BERDASARKAN QUANTITY
  if (sortQty === "desc") {
    // Terbanyak dulu
    resultArray.sort((a, b) => b.qty - a.qty);
  } else if (sortQty === "asc") {
    // Terdikit dulu
    resultArray.sort((a, b) => a.qty - b.qty);
  } else {
    // Default: urutkan berdasarkan tanggal terakhir
    resultArray.sort(
      (a, b) => new Date(b.tanggalTerakhir) - new Date(a.tanggalTerakhir)
    );
  }

  // Total items setelah grouping
  const totalCount = resultArray.length;

  // Terapkan pagination
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
