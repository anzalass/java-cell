import { PrismaClient } from "@prisma/client";
import { prismaErrorHandler } from "../utils/errorHandlerPrisma.js";
const prisma = new PrismaClient();

// src/services/grosir.service.js
export const createGrosirOrder = async ({
  kodeDownline,
  items,
  tanggal,
  keuntungan,
  idUser,
  penempatan,
  status,
}) => {
  // Validasi input
  if (!kodeDownline) throw new Error("Kode downline wajib diisi");
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error("Pesanan tidak boleh kosong");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Cek apakah downline valid
    const downline = await tx.downline.findUnique({
      where: { kodeDownline },
    });
    if (!downline) {
      throw new Error(`Downline dengan kode ${kodeDownline} tidak ditemukan`);
    }

    let totalHarga = 0;
    const itemsToCreate = [];

    // 2. Validasi setiap item & hitung total
    for (const item of items) {
      const { idVoucher, quantity } = item;

      if (!idVoucher || !quantity || quantity <= 0) {
        throw new Error(
          "Item pesanan tidak valid: idVoucher dan quantity wajib"
        );
      }

      // Ambil data voucher
      const voucher = await tx.voucher.findUnique({
        where: { id: idVoucher },
        select: {
          id: true,
          nama: true,
          brand: true,
          stok: true,
          hargaJual: true,
          hargaPokok: true,
        },
      });

      if (!voucher) {
        throw new Error(`Voucher dengan ID ${idVoucher} tidak ditemukan`);
      }

      if (voucher.stok < quantity) {
        throw new Error(
          `Stok ${voucher.brand} ${voucher.nama} tidak mencukupi. Tersedia: ${voucher.stok}`
        );
      }

      if (voucher.hargaJual == null) {
        throw new Error(`Harga jual voucher ${voucher.nama} belum diatur`);
      }

      const subtotal = voucher.hargaJual * quantity;
      totalHarga += subtotal;

      itemsToCreate.push({
        idVoucher: voucher.id,
        quantity,
      });
    }

    // 3. Buat transaksi utama
    const transaksi = await tx.transaksiVoucherDownline.create({
      data: {
        kodeDownline,
        totalHarga,
        penempatan: penempatan ? penempatan : "Java 1",
        idUser,
        keuntungan: keuntungan,
        tanggal: new Date(`${tanggal}T00:00:00Z`), // sesuai model: `tanggal DateTime`
        status: status ? status : "Selesai", // atau "pending", "dibayar", dll
      },
    });

    // 4. Buat item transaksi + kurangi stok
    for (const item of itemsToCreate) {
      const { idVoucher, quantity } = item;

      // Kurangi stok
      await tx.voucher.update({
        where: { id: idVoucher },
        data: { stok: { decrement: quantity } },
      });

      // Buat item transaksi
      await tx.itemsTransaksiVoucherDownline.create({
        data: {
          idTransaksi: transaksi.id,
          idVoucher,
          quantity,
          tanggal: new Date(`${tanggal}T00:00:00Z`), // sesuai model: `tanggal DateTime`
        },
      });
    }

    return {
      id: transaksi.id,
      kodeDownline,
      totalHarga,
      items: itemsToCreate.length,
      tanggal: transaksi.tanggal,
    };
  });
};

export const deletePendingTransaksi = async (idTransaksi) => {
  if (!idTransaksi) {
    throw new Error("ID transaksi wajib diisi");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Cari transaksi
    const transaksi = await tx.transaksiVoucherDownline.findUnique({
      where: { id: idTransaksi },
      include: {
        items: {
          include: {
            Voucher: {
              select: { id: true, stok: true },
            },
          },
        },
      },
    });

    if (!transaksi) {
      throw new Error("Transaksi tidak ditemukan");
    }

    console.log("trxc", transaksi.status);

    // 2. Pastikan status masih "pending"
    if (transaksi.status !== "Proses" && transaksi.status !== "Pending") {
      throw new Error(
        "Hanya transaksi dengan status 'Pending' atau 'Proses' yang bisa dihapus"
      );
    }

    // 3. Kembalikan stok untuk setiap item
    for (const item of transaksi.items) {
      await tx.voucher.update({
        where: { id: item.Voucher.id },
        data: { stok: { increment: item.quantity } },
      });
    }

    // 4. Hapus semua item transaksi
    await tx.itemsTransaksiVoucherDownline.deleteMany({
      where: { idTransaksi: transaksi.id },
    });

    // 5. Hapus transaksi utama
    await tx.transaksiVoucherDownline.delete({
      where: { id: transaksi.id },
    });

    return {
      success: true,
      message: "Transaksi berhasil dihapus dan stok dikembalikan",
    };
  });
};

// src/services/transaksiGrosir.service.js

// GET ALL with filter & pagination
export const getAllTransaksiGrosir = async ({
  page = 1,
  pageSize = 10,
  search = "", // kodeDownline
  startDate,
  endDate,
}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const where = {};

  // Filter kodeDownline
  if (search) {
    where.kodeDownline = { contains: search, mode: "insensitive" };
  }

  // Filter tanggal
  if (startDate || endDate) {
    where.tanggal = {};
    if (startDate) where.tanggal.gte = new Date(startDate);
    if (endDate) where.tanggal.lte = new Date(endDate);
  }

  const [data, total] = await prisma.$transaction([
    prisma.transaksiVoucherDownline.findMany({
      where,
      // skip,
      // take,
      orderBy: { tanggal: "desc" },
      include: {
        items: {
          include: {
            Voucher: {
              select: {
                nama: true,
                brand: true,
                hargaPokok: true,
                hargaJual: true,
              },
            },
          },
        },
        downline: {
          select: { nama: true, kodeDownline: true },
        },
      },
    }),
    prisma.transaksiVoucherDownline.count({ where }),
  ]);

  // Format ke frontend
  const formatted = data.map((trx) => {
    const totalKeuntungan = trx.items.reduce((sum, item) => {
      const pokok = item.Voucher.hargaPokok || 0;
      const jual = item.Voucher.hargaJual || 0;
      return sum + item.quantity * (jual - pokok);
    }, 0);

    return {
      id: trx.id,
      kodeDownline: trx.kodeDownline,
      downline: trx.downline,
      totalHarga: trx.totalHarga,
      tanggal: trx.tanggal.toISOString().split("T")[0], // "YYYY-MM-DD"
      status: trx.status,
      keuntungan: trx.keuntungan,
      detail: {
        itemTransaksi: trx.items.map((item) => ({
          id: item.id,
          namaProduk: `${item.Voucher.brand} ${item.Voucher.nama}`,
          qty: item.quantity,
          hargaJual: item.Voucher.hargaJual || 0,
          totalHarga: Number(item.quantity * item.Voucher.hargaJual),
          hargaPokok: item.Voucher.hargaPokok || 0,
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

// UPDATE STATUS
export const updateTransaksiStatus = async (id, status) => {
  const allowedStatus = ["Pending", "Proses", "Selesai", "Gagal"];
  if (!allowedStatus.includes(status)) {
    throw new Error("Status tidak valid");
  }

  console.log("stts", status);

  return await prisma.transaksiVoucherDownline.update({
    where: { id },
    data: { status },
  });
};

// DELETE (hanya jika status = "Pending")

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
  brand = "", // ✅ TAMBAH BRAND
  sortQty = "none",
}) => {
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  // Tentukan rentang tanggal
  const { start, end } = getDateRange(filterPeriod, startDate, endDate);

  // =========================
  // WHERE CONDITION
  // =========================
  const whereItems = {
    tanggal: {
      gte: start,
      lte: end,
    },
    Voucher: {
      ...(searchNama && {
        nama: { contains: searchNama, mode: "insensitive" },
      }),
      ...(brand && {
        brand: brand, // ✅ FILTER BRAND
      }),
    },
  };

  // =========================
  // FETCH DATA
  // =========================
  const allItems = await prisma.itemsTransaksiVoucherDownline.findMany({
    where: whereItems,
    orderBy: { tanggal: "desc" },
    include: {
      Voucher: {
        select: {
          nama: true,
          brand: true,
          hargaPokok: true,
          hargaJual: true,
        },
      },
      transaksi: {
        select: { tanggal: true },
      },
    },
  });

  // =========================
  // GROUP BY NAMA BARANG
  // =========================
  const groupedItems = allItems.reduce((acc, item) => {
    const key = item.Voucher.nama;

    if (!acc[key]) {
      acc[key] = {
        id: key,
        namaBarang: item.Voucher.nama,
        merk: item.Voucher.brand,
        hargaModal: 0,
        hargaJual: 0,
        qty: 0,
        tanggalTerakhir: item.tanggal || item.transaksi?.tanggal,
      };
    }

    acc[key].qty += item.quantity;
    acc[key].hargaModal += item.quantity * item.Voucher.hargaPokok;
    acc[key].hargaJual += item.quantity * item.Voucher.hargaJual;

    const itemDate = item.tanggal || item.transaksi?.tanggal;
    if (itemDate > acc[key].tanggalTerakhir) {
      acc[key].tanggalTerakhir = itemDate;
    }

    return acc;
  }, {});

  let resultArray = Object.values(groupedItems);

  // =========================
  // SORTING
  // =========================
  if (sortQty === "desc") {
    resultArray.sort((a, b) => b.qty - a.qty);
  } else if (sortQty === "asc") {
    resultArray.sort((a, b) => a.qty - b.qty);
  } else {
    resultArray.sort(
      (a, b) => new Date(b.tanggalTerakhir) - new Date(a.tanggalTerakhir)
    );
  }

  // =========================
  // PAGINATION
  // =========================
  const totalCount = resultArray.length;
  const paginatedData = resultArray.slice(skip, skip + take);

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

export const getDetailTransaksiVoucherDownline = async (id) => {
  const transaksi = await prisma.transaksiVoucherDownline.findUnique({
    where: { id },
    include: {
      downline: true,
      User: true,
      items: {
        include: {
          Voucher: true,
        },
      },
    },
  });

  if (!transaksi) {
    throw new Error("Transaksi tidak ditemukan");
  }

  return transaksi;
};
