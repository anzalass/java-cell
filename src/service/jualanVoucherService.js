import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createJualan = async (idVoucher) => {
  try {
    // Validasi stok
    const voucher = await prisma.voucher.findUnique({
      where: { id: idVoucher },
    });

    if (!voucher) {
      throw new Error("Voucher tidak ditemukan");
    }

    if (voucher.stok <= 0) {
      throw new Error("Stok habis");
    }

    const keuntungan = voucher.hargaEceran - voucher.hargaPokok;

    await prisma.transaksiVoucherHarian.create({
      data: {
        idVoucher: voucher.id,
        keuntungan: keuntungan,
      },
    });

    await prisma.voucher.update({
      where: { id: idVoucher },
      data: { stok: { decrement: 1 } }, // ✅ decrement, bukan increment!
    });
  } catch (error) {
    console.error("Error createJualan:", error);
    throw error; // ✅ lempar error agar bisa ditangkap di frontend
  }
};

export const deleteTransaksiVoucher = async (idTransaksi) => {
  try {
    const transaksi = await prisma.transaksiVoucherHarian.findUnique({
      where: { id: idTransaksi },
      include: { voucher: true }, // Ambil data voucher terkait
    });

    if (!transaksi) {
      throw new Error("Transaksi tidak ditemukan");
    }

    const voucher = transaksi.idVoucher;
    if (!voucher) {
      throw new Error("Voucher terkait tidak ditemukan");
    }

    await prisma.$transaction([
      prisma.transaksiVoucherHarian.delete({
        where: { id: idTransaksi },
      }),
      // Kembalikan stok (+1)
      prisma.voucher.update({
        where: { id: voucher.id },
        data: { stok: { increment: 1 } }, // ✅ Kembalikan stok!
      }),
    ]);

    return {
      success: true,
      message: "Transaksi berhasil dihapus dan stok dikembalikan",
      restoredStok: voucher.stok + 1,
    };
  } catch (error) {
    console.error("Error deleteTransaksiVoucher:", error);
    throw new Error(error.message || "Gagal menghapus transaksi");
  }
};

export const getJualanVoucherHarian = async () => {
  try {
    // Dapatkan tanggal hari ini (tanpa jam)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    // Ambil semua transaksi hari ini + data voucher
    const transaksiHarian = await prisma.transaksiVoucherHarian.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        Voucher: {
          select: {
            id: true,
            nama: true,
            brand: true,
            hargaEceran: true,
            hargaPokok: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Hitung statistik
    let totalOmset = 0;
    let totalKeuntungan = 0;

    transaksiHarian.forEach((trx) => {
      totalOmset += trx.Voucher.hargaEceran;
      totalKeuntungan += trx.keuntungan; // asumsi field keuntungan sudah dihitung saat create
    });

    return {
      transaksi: transaksiHarian.map((trx) => ({
        id: trx.id,
        tanggal: trx.createdAt,
        voucher: {
          id: trx.Voucher.id,
          nama: trx.Voucher.nama,
          brand: trx.Voucher.brand,
        },
        hargaJual: trx.Voucher.hargaEceran,
        keuntungan: trx.keuntungan,
      })),
      statistik: {
        totalTransaksi: transaksiHarian.length,
        totalOmset,
        totalKeuntungan,
      },
    };
  } catch (error) {
    console.error("Error getJualanVoucherHarian:", error);
    throw new Error("Gagal mengambil data transaksi hari ini");
  }
};

// Helper: dapatkan rentang tanggal berdasarkan periode

export const getAllTransaksiVoucher = async ({
  page = 1,
  pageSize = 10,
  periode = "semua", // "harian", "mingguan", "bulanan", "custom", "semua"
  startDate,
  endDate,
  search, // untuk nama voucher
  brand,
}) => {
  try {
    // Validasi pagination
    const take = Math.max(1, Math.min(Number(pageSize), 100)); // max 100 per halaman
    const skip = (Math.max(1, Number(page)) - 1) * take;

    // Dapatkan rentang tanggal
    const { start: dateStart, end: dateEnd } = getDateRange(
      periode,
      startDate,
      endDate
    );

    // Bangun kondisi where untuk transaksi
    const where = {
      createdAt: {
        gte: dateStart,
        lte: dateEnd,
      },
      ...(search && {
        Voucher: {
          nama: { contains: search, mode: "insensitive" },
        },
      }),
      ...(brand && {
        Voucher: {
          brand: { contains: brand, mode: "insensitive" },
        },
      }),
    };

    // Ambil data transaksi
    const [transaksi, total] = await Promise.all([
      prisma.transaksiVoucherHarian.findMany({
        where,
        include: {
          Voucher: {
            select: {
              id: true,
              nama: true,
              brand: true,
              hargaEceran: true,
              hargaPokok: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.transaksiVoucherHarian.count({ where }),
    ]);

    return {
      data: transaksi.map((trx) => ({
        id: trx.id,
        tanggal: trx.createdAt,
        voucher: {
          id: trx.Voucher.id,
          nama: trx.Voucher.nama,
          brand: trx.Voucher.brand,
        },
        hargaJual: trx.Voucher.hargaEceran,
        keuntungan: trx.keuntungan,
      })),
      meta: {
        page: Number(page),
        pageSize: take,
        totalItems: total,
        totalPages: Math.ceil(total / take),
      },
    };
  } catch (error) {
    console.error("Error getAllTransaksiVoucher:", error);
    throw new Error("Gagal mengambil data transaksi");
  }
};

// Helper: dapatkan rentang tanggal berdasarkan periode
const getDateRange = (periode, startDate = null, endDate = null) => {
  const now = new Date();

  if (periode === "custom" && startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  let start, end;
  switch (periode) {
    case "hari":
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
    case "minggu":
      start = new Date(now);
      start.setDate(
        now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)
      );
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
    case "bulan":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    default: // "semua"
      start = new Date("1970-01-01");
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
  }
  return { start, end };
};

export const getLaporanVoucherTerlaris = async ({
  periode = "semua", // "hari", "minggu", "bulan", "custom", "semua"
  startDate,
  endDate,
  search, // nama voucher
  brand,
}) => {
  try {
    // Dapatkan rentang tanggal
    const { start: dateStart, end: dateEnd } = getDateRange(
      periode,
      startDate,
      endDate
    );

    // Bangun kondisi where untuk transaksi
    const whereTransaksi = {
      createdAt: {
        gte: dateStart,
        lte: dateEnd,
      },
    };

    // Bangun kondisi where untuk voucher (relasi)
    const whereVoucher = {};
    if (search) {
      whereVoucher.nama = { contains: search, mode: "insensitive" };
    }
    if (brand) {
      whereVoucher.brand = { contains: brand, mode: "insensitive" };
    }

    // Aggregate: hitung jumlah terjual per voucher
    const hasil = await prisma.transaksiVoucherHarian.groupBy({
      by: ["idVoucher"],
      where: whereTransaksi,
      _count: { id: true }, // jumlah transaksi = jumlah terjual
      _sum: { keuntungan: true },
      orderBy: { _count: { id: "desc" } }, // urutkan dari terbanyak
      include: {
        voucher: {
          where: whereVoucher,
          select: {
            id: true,
            nama: true,
            brand: true,
            hargaJual: true,
            hargaPokok: true,
            hargaEceran: true,
          },
        },
      },
    });

    // Filter hasil yang voucher-nya null (karena whereVoucher di include)
    const filtered = hasil
      .filter((item) => item.voucher !== null)
      .map((item) => ({
        voucher: {
          id: item.voucher.id,
          nama: item.voucher.nama,
          brand: item.voucher.brand,
          hargaJual: item.voucher.hargaJual,
          hargaPokok: item.voucher.hargaPokok,
          hargaEceran: item.voucher.hargaEceran,
        },
        jumlahTerjual: item._count.id,
        totalKeuntungan: item._sum.keuntungan || 0,
        totalPendapatan: item._count.id * (item.voucher.hargaJual || 0),
      }));

    // Hitung total keseluruhan
    const totalTerjual = filtered.reduce(
      (sum, item) => sum + item.jumlahTerjual,
      0
    );
    const totalPendapatan = filtered.reduce(
      (sum, item) => sum + item.totalPendapatan,
      0
    );
    const totalKeuntungan = filtered.reduce(
      (sum, item) => sum + item.totalKeuntungan,
      0
    );

    return {
      data: filtered,
      statistik: {
        totalTerjual,
        totalPendapatan,
        totalKeuntungan,
      },
      filter: {
        periode,
        startDate: dateStart.toISOString().split("T")[0],
        endDate: dateEnd.toISOString().split("T")[0],
        search,
        brand,
      },
    };
  } catch (error) {
    console.error("Error getLaporanVoucherTerlaris:", error);
    throw new Error("Gagal mengambil laporan voucher terlaris");
  }
};
